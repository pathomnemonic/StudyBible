/** Rules and helpers for the trivia game "Crown Quest": spin the wheel, answer in a category, earn a crown for each, first to six wins. */
export interface TQ { id: string; d: 1 | 2 | 3; q: string; o: string[]; a: number; why: string; src: { kind: string; label: string; ref?: string; ccc?: number; butler?: string; work?: string; section?: string; quote?: string } }
export const CATS = [
  { id: 'scripture', name: 'Scripture', icon: '📖', color: '#4a7bd0' },
  { id: 'saints', name: 'Saints', icon: '🕊️', color: '#d4a017' },
  { id: 'history', name: 'Church history', icon: '🏛️', color: '#b9772e' },
  { id: 'doctrine', name: 'Doctrine', icon: '✝️', color: '#8a5ac2' },
  { id: 'liturgy', name: 'Mass & sacraments', icon: '🍷', color: '#c05050' },
  { id: 'prayer', name: 'Prayer & devotion', icon: '📿', color: '#2f8f6b' },
] as const;
export type CatId = (typeof CATS)[number]['id'];
export const WHEEL = [...CATS.map((c) => c.id as string), 'pick'] as string[];
export const SLICE = 360 / WHEEL.length;
export const NEED = 3; // right answers in a category for its crown
export type Level = 'easy' | 'medium' | 'hard' | 'mixed';
export const LEVELS: { id: Level; label: string; blurb: string; w: [number, number, number]; bot: number }[] = [
  { id: 'easy', label: 'Easy', blurb: 'Questions a school student would know.', w: [0.7, 0.3, 0], bot: 0.55 },
  { id: 'medium', label: 'Medium', blurb: 'A good mix. Most people start here.', w: [0.2, 0.6, 0.2], bot: 0.7 },
  { id: 'hard', label: 'Hard', blurb: 'For the keen and the curious.', w: [0, 0.35, 0.65], bot: 0.82 },
  { id: 'mixed', label: 'All levels', blurb: 'Everything, shuffled together.', w: [0.34, 0.4, 0.26], bot: 0.7 },
];
export const levelOf = (id: Level) => LEVELS.find((l) => l.id === id)!;
export const pickDifficulty = (w: [number, number, number], r: number): 1 | 2 | 3 => (r < w[0] ? 1 : r < w[0] + w[1] ? 2 : 3);

/** The next unused question in a category at about this level; resets the category's used list when everything has been asked. */
export function nextQuestion(pool: TQ[], used: Set<string>, level: Level, rnd: () => number): TQ | undefined {
  if (!pool.length) return undefined;
  let fresh = pool.filter((q) => !used.has(q.id));
  if (!fresh.length) { pool.forEach((q) => used.delete(q.id)); fresh = pool; }
  const d = pickDifficulty(levelOf(level).w, rnd());
  const order = [d, ...([1, 2, 3] as const).filter((x) => x !== d).sort((a, b) => Math.abs(a - d) - Math.abs(b - d))];
  for (const dd of order) { const c = fresh.filter((q) => q.d === dd); if (c.length) return c[Math.floor(rnd() * c.length)]; }
  return fresh[Math.floor(rnd() * fresh.length)];
}
/** Shuffles a question's options and says where the right one went. */
export function shuffleOptions(q: TQ, rnd: () => number): { options: string[]; answer: number } {
  const idx = [0, 1, 2, 3]; for (let i = 3; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return { options: idx.map((i) => q.o[i]), answer: idx.indexOf(q.a) };
}
/** Rotation (degrees, clockwise, cumulative) that brings slice k under the pointer at the top after `spins` full turns. */
export function wheelRotation(current: number, k: number, spins: number): number {
  const centre = k * SLICE + SLICE / 2;
  const base = Math.ceil(current / 360) * 360;
  return base + spins * 360 + (360 - centre);
}
export const botRight = (level: Level, d: number, rnd: () => number) => rnd() < Math.max(0.25, levelOf(level).bot - (d - 2) * 0.1);
export interface Player { name: string; bot?: boolean; crowns: CatId[]; progress: Record<string, number>; right: number; wrong: number }
export const newPlayer = (name: string, bot = false): Player => ({ name, bot, crowns: [], progress: {}, right: 0, wrong: 0 });
export const hasWon = (p: Player) => p.crowns.length >= CATS.length;
/** A category the player could still earn: for the bot's "your pick" slice, the one it is closest to finishing. */
export function bestPick(p: Player): CatId {
  const open = CATS.filter((c) => !p.crowns.includes(c.id));
  return open.sort((a, b) => (p.progress[b.id] ?? 0) - (p.progress[a.id] ?? 0))[0]?.id ?? CATS[0].id;
}
