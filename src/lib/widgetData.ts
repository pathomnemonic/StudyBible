import { db } from '../db/db';
import { isoToday } from './day';
import { isDue } from './srs';
import { parseRefs, formatRef } from './refs';
import { convertRef } from './versification';
import { passageText } from './bibleText';
import { verseForDay } from '../study/verseOfDay';
import { currentStreak, playTotals } from './dailyGame';
import { getSettings } from './store';
import type { EditionRecord } from '../data/loader';

export interface WidgetData {
  /** ISO date the data was made for */
  date: string;
  verse: { ref: string; text: string; edition: string } | null;
  reviewsDue: number;
  streak: number;
  /** games finished in all: shown in place of the streak when streaks are hidden */
  games?: number;
  /** days done in the reader's active plan, if any */
  plan: { name: string; done: number } | null;
}
const KEY = 'sb:widgetData';
/** the reader's own date: the widget's day must turn over at their midnight, not at midnight UTC */
export const widgetDay = () => isoToday();
export const readWidgetData = (): WidgetData | null => { try { const d = JSON.parse(localStorage.getItem(KEY) ?? 'null') as WidgetData | null; return d && d.date === widgetDay() ? d : null; } catch { return null; } };

/** Everything a widget shows, in one small object. */
export async function buildWidgetData(ed: EditionRecord): Promise<WidgetData> {
  let verse: WidgetData['verse'] = null;
  const p = parseRefs(verseForDay());
  if (p.ok) {
    try {
      const vs = await passageText(ed, convertRef('kjv', 'vulgate', p.refs[0].ref).ref, 5);
      if (vs.length) verse = { ref: formatRef(p.refs[0].ref, { noDual: true }), text: vs.map((x) => x.text).join(' ').slice(0, 320), edition: ed.shortName };
    } catch { /* offline edition not saved */ }
  }
  const memory = await db.memory.toArray().catch(() => []);
  const plans = await db.planProgress.filter((x) => x.status === 'active').toArray().catch(() => []);
  const reading = plans.filter((x) => !x.planId.startsWith('cur:'));
  const wanted = getSettings().activePlan;
  const chosen = (wanted ? reading.find((x) => x.planId === wanted) : undefined) ?? reading[0] ?? null;
  let plan: WidgetData['plan'] = null;
  if (chosen) {
    let name = chosen.planId;
    if (chosen.planId === 'biay') name = 'Bible in a Year';
    else if (chosen.planId.startsWith('user:')) { const u = await db.userPlans.get(+chosen.planId.slice(5)).catch(() => undefined); name = u?.name ?? 'My reading plan'; }
    plan = { name, done: chosen.done.length };
  }
  return { date: widgetDay(), verse, reviewsDue: memory.filter((c) => isDue(c)).length, streak: currentStreak(), games: playTotals().games, plan };
}

interface NativeBridge { publish?: (o: { json: string }) => Promise<unknown> | void }
/** Saves today's widget data for the in-app widget views, and hands it to the store app's home-screen widgets when the app runs inside one. */
export async function publishWidgets(ed: EditionRecord) {
  const data = await buildWidgetData(ed);
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* private mode */ }
  try { const b = (window as unknown as { Capacitor?: { Plugins?: { WidgetBridge?: NativeBridge } } }).Capacitor?.Plugins?.WidgetBridge; await b?.publish?.({ json: JSON.stringify(data) }); } catch { /* not in a store app */ }
  return data;
}
