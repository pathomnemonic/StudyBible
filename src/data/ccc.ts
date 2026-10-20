import { getJson } from './loader';

export interface CccPara { n: number; t: string; fn: { id: number; t: string }[] }
export interface CccIndex { source: string; paragraphs: number; headings: { before: number; t: string }[] }
/** [c1, v1, c2, v2, paragraph, 1 when the footnote quotes the verse] in anchor numbering */
export type CccCite = [number, number, number, number, number, number];

const blocks = new Map<number, Promise<CccPara[]>>();
const block = (b: number) => {
  if (!blocks.has(b)) blocks.set(b, getJson<CccPara[]>(`ccc/p${b}.json`, true).then((x) => x ?? []).catch(() => []));
  return blocks.get(b)!;
};

export const MAX_PARA = 2865;
export const getCccIndex = () => getJson<CccIndex>('ccc/index.json', true).catch(() => null);
export const getCccScripture = (book: string) => getJson<CccCite[]>(`ccc/scripture/${book}.json`, true).catch(() => null);

/** paragraphs from..to inclusive (clamped to the Catechism's 1–2865) */
export async function cccRange(from: number, to: number): Promise<CccPara[]> {
  const lo = Math.max(1, from), hi = Math.min(MAX_PARA, to);
  const out: CccPara[] = [];
  for (let b = Math.floor(lo / 100); b <= Math.floor(hi / 100); b++) out.push(...(await block(b)).filter((p) => p.n >= lo && p.n <= hi));
  return out;
}
export const cccPara = async (n: number) => (await cccRange(n, n))[0] ?? null;

/** the whole text, for searching (loaded only when someone searches) */
export async function cccAll(): Promise<CccPara[]> {
  const parts = await Promise.all(Array.from({ length: 29 }, (_, b) => block(b)));
  return parts.flat();
}
