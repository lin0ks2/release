/*
********************************************************************
 Version: 1.5 • Updated: 2025-10-10 • File: release-main/ui.sets.js 
********************************************************************
*/
(function(){

if (App.switchToSetImmediate) { /* keep existing impl from app.ui.view.js */ return; }
App.switchToSetImmediate = function () {
    
  try { if (App.renderSetsBar) App.renderSetsBar(); } catch(e){} 
const b = App.Sets.activeBounds();
    if (App.state.index < b.start || App.state.index >= b.end) App.state.index = b.start;
    if(App.renderCard) App.renderCard(true); else if (typeof renderCard==='function') renderCard(true);
    if(App.renderSetStats) App.renderSetStats(); else if (typeof renderSetStats==='function') renderSetStats();
    App.saveState && App.saveState();
  }
})();
/* -------------------------------  К О Н Е Ц  ------------------------------- */
