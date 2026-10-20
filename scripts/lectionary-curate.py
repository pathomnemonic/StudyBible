#!/usr/bin/env python3
"""Turns data/raw/usccb/*.json (see fetch-readings.py) into data/curated/lectionary-refs.json: per date a title and
{slot: "ref | alternative"} using the app's slot names. Only the first complete set of readings is kept (vigil Masses list several)."""
import json, glob, os, re
SLOT = [(r'^reading (i|1)\b|^reading$', 'first_reading'), (r'responsorial|psalm', 'responsorial_psalm'), (r'^reading (ii|2)\b', 'second_reading'),
        (r'alleluia|verse before|acclamation|lenten', 'gospel_acclamation'), (r'^gospel', 'gospel')]
days = {}
for f in sorted(glob.glob('data/raw/usccb/*.json')):
    j = json.load(open(f)); out = {}
    for r in j['readings']:
        n = r['slot'].lower().strip()
        k = next((s for pat, s in SLOT if re.search(pat, n)), None)
        if not k or k in out: continue
        refs = [re.sub(r'^See\s+', '', x).strip() for x in r['refs']]
        out[k] = ' | '.join(refs)
    if out.get('gospel'):
        days[j['date']] = {'t': re.sub(r'\s*\|\s*USCCB$', '', j['title']), 'r': out}
json.dump({'_about': 'Daily Mass reading references (citations only) compiled from the USCCB daily readings pages (bible.usccb.org/bible/readings), which the USCCB permits to be read for analysis with attribution. The Lectionary text itself is not stored.', 'days': days}, open('data/curated/lectionary-refs.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(days))
