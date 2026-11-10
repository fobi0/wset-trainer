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
// - Build the profile: a grape name; set every structure row and pick its typical aromas.
// - Aroma sorting: rare (signature) aromas -> name the grape, or aroma -> primary/secondary/tertiary.
// - Mix: all four drill types in turn.
// - Every mix-up goes into a "confusables deck" (Leitner boxes) and comes back after
//   2, 5 and 12 questions until it's answered right three times in a row.

const ROUND_LENGTH = 15;
const DECK_INTERVALS = [0, 2, 5, 12]; // questions until a deck entry is due again, by box (1-3)
const DECK_SHARE = 0.6;               // chance to ask a due deck entry instead of a new question
const MODES = ['blind', 'h2h', 'build', 'aroma', 'mix'];
const LAYERS = ['primary', 'secondary', 'tertiary'];

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
    mode_build: 'Build the profile',
    mode_build_desc: 'See a grape, set its structure and aromas',
    mode_aroma: 'Aroma sorting',
    mode_aroma_desc: 'Signature aromas and aroma layers',
    mode_mix: 'Mix',
    mode_mix_desc: 'All four drills in turn: the most varied way to train',
    kind_black: 'Black grape',
    kind_white: 'White grape',
    buildPrompt: name => `Build the profile of ${name}`,
    pickAromas: n => `Pick the ${n} aromas that fit`,
    check: 'Check',
    buildMissing: 'Set every row and pick the aromas first.',
    buildOk: 'Well built',
    buildBad: 'Not quite',
    buildScore: (s, sn, a, an) => `${s} of ${sn} structure rows and ${a} of ${an} aromas right.`,
    verdict_hit: '✓',
    verdict_near: '≈ one step off',
    verdict_miss: '✗',
    markerLegend: 'Filled = correct range, outlined = your setting.',
    aromaGrapePrompt: 'Which grape are these aromas typical of?',
    aromaLayerPrompt: 'Is this a primary, secondary or tertiary aroma?',
    primary: 'Primary',
    primarySub: 'grape and fermentation',
    secondary: 'Secondary',
    secondarySub: 'oak, MLF, lees, flor',
    tertiary: 'Tertiary',
    tertiarySub: 'bottle and cask ageing',
    layerAdj: { primary: 'primary', secondary: 'secondary', tertiary: 'tertiary' },
    layerAnswer: (a, l) => `${a} is a ${l} aroma.`,
    primaryWhy: 'Primary aromas come from the grape itself and the alcoholic fermentation: fruit, flowers, herbs, spice.',
    secondaryWhy: 'Secondary aromas come from winemaking after fermentation: oak (vanilla, toast), malolactic conversion (butter), lees (bread, biscuit) or flor.',
    tertiaryWhy: 'Tertiary aromas develop with ageing in bottle or cask, often through slow oxidation: leather, mushroom, honey, nuts, dried fruit.',
    foundIn: 'Found in',
    profileMiss: 'profile',
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
    mode_build: 'Profil bauen',
    mode_build_desc: 'Rebsorte sehen, Struktur und Aromen einstellen',
    mode_aroma: 'Aromen zuordnen',
    mode_aroma_desc: 'Leitaromen und Aromaschichten',
    mode_mix: 'Mix',
    mode_mix_desc: 'Alle vier Übungen im Wechsel: am abwechslungsreichsten',
    kind_black: 'Rote Rebsorte',
    kind_white: 'Weiße Rebsorte',
    buildPrompt: name => `Baue das Profil von ${name}`,
    pickAromas: n => `Wähle die ${n} passenden Aromen`,
    check: 'Prüfen',
    buildMissing: 'Stelle erst jede Zeile ein und wähle die Aromen.',
    buildOk: 'Gut gebaut',
    buildBad: 'Noch nicht ganz',
    buildScore: (s, sn, a, an) => `${s} von ${sn} Strukturzeilen und ${a} von ${an} Aromen richtig.`,
    verdict_hit: '✓',
    verdict_near: '≈ eine Stufe daneben',
    verdict_miss: '✗',
    markerLegend: 'Gefüllt = richtiger Bereich, umrandet = deine Einstellung.',
    aromaGrapePrompt: 'Für welche Rebsorte sind diese Aromen typisch?',
    aromaLayerPrompt: 'Ist das ein primäres, sekundäres oder tertiäres Aroma?',
    primary: 'Primär',
    primarySub: 'Traube und Gärung',
    secondary: 'Sekundär',
    secondarySub: 'Holz, BSA, Hefe, Flor',
    tertiary: 'Tertiär',
    tertiarySub: 'Flaschen- und Fassreifung',
    layerAdj: { primary: 'primäres', secondary: 'sekundäres', tertiary: 'tertiäres' },
    layerAnswer: (a, l) => `${a} ist ein ${l} Aroma.`,
    primaryWhy: 'Primäraromen stammen aus der Traube selbst und der alkoholischen Gärung: Frucht, Blüten, Kräuter, Würze.',
    secondaryWhy: 'Sekundäraromen entstehen bei der Weinbereitung nach der Gärung: Holz (Vanille, Röstnoten), BSA (Butter), Hefelager (Brot, Keks) oder Flor.',
    tertiaryWhy: 'Tertiäraromen entwickeln sich bei der Reifung in Flasche oder Fass, oft durch langsame Oxidation: Leder, Pilz, Honig, Nüsse, Trockenfrüchte.',
    foundIn: 'Typisch für',
    profileMiss: 'Profil',
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
    .filter(([, e]) => e.due <= c && (state.mode === 'mix' || e.mode === state.mode) && inPool(byId(e.a)) && inPool(byId(e.b)));
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

