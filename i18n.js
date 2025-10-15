/*
*****************************************************************
 Version: 1.5 • Updated: 2025-10-10 • File: release-main/i18n.js 
*****************************************************************
*/
(function(){
  'use strict';

  // -------------------------------------------------------------------------
  // Public i18n bag. Access via App.i18n() in app.core.js
  // -------------------------------------------------------------------------
  window.I18N = {
    // -----------------------------------------------------------------------
    // RU — Russian
    // -----------------------------------------------------------------------
    ru: {
      // App & brand
      appTitle: "Lexitron",
      tagline: "Он научит!",
      
      
      
      
      modeHard: "Сложный режим",
modeNormal: "Обычный режим",
donateTitle: "Поддержать проект",
settingsTitle: "Настройки",
      settingsInDev: "",
      // --- Confirm modal ---
      confirmTitle: "Подтверждение",
      confirmOk: "ОК",
      confirmCancel: "Отмена",
      confirmModeReset: "Переключение режима сбросит прогресс в текущем словаре. Продолжить?",
      confirmFavReset: "Очистить «Избранное» для активного языка? Действие нельзя отменить.",
      confirmMistakesReset: "Очистить «Мои ошибки» для активного языка? Действие нельзя отменить.",




      // Core UI labels
      ok: "OK",
      choose: "Выберите перевод",
      iDontKnow: "Не знаю",

      // Header / controls
      modalTitle: "Словари",
      dictsHeader: "Словари",
      langLabel: "Язык",
      repeatLabel: "Сложность",
      themeLabel: "Тема",
      // Tooltips (header controls)
      tt_ui_theme: "Тема",
      tt_ui_lang: "Язык интерфейса",
      tt_dicts: "Словари",
      tt_favorites: "Избранное",
      tt_help: "Инструкция",
      tt_support: "Поддержка",
      tt_settings: "Настройки",

      // Stats & badges
      totalWords: "Всего слов в словаре",
      learned: "Выучено",
      errors: "Ошибок",
      badgeSetWords: "Слов в наборе",
      badgeLearned: "Выучено",

      // Virtual decks
      mistakesName: "Мои ошибки",
      allMistakesDone: "Все ошибки закрыты!",
      favTitle: "Избранное",
      ttPreview: "Предпросмотр",

      // Parts of speech (POS)
      pos_verbs: "Глаголы",
      pos_nouns: "Существительные",
      pos_adjs: "Прилагательные",
      pos_advs: "Наречия",
      pos_preps: "Предлоги",
      pos_pronouns: "Местоимения",
      pos_conjs: "Союзы",
      pos_particles: "Частицы",
      pos_numbers: "Числительные",
      pos_misc: "Словарь",

      // Info modal (Instruction)
      infoTitle: "Инструкция",
      infoSteps: [
        "Запоминайте слова — увидели слово — выберите перевод.",
        "Добавляйте в Избранное — отмечайте важные слова, чтобы вернуться к ним позже.",
        "Используйте кнопку «Не знаю» — это помогает продвигаться дальше и не считается ошибкой."
      ],
      version: "Версия",
      status: "Статус",
      licensed: "Зарегистрировано",
      notLicensed: "Не зарегистрировано",
    },

    // -----------------------------------------------------------------------
    // UK — Ukrainian
    // -----------------------------------------------------------------------
    uk: {
      // App & brand
      appTitle: "Lexitron",
      tagline: "Він навчить!",
      
      
      
      
      modeHard: "Складний режим",
modeNormal: "Звичайний режим",
donateTitle: "Підтримати проєкт",
settingsTitle: "Налаштування",
      settingsInDev: "",
      // --- Confirm modal ---
      confirmTitle: "Підтвердження",
      confirmOk: "ОК",
      confirmCancel: "Скасувати",
      confirmModeReset: "Перемикання режиму скине прогрес у поточному словнику. Продовжити?",
      confirmFavReset: "Очистити «Обране» для активної мови? Дію не можна скасувати.",
      confirmMistakesReset: "Очистити «Мої помилки» для активної мови? Дію не можна скасувати.",




      // Core UI labels
      ok: "OK",
      choose: "Оберіть переклад",
      iDontKnow: "Не знаю",

      // Header / controls
      modalTitle: "Словники",
      dictsHeader: "Словники",
      langLabel: "Мова",
      repeatLabel: "Складність",
      themeLabel: "Тема",
      // Підказки (кнопки в шапці)
      tt_ui_theme: "Тема",
      tt_ui_lang: "Мова інтерфейсу",
      tt_dicts: "Словники",
      tt_favorites: "Обране",
      tt_help: "Інструкція",
      tt_support: "Підтримка",
      tt_settings: "Налаштування",

      // Stats & badges
      totalWords: "Всього слів в словнику",
      learned: "Вивчено",
      errors: "Помилок",
      badgeSetWords: "Слів у наборі",
      badgeLearned: "Вивчено",

      // Virtual decks
      mistakesName: "Мої помилки",
      allMistakesDone: "Усі помилки закриті!",
      favTitle: "Обране",
      ttPreview: "Попередній перегляд",

      // Parts of speech (POS)
      pos_verbs: "Дієслова",
      pos_nouns: "Іменники",
      pos_adjs: "Прикметники",
      pos_advs: "Прислівники",
      pos_preps: "Прийменники",
      pos_pronouns: "Займенники",
      pos_conjs: "Сполучники",
      pos_particles: "Частки",
      pos_numbers: "Числівники",
      pos_misc: "Словник",

      // Info modal (Instruction)
      infoTitle: "Інструкція",
      infoSteps: [
        "Запам’ятовуйте слова — побачили слово — оберіть переклад.",
        "Додавайте в Обране — позначайте важливі слова, щоб повернутися до них пізніше.",
        "Користуйтесь кнопкою «Не знаю» — це допомагає рухатися далі й не вважається помилкою."
      ],
      version: "Версія",
      status: "Статус",
      licensed: "Зареєстровано",
      notLicensed: "Не зареєстровано",
    },
  };

  // -------------------------------------------------------------------------
  // Legacy interop: if the app uses App.locales for language-picker labels,
  // extend them here (non-breaking). This keeps old code working.
  // -------------------------------------------------------------------------
  try {
    if (window.App && App.locales) {
      App.locales.ru = Object.assign(App.locales.ru||{}, { allLangs: "Все языки",  lang_sr: "Сербский" });
      App.locales.uk = Object.assign(App.locales.uk||{}, { allLangs: "Всі мови",   lang_sr: "Сербська" });
    }
  } catch(_) {}

})();
