/** Choosing the picture behind a daily card: from the paintings and engravings the app already holds, by relevance to the day, never repeating inside a window. */
export interface ArtWork { id: string | number; theme: string; title: string; artist: string; date?: string; credit: string; file: string; page?: string; source?: string; refs?: string[] }

export interface ArtHints {
  /** the verse's book code and chapter (the card's verse), when it has one */
  book?: string; chapter?: number;
  /** words that name the day: the card's word, the verse text, the saint, the day's name */
  words: string[];
  /** the day's saint, when the card carries one (a name in a picture's title counts) */
  saint?: string;
  season?: 'advent' | 'christmas' | 'lent' | 'triduum' | 'easter' | 'ordinary';
  /** makes the choice among equals the same for the same date on every device */
  seed: string;
}

/** The scenes that suit each season, matched against a work's theme (not its title, so "Joseph" the Egyptian vizier is not mistaken for Joseph of Nazareth). */
const SEASON: Record<string, string[]> = {
  advent: ['annunciation', 'visitation', 'madonna', 'john the baptist', 'zechariah'],
  christmas: ['nativity', 'magi', 'madonna', 'flight into egypt', 'presentation', 'childhood'],
  lent: ['temptation', 'prodigal', 'good samaritan', 'moses', 'baptism', 'parables', 'jonah'],
  triduum: ['last supper', 'passion', 'crucifixion', 'entombment', 'lamentation'],
  easter: ['resurrection', 'emmaus', 'ascension', 'acts', 'peter'],
  ordinary: ['teaching of jesus', 'parables', 'miracles', 'gospel ministry', 'psalms', 'creation', 'wisdom', 'evangelists'],
};
/** the illuminated initials of the prophets (Gothic Bible) are quiet and suit Advent */
const PROPHET_INITIAL = /^(isaiah|jeremiah|ezekiel|daniel|hosea|joel|amos|obadiah|jonah|micah|nahum|habakkuk|zephaniah|haggai|zechariah|malachi): initial/i;
/** words the daily cards use, and the scenes that illustrate them */
export const WORD_SCENES: Record<string, string[]> = {
  watch: ['wise and foolish', 'shepherds', 'vigil'], seek: ['lost sheep', 'good shepherd', 'seeking'], mercy: ['prodigal', 'samaritan'], rest: ['rest', 'flight into egypt'],
  peace: ['peace', 'dove', 'olive'], light: ['light', 'star', 'candle'], charity: ['samaritan', 'widow', 'alms', 'charity', 'poor'],
};

/** Scenes of violence, death, punishment or hanging heads do not belong behind a daily devotion. They stay in the library and in the manual picker. */
const GRIM = /(death|dead|destroy|slain|slay|kill|murder|massacre|burn|plague|smit|torment|execut|hang|behead|head of|heads of|martyr|famine|devour|punish|vengeance|bears|jezebel|wrath|beat|scourg|stone|stoning|drown|flood|corpse|den of|leprosy|idol|salome|heliodorus|cast down|spewed|whale|swallow|slaughter|war|battle|sword|blood|wound|rape|abduct|fall of|sin of|temptation of eve|serpent)/i;
export const suitable = (w: ArtWork) => !GRIM.test(w.title) && !GRIM.test(w.theme);

const INFANCY = ['nativity', 'magi', 'flight into egypt', 'presentation', 'childhood', 'shepherd'];
const PASSION = ['passion', 'crucifixion', 'entombment', 'lamentation', 'arrest', 'denial', 'last supper', 'calvary', 'pietà'];
const EASTER = ['resurrection', 'emmaus', 'ascension'];
/** scenes that belong to another part of the year; kept out of automatic picks unless the passage or the card's word calls for them */
const OFF: Record<string, string[]> = {
  advent: [...INFANCY, ...PASSION, ...EASTER], christmas: [...PASSION, ...EASTER], lent: [...INFANCY, ...EASTER], triduum: [...INFANCY, ...EASTER],
  easter: [...INFANCY, ...PASSION], ordinary: [...INFANCY, ...PASSION, ...EASTER],
};

const tokens = (s: string) => s.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter((t) => t.length > 3);
const STOP = new Set(['that', 'with', 'this', 'from', 'have', 'shall', 'unto', 'thou', 'thee', 'your', 'them', 'they', 'will', 'which', 'were', 'when', 'been', 'into', 'upon', 'also', 'there', 'their', 'then', 'what', 'saint', 'week', 'first', 'second', 'third', 'fourth', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'father', 'house', 'world', 'forth', 'down', 'again', 'himself', 'herself', 'because', 'therefore', 'behold', 'before', 'after', 'every', 'these', 'those', 'being', 'doth', 'hath', 'make', 'made', 'come', 'came']);

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };

