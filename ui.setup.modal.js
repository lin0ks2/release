/*
***************************************************************************
 Version: 1.5 • Updated: 2025-10-10 • File: release-main/ui.setup.modal.js 
***************************************************************************
*/
(function(){
  const LS = {
    uiLang: 'lexitron.uiLang',
    studyLang: 'lexitron.studyLang',
    deckKey: 'lexitron.deckKey',
    setupDone: 'lexitron.setupDone',
    legacyActiveKey: 'lexitron.activeKey'
  };
  const FLAG_EMOJI = { ru:'🇷🇺', uk:'🇺🇦', en:'🇬🇧', de:'🇩🇪', es:'🇪🇸', fr:'🇫🇷', it:'🇮🇹', pl:'🇵🇱', sr:'🇷🇸', tr:'🇹🇷' };

  function get(k, d){ try{ const v = localStorage.getItem(k); return v===null?d:v; }catch(_){ return d; } }
  function set(k, v){ try{ localStorage.setItem(k, v); }catch(_){ } }

  function deviceLang(){
    try{
      const nav = (navigator.language || (navigator.languages && navigator.languages[0]) || '').toLowerCase();
      if (nav.indexOf('ru') === 0) return 'ru';
      if (nav.indexOf('uk') === 0) return 'uk';
    }catch(_){}
    return 'ru'; // default
  }

  function L(lang){
    const l=(lang||'').toLowerCase();
    const map={
      ru:{setupTitle:'Начальная настройка', uiLanguage:'Язык интерфейса', studyLanguage:'Язык тренировки', chooseDeck:'Выберите словарь', ok:'OK', modeNormal:'Обычный режим', modeHard:'Сложный режим'},
      uk:{setupTitle:'Початкове налаштування', uiLanguage:'Мова інтерфейсу', studyLanguage:'Мова тренування', chooseDeck:'Оберіть словник', ok:'OK', modeNormal:'Звичайний режим', modeHard:'Складний режим'},
      en:{setupTitle:'Initial setup', uiLanguage:'Interface language', studyLanguage:'Study language', chooseDeck:'Choose deck', ok:'OK', modeNormal:'Normal mode', modeHard:'Hard mode'}
    };
    return map[l]||map.ru;
  }
  function T(key, def, eff){
    try{
      const lang = eff || (get(LS.uiLang) || (window.App&&App.settings&&App.settings.lang) || 'uk');
      const bag = (window.I18N && I18N[lang]) || (I18N && I18N.uk) || {};
      return bag[key] || def || key;
    }catch(_){ return def || key; }
  }
  function effectiveLang(){
    const ls = get(LS.uiLang);
    if (ls) return String(ls).toLowerCase();
    const appLang = (window.App&&App.settings&&App.settings.lang) ? String(App.settings.lang).toLowerCase() : '';
    return (appLang || deviceLang());
  }

  function build(){
    // Ensure LS.uiLang is set to the effective language so flags, labels, and fallback match
    const eff = effectiveLang();
    if (!get(LS.uiLang)) set(LS.uiLang, eff);
    if (window.App && App.settings) {
      App.settings.lang = eff;
      try{ App.saveSettings && App.saveSettings(App.settings); }catch(_){}
    }

    const m = document.createElement('div');
    m.id = 'setupModal';
    m.className = 'modal hidden';
    m.setAttribute('role','dialog');
    m.setAttribute('aria-modal','true');

    const labelSetup = T('setupTitle', L(eff).setupTitle, eff);
    const labelUi = T('uiLanguage', L(eff).uiLanguage, eff);
    const labelStudy = T('studyLanguage', L(eff).studyLanguage, eff);
    const labelOk = T('ok', L(eff).ok, eff) || T('confirm', L(eff).ok, eff);

    m.innerHTML = `
      <div class="backdrop"></div>
      <div class="dialog">
        <div class="modalHeader">
          <h3 class="modalTitle">${labelSetup}</h3>
        </div>
        <div id="langFlags">
          <div class="field">
            <div class="label">${labelUi}</div>
            <div class="langFlags flagsRow" id="setupUiFlags"></div>
          </div>
          <div class="field">
            <div class="label">${labelStudy}</div>
            <div class="langFlags flagsRow" id="setupStudyFlags"></div>
          </div>

        <!-- Mode toggle in setup -->
        <div id="setupModeToggleWrap" class="field flex-center gap-10 mt-10">
          <label for="setupModeToggle" class="flex-center gap-10 cursor-pointer">
            <span data-i18n="modeNormal">${T('modeNormal', (L(eff).modeNormal||'Обычный режим'), eff)}</span>
            <input id="setupModeToggle" type="checkbox" role="switch" aria-checked="false" />
            <span data-i18n="modeHard">${T('modeHard', (L(eff).modeHard||'Сложный режим'), eff)}</span>
          </label>
        </div>

        </div>
        <div class="modalActions">
          <button id="setupConfirm" class="primary" disabled>${labelOk}</button>
        </div>
      </div>`;
    document.body.appendChild(m);

    // Theme sync if not set yet
    try{
      const body=document.body;
      if (!body.getAttribute('data-theme')){
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const root=document.documentElement;
        root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      }
    }catch(_){}

    const uiFlagsEl = m.querySelector('#setupUiFlags');
    const studyFlagsEl = m.querySelector('#setupStudyFlags');
    const okBtn = m.querySelector('#setupConfirm');

    const modeEl = m.querySelector('#setupModeToggle');
    // Initialize from current App mode (checked = hard)
    try{
      const isHard = (window.App && App.getMode && App.getMode()==='hard');
      if (modeEl){
        modeEl.checked = !!isHard;
        modeEl.setAttribute('aria-checked', String(!!isHard));
        modeEl.addEventListener('change', function(){
          // No confirmation in setup; just reflect UI state
          modeEl.setAttribute('aria-checked', String(!!modeEl.checked));
        }, {passive:true});
      }
    }catch(_){}


    function activeUi(){ return (uiFlagsEl.querySelector('.flagBtn.active')?.dataset.code)||eff; }
    function activeStudy(){ return (studyFlagsEl.querySelector('.flagBtn.active')?.dataset.code)||null; }

    function rerenderStaticLabels(code){
      const lab = L(code);
      m.querySelector('.modalTitle').textContent = (I18N[code]?.setupTitle)||lab.setupTitle;
      m.querySelectorAll('.field .label')[0].textContent = (I18N[code]?.uiLanguage)||lab.uiLanguage;
      m.querySelectorAll('.field .label')[1].textContent = (I18N[code]?.studyLanguage)||lab.studyLanguage;
      okBtn.textContent = (I18N[code]?.ok || I18N[code]?.confirm || lab.ok);
      // Update mode toggle labels too
      try{
        const normalSpan = m.querySelector('#setupModeToggleWrap [data-i18n="modeNormal"]');
        const hardSpan = m.querySelector('#setupModeToggleWrap [data-i18n="modeHard"]');
        if (normalSpan) normalSpan.textContent = (I18N[code]?.modeNormal) || lab.modeNormal || 'Обычный режим';
        if (hardSpan)   hardSpan.textContent   = (I18N[code]?.modeHard)   || lab.modeHard   || 'Сложный режим';
      }catch(_){}

    }

    function renderUiFlags(){
      uiFlagsEl.innerHTML='';
      const current = effectiveLang();
      const candidates = Object.keys(window.I18N||{}).filter(x=>['ru','uk','en'].includes(x));
      (candidates.length?candidates:['ru','uk']).forEach(code=>{
        const b=document.createElement('button');
        b.className='flagBtn'+(code===current?' active':'');
        b.title=code.toUpperCase();
        b.textContent = (window.FLAG_EMOJI?.[code]) || (typeof FLAG_EMOJI!=='undefined' && FLAG_EMOJI[code]) || code.toUpperCase();
        b.dataset.code=code;
        b.addEventListener('click',()=>{
          uiFlagsEl.querySelectorAll('.flagBtn').forEach(x=>x.classList.remove('active'));
          b.classList.add('active');
          set(LS.uiLang, code);
          if (window.App && App.settings) {
            App.settings.lang = code;
            try{ App.saveSettings && App.saveSettings(App.settings); }catch(_){}
          }
          rerenderStaticLabels(code);
        });
        uiFlagsEl.appendChild(b);
      });
    }

    function builtinKeys(){
      try{
        if (window.App && App.Decks && typeof App.Decks.builtinKeys==='function') return App.Decks.builtinKeys();
        return Object.keys(window.decks||{});
      }catch(_){ return []; }
    }
    function firstDeckForLang(lang){
      const pref = (lang||'').toLowerCase() + '_';
      const keys = builtinKeys().filter(k => String(k).startsWith(pref));
      const preferred = pref + 'verbs';
      if (keys.includes(preferred)) return preferred;
      return keys[0] || null;
    }

    function renderStudyFlags(){
      studyFlagsEl.innerHTML='';
      const langs = Array.from(new Set(builtinKeys().map(k=>k.split('_')[0]))).filter(Boolean);
      let cur = (get(LS.studyLang) || '').toLowerCase();
      if (!cur){
        const dk = get(LS.deckKey);
        if (dk) cur = String(dk).split('_')[0] || '';
      }
      langs.forEach(code=>{
        const b=document.createElement('button');
        b.className='flagBtn'+(code===cur?' active':'');
        b.title=code.toUpperCase();
        b.textContent = (window.FLAG_EMOJI?.[code]) || (typeof FLAG_EMOJI!=='undefined' && FLAG_EMOJI[code]) || code.toUpperCase();
        b.dataset.code=code;
        b.addEventListener('click', ()=>{
          studyFlagsEl.querySelectorAll('.flagBtn').forEach(x=>x.classList.remove('active'));
          b.classList.add('active');
          set(LS.studyLang, code);
          const first = firstDeckForLang(code);
          if (first){ set(LS.deckKey, first); }
          okBtn.disabled = !first;
        });
        studyFlagsEl.appendChild(b);
      });
      if (cur){
        const first = firstDeckForLang(cur);
        if (first){ set(LS.deckKey, first); okBtn.disabled = false; }
      }
    }

    renderUiFlags();
    renderStudyFlags();
    okBtn.disabled = !get(LS.deckKey);

    // open modal
    m.classList.remove('hidden');

    okBtn.addEventListener('click', ()=>{
      
      // Persist chosen mode from setup toggle (no confirmation)
      try{
        const modeEl = m.querySelector('#setupModeToggle');
        const chosenMode = (modeEl && modeEl.checked) ? 'hard' : 'normal';
        if (window.App){
          window.App.settings = window.App.settings || {};
          window.App.settings.mode = chosenMode;
          try{ window.localStorage.setItem('lexitron.mode', chosenMode); }catch(_){}
          try{ App.saveSettings && App.saveSettings(window.App.settings); }catch(_){}
        } else {
          try{ window.localStorage.setItem('lexitron.mode', chosenMode); }catch(_){}
        }
      }catch(_){}
const ui = activeUi() || effectiveLang();
      const st = activeStudy() || get(LS.studyLang) || '';
      let dk = get(LS.deckKey);
      if (!dk && st){ dk = firstDeckForLang(st); if (dk) set(LS.deckKey, dk); }
      if (!dk) return;

      set(LS.uiLang, ui);
      set(LS.studyLang, st);
      set(LS.deckKey, dk);
      set(LS.setupDone, 'true');
      set(LS.legacyActiveKey, dk);

      if (window.App && App.settings){
        App.settings.lang = ui;
        try{ App.saveSettings && App.saveSettings(App.settings); }catch(_){}
      }

      m.remove();
      try{ document.body && document.body.removeAttribute('data-theme'); }catch(_){}
      if (window.App && App.applyTheme) App.applyTheme();

      // notify
      try{ document.dispatchEvent(new CustomEvent('i18n:lang-changed', { detail:{ lang: ui } })); }catch(_){}
      document.dispatchEvent(new CustomEvent('lexitron:setup:done', { detail:{ uiLang:ui, studyLang:st, deckKey:dk } }));
    });
  }

  function shouldShow(){
    try{
      var force = /(?:\?|&)setup=1(?:&|$)/.test(location.search);
      if (force) return true;
    }catch(_){}
    try{
    var dk = localStorage.getItem('lexitron.deckKey') || localStorage.getItem('lexitron.activeKey');
    if (!dk) return true;
    var okLen = 0;
    try {
      if (dk === 'fav' || dk === 'favorites') {
        okLen = (window.App && App.Favorites && typeof App.Favorites.deck==='function') ? (App.Favorites.deck()||[]).length : 0;
      } else if (dk === 'mistakes') {
        okLen = (window.App && App.Mistakes && typeof App.Mistakes.deck==='function') ? (App.Mistakes.deck()||[]).length : 0;
      } else if (window.decks && Array.isArray(window.decks[dk])) {
        okLen = window.decks[dk].length;
      }
    } catch(_) { okLen = 0; }
    if (okLen < 4) return true;
  }catch(_){ return true; }
    return get(LS.setupDone) !== 'true';
  }

  window.SetupModal = { build, shouldShow, LS };
})();

