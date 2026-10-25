import { convertRef } from '../lib/versification';
import { parseRefs, type Ref } from '../lib/refs';

/**
 * The Byzantine day: saints, fasting and the Epistle and Gospel, from the open Orthocal service (orthocal.info), which publishes the
 * Byzantine lectionary as references. It follows the Julian reckoning of Pascha. Only references and names are taken; the Scripture is
 * shown in the reader's own translation. Each day is kept on this device after the first look, so it can be read again offline.
 */
export interface ByzReading { source: string; display: string; refs: Ref[] }
export interface ByzDay {
  titles: string[];
  saints: string[];
  feasts: string[];
  fast: string;
  fastNote: string;
  tone: number | null;
  readings: ByzReading[];
}

const key = (iso: string, old: boolean) => `sb:byz:${old ? 'j' : 'g'}:${iso}`;

export function readingRefs(display: string): Ref[] {
  // Orthocal writes "Galatians 2.16-20; 3.1"; the reader's parser wants "Galatians 2:16-20"
  const p = parseRefs(display.replace(/(\d)\.(\d)/g, '$1:$2'));
  return p.ok ? p.refs.map((x) => convertRef('kjv', 'vulgate', x.ref).ref) : [];
}

export function fromApi(d: any): ByzDay {
  return {
    titles: [...(d.titles ?? []), ...(d.summary_title && !(d.titles ?? []).includes(d.summary_title) ? [d.summary_title] : [])].filter(Boolean),
    saints: d.saints ?? [],
    feasts: d.feasts ?? [],
    fast: d.fast_level_desc ?? '',
    fastNote: d.fast_exception_desc ?? '',
    tone: typeof d.tone === 'number' ? d.tone : null,
    readings: (d.readings ?? []).map((r: any) => ({ source: r.source as string, display: (r.display || r.short_display) as string, refs: readingRefs(r.display || r.short_display || '') })),
  };
}

export async function byzantineDay(iso: string, oldCalendar: boolean): Promise<ByzDay | null> {
  try {
    const hit = localStorage.getItem(key(iso, oldCalendar));
    if (hit) return JSON.parse(hit);
  } catch { /* storage unavailable */ }
  const [y, m, d] = iso.split('-').map(Number);
  try {
    const res = await fetch(`https://orthocal.info/api/${oldCalendar ? 'julian' : 'gregorian'}/${y}/${m}/${d}/`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const day = fromApi(await res.json());
    try { localStorage.setItem(key(iso, oldCalendar), JSON.stringify(day)); } catch { /* storage unavailable */ }
    return day;
  } catch {
    return null;
  }
}
