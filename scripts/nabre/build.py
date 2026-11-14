#!/usr/bin/env python3
"""Convert the NABRE epub (Calibre HTML split) into the app's per-book Bible JSON.

Usage: python3 -I scripts/nabre/build.py <extracted-epub-dir> <out-dir>

The epub marks verse numbers as <sup class="calibre41">N</sup>, poetry by paragraph classes, section
headings as <strong class="bold"> or centred paragraphs, and puts each chapter's footnotes after its
text (those are not imported; this edition carries the translation text and its section headings only).
"""
import html, json, os, re, sys

SRC, OUT = sys.argv[1], sys.argv[2]

BOOKS = [  # title in the epub -> app book id
 ('THE BOOK OF GENESIS', 'GEN'), ('THE BOOK OF EXODUS', 'EXO'), ('THE BOOK OF LEVITICUS', 'LEV'), ('THE BOOK OF NUMBERS', 'NUM'),
 ('THE BOOK OF DEUTERONOMY', 'DEU'), ('THE BOOK OF JOSHUA', 'JOS'), ('THE BOOK OF JUDGES', 'JDG'), ('THE BOOK OF RUTH', 'RUT'),
 ('THE BOOKS OF SAMUEL', '1SA'), ('THE SECOND BOOK OF SAMUEL', '2SA'), ('THE BOOKS OF KINGS', '1KI'), ('THE SECOND BOOK OF KINGS', '2KI'),
 ('THE FIRST BOOK OF CHRONICLES', '1CH'), ('THE SECOND BOOK OF CHRONICLES', '2CH'), ('THE BOOK OF EZRA', 'EZR'), ('THE BOOK OF NEHEMIAH', 'NEH'),
 ('THE BOOK OF TOBIT', 'TOB'), ('THE BOOK OF JUDITH', 'JDT'), ('THE BOOK OF ESTHER', 'EST'), ('THE FIRST BOOK OF MACCABEES', '1MA'),
 ('THE SECOND BOOK OF MACCABEES', '2MA'), ('THE BOOK OF JOB', 'JOB'), ('THE BOOK OF PSALMS', 'PSA'), ('THE BOOK OF PROVERBS', 'PRO'),
 ('THE BOOK OF ECCLESIASTES', 'ECC'), ('THE SONG OF SONGS', 'SNG'), ('THE BOOK OF WISDOM', 'WIS'), ('THE WISDOM OF BEN SIRA', 'SIR'),
 ('THE BOOK OF ISAIAH', 'ISA'), ('THE BOOK OF JEREMIAH', 'JER'), ('THE BOOK OF LAMENTATIONS', 'LAM'), ('THE BOOK OF BARUCH', 'BAR'),
 ('THE BOOK OF EZEKIEL', 'EZK'), ('THE BOOK OF DANIEL', 'DAN'), ('THE BOOK OF HOSEA', 'HOS'), ('THE BOOK OF JOEL', 'JOL'),
 ('THE BOOK OF AMOS', 'AMO'), ('THE BOOK OF OBADIAH', 'OBA'), ('THE BOOK OF JONAH', 'JON'), ('THE BOOK OF MICAH', 'MIC'),
 ('THE BOOK OF NAHUM', 'NAM'), ('THE BOOK OF HABAKKUK', 'HAB'), ('THE BOOK OF ZEPHANIAH', 'ZEP'), ('THE BOOK OF HAGGAI', 'HAG'),
 ('THE BOOK OF ZECHARIAH', 'ZEC'), ('THE BOOK OF MALACHI', 'MAL'),
 ('THE GOSPEL ACCORDING TO MATTHEW', 'MAT'), ('THE GOSPEL ACCORDING TO MARK', 'MRK'), ('THE GOSPEL ACCORDING TO LUKE', 'LUK'),
 ('THE GOSPEL ACCORDING TO JOHN', 'JHN'), ('THE ACTS OF THE APOSTLES', 'ACT'), ('THE LETTER TO THE ROMANS', 'ROM'),
 ('THE FIRST LETTER TO THE CORINTHIANS', '1CO'), ('THE SECOND LETTER TO THE CORINTHIANS', '2CO'), ('THE LETTER TO THE GALATIANS', 'GAL'),
 ('THE LETTER TO THE EPHESIANS', 'EPH'), ('THE LETTER TO THE PHILIPPIANS', 'PHP'), ('THE LETTER TO THE COLOSSIANS', 'COL'),
 ('THE FIRST LETTER TO THE THESSALONIANS', '1TH'), ('THE SECOND LETTER TO THE THESSALONIANS', '2TH'), ('THE FIRST LETTER TO TIMOTHY', '1TI'),
 ('THE SECOND LETTER TO TIMOTHY', '2TI'), ('THE LETTER TO TITUS', 'TIT'), ('THE LETTER TO PHILEMON', 'PHM'), ('THE LETTER TO THE HEBREWS', 'HEB'),
 ('THE LETTER OF JAMES', 'JAS'), ('THE FIRST LETTER OF PETER', '1PE'), ('THE SECOND LETTER OF PETER', '2PE'), ('THE FIRST LETTER OF JOHN', '1JN'),
 ('THE SECOND LETTER OF JOHN', '2JN'), ('THE THIRD LETTER OF JOHN', '3JN'), ('THE LETTER OF JUDE', 'JUD'), ('THE BOOK OF REVELATION', 'REV'),
]
TITLE = {t: b for t, b in BOOKS}

