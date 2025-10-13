/*
************************************************************************
 Version: 1.5 • Updated: 2025-10-10 • File: release-main/app.trainer.js 
************************************************************************
*/
(function(){
  const App = window.App || (window.App = {});

  // ───────── базовые параметры ─────────
  function starsMax(){ return 5; }
  function unlockThreshold(){ try{ return (App.Config && App.Config.reverseThreshold) || 2.5; }catch(_){ return 2.5; } }

  // ───────── веса выбора карточки ─────────
  function weightForWord(w){
    try{
      const sMax = starsMax();
      const s = Math.max(0, Math.min(sMax, (App.state && App.state.stars && App.state.stars[App.starKey(w.id)]) || 0));
      const deficit = (sMax - s); // чем меньше выучено, тем выше вес
      const last = (App.state && App.state.lastSeen && App.state.lastSeen[w.id]) || 0;
      const elapsedMin = Math.max(0, (Date.now() - last)/60000);
      const recency = Math.min(elapsedMin/3, 5);
      let wgt = Math.max(0.1, 1 + 2*deficit + recency);

      // Мягкое усиление с учётом неудач/idk (если Penalties есть)
      if (App.Penalties && typeof App.Penalties.weightFor === 'function') {
        try { wgt *= Math.max(1, App.Penalties.weightFor(w.id)); } catch(_){}
      }
      return wgt;
    }catch(_){ return 1; }
  }

  function sampleNextIndexWeighted(deck){
    if (!deck || !deck.length) return 0;
    const forbidden = (App.state && App.state.lastIndex);
    let total = 0;
    const weights = new Array(deck.length);
    for (let i=0;i<deck.length;i++){
      const w = deck[i];
      let base = weightForWord(w);
      if (forbidden === i) base *= 0.0001; // запрет немедленного повтора
      weights[i] = base;
      total += base;
    }
    let r = Math.random()*total;
    for (let i=0;i<deck.length;i++){
      r -= weights[i];
      if (r <= 0) return i;
    }
    return Math.floor(Math.random()*deck.length);
  }

  // ───────── поддержка наборов ─────────
  function getSetSize(/*deckKey*/){
    try{ return (App.Config && App.Config.setSizeDefault) || 50; }catch(_){ return 50; }
  }
  function activeKey(){
    try { return (App.dictRegistry && App.dictRegistry.activeKey) || null; } catch(_){ return null; }
  }
  function resolveDeckByKey(key){
    try{
      return (App.Decks && App.Decks.resolveDeckByKey)
        ? (App.Decks.resolveDeckByKey(key) || [])
        : [];
    }catch(_){ return []; }
  }

  function getBatchIndex(deckKey, totalOpt){
    const key = deckKey || activeKey();
    const setSize = getSetSize();
    let total = totalOpt;
    if (!Number.isFinite(total)) {
      const deck = resolveDeckByKey(key);
      total = Math.max(1, Math.ceil(deck.length / setSize));
    }
    App.state = App.state || {};
    App.state.setByDeck = App.state.setByDeck || {};
    let idx = App.state.setByDeck[key] | 0;
    if (idx < 0) idx = 0;
    if (total > 0 && idx >= total) idx = total - 1;
    return idx;
  }

  function setBatchIndex(i, deckKey){
    const key = deckKey || activeKey();
    const setSize = getSetSize();
    const deck = resolveDeckByKey(key);
    const total = Math.max(1, Math.ceil(deck.length / setSize));
    let idx = (i|0);
    if (idx < 0) idx = 0;
    if (idx >= total) idx = total - 1;
    App.state = App.state || {};
    App.state.setByDeck = App.state.setByDeck || {};
    App.state.setByDeck[key] = idx;
    if (typeof App.saveState === 'function') App.saveState();
    return idx;
  }

  function getBatchesMeta(deckKey){
    const key = deckKey || activeKey();
    const deck = resolveDeckByKey(key);
    const setSize = getSetSize();
    const total = Math.max(1, Math.ceil(deck.length / setSize));
    const active = getBatchIndex(key, total);
    const completed = new Array(total).fill(false);
    const stars = (App && App.state && App.state.stars) || {};
    const repeats = starsMax();
    for (let i=0;i<total;i++){
      const start = i * setSize;
      const end = Math.min(deck.length, start + setSize);
      let done = (end > start);
      for (let j=start; j<end; j++){
        const w = deck[j];
        if (!w) { done = false; break; }
        const s = stars[w.id] || 0;
        if (s < repeats) { done = false; break; }
      }
      completed[i] = done;
    }
    return { total, active, completed };
  }

  function getDeckSlice(deckKey){
    const key = deckKey || activeKey();
    const deck = resolveDeckByKey(key);
    const setSize = getSetSize();
    const total = Math.max(1, Math.ceil(deck.length / setSize));
    const idx = getBatchIndex(key, total);
    const start = idx * setSize;
    const end = Math.min(deck.length, start + setSize);
    const slice = deck.slice(start, end);
    return slice.length ? slice : deck;
  }

  // анти-повтор последних показов (на уровне Trainer)
  var _recentShown = []; var _K = 5;
  function rememberShown(id){
    try{
      if (id==null) return;
      id = String(id);
      var i = _recentShown.indexOf(id);
      if (i>=0) _recentShown.splice(i,1);
      _recentShown.push(id);
      while(_recentShown.length>_K) _recentShown.shift();
    }catch(_){}
  }

  // ───────── экспорт API ─────────
  App.Trainer = Object.assign({}, App.Trainer || {}, {
    starsMax,
    unlockThreshold,
    sampleNextIndexWeighted,
    // наборы:
    getSetSize,
    getBatchIndex,
    setBatchIndex,
    getBatchesMeta,
    getDeckSlice,
    rememberShown: rememberShown,
    _recentShown: _recentShown
  });
})();
