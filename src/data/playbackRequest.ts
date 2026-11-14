/** Resolve an asynchronous playback lookup only while the request still owns the player. */
export async function resolveIfCurrent<T>(request: number, current: () => number, load: () => Promise<T>): Promise<T | null> {
  const value = await load();
  return request === current() ? value : null;
}
