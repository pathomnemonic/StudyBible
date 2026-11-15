import { sameValue } from './canonical';

/** A stored done mark matches the item by value, independent of JSON object-key order. */
export function doneKeyMatches(key: string, item: unknown): boolean {
  try { return sameValue(JSON.parse(key), item); } catch { return false; }
}
