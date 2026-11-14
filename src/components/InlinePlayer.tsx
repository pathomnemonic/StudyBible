import { useEffect, useRef } from 'react';
import type { Embed } from '../lib/embed';
import { claim, release } from '../lib/mediaHost';

/**
 * Plays a video/podcast without leaving the app. This component only reserves the box on the page; the player itself is
 * kept by <MediaHost> so it keeps going when you open another tab (and docks as a small player there).
 */
export default function InlinePlayer({ embed, title }: { embed: Embed; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const src = embed.src;
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    claim(src, embed, title, el);
    return () => release(src, el);
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps
  const style = embed.kind === 'iframe'
    ? (embed.height ? { aspectRatio: 'auto', height: embed.height } : undefined)
    : embed.kind === 'audio' ? { aspectRatio: 'auto', height: 54 } : undefined;
  return <div ref={box} className="inline-player frame host-slot" style={style} role="group" aria-label={`${title} (playing)`} />;
}