/* ---- MERGED FROM: info.modal.patch.js ---- */
/*!
 * info.modal.patch.js — Modal "Инструкция" unified header/footer
 * Version: 1.6.2
 * - Adds OK button handling
 * - Localizes tooltip on Info button as "Инструкция"/"Інструкція"
 * - Keeps list rendering from i18n.infoSteps
 */
(function(){
  'use strict';
  var infoBtn   = document.getElementById('btnInfo');
  var modal     = document.getElementById('infoModal');
  var titleEl   = document.getElementById('infoTitle');
  var contentEl = document.getElementById('infoContent');
  var closeEl   = document.getElementById('infoClose');
  var okEl      = document.getElementById('infoOk');

  function t(){ try{ return (typeof App!=='undefined' && typeof App.i18n==='function') ? (App.i18n()||{}) : {}; }catch(_){ return {}; } }

  function fillFromI18n(){
    var tr = t();
    if (titleEl && tr.infoTitle) titleEl.textContent = tr.infoTitle;
    if (okEl) okEl.textContent = tr.ok || 'OK';
    if (infoBtn && tr.infoTitle) infoBtn.title = tr.infoTitle;

    if (Array.isArray(tr.infoSteps) && contentEl){
      contentEl.innerHTML = '';
      var ul = document.createElement('ul');
      tr.infoSteps.forEach(function(s){
        var li = document.createElement('li');
        li.textContent = String(s||'');
        ul.appendChild(li);
      });
      contentEl.appendChild(ul);
    }
  }

  function open(){ try{ fillFromI18n(); modal && modal.classList.remove('hidden'); }catch(_){ } }
  function close(){ try{ modal && modal.classList.add('hidden'); }catch(_){ } }

  if (infoBtn) infoBtn.addEventListener('click', open, {passive:true});
  if (closeEl) closeEl.addEventListener('click', close, {passive:true});
  if (okEl)    okEl.addEventListener('click', close,  {passive:true});
  if (modal)   modal.addEventListener('click', function(e){ if (e.target===modal) close(); }, {passive:true});

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', fillFromI18n, {once:true});
  else fillFromI18n();
})();

