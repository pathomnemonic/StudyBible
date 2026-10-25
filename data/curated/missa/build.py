#!/usr/bin/env python3
"""Builds public/data/missa/* from Divinum Officium (MIT) English data: the Order of Mass of the Extraordinary Form (low Mass)
and the propers of every Sunday, feria and saint's day, with commons resolved.

Usage: build.py /path/to/divinum-officium/web/www
"""
import json, os, re, sys, collections
WWW = sys.argv[1] if len(sys.argv) > 1 else '/home/user/divinumofficium/divinum-officium/web/www'
MISSA = os.path.join(WWW, 'missa')
HORAS = os.path.join(WWW, 'horas')
OUT = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'public', 'data', 'missa')
os.makedirs(OUT, exist_ok=True)

def read(p):
    return open(p, encoding='utf-8').read() if os.path.exists(p) else None

def parse(text):
    """-> (inherit path or None, {section: [lines]})"""
    inherit = None
    secs = {}
    cur = None
    for raw in text.split('\n'):
        line = raw.rstrip()
        m = re.match(r'^\[([^\]]+)\]\s*(\(.*\))?\s*$', line)
        if m:
            name, cond = m.group(1).rstrip('_'), m.group(2)
            if name in secs and cond: cur = None; continue   # keep the first / unconditional version
            cur = []
            secs[name] = cur
            continue
        if cur is None:
            if line.startswith('@') and inherit is None and ':' not in line: inherit = line[1:].strip()
            continue
        cur.append(line)
    return inherit, secs

cache = {}
def load(path, lang='English'):
    """Loads Tempora/xxx, Sancti/xx-xx or Commune/Cx with inheritance."""
    key = (lang, path)
    if key in cache: return cache[key]
    base = path.split('/')
    if base[0] == 'Commune':
        txt = read(os.path.join(HORAS, lang, 'Commune', f'{base[1]}.txt'))
    else:
        txt = read(os.path.join(MISSA, lang, path + '.txt'))
    if txt is None: cache[key] = {}; return {}
    inherit, secs = parse(txt)
    merged = {}
    if inherit:
        merged.update(load(inherit, lang))
    merged.update(secs)
    cache[key] = merged
    return merged

MACROS = {}
def macros():
    if MACROS: return MACROS
    inh, secs = parse(read(os.path.join(MISSA, 'English', 'Ordo', 'Prayers.txt')))
    for k, v in secs.items(): MACROS[k] = '\n'.join(l for l in v if l.strip()).strip()
    return MACROS

def resolve(lines, depth=0, name=''):
    """expand @includes, $macros and drop & calls; returns list of lines"""
    if depth > 5: return lines
    out = []
    for l in lines:
        s = l.strip()
        if s.startswith('@'):
            m = re.match(r'^@([^:]*)(?::([^:]*))?(?::(.*))?$', s)
            path, sec, sub = m.group(1), m.group(2), m.group(3)
            src = load(path) if path else {}
            got = src.get((sec or '').rstrip('_'))
            if got:
                got = resolve(got, depth + 1)
                if sub:
                    mm = re.match(r's/(.*?)/(.*?)/(\w*)$', sub)
                    if mm:
                        try: got = re.sub(mm.group(1), mm.group(2), '\n'.join(got), flags=re.S).split('\n')
                        except re.error: pass
                out += got
            continue
        if s.startswith('$'):
            t = macros().get(s[1:].strip())
            if t: out.append(t)
            continue
        if s.startswith('&'): continue
        out.append(l)
    return out

