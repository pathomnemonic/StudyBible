import { useEffect, useState } from 'react';
import { loadBiay } from '../data/biay';
import { estimateStart } from '../data/biaySync';
import { usePlayer } from '../data/PlayerContext';
import type { BiayEpisode } from '../data/content';
import { parseRefId, type Ref } from '../lib/refs';
import { rangesOverlap } from '../db/ops';
import type { EditionRecord } from '../data/loader';
import { useToast } from './Toast';
import Icon from './Icon';

/** "Listen from here": plays the Bible in a Year episode that reads this verse, starting about where it is read. */
export default function PlayFromHere({ edition, sel }: { edition: EditionRecord; sel: Ref }) {
  const player = usePlayer();
  const toast = useToast();
  const [ep, setEp] = useState<BiayEpisode | null>(null);
  useEffect(() => {
    let live = true;
    loadBiay().then((b) => {
      if (!live || !b) return;
      const eps = [...b.dayEpisode.values()].filter((e) => e.audio && e.passages.some((p) => { const r = parseRefId(p); return r && rangesOverlap(r, { book: sel.book, c1: sel.c1, c2: sel.c1, v1: sel.v1, v2: sel.v1 }); }));
      setEp(eps.sort((a, b) => (a.day ?? 0) - (b.day ?? 0))[0] ?? null);
    });
    return () => { live = false; };
  }, [sel.book, sel.c1, sel.v1]);
  if (!ep) return null;
  const go = async () => {
    const t = sel.v1 !== undefined ? await estimateStart(ep, edition, { book: sel.book, c: sel.c1, v: sel.v1 }) : null;
    await player.play(ep, t ?? 0);
    const m = t ? `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}` : 'the start';
    toast(`Bible in a Year day ${ep.day}, from about ${m}. The feed has no timestamps, so this is an estimate: use the 15-second buttons to fine-tune.`);
  };
  return (
    <button className="icon-btn" onClick={go} aria-label="Listen to Fr. Mike read this, from here" title="Listen from here (Bible in a Year with Fr. Mike Schmitz)">
      <Icon name="play" />
    </button>
  );
}
