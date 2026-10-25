"""Collect human-written Catholic resources for each question from Catholic Answers' public sitemap (tracts, Q&A, magazine articles,
videos, Bible Navigator pages) and the Catholic Encyclopedia, matched by the topic's keywords. Titles are read from the pages themselves.
Output: candidates.json (reviewed by hand, then merged by build3.py)."""
import json, re, subprocess, concurrent.futures as cf, os, sys
ROOT = '/home/user/StudyBible/'
CACHE = '/tmp/claude-0/ca/'
os.makedirs(CACHE, exist_ok=True)
def sitemap():
    p = CACHE + 'urls.json'
    if not os.path.exists(p):
        x = subprocess.run(['curl', '-s', '-m', '90', '-L', 'https://www.catholic.com/sitemap.xml', '-A', 'Mozilla/5.0'], capture_output=True, text=True).stdout
        json.dump(re.findall(r'<loc>(.*?)</loc>', x), open(p, 'w'))
    return json.load(open(p))
GENERIC = {'mary', 'church', 'life', 'god', 'jesus', 'prayer', 'catholic', 'christ', 'bible', 'scripture', 'faith', 'saints', 'holy', 'spirit', 'world', 'evil', 'signs', 'father', 'titles', 'money', 'women', 'poor', 'angels', 'history', 'human', 'dignity', 'love', 'sin', 'good', 'end', 'time', 'out', 'new', 'days'}
STOP = {'the', 'of', 'and', 'a', 'an', 'to', 'in', 'is', 'on', 'for', 'or', 'your', 'why', 'what', 'how', 'do', 'does', 'did', 'can', 'we', 'are', 'was', 'it', 'its', 'with', 'be', 'at', 'as', 'no', 'not', 'by', 'who'}
def slugof(u): return u.rstrip('/').split('/')[-1].lower()
def phrases(t):
    out = {}
    for tag in t['tags']:
        w = [x for x in re.findall(r"[a-z0-9]+", tag.lower().replace('’', '').replace("'", '')) if x not in STOP]
        if not w: continue
        key = '-'.join(w)
        out[key] = 2.0 if len(w) > 1 else (0.4 if w[0] in GENERIC else 1.2)
        if len(w) > 1:
            for x in w:
                if x not in GENERIC and len(x) > 3: out.setdefault(x, 0.5)
    try:
        from kw import KW
        import a7  # registers the keywords of the later questions
        if t['id'] in KW:
            out = {}   # curated keywords replace the tag guesses
            for i, k in enumerate(KW[t['id']].split(',')): out[k.strip()] = 3.0 if i < 4 else 1.6
    except ImportError: pass
    return out
def score(slug, ph):
    words = slug.split('-')
    s = 0.0
    for k, wgt in ph.items():
        ks = k.split('-')
        n = len(ks)
        if any(words[i:i + n] == ks for i in range(len(words) - n + 1)): s += wgt
        elif n == 1 and any(w.startswith(k) and len(k) > 4 for w in words): s += wgt * 0.8
    return s
TYPES = [('tract', 'tract', 2), ('qa', 'qa', 5), ('magazine', 'article', 3), ('video', 'video', 2), ('encyclopedia', 'encyclopedia', 1)]
def pick(topic, urls):
    ph = phrases(topic)
    res = []
    for seg, typ, n in TYPES:
        c = []
        for u in urls:
            if f'/{seg}/' not in u: continue
            s = score(slugof(u), ph)
            if s >= 3.0: c.append((s, u))
        c.sort(key=lambda x: (-x[0], len(x[1])))
        res += [(typ, u, round(s, 1)) for s, u in c[:n]]
    return res
DENY = re.compile(r"canon law|conclave|nonbelievers|love my job|atheism's relics|islam and (communism|sex)|hitler|celiac|earbuds|tabernacle key|cassiel|navel|raiders|trump|baha|malachy|\bpets\b|on a plane|nurses|wishing|church statues with|wearing the one ring|pope francis the antichrist|is pope francis|heaven scent|sister hell|evolution of the gospels|i am catholic|why i am a catholic|hail mary, conceived|rosary dissected|24-hour|51 beads|seven dolors|dominican rosary|anthony of the mother|episcopal gloves|charismatic episcopal|rite of episcopal|stefano borgia|muslim re-conquest|prophesy the trump|messianic jewish|wifely|aliens|angels go rogue|race with the devil|what the devil|the devil you say|atheist spouse|near-death|how a protestant might|information on atheism|can an atheist|overpopulation|good chastity resources|gluten|should i attend this infant|1 and 2 maccabees|which are the days|vaccin|halloween|joshua by fr|novel|genetically|poor man's psalter|talmud|reverse transub|souls and angels|deuteronomy and the apocrypha|moses wrote|pope's love|medjugorje|^psalm 51$|washes? his hands|patripassian|is modernism|universal salvation|tyndale|silent heresy|purity culture|can jews|agnostics|trick or treat is|dispensed mass|john the deacon|a deacon (may|forever|says)|why a deacon", re.I)
def title(u):
    cp = CACHE + 'title-' + re.sub(r'\W+', '_', u)[-150:]
    if os.path.exists(cp): return open(cp).read()
    h = subprocess.run(['curl', '-s', '-m', '40', '-L', u, '-A', 'Mozilla/5.0', '-r', '0-60000'], capture_output=True).stdout.decode('utf-8','ignore')
    m = re.search(r'<meta property="og:title" content="([^"]+)"', h) or re.search(r'<title>([^<]+)</title>', h)
    t = (m.group(1) if m else '').strip()
    t = re.sub(r'\s*[|–-]\s*Catholic Answers.*$', '', t)
    import html; t = html.unescape(t)
    open(cp, 'w').write(t)
    return t
if __name__ == '__main__':
    urls = sitemap()
    sys.path.insert(0, '.')
    topics = json.load(open(sys.argv[1]))
    out = {}
    jobs = {}
    for t in topics:
        jobs[t['id']] = pick(t, urls)
    allu = sorted({u for v in jobs.values() for _, u, _ in v})
    with cf.ThreadPoolExecutor(16) as ex: titles = dict(zip(allu, ex.map(title, allu)))
    for k, v in jobs.items(): out[k] = [dict(type=t, url=u, title=titles[u], score=s) for t, u, s in v if not DENY.search(titles[u])]
    json.dump(out, open('candidates.json', 'w'), ensure_ascii=False, indent=1)
    print(len(allu), 'pages')
