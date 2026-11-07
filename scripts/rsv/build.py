#!/usr/bin/env python3
"""Rebuild chapter/verse structure of the Ignatius Bible (RSV-2CE) from its OCR'd epub.

The epub is a page-by-page OCR of a print book: the Bible text only (no notes), but the superscript verse
numbers are badly damaged ("!%And", "74And", "*2But", sometimes lost entirely) and headings, footnote
letters and stray symbols are mixed into the running text.  Splitting on numbers would silently misassign
verses, so we align instead:

  1. each book's text is cut out of the epub by its title page;
  2. noise tokens are dropped and glued marker prefixes split off;
  3. chapters, then verses, are located by dynamic programming over candidate boundaries, scored by
       - how well a damaged marker matches the expected number (exact digits, wildcard symbols),
       - sentence/clause starts,
       - word overlap with the WEB-C verse that should start/end there (same verse division),
       - a length prior from the WEB-C verse lengths;
  4. section headings (and Psalm superscriptions) left at the end of a verse are cut off;
  5. OCR slips are repaired (LORD, stress accents in names, ligature junk).

Output: data/curated/rsv2ce-raw/<BOOK>.json (fix.py then writes data/curated/rsv2ce/) (BookData: {id, edition, chapters:[{n, blocks:[['p',[[v,text],..]]]}]})
plus data/curated/rsv2ce/_report.json with per-book alignment quality.
Usage:  python3 scripts/rsv/build.py [BOOK ...]
"""
import json, os, re, sys, math
sys.path.insert(0, os.path.dirname(__file__))
from pages import pages

HIDE = bool(os.environ.get('HIDE'))
OUT = os.environ.get('RSV_OUT', 'data/curated/rsv2ce-raw')
WEB = 'public/data/bible/webc'

# canon id -> first page of the book's text in the epub
START = {
 'GEN': 11, 'EXO': 96, 'LEV': 166, 'NUM': 217, 'DEU': 291, 'JOS': 356, 'JDG': 398, 'RUT': 441,
 '1SA': 448, '2SA': 503, '1KI': 550, '2KI': 603, '1CH': 655, '2CH': 703, 'EZR': 762, 'NEH': 780,
 'TOB': 805, 'JDT': 824, 'EST': 850, 'JOB': 870, 'PSA': 936, 'PRO': 1112, 'ECC': 1168, 'SNG': 1183,
 'WIS': 1197, 'SIR': 1234, 'ISA': 1332, 'JER': 1467, 'LAM': 1590, 'BAR': 1607, 'EZK': 1622, 'DAN': 1710,
 'HOS': 1747, 'JOL': 1769, 'AMO': 1779, 'OBA': 1795, 'JON': 1799, 'MIC': 1804, 'NAM': 1818, 'HAB': 1825,
 'ZEP': 1832, 'HAG': 1840, 'ZEC': 1844, 'MAL': 1861, '1MA': 1866, '2MA': 1920,
 'MAT': 1960, 'MRK': 2016, 'LUK': 2051, 'JHN': 2111, 'ACT': 2154, 'ROM': 2210, '1CO': 2234, '2CO': 2256,
 'GAL': 2271, 'EPH': 2280, 'PHP': 2289, 'COL': 2296, '1TH': 2302, '2TH': 2308, '1TI': 2312, '2TI': 2319,
 'TIT': 2325, 'PHM': 2328, 'HEB': 2331, 'JAS': 2350, '1PE': 2357, '2PE': 2364, '1JN': 2369, '2JN': 2375,
 '3JN': 2376, 'JUD': 2377, 'REV': 2380,
}
ORDER = list(START)
END_OF_BIBLE = 2410   # first page after Revelation is checked at runtime (notes start)

STOP = set('the a an and of to in for with on at by from as or not his her their your my our he she it they we you i me him them us is are was were be been am will shall may would should could do did does have has had that this these those which who whom whose what when where there then than so but if nor yet let lo behold o unto upon all any each also into out up down over under'.split())
SMALL = set('of the and to in for with on at by from as over or not his her their your my our a an'.split())

def stem(w):
    w = re.sub(r'[^a-z]', '', w.lower())
    if len(w) > 4:
        for suf in ('ing', 'ed', 'es', 's'):
            if w.endswith(suf) and len(w) - len(suf) >= 3:
                w = w[: -len(suf)]
                break
    return w

