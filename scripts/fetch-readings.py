#!/usr/bin/env python3
"""Collects the *references* of the daily Mass readings (e.g. "Ephesians 2:12-22") from the USCCB daily readings pages.
Only the reference strings are kept (facts); no Lectionary text is stored. One request per day, spaced out, with a User-Agent that
names the project. Output: data/raw/usccb/<YYYY-MM-DD>.json (cached, so re-runs only fetch what is missing)."""
import datetime, json, os, re, sys, time, urllib.request, html
OUT = 'data/raw/usccb'
UA = 'StudyBibleApp/1.0 (+https://github.com/pathomnemonic/StudyBible; reference-list build, 1 request per second)'
def fetch(d):
    url = f"https://bible.usccb.org/bible/readings/{d.strftime('%m%d%y')}.cfm"
    for i in range(4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            return urllib.request.urlopen(req, timeout=30).read().decode('utf8', 'replace')
        except Exception as e:
            time.sleep(3 + 3 * i)
    return None
def parse(h):
    out = []
    # each reading block: a name (h3.name) followed by one or more address divs
    for m in re.finditer(r'<h3 class="name">(.*?)</h3>([\s\S]*?)(?=<h3 class="name">|</article>|<div class="footer)', h):
        name = html.unescape(re.sub('<[^>]+>', '', m.group(1))).strip()
        addrs = [re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', '', a))).strip() for a in re.findall(r'<div class="address">([\s\S]*?)</div>', m.group(2))]
        addrs = [a.replace('\xa0', ' ') for a in addrs if a]
        if name and addrs: out.append({'slot': name, 'refs': addrs})
    title = re.search(r'<title>(.*?)</title>', h, re.S)
    return {'title': html.unescape(re.sub(r'\s+', ' ', title.group(1))).strip() if title else '', 'readings': out}
def main(a, b):
    d = datetime.date.fromisoformat(a); end = datetime.date.fromisoformat(b)
    os.makedirs(OUT, exist_ok=True)
    while d <= end:
        f = f'{OUT}/{d.isoformat()}.json'
        if not os.path.exists(f):
            h = fetch(d)
            if h:
                j = parse(h); j['date'] = d.isoformat()
                json.dump(j, open(f, 'w'), ensure_ascii=False)
            time.sleep(1.0)
        d += datetime.timedelta(days=1)
if __name__ == '__main__': main(sys.argv[1], sys.argv[2])
