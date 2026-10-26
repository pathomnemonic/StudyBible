"""Builds a bank of live-quiz questions for every lesson from the lesson's own authored material and the Catechism text.

Questions are made from: the lesson's main idea (true), the common misunderstandings teachers listen for (false), vocabulary
definitions, a sentence of the Catechism with a key word removed, the saint linked to the lesson, and the Scripture passage.
Wrong answers are taken from neighbouring lessons of the same grade, so they sound plausible. Output: public/data/curriculum/questions/<grade>.json
Run: python3 data/curated/curriculum/questions.py
"""
import glob, json, os, random, re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT = os.path.join(ROOT, 'public/data/curriculum/questions')
os.makedirs(OUT, exist_ok=True)
GL = json.load(open(os.path.join(ROOT, 'public/data/curriculum/glossary.json')))
CCC = {}
for f in glob.glob(os.path.join(ROOT, 'public/data/ccc/p*.json')):
    for p in json.load(open(f)):
        CCC[p['n']] = p['t']

def ccc_list(spec):
    out = []
    for part in spec.split(','):
        part = part.strip()
        if not part: continue
        a, _, b = part.partition('-')
        try:
            a = int(a); b = int(b) if b else a
        except ValueError:
            continue
        out.extend(range(a, b + 1))
    return out

STOP = set('which their there about these those would should could other being because through between without within every thing things people person'.split())
def strip_q(s):
    return re.sub(r'^[“"\'‘]+|[”"\'’]+$', '', s.strip()).strip()
def sentence_case(s):
    s = s.strip()
    return s if not s else s[0].upper() + s[1:]
def end(s):
    s = s.strip()
    return s if s[-1:] in '.?!”"' else s + '.'
def shortstmt(s, n=230):
    s = end(strip_q(s))
    return s if len(s) <= n else None