def content(words):
    return [s for s in (stem(w) for w in words) if s and s not in STOP and len(s) > 2]

SYM = set('!*°@#%®©¢¶|=+~^_$&§†‡?/\\<>[]{}»«')

# ---------------------------------------------------------------- tokens
class Tok:
    __slots__ = ('pre', 'word')
    def __init__(self, pre, word): self.pre, self.word = pre, word

def tokenize(text):
    toks = []
    for raw in text.split():
        # drop footnote noise: lone symbols, lone odd letters
        if len(raw) == 1 and (raw in SYM or raw in '‘’“”\'"-—–.,;:' or (raw.isalpha() and raw not in 'aIAO')):
            if raw in '—–-' : toks.append(Tok('', raw))
            continue
        if re.fullmatch(r'[^\w\s“”‘’\'".,;:?!()—–-]{1,3}', raw): continue
        if raw in ('è', 'ï', 'ò', 'à', 'ì', 'é'): continue
        m = re.match(r'^([^A-Za-z]*)([A-Za-z].*)$', raw)
        if m:
            pre, word = m.group(1), m.group(2)
            q = re.search(r'[“‘\'"(]+$', pre)
            if q: pre, word = pre[:q.start()], q.group(0) + word
        else:
            pre, word = raw, ''
        if pre and (re.search(r'\d', pre) or any(c in SYM for c in pre)):
            if not word and not re.fullmatch(r'\d{1,3}[.,;:)]?', pre) and not any(c in SYM for c in pre): toks.append(Tok('', raw)); continue
            toks.append(Tok(pre, word))
        else:
            toks.append(Tok('', raw))
    return toks

def is_marker(t): return bool(t.pre) and (re.search(r'\d', t.pre) or any(c in SYM for c in t.pre))

def marker_score(t, k):
    """score of token t being the marker for number k (0 = not a marker)"""
    if not t.pre: return 0.0
    if HIDE: return 0.0
    s = re.sub(r'[“”‘’\'".,;:()]', '', t.pre)   # quotes/punct around digits are noise
    if not s: return 0.0
    tt = str(k)
    if s.isdigit():
        if s == tt: return 10.0
        if len(s) == len(tt) and sum(a != b for a, b in zip(s, tt)) == 1: return 5.0
        if s == tt + '1' and not t.word: return 5.0
        return 3.0
    # mixed digits / symbols
    if len(s) == len(tt) and all((a == b) or (not a.isdigit()) for a, b in zip(s, tt)): return 8.0
    if len(s) < len(tt):
        # subsequence match with wildcard symbols
        j = 0
        for ch in tt:
            if j < len(s) and (s[j] == ch or not s[j].isdigit()): j += 1
        if j == len(s): return 5.5
    if len(s) <= len(tt) + 1: return 3.0
    return 1.5

def end_punct(w): return bool(re.search(r'[.?!”’)\]]$|[.?!][”’)]$', w))

# ---------------------------------------------------------------- DP
def dp_pairwise(V, T, cand, unary, seg, K=16):
    """choose boundaries p_1<...<p_{V-1} in (0,T); unary(k,p) scores boundary k at p; seg(k,a,b) scores verse k spanning [a,b)"""
    layers = []
    prev = {0: (0.0, None)}
    for k in range(1, V):
        sc = sorted(((unary(k - 1, p), p) for p in cand[k - 1]), reverse=True)[:K]
        cur = {}
        for u, b in sc:
            best = None
            for a, (pv, _) in prev.items():
                if a >= b: continue
                val = pv + u + seg(k - 1, a, b)
                if best is None or val > best[0]: best = (val, a)
            if best: cur[b] = best
        if not cur: return None
        layers.append(cur)
        prev = cur
    # last verse spans [p, T)
    best = None
    for a, (pv, _) in prev.items():
        val = pv + seg(V - 1, a, T)
        if best is None or val > best[0]: best = (val, a)
    p = best[1]
    out = [p]
    for k in range(len(layers) - 1, 0, -1):
        p = layers[k][p][1]
        out.append(p)
    out.reverse()
    return out

