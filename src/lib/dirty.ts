/**
 * Is anything the person typed not yet saved? Used so that an app update never reloads the page over an unsaved edit,
 * and never waits for ever because a saved note is sitting in a text box.
 *
 * An edit is recorded when the person types in (or changes) a text field, a select, a checkbox or a rich-text area. It is cleared only
 * when the database confirms a write to the table that field saves to. A field that is no longer on the page does not count
 * (its edit was either saved, or the page was left on purpose). Loading saved text into a field is not an edit.
 *
 * A field says where it saves with data-saves="notes" (or "journal" ...). Without it, any confirmed write to the person's own data
 * clears it, which errs on the side of calling something saved only when something was.
 */
const edits = new Map<Element, { at: number; table: string }>();
let tick = 0;

const editable = (el: Element | null): el is HTMLElement => {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (el.closest('[data-no-dirty]')) return false;
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
  if (el instanceof HTMLInputElement) return !['search', 'password', 'button', 'submit', 'reset', 'range', 'file'].includes(el.type) && !el.readOnly;
  return el.isContentEditable;
};

const onEdit = (e: Event) => {
  const el = e.target as Element | null;
  if (!editable(el)) return;
  const table = (el.closest('[data-saves]') as HTMLElement | null)?.dataset.saves ?? '*';
  edits.set(el, { at: ++tick, table });
};

let started = false;
export function initDirtyTracking(doc: Document = document) {
  if (started) return;
  started = true;
  doc.addEventListener('input', onEdit, true);
  doc.addEventListener('change', onEdit, true);
  // a read-only view for the browser tests (e2e/updatesafety.mjs)
  try { (globalThis as any).__sbDirty = { isDirty: () => isDirty(), noteSaved }; } catch { /* none */ }
}

/** the database confirmed a write to `table` */
export function noteSaved(table: string) {
  const at = ++tick;
  for (const [el, e] of edits) if (e.at < at && (e.table === '*' || e.table === table)) edits.delete(el);
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
export function resetDirty() { edits.clear(); tick = 0; started = false; }