def time_for(level, text_len):
    base = 15 if level == 1 else 20 if level == 2 else 25
    return min(60, base + text_len // 60 * 5)

class Maker:
    def __init__(self, grade, band):
        self.grade, self.band = grade, band
        self.lessons = [(u, l) for u in grade['units'] for l in u['lessons']]
        self.ideas = {l['id']: l['idea'] for _, l in self.lessons}
        self.misc_all = [(l['id'], strip_q(m)) for _, l in self.lessons for m in l.get('misc', []) if len(strip_q(m)) > 12]
        self.saints = {}
        for _, l in self.lessons:
            if l.get('saint') and ':' in l['saint']:
                n, how = l['saint'].split(':', 1)
                self.saints[l['id']] = (n.strip(), how.strip())
        self.words = sorted({GL[v]['w'] for _, l in self.lessons for v in l['vocab'] if v in GL and ' ' not in GL[v]['w'] and len(GL[v]['w']) >= 5})

    def mc(self, rng, q, right, wrong, why, level, kind, points=1, extra_time=0):
        wrong = [w for i, w in enumerate(wrong) if w and w != right and w not in wrong[:i]][:3]
        if len(wrong) < 3: return None
        opts = wrong + [right]
        rng.shuffle(opts)
        return {'type': 'mc', 'q': q, 'options': opts, 'correct': [opts.index(right)], 'time': time_for(level, len(q) + sum(len(o) for o in opts) // 2) + extra_time, 'points': points, 'why': why, 'level': level, 'kind': kind}

    def for_lesson(self, u, l):
        rng = random.Random(l['id'])
        lv = {'primary': 1, 'elementary': 1, 'middle': 2, 'high': 3, 'adult': 3}[self.band]
        hard = lv >= 2
        out = []
        sibs = [x for _, x in self.lessons if x['id'] != l['id']]
        unit_sibs = [x for x in u['lessons'] if x['id'] != l['id']]
        near = unit_sibs if len(unit_sibs) >= 3 else sibs
        idea = shortstmt(l['idea'])
        misc_own = [strip_q(m) for m in l.get('misc', []) if 12 < len(strip_q(m)) < 220]
        misc_other = [m for i, m in self.misc_all if i != l['id'] and 12 < len(m) < 220]
        title = l['title']
        # 1. which statement is true: the lesson's idea against misunderstandings from other lessons
        if idea and len(misc_other) >= 3:
            q = self.mc(rng, f'Which statement is TRUE? (Lesson: {title})', idea, [end(m) for m in rng.sample(misc_other, 3)], f'The Church teaches: {idea}', lv, 'true')
            if q: out.append(q)
        # 2. which is a misunderstanding: one of this lesson's misconceptions against true ideas from neighbours
        if misc_own:
            trues = [shortstmt(x['idea']) for x in near]
            trues = [t for t in trues if t]
            if len(trues) >= 3:
                bad = end(rng.choice(misc_own))
                q = self.mc(rng, f'Which of these is a MISTAKEN idea about “{title}”?', bad, rng.sample(trues, 3), f'This is a common misunderstanding. {idea or ""}', lv, 'mistaken', points=2 if hard else 1)
                if q: out.append(q)
        # 3. true or false
        if misc_own and hard:
            out.append({'type': 'tf', 'q': f'True or false: {end(rng.choice(misc_own))}', 'options': ['True', 'False'], 'correct': [1], 'time': 15, 'points': 1, 'why': f'False. {idea or ""}', 'level': lv, 'kind': 'tf'})
        if idea:
            out.append({'type': 'tf', 'q': f'True or false: {idea}', 'options': ['True', 'False'], 'correct': [0], 'time': 15, 'points': 1, 'why': 'True.', 'level': 1, 'kind': 'tf'})
        # 4. select all that apply
        pool_true = [t for t in [idea] + [shortstmt(t) for t in l.get('teach', []) if 25 < len(t) < 200 and 'CCC' not in t and 'Present' not in t] if t]
        if hard and len(pool_true) >= 2 and len(misc_other) >= 2:
            tr = rng.sample(pool_true, 2); fa = [end(m) for m in rng.sample(misc_other, 2)]
            opts = tr + fa; rng.shuffle(opts)
            out.append({'type': 'multi', 'q': f'Select ALL the statements that fit the lesson “{title}”.', 'options': opts, 'correct': sorted(opts.index(t) for t in tr), 'time': 35, 'points': 2, 'why': 'The other two are common misunderstandings from other lessons.', 'level': 3, 'kind': 'multi'})
        # 5. vocabulary, both directions, with neighbours' words as wrong answers
        own = [v for v in l['vocab'] if v in GL]
        near_words = [GL[v] for x in near for v in x['vocab'] if v in GL]
        for v in own[:2]:
            d, w = GL[v]['d'], GL[v]['w']
            wrongs = [g['w'] for g in near_words if g['w'] != w]
            wrongs = list(dict.fromkeys(wrongs))
            if len(wrongs) >= 3:
                q = self.mc(rng, f'Which word fits? “{d}”', w, rng.sample(wrongs, 3), f'{w}: {d}', lv, 'vocab')
                if q: out.append(q)
            wd = list(dict.fromkeys(g['d'] for g in near_words if g['w'] != w))
            if hard and len(wd) >= 3:
                q = self.mc(rng, f'What does “{w}” mean?', d, rng.sample(wd, 3), f'{w}: {d}', lv, 'meaning')
                if q: out.append(q)
        # 6. a sentence of the Catechism with a key word removed
        keys = {GL[v]['w'].lower(): GL[v]['w'] for v in own if ' ' not in GL[v]['w']}
        for n in ccc_list(l['ccc']):
            t = CCC.get(n)
            if not t: continue
            done = False
            for s in re.split(r'(?<=[.;:])\s+', t):
                if not (60 <= len(s) <= 230): continue
                m = None
                for w in re.findall(r"[A-Za-z]{6,}", s):
                    if w.lower() in STOP: continue
                    if w.lower() in keys or w.lower() in {x.lower() for x in self.words}:
                        m = w; break
                if not m: continue
                blank = s.replace(m, '_____', 1)
                wrongs = [w for w in self.words if w.lower() != m.lower()]
                if len(wrongs) < 3: continue
                cap = m[0].isupper() and not s.startswith(m)
                wr = rng.sample(wrongs, 3)
                if m.islower(): wr = [x.lower() for x in wr]
                q = self.mc(rng, f'Catechism {n}: “{blank}”', m, wr, f'CCC {n}: “{s}”', lv, 'ccc', points=2 if hard else 1)
                if q and len(wr) == 3:
                    out.append(q)
                    if lv == 3:
                        out.append({'type': 'text', 'q': f'Type the missing word. Catechism {n}: “{blank}”', 'correct': [m], 'time': 40, 'points': 2, 'why': f'CCC {n}: “{s}”', 'level': 3, 'kind': 'cloze'})
                    done = True
                    break
            if done: break
        # 7. the saint
        if l['id'] in self.saints:
            name, how = self.saints[l['id']]
            others = list(dict.fromkeys(n for i, (n, _) in self.saints.items() if i != l['id'] and n != name))
            how = how.rstrip('.')
            if len(others) >= 3:
                q = self.mc(rng, f'Who is this saint, who lived what “{title}” teaches? “{how[0].upper() + how[1:]}.”', name, rng.sample(others, 3), f'{name}: {how}.', lv, 'saint')
                if q: out.append(q)
        # 8. the Scripture passage
        sc = [s.strip() for s in l['scripture'].split(';') if s.strip()]
        if sc:
            others = list(dict.fromkeys(x['scripture'].split(';')[0].strip() for x in sibs if x['scripture'] and x['scripture'].split(';')[0].strip() != sc[0]))
            if len(others) >= 3:
                q = self.mc(rng, f'Which Scripture passage goes with the lesson “{title}”?', sc[0], rng.sample(others, 3), f'{sc[0]} is the passage for this lesson.', lv, 'scripture')
                if q: out.append(q)
        return out

def main():
    total = 0
    for f in sorted(glob.glob(os.path.join(ROOT, 'public/data/curriculum/grade-*.json'))):
        g = json.load(open(f))
        mk = Maker(g, g['band'])
        res = {}
        for u, l in mk.lessons:
            qs = mk.for_lesson(u, l)
            # drop an exact repeat of the same question text
            seen, uniq = set(), []
            for q in qs:
                if q['q'] in seen: continue
                seen.add(q['q']); uniq.append(q)
            res[l['id']] = uniq
            total += len(uniq)
        json.dump(res, open(os.path.join(OUT, f"{g['id']}.json"), 'w'), ensure_ascii=False, separators=(',', ':'))
        print(g['id'], len(res), sum(len(v) for v in res.values()))
    print('total', total)

if __name__ == '__main__':
    main()