def latin_rank(path):
    t = read(os.path.join(MISSA, 'Latin', path + '.txt'))
    if t is None: return None, {}
    inh, secs = parse(t)
    if inh:
        t2 = read(os.path.join(MISSA, 'Latin', inh + '.txt'))
        if t2:
            inh2, s2 = parse(t2); s2.update(secs); secs = s2
    # rank variants: "(sed rubrica 196)" precedes the variant for 1960
    ranks = []
    cond = None
    for l in secs.get('Rank', []):
        s = l.strip()
        if not s: continue
        if s.startswith('('): cond = s; continue
        ranks.append((cond, s)); cond = None
    pick = None
    for c, r in ranks:
        if c and '196' in c and 'rubrica 1955' not in c and not c.startswith('(sed rubrica 1570'): pick = r
    if pick is None and ranks: pick = ranks[0][1]
    rank = None
    if pick:
        f = pick.split(';;')
        try: rank = dict(cls=f[1].strip(), n=float(f[2]), commune=(re.search(r'(?:ex|vide)\s+(C[\w\-]+)', f[3]).group(1) if len(f) > 3 and re.search(r'(?:ex|vide)\s+(C[\w\-]+)', f[3]) else None), ex=bool(len(f) > 3 and 'ex ' in f[3]))
        except (ValueError, IndexError): rank = None
    rule = '\n'.join(secs.get('Rule', []))
    return rank, dict(gloria=bool(re.search(r'^Gloria', rule, re.M)) and not re.search(r'^no Gloria', rule, re.M | re.I), credo=bool(re.search(r'^Credo', rule, re.M)) and not re.search(r'^no Credo', rule, re.M | re.I),
                       pref=(re.search(r'Prefatio1960=(\w+)', rule) or re.search(r'Prefatio=(\w+)', rule) or [None, None])[1], commune=(re.search(r'(?:ex|vide)\s+(C[\w\-]+)', rule) or [None, None])[1])

NAMES = ('Introitus', 'Oratio', 'Lectio', 'Graduale', 'Tractus', 'Evangelium', 'Offertorium', 'Secreta', 'Communio', 'Postcommunio')
def clean(lines, saint):
    txt = '\n'.join(lines).strip()
    txt = re.sub(r'\n{3,}', '\n\n', txt)
    txt = re.sub(r'\bN\.(?=[\s,;:)])', saint, txt)
    return txt

def saint_name(official):
    s = re.sub(r'^(Sts?\.|Blessed|Bl\.)\s+', '', official or '')
    return s.split(',')[0].split(' and ')[0].strip() or 'N.'

def day(path, which):
    eng = load(path)
    rank, rule = latin_rank(path)
    off = '\n'.join(eng.get('Officium', [])).strip()
    commune = (rank or {}).get('commune') or rule.get('commune')
    ccm = load('Commune/' + commune) if commune else {}
    saint = saint_name(off)
    p = {}
    for n in NAMES:
        src = eng.get(n)
        if not src and commune:
            src = ccm.get(n)
        if src:
            r = resolve(src)
            if r and ''.join(r).strip(): p[n] = clean(r, saint)
    # sections the English files lack: fall back to the Latin text, marked as Latin
    lat = {}
    miss = [n for n in NAMES if n not in p and not (n == 'Graduale' and 'Tractus' in p)]
    if miss:
        le = load(path, 'Latin')
        lc = load('Commune/' + commune, 'Latin') if commune else {}
        for n in miss:
            src = le.get(n) or lc.get(n)
            if src:
                r = resolve(src)
                if r and ''.join(r).strip(): lat[n] = clean(r, saint)
    if not rank:
        rank = dict(cls='', n=1.0, commune=commune, ex=False)
    return dict(name=off, rank=rank['n'], cls=rank['cls'], rule=dict(gloria=rule.get('gloria', False), credo=rule.get('credo', False), pref=rule.get('pref')), commune=commune, p=p, **({'lat': lat} if lat else {}))

