#!/usr/bin/env python3
"""Build the RSV-2CE pack from the owner's Ignatius Bible MOBI (a clean text, replacing the damaged scan).

Usage: python3 -I scripts/rsv/build_mobi.py <book.html from the unpacked mobi> <out-dir>
(unpack with:  pip install mobi ; python3 -c "import mobi; print(mobi.extract('x.mobi'))" )

Output: <out-dir>/<BOOK>.json in the app's BookData shape. Each chapter carries `notes` keyed by verse:
  lettered textual footnotes ("a: Or ..."), the printed study notes ("* ...") and the cross-references ("See: Jn 1:1.").
"""
import html, json, os, re, sys, collections
SRC, OUT = sys.argv[1], sys.argv[2]
T = open(SRC, 'rb').read().decode('utf8', 'replace')
cut = T.find('<b>Gen 1:1:</b>')
cut = T.rfind('<p', 0, cut)
MAIN, NOTES = T[:T.rfind('THE BOOK OF GENESIS', 0, cut) if False else cut], T[cut:]
# the notes part begins at the first section of the notes (cross references of Genesis); the main text ends before its heading
mi = MAIN.rfind('<mbp:pagebreak/>')
MAIN = T[:mi] if mi > 0 else MAIN

TITLES = [
 ('GENESIS','GEN'),('EXODUS','EXO'),('LEVITICUS','LEV'),('NUMBERS','NUM'),('DEUTERONOMY','DEU'),('JOSHUA','JOS'),('JUDGES','JDG'),('RUTH','RUT'),
 ('FIRST BOOK OF SAMUEL','1SA'),('SECOND BOOK OF SAMUEL','2SA'),('1 KINGS','1KI'),('FIRST BOOK OF KINGS','1KI'),('SECOND BOOK OF KINGS','2KI'),
 ('FIRST BOOK OF CHRONICLES','1CH'),('SECOND BOOK OF CHRONICLES','2CH'),('EZRA','EZR'),('NEHEMIAH','NEH'),('TOBIT','TOB'),('JUDITH','JDT'),('ESTHER','EST'),
 ('JOB','JOB'),('PSALMS','PSA'),('PROVERBS','PRO'),('ECCLESIASTES','ECC'),('SONG OF SOLOMON','SNG'),('WISDOM OF SOLOMON','WIS'),('SIRACH','SIR'),
 ('ISAIAH','ISA'),('LAMENTATIONS','LAM'),('JEREMIAH','JER'),('BARUCH','BAR'),('EZEKIEL','EZK'),('DANIEL','DAN'),('HOSEA','HOS'),('JOEL','JOL'),('AMOS','AMO'),
 ('OBADIAH','OBA'),('JONAH','JON'),('MICAH','MIC'),('NAHUM','NAM'),('HABAKKUK','HAB'),('ZEPHANIAH','ZEP'),('HAGGAI','HAG'),('ZECHARIAH','ZEC'),('MALACHI','MAL'),
 ('FIRST BOOK OF THE MACCABEES','1MA'),('FIRST BOOK OF MACCABEES','1MA'),('SECOND BOOK OF MACCABEES','2MA'),('SECOND BOOK OF THE MACCABEES','2MA'),
 ('GOSPEL ACCORDING TO MATTHEW','MAT'),('GOSPEL ACCORDING TO MARK','MRK'),('GOSPEL ACCORDING TO LUKE','LUK'),('GOSPEL ACCORDING TO JOHN','JHN'),('ACTS OF THE APOSTLES','ACT'),
 ('PAUL TO THE ROMANS','ROM'),('FIRST LETTER OF PAUL TO THE CORINTHIANS','1CO'),('SECOND LETTER OF PAUL TO THE CORINTHIANS','2CO'),('PAUL TO THE GALATIANS','GAL'),
 ('PAUL TO THE EPHESIANS','EPH'),('PAUL TO THE PHILIPPIANS','PHP'),('PAUL TO THE COLOSSIANS','COL'),('FIRST LETTER OF PAUL TO THE THESSALONIANS','1TH'),
 ('SECOND LETTER OF PAUL TO THE THESSALONIANS','2TH'),('FIRST LETTER OF PAUL TO TIMOTHY','1TI'),('SECOND LETTER OF PAUL TO TIMOTHY','2TI'),('PAUL TO TITUS','TIT'),
 ('PAUL TO PHILEMON','PHM'),('TO THE HEBREWS','HEB'),('LETTER OF JAMES','JAS'),('FIRST LETTER OF PETER','1PE'),('SECOND LETTER OF PETER','2PE'),
 ('FIRST LETTER OF JOHN','1JN'),('SECOND LETTER OF JOHN','2JN'),('THIRD LETTER OF JOHN','3JN'),('LETTER OF JUDE','JUD'),('REVELATION TO JOHN','REV'),
]
def book_of(t):
    t = t.upper().strip()
    for k, b in sorted(TITLES, key=lambda x: -len(x[0])):
        if t.endswith(k) or k in t: 
            if k == 'JOB' and t != 'THE BOOK OF JOB': continue
            if k == 'JOEL' and 'JOEL' not in t: continue
            return b
    return None

