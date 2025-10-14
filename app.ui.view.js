/* === Info Modal: fixed i18n title & tab labels (scoped) — 2025-10-14 === */
(function(){
  try{
    const modal = document.getElementById('infoModal');
    if (!modal) return;
    const frame = modal.querySelector('.modalFrame');
    if (!frame) return;

    function fillLabels(){
      const L = (window.App && App.settings && App.settings.lang) || 'uk';
      const t = (window.I18N && (I18N[L] || I18N.uk)) || {};
      const defMap = {
        ru:{title:'Информация', instr:'Инструкция', about:'О программе'},
        uk:{title:'Інформація', instr:'Інструкція', about:'Про програму'},
        en:{title:'Information', instr:'Instruction', about:'About'}
      };
      const def = defMap[L] || defMap.ru;

      let title = (t.infoTitle != null) ? String(t.infoTitle) : def.title;
      const tabInstrText = (t.tabInstruction != null) ? String(t.tabInstruction) : def.instr;
      const tabAboutText = (t.tabAbout != null) ? String(t.tabAbout) : def.about;
      if (title === tabInstrText) title = def.title;

      const titleEl = document.getElementById('infoTitle');
      const ti = document.getElementById('tab-instr');
      const ta = document.getElementById('tab-about');
      if (titleEl) titleEl.textContent = title;
      if (ti) ti.textContent = tabInstrText;
      if (ta) ta.textContent = tabAboutText;

      // скрываем заглушку
      const regHintEl = document.getElementById('regHint');
      if (regHintEl){ regHintEl.textContent=''; regHintEl.style.display='none'; }
    }

    function ensureOnShow(){
      fillLabels();
      const panelInstr = document.getElementById('panel-instr');
      const panelAbout = document.getElementById('panel-about');
      const tabInstr = document.getElementById('tab-instr');
      const tabAbout = document.getElementById('tab-about');
      if (panelInstr && panelAbout && tabInstr && tabAbout){
        panelInstr.classList.remove('hidden');
        panelAbout.classList.add('hidden');
        tabInstr.classList.add('active');
        tabAbout.classList.remove('active');
      }
    }

    // observe show
    try{
      const obs = new MutationObserver(()=>{ if (!modal.classList.contains('hidden')) ensureOnShow(); });
      obs.observe(modal,{attributes:true, attributeFilter:['class']});
    }catch(_){}

  }catch(e){ console.warn('Info modal title/tab fix error', e); }
})();