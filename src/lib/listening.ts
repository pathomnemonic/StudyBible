import { db, type EpisodeProgress } from '../db/db';

/** Mark an episode played or unplayed WITHOUT touching what was really listened to (the hours on the Year page come from `heard`, never from this). */
export async function setPlayed(episodeId: string, completed: boolean, duration?: number) {
  await db.transaction('rw', db.episodeProgress, async () => {
    const old = await db.episodeProgress.get(episodeId);
    await db.episodeProgress.put({ ...(old ?? { episodeId, position: 0 }), episodeId, position: 0, completed, duration: duration ?? old?.duration, updatedAt: Date.now() } as EpisodeProgress);
  });
}

/** Local calendar date, matching the year boundaries used by the Year page. */
export function listeningDay(at = new Date()): string {
  return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;
}

/** Add seconds that really played, and record an actual end event against the day it occurred. */
export async function creditListening(episodeId: string, secs: number, patch: { position?: number; duration?: number; ranToEnd?: boolean; completed?: boolean } = {}, at: Date = new Date()) {
  // The ledger is read-modify-written; serialize concurrent timeupdate, pause, visibility and pagehide saves.
  await db.transaction('rw', db.episodeProgress, async () => {
    const old = await db.episodeProgress.get(episodeId);
    const done = patch.completed ?? old?.completed ?? false;
    const day = listeningDay(at);
    const ledger = { ...(old?.listeningDays ?? {}) };
    const undatedHeard = old?.undatedHeard ?? (old?.heard !== undefined && !Object.keys(old.listeningDays ?? {}).length ? old.heard : undefined);
    const undatedCompletions = old?.undatedCompletions ?? (old?.ranToEnd && !Object.keys(old.listeningDays ?? {}).length ? 1 : undefined);
    // Do not create empty day entries for ordinary position-only saves.
    if (secs > 0 || patch.ranToEnd) {
      const prior = ledger[day] ?? { seconds: 0, completions: 0 };
      ledger[day] = {
        seconds: Math.round((prior.seconds + Math.max(0, secs)) * 10) / 10,
        completions: prior.completions + (patch.ranToEnd ? 1 : 0),
      };
    }
    await db.episodeProgress.put({
      ...(old ?? {}), episodeId, position: patch.position ?? old?.position ?? 0, duration: patch.duration ?? old?.duration, completed: done,
      heard: Math.round(((old?.heard ?? 0) + Math.max(0, secs)) * 10) / 10,
      listeningDays: ledger,
      undatedHeard,
      undatedCompletions,
      ranToEnd: patch.ranToEnd || old?.ranToEnd || undefined, updatedAt: at.getTime(),
    } as EpisodeProgress);
  });
}

/** Year-specific totals come only from dated ledger entries. Legacy cumulative fields have no reliable year and are not reassigned. */
export function listeningStats(rows: Pick<EpisodeProgress, 'listeningDays'>[], year: number): { hours: number; playedToEnd: number } {
  const prefix = `${year}-`;
  const totals = rows.reduce((a, r) => {
    for (const [day, v] of Object.entries(r.listeningDays ?? {})) if (day.startsWith(prefix)) {
      a.seconds += Math.max(0, v.seconds || 0);
      a.completed += Math.max(0, v.completions || 0);
    }
    return a;
  }, { seconds: 0, completed: 0 });
  return { hours: Math.round(totals.seconds / 360) / 10, playedToEnd: totals.completed };
}

/** Older rows with cumulative seconds or a boolean completion cannot be assigned to a calendar year. */
export function hasUndatedListening(rows: Pick<EpisodeProgress, 'heard' | 'ranToEnd' | 'listeningDays' | 'undatedHeard' | 'undatedCompletions'>[]): boolean {
  return rows.some((r) => r.undatedHeard !== undefined || r.undatedCompletions !== undefined || ((r.heard !== undefined || r.ranToEnd) && !Object.keys(r.listeningDays ?? {}).length));
}

