import { useEffect, useState } from 'react';
import { getJson } from '../data/loader';

/** Length in seconds and upload date (yyyymmdd) of each YouTube video the app lists, from the YouTube Data API (scripts/videos/enrich.ts). */
export type VideoMeta = Map<string, [number, number]>;
let cache: Promise<VideoMeta | null> | null = null;
export const loadVideoMeta = (): Promise<VideoMeta | null> =>
  (cache ??= getJson<{ d: Record<string, [number, number]> }>('media/video_meta.json', true).then((m) => (m ? new Map(Object.entries(m.d)) : null)).catch(() => null));

export const useVideoMeta = (): VideoMeta | null => {
  const [m, setM] = useState<VideoMeta | null>(null);
  useEffect(() => { let live = true; loadVideoMeta().then((x) => live && setM(x)); return () => { live = false; }; }, []);
  return m;
};

export const youtubeId = (url: string) => /(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/.exec(url)?.[1];

/** "25 min", "1 h 5 min", "45 sec": a length people can take in at a glance. Empty when unknown. */
export function fmtLength(seconds: number | undefined): string {
  if (!seconds || seconds <= 0) return '';
  if (seconds < 90) return `${Math.round(seconds)} sec`;
  const m = Math.round(seconds / 60);
  return m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`;
}
