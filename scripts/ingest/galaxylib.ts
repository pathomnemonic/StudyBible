import { join } from 'node:path';
import { readdirSync } from 'node:fs';
import { PUBLIC_DATA, Report, readJson, writeJson } from './lib/util';

/** The groups the non-biblical works are arranged in around the Scripture universe. */
export const GALAXY_CATS: { id: string; name: string; blurb: string }[] = [
  { id: 'early', name: 'Early Fathers', blurb: 'The first three centuries, to the Council of Nicaea.' },
  { id: 'greek', name: 'Greek and Eastern Fathers', blurb: 'Athanasius, Basil, Chrysostom and the East, 4th to 8th century.' },
  { id: 'latin', name: 'Latin Fathers', blurb: 'Ambrose, Jerome, Augustine, Leo and Gregory the Great.' },
  { id: 'medieval', name: 'Medieval saints and doctors', blurb: 'Anselm, Aquinas, Julian, Catherine, à Kempis.' },
  { id: 'spiritual', name: 'Spiritual masters', blurb: 'Ignatius, Teresa, Francis de Sales, Brother Lawrence, Thérèse.' },
  { id: 'councils', name: 'Councils and Church documents', blurb: 'The ecumenical councils, Trent, Vatican I and the great encyclicals.' },
  { id: 'catechisms', name: 'Catechisms', blurb: 'The Roman Catechism and the Baltimore Catechisms.' },
  { id: 'history', name: 'History and background', blurb: 'Church historians and the Jewish world of the Gospels.' },
];
const BY_AUTHOR: Record<string, string> = {
  'clement-rome': 'early', 'ignatius-antioch': 'early', justin: 'early', tatian: 'early', irenaeus: 'early', 'clement-alexandria': 'early', tertullian: 'early', hippolytus: 'early', cyprian: 'early', novatian: 'early', origen: 'early', methodius: 'early', 'gregory-thaumaturgus': 'early', arnobius: 'early', lactantius: 'early',
  athanasius: 'greek', 'basil-the-great': 'greek', 'gregory-nyssa': 'greek', chrysostom: 'greek', 'cyril-jerusalem': 'greek', ephrem: 'greek', 'john-damascus': 'greek',
  ambrose: 'latin', jerome: 'latin', augustine: 'latin', 'leo-great': 'latin', 'gregory-great': 'latin', cassian: 'latin', 'vincent-lerins': 'latin',
  anselm: 'medieval', 'thomas-aquinas': 'medieval', 'julian-norwich': 'medieval', 'catherine-siena': 'medieval', 'thomas-a-kempis': 'medieval', 'walter-hilton': 'medieval',
  'ignatius-loyola': 'spiritual', 'teresa-avila': 'spiritual', 'francis-de-sales': 'spiritual', 'brother-lawrence': 'spiritual', 'therese-lisieux': 'spiritual',
  eusebius: 'history', socrates: 'history', theodoret: 'history', edersheim: 'history',
};
const catOf = (w: any) => (w.kind === 'catechism' ? 'catechisms' : w.authority === 'church' ? 'councils' : BY_AUTHOR[w.authorId] ?? (w.period === 'patristic' ? 'greek' : w.period === 'medieval' ? 'medieval' : 'spiritual'));

/**
 * Library works for the Scripture universe: each work's group, and the Bible books it cites most (counted from the library's
 * Scripture index), so a work can be placed beside the books it speaks about.
 */
export function buildGalaxyLib(report: Report) {
  const lib = readJson(join(PUBLIC_DATA, 'library', 'index.json')).works as any[];
  const counts = new Map<string, Map<string, number>>();
  const dir = join(PUBLIC_DATA, 'library', 'scripture');
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const book = f.replace('.json', '');
    for (const e of readJson(join(dir, f)) as any[]) {
      const m = counts.get(e[4]) ?? counts.set(e[4], new Map()).get(e[4])!;
      m.set(book, (m.get(book) ?? 0) + (e[6] === 't' ? 1 : 0.4));
    }
  }
  const works = lib.map((w) => {
    const m = counts.get(w.id) ?? new Map();
    const total = [...m.values()].reduce((a, b) => a + b, 0);
    const books = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([b, n]) => [b, Math.round(n * 10) / 10]);
    return {
      id: w.id, title: w.title, author: w.author, authorId: w.authorId, cat: catOf(w), year: w.year ?? '', period: w.period, kind: w.kind,
      words: w.sections.reduce((a: number, s: any) => a + s.words, 0), cites: Math.round(total), books,
    };
  });
  writeJson(join(PUBLIC_DATA, 'library', 'galaxy.json'), { cats: GALAXY_CATS, works });
  report.stats['galaxy-library'] = works.length;
}
