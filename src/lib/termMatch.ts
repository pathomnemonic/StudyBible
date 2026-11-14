/** "Match the term": pair Catholic terms with their meanings, using the app's own glossary. Only the glossary's wording is shown; nothing is made up. */
import { seeded, shuffled } from './dailyGame';
import type { GlossaryEntry } from '../data/glossary';

export interface MatchRound { pairs: { term: string; meaning: string }[] }

/** the meaning with the term (and its other names) blanked out, so the answer is not in the question */
export function maskMeaning(e: Pick<GlossaryEntry, 'term' | 'aliases' | 'definition'>): string {
  const names = [e.term, ...e.aliases].filter((n) => n.length > 2).sort((a, b) => b.length - a.length);
  let t = e.definition;
  for (const n of names) t = t.replace(new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:s|es|ed|d)?\\b`, 'gi'), '____');
  return t;
}

/** `size` terms with meanings that are short enough to read at a glance and distinct from one another */
export function buildRound(glossary: GlossaryEntry[], seed: number, size = 5): MatchRound {
  const rnd = seeded(seed);
  const ok = glossary.filter((e) => !e.near && e.definition.length >= 30 && e.definition.length <= 170);
  const picked: GlossaryEntry[] = [];
  for (const e of shuffled(ok, rnd)) {
    if (picked.some((p) => p.term.toLowerCase() === e.term.toLowerCase() || p.definition === e.definition)) continue;
    picked.push(e);
    if (picked.length === size) break;
  }
  return { pairs: picked.map((e) => ({ term: e.term, meaning: maskMeaning(e) })) };
}
