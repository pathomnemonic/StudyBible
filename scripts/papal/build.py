#!/usr/bin/env python3
"""Builds public/data/papal/index.json: a catalogue of papal writings (encyclicals, apostolic exhortations, constitutions and letters,
motu proprio, bulls, briefs and letters) from the index pages on vatican.va. Only titles, dates and links are stored; the texts stay at the Vatican's site."""
import re, json, os, sys, urllib.request, html as H
from concurrent.futures import ThreadPoolExecutor
BASE = 'https://www.vatican.va'
POPES = [('leo-xiii', 'Leo XIII', '1878–1903'), ('pius-x', 'Pius X', '1903–1914'), ('benedict-xv', 'Benedict XV', '1914–1922'), ('pius-xi', 'Pius XI', '1922–1939'),
         ('pius-xii', 'Pius XII', '1939–1958'), ('john-xxiii', 'John XXIII', '1958–1963'), ('paul-vi', 'Paul VI', '1963–1978'), ('john-paul-i', 'John Paul I', '1978'),
         ('john-paul-ii', 'John Paul II', '1978–2005'), ('benedict-xvi', 'Benedict XVI', '2005–2013'), ('francesco', 'Francis', '2013–2025'), ('leo-xiv', 'Leo XIV', '2025–')]
TYPES = {'encyclicals': 'Encyclical', 'apost_exhortations': 'Apostolic exhortation', 'apost_constitutions': 'Apostolic constitution', 'apost-constitutions': 'Apostolic constitution',
         'apost_letters': 'Apostolic letter', 'motu_proprio': 'Motu proprio', 'bulls': 'Bull', 'briefs': 'Brief', 'letters': 'Letter'}
def get(u):
    for _ in range(3):
        try:
            return urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=40).read().decode('utf-8', 'ignore')
        except Exception:
            pass
    return ''
def crawl(pope, tkey):
    root = f'/content/{pope}/en/{tkey}.index.html'
    seen, queue, docs = set(), [root], {}
    while queue:
        u = queue.pop()
        if u in seen: continue
        seen.add(u)
        h = get(BASE + u)
        for href, inner in re.findall(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', h, re.S):
            text = H.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', inner))).strip()
            if href.endswith('.index.html') and f'/{pope}/en/' in href and (f'/{tkey}/' in href or href.split('/')[-1].replace('.index.html', '').isdigit() and tkey in u) and href not in seen:
                queue.append(href)
            m = re.match(rf'^/content/{pope}/(en|la|it|fr|es|de|pt)/{tkey}/(?:\d{{4}}/)?documents/[^"]+\.html$', href)
            if m and text not in ('EN', 'LA', 'IT', 'FR', 'ES', 'DE', 'PT', 'ENG', ''):
                key = href.split('/')[-1]
                if key not in docs or m.group(1) == 'en': docs[key] = (text, href, m.group(1))
            elif m and text in ('EN', 'LA') and href.split('/')[-1] in docs and m.group(1) == 'en':
                t, _, _ = docs[href.split('/')[-1]]; docs[href.split('/')[-1]] = (t, href, 'en')
    return docs
def split(title):
    m = re.match(r'^(.*?)\s*\(([^()]*\d{4}[^()]*)\)\s*$', title)
    return (m.group(1).strip(), m.group(2).strip()) if m else (title.strip(), '')
def work(a):
    pope, tkey = a
    return pope, tkey, crawl(pope, tkey)
def pius_ix():
    """The Vatican site keeps Pius IX's documents in one flat list, mostly in Latin and Italian."""
    h = get(BASE + '/content/pius-ix/en.html')
    kinds = {'enciclica': 'Encyclical', 'encyclica': 'Encyclical', 'epistola': 'Encyclical letter', 'litterae': 'Apostolic letter', 'allocuzione': 'Allocution', 'allocutio': 'Allocution',
             'breve': 'Brief', 'bolla': 'Bull', 'bulla': 'Bull', 'constitutio': 'Apostolic constitution', 'costituzione': 'Apostolic constitution'}
    best = {}
    for href in re.findall(r'href="(/content/pius-ix/(?:en|la|it)/documents/[^"]+\.html)"', h):
        key = href.split('/documents/')[1]
        if key not in best or '/la/' in href or '/en/' in href: best[key] = href
    out = []
    for key, href in best.items():
        slug = key[:-5]
        first = slug.split('-')[0]
        if first not in kinds and not re.match(r'^\d{8}$', first): continue
        m = re.search(r'(\d{4})$', slug)
        body = re.sub(r'-\d{1,2}-[a-z]+-\d{4}$', '', slug)
        body = re.sub(r'^(epistola-encyclica|litterae-apostolicae|constitutio-dogmatica|constitutio-apostolica|breve|bolla|bulla|allocuzione|allocutio|enciclica|encyclica|costituzione-apostolica|\d{8}-costituzione-apostolica)-?', '', body)
        title = body.replace('-', ' ').strip().title() or slug
        out.append(dict(t=kinds.get(first, 'Apostolic constitution'), title=title, date=m.group(1) if m else '', url=BASE + href, lang=href.split('/')[3]))
    return out

if __name__ == '__main__':
    only = sys.argv[1:]
    jobs = [(p[0], t) for p in POPES for t in TYPES if not only or p[0] in only]
    out = {p[0]: dict(id=p[0], name=p[1], years=p[2], docs=[]) for p in POPES}
    with ThreadPoolExecutor(8) as ex:
        for pope, tkey, docs in ex.map(work, jobs):
            for key, (title, href, lang) in docs.items():
                t, d = split(title)
                out[pope]['docs'].append(dict(t=TYPES[tkey], title=t, date=d, url=BASE + href, lang=lang))
            print(pope, tkey, len(docs), flush=True)
    out['pius-ix'] = dict(id='pius-ix', name='Pius IX', years='1846–1878', docs=pius_ix())
    for p in out.values():
        seen = set(); lst = []
        for d in p['docs']:
            if d['url'] in seen: continue
            seen.add(d['url']); lst.append(d)
        p['docs'] = lst
    dest = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'data', 'papal')
    os.makedirs(dest, exist_ok=True)
    order = ['pius-ix'] + [p[0] for p in POPES]
    json.dump([out[k] for k in order], open(os.path.join(dest, 'index.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    print('total', sum(len(p['docs']) for p in out.values()))
