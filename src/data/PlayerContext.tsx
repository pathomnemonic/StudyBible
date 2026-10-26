import { savedUrl } from '../lib/offlineAudio';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { db } from '../db/db';
import { loadBiay } from './biay';
import { lookupEpisode, registerEpisodes } from './podcasts';
import type { BiayEpisode } from './content';

interface PlayerState {
  current: BiayEpisode | null;
  playing: boolean;
  position: number;
  duration: number;
  rate: number;
  play: (e: BiayEpisode, startAt?: number) => Promise<void>;
  toggle: () => void;
  seek: (t: number) => void;
  skip: (d: number) => void;
  setRate: (r: number) => void;
  stop: () => void;
  /** pause after some minutes, or at the end of the episode */
  sleep: { mode: 'off' | 'minutes' | 'end'; left: number };
  setSleep: (m: 'off' | 'end' | number) => void;
  /** the part of an episode id that names its show, for per-show settings */
  showKey: string;
}

const Ctx = createContext<PlayerState | null>(null);
/** audio files the reader added live in the browser's own storage; turn the reference into something an audio element can play */
const blobUrls = new Map<string, string>();
export async function audioUrl(src: string): Promise<string> {
  if (!src.startsWith('idb:')) return (await savedUrl(src)) ?? src;
  const id = src.slice(4);
  if (blobUrls.has(id)) return blobUrls.get(id)!;
  const row = await db.userAudio.get(id);
  if (!row) return '';
  const u = URL.createObjectURL(row.blob);
  blobUrls.set(id, u);
  return u;
}

export const usePlayer = () => useContext(Ctx)!;

/** pod-<show>-<hash>, u-<hash>-<hash>, lv:<recording>:<part>, or an episode of the Bible in a Year */
export const showKeyOf = (id: string) => (id.startsWith('pod-') ? id.split('-').slice(0, -1).join('-') : id.startsWith('u-') ? id.split('-').slice(0, 2).join('-') : id.startsWith('lv:') ? id.split(':').slice(0, 2).join(':') : 'biay');
const ls = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };
export const showSetting = (key: string, what: 'rate' | 'skip') => Number(ls(`sb:${what}:${key}`)) || 0;
export const setShowSetting = (key: string, what: 'rate' | 'skip', v: number) => lsSet(`sb:${what}:${key}`, String(v));

/** Keep a copy of an episode's details so it can be resumed, queued or advanced to even when its show is not loaded. */
export const rememberEpisode = (e: BiayEpisode) => db.cache.put({ key: `ep:${e.id}`, value: e as unknown as string, ts: Date.now() }).catch(() => undefined);
export async function resolveEpisode(id: string): Promise<BiayEpisode | undefined> {
  const hit = lookupEpisode(id);
  if (hit) return hit;
  const row = await db.cache.get(`ep:${id}`);
  const ep = row?.value as unknown as BiayEpisode | undefined;
  if (ep && typeof ep === 'object') { registerEpisodes([ep]); return ep; }
  return undefined;
}

