#!/usr/bin/env python3
"""Build public/data/office/office.json from Divinum Officium (MIT) English data.

Usage: build.py /path/to/divinum-officium/web/www/horas/English
Scope: the traditional Roman weekly psalter for ordinary time (Lauds, Terce, Sext,
None, Vespers, Compline). Seasonal and feast propers are not included.
"""
import json, re, sys, os

ROOT = sys.argv[1] if len(sys.argv) > 1 else '/home/user/divinumofficium/divinum-officium/web/www/horas/English'
OUT = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'public', 'data', 'office', 'office.json')


def sections(path):
    """name -> list of (cond, lines). A trailing underscore on a name is dropped."""
    out = {}
    cur = None
    for raw in open(path, encoding='utf-8').read().split('\n'):
        m = re.match(r'^\[([^\]]+)\]\s*(\(.*\))?\s*$', raw)
        if m:
            cur = []
            out.setdefault(m.group(1).rstrip('_'), []).append((m.group(2), cur))
            continue
        if cur is not None:
            cur.append(raw.rstrip())
    return out


def base(secs, name, cond=None):
    for c, lines in secs.get(name, []):
        if (c or None) == cond:
            return lines
    raise KeyError(name)


def clean(lines, keep_cond=False):
    res = []
    for l in lines:
        if l.startswith('(') and not keep_cond:
            break  # alternate rubrical variants follow
        if l.startswith('@') or l.startswith('/:'):
            continue
        res.append(l)
    while res and not res[-1].strip():
        res.pop()
    return res


def strip(l):
    l = re.sub(r'^[v]\.\s*', '', l)
    return l.strip()


def text_block(lines):
    """Chapter / prayer: returns {ref, text}."""
    ref, text = None, []
    for l in clean(lines):
        if l.startswith('!'):
            ref = l[1:].strip()
        elif l.startswith('$'):
            continue
        elif l.strip():
            text.append(strip(l))
    return {'ref': ref, 'text': ' '.join(text)}


def verse_pair(lines):
    v = r = None
    for l in clean(lines):
        if l.startswith('V.'):
            v = l[2:].strip()
        elif l.startswith('R.'):
            r = l[2:].strip()
    return {'v': v, 'r': r}


def responsory(lines):
    out = []
    for l in clean(lines):
        l = l.strip()
        if not l:
            continue
        if l.startswith('R.br.'):
            continue
        if l.startswith('&Gloria'):
            out.append({'gloria': True})
        elif l[:2] in ('R.', 'V.'):
            out.append({'k': l[0], 't': l[2:].strip()})
    return out


def hymn(lines):
    stanzas, cur = [], []
    for l in clean(lines):
        l = l.rstrip()
        if l == '_':
            stanzas.append(cur); cur = []
        elif l.strip():
            cur.append(strip(l))
    if cur:
        stanzas.append(cur)
    return stanzas


def ant(lines):
    t = [l for l in clean(lines) if l.strip()]
    return t[0].strip() if t else ''


def antline(raw):
    t = raw.split(';;')[0].strip()
    return t


# ---- psalm text
PS = {}
def psalm_text(n):
    if n in PS:
        return PS[n]
    lines = open(os.path.join(ROOT, 'Psalterium', 'Psalmorum', f'Psalm{n}.txt'), encoding='utf-8').read().split('\n')
    title = ''
    verses = []
    for l in lines:
        m = re.match(r'^(\d+):(\d+)([a-z]*)\s+(.*)$', l)
        if m:
            t = m.group(4)
            t = re.sub(r'\s*\(\d+[a-z]?\)\s*', ' ', t)
            t = re.sub(r'\s*[†‡]\s*', ' ', t).replace(' + ', ' ')
            parts = [p.strip() for p in t.split('*')]
            verses.append([int(m.group(2)), m.group(3) or '', [p for p in parts if p]])
        elif l.startswith('(') and l.endswith(')'):
            title = l.strip('()')
    PS[n] = {'title': title, 'verses': verses}
    return PS[n]