// ---- Aroma index ----

// AROMA_FREQ: how many trainable grapes list an aroma (any layer); 1 = a true signature aroma.
// AROMA_LAYER: the layer an aroma always belongs to, or null if it appears in different layers.
let AROMA_FREQ = {};
let AROMA_LAYER = {};
function indexAromas() {
  const layers = {};
  AROMA_FREQ = {};
  for (const g of state.grapes) {
    for (const layer of LAYERS) for (const a of g.aromas[layer]) (layers[a] = layers[a] || new Set()).add(layer);
    for (const a of aromaSet(g)) AROMA_FREQ[a] = (AROMA_FREQ[a] || 0) + 1;
  }
  AROMA_LAYER = Object.fromEntries(Object.entries(layers).map(([a, set]) => [a, set.size === 1 ? [...set][0] : null]));
}

const grapeOption = (g, withExample) => ({
  key: g.id, label: g.name, kind: g.kind,
  sub: withExample && g.regions[0] ? g.regions[0].gis[0] : null,
});

// ---- Question generators ----

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
  return {
    type: 'blind', target, answerKey: target.id, deckKey: fromDeck ? fromDeck.key : null,
    options: shuffle([target, ...chosen]).map(g => grapeOption(g)),
  };
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
  const target = (dir === 'more') === aHigher ? a : b;
  return {
    type: 'h2h', a, b, prop, dir, target, answerKey: target.id, deckKey: fromDeck ? fromDeck.key : null,
    options: shuffle([a, b]).map(g => grapeOption(g, true)),
  };
}

// Build the profile: set every structure row and pick the grape's most distinctive primary aromas.
const BUILD_AROMAS = 3;
function buildQuestion(fromDeck) {
  const target = fromDeck ? byId(fromDeck.a) : weightedTarget(state.grapes.filter(inPool));
  const correct = [...target.aromas.primary]
    .sort((x, y) => (AROMA_FREQ[x] - AROMA_FREQ[y]) || (Math.random() - 0.5))
    .slice(0, BUILD_AROMAS);
  const own = aromaSet(target);
  const sameKind = shuffle([...new Set(state.grapes
    .filter(g => g.id !== target.id && g.kind === target.kind)
    .flatMap(g => g.aromas.primary))].filter(a => !own.has(a)));
  const decoys = sameKind.slice(0, 8 - correct.length);
  return {
    type: 'build', target, deckKey: fromDeck ? fromDeck.key : null,
    props: PROPS.filter(p => target.structure[p]),
    correctAromas: correct, aromaPool: shuffle([...correct, ...decoys]),
    picks: {}, aromaPicks: new Set(), error: false,
  };
}

