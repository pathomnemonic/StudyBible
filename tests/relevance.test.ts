import 'fake-indexeddb/auto';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi, beforeAll } from 'vitest';
import { rankItems, startHere, groupScored, scoreItem, nearDuplicate, specificity, type RelevanceContext } from '../src/study/relevance';
import type { StudyItem } from '../src/study/providers';
import type { Ref } from '../src/lib/refs';

const sel = (book: string, c: number, v: number): Ref[] => [{ book, c1: c, v1: v, c2: c, v2: v }];
const J11 = sel('JHN', 1, 1);

const WORDS = ['eternity','creation','light','darkness','flesh','glory','grace','truth','witness','baptism','covenant','temple','shepherd','vine','bread','water','spirit','prologue','logos','wisdom','beginning','Father','Son','faith','sign'];
let n = 0;
function item(p: Partial<StudyItem> & { section: StudyItem['section'] }): StudyItem {
  n++;
  return { id: `t${n}`, title: `Item ${n}`, authority: 'historical', format: 'excerpt', match: 'verse-by-verse', why: 'x', sourceName: 's', excerpt: `${WORDS[n % WORDS.length]} ${WORDS[(n * 7 + 3) % WORDS.length]} ${WORDS[(n * 13 + 5) % WORDS.length]} remark ${n}: a short focused comment on what the evangelist means by these opening words, ${WORDS[(n * 3 + 1) % WORDS.length]} and ${WORDS[(n * 11 + 2) % WORDS.length]} in plain language.`, ...p } as StudyItem;
}
const ctx = (over: Partial<RelevanceContext> = {}): RelevanceContext => ({ sel: J11, ...over });

describe('specificity', () => {
  it('ranks this verse over a run holding it over the chapter', () => {
    const exact = specificity(item({ section: 'commentary', ref: 'JHN.1.1' }), J11);
    const run = specificity(item({ section: 'commentary', ref: 'JHN.1.1-5' }), J11);
    const chapter = specificity(item({ section: 'commentary', ref: 'JHN.1' }), J11);
    const book = specificity(item({ section: 'commentary', ref: 'JHN.1-21' }), J11);
    expect(exact.n).toBeGreaterThan(run.n);
    expect(run.n).toBeGreaterThan(chapter.n);
    expect(chapter.n).toBeGreaterThan(book.n);
    expect(chapter.wide && book.wide).toBe(true);
  });
});

