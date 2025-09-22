/*!
 * ui.stats.core.js — Lexitron
 * Version: 1.5.0
 * Date: 2025-09-21
 *
 * Purpose:
 *  - Part of the Lexitron web app
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
