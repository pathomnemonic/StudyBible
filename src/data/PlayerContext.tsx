import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { db } from '../db/db';
import { loadBiay } from './biay';
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
}

const Ctx = createContext<PlayerState | null>(null);
export const usePlayer = () => useContext(Ctx)!;

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
  const [rate, setRateState] = useState(1);
  const lastSave = useRef(0);

  useEffect(() => {
    const a = new Audio();
    a.preload = 'none';
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
      // advance through the personal queue
      const q = await db.queue.orderBy('order').toArray();
      const cur = (a as any)._ep as BiayEpisode | undefined;
      const idx = q.findIndex((x) => x.episodeId === cur?.id);
      const next = idx >= 0 ? q[idx + 1] : q[0];
      if (idx >= 0) await db.queue.delete(q[idx].id!);
      if (next) {
        const v = await loadBiay();
        const ep = v?.byId.get(next.episodeId);
        if (ep) play(ep);
      }
    });
    return () => {
      a.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = useCallback(async (e: BiayEpisode, startAt?: number) => {
    const a = audio.current!;
    if ((a as any)._ep?.id === e.id && startAt !== undefined) a.currentTime = startAt;
    if ((a as any)._ep?.id !== e.id) {
      (a as any)._ep = e;
      a.src = e.audio;
      setCurrent(e);
      const prog = await db.episodeProgress.get(e.id);
      const at = startAt ?? (prog && !prog.completed ? prog.position : 0);
      a.addEventListener('loadedmetadata', () => (a.currentTime = at), { once: true });
    }
    a.playbackRate = rate;
    try {
      await a.play();
    } catch {
      /* autoplay blocked: user can press play */
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: e.title, artist: 'Fr. Mike Schmitz · Ascension', album: 'The Bible in a Year' });
      navigator.mediaSession.setActionHandler('play', () => a.play());
      navigator.mediaSession.setActionHandler('pause', () => a.pause());
      navigator.mediaSession.setActionHandler('seekbackward', () => (a.currentTime = Math.max(0, a.currentTime - 15)));
      navigator.mediaSession.setActionHandler('seekforward', () => (a.currentTime = a.currentTime + 30));
    }
  }, [rate]);

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
        audio.current!.playbackRate = r;
      },
      stop: () => {
        audio.current!.pause();
        (audio.current as any)._ep = undefined;
        audio.current!.removeAttribute('src');
        setCurrent(null);
      },
    }),
    [current, playing, position, duration, rate, play],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
