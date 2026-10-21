import { modernRefs } from './modernRefs';

/**
 * Plain wording for text that came to us in scholars' shorthand: Roman numerals, abbreviations and old book names.
 * Used on footnotes and study-panel items when they are shown, and on section titles when the library is built.
 */

const R: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
const VALID = /^M{0,3}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})$/;
const toArabic = (s: string): number => {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const v = R[s[i]], nx = R[s[i + 1]] ?? 0;
    n += v < nx ? -v : v;
  }
  return n;
};
const isNumeral = (s: string) => s.length > 0 && VALID.test(s.toUpperCase());
const num = (s: string) => String(toArabic(s.toUpperCase()));

/** words that a numeral follows in a heading: "Book III", "Psalm CXXV", "Conference XI-XVII" */
const HEAD = 'Book|Books|Chapter|Chapters|Chap|Chaps|Part|Psalm|Psalms|Hymn|Hymns|Homily|Homilies|Section|Session|Relation|Conference|Conferences|Letter|Letters|Epistle|Sermon|Oration|Lecture|Article|Question|Canon|Canons|Treatise|Tractate|Discourse|Catechesis|Instruction|Volume|Vol|Act|Dialogue|Decree|Ode|Appendix|Number|Day|Day|Stromata|Hexaemeron|Chapter|Title|Anathema';
const HEAD_RE = new RegExp(`\\b(${HEAD})(\\.?)\\s+([IVXLCDM]+|[ivxlcdm]{1,6})(?:\\s?[-–]\\s?([IVXLCDM]+))?\\b(\\.?)`, 'gi');
/** a book of the Bible followed by a Roman chapter and an ordinary verse: "Matthew VIII. 23, 24" */
const BIBLE = 'Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Tobit|Judith|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Sirach|Ecclesiasticus|Wisdom|Isaiah|Jeremiah|Lamentations|Baruch|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Maccabees|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation';
const bibleRe = (names: string) => new RegExp(`\\b((?:[1-3]\\s)?(?:${names}))\\s+([IVXLC]{1,7})\\.?\\s+(\\d{1,3}(?:\\s?[-–,]\\s?\\d{1,3})*)`, 'g');
const BIBLE_RE = bibleRe(BIBLE);
/** a lower-case Roman chapter written without a full stop before the verse: "Genesis xxx 3" */
const LOWER_RE = new RegExp(`\\b((?:[1-3]\\s)?(?:${BIBLE}|Gen|Exod?|Lev|Num|Deut|Matt?|Mk|Lk|Jn|Rom|Cor|Heb|Apoc|Rev|Ps|Isa?|Jer|Ezech?|Dan))\\.?\\s+([ivxlc]{1,7})\\s+(\\d{1,3})\\b`, 'g');
/** "(Strabo xvii.)": an ancient author cited by book */
const AUTHOR_BOOK_RE = /\(([A-Z][a-zæ]+(?:\s[A-Z][a-z]+)?),?\s+([ivxlc]{1,6})\.?\)/g;
/** in Augustine's titles the number after a Psalm is the section of his exposition, not a verse */
const BIBLE_TITLE_RE = bibleRe(BIBLE.replace('|Psalms?', ''));

/** Roman numerals in headings and citations become ordinary numbers; running prose is left alone. */
export function plainNumerals(text: string, opts: { title?: boolean } = {}): string {
  let t = modernRefs(text);
  t = t.replace(LOWER_RE, (m, book: string, roman: string, verse: string) => (isNumeral(roman.toUpperCase()) && toArabic(roman.toUpperCase()) <= 150 ? `${book} ${toArabic(roman.toUpperCase())}:${verse}` : m));
  t = t.replace(AUTHOR_BOOK_RE, (m, who: string, roman: string) => (isNumeral(roman.toUpperCase()) ? `(${who}, book ${toArabic(roman.toUpperCase())})` : m));
  t = t.replace(opts.title ? BIBLE_TITLE_RE : BIBLE_RE, (m, book: string, roman: string, rest: string) => (isNumeral(roman) ? `${book} ${num(roman)}:${rest.replace(/\s/g, ' ')}` : m));
  // "II Cor." / "I John": numbered books written with Roman numerals
  t = t.replace(/\b(I{1,3})\s+(Cor|Thess|Tim|Pet|Jn|John|Kings|Chron|Sam|Macc|Esdras)\b/g, (_m, r: string, b: string) => `${num(r)} ${b}`);
  // "Augustine, Against Faustus, XIX, 26": a Roman book or chapter followed by a comma and an ordinary number
  t = t.replace(/\b([IVXLC]{2,6}),\s+(\d{1,3})\b/g, (m, r: string, n: string) => (isNumeral(r) ? `${num(r)}, ${n}` : m));
  t = t.replace(HEAD_RE, (m, w: string, dot: string, a: string, b: string | undefined, tail: string) => {
    if (!isNumeral(a) || (b && !isNumeral(b))) return m;
    // a lower-case numeral directly after a heading word is only trusted when the word is capitalised ("Part ii" in running prose is rare)
    if (a === a.toLowerCase() && w[0] !== w[0].toUpperCase()) return m;
    const n = num(a);
    return `${w}${dot ? '' : ''} ${b ? `${n}–${num(b)}` : n}${tail}`;
  });
  if (opts.title) {
    // in a title, a numeral after a dash is a number ("Irenæus — II"); names like "Pius XII" or "Vatican II" are not touched
    t = t.replace(/([—–]\s*|^)([IVXLCDM]{1,7})(?=$|[\s.,:;)—–])/g, (m, pre: string, r: string) => (isNumeral(r) && (pre !== '' || r.length > 1) && (r.length > 1 || pre !== '') ? `${pre}${num(r)}` : m));
  }
  return t.replace(/ {2,}/g, ' ');
}

