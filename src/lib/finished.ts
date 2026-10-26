import { db } from '../db/db';
import type { HistoryEntry } from '../db/db';

/**
 * When a chapter counts as read. Opening a page is only a visit (it feeds "continue where you left off"). A chapter is read once the end has been
 * reached after a believable time on the page, or when the person says so. Before this rule (chapters opened up to this date) every visit counted,
 * so those older rows still do, and nothing already earned is lost.
 */
export const FINISHED_CUTOVER = 1793031378047;
export const countsAsRead = (r: Pick<HistoryEntry, 'type' | 'ts'>) => r.type === 'finished' || (r.type === 'read' && r.ts < FINISHED_CUTOVER);

/** Milliseconds a reader plausibly needs for a chapter: its words at a brisk 380 a minute, at least a few seconds, and we ask for a third of it. */
export const minDwellMs = (words: number) => Math.max(6000, Math.round(((words / 380) * 60000) / 3));

export async function markChapterFinished(bookId: string, anchorChapter: number, label: string) {
  const ref = `${bookId}.${anchorChapter}`;
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const have = await db.history.where('ts').aboveOrEqual(dayStart.getTime()).filter((r) => r.type === 'finished' && r.ref === ref).count();
  if (!have) await db.history.add({ ts: Date.now(), type: 'finished', ref, label });
}
export async function unmarkChapterToday(bookId: string, anchorChapter: number) {
  const ref = `${bookId}.${anchorChapter}`;
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  await db.history.where('ts').aboveOrEqual(dayStart.getTime()).filter((r) => r.type === 'finished' && r.ref === ref).delete();
}
