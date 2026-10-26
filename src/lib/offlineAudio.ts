import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

/**
 * Saving episodes for offline listening. The audio is fetched straight from the publisher (when the publisher allows it), kept in the
 * browser's own storage, and played from there. Episodes are large (about 1 MB a minute), so nothing downloads unless you ask.
 */
export const AUDIO_CACHE = 'studybible-audio-v1';
const BYTES_PER_SECOND = 17000;
export interface SavedAudio { id: string; title: string; show: string; audio: string; bytes: number; ts: number }
export type Saveable = { id: string; title: string; audio: string; duration?: number | null; album?: string };

export const estimateBytes = (durationSec?: number | null) => Math.round((durationSec || 1800) * BYTES_PER_SECOND);
export const fmtBytes = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)} GB` : n >= 1e6 ? `${Math.round(n / 1e6)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);
export const canSave = (audio: string) => /^https?:\/\//.test(audio);

const key = (id: string) => `dl:${id}`;
export async function listSaved(): Promise<SavedAudio[]> {
  const rows = await db.cache.where('key').startsWith('dl:').toArray();
  return rows.map((r) => r.value as SavedAudio).sort((a, b) => b.ts - a.ts);
}
export const useSaved = (): SavedAudio[] => useLiveQuery(listSaved, []) ?? [];
export const isSaved = async (id: string) => !!(await db.cache.get(key(id)));

/** Room left for this site, from the browser's own estimate (null if it will not say). */
export async function spaceLeft(): Promise<number | null> {
  try { const e = await navigator.storage?.estimate?.(); return e?.quota ? e.quota - (e.usage ?? 0) : null; } catch { return null; }
}
export async function totalSavedBytes() { return (await listSaved()).reduce((n, x) => n + x.bytes, 0); }

const urls = new Map<string, string>();
/** A playable address for a saved copy of this audio, or null if it is not saved. */
export async function savedUrl(audio: string): Promise<string | null> {
  if (urls.has(audio)) return urls.get(audio)!;
  if (typeof caches === 'undefined') return null;
  try {
    const c = await caches.open(AUDIO_CACHE);
    const hit = await c.match(audio);
    if (!hit) return null;
    const u = URL.createObjectURL(await hit.blob());
    urls.set(audio, u);
    return u;
  } catch { return null; }
}

export class SaveError extends Error { constructor(public kind: 'blocked' | 'space' | 'network' | 'cancelled' | 'unsupported', msg: string) { super(msg); } }

export async function saveAudio(ep: Saveable, onProgress: (got: number, total: number) => void, signal?: AbortSignal): Promise<void> {
  if (typeof caches === 'undefined') throw new SaveError('unsupported', 'This browser cannot keep files for offline use.');
  const want = estimateBytes(ep.duration);
  const left = await spaceLeft();
  if (left !== null && left < want * 1.15) throw new SaveError('space', `There is not enough room on this device (${fmtBytes(left)} free, about ${fmtBytes(want)} needed). Remove something and try again.`);
  let res: Response;
  try { res = await fetch(ep.audio, { mode: 'cors', signal }); }
  catch (e) {
    if ((e as Error)?.name === 'AbortError') throw new SaveError('cancelled', 'Download stopped.');
    throw new SaveError('blocked', 'This publisher does not allow saving its episodes, or you are offline. It still plays when you are online.');
  }
  if (!res.ok || !res.body) throw new SaveError('network', `The server answered ${res.status}. Try again later.`);
  const total = +(res.headers.get('content-length') ?? 0) || want;
  const reader = res.body.getReader();
  const parts: Uint8Array[] = [];
  let got = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value); got += value.length; onProgress(got, total);
    }
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw new SaveError('cancelled', 'Download stopped.');
    throw new SaveError('network', 'The connection dropped before the episode finished. Nothing was kept; try again.');
  }
  const blob = new Blob(parts as BlobPart[], { type: res.headers.get('content-type') || 'audio/mpeg' });
  try {
    const c = await caches.open(AUDIO_CACHE);
    await c.put(ep.audio, new Response(blob, { headers: { 'content-type': blob.type, 'content-length': String(blob.size) } }));
  } catch { throw new SaveError('space', 'The browser had no room to keep it. Remove something and try again.'); }
  await db.cache.put({ key: key(ep.id), value: { id: ep.id, title: ep.title, show: ep.album ?? '', audio: ep.audio, bytes: blob.size, ts: Date.now() } as SavedAudio, ts: Date.now() });
}

export async function removeAudio(id: string, audio: string) {
  try { const c = await caches.open(AUDIO_CACHE); await c.delete(audio); } catch { /* nothing to remove */ }
  const u = urls.get(audio); if (u) { URL.revokeObjectURL(u); urls.delete(audio); }
  await db.cache.delete(key(id));
}
export async function removeAllAudio() { for (const s of await listSaved()) await removeAudio(s.id, s.audio); }
