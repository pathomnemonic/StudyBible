import { db } from '../db/db';
import { isDue } from './srs';
import { parseRefs, formatRef } from './refs';
import { convertRef } from './versification';
import { passageText } from './bibleText';
import { verseForDay } from '../study/verseOfDay';
import { currentStreak } from './dailyGame';
import type { EditionRecord } from '../data/loader';

export interface WidgetData {
  /** ISO date the data was made for */
  date: string;
  verse: { ref: string; text: string; edition: string } | null;
  reviewsDue: number;
  streak: number;
  /** days done in the reader's active plan, if any */
  plan: { name: string; done: number } | null;
}
const KEY = 'sb:widgetData';
export const widgetDay = () => new Date().toISOString().slice(0, 10);
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
  const plan = plans[0] ? { name: plans[0].planId === 'biay' ? 'Bible in a Year' : plans[0].planId, done: plans[0].done.length } : null;
  return { date: widgetDay(), verse, reviewsDue: memory.filter((c) => isDue(c)).length, streak: currentStreak(), plan };
}

interface NativeBridge { publish?: (o: { json: string }) => Promise<unknown> | void }
/** Saves today's widget data for the in-app widget views, and hands it to the store app's home-screen widgets when the app runs inside one. */
export async function publishWidgets(ed: EditionRecord) {
  const data = await buildWidgetData(ed);
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* private mode */ }
  try { const b = (window as unknown as { Capacitor?: { Plugins?: { WidgetBridge?: NativeBridge } } }).Capacitor?.Plugins?.WidgetBridge; await b?.publish?.({ json: JSON.stringify(data) }); } catch { /* not in a store app */ }
  return data;
}
