"""Builds the word list for Cloister from public-domain English text already in the app: the WEB-C Bible and Butler's Lives of the Saints.
Words are kept when they are lower-case in the text (so names are left out), appear often enough, and are 3 to 10 letters. Run: python3 scripts/play/build_words.py"""
import json, glob, re, collections
cnt = collections.Counter(); low = collections.Counter()
def feed(text):
    for w in re.findall(r"[A-Za-z]+", text):
        k = w.lower(); cnt[k] += 1
        if w == k: low[k] += 1
for f in glob.glob('public/data/bible/webc/*.json'):
    d = json.load(open(f))
    for ch in d['chapters']:
        for b in ch['blocks']:
            if isinstance(b[1], list):
                for v in b[1]: feed(v[1])
for f in glob.glob('public/data/saints/butler/[0-1][0-9].json'):
    d = json.load(open(f))
    for day in d['days'].values():
        for e in day:
            for t in e['text']: feed(t)
words = sorted(w for w, c in cnt.items() if 3 <= len(w) <= 10 and c >= 6 and low[w] / c >= 0.8 and re.search(r'[aeiouy]', w) and not re.search(r'(.)\1\1', w))
json.dump({'about': 'Words for Cloister, drawn from public-domain text in the app (WEB-C and Butler).', 'words': words}, open('public/data/play/words.json', 'w'), separators=(',', ':'))
print(len(words))