# Expected verse counts (English numbering, from the WEB-C pack the app already carries): a chapter number is only accepted as
# a chapter start when the previous chapter has run nearly to its expected length, so a verse number that happens to equal
# chapter+1 (Jeremiah 4:5 ...) is not mistaken for one.
EXPECT = {}
_here = os.path.dirname(os.path.abspath(__file__))
_web = os.path.join(_here, '..', '..', 'public', 'data', 'bible', 'webc')
if os.path.isdir(_web):
    for f in os.listdir(_web):
        d = json.load(open(os.path.join(_web, f)))
        EXPECT[f[:-5]] = {c['n']: max([r[0] for bl in c['blocks'] if bl[0] not in ('s', 'd', 'ms', 'sp', 'r') for r in bl[1]] or [0]) for c in d['chapters']}
def complete(book, chap, last):
    e = EXPECT.get(book, {}).get(chap)
    return e is None or book in ('DAN', 'EST') or last >= e - 4

# ---- notes -----------------------------------------------------------------------------------------
text_of = lambda s: ' '.join(html.unescape(re.sub(r'<[^>]+>', '', re.sub(r'\x05\d+\x06', '', s))).replace('\xa0', ' ').split())
foot = {}      # id -> ('a', text, backId)
star = {}      # id -> (label, text, backId)
xref = []      # (label, text, backId)
for m in re.finditer(r'<sup><a id="filepos(\d+)" /><small><font size="1"><b><font color="red">([a-z]+)</font></b></font></small></sup>(.*?)<a href="#filepos(\d+)">Back to text\.</a>', NOTES, re.S):
    foot[m.group(1)] = (m.group(2), text_of(m.group(3)), m.group(4))
for m in re.finditer(r'<a id="filepos(\d+)" /><p[^>]*>\*\s*(.*?)</p>', NOTES, re.S):
    body = m.group(2); lab = re.match(r'\s*<a href="#filepos(\d+)">(.*?)</a>\s*:?\s*(.*)', body, re.S)
    if lab: star[m.group(1)] = (text_of(lab.group(2)), re.sub(r'^(?:[a-z]\s*)?:?\s*,?\s*', '', text_of(lab.group(3))), lab.group(1))
for m in re.finditer(r'<p[^>]*><b>([^<]*?):\s*</b>\s*(.*?)<a href="#filepos(\d+)">Back to text\.</a></p>', NOTES, re.S):
    xref.append((m.group(1).strip().rstrip(':'), text_of(m.group(2)).rstrip(' .') , m.group(3)))
print('notes found:', len(foot), 'lettered,', len(star), 'study,', len(xref), 'cross-reference lines', file=sys.stderr)

# chapter index: each book opens with a line of links, one per chapter, to the anchor where that chapter starts
CH_AT = {}
for m in re.finditer(r'<mbp:pagebreak/>', MAIN):
    j = MAIN.rfind('<p', 0, m.start())
    seg = MAIN[j:m.start()]
    if len(seg) < 60000 and seg.endswith('</p>') and re.fullmatch(r'<p[^>]*>(?:\s*<a href="#filepos\d+">\d+</a>\s*)+</p>', seg):
        for aid, n in re.findall(r'<a href="#filepos(\d+)">(\d+)</a>', seg): CH_AT[aid] = int(n)
print('chapter anchors:', len(CH_AT), file=sys.stderr)

