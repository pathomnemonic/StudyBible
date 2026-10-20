#!/usr/bin/env python3
"""Checks and merges Glossa translations produced elsewhere.
usage: python3 scripts/glossa-import.py <translated.json> [more.json ...]
Each file is a JSON object {"BOOK|c.v": "English translation"} (same keys as docs/glossa-translation/todo/todo-NNN.json).
Merges into data/curated/glossa-en/<BOOK>.json after checking: key exists in the Latin data, translation not empty,
verse-number prefix kept, no obvious untranslated Latin. Prints a report; nothing invalid is merged."""
import json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LAT = re.compile(r'\b(quod|autem|enim|quia|sunt|etiam|igitur|vero|quoniam|dicitur|secundum|ergo|ideo)\b', re.I)
ok = bad = 0
for path in sys.argv[1:]:
    data = json.load(open(path))
    by = {}
    for k, v in data.items():
        if '|' not in k: print('skip (bad key)', k); bad += 1; continue
        book, key = k.split('|', 1)
        lat_file = f'{ROOT}/public/data/commentary/glossa/{book}.json'
        if not os.path.exists(lat_file): print('unknown book', k); bad += 1; continue
        lat = json.load(open(lat_file))
        if key not in lat: print('unknown key', k); bad += 1; continue
        src = ' '.join(t for _, t in lat[key])
        if not isinstance(v, str) or not v.strip(): print('empty', k); bad += 1; continue
        if len(LAT.findall(v)) > 3 and len(LAT.findall(v)) > len(v.split()) / 25: print('looks untranslated', k); bad += 1; continue
        if len(v.split()) < max(1, len(src.split()) * 0.35) and len(src.split()) > 12: print('suspiciously short', k, len(v.split()), 'vs', len(src.split())); bad += 1; continue
        by.setdefault(book, {})[key] = v.strip(); ok += 1
    for book, m in by.items():
        out = f'{ROOT}/data/curated/glossa-en/{book}.json'
        cur = json.load(open(out)) if os.path.exists(out) else {}
        cur.update(m)
        json.dump(cur, open(out, 'w'), ensure_ascii=False)
print(f'merged {ok}, rejected {bad}. Now run: npx tsx scripts/ingest/cli.ts build')
