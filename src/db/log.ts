import { db } from './db';
import { getSettings } from '../lib/store';

/** Writes one line to the reading and listening history, unless the reader switched history off. */
export function logHistory(entry: { ts: number; type: string; ref: string; label: string }) {
  try { if (getSettings().recordHistory === false) return Promise.resolve(0); } catch { /* settings unavailable */ }
  return db.history.add(entry as never);
}
