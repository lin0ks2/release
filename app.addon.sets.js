/*!
 * app.addon.sets.js — Lexitron (carousel-safe)
 * Version: 1.5.2
 * Date: 2025-09-22
 *
 * Minimal, conservative changes from baseline:
 *  - keep API shape and state keys (activeByDeck, completedByDeck)
 *  - wrap to first set after the last (carousel), regardless of completion state of others
 *  - DO NOT call UI renderers from here (avoid double renders / flicker)
 *  - ensure App.state.index is clamped to new set bounds
 */
(function(){
  const App = window.App || (window.App = {});
  const S = App.Sets || (App.Sets = {});

  const LS_KEY = 'sets.progress.v1';
  const DEFAULT_SET_SIZE = 4;

  // state
  S.state = S.state || { activeByDeck: {}, completedByDeck: {} };

  function loadLS(){
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object'){
        S.state.activeByDeck = obj.activeByDeck || S.state.activeByDeck || {};
        S.state.completedByDeck = obj.completedByDeck || S.state.completedByDeck || {};
      }
    } catch(_){}
  }
  function saveLS(){
    try { localStorage.setItem(LS_KEY, JSON.stringify(S.state)); } catch(_){}
  }

  function deckKey(){
    return (App.dictRegistry && App.dictRegistry.activeKey) || 'default';
  }
  function getDeck(){
    try { return (App.Decks && App.Decks.resolveDeckByKey) ? (App.Decks.resolveDeckByKey(deckKey()) || []) : []; }
    catch(_) { return []; }
  }
  function getSetSize(){
    try {
      if (App.Trainer && typeof App.Trainer.getSetSize === 'function'){
        const n = App.Trainer.getSetSize(deckKey());
        return (Number.isFinite(n) && n>0) ? n : DEFAULT_SET_SIZE;
      }
    } catch(_){}
    return DEFAULT_SET_SIZE;
  }
  function setCount(len){
    const L = Number.isFinite(len) ? len : getDeck().length;
    const SZ = getSetSize();
    return Math.max(1, Math.ceil(L / SZ));
  }
  function boundsForSet(i, len){
    const L = Number.isFinite(len) ? len : getDeck().length;
    const SZ = getSetSize();
    const start = Math.max(0, (i|0) * SZ);
    const end = Math.min(L, start + SZ);
    return { start, end };
  }

  // Public API kept compatible with baseline
  S.setTotalCount = function(){ return setCount(getDeck().length); };
  S.activeBounds = function(){
    const len = getDeck().length;
    const idx = S.getActiveSetIndex();
    return boundsForSet(idx, len);
  };
  S.getActiveSetIndex = function(){
    const k = deckKey();
    let i = S.state.activeByDeck[k];
    if (!Number.isFinite(i) || i < 0) i = 0;
    const total = setCount(getDeck().length);
    if (i >= total) i = 0;
    // persist normalized value
    if (S.state.activeByDeck[k] !== i) { S.state.activeByDeck[k] = i; saveLS(); }
    return i;
  };
  S.setActiveSetIndex = function(i){
    const k = deckKey();
    const total = setCount(getDeck().length);
    const clamped = Math.max(0, Math.min(total-1, i|0));
    S.state.activeByDeck[k] = clamped;
    saveLS();

    // Keep trainer in sync (idempotent)
    try { if (App.Trainer && typeof App.Trainer.setBatchIndex === 'function') App.Trainer.setBatchIndex(clamped, k); } catch(_){}

    // Clamp absolute card index to new bounds
    try {
      const b = boundsForSet(clamped);
      if (App.state && (App.state.index < b.start || App.state.index >= b.end)) {
        App.state.index = b.start;
        if (typeof App.saveState === 'function') App.saveState();
      }
    } catch(_){}

    // Notify (no UI rendering here)
    try { document.dispatchEvent(new CustomEvent('sets:active-changed',{detail:{ key:k, index:clamped }})); } catch(_){}
  };
  S.isSetDone = function(i){
    const k = deckKey();
    const map = (S.state.completedByDeck && S.state.completedByDeck[k]) || {};
    return !!map[i];
  };
  S.markSetDone = function(i){
    const k = deckKey();
    if (!S.state.completedByDeck) S.state.completedByDeck = {};
    if (!S.state.completedByDeck[k]) S.state.completedByDeck[k] = {};
    S.state.completedByDeck[k][i] = true;
    saveLS();
  };

  function isActiveSetLearned(){
    try {
      const deck = getDeck();
      const b = S.activeBounds();
      const sMax = (App.Trainer && App.Trainer.starsMax) ? App.Trainer.starsMax() : 5;
      const stars = (App.state && App.state.stars) || {};
      for (let i=b.start; i<b.end; i++){
        const w = deck[i]; if (!w) continue;
        const sc = Math.max(0, Math.min(sMax, stars[w.id] || 0));
        if (sc < sMax) return false;
      }
      return (b.end - b.start) > 0;
    } catch(_){ return false; }
  }

  // Carousel auto-advance — conservative: only wrap after confirmed completion
  S.checkCompletionAndAdvance = function(){
    const total = S.setTotalCount();
    if (total <= 0) return;
    if (!isActiveSetLearned()) return;

    const cur = S.getActiveSetIndex();
    S.markSetDone(cur);
    const next = (cur + 1) % total;
    S.setActiveSetIndex(next);
  };

  // Optional utility: clear only completion marks (keep stars)
  S.clearCompletedMarks = function(){
    const k = deckKey();
    if (S.state.completedByDeck && S.state.completedByDeck[k]) {
      S.state.completedByDeck[k] = {};
      saveLS();
    }
  };

  // init
  loadLS();
  S._save = saveLS;
})();
