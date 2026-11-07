#!/usr/bin/env python3
"""Second pass over data/curated/rsv2ce: repair the OCR slips the aligner cannot see.

* verse-initial words with a lost or mis-read first letter ("nd" -> "And", "p emember" -> "Remember"),
  chosen with the help of the matching WEB-C verse and word frequency;
* footnote letters / digits stuck to a word ("tand", "t6But", "ffor");
* stress marks printed as ‘ or ' inside names (A‘haz -> Ahaz);
* single-edit slips in rare words (bumed -> burned, moming -> morning) when exactly one vocabulary word fits.
The WEB-C text is only a hint; it is never copied into the RSV text.
Usage: python3 scripts/rsv/fix.py   (idempotent)
"""
import json, glob, re, collections, os, sys
sys.path.insert(0, 'scripts/rsv')
from build import strip_heading

IN = 'data/curated/rsv2ce-raw'
OUT = 'data/curated/rsv2ce'
vocab = collections.Counter()
webfirst = {}
for ed in ('webc', 'dra', 'cpdv'):
    for f in glob.glob(f'public/data/bible/{ed}/*.json'):
        d = json.load(open(f))
        for c in d['chapters']:
            for b in c['blocks']:
                if isinstance(b[1], str): continue
                for v, t in b[1]:
                    for w in re.findall(r"[A-Za-z]+(?![’'][a-z])", t):
                        if len(w) > 1 or w.lower() in ('a', 'i', 'o'): vocab[w.lower()] += 1
                    if ed == 'webc' and v: webfirst[(d['id'], c['n'], v)] = [w.lower() for w in re.findall(r"[A-Za-z]+", t)[:5]]

books = {}
os.makedirs(OUT, exist_ok=True)
for f in sorted(glob.glob(f'{IN}/[0-9A-Z]*.json')):
    d = json.load(open(f)); books[d['id']] = d

# frequency of words the pack itself uses (clean ones) and of verse-initial words
pack = collections.Counter(); initial = collections.Counter()
for d in books.values():
    for c in d['chapters']:
        for v, t in c['blocks'][0][1]:
            ws = re.findall(r"[A-Za-z]+(?:’[a-z]+)?", t)
            ws = [x for x in ws if len(x) > 1 or x in ('a', 'A', 'I', 'O')]
            for w in ws: pack[w.lower()] += 1
            if ws and ws[0][:1].isupper() and ws[0].lower() in vocab: initial[ws[0].lower()] += 1
known = lambda w: w.lower() in vocab or pack[w.lower()] >= 3
LET = 'ABCDEFGHIJKLMNOPQRSTUVWY'

COMMON2 = {'if', 'of', 'it', 'in', 'is', 'as', 'at', 'on', 'or', 'so', 'no', 'to', 'we', 'he', 'me', 'my', 'by', 'up', 'us', 'do', 'go', 'be', 'oh', 'ah'}

def fix_initial(text, hint):
    """verse-initial word whose first letter was lost or mis-read as a separate token ("nd" -> "And", "p emember" -> "Remember")"""
    parts = text.split(' ', 2)
    m = re.match(r'^([“‘"\']*)([A-Za-z]+)$', parts[0])
    if not m: return text, None
    q, w = m.groups()
    if w in ('I', 'A', 'O', 'a') or (len(w) > 1 and w.lower() in vocab): return text, None
    cands = []   # (completed word, remaining text, bonus)
    tail = ' '.join(parts[1:])
    nxt = parts[1] if len(parts) > 1 else ''
    rest2 = parts[2] if len(parts) > 2 else ''
    h0 = hint[0] if hint else ''
    letters = lambda x: re.sub(r'[^a-z]', '', x.lower())
    if w[:1].islower():
        for X in LET:                   # (a) first letter(s) lost: "nd" -> "And", "f" -> "If"
            c = X + w
            if (len(w) > 1 or c.lower() in COMMON2) and c.lower() in vocab and vocab[c.lower()] > 2:
                cands.append((c, tail, 0))
    if len(w) == 1:
        m2 = re.match(r'^([A-Za-z][A-Za-z-]*)$', nxt)
        if m2 and m2.group(1).lower() not in vocab:                 # (b) drop cap misread + OOV rest of the word: "F ven" -> "Even"
            for X in LET:
                c = X + m2.group(1)
                if letters(c) in vocab and vocab[letters(c)] > 2: cands.append((c, rest2, 0))
        if nxt and letters(w + nxt) == h0:                           # (e) drop cap split off the word, confirmed by the hint: "H ow" -> "How"
            cands.append((w.upper() + nxt, rest2, 20))
        elif nxt and w.isupper() and re.match(r'^[a-z]+$', nxt) and (w + nxt).lower() in vocab and vocab[(w + nxt).lower()] > 2:
            cands.append((w + nxt, rest2, 0))                        # (f) same, no hint: "T he" -> "The", "S ay" -> "Say"
        if h0 == 'i' and nxt[:1].islower():                          # (c) "T will" -> "I will"
            cands.append(('I', tail, 5))
        if len(h0) > 1 and h0[0] == w.lower() and h0 in vocab and not (nxt and letters(w + nxt) == h0):
            cands.append((h0.capitalize(), tail, 5))                 # (d) "H said" -> "He said"
    if not cands: return text, None
    def score(c):
        lw = c[0].lower()
        return ((10 if (lw in hint) else 0) + c[2], initial[lw], vocab[lw])
    best = max(cands, key=score)
    return q + best[0] + (' ' + best[1] if best[1] else ''), (w, best[0])


