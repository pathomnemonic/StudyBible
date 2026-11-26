import { db } from '../db/db';
import { HEBREW_CHAPTERS, parseRefs, refId, type Ref } from '../lib/refs';
import { chapterToAnchorRefs, convertRef } from '../lib/versification';
import { litDay, type LitEvent } from './litcal';
import { getJson } from '../data/loader';

export type Slot = 'first_reading' | 'responsorial_psalm' | 'second_reading' | 'gospel_acclamation' | 'gospel';
export const SLOT_LABEL: Record<Slot, string> = {
  first_reading: 'First Reading',
  responsorial_psalm: 'Responsorial Psalm',
  second_reading: 'Second Reading',
  gospel_acclamation: 'Gospel Acclamation',
  gospel: 'Gospel',
};

import { tNow } from '../lib/i18n';
/** The reading slot's name in the app's language. */
export const slotLabel = (slot: Slot) => tNow(`readings.${slot}` as any);

export interface ReadingItem {
  slot: Slot;
  text: string; // as published, e.g. "Genesis 1:26 – 2:3"
  refs: Ref[]; // anchor refs (Vulgate numbering)
  approximate?: boolean;
  note?: string;
}

export interface DayReadings {
  /** Title of the day as the published list gives it (e.g. “Tuesday of the First Week in Ordinary Time”). */
  title?: string;
  source: 'usccb-refs' | 'litcal' | 'user-lectionary' | 'manual' | 'none';
  sourceNote: string;
  items: ReadingItem[];
  events: LitEvent[];
}

/**
 * The Greek additions to Esther are lettered A to F in the Lectionary's Bible; the Vulgate anchor keeps them as 10:4 to 16:24.
 * The verse divisions inside each addition differ, so a lettered citation opens the matching Vulgate section whole.
 */
const ESTHER_ADDITION = (letter: string, verse: number): Ref | null => {
  const R = (c1: number, v1: number, c2: number, v2: number): Ref => ({ book: 'EST', c1, v1, c2, v2 });
  switch (letter.toUpperCase()) {
    case 'A': return R(11, 2, 12, 6);
    case 'B': return R(13, 1, 13, 7);
    case 'C': return verse <= 11 ? R(13, 8, 13, 18) : R(14, 1, 14, 19);
    case 'D': return R(15, 1, 15, 19);
    case 'E': return R(16, 1, 16, 24);
    case 'F': return R(10, 4, 11, 1);
    default: return null;
  }
};

/**
 * A citation as the published reading lists print it, made readable for the reference parser:
 * "Cf. Mark 9:7", "Psalm 1:1-2, 3, 4 and 6", "Psalm 138:1-2ab, 2cde-3, 7c-8", "Luke 2:22-40 or 2:22-32", "Acts 17:15, 22—18:1",
 * "Psalm 128:1-2, 3, 4-5.". Each of these used to be refused, so the reading had no link to the text at all.
 */
export function cleanCitation(piece: string): string {
  return piece
    .replace(/^\s*(?:cf\.?|see)\s+/i, '')
    .replace(/\s+or\s+.*$/i, '') // a shorter form offered as an alternative: the longer one comes first
    .replace(/\([^)]*\)/g, '') // "(1)" after a psalm (its refrain verse), "(cited in Luke 4:18)"
    .replace(/(\d)[a-z]+\b/gi, '$1') // parts of a verse: 2cde, 7c, 16bc, 15AB
    .replace(/\s+and\s+|\s*&\s*/gi, ', ')
    .replace(/\s*[–—]\s*/g, '-')
    .replace(/[.\s]+$/, '')
    .trim();
}

