import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useEditions } from '../data/EditionsContext';
import { builtinPlans, type PlanDay, type PlanDef } from '../plans/builtin';
import { updateSettings, useSettings } from './store';

export interface ActivePlan {
  plan: PlanDef;
  /** zero-based index of today's day, by the calendar since the plan began */
  todayIdx: number;
  /** the first day not yet checked off, up to today: what to read next */
  nextIdx: number;
  next: PlanDay | null;
  finished: boolean;
  doneCount: number;
  startedAt: number;
  markDone: (i: number) => Promise<void>;
}

/**
 * The one reading plan the person follows, resolved to "what do I read next". It is the plan chosen as theirs (Settings), or, if they never
 * chose, the only plan they have started. Used by the Bible tab, the reader and Today so the next passage is never more than a tap away.
 */
export function useActivePlan(): ActivePlan | null {
  const [s] = useSettings();
  const { get } = useEditions();
  const rows = useLiveQuery(() => db.planProgress.toArray(), []);
  const userPlans = useLiveQuery(() => db.userPlans.toArray(), []);
  const [built, setBuilt] = useState<PlanDef[]>([]);
  const v = get('vulgate');
  useEffect(() => { if (v) void builtinPlans(v).then(setBuilt); }, [v?.id]);
  // a plan chosen in Settings with no progress yet (settings restored on a new device, or progress cleared): begin it today instead of showing nothing
  useEffect(() => {
    if (!rows || !s.activePlan || rows.some((r) => r.planId === s.activePlan)) return;
    void db.planProgress.put({ planId: s.activePlan, startedAt: Date.now(), status: 'active', done: [], offsetDays: 0 });
  }, [rows, s.activePlan]);
  if (!rows || !userPlans) return null;
  const live = rows.filter((r) => r.status !== 'finished');
  const chosen = s.activePlan && rows.find((r) => r.planId === s.activePlan) ? s.activePlan : live.length === 1 ? live[0].planId : '';
  const prog = rows.find((r) => r.planId === chosen);
  if (!prog) return null;
  const plan = chosen.startsWith('user:')
    ? (() => { const u = userPlans.find((x) => x.id === +chosen.slice(5)); return u ? ({ id: chosen, name: u.name, description: '', category: 'bible', days: u.days } as PlanDef) : null; })()
    : built.find((p) => p.id === chosen) ?? null;
  if (!plan) return null;
  const todayIdx = Math.max(0, Math.min(plan.days.length - 1, Math.floor((Date.now() - prog.startedAt) / 86400000) + prog.offsetDays));
  const firstOpen = plan.days.findIndex((_, i) => !prog.done.includes(i));
  const nextIdx = firstOpen < 0 ? plan.days.length - 1 : Math.min(firstOpen, Math.max(todayIdx, firstOpen));
  return {
    plan, todayIdx, nextIdx,
    next: firstOpen < 0 ? null : plan.days[nextIdx],
    finished: firstOpen < 0,
    doneCount: prog.done.length,
    startedAt: prog.startedAt,
    markDone: async (i) => { const cur = await db.planProgress.get(chosen); if (cur && !cur.done.includes(i)) { const done = [...cur.done, i]; await db.planProgress.put({ ...cur, done, status: done.length >= plan.days.length ? 'finished' : cur.status }); } },
  };
}

export const choosePlan = (id: string) => updateSettings({ activePlan: id });
