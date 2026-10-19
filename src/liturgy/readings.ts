import { db } from '../db/db';
import { parseRefs, type Ref } from '../lib/refs';
import { chapterToAnchorRefs, convertRef } from '../lib/versification';
import { litDay, type LitEvent } from './litcal';

export type Slot = 'first_reading' | 'responsorial_psalm' | 'second_reading' | 'gospel_acclamation' | 'gospel';
export const SLOT_LABEL: Record<Slot, string> = {
  first_reading: 'First Reading',
  responsorial_psalm: 'Responsorial Psalm',
  second_reading: 'Second Reading',
  gospel_acclamation: 'Gospel Acclamation',
  gospel: 'Gospel',
};

export interface ReadingItem {
  slot: Slot;
  text: string; // as published, e.g. "Genesis 1:26 – 2:3"
  refs: Ref[]; // anchor refs (Vulgate numbering)
  approximate?: boolean;
  note?: string;
}

export interface DayReadings {
  source: 'litcal' | 'user-lectionary' | 'manual' | 'none';
  sourceNote: string;
  items: ReadingItem[];
  events: LitEvent[];
}

/** Lectionary references use the Lectionary's (NABRE/Hebrew-tradition) numbering; Psalms are opened by whole psalm. */
function toItem(slot: Slot, text: string): ReadingItem {
  const refs: Ref[] = [];
  let approximate = false;
  let note: string | undefined;
  for (const piece of text.split('|')) {
    const p = parseRefs(piece.replace(/\s*[–—]\s*/g, '-').replace(/\(\d+\)/g, ''));
    if (!p.ok) continue;
    for (const { ref } of p.refs) {
      if (ref.book === 'PSA') {
        // Psalm verse numbers differ between the Lectionary and the Vulgate; open the whole psalm in the anchor.
        for (let c = ref.c1; c <= ref.c2; c++) refs.push(...chapterToAnchorRefs('kjv', 'PSA', c).map((x) => x.ref));
        approximate = true;
        note = 'Psalm numbering differs (Vulgate/Douay vs. Lectionary); the whole psalm is opened.';
      } else {
        const c = convertRef('kjv', 'vulgate', ref);
        refs.push(c.ref);
        if (!c.exact) approximate = true;
      }
    }
  }
  return { slot, text: text.replace(/\|/g, ' or '), refs, approximate, note };
}

export async function getUserLectionary(): Promise<Record<string, Partial<Record<Slot, string>>>> {
  const row = await db.cache.get('lectionary');
  const man = await db.cache.get('lectionary-manual');
  return { ...((row?.value as any) ?? {}), ...((man?.value as any) ?? {}) };
}

export async function saveManualReadings(date: string, r: Partial<Record<Slot, string>>) {
  const row = await db.cache.get('lectionary-manual');
  const v = { ...((row?.value as any) ?? {}), [date]: r };
  await db.cache.put({ key: 'lectionary-manual', value: v, ts: Date.now() });
}

export async function importLectionary(json: string): Promise<number> {
  const data = JSON.parse(json) as Record<string, Partial<Record<Slot, string>>>;
  let n = 0;
  for (const [k, v] of Object.entries(data)) if (/^\d{4}-\d{2}-\d{2}$/.test(k) && v && typeof v === 'object') n++;
  if (!n) throw new Error('Expected an object keyed by YYYY-MM-DD with first_reading / responsorial_psalm / second_reading / gospel strings.');
  const old = await db.cache.get('lectionary');
  await db.cache.put({ key: 'lectionary', value: { ...((old?.value as any) ?? {}), ...data }, ts: Date.now() });
  return n;
}

export async function readingsFor(nation: string, isoDate: string): Promise<DayReadings> {
  const events = (await litDay(nation, isoDate)) ?? [];
  const user = (await getUserLectionary())[isoDate];
  if (user) {
    const items = (Object.keys(SLOT_LABEL) as Slot[]).filter((s) => user[s]).map((s) => toItem(s, user[s]!));
    if (items.length) return { source: 'user-lectionary', sourceNote: 'From the lectionary data you imported or entered on this device.', items, events };
  }
  // LitCal provides the readings of solemnities, feasts and some celebrations; ordinary weekdays and Sundays are not included.
  for (const e of events) {
    const r = e.readings;
    if (r && typeof r === 'object') {
      const flat: Record<string, string> = (typeof (r as any).first_reading === 'string' ? r : (r as any).day ?? (r as any).night ?? {}) as any;
      const items = (Object.keys(SLOT_LABEL) as Slot[]).filter((s) => flat[s]).map((s) => toItem(s, flat[s]));
      if (items.length) return { source: 'litcal', sourceNote: `Reference list for “${e.name}” from the LitCal open calendar service (references only; the Lectionary text is not included).`, items, events };
    }
  }
  return {
    source: 'none',
    sourceNote:
      'The Lectionary for Mass is copyrighted, and no open data source lists the daily references for ordinary Sundays and weekdays. Use the official links below, or import/enter the references yourself and they will open in the reader.',
    items: [],
    events,
  };
}
