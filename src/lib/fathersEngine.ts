import { getLibraryIndex, getWork } from '../data/content';
import { FathersEngine, type FtIndex, type LoadWork } from './fathersSearch';

const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
let enginePromise: Promise<FathersEngine> | null = null;
let last = 0;
const listeners = new Set<(f: number) => void>();
export const onEngineProgress = (fn: (f: number) => void) => { listeners.add(fn); fn(last); return () => { listeners.delete(fn); }; };
const emit = (f: number) => { last = f; listeners.forEach((l) => l(f)); };

/** Fetch the full-text index (about 10 MB, once) with progress 0..1 (-1 when the size is not known), then build the engine. Cached in memory. */
export function loadEngine(): Promise<FathersEngine> {
  return (enginePromise ??= (async () => {
    const lib = await getLibraryIndex();
    if (!lib) throw new Error('The library index is missing.');
    const res = await fetch(`${base}data/library/fulltext-index.json`);
    if (!res.ok || !res.body) throw new Error(`The search index could not be loaded (${res.status}).`);
    const total = Number(res.headers.get('content-length')) || 0;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value); got += value.length;
      emit(total ? Math.min(0.99, got / total) : -1);
    }
    const buf = new Uint8Array(got);
    let o = 0;
    for (const c of chunks) { buf.set(c, o); o += c.length; }
    const ft = JSON.parse(new TextDecoder().decode(buf)) as FtIndex;
    emit(1);
    return new FathersEngine(ft, lib);
  })().catch((e) => { enginePromise = null; throw e; }));
}

export const loadWork: LoadWork = (id) => getWork(id) as ReturnType<LoadWork>;
