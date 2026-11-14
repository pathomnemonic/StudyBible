import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { closeHost, getState, subscribe } from '../lib/mediaHost';
import { loadYT, posOf, savePos } from '../lib/videoResume';

const ytId = (src: string) => /youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/.exec(src)?.[1];

/** The one player for videos and recordings opened inside pages. It sits over the page's box while that page is open and docks above the tab bar when you go elsewhere. */
export default function MediaHost() {
  const st = useSyncExternalStore(subscribe, getState);
  const item = st.item;
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const anchor = st.anchor;

  // follow the page's box while there is one (every frame: it moves when the page scrolls)
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (!anchor) { el.style.cssText = ''; return; }
    let raf = 0;
    const tick = () => {
      const r = anchor.getBoundingClientRect();
      el.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;z-index:25;`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [anchor, item?.key]);

  const key = item?.key;
  const embed = item?.embed;
  const id = embed && embed.kind === 'iframe' ? ytId(embed.src) : undefined;
  // the address is fixed when this media is first shown: it starts where you left off, and never reloads while it plays
  const src = useMemo(() => {
    if (!embed || embed.kind !== 'iframe') return '';
    if (!id) return embed.src;
    const u = new URL(embed.src);
    const saved = posOf(id);
    if (saved && !u.searchParams.has('start')) u.searchParams.set('start', String(Math.max(0, saved.t - 3)));
    u.searchParams.set('enablejsapi', '1');
    u.searchParams.set('origin', location.origin);
    return u.toString();
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const title = item?.title ?? '';
  useEffect(() => {
    if (!id || !frame.current) return;
    let live = true, timer = 0;
    let player: { getCurrentTime(): number; getDuration(): number; destroy(): void } | null = null;
    const save = () => { try { if (player) savePos(id, player.getCurrentTime(), player.getDuration(), title); } catch { /* player gone */ } };
    loadYT().then((YT) => {
      if (!live || !YT || !frame.current) return;
      player = new YT.Player(frame.current, { events: { onStateChange: (e) => {
        window.clearInterval(timer);
        if (e.data === 1) timer = window.setInterval(save, 5000);
        else if (e.data === 2 || e.data === 0) save();
      } } });
    });
    return () => { live = false; window.clearInterval(timer); save(); };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item || !embed) return null;
  const docked = !anchor;
  return (
    <div ref={box} className={`media-host${docked ? ' docked' : ''}${embed.kind === 'audio' ? ' is-audio' : ''}`} role="region" aria-label={docked ? `Now playing: ${title}` : undefined}>
      {docked && (
        <div className="mh-bar">
          <Link to={item.route} className="mh-title" title="Back to where this is on the page">{title}</Link>
          <button type="button" className="mh-x" onClick={closeHost} aria-label="Stop and close the player">×</button>
        </div>
      )}
      {embed.kind === 'audio' && <audio key={key} controls autoPlay preload="none" src={embed.src} aria-label={title} />}
      {embed.kind === 'video' && <video key={key} controls autoPlay preload="none" src={embed.src} aria-label={title} playsInline />}
      {embed.kind === 'iframe' && (
        <iframe
          key={key}
          ref={frame}
          src={src}
          title={`${title} (${embed.provider})`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </div>
  );
}
