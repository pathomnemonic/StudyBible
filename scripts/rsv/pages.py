"""Shared helpers: read the Ignatius RSV-2CE epub (OCR'd print scan) page by page."""
import re, html, zipfile, sys
EPUB = 'data/licensed/ignatius-rsv2ce.epub'
def pages():
    z = zipfile.ZipFile(EPUB)
    names = {int(m.group(1)): n for n in z.namelist() if (m := re.match(r'EPUB/page_(\d+)\.html$', n))}
    for k in sorted(names):
        s = z.read(names[k]).decode('utf8')
        m = re.search(r'<body>(.*)</body>', s, re.S)
        t = html.unescape(re.sub(r'<[^>]+>', ' ', m.group(1)))
        yield k, re.sub(r'\s+', ' ', t).strip()