// Aroma sorting, type 1: rare ("signature") aromas, name the grape.
function aromaGrapeQuestion(fromDeck) {
  const pool = state.grapes.filter(inPool);
  let target;
  let clues = [];
  for (let tries = 0; !clues.length && tries < 30; tries++) {
    target = fromDeck && tries === 0 ? byId(fromDeck.a) : weightedTarget(pool);
    clues = shuffle([...aromaSet(target)].filter(a => AROMA_FREQ[a] <= 2))
      .sort((x, y) => AROMA_FREQ[x] - AROMA_FREQ[y])
      .slice(0, 2);
  }
  // Barbera, Montepulciano and Cortese have no rare aroma; if the pool only offers such grapes, ask a layer question instead.
  if (!clues.length) return aromaLayerQuestion();
  const hasClue = g => clues.some(c => aromaSet(g).has(c));
  let others = state.grapes
    .filter(g => g.id !== target.id && !hasClue(g))
    .map(g => ({ g, d: distance(target, g, false) }))
    .sort((x, y) => x.d - y.d)
    .slice(0, 3)
    .map(x => x.g);
  const decoy = fromDeck && byId(fromDeck.b);
  if (decoy && !hasClue(decoy) && !others.includes(decoy)) others = [decoy, ...others].slice(0, 3);
  return {
    type: 'aroma-grape', target, clues, answerKey: target.id, deckKey: fromDeck ? fromDeck.key : null,
    options: shuffle([target, ...others]).map(g => grapeOption(g)),
  };
}

// Aroma sorting, type 2: is this aroma primary, secondary or tertiary? (Only aromas with one clear layer.)
function aromaLayerQuestion() {
  const layer = pick(LAYERS.filter(l => Object.values(AROMA_LAYER).includes(l)));
  const a = pick(Object.keys(AROMA_LAYER).filter(x => AROMA_LAYER[x] === layer));
  return {
    type: 'aroma-layer', aroma: a, answerKey: layer, deckKey: null,
    examples: state.grapes.filter(g => aromaSet(g).has(a)).slice(0, 3),
    options: LAYERS.map(l => ({ key: l, label: t(l), sub: t(l + 'Sub'), layer: l })),
  };
}

const MODE_OF = { blind: 'blind', h2h: 'h2h', build: 'build', 'aroma-grape': 'aroma', 'aroma-layer': 'aroma' };

function nextQuestion() {
  // Layer questions never enter the deck, so reserve them a fixed share or a full deck would crowd them out.
  if (state.mode === 'aroma' && Math.random() < 0.4) return aromaLayerQuestion();
  const due = dueEntries();
  const fromDeck = due.length && Math.random() < DECK_SHARE ? (([key, e]) => ({ key, ...e }))(pick(due)) : null;
  const mode = fromDeck ? fromDeck.mode : state.mode === 'mix' ? pick(['blind', 'h2h', 'build', 'aroma']) : state.mode;
  if (mode === 'blind') return blindQuestion(fromDeck);
  if (mode === 'h2h') return h2hQuestion(fromDeck);
  if (mode === 'build') return buildQuestion(fromDeck);
  return fromDeck || Math.random() < 0.6 ? aromaGrapeQuestion(fromDeck) : aromaLayerQuestion();
}

// ---- Rendering helpers ----

