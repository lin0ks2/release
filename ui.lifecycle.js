/*!
 * ui.lifecycle.js — Lexitron
 * Version: 1.5.0
 * Date: 2025-09-21
 *
 * Purpose:
 *  - Part of the Lexitron web app
 */
(function(){
  function afterAnswer(){
    try{
      if (window.App && App.Sets && typeof App.Sets.checkCompletionAndAdvance === 'function'){
        App.Sets.checkCompletionAndAdvance();
      }
    }catch(e){}
    try{ if (window.App && App.Stats && App.Stats.recomputeAndRender) App.Stats.recomputeAndRender(); }catch(e){}
  }
  function afterSetChange(){
    try{ if (window.App && App.Stats && App.Stats.recomputeAndRender) App.Stats.recomputeAndRender(); }catch(e){}
  }
  function hook(name, fn){
    var w = window;
    if (typeof w[name] !== 'function') return;
    var orig = w[name];
    w[name] = function(){
      var r = orig.apply(this, arguments);
      try{ fn(); }catch(e){}
      return r;
    };
  }
  hook('onChoice', afterAnswer);
  hook('onIDontKnow', afterAnswer);
  hook('nextWord', afterAnswer);

  // wrap set change
  try{
    if (window.App && App.Sets && typeof App.Sets.setActiveSetIndex === 'function'){
      var _set = App.Sets.setActiveSetIndex;
      App.Sets.setActiveSetIndex = function(i){
        var r = _set.apply(this, arguments);
        try{ afterSetChange(); }catch(e){}
        return r;
      };
    }
  }catch(e){}
})();
/* -------------------------------  К О Н Е Ц  ------------------------------- */
