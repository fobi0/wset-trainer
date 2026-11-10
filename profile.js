'use strict';

// Shared by the library (library.js) and the trainer (trainer.js):
// DOM helper, WSET structure scales and the colour-coded meters.

// Small DOM helper: el('a', { href: '#', class: 'x' }, 'text', childNode, ...)
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : String(c));
  }
  return node;
}

const PROPS = ['colour', 'sweetness', 'acidity', 'tannin', 'alcohol', 'body'];

const PROP_LABELS = {
  en: { colour: 'Colour', sweetness: 'Sweetness', acidity: 'Acidity', tannin: 'Tannin', alcohol: 'Alcohol', body: 'Body' },
  de: { colour: 'Farbe', sweetness: 'Süße', acidity: 'Säure', tannin: 'Tannin', alcohol: 'Alkohol', body: 'Körper' },
};

// WSET-style 5-step scales (index 1..5).
const LEVELS = {
  en: ['low', 'medium(−)', 'medium', 'medium(+)', 'high'],
  de: ['niedrig', 'mittel(−)', 'mittel', 'mittel(+)', 'hoch'],
};
const SCALES = {
  colour: { en: ['pale', 'medium(−)', 'medium', 'medium(+)', 'deep'], de: ['blass', 'mittel(−)', 'mittel', 'mittel(+)', 'tief'] },
  sweetness: { en: ['dry', 'off-dry', 'medium', 'sweet', 'luscious'], de: ['trocken', 'halbtrocken', 'lieblich', 'süß', 'edelsüß'] },
  acidity: LEVELS,
  tannin: LEVELS,
  alcohol: LEVELS,
  body: { en: ['light', 'medium(−)', 'medium', 'medium(+)', 'full'], de: ['leicht', 'mittel(−)', 'mittel', 'mittel(+)', 'voll'] },
};

function scaleText(prop, range, lang) {
  if (!range) return '—';
  const labels = SCALES[prop][lang];
  const [a, b] = range;
  return a === b ? labels[a - 1] : `${labels[a - 1]} – ${labels[b - 1]}`;
}

// 5-segment meter with the range [a, b] filled in the property's colour.
function meter(prop, range, lang, small = false) {
  const cls = `meter meter-${prop}${small ? ' small' : ''}`;
  if (!range) return el('span', { class: `${cls} empty`, role: 'img', 'aria-label': '—' }, '—');
  const node = el('span', { class: cls, role: 'img', 'aria-label': `${PROP_LABELS[lang][prop]}: ${scaleText(prop, range, lang)}` });
  for (let i = 1; i <= 5; i++) node.append(el('span', { class: i >= range[0] && i <= range[1] ? 'seg on' : 'seg' }));
  return node;
}

const midpoint = range => (range ? (range[0] + range[1]) / 2 : null);

// Trainer progress, stored per device. Read by the library to draw mastery rings.
const TRAINER_KEY = 'wset-trainer';
function loadTrainer() {
  try {
    const data = JSON.parse(localStorage.getItem(TRAINER_KEY) || '{}');
    return { deck: data.deck || {}, stats: data.stats || {}, counter: data.counter || 0 };
  } catch {
    return { deck: {}, stats: {}, counter: 0 };
  }
}
function saveTrainer(data) {
  try { localStorage.setItem(TRAINER_KEY, JSON.stringify(data)); } catch {}
}
