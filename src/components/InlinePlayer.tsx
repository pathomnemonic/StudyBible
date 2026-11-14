import { useEffect, useMemo, useRef } from 'react';
import type { Embed } from '../lib/embed';
import { loadYT, posOf, savePos } from '../lib/videoResume';

const ytId = (src: string) => /youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/.exec(src)?.[1];

/** Plays a video/podcast without leaving the app. iframes are sandboxed and use the platform's own embed. A YouTube video remembers where you stopped and picks up there next time. */
export default function InlinePlayer({ embed, title }: { embed: Embed; title: string }) {
  const id = embed.kind === 'iframe' ? ytId(embed.src) : undefined;
  const ref = useRef<HTMLIFrameElement>(null);
  // Keyed on the address, not the embed object: callers build a fresh object on every render, and saving the position
  // every few seconds re-renders them. A new `start` would reload the iframe each time (the video then kept restarting).
  const base = embed.kind === 'iframe' ? embed.src : '';
  const src = useMemo(() => {
    if (!base || !id) return base;
    const u = new URL(base);
    const saved = posOf(id);
    if (saved && !u.searchParams.has('start')) u.searchParams.set('start', String(Math.max(0, saved.t - 3))); // a few seconds back, to catch the sentence
    u.searchParams.set('enablejsapi', '1');
    u.searchParams.set('origin', location.origin);
    return u.toString();
  }, [base, id]);

  useEffect(() => {
    if (!id || !ref.current) return;
    let live = true, timer = 0;
    let player: { getCurrentTime(): number; getDuration(): number; destroy(): void } | null = null;
    const save = () => { try { if (player) savePos(id, player.getCurrentTime(), player.getDuration(), title); } catch { /* player gone */ } };
    loadYT().then((YT) => {
      if (!live || !YT || !ref.current) return;
      player = new YT.Player(ref.current, { events: { onStateChange: (e) => {
        window.clearInterval(timer);
        if (e.data === 1) timer = window.setInterval(save, 5000); // playing
        else if (e.data === 2 || e.data === 0) save(); // paused or ended
      } } });
    });
    return () => { live = false; window.clearInterval(timer); save(); };
  }, [id, title]);

  if (embed.kind === 'audio') return <audio className="inline-player" controls preload="none" src={embed.src} aria-label={title} />;
  if (embed.kind === 'video') return <video className="inline-player" controls preload="none" src={embed.src} aria-label={title} />;
  return (
    <div className="inline-player frame" style={embed.height ? { aspectRatio: 'auto', height: embed.height } : undefined}>
      <iframe
        ref={ref}
        src={src}
        title={`${title} (${embed.provider})`}
        loading="lazy"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
