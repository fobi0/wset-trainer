'use strict';

// ============================================================================
// FILL IN BEFORE PUBLISHING: who is responsible for this site (GDPR Art. 13).
// Use a private contact address, not a work one. A postal address is not required here.
const CONTACT = {
  name: 'Fabian Busse',
  email: 'fabianbusse635@gmail.com',
};
// ============================================================================

const PLACEHOLDER = CONTACT.name === 'DEIN NAME' || CONTACT.email.endsWith('@example.org');
const GITHUB_PRIVACY = 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement';
const DPF_LIST = 'https://www.dataprivacyframework.gov/list';
const STORAGE_KEYS = ['wset-quiz-lang', TRAINER_KEY];

// Text blocks: strings, or { link, href } for links. Kept short and plain on purpose.
const I18N = {
  en: {
    navQuiz: 'Quiz',
    navLibrary: 'Library',
    navTraining: 'Training',
    title: 'Privacy notice',
    updated: 'Last updated: November 2026',
    placeholder: 'The site owner still has to fill in their name and contact address in privacy.js.',
    sections: [
      { h: '1. Who is responsible', p: [
        ['This is a private, non-commercial learning site. Responsible for data processing under the GDPR:'],
        ['{name}', ', ', '{email}'],
      ] },
      { h: '2. Hosting by GitHub Pages', p: [
        ['This site is hosted on GitHub Pages by GitHub, Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA. When you open a page, GitHub processes technical access data, including your IP address, in order to deliver the site and keep it secure (server logs).'],
        ['Legal basis is Art. 6(1)(f) GDPR (legitimate interest in delivering the site securely and reliably). I have no access to these logs myself. Data may be transferred to the USA; GitHub states that it participates in the EU-US Data Privacy Framework (', { link: 'DPF list', href: DPF_LIST }, ').'],
        ['Details: ', { link: "GitHub's privacy statement", href: GITHUB_PRIVACY }, '.'],
      ] },
      { h: '3. Data stored on your device', p: [
        ['The site stores two things in your browser\'s local storage: your language choice and your training progress (scores and the list of grapes you mixed up). This data stays on your device and is never sent to anyone.'],
        ['For offline use, the app also saves its own files (pages, questions) in your browser. These contain no personal data.'],
        ['This storage is strictly necessary for features you use on purpose (§ 25(2) no. 2 TDDDG), so no consent banner is needed. You can delete it at any time below or in your browser settings.'],
      ] },
      { h: '4. No cookies, no tracking', p: [
        ['The site sets no cookies, uses no analytics or tracking, shows no ads and loads nothing from third parties (no external fonts, scripts or embeds).'],
      ] },
      { h: '5. Your rights', p: [
        ['You have the right to access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction of processing (Art. 18) and to object (Art. 21). Contact me at the address above. For the server logs, you can also contact GitHub directly.'],
        ['You also have the right to lodge a complaint with a data protection supervisory authority (Art. 77 GDPR).'],
      ] },
    ],
    deleteTitle: 'Delete your stored data',
    deleteText: 'Removes your language choice and all training progress from this browser.',
    deleteButton: 'Delete stored data',
    deleteConfirm: 'Delete your language choice and all training progress from this browser?',
    storageSome: n => `Currently stored in this browser: ${n} item${n === 1 ? '' : 's'}.`,
    storageNone: 'Nothing is stored in this browser.',
    deleted: 'Done. Your stored data has been deleted.',
  },
  de: {
    navQuiz: 'Quiz',
    navLibrary: 'Bibliothek',
    navTraining: 'Training',
    title: 'Datenschutzhinweis',
    updated: 'Stand: November 2026',
    placeholder: 'Der Betreiber muss Name und Kontaktadresse noch in privacy.js eintragen.',
    sections: [
      { h: '1. Verantwortlicher', p: [
        ['Dies ist eine private, nicht kommerzielle Lernseite. Verantwortlich für die Datenverarbeitung im Sinne der DSGVO:'],
        ['{name}', ', ', '{email}'],
      ] },
      { h: '2. Hosting über GitHub Pages', p: [
        ['Diese Seite wird über GitHub Pages bereitgestellt, einen Dienst der GitHub, Inc., 88 Colin P Kelly Jr St, San Francisco, CA 94107, USA. Beim Aufruf verarbeitet GitHub technische Zugriffsdaten, darunter deine IP-Adresse, um die Seite auszuliefern und abzusichern (Server-Logs).'],
        ['Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer sicheren und zuverlässigen Bereitstellung). Ich selbst habe keinen Zugriff auf diese Protokolle. Dabei können Daten in die USA übermittelt werden; GitHub gibt an, am EU-US Data Privacy Framework teilzunehmen (', { link: 'DPF-Liste', href: DPF_LIST }, ').'],
        ['Einzelheiten: ', { link: 'Datenschutzerklärung von GitHub', href: GITHUB_PRIVACY }, '.'],
      ] },
      { h: '3. Daten auf deinem Gerät', p: [
        ['Die Seite speichert zwei Dinge im lokalen Speicher deines Browsers: deine Sprachwahl und deinen Trainingsfortschritt (Quoten und die Liste verwechselter Rebsorten). Diese Daten bleiben auf deinem Gerät und werden an niemanden übertragen.'],
        ['Für die Offline-Nutzung legt die App außerdem ihre eigenen Dateien (Seiten, Fragen) im Browser ab. Diese enthalten keine personenbezogenen Daten.'],
        ['Diese Speicherung ist für Funktionen, die du bewusst nutzt, unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG); ein Einwilligungsbanner ist daher nicht nötig. Du kannst die Daten jederzeit unten oder in den Browser-Einstellungen löschen.'],
      ] },
      { h: '4. Keine Cookies, kein Tracking', p: [
        ['Die Seite setzt keine Cookies, nutzt keine Analyse- oder Tracking-Dienste, zeigt keine Werbung und lädt nichts von Dritten (keine externen Schriften, Skripte oder Einbettungen).'],
      ] },
      { h: '5. Deine Rechte', p: [
        ['Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18) und Widerspruch (Art. 21). Wende dich dafür an die oben genannte Adresse. Zu den Server-Logs kannst du dich auch direkt an GitHub wenden.'],
        ['Außerdem hast du das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren (Art. 77 DSGVO).'],
      ] },
    ],
    deleteTitle: 'Gespeicherte Daten löschen',
    deleteText: 'Entfernt deine Sprachwahl und den gesamten Trainingsfortschritt aus diesem Browser.',
    deleteButton: 'Gespeicherte Daten löschen',
    deleteConfirm: 'Sprachwahl und gesamten Trainingsfortschritt aus diesem Browser löschen?',
    storageSome: n => `Derzeit in diesem Browser gespeichert: ${n} Eintr${n === 1 ? 'ag' : 'äge'}.`,
    storageNone: 'In diesem Browser ist nichts gespeichert.',
    deleted: 'Erledigt. Deine gespeicherten Daten wurden gelöscht.',
  },
};

