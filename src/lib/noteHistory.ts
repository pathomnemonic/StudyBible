/** A short history of a note's text, so an accidental edit can be undone. It lives on the note itself and is capped, so it cannot grow without limit. */
export interface Version { at: number; title?: string; body: string }
export const MAX_VERSIONS = 5;
/** an edit smaller than this, soon after the last saved version, does not add a version of its own */
const MIN_CHANGE = 20;
const MIN_GAP_MS = 10 * 60 * 1000;

const changeSize = (a: string, b: string) => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  let j = 0;
  while (j < a.length - i && j < b.length - i && a[a.length - 1 - j] === b[b.length - 1 - j]) j++;
  return Math.max(a.length - i - j, b.length - i - j);
};

/** the history to store with the new text: the old text is added when the change is meaningful (or the last version is old), newest first, at most MAX_VERSIONS, never an empty or repeated text */
export function nextHistory(old: { title?: string; body: string; history?: Version[] } | undefined, next: { title?: string; body: string }, now = Date.now()): Version[] {
  const hist = old?.history ?? [];
  if (!old || !old.body.trim()) return hist.slice(0, MAX_VERSIONS);
  if (old.body === next.body) return hist.slice(0, MAX_VERSIONS);
  const last = hist[0];
  const small = changeSize(old.body, next.body) < MIN_CHANGE;
  if (last && small && now - last.at < MIN_GAP_MS) return hist.slice(0, MAX_VERSIONS);
  if (last && last.body === old.body) return hist.slice(0, MAX_VERSIONS);
  return [{ at: now, title: old.title, body: old.body }, ...hist].slice(0, MAX_VERSIONS);
}