def unstick(t):
    """footnote letters stuck to the front of a word: tand -> and, tAnd -> And, ffor -> for (only when the whole token is not a word)"""
    def one(m):
        tok = m.group(0)
        core = re.sub(r'^[“‘"\'(]+', '', tok)
        pre = tok[:len(tok) - len(core)]
        letters = re.match(r'^([A-Za-z]+)', core)
        if not letters: return tok
        w = letters.group(1)
        if w.lower() in vocab: return tok
        if w[0] in 'tf' and len(w) > 1:
            rest = w[1:]
            if rest.lower() in vocab and (len(rest) > 1 or rest in ('I', 'A', 'a', 'O')):
                return pre + rest + core[len(w):]
        return tok
    return re.sub(r"(?<![A-Za-z’'-])[“‘\"'(]*[A-Za-z]+(?![A-Za-z’'-])", one, t)

OOVFIX = [
    (r'\bvou\b', 'you'), (r'\bVou\b', 'You'), (r'\by0u\b', 'you'), (r'\bY0u\b', 'You'),
    (r'(?<=[A-Za-z])[‘\'`´](?=[a-z])', ''),             # stress mark inside a name: A‘haz
    (r'(?<![A-Za-z’])t(?=I\b)', ''),
    (r'\b[a-z]\d+(?=[A-Z])', ''),                         # "t6But"
]

# Books whose text could not be aligned with confidence (see docs/RSV2CE.md): not shipped.
EXCLUDE = {'EST', 'ZEC'}

def clean_debris(t):
    t = re.sub(r'(?<=[a-z])!(?= [a-z])', '', t)                     # "wind! blows": a footnote mark read as "!"
    t = re.sub(r'(?<=[.,;:?!”])[a-z](?=\s|$)', '', t)              # "spirit.f": a footnote letter after punctuation
    t = re.sub(r'(?<=[a-z])- (?=[a-z])', '', t)                     # line-end hyphen left with a space: "Mace- donian"
    t = re.sub(r'[\u0100-\u024f\u0300-\u036f]', '', t)                # accented junk letters from the scan (ŝ, ǵ ...)
    t = re.sub(r'[£¢©®@#%§¶|=+~^_<>{}`]', '', t)                    # symbols that are never Scripture
    t = re.sub(r'\b\d{1,3}:\d{1,3}\b', '', t)                      # stray chapter:verse numbers
    t = re.sub(r'\*+', '', t)                                       # footnote asterisks
    t = re.sub(r'(?<=[,;:.])!', '', t)                              # ",!" after a footnote mark
    t = re.sub(r'(?<=[a-z]),?[a-z]\d+(?=\s)', lambda m: ',' if m.group(0).startswith(',') else '', t)   # "grace,b2 the" -> "grace, the"
    t = re.sub(r'(?<=\s)[b-hj-zB-HJ-NP-Z](?=\s[a-z])', '', t)         # a lone footnote letter between words (not a / I)
    t = re.sub(r'(?<![\w’-])\d{1,4}(?![\w’-])', '', t)             # stray verse numbers
    t = re.sub(r'\s+([,.;:?!”’)])', r'\1', t)
    t = re.sub(r'([“‘(])\s+', r'\1', t)
    return t

def edits1(w):
    out = set()
    for i in range(len(w)):
        out.add(w[:i] + w[i + 1:])
        for ch in 'abcdefghilmnoprstuvwy':
            out.add(w[:i] + ch + w[i + 1:])
    for i in range(len(w) + 1):
        for ch in 'abcdefghilmnoprstuvwy':
            out.add(w[:i] + ch + w[i:])
    return out

def fix_rare(t):
    def one(m):
        w = m.group(0)
        lw = w.lower()
        if lw in vocab or pack[lw] >= 3 or len(lw) < 4: return w
        alts = []
        if 'rn' in lw: pass
        for a, b in (('m', 'rn'), ('rn', 'm'), ('ii', 'u'), ('vv', 'w'), ('li', 'h'), ('cl', 'd')):
            if a in lw:
                cand = lw.replace(a, b, 1)
                if cand in vocab: alts.append(cand)
        if len(alts) == 1:
            r = alts[0]
            return r.capitalize() if w[:1].isupper() else r
        return w
    return re.sub(r"(?<![A-Za-z’'-])[a-z][a-z]{3,}(?![A-Za-z’'-])", one, t)

log = collections.Counter(); changed = 0
for bid, d in books.items():
    if bid in EXCLUDE: continue
    for c in d['chapters']:
        vs = c['blocks'][0][1]
        for row in vs:
            v, t = row
            o = t
            for pat, rep in OOVFIX: t = re.sub(pat, rep, t)
            t = unstick(t)
            t, info = fix_initial(t, webfirst.get((bid, c['n'], v), []))
            if info: log[info] += 1
            t = fix_rare(t)
            t = clean_debris(t)
            hw, run = strip_heading(t.split(' '))
            if len(run) >= 2 and hw: t = ' '.join(hw)
            t = re.sub(r'\s{2,}', ' ', t).strip()
            if t != o: row[1] = t; changed += 1
    json.dump(d, open(f'{OUT}/{bid}.json', 'w'), ensure_ascii=False, indent=0)
print('verses changed:', changed)
print('initial repairs:', sum(log.values()), log.most_common(25))