def dp_boundaries(n_units, cand, score, first_min, last_max):
    """choose increasing positions p_2..p_n; cand[k] = candidate list for unit k (k=1..n-1 means boundary before unit k+1)
    returns list of chosen positions or None"""
    prev = {first_min - 1: (0.0, None)}
    layers = []
    for k in range(n_units - 1):
        cur = {}
        keys = sorted(prev)
        # running best over positions < p
        bi = 0; best = (-1e18, None)
        for p in cand[k]:
            while bi < len(keys) and keys[bi] < p:
                if prev[keys[bi]][0] > best[0]: best = (prev[keys[bi]][0], keys[bi])
                bi += 1
            if best[1] is None and best[0] < -1e17: continue
            cur[p] = (best[0] + score(k, p), best[1])
        layers.append(cur)
        if not cur: return None
        prev = cur
    # pick best final
    p, (sc, _) = max(prev.items(), key=lambda kv: kv[1][0])
    out = [p]
    for k in range(n_units - 2, 0, -1):
        p = layers[k][p][1]
        out.append(p)
    out.reverse()
    return out

def web_book(bid):
    d = json.load(open(f'{WEB}/{bid}.json'))
    chs = []
    for c in d['chapters']:
        vs = []
        for b in c['blocks']:
            if isinstance(b[1], str): continue
            for v, t in b[1]:
                if v == 0 and vs: vs[-1][1] += ' ' + t
                elif v == 0: vs.append([0, t])
                else: vs.append([v, t])
        chs.append(vs)
    return chs

# ---------------------------------------------------------------- OCR repairs
def repair(s):
    s = re.sub(r'\b[Ll][Oo][Rr][PpDdBb]{1,2}\b', lambda m: 'Lord' if m.group(0) == 'Lord' else 'LORD', s)
    s = re.sub(r'\bLORD’S\b', 'LORD’s', s)
    s = re.sub(r'(?<=[A-Za-z])[\'"](?=[-A-Za-z])', '', s)    # stress marks inside names: Am'orites -> Amorites
    s = s.replace('’s', '’s')
    s = re.sub(r'\s+([,.;:?!”’)])', r'\1', s)
    s = re.sub(r'([“‘(])\s+', r'\1', s)
    s = re.sub(r'\s{2,}', ' ', s)
    return s.strip()

def strip_heading(words):
    """cut a trailing section heading (title-case run with no closing punctuation) from a verse"""
    j = len(words)
    while j > 0 and not end_punct(words[j - 1]) and not words[j - 1].endswith(('”', '’')):
        j -= 1
    run = words[j:]
    if 1 <= len(run) <= 10 and j > 0:
        ok = run[0][:1].isupper() and all((w[:1].isupper() or w.lower() in SMALL or not w[:1].isalpha()) for w in run)
        if ok: return words[:j], run
    return words, []

def trim_tail(words, webv):
    """drop a trailing section heading / Psalm superscription: pick the verse end that best matches the end of the WEB verse"""
    w2, head = strip_heading(words)
    ends = [i for i in range(1, len(words) + 1) if i == len(words) or end_punct(words[i - 1])]
    last = content(webv.split()[-6:])
    expl = max(3, len(webv.split()))
    best = None
    for e in ends:
        if e < max(2, 0.4 * expl): continue
        ov = len(set(content(words[max(0, e - 7):e])) & set(last))
        sc = 1.6 * min(4, ov) - ((e - expl * 1.0) / (0.15 * expl + 4)) ** 2 + (0.5 if e == len(w2) else 0)
        if best is None or sc > best[0]: best = (sc, e)
    if best and best[1] < len(words):
        keep = len(words[:best[1]])
        # only trust a cut that removes a plausible heading/superscription (<=45 tokens) and improves the match
        if len(words) - best[1] <= 45:
            full = len(set(content(words[-7:])) & set(last))
            cut = len(set(content(words[max(0, best[1] - 7):best[1]])) & set(last))
            if cut > full or (cut == full and best[1] == len(w2)): return words[:best[1]]
    return w2

# ---------------------------------------------------------------- one book
def book_text(bid, pgs):
    i = ORDER.index(bid)
    a = START[bid]
    b = START[ORDER[i + 1]] if i + 1 < len(ORDER) else notes_start(pgs)
    parts = []
    for n in range(a, b):
        t = pgs[n]
        parts.append(t)
    txt = ' '.join(parts)
    # drop the all-caps book title at the start
    txt = re.sub(r'^((?:[A-Z][A-Z\'’(),.-]*\s+)+)', '', txt)
    return txt

