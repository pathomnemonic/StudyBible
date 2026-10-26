#!/usr/bin/env python3
"""Builds public/data/curriculum/{index,glossary,grade-*}.json from the grade specs in this folder."""
import json, os, re, importlib, sys
sys.path.insert(0, os.path.dirname(__file__))
for _f in sorted(os.listdir(os.path.dirname(__file__) or '.')):
    pass
from glossary import G
from saints import SAINT_LINES
OUT = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'public', 'data', 'curriculum')
os.makedirs(OUT, exist_ok=True)
prayers = set(re.findall(r"id: '([^']+)'", open(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'src', 'data', 'prayerbook.ts')).read()))
order = ['k'] + [str(i) for i in range(1, 13)] + ['ya']
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..')
apol = {t['id'] for t in json.load(open(os.path.join(ROOT, 'data', 'curated', 'apologetics.json')))['topics']}
works = {w['id'] for w in json.load(open(os.path.join(ROOT, 'public', 'data', 'library', 'index.json')))['works']}
ENRICH = {}
# professional rewrites of a lesson's core text: r_<grade>.py holds R = {lesson id: dict(idea, hook, activity, teach, misc, mem, assess, ...)}
REWRITE = {}
CCC_X = importlib.import_module('x_ccc').X
for f in sorted(os.listdir(os.path.dirname(__file__) or '.')):
    if re.match(r'^e_\w+\.py$', f):
        ENRICH.update(importlib.import_module(f[:-3]).E)
    if re.match(r'^r_\w+\.py$', f):
        [REWRITE.setdefault(k, {}).update(v) for k, v in importlib.import_module(f[:-3]).R.items()]

def squash(nums):
    out, i = [], 0
    nums = sorted(set(nums))
    while i < len(nums):
        j = i
        while j + 1 < len(nums) and nums[j + 1] == nums[j] + 1: j += 1
        out.append(str(nums[i]) if i == j else f'{nums[i]}-{nums[j]}')
        i = j + 1
    return ','.join(out)

def spec_nums(spec):
    out = []
    for part in spec.split(','):
        part = part.strip()
        if '-' in part:
            a, b = part.split('-'); out += range(int(a), int(b) + 1)
        elif part: out.append(int(part))
    return out
index, used, problems = [], set(), []
for g in order:
    m = importlib.import_module(f'g_{g}')
    G_ = m.GRADE
    G_['units'] = list(G_['units']) + importlib.import_module('h_hard').EXTRA.get(G_['id'], []) + importlib.import_module('h_gap').EXTRA.get(G_['id'], [])
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
            lid = f"{G_['id']}-{ui}-{li}"
            row = dict(id=lid, title=l['title'], idea=l['idea'], ccc=squash(spec_nums(l['ccc'] + (',' + CCC_X[lid] if lid in CCC_X else ''))), scripture=l['scripture'], vocab=l['vocab'], question=l['question'], activity=l['activity'], prayer=l['prayer'] or None)
            for k in ('teach', 'talk', 'quiz', 'life', 'saint', 'misc', 'deeper', 'mem', 'hook', 'assess'):
                v = REWRITE.get(lid, {}).get(k) or l.get(k) or ENRICH.get(lid, {}).get(k)
                if v: row[k] = v
            for k in ('idea', 'activity'):
                if REWRITE.get(lid, {}).get(k): row[k] = REWRITE[lid][k]
            for d in row.get('deeper', []):
                kind, ident = d.split(':', 1)
                if (kind == 'apol' and ident not in apol) or (kind == 'room' and ident not in works): problems.append(f'{lid}: unknown deeper {d}')
            import random
            shuffled = []
            for qi, qs in enumerate(row.get('quiz', [])):
                parts = qs.split('|')
                if len(parts) == 7 and parts[5].isdigit():
                    opts, right = parts[1:5], int(parts[5])
                    order = list(range(4)); random.Random(f'{lid}-{qi}').shuffle(order)
                    parts[1:5] = [opts[i] for i in order]; parts[5] = str(order.index(right))
                    qs = '|'.join(parts)
                shuffled.append(qs)
            if shuffled: row['quiz'] = shuffled
            for qs in row.get('quiz', []):
                parts = qs.split('|')
                if len(parts) != 7 or not parts[5].isdigit() or int(parts[5]) > 3: problems.append(f'{lid}: bad quiz {qs[:40]}')
            sv = row.get('saint')
            if sv and ':' not in sv:
                nm = sv.strip().rstrip('.')
                if nm in SAINT_LINES: row['saint'] = f'{nm}: {SAINT_LINES[nm]}'
                else: problems.append(f'{lid}: saint without a line: {sv}')
            ls.append(row)
        units.append(dict(n=ui, title=u['title'], pillar=u['pillar'], eq=u['eq'], lessons=ls))
    json.dump(dict(id=G_['id'], name=G_['name'], band=G_['band'], age=G_['age'], theme=G_['theme'], units=units), open(os.path.join(OUT, f"grade-{G_['id']}.json"), 'w'), ensure_ascii=False, separators=(',', ':'))
    index.append(dict(id=G_['id'], name=G_['name'], band=G_['band'], age=G_['age'], theme=G_['theme'], units=len(units), lessons=sum(len(u['lessons']) for u in units)))
json.dump({k: dict(w=v[0], d=v[1]) for k, v in G.items()}, open(os.path.join(OUT, 'glossary.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
json.dump(index, open(os.path.join(OUT, 'index.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print('grades', len(index), 'lessons', sum(i['lessons'] for i in index), 'terms used', len(used), '/', len(G))
print('\n'.join(problems) or 'no problems')
