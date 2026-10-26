import { AVE, CREED, FATIMA, GLORIA, MERCY, MYSTERIES, PATER, ROSARY_COLLECT, SALVE, SIGN, type MysterySet } from '../data/devotions';

/**
 * A rosary-bead prayer laid out bead by bead. The same string of beads serves the Rosary and the Chaplet of Divine Mercy,
 * so a plan is a list of physical beads (slots) and a list of prayers, each said on one slot.
 */
export type Zone = 'cross' | 'big' | 'small' | 'link' | 'center' | 'loopsmall' | 'loopbig';
export interface Slot { zone: Zone }
export interface PStep {
  slot: number;
  kind: 'sign' | 'creed' | 'pater' | 'ave' | 'gloria' | 'fatima' | 'mystery' | 'salve' | 'collect' | 'text';
  title: string;
  text?: string;
  note?: string;
  /** Scripture, shown in the reader's own translation */
  refs?: string;
  /** which decade (0 to 4) the step belongs to; undefined for the opening and closing prayers */
  decade?: number;
  /** "3 of 10" */
  of?: [number, number];
}
export interface Plan { id: string; name: string; slots: Slot[]; steps: PStep[]; decades: number }

export const CROSS = 0, BIG = 1, SMALL = [2, 3, 4], LINK = 5, CENTER = 6, LOOP_START = 7;
/** the four large beads of the loop, between the decades */
export const LOOP_BIG = [17, 28, 39, 50];
export const decadeSmalls = (d: number) => Array.from({ length: 10 }, (_, k) => LOOP_START + d * 11 + k);
export const announceSlot = (d: number) => (d === 0 ? CENTER : LOOP_BIG[d - 1]);
export const endSlot = (d: number) => (d < 4 ? LOOP_BIG[d] : CENTER);

export function layout(): Slot[] {
  const s: Slot[] = [{ zone: 'cross' }, { zone: 'big' }, { zone: 'small' }, { zone: 'small' }, { zone: 'small' }, { zone: 'link' }, { zone: 'center' }];
  for (let d = 0; d < 5; d++) {
    for (let k = 0; k < 10; k++) s.push({ zone: 'loopsmall' });
    if (d < 4) s.push({ zone: 'loopbig' });
  }
  return s;
}

const ORD = ['first', 'second', 'third', 'fourth', 'fifth'];

export function rosaryPlan(set: MysterySet): Plan {
  const steps: PStep[] = [
    { slot: CROSS, kind: 'sign', title: 'Sign of the Cross', text: SIGN, note: 'Hold the crucifix.' },
    { slot: CROSS, kind: 'creed', title: 'Apostles’ Creed', text: CREED },
    { slot: BIG, kind: 'pater', title: 'Our Father', text: PATER },
    ...SMALL.map((slot, i): PStep => ({ slot, kind: 'ave', title: 'Hail Mary', text: AVE, of: [i + 1, 3], note: ['For an increase of faith.', 'For an increase of hope.', 'For an increase of charity.'][i] })),
    { slot: LINK, kind: 'gloria', title: 'Glory Be', text: GLORIA },
  ];
  set.mysteries.forEach((m, d) => {
    steps.push({ slot: announceSlot(d), kind: 'mystery', title: `The ${ORD[d]} ${set.name.toLowerCase()} mystery: ${m.title}`, refs: m.refs, note: `Fruit of the mystery: ${m.fruit}.`, decade: d });
    steps.push({ slot: announceSlot(d), kind: 'pater', title: 'Our Father', text: PATER, decade: d });
    decadeSmalls(d).forEach((slot, k) => steps.push({ slot, kind: 'ave', title: 'Hail Mary', text: AVE, decade: d, of: [k + 1, 10] }));
    steps.push({ slot: endSlot(d), kind: 'gloria', title: 'Glory Be', text: GLORIA, decade: d });
    steps.push({ slot: endSlot(d), kind: 'fatima', title: 'Fatima prayer', text: FATIMA, decade: d });
  });
  steps.push({ slot: CENTER, kind: 'salve', title: 'Hail, Holy Queen', text: SALVE });
  steps.push({ slot: CENTER, kind: 'collect', title: 'Closing prayer', text: ROSARY_COLLECT });
  steps.push({ slot: CROSS, kind: 'sign', title: 'Sign of the Cross', text: SIGN });
  return { id: `rosary-${set.id}`, name: `The Rosary: ${set.name} mysteries`, slots: layout(), steps, decades: 5 };
}

