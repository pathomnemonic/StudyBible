#!/usr/bin/env python3
"""Build public/data/office/sancti-MM.json (one file per month) from Divinum Officium (MIT) English data.

Usage: build_sancti.py /path/to/divinum-officium/web/www/horas/English
Each date holds the traditional Roman Breviary proper for the saint or feast fixed to that date:
name, rank, collect, invitatory and the lessons of Matins (the Office of Readings). Sections that point
to a common ("@Commune/C7") are resolved from that common. Movable feasts and rank precedence are not applied.
"""
import json, re, sys, os, collections
ROOT = sys.argv[1] if len(sys.argv) > 1 else '/home/user/divinumofficium/divinum-officium/web/www/horas/English'
OUT = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'public', 'data', 'office')
cache = {}

def sections(path):
    if path in cache: return cache[path]
    out = {}
    cur = None
    p = os.path.join(ROOT, path + '.txt')
    if os.path.exists(p):
        for raw in open(p, encoding='utf-8').read().split('\n'):
            m = re.match(r'^\[([^\]]+)\]\s*(\(.*\))?\s*$', raw)
            if m:
                if m.group(2): cur = None; continue  # rubric-specific variant
                cur = out.setdefault(m.group(1).rstrip('_'), [])
                continue
            if cur is not None: cur.append(raw.rstrip())
    cache[path] = out
    return out

def text(lines):
    s = '\n'.join(lines).strip()
    s = re.sub(r'^\$.*$', '', s, flags=re.M)             # shared-text macros ($Per Dominum)
    s = re.sub(r'&\w+', '', s)                            # function calls (&teDeum)
    s = re.sub(r'\n_\n', '\n\n', s)
    return s.strip()

def resolve(lines, depth=0, name=''):
    if len(lines) and lines[0].startswith('@') and depth < 4:
        m = re.match(r'^@([^:]*)(?::([^:]*))?(?::(.*))?$', lines[0].strip())
        path, sec, sub = m.group(1), m.group(2), m.group(3)
        if path.startswith('Tempora') or path.startswith('Psalterium'): return None
        src = sections(path) if path else None
        if src is None or not sec: return None
        got = src.get(sec.rstrip('_'))
        if not got: return None
        got = resolve(got, depth + 1, name)
        if got is None: return None
        out = '\n'.join(got)
        if sub:
            s = re.match(r's/(.*?)/(.*?)/(\w*)$', sub)
            if s:
                pat = s.group(1).replace('N\\.', 'N.')
                try: out = re.sub(pat, s.group(2), out, flags=re.S)
                except re.error: pass
        return out.split('\n')
    return lines

def get(secs, key, common, name):
    v = secs.get(key)
    if v:
        r = resolve(v, 0, name)
        if r is not None: return r
    if common:
        v = sections('Commune/' + common).get(key)
        if v:
            r = resolve(v, 0, name)
            if r is not None: return r
    return None

months = collections.defaultdict(dict)
for f in sorted(os.listdir(os.path.join(ROOT, 'Sancti'))):
    m = re.match(r'^(\d\d)-(\d\d)\.txt$', f)
    if not m: continue
    secs = sections('Sancti/' + f[:-4])
    nm = text(secs.get('Officium', [])) or text(secs.get('Name', []))
    rank = (secs.get('Rank') or [''])[0].split(';;')
    cm = None
    if len(rank) > 3:
        mm = re.match(r'ex (C\d+\w*)', rank[3].strip())
        cm = mm.group(1) if mm else None
    if not nm and rank and rank[0]: nm = rank[0]
    if not nm: continue
    d = {'name': nm}
    if len(rank) > 1 and rank[1]: d['rank'] = rank[1].strip()
    o = get(secs, 'Oratio', cm, nm)
    if o: d['collect'] = text(o)
    iv = get(secs, 'Invit', cm, nm)
    if iv: d['invit'] = text(iv).replace(' * ', ' ✱ ')
    ls = []
    for n in (1, 2, 3, 4, 5, 6, 7, 8, 9):
        # Lectio94 is the single reading of a simple feast; it replaces 4-6
        l = get(secs, f'Lectio{n}', cm if n <= 3 or True else None, nm)
        if l and text(l): ls.append([n, text(l)])
    if ls: d['lessons'] = ls
    if len(d) > 1:
        months[m.group(1)][m.group(2)] = d
for mo, days in months.items():
    json.dump(days, open(os.path.join(OUT, f'sancti-{mo}.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    print(mo, len(days), os.path.getsize(os.path.join(OUT, f'sancti-{mo}.json')))
