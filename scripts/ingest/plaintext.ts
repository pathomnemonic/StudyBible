/**
 * Plain-text adapter for library works that are not on CCEL: Project Gutenberg plain-text files and
 * Internet Archive OCR text of pre-1929 print editions. Output has the same shape as the ThML path
 * ({ title, id, paras }) so the rest of the library build is shared.
 */
export interface TextSource {
  /** Where the file is downloaded from (Gutenberg ".txt" or archive.org "_djvu.txt"). */
  url: string;
  /** File name under data/raw/. */
  file: string;
  /** Human-readable source name and the public page of the item (for attribution). */
  sourceName: string;
  sourceUrl: string;
  /** Regex: the body starts after the first line matching this (default: Gutenberg START marker). */
  start?: string;
  /** Regex: the body ends at the first line matching this (default: Gutenberg END marker). */
  end?: string;
  /** Regex a heading line must match; the following non-empty line(s) are added to the title. */
  heading: string;
  /** How many consecutive non-blank lines after the heading line (past any blank lines) also belong to the title (default 1; 0 for none). */
  titleLines?: number;
  /** Regex for a higher-level heading (e.g. "THE FIRST BOOK") whose line, plus the line after it if `groupSubtitle`, prefixes the titles that follow. */
  groupHeading?: string;
  groupSubtitle?: boolean;
  /** Title for text before the first heading (e.g. prayers, preface); omit to drop it. */
  introTitle?: string;
  /** Headings (regex, case-insensitive) whose sections are dropped, e.g. indexes. */
  dropTitles?: string[];
  /** [pattern, replacement] pairs applied to each finished title, to repair OCR errors in headings. */
  fixTitles?: [string, string][];
  /** Regex replacements applied to the raw text first (OCR running heads, page numbers). */
  strip?: string[];
}

export interface PlainSection {
  id: string;
  title: string;
  paras: string[];
}

/** "LESSON FIRST" → "Lesson First"; mixed-case text is left alone. */
export const niceCase = (t: string) =>
  t === t.toUpperCase()
    ? t.replace(/[A-ZÀ-Þ][A-ZÀ-Þ']*/g, (w) => (/^[IVXLC]+$/.test(w) ? w : w[0] + w.slice(1).toLowerCase()))
    : t;

const fixTypography = (s: string) => s.replace(/\s+/g, ' ').trim();

export function parsePlainText(raw: string, cfg: TextSource): PlainSection[] {
  let text = raw.replace(/\r/g, '').replace(/^﻿/, '');
  const cut = (re: string, after: boolean) => {
    const m = new RegExp(re, 'm').exec(text);
    if (!m) return;
    text = after ? text.slice(m.index + m[0].length) : text.slice(0, m.index);
  };
  cut(cfg.start ?? '^\\*\\*\\* START OF (?:THE|THIS) PROJECT GUTENBERG.*$', true);
  cut(cfg.end ?? '^\\*\\*\\* END OF (?:THE|THIS) PROJECT GUTENBERG.*$', false);
  for (const s of cfg.strip ?? []) text = text.replace(new RegExp(s, 'gm'), '');
  // undo end-of-line hyphenation in OCR text ("Sacra-\nments")
  text = text.replace(/([a-z])-\n([a-z])/g, '$1$2');

  const lines = text.split('\n');
  const headRe = new RegExp(cfg.heading);
  const drop = (cfg.dropTitles ?? []).map((d) => new RegExp(d, 'i'));
  const out: PlainSection[] = [];
  let title = cfg.introTitle ?? '';
  let group = '';
  const groupRe = cfg.groupHeading ? new RegExp(cfg.groupHeading) : null;
  let buf: string[] = [];
  const flush = () => {
    const paras = buf
      .join('\n')
      .split(/\n\s*\n/)
      .map(fixTypography)
      .filter((p) => p.length > 1);
    buf = [];
    if (!title || !paras.length || drop.some((d) => d.test(title))) return;
    out.push({ id: `s${out.length + 1}`, title, paras });
  };
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim();
    if (ln && groupRe?.test(ln)) {
      flush();
      title = '';
      group = ln.replace(/[.:]$/, '');
      if (cfg.groupSubtitle && lines[i + 1]?.trim()) group += ` — ${lines[++i].trim().replace(/[.:]$/, '')}`;
      continue;
    }
    if (ln && headRe.test(ln)) {
      flush();
      const parts = [ln.replace(/[.:]$/, '')];
      let need = cfg.titleLines ?? 1;
      let j = i + 1;
      while (need > 0 && j < lines.length && !lines[j].trim() && j - i < 6) j++;
      while (need > 0 && j < lines.length && lines[j].trim()) {
        parts.push(lines[j].trim().replace(/[.:]$/, ''));
        need--;
        j++;
      }
      if (parts.length > 1) i = j - 1;
      title = (group ? [group, ...parts] : parts).map((p) => niceCase(p.replace(/\s+/g, ' ')).replace(/[,.'"’]+$/, '')).join(' — ');
      for (const [re, to] of cfg.fixTitles ?? []) title = title.replace(new RegExp(re, 'g'), to);
      continue;
    }
    buf.push(lines[i]);
  }
  flush();
  return out;
}
