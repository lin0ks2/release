/* app.addon.mistakes.js v1.0.0 — динамический словарь "Мои ошибки" */
(function(){
  const App = window.App || (window.App = {});
  const M = App.Mistakes = App.Mistakes || {};
  const LS = 'mistakes.v1';
  const MAX_SHOWS = 3;

  const defaultState = ()=>({ set:{}, shows:{} });
  M.state = defaultState();

  function load(){
    try{
      const raw = localStorage.getItem(LS);
      if (raw){
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') M.state = Object.assign(defaultState(), parsed);
      }
    }catch(e){}
  }
  function save(){
    try{ localStorage.setItem(LS, JSON.stringify(M.state)); }catch(e){}
  }

  M.add = function(id){
    id = String(id);
    M.state.set[id] = true;
    if (!(id in M.state.shows)) M.state.shows[id]=0;
    save();
  };
  M.remove = function(id){
    id = String(id);
    delete M.state.set[id];
    delete M.state.shows[id];
    save();
  };
  M.clear = function(){
    M.state = defaultState();
    save();
  };
  M.count = function(){
    return Object.keys(M.state.set).length;
  };

  M.onShow = function(id){
    id = String(id);
    if (!(id in M.state.shows)) M.state.shows[id]=0;
    M.state.shows[id]++;
    save();
  };

  function allWords(){
    const list=[];
    try{
      if (window.decks){
        for (const k of Object.keys(window.decks||{})) list.push(...(window.decks[k]||[]));
      }
      if (App.dictRegistry && App.dictRegistry.user){
        for (const k of Object.keys(App.dictRegistry.user)){
          list.push(...(App.dictRegistry.user[k]?.words||[]));
        }
      }
    }catch(e){}
    return list;
  }

  M.deck = function(){
    const ids = Object.keys(M.state.set);
    if (!ids.length) return [];
    const byId = new Map(allWords().map(w=>[String(w.id), w]));
    const res = [];
    for (const id of ids){
      const w = byId.get(String(id));
      if (!w) continue;
      const shows = M.state.shows[String(id)]||0;
      if (shows < MAX_SHOWS) res.push(w);
    }
    return res;
  };

  // ── Интеграция с App.Decks.* (обёртки) ─────────────────────────
  const D = App.Decks || (App.Decks={});
  // resolveDeckByKey
  const originalResolve = D.resolveDeckByKey ? D.resolveDeckByKey.bind(D) : null;
  D.resolveDeckByKey = function(key){
    if (key === 'mistakes') return M.deck();
    if (originalResolve) return originalResolve(key);
    return [];
  };
  // resolveNameByKey
  const originalName = D.resolveNameByKey ? D.resolveNameByKey.bind(D) : null;
  D.resolveNameByKey = function(key){
    if (key === 'mistakes'){
      const t = (typeof App.i18n==='function') ? App.i18n() : null;
      return (t && t.mistakesName) ? t.mistakesName : 'Мои ошибки';
    }
    return originalName ? originalName(key) : key;
  };
  // flagForKey — покажем количество
  const originalFlag = D.flagForKey ? D.flagForKey.bind(D) : null;
  D.flagForKey = function(key, words){
    if (key === 'mistakes'){
      const cnt = M.count();
      return cnt>0 ? ('⚠️ '+cnt) : '⚠️';
    }
    return originalFlag ? originalFlag(key, words) : '•';
  };

  load();
})();
