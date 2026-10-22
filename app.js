'use strict';

const PASS_MARK = 0.55; // WSET Level 1 and 2 pass mark

const I18N = {
  en: {
    setupTitle: 'Set up your quiz',
    level: 'Level',
    levelAll: 'Level 1 + 2',
    level1: 'Level 1 only',
    level2: 'Level 2 only',
    country: 'Country',
    countryAll: 'All countries',
    topics: 'Topics',
    count: 'Number of questions',
    countAll: 'All',
    available: n => `${n} questions available`,
    start: 'Start quiz',
    quit: 'Quit',
    next: 'Next',
    finish: 'See results',
    counter: (i, n) => `Question ${i} of ${n}`,
    correct: 'Correct!',
    wrong: 'Not quite.',
    resultTitle: 'Results',
    pass: 'Pass — the WSET pass mark is 55%.',
    fail: 'Below the WSET pass mark of 55%. Keep practising!',
    missedTitle: 'Questions to review',
    yourAnswer: 'Your answer',
    rightAnswer: 'Correct answer',
    retry: 'Retry missed',
    restart: 'New quiz',
    noQuestions: 'No questions match your selection.',
    loadError: 'Could not load questions.json. Serve this folder over HTTP (see README).',
  },
  de: {
    setupTitle: 'Quiz einrichten',
    level: 'Stufe',
    levelAll: 'Level 1 + 2',
    level1: 'Nur Level 1',
    level2: 'Nur Level 2',
    country: 'Land',
    countryAll: 'Alle Länder',
    topics: 'Themen',
    count: 'Anzahl Fragen',
    countAll: 'Alle',
    available: n => `${n} Fragen verfügbar`,
    start: 'Quiz starten',
    quit: 'Abbrechen',
    next: 'Weiter',
    finish: 'Zum Ergebnis',
    counter: (i, n) => `Frage ${i} von ${n}`,
    correct: 'Richtig!',
    wrong: 'Leider falsch.',
    resultTitle: 'Ergebnis',
    pass: 'Bestanden – die WSET-Bestehensgrenze liegt bei 55 %.',
    fail: 'Unter der WSET-Bestehensgrenze von 55 %. Weiter üben!',
    missedTitle: 'Diese Fragen wiederholen',
    yourAnswer: 'Deine Antwort',
    rightAnswer: 'Richtige Antwort',
    retry: 'Falsche wiederholen',
    restart: 'Neues Quiz',
    noQuestions: 'Keine Fragen passen zu deiner Auswahl.',
    loadError: 'questions.json konnte nicht geladen werden. Ordner per HTTP ausliefern (siehe README).',
  },
};

const TOPICS_DE = {
  'Wine Types': 'Weinarten',
  'Grape Varieties': 'Rebsorten',
  'Viticulture': 'Weinbau',
  'Winemaking': 'Weinbereitung',
  'Tasting': 'Verkostung',
  'Food & Wine': 'Wein & Speisen',
  'Service & Storage': 'Service & Lagerung',
  'Regions': 'Regionen',
  'Geography': 'Geografie',
  'Sparkling': 'Schaumwein',
  'Sweet & Fortified': 'Süß- & Likörweine',
  'Labelling': 'Etikettierung',
};

// Display order for the country filter: Old World first, then New World.
const COUNTRIES = {
  'France': 'Frankreich',
  'Italy': 'Italien',
  'Spain': 'Spanien',
  'Portugal': 'Portugal',
  'Germany': 'Deutschland',
  'Austria': 'Österreich',
  'Hungary': 'Ungarn',
  'USA': 'USA',
  'Canada': 'Kanada',
  'Chile': 'Chile',
  'Argentina': 'Argentinien',
  'Australia': 'Australien',
  'New Zealand': 'Neuseeland',
  'South Africa': 'Südafrika',
};

const state = {
  lang: loadLang(),
  all: [],
  quiz: [],      // [{ q, order }] where order is the shuffled option index list
  index: 0,
  picked: [],    // picked option index per question (null = unanswered)
};

