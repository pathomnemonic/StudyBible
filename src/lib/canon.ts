/**
 * The Catholic canon: 73 books, in the traditional Catholic (NABRE-style) order.
 *
 * Book ids are the three-character USFM/Paratext codes. Chapter counts follow the
 * Clementine Vulgate, which is the anchor numbering system of this app (see
 * docs/ARCHITECTURE.md → "Stable Scripture identifiers"). Where the Vulgate differs
 * from the Hebrew/English tradition (Psalms, Joel, Malachi, …) the difference is
 * handled in `versification.ts`, never by silently dropping or merging books.
 */

export type Testament = 'OT' | 'NT';

export interface Book {
  id: string;
  name: string;
  /** Short label used in compact references. */
  abbr: string;
  testament: Testament;
  group: string;
  /** True for the deuterocanonical books (and books that carry deuterocanonical additions). */
  deutero?: boolean;
  /** Chapters in the Vulgate anchor numbering. */
  chapters: number;
  /** Traditional Douay-Rheims / Vulgate name, when it differs. */
  douayName?: string;
  /** Extra spellings accepted by the reference parser. */
  aliases: string[];
  /** Human-readable note about canon / numbering, shown in the UI when relevant. */
  note?: string;
}

const B = (
  id: string,
  name: string,
  abbr: string,
  testament: Testament,
  group: string,
  chapters: number,
  aliases: string[],
  extra: Partial<Book> = {},
): Book => ({ id, name, abbr, testament, group, chapters, aliases, ...extra });

