import type { DeepAnswer } from '../data/deepWaters';

export const DEEP_PREVIEW_MS = 3_000;
export const DEEP_LOGBOOK_KEY = 'sb:deepwaters:logbook:v1';
export const DEEP_SESSION_KEY = 'sb:deepwaters:session:v1';

export type DeepPhase = 'preview' | 'playing' | 'locked' | 'done';
export interface DeepRoundRecord {
  promptId: string;
  prompt: string;
  guess: string;
  answer: string | null;
  tier: DeepAnswer['tier'] | null;
  points: number;
  timedOut: boolean;
}
export interface DeepSession {
  version: 1;
  day: number;
  practice: boolean;
  practiceSeed: number;
  promptIds: string[];
  round: number;
  phase: DeepPhase;
  score: number;
  history: DeepRoundRecord[];
  guess: string;
  deadlineAt: number | null;
  remainingMs: number;
  paused: boolean;
  pearlAnswer: string | null;
  pearlFound: boolean;
}
export interface DeepLogEntry {
  day: number;
  score: number;
  scoredRounds: number;
  totalRounds: number;
  pearlFound: boolean;
  practice: boolean;
}

export function createDeepSession(args: {
  day: number; practice: boolean; practiceSeed: number; promptIds: string[];
  pearlAnswer?: string | null; now?: number;
}): DeepSession {
  const now = args.now ?? Date.now();
  return {
    version: 1, day: args.day, practice: args.practice, practiceSeed: args.practiceSeed,
    promptIds: [...args.promptIds], round: 0, phase: 'preview', score: 0, history: [],
    guess: '', deadlineAt: now + DEEP_PREVIEW_MS, remainingMs: DEEP_PREVIEW_MS,
    paused: false, pearlAnswer: args.pearlAnswer ?? null, pearlFound: false,
  };
}

export function pauseDeepSession(session: DeepSession, now = Date.now()): DeepSession {
  if (session.paused || session.phase === 'done' || session.phase === 'locked') return session;
  const remainingMs = session.deadlineAt === null ? session.remainingMs : Math.max(0, session.deadlineAt - now);
  return { ...session, paused: true, deadlineAt: null, remainingMs };
}

export function resumeDeepSession(session: DeepSession, now = Date.now()): DeepSession {
  if (!session.paused || session.phase === 'done' || session.phase === 'locked') return session;
  return { ...session, paused: false, deadlineAt: now + Math.max(0, session.remainingMs) };
}

export function tickDeepSession(session: DeepSession, now = Date.now()): DeepSession {
  if (session.paused || session.deadlineAt === null || now < session.deadlineAt) return session;
  if (session.phase === 'preview') {
    return { ...session, phase: 'playing', deadlineAt: now + 30_000, remainingMs: 30_000 };
  }
  if (session.phase !== 'playing') return session;
  const missed: DeepRoundRecord = {
    promptId: session.promptIds[session.round] ?? '',
    prompt: '', guess: '', answer: null, tier: null, points: 0, timedOut: true,
  };
  return { ...session, phase: 'locked', deadlineAt: null, remainingMs: 0, history: [...session.history, missed] };
}

export function saveDeepSession(session: DeepSession): void {
  try { localStorage.setItem(DEEP_SESSION_KEY, JSON.stringify(session)); } catch { /* local storage may be unavailable */ }
}

export function loadDeepSession(day: number): DeepSession | null {
  try {
    const value = JSON.parse(localStorage.getItem(DEEP_SESSION_KEY) ?? 'null') as DeepSession | null;
    if (!value || value.version !== 1 || value.day !== day || !Array.isArray(value.promptIds) || value.promptIds.length !== 7) return null;
    if (!['preview', 'playing', 'locked', 'done'].includes(value.phase)) return null;
    return value;
  } catch { return null; }
}

export function clearDeepSession(): void {
  try { localStorage.removeItem(DEEP_SESSION_KEY); } catch { /* local storage may be unavailable */ }
}

export function loadDeepLogbook(): DeepLogEntry[] {
  try {
    const value = JSON.parse(localStorage.getItem(DEEP_LOGBOOK_KEY) ?? '[]') as DeepLogEntry[];
    return Array.isArray(value) ? value.filter((x) => x && Number.isInteger(x.day) && Number.isFinite(x.score)) : [];
  } catch { return []; }
}

export function recordDeepDive(entry: DeepLogEntry): DeepLogEntry[] {
  if (entry.practice) return loadDeepLogbook();
  const previous = loadDeepLogbook().filter((x) => x.day !== entry.day);
  const next = [...previous, entry].sort((a, b) => a.day - b.day).slice(-400);
  try { localStorage.setItem(DEEP_LOGBOOK_KEY, JSON.stringify(next)); } catch { /* local storage may be unavailable */ }
  return next;
}

export function deepDiveStreak(entries = loadDeepLogbook(), today = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60_000) / 86_400_000)): number {
  const days = new Set(entries.filter((x) => !x.practice).map((x) => x.day));
  let cursor = days.has(today) ? today : today - 1;
  let streak = 0;
  while (days.has(cursor)) { streak += 1; cursor -= 1; }
  return streak;
}

export function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length];
}