const $ = id => document.getElementById(id);
const t = (key, ...args) => {
  const v = I18N[state.lang][key];
  return typeof v === 'function' ? v(...args) : v;
};
const topicLabel = topic => (state.lang === 'de' ? TOPICS_DE[topic] || topic : topic);

function loadLang() {
  try {
    const saved = localStorage.getItem('wset-quiz-lang');
    if (saved === 'en' || saved === 'de') return saved;
  } catch {}
  return navigator.language.startsWith('de') ? 'de' : 'en';
}

function setLang(lang) {
  state.lang = lang;
  try { localStorage.setItem('wset-quiz-lang', lang); } catch {}
  render();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function show(sectionId) {
  for (const id of ['setup', 'quiz', 'result']) $(id).hidden = id !== sectionId;
}

// ---- Setup ----

function renderTopics() {
  const topics = [...new Set(state.all.map(q => q.topic))];
  const checked = new Set(selectedTopics());
  const keepSelection = $('topics').children.length > 0;
  $('topics').replaceChildren(...topics.map(topic => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = topic;
    input.checked = keepSelection ? checked.has(topic) : true;
    input.addEventListener('change', updateAvailable);
    label.append(input, topicLabel(topic));
    return label;
  }));
}

function renderCountries() {
  const select = $('country');
  const current = select.value || 'all';
  const counts = {};
  for (const q of state.all) {
    for (const c of q.countries || []) counts[c] = (counts[c] || 0) + 1;
  }
  const option = (value, label) => {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = label;
    return o;
  };
  select.replaceChildren(
    option('all', t('countryAll')),
    ...Object.keys(COUNTRIES)
      .filter(c => counts[c])
      .map(c => option(c, `${state.lang === 'de' ? COUNTRIES[c] : c} (${counts[c]})`)),
  );
  select.value = current;
}

function selectedTopics() {
  return [...$('topics').querySelectorAll('input:checked')].map(i => i.value);
}

function filteredQuestions() {
  const level = document.querySelector('input[name="level"]:checked').value;
  const country = $('country').value;
  const topics = new Set(selectedTopics());
  return state.all.filter(q =>
    (level === 'all' || q.level === Number(level)) &&
    (country === 'all' || (q.countries || []).includes(country)) &&
    topics.has(q.topic));
}

function updateAvailable() {
  const n = filteredQuestions().length;
  $('available').textContent = t('available', n);
  $('start').disabled = n === 0;
}

function startQuiz(pool) {
  if (pool.length === 0) {
    alert(t('noQuestions'));
    return;
  }
  state.quiz = pool.map(q => ({ q, order: shuffle([0, 1, 2, 3]) }));
  state.index = 0;
  state.picked = state.quiz.map(() => null);
  show('quiz');
  renderQuestion();
}

function startFromSetup() {
  const count = $('count').value;
  const pool = shuffle(filteredQuestions());
  startQuiz(count === 'all' ? pool : pool.slice(0, Number(count)));
}

// ---- Quiz ----

function renderQuestion() {
  const { q, order } = state.quiz[state.index];
  const text = q[state.lang];
  const picked = state.picked[state.index];
  const answered = picked !== null;
  const total = state.quiz.length;

  $('counter').textContent = t('counter', state.index + 1, total);
  $('badge').textContent = `L${q.level} · ${topicLabel(q.topic)}`;
  $('progress-bar').style.width = `${((state.index + (answered ? 1 : 0)) / total) * 100}%`;
  $('question').textContent = text.question;

  $('options').replaceChildren(...order.map((optIdx, pos) => {
    const btn = document.createElement('button');
    const key = document.createElement('span');
    key.className = 'key';
    key.textContent = pos + 1;
    btn.append(key, text.options[optIdx]);
    btn.disabled = answered;
    if (answered && optIdx === q.answer) btn.classList.add('correct');
    if (answered && optIdx === picked && picked !== q.answer) btn.classList.add('wrong');
    btn.addEventListener('click', () => answer(optIdx));
    return btn;
  }));

  const fb = $('feedback');
  fb.hidden = !answered;
  if (answered) {
    const ok = picked === q.answer;
    fb.className = `feedback ${ok ? 'ok' : 'bad'}`;
    const strong = document.createElement('strong');
    strong.textContent = `${ok ? t('correct') : t('wrong')} `;
    fb.replaceChildren(strong, text.explanation);
  }

  $('next').hidden = !answered;
  $('next').textContent = state.index === total - 1 ? t('finish') : t('next');
  if (answered) $('next').focus();
}