def fname(n):
    return os.path.join(SRC, 'dummy_split_%03d.html' % n if n < 1000 else 'dummy_split_%d.html' % n)

def clean(inner):
    s = inner
    # footnote / cross-reference callouts: an anchor around an italic superscript
    s = re.sub(r'<a (?:id="[^"]*" )?href="#(filepos\d+)"[^>]*>(?:(?!</a>).)*?<sup class="calibre40">.*?</sup>(?:(?!</a>).)*?</a>', lambda m: '\x07' + m.group(1) + '\x08', s, flags=re.S)
    s = re.sub(r'<a [^>]*>(?:(?!</a>).)*?<sup class="calibre40">.*?</sup>(?:(?!</a>).)*?</a>', '', s, flags=re.S)
    s = re.sub(r'<sup[^>]*class="calibre41"[^>]*>(.*?)</sup>', lambda m: '\x01' + re.sub('<[^>]+>', '', m.group(1)).strip() + '\x02', s, flags=re.S)
    s = re.sub(r'<span>(\d+)a</span>', lambda m: '\x01' + m.group(1) + '\x02', s)   # Sirach 33:20a style: part a opens the verse
    s = re.sub(r'<span>\d+[b-z]</span>', '', s)                                      # later parts continue it
    s = re.sub(r'<span>(\d+):(\d+)</span>', lambda m: '\x03%s:%s\x04' % (m.group(1), m.group(2)), s)
    s = re.sub(r'<br\s*/?>', ' ', s)
    s = re.sub(r'<[^>]+>', '', s)
    return html.unescape(s)

def verses(text, notes_out=None):
    """'\\x011\\x02text\\x012\\x02text' -> [[v, text]...]; leading text with no number -> v 0.  Note markers \\x07id\\x08 are
    collected into notes_out as (verse, id) and removed from the text."""
    out = []
    cur = 0
    pieces = re.split(r'(\x01[^\x02]*\x02)', text)
    lead_done = False
    cur_v = 0
    buf_notes = []
    for piece in pieces:
        m = re.fullmatch(r'\x01([^\x02]*)\x02', piece)
        if m:
            num = m.group(1).strip()
            if num.isdigit(): cur_v = int(num); out.append([cur_v, ''])
            continue
        for nid in re.findall(r'\x07(filepos\d+)\x08', piece):
            if notes_out is not None: notes_out.append((cur_v, nid))
        body = ' '.join(re.sub(r'\x07filepos\d+\x08', '', piece).split())
        if not out:
            if body: out.append([0, body])
        elif body:
            out[-1][1] = (out[-1][1] + ' ' + body).strip()
    return [r for r in out if r[1] or r[0]]

