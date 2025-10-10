/*
**************************************************************************
 Version: 1.5 • Updated: 2025-10-10 • File: release-main/ui.stats.core.js 
**************************************************************************
*/
(function(){
  window.App = window.App || {};
  var App = window.App;
  App.Stats = App.Stats || {};

  App.Stats.recomputeAndRender = function(){
    // если есть отдельная логика перерасчёта — можно добавить здесь,
    // но текущие рендеры уже читают состояния из App.Trainer/App.state.*
    try{ if (typeof renderSetStats === 'function') renderSetStats(); }catch(e){}
    try{ if (typeof updateStats === 'function') updateStats(); }catch(e){}
  };
})();
/* -------------------------------  К О Н Е Ц  ------------------------------- */
