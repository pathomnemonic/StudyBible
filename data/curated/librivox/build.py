"""Recorded readings (LibriVox, public domain) for the Bible and for works in the library.
Each recording is listed with its own files; nothing is cut or timed, so a recording always starts at the beginning of the file shown.
Run: python3 data/curated/librivox/build.py  (needs network; writes public/data/media/librivox.json)"""
import json, subprocess, re, sys
ROOT = '/home/user/StudyBible/'
# library work id -> LibriVox book ids (each checked by hand against the work's title and author)
WORKS = {
 'aug-confessions': [754, 2601], 'aug-city-of-god': [1691], 'aug-christian-doctrine': [13724], 'aug-harmony': [20627],
 'aug-psalms': [15224, 15690, 15940, 17079, 18112, 19717], 'aug-doctrinal': [1047], 'aug-pelagian': [17833, 17975, 18156],
 'aug-moral': [12977, 16826, 21362, 18000],
 'teresa-castle': [3094], 'teresa-life': [3476], 'kempis-imitation': [575], 'julian-revelations': [1185],
 'desales-devout-life': [11500], 'ignatius-exercises': [10510], 'therese-story-of-a-soul': [3229], 'lawrence-practice': [564, 8522],
 'athanasius-incarnation': [17949], 'athanasius-arians': [9212], 'irenaeus-heresies': [3225], 'irenaeus-demonstration': [17209],
 'ignatius-letters': [2279], 'clement-alex': [15740], 'tertullian-apologetic': [15897], 'cassian-works': [16398],
 'basil-works': [5497, 19556], 'jerome-treatises': [15121], 'jerome-lives': [15382], 'jerome-letters': [17634],
 'john-damascus': [6877], 'justin-martyr': [2559, 3728, 22548], 'anselm-basic-works': [20108], 'vincent-commonitory': [18141],
 'ambrose-works': [932, 899, 16753], 'leo-xiii-encyclicals': [8802, 13969], 'pascendi-dominici-gregis': [14816],
 'chrys-gal': [5354], 'chrys-titus': [15071], 'chrys-1tim': [15093], 'chrys-2tim': [15191], 'chrys-eph': [15414], 'chrys-phil': [15459],
 'chrys-col': [15506], 'chrys-1cor': [15877, 19347], 'chrys-hebrews': [16481], 'chrys-2cor': [20156], 'chrys-romans': [20169],
 'chrys-john': [21762, 21788], 'chrys-matthew': [7960, 8435, 9306, 9911, 10399], 'chrys-minor': [15129, 19225],
 'edersheim-temple': [19188], 'lactantius': [22928],
 'aquinas-summa': [2443, 2502, 3204, 6232, 8490, 8847, 9608, 9616, 9617, 9621, 9618, 9619, 10703, 14420],
}
BIBLE = {'dra': 18352, 'webc': 21093}
def get(i):
    r = subprocess.run(['curl', '-s', '-m', '60', f'https://librivox.org/api/feed/audiobooks?id={i}&format=json&extended=1'], capture_output=True, text=True).stdout
    return json.loads(r)['books'][0]
def pack(i):
    b = get(i)
    readers = []
    for s in b['sections']:
        for r in s.get('readers', []):
            if r['display_name'] not in readers: readers.append(r['display_name'])
    return {'id': str(i), 'title': b['title'], 'reader': ', '.join(readers[:3]) + (' and others' if len(readers) > 3 else ''), 'page': b['url_librivox'], 'total': b['totaltime'],
            'parts': [[s['title'].strip(), s['listen_url'].replace('http:', 'https:'), int(s['playtime'])] for s in b['sections'] if s.get('listen_url')]}
out = {'about': 'Recordings made by LibriVox volunteers and dedicated to the public domain. Audio is streamed from archive.org; each recording starts at the beginning of the part you choose.', 'works': {}, 'bible': {}}
for w, ids in WORKS.items():
    out['works'][w] = [p for p in (pack(i) for i in ids) if p['parts']]; print(w, [len(p['parts']) for p in out['works'][w]])
for k, i in BIBLE.items():
    out['bible'][k] = pack(i); print(k, len(out['bible'][k]['parts']))
json.dump(out, open(ROOT + 'public/data/media/librivox.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('bytes', len(json.dumps(out)))