# ---- the notes ---------------------------------------------------------------------------------------
NOTE = {}       # note id -> (label, text)
def plain_text(x): return ' '.join(html.unescape(re.sub(r'<[^>]+>', '', x)).split())
for n_ in range(11, 1262):
    pth = fname(n_)
    if not os.path.exists(pth): continue
    tt = open(pth, encoding='utf8').read()
    for m_ in re.finditer(r'<p id="(filepos\d+)" class="\w+"><span class="calibre10"><a href="[^"]*">(.*?)</a>(.*?)</span></p>', tt, re.S):
        lab = plain_text(m_.group(2)).rstrip('.').strip()
        body = plain_text(m_.group(3))
        body = re.sub(r'^\s*\[[^\]]*\]\s*', '', body)       # the verse range in brackets is where the note sits
        if lab and body: NOTE[m_.group(1)] = (lab, body)
print(len(NOTE), 'notes found', file=sys.stderr)
CH_NOTES = {}   # (book, chapter) -> [(verse, note id)]
LASTV = {}

books = {}      # id -> {chapter n -> blocks}
order = []
cur_book = cur_ch = None
pre_heads = []  # headings seen before the next chapter marker or text block
carry = {}      # (book, chapter) -> blocks that belong at the start of that chapter (cross-chapter verse markers)
in_notes = False
last_kind = None

def add_block(kind, runs):
    global last_kind
    if cur_book is None or cur_ch is None: return
    blocks = books[cur_book][cur_ch]
    blocks.append([kind, runs])
    last_kind = kind

PARA = re.compile(r'(<div id="filepos\d+" class="calibre1">)|(<table)|(?:<blockquote class="(\w+)">)?<p ((?:id="[^"]*" )?)class="(\w+)">(.*?)</p>', re.S)
chap_n = lambda s: int(re.search(r'\d+', s).group(0)) if re.search(r'\d+', s) else None

