"""Builds the questions-about-the-faith data as a directory of resources written by Catholic authors (no answers are written here).
Sources: Catholic Answers' public sitemap (tracts, Q&A, magazine articles, videos, Bible Navigator pages and the Catholic Encyclopedia),
the checked video catalogue, and the links already reviewed in data/curated/external-resources.json.
Run resources.py first (python3 resources.py topics.json) to refresh candidates.json."""
import json, re, subprocess, sys, html
sys.path.insert(0, '.')
from kw import KW
import a7
ROOT = '/home/user/StudyBible/'
base = json.loads(subprocess.run(['git', 'show', 'HEAD~0:data/curated/apologetics.json'], cwd=ROOT, capture_output=True, text=True).stdout)
cats = base['categories'] + [c for c in dict.fromkeys(t['category'] for t in a7.NEW) if c not in base['categories']]
cat = {v['id']: v for v in json.load(open(ROOT + 'data/curated/videos.json'))['videos']}
SLUG = {'Catholic Productions': 'catholic-productions', 'St. Paul Center': 'st-paul-center', 'Jimmy Akin': 'jimmy-akin', 'Catholic Answers Live': 'catholic-answers', 'Bishop Robert Barron': 'word-on-fire', 'Augustine Institute': 'augustine-institute', 'EWTN': 'ewtn', 'The Thomistic Institute': 'thomistic-institute', 'Breaking In The Habit': 'breaking-in-the-habit', 'Matt Fradd': 'pints-with-aquinas', 'Godsplaining | Catholic Podcast': 'godsplaining', 'ACTS XXIX': 'acts-xxix', 'Shameless Popery': 'shameless-popery', 'The Catholic Talk Show': 'catholic-talk-show', 'CounselofTrent': 'trent-horn'}
cand = json.load(open('candidates.json'))
LIB = json.load(open(ROOT + 'public/data/media/video_library.json'))
tractpick = {}
nav = json.load(open('/tmp/claude-0/ca/nav.json'))
NAVMAP = {'abortion': 'abortion', 'anointing-of-the-sick': 'anointing-sick', 'apostolic-succession': 'apostolic-succession', 'assurance-of-salvation': 'once-saved', 'calling-priests-father': 'call-no-man-father', 'the-church-is-one': 'church-authority', 'confession': 'confession', 'confirmation': 'confirmation', 'contraception': 'contraception', 'divorce-and-remarriage': 'marriage-divorce', 'faith-and-works': 'faith-and-works', 'hell': 'hell', 'homosexuality': 'homosexuality', 'immortality-of-the-soul': 'immortality-of-the-soul', 'infallible-church': 'church-authority', 'infant-baptism': 'infant-baptism', 'intercession-of-the-saints': 'intercession-of-saints', 'mary,-mother-of-god': 'mary-mother-of-god', 'mary’s-immaculate-conception': 'immaculate-conception', 'priesthood': 'mass-sacrifice', 'purgatory': 'purgatory', 'relics': 'relics-and-sacramentals', 'statues': 'images', 'assumption-of-mary': 'assumption', "church's-teaching-authority": 'church-authority', 'divinity-of-christ': 'divinity-of-christ', 'necessity-of-baptism': 'baptismal-regeneration', 'unity-of-god': 'trinity', 'perpetual-virginity-of-mary': 'perpetual-virginity', 'primacy-of-peter': 'papacy', 'real-presence': 'real-presence', 'repetitious-prayer': 'rosary', 'trinity': 'trinity'}
BOOKFIX = {'Phil.': 'Philippians', 'Rev': 'Revelation'}
def navref(desc):
    r = desc.split(' - ', 1)[1]
    r = r.replace('–', '-').split(',')[0].strip()
    for a, b in BOOKFIX.items():
        if r.startswith(a + ' '): r = b + r[len(a):]
    return r
navs = {}
for o in nav:
    p = o['url'].split('/bible-navigator/')[1].split('/')
    if len(p) < 2 or p[0] not in NAVMAP: continue
    navs.setdefault(NAVMAP[p[0]], []).append(dict(ref=navref(o['desc']), title=o['desc'].replace('–', '-').replace(' - ', ': '), url=o['url']))
def tsrc(t): return t
topics = []
for t in base['topics']:
    t = dict(t); t.pop('answer', None)
    t['verses'] = [dict(ref=v['ref']) for v in t['verses']]
    topics.append(t)
for x in a7.NEW:
    if any(t['id'] == x['id'] for t in topics): continue
    topics.append(dict(id=x['id'], category=x['category'], title=x['title'], objection=x['objection'], verses=x['verses'], ccc=x['ccc'], tags=x['tags'], related=x['related'], reading=[], _tracts=x['tracts']))
