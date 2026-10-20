/** Words that act out their meaning: fire flickers, water ripples, light glows. Plain CSS, off for reduced motion, English text only. */
const FX: [string, RegExp][] = [
  ['fire', /^(?:fires?|flames?|flaming|burn(?:s|ed|t|ing)?|furnace|coals?|embers?|blaze|blazing|kindled)$/i],
  ['water', /^(?:waters?|rivers?|seas?|floods?|rain|dew|streams?|waves?|springs?|fountains?|deep|ocean)$/i],
  ['light', /^(?:light|lights|lamps?|shine[sd]?|shining|shone|dawn|sun|stars?|bright|brightness|radiant|glory)$/i],
  ['dark', /^(?:darkness|dark|shadows?|night|gloom|dusk)$/i],
  ['wind', /^(?:wind|winds|breath|breathed|breeze|storm|tempest|whirlwind)$/i],
  ['blood', /^(?:blood|bloody|bleeding)$/i],
  ['gold', /^(?:gold|golden|silver|treasure|jewels?)$/i],
  ['quake', /^(?:tremble[sd]?|trembling|shake[sn]?|shaking|quake[sd]?|earthquake|thunder|thundered|lightning)$/i],
  ['tears', /^(?:tears?|weep|wept|weeping|mourn(?:s|ed|ing)?)$/i],
];
const WORD = /[A-Za-z]+/g;

export interface FxHit { start: number; end: number; kind: string }
/** Words in a stretch of text that have an effect (no overlap handling needed: each is a whole word). */
export function findFx(text: string): FxHit[] {
  const out: FxHit[] = [];
  WORD.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = WORD.exec(text))) {
    const f = FX.find(([, re]) => re.test(m![0]));
    if (f) out.push({ start: m.index, end: m.index + m[0].length, kind: f[0] });
  }
  return out;
}
