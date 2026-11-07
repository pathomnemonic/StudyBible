#!/usr/bin/env python3
"""Per-book audit of data/curated/rsv2ce against WEB-C: word-overlap of each verse with the matching WEB-C verse,
verse-length ratio, and leftover OCR debris (stray digits / footnote marks).  Low overlap means a verse boundary is probably off."""
import json, glob, re, sys, collections
sys.path.insert(0, 'scripts/rsv')
import importlib.util
STOP = set('the a an and of to in for with on at by from as or not his her their your my our he she it they we you i me him them us is are was were be been am will shall may would should could do did does have has had that this these those which who whom whose what when where there then than so but if nor yet let lo behold o unto upon all any each also into out up down over under'.split())
def stems(t):
    out = set()
    for w in re.findall(r"[a-z]+", t.lower()):
        if w in STOP or len(w) < 3: continue
        if len(w) > 4:
            for suf in ('ing', 'ed', 'es', 's'):
                if w.endswith(suf): w = w[:-len(suf)]; break
        out.add(w)
    return out
res = {}
worst = []
for f in sorted(glob.glob('data/curated/rsv2ce/[0-9A-Z]*.json')):
    d = json.load(open(f)); bid = d['id']
    web = json.load(open(f'public/data/bible/webc/{bid}.json'))
    n = low = debris = 0
    for c, wc in zip(d['chapters'], web['chapters']):
        wv = {}
        for b in wc['blocks']:
            if isinstance(b[1], str): continue
            for v, t in b[1]:
                if v: wv[v] = wv.get(v, '') + ' ' + t
        for v, t in c['blocks'][0][1]:
            n += 1
            a, w = stems(t), stems(wv.get(v, ''))
            f1 = 2 * len(a & w) / (len(a) + len(w)) if (a or w) else 1
            if len(a) + len(w) >= 6 and f1 < 0.2:
                low += 1; worst.append((f1, bid, c['n'], v, t[:80]))
            if re.search(r'(?<![\w’])\d{2,}(?![\w])|[!*£¢©®@#%]|(?<=[a-z,.;])[a-z]\d\b', t): debris += 1
    res[bid] = (n, low, debris)
print('book  verses  low-overlap  debris')
for b, (n, low, deb) in res.items():
    if low / n > 0.04 or deb / n > 0.03: print(f'{b:4s} {n:5d} {low:5d} ({low / n:.0%}) {deb:5d} ({deb / n:.0%})')
tn = sum(v[0] for v in res.values()); tl = sum(v[1] for v in res.values()); td = sum(v[2] for v in res.values())
print('TOTAL', tn, 'low', tl, f'{tl / tn:.1%}', 'debris', td, f'{td / tn:.1%}')
if len(sys.argv) > 1:
    for w in sorted(worst)[:int(sys.argv[1])]: print(w)
