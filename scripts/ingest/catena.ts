import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PUBLIC_DATA, RAW, Report, writeJson, today, exists } from './lib/util';
import { plain } from './lib/thml';

/** Abbreviations used by the Catena Aurea translators → full names. Unknown labels are kept verbatim. */
const AUTHORS: Record<string, string> = {
  'Chrys': 'John Chrysostom', 'Chrysostom': 'John Chrysostom', 'Pseudo-Chrys': 'Pseudo-Chrysostom (Opus Imperfectum)', 'Aug': 'Augustine of Hippo', 'Augustine': 'Augustine of Hippo',
  'Jerome': 'Jerome', 'Hier': 'Jerome', 'Ambrose': 'Ambrose of Milan', 'Amb': 'Ambrose of Milan', 'Hilary': 'Hilary of Poitiers', 'Hilar': 'Hilary of Poitiers', 'Origen': 'Origen',
  'Greg': 'Gregory the Great', 'Gregory': 'Gregory the Great', 'Bede': 'The Venerable Bede', 'Rabanus': 'Rabanus Maurus', 'Remig': 'Remigius of Auxerre', 'Remigius': 'Remigius of Auxerre',
  'Theophyl': 'Theophylact', 'Theophylact': 'Theophylact', 'Cyril': 'Cyril of Alexandria', 'Basil': 'Basil the Great', 'Gloss. Ordinaria': 'Glossa Ordinaria', 'Gloss': 'Glossa Ordinaria',
  'Gloss. ord': 'Glossa Ordinaria', 'Gloss. interlin': 'Glossa Interlinearis', 'Euseb': 'Eusebius of Caesarea', 'Eusebius': 'Eusebius of Caesarea', 'Isidore': 'Isidore of Seville',
  'Dionysius': 'Pseudo-Dionysius', 'Damascene': 'John Damascene', 'Anselm': 'Anselm', 'Leo': 'Leo the Great', 'Cassian': 'John Cassian', 'Maximus': 'Maximus of Turin',
  'Ambrosiaster': 'Ambrosiaster', 'Epiphanius': 'Epiphanius', 'Hegesippus': 'Hegesippus', 'Josephus': 'Josephus', 'Cyprian': 'Cyprian of Carthage', 'Athanasius': 'Athanasius',
  'Nyssen': 'Gregory of Nyssa', 'Nazianzen': 'Gregory Nazianzen', 'Orig': 'Origen', 'Titus Bost': 'Titus of Bostra', 'Severian': 'Severian', 'Victor': 'Victor of Antioch', 'Alcuin': 'Alcuin',
};

function authorOf(label: string): { id: string; name: string } {
  // "Chrys., Hom. in Matt., Hom. ii" → "Chrys"
  const head = label.split(/[,:]/)[0].trim().replace(/\.$/, '');
  const key = Object.keys(AUTHORS).find((k) => head === k || head.startsWith(k + '.') || head.startsWith(k + ' '));
  const name = key ? AUTHORS[key] : head;
  return { id: name.toLowerCase().replace(/[^a-z]+/g, '-'), name };
}

export interface CatenaGroup {
  c: number;
  v1: number;
  v2: number;
  /** quoted scripture text as printed in the Catena (translator's wording) */
  scripture?: string;
  items: { a: string; id: string; l: string; t: string }[];
}

const VOLS: { file: string; ccelId: string; book: string; title: string }[] = [
  { file: 'catena1.xml', ccelId: 'catena1', book: 'MAT', title: 'Catena Aurea: Gospel of Matthew' },
  { file: 'catena2.xml', ccelId: 'catena2', book: 'MRK', title: 'Catena Aurea: Gospel of Mark' },
];