describe('ranking invariants', () => {
  it('the reader’s own notes lead, whatever else scores', () => {
    const best = item({ section: 'catechism', kind: 'CCC', authority: 'doctrine', ref: 'JHN.1.1', match: 'direct-citation' });
    const mine = item({ section: 'mine', kind: 'Note', ref: undefined, match: 'direct-citation', excerpt: 'x' });
    const { ranked } = rankItems([best, mine], ctx());
    expect(ranked[0].item.id).toBe(mine.id);
    expect(startHere(ranked, ctx()).own.map((s) => s.item.id)).toEqual([mine.id]);
    expect(startHere(ranked, ctx()).top.map((s) => s.item.id)).not.toContain(mine.id);
  });

  it('a note on this verse beats a chapter-level note of the same kind', () => {
    const wide = item({ section: 'commentary', kind: 'Haydock', ref: 'JHN.1' });
    const here = item({ section: 'commentary', kind: 'Haydock', ref: 'JHN.1.1' });
    const { ranked } = rankItems([wide, here], ctx());
    expect(ranked.map((s) => s.item.id)).toEqual([here.id, wide.id]);
  });

  it('a commentary on the verse beats a work that merely mentions it', () => {
    const about = item({ section: 'fathers', authority: 'father', kind: 'Commentary', match: 'verse-by-verse', ref: 'JHN.1.1' });
    const cites = item({ section: 'fathers', authority: 'father', kind: 'Work', match: 'explicit-reference', ref: 'JHN.1.1' });
    const { ranked } = rankItems([cites, about], ctx());
    expect(ranked[0].item.id).toBe(about.id);
  });

  it('the Catechism and the Catena outrank Haydock, dictionaries and cross-references on the same verse', () => {
    const ccc = item({ section: 'catechism', kind: 'CCC', authority: 'doctrine', match: 'direct-citation', ref: 'JHN.1.1' });
    const catena = item({ section: 'commentary', kind: 'Catena Aurea', authority: 'father', ref: 'JHN.1.1' });
    const hay = item({ section: 'commentary', kind: 'Haydock', ref: 'JHN.1.1' });
    const dict = item({ section: 'dictionary', authority: 'scholarship', match: 'explicit-reference', ref: 'JHN.1.1' });
    const xref = item({ section: 'xref', authority: 'scholarship', match: 'passage', ref: 'JHN.1.1', excerpt: 'Genesis 1:1' });
    const order = rankItems([xref, dict, hay, catena, ccc], ctx()).ranked.map((s) => s.item.id);
    expect(order.indexOf(catena.id)).toBeLessThan(order.indexOf(hay.id));
    expect(order.indexOf(ccc.id)).toBeLessThan(order.indexOf(hay.id));
    expect(order.indexOf(hay.id)).toBeLessThan(order.indexOf(dict.id));
    expect(order.indexOf(dict.id)).toBeLessThan(order.indexOf(xref.id));
  });

  it('short focused text beats a long dump from the same source', () => {
    const short = item({ section: 'commentary', kind: 'Haydock', ref: 'JHN.1.1', excerpt: 'In the beginning: the Word was with God, and was God. '.repeat(3) });
    const dump = item({ section: 'commentary', kind: 'Haydock', ref: 'JHN.1.1', excerpt: Array.from({ length: 500 }, (_, i) => `word${i}`).join(' ') });
    const { ranked } = rankItems([dump, short], ctx());
    expect(ranked[0].item.id).toBe(short.id);
  });

  it('text centred on the verse beats text that merely holds it', () => {
    const text = 'The Father says of the opening of John that the Word was in the beginning with God and the whole sentence is about him. '.repeat(2);
    const centred = item({ section: 'fathers', authority: 'father', match: 'explicit-reference', ref: 'JHN.1.1', excerpt: `…${text} ⟦In the beginning was the Word⟧ ${text}…` });
    const plain = item({ section: 'fathers', authority: 'father', match: 'explicit-reference', ref: 'JHN.1.1', excerpt: `…${text}${text}…` });
    expect(scoreItem(centred, ctx()).score).toBeGreaterThan(scoreItem(plain, ctx()).score);
  });

  it('drops a near-identical text that ranks lower, and says which it repeats', () => {
    const body = 'The Word is the eternal Son, who was with the Father before all things were made, and through whom all things came to be, as the Fathers teach.';
    const a = item({ section: 'commentary', kind: 'Catena Aurea', authority: 'father', ref: 'JHN.1.1', excerpt: body });
    const b = item({ section: 'commentary', kind: 'Haydock', ref: 'JHN.1.1', excerpt: body + ' (Haydock)' });
    const c = item({ section: 'commentary', kind: 'Haydock', ref: 'JHN.1.1', excerpt: 'Something wholly different about the Greek word logos and how it was used by Philo and by the stoics before the evangelist.' });
    const { ranked, dropped } = rankItems([b, c, a], ctx());
    expect(ranked.map((s) => s.item.id)).not.toContain(b.id);
    expect(dropped.get(b.id)).toBe(a.id);
    expect(ranked.map((s) => s.item.id)).toContain(c.id);
    expect(nearDuplicate(body, 'Unrelated words about something else altogether that share nothing with the first text at all, really none.')).toBe(false);
  });

  it('never drops the reader’s own items as duplicates', () => {
    const t = 'The same words twice in two notes that the reader wrote down for themselves about this verse, in full sentences.';
    const a = item({ section: 'mine', kind: 'Note', excerpt: t });
    const b = item({ section: 'mine', kind: 'Note', excerpt: t });
    expect(rankItems([a, b], ctx()).ranked).toHaveLength(2);
  });

  it('puts away what the reader dismissed, and tones down what they have read', () => {
    const a = item({ section: 'commentary', kind: 'Haydock', ref: 'JHN.1.1' });
    const b = item({ section: 'commentary', kind: 'Haydock', ref: 'JHN.1.1', excerpt: 'A different note on the same verse that says something else about the Word and about the beginning of all things.' });
    const seen = rankItems([a, b], ctx({ seen: new Set([a.id]) })).ranked;
    expect(seen[0].item.id).toBe(b.id);
    const out = rankItems([a, b], ctx({ dismissed: new Set([b.id]) }));
    expect(startHere(out.ranked, ctx({ dismissed: new Set([b.id]) })).top.map((s) => s.item.id)).not.toContain(b.id);
  });
});

