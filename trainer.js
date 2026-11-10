'use strict';

// Profile trainer: learn to tell grape varieties apart by structure and aromas.
// Data: library.json. Shared helpers: common.js (language, countries) and
// profile.js (el, PROPS, PROP_LABELS, scaleText, meter, midpoint, loadTrainer, saveTrainer).
//
// Learning design:
// - Blind profile: a structure + aroma profile, pick the grape. Wrong options are the
//   grapes whose profile is most similar (hard) or clearly different (easy).
// - Head-to-head: two grapes, which has more/less of one property. Only asked where
//   their ranges don't overlap, so there is always one clear answer.
// - Every mix-up goes into a "confusables deck" (Leitner boxes) and comes back after
//   2, 5 and 12 questions until it's answered right three times in a row.

const ROUND_LENGTH = 15;
const DECK_INTERVALS = [0, 2, 5, 12]; // questions until a deck entry is due again, by box (1-3)
const DECK_SHARE = 0.6;               // chance to ask a due deck entry instead of a new question

const I18N = {
  en: {
    navQuiz: 'Quiz',
    navLibrary: 'Library',
    navTraining: 'Training',
    setupTitle: 'Profile trainer',
    setupIntro: 'Learn to tell the grapes apart by their structure and aromas. Grapes you mix up come back until you know them.',
    mode_blind: 'Blind profile',
    mode_blind_desc: 'See a profile, name the grape',
    mode_h2h: 'Head-to-head',
    mode_h2h_desc: 'Two grapes: which has more?',
    level: 'Difficulty',
    level_easy: 'Easy',
    level_hard: 'Hard: similar grapes',
    level_structure: 'Exam: structure only',
    pool: 'Grapes',
    pool_all: 'All',
    pool_lo3: 'Principal (LO3)',
    pool_lo4: 'Regional (LO4)',
    deckInfo: (n, due) => n ? `Confusables deck: ${n} pair${n === 1 ? '' : 's'} you mixed up${due ? `, ${due} due now` : ''}.` : 'Your confusables deck is empty. Mix-ups will be collected here.',
    reset: 'Reset progress',
    resetConfirm: 'Reset all trainer progress (deck and scores) on this device?',
    start: 'Start training',
    quit: 'Quit',
    next: 'Next',
    finish: 'See results',
    counter: (i, n) => `Question ${i} of ${n}`,
    blindPrompt: 'Which grape matches this profile?',
    h2hPrompt: (q) => `Which has ${q}?`,
    more: { colour: 'a deeper colour', sweetness: 'more sweetness', acidity: 'higher acidity', tannin: 'more tannin', alcohol: 'more alcohol', body: 'a fuller body' },
    less: { colour: 'a paler colour', sweetness: 'less sweetness', acidity: 'lower acidity', tannin: 'less tannin', alcohol: 'less alcohol', body: 'a lighter body' },
    aromasLabel: 'Aromas',
    correct: 'Correct!',
    wrongBlind: (picked, right) => `Not ${picked}: it's ${right}`,
    wrongH2h: (right) => `It's ${right}`,
    yourPick: 'Your pick',
    answer: 'Correct',
    giveaway: 'How to recognise it',
    differs: 'Rows that differ are highlighted.',
    sameStructure: 'Their structure is almost the same: the aromas tell them apart.',
    toDeck: 'This pair goes into your confusables deck and comes back soon.',
    fromDeck: 'From your confusables deck',
    deckUp: 'Nice, that pair is getting easier.',
    deckDone: 'Mastered: this pair leaves your deck.',
    summaryTitle: 'Round complete',
    mixups: 'Pairs you mixed up this round',
    noMixups: 'No mix-ups this round. Try the next difficulty level.',
    mixedWith: (a, b) => `${a} ↔ ${b}`,
    again: 'Train again',
    changeSettings: 'Change settings',
    loadError: 'Could not load library.json. Serve this folder over HTTP (see README).',
  },
  de: {
    navQuiz: 'Quiz',
    navLibrary: 'Bibliothek',
    navTraining: 'Training',
    setupTitle: 'Profil-Trainer',
    setupIntro: 'Lerne, die Rebsorten an Struktur und Aromen zu unterscheiden. Was du verwechselst, kommt wieder, bis du es sicher kannst.',
    mode_blind: 'Blindprofil',
    mode_blind_desc: 'Profil sehen, Rebsorte erkennen',
    mode_h2h: 'Direktvergleich',
    mode_h2h_desc: 'Zwei Rebsorten: welche hat mehr?',
    level: 'Schwierigkeit',
    level_easy: 'Leicht',
    level_hard: 'Schwer: ähnliche Rebsorten',
    level_structure: 'Prüfung: nur Struktur',
    pool: 'Rebsorten',
    pool_all: 'Alle',
    pool_lo3: 'Hauptrebsorten (LO3)',
    pool_lo4: 'Regionale (LO4)',
    deckInfo: (n, due) => n ? `Verwechslungs-Stapel: ${n} Paar${n === 1 ? '' : 'e'}, die du verwechselt hast${due ? `, ${due} jetzt fällig` : ''}.` : 'Dein Verwechslungs-Stapel ist leer. Verwechslungen werden hier gesammelt.',
    reset: 'Fortschritt zurücksetzen',
    resetConfirm: 'Gesamten Trainer-Fortschritt (Stapel und Quoten) auf diesem Gerät zurücksetzen?',
    start: 'Training starten',
    quit: 'Abbrechen',
    next: 'Weiter',
    finish: 'Zum Ergebnis',
    counter: (i, n) => `Frage ${i} von ${n}`,
    blindPrompt: 'Welche Rebsorte passt zu diesem Profil?',
    h2hPrompt: (q) => `Welche hat ${q}?`,
    more: { colour: 'die tiefere Farbe', sweetness: 'mehr Süße', acidity: 'mehr Säure', tannin: 'mehr Tannin', alcohol: 'mehr Alkohol', body: 'mehr Körper' },
    less: { colour: 'die hellere Farbe', sweetness: 'weniger Süße', acidity: 'weniger Säure', tannin: 'weniger Tannin', alcohol: 'weniger Alkohol', body: 'weniger Körper' },
    aromasLabel: 'Aromen',
    correct: 'Richtig!',
    wrongBlind: (picked, right) => `Nicht ${picked}, sondern ${right}`,
    wrongH2h: (right) => `Richtig ist ${right}`,
    yourPick: 'Deine Wahl',
    answer: 'Richtig',
    giveaway: 'So erkennst du ihn',
    differs: 'Zeilen mit Unterschieden sind markiert.',
    sameStructure: 'Die Struktur ist fast gleich: die Aromen machen den Unterschied.',
    toDeck: 'Dieses Paar kommt in deinen Verwechslungs-Stapel und taucht bald wieder auf.',
    fromDeck: 'Aus deinem Verwechslungs-Stapel',
    deckUp: 'Gut, dieses Paar sitzt immer besser.',
    deckDone: 'Gemeistert: dieses Paar verlässt deinen Stapel.',
    summaryTitle: 'Runde beendet',
    mixups: 'Diese Paare hast du verwechselt',
    noMixups: 'Keine Verwechslungen in dieser Runde. Probier die nächste Schwierigkeitsstufe.',
    mixedWith: (a, b) => `${a} ↔ ${b}`,
    again: 'Noch eine Runde',
    changeSettings: 'Einstellungen ändern',
    loadError: 'library.json konnte nicht geladen werden. Ordner per HTTP ausliefern (siehe README).',
  },
};

