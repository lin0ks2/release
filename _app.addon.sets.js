/*!
 * app.addon.sets.js — Lexitron
 * Version: 1.5.0
 * Date: 2025-09-21
 *
 * Purpose:
 *  - Part of the Lexitron web app
 */

(function(){
  const App = window.App || (window.App = {});
  
// MIGRATION: working-sets readiness: all words in active batch have stars >= unlockThreshold()
function isCurrentSetReady(){
  try{
    const deckKey = (App && App.state && App.state.activeDeck) || (App && App.Decks && App.Decks.activeKey && App.Decks.activeKey());
    const deck = (App && App.Decks && App.Decks.byKey) ? (App.Decks.byKey(deckKey) || []) : (App && App.deck ? App.deck : []);
    if (!deck || !deck.length) return false;
    const b = (App && App.Sets && App.Sets.activeBounds) ? App.Sets.activeBounds(deck.length) : null;
    if (!b) return false;
    const sMax = (App.Trainer && App.Trainer.starsMax) ? App.Trainer.starsMax() : 5;
    const ok = (App.Trainer && App.Trainer.unlockThreshold) ? App.Trainer.unlockThreshold() : 3;
    const stars = (App.state && App.state.stars) || {};
    for (let i=b.start;i<b.end;i++){
      const w = deck[i]; if (!w) continue;
      const sc = Math.max(0, Math.min(sMax, stars[w.id]||0));
      if (sc < ok) return false;
    }
    return true;
  }catch(_){ return false; }
}

App.Sets = App.Sets || {};
  const S = App.Sets;
  const LS_KEY = 'sets.progress.v1';
  const SET_SIZE = 4; // размер набора по умолчанию

  S.SET_SIZE = SET_SIZE;
  // per-dict state
  S.state = { activeByDeck: {}, completedByDeck: {} };

  function deckKey(){ return (App.dictRegistry && App.dictRegistry.activeKey) || 'default'; }
  function getDeck(){ try{ return (App.Decks && App.Decks.resolveDeckByKey(App.dictRegistry.activeKey)) || []; }catch(_){ return []; } }
  function setCount(len){ return Math.max(1, Math.ceil(len / SET_SIZE)); }
  function boundsForSet(idx, len){
    const start = idx * SET_SIZE;
    const end = Math.min(len, start + SET_SIZE);
    return { start, end };
  }

  function loadLS(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      if (raw){
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed==='object'){
          S.state.activeByDeck = parsed.activeByDeck || {};
          S.state.completedByDeck = parsed.completedByDeck || {};
        }
      }
    }catch(_){}
  }
  function saveLS(){
    try{ localStorage.setItem(LS_KEY, JSON.stringify(S.state)); }catch(_){}
  }

  // API
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
    const cnt = setCount(getDeck().length);
    if (i >= cnt) i = cnt - 1;
    if (S.state.activeByDeck[k] !== i){ S.state.activeByDeck[k] = i; saveLS(); }
    return i;
  };
  S.setActiveSetIndex = function(i){
    const k = deckKey();
    const cnt = setCount(getDeck().length);
    const clamped = Math.max(0, Math.min(cnt-1, i|0));
    S.state.activeByDeck[k] = clamped;
    saveLS();
  
    
    // Sync trainer batch index
    try { if (App.Trainer && typeof App.Trainer.setBatchIndex==='function') App.Trainer.setBatchIndex(clamped, k);
  if (App.switchToSetImmediate) App.switchToSetImmediate(); } catch(e){}
    // UI refresh & event
    try { if (App.renderSetsBar) App.renderSetsBar(); } catch(e){}
    try { if (typeof renderSetStats==='function') renderSetStats(); else if (App.renderSetStats) App.renderSetStats(); } catch(e){}
    try { document.dispatchEvent(new CustomEvent('sets:active-changed',{detail:{key:k,index:clamped}})); } catch(e){}
/* duplicate setBatchIndex removed */
  };
  S.isSetDone = function(i){
    const k = deckKey();
    const map = S.state.completedByDeck[k] || {};
    return !!map[i];
  };
  S.markSetDone = function(i){
    const k = deckKey();
    if (!S.state.completedByDeck[k]) S.state.completedByDeck[k] = {};
    S.state.completedByDeck[k][i] = true;
    saveLS();
  };

  // Критерий завершения набора: все слова в границах набора имеют звёзды >= starsMax
  function isActiveSetLearned(){
    try{
      const deck = getDeck();
      const b = S.activeBounds();
      const sMax = (App.Trainer && App.Trainer.starsMax && App.Trainer.starsMax()) || 6;
      const stars = (App.state && App.state.stars) || {};
      for (let i=b.start;i<b.end;i++){
        const w = deck[i]; if (!w) continue;
        const sc = Math.max(0, Math.min(sMax, stars[w.id]||0));
        if (sc < sMax) return false;
      }
      return (b.end - b.start) > 0;
    }catch(_){ return false; }
  }

  // Проверка завершения и автопереход
  S.checkCompletionAndAdvance = function(){
    const total = S.setTotalCount();
    if (total <= 0) return;
    if (!isActiveSetLearned()) return;

    const cur = S.getActiveSetIndex();
    S.markSetDone(cur);
    const next = (cur + 1 < total) ? (cur + 1) : 0; // цикл к первому
    S.setActiveSetIndex(next);

    // Переставляем индекс слова в начало нового набора
    if (typeof App.switchToSetImmediate === 'function') {
      App.switchToSetImmediate();
    
    try { if (App.renderSetsBar) App.renderSetsBar(); } catch(e){}
    try { document.dispatchEvent(new CustomEvent('sets:active-changed')); } catch(e){}
} else {
      // безопасный фолбэк
      try{
        const b = S.activeBounds();
        if (App.state) App.state.index = b.start|0;
      }catch(_){}
    }
  };

  loadLS();
  // экспорт служебного
  S._save = saveLS;
})();
/* -------------------------------  К О Н Е Ц  ------------------------------- */
