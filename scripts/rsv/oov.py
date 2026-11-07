#!/usr/bin/env python3
"""List words in the RSV-2CE pack that no other bundled English text uses: candidates for OCR slips."""
import json, glob, re, collections, sys
vocab = set()
for ed in ('webc', 'dra', 'cpdv'):
    for f in glob.glob(f'public/data/bible/{ed}/*.json'):
        for c in json.load(open(f))['chapters']:
            for b in c['blocks']:
                if isinstance(b[1], str): continue
                for _, t in b[1]:
                    for w in re.findall(r"[A-Za-z]+(?:['’][a-z]+)?", t): vocab.add(w.lower())
vocab |= set(open('/usr/share/dict/words').read().lower().split()) if __import__('os').path.exists('/usr/share/dict/words') else set()
cnt = collections.Counter(); where = {}
for f in sorted(glob.glob('data/curated/rsv2ce/[0-9A-Z]*.json')):
    d = json.load(open(f))
    for c in d['chapters']:
        for _, vs in [(0, c['blocks'][0][1])]:
            for v, t in vs:
                for w in re.findall(r"[A-Za-z][A-Za-z’'-]*", t):
                    k = w.strip("'’-").lower()
                    if k and k not in vocab and not all(p in vocab for p in k.split('-')):
                        cnt[w] += 1; where.setdefault(w, f"{d['id']} {c['n']}:{v}")
lower = [(w, n, where[w]) for w, n in cnt.most_common() if w[:1].islower()]
upper = [(w, n, where[w]) for w, n in cnt.most_common() if w[:1].isupper()]
print('lowercase OOV types', len(lower), 'total', sum(n for _, n, _ in lower))
for w, n, wh in lower[:int(sys.argv[1]) if len(sys.argv) > 1 else 150]: print(f'{n:4d} {w:22s} {wh}')
print('capitalised OOV types', len(upper))
