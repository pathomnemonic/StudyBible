"""Turns HTML entities left in data text (&amp; &atilde; &mdash; &#038; ...) into the characters they stand for. Works on the raw JSON text so the
file layout is untouched. &lt; is left alone so decoded text can never become markup. Run from the repository root."""
import glob, html, json, re, sys

ENT = re.compile(r'&(?:#\d+|#[xX][0-9a-fA-F]+|[A-Za-z][A-Za-z0-9]{1,9});')
SKIP = {'&lt;', '&LT;', '&nbsp;', '&#160;'}   # nbsp becomes a plain space below

def fix(m):
    e = m.group(0)
    if e.lower() == '&lt;': return e
    if e in ('&nbsp;', '&#160;'): return ' '
    d = html.unescape(e)
    if d == e: return e                       # not a known entity
    if d == '"': return '\\"'
    if d == '\\': return '\\\\'
    if d in '\n\r\t': return ' '
    return d

total = 0
for f in glob.glob('public/data/**/*.json', recursive=True) + glob.glob('src/data/**/*.json', recursive=True):
    if 'manifest.json' in f: continue
    raw = open(f, encoding='utf-8').read()
    new, n = ENT.subn(fix, raw)
    if new != raw:
        try: json.loads(new)
        except Exception as ex: print('SKIPPED (would break JSON):', f, ex); continue
        open(f, 'w', encoding='utf-8').write(new); total += 1
        print(f, sum(1 for _ in ENT.finditer(raw)))
print('files changed', total)