const mercyText = (title: string) => MERCY.steps.find((s) => s.title === title)?.text ?? '';
const EXPIRED = mercyText('Opening');
const ETERNAL = 'Eternal Father, I offer You the Body and Blood, Soul and Divinity of Your dearly beloved Son, Our Lord, Jesus Christ, in atonement for our sins and those of the whole world.';
const SAKE = 'For the sake of His sorrowful Passion, have mercy on us and on the whole world.';
const HOLY_GOD = 'Holy God, Holy Mighty One, Holy Immortal One, have mercy on us and on the whole world.';

export function mercyPlan(): Plan {
  const closing = MERCY.steps.find((s) => s.title === 'Optional closing prayer')?.text ?? '';
  const steps: PStep[] = [
    { slot: CROSS, kind: 'sign', title: 'Sign of the Cross', text: SIGN },
    { slot: CROSS, kind: 'text', title: 'Opening', text: EXPIRED, note: 'Optional. Say it once.' },
    { slot: BIG, kind: 'pater', title: 'Our Father', text: PATER },
    { slot: SMALL[0], kind: 'ave', title: 'Hail Mary', text: AVE },
    { slot: SMALL[1], kind: 'creed', title: 'Apostles’ Creed', text: CREED },
  ];
  for (let d = 0; d < 5; d++) {
    steps.push({ slot: announceSlot(d), kind: 'text', title: `Decade ${d + 1}: Eternal Father`, text: ETERNAL, decade: d, note: 'On the large bead.' });
    decadeSmalls(d).forEach((slot, k) => steps.push({ slot, kind: 'text', title: 'For the sake of His sorrowful Passion', text: SAKE, decade: d, of: [k + 1, 10] }));
  }
  [0, 1, 2].forEach((i) => steps.push({ slot: CENTER, kind: 'text', title: 'Holy God', text: HOLY_GOD, of: [i + 1, 3] }));
  if (closing) steps.push({ slot: CENTER, kind: 'text', title: 'Closing prayer', text: closing, note: 'Optional.' });
  steps.push({ slot: CROSS, kind: 'sign', title: 'Sign of the Cross', text: SIGN });
  return { id: 'divine-mercy', name: 'Chaplet of Divine Mercy', slots: layout(), steps, decades: 5 };
}

/** How long a step takes to say at a given pace (words per second), with a floor, for the guided pace and the recording follower. */
export function stepWeight(s: PStep): number {
  const words = (s.text ?? '').trim().split(/\s+/).filter(Boolean).length;
  const reading = s.kind === 'mystery' ? 14 : 0;
  return Math.max(2.5, words / 3 + 1.2) + reading;
}
/** Start time (seconds) of every step if `total` seconds of audio were spread over the steps in proportion to their weight. */
export function stepTimes(steps: PStep[], total: number): number[] {
  const w = steps.map(stepWeight);
  const sum = w.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  return w.map((x) => { const t = (acc / sum) * total; acc += x; return t; });
}
/** The step being said at time `t`, found by the same proportional spread. */
export function stepAt(steps: PStep[], total: number, t: number): number {
  const times = stepTimes(steps, total);
  let lo = 0;
  for (let i = 0; i < times.length; i++) if (times[i] <= t) lo = i; else break;
  return lo;
}
