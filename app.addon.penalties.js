/* app.addon.penalties.js v1.0.0 — штрафы/реверс/веса */
(function(){
  const App = window.App || (window.App = {});
  const P = App.Penalties = App.Penalties || {};
  const LS = 'penalties.v1';
  const now = ()=>Date.now();

  const defaultState = ()=>({ failures:{}, idk:{}, lastWrong:{} });
  P.state = defaultState();

  function load(){
    try{
      const raw = localStorage.getItem(LS);
      if (raw){
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') P.state = Object.assign(defaultState(), parsed);
      }
    }catch(e){}
  }
  function save(){
    try{ localStorage.setItem(LS, JSON.stringify(P.state)); }catch(e){}
  }

  P.onWrong = function(id){
    id = String(id);
    P.state.failures[id] = (P.state.failures[id]||0)+1;
    P.state.lastWrong[id] = now();
    save();
  };
  P.onIDK = function(id){
    id = String(id);
    P.state.idk[id] = (P.state.idk[id]||0)+1;
    P.state.lastWrong[id] = now();
    save();
  };

  function decay(ts){
    if (!ts) return 1.0;
    const days = (now()-ts)/(1000*60*60*24);
    const tau = 3.0; // 3 дня — полураспад влияния
    const factor = Math.exp(-days/tau);
    return Math.max(0.3, factor); // не опускаем влияние ниже 0.3
  }

  // Вес для сэмплера
  P.weightFor = function(id){
    id = String(id);
    const f = P.state.failures[id]||0;
    const k = P.state.idk[id]||0;
    const d = decay(P.state.lastWrong[id]);
    // базовая формула: 1 + 0.6*f + 0.4*k, с затуханием
    const w = (1 + 0.6*f + 0.4*k) * d;
    return Math.max(1, w);
  };

  // Вероятность реверса (добавка к базовой логике)
  P.reverseProbFor = function(id){
    id = String(id);
    const f = P.state.failures[id]||0;
    const d = decay(P.state.lastWrong[id]);
    const p = 0.05 + 0.03*f; // 5% базово, +3% за каждую ошибку
    return Math.max(0, Math.min(0.35, p * d));
  };

  load();
})();