const state = {
  lang: loadLang(),
  aromas: {},
  grapes: [],            // trainable grapes (LO3 + LO4)
  mode: 'blind',
  level: 'hard',
  pool: 'all',
  progress: loadTrainer(),
  round: null,           // { questions: [], index, score, mixups: [] }
};

const $ = id => document.getElementById(id);
const t = (key, ...args) => {
  const v = I18N[state.lang][key];
  return typeof v === 'function' ? v(...args) : v;
};
const aroma = a => (state.lang === 'de' ? state.aromas[a] || a : a);
const byId = id => state.grapes.find(g => g.id === id);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---- Similarity ----

function aromaSet(g) {
  return new Set([...g.aromas.primary, ...g.aromas.secondary, ...g.aromas.tertiary]);
}

// Smaller = more similar. Structure distance (range midpoints), plus aromas unless the level hides them.
function distance(a, b, withAromas) {
  let d = 0;
  for (const p of PROPS) {
    const ma = midpoint(a.structure[p]);
    const mb = midpoint(b.structure[p]);
    if (ma !== null && mb !== null) d += Math.abs(ma - mb);
  }
  if (withAromas) {
    const A = aromaSet(a);
    const B = aromaSet(b);
    const shared = [...A].filter(x => B.has(x)).length;
    d += 2 * (1 - shared / (new Set([...A, ...B]).size || 1));
  }
  return d;
}