def notes_start(pgs):
    for n in range(2381, 2500):
        if re.search(r'Back to text|Parallel Notes', pgs[n][:400]) or pgs[n].startswith('Parallel Notes'): return n
    return 2420

DJVU = 'data/licensed/ignatius-djvu.txt'
_HY = None
def hyphen_map():
    """The epub text dropped hyphens at line ends; the djvu text of the same book keeps them.
    Return {joined: hyphenated} for words that really carry a hyphen (names and compounds)."""
    global _HY
    if _HY is not None: return _HY
    _HY = {}
    if not os.path.exists(DJVU): return _HY
    raw = open(DJVU, encoding='utf8', errors='replace').read()
    flat = raw.replace('\n', ' ')
    pairs = set(re.findall(r"(\b[A-Za-z']{2,})-[ \t]*\n[ \t]*([A-Za-z']{2,})", raw))
    for x, y in pairs:
        hy = len(re.findall(r"(?<![A-Za-z])" + re.escape(x) + '-' + re.escape(y) + r"(?![A-Za-z])", flat))
        jn = len(re.findall(r"(?<![A-Za-z-])" + re.escape(x + y) + r"(?![A-Za-z-])", flat))
        if jn > 0 and hy == 0: continue          # a genuine one-word spelling (eyeservice)
        _HY[x + y] = x + '-' + y
    return _HY

def apply_hyphens(txt):
    for j, h in hyphen_map().items():
        txt = re.sub(r"(?<![A-Za-z'-])" + re.escape(j) + r"(?![A-Za-z'-])", h, txt)
    return txt

