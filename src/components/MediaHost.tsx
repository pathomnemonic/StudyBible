import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { closeHost, getState, subscribe } from '../lib/mediaHost';
import { loadYT, posOf, savePos } from '../lib/videoResume';

const POS_KEY = 'sb:host:pos';
type Pos = { x: number; y: number };
const loadPos = (): Pos | null => { try { const v = JSON.parse(localStorage.getItem(POS_KEY) || 'null'); return v && Number.isFinite(v.x) && Number.isFinite(v.y) ? v : null; } catch { return null; } };
const savePosition = (p: Pos | null) => { try { if (p) localStorage.setItem(POS_KEY, JSON.stringify(p)); else localStorage.removeItem(POS_KEY); } catch { /* private mode */ } };

const SIZE_KEY = 'sb:host:w';
const MIN_W = 180;
const loadW = (): number | null => { try { const v = Number(localStorage.getItem(SIZE_KEY)); return Number.isFinite(v) && v >= MIN_W ? v : null; } catch { return null; } };
const saveW = (w: number | null) => { try { if (w) localStorage.setItem(SIZE_KEY, String(Math.round(w))); else localStorage.removeItem(SIZE_KEY); } catch { /* private mode */ } };

const ytId = (src: string) => /youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/.exec(src)?.[1];