const BOOK_FULL: [RegExp, string][] = [
  [/\bGen\./g, 'Genesis'], [/\bExod?\./g, 'Exodus'], [/\bLev\./g, 'Leviticus'], [/\bNum\./g, 'Numbers'], [/\bDeut\./g, 'Deuteronomy'], [/\bJos(?:ue)?\./g, 'Joshua'], [/\bJudg\./g, 'Judges'],
  [/\bPs\./g, 'Psalm'], [/\bProv\./g, 'Proverbs'], [/\bEccl\./g, 'Ecclesiastes'], [/\bEccli\./g, 'Sirach'], [/\bWisd?\./g, 'Wisdom'], [/\bIsa?\./g, 'Isaiah'], [/\bJer\./g, 'Jeremiah'], [/\bLam\./g, 'Lamentations'],
  [/\bEzech?\./g, 'Ezekiel'], [/\bEzek\./g, 'Ezekiel'], [/\bDan\./g, 'Daniel'], [/\bOsee\./g, 'Hosea'], [/\bMich\./g, 'Micah'], [/\bZach\./g, 'Zechariah'], [/\bMal\./g, 'Malachi'], [/\bMacc?\./g, 'Maccabees'],
  [/\bMatt?\./g, 'Matthew'], [/\bMk\./g, 'Mark'], [/\bLk\./g, 'Luke'], [/\bJn\./g, 'John'], [/\bRom\./g, 'Romans'], [/\bCor\./g, 'Corinthians'], [/\bGal\./g, 'Galatians'], [/\bEph\./g, 'Ephesians'],
  [/\bPhil\./g, 'Philippians'], [/\bCol\./g, 'Colossians'], [/\bThess\./g, 'Thessalonians'], [/\bTim\./g, 'Timothy'], [/\bHeb\./g, 'Hebrews'], [/\bJas\./g, 'James'], [/\bJam\./g, 'James'], [/\bPet\./g, 'Peter'],
  [/\bApoc\./g, 'Revelation'], [/\bRev\./g, 'Revelation'],
];
/** "Matt. 16:18" → "Matthew 16:18": only where a chapter number follows, so ordinary abbreviations are untouched */
function fullBookNames(t: string): string {
  let out = t;
  for (const [re, full] of BOOK_FULL) out = out.replace(new RegExp(re.source + '(?=\\s+\\d)', 'g'), full);
  return out;
}

/** shorthand used in old commentaries */
function oldAbbreviations(t: string): string {
  return t
    .replace(/\bSept\./g, 'Septuagint')
    .replace(/\bVulg\./g, 'Vulgate')
    .replace(/\bChald?\./g, 'Chaldean')
    .replace(/\bSyr\./g, 'Syriac')
    .replace(/\bibid\./gi, (m) => (m[0] === 'I' ? 'In the same place' : 'in the same place'))
    .replace(/\bchap\.\s+(?=\d)/g, 'chapter ')
    .replace(/\bver\.\s+(?=\d)/g, 'verse ')
    .replace(/\bvv\.\s+(?=\d)/g, 'verses ')
    .replace(/&c\.?/g, 'etc.')
    .replace(/\bi\.e\.,?/g, 'that is,')
    .replace(/\be\.g\.,?/g, 'for example,');
}

const lead = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/**
 * The Bible's own footnotes (World English Bible) use manuscript shorthand: "TR adds…", "LXX reads…", "Gr. heavy".
 * Spell it out so each note can be read on its own.
 */
