#!/usr/bin/env python3
"""Find OCR damage anywhere in the RSV-2CE pack: words not seen in any other English text we hold (WEB-C, NABRE, DRA,
CPDV, Brenton), stray punctuation inside or after words, doubled/odd characters, and verses that open mid-word.
Usage: python3 -I scripts/rsv/audit_full.py [out.json]"""
import json, glob, re, sys, collections, os
def verses(path):
    d = json.load(open(path))
    for c in d['chapters']:
        for bl in c['blocks']:
            if isinstance(bl[1], str): continue
            for r in bl[1]:
                yield c['n'], r[0], r[1]
def words(t): return re.findall(r"[A-Za-z][A-Za-z'’\-]*", t)
vocab = collections.Counter()
for ed in ('webc', 'nabre', 'dra', 'cpdv', 'brenton'):
    for f in glob.glob(f'public/data/bible/{ed}/*.json'):
        for _, _, t in verses(f):
            for w in words(t): vocab[w.lower().strip("'’-")] += 1
# also names/words in the library that are not Bible text would only add noise; the RSV's own frequent words are trusted
own = collections.Counter()
rsv = {}
for f in sorted(glob.glob('public/data/bible/rsv2ce/*.json')):
    b = os.path.basename(f)[:-5]
    rsv[b] = list(verses(f))
    for _, _, t in rsv[b]:
        for w in words(t): own[w.lower().strip("'’-")] += 1
issues = []
for b, vs in rsv.items():
    for c, v, t in vs:
        if v == 0: continue
        why = []
        for w in words(t):
            k = w.lower().strip("'’-")
            if k and vocab[k] == 0 and own[k] < 4: why.append('unknown word: ' + w)
        if re.search(r"[A-Za-z][?!™®©¢£§¶°]+[A-Za-z]", t) or re.search(r"[A-Za-z]\?\s+[a-z]", t): why.append('stray symbol inside a word')
        if re.search(r"[^\x00-ɏ‐-‧‰-› ]", t): why.append('odd character')
        if re.match(r"[a-z]", t): why.append('verse opens lower-case')
        if re.match(r"[A-Z][a-z]?\s[a-z]{2,}", t) and not re.match(r"(?i)(I|A|O|He|So|No|Do|As|If|In|My|Of|On|Or|To|We|Up|Is|It|Be|By|Go|Oh|Ah)\s", t): why.append('verse opens with a broken word')
        if re.search(r"\s{2}|\b(\w)\s(\w)\b\s(\w)", t) and False: pass
        if len(t) < 6: why.append('very short verse')
        if why: issues.append({'book': b, 'chapter': c, 'verse': v, 'why': why, 'text': t})
out = sys.argv[1] if len(sys.argv) > 1 else 'tmp-drafts/rsv-damage.json'
json.dump(issues, open(out, 'w'), ensure_ascii=False, indent=0)
cnt = collections.Counter(w.split(':')[0] for i in issues for w in i['why'])
print(len(issues), 'verses flagged', dict(cnt))