def rng(spec):
    """'118(33-48)' -> (118, lo, hi); ranges use (num,letter) pairs."""
    spec = spec.strip()
    if '(' in spec and not spec.endswith(')'):
        spec += ')'  # source typo: unclosed range
    m = re.match(r"^(\d+)(?:\(([^)]*)\))?$", spec)
    if not m:
        raise ValueError(repr(spec))
    n = int(m.group(1))
    if not m.group(2):
        return n, None, None
    a, b = m.group(2).split('-')
    def p(x, dflt):
        x = x.strip("'")
        mm = re.match(r'(\d+)([a-z]*)', x)
        return (int(mm.group(1)), mm.group(2) or dflt)
    return n, p(a, 'a'), p(b, 'z')


used = {}
def psalm_ref(spec):
    n, lo, hi = rng(spec)
    ps = psalm_text(n)
    vs = []
    for num, let, parts in ps['verses']:
        k = (num, let or 'a')
        if lo and (k < lo or (num == lo[0] and False)):
            continue
        if hi and (num > hi[0] or (num == hi[0] and (let or 'a') > hi[1])):
            continue
        vs.append(parts)
    key = str(n) if not lo else f'{n}:{lo[0]}-{hi[0]}' + ('' if True else '')
    used[key] = {'title': ps['title'], 'lines': vs, 'psalm': n}
    return key


def parse_psalmi_major(path):
    d = {}
    cur = None
    for l in open(path, encoding='utf-8').read().split('\n'):
        m = re.match(r'^\[([^\]]+)\]\s*$', l)
        if m:
            cur = d.setdefault(m.group(1), [])
        elif cur is not None and ';;' in l and not l.startswith('(') and l.split(';;')[1].strip()[:1].isdigit():
            a, p = l.split(';;', 1)
            cur.append({'a': a.strip(), 'p': psalm_ref(p.split(';')[0])})
    return d


def parse_psalmi_minor(path):
    d = {}
    cur = None
    names = {'Dominica': 0, 'Feria II': 1, 'Feria III': 2, 'Feria IV': 3, 'Feria V': 4, 'Feria VI': 5, 'Sabbato': 6, 'Sabato': 6}
    lines = open(path, encoding='utf-8').read().split('\n')
    i = 0
    while i < len(lines):
        l = lines[i]
        m = re.match(r'^\[([^\]]+)\]\s*$', l)
        if m:
            cur = d.setdefault(m.group(1), {})
        elif cur is not None and ' = ' in l:
            k, a = l.split(' = ', 1)
            k = k.strip()
            if k in names:
                ps = [x.strip() for x in lines[i + 1].split(',')]
                ps = [x for x in ps if x and not x.startswith('[')]
                cur[names[k]] = {'a': a.strip(), 'ps': [psalm_ref(x) for x in ps]}
                i += 1
        i += 1
    return d


