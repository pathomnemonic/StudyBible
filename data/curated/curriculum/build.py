#!/usr/bin/env python3
"""Builds public/data/curriculum/{index,glossary,grade-*}.json from the grade specs in this folder."""
import json, os, re, importlib, sys
sys.path.insert(0, os.path.dirname(__file__))
from glossary import G
OUT = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'public', 'data', 'curriculum')
os.makedirs(OUT, exist_ok=True)
prayers = set(re.findall(r"id: '([^']+)'", open(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'src', 'data', 'prayerbook.ts')).read()))
order = ['k'] + [str(i) for i in range(1, 13)]
index, used, problems = [], set(), []
for g in order:
    m = importlib.import_module(f'g_{g}')
    G_ = m.GRADE
    units = []
    for ui, u in enumerate(G_['units'], 1):
        ls = []
        for li, l in enumerate(u['lessons'], 1):
            for v in l['vocab']:
                if v not in G: problems.append(f"{G_['id']}.{ui}.{li}: unknown term {v}")
                used.add(v)
            if l['prayer'] and l['prayer'] not in prayers: problems.append(f"{G_['id']}.{ui}.{li}: unknown prayer {l['prayer']}")
            nums = [int(x) for x in re.findall(r'\d+', l['ccc'].replace('-', ','))]
            if any(n < 1 or n > 2865 for n in nums): problems.append(f"{G_['id']}.{ui}.{li}: ccc out of range")
            ls.append(dict(id=f"{G_['id']}-{ui}-{li}", title=l['title'], idea=l['idea'], ccc=l['ccc'], scripture=l['scripture'], vocab=l['vocab'], question=l['question'], activity=l['activity'], prayer=l['prayer'] or None))
        units.append(dict(n=ui, title=u['title'], pillar=u['pillar'], eq=u['eq'], lessons=ls))
    json.dump(dict(id=G_['id'], name=G_['name'], band=G_['band'], age=G_['age'], theme=G_['theme'], units=units), open(os.path.join(OUT, f"grade-{G_['id']}.json"), 'w'), ensure_ascii=False, separators=(',', ':'))
    index.append(dict(id=G_['id'], name=G_['name'], band=G_['band'], age=G_['age'], theme=G_['theme'], units=len(units), lessons=sum(len(u['lessons']) for u in units)))
json.dump({k: dict(w=v[0], d=v[1]) for k, v in G.items()}, open(os.path.join(OUT, 'glossary.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print('grades', len(index), 'lessons', sum(i['lessons'] for i in index), 'terms used', len(used), '/', len(G))
print('\n'.join(problems) or 'no problems')
