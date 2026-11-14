/**
 * Is anything the person typed not yet saved? Used so that an app update never reloads the page over unsaved typing,
 * and never waits for ever because a saved note is sitting in a text box.
 *
 * Every edit to a text field, select, checkbox or rich-text area gets a revision number. An edit is cleared ONLY by the save of the editor
 * it belongs to, and only if that save carried the same revision:
 *   const done = beginSave('note:12');   // snapshot the revisions of every field of that editor
 *   await write(...);                    // the persistence call
 *   done();                              // runs only if the write succeeded: clears the snapshot revisions, nothing newer
 * Typing again while the write is in flight gives the field a newer revision, so it stays unsaved. A failed write never calls done().
 * Another editor's save, or an unrelated write to the same table, cannot clear anything (there is no table-wide acknowledgement).
 *
 * A field says which editor it belongs to with data-editor="kind:id" on itself or an ancestor. A field with no editor is never cleared by a
 * save elsewhere: it stops counting when it is emptied or leaves the page (a form that clears itself after submitting, or navigation).
 */
const edits = new Map<Element, number>();
let revision = 0;

const editable = (el: Element | null): el is HTMLElement => {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (el.closest('[data-no-dirty]')) return false;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
  if (el instanceof HTMLInputElement) return !['search', 'password', 'button', 'submit', 'reset', 'range', 'file'].includes(el.type) && !el.readOnly;
  return el.isContentEditable;
};

const onEdit = (e: Event) => {
  const el = e.target as Element | null;
  if (editable(el)) edits.set(el, ++revision);
};

export const editorOf = (el: Element): string | null => (el.closest('[data-editor]') as HTMLElement | null)?.dataset.editor ?? null;

/** Start saving the editor `id`: remember which edits this save carries. Call the returned function after the write has succeeded. */
export function beginSave(id: string, root: ParentNode = document): () => void {
  const carried = new Map<Element, number>();
  for (const [el, rev] of edits) if (root.contains(el) && editorOf(el) === id) carried.set(el, rev);
  return () => { for (const [el, rev] of carried) if (edits.get(el) === rev) edits.delete(el); };
}

let started = false;
export function initDirtyTracking(doc: Document = document) {
  if (started) return;
  started = true;
  doc.addEventListener('input', onEdit, true);
  doc.addEventListener('change', onEdit, true);
  // a read-only view for the browser tests (e2e/updatesafety.mjs)
  try { (globalThis as any).__sbDirty = { isDirty: () => isDirty(), beginSave, dirtyEditors: () => [...new Set(dirtyFields().map((e) => editorOf(e) ?? '(no editor)'))] }; } catch { /* none */ }
}

/** fields with an edit that has not been saved, and that are still on the page */
export function dirtyFields(): Element[] {
  for (const el of [...edits.keys()]) {
    // gone from the page, or emptied (a form that clears itself after it is submitted): nothing left to lose
    const empty = (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) ? el.value.trim() === '' && !['checkbox', 'radio'].includes((el as HTMLInputElement).type) : el instanceof HTMLElement && !(el instanceof HTMLSelectElement) && el.isContentEditable && (el.textContent ?? '').trim() === '';
    if (!el.isConnected || empty) edits.delete(el);
  }
  return [...edits.keys()];
}
export const isDirty = () => dirtyFields().length > 0;

/** for tests */
export function resetDirty() { edits.clear(); revision = 0; started = false; }
