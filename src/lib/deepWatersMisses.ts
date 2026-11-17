/**
 * A private, on-device list of guesses the answer key did not recognise. The key is curated, not exhaustive, so some of these are valid answers
 * that are missing. Nothing is sent anywhere: the player can copy the list and send it to whoever maintains the key, or clear it.
 */
export interface DeepMiss { promptId: string; prompt: string; guess: string; at: string }
const KEY = 'sb:deepwaters:misses:v1';
export const MAX_MISSES = 200;

export function loadDeepMisses(): DeepMiss[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((m) => m && typeof m.promptId === 'string' && typeof m.guess === 'string') : [];
  } catch { return []; }
}

/** Records a guess once per question (the same words twice are one entry); keeps the newest MAX_MISSES. */
export function recordDeepMiss(entry: Omit<DeepMiss, 'at'>, now = new Date()): DeepMiss[] {
  const list = loadDeepMisses();
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!norm(entry.guess) || list.some((m) => m.promptId === entry.promptId && norm(m.guess) === norm(entry.guess))) return list;
  const next = [...list, { ...entry, guess: entry.guess.trim().slice(0, 80), at: now.toISOString().slice(0, 10) }].slice(-MAX_MISSES);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage full or blocked: the game goes on */ }
  return next;
}

export function clearDeepMisses(): void { try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ } }

/** Plain text for pasting into a message: one line per guess. */
export function deepMissesText(list: DeepMiss[]): string {
  return list.map((m) => `${m.promptId}\t${m.guess}\t${m.prompt}`).join('\n');
}
