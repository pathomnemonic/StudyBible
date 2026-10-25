import { useMemo } from 'react';
import { MOTIFS } from './motifs';

/** words in a chapter → the drawing that suits them, with how much each word counts */
const SIGNS: [RegExp, string, number][] = [
  [/\b(sea|waves?|ship|boat|boats|lake|galilee|storm|shore)\b/g, 'boat', 2], [/\b(waters?|flood|deep)\b/g, 'waves', 1.5], [/\b(mount|mountain|mountains|hill|hills|sinai|zion|horeb|carmel|ararat)\b/g, 'mountain', 2],
  [/\b(sheep|flock|flocks|shepherds?|pasture)\b/g, 'sheep', 2.5], [/\b(lamb|lambs|passover)\b/g, 'lamb', 3], [/\b(bread|loaf|loaves|manna|baked)\b/g, 'loaves', 3], [/\b(fish|fishermen|fishing|nets?)\b/g, 'fish', 2], [/\b(wine|vine|vineyard|vineyards|grapes?|cup)\b/g, 'vine', 2],
  [/\b(seeds?|sow|sower|sowed|sowing|harvest|reap|grain|wheat|barley|field|fields)\b/g, 'wheat', 2], [/\b(light|lamp|lamps|lampstand|shine|shines|darkness)\b/g, 'lamp', 1.5], [/\b(fire|flame|flames|burn|burned|burning|burnt)\b/g, 'flame', 2],
  [/\b(cross|crucify|crucified|crucifixion|golgotha|calvary)\b/g, 'calvary', 4], [/\b(tomb|grave|buried|burial|sepulchre|stone was rolled)\b/g, 'tomb', 2.5], [/\b(dove|doves|pigeons?)\b/g, 'dove', 3], [/\b(spirit)\b/g, 'dove', 0.5],
  [/\b(king|kings|kingdom|throne|reign|reigned|crown)\b/g, 'crown', 1], [/\b(sword|swords|battle|war|army|armies|spear|shield|fought|fight)\b/g, 'sword', 1.5], [/\b(temple|altar|altars|offering|offerings|sacrifice|sacrifices|priest|priests|incense)\b/g, 'altar', 1.5],
  [/\b(tent|tents|tabernacle|dwelling)\b/g, 'tent', 2], [/\b(ark of the covenant|ark of god|mercy seat|cherubim)\b/g, 'ark', 4], [/\b(city|cities|wall|walls|gate|gates|jerusalem|babylon|tower|nineveh|jericho)\b/g, 'city', 1], [/\b(tree|trees|fig|figs|olive|olives|cedar|oak|branches)\b/g, 'tree', 1.5],
  [/\b(stars?|heavens?|angel|angels|gabriel|host)\b/g, 'star', 1], [/\b(moon|night|dream|dreams)\b/g, 'moon', 1], [/\b(sun|daylight|dawn|morning)\b/g, 'sun', 1], [/\b(stones?|rock|rocks|cornerstone)\b/g, 'rock', 1], [/\b(well|spring|fountain)\b/g, 'well', 2], [/\b(jars?|pitcher|pitchers|pots?|vessels?)\b/g, 'jar', 2],
  [/\b(river|rivers|jordan|nile|euphrates|baptized|baptize|baptism)\b/g, 'river', 2], [/\b(desert|wilderness|wander|wandered|wandering|sand)\b/g, 'desert', 2], [/\b(law|laws|commandments?|statutes|ordinances|decrees|precepts)\b/g, 'tablets', 1.5], [/\b(book|books|scroll|scrolls|written|write|wrote|writing|letter|letters)\b/g, 'scroll', 1],
  [/\b(harp|harps|lyre|sing|sang|song|songs|psalm|psalms|praise|praises|trumpets?|horns?|music|dance)\b/g, 'lyre', 1], [/\b(serpent|serpents|snake|snakes)\b/g, 'serpent', 3], [/\b(lion|lions|bear|wolf|wolves|beast|beasts)\b/g, 'lion', 2], [/\b(rainbow|noah|covenant with every)\b/g, 'rainbow', 4],
  [/\b(ladder|ascending|descending)\b/g, 'ladder', 4], [/\b(chains?|prison|prisoner|prisoners|bound|fetters|captive|captives|captivity)\b/g, 'chains', 2], [/\b(pray|prayed|prayer|prayers|praying)\b/g, 'praying', 1], [/\b(eyes|blind|see|saw|sight|vision|visions|watchman)\b/g, 'eye', 0.7],
  [/\b(heart|hearts|love|loved|beloved)\b/g, 'heart', 0.6], [/\b(cloud|clouds)\b/g, 'cloud', 1.5], [/\b(thunder|lightning|tempest)\b/g, 'lightning', 3], [/\b(wings|eagle|eagles|bird|birds|ravens?)\b/g, 'wings', 2], [/\b(manger|swaddling|born|birth|bethlehem|mary|infant)\b/g, 'manger', 1],
  [/\b(door|doors|knock|key|keys|open)\b/g, 'key', 1], [/\b(book of life|hope|anchor|steadfast)\b/g, 'anchor', 1], [/\b(oil|anoint|anointed|anointing)\b/g, 'jar', 1], [/\b(olive branch|peace)\b/g, 'olive', 1], [/\b(rams?|goats?|bull|bulls|oxen|calf|calves)\b/g, 'altar', 1],
  [/\b(palm|palms|date)\b/g, 'palm', 1.5], [/\b(hands?|laid his hands|touched|heal|healed|healing|leper|lepers|sick)\b/g, 'hands', 1], [/\b(rain|rains|thirst|drought|dew)\b/g, 'cloud', 1], [/\b(sacrificed isaac|isaac)\b/g, 'altar', 1],
];

