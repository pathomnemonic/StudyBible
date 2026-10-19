/** Verse-level links to third-party Greek/Hebrew study tools. Built from the reference alone; the app does not claim anything about their content. */
const BLB: Record<string, string> = {
  GEN: 'gen', EXO: 'exo', LEV: 'lev', NUM: 'num', DEU: 'deu', JOS: 'jos', JDG: 'jdg', RUT: 'rth', '1SA': '1sa', '2SA': '2sa', '1KI': '1ki', '2KI': '2ki', '1CH': '1ch', '2CH': '2ch', EZR: 'ezr', NEH: 'neh', EST: 'est', JOB: 'job', PSA: 'psa', PRO: 'pro', ECC: 'ecc', SNG: 'sng', SOS: 'sng', ISA: 'isa', JER: 'jer', LAM: 'lam', EZK: 'eze', DAN: 'dan', HOS: 'hos', JOL: 'joe', AMO: 'amo', OBA: 'oba', JON: 'jon', MIC: 'mic', NAM: 'nah', HAB: 'hab', ZEP: 'zep', HAG: 'hag', ZEC: 'zec', MAL: 'mal',
  MAT: 'mat', MRK: 'mar', LUK: 'luk', JHN: 'jhn', ACT: 'act', ROM: 'rom', '1CO': '1co', '2CO': '2co', GAL: 'gal', EPH: 'eph', PHP: 'php', COL: 'col', '1TH': '1th', '2TH': '2th', '1TI': '1ti', '2TI': '2ti', TIT: 'tit', PHM: 'phm', HEB: 'heb', JAS: 'jas', '1PE': '1pe', '2PE': '2pe', '1JN': '1jo', '2JN': '2jo', '3JN': '3jo', JUD: 'jde', REV: 'rev',
};
const HUB: Record<string, string> = {
  GEN: 'genesis', EXO: 'exodus', LEV: 'leviticus', NUM: 'numbers', DEU: 'deuteronomy', JOS: 'joshua', JDG: 'judges', RUT: 'ruth', '1SA': '1_samuel', '2SA': '2_samuel', '1KI': '1_kings', '2KI': '2_kings', '1CH': '1_chronicles', '2CH': '2_chronicles', EZR: 'ezra', NEH: 'nehemiah', EST: 'esther', JOB: 'job', PSA: 'psalms', PRO: 'proverbs', ECC: 'ecclesiastes', SNG: 'songs', ISA: 'isaiah', JER: 'jeremiah', LAM: 'lamentations', EZK: 'ezekiel', DAN: 'daniel', HOS: 'hosea', JOL: 'joel', AMO: 'amos', OBA: 'obadiah', JON: 'jonah', MIC: 'micah', NAM: 'nahum', HAB: 'habakkuk', ZEP: 'zephaniah', HAG: 'haggai', ZEC: 'zechariah', MAL: 'malachi',
  MAT: 'matthew', MRK: 'mark', LUK: 'luke', JHN: 'john', ACT: 'acts', ROM: 'romans', '1CO': '1_corinthians', '2CO': '2_corinthians', GAL: 'galatians', EPH: 'ephesians', PHP: 'philippians', COL: 'colossians', '1TH': '1_thessalonians', '2TH': '2_thessalonians', '1TI': '1_timothy', '2TI': '2_timothy', TIT: 'titus', PHM: 'philemon', HEB: 'hebrews', JAS: 'james', '1PE': '1_peter', '2PE': '2_peter', '1JN': '1_john', '2JN': '2_john', '3JN': '3_john', JUD: 'jude', REV: 'revelation',
};

/** `book`, chapter and verse in KJV/English numbering (the numbering these sites use). Returns [] for books without Hebrew/Greek text (the deuterocanon is not covered). */
export function languageLinks(book: string, c: number, v: number): { label: string; url: string }[] {
  const out: { label: string; url: string }[] = [];
  if (HUB[book]) out.push({ label: 'Interlinear (Bible Hub)', url: `https://biblehub.com/interlinear/${HUB[book]}/${c}-${v}.htm` });
  if (BLB[book]) out.push({ label: 'Lexicon & Strong’s (Blue Letter Bible)', url: `https://www.blueletterbible.com/kjv/${BLB[book]}/${c}/${v}/` });
  return out;
}