/** The one player for videos and recordings opened inside pages. It sits over the page's box while that page is open and docks above the tab bar when you go elsewhere. */
export default function MediaHost() {
  const st = useSyncExternalStore(subscribe, getState);
  const item = st.item;
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const anchor = st.anchor;
  // where you have put the docked player (null: its usual corner)
  const [pos, setPos] = useState<Pos | null>(loadPos);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  // how wide you have made the docked player (null: its usual width); the height follows the picture's shape
  const [width, setWidth] = useState<number | null>(loadW);
  const sizing = useRef<{ x: number; w: number } | null>(null);
  const maxW = () => Math.max(MIN_W, Math.min(window.innerWidth - 8, 720));
  /** Keeps the player fully on screen, above the tab bar. */
  const clamp = (x: number, y: number): Pos => {
    const el = box.current; const w = el?.offsetWidth ?? 260, h = el?.offsetHeight ?? 160;
    const tabs = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--tabs-h')) || 60;
    return { x: Math.min(Math.max(0, x), Math.max(0, window.innerWidth - w)), y: Math.min(Math.max(0, y), Math.max(0, window.innerHeight - h - tabs)) };
  };

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

  // docked: place it where the reader put it (kept on screen if the window changes size)
  useEffect(() => {
    const el = box.current;
    if (!el || anchor) return;
    const place = () => { el.style.width = width ? `${Math.min(width, maxW())}px` : ''; if (!pos) { el.style.left = el.style.top = el.style.right = el.style.bottom = ''; return; } const c = clamp(pos.x, pos.y); el.style.left = `${c.x}px`; el.style.top = `${c.y}px`; el.style.right = 'auto'; el.style.bottom = 'auto'; };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [pos, width, anchor, item?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  const move = (x: number, y: number) => { const c = clamp(x, y); setPos(c); return c; };
  const onGripDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const el = box.current; if (!el) return;
    const r = el.getBoundingClientRect();
    drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onGripMove = (e: React.PointerEvent<HTMLButtonElement>) => { if (drag.current) move(e.clientX - drag.current.dx, e.clientY - drag.current.dy); };
  const onGripUp = () => { if (drag.current) { drag.current = null; setPos((p) => { savePosition(p); return p; }); } };
  const resizeTo = (w: number) => {
    const el = box.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const nw = Math.min(Math.max(MIN_W, w), maxW());
    // growing from the top-left corner: fix the player there so it grows right and down, then keep it on screen
    const p = clamp(Math.min(r.left, window.innerWidth - nw), r.top);
    setPos(p); setWidth(nw);
    return nw;
  };
  const onSizeDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const el = box.current; if (!el) return;
    sizing.current = { x: e.clientX, w: el.getBoundingClientRect().width };
    e.currentTarget.setPointerCapture(e.pointerId); e.preventDefault();
  };
  const onSizeMove = (e: React.PointerEvent<HTMLButtonElement>) => { if (sizing.current) resizeTo(sizing.current.w + e.clientX - sizing.current.x); };
  const onSizeUp = () => { if (sizing.current) { sizing.current = null; saveW(width); savePosition(pos); } };
  const onSizeKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const el = box.current; if (!el) return;
    const w = el.getBoundingClientRect().width; const step = e.shiftKey ? 80 : 24;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === '+' || e.key === '=') { e.preventDefault(); const n = resizeTo(w + step); saveW(n ?? null); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === '-') { e.preventDefault(); const n = resizeTo(w - step); saveW(n ?? null); }
    else if (e.key === 'Home' || e.key === 'Escape') { e.preventDefault(); setWidth(null); saveW(null); }
  };
  const onGripKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const el = box.current; if (!el) return;
    const r = el.getBoundingClientRect(); const step = e.shiftKey ? 80 : 24;
    const d = e.key === 'ArrowLeft' ? [-step, 0] : e.key === 'ArrowRight' ? [step, 0] : e.key === 'ArrowUp' ? [0, -step] : e.key === 'ArrowDown' ? [0, step] : null;
    if (d) { e.preventDefault(); savePosition(move(r.left + d[0], r.top + d[1])); }
    else if (e.key === 'Home' || e.key === 'Escape') { setPos(null); savePosition(null); }
  };

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
  const titleRef = useRef(title); titleRef.current = title;
  // One YouTube player per iframe. The iframe is remounted whenever the media's key changes (the same video opened from another page has another
  // address), so the binding is made again for every key, not only for every video id, and the old player is destroyed, not just forgotten.
  useEffect(() => {
    if (!id || !frame.current) return;
    let live = true, timer = 0;
    let player: { getCurrentTime(): number; getDuration(): number; destroy(): void } | null = null;
    const save = () => { try { if (player) savePos(id, player.getCurrentTime(), player.getDuration(), titleRef.current); } catch { /* player gone */ } };
    loadYT().then((YT) => {
      if (!live || !YT || !frame.current) return;
      player = new YT.Player(frame.current, { events: { onStateChange: (e) => {
        window.clearInterval(timer);
        if (e.data === 1) timer = window.setInterval(save, 5000);
        else if (e.data === 2 || e.data === 0) save();
      } } });
    });
    return () => { live = false; window.clearInterval(timer); save(); try { player?.destroy(); } catch { /* the iframe is already gone */ } player = null; };
  }, [id, key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item || !embed) return null;
  const docked = !anchor;
  return (
    <div ref={box} className={`media-host${docked ? ' docked' : ''}${embed.kind === 'audio' ? ' is-audio' : ''}`} role="region" aria-label={docked ? `Now playing: ${title}` : undefined}>
      {docked && (
        <div className="mh-bar">
          <button type="button" className="mh-grip" aria-label="Move the player: drag it, or use the arrow keys. Home puts it back." title="Drag to move" onPointerDown={onGripDown} onPointerMove={onGripMove} onPointerUp={onGripUp} onPointerCancel={onGripUp} onKeyDown={onGripKey} onDoubleClick={() => { setPos(null); savePosition(null); }}>⠿</button>
          <Link to={item.route} className="mh-title" title="Back to where this is on the page">{title}</Link>
          {embed.kind !== 'audio' && <button type="button" className="mh-size" aria-label="Resize the player: drag, or use the arrow keys (plus and minus also work). Home puts it back." title="Drag to resize" onPointerDown={onSizeDown} onPointerMove={onSizeMove} onPointerUp={onSizeUp} onPointerCancel={onSizeUp} onKeyDown={onSizeKey} onDoubleClick={() => { setWidth(null); saveW(null); }}>⤡</button>}
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
