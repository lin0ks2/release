
/*
*************************************************************************
 Version: 1.7 • Updated: 2025-10-13 • File: app.mistakes.js 
*************************************************************************
*/
(function(){
  const App = window.App || (window.App = {});
  const M = App.Mistakes || (App.Mistakes = {});

  const LS = 'mistakes.v4';
  const toInt = (x, d)=>{ x = Number(x); return Number.isFinite(x) ? x : (d||0); };

  // ---------------- helpers ----------------
  function load(){ try{ return JSON.parse(localStorage.getItem(LS)||'{}'); }catch(e){ return {}; } }
  function save(s){ try{ localStorage.setItem(LS, JSON.stringify(s)); }catch(e){} }

  function uiLang(){
    try{
      if (App.settings && (App.settings.uiLang || App.settings.lang === 'uk')) {
        return App.settings.uiLang || (App.settings.lang === 'uk' ? 'uk' : 'ru');
      }
    }catch(_){}
    return 'ru';
  }
  function langOfKey(k){ try{ const m = String(k||'').match(/^([a-z]{2})_/i); return m?m[1].toLowerCase():null; }catch(e){ return null; } }
  function activeDictLang(){
    try{
      if (App.settings && App.settings.dictsLangFilter) return App.settings.dictsLangFilter;
      const key = (App.dictRegistry && App.dictRegistry.activeKey) || null;
      return langOfKey(key) || 'de';
    }catch(_){}
    return 'de';
  }
  function isVirtualKey(k){
    k = String(k||'').toLowerCase();
    return (k === 'mistakes' || k === 'fav' || k === 'favorites');
  }
  function ensureBucket(db, ul, dl){
    if (!db[ul]) db[ul] = {};
    if (!db[ul][dl]) db[ul][dl] = { items:{}, stars:{}, sources:{} };
    return db[ul][dl];
  }

  // robust deck resolution: returns array of words (possibly empty)
  function deckWordsByKey(sk){
    try{
      if (App.Decks && typeof App.Decks.resolveDeckByKey === 'function'){
        const deck = App.Decks.resolveDeckByKey(sk);
        if (!deck) return [];
        // deck could be an array of words or an object with .words
        if (Array.isArray(deck)) return deck;
        if (Array.isArray(deck.words)) return deck.words;
      }
    }catch(_){}
    return [];
  }

  // ---------------- public API ----------------

  // Public: add
  M.add = function(id, word, sourceKey){
    if (!id) return;
    id = String(id);

    // Resolve sourceKey reliably
    let sk = sourceKey || null;
    try{
      if (!sk && word && (word._mistakeSourceKey || word._favoriteSourceKey)) sk = word._mistakeSourceKey || word._favoriteSourceKey;
      if (!sk){
        const ak = (App.dictRegistry && App.dictRegistry.activeKey) || null;
        if (ak && !isVirtualKey(ak)) sk = ak; // never take virtual keys
      }
    }catch(_){}
    if (!sk) return;

    // Never add favorites (support both signatures + fallback store)
    try{
      if (App && typeof App.isFavorite === 'function'){
        // try 2-arg form
        try{ if (App.isFavorite(sk, id)) return; }catch(_){}
        // try 1-arg form
        try{ if (App.isFavorite(id)) return; }catch(_){}
      }
      if (App && App.Favorites && typeof App.Favorites.has === 'function'){
        if (App.Favorites.has(id)) return;
      }
    }catch(_){}

    // Language isolation: sourceKey language must match active dict lang (if prefixed)
    try{
      const dl = activeDictLang();
      const kLang = langOfKey(sk);
      if (kLang && kLang !== dl) return;
    }catch(_){}

    // Require deck to exist (avoid broken keys)
    const words = deckWordsByKey(sk);
    if (!words.length) return;

    // Write
    const ul = uiLang(), dl2 = langOfKey(sk) || activeDictLang();
    const db = load(), b = ensureBucket(db, ul, dl2);
    if (!b.items[sk]) b.items[sk] = {};
    // do not duplicate across sessions
    if ((b.sources||{})[id] || (b.items[sk]||{})[id]) return;
    b.items[sk][id] = true;
    b.sources[id] = sk;
    save(db);
  };

  // Public: sourceKey
  M.sourceKeyFor = function(id){
    const db = load(); const ul = uiLang(), dl = activeDictLang();
    const b = ensureBucket(db, ul, dl);
    return (b.sources||{})[String(id)] || null;
  };
  M.sourceKeyInActive = M.sourceKeyFor;

  // Progress (independent from App.state.stars)
  function starsBucket(db){
    const b = ensureBucket(db, uiLang(), activeDictLang());
    return b.stars || (b.stars = {});
  }
  M.getStars = function(sourceKey, id){
    const db = load(); const sb = starsBucket(db);
    const sk = String(sourceKey||''); const wid = String(id||'');
    return toInt((sb[sk]||{})[wid], 0);
  };
  M.setStars = function(sourceKey, id, val){
    const db = load(); const sb = starsBucket(db);
    const sk = String(sourceKey||''); const wid = String(id||'');
    if (!sb[sk]) sb[sk] = {};
    // clamp to [0, starsMax]
    let max = 5; try{ if (App.Trainer && typeof App.Trainer.starsMax === 'function') max = +App.Trainer.starsMax() || 5; }catch(_){}
    const v = Math.max(0, Math.min(max, Number(val)||0));
    sb[sk][wid] = v;
    save(db);
  };

  // Deck/list/count for ACTIVE scope (uiLang+dictLang)
  M.deck = function(){
    const db = load(); const ul = uiLang(); const dl = activeDictLang();
    const b = ensureBucket(db, ul, dl);
    const out = [];
    Object.keys(b.items||{}).forEach(sk=>{
      const ids = b.items[sk] || {};
      const words = deckWordsByKey(sk);
      if (!words.length) return;
      const map = new Map(words.map(w=>[String(w.id), w]));
      Object.keys(ids).forEach(id=>{
        const w = map.get(String(id));
        if (w){ if (!w._mistakeSourceKey) w._mistakeSourceKey = sk; out.push(w); }
      });
    });
    return out;
  };
  M.list = function(){ return M.deck(); };
  M.count = function(){
    const db = load(); const ul = uiLang(); const dl = activeDictLang();
    const b = ensureBucket(db, ul, dl);
    let n = 0;
    Object.keys(b.items||{}).forEach(sk=>{
      const words = deckWordsByKey(sk);
      if (!words.length) return;
      const have = new Set(words.map(w=>String(w.id)));
      Object.keys(b.items[sk]||{}).forEach(id=>{
        if (have.has(String(id))) n += 1;
      });
    });
    return n;
  };

  // Clear only active scope
  M.clearActive = function(){
    const db = load(); const ul = uiLang(); const dl = activeDictLang();
    db[ul] && (db[ul][dl] = { items:{}, stars:{}, sources:{} }); save(db);
  };

  M.onShow = function(id){}; // reserved

})(); 
/* -------------------------------  К О Н Е Ц  ------------------------------- */

