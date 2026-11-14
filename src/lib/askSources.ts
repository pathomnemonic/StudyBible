/** Which kinds of source "Ask the sources" should show. Kept in the address so a filtered question can be shared or bookmarked. */
export type AskSource = 'ccc' | 'bible' | 'fathers';
export const ASK_SOURCES: [AskSource, string][] = [['ccc', 'Catechism and definition'], ['bible', 'Bible text'], ['fathers', 'Fathers and saints']];

/** "ccc,bible" -> those two; missing or unrecognised -> all three */
export function parseAskSources(v: string | null | undefined): AskSource[] {
  const want = (v ?? '').split(',').map((x) => x.trim()).filter((x): x is AskSource => ASK_SOURCES.some(([k]) => k === x));
  return want.length ? ASK_SOURCES.map(([k]) => k).filter((k) => want.includes(k)) : ASK_SOURCES.map(([k]) => k);
}

/** the value to put in the address; nothing when all are shown, so ordinary links stay short */
export function askSourcesParam(s: AskSource[]): string | undefined {
  return s.length >= ASK_SOURCES.length ? undefined : s.join(',');
}

/** toggle one source; the last one on cannot be turned off */
export function toggleAskSource(s: AskSource[], k: AskSource): AskSource[] {
  if (s.includes(k)) return s.length === 1 ? s : s.filter((x) => x !== k);
  return ASK_SOURCES.map(([x]) => x).filter((x) => x === k || s.includes(x));
}