# ---- main text -------------------------------------------------------------------------------------
M = re.sub(r'<a id="filepos(\d+)" />', lambda m: '\x05%s\x06' % m.group(1), MAIN)
M = re.sub(r'((?:\x05\d+\x06)+)(<(?:p|blockquote) [^>]*>)', lambda m: m.group(2) + m.group(1), M)   # anchors sit just before their paragraph: bring them inside
paras = re.finditer(r'<(?:p|blockquote) height="\d+pt" width="(\w+)" align="(\w+)">(.*?)</(?:p|blockquote)>', M, re.S)
books = collections.OrderedDict(); cur = None; ch = None; last_v = 0
anchor_at = {}           # anchor id -> (book, chapter, verse)
note_refs = []           # (book, chapter, verse, kind, id)
pending_anchor = []
heads = []
PEND = [None]
SKIPPED = []
DANST = {'raw': 0, 'off': 0, 'shown': 0}

def add(kind, runs):
    if cur is None or ch is None: return
    books[cur][ch]['blocks'].append([kind, runs])

def new_chapter(n):
    global ch, last_v
    ch = n; last_v = 0
    books[cur].setdefault(n, {'blocks': [], 'notes': collections.defaultdict(list)})
    for h in heads: books[cur][n]['blocks'].append(['s', h])
    heads.clear()

