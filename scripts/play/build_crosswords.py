#!/usr/bin/env python3
"""Make small crossword puzzles from scripts/play/clues.txt and write src/data/crosswords.ts.
Words are placed greedily where they cross a placed word; a puzzle keeps the best of many random tries."""
import json, random, sys, os
root = os.path.join(os.path.dirname(__file__), '..', '..')
clues = {}
for l in open(os.path.join(root, 'scripts/play/clues.txt'), encoding='utf-8'):
    w, c = l.rstrip('\n').split('|'); clues[w] = c
words = [w for w in clues if 3 <= len(w) <= 10]
N = 12

def try_build(rnd):
    pool = words[:]; rnd.shuffle(pool)
    pool.sort(key=lambda w: -len(w) + rnd.random() * 3)
    g = {}  # (r,c)->letter
    placed = []  # (word, r, c, dir)
    def fits(w, r, c, d):
        dr, dc = (0, 1) if d == 'a' else (1, 0)
        if not (0 <= r and 0 <= c and r + dr * (len(w) - 1) < N and c + dc * (len(w) - 1) < N): return False
        if g.get((r - dr, c - dc)) or g.get((r + dr * len(w), c + dc * len(w))): return False
        cross = 0
        for i, ch in enumerate(w):
            rr, cc = r + dr * i, c + dc * i
            cur = g.get((rr, cc))
            if cur is not None:
                if cur != ch: return False
                cross += 1
            else:
                # neighbours at the sides must be empty, or the new letter would touch another word
                if g.get((rr + dc, cc + dr)) or g.get((rr - dc, cc - dr)): return False
        return cross >= 1
    def put(w, r, c, d):
        dr, dc = (0, 1) if d == 'a' else (1, 0)
        for i, ch in enumerate(w): g[(r + dr * i, c + dc * i)] = ch
        placed.append((w, r, c, d))
    first = pool.pop(0)
    put(first, N // 2, (N - len(first)) // 2, 'a')
    for w in pool:
        opts = []
        for (pw, pr, pc, pd) in placed:
            d = 'd' if pd == 'a' else 'a'
            for i, ch in enumerate(pw):
                for j, ch2 in enumerate(w):
                    if ch == ch2:
                        rr, cc = (pr, pc + i) if pd == 'a' else (pr + i, pc)
                        r, c = (rr, cc - j) if d == 'a' else (rr - j, cc)
                        if fits(w, r, c, d): opts.append((r, c, d))
        if opts:
            r, c, d = rnd.choice(opts); put(w, r, c, d)
        if len(placed) >= 14: break
    return placed

def crop(placed):
    rs = [p[1] for p in placed] + [p[1] + (len(p[0]) - 1 if p[3] == 'd' else 0) for p in placed]
    cs = [p[2] for p in placed] + [p[2] + (len(p[0]) - 1 if p[3] == 'a' else 0) for p in placed]
    r0, c0 = min(rs), min(cs)
    return [(w, r - r0, c - c0, d) for w, r, c, d in placed], max(rs) - r0 + 1, max(cs) - c0 + 1

rnd = random.Random(2026)
puzzles, seen = [], set()
tries = 0
while len(puzzles) < 80 and tries < 30000:
    tries += 1
    p = try_build(rnd)
    if len(p) < 9: continue
    p, h, w = crop(p)
    if h > 11 or w > 11: continue
    key = frozenset(x[0] for x in p)
    if any(len(key & s) > 3 for s in seen): continue
    seen.add(key)
    puzzles.append({'rows': h, 'cols': w, 'words': [{'w': x[0], 'r': x[1], 'c': x[2], 'd': x[3], 'clue': clues[x[0]]} for x in p]})
print(len(puzzles), 'puzzles in', tries, 'tries', file=sys.stderr)
out = os.path.join(root, 'src/data/crosswords.ts')
open(out, 'w', encoding='utf-8').write("/** Small crosswords of the faith, made by scripts/play/build_crosswords.py from scripts/play/clues.txt. */\nexport interface CrossWord { w: string; r: number; c: number; d: 'a' | 'd'; clue: string }\nexport interface Crossword { rows: number; cols: number; words: CrossWord[] }\nexport const CROSSWORDS: Crossword[] = " + json.dumps(puzzles, ensure_ascii=False) + ";\n")
