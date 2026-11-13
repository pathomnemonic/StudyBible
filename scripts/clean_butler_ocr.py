"""Cleans the scanned (OCR) months of Butler's Lives of the Saints: removes paragraphs that are only OCR noise or footnote debris,
and corrects a short list of unambiguous OCR misreadings. Run from the repository root; it rewrites public/data/saints/butler/{04,05,06,08..12}.json
and prints what it changed. Words are only changed when the misreading is not itself an English word that could be meant."""
import json, re, sys, pickle

MONTHS = ['04', '05', '06', '08', '09', '10', '11', '12']
FIX = {'bis': 'his', 'thai': 'that', 'tbe': 'the', 'tne': 'the', 'tiie': 'the', 'thej': 'they', 'tht': 'the', 'hia': 'his', 'waa': 'was',
       'boman': 'Roman', 'modem': 'modern', 'grod': 'God', 'tins': 'this', 'tha': 'the', 'thi': 'the', 'wilh': 'with', 'whicb': 'which', 'tbat': 'that',
       'tbis': 'this', 'bnt': 'but', 'aud': 'and', 'ihe': 'the', 'ot': 'of'}
JUNK_CHARS = re.compile(r'[\^™~{}|\\<>]')
WORD = re.compile(r"[A-Za-z]+")

def fix_words(p):
    def sub(m):
        w = m.group(0)
        lo = w.lower()
        if lo in FIX and not (lo == 'ot' and w != 'ot'):
            r = FIX[lo]
            if w.isupper() and len(w) > 1: return r.upper()
            if w[0].isupper(): return r[0].upper() + r[1:]
            return r
        return w
    return WORD.sub(sub, p)

def tidy(p):
    """removes stray scanner marks and the leading footnote bullet"""
    p = JUNK_CHARS.sub('', p)
    p = re.sub(r'^[\s»«•*]+', '', p)
    return re.sub(r'\s{2,}', ' ', p).strip()

def prose_part(p, good):
    """the sentences of a damaged paragraph that read as ordinary prose (citations and scanner debris cut away), or '' when none do"""
    keep = []
    p = re.sub(r'\b(St|Sts|SS|Bl|Dr|Mr|Mrs|Jr)\.\s', lambda m: m.group(1) + '\u2024 ', p)   # abbreviations are not sentence ends
    for seg in re.split(r'(?<=[.;:!?])\s+|\*\s*|\(\d+\)', p):
        seg = seg.strip(' ,').replace('\u2024', '.')
        w = [x.lower() for x in WORD.findall(seg) if len(x) > 2]
        if len(w) < 8: continue
        if sum(c.isalpha() for c in seg) / len(seg) < 0.78: continue
        if sum(1 for x in w if x not in good) / len(w) > 0.35: continue
        keep.append(seg)
    return ' '.join(keep)

def is_junk(p, good):
    s = p.strip()
    if not s: return True
    letters = sum(c.isalpha() for c in s)
    ratio = letters / max(1, len(s))
    if len(s) > 12 and (ratio < 0.4 or (ratio < 0.6 and len(s) < 300)): return True     # citations and numerals; a long paragraph that mixes prose with a citation is kept
    w = [x.lower() for x in WORD.findall(s) if len(x) > 2]
    if len(w) < 6 and len(s) < 60: return True                  # a fragment
    if len(w) >= 6 and sum(1 for x in w if x not in good) / len(w) > 0.6: return True
    return False

def main():
    good = pickle.load(open('/tmp/vocab.pkl', 'rb'))
    dropped = changed = 0
    for m in MONTHS:
        path = f'public/data/saints/butler/{m}.json'
        d = json.load(open(path))
        for day, es in d['days'].items():
            for e in es:
                out = []
                for p in e['text']:
                    p = tidy(p)
                    if is_junk(p, good):
                        p = prose_part(p, good)
                        if not p: dropped += 1; continue
                    q = fix_words(p)
                    if q != p: changed += 1
                    out.append(q)
                e['text'] = out
            d['days'][day] = [e for e in es if e['text']]
        json.dump(d, open(path, 'w'), ensure_ascii=False, indent=1)
    print('paragraphs dropped', dropped, 'paragraphs corrected', changed)

main()