for m in paras:
    width, align, inner = m.group(1), m.group(2), m.group(3)
    plain = text_of(inner.replace('\x05', '').replace('\x06', ''))
    if align == 'center':
        bt = re.search(r'<b>(?:<font color="windowtext">)?([^<]+)(?:</font>)?</b>', inner)
        if bt and not re.search(r'color="blue"', inner):
            b = book_of(re.sub(r'\x05\d+\x06', '', bt.group(1)))
            if b:
                cur = b; ch = None; last_v = 0; heads.clear()
                if cur not in books: books[cur] = collections.OrderedDict()
            continue
        for aid in re.findall(r'\x05(\d+)\x06', inner):
            if aid in CH_AT: PEND[0] = CH_AT[aid]      # a chapter that starts right after a section heading
        if cur and plain and not re.fullmatch(r'[IVX.\d ]+', plain):
            if re.search(r'color="blue"', inner): heads.append(plain)
        continue
    if cur is None: continue
    # tokens
    pos = 0; out = []   # list of ('v', n) / ('t', text) / ('n', kind, id) / ('c', n)
    s = inner
    s = re.sub(r'<br\s*/?>', ' ', s)
    s = re.sub(r'^(\s*(?:\x05\d+\x06)*)<b>(\d+)</b>', lambda m: m.group(1) + '<sup><b>' + m.group(2) + '</b></sup>', s)
    tok = re.compile(r'(\x05(\d+)\x06)|<font size="5">(.*?)</font>|<sup>(.*?)</sup>|<a href="#filepos(\d+)"><font color="windowtext">\*</font></a>|<a href="#filepos(\d+)">(.*?)</a>|<[^>]+>', re.S)
    i = 0
    for t in tok.finditer(s):
        if t.start() > i: out.append(('t', s[i:t.start()]))
        i = t.end()
        if t.group(1):
            out.append(('C', CH_AT[t.group(2)]) if t.group(2) in CH_AT else ('a', t.group(2)))
        elif t.group(3) is not None:
            raw = text_of(t.group(3)); mm = re.match(r'(\d+)(?:\s*\[(\d+)\])?', raw)
            if mm: out.append(('c', int(mm.group(1)), bool(mm.group(2))))
        elif t.group(4) is not None:
            sup = t.group(4)
            ids = re.findall(r'\x05(\d+)\x06', sup)
            nums = re.findall(r'<b>\s*(?:<font[^>]*>)?\s*(\d+)\s*(?:</font>)?\s*</b>', sup)
            if not nums: nums = re.findall(r'<font size="1">\s*(\d+)\s*</font>', sup)
            reds = re.findall(r'<a href="#filepos(\d+)"><font[^>]*><b><font color="red">', sup)
            plain_links = [h for h in re.findall(r'<a href="#filepos(\d+)">(?:<font[^>]*>)?<b>\s*\d+', sup)]
            if nums:
                cid = [CH_AT[x] for x in ids if x in CH_AT]
                if cid: out.append(('C', cid[0]))
                else: out.append(('v', int(nums[0]), ids))
                for h in plain_links: out.append(('n', 'link', h))
            elif ids and not reds: out.append(('C', CH_AT[ids[0]]) if ids[0] in CH_AT else ('a', ids[0]))
            for h in reds: out.append(('n', 'foot', h))
        elif t.group(5): out.append(('n', 'star', t.group(5)))
        elif t.group(6) is not None:
            inner_a = t.group(7)
            m5 = re.search(r'<font size="5">(.*?)</font>', inner_a, re.S)
            if m5:
                raw = text_of(m5.group(1)); mm = re.match(r'(\d+)(?:\s*\[(\d+)\])?', raw)
                if mm: out.append(('c', int(mm.group(1)), bool(mm.group(2)), t.group(6)))
            elif text_of(inner_a) == '*': out.append(('n', 'star', t.group(6)))
            else: out.append(('t', re.sub(r'<[^>]+>', '', inner_a)))
        elif t.group(0).startswith('<b>') and False: pass
        else:
            pass
    if i < len(s): out.append(('t', s[i:]))
    if PEND[0] is not None: out.insert(0, ('C', PEND[0])); PEND[0] = None
    sw = re.match(r'\s*(?:\x05\d+\x06)*<b>\[(\d+)\]</b>', inner)
    if sw: out.insert(0, ('S', int(sw.group(1))))      # Esther: "[5]" resumes chapter 5 after an addition
    # build runs
    head_seen = bool(heads)
    runs = []; v = None; buf = []
    def flush():
        global v
        txt = ' '.join(text_of(''.join(buf)).split()) if buf else ''
        buf.clear()
        if txt or (v is not None and v > 0 and False): runs.append([v if v is not None else 0, txt])
    def emit():
        rr = [r for r in runs if r[1]]
        if rr and ch is not None:
            add('q1' if width == '0pt' and rr[0][0] > 0 else 'q2' if width == '0pt' else 'p', rr)
        runs.clear()
    started_with_chapter = False
    for tk in out:
        if tk[0] == 'a': pending_anchor.append(tk[1])
        elif tk[0] == 'S':
            flush(); emit(); ch = tk[1]; books[cur].setdefault(ch, {'blocks': [], 'notes': collections.defaultdict(list)}); last_v = 0
        elif tk[0] == 'C':
            if (ch is None and tk[1] == 1) or (ch is not None and tk[1] == ch + 1 and complete(cur, ch, last_v)):
                flush(); emit(); new_chapter(tk[1]); v = 1; last_v = 0
                for a in pending_anchor: anchor_at[a] = (cur, ch, 1)
                pending_anchor.clear()
        elif tk[0] == 'c':
            n, br = tk[1], tk[2]
            if br and ch is not None and n == ch + 1 and complete(cur, ch, last_v):
                flush(); emit(); new_chapter(n); v = 1; last_v = 0
                for a in pending_anchor: anchor_at[a] = (cur, ch, 1)
                pending_anchor.clear()
            elif br or n == ch:
                if len(tk) > 3 and ch is not None: note_refs.append((cur, ch, 1, 'link', tk[3], 0))
            elif cur == 'EST' and n != ch and (last_v >= 1 or ch is None):
                # the Greek additions are numbered 11-16 but printed between the chapters of the Hebrew story
                flush(); emit(); new_chapter(n); v = 1; last_v = 0
                for a in pending_anchor: anchor_at[a] = (cur, ch, 1)
                pending_anchor.clear()
            elif (ch is not None and ch < n <= ch + 3 and complete(cur, ch, last_v)) or (ch is None and n == 1 and cur not in ('PSA',)):
                flush(); emit(); new_chapter(n); v = 1; last_v = 0
                for a in pending_anchor: anchor_at[a] = (cur, ch, 1)
                pending_anchor.clear()
            else:
                flush(); v = n; last_v = n
                for a in pending_anchor: anchor_at[a] = (cur, ch, n) if ch is not None else None
                pending_anchor.clear()
                if len(tk) > 3 and ch is not None: note_refs.append((cur, ch, n, 'link', tk[3], 0))
        elif tk[0] == 'v' and cur == 'DAN' and ch == 3:
            # the Prayer of Azariah and the Song of the Three are numbered from 1 inside chapter 3; number them on from 3:23
            raw = tk[1]
            if raw < DANST['raw'] - 2: DANST['off'] = DANST['shown'] - raw + 1
            DANST['raw'] = raw; DANST['shown'] = raw + DANST['off']
            flush(); v = DANST['shown']; last_v = v
            for a in tk[2] + pending_anchor: anchor_at[a] = (cur, ch, v)
            pending_anchor.clear()
        elif tk[0] == 'v' and ch is not None and last_v > 0 and not (last_v < tk[1] <= last_v + 25) and cur != 'DAN':
            SKIPPED.append((cur, ch, last_v, tk[1]))
        elif tk[0] == 'v':
            if ch is None and cur in ('OBA', 'PHM', '2JN', '3JN', 'JUD'): new_chapter(1)
            flush(); v = tk[1]; last_v = v
            for a in tk[2] + pending_anchor: anchor_at[a] = (cur, ch, v) if ch is not None else None
            for a in [k for k, x in anchor_at.items() if x is None]: del anchor_at[a]
            pending_anchor.clear()
        elif tk[0] == 'n':
            vv = v if v else (last_v or 1)
            if ch is not None: note_refs.append((cur, ch, vv, tk[1], tk[2], len(buf)))
        elif tk[0] == 't': buf.append(tk[1])
    flush()
    if ch is None: continue
    runs = [r for r in runs if r[1]]
    if not runs: continue
    # a paragraph that continues the previous verse carries verse 0 at its start
    if runs and runs[0][0] == 0 and False: pass
    kind = 'q1' if width == '0pt' and runs[0][0] > 0 else 'q2' if width == '0pt' else 'p'
    for a in pending_anchor: pass
    add(kind, runs)
    for a in pending_anchor: pass