/** Lectionary references use the Lectionary's (NABRE/Hebrew-tradition) numbering; Psalms are opened by whole psalm. */
export function toItem(slot: Slot, text: string): ReadingItem {
  const refs: Ref[] = [];
  let approximate = false;
  let note: string | undefined;
  for (const piece of text.split('|')) {
    const est = /^\s*Esther\s+([A-F]):(\d+)/i.exec(piece);
    if (est) {
      const r = ESTHER_ADDITION(est[1], +est[2]);
      if (r) { refs.push(r); approximate = true; note = 'The Greek additions to Esther are divided differently in the Vulgate; the whole matching section is opened.'; }
      continue;
    }
    const cleaned = cleanCitation(piece);
    let p = parseRefs(cleaned, { chapters: HEBREW_CHAPTERS });
    // a book name misspelt in the published list ("Phippians", "Sirarch"): accept the one book it can only be
    if (!p.ok && p.suggestions.length) {
      const m = /^((?:[1-4]\s*)?[a-z][a-z ]*?)\s*(\d.*)$/i.exec(cleaned);
      const fixed = m && m[1].replace(/\s+/g, '').length >= 5 ? parseRefs(`${p.suggestions[0]} ${m[2]}`, { chapters: HEBREW_CHAPTERS }) : null;
      if (fixed?.ok) p = fixed;
    }
    if (!p.ok) continue;
    for (const { ref } of p.refs) {
      if (ref.book === 'PSA') {
        // Psalm verse numbers differ between the Lectionary and the Vulgate; open the whole psalm in the anchor.
        // Where one psalm of the Lectionary is two in the Vulgate (116 is 114 and 115, 147 is 146 and 147), the cited verses say which.
        const add = (r: Ref) => { if (!refs.some((x) => refId(x) === refId(r))) refs.push(r); };
        if (ref.v1 !== undefined && ref.c1 === ref.c2) { const m = convertRef('nabre', 'vulgate', ref).ref; for (let c = m.c1; c <= m.c2; c++) add({ book: 'PSA', c1: c, c2: c }); }
        else for (let c = ref.c1; c <= ref.c2; c++) for (const x of chapterToAnchorRefs('nabre', 'PSA', c)) add(x.ref.v1 === undefined ? x.ref : { book: 'PSA', c1: x.ref.c1, c2: x.ref.c2 });
        approximate = true;
        note = 'Psalm numbering differs (Vulgate/Douay vs. Lectionary); the whole psalm is opened.';
      } else {
        // The Lectionary cites the NABRE, which follows the Hebrew numbering: Isaiah 9:1-6 there is 9:2-7 in the Vulgate,
        // Malachi 3:19-20 is 4:1-2, Joel 3:1-5 is 2:28-32. Reading these as English (KJV) numbers opened the wrong verses.
        const c = convertRef('nabre', 'vulgate', ref);
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

/**
 * The bundled reference list is the USCCB's, and a few of its days belong to the United States calendar only.
 * On a United States proper (Thanksgiving Day is the clear case) the listed readings replace the day's own readings,
 * so they must not be shown at all under another calendar. A United States observance can also supply the day's
 * title while the readings themselves stay the ordinary ones every Roman calendar shares (the Day of Prayer for the
 * Legal Protection of Unborn Children; the United States memorials of Neumann, Seton, Kateri Tekakwitha and Cabrini):
 * there the readings may be shown, but the title may not, since the header already names the day in the chosen calendar.
 */
const US_PROPER_TITLES = /^Thanksgiving Day$/;
const US_ONLY_TITLES = /\[In the Dioceses of the United States\]|Day of Prayer for the Legal Protection of Unborn Children|(?:Saint|St\.) (?:John Neumann|Elizabeth Ann Seton|Kateri Tekakwitha|Frances Xavier Cabrini)/;

/** What the bundled (USCCB) list may contribute for the chosen calendar: whether its readings may be used, and whether its title may be shown. */
export function bundledDayFor(nation: string, day: { t: string }): { use: boolean; title?: string } {
  if (nation === 'US') return { use: true, title: day.t };
  if (US_PROPER_TITLES.test(day.t)) return { use: false };
  return { use: true, title: US_ONLY_TITLES.test(day.t) ? undefined : day.t };
}

const ORDINAL_WORDS: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15, sixteenth: 16, seventeenth: 17, eighteenth: 18, nineteenth: 19, twentieth: 20, thirtieth: 30 };
/**
 * The readings page names the day twice: from the computed calendar ("Thursday of the 34th week in Ordinary Time") and from the
 * published list's title ("Thursday of the Thirty-fourth Week in Ordinary Time"). Those are one title in two styles; this
 * recognises the match (spelled-out ordinals and capitalisation aside) so the page does not print the day twice.
 */
export function sameDayTitle(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 -]/g, '').split(/\s+/).map((w) => {
    const num = /^(\d+)(?:st|nd|rd|th)$/.exec(w);
    if (num) return num[1];
    const parts = w.split('-');
    if (parts.length === 2 && ORDINAL_WORDS[parts[0]] !== undefined && ORDINAL_WORDS[parts[1]] !== undefined) return String(ORDINAL_WORDS[parts[0]] + ORDINAL_WORDS[parts[1]]);
    return ORDINAL_WORDS[w] !== undefined ? String(ORDINAL_WORDS[w]) : w;
  }).join(' ');
  return norm(a) === norm(b);
}

export async function readingsFor(nation: string, isoDate: string): Promise<DayReadings> {
  const events = (await litDay(nation, isoDate)) ?? [];
  const user = (await getUserLectionary())[isoDate];
  if (user) {
    const items = (Object.keys(SLOT_LABEL) as Slot[]).filter((s) => user[s]).map((s) => toItem(s, user[s]!));
    if (items.length) return { source: 'user-lectionary', sourceNote: 'From the lectionary data you imported or entered on this device.', items, events };
  }
  const lect = await getJson<{ days: Record<string, { t: string; r: Partial<Record<Slot, string>> }> }>(`lectionary/${isoDate.slice(0, 4)}.json`, true).catch(() => null);
  const day = lect?.days[isoDate];
  if (day) {
    const bundled = bundledDayFor(nation, day);
    if (bundled.use) {
      const items = (Object.keys(SLOT_LABEL) as Slot[]).filter((s) => day.r[s]).map((s) => toItem(s, day.r[s]!));
      if (items.length) return { source: 'usccb-refs', title: bundled.title, sourceNote: nation === 'US' ? 'Reading citations as listed by the USCCB (bible.usccb.org). The passages below are shown in your chosen translation, not the Lectionary wording.' : 'Reading citations from the USCCB list (bible.usccb.org), which gives the Church’s readings for this day; United States observances in that list are not applied to the calendar you chose. The passages are shown in your chosen translation, not the Lectionary wording.', items, events };
    }
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
