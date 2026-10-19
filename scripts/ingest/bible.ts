import { unzipSync } from 'fflate';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BOOKS, BOOK_BY_ID } from '../../src/lib/canon';
import type { BookData, ChapterData, Edition } from '../../src/lib/types';
import type { Rule, VersificationData } from '../../src/lib/versification';
import { parseUsfm, type ParsedBook } from './lib/usfm';
import { PUBLIC_DATA, RAW, readJson, REGISTRY, Report, writeJson, today, exists } from './lib/util';

interface EditionConfig extends Edition {
  source: string;
  usfmPattern: string;
  bookCodeMap?: Record<string, string>;
}

const maxVerse = (ch: ChapterData): number => {
  let m = 0;
  for (const b of ch.blocks) {
    if (typeof b[1] === 'string') continue;
    for (const [v] of b[1]) m = Math.max(m, v);
  }
  if (ch.bridge) for (const e of Object.values(ch.bridge)) m = Math.max(m, e);
  return m;
};

export interface BuiltEdition {
  edition: Edition & { chapters: Record<string, number>; verseCounts: Record<string, number[]> };
  books: Map<string, BookData>;
  glossa?: Map<string, Record<string, [string, string][]>>;
}

const SOURCE_FILES: Record<string, string> = {
  'ebible-engDRA': 'engDRA_usfm.zip',
  'ebible-latVUC': 'latVUC_usfm.zip',
  'ebible-eng-web-c': 'eng-web-c_usfm.zip',
};

function stripStructuralBrackets(ch: ChapterData, report: Report, where: string) {
  // The eBible Clementine file marks each glossed span with "[ … ]" (a typesetting artefact of the Migne
  // layout that anchors the Glossa footnotes). Brackets are balanced in every chapter, so they are not
  // part of the Vulgate text itself; remove them and warn if a chapter is ever unbalanced.
  let open = 0;
  let close = 0;
  for (const b of ch.blocks) {
    if (typeof b[1] === 'string') continue;
    for (const r of b[1]) {
      open += (r[1].match(/\[/g) ?? []).length;
      close += (r[1].match(/\]/g) ?? []).length;
      r[1] = r[1].replace(/[\[\]]/g, '').replace(/\s{2,}/g, ' ');
    }
  }
  if (open !== close) report.warn(`${where}: unbalanced brackets (${open}/${close})`);
}

export function buildEdition(cfg: EditionConfig, report: Report): BuiltEdition {
  const zipPath = join(RAW, SOURCE_FILES[cfg.source]);
  if (!exists(zipPath)) throw new Error(`Missing ${zipPath}; run "npm run data:fetch" first.`);
  const files = unzipSync(new Uint8Array(readFileSync(zipPath)));
  const books = new Map<string, BookData>();
  const glossa = cfg.id === 'vulgate' ? new Map<string, Record<string, [string, string][]>>() : undefined;
  const dec = new TextDecoder('utf-8');

  for (const [name, bytes] of Object.entries(files)) {
    if (!name.endsWith('.usfm')) continue;
    const parsed: ParsedBook = parseUsfm(dec.decode(bytes).replace(/^﻿/, ''), (m) => report.warn(`[${cfg.id}] ${m}`), name);
    const code = cfg.bookCodeMap?.[parsed.code] ?? parsed.code;
    if (!BOOK_BY_ID[code]) {
      report.warn(`[${cfg.id}] ${name}: book code ${parsed.code} is not in the 73-book Catholic canon; skipped`);
      continue;
    }
    if (books.has(code)) {
      report.error(`[${cfg.id}] duplicate book ${code} (${name})`);
      continue;
    }
    if (cfg.id === 'vulgate') parsed.chapters.forEach((c) => stripStructuralBrackets(c, report, `[vulgate] ${code} ${c.n}`));
    const book: BookData = { id: code, edition: cfg.id, chapters: parsed.chapters };
    if (parsed.code !== code) book.sourceBook = parsed.code;
    if (parsed.intro.length) book.intro = parsed.intro;

    // Footnotes → either per-chapter translation notes (WEB) or the Glossa Ordinaria (Vulgate).
    if (glossa) {
      const g: Record<string, [string, string][]> = {};
      for (const f of parsed.footnotes) {
        const key = `${f.chapter}.${f.verse}`;
        (g[key] ??= []).push(...f.parts);
      }
      glossa.set(code, g);
    } else {
      for (const f of parsed.footnotes) {
        const ch = book.chapters.find((c) => c.n === f.chapter);
        if (!ch) continue;
        ((ch.notes ??= {})[f.verse] ??= []).push(f.text);
      }
    }
    books.set(code, book);
  }

  // Integrity: all 73 books present and no empty chapters.
  const chapters: Record<string, number> = {};
  const verseCounts: Record<string, number[]> = {};
  for (const b of BOOKS) {
    const bd = books.get(b.id);
    if (!bd) {
      report.error(`[${cfg.id}] missing book ${b.id} (${b.name})`);
      continue;
    }
    chapters[b.id] = bd.chapters.length;
    verseCounts[b.id] = bd.chapters.map(maxVerse);
    bd.chapters.forEach((c, i) => {
      if (c.n !== i + 1) report.error(`[${cfg.id}] ${b.id}: chapter sequence broken at index ${i} (found ${c.n})`);
      if (verseCounts[b.id][i] === 0) report.error(`[${cfg.id}] ${b.id} ${c.n}: chapter has no verses`);
    });
    if (cfg.scheme === 'vulgate' && bd.chapters.length !== b.chapters)
      report.warn(`[${cfg.id}] ${b.id}: ${bd.chapters.length} chapters, canon table says ${b.chapters}`);
  }
  const { source: _s, usfmPattern: _p, bookCodeMap: _m, ...pub } = cfg as any;
  return { edition: { ...pub, chapters, verseCounts }, books, glossa };
}

