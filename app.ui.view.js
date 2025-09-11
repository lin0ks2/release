/* app.ui.view.js — stable build: mistakes + milestones + calm motivation */
(function () {
  const App = window.App || (window.App = {});
  const D = App.DOM || (App.DOM = {});

  // ────────────────────────────────────────────────────────────
  // helpers
  function getActiveDeck() {
    if (App.Trainer && typeof App.Trainer.safeGetDeckSlice === 'function') {
      return App.Trainer.safeGetDeckSlice(App.dictRegistry.activeKey) || [];
    }
    if (App.Trainer && typeof App.Trainer.getDeckSlice === 'function') {
      const slice = App.Trainer.getDeckSlice(App.dictRegistry.activeKey) || [];
      if (slice && slice.length) return slice;
    }
    return App.Decks.resolveDeckByKey(App.dictRegistry.activeKey) || [];
  }

  function current() {
    const deck = getActiveDeck();
    if (!deck.length) return { id: -1, word: '', uk: '', ru: '' };
    if (App.state.index < 0 || App.state.index >= deck.length) App.state.index = 0;
    return deck[App.state.index];
  }

  function decideModeForWord(w) {
    const succ = App.state.successes[w.id] || 0;
    let reverse = (succ >= App.Trainer.unlockThreshold()) ? (Math.random() < 0.5) : false;
    try {
      if (App.Penalties) {
        const p = App.Penalties.reverseProbFor(w.id);
        if (Math.random() < p) reverse = true;
      }
    } catch (e) {}
    return reverse;
  }

  function drawOptions(correct, pool) {
    const distractors = App.shuffle(pool).slice(0, 3);
    const variants = App.shuffle([correct, ...distractors]);
    variants.forEach(v => {
      const b = document.createElement('button');
      b.className = 'optionBtn';
      b.textContent = v;
      if (v === correct) b.dataset.correct = '1';
      b.addEventListener('click', () => onChoice(b, v === correct));
      D.optionsRow.appendChild(b);
    });
  }

  function addIDontKnowButton() {
    if (!D || !D.optionsRow) return;
    const t = (typeof App.i18n === 'function') ? App.i18n() : { iDontKnow: 'Не знаю' };
    const wrap = document.createElement('div');
    wrap.className = 'idkWrapper';
    const btn = document.createElement('button');
    btn.className = 'ghost';
    btn.textContent = t.iDontKnow || 'Не знаю';
    btn.addEventListener('click', onIDontKnow);
    wrap.appendChild(btn);
    D.optionsRow.appendChild(wrap);
  }

  function renderStars() {
    const w = current();
    try {
      if (App.dictRegistry.activeKey === 'mistakes' && App.Mistakes) App.Mistakes.onShow(w.id);
    } catch (e) {}
    const score = App.clamp(App.state.stars[w.id] || 0, 0, App.Trainer.starsMax());
    const host = D.starsEl;
    if (!host) return;
    host.innerHTML = '';
    for (let i = 0; i < App.Trainer.starsMax(); i++) {
      const s = document.createElement('span');
      s.className = 'starIcon' + (i < score ? ' filled' : '');
      s.textContent = '★';
      host.appendChild(s);
    }
  }

  function updateStats() {
    const t = App.i18n ? App.i18n() : { totalWords: 'Всего слов', learned: 'Выучено' };
    const key = (App.dictRegistry && App.dictRegistry.activeKey) || null;
    const fullDeck = (App.Decks && App.Decks.resolveDeckByKey) ? (App.Decks.resolveDeckByKey(key) || []) : [];
    const repeats = (App.Trainer && typeof App.Trainer.starsMax === 'function') ? App.Trainer.starsMax() : ((App.state && App.state.repeats) || 3);
    const starsMap = (App.state && App.state.stars) || {};
    let learned = 0;
    for (let i = 0; i < fullDeck.length; i++) if ((starsMap[fullDeck[i].id] || 0) >= repeats) learned++;
    if (App.DOM && App.DOM.statsBar) App.DOM.statsBar.textContent = `${t.totalWords || 'Всего слов'}: ${fullDeck.length} / ${(t.learned || 'Выучено')}: ${learned}`;
  }

  function getMistakesDistractorPool(currentWord) {
    try {
      const NEED = 3;
      const uniq = new Map();
      const push = (w) => { if (!w || !w.id || w.id === currentWord.id) return; uniq.set(String(w.id) + '::' + (w.word || w.ru || w.uk || ''), w); };

      if (App.Mistakes && typeof App.Mistakes.list === 'function') {
        const arr = App.Mistakes.list() || [];
        for (let i = 0; i < arr.length; i++) push(arr[i]);
      }
      let srcKey = null;
      try { srcKey = App.Mistakes && App.Mistakes.sourceKeyFor ? App.Mistakes.sourceKeyFor(currentWord.id) : null; } catch (e) {}
      if (srcKey) {
        const srcDeck = App.Decks.resolveDeckByKey(srcKey) || [];
        for (let i = 0; i < srcDeck.length; i++) push(srcDeck[i]);
      }
      if (uniq.size < NEED) {
        const keys = (App.Decks && App.Decks.builtinKeys) ? App.Decks.builtinKeys() : [];
        for (let k of keys) {
          const d = App.Decks.resolveDeckByKey(k) || [];
          for (let i = 0; i < d.length; i++) push(d[i]);
          if (uniq.size >= 20) break;
        }
      }
      return Array.from(uniq.values());
    } catch (e) { return []; }
  }

  // ────────────────────────────────────────────────────────────
  // render card
  function renderCard(force = false) {
    if (document.activeElement && document.activeElement.blur) {
      try { document.activeElement.blur(); } catch (e) {}
    }
    const deck = getActiveDeck();
    if (!deck.length) {
      if (App.dictRegistry.activeKey === 'mistakes') {
        const t = App.i18n ? App.i18n() : null;
        const msg = t && t.allMistakesDone ? t.allMistakesDone :
          (App.settings && App.settings.lang === 'uk' ? 'Усі помилки закриті!' : 'Все ошибки закрыты!');
        if (D.wordEl) D.wordEl.textContent = msg;
        if (D.hintEl) D.hintEl.textContent = '—';
        if (D.optionsRow) D.optionsRow.innerHTML = '';
        setTimeout(() => {
          App.dictRegistry.activeKey = App.Decks.pickDefaultKey();
          App.saveDictRegistry && App.saveDictRegistry();
          renderDictList();
          App.renderSetsBar();
          renderCard(true);
          updateStats();
        }, 900);
        return;
      } else {
        if (D.wordEl) D.wordEl.textContent = '—';
        if (D.hintEl) D.hintEl.textContent = '—';
        if (D.optionsRow) D.optionsRow.innerHTML = '';
        renderStars();
        updateStats();
        return;
      }
    }

    if (force || App.state.index === App.state.lastIndex) App.state.index = App.Trainer.sampleNextIndexWeighted(deck);
    const w = current();
    if (App.state.lastShownWordId !== w.id) {
      App.state.totals.shown += 1;
      App.state.lastShownWordId = w.id;
      App.state.lastSeen[w.id] = Date.now();
      App.saveState();
    }
    const t = App.i18n();
    const isReverse = decideModeForWord(w);

    renderStars();
    D.optionsRow.innerHTML = '';

    if (!isReverse) {
      if (D.wordEl) D.wordEl.textContent = w.word;
      let poolWords;
      if (App.dictRegistry.activeKey === 'mistakes') {
        poolWords = getMistakesDistractorPool(w).map(x => (App.settings.lang === 'ru' ? x.ru : x.uk));
      } else {
        poolWords = deck.filter(x => x.id !== w.id).map(x => (App.settings.lang === 'ru' ? x.ru : x.uk));
      }
      const correct = (App.settings.lang === 'ru') ? w.ru : w.uk;
      drawOptions(correct, poolWords);
    } else {
      if (D.wordEl) D.wordEl.textContent = (App.settings.lang === 'ru') ? w.ru : w.uk;
      let poolWords;
      if (App.dictRegistry.activeKey === 'mistakes') {
        poolWords = getMistakesDistractorPool(w).map(x => x.word);
      } else {
        poolWords = deck.filter(x => x.id !== w.id).map(x => x.word);
      }
      const correct = w.word;
      drawOptions(correct, poolWords);
    }

    if (D.hintEl) D.hintEl.textContent = t.choose;

    if (D.favBtn) {
      const dictKey = App.dictRegistry.activeKey;
      D.favBtn.textContent = (App.isFavorite && App.isFavorite(dictKey, w.id)) ? '♥' : '♡';
      D.favBtn.disabled = (App.dictRegistry.activeKey === 'fav');
    }

    addIDontKnowButton();
    updateStats();
  }

  // ────────────────────────────────────────────────────────────
  // mistakes add helper (без самозаполнения)
  function addToMistakesOnFailure(word) {
    if (!word) return;
    try {
      if (App && App.dictRegistry && App.dictRegistry.activeKey === 'mistakes') return; // no self-adding
      if (App && App.Mistakes && typeof App.Mistakes.add === 'function') {
        const dictKey = (App.dictRegistry && App.dictRegistry.activeKey) || null;
        App.Mistakes.add(String(word.id), dictKey);
      }
    } catch (e) {}
  }

  // ────────────────────────────────────────────────────────────
  // answers
  function onChoice(btn, correct) {
    const w = current();
    const cur = App.clamp(App.state.stars[w.id] || 0, 0, App.Trainer.starsMax());

    if (correct) {
      btn.classList.add('correct');
      D.optionsRow.querySelectorAll('button.optionBtn').forEach(b => b.disabled = true);
      App.state.stars[w.id] = App.clamp(cur + 1, 0, App.Trainer.starsMax());
      App.state.successes[w.id] = (App.state.successes[w.id] || 0) + 1;
      App.saveState();
      renderStars();
      updateStats();

      // milestones: learned 10/20/30...
      try {
        const repeats = App.Trainer.starsMax();
        let learned = 0;
        const all = (App.Decks.resolveDeckByKey(App.dictRegistry.activeKey) || []);
        for (let i = 0; i < all.length; i++) if ((App.state.stars[all[i].id] || 0) >= repeats) learned++;
        if (learned > 0 && learned % 10 === 0 && App.Milestones && App.Milestones.tryShow) {
          App.Milestones.tryShow('learned', { count: learned });
        }
      } catch (e) {}

      setTimeout(nextWord, 500);
      return;
    }

    // wrong
    btn.classList.add('wrong');
    btn.disabled = true;
    App.state.stars[w.id] = App.clamp(cur - 1, 0, App.Trainer.starsMax());
    App.state.totals.errors += 1;
    App.state.totals.sessionErrors = (App.state.totals.sessionErrors || 0) + 1;
    if (App.state.totals.sessionErrors % 5 === 0 && App.Milestones && App.Milestones.tryShow) {
      App.Milestones.tryShow('errors', { count: App.state.totals.sessionErrors });
    }
    addToMistakesOnFailure(w);
    App.saveState();
    renderStars();
    updateStats();
  }

  function onIDontKnow() {
    const w = current();
    const c = D.optionsRow.querySelector('button.optionBtn[data-correct="1"]');
    if (c) c.classList.add('correct');
    D.optionsRow.querySelectorAll('button.optionBtn').forEach(b => b.disabled = true);
    const cur = App.clamp(App.state.stars[w.id] || 0, 0, App.Trainer.starsMax());
    App.state.stars[w.id] = App.clamp(cur - 1, 0, App.Trainer.starsMax());
    App.state.totals.errors += 1;
    App.state.totals.sessionErrors = (App.state.totals.sessionErrors || 0) + 1;
    if (App.state.totals.sessionErrors % 5 === 0 && App.Milestones && App.Milestones.tryShow) {
      App.Milestones.tryShow('errors', { count: App.state.totals.sessionErrors });
    }
    addToMistakesOnFailure(w);
    App.saveState();
    renderStars();
    updateStats();
    setTimeout(function () {
      App.Sets.checkCompletionAndAdvance();
      nextWord();
    }, 700);
  }

  // ────────────────────────────────────────────────────────────
  // sets bar
  App.renderSetsBar = function () {
    const host = document.getElementById('setsBar');
    if (!host) return;
    host.innerHTML = '';
    const total = (App.Sets && App.Sets.setTotalCount) ? App.Sets.setTotalCount() : 1;
    const active = (App.Sets && App.Sets.getActiveSetIndex) ? App.Sets.getActiveSetIndex() : 0;
    for (let i = 0; i < total; i++) {
      const btn = document.createElement('button');
      btn.className = 'setTile' + (i === active ? ' active' : '') + (App.Sets.isSetDone(i) ? ' done' : '');
      btn.setAttribute('type', 'button');
      btn.setAttribute('aria-pressed', i === active ? 'true' : 'false');
      btn.textContent = (i + 1);
      btn.addEventListener('click', () => {
        App.Sets.setActiveSetIndex(i);
        App.switchToSetImmediate();
      });
      host.appendChild(btn);
    }
  };

  App.switchToSetImmediate = function () {
    const b = App.Sets.activeBounds();
    if (App.state.index < b.start || App.state.index >= b.end) App.state.index = b.start;
    renderCard(true);
    App.saveState && App.saveState();
  };

  // ────────────────────────────────────────────────────────────
  // milestones module (throttled modal)
  App.Milestones = App.Milestones || {};
  (function (M) {
    const LS = 'milestone.state.v1';
    const DEF = { lastShownAt: 0, shownBadges: {} };
    function load() {
      try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem(LS) || '{}')); }
      catch (e) { return { ...DEF }; }
    }
    function save(s) { try { localStorage.setItem(LS, JSON.stringify(s)); } catch (e) {} }
    const S = load();

    M.tryShow = function (type, payload) {
      const now = Date.now();
      if (now - (S.lastShownAt || 0) < 120000) return; // 2 min
      const modal = document.getElementById('milestoneModal'); if (!modal) return;
      const title = document.getElementById('milestoneTitle');
      const text = document.getElementById('milestoneText');
      const ok = document.getElementById('milestoneOk');
      const t = (App.i18n && App.i18n()) || {};

      if (type === 'learned') {
        const n = (payload && payload.count) || 0;
        const k = 'learned:' + n;
        if (S.shownBadges[k]) return;
        title.textContent = '🎉';
        text.textContent = (t.milestoneLearned || 'Вы выучили {n} слов!').replace('{n}', n);
        S.shownBadges[k] = true;
      } else if (type === 'errors') {
        const n = (payload && payload.count) || 0;
        const k = 'errors:' + n;
        if (S.shownBadges[k]) return;
        title.textContent = '💪';
        text.textContent = (t.milestoneErrors || '5 ошибок — не сдаёмся!').replace('{n}', n);
        S.shownBadges[k] = true;
      } else {
        return;
      }

      modal.classList.remove('hidden');
      ok.onclick = () => { modal.classList.add('hidden'); };
      S.lastShownAt = now; save(S);
    };
  })(App.Milestones);

  // ────────────────────────────────────────────────────────────
  // navigation
  function nextWord() {
    App.state.lastIndex = App.state.index;
    const b = App.Sets ? App.Sets.activeBounds() : { start: 0, end: getActiveDeck().length };
    const sub = (App.Decks.resolveDeckByKey(App.dictRegistry.activeKey) || []).slice(b.start, b.end);
    App.state.index = b.start + App.Trainer.sampleNextIndexWeighted(sub);
    renderCard(true);
  }

  // ────────────────────────────────────────────────────────────
  // favorites
  function toggleFav() {
    const w = current();
    const dictKey = App.dictRegistry.activeKey;
    App.toggleFavorite && App.toggleFavorite(dictKey, w.id);
    if (D.favBtn) {
      D.favBtn.textContent = (App.isFavorite && App.isFavorite(dictKey, w.id)) ? '♥' : '♡';
      D.favBtn.style.transform = 'scale(1.2)';
      setTimeout(() => { D.favBtn.style.transform = 'scale(1)'; }, 140);
    }
    renderDictList();
    App.renderSetsBar();
  }

  function canShowFav() {
    try {
      App.migrateFavoritesToV2 && App.migrateFavoritesToV2();
      const v2 = (App.state && App.state.favorites_v2) || {};
      let cnt = 0; Object.keys(v2).forEach(k => { cnt += Object.keys(v2[k] || {}).filter(x => v2[k][x]).length; });
      return cnt >= 4;
    } catch (e) { return false; }
  }

  function makeDictRow(key) {
    const words = App.Decks.resolveDeckByKey(key) || [];
    const row = document.createElement('div');
    row.className = 'dictRow' + (key === App.dictRegistry.activeKey ? ' active' : '');
    row.dataset.key = key;

    const flag = document.createElement('div');
    flag.className = 'dictFlag';
    if (key === 'mistakes') flag.textContent = '⚠️';
    else flag.textContent = App.Decks.flagForKey(key, words);

    const name = document.createElement('div');
    name.className = 'dictName';
    if (key === 'mistakes') {
      const t = (typeof App.i18n === 'function') ? App.i18n() : null;
      name.textContent = (t && t.mistakesName) ? t.mistakesName : 'Мои ошибки';
    } else {
      name.textContent = App.Decks.resolveNameByKey(key);
    }
    name.title = name.textContent;

    const actions = document.createElement('div');
    actions.className = 'dictActions';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'iconOnly';
    prevBtn.title = (App.i18n().ttPreview || 'Предпросмотр');
    prevBtn.textContent = '👁️';
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); App.Decks.openPreview(words, name.textContent); });
    actions.appendChild(prevBtn);

    if (key === 'fav' || key === 'favorites') {
      const delBtn = document.createElement('button');
      delBtn.className = 'iconOnly';
      delBtn.title = (App.settings.lang === 'ru') ? 'Очистить «Избранное»' : 'Очистити «Обране»';
      delBtn.textContent = '🗑️';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const msg = (App.settings.lang === 'ru') ? 'Очистить «Избранное»? Это действие нельзя отменить.' : 'Очистити «Обране»? Дію не можна скасувати.';
        if (!confirm(msg)) return;
        App.clearFavoritesAll && App.clearFavoritesAll();
        App.dictRegistry.activeKey = App.Decks.pickDefaultKey();
        App.saveDictRegistry();
        renderDictList(); App.renderSetsBar(); renderCard(true); updateStats();
      });
      actions.appendChild(delBtn);
    }

    row.appendChild(flag);
    row.appendChild(name);
    row.appendChild(actions);

    row.addEventListener('click', () => {
      if (row.classList.contains('disabled')) return;
      App.dictRegistry.activeKey = key;
      App.saveDictRegistry();
      App.state.index = 0;
      App.state.lastIndex = -1;
      renderDictList();
      App.renderSetsBar();
      renderCard(true);
      updateStats();
    });

    return row;
  }

  function renderDictList() {
    const host = D.dictListHost;
    if (!host) return;
    host.innerHTML = '';

    (function appendMistakesRowFirst() {
      try {
        const row = makeDictRow('mistakes');
        if (!row) return;
        host.appendChild(row);
        let cnt = 0;
        if (App.Mistakes && typeof App.Mistakes.count === 'function') cnt = App.Mistakes.count();
        if (cnt < 4) {
          row.classList.add('disabled');
          row.setAttribute('aria-disabled', 'true');
          row.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            try {
              const t = (typeof App.i18n === 'function') ? App.i18n() : null;
              const msg = t && t.needMoreMistakes
                ? t.needMoreMistakes.replace('{n}', String(4 - cnt))
                : 'Добавьте ещё ' + (4 - cnt) + ' слов с ошибками для активации';
              const box = document.getElementById('motivationBox');
              if (box) { box.textContent = msg; }
            } catch (_) {}
          }, { capture: true });
        }
      } catch (e) {}
    })();

    if (canShowFav()) host.appendChild(makeDictRow('fav'));
    for (const k of App.Decks.builtinKeys()) host.appendChild(makeDictRow(k));
    for (const k of Object.keys(App.dictRegistry.user || {})) host.appendChild(makeDictRow(k));
  }

  // ────────────────────────────────────────────────────────────
  // bootstrap & bindings
  const _origBootstrap = App.bootstrap || function(){};
  App.bootstrap = function () {
    _origBootstrap();
    if (!App.state || !App.state.totals) App.state.totals = {};
    App.state.totals.sessionErrors = 0;

    if (!App.dictRegistry.activeKey) { App.dictRegistry.activeKey = App.Decks.pickDefaultKey(); App.saveDictRegistry(); }
    try { App.migrateFavoritesToV2 && App.migrateFavoritesToV2(); } catch (e) {}

    applyLang();
    App.applyTheme();
    App.scheduleThemeTick && App.scheduleThemeTick();
    bindHeaderButtons();
    renderCard(true);
  };

  function applyLang() {
    const t = App.i18n();
    if (D.titleEl && D.titleEl.firstChild) D.titleEl.firstChild.textContent = (t.appTitle || 'App') + ' ';
    if (D.appVerEl) D.appVerEl.textContent = 'v' + (App.APP_VER || '1.0.0');
    if (D.taglineEl) D.taglineEl.textContent = t.tagline || '';
    if (D.dictsBtn) D.dictsBtn.title = t.dictsHeader || 'Словари';
    renderDictList();
    App.renderSetsBar();
    updateStats();
  }

  function openModal() { if (D.modal) D.modal.classList.remove('hidden'); }
  function closeModal() { if (D.modal) D.modal.classList.add('hidden'); }

  function bindHeaderButtons() {
    if (D.langToggleBtn) {
      D.langToggleBtn.addEventListener('click', () => {
        App.settings.lang = (App.settings.lang === 'ru') ? 'uk' : 'ru';
        D.langToggleBtn.textContent = (App.settings.lang === 'ru') ? '🇷🇺' : '🇺🇦';
        App.saveSettings(App.settings);
        applyLang();
        App.applyTheme();
        renderCard(true);
      });
    }
    if (D.themeToggleBtn) {
      const updateIcon = () => {
        const mode = document.documentElement.getAttribute('data-theme');
        D.themeToggleBtn.textContent = (mode === 'dark') ? '🌙' : '🌞';
      };
      D.themeToggleBtn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme') || 'light';
        const next = (cur === 'dark') ? 'light' : 'dark';
        App.settings.theme = next;
        App.saveSettings(App.settings);
        App.applyTheme();
        updateIcon();
      });
      updateIcon();
    }
    if (D.dictsBtn) { D.dictsBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openModal(); }); }
    if (D.okBtn) { D.okBtn.addEventListener('click', () => { closeModal(); }); }
    if (D.backdrop) { D.backdrop.addEventListener('click', () => { closeModal(); }); }
    if (D.favBtn) { D.favBtn.addEventListener('click', toggleFav); }
  }

})();
