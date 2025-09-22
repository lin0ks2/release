/*!
 * ui.progress.scope.js — Lexitron
 * Version: 1.5.0
 * Date: 2025-09-21
 *
 * Purpose:
 *  - Part of the Lexitron web app
 */
(function(){
  if (!window.App) window.App = {};
  var App = window.App;

  var LS_KEY = 'progress.v2'; // { stars:{dict:{set:{id:value}}}, successes:{...}, lastSeen:{...} }

  function load(){
    try{
      var raw = localStorage.getItem(LS_KEY);
      var st = raw ? JSON.parse(raw) : {};
      st.stars = st.stars || {};
      st.successes = st.successes || {};
      st.lastSeen = st.lastSeen || {};
      return st;
    }catch(e){ return {stars:{},successes:{},lastSeen:{}}; }
  }
  function save(st){
    try{ localStorage.setItem(LS_KEY, JSON.stringify(st)); }catch(e){}
  }

  function scope(){
    var key = (App.dictRegistry && App.dictRegistry.activeKey) || 'default';
    var setIndex = 0;
    try{
      if (App.Sets && typeof App.Sets.getActiveSetIndex === 'function'){
        setIndex = App.Sets.getActiveSetIndex()|0;
      } else if (App.Sets && App.Sets.state && App.Sets.state.activeByDeck && key in App.Sets.state.activeByDeck){
        setIndex = App.Sets.state.activeByDeck[key]|0;
      }
    }catch(e){}
    return { key: String(key), set: String(setIndex) };
  }

  function ensure2(obj, k1, k2){
    if (!obj[k1]) obj[k1] = {};
    if (!obj[k1][k2]) obj[k1][k2] = {};
    return obj[k1][k2];
  }

  function getFrom(bucket, prop){
    // поддержка как числовых, так и строковых ключей
    if (prop in bucket) return bucket[prop];
    var s = String(prop);
    if (s in bucket) return bucket[s];
    return 0;
  }

  function setTo(bucket, prop, value){
    var s = String(prop);
    bucket[s] = value; // нормализуем к строковому id
  }

  function makeProxy(field){
    var st = load();
    var shadow = Object.create(null); // локальная тень для ownKeys/has
    return new Proxy(shadow, {
      get: function(t, prop){
        if (prop === '__isProxy') return true;
        // служебное: чтобы Object.keys итерировал корректно
        if (prop === 'toJSON') return function(){ var s=scope(); return Object.assign({}, ensure2(st[field], s.key, s.set)); };
        var s = scope();
        var bucket = ensure2(st[field], s.key, s.set);
        return getFrom(bucket, prop);
      },
      set: function(t, prop, value){
        var s = scope();
        var bucket = ensure2(st[field], s.key, s.set);
        setTo(bucket, prop, value);
        save(st);
        // тень для корректных ownKeys/has
        t[String(prop)] = value;
        return true;
      },
      deleteProperty: function(t, prop){
        var s = scope();
        var bucket = ensure2(st[field], s.key, s.set);
        delete bucket[String(prop)];
        save(st);
        delete t[String(prop)];
        return true;
      },
      has: function(t, prop){
        var s = scope();
        var bucket = ensure2(st[field], s.key, s.set);
        return (prop in bucket) || (String(prop) in bucket);
      },
      ownKeys: function(t){
        var s = scope();
        var bucket = ensure2(st[field], s.key, s.set);
        try { return Object.keys(bucket); } catch(e){ return []; }
      },
      getOwnPropertyDescriptor: function(t, prop){
        return { enumerable: true, configurable: true };
      }
    });
  }

  // Инициализация прокси (идемпотентно)
  App.state = App.state || {};
  if (!App.state.stars || !App.state.stars.__isProxy)  App.state.stars     = makeProxy('stars');
  if (!App.state.successes || !App.state.successes.__isProxy) App.state.successes = makeProxy('successes');
  if (!App.state.lastSeen || !App.state.lastSeen.__isProxy)   App.state.lastSeen  = makeProxy('lastSeen');
  App.state.stars.__isProxy = true;
  App.state.successes.__isProxy = true;
  App.state.lastSeen.__isProxy = true;
})();
/* -------------------------------  К О Н Е Ц  ------------------------------- */
