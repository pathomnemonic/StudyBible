import { getJson } from '../data/loader';

export interface TermBrief {
  id: string;
  title: string;
  kind: string;
  en: string[];
  la: string[];
  gist: string;
  total: number;
}
export interface TermFull extends TermBrief {
  original: string;
  passages: { ref: string; note: string }[];
  related: string[];
  byBook: Record<string, number>;
  verses: string[];
}

let idx: Promise<TermBrief[]> | null = null;
export const loadTerms = () => (idx ??= getJson<{ terms: TermBrief[] }>('terms/index.json', true).then((d) => d?.terms ?? []).catch(() => []));
export const loadTerm = (id: string) => getJson<TermFull>(`terms/${id}.json`, true);

export interface TermMatcher {
  find(text: string): { start: number; end: number; id: string }[];
}

/** Compiles the patterns of every term for one language ('la' for the Vulgate, English otherwise). */
export function makeMatcher(terms: TermBrief[], latin: boolean): TermMatcher {
  const regs = terms
    .map((t) => ({ id: t.id, pats: latin ? t.la : t.en }))
    .filter((t) => t.pats.length)
    .map((t) => ({ id: t.id, re: new RegExp(`\\b(?:${t.pats.join('|')})`, 'gi') }));
  return {
    find(text) {
      const found: { start: number; end: number; id: string }[] = [];
      for (const { id, re } of regs) {
        re.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(text))) {
          if (!m[0]) break;
          found.push({ start: m.index, end: m.index + m[0].length, id });
        }
      }
      found.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
      const out: typeof found = [];
      let last = -1;
      for (const f of found) {
        if (f.start >= last) {
          out.push(f);
          last = f.end;
        }
      }
      return out;
    },
  };
}