export const BOOKS: Book[] = [
  // Pentateuch
  B('GEN', 'Genesis', 'Gn', 'OT', 'Pentateuch', 50, ['gen', 'ge', 'gn']),
  B('EXO', 'Exodus', 'Ex', 'OT', 'Pentateuch', 40, ['exod', 'exo', 'ex']),
  B('LEV', 'Leviticus', 'Lv', 'OT', 'Pentateuch', 27, ['lev', 'le', 'lv']),
  B('NUM', 'Numbers', 'Nm', 'OT', 'Pentateuch', 36, ['num', 'nu', 'nm', 'nb']),
  B('DEU', 'Deuteronomy', 'Dt', 'OT', 'Pentateuch', 34, ['deut', 'deu', 'dt']),
  // Historical books
  B('JOS', 'Joshua', 'Jos', 'OT', 'Historical Books', 24, ['josh', 'jos', 'jsh'], { douayName: 'Josue', }),
  B('JDG', 'Judges', 'Jgs', 'OT', 'Historical Books', 21, ['judg', 'jdg', 'jgs', 'jg']),
  B('RUT', 'Ruth', 'Ru', 'OT', 'Historical Books', 4, ['rut', 'ru', 'rth']),
  B('1SA', '1 Samuel', '1 Sm', 'OT', 'Historical Books', 31, ['1 sam', '1sam', '1 sm', '1 samuel', 'i samuel', 'first samuel'], { douayName: '1 Kings' }),
  B('2SA', '2 Samuel', '2 Sm', 'OT', 'Historical Books', 24, ['2 sam', '2sam', '2 sm', '2 samuel', 'ii samuel', 'second samuel'], { douayName: '2 Kings' }),
  B('1KI', '1 Kings', '1 Kgs', 'OT', 'Historical Books', 22, ['1 kgs', '1kgs', '1 ki', '1 kings', 'i kings', 'first kings', '3 kings', '3 kgs', 'iii kings'], { douayName: '3 Kings' }),
  B('2KI', '2 Kings', '2 Kgs', 'OT', 'Historical Books', 25, ['2 kgs', '2kgs', '2 ki', '2 kings', 'ii kings', 'second kings', '4 kings', '4 kgs', 'iv kings'], { douayName: '4 Kings' }),
  B('1CH', '1 Chronicles', '1 Chr', 'OT', 'Historical Books', 29, ['1 chr', '1chr', '1 ch', '1 chron', '1 chronicles', 'i chronicles', '1 paralipomenon', '1 par'], { douayName: '1 Paralipomenon' }),
  B('2CH', '2 Chronicles', '2 Chr', 'OT', 'Historical Books', 36, ['2 chr', '2chr', '2 ch', '2 chron', '2 chronicles', 'ii chronicles', '2 paralipomenon', '2 par'], { douayName: '2 Paralipomenon' }),
  B('EZR', 'Ezra', 'Ezr', 'OT', 'Historical Books', 10, ['ezra', 'ezr', '1 esdras', '1 esd', '1 es'], { douayName: '1 Esdras' }),
  B('NEH', 'Nehemiah', 'Neh', 'OT', 'Historical Books', 13, ['neh', 'ne', '2 esdras', '2 esd'], { douayName: '2 Esdras' }),
  B('TOB', 'Tobit', 'Tb', 'OT', 'Historical Books', 14, ['tob', 'tb', 'tobias'], { deutero: true, douayName: 'Tobias' }),
  B('JDT', 'Judith', 'Jdt', 'OT', 'Historical Books', 16, ['jdt', 'judith', 'jth'], { deutero: true }),
  B('EST', 'Esther', 'Est', 'OT', 'Historical Books', 16, ['esth', 'est', 'es'], {
    deutero: true,
    note: 'Includes the Greek additions (Vulgate Esther 10:4–16:24), which Catholic Bibles receive as canonical. Modern editions letter these additions A–F; Vulgate/Douay numbers them as chapters 11–16.',
  }),
  B('1MA', '1 Maccabees', '1 Mc', 'OT', 'Historical Books', 16, ['1 macc', '1macc', '1 mc', '1 maccabees', '1 machabees', 'i maccabees'], { deutero: true, douayName: '1 Machabees' }),
  B('2MA', '2 Maccabees', '2 Mc', 'OT', 'Historical Books', 15, ['2 macc', '2macc', '2 mc', '2 maccabees', '2 machabees', 'ii maccabees'], { deutero: true, douayName: '2 Machabees' }),
  // Wisdom books
  B('JOB', 'Job', 'Jb', 'OT', 'Wisdom Books', 42, ['job', 'jb']),
  B('PSA', 'Psalms', 'Ps', 'OT', 'Wisdom Books', 150, ['ps', 'psa', 'psalm', 'pss', 'psalms', 'pslm', 'psm'], {
    note: 'The Vulgate/Douay Psalter is numbered differently from most modern Bibles for Psalms 9–147. The reader always shows both numbers.',
  }),
  B('PRO', 'Proverbs', 'Prv', 'OT', 'Wisdom Books', 31, ['prov', 'pro', 'prv', 'pr']),
  B('ECC', 'Ecclesiastes', 'Eccl', 'OT', 'Wisdom Books', 12, ['eccl', 'ecc', 'qoh', 'qoheleth', 'ec', 'eccles'], { douayName: 'Ecclesiastes' }),
  B('SNG', 'Song of Songs', 'Song', 'OT', 'Wisdom Books', 8, ['song', 'sng', 'sos', 'song of solomon', 'canticle of canticles', 'canticles', 'cant', 'ss'], { douayName: 'Canticle of Canticles' }),
  B('WIS', 'Wisdom', 'Wis', 'OT', 'Wisdom Books', 19, ['wis', 'wisd', 'wisdom of solomon', 'ws'], { deutero: true }),
  B('SIR', 'Sirach', 'Sir', 'OT', 'Wisdom Books', 51, ['sir', 'ecclus', 'ecclesiasticus', 'sirach', 'ben sira'], { deutero: true, douayName: 'Ecclesiasticus' }),
  // Prophets
  B('ISA', 'Isaiah', 'Is', 'OT', 'Prophets', 66, ['isa', 'is', 'isaias'], { douayName: 'Isaias' }),
  B('JER', 'Jeremiah', 'Jer', 'OT', 'Prophets', 52, ['jer', 'jr', 'jeremias'], { douayName: 'Jeremias' }),
  B('LAM', 'Lamentations', 'Lam', 'OT', 'Prophets', 5, ['lam', 'la']),
  B('BAR', 'Baruch', 'Bar', 'OT', 'Prophets', 6, ['bar', 'ba'], {
    deutero: true,
    note: 'Baruch chapter 6 is the Letter of Jeremiah.',
  }),
  B('EZK', 'Ezekiel', 'Ez', 'OT', 'Prophets', 48, ['ezek', 'eze', 'ezk', 'ez', 'ezechiel'], { douayName: 'Ezechiel' }),
  B('DAN', 'Daniel', 'Dn', 'OT', 'Prophets', 14, ['dan', 'dn', 'da'], {
    deutero: true,
    note: 'Includes the Greek additions: the Prayer of Azariah and Song of the Three (3:24–90), Susanna (ch. 13), and Bel and the Dragon (ch. 14).',
  }),
  B('HOS', 'Hosea', 'Hos', 'OT', 'Prophets', 14, ['hos', 'ho', 'osee'], { douayName: 'Osee' }),
  B('JOL', 'Joel', 'Jl', 'OT', 'Prophets', 3, ['joel', 'jol', 'jl'], { note: 'The Vulgate numbers Joel in 3 chapters; Hebrew and most modern Bibles use 4.' }),
  B('AMO', 'Amos', 'Am', 'OT', 'Prophets', 9, ['amos', 'amo', 'am']),
  B('OBA', 'Obadiah', 'Ob', 'OT', 'Prophets', 1, ['obad', 'oba', 'ob', 'abdias'], { douayName: 'Abdias' }),
  B('JON', 'Jonah', 'Jon', 'OT', 'Prophets', 4, ['jon', 'jnh', 'jonas'], { douayName: 'Jonas' }),
  B('MIC', 'Micah', 'Mi', 'OT', 'Prophets', 7, ['mic', 'mi'], { douayName: 'Micheas' }),
  B('NAM', 'Nahum', 'Na', 'OT', 'Prophets', 3, ['nah', 'nam', 'na']),
  B('HAB', 'Habakkuk', 'Hb', 'OT', 'Prophets', 3, ['hab', 'hb', 'habacuc'], { douayName: 'Habacuc' }),
  B('ZEP', 'Zephaniah', 'Zep', 'OT', 'Prophets', 3, ['zeph', 'zep', 'zp', 'sophonias'], { douayName: 'Sophonias' }),
  B('HAG', 'Haggai', 'Hg', 'OT', 'Prophets', 2, ['hag', 'hg', 'aggeus'], { douayName: 'Aggeus' }),
  B('ZEC', 'Zechariah', 'Zec', 'OT', 'Prophets', 14, ['zech', 'zec', 'zc', 'zacharias'], { douayName: 'Zacharias' }),
  B('MAL', 'Malachi', 'Mal', 'OT', 'Prophets', 4, ['mal', 'ml', 'malachias'], { douayName: 'Malachias', note: 'The Vulgate numbers Malachi in 4 chapters; Hebrew and the NABRE use 3.' }),
  // Gospels & Acts
  B('MAT', 'Matthew', 'Mt', 'NT', 'Gospels', 28, ['matt', 'mat', 'mt']),
  B('MRK', 'Mark', 'Mk', 'NT', 'Gospels', 16, ['mark', 'mrk', 'mk', 'mr']),
  B('LUK', 'Luke', 'Lk', 'NT', 'Gospels', 24, ['luke', 'luk', 'lk']),
  B('JHN', 'John', 'Jn', 'NT', 'Gospels', 21, ['john', 'jhn', 'jn']),
  B('ACT', 'Acts of the Apostles', 'Acts', 'NT', 'Acts', 28, ['acts', 'act', 'ac', 'acts of apostles']),
  // Letters
  B('ROM', 'Romans', 'Rom', 'NT', 'Pauline Letters', 16, ['rom', 'ro', 'rm']),
  B('1CO', '1 Corinthians', '1 Cor', 'NT', 'Pauline Letters', 16, ['1 cor', '1cor', '1 co', '1 corinthians', 'i corinthians', 'first corinthians']),
  B('2CO', '2 Corinthians', '2 Cor', 'NT', 'Pauline Letters', 13, ['2 cor', '2cor', '2 co', '2 corinthians', 'ii corinthians', 'second corinthians']),
  B('GAL', 'Galatians', 'Gal', 'NT', 'Pauline Letters', 6, ['gal', 'ga']),
  B('EPH', 'Ephesians', 'Eph', 'NT', 'Pauline Letters', 6, ['eph', 'ep']),
  B('PHP', 'Philippians', 'Phil', 'NT', 'Pauline Letters', 4, ['phil', 'php', 'pp']),
  B('COL', 'Colossians', 'Col', 'NT', 'Pauline Letters', 4, ['col', 'co']),
  B('1TH', '1 Thessalonians', '1 Thes', 'NT', 'Pauline Letters', 5, ['1 thes', '1thes', '1 th', '1 thess', '1 thessalonians', 'i thessalonians']),
  B('2TH', '2 Thessalonians', '2 Thes', 'NT', 'Pauline Letters', 3, ['2 thes', '2thes', '2 th', '2 thess', '2 thessalonians', 'ii thessalonians']),
  B('1TI', '1 Timothy', '1 Tm', 'NT', 'Pauline Letters', 6, ['1 tim', '1tim', '1 tm', '1 ti', '1 timothy', 'i timothy']),
  B('2TI', '2 Timothy', '2 Tm', 'NT', 'Pauline Letters', 4, ['2 tim', '2tim', '2 tm', '2 ti', '2 timothy', 'ii timothy']),
  B('TIT', 'Titus', 'Ti', 'NT', 'Pauline Letters', 3, ['tit', 'ti']),
  B('PHM', 'Philemon', 'Phlm', 'NT', 'Pauline Letters', 1, ['philem', 'phm', 'phlm', 'pm']),
  B('HEB', 'Hebrews', 'Heb', 'NT', 'General Letters', 13, ['heb', 'he']),
  B('JAS', 'James', 'Jas', 'NT', 'General Letters', 5, ['jas', 'jm', 'james']),
  B('1PE', '1 Peter', '1 Pt', 'NT', 'General Letters', 5, ['1 pet', '1pet', '1 pt', '1 pe', '1 peter', 'i peter']),
  B('2PE', '2 Peter', '2 Pt', 'NT', 'General Letters', 3, ['2 pet', '2pet', '2 pt', '2 pe', '2 peter', 'ii peter']),
  B('1JN', '1 John', '1 Jn', 'NT', 'General Letters', 5, ['1 jn', '1jn', '1 jo', '1 john', 'i john']),
  B('2JN', '2 John', '2 Jn', 'NT', 'General Letters', 1, ['2 jn', '2jn', '2 jo', '2 john', 'ii john']),
  B('3JN', '3 John', '3 Jn', 'NT', 'General Letters', 1, ['3 jn', '3jn', '3 jo', '3 john', 'iii john']),
  B('JUD', 'Jude', 'Jude', 'NT', 'General Letters', 1, ['jude', 'jud', 'jd']),
  B('REV', 'Revelation', 'Rv', 'NT', 'Revelation', 22, ['rev', 'rv', 'apoc', 'apocalypse', 'revelation of john', 'revelations'], { douayName: 'Apocalypse' }),
];

