/** Pure helpers for the up-next queue, so reordering can be tested without a database. */
export interface QRow { id?: number; order: number }

/**
 * The rows in the order the reader sees them, with the one at `from` moved by `by` places (-1 up, +1 down),
 * and fresh order numbers 0..n-1 (so equal or gappy numbers from older additions never stop a move from working).
 * Returns the updates to write, or [] when the move is not possible.
 */
export function moveInQueue<T extends QRow>(rows: T[], from: number, by: number): { id: number; order: number }[] {
  const to = from + by;
  if (from < 0 || from >= rows.length || to < 0 || to >= rows.length || from === to) return [];
  const list = [...rows];
  const [row] = list.splice(from, 1);
  list.splice(to, 0, row);
  return list.flatMap((r, i) => (r.id === undefined ? [] : [{ id: r.id, order: i }]));
}

/** What the screen reader hears after a move. */
export const moveMessage = (title: string, to: number, total: number) => `Moved ${title} to position ${to + 1} of ${total}`;