json.dump({'refs': len(note_refs)}, sys.stderr)
print('', file=sys.stderr)

# ---- attach notes ------------------------------------------------------------------------------------
for (b, c, v, kind, nid, _) in note_refs:
    chd = books[b][c]['notes']
    if kind in ('foot',) and nid in foot:
        L, txt, _b = foot[nid]; chd[v].append(f'{L}: {txt}')
    elif kind in ('star', 'link') and nid in star:
        lab, txt, _b = star[nid]; chd[v].append(f'{lab}: {txt}')
for b_, chs_ in books.items():
    for c_, d_ in chs_.items():
        for k_, lst_ in d_['notes'].items(): d_['notes'][k_] = list(dict.fromkeys(lst_))
by_back = collections.defaultdict(list)
for lab, refs, back in xref: by_back[back].append((lab, refs))
miss = 0
for back, items in by_back.items():
    w = anchor_at.get(back)
    if not w: miss += len(items); continue
    b, c, v = w
    if c is None or c not in books.get(b, {}): miss += len(items); continue
    for lab, refs in items:
        if refs: books[b][c]['notes'][v].append('See: ' + refs + '.')
print('cross-reference lines that found no verse:', miss, file=sys.stderr)
# Typos and line-break hyphens in the source file itself (found by scripts/rsv/audit_full.py against the other editions)
TYPOS = [('beseiged', 'besieged'), ('perserved', 'preserved'), ('will ot believe', 'will not believe'), ('paraales', 'parables'),
         ('astonished at hims', 'astonished at him'), ('startlet many', 'startle many'), ('rejectedu', 'rejected'), ('noisea and', 'noise and'),
         ('upon usc to', 'upon us to'), ('becompared', 'be compared'), ('preceeding', 'preceding'), ("Lac''edaemo", "Lac'edaemo"), ("Thessalo' nians", "Thessalo'nians")]
def tidy(t):
    t = re.sub(r'(?<=[A-Za-z.,;:”’])[§¶]+', '', t)       # footnote symbols left in the text
    for a, b in TYPOS: t = t.replace(a, b)
    t = re.sub(r"\b(fifty|sixty|seventy|eighty|ninety|twenty|thirty|forty)- (one|two|three|four|five|six|seven|eight|nine)\b", r"\1-\2", t)
    t = re.sub(r"(?<=[A-Za-z'])- (?=[a-z])", "", t)   # a word broken across two printed lines
    return t
for chs_ in books.values():
    for d_ in chs_.values():
        for bl_ in d_['blocks']:
            if bl_[0] in ('s', 'd', 'ms', 'sp', 'r'): bl_[1] = tidy(bl_[1])
            else:
                for r_ in bl_[1]: r_[1] = tidy(r_[1])
        for k_, lst_ in d_['notes'].items(): d_['notes'][k_] = [tidy(x) for x in lst_]

