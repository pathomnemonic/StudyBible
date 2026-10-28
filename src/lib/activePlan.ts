import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useEditions } from '../data/EditionsContext';
import { builtinPlans, type PlanDay, type PlanDef } from '../plans/builtin';
import { updateSettings, useSettings } from './store';
import { useBiay } from '../data/biay';

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
  const { biay } = useBiay();
  const epRows = useLiveQuery(() => db.episodeProgress.toArray(), []);
  const [built, setBuilt] = useState<PlanDef[]>([]);
  const v = get('vulgate');
  useEffect(() => { if (v) void builtinPlans(v).then(setBuilt); }, [v?.id]);
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
  // the Bible in a Year counts a day as done when you ticked it in the plan or finished its episode in the list, whichever you used
  const heard = new Set((epRows ?? []).filter((r) => r.completed).map((r) => r.episodeId));
  const doneSet = new Set(prog.done);
  if (chosen === 'biay' && biay) plan.days.forEach((_, i) => { if ((biay.releases.get(i + 1) ?? [biay.dayEpisode.get(i + 1)]).some((e) => e && heard.has(e.id))) doneSet.add(i); });
  const firstOpen = plan.days.findIndex((_, i) => !doneSet.has(i));
  const nextIdx = firstOpen < 0 ? plan.days.length - 1 : Math.min(firstOpen, Math.max(todayIdx, firstOpen));
  return {
    plan, todayIdx, nextIdx,
    next: firstOpen < 0 ? null : plan.days[nextIdx],
    finished: firstOpen < 0,
    doneCount: doneSet.size,
    startedAt: prog.startedAt,
    markDone: async (i) => {
      const ep = chosen === 'biay' ? biay?.dayEpisode.get(i + 1) : undefined;
      if (ep) await db.episodeProgress.put({ episodeId: ep.id, position: 0, completed: true, updatedAt: Date.now(), duration: ep.duration ?? undefined });
      const cur = await db.planProgress.get(chosen); if (cur && !cur.done.includes(i)) { const done = [...cur.done, i]; await db.planProgress.put({ ...cur, done, status: done.length >= plan.days.length ? 'finished' : cur.status }); } },
  };
}

export const choosePlan = (id: string) => updateSettings({ activePlan: id });

/**
 * Keeps the plan choice quietly in order, with no prompt: people who never chose a plan get the Bible in a Year podcast, a chosen plan
 * always has progress to show, and anyone already following one plan keeps it.
 */
export function useEnsureActivePlan() {
  const [s] = useSettings();
  const rows = useLiveQuery(() => db.planProgress.toArray(), []);
  useEffect(() => {
    if (!rows) return;
    if (!s.planDefaultV1) {
      const live = rows.filter((r) => r.status !== 'finished');
      const keep = s.activePlan && rows.some((r) => r.planId === s.activePlan) ? s.activePlan : live.length === 1 ? live[0].planId : live.length > 1 ? '' : 'biay';
      updateSettings({ planDefaultV1: true, activePlan: keep });
      return;
    }
    if (s.activePlan && !rows.some((r) => r.planId === s.activePlan)) void db.planProgress.put({ planId: s.activePlan, startedAt: Date.now(), status: 'active', done: [], offsetDays: 0 });
  }, [rows, s.activePlan, s.planDefaultV1]);
}