for n in range(11, 1262):
    path = fname(n)
    if not os.path.exists(path): continue
    t = open(path, encoding='utf8').read()
    t = t[t.find('<body'):]
    for m in PARA.finditer(t):
        if m.group(1): in_notes = False; pre_heads = []; continue
        if m.group(2): in_notes = True; continue
        bq, pid, pc, inner = m.group(3), m.group(4), m.group(5), m.group(6)
        noref = re.sub(r'<a [^>]*>(?:(?!</a>).)*?<sup class="calibre40">.*?</sup>(?:(?!</a>).)*?</a>', '', inner, flags=re.S)
        plain = ' '.join(re.sub(r'<[^>]+>', '', noref).split())
        # book title
        if pc == 'calibre2' and bq is None and html.unescape(plain) in TITLE:
            cur_book = TITLE[html.unescape(plain)]; cur_ch = None; in_notes = False; pre_heads = []
            if cur_book not in books: books[cur_book] = {}; order.append(cur_book)
            continue
        if cur_book is None: continue
        # chapter heading
        if pc == 'calibre30' and bq is None:
            label = html.unescape(plain)
            label = re.sub(r'\s*\d+$' if cur_book == 'PSA' and False else r'$^', '', label)
            lab = re.sub(r'[^A-Za-z0-9 ]', '', re.sub(r'\d+$', lambda m_: m_.group(0), label)).strip()
            mm = re.match(r'^(?:\()?(?:CHAPTER|PSALM)\s+(\d+)(?:\))?', html.unescape(plain).strip())
            if mm:
                cur_ch = int(mm.group(1)); in_notes = False
                books[cur_book].setdefault(cur_ch, [])
                books[cur_book][cur_ch].extend(carry.pop((cur_book, cur_ch), []))
                for h in pre_heads: books[cur_book][cur_ch].append(['s', h])
                pre_heads = []
            else:
                cur_ch = None  # lettered Greek additions (Esther A-F), Foreword etc.: not imported
            continue
        if in_notes or '<span class="calibre10">' in inner: in_notes = True; continue
        raw = clean(inner)
        # inline section headings (<strong class="bold">…</strong> opening a paragraph)
        hm = re.match(r'(?:\s*<span[^>]*>)*\s*<strong class="bold">(.*?)</strong>', inner, re.S)
        # headings
        if pc in ('calibre38',) or (pc == 'calibre2' and bq):
            h = ' '.join(html.unescape(re.sub(r'<[^>]+>', '', re.sub(r'<a [^>]*>(?:(?!</a>).)*</a>', '', inner, flags=re.S))).split())
            if re.fullmatch(r'[IVXL]+', h) or not h: continue
            pre_heads.append(h)
            continue
        if cur_ch is None and cur_book in ('OBA', 'PHM', '2JN', '3JN', 'JUD') and '\x01' in raw:
            cur_ch = 1; books[cur_book].setdefault(1, [])
        if cur_ch is None: continue
        for h in pre_heads: add_block('s', h)
        pre_heads = []
        if pc == 'calibre57':   # right-aligned "Selah"
            blocks = books[cur_book][cur_ch]
            if blocks and blocks[-1][0] not in ('s',) and blocks[-1][1]:
                blocks[-1][1][-1][1] += ' ' + re.sub(r'\x07filepos\d+\x08', '', raw).strip()
            continue
        if pc in ('calibre45',) or pc in ('calibre22',): continue
        if hm:
            h = ' '.join(html.unescape(re.sub(r'<[^>]+>', '', re.sub(r'<a [^>]*>(?:(?!</a>).)*</a>', '', hm.group(1), flags=re.S))).split())
            if h: add_block('s', h)
            inner2 = inner[hm.end():]
            raw = clean(inner2)
        if pc == 'calibre35' and not hm:
            # heading in the first span, then verses; the heading is the text before the first verse number
            pass
        if '\x03' in raw:
            head, _, tail = raw.partition('\x03')
            ref, _, rest = tail.partition('\x04')
            cn, vn = (int(x) for x in ref.split(':'))
            carry.setdefault((cur_book, cn), []).append(['p', [[vn, ' '.join(rest.split())]]])
            raw = head
        nl = []
        runs = verses(raw, nl)
        for v_, nid in nl:
            vv_ = v_ if v_ > 0 else LASTV.get((cur_book, cur_ch), 1)
            CH_NOTES.setdefault((cur_book, cur_ch), []).append((vv_, nid))
        for r_ in runs:
            if r_[0] > 0: LASTV[(cur_book, cur_ch)] = r_[0]
        if not runs: continue
        if pc in ('calibre42', 'calibre47'): kind = 'q1'
        elif pc == 'calibre33' and bq == 'calibre14' and last_kind in ('q1', 'q2') and len(raw.strip()) < 140 and not re.match(r'\s*\x01', raw): kind = 'q2'
        elif pc in ('calibre52', 'calibre50'): kind = 'li1'
        else: kind = 'p'
        add_block(kind, runs)

def numbered(ch):
    return [(i, j, r[0]) for i, bl in enumerate(ch) if bl[0] not in ('s', 'd', 'ms', 'sp', 'r') for j, r in enumerate(bl[1]) if r[0] > 0]

# A verse printed ahead of its chapter's verse 1 that belongs to the previous chapter's end (e.g. Numbers 25:19 opens
# chapter 26 in the printed text): move it back to where its number says it goes.
for b in order:
    cs = sorted(books[b])
    for prev, c in zip(cs, cs[1:]):
        nums = numbered(books[b][c])
        if len(nums) >= 2 and nums[0][2] > 1 and nums[1][2] == 1:
            pn = numbered(books[b][prev])
            if pn and pn[-1][2] + 1 == nums[0][2]:
                i, j, v = nums[0]
                bl = books[b][c][i]
                run = bl[1].pop(j)
                if not bl[1]: books[b][c].pop(i)
                books[b][prev].append(['p', [run]])