/** the book and chapters a work's own passage references name ("Genesis 1:3-5" -> GEN, chapter 1), from its refs */
export function artChapters(w: ArtWork, bookOf: (name: string) => string | null): { book: string; c1: number; c2: number }[] {
  const out: { book: string; c1: number; c2: number }[] = [];
  for (const r of w.refs ?? []) {
    const m = /^(.+?)\s+(\d+)(?::[\d,\-–a-z ]+)?(?:[–-](\d+))?/.exec(r.trim());
    if (!m) continue;
    const book = bookOf(m[1]);
    if (book) out.push({ book, c1: +m[2], c2: m[3] && !r.includes(':') ? +m[3] : +m[2] });
  }
  return out;
}

export function scoreWork(w: ArtWork, h: ArtHints, bookOf: (name: string) => string | null): { score: number; why: string[]; eligible: boolean } {
  let score = 0;
  const why: string[] = [];
  const hay = ` ${w.theme} ${w.title} `.toLowerCase();
  let called = false; // the passage or the word itself calls for this picture, so the season does not rule it out
  if (h.book && h.chapter !== undefined) {
    const cs = artChapters(w, bookOf);
    if (cs.some((c) => c.book === h.book && h.chapter! >= c.c1 && h.chapter! <= c.c2)) { score += 50; why.push('shows this passage'); called = true; }
  }
  const w0 = (h.words[0] ?? '').toLowerCase().trim();
  const mine = new Set([...tokens(w0), ...(WORD_SCENES[w0] ?? [])].filter((t) => !STOP.has(t)));
  const hit = [...mine].filter((t) => hay.includes(t.includes(' ') ? t : ` ${t}`));
  if (hit.length) { score += 40; why.push(`its title names “${hit[0]}”`); called = true; }
  const who = h.saint ? tokens(h.saint.split(',')[0].split(' of ')[0]).filter((t) => !STOP.has(t) && t.length > 4) : [];
  if (who.some((t) => hay.includes(t))) { score += 30; why.push('the day\u2019s saint'); called = true; }
  const sw = SEASON[h.season ?? 'ordinary'] ?? [];
  const suits = sw.some((x) => ` ${w.theme}`.toLowerCase().includes(x)) || (h.season === 'advent' && PROPHET_INITIAL.test(w.title));
  if (suits) { score += 15; why.push(`suits ${h.season ?? 'the season'}`); }
  const verseHit = h.words.slice(1).flatMap(tokens).filter((t) => t.length >= 6 && !STOP.has(t) && hay.includes(` ${t}`));
  if (verseHit.length) { score += Math.min(12, 4 * new Set(verseHit).size); why.push(`echoes the verse (${verseHit[0]})`); }
  const off = (OFF[h.season ?? 'ordinary'] ?? []).some((x) => hay.includes(x));
  if (called && off && !hit.length && !why.includes('shows this passage')) { /* a saint's name alone does not override the season */ }
  score += hash(h.seed + String(w.id)) * 5; // a date-fixed tie-break so ties do not always fall to the same picture
  return { score, why, eligible: called || (suits && !off) || (suits && h.season === 'advent') };
}

/** The best picture for the day that has not been used in the last `window` picks. `used` is newest last. Falls back to the least recently used when everything suitable has been used. */
export function pickArt(works: ArtWork[], h: ArtHints, used: (string | number)[], bookOf: (name: string) => string | null, window = 150, skip: (string | number)[] = []): { work: ArtWork; why: string[] } | null {
  const recent = new Set(used.slice(-window).map(String));
  const nope = new Set(skip.map(String));
  const ok = works.filter((w) => suitable(w) && !nope.has(String(w.id)) && scoreWork(w, h, bookOf).eligible);
  const fresh = ok.filter((w) => !recent.has(String(w.id)));
  const pool = fresh.length ? fresh : ok.sort((a, b) => used.map(String).lastIndexOf(String(a.id)) - used.map(String).lastIndexOf(String(b.id)));
  if (!fresh.length) return pool[0] ? { work: pool[0], why: ['every suitable picture was used lately: this is the one used longest ago'] } : null;
  let best: { work: ArtWork; why: string[]; score: number } | null = null;
  for (const w of pool) {
    const s = scoreWork(w, h, bookOf);
    if (!best || s.score > best.score) best = { work: w, why: s.why, score: s.score };
  }
  return best && { work: best.work, why: best.why };
}
