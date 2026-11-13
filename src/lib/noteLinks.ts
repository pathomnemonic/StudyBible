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
