/*
*******************************************************************
 Version: 1.5 • Updated: 2025-10-10 • File: release-main/ui.fix.js 
*******************************************************************
*/
(function(){
  const App = window.App||{};
  if (App.Sets && typeof App.Sets.setActiveSetIndex === 'function'){
    const _orig = App.Sets.setActiveSetIndex;
    App.Sets.setActiveSetIndex = function(i){
      _orig.call(App.Sets, i);
      try{ UIState.syncTrainer(); }catch(e){}
      try{ App.renderSetsBar && App.renderSetsBar(); }catch(e){}
      try{ (typeof renderSetStats==='function'?renderSetStats:App.renderSetStats)(); }catch(e){}
      try{ typeof renderCard==='function' && renderCard(true); }catch(e){}
      try{ typeof updateStats==='function' && updateStats(); }catch(e){}
      try{ window.UIBus && UIBus.emit('sets:changed', { key: App.dictRegistry && App.dictRegistry.activeKey, index: UIState.activeSetIndex }); }catch(e){}
    };
  }
  if (App.Sets && typeof App.Sets.checkCompletionAndAdvance === 'function'){
    const _check = App.Sets.checkCompletionAndAdvance;
    App.Sets.checkCompletionAndAdvance = function(){
      const res = _check.call(App.Sets);
      try{ UIState.syncTrainer(); }catch(e){}
      try{ App.renderSetsBar && App.renderSetsBar(); }catch(e){}
      try{ (typeof renderSetStats==='function'?renderSetStats:App.renderSetStats)(); }catch(e){}
      try{ typeof updateStats==='function' && updateStats(); }catch(e){}
      return res;
    };
  }
  if (App.Mistakes && typeof App.Mistakes.add === 'function'){
    const _add = App.Mistakes.add;
    App.Mistakes.add = function(id, card, sourceKey){
      try{
        if (arguments.length===2 && typeof card==='string'){
          return _add.call(App.Mistakes, id, null, card);
        }
        return _add.call(App.Mistakes, id, card||null, sourceKey || (App.dictRegistry && App.dictRegistry.activeKey));
      }catch(e){ try{ return _add.apply(App.Mistakes, arguments); }catch(_){} }
    };
  }
})();
/* -------------------------------  К О Н Е Ц  ------------------------------- */
