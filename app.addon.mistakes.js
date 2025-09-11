/* app.addon.mistakes.js — mistakes with sourceKey + safe deck/limit */
(function () {
  const App = window.App;

  App.Mistakes = App.Mistakes || {};
  const M = App.Mistakes;

  const LS = 'mistakes.v2';
  const MAX_SHOWS = 3; // как у тебя раньше

  function defaultState(){
    return {
      set: {},        // { [id]: { source: 'dictKey' | null, ts: number } }
      shows: {}       // { [id]: number } — сколько раз показывали в режиме ошибок
    };
  }
  M.state = defaultState();

  function save(){
    try{ localStorage.setItem(LS, JSON.stringify(M.state)); }catch(e){}
  }
  function load(){
    try{
      const raw = localStorage.getItem(LS);
      if (raw){
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') M.state = Object.assign(defaultState(), parsed);
        // миграция: если было boolean — сделаем объект
        if (M.state && M.state.set){
          Object.keys(M.state.set).forEach(k=>{
            const v = M.state.set[k];
            if (v === true){
              M.state.set[k] = { source: null, ts: Date.now() };
            }
          });
        }
      }
    }catch(e){}
  }
  load();

  // все слова всех словарей
  function allWords(){
    const list=[];
    const keys = []
      .concat(App.Decks.builtinKeys ? App.Decks.builtinKeys() : [])
      .concat(Object.keys(App.dictRegistry.user || {}));
    keys.forEach(k=>{
      const arr = App.Decks.resolveDeckByKey(k) || [];
      for (let i=0;i<arr.length;i++) list.push(arr[i]);
    });
    return list;
  }

  M.add = function(id, sourceKey){
    id = String(id);
    if (!M.state.set[id] || typeof M.state.set[id] !== 'object'){
      M.state.set[id] = { source: sourceKey || null, ts: Date.now() };
    }else{
      if (sourceKey) M.state.set[id].source = sourceKey;
      if (!M.state.set[id].ts) M.state.set[id].ts = Date.now();
    }
    if (!(id in M.state.shows)) M.state.shows[id]=0;
    save();
  };

  M.remove = function(id){
    id = String(id);
    delete M.state.set[id];
    delete M.state.shows[id];
    save();
  };

  M.has = function(id){ return !!M.state.set[String(id)]; };
  M.count = function(){ return Object.keys(M.state.set).length; };

  // исходный словарь для слова
  M.sourceKeyFor = function(id){
    id = String(id);
    const rec = M.state.set[id];
    return (rec && typeof rec === 'object' && rec.source) ? rec.source : null;
  };

  // список слов (без лимитов показа)
  M.list = function(){
    const ids = Object.keys(M.state.set);
    if (!ids.length) return [];
    const byId = new Map(allWords().map(w=>[String(w.id), w]));
    const res = [];
    for (const id of ids){
      const w = byId.get(String(id));
      if (w) res.push(w);
    }
    return res;
  };

  // колода для тренировки: учитываем лимит показов
  M.deck = function(){
    const ids = Object.keys(M.state.set);
    if (!ids.length) return [];
    const byId = new Map(allWords().map(w=>[String(w.id), w]));
    const out=[];
    for (const id of ids){
      const w = byId.get(String(id));
      if (!w) continue;
      const shows = M.state.shows[String(id)] || 0;
      if (shows < MAX_SHOWS) out.push(w);
    }
    return out;
  };

  // вызываем при показе карточки слова из ошибок
  M.onShow = function(id){
    id = String(id);
    M.state.shows[id] = (M.state.shows[id]||0) + 1;
    if (M.state.shows[id] >= MAX_SHOWS){
      // при желании можно авто-удалять из ошибок; пока оставим
    }
    save();
  };

})();
