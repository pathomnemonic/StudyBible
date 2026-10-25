import { getJson } from './loader';
import type { Ref } from '../lib/refs';
import { parseRefs } from '../lib/refs';
import { convertRef } from '../lib/versification';

export interface Video {
  /** YouTube video id */
  id: string;
  title: string;
  /** the channel, as YouTube reports it */
  channel: string;
  /** passages the video is about, in the usual English numbering */
  refs: string[];
  /** for children */
  kids?: boolean;
  /** why it is attached to these passages, when the video does not name them */
  note?: string;
}
let pack: Promise<Video[]> | null = null;
const load = () => (pack ??= getJson<{ videos: Video[] }>('media/videos.json', true).then((d) => d?.videos ?? []).catch(() => []));

const anchors = (v: Video): Ref[] => v.refs.flatMap((r) => { const p = parseRefs(r); return p.ok ? p.refs.map((x) => convertRef('kjv', 'vulgate', x.ref).ref) : []; });
const overlap = (a: Ref, b: Ref) => a.book === b.book && a.c1 <= b.c2 && b.c1 <= a.c2 && (a.v1 === undefined || b.v1 === undefined || a.c1 !== a.c2 || b.c1 !== b.c2 || (a.v1 <= (b.v2 ?? b.v1!) && b.v1 <= (a.v2 ?? a.v1)));

/** Videos about the selected passages (kids: only the children's ones, or only the others). */
export async function videosFor(sel: Ref[], kids?: boolean): Promise<Video[]> {
  const all = await load();
  return all.filter((v) => (kids === undefined || !!v.kids === kids) && anchors(v).some((a) => sel.some((s) => overlap(a, s))));
}
export const allVideos = load;