describe('kid mode and beginners', () => {
  const dict = item({ section: 'encyclopedia', authority: 'scholarship', kind: 'Encyclopedia', match: 'explicit-reference', ref: 'JHN.1.1', excerpt: 'A long learned article. '.repeat(120) });
  const kids = item({ section: 'kids', authority: 'reflection', kind: 'Story', match: 'passage', ref: 'JHN.1', excerpt: 'A short story for children about the Word who was there from the very beginning and came to live with us.' });
  const hay = item({ section: 'commentary', kind: 'Haydock', ref: 'JHN.1.1' });

  it('kid mode lifts children’s material and sinks dense scholarship', () => {
    const adult = rankItems([dict, kids, hay], ctx()).ranked.map((s) => s.item.id);
    const kid = rankItems([dict, kids, hay], ctx({ kidMode: true })).ranked.map((s) => s.item.id);
    expect(kid[0]).toBe(kids.id);
    expect(kid.indexOf(kids.id)).toBeLessThan(adult.indexOf(kids.id) + 1);
    expect(kid[kid.length - 1]).toBe(dict.id);
  });

  it('keeps dense scholarly items out of “Start here” for beginners and children', () => {
    const c = ctx({ beginner: true });
    const { ranked } = rankItems([dict, hay, kids], c);
    expect(startHere(ranked, c).top.map((s) => s.item.id)).not.toContain(dict.id);
    const k = ctx({ kidMode: true });
    expect(startHere(rankItems([dict, hay, kids], k).ranked, k).top.map((s) => s.item.id)).not.toContain(dict.id);
  });
});

describe('Start here', () => {
  it('takes 3 to 5 items across kinds, labelled in plain words, never chapter-level or search links', () => {
    const items = [
      item({ section: 'catechism', kind: 'CCC', authority: 'doctrine', match: 'direct-citation', ref: 'JHN.1.1' }),
      item({ section: 'commentary', kind: 'Catena Aurea', authority: 'father', ref: 'JHN.1.1' }),
      item({ section: 'commentary', kind: 'Catena Aurea', authority: 'father', ref: 'JHN.1.1', excerpt: 'A second Father says other things on the first words of this Gospel about the Word and his equality with the Father.' }),
      item({ section: 'commentary', kind: 'Haydock', ref: 'JHN.1.1', excerpt: 'Haydock gathers the older readers on the first verse and explains the Greek and the Latin, and the sense of the beginning.' }),
      item({ section: 'fathers', authority: 'father', kind: 'Commentary', ref: 'JHN.1.1', excerpt: 'Augustine on the Word, a homily preached on the first words of the Gospel of John for his people.' }),
      item({ section: 'xref', authority: 'scholarship', match: 'passage', ref: 'JHN.1.1', excerpt: 'Genesis 1:1' }),
      item({ section: 'commentary', kind: 'Chapter summary', ref: 'JHN.1', match: 'passage' }),
      item({ section: 'xref', kind: 'Search', match: 'passage', ref: undefined, excerpt: '' }),
    ];
    const c = ctx();
    const top = startHere(rankItems(items, c).ranked, c).top;
    expect(top.length).toBeGreaterThanOrEqual(3);
    expect(top.length).toBeLessThanOrEqual(5);
    expect(top.some((s) => s.group === 'teaching')).toBe(true);
    expect(top.some((s) => s.wide || s.item.kind === 'Search')).toBe(false);
    expect(top.map((s) => s.label)).toContain('The Catechism teaches (quotes this verse)');
    expect(top.map((s) => s.label)).toContain('A Church Father on this verse');
    expect(new Set(top.map((s) => s.group)).size).toBeGreaterThanOrEqual(3);
  });

  it('groups by kind in the panel order', () => {
    const items = [item({ section: 'xref', ref: 'JHN.1.1' }), item({ section: 'fathers', authority: 'father', ref: 'JHN.1.1' }), item({ section: 'catechism', kind: 'CCC', authority: 'doctrine', ref: 'JHN.1.1' }), item({ section: 'commentary', ref: 'JHN.1.1' })];
    expect(groupScored(rankItems(items, ctx()).ranked).map((g) => g.key)).toEqual(['commentary', 'teaching', 'fathers', 'connections']);
  });
});

