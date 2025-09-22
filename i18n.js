/*!
 * i18n.js — Lexitron UI localization
 * Version: 1.5.0
 * Date: 2025-09-21
 *
 * Purpose:
 *  - Centralized UI strings per language (RU/UK)
 *  - Instruction modal content (infoTitle/infoSteps)
 *  - POS titles for deck naming
 *  - Virtual deck titles (favorites, mistakes)
 *  - Small UI labels & badges
 *
 * Usage:
 *   window.I18N[langKey] where langKey ∈ { 'ru','uk' }
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

      // Motivation
      praise: [
        "Отлично! 🎉",
        "Так держать! 💪",
        "Супер! 🚀",
        "Прекрасно! 🌟",
        "Молодец! 🏆"
      ],
      encouragement: [
        "Ошибки — тоже учёба 🧩",
        "Не сдавайся! 🔥",
        "Всё получится! ✨",
        "Ещё немного практики! ⏳",
        "Так формируется навык 🌀"
      ],

      
    },
    // -----------------------------------------------------------------------
    // UK — Ukrainian
    // -----------------------------------------------------------------------
    uk: {
      // App & brand
      appTitle: "Lexitron",
      tagline: "Він навчить!",

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

      // Motivation
      praise: [
        "Чудово! 🎉",
        "Так тримати! 💪",
        "Супер! 🚀",
        "Прекрасно! 🌟",
        "Молодець! 🏆"
      ],
      encouragement: [
        "Помилки — теж навчання 🧩",
        "Не здавайся! 🔥",
        "Усе вийде! ✨",
        "Ще трохи практики! ⏳",
        "Так формується навичка 🌀"
      ],
    }
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

/* --------------------------  К О Н Е Ц  i18n.js  -------------------------- */
