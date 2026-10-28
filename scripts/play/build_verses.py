#!/usr/bin/env python3
"""Pick quotable verses from every book for the Which Book? game and write public/data/play/verses.json ({book: ["BOOK.c.v", ...]}).
Only books whose chapter count in the WEB-C text matches the app's anchor numbering are used, so the references stay exact."""
import json, re, os, random
root = os.path.join(os.path.dirname(__file__), '..', '..')
canon = open(os.path.join(root, 'src/lib/canon.ts'), encoding='utf-8').read()
chapters = {m.group(1): int(m.group(2)) for m in re.finditer(r"B\('([A-Z0-9]{3})', '[^']*', '[^']*', '(?:OT|NT)', '[^']*', (\d+)", canon)}
rnd = random.Random(7)
out = {}
for f in sorted(os.listdir(os.path.join(root, 'public/data/bible/webc'))):
    b = f[:-5]
    d = json.load(open(os.path.join(root, 'public/data/bible/webc', f), encoding='utf-8'))
    if b not in chapters or len(d['chapters']) != chapters[b]: continue
    cands = []
    for ch in d['chapters']:
        for blk in ch['blocks']:
            if isinstance(blk[1], str): continue
            for v, t in blk[1]:
                if v <= 0 or not (70 <= len(t) <= 190): continue
                words = t.split()
                caps = sum(1 for w in words[1:] if w[:1].isupper() and w.lower() not in ('god', 'lord', 'he', 'his', 'i', 'you', 'jesus', 'christ', 'the', 'spirit'))
                if caps > 3 or re.search(r'\d', t) or t.count('“') != t.count('”'): continue
                if re.match(r'^(and|but|for|so|then|therefore|now)\b', t, re.I) and len(words) < 14: continue
                cands.append(f"{b}.{ch['n']}.{v}")
    rnd.shuffle(cands)
    out[b] = sorted(cands[:12], key=lambda x: tuple(int(p) if p.isdigit() else 0 for p in x.split('.')[1:]))
print(len(out), 'books', sum(len(v) for v in out.values()), 'verses', [b for b in chapters if b not in out])
os.makedirs(os.path.join(root, 'public/data/play'), exist_ok=True)
json.dump(out, open(os.path.join(root, 'public/data/play/verses.json'), 'w'), separators=(',', ':'))