/* ---- Merged Gate (threshold=1, robust favorites, confirmed add) ---- */
(function(){
  'use strict';
  var fail = Object.create(null);
  var addedThisSession = Object.create(null);

  function inc(m,id){ id=String(id); m[id]=(m[id]|0)+1; return m[id]; }

  function isFav(w){
    try{
      if(!w || w.id==null) return false;
      // Prefer 2-arg check with sourceKey if available
      var sk = (w._mistakeSourceKey || (window.App && App.dictRegistry && App.dictRegistry.activeKey) || null);
      if (window.App && typeof App.isFavorite === 'function'){
        try{ if (sk && App.isFavorite(sk, String(w.id))) return true; }catch(_){}
        try{ if (App.isFavorite(String(w.id))) return true; }catch(_){}
      }
      if (window.App && App.Favorites && typeof App.Favorites.has === 'function'){
        try{ if (App.Favorites.has(String(w.id))) return true; }catch(_){}
      }
    }catch(_){}
    return false;
  }

  var orig = null;
  if (typeof window.addToMistakesOnFailure === 'function') orig = window.addToMistakesOnFailure;
  else if (window.App && App.Mistakes && typeof App.Mistakes.addOnFailure === 'function')
    orig = App.Mistakes.addOnFailure.bind(App.Mistakes);
  else {
    // Minimal fallback uses App.Mistakes.add directly, but only if present
    orig = function(w){
      try{
        if (!window.App || !App.Mistakes || typeof App.Mistakes.add !== 'function') return;
        var sk = null;
        if (w && w._mistakeSourceKey) sk = w._mistakeSourceKey;
        if (!sk && window.App && App.dictRegistry) {
          var ak = App.dictRegistry.activeKey || null;
          if (ak && ak !== 'mistakes' && ak !== 'fav' && ak !== 'favorites') sk = ak;
        }
        App.Mistakes.add(String(w.id), w, sk);
      }catch(_){}
    };
  }

  function onFail(w){
    if(!w||w.id==null) return;
    var wid=String(w.id);
    if (isFav(w)) return;
    if (addedThisSession[wid]) return;

    var f = inc(fail,wid);
    if (f>=1 && orig){
      try{
        // confirm-before/after
        var before = (window.App && App.Mistakes && typeof App.Mistakes.sourceKeyFor==='function') ? App.Mistakes.sourceKeyFor(wid) : null;
        orig(w);
        var after  = (window.App && App.Mistakes && typeof App.Mistakes.sourceKeyFor==='function') ? App.Mistakes.sourceKeyFor(wid) : null;
        if (!before && after){
          addedThisSession[wid] = true;
        }
      }catch(_){}
    }
  }

  window.MistakesGate={ onFail:onFail };

  document.addEventListener('lexitron:answer-wrong', function(e){
    onFail(e && e.detail && e.detail.word);
  });
})();    
