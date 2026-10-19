import { unzipSync } from 'fflate';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { openZCom } from './sword';
import { decodeEntities } from './lib/thml';
import { PUBLIC_DATA, RAW, Report, exists, today, writeJson } from './lib/util';
import { parseOsis } from './lib/thml';
import { readJson } from './lib/util';

/** Names used by the Catena's translators → full names (unknown labels are kept verbatim). */
const AUTHORS: [RegExp, string][] = [
  [/^(?:Pseudo-?Chrys|Chrys\. \(Op\. Imperf|Op\. Imperf)/i, 'Pseudo-Chrysostom (Opus Imperfectum)'],
  [/^Chrys/i, 'John Chrysostom'],
  [/^Aug/i, 'Augustine of Hippo'],
  [/^(?:Jerome|Hier)/i, 'Jerome'],
  [/^Amb(?!rosiaster)/i, 'Ambrose of Milan'],
  [/^Ambrosiaster/i, 'Ambrosiaster'],
  [/^Hil/i, 'Hilary of Poitiers'],
  [/^Orig/i, 'Origen'],
  [/^Greg\. ?Naz|^Nazian/i, 'Gregory Nazianzen'],
  [/^Greg\. ?Nyss|^Nyss/i, 'Gregory of Nyssa'],
  [/^Greg/i, 'Gregory the Great'],
  [/^Bede/i, 'The Venerable Bede'],
  [/^Rab/i, 'Rabanus Maurus'],
  [/^Remig/i, 'Remigius of Auxerre'],
  [/^Theophyl/i, 'Theophylact'],
  [/^Cyril/i, 'Cyril of Alexandria'],
  [/^Basil/i, 'Basil the Great'],
  [/^Gloss\. ?Ord|^Gloss\.? ?\(?ord/i, 'Glossa Ordinaria'],
  [/^Gloss\. ?Interl|^Interlin/i, 'Glossa Interlinearis'],
  [/^Gloss/i, 'Gloss (compilers of the Catena)'],
  [/^Euseb/i, 'Eusebius of Caesarea'],
  [/^Isidore|^Isid/i, 'Isidore of Seville'],
  [/^Dionys/i, 'Pseudo-Dionysius'],
  [/^Damasc/i, 'John Damascene'],
  [/^Anselm/i, 'Anselm'],
  [/^Leo/i, 'Leo the Great'],
  [/^Cassian/i, 'John Cassian'],
  [/^Maxim/i, 'Maximus of Turin'],
  [/^Epiph/i, 'Epiphanius'],
  [/^Cyprian/i, 'Cyprian of Carthage'],
  [/^Athan/i, 'Athanasius'],
  [/^Titus/i, 'Titus of Bostra'],
  [/^Severian/i, 'Severian of Gabala'],
  [/^Victor/i, 'Victor of Antioch'],
  [/^Alcuin/i, 'Alcuin'],
  [/^Josephus/i, 'Josephus'],
  [/^Hegesipp/i, 'Hegesippus'],
  [/^Tertull/i, 'Tertullian'],
  [/^Theodor/i, 'Theodoret'],
  [/^Eus/i, 'Eusebius of Caesarea'],
  [/^Cat\. ?Aur|^Aquin/i, 'Thomas Aquinas (compiler)'],
];

function authorOf(label: string): { id: string; name: string } {
  const head = label.replace(/^\W+/, '').trim();
  const hit = AUTHORS.find(([re]) => re.test(head));
  const name = hit ? hit[1] : head.split(/[,:]/)[0].replace(/\.$/, '').trim();
  return { id: name.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, ''), name };
}

const clean = (s: string) =>
  decodeEntities(
    s
      .replace(/<note\b[\s\S]*?<\/note>/g, '')
      .replace(/<\/?(?:hi|div|reference|q|l|lg|p|seg|name|foreign|divineName)\b[^>]*>/g, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();

export interface CatenaGroup {
  c: number;
  v1: number;
  v2: number;
  scripture?: string;
  items: { a: string; id: string; l: string; t: string }[];
}

const BOOKS: Record<string, string> = { Matt: 'MAT', Mark: 'MRK', Luke: 'LUK', John: 'JHN' };

export function buildCatena(report: Report) {
  const zipPath = join(RAW, 'Catena.sword.zip');
  if (!exists(zipPath)) return report.warn('catena: Catena.sword.zip not fetched');
  const files = unzipSync(new Uint8Array(readFileSync(zipPath)));
  const get = (suffix: string) => {
    const k = Object.keys(files).find((x) => x.endsWith(suffix));
    if (!k) throw new Error(`catena: missing ${suffix} in the SWORD module`);
    return files[k];
  };
  const z = openZCom(get('nt.czv'), get('nt.czs'), get('nt.czz'));
  const conf = new TextDecoder().decode(get('catena.conf'));
  const license = /DistributionLicense=(.*)/.exec(conf)?.[1]?.trim();
  if (license !== 'Public Domain') throw new Error(`catena: unexpected module licence "${license}"`);

  // Collect every annotated entry: the OSIS annotateRef says which verse(s) it comments on.
  interface Raw { book: string; c: number; v1: number; c2: number; v2: number | null; body: string }
  const raws: Raw[] = [];
  for (let i = 0; i < z.entries; i++) {
    const t = z.entry(i);
    const m = /annotateRef="([^"]+)"/.exec(t);
    if (!m) continue;
    const p = parseOsis(m[1]);
    if (!p || !BOOKS[Object.keys(BOOKS).find((k) => m[1].startsWith(k + '.')) ?? '']) {
      report.warn(`catena: unparsed annotateRef "${m[1]}"`);
      continue;
    }
    raws.push({ book: p.book, c: p.c1, v1: p.v1 ?? 1, c2: p.c2, v2: m[1].includes('-') && p.c2 === p.c1 ? (p.v2 ?? null) : null, body: t });
  }

  const vc: Record<string, number[]> = readJson(join(PUBLIC_DATA, 'editions.json')).editions.find((e: any) => e.id === 'vulgate').verseCounts;
  const byBook = new Map<string, CatenaGroup[]>();
  let items = 0;
  raws.forEach((r, i) => {
    const next = raws[i + 1];
    // The group runs to the verse before the next group when that is in the same chapter; if the OSIS ref names an end, use it.
    const chapterEnd = vc[r.book]?.[r.c - 1] ?? r.v1;
    let v2 = r.v2 ?? (next && next.book === r.book && next.c === r.c && next.v1 > r.v1 ? next.v1 - 1 : chapterEnd);
    if (v2 < r.v1) v2 = r.v1;
    const g: CatenaGroup = { c: r.c, v1: r.v1, v2, items: [] };
    // paragraphs: <div sID="genN" type="x-p"/> … <div eID="genN" type="x-p"/>
    const paras = [...r.body.matchAll(/<div sID="([^"]+)" type="x-p"\/>([\s\S]*?)<div eID="\1" type="x-p"\/>/g)].map((m) => m[2]);
    for (const p of paras) {
      const lead = /^\s*<hi type="bold">([\s\S]*?)<\/hi>\s*([\s\S]*)$/.exec(p);
      if (lead && /^Vers?\./i.test(clean(lead[1]))) {
        g.scripture = clean(lead[2]);
        continue;
      }
      if (lead) {
        const label = clean(lead[1]).replace(/:$/, '');
        const text = clean(lead[2]);
        if (!text) continue;
        const au = authorOf(label);
        g.items.push({ a: au.name, id: au.id, l: label, t: text });
        items++;
      } else {
        const text = clean(p);
        if (!text) continue;
        const last = g.items[g.items.length - 1];
        if (last) last.t += '\n\n' + text;
        else g.items.push({ a: 'Gloss (compilers of the Catena)', id: 'gloss', l: '', t: text });
        items++;
      }
    }
    if (g.items.length) (byBook.get(r.book) ?? byBook.set(r.book, []).get(r.book)!).push(g);
  });
  const meta: any[] = [];
  for (const [book, groups] of byBook) {
    writeJson(join(PUBLIC_DATA, 'commentary/catena', `${book}.json`), { source: 'crosswire-catena', groups });
    meta.push({ book, groups: groups.length, items: groups.reduce((a, g) => a + g.items.length, 0) });
  }
  writeJson(
    join(PUBLIC_DATA, 'commentary/catena/_meta.json'),
    {
      work: 'Catena Aurea (Golden Chain)',
      author: 'St. Thomas Aquinas (compiler); quoting the Fathers of the Church',
      translation: 'English translation of 1841–45 (published by J.G.F. and J. Rivington, London 1842), by John Henry Newman and colleagues',
      module: 'CrossWire SWORD module “Catena” v1.0.1 — Public Domain; compiled from public-domain sources, checked against scans of the original publication, converted to OSIS by Tom Lemmens (github.com/lemtom/catena)',
      rights: 'public-domain',
      url: 'https://crosswire.org/sword/modules/ModInfo.jsp?modName=Catena',
      retrieved: today(),
      note: 'Verse links are those of the Catena itself: each patristic excerpt appears beneath the verse(s) of the Gospel it was set to comment on.',
      volumes: meta,
    },
    true,
  );
  report.stats['catena'] = meta;
}
