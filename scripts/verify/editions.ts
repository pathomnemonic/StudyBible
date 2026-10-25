import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Audit of the bundled Bible texts: for every edition and book, chapters in order with no repeats, verses in order with no repeats,
 * no empty verses, no gap inside a chapter, and a count of verses per edition. Run: npx tsx scripts/verify/editions.ts
 * Exits non-zero when it finds anything not listed in KNOWN (gaps that are real features of a text, with the reason).
 */
const DATA = join(process.cwd(), 'public/data/bible');
/** `edition/BOOK chapter` → why a gap or irregularity there is expected. */
export const KNOWN: Record<string, string> = {};

/** One entry per verse number (a copy of flattenChapter, which cannot be imported outside the browser build). */
function flattenChapter(ch: any): { n: number; text: string }[] {
  const map = new Map<number, { n: number; text: string }>();
  let cur = 0;
  for (const b of ch.blocks) {
    if (typeof b[1] === 'string') continue;
    for (const [v, t] of b[1] as [number, string][]) {
      if (v > 0) cur = v;
      if (cur === 0) continue;
      const e = map.get(cur) ?? { n: cur, text: '' };
      e.text = e.text ? `${e.text} ${t}`.trim() : t;
      map.set(cur, e);
    }
  }
  return [...map.values()].sort((a, b) => a.n - b.n);
}

export interface Finding { where: string; problem: string }
export function auditEdition(edition: string): { verses: number; findings: Finding[] } {
  const findings: Finding[] = [];
  let verses = 0;
  const dir = join(DATA, edition);
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    const book = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    const seen = new Set<number>();
    let prev = 0;
    for (const ch of book.chapters) {
      const where = `${edition}/${book.id} ${ch.n}`;
      if (seen.has(ch.n)) findings.push({ where, problem: 'chapter repeated' });
      if (ch.n < prev) findings.push({ where, problem: 'chapter out of order' });
      seen.add(ch.n); prev = ch.n;
      const vs = flattenChapter(ch);
      verses += vs.length;
      const nums = new Set<number>();
      let last = 0;
      for (const v of vs) {
        if (nums.has(v.n)) findings.push({ where: `${where}:${v.n}`, problem: 'verse repeated' });
        nums.add(v.n);
        if (!v.text.trim()) findings.push({ where: `${where}:${v.n}`, problem: 'empty verse' });
        if (v.n > last + 1 && last > 0) findings.push({ where: `${where}:${last + 1}-${v.n - 1}`, problem: 'gap in verse numbers' });
        last = v.n;
      }
      if (!vs.length) findings.push({ where, problem: 'chapter has no verses' });
    }
  }
  return { verses, findings: findings.filter((x) => !(x.where in KNOWN)) };
}

if (process.argv[1]?.endsWith('editions.ts')) {
  let bad = 0;
  for (const e of readdirSync(DATA).filter((d) => existsSync(join(DATA, d)) && readdirSync(join(DATA, d)).length)) {
    const r = auditEdition(e);
    console.log(`${e}: ${r.verses} verses, ${r.findings.length} findings`);
    for (const f of r.findings.slice(0, 15)) console.log(`   ${f.where}: ${f.problem}`);
    bad += r.findings.length;
  }
  process.exit(bad ? 1 : 0);
}
