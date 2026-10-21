/**
 * Minimal, strict-enough USFM reader for the eBible.org files we ingest.
 *
 * It keeps paragraph/poetry structure, verse boundaries, headings and footnotes, and drops
 * word-level attributes (Strong's numbers etc.). Anything it does not understand is reported
 * through `warn` rather than silently dropped.
 */
import type { Block, ChapterData, Run } from '../../../src/lib/types';

export interface Footnote {
  chapter: number;
  verse: number;
  /** [lemma, text] pairs (lemma may be ''). */
  parts: [string, string][];
  /** plain text rendition */
  text: string;
}

export interface ParsedBook {
  code: string;
  header?: string;
  title?: string;
  intro: string[];
  chapters: ChapterData[];
  footnotes: Footnote[];
}

const TEXT_PARA = new Set(['p', 'm', 'pi', 'pi1', 'pc', 'mi', 'nb', 'q', 'q1', 'q2', 'q3', 'q4', 'li', 'li1', 'li2', 'b']);
const HEAD = new Set(['s', 's1', 's2', 'ms', 'ms1', 'd', 'sp', 'r']);
const SKIP = new Set(['id', 'ide', 'h', 'toc1', 'toc2', 'toc3', 'mt', 'mt1', 'mt2', 'mt3', 'cl', 'is', 'is1', 'ip', 'imt', 'imt1', 'cp', 'ca', 'va', 'vp']);

function normKind(m: string): any {
  if (m === 'pi1' || m === 'pc' || m === 'mi') return m === 'pc' ? 'p' : 'pi';
  if (m === 'q' || m === 'q4') return 'q1';
  if (m === 'li' || m === 'li2') return 'li1';
  if (m === 's1' || m === 's2') return 's';
  if (m === 'ms1') return 'ms';
  return m;
}

const INLINE_START = new Set(['w', 'add', 'nd', 'wj', 'qt', 'sc', 'tl', 'it', 'bd', 'bdit', 'em', 'k', 'sig', 'pn', 'ord', 'dc', 'sls', 'bk', 'ndx', 'png', 'rq', 'qs']);
const NOTE_PLACEHOLDER = /\u0001(\d+)\u0002/g;

export function cleanInline(s: string): string {
  return s
    .replace(/\\\+?(w|wh)\s+([^\\|]*?)(?:\|[^\\]*)?\\\+?\1\*/g, '$2')
    .replace(/\\\+(?:add|nd|wj|qt|sc|tl|it|bd|bdit|em|k|sig|pn|ord|dc|sls|bk|ndx|png|rq|qs)\*?\s?/g, '')
    .replace(/\\(?:add|nd|wj|qt|sc|tl|it|bd|bdit|em|k|sig|pn|ord|dc|sls|bk|ndx|png|rq|qs)\*?\s?/g, '')
    .replace(/\\\+?x[a-z]{1,2}\*?\s?/g, '')
    .replace(/\\\+?[a-z]+\d?\*/g, '')
    .replace(/\s+/g, ' ');
}

