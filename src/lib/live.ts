import { useLiveQuery as dexieUseLiveQuery } from 'dexie-react-hooks';

/**
 * A live query re-reads the database every time something it depends on changes. If one of those reads fails (the browser
 * aborts the transaction, the connection to the database is being reopened), the hook from dexie-react-hooks throws the
 * error while rendering, and the whole page is replaced by "This page did not load" although nothing is wrong with the
 * reader's data and the next read would have succeeded.
 *
 * So a failed read is tried once more, at once, in a new transaction. A second failure is a real fault and is thrown as
 * before. No timer or other foreign promise is awaited in between, so the retry is still observed by the live query.
 */
export function readTwice<T>(querier: () => Promise<T> | T): () => Promise<T> {
  return async () => {
    try { return await querier(); } catch { return await querier(); }
  };
}

export function useLiveQuery<T>(querier: () => Promise<T> | T, deps?: unknown[]): T | undefined;
export function useLiveQuery<T, D>(querier: () => Promise<T> | T, deps: unknown[], defaultResult: D): T | D;
export function useLiveQuery<T, D>(querier: () => Promise<T> | T, deps?: unknown[], defaultResult?: D): T | D | undefined {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return dexieUseLiveQuery(readTwice(querier), deps ?? [], defaultResult as D);
}