const sameStructure = (a, b) => PROPS.every(p => JSON.stringify(a.structure[p]) === JSON.stringify(b.structure[p]));

// Properties where the two grapes' ranges don't overlap, i.e. a clear "more"/"less".
function clearDifferences(a, b) {
  return PROPS.filter(p => {
    const ra = a.structure[p];
    const rb = b.structure[p];
    return ra && rb && (ra[1] < rb[0] || rb[1] < ra[0]);
  });
}

// ---- Deck (spaced repetition) ----

const deckKey = (mode, a, b) => `${mode}:${a}|${b}`;

function dueEntries() {
  const c = state.progress.counter || 0;
  return Object.entries(state.progress.deck)
    .filter(([, e]) => e.due <= c && e.mode === state.mode && inPool(byId(e.a)) && inPool(byId(e.b)));
}

function recordMixup(mode, a, b) {
  state.progress.deck[deckKey(mode, a, b)] = { mode, a, b, box: 1, due: (state.progress.counter || 0) + DECK_INTERVALS[1] };
}

// Returns 'up', 'done' or null for deck questions answered correctly.
function promoteDeck(key) {
  const e = state.progress.deck[key];
  if (!e) return null;
  e.box += 1;
  if (e.box >= DECK_INTERVALS.length) {
    delete state.progress.deck[key];
    return 'done';
  }
  e.due = (state.progress.counter || 0) + DECK_INTERVALS[e.box];
  return 'up';
}

function recordStat(id, ok) {
  const s = state.progress.stats[id] || (state.progress.stats[id] = { seen: 0, correct: 0 });
  s.seen += 1;
  if (ok) s.correct += 1;
}

// ---- Question generation ----

function inPool(g) {
  if (!g) return false;
  if (state.pool === 'lo3') return g.group === 'principal';
  if (state.pool === 'lo4') return g.group === 'regional';
  return true;
}

