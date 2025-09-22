/*!
 * app.mistakes.js — Lexitron
 * Version: 1.5.0
 * Date: 2025-09-21
 *
 * Purpose:
 *  - Part of the Lexitron web app
 */

(function(){
  const App = window.App || (window.App = {});
  const M = App.Mistakes || (App.Mistakes = {});

  const LS = 'mistakes.v4';
  const toInt = (x, d)=>{ x = Number(x); return Number.isFinite(x) ? x : (d||0); };

  function load(){ try{ return JSON.parse(localStorage.getItem(LS)||'{}'); }catch(e){ return {}; } }
  function save(s){ try{ localStorage.setItem(LS, JSON.stringify(s)); }catch(e){} }

  function uiLang(){ return (App.settings && App.settings.lang === 'uk') ? 'uk' : 'ru'; }
  function langOfKey(k){ try{ const m = String(k||'').match(/^([a-z]{2})_/i); return m?m[1].toLowerCase():null; }catch(e){ return null; } }
  function activeDictLang(){
    if (App.settings && App.settings.dictsLangFilter) return App.settings.dictsLangFilter;
    const key = (App.dictRegistry && App.dictRegistry.activeKey) || null;
    return langOfKey(key) || 'de';
  }
  function ensureBucket(db, ul, dl){
    if (!db[ul]) db[ul] = {};
    if (!db[ul][dl]) db[ul][dl] = { items:{}, stars:{}, sources:{} };
    return db[ul][dl];
  }

  // Public: add
  M.add = function(id, word, sourceKey){
    if (!id) return;
    id = String(id);
    if (!sourceKey){
      if (word && (word._mistakeSourceKey || word._favoriteSourceKey)) sourceKey = word._mistakeSourceKey || word._favoriteSourceKey;
      if (!sourceKey){
        const ak = (App.dictRegistry && App.dictRegistry.activeKey) || null;
        if (ak && ak !== 'mistakes') sourceKey = ak;
      }
    }
    if (!sourceKey) return;
    const ul = uiLang(), dl = langOfKey(sourceKey) || activeDictLang();
    const db = load(), b = ensureBucket(db, ul, dl);
    if (!b.items[sourceKey]) b.items[sourceKey] = {};
    b.items[sourceKey][id] = true;
    b.sources[id] = sourceKey;
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
    sb[sk][wid] = toInt(val, 0);
    save(db);
  };

  // Deck/list/count for ACTIVE scope (uiLang+dictLang)
  M.deck = function(){
    const db = load(); const ul = uiLang(); const dl = activeDictLang();
    const b = ensureBucket(db, ul, dl);
    const out = [];
    Object.keys(b.items||{}).forEach(sk=>{
      const ids = b.items[sk] || {};
      const deck = (App.Decks && App.Decks.resolveDeckByKey) ? (App.Decks.resolveDeckByKey(sk)||[]) : [];
      if (!deck.length) return;
      const map = new Map(deck.map(w=>[String(w.id), w]));
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
    let n = 0; Object.keys(b.items||{}).forEach(sk=>{ n += Object.keys(b.items[sk]||{}).length; });
    return n;
  };

  // Clear only active scope
  M.clearActive = function(){
    const db = load(); const ul = uiLang(); const dl = activeDictLang();
    db[ul] && (db[ul][dl] = { items:{}, stars:{}, sources:{} }); save(db);
  };

  M.onShow = function(id){}; // reserved
})();
/* -------------------------------  К О Н Е Ц  ------------------------------- */
