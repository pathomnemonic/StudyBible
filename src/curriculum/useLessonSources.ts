import { useEffect, useMemo, useState } from 'react';
import { useSettings } from '../lib/store';
import { useEditions } from '../data/EditionsContext';
import { parseRefs, formatRef, refId, refsOverlap, type Ref } from '../lib/refs';
import { convertRef } from '../lib/versification';
import { passageText } from '../lib/bibleText';
import { readerPath } from '../lib/nav';
import { cccRange, type CccPara } from '../data/ccc';
import { videosFor, type Video } from '../data/videos';
import { moreArtFor } from '../study/inlineArt';
import { kidsStoriesFor } from '../pages/study/KidsPage';
import { BOOK_PRAYERS } from '../data/prayerbook';
import { cccList, type BandId, type LessonSpec } from './model';

export interface Passage { label: string; ref: Ref; path: string; verses: { v: number; c: number; text: string }[] }

/** Everything the app already has about a lesson’s Scripture, gathered once: the text, the Catechism, videos, art, a children’s retelling and the prayer. */
export function useLessonSources(lesson: LessonSpec | undefined, band: BandId | undefined) {
  const [s] = useSettings();
  const { get, editions } = useEditions();
  const ed = get(s.defaultEdition) ?? editions[0];
  const [passages, setPassages] = useState<Passage[]>([]);
  const [ccc, setCcc] = useState<CccPara[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [art, setArt] = useState<{ id: string; file: string; title: string; artist: string }[]>([]);
  const [story, setStory] = useState<{ id: string; title: string; text: Record<string, string> } | null>(null);

  const refs = useMemo<{ label: string; ref: Ref; anchor: Ref }[]>(() => (lesson?.scripture ?? '').split(';').map((x) => x.trim()).filter(Boolean).flatMap((label) => {
    const p = parseRefs(label);
    return p.ok ? p.refs.map((r) => ({ label, ref: r.ref, anchor: convertRef('kjv', 'vulgate', r.ref).ref })) : [];
  }), [lesson?.id]);

  useEffect(() => {
    let live = true;
    setPassages([]); setCcc([]); setVideos([]); setArt([]); setStory(null);
    if (!lesson) return;
    const anchors = refs.map((r) => r.anchor);
    if (ed) Promise.all(refs.map(async (r) => ({ label: r.label, ref: r.ref, path: readerPath(ed, r.ref), verses: await passageText(ed, r.anchor, 14).catch(() => []) }))).then((p) => live && setPassages(p.filter((x) => x.verses.length)));
    const nums = cccList(lesson.ccc);
    Promise.all(nums.map((n) => cccRange(n, n))).then((x) => live && setCcc(x.flat()));
    videosFor(anchors, band === 'primary' || band === 'elementary' ? true : undefined).then((v) => live && setVideos(v.filter((x) => (band === 'primary' || band === 'elementary' ? true : !x.kids)).slice(0, 4)));
    moreArtFor(anchors).then((a) => live && setArt((a as never as typeof art).slice(0, 3))).catch(() => undefined);
    if (band === 'primary' || band === 'elementary') kidsStoriesFor(anchors).then((xs) => {
      // the story must overlap the passage itself, not just share a chapter
      const hit = xs.find((x) => x.refs.some((sr) => { const p = parseRefs(sr); return p.ok && p.refs.some((q) => { const a = convertRef('kjv', 'vulgate', q.ref).ref; return anchors.some((b) => refsOverlap(a, b)); }); }));
      if (live) setStory(hit ? { id: hit.id, title: hit.title, text: hit.text } : null);
    }).catch(() => undefined);
    return () => { live = false; };
  }, [lesson?.id, ed?.id, band]);

  const prayer = lesson?.prayer ? BOOK_PRAYERS.find((p) => p.id === lesson.prayer) ?? null : null;
  return { passages, ccc, videos, art, story, prayer, refs, ed, refIds: refs.map((r) => refId(r.anchor)), label: (r: Ref) => formatRef(r) };
}
