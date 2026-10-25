import type { BookData, Edition, PlannedEdition, XrefFile } from '../lib/types';
import { loadVersification, type VersificationData } from '../lib/versification';

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
const cache = new Map<string, Promise<any>>();

/** Fetch a JSON content pack once per session. Missing packs resolve to `null` rather than throwing. */
export function getJson<T>(path: string, optional = false): Promise<T | null> {
  let p = cache.get(path);
  if (!p) {
    p = fetch(`${base}data/${path}`)
      .then((r) => {
        if (!r.ok) {
          if (optional || r.status === 404) return null;
          throw new Error(`${path}: HTTP ${r.status}`);
        }
        return r.json();
      })
      .catch((e) => {
        cache.delete(path);
        if (optional) return null;
        throw e;
      });
    cache.set(path, p);
  }
  return p;
}

export interface EditionRecord extends Edition {
  chapters: Record<string, number>;
  verseCounts: Record<string, number[]>;
}

interface EditionsFile {
  generated: string;
  editions: EditionRecord[];
  planned: PlannedEdition[];
}

let editionsPromise: Promise<EditionsFile> | null = null;

export function loadEditions(): Promise<EditionsFile> {
  if (!editionsPromise) {
    editionsPromise = Promise.all([getJson<EditionsFile>('editions.json'), getJson<VersificationData>('versification.json')]).then(
      ([e, v]) => {
        if (!e || !v) throw new Error('Scripture data is missing. Run `npm run data:all`.');
        loadVersification(v);
        return e;
      },
    );
  }
  return editionsPromise;
}

export const getBookText = (edition: string, book: string) => getJson<BookData>(`bible/${edition}/${book}.json`) as Promise<BookData>;
export const getXrefs = (book: string) => getJson<XrefFile>(`xrefs/${book}.json`, true);

/**
 * Prefetch every book of an edition into the browser cache for offline reading. Each book is checked against the size and
 * checksum in the manifest, and the call throws, naming the books, if any failed or did not match.
 */
export async function downloadEdition(edition: string, books: string[], onProgress: (done: number, total: number) => void, signal?: AbortSignal) {
  const man = await getManifest().catch(() => null);
  const want = man?.editions?.[edition];
  let done = 0;
  const queue = [...books];
  const bad: string[] = [];
  const worker = async () => {
    while (queue.length && !signal?.aborted) {
      const b = queue.shift()!;
      try {
        const r = await fetch(`${base}data/bible/${edition}/${b}.json`, { signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const buf = await r.arrayBuffer();
        if (want && (buf.byteLength !== want.sizes[b] || (crypto?.subtle && hex(await crypto.subtle.digest('SHA-256', buf)).slice(0, 16) !== want.sums[b]))) bad.push(b);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        bad.push(b);
      }
      onProgress(++done, books.length);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  if (signal?.aborted) throw new Error('Download stopped. Start it again to carry on.');
  if (bad.length) throw new Error(`${bad.length} book${bad.length === 1 ? '' : 's'} could not be downloaded or did not match (${bad.slice(0, 5).join(', ')}${bad.length > 5 ? '…' : ''}). Check your connection and try again.`);
}

export async function isEditionCached(edition: string, books: string[]): Promise<boolean> {
  if (!('caches' in window)) return false;
  try {
    const c = await caches.open('studybible-data-v1');
    const keys = await c.keys();
    const have = new Set(keys.map((k) => new URL(k.url).pathname));
    return books.every((b) => [...have].some((p) => p.endsWith(`/bible/${edition}/${b}.json`)));
  } catch {
    return false;
  }
}

export interface StudyPack {
  id: string;
  label: string;
  bytes: number;
  files: string[];
  /** Per-file size in bytes and a short SHA-256 (hex), parallel to `files`. */
  sizes?: number[];
  sums?: string[];
}
export const getManifest = () => getJson<{ generated: string; packs: StudyPack[]; editions?: Record<string, { sizes: Record<string, number>; sums: Record<string, string> }> }>('manifest.json', true);
const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export interface PackResult { failed: string[]; corrupt: string[]; cancelled: boolean; storageFull: boolean }

/**
 * Fetch every file of a study pack so the service worker caches it for offline use. Files already in the offline cache are skipped,
 * so a stopped or failed download resumes where it left off. Each file is checked against the manifest's size and checksum.
 * The pack is marked complete only when nothing failed.
 */
export async function downloadPack(
  pack: StudyPack,
  onProgress: (done: number, total: number, doneBytes: number, totalBytes: number) => void,
  signal?: AbortSignal,
): Promise<PackResult> {
  const have = new Set<string>();
  try {
    if ('caches' in window) for (const k of await (await caches.open('studybible-data-v1')).keys()) have.add(new URL(k.url).pathname);
  } catch { /* no cache API */ }
  const idx = pack.files.map((_, i) => i);
  const sizes = pack.sizes ?? [];
  const total = pack.bytes || sizes.reduce((n, x) => n + x, 0);
  const res: PackResult = { failed: [], corrupt: [], cancelled: false, storageFull: false };
  let done = 0;
  let bytes = 0;
  const step = (i: number) => { done++; bytes += sizes[i] ?? 0; onProgress(done, pack.files.length, bytes, total); };
  const worker = async () => {
    while (idx.length && !res.cancelled && !res.storageFull) {
      if (signal?.aborted) { res.cancelled = true; return; }
      const i = idx.shift()!;
      const f = pack.files[i];
      if ([...have].some((p) => p.endsWith(`/data/${f}`) || p.endsWith(`/${f}`))) { step(i); continue; }
      try {
        const r = await fetch(`${base}data/${f}`, { signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const buf = await r.arrayBuffer();
        if (pack.sizes && buf.byteLength !== pack.sizes[i]) res.corrupt.push(f);
        else if (pack.sums && crypto?.subtle && hex(await crypto.subtle.digest('SHA-256', buf)).slice(0, 16) !== pack.sums[i]) res.corrupt.push(f);
      } catch (e: any) {
        if (e?.name === 'AbortError') { res.cancelled = true; return; }
        if (e?.name === 'QuotaExceededError') { res.storageFull = true; return; }
        res.failed.push(f);
      }
      step(i);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  try {
    if (!res.failed.length && !res.corrupt.length && !res.cancelled && !res.storageFull && pack.files.length) localStorage.setItem(`pack.${pack.id}`, new Date().toISOString());
    else localStorage.removeItem(`pack.${pack.id}`);
  } catch {
    /* storage unavailable */
  }
  return res;
}

/** Whether a pack's files are still in the offline cache (the browser may evict them), so a stale "downloaded" mark can be repaired. */
export async function packStillCached(pack: StudyPack): Promise<boolean> {
  if (!('caches' in window)) return false;
  try {
    const c = await caches.open('studybible-data-v1');
    const have = new Set((await c.keys()).map((k) => new URL(k.url).pathname));
    return pack.files.every((f) => [...have].some((p) => p.endsWith(`/${f}`)));
  } catch {
    return false;
  }
}
