/*
******************************************************************************
 Version: 1.5 • Updated: 2025-10-10 • File: release-main/ui.progress.scope.js 
******************************************************************************
*/
(function(){
  if (!window.App) window.App = {};
  var App = window.App;

  var LS_KEY = 'progress.v2'; // structure: { stars:{dictKey:{setIndex:{id:value}}}, successes:{...}, lastSeen:{...} }

  // ---- storage helpers ----
  
  function earlyDeckKey(){
    try{
      var k = (App.dictRegistry && App.dictRegistry.activeKey) || null;
      if (!k){
        k = localStorage.getItem('lexitron.deckKey') || localStorage.getItem('lexitron.activeKey') || null;
      }
      return k || 'default';
    }catch(_){ return 'default'; }
  }
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

  // current scope = { dictKey, setIndex }
  function scope(){
    var key = earlyDeckKey();
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
    if (prop in bucket) return bucket[prop];
    var s = String(prop);
    if (s in bucket) return bucket[s];
    return 0;
  }
  function setTo(bucket, prop, value){
    bucket[String(prop)] = value;
  }

  // ---- one-time in-memory migration (handles early writes before this file loads) ----
  try {
    var earlyKey = earlyDeckKey();
    var earlySet = 0;
    try {
      if (App.Sets && typeof App.Sets.getActiveSetIndex === 'function'){
        earlySet = App.Sets.getActiveSetIndex()|0;
      }
    } catch(_){}
    var stEarly = load();
    var bucketStars = ensure2(stEarly['stars']||{}, String(earlyKey), String(earlySet));
    var bucketSucc  = ensure2(stEarly['successes']||{}, String(earlyKey), String(earlySet));
    var bucketSeen  = ensure2(stEarly['lastSeen']||{}, String(earlyKey), String(earlySet));

    // If App.state.* are plain objects with data (not proxies), persist them into progress.v2
    if (App.state && App.state.stars && !App.state.stars.__isProxy && typeof App.state.stars === 'object') {
      var has = false;
      for (var k in App.state.stars){ if (Object.prototype.hasOwnProperty.call(App.state.stars,k)) { has = true; break; } }
      if (has) {
        Object.keys(App.state.stars).forEach(function(id){
          bucketStars[String(id)] = App.state.stars[id]|0;
        });
      }
    }
    if (App.state && App.state.successes && !App.state.successes.__isProxy && typeof App.state.successes === 'object') {
      Object.keys(App.state.successes).forEach(function(id){
        bucketSucc[String(id)] = App.state.successes[id]|0;
      });
    }
    if (App.state && App.state.lastSeen && !App.state.lastSeen.__isProxy && typeof App.state.lastSeen === 'object') {
      Object.keys(App.state.lastSeen).forEach(function(id){
        bucketSeen[String(id)] = App.state.lastSeen[id]|0;
      });
    }

    // Save back if anything changed
    try { save({ stars: stEarly.stars || stEarly['stars'], successes: stEarly.successes || stEarly['successes'], lastSeen: stEarly.lastSeen || stEarly['lastSeen'] }); } catch(_){}
  } catch(_){}

  
  // ---- migrate early 'default' bucket to actual deck key if present ----
  try{
    var st0 = load();
    var dk = earlyDeckKey();
    if (dk && dk !== 'default'){
      ['stars','successes','lastSeen'].forEach(function(field){
        var root = st0[field] = st0[field] || {};
        var def = root['default'];
        if (def && typeof def === 'object'){
          var tgt = root[dk] = root[dk] || {};
          Object.keys(def).forEach(function(setIndex){
            var srcB = def[setIndex] || {};
            var dstB = tgt[setIndex] = tgt[setIndex] || {};
            Object.keys(srcB).forEach(function(id){
              var v = srcB[id]|0;
              if (dstB[id] == null || v > (dstB[id]|0)) dstB[id] = v;
            });
          });
          delete root['default'];
        }
      });
      save(st0);
    }
  }catch(_){}
// ---- proxies (scoped) ----
  function makeProxy(field){
    var st = load();
    var shadow = Object.create(null);
    return new Proxy(shadow, {
      get: function(_t, prop){
        if (prop === '__isProxy') return true;
        if (prop === 'toJSON'){
          return function(){
            var s=scope();
            return Object.assign({}, ensure2(st[field], s.key, s.set));
          };
        }
        var s = scope();
        var bucket = ensure2(st[field], s.key, s.set);
        return getFrom(bucket, prop);
      },
      set: function(t, prop, value){
        var s = scope();
        var bucket = ensure2(st[field], s.key, s.set);
        setTo(bucket, prop, value);
        save(st);
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
      has: function(_t, prop){
        var s = scope();
        var bucket = ensure2(st[field], s.key, s.set);
        return (prop in bucket) || (String(prop) in bucket);
      },
      ownKeys: function(){
        var s = scope();
        var bucket = ensure2(st[field], s.key, s.set);
        try { return Object.keys(bucket); } catch(e){ return []; }
      },
      getOwnPropertyDescriptor: function(){
        return { enumerable: true, configurable: true };
      }
    });
  }

  // idempotent init
  App.state = App.state || {};
  if (!App.state.stars     || !App.state.stars.__isProxy)     App.state.stars     = makeProxy('stars');
  if (!App.state.successes || !App.state.successes.__isProxy) App.state.successes = makeProxy('successes');
  if (!App.state.lastSeen  || !App.state.lastSeen.__isProxy)  App.state.lastSeen  = makeProxy('lastSeen');
  App.state.stars.__isProxy = true;
  App.state.successes.__isProxy = true;
  App.state.lastSeen.__isProxy = true;

  // ---- GLOBAL AGGREGATOR (progress.v2 + legacy k_state_v1_3_x) ----
  App.Progress = App.Progress || {};
  App.Progress.aggregateStars = function(dictKey){
    try{
      var key = String(dictKey || (earlyDeckKey()));
      var agg = Object.create(null);
      var sMax = (App.Trainer && App.Trainer.starsMax && App.Trainer.starsMax()) || 5;

      // restrict to active dictionary ids
      var deck = (App.Decks && App.Decks.resolveDeckByKey) ? (App.Decks.resolveDeckByKey(key) || []) : [];
      var allow = null;
      if (deck && deck.length){
        allow = new Set(deck.map(function(w){ return String(w.id); }));
      }

      // from progress.v2
      try{
        var st = load();
        var byDict = st.stars && st.stars[key];
        if (byDict){
          Object.keys(byDict).forEach(function(setK){
            var bucket = byDict[setK] || {};
            Object.keys(bucket).forEach(function(id){
              var sid = String(id);
              if (allow && !allow.has(sid)) return;
              var v = bucket[id] | 0;
              if (v < 0) v = 0;
              if (v > sMax) v = sMax;
              if (agg[sid] == null || v > agg[sid]) agg[sid] = v;
            });
          });
        }
      }catch(_){}

      // legacy k_state_v1_3_x (kept for safety in this branch)
      try{
        var raw = localStorage.getItem('k_state_v1_3_1') || localStorage.getItem('k_state_v1_3_0');
        if (raw){
          var legacy = JSON.parse(raw);
          var map = legacy && legacy.stars;
          if (map && typeof map === 'object'){
            Object.keys(map).forEach(function(id){
              var sid = String(id);
              if (allow && !allow.has(sid)) return;
              var v = map[id] | 0;
              if (v < 0) v = 0;
              if (v > sMax) v = sMax;
              if (agg[sid] == null || v > agg[sid]) agg[sid] = v;
            });
          }
        }
      }catch(_){}

      return agg;
    }catch(e){
      return {};
    }
  };


  // ---- public deck reset (by dictionary key) ----
  window.App = window.App || {};
  App.ProgressV2 = App.ProgressV2 || {};
  App.ProgressV2.resetDeck = function(dictKey){
    try {
      if (!dictKey) return;
      var st = load();
      if (!st) return;
      try { if (st.stars && st.stars[dictKey]) delete st.stars[dictKey]; } catch(_){}
      try { if (st.successes && st.successes[dictKey]) delete st.successes[dictKey]; } catch(_){}
      try { if (st.lastSeen && st.lastSeen[dictKey]) delete st.lastSeen[dictKey]; } catch(_){}
      save(st);
    } catch(e){ /* noop */ }
  };

})();
