import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useEditions } from '../data/EditionsContext';
import { builtinPlans, type PlanDay, type PlanDef } from '../plans/builtin';
import { getSettings, updateSettings, useSettings } from './store';
import { loadBiay, useBiay } from '../data/biay';

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
  useEffect(() => { if (rows) void normalizePlans().catch(() => undefined); }, [rows?.length]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!rows || !userPlans) return null;
  const live = rows.filter((r) => isReadingPlan(r.planId) && r.status !== 'finished');
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

/** Lesson progress shares the plan table ("cur:" rows); only the others are reading plans. */
export const isReadingPlan = (id: string) => !id.startsWith('cur:');

/**
 * Begin (or carry on with) a reading plan as the one plan being followed. Any other active plan is paused, not deleted, so there is only ever one plan
 * on Today and in the Bible tab and the reader can come back to the other later. `restart` starts it afresh; `done` and `offsetDays` set where it stands.
 */
export async function startPlan(id: string, init: { restart?: boolean; done?: number[]; offsetDays?: number } = {}) {
  const now = Date.now();
  await db.transaction('rw', db.planProgress, async () => {
    const rows = await db.planProgress.toArray();
    for (const r of rows) if (r.planId !== id && isReadingPlan(r.planId) && r.status === 'active') await db.planProgress.put({ ...r, status: 'paused', pausedAt: now });
    const cur = rows.find((r) => r.planId === id);
    const base = cur && !init.restart
      ? { ...cur, status: 'active' as const, startedAt: cur.status === 'paused' ? cur.startedAt + (now - (cur.pausedAt ?? now)) : cur.startedAt, pausedAt: undefined }
      : { planId: id, startedAt: now, status: 'active' as const, done: [] as number[], offsetDays: 0 };
    await db.planProgress.put({ ...base, ...(init.done ? { done: init.done } : {}), ...(init.offsetDays !== undefined ? { offsetDays: init.offsetDays } : {}) });
  });
  updateSettings({ activePlan: id });
}
/** Make this the plan: starts it, or picks it up again if it was paused. An empty id means no plan. */
export const choosePlan = async (id: string) => { if (!id) { updateSettings({ activePlan: '' }); return; } await startPlan(id); };
/**
 * One plan at a time, for readers who ended up with two (they started a plan before this rule, or listened to Bible in a Year without choosing it).
 * If Bible in a Year is in progress (ticked days, or at least three days' episodes heard) it is the plan; otherwise the chosen plan stays. The rest are paused.
 */
export async function normalizePlans(): Promise<void> {
  const rows = (await db.planProgress.toArray()).filter((r) => isReadingPlan(r.planId));
  const s = getSettings();
  const biay = await loadBiay().catch(() => null);
  const heard = new Set((await db.episodeProgress.filter((r) => !!r.completed).toArray()).map((r) => r.episodeId));
  const heardDays = biay ? [...biay.releases.entries()].filter(([, eps]) => eps.some((e) => heard.has(e.id))).map(([d]) => d) : [];
  const biayRow = rows.find((r) => r.planId === 'biay');
  const biayInProgress = (biayRow?.status === 'active' && biayRow.done.length > 0) || heardDays.length >= 3;
  const active = rows.filter((r) => r.status === 'active');
  const others = active.filter((r) => r.planId !== 'biay');
  if (biayInProgress && (others.length > 0 || (s.activePlan && s.activePlan !== 'biay'))) {
    const n = Math.max(0, ...heardDays);
    await startPlan('biay', biayRow ? {} : { restart: true, done: heardDays.map((d) => d - 1), offsetDays: n });
    return;
  }
  if (active.length > 1) {
    const keep = active.find((r) => r.planId === s.activePlan)?.planId ?? [...active].sort((a, b) => b.startedAt - a.startedAt)[0].planId;
    await startPlan(keep);
  }
}
/** Asks before swapping one active plan for another; true when there is nothing to swap or the reader agrees. */
export async function confirmSwitch(id: string): Promise<boolean> {
  const other = (await db.planProgress.toArray()).find((r) => r.planId !== id && isReadingPlan(r.planId) && r.status === 'active');
  return !other || window.confirm('You are already following a reading plan. Switch to this one? The other is paused, and you can pick it up again.');
}

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
      const live = rows.filter((r) => isReadingPlan(r.planId) && r.status !== 'finished');
      const keep = s.activePlan && rows.some((r) => r.planId === s.activePlan) ? s.activePlan : live.length === 1 ? live[0].planId : live.length > 1 ? '' : 'biay';
      updateSettings({ planDefaultV1: true, activePlan: keep });
      return;
    }
    if (s.activePlan && !rows.some((r) => r.planId === s.activePlan)) void db.planProgress.put({ planId: s.activePlan, startedAt: Date.now(), status: 'active', done: [], offsetDays: 0 });
  }, [rows, s.activePlan, s.planDefaultV1]);
}
