#!/usr/bin/env python3
"""Append hand-reviewed rows to data/curated/external-resources.json (dedupes by url).
Usage: curate-add.py batch.txt   — lines: source|type|title|url|refs;refs|tags,tags
Each row is stamped as checked from title and search-result summary only."""
import json, sys
P = 'data/curated/external-resources.json'
d = json.load(open(P))
have = {r['url'] for r in d['resources']}
known = {x['id'] for x in json.load(open('data/registry/resource-sources.json'))['sources']}
skipped = []
n = 0
for line in open(sys.argv[1]):
    line = line.strip()
    if not line or line.startswith('#'): continue
    parts = [x.strip() for x in line.split('|')]
    if len(parts) != 6: skipped.append(('fields', line[:80])); continue
    src, typ, title, url, refs, tags = parts
    if src not in known: skipped.append(('source ' + src, title)); continue
    if not url.startswith('https://') or typ not in ('article','qa','tract','video','podcast','page','navigator'): skipped.append(('url/type', title)); continue
    if url in have: continue
    have.add(url)
    d['resources'].append({'source': src, 'type': typ, 'title': title, 'url': url,
        'refs': [r.strip() for r in refs.split(';') if r.strip()], 'tags': [t.strip() for t in tags.split(',') if t.strip()],
        'reviewedBy': 'Claude (checked title and search-result summary; page not read in full)', 'reviewedOn': '2026-10-19', 'basis': 'title-and-summary'})
    n += 1
json.dump(d, open(P, 'w'), indent=1, ensure_ascii=False); open(P, 'a').write('\n')
for k, t in skipped: print('skipped', k, t)
print('added', n, 'total', len(d['resources']))
