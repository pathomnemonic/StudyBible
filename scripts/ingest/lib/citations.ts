import { BOOKS } from '../../../src/lib/canon';
import { parseRefs, type Ref } from '../../../src/lib/refs';
import { convertRef } from '../../../src/lib/versification';
import { plainNumerals } from '../../../src/lib/readable';

/**
 * Scripture citations written out in running text ("Matt. xvi. 18", "John 3:16", "Ps. xxii. 1", "1 Cor. 11:24-26"), for works whose
 * source has no scripture tags. Roman numerals are turned into numbers first; each citation is read in English (KJV-style) numbering,
 * which is how the translators of these texts cite (checked for the Psalms against the verse text), and converted to the anchor.
 */
const names = (() => {
  const set = new Set<string>();
  for (const b of BOOKS) {
    for (const n of [b.name, b.abbr, b.douayName ?? '', ...b.aliases]) {
      const t = n.replace(/\.$/, '').trim();
      if (t.length < 2) continue;
      set.add(t[0].toUpperCase() + t.slice(1));
    }
  }
  for (const x of ['Psalm', 'Psalms', 'Matt', 'Mk', 'Lk', 'Jn', 'Rom', 'Cor', 'Gal', 'Eph', 'Phil', 'Col', 'Thess', 'Tim', 'Heb', 'Jas', 'Pet', 'Apoc', 'Rev', 'Gen', 'Exod', 'Ex', 'Lev', 'Num', 'Deut', 'Prov', 'Eccl', 'Eccles', 'Ecclus', 'Wisd', 'Isa', 'Jer', 'Ezek', 'Dan', 'Hos', 'Mic', 'Zech', 'Mal', 'Macc']) set.add(x);
  return [...set].sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
})();
const CITE = new RegExp(`(?<![A-Za-z])((?:[1-3]\\.?\\s?)?(?:${names.join('|')}))(\\.?)\\s*(\\d{1,3})\\s*[:.]\\s*(\\d{1,3})(?:\\s*[-–]\\s*(\\d{1,3}))?(?![\\d])`, 'g');

export function plainCitations(text: string): Ref[] {
  const t = plainNumerals(text);
  const out: Ref[] = [];
  for (const m of t.matchAll(CITE)) {
    const short = m[1].replace(/^[1-3]\.?\s?/, '').length <= 3;
    if (short && !m[2]) continue; // "Is 3:4", "Am 2:1" in ordinary prose need the full stop of an abbreviation
    const p = parseRefs(`${m[1]}${m[2]} ${m[3]}:${m[4]}${m[5] ? '-' + m[5] : ''}`);
    if (!p.ok) continue;
    for (const { ref } of p.refs) {
      const a = convertRef('kjv', 'vulgate', ref).ref;
      out.push(a);
    }
  }
  return out;
}
