/*!
 * startup.manager.js — Lexitron
 * Version: 1.5.0
 * Date: 2025-09-21
 *
 * Purpose:
 *  - Part of the Lexitron web app
 */

(function(){
  const LS = {
    uiLang: 'lexitron.uiLang',
    studyLang: 'lexitron.studyLang',
    deckKey: 'lexitron.deckKey',
    setupDone: 'lexitron.setupDone',
    legacyActiveKey: 'lexitron.activeKey'
  };

  const M = (window.StartupManager = {
    log(...a){ try{ console.debug('[Startup]', ...a); }catch(_){}},
    get(k, d){ try{ const v = localStorage.getItem(k); return v===null?d:v; }catch(_){ return d; } },
    set(k, v){ try{ localStorage.setItem(k, v); }catch(_){ } },

    builtinKeys(){
      try{
        if (window.App && App.Decks && typeof App.Decks.builtinKeys==='function') return App.Decks.builtinKeys();
        return Object.keys(window.decks||{});
      }catch(_){ return []; }
    },
    firstLang(){
      const keys = M.builtinKeys();
      if (!keys.length) return null;
      const lang = String(keys[0]).split('_')[0] || null;
      return lang;
    },
    firstDeckForLang(lang){
      const keys = M.builtinKeys().filter(k=>String(k).startsWith((lang||'').toLowerCase()+'_'));
      return keys[0] || null;
    },
    deckExists(key){
      try { return key && window.decks && Array.isArray(window.decks[key]) && window.decks[key].length > 0; } catch(_){ return false; }
    },

    
    deckNonEmpty(key){
      try { return key && window.decks && Array.isArray(window.decks[key]) && window.decks[key].length > 0; } catch(_){ return false; }
    },
    firstNonEmptyForLang(lang){
      try{
        const pref = (lang||'').toLowerCase() + '_';
        const keys = M.builtinKeys().filter(k=>k.startsWith(pref));
        for (const k of keys){ if (M.deckNonEmpty(k)) return k; }
        return null;
      }catch(_){ return null; }
    },
    firstNonEmptyAny(){
      try{
        for (const k of M.builtinKeys()){ if (M.deckNonEmpty(k)) return k; }
        return null;
      }catch(_){ return null; }
    },

    firstForLang(lang){
      try{
        const pref = (lang||'').toLowerCase() + '_';
        const keys = M.builtinKeys().filter(k => k.startsWith(pref));
        const preferred = pref + 'verbs';
        if (keys.includes(preferred)) return preferred;
        return keys[0] || null;
      }catch(_){ return null; }
    },

    readSettings(){
      const uiLang = M.get(LS.uiLang) || (window.App && App.settings && App.settings.lang) || 'uk';
      const studyLang = M.get(LS.studyLang) || null;
      const deckKey = M.get(LS.deckKey) || M.get(LS.legacyActiveKey) || null;
      const setupDone = M.get(LS.setupDone) === 'true';
      return { uiLang: (uiLang||'uk').toLowerCase(), studyLang, deckKey, setupDone };
    },

    shouldShowSetup(initial){
      try{ if (/(?:\?|&)setup=1(?:&|$)/.test(location.search)) return true; }catch(_){}
      if (!initial.setupDone) return true;
      if (!M.deckExists(initial.deckKey)) return true;
      return false;
    },

    validateAndFix(initial){
      let { uiLang, studyLang, deckKey } = initial;
      // Apply UI lang early
      try{ if (window.App && App.settings) App.settings.lang = uiLang; M.set(LS.uiLang, uiLang); }catch(_){}

      if (M.deckNonEmpty(deckKey)){
        if (!studyLang) { try{ studyLang = String(deckKey).split('_')[0] || studyLang; }catch(_){} }
        return { uiLang, studyLang, deckKey };
      }
      if (studyLang){
        const first = M.firstForLang(studyLang);
        if (first) return { uiLang, studyLang, deckKey: first };
      }
      const lang = M.firstLang();
      const first = lang && M.firstForLang(lang);
      if (first) return { uiLang, studyLang: lang, deckKey: first };
      return { uiLang, studyLang: null, deckKey: null };
    },

    persist(state){
      if (state.uiLang) M.set(LS.uiLang, state.uiLang);
      if (state.studyLang) M.set(LS.studyLang, state.studyLang);
      if (state.deckKey) { M.set(LS.deckKey, state.deckKey); M.set(LS.legacyActiveKey, state.deckKey); }
    },

    applyFilters(state){
      try{ if (window.App && App.settings) App.settings.dictsLangFilter = state.studyLang || null; }catch(_){}
      try{ if (window.App && App.dictRegistry) App.dictRegistry.activeKey = state.deckKey; }catch(_){}
    },

    boot(state){
      if (!state.deckKey){
        console.error('[Startup] No deck to start'); 
        alert('Нет доступных словарей для старта.');
        return;
      }
      try{
        if (window.App && typeof App.bootstrap === 'function'){
          App.bootstrap();
          M.log('boot ok with deck', state.deckKey);
        } else {
          console.error('[Startup] App.bootstrap не найден');
        }
      }catch(e){ console.error('[Startup] boot failed', e); }
    },

    gate(){
      const initial = M.readSettings();
      M.log('initial', initial);

      if (M.shouldShowSetup(initial) && window.SetupModal && typeof SetupModal.build==='function'){
        M.log('show setup modal');
        document.addEventListener('lexitron:setup:done', function(){
          const after = M.readSettings();
          const fixed = M.validateAndFix(after);
          M.persist(fixed);
          M.applyFilters(fixed);
          M.set(LS.setupDone, 'true');
          M.boot(fixed);
        }, { once:true });
        SetupModal.build();
        return;
      }

      const fixed = M.validateAndFix(initial);
      M.persist(fixed);
      M.applyFilters(fixed);
      M.boot(fixed);
    }
  });
})();
/* -------------------------------  К О Н Е Ц  ------------------------------- */
