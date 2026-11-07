#!/usr/bin/env python3
"""Local repair of chapter junctions: where a chapter boundary landed a few verses off, re-cut the affected run of
chapters (plus one neighbour either side) with the whole-verse matcher and keep the cut only if it matches WEB-C better.
Works on data/curated/rsv2ce-raw (before fix.py).  Usage: python3 scripts/rsv/repair.py"""
import json, glob, re, sys, os
sys.path.insert(0, 'scripts/rsv')
import build as B

RAW = 'data/curated/rsv2ce-raw'
def f1(a, b):
    a, b = set(B.content(a.split())), set(B.content(b.split()))
    return 2 * len(a & b) / (len(a) + len(b)) if (a or b) else 1.0

def web_verses(bid):
    return B.web_book(bid)           # list of chapters -> [[v, text], ...] with verse 0 merged

def suspicious(raw, web):
    bad = []
    for ci, (c, wv) in enumerate(zip(raw['chapters'], web)):
        wv = [x for x in wv if x[0]]
        rv = c['blocks'][0][1]
        if len(rv) < 4 or not wv: continue
        s = f1(' '.join(t for _, t in rv[:3]), ' '.join(t for _, t in wv[:3]))
        e = f1(' '.join(t for _, t in rv[-3:]), ' '.join(t for _, t in wv[-3:]))
        if min(s, e) < 0.12: bad.append(ci)
    return bad

def resegment(words, skel_verses):
    """cut `words` into len(skel_verses) verses using lexical fit, sentence starts and the WEB-C length prior"""
    T, V = len(words), len(skel_verses)
    wl = [len(t) for t in skel_verses]; tot = sum(wl) or 1
    cum = [0]
    for L in wl: cum.append(cum[-1] + L)
    e_pos = lambda k: T * cum[k] / tot
    win = max(60, int(0.12 * T))
    cand = [list(range(int(max(1, e_pos(k) - win)), int(min(T - 1, e_pos(k) + win)) + 1)) for k in range(1, V)]
    vfirst = [B.content(t.split()[:6]) for t in skel_verses]
    vlast = [B.content(t.split()[-6:]) for t in skel_verses]
    wst = [set(B.content(t.split())) for t in skel_verses]
    tst = [B.stem(w) for w in words]
    tst = [x if x and x not in B.STOP and len(x) > 2 else '' for x in tst]
    def unary(k, p):
        idx = k + 1
        prev = words[p - 1]
        sc = 1.4 if B.end_punct(prev) else (0.4 if prev.endswith((',', ';', ':')) else -4.0)
        if not (words[p][:1].isupper() or words[p][:1] in '“‘"\''): sc -= 1.5
        sc += min(3, len(set(B.content(words[max(0, p - 7):p])) & set(vlast[idx - 1]))) * 1.1
        sc += min(3, len(set(B.content(words[p:p + 7])) & set(vfirst[idx]))) * 1.1
        sc -= ((p - e_pos(idx)) / (0.05 * T + 8)) ** 2
        return sc
    def seg(k, a, b):
        if b - a < 1: return -20.0
        st = {x for x in tst[a:b] if x}
        W = wst[k]
        if not st or not W: return -2.0
        f = 2.0 * len(st & W) / (len(st) + len(W))
        ratio = (b - a) / max(1.0, len(skel_verses[k].split()))
        pen = 0.0 if 0.5 <= ratio <= 1.8 else -3.0 * min(2.0, abs(__import__('math').log(ratio)))
        return 9.0 * f + pen
    bs = B.dp_pairwise(V, T, cand, unary, seg, K=40)
    if bs is None: return None
    edges = [0] + bs + [T]
    return [' '.join(words[edges[k]:edges[k + 1]]) for k in range(V)]

changed = 0
for f in sorted(glob.glob(f'{RAW}/[0-9A-Z]*.json')):
    raw = json.load(open(f)); bid = raw['id']
    web = web_verses(bid)
    bad = suspicious(raw, web)
    if not bad: continue
    # runs of flagged chapters, each widened by one neighbour on both sides
    spans = []
    for c in bad:
        lo, hi = max(0, c - 1), min(len(raw['chapters']) - 1, c + 1)
        if spans and lo <= spans[-1][1] + 1: spans[-1][1] = max(spans[-1][1], hi)
        else: spans.append([lo, hi])
    for lo, hi in spans:
        chs = range(lo, hi + 1)
        skel = []; counts = []
        for ci in chs:
            wv = [x for x in web[ci] if x[0]]
            counts.append(len(raw['chapters'][ci]['blocks'][0][1])); skel += [t for _, t in wv]
        if sum(counts) != len(skel): continue
        words = ' '.join(t for ci in chs for _, t in raw['chapters'][ci]['blocks'][0][1]).split()
        new = resegment(words, skel)
        if new is None: continue
        # accept only if the junction fit improves
        old_f = sum(f1(t, s) for ci in chs for (_, t), s in zip(raw['chapters'][ci]['blocks'][0][1], [x[1] for x in web[ci] if x[0]]))
        new_f = sum(f1(a, s) for a, s in zip(new, skel))
        if new_f <= old_f + 0.5: continue
        i = 0
        for ci, n in zip(chs, counts):
            rows = raw['chapters'][ci]['blocks'][0][1]
            for j in range(n): rows[j][1] = new[i + j]
            i += n
        changed += 1
        print(f'{bid} chapters {lo + 1}-{hi + 1}: fit {old_f:.1f} -> {new_f:.1f}')
    json.dump(raw, open(f, 'w'), ensure_ascii=False, indent=0)
print('runs repaired:', changed)
