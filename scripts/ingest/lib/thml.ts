/** Small helpers for CCEL ThML (XML-ish) files. */

const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”' };

export function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, e: string) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENT[e] ?? m;
  });
}

/** Remove tags, keep text, collapse whitespace. Page breaks and notes' markup vanish; text of inline refs stays. */
export function plain(s: string): string {
  return decodeEntities(
    s
      .replace(/<note\b[\s\S]*?<\/note>/g, '')
      .replace(/<pb\b[^>]*\/>/g, '')
      .replace(/<br\s*\/?>/g, ' ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

export interface ScripRef {
  osis: string;
  passage?: string;
}

/** All OSIS scripture references tagged inside a fragment of ThML. */
export function scripRefs(s: string): ScripRef[] {
  const out: ScripRef[] = [];
  for (const m of s.matchAll(/<scripRef\b([^>]*)>/g)) {
    const osis = /osisRef="([^"]*)"/.exec(m[1])?.[1];
    if (osis) out.push({ osis: osis.replace(/^Bible:/, ''), passage: /passage="([^"]*)"/.exec(m[1])?.[1] });
  }
  return out;
}

/** OSIS book abbreviations → canon ids (protocanonical + deuterocanonical). */
export const OSIS_BOOKS: Record<string, string> = {
  Gen: 'GEN', Exod: 'EXO', Lev: 'LEV', Num: 'NUM', Deut: 'DEU', Josh: 'JOS', Judg: 'JDG', Ruth: 'RUT', '1Sam': '1SA', '2Sam': '2SA', '1Kgs': '1KI', '2Kgs': '2KI',
  '1Chr': '1CH', '2Chr': '2CH', Ezra: 'EZR', Neh: 'NEH', Esth: 'EST', Job: 'JOB', Ps: 'PSA', Prov: 'PRO', Eccl: 'ECC', Song: 'SNG', Isa: 'ISA', Jer: 'JER',
  Lam: 'LAM', Ezek: 'EZK', Dan: 'DAN', Hos: 'HOS', Joel: 'JOL', Amos: 'AMO', Obad: 'OBA', Jonah: 'JON', Mic: 'MIC', Nah: 'NAM', Hab: 'HAB', Zeph: 'ZEP',
  Hag: 'HAG', Zech: 'ZEC', Mal: 'MAL', Matt: 'MAT', Mark: 'MRK', Luke: 'LUK', John: 'JHN', Acts: 'ACT', Rom: 'ROM', '1Cor': '1CO', '2Cor': '2CO', Gal: 'GAL',
  Eph: 'EPH', Phil: 'PHP', Col: 'COL', '1Thess': '1TH', '2Thess': '2TH', '1Tim': '1TI', '2Tim': '2TI', Titus: 'TIT', Phlm: 'PHM', Heb: 'HEB', Jas: 'JAS',
  '1Pet': '1PE', '2Pet': '2PE', '1John': '1JN', '2John': '2JN', '3John': '3JN', Jude: 'JUD', Rev: 'REV', Tob: 'TOB', Jdt: 'JDT', Wis: 'WIS', Sir: 'SIR', Bar: 'BAR',
  '1Macc': '1MA', '2Macc': '2MA',
};

/** "John.6.51" | "John.6.51-John.6.58" | "Rom.8" → {book,c,v?} pairs, or null. */
export function parseOsis(osis: string): { book: string; c1: number; v1?: number; c2: number; v2?: number } | null {
  const [a, b] = osis.split('-');
  const pa = /^([1-3]?[A-Za-z]+)\.(\d+)(?:\.(\d+))?$/.exec(a);
  if (!pa) return null;
  const book = OSIS_BOOKS[pa[1]];
  if (!book) return null;
  const c1 = +pa[2];
  const v1 = pa[3] ? +pa[3] : undefined;
  if (!b) return { book, c1, v1, c2: c1, v2: v1 };
  const pb = /^(?:[1-3]?[A-Za-z]+\.)?(\d+)(?:\.(\d+))?$/.exec(b);
  if (!pb) return { book, c1, v1, c2: c1, v2: v1 };
  if (pb[2] === undefined && a.includes('.') && !b.includes('.')) return { book, c1, v1, c2: c1, v2: +pb[1] };
  return { book, c1, v1, c2: +pb[1], v2: pb[2] ? +pb[2] : undefined };
}