export function writeEdition(built: BuiltEdition) {
  const dir = join(PUBLIC_DATA, 'bible', built.edition.id);
  for (const [id, bd] of built.books) writeJson(join(dir, `${id}.json`), bd);
  if (built.glossa) for (const [id, g] of built.glossa) writeJson(join(PUBLIC_DATA, 'commentary/glossa', `${id}.json`), g);
}

// ---------------------------------------------------------------------------
// Versification for the English scheme (WEB, and future RSV-CE etc.) → Vulgate anchor
// ---------------------------------------------------------------------------

const UNALIGNED_REASON: Record<string, string> = {
  TOB: 'This edition translates Tobit from the Greek; the Vulgate follows a different (shorter) recension, so chapters and verses do not correspond one-to-one. Compare passages by chapter, not by verse.',
  JDT: 'This edition translates Judith from the Greek; the Vulgate text is a different recension with different verse divisions. Compare by chapter, not by verse.',
  SIR: 'This edition follows the Greek text of Sirach; the Vulgate has additional verses and different divisions, so verse numbers do not correspond. Compare by chapter, not by verse.',
  EST: 'This edition gives Esther as in the Greek, with the additions merged into the story. The Vulgate/Douay places them as chapters 10:4–16:24, so numbering does not correspond.',
  DAN: 'This edition gives Daniel as in the Greek, with Susanna and Bel and the Dragon in Greek order. The Vulgate/Douay places them as chapters 13 and 14, so numbering does not correspond.',
};

