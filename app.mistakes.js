/*
*************************************************************************
 Version: 1.8 • Updated: 2025-10-13 • File: app.mistakes.js
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
      if (App.settings){
        return App.settings.uiLang || App.settings.lang || 'ru';
      }
    }catch(_){}
    return 'ru';
  }
  function langOfKey(k){ try{ const m = String(k||'').match(/^([a-z]{2})_/i); return m?m[1].toLowerCase():null; }catch(e){ return null; } }
  function activeDictLang(){
    try{
      if (App.settings){
        return App.settings.dictsLangFilter || App.settings.studyLang || App.settings.dictLang || App.settings.lang || (App.dictRegistry && langOfKey(App.dictRegistry.activeKey)) || 'en';
      }
    }catch(_){}
    try{
      if (App.dictRegistry && App.dictRegistry.activeKey) return langOfKey(App.dictRegistry.activeKey) || 'en';
    }catch(_){}
    return 'en';
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

  // Resolve to deck object and/or words
  function resolveDeck(sk){
    try{
      if (App.Decks && typeof App.Decks.resolveDeckByKey === 'function'){
        return App.Decks.resolveDeckByKey(sk) || null;
      }
    }catch(_){}
    return null;
  }
  function deckWords(deck){
    if (!deck) return [];
    if (Array.isArray(deck)) return deck;
    if (Array.isArray(deck.words)) return deck.words;
    return [];
  }
  function deckWordsByKey(sk){ return deckWords(resolveDeck(sk)); }

  // Extract sourceKey from the word reliably across different decks
  function extractSourceKey(word){
    // preferred explicit fields
    const fields = [
      '_sourceKey','sourceKey','_deckKey','deckKey',
      '_originDeckKey','_originKey','_fromKey','_homeKey',
      '_mistakeSourceKey','_favoriteSourceKey','key','k'
    ];
    for (let i=0;i<fields.length;i++){
      const v = word && word[fields[i]];
      if (v) return String(v);
    }
    // fallback: current active key if not virtual
    try{
      const ak = (App.dictRegistry && App.dictRegistry.activeKey) || null;
      if (ak && !isVirtualKey(ak)) return ak;
    }catch(_){}
    return null;
  }

  // ---------------- public API ----------------

  // Public: add
  M.add = function(id, word, sourceKey){
    if (id == null) return;
    id = String(id);

    // Resolve sourceKey reliably
    let sk = sourceKey || extractSourceKey(word);
    if (!sk || isVirtualKey(sk)) return;

    // Never add favorites (prefer 2-arg check + store-based check)
    try{
      if (App && typeof App.isFavorite === 'function'){
        try{ if (App.isFavorite(sk, id)) return; }catch(_){}
      }
      if (App && App.Favorites && typeof App.Favorites.has === 'function'){
        try{ if (App.Favorites.has(id)) return; }catch(_){}
      }
    }catch(_){}

    // Language isolation: sourceKey language must match active dict lang (if prefixed)
    try{
      const dl = activeDictLang();
      const kLang = langOfKey(sk);
      if (kLang && kLang !== dl) return;
    }catch(_){}

    // Require deck object to exist (do NOT require words at add-time)
    const deck = resolveDeck(sk);
    if (!deck) return;

    // Write
    const ul = uiLang(), dl2 = langOfKey(sk) || activeDictLang();
    const db = load(), b = ensureBucket(db, ul, dl2);
    if (!b.items[sk]) b.items[sk] = {};
    if ((b.sources||{})[id] || (b.items[sk]||{})[id]) return; // avoid duplicates
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
    if (!db[ul]) db[ul] = {};
    db[ul][dl] = { items:{}, stars:{}, sources:{} };
    save(db);
  };

  M.onShow = function(id){}; // reserved

})(); 
/* -------------------------------  К О Н Е Ц  ------------------------------- */

/* ---- Gate (threshold=1, prefer original UI hook, confirmed-add) ---- */
(function(){
  'use strict';
  var fail = Object.create(null);
  var addedThisSession = Object.create(null);

  function inc(m,id){ id=String(id); m[id]=(m[id]|0)+1; return m[id]; }

  function isFav(w){
    try{
      if(!w || w.id==null) return false;
      var sk = (w._mistakeSourceKey || (window.App && App.dictRegistry && App.dictRegistry.activeKey) || null);
      if (window.App && typeof App.isFavorite === 'function'){
        try{ if (sk && App.isFavorite(sk, String(w.id))) return true; }catch(_){}
      }
      if (window.App && App.Favorites && typeof App.Favorites.has === 'function'){
        try{ if (App.Favorites.has(String(w.id))) return true; }catch(_){}
      }
    }catch(_){}
    return false;
  }

  var orig = (typeof window.addToMistakesOnFailure === 'function') ? window.addToMistakesOnFailure : null;
  if (!orig && window.App && App.Mistakes && typeof App.Mistakes.addOnFailure === 'function') {
    orig = App.Mistakes.addOnFailure.bind(App.Mistakes);
  }
  function fallbackAdd(word){
    try{
      if (!window.App || !App.Mistakes || typeof App.Mistakes.add !== 'function') return;
      var sk = (word && (word._sourceKey||word.sourceKey||word._deckKey||word.deckKey||word._originDeckKey||word._originKey||word._fromKey||word._homeKey||word._mistakeSourceKey)) || null;
      if (!sk && window.App && App.dictRegistry){
        var ak = App.dictRegistry.activeKey || null;
        if (ak && ak !== 'mistakes' && ak !== 'fav' && ak !== 'favorites') sk = ak;
      }
      App.Mistakes.add(String(word.id), word, sk);
    }catch(_){}
  }

  function onFail(w){
    if(!w||w.id==null) return;
    var wid=String(w.id);
    if (isFav(w)) return;
    if (addedThisSession[wid]) return;
    var f = inc(fail,wid);
    if (f>=1){
      try{
        var before = (window.App && App.Mistakes && typeof App.Mistakes.sourceKeyFor==='function') ? App.Mistakes.sourceKeyFor(wid) : null;
        if (orig) orig(w); else fallbackAdd(w);
        var after  = (window.App && App.Mistakes && typeof App.Mistakes.sourceKeyFor==='function') ? App.Mistakes.sourceKeyFor(wid) : null;
        if (!before && after){ addedThisSession[wid] = true; }
      }catch(_){}
    }
  }

  window.MistakesGate={ onFail:onFail };
  document.addEventListener('lexitron:answer-wrong', function(e){
    onFail(e && e.detail && e.detail.word);
  });
})();