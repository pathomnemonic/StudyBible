"""Extract three early liturgies (James, Mark, Addai and Mari) from the public-domain Ante-Nicene Fathers vol. 7 (Coxe's translations, ThML from CCEL).
Run: python3 scripts/ingest/liturgies_anf.py /path/to/anf07.xml  -> public/data/liturgy/{james,mark,addai-mari}.json"""
import re, sys, json, html
src = open(sys.argv[1], encoding='utf-8').read()
WANT = {'xii.ii': ('james', 'The Divine Liturgy of St James'), 'xii.iii': ('mark', 'The Divine Liturgy of St Mark'), 'xii.iv': ('addai-mari', 'The Liturgy of the Holy Apostles Addai and Mari')}
def div(i):
    a = src.index(f'<div2 id="{i}"'); b = src.index('</div2>', a); return src[a:b]
def clean(x):
    x = re.sub(r'<note\b.*?</note>', '', x, flags=re.S)
    x = re.sub(r'<[^>]+>', '', x)
    return re.sub(r'\s+', ' ', html.unescape(x)).strip()
for i, (fid, title) in WANT.items():
    d = div(i)
    d = re.sub(r'<note\b.*?</note>', '', d, flags=re.S)
    blocks = []
    cur = None
    for m in re.finditer(r'<(h3|h4|p)\b([^>]*)>(.*?)</\1>', d, flags=re.S):
        tag, attrs, body = m.groups()
        t = clean(body)
        if not t or t.upper() == 'EARLY LITURGIES.': continue
        cls = re.search(r'class="([^"]+)"', attrs)
        cls = cls.group(1) if cls else ''
        head = tag in ('h3', 'h4') or cls.startswith('Heading')
        if head:
            sp = re.match(r'^(?:The )?(Priest|Deacons?|People|Choir|Reader|Bishop|Congregation)\.?:?$', t, re.I)
            if sp:
                cur = {'deacons': 'deacon', 'congregation': 'people'}.get(sp.group(1).lower(), sp.group(1).lower())
                continue
            cur = None
            blocks.append({'who': 'rubric', 't': t})
            continue
        t = re.sub(r'^(?:I(?= O )|II(?= Glory)|[IVXLC]{2,6}\.?(?=\s)|[IVXLC]+\.(?=\s))\s*', '', t)
        blocks.append({'who': cur or 'text', 't': t})
    json.dump({'title': title, 'source': 'Ante-Nicene Fathers, vol. 7 (1886), translated and edited by A. Cleveland Coxe; public domain', 'blocks': blocks}, open(f'public/data/liturgy/{fid}.json', 'w'), ensure_ascii=False, indent=0)
    print(fid, len(blocks), sum(len(b['t']) for b in blocks))
