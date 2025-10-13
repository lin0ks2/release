/*
*******************************************************************
 Version: 1.5 • Updated: 2025-10-10 • File: release-main/ui.bus.js 
*******************************************************************
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