# ...and the reverse: a trailing "1" after verse N>1 that is really the next chapter's verse 1 (Tobit 6:1 closes chapter 5)
for b in order:
    cs = sorted(books[b])
    for c, nxt in zip(cs, cs[1:]):
        nums = numbered(books[b][c]); nn = numbered(books[b][nxt])
        if len(nums) >= 2 and nums[-1][2] == 1 and nums[-2][2] > 1 and nn and nn[0][2] == 2:
            i, j, v = nums[-1]
            bl = books[b][c][i]
            run = bl[1].pop(j)
            if not bl[1]: books[b][c].pop(i)
            at = 0
            while at < len(books[b][nxt]) and books[b][nxt][at][0] == 's': at += 1
            books[b][nxt].insert(at, ['p', [run]])

# Lines at the top of a chapter with no verse number continue the previous chapter's last verse (e.g. Hosea 6:11b opens
# chapter 7, Sirach 38:34cd opens chapter 39, Ruth 2:23b opens chapter 3): move them back so the verse stays whole.
def last_run(blocks):
    for bl in reversed(blocks):
        if bl[0] not in ('s', 'd', 'ms', 'sp', 'r') and bl[1]: return bl[1][-1]
    return None

for b in order:
    cs = sorted(books[b])
    for prev, c in zip(cs, cs[1:]):
        blocks = books[b][c]
        at = 0
        while at < len(blocks) and blocks[at][0] == 's': at += 1
        if at >= len(blocks): continue
        first = blocks[at]
        m = re.match(r'\[(\d+):(\d+)\s*(.*)', first[1][0][1]) if first[1][0][0] == 0 else None
        if m and int(m.group(1)) == prev:     # John 7:53 opens chapter 8 in the printed text
            books[b][prev].append(['p', [[int(m.group(2)), '[' + m.group(3)]]])
            first[1][0] = [0, '']
            first[1][:] = [r for r in first[1] if r[1] or r[0]]
            if not first[1]: del blocks[at]
            continue
        if first[1][0][0] == 0 and any(r[0] > 0 for r in first[1]) and bool(numbered(blocks)):
            lr = last_run(books[b][prev])
            if lr is not None:
                lr[1] = (lr[1] + ' ' + first[1][0][1]).strip(); first[1].pop(0)
            continue
        k = at
        while k < len(blocks) and blocks[k][0] != 's' and all(r[0] == 0 for r in blocks[k][1]): k += 1
        if k > at and numbered(blocks):
            books[b][prev].extend(blocks[at:k])
            del blocks[at:k]

os.makedirs(OUT, exist_ok=True)
rep = {}
for b in order:
    chs = []
    for c in sorted(books[b]):
        if not books[b][c]: continue
        d_ = {'n': c, 'blocks': books[b][c]}
        nt = {}
        for v_, nid in CH_NOTES.get((b, c), []):
            if nid in NOTE:
                lab, txt = NOTE[nid]
                nt.setdefault(str(v_), [])
                line = f'{lab}: {txt}'
                if line not in nt[str(v_)]: nt[str(v_)].append(line)
        if nt: d_['notes'] = nt
        chs.append(d_)
    json.dump({'id': b, 'edition': 'nabre', 'chapters': chs}, open(os.path.join(OUT, b + '.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    rep[b] = {str(ch['n']): sum(1 for bl in ch['blocks'] if bl[0] not in ('s','d','ms','sp','r') for r in bl[1] if r[0] > 0 for _ in [0]) for ch in chs}
json.dump(rep, open(os.path.join(OUT, '_report.json'), 'w'))
print(len(order), 'books', sum(len(v) for v in rep.values()), 'chapters')