function aromaChips(g, layers = LAYERS) {
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

// Meter showing the correct range (filled) and the learner's setting (outlined).
function markedMeter(p, range, value) {
  const node = meter(p, range, state.lang);
  [...node.children].forEach((seg, i) => { if (i + 1 === value) seg.classList.add('pick'); });
  return node;
}

// ---- Setup ----

function renderChoice(containerId, keys, current, labelPrefix, onPick) {
  $(containerId).replaceChildren(...keys.map(key => {
    const btn = el('button', { type: 'button', class: key === current ? 'chip active' : 'chip', 'aria-pressed': String(key === current) }, t(labelPrefix + key));
    btn.addEventListener('click', () => { onPick(key); renderSetup(); });
    return btn;
  }));
}

function renderSetup() {
  $('modes').replaceChildren(...MODES.map(m => {
    const btn = el('button', { type: 'button', class: `mode${m === state.mode ? ' active' : ''}${m === 'mix' ? ' wide' : ''}`, 'aria-pressed': String(m === state.mode) },
      el('strong', {}, t('mode_' + m)), el('span', {}, t(`mode_${m}_desc`)));
    btn.addEventListener('click', () => { state.mode = m; renderSetup(); });
    return btn;
  }));
  $('level-field').hidden = !(state.mode === 'blind' || state.mode === 'mix');
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
  r.ok = null;
  r.deckNote = null;
  renderDrill();
}

function renderStage(q) {
  if (q.type === 'blind') {
    return el('div', { class: `blind-card kind-${q.target.kind}` },
      profileTable(q.target),
      state.level === 'structure' ? null : aromaChips(q.target));
  }
  if (q.type === 'build') return buildStage(q);
  if (q.type === 'aroma-grape') {
    return el('div', { class: 'clue-card' }, q.clues.map(a => el('span', { class: 'clue' }, aroma(a))));
  }
  if (q.type === 'aroma-layer') {
    return el('div', { class: 'clue-card' }, el('span', { class: 'clue' }, aroma(q.aroma)));
  }
  return null;
}

function renderDrill() {
  const r = state.round;
  const q = r.q;
  $('counter').textContent = t('counter', r.index + 1, ROUND_LENGTH);
  $('drill-badge').textContent = q.deckKey ? t('fromDeck') : t('mode_' + MODE_OF[q.type]);
  $('drill-badge').classList.toggle('deck', !!q.deckKey);
  $('progress-bar').style.width = `${((r.index + (r.answered ? 1 : 0)) / ROUND_LENGTH) * 100}%`;

  $('prompt').textContent = {
    blind: () => t('blindPrompt'),
    h2h: () => t('h2hPrompt', t(q.dir)[q.prop]),
    build: () => t('buildPrompt', q.target.name),
    'aroma-grape': () => t('aromaGrapePrompt'),
    'aroma-layer': () => t('aromaLayerPrompt'),
  }[q.type]();
  $('stage').replaceChildren(...[renderStage(q)].filter(Boolean));

  if (q.type === 'build') {
    const check = el('button', { type: 'button', class: 'primary check' }, t('check'));
    check.addEventListener('click', checkBuild);
    $('options').replaceChildren(...(r.answered ? [] : [check, q.error ? el('p', { class: 'form-error' }, t('buildMissing')) : null].filter(Boolean)));
  } else {
    $('options').replaceChildren(...q.options.map((opt, i) => {
      const cls = opt.layer ? `layer-option aroma-${opt.layer}` : opt.sub ? `h2h-option kind-${opt.kind}` : null;
      const btn = el('button', { type: 'button', class: cls },
        el('span', { class: 'key' }, i + 1),
        el('span', { class: 'opt-name' }, opt.label, opt.sub ? el('small', {}, opt.sub) : null));
      btn.disabled = !!r.answered;
      if (r.answered) {
        if (opt.key === q.answerKey) btn.classList.add('correct');
        else if (opt.key === r.answered.key) btn.classList.add('wrong');
      }
      btn.addEventListener('click', () => answer(opt));
      return btn;
    }));
  }

  renderFeedback();
  $('next').hidden = !r.answered;
  $('next').textContent = r.index === ROUND_LENGTH - 1 ? t('finish') : t('next');
  if (r.answered) $('next').focus();
}

// Shared bookkeeping for every answered question.
function finish(ok, statIds, mixup) {
  const r = state.round;
  const q = r.q;
  r.ok = ok;
  state.progress.counter = (state.progress.counter || 0) + 1;
  for (const id of statIds) recordStat(id, ok);
  if (ok) {
    r.score += 1;
    if (q.deckKey) r.deckNote = promoteDeck(q.deckKey);
  } else if (mixup) {
    if (q.deckKey) delete state.progress.deck[q.deckKey];
    recordMixup(MODE_OF[q.type], mixup[0], mixup[1]);
    r.mixups.push(mixup);
    r.deckNote = 'added';
  }
  saveTrainer(state.progress);
  renderDrill();
}

function answer(opt) {
  const r = state.round;
  const q = r.q;
  if (r.answered || q.type === 'build') return;
  r.answered = opt;
  const ok = opt.key === q.answerKey;
  if (q.type === 'blind' || q.type === 'aroma-grape') finish(ok, [q.target.id], [q.target.id, opt.key]);
  else if (q.type === 'h2h') finish(ok, [q.a.id, q.b.id], [q.a.id, q.b.id]);
  else finish(ok, [], null); // aroma layer: no grape involved
}

// ---- Build the profile ----

function buildStage(q) {
  const r = state.round;
  const done = !!r.answered;
  const rows = q.props.map(p => {
    const value = q.picks[p];
    let control;
    let verdict = null;
    if (done) {
      const res = r.buildResult.rows[p];
      control = markedMeter(p, q.target.structure[p], value);
      verdict = el('span', { class: `verdict ${res}` }, t('verdict_' + res));
    } else {
      control = el('span', { class: `picker meter meter-${p}`, role: 'group', 'aria-label': PROP_LABELS[state.lang][p] },
        [1, 2, 3, 4, 5].map(i => {
          const seg = el('button', { type: 'button', class: value && i <= value ? 'seg on' : 'seg', 'aria-pressed': String(value === i), 'aria-label': SCALES[p][state.lang][i - 1] });
          seg.addEventListener('click', () => { q.picks[p] = i; q.error = false; renderDrill(); });
          return seg;
        }));
    }
    return el('tr', {},
      el('th', { scope: 'row' }, PROP_LABELS[state.lang][p]),
      el('td', { class: 'meter-cell' }, control),
      el('td', { class: 'scale-text' },
        value ? SCALES[p][state.lang][value - 1] : '—',
        // After checking a row that wasn't a hit, also show the correct range as text.
        done && r.buildResult.rows[p] !== 'hit' ? ` → ${scaleText(p, q.target.structure[p], state.lang)}` : null,
        verdict ? ' ' : null, verdict));
  });

  const chips = q.aromaPool.map(a => {
    const picked = q.aromaPicks.has(a);
    const right = q.correctAromas.includes(a);
    if (done) {
      const cls = picked && right ? 'hit' : picked ? 'miss' : right ? 'missed' : 'idle';
      return el('span', { class: `chip pick-chip ${cls}` }, aroma(a));
    }
    const btn = el('button', { type: 'button', class: `chip pick-chip${picked ? ' active' : ''}`, 'aria-pressed': String(picked) }, aroma(a));
    btn.addEventListener('click', () => {
      if (picked) q.aromaPicks.delete(a);
      else if (q.aromaPicks.size < BUILD_AROMAS) q.aromaPicks.add(a);
      q.error = false;
      renderDrill();
    });
    return btn;
  });

  return el('div', { class: `blind-card build-card kind-${q.target.kind}` },
    el('p', { class: 'build-head' }, el('span', { class: 'badge-kind' }, t('kind_' + q.target.kind)), ' ',
      q.target.regions[0] ? el('span', { class: 'muted' }, q.target.regions[0].gis.slice(0, 2).join(' · ')) : null),
    el('table', { class: 'structure build' }, el('tbody', {}, rows)),
    done ? el('p', { class: 'muted small' }, t('markerLegend')) : null,
    el('p', { class: 'aroma-instruction' }, t('pickAromas', BUILD_AROMAS), ` (${q.aromaPicks.size}/${BUILD_AROMAS})`),
    el('div', { class: 'chips' }, chips));
}

function checkBuild() {
  const r = state.round;
  const q = r.q;
  if (r.answered) return;
  if (q.props.some(p => !q.picks[p]) || q.aromaPicks.size !== BUILD_AROMAS) {
    q.error = true;
    renderDrill();
    return;
  }
  const rows = {};
  for (const p of q.props) {
    const [lo, hi] = q.target.structure[p];
    const v = q.picks[p];
    rows[p] = v >= lo && v <= hi ? 'hit' : Math.min(Math.abs(v - lo), Math.abs(v - hi)) === 1 ? 'near' : 'miss';
  }
  const values = Object.values(rows);
  const hits = values.filter(x => x === 'hit').length;
  const misses = values.filter(x => x === 'miss').length;
  const aromaHits = [...q.aromaPicks].filter(a => q.correctAromas.includes(a)).length;
  r.buildResult = { rows, hits, aromaHits };
  r.answered = { key: 'build' };
  // Passed: nothing far off, at most one row a step off, and nearly all aromas right.
  const ok = misses === 0 && values.length - hits <= 1 && aromaHits >= BUILD_AROMAS - 1;
  finish(ok, [q.target.id], [q.target.id, q.target.id]);
}

// ---- Feedback ----

function renderFeedback() {
  const r = state.round;
  const fb = $('feedback');
  fb.hidden = !r.answered;
  if (!r.answered) return;
  const q = r.q;
  const parts = [];

  if (q.type === 'aroma-layer') {
    const layerName = t('layerAdj')[q.answerKey];
    parts.push(el('p', { class: `fb-title ${r.ok ? 'ok' : 'bad'}` }, `${r.ok ? t('correct') + ' ' : ''}${t('layerAnswer', aroma(q.aroma), layerName)}`));
    parts.push(el('p', {}, t(q.answerKey + 'Why')));
    if (q.examples.length) parts.push(el('p', { class: 'giveaway' }, el('strong', {}, `${t('foundIn')}: `), ...q.examples.flatMap((g, i) => [i ? ', ' : '', libraryLink(g)])));
  } else {
    const right = q.target;
    const picked = q.type === 'build' ? null : byId(r.answered.key);
    if (q.type === 'build') {
      const b = r.buildResult;
      parts.push(el('p', { class: `fb-title ${r.ok ? 'ok' : 'bad'}` }, `${r.ok ? t('buildOk') : t('buildBad')}: `,
        t('buildScore', b.hits, q.props.length, b.aromaHits, BUILD_AROMAS)));
      parts.push(el('p', { class: 'giveaway' }, el('strong', {}, `${t('aromasLabel')} (${right.name}): `),
        right.aromas.primary.map(aroma).join(', ')));
    } else if (r.ok) {
      parts.push(el('p', { class: 'fb-title ok' }, t('correct'), ' ', libraryLink(right)));
    } else if (q.type === 'h2h') {
      parts.push(el('p', { class: 'fb-title bad' }, t('wrongH2h', right.name)));
    } else {
      parts.push(el('p', { class: 'fb-title bad' }, t('wrongBlind', picked.name, right.name)));
    }

    // Comparison: head-to-head = always both grapes; blind/aroma + wrong = your pick vs correct.
    if (q.type === 'h2h') {
      parts.push(compareTable(q.a, q.b, q.a.name, q.b.name, q.prop));
    } else if (!r.ok && picked) {
      parts.push(compareTable(picked, right, `${t('yourPick')}: ${picked.name}`, `${t('answer')}: ${right.name}`));
      parts.push(el('p', { class: 'muted small' }, differingProps(picked, right).length ? t('differs') : t('sameStructure')));
    }

    parts.push(el('p', { class: 'giveaway' }, el('strong', {}, `${t('giveaway')} (${right.name}): `), right.signature[state.lang]));
    if (q.type === 'h2h') {
      const other = right.id === q.a.id ? q.b : q.a;
      parts.push(el('p', { class: 'giveaway' }, el('strong', {}, `${other.name}: `), other.signature[state.lang]));
    }
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
      ? el('ul', { class: 'mixups' }, pairs.map(([a, b]) => el('li', {},
          a === b ? [libraryLink(byId(a)), ` (${t('profileMiss')})`] : [libraryLink(byId(a)), ' ↔ ', libraryLink(byId(b))])))
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
  if ($('drill').hidden || (state.round && state.round.q && state.round.q.type === 'build')) return;
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
    indexAromas();
  } catch {
    $('error').textContent = t('loadError');
    $('error').hidden = false;
    return;
  }
  show('setup');
  render();
}

init();
