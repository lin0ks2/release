/*
******************************************************************************
  Module: app.mistakes.js
  Purpose: "Мои ошибки" virtual dictionary + gate
  Storage: localStorage 'mistakes.v4' with per-(uiLang, dictLang) buckets
  Notes:
    - Adds a word after FIRST real wrong answer in a session (threshold = 1)
    - Ignores "Не знаю" (handled upstream; gate listens only to 'answer-wrong')
    - Never adds favorites
    - No duplicates: neither within the session nor across sessions
    - Strong isolation by UI language and dictionary language
    - Stars inside "МО" are LOCAL and separate from global App.state.stars
******************************************************************************
*/

(function(){
  'use strict';
  if (!window.App) window.App = {};
  var App = window.App;

  var LS_KEY = 'mistakes.v4';

  // ------------------------------
  // Helpers (safe accessors)
  // ------------------------------
  function clamp(v, lo, hi){ v = +v || 0; return Math.max(lo, Math.min(hi, v)); }

  function uiLang(){
    try {
      // prefer explicit UI language if present
      return (App.settings && (App.settings.uiLang || App.settings.lang || App.settings.ui)) || 'ru';
    } catch(_){ return 'ru'; }
  }

  function activeDictLang(){
    try {
      // language of currently active dictionary (study lang)
      return (App.settings && (App.settings.dictsLangFilter || App.settings.studyLang || App.settings.dictLang)) || 'en';
    } catch(_){ return 'en'; }
  }

  // Extract language code from sourceKey like 'en_deckName'
  function langOfKey(sourceKey){
    try {
      var m = String(sourceKey||'').match(/^([a-z]{2})_/i);
      return m ? m[1].toLowerCase() : null;
    } catch(_){ return null; }
  }

  function load(){
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return {};
      var obj = JSON.parse(raw);
      return (obj && typeof obj === 'object') ? obj : {};
    } catch(_){ return {}; }
  }

  function save(db){
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(db));
    } catch(_){}
  }

  function ensure(obj, k){
    if (!obj[k]) obj[k] = {};
    return obj[k];
  }

  function ensureBucket(db, ul, dl){
    var u = ensure(db, ul);
    var b = ensure(u, dl);
    if (!b.items)   b.items   = {}; // items[sourceKey][id] = true
    if (!b.stars)   b.stars   = {}; // stars[sourceKey][id] = number
    if (!b.sources) b.sources = {}; // sources[id] = sourceKey
    return b;
  }

  function starsBucket(db){
    var b = ensureBucket(db, uiLang(), activeDictLang());
    return b.stars || (b.stars = {});
  }

  // Count total IDs in current bucket
  function countBucket(b){
    var sum = 0;
    try {
      Object.keys(b.items||{}).forEach(function(sk){
        sum += Object.keys(b.items[sk]||{}).length;
      });
    } catch(_){}
    return sum;
  }

  // ------------------------------
  // Public API: App.Mistakes
  // ------------------------------
  if (!App.Mistakes) App.Mistakes = {};
  var M = App.Mistakes;

  // Return sourceKey if id is in current bucket; otherwise null
  M.sourceKeyFor = function(id){
    if (id == null) return null;
    id = String(id);
    var db = load();
    var ul = uiLang(), dl = activeDictLang();
    var b = ensureBucket(db, ul, dl);
    return b.sources ? (b.sources[id] || null) : null;
  };

  // Get local Mistakes stars for (sourceKey, id)
  M.getStars = function(sourceKey, id){
    id = String(id);
    var db = load();
    var sb = starsBucket(db);
    var sk = String(sourceKey||'');
    var bucket = sb[sk] || (sb[sk] = {});
    return +bucket[id] || 0;
  };

  // Set local Mistakes stars for (sourceKey, id) with clamping to [0, App.Trainer.starsMax()]
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

  // Add word to Mistakes (id, optional word object, optional explicit sourceKey)
  M.add = function(id, word, sourceKey){
    if (id == null) return;
    id = String(id);

    // Determine sourceKey:
    var sk = sourceKey || null;
    try {
      if (!sk && word && (word._mistakeSourceKey || word._favoriteSourceKey)){
        sk = word._mistakeSourceKey || word._favoriteSourceKey;
      }
      if (!sk) {
        var ak = (App.dictRegistry && App.dictRegistry.activeKey) || null;
        if (ak && ak !== 'mistakes') sk = ak;
      }
    } catch(_){}
    if (!sk) return;

    // Never add favorites
    try{
      if (App && typeof App.isFavorite === 'function' && App.isFavorite(sk, id)) return;
      if (App && App.Favorites && typeof App.Favorites.has === 'function' && App.Favorites.has(id)) return;
    }catch(_){}

    // Language isolation: ensure key language matches active dict language
    try{
      var dl = activeDictLang();
      var kLang = langOfKey(sk);
      if (kLang && kLang !== dl) return;
    }catch(_){}

    // Current bucket
    var db = load();
    var ul = uiLang(), dl2 = activeDictLang();
    var b = ensureBucket(db, ul, dl2);

    // Already stored? (no duplicates across sessions)
    if ((b.sources && b.sources[id]) || ((b.items[sk]||{})[id])) return;

    if (!b.items[sk]) b.items[sk] = {};
    b.items[sk][id] = true;
    b.sources[id] = sk;
    save(db);
  };

  // Remove word from current bucket (not used by UI normally, but safe to expose)
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

  // List (flatten) current Mistakes deck (array of word objects)
  M.deck = function(){
    var db = load();
    var ul = uiLang(), dl = activeDictLang();
    var b = ensureBucket(db, ul, dl);
    var out = [];
    try{
      Object.keys(b.items||{}).forEach(function(sk){
        var idsMap = b.items[sk] || {};
        var deck = null;
        try {
          if (App.Decks && typeof App.Decks.resolveDeckByKey === 'function'){
            deck = App.Decks.resolveDeckByKey(sk);
          }
        } catch(_) {}
        if (!deck || !Array.isArray(deck.words)) return;
        deck.words.forEach(function(w){
          var id = String(w.id);
          if (idsMap[id]){
            var c = Object.assign({}, w);
            c._mistakeSourceKey = sk;
            out.push(c);
          }
        });
      });
    }catch(_){}
    return out;
  };

  // Alias
  M.list = function(){ return M.deck(); };

  // Count items in current bucket
  M.count = function(){
    var db = load();
    var b = ensureBucket(db, uiLang(), activeDictLang());
    return countBucket(b);
  };

  // Clear ONLY current (uiLang, dictLang) bucket
  M.clearActive = function(){
    var db = load();
    var ul = uiLang(), dl = activeDictLang();
    if (!db[ul]) db[ul] = {};
    db[ul][dl] = { items:{}, stars:{}, sources:{} };
    save(db);
  };

  // Optional stats object for UI (safe)
  M.stats = function(){
    var db = load();
    var b = ensureBucket(db, uiLang(), activeDictLang());
    return {
      count: countBucket(b)
    };
  };

  // ------------------------------
  // Gate: add on wrong answer (threshold = 1), with robust "addedThisSession" marking
  // ------------------------------
  (function(){
    var fail = Object.create(null);             // per-session wrong counters per wordId
    var addedThisSession = Object.create(null); // only mark after confirmed addition

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

    // The original UI provides window.addToMistakesOnFailure(word).
    // Keep compatibility and also expose App.Mistakes.addOnFailure for callers that used it.
    function addOnFailure(word){
      try {
        var sk = null;
        if (word && word._mistakeSourceKey) sk = word._mistakeSourceKey;
        if (!sk){
          var ak = (App.dictRegistry && App.dictRegistry.activeKey) || null;
          if (ak && ak !== 'mistakes') sk = ak;
        }
        App.Mistakes.add(String(word.id), word, sk);
      } catch(_){}
    }

    window.addToMistakesOnFailure = addOnFailure;
    App.Mistakes.addOnFailure = addOnFailure;

    function onFail(w){
      if (!w || w.id == null) return;
      var wid = String(w.id);

      // Never from favorites
      if (isFav(w)) return;

      // If we already CONFIRMED adding this session for the word, do nothing
      if (addedThisSession[wid]) return;

      // threshold = 1
      var f = inc(fail, wid);
      if (f >= 1){
        try{
          // Confirmed-add logic: check presence BEFORE and AFTER
          var before = (App.Mistakes && typeof App.Mistakes.sourceKeyFor==='function') ? App.Mistakes.sourceKeyFor(wid) : null;
          addOnFailure(w);
          var after  = (App.Mistakes && typeof App.Mistakes.sourceKeyFor==='function') ? App.Mistakes.sourceKeyFor(wid) : null;
          if (!before && after){
            // Added successfully → suppress repeated attempts for this session
            addedThisSession[wid] = true;
          }
        }catch(_){}
      }
    }

    window.MistakesGate = { onFail: onFail };

    // Listen only to real wrong answers (IDK is ignored upstream and doesn't dispatch this event)
    document.addEventListener('lexitron:answer-wrong', function(e){
      try { onFail(e && e.detail && e.detail.word); } catch(_){}
    });
  })();

})();