function answer(optIdx) {
  if (state.picked[state.index] !== null) return;
  state.picked[state.index] = optIdx;
  renderQuestion();
}

function next() {
  if (state.picked[state.index] === null) return;
  if (state.index < state.quiz.length - 1) {
    state.index++;
    renderQuestion();
  } else {
    show('result');
    renderResult();
  }
}

// ---- Result ----

function missedItems() {
  return state.quiz.filter((item, i) => state.picked[i] !== item.q.answer);
}

function renderResult() {
  const total = state.quiz.length;
  const missed = missedItems();
  const correct = total - missed.length;
  const ratio = correct / total;

  $('score').textContent = `${correct} / ${total} (${Math.round(ratio * 100)} %)`;
  $('verdict').className = ratio >= PASS_MARK ? 'pass' : 'fail';
  $('verdict').textContent = ratio >= PASS_MARK ? t('pass') : t('fail');

  const list = $('missed');
  list.replaceChildren();
  if (missed.length) {
    const h = document.createElement('h3');
    h.textContent = t('missedTitle');
    list.append(h);
    for (const { q } of missed) {
      const text = q[state.lang];
      const picked = state.picked[state.quiz.findIndex(item => item.q === q)];
      const div = document.createElement('div');
      div.className = 'missed-item';
      div.append(
        para(text.question, 'strong'),
        para(`${t('yourAnswer')}: ${text.options[picked]}`, 'yours'),
        para(`${t('rightAnswer')}: ${text.options[q.answer]}`, 'right'),
        para(text.explanation, 'muted'),
      );
      list.append(div);
    }
  }
  $('retry').hidden = missed.length === 0;
}

function para(text, cls) {
  const p = document.createElement('p');
  if (cls === 'strong') {
    const s = document.createElement('strong');
    s.textContent = text;
    p.append(s);
  } else {
    p.className = cls;
    p.textContent = text;
  }
  return p;
}

// ---- Wiring ----

function render() {
  document.documentElement.lang = state.lang;
  for (const btn of document.querySelectorAll('.lang button')) {
    btn.classList.toggle('active', btn.dataset.lang === state.lang);
  }
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }
  if (!state.all.length) return;
  renderCountries();
  renderTopics();
  updateAvailable();
  if (!$('quiz').hidden) renderQuestion();
  if (!$('result').hidden) renderResult();
}

document.addEventListener('keydown', e => {
  if ($('quiz').hidden) return;
  if (['1', '2', '3', '4'].includes(e.key)) {
    const btn = $('options').children[Number(e.key) - 1];
    if (btn && !btn.disabled) btn.click();
  } else if (e.key === 'Enter' && !$('next').hidden) {
    e.preventDefault();
    next();
  }
});

for (const btn of document.querySelectorAll('.lang button')) {
  btn.addEventListener('click', () => setLang(btn.dataset.lang));
}
for (const input of document.querySelectorAll('input[name="level"]')) {
  input.addEventListener('change', updateAvailable);
}
$('country').addEventListener('change', updateAvailable);
$('start').addEventListener('click', startFromSetup);
$('next').addEventListener('click', next);
$('quit').addEventListener('click', () => show('setup'));
$('restart').addEventListener('click', () => show('setup'));
$('retry').addEventListener('click', () => startQuiz(shuffle(missedItems().map(item => item.q))));

async function init() {
  render();
  try {
    const res = await fetch('questions.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    state.all = await res.json();
  } catch {
    $('error').textContent = t('loadError');
    $('error').hidden = false;
    return;
  }
  show('setup');
  render();
}

init();

// Offline support and "Add to home screen" (see sw.js).
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
