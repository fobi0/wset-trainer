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

// The language choice is shared between both pages.
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