/* ---- MERGED FROM: settings.modal.patch.js ---- */
/*!
 * settings.modal.patch.js — Placeholder modal "Настройки"
 * Version: 1.6.2
 * - Mirrors Info modal structure/handlers
 * - Localizes title + button tooltip
 * - Body shows "Раздел в разработке" text from i18n.settingsInDev
 */
(function(){
  'use strict';
  var btn   = document.getElementById('btnSettings');
  var modal = document.getElementById('settingsModal');
  var title = document.getElementById('settingsTitle');
  var body  = document.getElementById('settingsContent');
  var close = document.getElementById('settingsClose');
  var ok    = document.getElementById('settingsOk');

  function t(){ try{ return (typeof App!=='undefined' && typeof App.i18n==='function') ? (App.i18n()||{}) : {}; }catch(_){ return {}; } }

  function fill(){}

  function open(){ try{ fill(); modal && modal.classList.remove('hidden'); }catch(_){ } }
  function closeM(){ try{ modal && modal.classList.add('hidden'); }catch(_){ } }

  if (btn)   btn.addEventListener('click', open, {passive:true});
  if (close) close.addEventListener('click', closeM, {passive:true});
  if (ok)    ok.addEventListener('click', closeM, {passive:true});
  if (modal) modal.addEventListener('click', function(e){ if (e.target===modal) closeM(); }, {passive:true});

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', fill, {once:true});
  else fill();
})();
