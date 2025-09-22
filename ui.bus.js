/*!
 * ui.bus.js — Lexitron
 * Version: 1.5.0
 * Date: 2025-09-21
 *
 * Purpose:
 *  - Part of the Lexitron web app
 */
window.UIBus = (function(){
  const map = {};
  return {
    on: function(evt, cb){ (map[evt] ||= []).push(cb); },
    off: function(evt, cb){ if(!map[evt]) return; map[evt] = map[evt].filter(x=>x!==cb); },
    emit: function(evt, data){ (map[evt]||[]).forEach(cb=>{ try{ cb(data); }catch(_){} }); }
  };
})();
/* -------------------------------  К О Н Е Ц  ------------------------------- */
