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

/** Prefetch every book of an edition into the browser cache for offline reading. */
export async function downloadEdition(edition: string, books: string[], onProgress: (done: number, total: number) => void) {
  let done = 0;
  const queue = [...books];
  const worker = async () => {
    while (queue.length) {
      const b = queue.shift()!;
      await getBookText(edition, b);
      onProgress(++done, books.length);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
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
}
export const getManifest = () => getJson<{ generated: string; packs: StudyPack[] }>('manifest.json', true);

/** Fetch every file of a study pack so the service worker caches it for offline use. */
export async function downloadPack(pack: StudyPack, onProgress: (done: number, total: number) => void) {
  const queue = [...pack.files];
  let done = 0;
  const worker = async () => {
    while (queue.length) {
      const f = queue.shift()!;
      await getJson(f, true).catch(() => null);
      onProgress(++done, pack.files.length);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  try {
    localStorage.setItem(`pack.${pack.id}`, pack.files.length ? new Date().toISOString() : '');
  } catch {
    /* storage unavailable */
  }
}
