import { MYSTERIES } from '../data/devotions';
import { mercyPlan, rosaryPlan } from './plan';

export interface Unfinished { to: string; title: string; detail: string }

/** A Rosary or chaplet left part-way in the last twelve hours, so Pray can offer to carry on from that bead. */
export function unfinishedPrayer(): Unfinished | null {
  try {
    const found: { id: string; n: number; at: number }[] = [];
    for (let k = 0; k < localStorage.length; k++) {
      const key = localStorage.key(k) ?? '';
      const m = /^sb:pray:(rosary-[a-z]+|divine-mercy)$/.exec(key);
      if (!m) continue;
      const [n, at] = (localStorage.getItem(key) ?? '').split('|').map(Number);
      if (n > 0 && Date.now() - (at || 0) < 12 * 3600_000) found.push({ id: m[1], n, at });
    }
    const latest = found.sort((a, b) => b.at - a.at)[0];
    if (!latest) return null;
    const set = MYSTERIES.find((s) => `rosary-${s.id}` === latest.id);
    const plan = latest.id === 'divine-mercy' ? mercyPlan() : set ? rosaryPlan(set) : null;
    if (!plan || latest.n >= plan.steps.length - 1) return null;
    const d = plan.steps[latest.n]?.decade;
    return {
      to: latest.id === 'divine-mercy' ? '/pray/devotions/divine-mercy' : `/pray/devotions/rosary?set=${set!.id}`,
      title: latest.id === 'divine-mercy' ? 'Chaplet of Divine Mercy' : `The Rosary: ${set!.name} mysteries`,
      detail: d === undefined ? 'part-way through' : `decade ${d + 1} of ${plan.decades}`,
    };
  } catch { return null; }
}
