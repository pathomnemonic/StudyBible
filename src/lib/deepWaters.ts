import { DEEP_WATERS, type DeepAnswer, type DeepPrompt } from '../data/deepWaters';
import { seeded, shuffled } from './dailyGame';

export const DEEP_ROUNDS = 7;
export const DEEP_SECONDS = 30;
export const DEEP_POINTS: Record<DeepAnswer['tier'], number> = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 };
export const DEEP_TIER_NAMES: Record<DeepAnswer['tier'], string> = {
  1: 'Common', 2: 'Less common', 3: 'Uncommon', 4: 'Rare', 5: 'Deep cut'
};
export const normalizeDeepAnswer = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');

export function findDeepAnswer(prompt: DeepPrompt, guess: string): DeepAnswer | null {
  const normalized = normalizeDeepAnswer(guess);
  if (!normalized) return null;
  return prompt.answers.find((entry) => [entry.answer, ...(entry.aliases ?? [])].some((a) => normalizeDeepAnswer(a) === normalized)) ?? null;
}

export function deepEditDistance(a: string, b: string): number {
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

/** Suggestions are shown as choices only; they are never silently accepted. */
export function suggestDeepAnswers(prompt: DeepPrompt, guess: string, limit = 3): DeepAnswer[] {
  const target = normalizeDeepAnswer(guess);
  if (target.length < 4 || findDeepAnswer(prompt, guess)) return [];
  const maxDistance = Math.max(1, Math.floor(target.length * 0.22));
  const matches = new Map<string, { answer: DeepAnswer; distance: number }>();
  for (const entry of prompt.answers) {
    const distance = Math.min(...[entry.answer, ...(entry.aliases ?? [])].map((name) => deepEditDistance(target, normalizeDeepAnswer(name))));
    if (distance <= maxDistance) {
      const previous = matches.get(entry.answer);
      if (!previous || distance < previous.distance) matches.set(entry.answer, { answer: entry, distance });
    }
  }
  return [...matches.values()].sort((a, b) => a.distance - b.distance || a.answer.answer.localeCompare(b.answer.answer)).slice(0, limit).map((x) => x.answer);
}

/** Stable daily set; the prompt bank and order are the same for every visit on a given local day. */
export function dailyDeepPrompts(day: number): DeepPrompt[] {
  // Deterministic rotating bag: globally consistent, no duplicates within a day,
  // and minimum possible overlap between adjacent days for the current bank size.
  const bag = shuffled(DEEP_WATERS, seeded(78031));
  if (bag.length <= DEEP_ROUNDS) return bag;
  const start = ((day - 1) * DEEP_ROUNDS) % bag.length;
  return Array.from({ length: DEEP_ROUNDS }, (_, i) => bag[(start + i) % bag.length]);
}
export function practiceDeepPrompts(seed: number): DeepPrompt[] {
  return shuffled(DEEP_WATERS, seeded(seed + 99173)).slice(0, DEEP_ROUNDS);
}
