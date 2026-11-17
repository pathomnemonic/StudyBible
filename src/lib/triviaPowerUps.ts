/**
 * Crown Quest's coins and power-ups, as in a spin-the-wheel quiz show: coins are earned by answering, and spent on a help during a question.
 * The coins are play money. They are kept on this device, can never be bought, and are worth nothing outside the game.
 */
export type PowerUp = 'bomb' | 'second' | 'swap' | 'time' | 'life';
export interface PowerUpInfo { id: PowerUp; name: string; cost: number; art: string; blurb: string }
export const POWER_UPS: PowerUpInfo[] = [
  { id: 'bomb', name: 'Bomb', cost: 30, art: 'bomb', blurb: 'Removes two wrong answers.' },
  { id: 'second', name: 'Second chance', cost: 40, art: 'shield', blurb: 'A wrong answer does not count; try once more.' },
  { id: 'swap', name: 'Swap', cost: 25, art: 'counterclockwise-arrows-button', blurb: 'A different question in the same category.' },
  { id: 'time', name: '+10 seconds', cost: 15, art: 'hourglass-not-done', blurb: 'Ten more seconds on the clock.' },
  { id: 'life', name: 'Extra life', cost: 50, art: 'red-heart', blurb: 'One more heart (on your own, up to three).' },
];
export const costOf = (id: PowerUp) => POWER_UPS.find((p) => p.id === id)!.cost;

export const COINS = { start: 100, right: 10, crown: 50, win: 100, daily: 50, passStart: 60 } as const;

/** which two wrong answers a Bomb removes (never the right one); `pick` is a 0..1 random source */
export function bombTargets(optionCount: number, answer: number, pick: () => number): number[] {
  const wrong = Array.from({ length: optionCount }, (_, i) => i).filter((i) => i !== answer);
  const out: number[] = [];
  while (out.length < Math.min(2, wrong.length)) { const k = Math.min(wrong.length - 1, Math.floor(pick() * wrong.length)); out.push(wrong.splice(k, 1)[0]); }
  return out.sort((a, b) => a - b);
}

/** what a power-up allows right now (false with the reason shown to the player) */
export function canUse(id: PowerUp, o: { coins: number; used: ReadonlySet<PowerUp>; hearts: number; solo: boolean; mode: 'question' | 'other' }): { ok: boolean; why?: string } {
  if (o.mode !== 'question') return { ok: false, why: 'Only during a question.' };
  if (o.coins < costOf(id)) return { ok: false, why: 'Not enough coins.' };
  if (id === 'life') return o.solo && o.hearts < 3 ? { ok: true } : { ok: false, why: o.solo ? 'Hearts are full.' : 'Hearts are for playing alone.' };
  if (o.used.has(id)) return { ok: false, why: 'Already used on this question.' };
  return { ok: true };
}

/* ---- the wallet ---- */
const KEY = 'sb:trivia:wallet:v1';
export interface Wallet { coins: number; lastDaily: number }
export const loadWallet = (): Wallet => {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? 'null'); if (v && Number.isFinite(v.coins) && v.coins >= 0) return { coins: Math.floor(v.coins), lastDaily: Number.isFinite(v.lastDaily) ? v.lastDaily : -1 }; } catch { /* use the default */ }
  return { coins: COINS.start, lastDaily: -1 };
};
export const saveWallet = (w: Wallet) => { try { localStorage.setItem(KEY, JSON.stringify(w)); } catch { /* private mode */ } };
/** the daily gift: once a calendar day */
export function claimDaily(w: Wallet, day: number): Wallet | null { return w.lastDaily === day ? null : { coins: w.coins + COINS.daily, lastDaily: day }; }