/** what a book is about, for chapters whose words give little away */
const BOOK_DEFAULT: Record<string, string[]> = {
  GEN: ['star', 'tree', 'waves'], EXO: ['desert', 'tablets', 'flame'], LEV: ['altar', 'lamb', 'scroll'], NUM: ['tent', 'desert', 'star'], DEU: ['mountain', 'tablets', 'scroll'], JOS: ['city', 'sword', 'river'], JDG: ['sword', 'trumpet', 'tent'], RUT: ['wheat', 'heart', 'tree'],
  '1SA': ['lyre', 'sheep', 'crown'], '2SA': ['crown', 'lyre', 'city'], '1KI': ['city', 'crown', 'flame'], '2KI': ['flame', 'wings', 'crown'], '1CH': ['scroll', 'crown', 'lyre'], '2CH': ['altar', 'city', 'crown'], EZR: ['city', 'scroll', 'altar'], NEH: ['city', 'gate', 'scroll'],
  TOB: ['fish', 'wings', 'star'], JDT: ['sword', 'city', 'praying'], EST: ['crown', 'scroll', 'praying'], JOB: ['cloud', 'lightning', 'praying'], PSA: ['lyre', 'sheep', 'sun'], PRO: ['lamp', 'book', 'tree'], ECC: ['sun', 'wind', 'book'], SNG: ['heart', 'vine', 'palm'], WIS: ['lamp', 'star', 'book'], SIR: ['book', 'lamp', 'tree'],
  ISA: ['scroll', 'flame', 'mountain'], JER: ['jar', 'scroll', 'city'], LAM: ['city', 'praying', 'cloud'], BAR: ['scroll', 'star', 'city'], EZK: ['wings', 'scroll', 'river'], DAN: ['lion', 'star', 'crown'], HOS: ['heart', 'vine', 'wheat'], JOL: ['wheat', 'trumpet', 'flame'], AMO: ['wheat', 'sheep', 'scroll'], OBA: ['mountain', 'wings'], JON: ['fish', 'boat', 'city'],
  MIC: ['mountain', 'olive', 'scroll'], NAM: ['city', 'lightning'], HAB: ['eye', 'mountain', 'scroll'], ZEP: ['sun', 'cloud'], HAG: ['altar', 'tent'], ZEC: ['lamp', 'olive', 'eye'], MAL: ['altar', 'scroll', 'sun'], '1MA': ['sword', 'altar', 'lamp'], '2MA': ['sword', 'altar', 'praying'],
  MAT: ['star', 'mountain', 'book'], MRK: ['boat', 'hands', 'fish'], LUK: ['manger', 'sheep', 'lamp'], JHN: ['lamp', 'dove', 'vine'], ACT: ['flame', 'boat', 'scroll'], ROM: ['scroll', 'heart', 'cross'], '1CO': ['cup', 'heart', 'scroll'], '2CO': ['jar', 'scroll', 'heart'], GAL: ['chains', 'dove', 'scroll'], EPH: ['sword', 'dove', 'star'],
  PHP: ['crown', 'heart', 'scroll'], COL: ['star', 'scroll', 'crown'], '1TH': ['trumpet', 'star', 'scroll'], '2TH': ['trumpet', 'scroll'], '1TI': ['scroll', 'book', 'crown'], '2TI': ['sword', 'crown', 'scroll'], TIT: ['scroll', 'tree'], PHM: ['scroll', 'heart', 'chains'], HEB: ['anchor', 'altar', 'tent'],
  JAS: ['tree', 'scroll', 'heart'], '1PE': ['rock', 'flame', 'lamb'], '2PE': ['star', 'flame', 'scroll'], '1JN': ['lamp', 'heart', 'scroll'], '2JN': ['scroll', 'heart'], '3JN': ['scroll', 'lamp'], JUD: ['scroll', 'star'], REV: ['throne', 'lamb', 'star'],
};

