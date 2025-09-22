/*!
 * ui.state.js — Lexitron
 * Version: 1.5.0
 * Date: 2025-09-21
 *
 * Purpose:
 *  - Part of the Lexitron web app
 */
(function(){
  const A = ()=>window.App||{};
  function key(){ return (A().dictRegistry && A().dictRegistry.activeKey) || null; }
  function idx(){
    const k = key();
    return (A().Sets && A().Sets.state && A().Sets.state.activeByDeck && A().Sets.state.activeByDeck[k]) || 0;
  }
  function sync(){
    try{
      const k = key(); const i = idx();
      if (A().Trainer && typeof A().Trainer.setBatchIndex==='function'){
        A().Trainer.setBatchIndex(i, k);
      }
    }catch(e){}
  }
  window.UIState = {
    get activeDict(){ return key(); },
    set activeDict(v){ if (!A().dictRegistry) A().dictRegistry = {}; A().dictRegistry.activeKey = v; if (A().saveDictRegistry) A().saveDictRegistry(); },
    get activeSetIndex(){ return idx(); },
    setActiveSetIndex: function(i){ A().Sets && A().Sets.setActiveSetIndex && A().Sets.setActiveSetIndex(i); },
    syncTrainer: sync
  };
})();
/* -------------------------------  К О Н Е Ц  ------------------------------- */
