// Shared by the build, the review script and tests/chant.test.ts: how a GABC score's sung words compare, IN ORDER, with a hymn's Latin text.
import { createHash } from 'node:crypto';

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/æ/g, 'ae').replace(/œ/g, 'oe').replace(/v/g, 'u').replace(/j/g, 'i').match(/[a-z]+/g) ?? [];
export const words = norm;
/** The words a GABC file sings: music section only, tags/braces/notation removed. */
export const sungWords = (gabc) => norm(gabc.split('%%').slice(1).join('%%').replace(/<[^>]*>/g, '').replace(/\{([^}]*)\}/g, '$1').replace(/\([^)]*\)/g, '').replace(/~/g, ' '));
export const sha256 = (s) => createHash('sha256').update(s).digest('hex');

/**
 * Longest common subsequence of the two word lists, with the alignment: which hymn words were sung (in order) and which sung words are not in the hymn.
 * `repeats` lets a legitimately repeated text (a refrain sung twice) be compared against the hymn text laid end to end that many times.
 */
export function align(sung, hymn, repeats = 1) {
  const t = Array.from({ length: repeats }, () => hymn).flat();
  const m = sung.length, n = t.length;
  const d = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let a = 1; a <= m; a++) for (let b = 1; b <= n; b++) d[a][b] = sung[a - 1] === t[b - 1] ? d[a - 1][b - 1] + 1 : Math.max(d[a - 1][b], d[a][b - 1]);
  const inT = new Set(), inS = new Set();
  let a = m, b = n;
  while (a > 0 && b > 0) {
    if (sung[a - 1] === t[b - 1]) { inT.add(b - 1); inS.add(a - 1); a--; b--; } else if (d[a - 1][b] >= d[a][b - 1]) a--; else b--;
  }
  const lcs = d[m][n];
  return {
    sungWords: m, hymnWords: t.length, lcs,
    /** share of the sung words that are the hymn's words in the hymn's order */
    ordered: m ? lcs / m : 0,
    /** share of the hymn's words that the score sings (a low value means a missing or truncated portion) */
    coverage: t.length ? lcs / t.length : 0,
    unsung: t.filter((_, k) => !inT.has(k)),
    extra: sung.filter((_, k) => !inS.has(k)),
  };
}
const r2 = (x) => Math.floor(x * 100) / 100;
/** One review record for a score, from its present state. Written only by `review.mjs --write` after a person has looked at the comparison. */
export function reviewEntry(item, hymn, prev = {}) {
  const al = align(sungWords(item.gabc), words(hymn.latin.text.join(' ')), prev.textRepeats ?? 1);
  return {
    hymnId: item.hymnId,
    source: 'GregoBase',
    sourceUrl: `https://gregobase.selapa.net/chant.php?id=${item.gregobaseId}`,
    gregobaseId: item.gregobaseId,
    gabcSha256: sha256(item.gabc),
    provenance: { name: item.name, book: item.book, transcriber: item.transcriber, mode: item.mode, officePart: item.officePart },
    provenanceNote: item.book ? undefined : 'The GregoBase header names no printed book for this score.',
    textRepeats: prev.textRepeats ?? 1,
    // floors are the measured values (rounded down); a change that lowers either fails the test
    minOrdered: r2(al.ordered), minCoverage: r2(al.coverage),
    unsungInScore: al.unsung, sungNotInText: al.extra,
    explanation: prev.explanation ?? 'UNREVIEWED: compare the lists above with the printed hymn before accepting.',
    reviewedOn: prev.reviewedOn,
    reviewMethod: prev.reviewMethod,
  };
}