// Prefer grapes you haven't seen much or often get wrong.
function weightedTarget(candidates) {
  const weights = candidates.map(g => {
    const s = state.progress.stats[g.id];
    const acc = s && s.seen ? s.correct / s.seen : 0.5;
    return 1 + 3 * (1 - acc) + 2 / (1 + (s ? s.seen : 0));
  });
  let r = Math.random() * weights.reduce((x, y) => x + y, 0);
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

function blindQuestion(fromDeck) {
  const pool = state.grapes.filter(inPool);
  const target = fromDeck ? byId(fromDeck.a) : weightedTarget(pool);
  const withAromas = state.level !== 'structure';
  // Distractors come from ALL grapes of the same colour, not just the pool: the exam doesn't limit them either.
  const candidates = state.grapes
    .filter(g => g.id !== target.id && g.kind === target.kind && !(sameStructure(g, target) && (!withAromas || distance(g, target, true) === 0)))
    .map(g => ({ g, d: distance(target, g, withAromas) }))
    .sort((x, y) => x.d - y.d);
  let chosen;
  if (state.level === 'easy') {
    chosen = shuffle(candidates.slice(Math.floor(candidates.length * 0.4))).slice(0, 3).map(x => x.g);
  } else {
    chosen = candidates.slice(0, 3).map(x => x.g);
  }
  if (fromDeck && !chosen.some(g => g.id === fromDeck.b) && byId(fromDeck.b)) {
    chosen = [byId(fromDeck.b), ...chosen.filter(g => g.id !== fromDeck.b)].slice(0, 3);
  }
  return { type: 'blind', target, options: shuffle([target, ...chosen]), deckKey: fromDeck ? fromDeck.key : null };
}

function h2hQuestion(fromDeck) {
  let a;
  let b;
  if (fromDeck) {
    a = byId(fromDeck.a);
    b = byId(fromDeck.b);
  } else {
    // Partner: one of the most similar grapes of the same colour that still differs clearly somewhere.
    const pool = state.grapes.filter(inPool);
    let partners = [];
    for (let tries = 0; !partners.length && tries < 20; tries++) {
      a = weightedTarget(pool);
      partners = state.grapes
        .filter(g => g.id !== a.id && g.kind === a.kind && clearDifferences(a, g).length)
        .map(g => ({ g, d: distance(a, g, true) }))
        .sort((x, y) => x.d - y.d)
        .slice(0, 5);
    }
    b = pick(partners).g;
  }
  const prop = pick(clearDifferences(a, b));
  const dir = Math.random() < 0.5 ? 'more' : 'less';
  const aHigher = a.structure[prop][0] > b.structure[prop][1];
  const answer = (dir === 'more') === aHigher ? a : b;
  return { type: 'h2h', a, b, prop, dir, target: answer, options: shuffle([a, b]), deckKey: fromDeck ? fromDeck.key : null };
}

function nextQuestion() {
  const due = dueEntries();
  const fromDeck = due.length && Math.random() < DECK_SHARE ? (([key, e]) => ({ key, ...e }))(pick(due)) : null;
  return state.mode === 'blind' ? blindQuestion(fromDeck) : h2hQuestion(fromDeck);
}

// ---- Rendering helpers ----

function aromaChips(g, layers = ['primary', 'secondary', 'tertiary']) {
  return el('div', { class: 'chips' }, layers.flatMap(layer =>
    g.aromas[layer].map(a => el('span', { class: `chip aroma ${layer}` }, aroma(a)))));
}

function profileTable(g) {
  return el('table', { class: `structure blind kind-${g.kind}` }, el('tbody', {},
    PROPS.map(p => el('tr', {},
      el('th', { scope: 'row' }, PROP_LABELS[state.lang][p]),
      el('td', { class: 'meter-cell' }, meter(p, g.structure[p], state.lang)),
      el('td', { class: 'scale-text' }, scaleText(p, g.structure[p], state.lang))))));
}

// Structure properties where two grapes differ noticeably (or the property asked about).
function differingProps(left, right, focusProp) {
  return PROPS.filter(p => {
    const ml = midpoint(left.structure[p]);
    const mr = midpoint(right.structure[p]);
    return p === focusProp || (ml !== null && mr !== null && Math.abs(ml - mr) >= 1) || ((ml === null) !== (mr === null));
  });
}

// Side-by-side comparison, highlighting the rows where the two grapes differ.
// If the structure is (almost) identical, the aroma row is what tells them apart.
function compareTable(left, right, leftLabel, rightLabel, focusProp) {
  const diff = differingProps(left, right, focusProp);
  const rows = PROPS.map(p => {
    const differs = diff.includes(p);
    return el('tr', { class: differs ? 'differs' : null },
      el('th', { scope: 'row' }, PROP_LABELS[state.lang][p]),
      el('td', { class: `kind-${left.kind}` }, meter(p, left.structure[p], state.lang, true)),
      el('td', { class: `kind-${right.kind}` }, meter(p, right.structure[p], state.lang, true)));
  });
  const aromaRow = el('tr', { class: diff.length ? null : 'differs' },
    el('th', { scope: 'row' }, t('aromasLabel')),
    el('td', {}, aromaChips(left, ['primary'])),
    el('td', {}, aromaChips(right, ['primary'])));
  return el('table', { class: 'compare' },
    el('thead', {}, el('tr', {}, el('th', {}), el('th', { scope: 'col' }, leftLabel), el('th', { scope: 'col' }, rightLabel))),
    el('tbody', {}, rows, aromaRow));
}

const libraryLink = g => el('a', { href: `library.html#/${g.id}`, class: `name-link kind-${g.kind}` }, g.name);

// ---- Setup ----

function renderChoice(containerId, keys, current, labelPrefix, onPick) {
  $(containerId).replaceChildren(...keys.map(key => {
    const btn = el('button', { type: 'button', class: key === current ? 'chip active' : 'chip', 'aria-pressed': String(key === current) }, t(labelPrefix + key));
    btn.addEventListener('click', () => { onPick(key); renderSetup(); });
    return btn;
  }));
}

function renderSetup() {
  $('modes').replaceChildren(...['blind', 'h2h'].map(m => {
    const btn = el('button', { type: 'button', class: m === state.mode ? 'mode active' : 'mode', 'aria-pressed': String(m === state.mode) },
      el('strong', {}, t('mode_' + m)), el('span', {}, t(`mode_${m}_desc`)));
    btn.addEventListener('click', () => { state.mode = m; renderSetup(); });
    return btn;
  }));
  $('level-field').hidden = state.mode !== 'blind';
  renderChoice('levels', ['easy', 'hard', 'structure'], state.level, 'level_', k => { state.level = k; });
  renderChoice('pools', ['all', 'lo3', 'lo4'], state.pool, 'pool_', k => { state.pool = k; });
  const total = Object.keys(state.progress.deck).length;
  const c = state.progress.counter || 0;
  const due = Object.values(state.progress.deck).filter(e => e.due <= c).length;
  $('deck-info').textContent = t('deckInfo', total, due);
}

function show(id) {
  for (const s of ['setup', 'drill', 'summary']) $(s).hidden = s !== id;
}

// ---- Drill ----

function startRound() {
  state.round = { index: 0, score: 0, mixups: [], q: null, answered: null };
  show('drill');
  ask();
}

function ask() {
  const r = state.round;
  r.q = nextQuestion();
  r.answered = null;
  renderDrill();
}

function renderDrill() {
  const r = state.round;
  const q = r.q;
  $('counter').textContent = t('counter', r.index + 1, ROUND_LENGTH);
  $('drill-badge').textContent = q.deckKey ? t('fromDeck') : t('mode_' + state.mode);
  $('drill-badge').classList.toggle('deck', !!q.deckKey);
  $('progress-bar').style.width = `${((r.index + (r.answered ? 1 : 0)) / ROUND_LENGTH) * 100}%`;

  if (q.type === 'blind') {
    $('prompt').textContent = t('blindPrompt');
    $('stage').replaceChildren(el('div', { class: `blind-card kind-${q.target.kind}` },
      profileTable(q.target),
      state.level === 'structure' ? null : aromaChips(q.target)));
  } else {
    $('prompt').textContent = t('h2hPrompt', t(q.dir)[q.prop]);
    $('stage').replaceChildren();
  }

  $('options').replaceChildren(...q.options.map((g, i) => {
    const example = g.regions[0] && g.regions[0].gis[0];
    const btn = el('button', { type: 'button', class: q.type === 'h2h' ? `h2h-option kind-${g.kind}` : null },
      el('span', { class: 'key' }, i + 1),
      el('span', { class: 'opt-name' }, g.name,
        q.type === 'h2h' && example ? el('small', {}, example) : null));
    btn.disabled = !!r.answered;
    if (r.answered) {
      if (g.id === q.target.id) btn.classList.add('correct');
      else if (g.id === r.answered.id) btn.classList.add('wrong');
    }
    btn.addEventListener('click', () => answer(g));
    return btn;
  }));

  renderFeedback();
  $('next').hidden = !r.answered;
  $('next').textContent = r.index === ROUND_LENGTH - 1 ? t('finish') : t('next');
  if (r.answered) $('next').focus();
}

function answer(g) {
  const r = state.round;
  if (r.answered) return;
  const q = r.q;
  const ok = g.id === q.target.id;
  r.answered = g;
  r.ok = ok;
  r.deckNote = null;
  state.progress.counter = (state.progress.counter || 0) + 1;

  if (q.type === 'blind') {
    recordStat(q.target.id, ok);
  } else {
    recordStat(q.a.id, ok);
    recordStat(q.b.id, ok);
  }

  if (ok) {
    r.score += 1;
    if (q.deckKey) r.deckNote = promoteDeck(q.deckKey);
  } else {
    const pair = q.type === 'blind' ? [q.target.id, g.id] : [q.a.id, q.b.id];
    if (q.deckKey) delete state.progress.deck[q.deckKey];
    recordMixup(q.type, pair[0], pair[1]);
    r.mixups.push(pair);
    r.deckNote = 'added';
  }
  saveTrainer(state.progress);
  renderDrill();
}

function renderFeedback() {
  const r = state.round;
  const fb = $('feedback');
  fb.hidden = !r.answered;
  if (!r.answered) return;
  const q = r.q;
  const right = q.target;
  const parts = [];

  if (r.ok) {
    parts.push(el('p', { class: 'fb-title ok' }, t('correct'), ' ', libraryLink(right)));
  } else if (q.type === 'blind') {
    parts.push(el('p', { class: 'fb-title bad' }, t('wrongBlind', r.answered.name, right.name)));
  } else {
    parts.push(el('p', { class: 'fb-title bad' }, t('wrongH2h', right.name)));
  }

  // Comparison: blind+wrong = your pick vs correct; head-to-head = always both grapes.
  if (q.type === 'h2h') {
    parts.push(compareTable(q.a, q.b, q.a.name, q.b.name, q.prop));
  } else if (!r.ok) {
    parts.push(compareTable(r.answered, right, `${t('yourPick')}: ${r.answered.name}`, `${t('answer')}: ${right.name}`));
    parts.push(el('p', { class: 'muted small' }, differingProps(r.answered, right).length ? t('differs') : t('sameStructure')));
  }

  parts.push(el('p', { class: 'giveaway' }, el('strong', {}, `${t('giveaway')} (${right.name}): `), right.signature[state.lang]));
  if (q.type === 'h2h') {
    const other = right.id === q.a.id ? q.b : q.a;
    parts.push(el('p', { class: 'giveaway' }, el('strong', {}, `${other.name}: `), other.signature[state.lang]));
  }

  const note = { added: t('toDeck'), up: t('deckUp'), done: t('deckDone') }[r.deckNote];
  if (note) parts.push(el('p', { class: `deck-note ${r.deckNote}` }, note));

  fb.className = `feedback trainer-fb ${r.ok ? 'ok' : 'bad'}`;
  fb.replaceChildren(...parts);
}

function next() {
  const r = state.round;
  if (!r.answered) return;
  r.index += 1;
  if (r.index >= ROUND_LENGTH) {
    show('summary');
    renderSummary();
  } else {
    ask();
  }
}

// ---- Summary ----

function renderSummary() {
  const r = state.round;
  $('sum-score').textContent = `${r.score} / ${ROUND_LENGTH} (${Math.round((100 * r.score) / ROUND_LENGTH)} %)`;
  const seen = new Set();
  const pairs = r.mixups.filter(([a, b]) => {
    const k = [a, b].sort().join('|');
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  $('sum-mixups').replaceChildren(
    el('h3', {}, t('mixups')),
    pairs.length
      ? el('ul', { class: 'mixups' }, pairs.map(([a, b]) => el('li', {}, libraryLink(byId(a)), ' ↔ ', libraryLink(byId(b)))))
      : el('p', { class: 'muted' }, t('noMixups')));
  const total = Object.keys(state.progress.deck).length;
  $('sum-deck').textContent = t('deckInfo', total, 0);
}

// ---- Wiring ----

function render() {
  document.documentElement.lang = state.lang;
  for (const btn of document.querySelectorAll('.lang button')) btn.classList.toggle('active', btn.dataset.lang === state.lang);
  for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  if (!state.grapes.length) return;
  if (!$('setup').hidden) renderSetup();
  if (!$('drill').hidden) renderDrill();
  if (!$('summary').hidden) renderSummary();
}

for (const btn of document.querySelectorAll('.lang button')) {
  btn.addEventListener('click', () => { state.lang = btn.dataset.lang; saveLang(state.lang); render(); });
}
$('start').addEventListener('click', startRound);
$('again').addEventListener('click', startRound);
$('next').addEventListener('click', next);
$('quit').addEventListener('click', () => { show('setup'); renderSetup(); });
$('settings').addEventListener('click', () => { show('setup'); renderSetup(); });
$('reset').addEventListener('click', () => {
  if (!confirm(t('resetConfirm'))) return;
  state.progress = { deck: {}, stats: {}, counter: 0 };
  saveTrainer(state.progress);
  renderSetup();
});
document.addEventListener('keydown', e => {
  if ($('drill').hidden) return;
  const n = Number(e.key);
  if (n >= 1 && n <= 4) {
    const btn = $('options').children[n - 1];
    if (btn && !btn.disabled) btn.click();
  } else if (e.key === 'Enter' && !$('next').hidden) {
    e.preventDefault();
    next();
  }
});

async function init() {
  render();
  try {
    const res = await fetch('library.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    state.aromas = data.aromas;
    state.grapes = data.items.filter(i => i.group === 'principal' || i.group === 'regional');
  } catch {
    $('error').textContent = t('loadError');
    $('error').hidden = false;
    return;
  }
  show('setup');
  render();
}

init();
