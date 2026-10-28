#!/usr/bin/env python3
"""Pick word-ladder pairs of three, four and five letters from the game word list and write src/data/ladders.ts.
Both ends are words of the faith (or near it); every pair is solvable in three to seven steps."""
import json, collections, random, os, re
root = os.path.join(os.path.dirname(__file__), '..', '..')
allw = set(json.load(open(os.path.join(root, 'public/data/play/words.json')))['words'])
faith = set(re.search(r'`([^`]*)`', open(os.path.join(root, 'src/data/verbum.ts')).read()).group(1).split(' '))
faith |= {l.split('|')[0] for l in open(os.path.join(root, 'scripts/play/clues.txt'))}
faith |= set("sin ark god eve lot son net sea win ten law son tax lie oil sun dew sow reap hope love lamb lord pray holy hell soul fast rite sins rope gold sand wine seed vine rock rain dust fear life dove hand hold gift mild meek lust hate fall rise dead live king rest tomb salt song kind good dark home land save heal wise sing lent rose rule lamp calm star fire bear fold free less mind more need rich poor safe seek slay deed dear door duty east fish flee flow food form gate give glad goat hear help hide high hill hymn iron join keep lack lead lift like load lock lose lost mark mass meal meat meet milk moon name near nine open pace page pass past path pity plan plea pour pull pure rage rank read real ring road room root sail sake sale seal seat self sell send sent ship sick sign site soft soil sold sole some soon sore sort soul step stir stop tale tell tide time told tree true turn unto upon vain vast view void wake walk wall ward warm wave weak wear week west wide wife wild will wind wing wipe wire wish wood word work year zeal".split())
rnd = random.Random(21)
out = []
for n, want in ((3, 24), (4, 40), (5, 40)):
    words = {w for w in allw if len(w) == n}
    def nb(a):
        for i in range(n):
            for c in 'abcdefghijklmnopqrstuvwxyz':
                if c != a[i]:
                    b = a[:i] + c + a[i + 1:]
                    if b in words: yield b
    def bfs(a):
        d = {a: 0}; q = collections.deque([a])
        while q:
            x = q.popleft()
            for m in nb(x):
                if m not in d: d[m] = d[x] + 1; q.append(m)
        return d
    core = sorted(w for w in faith if len(w) == n and w in words)
    rnd.shuffle(core)
    used = set(); got = 0
    lo, hi = (3, 5) if n == 3 else (3, 6) if n == 4 else (3, 7)
    for a in core:
        if a in used: continue
        d = bfs(a)
        c = [b for b in core if b not in used and b != a and lo <= d.get(b, 0) <= hi]
        if not c: continue
        b = rnd.choice(c); used |= {a, b}; out.append([a, b]); got += 1
        if got >= want: break
    print(n, got, len(core))
open(os.path.join(root, 'src/data/ladders.ts'), 'w').write("/** Word-ladder puzzles: change one letter at a time, every step a word, from the first word to the last. Made by scripts/play/build_ladders.py. */\nexport const LADDERS: [string, string][] = " + json.dumps(out) + ";\n")