/**
 * One global <audio> element so playback continues while navigating. Uses the Media Session API for lock-screen /
 * background controls where the browser supports it. The audio is the publisher's own enclosure URL from the
 * official feed; nothing is copied or re-hosted.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<BiayEpisode | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRateState] = useState(() => { try { return Number(localStorage.getItem('sb:rate')) || 1; } catch { return 1; } });
  const lastSave = useRef(0);
  const [sleep, setSleepState] = useState<{ mode: 'off' | 'minutes' | 'end'; left: number }>({ mode: 'off', left: 0 });
  const sleepRef = useRef(sleep);
  sleepRef.current = sleep;

  useEffect(() => {
    const a = new Audio();
    a.preload = 'none';
    a.playbackRate = rate;
    audio.current = a;
    const save = (completed = false) => {
      const cur = (a as any)._ep as BiayEpisode | undefined;
      if (!cur) return;
      const dur = a.duration || undefined;
      const done = completed || (dur ? a.currentTime > dur - 20 : false);
      db.episodeProgress.put({ episodeId: cur.id, position: done ? 0 : a.currentTime, duration: dur, completed: done || undefined as any, updatedAt: Date.now() }).catch(() => {});
    };
    a.addEventListener('timeupdate', () => {
      setPosition(a.currentTime);
      if (Date.now() - lastSave.current > 5000) {
        lastSave.current = Date.now();
        save();
      }
    });
    a.addEventListener('loadedmetadata', () => setDuration(a.duration || 0));
    a.addEventListener('play', () => setPlaying(true));
    a.addEventListener('pause', () => {
      setPlaying(false);
      save();
    });
    a.addEventListener('ended', async () => {
      save(true);
      if (sleepRef.current.mode === 'end') { setSleepState({ mode: 'off', left: 0 }); return; }
      // advance through the personal queue
      const q = await db.queue.orderBy('order').toArray();
      const cur = (a as any)._ep as BiayEpisode | undefined;
      const idx = q.findIndex((x) => x.episodeId === cur?.id);
      const next = idx >= 0 ? q[idx + 1] : q[0];
      if (idx >= 0) await db.queue.delete(q[idx].id!);
      if (next) {
        await loadBiay();
        const ep = await resolveEpisode(next.episodeId);
        if (ep) play(ep);
      }
    });
    const hide = () => { if (document.visibilityState === 'hidden') save(); };
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', () => save());
    // after a reload, bring back the last thing played, paused, at the place it stopped
    db.cache.get('player:last').then(async (row) => {
      const id = row?.value as unknown as string | undefined;
      if (!id || (a as any)._ep) return;
      const ep = await resolveEpisode(id);
      const prog = await db.episodeProgress.get(id);
      if (!ep || (a as any)._ep || prog?.completed) return;
      (a as any)._ep = ep;
      a.src = await audioUrl(ep.audio);
      a.preload = 'metadata';
      a.addEventListener('loadedmetadata', () => { a.currentTime = prog?.position ?? 0; }, { once: true });
      setCurrent(ep);
      setPosition(prog?.position ?? 0);
    });
    return () => {
      document.removeEventListener('visibilitychange', hide);
      a.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = useCallback(async (e: BiayEpisode, startAt?: number) => {
    const a = audio.current!;
    if ((a as any)._ep?.id === e.id && startAt !== undefined) a.currentTime = startAt;
    void rememberEpisode(e);
    db.cache.put({ key: 'player:last', value: e.id as unknown as string, ts: Date.now() }).catch(() => undefined);
    if ((a as any)._ep?.id !== e.id) {
      (a as any)._ep = e;
      a.src = await audioUrl(e.audio);
      setCurrent(e);
      const prog = await db.episodeProgress.get(e.id);
      const sk = showSetting(showKeyOf(e.id), 'skip');
      const at = startAt ?? (prog && !prog.completed && prog.position > 0 ? prog.position : sk);
      a.addEventListener('loadedmetadata', () => (a.currentTime = at), { once: true });
    }
    const own = showSetting(showKeyOf(e.id), 'rate');
    a.playbackRate = own || rate;
    if (own) setRateState(own);
    try {
      await a.play();
    } catch {
      /* autoplay blocked: user can press play */
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: e.title, artist: e.artist ?? e.album ?? 'Ascension', album: e.album ?? 'The Bible in a Year' });
      navigator.mediaSession.setActionHandler('play', () => a.play());
      navigator.mediaSession.setActionHandler('pause', () => a.pause());
      navigator.mediaSession.setActionHandler('seekbackward', () => (a.currentTime = Math.max(0, a.currentTime - 15)));
      navigator.mediaSession.setActionHandler('seekforward', () => (a.currentTime = a.currentTime + 30));
      navigator.mediaSession.setActionHandler('nexttrack', () => { a.currentTime = a.duration || a.currentTime; });
      navigator.mediaSession.setActionHandler('previoustrack', () => { a.currentTime = 0; });
    }
  }, [rate]);

  useEffect(() => {
    if (sleep.mode !== 'minutes') return;
    const id = setInterval(() => setSleepState((x) => { if (x.mode !== 'minutes') return x; if (x.left <= 1) { audio.current?.pause(); return { mode: 'off', left: 0 }; } return { mode: 'minutes', left: x.left - 1 }; }), 1000);
    return () => clearInterval(id);
  }, [sleep.mode]);

  const value = useMemo<PlayerState>(
    () => ({
      current,
      playing,
      position,
      duration,
      rate,
      play,
      toggle: () => (audio.current!.paused ? audio.current!.play() : audio.current!.pause()),
      seek: (t) => (audio.current!.currentTime = t),
      skip: (d) => (audio.current!.currentTime = Math.max(0, audio.current!.currentTime + d)),
      setRate: (r) => {
        setRateState(r);
        try { localStorage.setItem('sb:rate', String(r)); } catch { /* storage unavailable */ }
        const cur = (audio.current as any)?._ep as BiayEpisode | undefined;
        if (cur) setShowSetting(showKeyOf(cur.id), 'rate', r);
        audio.current!.playbackRate = r;
      },
      sleep,
      setSleep: (m) => setSleepState(m === 'off' ? { mode: 'off', left: 0 } : m === 'end' ? { mode: 'end', left: 0 } : { mode: 'minutes', left: m * 60 }),
      showKey: current ? showKeyOf(current.id) : '',
      stop: () => {
        audio.current!.pause();
        (audio.current as any)._ep = undefined;
        audio.current!.removeAttribute('src');
        setCurrent(null);
        db.cache.delete('player:last').catch(() => undefined);
      },
    }),
    [current, playing, position, duration, rate, play, sleep],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