byid = {t['id']: t for t in topics}
TITLE = {}
def pagetitle(u):
    import resources
    return resources.title(u)
ORDER = {'tract': 0, 'qa': 1, 'article': 2, 'video': 3, 'encyclopedia': 4, 'page': 5}
for t in topics:
    res = []
    seen = set()
    def add(**r):
        if r['url'] in seen or not r['title']: return
        seen.add(r['url']); res.append(r)
    for slug in t.pop('_tracts', []):
        u = f'https://www.catholic.com/tract/{slug}'
        add(title=pagetitle(u), url=u, source='catholic-answers', type='tract')
    for r in t.get('reading', []):
        add(**r)
    for r in cand.get(t['id'], []):
        add(title=r['title'], url=r['url'], source='encyclopedia' if r['type'] == 'encyclopedia' else 'catholic-answers', type=r['type'])
    for r in navs.get(t['id'], []):
        add(title='Bible Navigator: ' + r['title'], url=r['url'], source='catholic-answers', type='page')
        if not any(v['ref'] == r['ref'] for v in t['verses']): t['verses'].append(dict(ref=r['ref']))
    # videos from the checked catalogue whose titles match the question
    keys = [k.replace('-', ' ') for k in KW.get(t['id'], '').split(',')[:5]]
    nvid = sum(1 for r in res if r['type'] == 'video')
    for vid, v in cat.items():
        if nvid >= 6: break
        ti = v['title'].lower()
        if any(k and re.search(r'\b' + re.escape(k) + r'\b', ti) for k in keys) and v.get('channel') in SLUG:
            u = 'https://www.youtube.com/watch?v=' + vid
            if u in seen: continue
            add(title=v['title'], url=u, source=SLUG[v['channel']], type='video'); nvid += 1
    # more videos from the whole channel library, by words in the title
    LIBSLUG = {'Catholic Productions': 'catholic-productions', 'St. Paul Center': 'st-paul-center', 'Jimmy Akin': 'jimmy-akin', 'Catholic Answers Live': 'catholic-answers', 'Bishop Robert Barron': 'word-on-fire', 'Augustine Institute': 'augustine-institute', 'The Thomistic Institute': 'thomistic-institute', 'Breaking In The Habit': 'breaking-in-the-habit', 'Pints with Aquinas (Matt Fradd)': 'pints-with-aquinas', 'Godsplaining | Catholic Podcast': 'godsplaining', 'Shameless Popery': 'shameless-popery', 'The Counsel of Trent (Trent Horn)': 'trent-horn', 'The Counsel of Trent': 'trent-horn', 'ACTS XXIX': 'acts-xxix', 'Ascension Presents': 'ascension', 'Magis Center': 'magis-center', 'The Catholic Talk Show': 'catholic-talk-show', 'The Cordial Catholic': 'cordial-catholic'}
    pri = ['trent-horn', 'catholic-answers', 'catholic-productions', 'jimmy-akin', 'st-paul-center', 'shameless-popery', 'word-on-fire']
    hits = []
    for vid, ti, ci in LIB['videos']:
        src = LIBSLUG.get(LIB['channels'][ci])
        if not src: continue
        tl = ti.lower()
        if any(k and re.search(r'\b' + re.escape(k) + r'\b', tl) for k in keys[:4]):
            hits.append((pri.index(src) if src in pri else 9, vid, ti, src))
    hits.sort()
    per = {}
    titles_seen = {r['title'] for r in res}
    for _, vid, ti, src in hits:
        if nvid >= 14: break
        u = 'https://www.youtube.com/watch?v=' + vid
        if u in seen or ti in titles_seen or per.get(src, 0) >= 3 or re.search(r'reaction|reacts|my take|\bbros\b|fr\. martin|casey cole', ti, re.I): continue
        per[src] = per.get(src, 0) + 1; titles_seen.add(ti)
        add(title=ti, url=u, source=src, type='video'); nvid += 1
    res.sort(key=lambda r: ORDER.get(r['type'], 9))
    t['reading'] = res[:32]
ids = {t['id'] for t in topics}
for t in topics:
    t['related'] = [r for r in t['related'] if r in ids]
out = {'_about': 'Questions Catholics are asked about the faith, each linked to what Catholic authors and teachers have written or said: tracts, articles, Q&As, videos and the Bible passages and Catechism paragraphs involved. The app does not write the answers.', 'categories': cats, 'topics': topics}
json.dump(out, open(ROOT + 'data/curated/apologetics.json', 'w'), ensure_ascii=False, indent=1)
json.dump(out, open(ROOT + 'public/data/apologetics.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(topics), 'topics;', sum(len(t['reading']) for t in topics), 'resources')
