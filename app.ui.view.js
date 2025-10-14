/* === Info Modal: tabs + i18n title/labels + update checker (2025-10-14) === */
(function(){
  try{
    const modal = document.getElementById('infoModal');
    if (!modal) return;

    // Ensure base attributes
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-labelledby','infoTitle');
    modal.setAttribute('aria-describedby','infoTabs');

    // Frame
    let frame = modal.querySelector('.modalFrame');
    if (!frame){
      frame = document.createElement('div');
      frame.className = 'modalFrame';
      modal.appendChild(frame);
    }
    frame.setAttribute('tabindex','-1');

    // UI
    frame.innerHTML = `
      <div class="modalHeader">
        <div class="modalTitle" id="infoTitle"></div>
        <button class="iconBtn small" id="infoClose" aria-label="Close">✖️</button>
      </div>
      <div id="infoTabs" class="tabs" role="tablist" aria-label="Info">
        <button class="tab" id="tab-instr" role="tab" aria-controls="panel-instr" aria-selected="true" tabindex="0"></button>
        <button class="tab" id="tab-about" role="tab" aria-controls="panel-about" aria-selected="false" tabindex="-1"></button>
      </div>
      <div class="modalBody">
        <section id="panel-instr" class="tabPanel" role="tabpanel" aria-labelledby="tab-instr">
          <div id="infoContent" class="infoContent scrollArea"></div>
        </section>
        <section id="panel-about" class="tabPanel hidden" role="tabpanel" aria-labelledby="tab-about">
          <div class="aboutGrid">
            <div class="aboutRow">
              <div class="aboutLabel">Версия</div>
              <div class="aboutValue"><span id="appVersion">—</span></div>
            </div>
            <div class="aboutRow">
              <div class="aboutLabel">Статус</div>
              <div class="aboutValue">
                <span id="licStatus">—</span>
                <span id="licUser" class="muted"></span>
              </div>
            </div>
          </div>
          <div class="actionsRow">
            <button id="btnCheckUpdates" class="btnPill"></button>
          </div>
          <div class="aboutSep"></div>
          <div class="regBlock">
            <label for="regKey" id="regKeyLabel"></label>
            <div class="regRow">
              <input id="regKey" type="text" inputmode="latin" autocomplete="off" placeholder="XXXX-XXXX-XXXX-XXXX">
              <button id="btnRegister" class="btnPill"></button>
            </div>
            <div id="regHint" class="muted"></div>
          </div>
        </section>
      </div>
      <div class="modalActions" style="text-align:center">
        <button id="infoOk" class="primary">OK</button>
      </div>
    `;

    // Nodes
    const tabInstr = document.getElementById('tab-instr');
    const tabAbout = document.getElementById('tab-about');
    const panelInstr = document.getElementById('panel-instr');
    const panelAbout = document.getElementById('panel-about');
    const titleEl = document.getElementById('infoTitle');
    const okBtn = document.getElementById('infoOk');
    const xBtn = document.getElementById('infoClose');
    const bodyEl = document.getElementById('infoContent');
    const verEl = document.getElementById('appVersion');
    const licStatusEl = document.getElementById('licStatus');
    const licUserEl = document.getElementById('licUser');
    const btnUpdates = document.getElementById('btnCheckUpdates');
    const regKeyLabel = document.getElementById('regKeyLabel');
    const btnRegister = document.getElementById('btnRegister');
    const regKeyEl = document.getElementById('regKey');
    const regHintEl = document.getElementById('regHint');

    // i18n helpers
    function L(){ return (window.App && App.settings && App.settings.lang) || 'uk'; }
    function pack(){
      const lang = L();
      return (window.I18N && (I18N[lang] || I18N.uk)) || {};
    }
    function defaults(){
      const lang = L();
      const map = {
        ru:{title:'Информация', instr:'Инструкция', about:'О программе', ok:'OK', upd:'Проверить обновления', regKey:'Ключ регистрации', reg:'Зарегистрировать', licensed:'Зарегистрировано', notLicensed:'Не зарегистрировано'},
        uk:{title:'Інформація', instr:'Інструкція', about:'Про програму', ok:'OK', upd:'Перевірити оновлення', regKey:'Ключ реєстрації', reg:'Зареєструвати', licensed:'Зареєстровано', notLicensed:'Не зареєстровано'},
        en:{title:'Information', instr:'Instruction', about:'About', ok:'OK', upd:'Check for updates', regKey:'Registration key', reg:'Register', licensed:'Licensed', notLicensed:'Not licensed'}
      };
      return map[lang] || map.ru;
    }

    function fillLabels(){
      const t = pack();
      const d = defaults();
      let title = (t.infoTitle!=null)?String(t.infoTitle):d.title;
      const tab1 = (t.tabInstruction!=null)?String(t.tabInstruction):d.instr;
      const tab2 = (t.tabAbout!=null)?String(t.tabAbout):d.about;
      // hotfix if wrong i18n mapping
      if (title === tab1) title = d.title;

      titleEl.textContent = title;
      tabInstr.textContent = tab1;
      tabAbout.textContent = tab2;
      okBtn.textContent = (t.ok || d.ok);
      btnUpdates.textContent = (t.checkUpdates || d.upd);
      regKeyLabel.textContent = (t.regKey || d.regKey);
      btnRegister.textContent = (t.register || d.reg);
      // remove registration hint
      regHintEl.textContent = '';
      regHintEl.style.display = 'none';
    }

    function switchTab(which){
      const instr = which==='instr';
      tabInstr.classList.toggle('active', instr);
      tabAbout.classList.toggle('active', !instr);
      panelInstr.classList.toggle('hidden', !instr);
      panelAbout.classList.toggle('hidden', instr);
      tabInstr.setAttribute('aria-selected', instr?'true':'false');
      tabAbout.setAttribute('aria-selected', !instr?'true':'false');
    }
    tabInstr.addEventListener('click', ()=> switchTab('instr'));
    tabAbout.addEventListener('click', ()=> switchTab('about'));

    function ensureOnShow(){
      fillLabels();
      switchTab('instr');
    }
    ensureOnShow();
    try{
      const obs = new MutationObserver(()=>{ if (!modal.classList.contains('hidden')) ensureOnShow(); });
      obs.observe(modal,{attributes:true, attributeFilter:['class']});
    }catch(_){}

    // Instruction content
    try{
      const t = pack();
      if (Array.isArray(t.infoSteps)){
        bodyEl.innerHTML = '<ul>' + t.infoSteps.map(s=>`<li>${String(s||'')}</li>`).join('') + '</ul>';
      }
    }catch(_){}

    // About data
    const meta = {
      version: (window.App && (App.meta && App.meta.version)) || (window.App && App.version) || (window.App && App.APP_VER) || '—',
      isActivated: !!(window.App && App.lic && App.lic.isActivated),
      userName: (window.App && App.lic && App.lic.userName) || ''
    };
    verEl.textContent = meta.version;
    licStatusEl.textContent = meta.isActivated ? defaults().licensed : defaults().notLicensed;
    if (meta.isActivated && meta.userName) licUserEl.textContent = '— ' + meta.userName;

    // Close
    function close(){ modal.classList.add('hidden'); }
    okBtn.addEventListener('click', close);
    document.getElementById('infoClose').addEventListener('click', close);
    modal.addEventListener('click', e=>{ if (e.target===modal) close(); });

    // Keyboard
    document.addEventListener('keydown', e=>{
      if (e.key==='Escape') close();
      if (e.key==='ArrowLeft' || e.key==='ArrowRight'){
        switchTab(tabInstr.classList.contains('active') ? 'about' : 'instr');
      }
    });

    // Updates via SW
    async function fetchRemoteVersion(){
      try{
        const r = await fetch('./app.core.js?ts='+Date.now(), {cache:'no-store'});
        const t = await r.text();
        const m = t.match(/APP_VER\s*=\s*['"]([^'"]+)['"]/);
        return m?m[1]:null;
      }catch(_){ return null; }
    }
    async function updateServiceWorker(){
      if(!('serviceWorker' in navigator)) return {waiting:false};
      const reg = await navigator.serviceWorker.getRegistration();
      if(!reg) return {waiting:false};
      await reg.update().catch(()=>{});
      if(reg.waiting) return {waiting:true, reg};
      return {waiting:false, reg};
    }
    async function applyUpdate(reg){
      const worker = reg.waiting || reg.installing;
      if(!worker) return;
      const changed = new Promise(res=>navigator.serviceWorker.addEventListener('controllerchange',()=>res(),{once:true}));
      worker.postMessage({type:'SKIP_WAITING'});
      await changed; location.reload();
    }
    btnUpdates.addEventListener('click', async ()=>{
      const current = meta.version;
      const remote = await fetchRemoteVersion();
      const sw = await updateServiceWorker();
      if ((remote && remote !== current) || sw.waiting){
        if (confirm(`${defaults().upd}: ${remote || ''}. Перезагрузить?`)){
          if (sw.waiting) await applyUpdate(sw.reg);
          else location.reload();
        }
      } else {
        alert(`${defaults().upd}: обновлений нет. (${current})`);
      }
    });

    // Expose opener if external button exists
    const infoBtn = document.getElementById('btnInfo');
    if (infoBtn) infoBtn.addEventListener('click', ensureOnShow);
  }catch(e){ console.warn('Info modal final patch error', e); }
})();