function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}

/** Which drawings a chapter gets, strongest first (exported for tests). */
export function motifsFor(book: string, text: string, n = 3): string[] {
  const t = text.toLowerCase();
  const score = new Map<string, number>();
  for (const [re, id, w] of SIGNS) { const c = (t.match(re) ?? []).length; if (c && MOTIFS[id]) score.set(id, (score.get(id) ?? 0) + Math.min(c, 6) * w); }
  const picked = [...score.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const out = picked.slice(0, n);
  for (const id of BOOK_DEFAULT[book] ?? []) if (out.length < n && MOTIFS[id] && !out.includes(id)) out.push(id);
  for (const id of ['star', 'lamp', 'scroll']) if (out.length < n && !out.includes(id)) out.push(id);
  return out;
}

const W = 560, H = 58;
/** A line drawing for the top of a chapter: what it is about, arranged differently for every chapter. */
export default function ChapterArt({ book, chapter, text }: { book: string; chapter: number; text: string }) {
  const art = useMemo(() => {
    const r = rng(`${book}.${chapter}`);
    const ids = motifsFor(book, text, 3);
    const k = ids.length;
    // the strongest drawing sits near the middle and a little larger; the others fill out the sides
    const order = k === 3 ? [1, 0, 2].map((i) => ids[i]) : ids;
    const slots = k === 3 ? [100, 280, 460] : k === 2 ? [170, 390] : [280];
    const items = order.map((id, i) => {
      const big = (k === 3 ? i === 1 : i === 0) ? 1.1 : 0.85;
      const sc = (big * (0.92 + r() * 0.2)) * (H - 10) / 48;
      const x = slots[i] + (r() - 0.5) * 50 - 24 * sc;
      const y = 3 + (r() - 0.5) * 3;
      return { id, tf: `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sc.toFixed(3)}) ${r() < 0.2 ? `translate(48 0) scale(-1 1)` : ''}` };
    });
    // a horizon with its own rises and falls
    let d = `M0 ${H - 4}`;
    const pts = 9;
    for (let i = 1; i <= pts; i++) d += ` Q${((i - 0.5) * W) / pts} ${H - 4 - r() * 6} ${(i * W) / pts} ${H - 4 - (r() - 0.5) * 3}`;
    const dots = Array.from({ length: 7 }, () => ({ x: 14 + r() * (W - 28), y: 6 + r() * 30, s: 1 + r() * 1.6 }));
    return { items, d, dots };
  }, [book, chapter, text]);
  return (
    <svg className="chapter-art" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="" aria-hidden="true" preserveAspectRatio="xMinYMid meet">
      <path d={art.d} />
      {art.dots.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.s} className="dot" />)}
      {art.items.map((it, i) => (
        <g key={i} transform={it.tf}>{MOTIFS[it.id].map((d, j) => <path key={j} d={d} />)}</g>
      ))}
    </svg>
  );
}
