/* app.trainer.js v1.4.0 — планировщик + поддержка наборов (без рекурсии) */
(function(){
  const App = window.App;

  // ───────── базовая логика ─────────
  function starsMax(){ return App.clamp(App.settings.repeats||6,3,6); }
  function unlockThreshold(){ return 3; }

  function weightForWord(w){
    const sMax = starsMax();
    const stars = App.clamp(App.state.stars[w.id]||0, 0, sMax);
    const deficit = (sMax - stars);
    const last = App.state.lastSeen[w.id] || 0;
    const elapsedMin = Math.max(0, (Date.now() - last)/60000);
    const recency = Math.min(elapsedMin/3, 5);
    return Math.max(0.1, 1 + 2*deficit + recency);
  }

  function sampleNextIndexWeighted(deck){
    if (!deck || !deck.length) return 0;
    const forbidden = App.state.lastIndex;
    let total = 0;
    const weights = deck.map((w,idx)=>{
      const base = weightForWord(w);
      const penalty = (idx===forbidden) ? 0.0001 : 1;
      const wgt = base * penalty;
      total += wgt; 
      return wgt;
    });
    let r = Math.random()*total;
    for (let i=0;i<deck.length;i++){ r -= weights[i]; if (r<=0) return i; }
    return Math.floor(Math.random()*deck.length);
  }

  // ───────── поддержка наборов ─────────
  function getSetSize(){
    let raw = 50; // <— по умолчанию 50
    try { raw = Number(App && App.state && App.state.setSize); } catch(e){}
    return (Number.isFinite(raw) && raw >= 2) ? raw : 50;
  }
  function activeKey(){
    return (App && App.dictRegistry && App.dictRegistry.activeKey) || null;
  }
  function resolveDeckByKey(key){
    try{
      return (App && App.Decks && App.Decks.resolveDeckByKey)
        ? (App.Decks.resolveDeckByKey(key) || [])
        : [];
    }catch(e){ return []; }
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

  // ───────── экспорт API тренера ─────────
  App.Trainer = Object.assign({}, App.Trainer || {}, {
    starsMax,
    unlockThreshold,
    sampleNextIndexWeighted,
    // наборы:
    getSetSize,
    getBatchIndex,
    setBatchIndex,
    getBatchesMeta,
    getDeckSlice
  });

  if (!App.Trainer.sampleNextIndexWeighted && App.Trainer.pickNextIndexWeighted) {
    App.Trainer.sampleNextIndexWeighted = App.Trainer.pickNextIndexWeighted;
  }
})();
