/* =========================================================================
   Info modal (single, clean impl) — tabs + correct i18n title
   Safe against duplicates; builds tabs only if missing.
   Date: 2025-10-14
   ========================================================================= */
(function(){
  'use strict';
  var modal = document.getElementById('infoModal');
  if (!modal) return;

  // helpers
  function I(){ try{ return (typeof App==='object' && typeof App.i18n==='function') ? (App.i18n()||{}) : {}; }catch(_){ return {}; } }
  function Dflt(){
    var L = (App&&App.settings&&App.settings.lang)||'uk';
    var map={
      ru:{title:'Информация', instr:'Инструкция', about:'О программе', ok:'OK', upd:'Проверить обновления', key:'Ключ регистрации', reg:'Зарегистрировать', licensed:'Зарегистрировано', notLicensed:'Не зарегистрировано'},
      uk:{title:'Інформація', instr:'Інструкція', about:'Про програму', ok:'OK', upd:'Перевірити оновлення', key:'Ключ реєстрації', reg:'Зареєструвати', licensed:'Зареєстровано', notLicensed:'Не зареєстровано'},
      en:{title:'Information', instr:'Instruction', about:'About', ok:'OK', upd:'Check for updates', key:'Registration key', reg:'Register', licensed:'Licensed', notLicensed:'Not licensed'}
    }; return map[L]||map.ru;
  }

  // ensure frame
  var frame = modal.querySelector('.modalFrame');
  if (!frame){
    frame = document.createElement('div');
    frame.className='modalFrame';
    modal.appendChild(frame);
  }

  // Build UI once (idempotent)
  if (!modal.__infoUIBuilt){
    frame.innerHTML = ''
      + '<div class="modalHeader">'
      +   '<div class="modalTitle" id="infoTitle"></div>'
      +   '<button class="iconBtn small" id="infoClose" aria-label="Close">✖️</button>'
      + '</div>'
      + '<div id="infoTabs" class="tabs" role="tablist" aria-label="Info">'
      +   '<button class="tab" id="tab-instr" role="tab" aria-controls="panel-instr" aria-selected="true" tabindex="0"></button>'
      +   '<button class="tab" id="tab-about" role="tab" aria-controls="panel-about" aria-selected="false" tabindex="-1"></button>'
      + '</div>'
      + '<div class="modalBody">'
      +   '<section id="panel-instr" class="tabPanel" role="tabpanel" aria-labelledby="tab-instr">'
      +     '<div id="infoContent" class="infoContent scrollArea"></div>'
      +   '</section>'
      +   '<section id="panel-about" class="tabPanel hidden" role="tabpanel" aria-labelledby="tab-about">'
      +     '<div class="aboutGrid">'
      +       '<div class="aboutRow"><div class="aboutLabel">Версия</div><div class="aboutValue"><span id="appVersion">—</span></div></div>'
      +       '<div class="aboutRow"><div class="aboutLabel">Статус</div><div class="aboutValue"><span id="licStatus">—</span> <span id="licUser" class="muted"></span></div></div>'
      +     '</div>'
      +     '<div class="actionsRow"><button id="btnCheckUpdates" class="btnPill"></button></div>'
      +     '<div class="aboutSep"></div>'
      +     '<div class="regBlock">'
      +       '<label for="regKey" id="regKeyLabel"></label>'
      +       '<div class="regRow">'
      +         '<input id="regKey" type="text" inputmode="latin" autocomplete="off" placeholder="XXXX-XXXX-XXXX-XXXX">'
      +         '<button id="btnRegister" class="btnPill"></button>'
      +       '</div>'
      +       '<div id="regHint" class="muted" style="display:none"></div>'
      +     '</div>'
      +   '</section>'
      + '</div>'
      + '<div class="modalActions" style="text-align:center"><button id="infoOk" class="primary">OK</button></div>';
    modal.__infoUIBuilt = true;
  }

  // nodes
  var okBtn = document.getElementById('infoOk');
  var xBtn  = document.getElementById('infoClose');
  var titleEl  = document.getElementById('infoTitle');
  var infoBtn  = document.getElementById('btnInfo');
  var bodyEl   = document.getElementById('infoContent');
  var tabInstr = document.getElementById('tab-instr');
  var tabAbout = document.getElementById('tab-about');
  var panelInstr = document.getElementById('panel-instr');
  var panelAbout = document.getElementById('panel-about');
  var verEl = document.getElementById('appVersion');
  var licStatusEl = document.getElementById('licStatus');
  var licUserEl   = document.getElementById('licUser');
  var btnUpd = document.getElementById('btnCheckUpdates');
  var regKeyLabel = document.getElementById('regKeyLabel');
  var btnReg = document.getElementById('btnRegister');

  // fill labels/content
  function fill(){
    var tr = I(), df = Dflt();
    var title = (tr.infoTitle!=null?String(tr.infoTitle):df.title);
    var tab1  = (tr.tabInstruction!=null?String(tr.tabInstruction):df.instr);
    var tab2  = (tr.tabAbout!=null?String(tr.tabAbout):df.about);
    if (title===tab1) title=df.title; // страховка на случай неправильного ключа

    if (titleEl) titleEl.textContent = title;
    tabInstr.textContent = tab1;
    tabAbout.textContent = tab2;
    if (okBtn) okBtn.textContent = (tr.ok||df.ok);
    btnUpd.textContent = (tr.checkUpdates||df.upd);
    regKeyLabel.textContent = (tr.regKey||df.key);
    btnReg.textContent = (tr.register||df.reg);
    // убираем заглушки
    var hint = document.getElementById('regHint'); if (hint){ hint.textContent=''; hint.style.display='none'; }

    // steps text
    if (Array.isArray(tr.infoSteps) && bodyEl){
      bodyEl.innerHTML = '<ul>' + tr.infoSteps.map(function(s){ return '<li>'+String(s||'')+'</li>'; }).join('') + '</ul>';
    }

    // version / license
    var meta = {
      version: (App&&App.meta&&App.meta.version) || App.version || App.APP_VER || (document.querySelector('.ver')?.textContent || '—'),
      licensed: !!(App&&App.lic&&App.lic.isActivated),
      name: (App&&App.lic&&App.lic.userName)||''
    };
    verEl.textContent = String(meta.version||'—');
    licStatusEl.textContent = meta.licensed ? (tr.licensed||df.licensed) : (tr.notLicensed||df.notLicensed);
    if (meta.licensed && meta.name) licUserEl.textContent = '— ' + meta.name;
    else licUserEl.textContent = '';
  }

  // tabs
  function switchTab(which){
    var instr = (which==='instr');
    tabInstr.classList.toggle('active', instr);
    tabAbout.classList.toggle('active', !instr);
    panelInstr.classList.toggle('hidden', !instr);
    panelAbout.classList.toggle('hidden', instr);
    tabInstr.setAttribute('aria-selected', instr?'true':'false');
    tabAbout.setAttribute('aria-selected', !instr?'true':'false');
  }
  tabInstr.addEventListener('click', function(){ switchTab('instr'); }, {passive:true});
  tabAbout.addEventListener('click', function(){ switchTab('about'); }, {passive:true});

  // open/close
  function open(){ fill(); switchTab('instr'); modal.classList.remove('hidden'); }
  function close(){ modal.classList.add('hidden'); }

  if (okBtn) okBtn.addEventListener('click', close, {passive:true});
  if (xBtn)  xBtn.addEventListener('click', close, {passive:true});
  var infoBtnEl = document.getElementById('btnInfo');
  if (infoBtnEl) infoBtnEl.addEventListener('click', function(e){ e.preventDefault&&e.preventDefault(); open(); }, {passive:false});
  modal.addEventListener('click', function(e){ if (e.target===modal) close(); }, {passive:true});

  // check updates via SW + core script version
  async function fetchRemoteVersion(){
    try{
      const r = await fetch('./app.ui.view.js?ts='+Date.now(), {cache:'no-store'});
      const txt = await r.text();
      const m = txt.match(/Version:\s*([\d.]+)/i) || txt.match(/APP_VER\s*=\s*['"]([^'"]+)['"]/);
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
  btnUpd.addEventListener('click', async function(){
    const current = (document.querySelector('.ver')?.textContent || App.APP_VER || '—');
    const remote = await fetchRemoteVersion();
    const sw = await updateServiceWorker();
    if ((remote && remote!==current) || sw.waiting){
      if (confirm((I().checkUpdates || Dflt().upd) + ': ' + (remote||'') + '. Перезагрузить?')){
        if (sw.waiting) await applyUpdate(sw.reg); else location.reload();
      }
    } else {
      alert((I().checkUpdates || Dflt().upd) + ': обновлений нет. ('+current+')');
    }
  });

  // initial fill to localize title of the trigger button as well
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', fill, {once:true});
  else fill();
})();