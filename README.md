# WSET Quiz 🍷

A bilingual (EN/DE) multiple-choice quiz for **WSET Level 1 and Level 2** exam prep, with 400+ questions on grape varieties, regions, labelling, geography, winemaking, tasting and food pairing.

It's plain HTML, CSS and JavaScript: no build step, no backend, no database. Each quiz draws a random set of questions from `questions.json`.

> Not affiliated with or endorsed by the Wine & Spirit Education Trust (WSET). The questions were written for self-study; check anything surprising against the official course material.

## Features

- Filter by level (L1, L2 or both), by country (France, Italy, Spain, …) and by topic. The filters combine.
- Questions and answer options are shuffled for every quiz.
- Instant feedback with an explanation. Keyboard: `1`–`4` to answer, `Enter` for the next question.
- The result screen scores you against the WSET pass mark (55%) and lists every missed question. "Retry missed" drills those again.
- The EN/DE toggle works at any time, even mid-question.
- Installable as an app (PWA) and works offline after the first visit.

## Install on your phone

Open the GitHub Pages URL in **Chrome on Android**, then tap **⋮ → Add to home screen** (or **Install app**).
It opens full-screen like a normal app and works without a connection.
On iPhone, use Safari: **Share → Add to Home Screen**.

When you're online, the app always loads the latest questions. Offline, it uses the copy from your last visit.

## Publish on GitHub Pages

The workflow in `.github/workflows/pages.yml` validates `questions.json` and deploys the site on every push to `main`.
Pull requests only run the validation.

One-time setup:

1. Create an empty repository on GitHub and push this folder to its `main` branch:
   ```bash
   git init -b main
   git add .
   git commit -m "Initial commit"
   git remote add origin git@github.com:<you>/<repo>.git
   git push -u origin main
   ```
2. In the repository, go to **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**.
3. Re-run the workflow (**Actions → Deploy to GitHub Pages → Run workflow**), because the first push ran before Pages was enabled.

The site is then live at `https://<you>.github.io/<repo>/`.

Pages works for public repositories on free accounts. For private repositories it needs a paid plan.

## Run locally

Either serve the folder with Python:

```bash
python3 -m http.server 8790
```

or use Docker Compose (`podman compose` works too):

```bash
docker compose up -d --build
```

Then open http://localhost:8790. Opening `index.html` directly doesn't work, because browsers block `fetch()` on `file://`.
The container copies the files into the image, so rebuild after every change.

## Questions

Each entry in `questions.json` is one question, in both languages:

```json
{
  "id": "l2-041",
  "level": 2,
  "topic": "Regions",
  "countries": ["Italy"],
  "answer": 0,
  "en": { "question": "…", "options": ["…", "…", "…", "…"], "explanation": "…" },
  "de": { "question": "…", "options": ["…", "…", "…", "…"], "explanation": "…" }
}
```

- `answer` is the index of the correct option and applies to both languages, so `de.options` must be in the same order as `en.options`. The app shuffles the options when it shows them.
- `topic` is one of: Wine Types, Grape Varieties, Viticulture, Winemaking, Tasting, Food & Wine, Service & Storage, Regions, Geography, Sparkling, Sweet & Fortified, Labelling. A new topic also needs its German name in `TOPICS_DE` in `app.js`.
- `countries` is optional. It lists the country (or countries) the question is about, and drives the country filter. Allowed names are in `COUNTRIES` in `app.js` and `validate.py`.

Check the file after you edit it (CI runs the same check):

```bash
python3 validate.py
```

## Files

| File | Purpose |
|------|---------|
| `index.html`, `style.css`, `app.js` | The app |
| `questions.json` | Question bank (EN + DE) |
| `manifest.webmanifest`, `sw.js`, `icons/` | PWA: install metadata, offline cache (network-first), app icons |
| `tools/make_icons.py` | Regenerates the icons (pure Python, no dependencies) |
| `validate.py` | Question file checks (used by CI) |
| `.github/workflows/pages.yml` | Validate + deploy to GitHub Pages |
| `.github/dependabot.yml` | Monthly updates for the workflow actions and the nginx image |
| `Dockerfile`, `compose.yaml` | Local container setup (nginx on port 8790) |
