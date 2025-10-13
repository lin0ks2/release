/*
******************************************************************************
  Module: app.mistakes.js (revised fallback + sensible validation)
  Key points:
    - Gate uses existing window.addToMistakesOnFailure if present (do not override UI logic).
    - Fallback addOnFailure only when original is absent.
    - M.add requires a real source deck (exists), but not membership check at add time.
    - M.deck / M.count filter by actual membership to avoid "active but empty".
    - Session gate marks as added only after confirmed presence in bucket.
******************************************************************************
*/

(function(){
  'use strict';
  if (!window.App) window.App = {};
  var App = window.App;

  var LS_KEY = 'mistakes.v4';

  // ------------------------------
  // Helpers
  // ------------------------------
  function clamp(v, lo, hi){ v = +v || 0; return Math.max(lo, Math.min(hi, v)); }
  function uiLang(){
    try { return (App.settings && (App.settings.uiLang || App.settings.lang || App.settings.ui)) || 'ru'; }
    catch(_){ return 'ru'; }
  }
  function activeDictLang(){
    try { return (App.settings && (App.settings.dictsLangFilter || App.settings.studyLang || App.settings.dictLang)) || 'en'; }
    catch(_){ return 'en'; }
  }
  function langOfKey(sourceKey){
    try { var m = String(sourceKey||'').match(/^([a-z]{2})_/i); return m ? m[1].toLowerCase() : null; }
    catch(_){ return null; }
  }
  function isVirtualKey(key){
    key = String(key||'').toLowerCase();
    return key === 'mistakes' || key === 'fav' || key === 'favorites';
  }
  function load(){
    try { var raw = localStorage.getItem(LS_KEY); return raw ? (JSON.parse(raw)||{}) : {}; }
    catch(_){ return {}; }
  }
  function save(db){ try { localStorage.setItem(LS_KEY, JSON.stringify(db)); }catch(_){ } }
  function ensure(obj, k){ if (!obj[k]) obj[k] = {}; return obj[k]; }
  function ensureBucket(db, ul, dl){
    var u = ensure(db, ul);
    var b = ensure(u, dl);
    if (!b.items)   b.items   = {};
    if (!b.stars)   b.stars   = {};
    if (!b.sources) b.sources = {};
    return b;
  }
  function starsBucket(db){
    var b = ensureBucket(db, uiLang(), activeDictLang());
    return b.stars || (b.stars = {});
  }
  function deckByKey(sk){
    try{
      if (App.Decks && typeof App.Decks.resolveDeckByKey === 'function')
        return App.Decks.resolveDeckByKey(sk);
    }catch(_){}
    return null;
  }
  function deckHasId(deck, id){
    if (!deck || !Array.isArray(deck.words)) return false;
    id = String(id);
    for (var i=0;i<deck.words.length;i++){
      if (String(deck.words[i].id) === id) return true;
    }
    return false;
  }

  // ------------------------------
  // Public API
  // ------------------------------
  if (!App.Mistakes) App.Mistakes = {};
  var M = App.Mistakes;

  M.sourceKeyFor = function(id){
    if (id == null) return null;
    id = String(id);
    var db = load();
    var b = ensureBucket(db, uiLang(), activeDictLang());
    return b.sources ? (b.sources[id] || null) : null;
  };

  M.getStars = function(sourceKey, id){
    id = String(id);
    var db = load();
    var sb = starsBucket(db);
    var sk = String(sourceKey||'');
    var bucket = sb[sk] || (sb[sk] = {});
    return +bucket[id] || 0;
  };

  M.setStars = function(sourceKey, id, val){
    id = String(id);
    var db = load();
    var sb = starsBucket(db);
    var sk = String(sourceKey||'');
    var bucket = sb[sk] || (sb[sk] = {});
    var max = 5;
    try { if (App.Trainer && typeof App.Trainer.starsMax === 'function') max = +App.Trainer.starsMax() || 5; }catch(_){}
    bucket[id] = clamp(val, 0, max);
    save(db);
  };

  // Add: require real deck, but no strict membership check here
  M.add = function(id, word, sourceKey){
    if (id == null) return;
    id = String(id);

    var sk = sourceKey || null;
    try {
      if (!sk && word && (word._mistakeSourceKey || word._favoriteSourceKey))
        sk = word._mistakeSourceKey || word._favoriteSourceKey;
      if (!sk){
        var ak = (App.dictRegistry && App.dictRegistry.activeKey) || null;
        if (ak && !isVirtualKey(ak)) sk = ak;
      }
    } catch(_){}
    if (!sk || isVirtualKey(sk)) return;

    // Never add favorites
    try{
      if (App && typeof App.isFavorite === 'function' && App.isFavorite(sk, id)) return;
      if (App && App.Favorites && typeof App.Favorites.has === 'function' && App.Favorites.has(id)) return;
    }catch(_){}

    // Language isolation
    try{
      var dl = activeDictLang();
      var kLang = langOfKey(sk);
      if (kLang && kLang !== dl) return;
    }catch(_){}

    // Require deck to exist (prevents broken keys), membership will be validated on listing/counting
    var deck = deckByKey(sk);
    if (!deck) return;

    var db = load();
    var b = ensureBucket(db, uiLang(), activeDictLang());

    if ((b.sources && b.sources[id]) || ((b.items[sk]||{})[id])) return;

    if (!b.items[sk]) b.items[sk] = {};
    b.items[sk][id] = true;
    b.sources[id] = sk;
    save(db);
  };

  M.remove = function(id){
    id = String(id);
    var db = load();
    var b = ensureBucket(db, uiLang(), activeDictLang());
    var sk = b.sources ? b.sources[id] : null;
    if (sk && b.items && b.items[sk]){
      delete b.items[sk][id];
      if (Object.keys(b.items[sk]).length === 0) delete b.items[sk];
    }
    if (b.stars && b.stars[sk]){
      delete b.stars[sk][id];
      if (Object.keys(b.stars[sk]).length === 0) delete b.stars[sk];
    }
    if (b.sources) delete b.sources[id];
    save(db);
  };

  M.deck = function(){
    var db = load();
    var b = ensureBucket(db, uiLang(), activeDictLang());
    var out = [];
    try{
      Object.keys(b.items||{}).forEach(function(sk){
        var idsMap = b.items[sk] || {};
        var deck = deckByKey(sk);
        if (!deck || !Array.isArray(deck.words)) return;
        for (var i=0;i<deck.words.length;i++){
          var w = deck.words[i];
          var id = String(w.id);
          if (idsMap[id]){
            var c = Object.assign({}, w);
            c._mistakeSourceKey = sk;
            out.push(c);
          }
        }
      });
    }catch(_){}
    return out;
  };

  // Count only ids that exist in their deck (prevents "active but empty")
  M.count = function(){
    var db = load();
    var b = ensureBucket(db, uiLang(), activeDictLang());
    var sum = 0;
    try{
      Object.keys(b.items||{}).forEach(function(sk){
        var deck = deckByKey(sk);
        if (!deck || !Array.isArray(deck.words)) return;
        var idsMap = b.items[sk] || {};
        Object.keys(idsMap).forEach(function(id){
          if (deckHasId(deck, id)) sum += 1;
        });
      });
    }catch(_){}
    return sum;
  };

  M.clearActive = function(){
    var db = load();
    var ul = uiLang(), dl = activeDictLang();
    if (!db[ul]) db[ul] = {};
    db[ul][dl] = { items:{}, stars:{}, sources:{} };
    save(db);
  };

  M.stats = function(){
    var db = load();
    var b = ensureBucket(db, uiLang(), activeDictLang());
    var c = 0;
    try{
      Object.keys(b.items||{}).forEach(function(sk){
        var deck = deckByKey(sk);
        if (!deck || !Array.isArray(deck.words)) return;
        var idsMap = b.items[sk] || {};
        Object.keys(idsMap).forEach(function(id){
          if (deckHasId(deck, id)) c += 1;
        });
      });
    }catch(_){}
    return { count: c };
  };

  // ------------------------------
  // Gate (do not override original UI hook)
  // ------------------------------
  (function(){
    var fail = Object.create(null);
    var addedThisSession = Object.create(null);

    function inc(map, id){ id=String(id); map[id]=(map[id]|0)+1; return map[id]; }

    function isFav(w){
      try{
        if (!w || w.id == null) return false;
        var sk = (w._mistakeSourceKey || (App.dictRegistry && App.dictRegistry.activeKey) || null);
        if (App && typeof App.isFavorite === 'function' && sk) return !!App.isFavorite(sk, w.id);
        if (App && App.Favorites && typeof App.Favorites.has === 'function') return !!App.Favorites.has(w.id);
      }catch(_){}
      return false;
    }

    // Prefer the original UI function if present
    var origAddOnFailure = (typeof window.addToMistakesOnFailure === 'function')
      ? window.addToMistakesOnFailure
      : null;

    // Fallback implementation (only if UI one is absent)
    function fallbackAddOnFailure(word){
      try {
        var sk = null;
        if (word && word._mistakeSourceKey) sk = word._mistakeSourceKey;
        if (!sk){
          var ak = (App.dictRegistry && App.dictRegistry.activeKey) || null;
          if (ak && !isVirtualKey(ak)) sk = ak;
        }
        App.Mistakes.add(String(word.id), word, sk);
      } catch(_){}
    }

    function callAdd(word){
      if (origAddOnFailure) return origAddOnFailure(word);
      return fallbackAddOnFailure(word);
    }

    function onFail(w){
      if (!w || w.id == null) return;
      var wid = String(w.id);

      if (isFav(w)) return;
      if (addedThisSession[wid]) return;

      var f = inc(fail, wid);
      if (f >= 1){
        try{
          var before = (App.Mistakes && typeof App.Mistakes.sourceKeyFor==='function') ? App.Mistakes.sourceKeyFor(wid) : null;
          callAdd(w);
          var after  = (App.Mistakes && typeof App.Mistakes.sourceKeyFor==='function') ? App.Mistakes.sourceKeyFor(wid) : null;
          if (!before && after){
            addedThisSession[wid] = true;
          }
        }catch(_){}
      }
    }

    window.MistakesGate = { onFail: onFail };

    document.addEventListener('lexitron:answer-wrong', function(e){
      try { onFail(e && e.detail && e.detail.word); } catch(_){}
    });
  })();

})();