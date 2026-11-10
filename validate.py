#!/usr/bin/env python3
"""Validate questions.json and library.json. Run: python3 wset-quiz/validate.py"""
import json
import sys
from collections import Counter
from pathlib import Path

LANGS = ("en", "de")
REQUIRED = ("id", "level", "topic", "answer", *LANGS)
LANG_FIELDS = ("question", "options", "explanation")
# Must match the COUNTRIES map in common.js
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

# --- library.json (grape and wine profiles) ---
KINDS = {"black", "white", "sparkling", "fortified"}
GROUPS = {"principal", "regional", "sparkling", "wine"}
PROPS = ("colour", "sweetness", "acidity", "tannin", "alcohol", "body")
library = json.loads(Path(__file__).with_name("library.json").read_text(encoding="utf-8"))
lib_items = library["items"]
lib_ids = {i["id"] for i in lib_items}
if len(lib_ids) != len(lib_items):
    errors.append("library: duplicate ids")
for item in lib_items:
    iid = item.get("id", "<no id>")
    if item["kind"] not in KINDS or item["group"] not in GROUPS:
        errors.append(f"library/{iid}: bad kind or group")
    for p in PROPS:
        r = item["structure"].get(p, "missing")
        if r is None and p == "tannin":
            continue
        if not (isinstance(r, list) and len(r) == 2 and 1 <= r[0] <= r[1] <= 5):
            errors.append(f"library/{iid}: structure.{p} must be [min, max] within 1-5")
    for layer, aromas in item["aromas"].items():
        for a in aromas:
            if a not in library["aromas"]:
                errors.append(f"library/{iid}: aroma '{a}' has no German translation in 'aromas'")
    sig = item.get("signature") or {}
    if not (sig.get("en") and sig.get("de")):
        errors.append(f"library/{iid}: signature needs EN and DE text")
    if len(item["notes"]["en"]) != len(item["notes"]["de"]) or not item["notes"]["en"]:
        errors.append(f"library/{iid}: notes must have the same number of EN and DE entries")
    for r in item["regions"]:
        if r["country"] not in COUNTRIES or not r["gis"]:
            errors.append(f"library/{iid}: bad region entry {r}")
    for g in item.get("grapes", []):
        if g not in lib_ids:
            errors.append(f"library/{iid}: unknown grape '{g}'")

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
groups = Counter(i["group"] for i in lib_items)
print(f"Library: {len(lib_items)} profiles ({', '.join(f'{g}: {n}' for g, n in groups.items())}), {len(library['aromas'])} aroma terms")
