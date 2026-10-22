#!/usr/bin/env python3
"""Validate questions.json. Run: python3 wset-quiz/validate.py"""
import json
import sys
from collections import Counter
from pathlib import Path

LANGS = ("en", "de")
REQUIRED = ("id", "level", "topic", "answer", *LANGS)
LANG_FIELDS = ("question", "options", "explanation")
# Must match the COUNTRIES map in app.js
COUNTRIES = {"France", "Italy", "Spain", "Portugal", "Germany", "Austria", "Hungary", "USA", "Canada",
             "Chile", "Argentina", "Australia", "New Zealand", "South Africa"}

path = Path(__file__).with_name("questions.json")
questions = json.loads(path.read_text(encoding="utf-8"))
errors = []

ids = Counter(q.get("id") for q in questions)
errors += [f"duplicate id: {i}" for i, n in ids.items() if n > 1]

for q in questions:
    qid = q.get("id", "<no id>")
    missing = [k for k in REQUIRED if k not in q]
    if missing:
        errors.append(f"{qid}: missing {missing}")
        continue
    if q["level"] not in (1, 2):
        errors.append(f"{qid}: level must be 1 or 2")
    if q["answer"] not in range(4):
        errors.append(f"{qid}: answer must be an option index 0-3")
    if "countries" in q:
        c = q["countries"]
        if not isinstance(c, list) or not c or not set(c) <= COUNTRIES:
            errors.append(f"{qid}: countries must be a non-empty list of {sorted(COUNTRIES)}")
    for lang in LANGS:
        block = q[lang]
        missing = [k for k in LANG_FIELDS if not block.get(k)]
        if missing:
            errors.append(f"{qid}/{lang}: missing {missing}")
            continue
        opts = block["options"]
        if len(opts) != 4 or len(set(opts)) != 4:
            errors.append(f"{qid}/{lang}: needs exactly 4 unique options")

if errors:
    print("\n".join(errors))
    sys.exit(1)

levels = Counter(q["level"] for q in questions)
topics = Counter(q["topic"] for q in questions)
print(f"OK: {len(questions)} questions (L1: {levels[1]}, L2: {levels[2]}), languages: {', '.join(LANGS)}")
for t, n in sorted(topics.items()):
    print(f"  {t}: {n}")
countries = Counter(c for q in questions for c in q.get("countries", []))
print(f"Country-tagged: {sum('countries' in q for q in questions)}")
for c, n in countries.most_common():
    print(f"  {c}: {n}")
