/** Where you stopped in each video, kept on this device only, so a video picks up where you left off. */
const KEY = 'sb:vpos';
export interface VPos { t: number; d: number; ts: number; title: string }
type Map_ = Record<string, VPos>;

const read = (): Map_ => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Map_; } catch { return {}; } };
const write = (m: Map_) => { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* storage full or blocked */ } };

/** Under this many seconds in, or within the last stretch, a video counts as not started or finished. */
export const START_MIN = 15;
export const finished = (p: VPos) => p.d > 0 && (p.t >= p.d - 20 || p.t / p.d > 0.95);

export function savePos(id: string, t: number, d: number, title: string) {
  const m = read();
  const p: VPos = { t: Math.floor(t), d: Math.floor(d), ts: Date.now(), title };
  if (p.t < START_MIN || finished(p)) delete m[id]; else m[id] = p;
  const keep = Object.entries(m).sort((a, b) => b[1].ts - a[1].ts).slice(0, 60); // a short list is enough
  write(Object.fromEntries(keep));
  window.dispatchEvent(new CustomEvent('studybible:vpos'));
}
export const posOf = (id: string): VPos | undefined => read()[id];
/** Videos you started and have not finished, most recent first. */
export const inProgress = (): { id: string; p: VPos }[] => Object.entries(read()).map(([id, p]) => ({ id, p })).filter((x) => x.p.t >= START_MIN && !finished(x.p)).sort((a, b) => b.p.ts - a.p.ts);
export const clearPos = (id: string) => { const m = read(); delete m[id]; write(m); window.dispatchEvent(new CustomEvent('studybible:vpos')); };

interface YTPlayer { getCurrentTime(): number; getDuration(): number; destroy(): void }
interface YTApi { Player: new (el: HTMLIFrameElement, o: { events: { onStateChange: (e: { data: number }) => void } }) => YTPlayer }
let api: Promise<YTApi | null> | null = null;
/** YouTube's own player script, loaded once and only when a video is played. */
export const loadYT = (): Promise<YTApi | null> => (api ??= new Promise((res) => {
  const w = window as unknown as { YT?: YTApi; onYouTubeIframeAPIReady?: () => void };
  if (w.YT?.Player) return res(w.YT);
  const prev = w.onYouTubeIframeAPIReady;
  w.onYouTubeIframeAPIReady = () => { prev?.(); res(w.YT ?? null); };
  const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true; s.onerror = () => res(null);
  document.head.appendChild(s);
  setTimeout(() => res(w.YT ?? null), 8000);
}));
