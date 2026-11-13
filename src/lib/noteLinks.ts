/** Note-to-note links: write [[Title of another note]] in a note. The link is resolved by title when the note is shown, never stored, so renaming or deleting the target breaks nothing but that one link. */
export interface LinkableNote { id?: number; title?: string }

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
const PATTERN = /\[\[([^\[\]\n]{1,120})\]\]/g;

/** the titles a note links to, in order, each once */
export function linkedTitles(body: string): string[] {
  const out: string[] = [];
  for (const m of body.matchAll(PATTERN)) if (!out.some((t) => norm(t) === norm(m[1]))) out.push(m[1].trim());
  return out;
}

/** replaces [[Title]] with a Markdown link to the note of that title; a title that matches no note stays as plain text with the brackets removed */
export function resolveNoteLinks(body: string, notes: LinkableNote[]): string {
  return body.replace(PATTERN, (_all, title: string) => {
    const hit = notes.find((n) => n.id != null && n.title && norm(n.title) === norm(title));
    return hit ? `[${title.trim()}](#/library/notes/${hit.id})` : title.trim();
  });
}

/** the notes whose body links to the given title */
export function notesLinkingTo<T extends { body: string }>(title: string | undefined, notes: T[]): T[] {
  if (!title?.trim()) return [];
  const t = norm(title);
  return notes.filter((n) => linkedTitles(n.body).some((x) => norm(x) === t));
}

/** When the caret sits inside an unfinished [[ ... , the text typed after it and where the [[ starts; otherwise null. */
export function openLinkAt(body: string, caret: number): { start: number; query: string } | null {
  const before = body.slice(0, caret);
  const start = before.lastIndexOf('[[');
  if (start < 0) return null;
  const typed = before.slice(start + 2);
  if (/[\]\n]/.test(typed) || typed.length > 120) return null;
  return { start, query: typed };
}

/** notes whose title matches what was typed (starts-with first, then contains), never the note being edited; at most `max` */
export function suggestNotes<T extends LinkableNote>(query: string, notes: T[], selfId?: number, max = 6): T[] {
  const q = norm(query);
  const titled = notes.filter((n) => n.title?.trim() && n.id !== selfId);
  const starts = titled.filter((n) => norm(n.title!).startsWith(q));
  const has = titled.filter((n) => !norm(n.title!).startsWith(q) && norm(n.title!).includes(q));
  return [...starts, ...has].slice(0, max);
}

/** the body with the unfinished [[query at `start` completed to [[Title]], and where the caret should go */
export function completeLink(body: string, start: number, caret: number, title: string): { body: string; caret: number } {
  const insert = `[[${title}]]`;
  return { body: body.slice(0, start) + insert + body.slice(caret), caret: start + insert.length };
}
