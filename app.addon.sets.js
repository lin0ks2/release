/* app.addon.sets.js v1.0.0 — Наборы по 50 слов, прогресс и переключение */
(function(){
  const App = window.App || (window.App = {});
  App.Sets = App.Sets || {};
  const S = App.Sets;
  const LS_KEY = 'sets.progress.v1';
  const SET_SIZE = 50;

  S.SET_SIZE = SET_SIZE;
  S.state = { activeByDeck: {}, completedByDeck: {} };

  function loadLS(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      if (raw){
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object'){
          S.state = Object.assign({activeByDeck:{}, completedByDeck:{}}, parsed);
        }
      }
    }catch(e){ /* ignore */ }
  }
  function saveLS(){
    try{
      localStorage.setItem(LS_KEY, JSON.stringify(S.state));
    }catch(e){ /* ignore */ }
  }

  function deckKey(){ return (App.dictRegistry && App.dictRegistry.activeKey) || 'default'; }
  function getDeck(){ return (App.Decks && App.Decks.resolveDeckByKey && App.Decks.resolveDeckByKey(App.dictRegistry.activeKey)) || []; }
  function setCount(len){ return Math.max(1, Math.ceil(len / SET_SIZE)); }
  function boundsForSet(idx, len){
    const start = idx * SET_SIZE;
    const end = Math.min(len, start + SET_SIZE);
    return {start, end};
  }

  S.getActiveSetIndex = function(){
    const k = deckKey();
    let i = S.state.activeByDeck[k];
    if (typeof i !== 'number' || i<0) i = 0;
    const cnt = setCount(getDeck().length);
    if (i >= cnt) i = cnt-1;
    S.state.activeByDeck[k] = i;
    return i;
  };
  S.setActiveSetIndex = function(i){
    const k = deckKey();
    const cnt = setCount(getDeck().length);
    const clamped = Math.max(0, Math.min(cnt-1, i|0));
    S.state.activeByDeck[k] = clamped;
    saveLS();
    if (typeof App.renderSetsBar === 'function') App.renderSetsBar();
  };

  S.isSetDone = function(i){
    const k = deckKey();
    const arr = S.state.completedByDeck[k] || [];
    return !!arr[i];
  };
  S.markSetDone = function(i){
    const k = deckKey();
    const arr = S.state.completedByDeck[k] || [];
    arr[i] = true;
    S.state.completedByDeck[k] = arr;
    saveLS();
    if (typeof App.renderSetsBar === 'function') App.renderSetsBar();
  };

  S.activeBounds = function(){
    const len = getDeck().length;
    const idx = S.getActiveSetIndex();
    return boundsForSet(idx, len);
  };

  S.setTotalCount = function(){ return setCount(getDeck().length); };

  // Heuristic completion: когда все слова текущего набора хотя бы раз показаны (по lastSeen)
  S.checkCompletionAndAdvance = function(){
    const deck = getDeck();
    const bounds = S.activeBounds();
    let shown = 0;
    for (let i=bounds.start;i<bounds.end;i++){
      const w = deck[i];
      if (w && App.state && App.state.lastSeen && App.state.lastSeen[w.id]) shown++;
    }
    const size = bounds.end - bounds.start;
    if (size>0 && shown >= size){
      const cur = S.getActiveSetIndex();
      S.markSetDone(cur);
      const total = S.setTotalCount();
      if (cur+1 < total){
        S.setActiveSetIndex(cur+1);
        // Переключаемся сразу на следующий набор и показываем слово
        if (typeof App.switchToSetImmediate === 'function') App.switchToSetImmediate();
      } else {
        // Финальная мотивация
        if (App.showMotivation) App.showMotivation('final');
      }
    }
  };

  loadLS();
  // экспорт для отладки
  S._save = saveLS;
})();
