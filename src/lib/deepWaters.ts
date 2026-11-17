import { DEEP_WATERS, type DeepAnswer, type DeepPrompt } from '../data/deepWaters';
import { seeded, shuffled } from './dailyGame';

export const DEEP_ROUNDS = 7;
export const DEEP_SECONDS = 25;
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

/** Stable daily set; the prompt bank and order are the same for every visit on a given local day. */
export function dailyDeepPrompts(day: number): DeepPrompt[] {
  return shuffled(DEEP_WATERS, seeded(day + 78031)).slice(0, DEEP_ROUNDS);
}
export function practiceDeepPrompts(seed: number): DeepPrompt[] {
  return shuffled(DEEP_WATERS, seeded(seed + 99173)).slice(0, DEEP_ROUNDS);
}
