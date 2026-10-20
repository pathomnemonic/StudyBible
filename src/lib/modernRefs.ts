const ROMAN: Record<string, number> = { i: 1, v: 5, x: 10, l: 50, c: 100 };
const fromRoman = (s: string): number => {
  let n = 0;
  const t = s.toLowerCase();
  for (let i = 0; i < t.length; i++) {
    const v = ROMAN[t[i]];
    const nx = ROMAN[t[i + 1]] ?? 0;
    n += v < nx ? -v : v;
  }
  return n;
};
const isRoman = (s: string) => /^(?:c{0,2})(?:xc|xl|l?x{0,3})(?:ix|iv|v?i{0,3})$/i.test(s) && s.length > 0;

const BOOKS = 'Gen|Genesis|Exod|Ex|Exodus|Lev|Levit|Num|Numb|Deut|Josue|Jos|Judg|Judges|Ruth|Kings|Reg|Par|Paral|Chron|Esd|Esdr|Neh|Tob|Tobias|Judith|Esth|Job|Ps|Psal|Psalm|Prov|Eccl|Eccles|Cant|Canticle|Wis|Wisd|Ecclus|Eccli|Sir|Isa|Is|Isai|Jer|Jerem|Lam|Bar|Baruch|Ezech|Ezek|Dan|Osee|Os|Joel|Amos|Abd|Jon|Jonas|Mich|Nah|Nahum|Hab|Habac|Soph|Agg|Zach|Zech|Mal|Mach|Macc|Matt|Mat|Mark|Marc|Luke|Luc|John|Joan|Acts|Rom|Cor|Gal|Eph|Ephes|Phil|Philip|Col|Coloss|Thess|Tim|Tit|Titus|Philem|Heb|Hebr|Jam|James|Pet|Peter|Jude|Apoc|Rev|Revel|chap|chapt|ch|Chap|Ch|Ibid|ibid';
const RE = new RegExp(`\\b((?:[1-3]\\.?\\s)?(?:${BOOKS}))(\\.?)\\s+([ivxlc]{1,7})\\.(?:\\s?(\\d{1,3})\\b)?`, 'g');

const WORKS = new RegExp('\\b(lib|libr|hom|homil|tract|trac|tom|serm|ser|ep|epist|cap|quaest|quæst|art|orat|disp|part|can|sect|c|q)(\\.?)\\s+([ivxlc]{1,7})\\b(?=[.,;:)\\s])', 'gi');

/** Old commentaries cite chapters in Roman numerals ("Matt. xvi. 18", "chap. xiv."). Print them the way a modern reader expects ("Matt. 16:18", "chap. 14"). */
export function modernRefs(text: string): string {
  return text.replace(WORKS, (m, w: string, dot: string, roman: string) => (isRoman(roman) && !/^[cq]$/i.test(w) && fromRoman(roman) ? `${w}${dot} ${fromRoman(roman)}` : m)).replace(RE, (m, book: string, dot: string, roman: string, verse?: string) => {
    if (!isRoman(roman)) return m;
    const c = fromRoman(roman);
    if (!c || c > 150) return m;
    return `${book}${dot} ${c}${verse ? ':' + verse : ''}${verse ? '' : '.'}`;
  });
}
