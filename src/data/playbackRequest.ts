/** Resolve an asynchronous playback lookup only while the request still owns the player. */
export async function resolveIfCurrent<T>(request: number, current: () => number, load: () => Promise<T>): Promise<T | null> {
  try {
    const value = await load();
    return request === current() ? value : null;
  } catch (error) {
    if (request !== current()) return null;
    throw error;
  }
}
