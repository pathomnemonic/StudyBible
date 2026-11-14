import { db, type EpisodeProgress } from '../db/db';

/** Mark an episode played or unplayed WITHOUT touching what was really listened to (the hours on the Year page come from `heard`, never from this). */
export async function setPlayed(episodeId: string, completed: boolean, duration?: number) {
  const old = await db.episodeProgress.get(episodeId);
  await db.episodeProgress.put({ ...(old ?? { episodeId, position: 0 }), episodeId, position: 0, completed, duration: duration ?? old?.duration, updatedAt: Date.now() } as EpisodeProgress);
}

/** Add seconds that really played, and note a run to the end. Called by the player only. */
export async function creditListening(episodeId: string, secs: number, patch: { position?: number; duration?: number; ranToEnd?: boolean; completed?: boolean } = {}) {
  const old = await db.episodeProgress.get(episodeId);
  const done = patch.completed ?? old?.completed ?? false;
  await db.episodeProgress.put({
    ...(old ?? {}), episodeId, position: patch.position ?? old?.position ?? 0, duration: patch.duration ?? old?.duration, completed: done,
    heard: Math.round(((old?.heard ?? 0) + Math.max(0, secs)) * 10) / 10, ranToEnd: patch.ranToEnd || old?.ranToEnd || undefined, updatedAt: Date.now(),
  } as EpisodeProgress);
}

/**
 * What the Year page may say about listening. Rows written by the current player carry `heard` (seconds that really played). Older rows have no
 * such field: for those only the place an unfinished episode was left at counts (you did get at least that far); a "completed" older row says nothing
 * about time (it may have been marked played, or caught up by a plan), so it adds none. Episodes played to the end are only those the player saw end.
 */
export function listeningStats(rows: Pick<EpisodeProgress, 'heard' | 'ranToEnd' | 'position' | 'completed'>[]): { hours: number; playedToEnd: number } {
  const secs = rows.reduce((a, r) => a + (r.heard !== undefined ? Math.max(0, r.heard) : !r.completed && r.position > 0 ? r.position : 0), 0);
  return { hours: Math.round(secs / 360) / 10, playedToEnd: rows.filter((r) => r.ranToEnd).length };
}
