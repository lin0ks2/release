/*
******************************************************************
 Version: 1.5 • Updated: 2025-10-10 • File: release-main/dicts.js 
******************************************************************
*/
(function(){
  'use strict';

  // плейсхолдеры колод (как в прежних сборках)
  window.decks = window.decks || {};
  if (!Array.isArray(window.decks.de_verbs)) window.decks.de_verbs = [];
  if (!Array.isArray(window.decks.de_nouns)) window.decks.de_nouns = [];

  function i18n(){
    try { return (window.App && typeof App.i18n === 'function') ? (App.i18n()||{}) : {}; }
    catch(_) { return {}; }
  }

  function ensureHeader(modal){
    const dialog = modal && modal.querySelector('.dialog');
    if (!dialog) return {header:null,title:null,closeBtn:null};

    // 1) .modalHeader
    let header = dialog.querySelector('.modalHeader');
    if (!header){
      header = document.createElement('div');
      header.className = 'modalHeader';
      // ставим САМЫМ первым элементом в .dialog
      dialog.insertBefore(header, dialog.firstChild);
    }

    // Флекс-раскладка (на случай отсутствия CSS)
    header.classList.add('flex-between');
    
    

    // 2) Заголовок #modalTitle
    let title = dialog.querySelector('#modalTitle');
    if (!title){
      title = document.createElement('h2');
      title.id = 'modalTitle';
      title.textContent = 'Словари';
    } else if (title.parentElement) {
      title.parentElement.removeChild(title);
    }
    if (!title.classList.contains('modalTitle')) title.classList.add('modalTitle');
    header.insertBefore(title, header.firstChild);

    // 3) Крестик #modalClose
    let closeBtn = dialog.querySelector('#modalClose') || modal.querySelector('#modalClose');
    if (!closeBtn){
      closeBtn = document.createElement('button');
      closeBtn.id = 'modalClose';
      closeBtn.className = 'iconBtn small';
      closeBtn.setAttribute('aria-label','Close');
      closeBtn.textContent = '✖️';
    } else if (closeBtn.parentElement) {
      closeBtn.parentElement.removeChild(closeBtn);
    }
    header.appendChild(closeBtn);

    // Удалить возможные ДУБЛИКАТЫ #modalClose, оставив только тот, что в header:
    modal.querySelectorAll('#modalClose').forEach(btn => {
      if (btn !== closeBtn) btn.remove();
    });

    return {header, title, closeBtn};
  }

  function wireModal(){
    const modal    = document.getElementById('modal');
    if (!modal) return;

    // Привести структуру
    const {title, closeBtn} = ensureHeader(modal);

    const okBtn   = modal.querySelector('#okBtn');
    const backdrop= modal.querySelector('#backdrop');

    // Локализация
    function fill(){
      const t = i18n();
      if (title && t.modalTitle) title.textContent = t.modalTitle;
      if (okBtn) okBtn.textContent = t.ok || 'OK';
    }

    function close(){ modal.classList.add('hidden'); }

    if (okBtn)    okBtn.addEventListener('click', close);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fill, {once:true});
    } else {
      fill();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireModal, {once:true});
  } else {
    wireModal();
  }
})();
