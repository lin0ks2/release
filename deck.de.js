/*!
 * deck.de.js — Lexitron
 * Version: 1.5.0
 * Date: 2025-09-21
 *
 * Purpose:
 *  - Part of the Lexitron web app
 */
window.decks = window.decks || {};

// === DE_VERBS (first 8) ===
window.decks.de_verbs = [
  { id: 1, word: "sein", uk: "бути", ru: "быть" },
  { id: 2, word: "haben", uk: "мати", ru: "иметь" },
  { id: 3, word: "werden", uk: "ставати", ru: "становиться" },
  { id: 4, word: "können", uk: "могти", ru: "мочь" },
  { id: 5, word: "müssen", uk: "мусити", ru: "быть должным" },
  { id: 6, word: "sagen", uk: "казати", ru: "сказать" },
  { id: 7, word: "machen", uk: "робити", ru: "делать" },
  { id: 8, word: "geben", uk: "давати", ru: "давать" }
];

// === DE_NOUNS (first 8) ===
window.decks.de_nouns = [
  { id: 1, word: "das Geld", uk: "гроші", ru: "деньги" },
  { id: 2, word: "die Zeit", uk: "час", ru: "время" },
  { id: 3, word: "das Jahr", uk: "рік", ru: "год" },
  { id: 4, word: "der Mensch", uk: "людина", ru: "человек" },
  { id: 5, word: "die Frau", uk: "жінка", ru: "женщина" },
  { id: 6, word: "der Mann", uk: "чоловік", ru: "мужчина" },
  { id: 7, word: "das Kind", uk: "дитина", ru: "ребёнок" },
  { id: 8, word: "die Stadt", uk: "місто", ru: "город" }
];

// === DE_ADVERBS (first 8) ===
window.decks.de_adverbs = [
  { id: 1, word: "jetzt", uk: "зараз", ru: "сейчас" },
  { id: 2, word: "schon", uk: "вже", ru: "уже" },
  { id: 3, word: "noch", uk: "ще", ru: "ещё" },
  { id: 4, word: "nur", uk: "тільки", ru: "только" },
  { id: 5, word: "auch", uk: "також", ru: "тоже" },
  { id: 6, word: "sehr", uk: "дуже", ru: "очень" },
  { id: 7, word: "immer", uk: "завжди", ru: "всегда" },
  { id: 8, word: "nie", uk: "ніколи", ru: "никогда" }
];

// === DE_ADJECTIVES (first 8) ===
window.decks.de_adjectives = [
  { id: 1, word: "gut", uk: "добрий", ru: "хороший" },
  { id: 2, word: "schlecht", uk: "поганий", ru: "плохой" },
  { id: 3, word: "groß", uk: "великий", ru: "большой" },
  { id: 4, word: "klein", uk: "малий", ru: "маленький" },
  { id: 5, word: "schön", uk: "гарний", ru: "красивый" },
  { id: 6, word: "hässlich", uk: "потворний", ru: "уродливый" },
  { id: 7, word: "neu", uk: "новий", ru: "новый" },
  { id: 8, word: "alt", uk: "старий", ru: "старый" }
];

// === DE_PREPOSITIONS (first 8) ===
window.decks.de_prepositions = [
  { id: 1, word: "in", uk: "в; всередині", ru: "в; внутри" },
  { id: 2, word: "an", uk: "біля; на (верт.)", ru: "у; на (верт. пов.)" },
  { id: 3, word: "auf", uk: "на (гориз.)", ru: "на (гориз.)" },
  { id: 4, word: "über", uk: "над; про; через", ru: "над; о; через" },
  { id: 5, word: "unter", uk: "під; серед", ru: "под; среди" },
  { id: 6, word: "vor", uk: "перед; до (час.)", ru: "перед; до (врем.)" },
  { id: 7, word: "hinter", uk: "за; позаду", ru: "за; позади" },
  { id: 8, word: "neben", uk: "поруч з; біля", ru: "рядом с; возле" }
];

// === DE_PRONOUNS (first 8) ===
window.decks.de_pronouns = [
  { id: 1, word: "ich", uk: "я", ru: "я" },
  { id: 2, word: "du", uk: "ти", ru: "ты" },
  { id: 3, word: "er", uk: "він", ru: "он" },
  { id: 4, word: "sie", uk: "вона", ru: "она" },
  { id: 5, word: "es", uk: "воно", ru: "оно" },
  { id: 6, word: "wir", uk: "ми", ru: "мы" },
  { id: 7, word: "ihr", uk: "ви (мн.)", ru: "вы (мн.)" },
  { id: 8, word: "Sie", uk: "Ви (ввіч.)", ru: "Вы (вежл.)" }
];

// === DE_NUMBERS (first 8) ===
window.decks.de_numbers = [
  { id: 1, word: "eins", uk: "один", ru: "один" },
  { id: 2, word: "zwei", uk: "два", ru: "два" },
  { id: 3, word: "drei", uk: "три", ru: "три" },
  { id: 4, word: "vier", uk: "чотири", ru: "четыре" },
  { id: 5, word: "fünf", uk: "п’ять", ru: "пять" },
  { id: 6, word: "sechs", uk: "шість", ru: "шесть" },
  { id: 7, word: "sieben", uk: "сім", ru: "семь" },
  { id: 8, word: "acht", uk: "вісім", ru: "восемь" }
];

// === DE_CONJUNCTIONS (first 8) ===
window.decks.de_conjunctions = [
  { id: 1, word: "und", uk: "і", ru: "и" },
  { id: 2, word: "oder", uk: "або", ru: "или" },
  { id: 3, word: "aber", uk: "але", ru: "но" },
  { id: 4, word: "denn", uk: "бо", ru: "ибо" },
  { id: 5, word: "weil", uk: "тому що", ru: "потому что" },
  { id: 6, word: "dass", uk: "що", ru: "что" },
  { id: 7, word: "wenn", uk: "якщо/коли", ru: "если/когда" },
  { id: 8, word: "falls", uk: "якщо", ru: "в случае если" }
];

// === DE_PARTICLES (first 8) ===
window.decks.de_particles = [
  { id: 1, word: "doch", uk: "ж", ru: "же/всё-таки" },
  { id: 2, word: "mal", uk: "якось", ru: "ка-нить/разок" },
  { id: 3, word: "eben", uk: "саме так", ru: "именно" },
  { id: 4, word: "halt", uk: "просто", ru: "просто" },
  { id: 5, word: "schon", uk: "вже", ru: "уж/уже" },
  { id: 6, word: "ja", uk: "же", ru: "же/ведь" },
  { id: 7, word: "wohl", uk: "мабуть", ru: "пожалуй" },
  { id: 8, word: "denn", uk: "же (пит.)", ru: "же (в вопросах)" }
];
/* -------------------------------  К О Н Е Ц  ------------------------------- */