def build():
    # Tempora
    tdir = os.path.join(MISSA, 'English', 'Tempora')
    tem = {}
    for f in sorted(os.listdir(tdir)):
        if f.endswith('.txt'):
            k = f[:-4]
            tem[k] = day('Tempora/' + k, 'T')
    json.dump(tem, open(os.path.join(OUT, 'tempora.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('tempora', len(tem), os.path.getsize(os.path.join(OUT, 'tempora.json')))
    # Sancti by month
    sdir = os.path.join(MISSA, 'English', 'Sancti')
    months = collections.defaultdict(dict)
    for f in sorted(os.listdir(sdir)):
        m = re.match(r'^(\d\d)-(\d\d)\.txt$', f)
        if m: months[m.group(1)][m.group(2)] = day('Sancti/' + f[:-4], 'S')
    for mo, d in months.items():
        json.dump(d, open(os.path.join(OUT, f'sancti-{mo}.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        print('sancti', mo, len(d), os.path.getsize(os.path.join(OUT, f'sancti-{mo}.json')))

KEEP = {None, 'nD', 'RnD', 'R'}
DROP = {'D', 'S', 'SnD', 'SD'}
FLAGS = {'&Credo': 'credo', '&GloriaM': 'gloria', '&Introibo': 'judica'}
DIALOGUE = re.compile(r'^(P|S|D|M|V|R|C|A)\.\s+(.*)$')

def ordo():
    text = read(os.path.join(MISSA, 'English', 'Ordo', 'Ordo.txt'))
    prayers = macros()
    blocks = []
    paras = re.split(r'\n\s*\n', text)
    for para in paras:
        lines = [l.rstrip() for l in para.split('\n') if l.strip() and l.strip() != '_']
        if not lines: continue
        cond = None; flag = None
        rest = []
        for l in lines:
            if l.startswith('!*'):
                c = l[2:].strip()
                if c in FLAGS: flag = FLAGS[c]
                elif c.startswith('&'): pass
                else: cond = c
            else: rest.append(l)
        lines = rest
        if cond in DROP or not lines: continue
        for l in lines:
            s = re.sub(r'wait\d+', '', l).strip()
            s = s.replace('&nbsp;', ' ')
            if not s: continue
            b = None
            if s.startswith('!!!'): b = dict(k='em', t=s[3:].strip())
            elif s.startswith('!!'): b = dict(k='h2', t=s[2:].strip())
            elif s.startswith('!'): b = dict(k='r', t=s[1:].strip())
            elif s.startswith('#'): b = dict(k='h', t=s[1:].strip())
            elif s.startswith('&'):
                fn = s[1:].strip().split()[0]
                low = fn.lower()
                if low in ('introitus', 'collect', 'lectio', 'graduale', 'evangelium', 'offertorium', 'secreta', 'prefatio', 'communio', 'postcommunio'):
                    b = dict(k='p', name={'collect': 'oratio'}.get(low, low))
                elif fn == 'DominusVobiscum': b = dict(k='d', who='P', t='The Lord be with you.'); blocks.append(b); b = dict(k='d', who='S', t='And with thy spirit.')
                elif fn == 'Gloria': b = dict(k='x', t='Glory be to the Father, and to the Son, and to the Holy Ghost. As it was in the beginning, is now, and ever shall be, world without end. Amen.')
                elif fn == 'itemissaest': b = dict(k='d', who='P', t='Go, the Mass is ended.'); blocks.append(b); b = dict(k='d', who='S', t='Thanks be to God.')
                elif fn == 'Ultimaev':
                    t = prayers.get('Ultima Evangelium', '')
                    b = dict(k='x', t=re.sub(r'^v\.\s+', '', re.sub(r'\n!.*?\n', '\n', t)).strip())
                elif fn == 'communicantes': b = dict(k='x', t='Communicating, and honoring in the first place the memory of the glorious ever-Virgin Mary, Mother of our God and Lord Jesus Christ:')
                else: continue
            else:
                m = DIALOGUE.match(s)
                if m: b = dict(k='d', who=m.group(1), t=m.group(2).strip())
                elif s.startswith('v.') or s.startswith('V.'): b = dict(k='v', t=s[2:].strip())
                else: b = dict(k='x', t=s)
            if flag and b: b['if'] = flag
            if b: blocks.append(b)
    # merge consecutive plain paragraphs of the same kind are left as they are; remove empties
    blocks = [b for b in blocks if b.get('t', 'x') != '' or b['k'] == 'p']
    json.dump(blocks, open(os.path.join(OUT, 'ordo.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    prefs = {}
    inh, secs = parse(read(os.path.join(MISSA, 'English', 'Ordo', 'Prefationes.txt')))
    for k, v in secs.items():
        t = '\n'.join(l for l in v if l.strip()).strip()
        prefs[k] = re.sub(r'^!(.*)\n', '', t).replace('v. ', '', 1) if t else ''
    json.dump(prefs, open(os.path.join(OUT, 'prefaces.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('ordo blocks', len(blocks), 'prefaces', len(prefs))

if __name__ == '__main__':
    ordo()
    build()
