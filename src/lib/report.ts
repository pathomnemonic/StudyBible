/** A pre-filled "report a problem" link. It names the build and the screen so the problem can be found, and nothing the reader wrote: no notes, no names, no account details. */
export const REPO_ISSUES = 'https://github.com/pathomnemonic/StudyBible/issues/new';

const BUILD = typeof __APP_BUILD__ === 'string' ? __APP_BUILD__ : 'unknown';

/** the screen without anything after a "?" (a query can hold a question the reader typed) */
export const screenOf = (hash: string) => (hash.replace(/^#/, '').split('?')[0] || '/');

export function diagnostics(o: { hash: string; online: boolean; width?: number; build?: string }): string {
  return [`Build: ${o.build ?? BUILD}`, `Screen: ${screenOf(o.hash)}`, `Online: ${o.online ? 'yes' : 'no'}`, o.width ? `Window width: ${o.width}px` : ''].filter(Boolean).join('\n');
}

export function reportUrl(o: { title: string; item?: string; source?: string; hash?: string }): string {
  const hash = o.hash ?? (typeof location !== 'undefined' ? location.hash : '');
  const online = typeof navigator === 'undefined' ? true : navigator.onLine;
  const body = [o.item ? `Item: ${o.item}` : '', o.source ? `Source: ${o.source}` : '', diagnostics({ hash, online, width: typeof innerWidth === 'number' ? innerWidth : undefined }), '', 'What went wrong, and what did you expect?', ''].filter((x, i) => x !== '' || i > 0).join('\n');
  return `${REPO_ISSUES}?title=${encodeURIComponent(o.title)}&body=${encodeURIComponent(body)}`;
}