export function buildVersification(
  anchorDra: BuiltEdition,
  anchorVul: BuiltEdition,
  english: BuiltEdition,
  report: Report,
): VersificationData {
  const psalmCfg = readJson(join(REGISTRY, '../versification/psalm-title-offsets.json'));
  const tl: Record<string, number> = psalmCfg.titleVerses;
  const drift = new Set<number>(psalmCfg.driftPsalms);
  const rules: Rule[] = [];
  const unverified: Record<string, number[]> = {};
  const ec = english.edition.verseCounts.PSA;
  const dc = anchorDra.edition.verseCounts.PSA;
  const title = (e: number, v: number, t: number) => {
    if (t > 0) rules.push(['PSA', e, 0, 0, v, 1, t]);
  };

  const chapterRule = (e: number, v: number, t: number) => {
    const n = ec[e - 1];
    title(e, v, t);
    rules.push(['PSA', e, 1, n, v, t + 1, t + n]);
  };

  for (let e = 1; e <= 150; e++) {
    if (e === 9) {
      title(9, 9, 1);
      rules.push(['PSA', 9, 1, ec[8], 9, 2, 1 + ec[8]]);
    } else if (e === 10) {
      rules.push(['PSA', 10, 1, ec[9], 9, 2 + ec[8], 1 + ec[8] + ec[9]]);
    } else if (e === 114) {
      rules.push(['PSA', 114, 1, ec[113], 113, 1, ec[113]]);
    } else if (e === 115) {
      rules.push(['PSA', 115, 1, ec[114], 113, 1 + ec[113], ec[113] + ec[114]]);
    } else if (e === 116) {
      const n1 = dc[113]; // Vulgate 114
      rules.push(['PSA', 116, 1, n1, 114, 1, n1]);
      rules.push(['PSA', 116, n1 + 1, ec[115], 115, 1, ec[115] - n1]);
    } else if (e === 147) {
      const n1 = dc[145]; // Vulgate 146
      rules.push(['PSA', 147, 1, n1, 146, 1, n1]);
      rules.push(['PSA', 147, n1 + 1, ec[146], 147, 1, ec[146] - n1]);
    } else {
      const v = e <= 8 || e >= 148 ? e : e - 1;
      chapterRule(e, v, tl[String(e)] ?? 0);
    }
  }
  // Sanity checks on the special psalms (counts must close).
  if (dc[8] !== 1 + ec[8] + ec[9]) report.warn(`PSA 9/10: Vulgate ${dc[8]} verses vs English ${ec[8]}+${ec[9]}+title`);
  if (dc[112] !== ec[113] + ec[114]) report.warn(`PSA 113: Vulgate ${dc[112]} vs English 114+115 ${ec[113] + ec[114]}`);
  if (dc[113] + dc[114] !== ec[115]) report.warn(`PSA 114+115 vs 116: ${dc[113]}+${dc[114]} vs ${ec[115]}`);
  if (dc[145] + dc[146] !== ec[146]) report.warn(`PSA 146+147 vs 147: ${dc[145]}+${dc[146]} vs ${ec[146]}`);

  // Other verified rules (checked by reading both texts at every boundary, see docs/VERSIFICATION.md).
  const verifiedExtra: Rule[] = [
    // Job: the Vulgate puts English 40:1-5 at the end of chapter 39, and shifts 40–41 accordingly.
    ['JOB', 39, 1, 30, 39, 1, 30],
    ['JOB', 40, 1, 5, 39, 31, 35],
    ['JOB', 40, 6, 24, 40, 1, 19],
    ['JOB', 41, 1, 9, 40, 20, 28],
    ['JOB', 41, 10, 34, 41, 1, 25],
  ];
  rules.push(...verifiedExtra);
  const verifiedChapters = new Set(verifiedExtra.map((r) => `${r[0]}.${r[1]}`));
  unverified.PSA = [...drift];
  // All other books: flag chapters whose verse counts differ from the Vulgate anchor.
  const unaligned: Record<string, string> = {};
  for (const b of BOOKS) {
    if (b.id === 'PSA') continue;
    if (UNALIGNED_REASON[b.id]) {
      unaligned[b.id] = UNALIGNED_REASON[b.id];
      continue;
    }
    const e = english.edition.verseCounts[b.id];
    const d = anchorDra.edition.verseCounts[b.id];
    const v = anchorVul.edition.verseCounts[b.id];
    const diff: number[] = [];
    if (e.length !== d.length) report.warn(`${b.id}: English has ${e.length} chapters, Vulgate ${d.length}`);
    for (let i = 0; i < Math.min(e.length, d.length); i++) if (e[i] !== d[i] && e[i] !== v[i]) diff.push(i + 1);
    const left = diff.filter((c) => !verifiedChapters.has(`${b.id}.${c}`));
    if (left.length) unverified[b.id] = left;
  }
  // Daniel: English/KJV vs Vulgate (the Song of the Three and the Vulgate's chapter 3/4 boundary).
  const danielRules: Rule[] = [
    ['DAN', 3, 1, 23, 3, 1, 23],
    ['DAN', 3, 24, 30, 3, 91, 97],
    ['DAN', 4, 1, 3, 3, 98, 100],
    ['DAN', 4, 4, 37, 4, 1, 34],
  ];
  report.stats['versification.unverifiedChapters'] = Object.fromEntries(Object.entries(unverified).map(([k, v]) => [k, v.length]));
  return {
    version: 1,
    schemes: {
      english: {
        description:
          'English (KJV/RSV/WEB) tradition → Clementine Vulgate anchor. Psalms are mapped by verified rules (chapter shifts, splits/merges, and superscription offsets, reviewed by hand). Other books are identity-mapped; chapters whose verse counts differ are listed as unverified rather than guessed. See docs/VERSIFICATION.md.',
        rules,
        unverifiedChapters: unverified,
        unalignedBooks: unaligned,
      },
      kjv: {
        description:
          'The numbering used by external English-tradition data (OpenBible cross-references, plans, lectionary lists, typed references): KJV/RSV-style. Same Psalm rules as `english`, plus the Daniel chapter 3/4 boundary. Not an edition: used only to convert references into the Vulgate anchor.',
        rules: [...rules, ...danielRules],
        unverifiedChapters: Object.fromEntries(Object.entries(unverified).filter(([b]) => b !== 'DAN')),
        unalignedBooks: {},
      },
    },
  };
}

export function buildBible(report: Report) {
  const cfg = readJson(join(REGISTRY, 'editions.json'));
  const built: BuiltEdition[] = (cfg.bundled as EditionConfig[]).map((c) => buildEdition(c, report));
  built.forEach(writeEdition);
  const dra = built.find((b) => b.edition.id === 'dra')!;
  const vul = built.find((b) => b.edition.id === 'vulgate')!;
  const web = built.find((b) => b.edition.id === 'webc')!;
  const vers = buildVersification(dra, vul, web, report);
  writeJson(join(PUBLIC_DATA, 'versification.json'), vers);
  // Carry the verification flags onto the edition record so the UI can read them without loading rules.
  const eng = vers.schemes.english;
  web.edition.numberingDiffers = eng.unverifiedChapters;
  web.edition.unalignedBooks = eng.unalignedBooks;
  writeJson(join(PUBLIC_DATA, 'editions.json'), {
    generated: today(),
    editions: built.map((b) => b.edition),
    planned: cfg.planned,
  });
  report.stats['bible.editions'] = built.map((b) => ({ id: b.edition.id, books: b.books.size }));
  return { built, vers };
}
