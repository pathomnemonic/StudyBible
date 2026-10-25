import { BOOKS } from '../lib/canon';
import { refId } from '../lib/refs';
import type { EditionRecord } from '../data/loader';
import { getBiay, getDoctrine, getLibraryIndex } from '../data/content';

export interface PlanDay {
  title?: string;
  refs: string[]; // anchor ref ids
  episodeId?: string;
  workSection?: { workId: string; section: number; label: string };
  note?: string;
}
export interface PlanDef {
  id: string;
  name: string;
  description: string;
  category: 'bible' | 'gospel' | 'catechism' | 'saint' | 'seasonal' | 'psalms' | 'listening';
  days: PlanDay[];
  season?: 'advent' | 'lent' | 'easter';
}

const chap = (book: string, c: number) => refId({ book, c1: c, c2: c });
const range = (book: string, a: number, b: number) => (a === b ? chap(book, a) : refId({ book, c1: a, c2: b }));

/**
 * Split a list of chapters (with verse counts) into exactly `n` days of roughly equal length.
 * Each chapter goes to the day that its midpoint falls in, measured along the running total of verses, so days stay balanced
 * and the count of days is always `n` (a greedy "fill until the target" split ran short, giving 300 days for a 365-day plan).
 */
function balanced(items: { book: string; c: number; v: number }[], n: number): PlanDay[] {
  const total = items.reduce((a, x) => a + x.v, 0);
  const target = total / n;
  const buckets: typeof items[] = Array.from({ length: n }, () => []);
  let cum = 0;
  for (const it of items) {
    buckets[Math.min(n - 1, Math.floor((cum + it.v / 2) / target))].push(it);
    cum += it.v;
  }
  // a very long chapter can leave a day empty: borrow the last chapter of the nearest earlier day that has more than one
  for (let d = 0; d < n; d++) {
    if (buckets[d].length) continue;
    let k = d - 1;
    while (k >= 0 && buckets[k].length < 2) k--;
    if (k >= 0) buckets[d].push(buckets[k].pop()!);
  }
  return buckets.map((cur) => {
    const refs: string[] = [];
    let i = 0;
    while (i < cur.length) {
      let j = i;
      while (j + 1 < cur.length && cur[j + 1].book === cur[i].book && cur[j + 1].c === cur[j].c + 1) j++;
      refs.push(range(cur[i].book, cur[i].c, cur[j].c));
      i = j + 1;
    }
    return { refs };
  });
}

function chaptersOf(ed: EditionRecord, books: string[]) {
  const out: { book: string; c: number; v: number }[] = [];
  for (const b of books) (ed.verseCounts[b] ?? []).forEach((v, i) => out.push({ book: b, c: i + 1, v }));
  return out;
}

