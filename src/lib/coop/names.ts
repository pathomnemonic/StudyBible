/** Nicknames and group codes: short, plain, and kept clean. Pure functions, no network. */

const BAD = ['fuck', 'shit', 'cunt', 'bitch', 'bastard', 'asshole', 'dick', 'cock', 'pussy', 'whore', 'slut', 'nigg', 'fag', 'retard', 'rape', 'nazi', 'porn', 'sex', 'penis', 'vagina', 'damn', 'piss', 'twat', 'wank'];
const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i' };

/** Lower-case, letters only, with common number-for-letter swaps undone. */
const flat = (s: string) => [...s.toLowerCase()].map((c) => LEET[c] ?? c).join('').replace(/[^a-z]/g, '');
export function isClean(s: string): boolean {
  const f = flat(s);
  return !BAD.some((w) => f.includes(w));
}

/** A nickname: trimmed, spaces squeezed, at most 20 characters, no control characters. */
export function cleanName(raw: unknown): string {
  // eslint-disable-next-line no-control-regex
  return String(raw ?? '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 20).trim();
}
export function nameProblem(raw: string): string | null {
  const n = cleanName(raw);
  if (n.length < 2) return 'Please use at least two characters for your nickname.';
  if (!isClean(n)) return 'Please pick a different nickname.';
  return null;
}

/** A group code: 4 to 12 letters or digits, upper case. */
export function cleanGroup(raw: unknown): string { return String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12); }
export function groupProblem(raw: string): string | null {
  const g = cleanGroup(raw);
  if (g.length < 4) return 'A group code is 4 to 12 letters or digits.';
  if (!isClean(g)) return 'Please pick a different group code.';
  return null;
}

/** A colour for a name, the same on every device. */
export const COLOURS = ['#b5532f', '#2f6fb5', '#2f8a5b', '#8a4fb5', '#b58a1f', '#b52f6f', '#2f8a8a', '#6b6b2f'];
export function colourFor(name: string): string {
  let h = 7;
  for (const c of name.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLOURS[h % COLOURS.length];
}
