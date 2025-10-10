/*
******************************************************************************
 Version: 1.5 • Updated: 2025-10-10 • File: release-main/app.spoiler.bootstrap.js 
******************************************************************************
*/
(function(){
  function init(){
    if (window.App && App.renderSetsBar){
      try { App.renderSetsBar(); } catch(e){}
      try { window.updateSpoilerHeader && window.updateSpoilerHeader(); } catch(e){}
    }
    if (window.App && App.applyLang && !App.__singleSpoilerLangHook){
      var orig = App.applyLang.bind(App);
      App.applyLang = function(){
        var r = orig();
        try { App.renderSetsBar && App.renderSetsBar(); } catch(e){}
        if (App.refreshTooltips) App.refreshTooltips();
        return r;
      };
      App.__singleSpoilerLangHook = true;
    }
  }
  if (document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();