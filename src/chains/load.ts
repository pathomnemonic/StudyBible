import type { Chain, ChainMode, Life, Situation } from './types';
import { memoizeMapPromise } from '../lib/promiseCache';

const files = import.meta.glob('../data/chains/*.json', { import: 'default' }) as Record<string, () => Promise<any[]>>;
const cache = new Map<ChainMode, Promise<Chain[]>>();

/** All chains of one kind, merged from the data files for that mode (arguments.a.json, arguments.b.json, …). */
export function loadChains(mode: ChainMode): Promise<Chain[]> {
  return memoizeMapPromise(cache, mode, async () => {
    const mine = Object.entries(files).filter(([p]) => { const f = p.split('/').pop()!; return f === `${mode}.json` || (f.startsWith(`${mode}.`) && f.endsWith('.json')); }).sort(([a], [b]) => a.localeCompare(b));
    const parts = await Promise.all(mine.map(([, load]) => load()));
    return parts.flat() as Chain[];
  });
}

const other = new Map<string, Promise<any[]>>();
function loadKind<T>(prefix: string): Promise<T[]> {
  return memoizeMapPromise(other, prefix, async () => {
    const mine = Object.entries(files).filter(([p]) => { const f = p.split('/').pop()!; return f === `${prefix}.json` || (f.startsWith(`${prefix}.`) && f.endsWith('.json')); }).sort(([a], [b]) => a.localeCompare(b));
    const parts = await Promise.all(mine.map(([, load]) => load()));
    return parts.flat() as T[];
  });
}
export const loadSituations = () => loadKind<Situation>('situations');
export const loadLives = () => loadKind<Life>('lives');