const state = { lang: loadLang(), deleted: false };
const $ = id => document.getElementById(id);
const t = key => I18N[state.lang][key];

function part(x) {
  if (typeof x !== 'string') return el('a', { href: x.href, rel: 'noopener noreferrer', target: '_blank' }, x.link);
  if (x === '{name}') return el('strong', {}, CONTACT.name);
  if (x === '{email}') return el('a', { href: `mailto:${CONTACT.email}` }, CONTACT.email);
  return x;
}

function storedCount() {
  try { return STORAGE_KEYS.filter(k => localStorage.getItem(k) !== null).length; } catch { return 0; }
}

function render() {
  document.documentElement.lang = state.lang;
  applyShared(state.lang);
  for (const btn of document.querySelectorAll('.lang button')) btn.classList.toggle('active', btn.dataset.lang === state.lang);
  for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  $('placeholder-warning').hidden = !PLACEHOLDER;
  $('placeholder-warning').textContent = t('placeholder');
  $('content').replaceChildren(...t('sections').map(s =>
    el('section', { class: 'profile-section' }, el('h3', {}, s.h), s.p.map(p => el('p', {}, p.map(part))))));
  const n = storedCount();
  $('storage-status').textContent = state.deleted ? t('deleted') : n ? t('storageSome')(n) : t('storageNone');
}

for (const btn of document.querySelectorAll('.lang button')) {
  btn.addEventListener('click', () => { state.lang = btn.dataset.lang; saveLang(state.lang); state.deleted = false; render(); });
}
$('delete-data').addEventListener('click', () => {
  if (!confirm(t('deleteConfirm'))) return;
  try { for (const k of STORAGE_KEYS) localStorage.removeItem(k); } catch {}
  state.deleted = true;
  render();
});

render();
