"""Repairs common scanner misreadings word by word. A word is only changed when it never occurs in the app's other (clean) texts, and exactly one substitution from a table of well-known confusions turns it into one that is.
Usage: python3 scripts/ocr_repair.py <word-count.pkl> <file.json> [...]   (rewrites the files; the vocabulary is built by scripts/clean_butler_ocr.py's author step)"""
import json, re, sys, pickle, itertools, collections

SUBS = [('flf', 'ff'), ('fl', 'ff'), ('fi', 'ffi'), ('fii', 'ffi'), ('li', 'h'), ('tli', 'th'), ('wli', 'wh'), ('ii', 'u'), ('ii', 'n'), ('rn', 'm'), ('m', 'rn'),
        ('c', 'e'), ('e', 'c'), ('l', 'i'), ('i', 'l'), ('1', 'l'), ('0', 'o'), ('vv', 'w'), ('ao', 'a'), ('tb', 'th'), ('tii', 'th'),
        ('u', 'n'), ('n', 'u'), ('h', 'b'), ('b', 'h') ]

def candidates(w, good):
    out = set()
    for a, b in SUBS:
        start = 0
        while True:
            i = w.find(a, start)
            if i < 0: break
            c = w[:i] + b + w[i + len(a):]
            if good.get(c, 0) >= 15: out.add(c)   # a common word, not a rare coincidence
            start = i + 1
    return out

def repair(text, good, stats):
    def sub(m):
        w = m.group(0)
        lo = w.lower()
        if len(lo) < 6 or good.get(lo, 0) >= 1 or not w.isalpha(): return w
        c = candidates(lo, good)
        if len(c) != 1: return w
        r = next(iter(c))
        stats[lo] = r
        if w.isupper(): return r.upper()
        if w[0].isupper(): return r[0].upper() + r[1:]
        return r
    return re.sub(r'[A-Za-z]+', sub, text)

def walk(o, good, stats):
    if isinstance(o, str): return repair(o, good, stats)
    if isinstance(o, list): return [walk(x, good, stats) for x in o]
    if isinstance(o, dict): return {k: (walk(v, good, stats) if k in ('text', 'paras', 'sections', 'days', 't') or isinstance(v, (list, dict)) else v) for k, v in o.items()}
    return o

if __name__ == '__main__':
    good = pickle.load(open(sys.argv[1], 'rb'))
    for path in sys.argv[2:]:
        stats = {}
        d = json.load(open(path))
        d = walk(d, good, stats)
        compact = 'library/works' in path
        json.dump(d, open(path, 'w'), ensure_ascii=False, indent=None if compact else 1, separators=(',', ':') if compact else None)
        print(path, len(stats), 'distinct words repaired:', dict(itertools.islice(stats.items(), 25)))