export const BOOK_BY_ID: Record<string, Book> = Object.fromEntries(BOOKS.map((b) => [b.id, b]));
export const BOOK_ORDER: Record<string, number> = Object.fromEntries(BOOKS.map((b, i) => [b.id, i]));

export const CANON_SIZE = BOOKS.length; // 73

export const DEUTEROCANONICAL_BOOKS = BOOKS.filter((b) => b.deutero).map((b) => b.id);

export const GROUPS: { name: string; testament: Testament; books: Book[] }[] = (() => {
  const out: { name: string; testament: Testament; books: Book[] }[] = [];
  for (const b of BOOKS) {
    let g = out.find((x) => x.name === b.group);
    if (!g) {
      g = { name: b.group, testament: b.testament, books: [] };
      out.push(g);
    }
    g.books.push(b);
  }
  return out;
})();

export function getBook(id: string): Book {
  const b = BOOK_BY_ID[id];
  if (!b) throw new Error(`Unknown book id: ${id}`);
  return b;
}

/** Previous/next book in canonical order (null at the ends). */
export function adjacentBook(id: string, dir: 1 | -1): Book | null {
  const i = BOOK_ORDER[id] + dir;
  return BOOKS[i] ?? null;
}

/** Biblical canon traditions we explicitly describe in the UI. */
export const CANON_NOTES = [
  'This app uses the 73-book Catholic canon. The seven deuterocanonical books (Tobit, Judith, Wisdom, Sirach, Baruch, 1 and 2 Maccabees) and the Greek additions to Esther and Daniel are integrated in their traditional places; nothing is dropped or moved to an appendix.',
  'Chapter and verse numbering follows the Clementine Vulgate (the Douay-Rheims tradition). Editions that number differently — for example the Hebrew/English numbering of the Psalms — are mapped to it explicitly.',
];