export function expandNote(raw: string): string {
  let t = raw.trim();
  t = t.replace(/^\+\s*(?=(?:MT|TR|NU|RP|FH)\b)/, '').replace(/^\+\s*/, '');
  t = t.replace(/^So\s+((?:MT|TR|NU|RP|FH)(?:(?:,|,? and)\s+(?:MT|TR|NU|RP|FH))*)\.\s*/, '$1 read this way. ');
  t = t.replace(/^or,\s*/i, 'Alternative translation: ');
  // a bare Greek or Hebrew word: say what it is
  t = t.replace(/^(?:Gr\.|Greek:?)\s+([^\u0590-\u05FF\u0370-\u03FF:]{1,40}?)\.?$/, (_m, w: string) => `In Greek: “${w.trim()}”.`).replace(/^(?:Heb\.|Hebrew:)\s+([^\u0590-\u05FF]+?)\.?$/, (_m, w: string) => `In Hebrew: “${w.trim()}”.`);
  t = t.replace(/^Hebrew ([A-Z][a-z]+)$/, 'Hebrew letter $1: the heading of this section of the acrostic poem');
  // in the New Testament notes "MT" is the Majority Text; in the Old Testament it is the Masoretic Text
  if (/\b(?:TR|NU|RP|FH)\b/.test(t)) {
    t = t.replace(/\bRP MT\b/g, 'the Robinson-Pierpont Majority Text').replace(/\bFH MT\b/g, 'the Farstad-Hodges Majority Text').replace(/Hodges\/Farstad MT/g, 'Hodges/Farstad Majority Text').replace(/\bMT\b/g, 'the Majority Text (the most common reading in the Greek manuscripts)').replace(/\bRP\b/g, 'the Robinson-Pierpont Majority Text').replace(/\bFH\b/g, 'the Farstad-Hodges Majority Text');
  }
  t = t.replace(/\bGr\.\s*/g, 'Greek ').replace(/\bHeb\.\s*/g, 'Hebrew ').replace(/\bAram\.\s*/g, 'Aramaic ').replace(/\bSyr\.\s*/g, 'Syriac ').replace(/\bVg\b\.?/g, 'the Vulgate');
  t = t.replace(/\bThe LXX\b/g, 'The Septuagint (the ancient Greek translation of the Old Testament)').replace(/\bthe LXX\b/g, 'the Septuagint').replace(/\bLXX\b/g, 'the Septuagint (the ancient Greek translation of the Old Testament)');
  t = t.replace(/\bTR\b/g, 'the Textus Receptus (the traditional Greek text)').replace(/\bNU\b/g, 'the Nestle-Aland and United Bible Societies Greek text').replace(/\bMT\b/g, 'the Masoretic Text (the traditional Hebrew text)');
  t = t.replace(/\bDSS\b/g, 'the Dead Sea Scrolls').replace(/\bMSS\.?/g, 'manuscripts');
  // the explanations are long, so give each in full once per note
  const once = (long: string, short: string) => { const i = t.indexOf(long); if (i >= 0) t = t.slice(0, i + long.length) + t.slice(i + long.length).split(long).join(short); };
  once('the Textus Receptus (the traditional Greek text)', 'the Textus Receptus');
  once('the Nestle-Aland and United Bible Societies Greek text', 'the Nestle-Aland text');
  once('the Masoretic Text (the traditional Hebrew text)', 'the Masoretic Text');
  once('the Majority Text (the most common reading in the Greek manuscripts)', 'the Majority Text');
  once('the Septuagint (the ancient Greek translation of the Old Testament)', 'the Septuagint');
  t = t.replace(/\bver\.\s+(?=\d)/g, 'verse ').replace(/\bvv\.\s+(?=\d)/g, 'verses ').replace(/\bi\.e\.,?/g, 'that is,').replace(/\be\.g\.,?/g, 'for example,');
  t = t.replace(/\bcirca B\.C\.\s*(\d+)/gi, 'about $1 BC').replace(/\bB\.C\./g, 'BC').replace(/\bA\.D\./g, 'AD').replace(/\bU\. S\./g, 'US');
  t = t.replace(/(\d)\s?cm\b\.?/g, '$1 centimeters').replace(/(\d)\s?km\b\.?/g, '$1 kilometers').replace(/(\d)\s?kg\b\.?/g, '$1 kilograms');
  t = t.replace(/\bthe the\b/gi, 'the').replace(/ +([.,;:])/g, '$1');
  t = t.replace(/(^|[.!?]\s+)the /g, (_m, p: string) => `${p}The `);
  t = t.replace(/^the /, 'The ').replace(/ {2,}/g, ' ');
  return fullBookNames(plainNumerals(lead(t)));
}

/** the same cleaning for commentary and study-panel text */
export function readableText(t: string | undefined, opts: { title?: boolean } = {}): string | undefined {
  if (!t) return t;
  return oldAbbreviations(fullBookNames(plainNumerals(t, opts)));
}

/**
 * Haydock's notes are clipped for print: each begins with the Douay-Rheims words it explains ("Tumult. In the grave…"), and several comments
 * are strung together with " --- ". Say so in plain words, and drop the chapter heading that the source ran into the first note of a chapter.
 */
export function haydockText(raw: string): string {
  const t = raw.replace(/^\s*CHAPTER\s+[IVXLC\d]+\.?\s*/i, '').replace(/\n{2,}/g, '\n').trim();
  return t.split(/\s+---\s+/).map((seg) => {
    const m = /^([A-Z][A-Za-z'’\- ]{0,30}?)\.\s+(?=[A-Z“"(\[])/.exec(seg);
    const words = m ? m[1].trim().split(/\s+/).length : 0;
    // "Hebrew." or "Septuagint." alone is a language, not a quoted word
    if (!m || words > 4 || /^(?:Hebrew|Septuagint|Greek|Latin|Chaldean|Syriac|Vulgate|See|Ver|Chap|Ibid)$/i.test(m[1].trim())) return seg;
    return `On “${m[1].trim()}”: ${seg.slice(m[0].length)}`;
  }).join('\n');
}