# A verse number printed as plain text at the start of a paragraph (the last verses of many chapters) arrives as the start of a
# continuation run: promote it to a verse when it is exactly the next number.
fixed = 0
for b, chs in books.items():
    for n, ch_ in chs.items():
        prev = 0
        for bl in ch_['blocks']:
            if bl[0] in ('s', 'd', 'ms', 'sp', 'r'): continue
            for r in bl[1]:
                if r[0] == 0:
                    m = re.match(r'(\d{1,3})\s+(?=\S)', r[1])
                    if m and int(m.group(1)) == prev + 1:
                        r[0] = int(m.group(1)); r[1] = r[1][m.end():]; fixed += 1
                if r[0] > 0: prev = r[0]
print('verse markers ignored as out of sequence:', len(SKIPPED), SKIPPED, file=sys.stderr)
# A chapter's opening words can finish the last verse of the chapter before (1 Samuel 3:21 ends "...by the word of the LORD." beside the 4):
# when verse 1 is printed again after them, they are carried back to where they belong.
carried = 0
for b, chs in books.items():
    order_ = sorted(chs)
    for prev_n, n in zip(order_, order_[1:]):
        if n != prev_n + 1: continue
        blocks_ = chs[n]['blocks']
        flat_ = [(bl, r) for bl in blocks_ if bl[0] not in ('s', 'd', 'ms', 'sp', 'r') for r in bl[1]]
        if len(flat_) >= 2 and flat_[0][1][0] == 1 and flat_[1][1][0] == 1:
            tail = flat_[0][1][1]
            tgt = [r for bl in chs[prev_n]['blocks'] if bl[0] not in ('s', 'd', 'ms', 'sp', 'r') for r in bl[1]]
            if tgt:
                tgt[-1][1] = (tgt[-1][1] + ' ' + tail).strip(); flat_[0][0][1].remove(flat_[0][1]); carried += 1
                chs[n]['blocks'] = [bl for bl in blocks_ if bl[0] in ('s', 'd', 'ms', 'sp', 'r') or bl[1]]
print('chapter openers carried back to the previous chapter:', carried, file=sys.stderr)

# A verse number that stayed in the middle of a run as plain text ("... Galilee.” * 53 They went ...") starts the next verse.
split_n = 0
for b, chs in books.items():
    for n, ch_ in chs.items():
        for bl in ch_['blocks']:
            if bl[0] in ('s', 'd', 'ms', 'sp', 'r'): continue
            out_ = []
            for r in bl[1]:
                cur_ = r
                while cur_[0] > 0:
                    m = re.search(r'\s+(?:\*\s*)?(\d{1,3})\s*(?=[A-Z“‘"(])', cur_[1])
                    if not m or int(m.group(1)) != cur_[0] + 1: break
                    out_.append([cur_[0], cur_[1][:m.start()].strip()])
                    cur_ = [int(m.group(1)), cur_[1][m.end():]]; split_n += 1
                out_.append(cur_)
            bl[1][:] = out_
print('verse numbers split out of running text:', split_n, file=sys.stderr)

# A paragraph that starts a verse but lost its number in the source (Matthew 5:4): when the next number skips exactly one, it is that one.
miss = 0
for b, chs in books.items():
    for n, ch_ in chs.items():
        flat = [(bl, r) for bl in ch_['blocks'] if bl[0] not in ('s', 'd', 'ms', 'sp', 'r') for r in bl[1]]
        prev = 0
        for i, (bl, r) in enumerate(flat):
            if r[0] == 0 and bl[1][0] is r and prev > 0:
                nxt = next((x[1][0] for x in flat[i + 1:] if x[1][0] > 0), None)
                if nxt == prev + 2: r[0] = prev + 1; miss += 1
            if r[0] > 0: prev = r[0]
print('unnumbered verses numbered from their neighbours:', miss, file=sys.stderr)
print('verse numbers recovered from plain text:', fixed, file=sys.stderr)
os.makedirs(OUT, exist_ok=True)
for b, chs in books.items():
    cl = []
    for n in sorted(chs):
        d = {'n': n, 'blocks': chs[n]['blocks']}
        if chs[n]['notes']: d['notes'] = {str(k): v for k, v in sorted(chs[n]['notes'].items())}
        cl.append(d)
    json.dump({'id': b, 'edition': 'rsv2ce', 'chapters': cl}, open(os.path.join(OUT, b + '.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(books), 'books', sum(len(c) for c in books.values()), 'chapters', file=sys.stderr)
