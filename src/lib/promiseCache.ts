/** Cache successful asynchronous lookups, but evict rejected promises so a later retry can really run again. */
export function memoizePromise<T>(load: () => Promise<T>): () => Promise<T> {
  let cached: Promise<T> | null = null;
  return () => {
    if (cached) return cached;
    const pending = Promise.resolve().then(load);
    let guarded: Promise<T>;
    guarded = pending.catch((error) => {
      if (cached === guarded) cached = null;
      throw error;
    });
    cached = guarded;
    return guarded;
  };
}

/** The keyed equivalent for independent resources such as one chain mode per cache entry. */
export function memoizeMapPromise<K, T>(
  cache: Map<K, Promise<T>>,
  key: K,
  load: () => Promise<T>,
): Promise<T> {
  const existing = cache.get(key);
  if (existing) return existing;
  const pending = Promise.resolve().then(load);
  let guarded: Promise<T>;
  guarded = pending.catch((error) => {
    if (cache.get(key) === guarded) cache.delete(key);
    throw error;
  });
  cache.set(key, guarded);
  return guarded;
}
