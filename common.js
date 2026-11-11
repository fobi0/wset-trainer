'use strict';

// Shared by the quiz (app.js) and the library (library.js).

// Display order: Old World first, then New World.
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

const countryLabel = (country, lang) => (lang === 'de' ? COUNTRIES[country] || country : country);

// Footer, shown on every page (filled by applyShared).
const SHARED_I18N = {
  en: {
    disclaimer: 'Not affiliated with or endorsed by the Wine & Spirit Education Trust (WSET). Content written for self-study.',
    privacyLink: 'Privacy',
  },
  de: {
    disclaimer: 'Kein Angebot des Wine & Spirit Education Trust (WSET) und nicht mit ihm verbunden. Inhalte zum Selbststudium.',
    privacyLink: 'Datenschutz',
  },
};

function applyShared(lang) {
  for (const node of document.querySelectorAll('[data-shared]')) node.textContent = SHARED_I18N[lang][node.dataset.shared];
}

// The language choice is shared between all pages.
function loadLang() {
  try {
    const saved = localStorage.getItem('wset-quiz-lang');
    if (saved === 'en' || saved === 'de') return saved;
  } catch {}
  return navigator.language.startsWith('de') ? 'de' : 'en';
}

function saveLang(lang) {
  try { localStorage.setItem('wset-quiz-lang', lang); } catch {}
}

// Offline support and "Add to home screen" (see sw.js).
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
