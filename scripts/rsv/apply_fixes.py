#!/usr/bin/env python3
"""Apply reviewed text repairs to the RSV-2CE pack.

Input : tmp-drafts/rsv-fix-N.json     (writer proposals: book, chapter, verse, old, new)
        tmp-drafts/rsv-verify-N.json  (second reader: same keys + verdict ok|fix|reject, corrected)
A proposal is applied only when a second reader agreed (ok) or supplied a correction (fix) and the verse still reads
exactly as the proposal's `old` text. Both data/curated/rsv2ce and public/data/bible/rsv2ce are patched.
Usage: python3 -I scripts/rsv/apply_fixes.py [--dry]"""
import json, glob, os, sys, collections
dry = '--dry' in sys.argv
props = {}
for f in sorted(glob.glob('tmp-drafts/rsv-fix-*.json')):
    for p in json.load(open(f)): props[(p['book'], p['chapter'], p['verse'])] = p
verd = {}
for f in sorted(glob.glob('tmp-drafts/rsv-verify-*.json')):
    for v in json.load(open(f)): verd[(v['book'], v['chapter'], v['verse'])] = v
final = {}
stat = collections.Counter()
for k, p in props.items():
    v = verd.get(k)
    if not v: stat['unreviewed'] += 1; continue
    if v['verdict'] == 'ok': final[k] = (p['old'], p['new'])
    elif v['verdict'] == 'fix' and v.get('corrected'): final[k] = (p['old'], v['corrected'])
    else: stat['rejected'] += 1
by = collections.defaultdict(dict)
for (b, c, vs), t in final.items(): by[b][(c, vs)] = t
for root in ('data/curated/rsv2ce', 'public/data/bible/rsv2ce'):
    for b, m in by.items():
        path = f'{root}/{b}.json'
        d = json.load(open(path)); hit = 0
        for ch in d['chapters']:
            for bl in ch['blocks']:
                if isinstance(bl[1], str): continue
                for r in bl[1]:
                    t = m.get((ch['n'], r[0]))
                    if t and r[1] == t[0]: r[1] = t[1]; hit += 1
        stat[root + ' applied'] += hit
        if not dry: json.dump(d, open(path, 'w'), ensure_ascii=False, separators=(',', ':'))
print(dict(stat), 'verses with an agreed repair:', len(final))
