/*
*************************************************************************
 Version: 1.9 • Updated: 2025-10-13 • File: app.mistakes.js
 Goal: Make "Мои ошибки" independent from UI language (like Favorites).
       - Content persists/visible when UI language changes.
       - Aggregates legacy UI-scoped data and writes to a neutral bucket.
*************************************************************************
*/
(function(){
  const App = window.App || (window.App = {});
  const M = App.Mistakes || (App.Mistakes = {});

  const LS = 'mistakes.v4';
  const UI_ALL = '__all__'; // neutral UI bucket (new write target)
  const toInt = (x, d)=>{ x = Number(x); return Number.isFinite(x) ? x : (d||0); };

  // ---------------- helpers ----------------
  function load(){ try{ return JSON.parse(localStorage.getItem(LS)||'{}'); }catch(e){ return {}; } }
  function save(s){ try{ localStorage.setItem(LS, JSON.stringify(s)); }catch(e){} }

  function currentUi(){
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
  function ensure(obj, k){ if (!obj[k]) obj[k] = {}; return obj[k]; }

  // ---- Legacy structure: db[ui][dictLang] ... ----
  // We now *read* across all UI buckets for a given dictLang (aggregation),
  // and *write* only to UI_ALL to stay independent of UI language.
  function ensureBucket(db, uiKey, dictLang){
    const u = ensure(db, uiKey);
    const b = ensure(u, dictLang);
    if (!b.items)   b.items   = {};
    if (!b.stars)   b.stars   = {};
    if (!b.sources) b.sources = {};
    return b;
  }

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

  // Aggregate across *all* UI buckets for the given dict language.
  function aggregateForLang(dictLang){
    const db = load();
    const out = { items:{}, stars:{}, sources:{} };
    try{
      Object.keys(db||{}).forEach(uiKey=>{
        const b = (db[uiKey] && db[uiKey][dictLang]) ? db[uiKey][dictLang] : null;
        if (!b) return;
        // items
        Object.keys(b.items||{}).forEach(sk=>{
          out.items[sk] = out.items[sk] || {};
          Object.keys(b.items[sk]||{}).forEach(id=>{ out.items[sk][id] = true; });
        });
        // stars
        Object.keys(b.stars||{}).forEach(sk=>{
          out.stars[sk] = out.stars[sk] || {};
          Object.keys(b.stars[sk]||{}).forEach(id=>{ out.stars[sk][id] = b.stars[sk][id]; });
        });
        // sources
        Object.keys(b.sources||{}).forEach(id=>{
          if (!out.sources[id]) out.sources[id] = b.sources[id];
        });
      });
    }catch(_){}
    return out;
  }

  // Optional migration: collapse current UI bucket into UI_ALL for active dict lang
  function migrateCurrentToAll(){
    try{
      const dictLang = activeDictLang();
      const db = load();
      const curUI = currentUi();
      const b = (db[curUI] && db[curUI][dictLang]) ? db[curUI][dictLang] : null;
      if (!b) return;
      const tgt = ensureBucket(db, UI_ALL, dictLang);
      // merge items
      Object.keys(b.items||{}).forEach(sk=>{
        tgt.items[sk] = tgt.items[sk] || {};
        Object.keys(b.items[sk]||{}).forEach(id=>{ tgt.items[sk][id] = true; });
      });
      // merge stars
      Object.keys(b.stars||{}).forEach(sk=>{
        tgt.stars[sk] = tgt.stars[sk] || {};
        Object.keys(b.stars[sk]||{}).forEach(id=>{ tgt.stars[sk][id] = b.stars[sk][id]; });
      });
      // merge sources
      Object.keys(b.sources||{}).forEach(id=>{ if (!tgt.sources[id]) tgt.sources[id] = b.sources[id]; });
      // clear legacy UI bucket for this dict lang (optional, keep to reduce duplication)
      // db[curUI][dictLang] = { items:{}, stars:{}, sources:{} };
      save(db);
    }catch(_){}
  }

  // Extract sourceKey from the word reliably across different decks
  function extractSourceKey(word){
    const fields = [
      '_sourceKey','sourceKey','_deckKey','deckKey',
      '_originDeckKey','_originKey','_fromKey','_homeKey',
      '_mistakeSourceKey','_favoriteSourceKey','key','k'
    ];
    for (let i=0;i<fields.length;i++){
      const v = word && word[fields[i]];
      if (v) return String(v);
    }
    try{
      const ak = (App.dictRegistry && App.dictRegistry.activeKey) || null;
      if (ak && !isVirtualKey(ak)) return ak;
    }catch(_){}
    return null;
  }

  // ---------------- public API ----------------

  // Public: add (writes to UI_ALL bucket)
  M.add = function(id, word, sourceKey){
    if (id == null) return;
    id = String(id);

    let sk = sourceKey || extractSourceKey(word);
    if (!sk || isVirtualKey(sk)) return;

    // Never add favorites
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

    // Write into UI_ALL
    const dictLang = langOfKey(sk) || activeDictLang();
    const db = load();
    const b = ensureBucket(db, UI_ALL, dictLang);
    if (!b.items[sk]) b.items[sk] = {};
    if ((b.sources||{})[id] || (b.items[sk]||{})[id]) { save(db); return; } // avoid duplicates
    b.items[sk][id] = true;
    b.sources[id] = sk;
    save(db);
  };

  // Public: sourceKey for id in *aggregated* view (independent of UI)
  M.sourceKeyFor = function(id){
    const dictLang = activeDictLang();
    const agg = aggregateForLang(dictLang);
    return agg.sources[String(id)] || null;
  };
  M.sourceKeyInActive = M.sourceKeyFor;

  // Progress (independent from App.state.stars), also aggregated
  function aggregatedStarsFor(dictLang){
    const db = load();
    const acc = {};
    try{
      Object.keys(db||{}).forEach(uiKey=>{
        const b = (db[uiKey] && db[uiKey][dictLang]) ? db[uiKey][dictLang] : null;
        if (!b) return;
        Object.keys(b.stars||{}).forEach(sk=>{
          acc[sk] = acc[sk] || {};
          Object.keys(b.stars[sk]||{}).forEach(id=>{
            // prefer newest? we just take last write, OK for our use
            acc[sk][id] = b.stars[sk][id];
          });
        });
      });
    }catch(_){}
    return acc;
  }
  M.getStars = function(sourceKey, id){
    const dictLang = activeDictLang();
    const acc = aggregatedStarsFor(dictLang);
    return toInt(((acc[sourceKey||'']||{})[String(id)]), 0);
  };
  M.setStars = function(sourceKey, id, val){
    const dictLang = activeDictLang();
    const db = load();
    const b = ensureBucket(db, UI_ALL, dictLang); // write into neutral bucket
    const sk = String(sourceKey||''); const wid = String(id||'');
    if (!b.stars[sk]) b.stars[sk] = {};
    let max = 5; try{ if (App.Trainer && typeof App.Trainer.starsMax === 'function') max = +App.Trainer.starsMax() || 5; }catch(_){}
    const v = Math.max(0, Math.min(max, Number(val)||0));
    b.stars[sk][wid] = v;
    save(db);
  };

  // Deck/list/count (aggregated over all UI buckets)
  M.deck = function(){
    const dictLang = activeDictLang();
    const agg = aggregateForLang(dictLang);
    const out = [];
    Object.keys(agg.items||{}).forEach(sk=>{
      const ids = agg.items[sk] || {};
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
    const dictLang = activeDictLang();
    const agg = aggregateForLang(dictLang);
    let n = 0;
    Object.keys(agg.items||{}).forEach(sk=>{
      const words = deckWordsByKey(sk);
      if (!words.length) return;
      const have = new Set(words.map(w=>String(w.id)));
      Object.keys(agg.items[sk]||{}).forEach(id=>{
        if (have.has(String(id))) n += 1;
      });
    });
    return n;
  };

  // Clear only active dictLang across all UI buckets (to mirror current behavior)
  M.clearActive = function(){
    const dictLang = activeDictLang();
    const db = load();
    Object.keys(db||{}).forEach(uiKey=>{
      if (db[uiKey] && db[uiKey][dictLang]){
        db[uiKey][dictLang] = { items:{}, stars:{}, sources:{} };
      }
    });
    save(db);
  };

  M.onShow = function(id){}; // reserved

  // One-time light migration (non-destructive): merge current UI bucket into UI_ALL
  migrateCurrentToAll();

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