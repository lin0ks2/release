/*!
 * app.addon.startup.js — Lexitron
 * Version: 1.5.0
 * Date: 2025-09-21
 *
 * Purpose:
 *  - Part of the Lexitron web app
 */

(function(){
  function onReady(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true });
    else fn();
  }
  onReady(function(){
    try {
      if (window.StartupManager && typeof StartupManager.gate === 'function'){
        StartupManager.gate();
      } else {
        console.error('[startup] StartupManager.gate() не найден — проверь порядок скриптов.');
      }
    } catch(e){
      console.error('[startup] gate failed', e);
    }
  });
})();
/* -------------------------------  К О Н Е Ц  ------------------------------- */
