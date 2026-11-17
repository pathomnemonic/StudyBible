/* How a typed answer is reduced to a comparison form. Pure, with no data imports, so the build script and the game share it. */

const ROMAN: Record<string, string> = { i: '1', ii: '2', iii: '3', iv: '4', v: '5', vi: '6', vii: '7', viii: '8', ix: '9', x: '10', xi: '11', xii: '12', xiii: '13', xiv: '14', xv: '15', xvi: '16', xvii: '17', xviii: '18', xix: '19', xx: '20', xxi: '21', xxii: '22', xxiii: '23' };
const ORDINAL: Record<string, string> = { first: '1', second: '2', third: '3', fourth: '4', fifth: '5', sixth: '6', seventh: '7', eighth: '8', ninth: '9', tenth: '10', '1st': '1', '2nd': '2', '3rd': '3', '4th': '4', '5th': '5', '6th': '6' };
/** Words that never decide which answer is meant. */
const COMMON_IGNORED = new Set(['the', 'of', 'our', 'and', 'saint', 'saints', 'st', 'pope', 'a', 'an']);

/**
 * The comparison form of a string: lower case, no accents, no punctuation (an apostrophe is dropped, not turned into a gap), no little words,
 * Roman numerals and ordinals as digits, a plural "s" removed, and the remaining words sorted so that word order does not matter.
 * `ignore` adds words that carry no meaning for one prompt ("council" in "Council of Trent").
 */
export function deepTokens(value: string, ignore: readonly string[] = []): string[] {
  const words = value
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/œ/g, 'oe')
    .replace(/['’`]/g, '')
    .replace(/&/g, ' and ')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const out: string[] = [];
  for (const w of words) {
    if (COMMON_IGNORED.has(w) || ignore.includes(w)) continue;
    const n = ORDINAL[w] ?? ROMAN[w] ?? w;
    out.push(/^\d+$/.test(n) ? n : n.length > 3 && n.endsWith('s') && !n.endsWith('ss') ? n.slice(0, -1) : n);
  }
  return out.sort();
}