export function parseUsfm(text: string, warn: (msg: string) => void, file = ''): ParsedBook {
  // 1. Extract footnotes (they may span lines) into placeholders.
  const notes: { parts: [string, string][]; text: string }[] = [];
  // Cross-reference notes (\x + \xo 2:23 \xt Exodus 13:2 \x*) are not text; the app has its own cross-references.
  text = text.replace(/\\x\s[\s\S]*?\\x\*/g, '');
  const src = text.replace(/\\f\s+[+\-?]\s+([\s\S]*?)\\f\*/g, (_m, body: string) => {
    const parts: [string, string][] = [];
    let lemma = '';
    let buf = '';
    let mode: 'fr' | 'fk' | 'ft' | 'other' = 'other';
    const flush = () => {
      const t = cleanInline(buf).trim();
      if (mode === 'fk') lemma = t;
      else if (mode === 'ft' || mode === 'other') {
        if (t) parts.push([lemma, t]);
        lemma = '';
      }
      buf = '';
    };
    for (const tok of body.split(/(\\f[a-z]+)\s?/)) {
      if (/^\\f[a-z]+$/.test(tok)) {
        flush();
        const m = tok.slice(2);
        mode = m === 'fr' ? 'fr' : m === 'fk' ? 'fk' : m === 'ft' || m === 'fq' || m === 'fqa' || m === 'fl' ? 'ft' : 'other';
        if (m === 'fl' || m === 'fq' || m === 'fqa') mode = 'ft';
      } else if (mode !== 'fr') {
        buf += tok;
      }
    }
    flush();
    // Merge adjacent parts with the same (empty) lemma, e.g. "\ft In the \fl Hebrew \ft and some copies".
    const merged: [string, string][] = [];
    for (const p of parts) {
      const last = merged[merged.length - 1];
      if (last && !p[0] && !last[0]) last[1] += ' ' + p[1];
      else merged.push([...p] as [string, string]);
    }
    const plain = merged.map(([l, t]) => (l ? `${l} ${t}` : t)).join(' ').replace(/\s+/g, ' ').trim();
    notes.push({ parts: merged, text: plain });
    return `\u0001${notes.length - 1}\u0002`;
  });

  const out: ParsedBook = { code: '', intro: [], chapters: [], footnotes: [] };
  let chapter: ChapterData | null = null;
  let verse = 0;
  let block: { kind: any; runs: Run[] } | null = null;
  let pendingVerseStart = false;

  const flushBlock = () => {
    if (block && chapter) {
      const runs = block.runs.filter((r) => r[1].trim() !== '' || r[0] > 0);
      if (runs.length || block.kind === 'b') chapter.blocks.push([block.kind, runs] as Block);
    }
    block = null;
  };
  const addText = (t: string) => {
    if (!chapter || !t) return;
    if (!block) block = { kind: 'p', runs: [] };
    const last = block.runs[block.runs.length - 1];
    if (last && !pendingVerseStart) last[1] += t;
    else block.runs.push([pendingVerseStart ? verse : 0, t]);
    pendingVerseStart = false;
  };

  const lines = src.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) continue;
    const m = /^\\([a-z0-9]+)\*?(?:\s+(.*))?$/.exec(line);
    if (!m) {
      // continuation of a previous marker's text
      if (chapter) addInline(line);
      continue;
    }
    const marker = m[1];
    const rest = (m[2] ?? '').trim();

    if (INLINE_START.has(marker)) {
      if (chapter) addInline(line);
      continue;
    }

    if (marker === 'id') {
      out.code = rest.split(/\s+/)[0] ?? '';
    } else if (marker === 'h') out.header = rest;
    else if (marker === 'mt1' || marker === 'mt') out.title = (out.title ? out.title + ' ' : '') + rest;
    else if (marker === 'c') {
      flushBlock();
      const n = parseInt(rest, 10);
      if (!Number.isFinite(n)) warn(`${file}: bad chapter marker "${line}"`);
      chapter = { n, blocks: [] };
      out.chapters.push(chapter);
      verse = 0;
    } else if (marker === 'v') {
      const vm = /^(\d+)(?:[-–](\d+))?[a-z]?\s*(.*)$/.exec(rest);
      if (!vm) {
        warn(`${file}: bad verse marker "${line}"`);
        continue;
      }
      if (!chapter) {
        warn(`${file}: verse before chapter`);
        continue;
      }
      verse = parseInt(vm[1], 10);
      if (vm[2]) (chapter.bridge ??= {})[verse] = parseInt(vm[2], 10);
      pendingVerseStart = true;
      if (!block) block = { kind: 'p', runs: [] };
      if (vm[3]) addInline(vm[3]);
      else block.runs.push([verse, '']), (pendingVerseStart = false);
    } else if (TEXT_PARA.has(marker)) {
      flushBlock();
      block = { kind: normKind(marker), runs: [] };
      if (rest) addInline(rest);
    } else if (HEAD.has(marker)) {
      flushBlock();
      if (chapter && rest) chapter.blocks.push([normKind(marker), cleanInline(rest).trim()] as Block);
    } else if (marker === 'ip' || marker === 'is1' || marker === 'is' || marker === 'imt' || marker === 'imt1') {
      if (!chapter && rest) out.intro.push(cleanInline(rest).trim());
    } else if (SKIP.has(marker)) {
      // known and intentionally ignored
    } else if (marker === 'sp' || marker === 'qs' || marker === 'qr') {
      /* handled in HEAD or ignored */
    } else {
      warn(`${file}: unhandled marker \\${marker}`);
    }
  }
  flushBlock();

  function addInline(s: string) {
    // peel off footnote placeholders, attaching them to the current verse
    let last = 0;
    let piece = '';
    for (const nm of s.matchAll(NOTE_PLACEHOLDER)) {
      piece = s.slice(last, nm.index);
      const t = cleanInline(piece);
      addText(t);
      const note = notes[+nm[1]];
      if (note && chapter) out.footnotes.push({ chapter: chapter.n, verse, parts: note.parts, text: note.text });
      last = (nm.index ?? 0) + nm[0].length;
    }
    addText(cleanInline(s.slice(last)));
  }

  // Normalise whitespace in runs and drop trailing spaces.
  for (const ch of out.chapters) {
    for (const b of ch.blocks) {
      if (typeof b[1] === 'string') continue;
      for (const r of b[1]) r[1] = r[1].replace(/\s+/g, ' ').replace(/^\s+/, '');
      const rs = b[1];
      if (rs.length) rs[rs.length - 1][1] = rs[rs.length - 1][1].trimEnd();
    }
  }
  return out;
}
