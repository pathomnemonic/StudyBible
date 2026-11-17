/**
 * The text a player shares after a game, in the manner of the daily word games: a title with the puzzle number, one emoji per round or answer, and nothing that gives an answer away.
 * Kept as plain functions so they can be tested and so every game is shared the same way.
 */
const TIER_EMOJI: Record<number, string> = { 1: '🐟', 2: '🐢', 3: '🐬', 4: '🐋', 5: '🐙', 6: '💎' };
export const CAT_EMOJI: Record<string, string> = { scripture: '📖', saints: '🕊️', history: '🏰', doctrine: '💡', liturgy: '🔔', prayer: '🙏' };

/** a short code for the exact set of questions in the game, so two friends can see they played the same dive */
export function bankSignature(ids: readonly string[]): string {
  let h = 2166136261;
  for (const id of ids) for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(36).slice(0, 4);
}

export function deepWatersShare(o: { day: number; practice: boolean; score: number; rounds: { tier: number | null; points: number }[]; zone: string; pearl: boolean; bank: string }): string {
  const row = o.rounds.map((r) => (r.tier ? TIER_EMOJI[r.tier] ?? '🐟' : '⬛')).join('');
  const metres = (o.score * 10).toLocaleString('en-US');
  return [
    `Deep Waters ${o.practice ? 'practice' : `#${o.day}`}  ${o.score} pts · ${metres} m`,
    row + (o.pearl ? ' ✨' : ''),
    `🌊 ${o.zone}${o.practice ? '' : ` · set ${o.bank}`}`,
  ].join('\n');
}

export function crownQuestShare(o: { winner: string | null; me: { name: string; crowns: string[]; right: number; wrong: number }; vs?: { name: string; crowns: string[] } | null; cats: readonly string[] }): string {
  const row = (crowns: string[]) => o.cats.map((c) => (crowns.includes(c) ? CAT_EMOJI[c] ?? '👑' : '⬛')).join('');
  const verdict = o.winner === null ? `${o.me.crowns.length}/${o.cats.length} crowns` : o.winner === o.me.name ? 'Won' : 'Lost';
  return [
    `Crown Quest 👑 ${verdict}`,
    `${row(o.me.crowns)}  ${o.me.right}✔ ${o.me.wrong}✘`,
    ...(o.vs ? [`${row(o.vs.crowns)}  vs ${o.vs.name}`] : []),
  ].join('\n');
}

export function ladderShare(o: { level: string; marks: boolean[] }): string {
  const rows: string[] = [];
  for (let i = 0; i < o.marks.length; i += 5) rows.push(o.marks.slice(i, i + 5).map((m) => (m ? '🟩' : '⬛')).join(''));
  return `Doctrine ladder 🪜 ${o.level}  ${o.marks.filter(Boolean).length}/${o.marks.length}\n${rows.join('\n')}`;
}
