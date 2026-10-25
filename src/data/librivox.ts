import { BOOKS } from '../lib/canon';
import { getJson } from './loader';

/** One LibriVox recording: a list of files (parts). Each plays from its own beginning; nothing is cut or timed. */
export interface Recording {
  id: string;
  title: string;
  reader: string;
  page: string;
  total: string;
  parts: [title: string, url: string, secs: number][];
}
interface Pack {
  about: string;
  works: Record<string, Recording[]>;
  bible: Record<string, Recording>;
}
let pack: Promise<Pack | null> | null = null;
const load = () => (pack ??= getJson<Pack>('media/librivox.json', true).catch(() => null));

/** The LibriVox recordings of a library work (some works have more than one, or are recorded in several volumes). */
export async function recordingsForWork(workId: string): Promise<Recording[]> {
  return (await load())?.works[workId] ?? [];
}
export async function recordedWorkIds(): Promise<Set<string>> {
  return new Set(Object.keys((await load())?.works ?? {}));
}

const FIX: Record<string, string> = { exekiel: 'ezekiel', ephisians: 'ephesians', 'song of solomon': 'song of songs' };
let names: Map<string, string> | null = null;
function bookOf(s: string): string | undefined {
  if (!names) {
    names = new Map();
    for (const b of BOOKS) for (const n of [b.name, b.douayName ?? '', ...b.aliases]) if (n) names.set(n.toLowerCase(), b.id);
    for (const [k, v] of [['psalms', 'PSA'], ['song of solomon', 'SNG'], ['tobit', 'TOB'], ['sirach', 'SIR'], ['wisdom', 'WIS'], ['baruch', 'BAR']]) names.set(k, v);
  }
  const k = s.trim().toLowerCase();
  return names.get(FIX[k] ?? k) ?? names.get(k);
}
/** "Genesis 1-16", "Psalms 1 - 33", "1 John 1 - 5, 2 John 1, 3 John 1" → the chapters a part reads */
export function chaptersOfPart(title: string): { book: string; c: number }[] {
  const out: { book: string; c: number }[] = [];
  let book: string | undefined;
  for (const seg of title.split(',')) {
    const m = /^\s*(?:(.*?)\s+)?(\d+)(?:\s*-\s*(\d+))?\s*$/.exec(seg);
    const mb = m && m[1] ? bookOf(m[1]) : undefined;
    if (mb) book = mb;
    if (!m || !book) {
      const bare = bookOf(seg);
      if (bare) { book = bare; out.push({ book, c: 1 }); }
      continue;
    }
    const a = +m[2], z = m[3] ? +m[3] : a;
    for (let c = a; c <= z; c++) out.push({ book, c });
  }
  return out;
}

export interface ChapterRecording { edition: string; recording: Recording; partIndex: number; part: [string, string, number] }
/** The recorded reading that covers a chapter, if this edition has one (the Douay-Rheims and the World English Bible do). */
export async function recordingForChapter(edition: string, book: string, chapter: number): Promise<ChapterRecording | null> {
  const rec = (await load())?.bible[edition];
  if (!rec) return null;
  for (let i = 0; i < rec.parts.length; i++) {
    if (chaptersOfPart(rec.parts[i][0]).some((x) => x.book === book && x.c === chapter)) return { edition, recording: rec, partIndex: i, part: rec.parts[i] };
  }
  return null;
}
