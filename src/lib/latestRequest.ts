/**
 * Only the most recent request may write its answer into state. Each `next()` supersedes every earlier ticket, and `cancel()`
 * (used in an effect's cleanup) supersedes the current one, so a slow reply for a card the user has moved past is dropped.
 */
export function latestRequest() {
  let id = 0;
  return {
    next() { const mine = ++id; return { isCurrent: () => mine === id }; },
    cancel() { id++; },
  };
}