export function buildCatena(report: Report) {
  const meta: any[] = [];
  for (const v of VOLS) {
    const path = join(RAW, v.file);
    if (!exists(path)) {
      report.warn(`catena: ${v.file} not fetched`);
      continue;
    }
    const xml = readFileSync(path, 'utf8');
    const groups: CatenaGroup[] = [];
    // chapters
    const chapRe = /<div2\b([^>]*)>([\s\S]*?)(?=<div2\b|<\/div1>)/g;
    let cm: RegExpExecArray | null;
    let nItems = 0;
    while ((cm = chapRe.exec(xml))) {
      const tm = /title="Chapter (\d+)"/.exec(cm[1]);
      if (!tm) continue;
      const body = cm[2];
      const divId = /id="([^"]*)"/.exec(cm[1])?.[1];
      const c = +tm[1];
      let cur: CatenaGroup | null = null;
      for (const pm of body.matchAll(/<p class="(scripture|normal)"[^>]*>([\s\S]*?)<\/p>/g)) {
        let cls = pm[1];
        const text = plain(pm[2]).replace(/^(Ver(?:s|ses)?\.?\s*)?([\dl]+)(?=\s*[-–.,:])/, (_m, v, n) => (v ?? '') + n.replace(/l/g, '1'));
        const m = cls === 'scripture' ? /^(?:\[?)(?:Ver(?:s|ses)?\.?\s*)?(\d+)\]?(?:\s*[-–]\s*(\d+)|(?:\s*,\s*(\d+))+)?\s*[.:,]?\s*(.*)$/s.exec(text) : null;
        if (cls === 'scripture' && (!m || !/^[“"‘'A-Za-z(\[]/.test(m[4] ?? ''))) cls = 'normal';
        if (cls === 'scripture' && m) {
          const v1 = +m[1];
          let v2 = m[2] ? +m[2] : v1;
          const list = /^(?:\[?)(?:Ver(?:s|ses)?\.?\s*)?((?:\d+\s*,\s*)+\d+)/.exec(text);
          if (list) v2 = Math.max(...list[1].split(',').map((x) => +x));
          cur = { c, v1, v2, scripture: m[4], items: [] };
          groups.push(cur);
        } else if (cur) {
          // "Chrys., Hom. in Matt., Hom. ii: Matthew wrote…"
          const lm = /^([^:]{1,140}?):\s+([\s\S]+)$/.exec(text);
          if (lm) {
            const au = authorOf(lm[1]);
            cur.items.push({ a: au.name, id: au.id, l: lm[1].trim(), t: lm[2].trim() });
          } else {
            // continuation paragraph of the previous father's text, or an unlabelled gloss
            const last = cur.items[cur.items.length - 1];
            if (last) last.t += '\n\n' + text;
            else cur.items.push({ a: 'Aquinas (compiler)', id: 'aquinas', l: '', t: text });
          }
          nItems++;
        }
      }
      void divId;
    }
    writeJson(join(PUBLIC_DATA, 'commentary/catena', `${v.book}.json`), { source: v.ccelId, groups });
    meta.push({ book: v.book, ccelId: v.ccelId, title: v.title, groups: groups.length, items: nItems });
  }
  writeJson(
    join(PUBLIC_DATA, 'commentary/catena/_meta.json'),
    {
      work: 'Catena Aurea (Golden Chain)',
      author: 'St. Thomas Aquinas (compiler); quoting the Fathers of the Church',
      translation: 'English translation (Oxford, 1841–1845, J.H. Newman et al.); text as published by CCEL',
      publication: 'London: J.G.F. and J. Rivington, 1842',
      rights: 'public-domain',
      note: 'CCEL metadata lists the translator inconsistently; the printed edition is the Rivington/Oxford translation. Verified by the structure of the source itself: each patristic excerpt follows the verse of the Gospel it comments on.',
      url: 'https://ccel.org/ccel/aquinas',
      retrieved: today(),
      volumes: meta,
      missing: ['Luke (CCEL volume not available)', 'John (CCEL volume not available)'],
    },
    true,
  );
  report.stats['catena'] = meta;
}
