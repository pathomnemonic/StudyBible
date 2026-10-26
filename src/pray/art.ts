import { useEffect, useState } from 'react';
import { getJson } from '../data/loader';

export interface Pic { id: string; file: string; title: string; artist: string; date: string; credit: string; source?: string }

/** The picture shown with each mystery: public-domain paintings and engravings already in the app's gallery. */
export const MYSTERY_ART: Record<string, string[]> = {
  joyful: ['met-436096', 'cma-1950_91', 'cma-1958_320', 'met-436513', 'dore-166'],
  luminous: ['cma-1950_400', 'met-436801', 'dore-175', 'dore-187', 'dore-202'],
  sorrowful: ['met-442488', 'met-438466', 'met-435580', 'met-439977', 'met-437007'],
  glorious: ['cma-2017_192', 'met-436835', 'dore-224', 'dore-238', 'dore-238'],
};
/** The Chaplet of Divine Mercy: the Crucifixion, and the sources of mercy. */
export const MERCY_ART = ['met-437007', 'met-437007', 'met-437007', 'met-437007', 'met-437007'];
/** One engraving or painting for each of the fourteen Stations, by title, where the gallery has a fitting one. */
export const STATION_ART: (string | null)[] = ['dore-210', 'dore-208', 'dore-211', null, 'dore-211', null, 'dore-211', null, 'dore-211', 'dore-213', 'dore-213', 'dore-216', 'dore-217', 'dore-219'];

let cache: Promise<Map<string, Pic>> | null = null;
export function loadArt(): Promise<Map<string, Pic>> {
  cache ??= getJson<{ works: Pic[] }>('art-more.json', true).then((d) => new Map((d?.works ?? []).map((w) => [w.id, w]))).catch(() => new Map());
  return cache;
}
export function usePic(id: string | null | undefined): Pic | null {
  const [pic, setPic] = useState<Pic | null>(null);
  useEffect(() => {
    let live = true;
    if (!id) { setPic(null); return; }
    loadArt().then((m) => live && setPic(m.get(id) ?? null));
    return () => { live = false; };
  }, [id]);
  return pic;
}