def align_book(bid, txt, skel, rep):
    txt = apply_hyphens(txt)
    txt = re.sub(r'(\d)\s+(\d)\s*\[', r'\1\2 [', txt)
    txt = re.sub(r'\s*\[\s*[\d ]{1,8}\]', '', txt)
    toks = tokenize(txt)
    N = len(toks)
    nch = len(skel)
    words = [t.word if t.word else t.pre for t in toks]   # markers carry no text; word '' means pure marker
    # ---- chapter starts: positions of tokens that are the chapter number
    cst = [0] * nch
    # chapter 1: first token with digit prefix == '1' within the first 40 tokens (title + heading precede it)
    first = -1
    fv1 = set(content(skel[0][0][1].split()[:10])) if skel and skel[0] else set()
    for i in range(min(3000, N)):
        s = re.sub(r'[^0-9]', '', toks[i].pre)
        if s == '1' and is_marker(toks[i]):
            ahead = set(content([w for w in words[i + 1:i + 12] if w]))
            if i < 60 or len(ahead & fv1) >= 2: first = i; break
    cst[0] = first   # index of the number token (-1 means none)
    lens = [sum(len(t) for _, t in ch) for ch in skel]
    tot = sum(lens) or 1
    cum = [0]
    for L in lens: cum.append(cum[-1] + L)
    if nch > 1:
        usable = N - max(first, 0)
        def exp_pos(c): return max(first, 0) + usable * cum[c] / tot
        window = max(150, int(0.07 * usable))
        head = [False] * N
        for i, t in enumerate(toks):
            w = t.word
            head[i] = bool(w) and (w[:1].isupper() or w.lower().strip('.,') in SMALL) and not end_punct(w)
        isexact = {}
        def runstart(p):
            r = p
            while r > 0 and head[r - 1] and p - r < 10: r -= 1
            return r
        cand = []
        for c in range(1, nch):
            e = exp_pos(c)
            want = str(c + 1)
            cs = []
            for i in range(int(max(first + 1, e - window)), int(min(N, e + window))):
                t = toks[i]
                dg = re.sub(r'[^0-9]', '', t.pre) if t.pre else ''
                if dg == want and (not t.word or t.word[:1].isupper() or t.word[:1] in '“‘"\''):
                    cs.append(i); isexact[(c, i)] = True
                    continue
                # fallback: first token after a title-case heading run that follows a sentence end
                if i >= 2 and not head[i] is False:
                    pass
                if i >= 2 and head[i - 1] and toks[i].word and (toks[i].word[:1].isupper() or toks[i].word[:1] in '“‘"\''):
                    r = runstart(i)
                    if r < i and (r == 0 or end_punct(toks[r - 1].word or '')):
                        cs.append(i - 1 if len(toks[i - 1].word) <= 2 else i - 1)
                        isexact[(c, i - 1)] = isexact.get((c, i - 1), False)
            fvv = set(content(skel[c][0][1].split()[:8])) if skel[c] else set()
            if len(fvv) >= 3:
                for i in range(int(max(first + 2, e - window)), int(min(N, e + window))):
                    if len(set(content([w for w in words[i:i + 8] if w])) & fvv) >= 3 and (i - 1) not in cs:
                        cs.append(i - 1)
            cand.append(sorted(set(cs)))
        def csc(k, p):
            c = k + 1
            t = toks[p]
            ex = isexact.get((c, p), False)
            sc = 8.0 if ex else 3.0
            if p > 0:
                pw = toks[p - 1].word or ''
                if pw and not end_punct(pw) and pw[:1].isupper(): sc += 2.0
                if pw and end_punct(pw): sc += 0.5
            q = p + 1
            nxt = content([w for w in words[q:q + 9] if w])
            fv = content(skel[c][0][1].split()[:8]) if skel[c] else []
            sc += min(4, len(set(nxt) & set(fv))) * 1.5
            lv = content(skel[c - 1][-1][1].split()[-10:]) if skel[c - 1] else []
            prv = content([w for w in words[max(0, p - 14):p] if w])
            sc += min(4, len(set(prv) & set(lv))) * 1.2
            e = exp_pos(c)
            sc -= ((p - e) / (0.010 * usable + 20)) ** 2
            return sc
        pos = dp_boundaries(nch, cand, csc, first + 1, N)
        if pos is None:
            rep['warn'].append(f'{bid}: chapter DP failed'); return None
        cst[1:] = pos
    # chapter text ranges: after number token to next chapter number token
    out = []
    stats = {'exact': 0, 'damaged': 0, 'none': 0, 'verses': 0}
    for c in range(nch):
        a = cst[c] + 1 if cst[c] >= 0 else 0
        b = cst[c + 1] if c + 1 < nch else N
        ctoks = toks[a:b]
        cw = [t.word for t in ctoks]
        skv = skel[c]
        V = len(skv)
        if V == 0: continue
        T = len(ctoks)
        wl = [len(t) for _, t in skv]
        wtot = sum(wl) or 1
        wcum = [0]
        for L in wl: wcum.append(wcum[-1] + L)
        # the verse-1 start is the beginning; boundaries before verse 2..V
        def e_pos(k): return T * wcum[k] / wtot
        win = max(45, int(0.18 * T))
        cand = []
        for k in range(1, V):
            e = e_pos(k)
            lo = int(max(1, e - win)); hi = int(min(T - 1, e + win))
            cand.append(list(range(lo, hi + 1)))
        vfirst = [content(t.split()[:6]) for _, t in skv]
        vlast = [content(t.split()[-6:]) for _, t in skv]
        def vsc(k, p):
            # boundary before verse index k+1 (0-based k+1) with number skv[k+1][0]
            idx = k + 1
            num = skv[idx][0] if skv[idx][0] else idx + 1
            t = ctoks[p]
            sc = 0.0
            ms = marker_score(t, num) if (t.pre) else 0.0
            sc += ms
            prevw = cw[p - 1] if p > 0 else ''
            if ms == 0:
                if end_punct(prevw): sc += 1.4
                elif prevw.endswith((',', ';', ':')): sc += 0.4
                else: sc -= 4.0
                if not (cw[p][:1].isupper() or cw[p][:1] in '“‘"\''): sc -= 1.5
            bef = content([w for w in cw[max(0, p - 7):p] if w])
            aft = content([w for w in cw[p:p + 7] if w])
            sc += min(3, len(set(bef) & set(vlast[idx - 1]))) * 1.1
            sc += min(3, len(set(aft) & set(vfirst[idx]))) * 1.1
            sc -= ((p - e_pos(idx)) / (0.05 * T + 8)) ** 2
            return sc
        wstem = [set(content(t.split())) for _, t in skv]
        tstem = [ (stem(w) if w else '') for w in cw ]
        tstem = [x if x and x not in STOP and len(x) > 2 else '' for x in tstem]
        def vseg(k, a, b):
            if b - a < 1: return -20.0
            st = {x for x in tstem[a:b] if x}
            W = wstem[k]
            if not st or not W: return -2.0
            ov = len(st & W)
            f = 2.0 * ov / (len(st) + len(W))
            ratio = (b - a) / max(1.0, 1.0 * len(skv[k][1].split()))
            pen = 0.0 if 0.5 <= ratio <= 1.8 else -3.0 * min(2.0, abs(math.log(ratio / 1.0)))
            return 9.0 * f + pen
        if V > 1:
            bs = dp_pairwise(V, T, cand, vsc, vseg)
            if bs is None: bs = dp_pairwise(V, T, cand, vsc, vseg, K=64)      # long, short-versed chapters (Psalm 119)
            if bs is None: bs = dp_boundaries(V, cand, vsc, 1, T)
        else:
            bs = []
        if bs is None:
            rep['warn'].append(f'{bid} {c + 1}: verse DP failed ({V} verses, {T} tokens)'); return None
        edges = [0] + bs + [T]
        verses = []
        for k in range(V):
            seg = ctoks[edges[k]:edges[k + 1]]
            w = [t.word for t in seg if t.word]
            if k > 0 and seg and not seg[0].word and re.sub(r'\D', '', seg[0].pre) == str(skv[k][0] or k + 1) + '1' and w and w[0][:1].islower():
                w[0:0] = ['I']
            if k == V - 1:
                w = trim_tail(w, skv[k][1])
            num = skv[k][0] if skv[k][0] else k + 1
            verses.append([num, repair(' '.join(w))])
            # evidence of misalignment: a clean numeric marker inside this verse that names another verse
            for t in seg[1:]:
                if t.pre and re.fullmatch(r'\d{1,3}', t.pre) and 1 <= int(t.pre) <= V and int(t.pre) != num and not (t.word == '' and int(t.pre) > 30 and False):
                    stats.setdefault('interior', []).append(f'{c + 1}:{num}~{t.pre}')
            if k > 0:
                t0 = ctoks[edges[k]]
                ms = marker_score(t0, num) if t0.pre else 0
                if t0.pre and re.fullmatch(r'\d{1,3}', t0.pre) and int(t0.pre) != num: stats.setdefault('conflict', []).append(f'{c + 1}:{num}!={t0.pre}')
                if ms >= 8: stats['exact'] += 1; stats.setdefault('exact_ids', []).append([c + 1, num])
                elif ms >= 3: stats['damaged'] += 1
                else: stats['none'] += 1
        stats['verses'] += V
        # verse 0 (title) entries: WEB-C numbers them 0; RSV text is unnumbered; keep them as part of verse numbering by skipping zero
        out.append({'n': c + 1, 'verses': verses})
    rep['books'][bid] = stats
    return out

def main():
    sel = sys.argv[1:] or ORDER
    pgs = dict(pages())
    os.makedirs(OUT, exist_ok=True)
    rep = {'warn': [], 'books': {}}
    for bid in sel:
        skel = web_book(bid)
        txt = book_text(bid, pgs)
        res = align_book(bid, txt, skel, rep)
        if res is None:
            print('FAILED', bid); continue
        chapters = []
        for ch in res:
            vs = [[v, t] for v, t in ch['verses'] if t]
            # merge verse-0 title lines forward: skel has v==0 only after a numbered verse, handled in web_book
            chapters.append({'n': ch['n'], 'blocks': [['p', vs]]})
        json.dump({'id': bid, 'edition': 'rsv2ce', 'chapters': chapters}, open(f'{OUT}/{bid}.json', 'w'), ensure_ascii=False, indent=0)
        s = rep['books'][bid]
        print(f"{bid}: {s['verses']} verses, exact {s['exact']}, damaged {s['damaged']}, none {s['none']}, conflicts {len(s.get('conflict', []))}, interior {len(s.get('interior', []))}")
    json.dump(rep, open(f'{OUT}/_report.json', 'w'), indent=1)

if __name__ == '__main__':
    main()