// ---- golden: the real providers, reading the real data from disk
const DATA = join(__dirname, '..', 'public', 'data');
const have = existsSync(join(DATA, 'editions.json'));
describe.skipIf(!have)('golden verses (real data through the real providers)', () => {
  let gather: (typeof import('../src/study/providers'))['gatherAll'];
  beforeAll(async () => {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} });
    vi.stubGlobal('fetch', async (url: string) => {
      const rel = String(url).replace(/^\/?data\//, '').replace(/^\/+/, '');
      const f = join(DATA, rel.split('?')[0]);
      if (!existsSync(f)) return { ok: false, status: 404, json: async () => null, text: async () => '' };
      const body = readFileSync(f, 'utf8');
      return { ok: true, status: 200, json: async () => JSON.parse(body), text: async () => body };
    });
    gather = (await import('../src/study/providers')).gatherAll;
  }, 60000);

  async function panelFor(book: string, c: number, v: number) {
    const refs = sel(book, c, v);
    const all: StudyItem[] = [];
    await gather(refs, (_k, items) => all.push(...items));
    const real = all.filter((i) => i.kind !== 'Search');
    const cx: RelevanceContext = { sel: refs };
    const { ranked } = rankItems(real, cx);
    return { real, ranked, sh: startHere(ranked, cx) };
  }

  it('John 1:1 starts with at most five items, led by Church teaching and commentary on the verse, from far more', async () => {
    const { real, sh } = await panelFor('JHN', 1, 1);
    expect(real.length).toBeGreaterThan(30);
    expect(sh.top.length).toBeGreaterThanOrEqual(3);
    expect(sh.top.length).toBeLessThanOrEqual(5);
    expect(sh.top.every((s) => !s.wide)).toBe(true);
    expect(sh.top.some((s) => s.group === 'commentary' || s.group === 'fathers' || s.group === 'teaching')).toBe(true);
  }, 60000);

  it('Matthew 16:18 puts the Catechism or a Father in the first five', async () => {
    const { sh } = await panelFor('MAT', 16, 18);
    expect(sh.top.length).toBeGreaterThanOrEqual(3);
    expect(sh.top.some((s) => s.group === 'teaching' || s.group === 'fathers' || s.label.startsWith('A Church Father'))).toBe(true);
  }, 60000);

  it('Philemon 1:16 (little written) still gives something specific, and no chapter-level item leads', async () => {
    const { ranked, sh } = await panelFor('PHM', 1, 16);
    expect(ranked.length).toBeGreaterThan(0);
    expect(sh.top.every((s) => !s.wide)).toBe(true);
  }, 60000);
});
