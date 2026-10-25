import { useEffect, useState } from 'react';
import { getBiay, type BiayData, type BiayEpisode } from './content';
import { BOOK_ORDER } from '../lib/canon';
import { parseRefId } from '../lib/refs';
import { registerEpisodes } from './podcasts';

export interface BiayView {
  data: BiayData;
  byId: Map<string, BiayEpisode>;
  /** latest release of each plan day */
  dayEpisode: Map<number, BiayEpisode>;
  /** all releases of each plan day, newest first */
  releases: Map<number, BiayEpisode[]>;
  bonus: BiayEpisode[];
}

let cached: Promise<BiayView | null> | null = null;
export function loadBiay(): Promise<BiayView | null> {
  if (!cached)
    cached = getBiay().then((data) => {
      if (!data) return null;
      registerEpisodes(data.episodes);
      const byId = new Map(data.episodes.map((e) => [e.id, e]));
      const releases = new Map<number, BiayEpisode[]>();
      for (const e of data.episodes) if (e.kind === 'day' && e.day) (releases.get(e.day) ?? releases.set(e.day, []).get(e.day)!).push(e);
      const dayEpisode = new Map<number, BiayEpisode>();
      for (const [d, list] of releases) {
        list.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
        dayEpisode.set(d, list[0]);
      }
      return { data, byId, dayEpisode, releases, bonus: data.episodes.filter((e) => e.kind === 'bonus') };
    });
  return cached;
}

export function useBiay() {
  const [v, setV] = useState<BiayView | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    loadBiay().then((x) => {
      setV(x);
      setDone(true);
    });
  }, []);
  return { biay: v, loaded: done };
}

/** Sort key for "canonical order": first passage of the day in Catholic book order. */
export function canonicalKey(e: BiayEpisode): number {
  const r = e.passages.map((p) => parseRefId(p)).find(Boolean);
  return r ? BOOK_ORDER[r.book] * 100000 + r.c1 * 1000 + (r.v1 ?? 0) : 9e9;
}

export const fmtDuration = (s: number | null | undefined) => {
  if (!s) return '';
  const m = Math.round(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
};