def main():
    SP = os.path.join(ROOT, 'Psalterium', 'Special')
    major = sections(os.path.join(SP, 'Major Special.txt'))
    minor = sections(os.path.join(SP, 'Minor Special.txt'))
    prayers = sections(os.path.join(ROOT, 'Psalterium', 'Common', 'Prayers.txt'))
    pent2 = sections(os.path.join(ROOT, 'Tempora', 'Pent02-0.txt'))
    pm = parse_psalmi_major(os.path.join(ROOT, 'Psalterium', 'Psalmi', 'Psalmi major.txt'))
    pn = parse_psalmi_minor(os.path.join(ROOT, 'Psalterium', 'Psalmi', 'Psalmi minor.txt'))

    gloria = ' '.join(l.strip() for l in clean(base(prayers, 'Gloria')) if l.strip() and not l.startswith('v.'))
    gloria = re.sub(r'^v\.\s*', '', gloria)
    out = {
        'gloria': 'Glory be to the Father, and to the Son, and to the Holy Ghost. As it was in the beginning, is now, and ever shall be, world without end. Amen.',
        'pater': strip(' '.join(l for l in clean(base(prayers, 'Pater noster')) if l.strip())),
        'ave': strip(' '.join(l for l in clean(base(prayers, 'Ave Maria')) if l.strip())),
        'days': [],
        'minor': {},
        'compline': {},
        'collect': text_block(base(pent2, 'Oratio'))['text'],
    }
    def sun(day):
        return day == 0

    for d in range(7):
        day = {}
        # Lauds
        l = {}
        l['psalms'] = pm[f'Day{d} Laudes1']
        l['chapter'] = text_block(base(major, 'Dominica Laudes' if d == 0 else 'Feria Laudes'))
        l['hymn'] = hymn(base(major, f'Hymnus Day{d} Laudes'))
        l['responsory'] = responsory(base(major, 'Responsory Dominica Laudes' if d == 0 else 'Responsory Feria Laudes'))
        l['versicle'] = verse_pair(base(major, 'Dominica Versum 2' if d == 0 else 'Feria Versum 2'))
        l['canticleAnt'] = ant(base(pent2, 'Ant 2')) if d == 0 else ant(base(major, f'Feria{d + 1} Ant 2'))
        day['lauds'] = l
        # Vespers
        v = {}
        v['psalms'] = pm[f'Day{d} Vespera']
        v['chapter'] = text_block(base(major, 'Dominica Vespera'))
        v['hymn'] = hymn(base(major, f'Hymnus Day{0 if d in (0, 6) else d} Vespera'))
        if d == 0:
            v['responsory'] = responsory(base(major, 'Responsory Dominica Vespera'))
        elif d == 6:
            v['responsory'] = responsory(base(major, 'Responsory Feria Vespera', '(feria 7)'))
        else:
            v['responsory'] = responsory(base(major, 'Responsory Feria Vespera'))
        v['versicle'] = verse_pair(base(major, 'Feria Versum 3', '(feria 7)') if d == 6 else base(major, 'Dominica Versum 3'))
        v['canticleAnt'] = ant(base(pent2, 'Ant 3')) if d == 0 else ant(base(major, f'Feria{d + 1} Ant 3'))
        day['vespers'] = v
        out['days'].append(day)

    # Little hours
    for hour, name in (('tertia', 'Tertia'), ('sexta', 'Sexta'), ('nona', 'Nona')):
        h = {'hymn': hymn(base(minor, f'Hymnus {name}')), 'days': []}
        for d in range(7):
            pref = 'Dominica' if d == 0 else 'Feria'
            sect = lambda key: base(minor, key)
            # Wednesday/Thursday/Saturday share the ferial text for these hours
            chap = text_block(sect(f'{pref} {name}'))
            resp = responsory(sect(f'Responsory breve {pref} {name}'))
            vk = f'Versum {pref} {name}'
            if vk not in minor:
                vk = f'Versum Dominica {name}'  # ferial Sext/None share the Sunday versicle
            vers = verse_pair(sect(vk))
            e = pn[name][d]
            h['days'].append({'a': e['a'], 'psalms': e['ps'], 'chapter': chap, 'responsory': resp, 'versicle': vers})
        out['minor'][hour] = h
    # Compline
    c = {
        'hymn': hymn(base(minor, 'Hymnus Completorium')),
        'reading': text_block(base(minor, 'Lectio Completorium')),
        'chapter': text_block(base(minor, 'Completorium')),
        'responsory': responsory(base(minor, 'Responsory Completorium')),
        'versicle': verse_pair(base(minor, 'Versum 4')),
        'canticleAnt': ant(base(minor, 'Ant 4')),
        'collect': text_block(base(prayers, 'Oratio Visita'))['text'],
        'days': [{'a': pn['Completorium'][d]['a'], 'psalms': pn['Completorium'][d]['ps']} for d in range(7)],
    }
    out['compline'] = c
    out['canticles'] = {k: psalm_text(n) for k, n in (('benedictus', 231), ('magnificat', 232), ('nunc', 233))}
    out['canticles'] = {k: [v[2] for v in val['verses']] for k, val in out['canticles'].items()}
    out['psalms'] = used
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('psalms', len(used), 'bytes', os.path.getsize(OUT))


main()