export async function builtinPlans(vulgate: EditionRecord): Promise<PlanDef[]> {
  const allBooks = BOOKS.map((b) => b.id);
  const nt = BOOKS.filter((b) => b.testament === 'NT').map((b) => b.id);
  const gospels = ['MAT', 'MRK', 'LUK', 'JHN'];
  const plans: PlanDef[] = [];

  plans.push({ id: 'bible-365', name: 'The whole Catholic Bible in a year', description: 'All 73 books in the traditional Catholic order, about 100 verses a day (balanced by length, not by chapter count). Vulgate/Douay chapter numbering.', category: 'bible', days: balanced(chaptersOf(vulgate, allBooks), 365) });
  plans.push({ id: 'nt-90', name: 'The New Testament in 90 days', description: 'The 27 books of the New Testament, about three chapters a day.', category: 'bible', days: balanced(chaptersOf(vulgate, nt), 90) });
  plans.push({ id: 'gospels-30', name: 'The four Gospels in 30 days', description: 'Matthew, Mark, Luke and John, about three chapters a day.', category: 'gospel', days: balanced(chaptersOf(vulgate, gospels), 30) });
  plans.push({ id: 'gospels-89', name: 'A Gospel chapter a day (89 days)', description: 'One chapter a day through Matthew, Mark, Luke and John.', category: 'gospel', days: chaptersOf(vulgate, gospels).map((x) => ({ refs: [chap(x.book, x.c)] })) });
  plans.push({ id: 'john-21', name: 'The Gospel of John in 21 days', description: 'One chapter a day, ending with the resurrection appearances.', category: 'gospel', days: chaptersOf(vulgate, ['JHN']).map((x) => ({ refs: [chap('JHN', x.c)] })) });
  plans.push({ id: 'psalter-30', name: 'The Psalter in 30 days', description: 'Five psalms a day, in the Vulgate/Douay numbering that Augustine, the Fathers and the traditional Divine Office use (Psalm 22 is “The Lord is my shepherd”).', category: 'psalms', days: Array.from({ length: 30 }, (_, i) => ({ refs: [range('PSA', i * 5 + 1, i * 5 + 5)] })) });

  // Catechism-oriented: one topic per plan, one key passage a day.
  const d = await getDoctrine();
  for (const t of d?.topics ?? []) {
    if (t.scripture.length < 6) continue;
    plans.push({
      id: `topic-${t.id}`,
      name: `Scripture and ${t.title}`,
      description: `Key passages for “${t.title}”, one a day, each with a pointer to the Catechism sections that treat the topic. The passage list is an editorial selection.`,
      category: 'catechism',
      days: t.scripture.map((s, i) => ({ title: `Day ${i + 1}`, refs: [s], note: `Catechism: ${t.ccc.map(([a, b]) => `§${a}${b !== a ? '–' + b : ''}`).join(', ')}` })),
    });
  }

  // Saints & Fathers: one section a day
  const lib = await getLibraryIndex();
  for (const w of lib?.works ?? []) {
    if (w.sections.length < 5 || w.sections.length > 130) continue;
    plans.push({
      id: `work-${w.id}`,
      name: `${w.author}: ${w.title}`,
      description: `${w.sections.length} sections, one a day. ${w.description}`,
      category: 'saint',
      days: w.sections.map((s, i) => ({ title: s.title, refs: s.scripture, workSection: { workId: w.id, section: i, label: s.title } })),
    });
  }

  // Bible in a Year (reading + listening)
  const b = await getBiay();
  if (b) {
    const days: PlanDay[] = [];
    for (let i = 1; i <= 365; i++) {
      const dd = b.days[String(i)];
      const eps = b.episodes.filter((e) => e.day === i).sort((x, y) => (y.year ?? 0) - (x.year ?? 0));
      days.push({ title: dd?.title ? `Day ${i}: ${dd.title}` : `Day ${i}`, refs: dd?.passages ?? [], episodeId: eps[0]?.id, note: dd?.passages?.length ? undefined : 'Readings for this day are not listed in the feed.' });
    }
    plans.push({ id: 'biay', name: 'The Bible in a Year (reading + listening)', description: 'Fr. Mike Schmitz’s 365-day plan from Ascension: read the day’s passages and listen to the episode. Independent of release dates.', category: 'listening', days });
  }

  // Seasonal
  plans.push({
    id: 'advent-24', name: 'Advent: Isaiah and the infancy narratives', season: 'advent', category: 'seasonal',
    description: 'Twenty-four days of waiting: the great Advent prophecies of Isaiah, then the infancy narratives of Matthew and Luke. An editorial selection.',
    days: ['ISA.2.1-5', 'ISA.7.10-14', 'ISA.9.1-7', 'ISA.11.1-10', 'ISA.12.1-6', 'ISA.25.6-10', 'ISA.26.1-9', 'ISA.29.17-24', 'ISA.30.18-26', 'ISA.35.1-10', 'ISA.40.1-11', 'ISA.41.8-20', 'ISA.45.6-8', 'ISA.49.8-15', 'ISA.52.7-10', 'ISA.54.1-10', 'ISA.55.1-13', 'ISA.60.1-7', 'MAT.1.1-17', 'MAT.1.18-25', 'LUK.1.5-25', 'LUK.1.26-38', 'LUK.1.39-56', 'LUK.1.57-80'].map((r) => ({ refs: [r] })),
  });
  plans.push({
    id: 'lent-40', name: 'Lent: repentance and the road to the Cross', season: 'lent', category: 'seasonal',
    description: 'Forty days from Ash Wednesday: the penitential psalms (Vulgate numbering), the prophets’ call to return, the temptation and the Passion according to John. An editorial selection.',
    days: ['JOL.2.12-19', 'ISA.58.1-12', 'MAT.6.1-18', 'PSA.50.1-21', 'MAT.4.1-11', 'GEN.3.1-24', 'PSA.6.1-11', 'LUK.15.1-32', 'EZK.18.20-32', 'PSA.31.1-11', 'DAN.9.4-19', 'MAT.5.17-48', 'PSA.37.1-23', 'JON.3.1-10', 'LUK.18.9-14', 'PSA.101.1-29', 'HOS.14.2-10', 'MAT.18.21-35', 'PSA.129.1-8', 'MIC.7.14-20', 'JHN.3.1-21', 'EXO.17.1-7', 'JHN.4.4-42', 'PSA.142.1-12', 'JHN.9.1-41', 'ISA.43.16-21', 'JHN.8.1-11', 'EZK.37.1-14', 'JHN.11.1-45', 'ISA.50.4-9', 'PHP.2.5-11', 'JHN.12.20-33', 'JHN.13.1-20', 'JHN.13.21-38', 'JHN.14.1-14', 'JHN.18.1-27', 'JHN.18.28-40', 'JHN.19.1-30', 'JHN.19.31-42', 'MAT.27.57-66'].map((r) => ({ refs: [r] })),
  });
  plans.push({
    id: 'easter-50', name: 'Easter: the Acts of the Apostles and the risen Lord', season: 'easter', category: 'seasonal',
    description: 'Fifty days of Easter: the resurrection accounts, the Acts of the Apostles, and the first letter of Peter. An editorial selection.',
    days: [chap('LUK', 24), chap('JHN', 20), chap('JHN', 21), chap('MAT', 28), ...Array.from({ length: 28 }, (_, i) => chap('ACT', i + 1)), ...Array.from({ length: 5 }, (_, i) => chap('1PE', i + 1)), chap('REV', 1), chap('REV', 4), chap('REV', 5), chap('REV', 7), chap('REV', 21), chap('REV', 22), 'PSA.117.1-29', 'PSA.15.1-11', 'PSA.97.1-9', 'PSA.99.1-5', 'JHN.14.15-31', 'JHN.15.1-17', 'JHN.16.5-15', 'JHN.17.1-26'].slice(0, 50).map((r) => ({ refs: [r] })),
  });
  return plans;
}
