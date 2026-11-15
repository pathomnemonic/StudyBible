import { closeHost, hooks } from '../lib/mediaHost';
import { resolveIfCurrent } from './playbackRequest';
import { savedUrl } from '../lib/offlineAudio';
import { nextFavorite } from './autoplay';
import { getSettings } from '../lib/store';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { creditListening } from '../lib/listening';
import { db } from '../db/db';
import { loadBiay } from './biay';
import { lookupEpisode, registerEpisodes } from './podcasts';
import type { BiayEpisode } from './content';

/** A near-end progress save is not an end event: only the media element's actual ended event completes an episode. */
export function playbackProgressPatch(currentTime: number, duration: number | undefined, ended: boolean) {
  return {
    position: ended ? 0 : Math.max(0, Number.isFinite(currentTime) ? currentTime : 0),
    duration: duration && Number.isFinite(duration) ? duration : undefined,
    completed: ended || undefined,
    ranToEnd: ended,
  };
}

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
  /** Close the player: stops playback, keeps the place in the episode, and clears the dock. Pausing (toggle) keeps the player. */
  stop: () => void;
  /** why the sound is not coming, in plain terms: the stream failed, or the device is offline (null when all is well) */
  error: null | 'failed' | 'offline';
  /** load the same episode again from where it was, and play */
  retry: () => void;
  /** pause after some minutes, or at the end of the episode */
  sleep: { mode: 'off' | 'minutes' | 'end'; left: number };
  setSleep: (m: 'off' | 'end' | number) => void;
  /** the part of an episode id that names its show, for per-show settings */
  showKey: string;
  /** seconds the forward and back buttons move for the current show */
  fwd: number;
  back: number;
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
export const showKeyOf = (id: string) => (id.startsWith('pod-') ? id.split('-').slice(0, -1).join('-') : id.startsWith('u-') ? id.split('-').slice(0, 2).join('-') : id.startsWith('lv:') ? id.split(':').slice(0, 2).join(':') : id.startsWith('med:') ? 'med' : 'biay');
const ls = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } };
export type ShowPref = 'rate' | 'skip' | 'outro' | 'fwd' | 'back' | 'manual';
export const showSetting = (key: string, what: ShowPref) => Number(ls(`sb:${what}:${key}`)) || 0;
export const setShowSetting = (key: string, what: ShowPref, v: number) => {
  lsSet(`sb:${what}:${key}`, String(v));
  window.dispatchEvent(new Event('sb:showprefs'));
};
/** What this show's controls do. Zero means "use the usual": 30 seconds forward, 15 back, play the next one on its own. */
export const showPrefs = (key: string) => ({
  rate: showSetting(key, 'rate'),
  intro: showSetting(key, 'skip'),
  outro: showSetting(key, 'outro'),
  fwd: showSetting(key, 'fwd') || showSetting('all', 'fwd') || 30,
  back: showSetting(key, 'back') || showSetting('all', 'back') || 15,
  auto: !showSetting(key, 'manual'),
});

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
  const playGeneration = useRef(0);
  const savePlaybackRef = useRef<((completed?: boolean) => Promise<void>) | null>(null);
  const [sleep, setSleepState] = useState<{ mode: 'off' | 'minutes' | 'end'; left: number }>({ mode: 'off', left: 0 });
  const [error, setError] = useState<null | 'failed' | 'offline'>(null);
  const bindSourceError = (a: HTMLAudioElement, request: number, episodeId: string, src: string) => {
    a.addEventListener('error', () => {
      if (request !== playGeneration.current || (a as any)._ep?.id !== episodeId || a.getAttribute('src') !== src || !a.error) return;
      setPlaying(false);
      setError(navigator.onLine === false ? 'offline' : 'failed');
    }, { once: true });
  };

  const [prefsV, setPrefsV] = useState(0);
  useEffect(() => { const f = () => setPrefsV((x) => x + 1); window.addEventListener('sb:showprefs', f); return () => window.removeEventListener('sb:showprefs', f); }, []);
  const sleepRef = useRef(sleep);
  sleepRef.current = sleep;

  useEffect(() => {
    const a = new Audio();
    a.preload = 'none';
    a.playbackRate = rate;
    audio.current = a;
    hooks.onNewMedia = () => { try { a.pause(); } catch { /* none */ } }; // a video or recording starting in the host stops this player
    // seconds that really played since the last save: counted from the clock, never from jumps (a seek or a skipped intro adds nothing)
    let heardSince = 0, lastT = -1;
    const save = (completed = false): Promise<void> => {
      const cur = (a as any)._ep as BiayEpisode | undefined;
      if (!cur) return Promise.resolve();
      const secs = heardSince; heardSince = 0;
      return creditListening(cur.id, secs, playbackProgressPatch(a.currentTime, a.duration, completed)).catch(() => {});
    };
    savePlaybackRef.current = save;
    a.addEventListener('timeupdate', () => {
      setPosition(a.currentTime);
      if (!a.paused && lastT >= 0) { const d = a.currentTime - lastT; if (d > 0 && d <= 2.5) heardSince += d; }
      lastT = a.currentTime;
      const cur = (a as any)._ep as BiayEpisode | undefined;
      const out = cur ? showSetting(showKeyOf(cur.id), 'outro') : 0;
      // a show's closing music or ads can be skipped: finish the episode early
      if (out && a.duration && !(a as any)._outroDone && a.duration - a.currentTime <= out && a.currentTime > 30) {
        (a as any)._outroDone = true;
        (a as any)._manualEnded = true;
        a.pause();
        a.dispatchEvent(new Event('ended'));
        return;
      }
      if (Date.now() - lastSave.current > 5000) {
        lastSave.current = Date.now();
        save();
      }
    });
    a.addEventListener('loadedmetadata', () => setDuration(a.duration || 0));
    // a stream that cannot load is said out loud, with a way to try again; it clears the moment sound is flowing
    a.addEventListener('playing', () => { if (!a.paused) setError(null); });
    a.addEventListener('loadeddata', () => { if (!a.error) setError(null); });
    a.addEventListener('play', () => { if (!a.paused) { lastT = a.currentTime; setPlaying(true); } });
    a.addEventListener('seeking', () => { lastT = -1; });
    a.addEventListener('pause', () => {
      if ((a as any)._switchPause) {
        (a as any)._switchPause = false;
        if (!a.paused) return; // the old pause arrived after the new source resumed
        setPlaying(false);
        return;
      }
      if (!a.paused) return; // a pause event queued for the previous source must not pause the new one
      setPlaying(false);
      save();
    });
    a.addEventListener('ended', async () => {
      const manualEnd = !!(a as any)._manualEnded;
      (a as any)._manualEnded = false;
      if (!a.ended && !manualEnd) return; // ignore a queued ended event from the source that was just replaced
      // Queue lookup and episode loading are asynchronous too. They must not outlive a newer
      // user selection and start an old queued episode over the top of it.
      const request = (a as any)._playGeneration as number | undefined;
      const was = (a as any)._ep as BiayEpisode | undefined;
      await save(true);
      if (request === undefined || request !== playGeneration.current || (a as any)._ep?.id !== was?.id) return;
      if (sleepRef.current.mode === 'end') { setSleepState({ mode: 'off', left: 0 }); return; }
      if (was && showSetting(showKeyOf(was.id), 'manual')) return;
      // advance through the personal queue, retaining the ended episode identity throughout.
      const q = await resolveIfCurrent(request, () => playGeneration.current, () => db.queue.orderBy('order').toArray());
      if (!q || request !== playGeneration.current || (a as any)._ep?.id !== was?.id) return;
      const idx = q.findIndex((x) => x.episodeId === was?.id);
      const next = idx >= 0 ? q[idx + 1] : q[0];
      if (idx >= 0) await db.queue.delete(q[idx].id!);
      if (request !== playGeneration.current || (a as any)._ep?.id !== was?.id) return;
      if (next) {
        const loaded = await resolveIfCurrent(request, () => playGeneration.current, () => loadBiay());
        if (loaded === null || request !== playGeneration.current || (a as any)._ep?.id !== was?.id) return;
        const ep = await resolveIfCurrent(request, () => playGeneration.current, () => resolveEpisode(next.episodeId));
        if (ep === null || request !== playGeneration.current || (a as any)._ep?.id !== was?.id) return;
        if (ep) play(ep);
      } else if (getSettings().autoFavorites) {
        const ep = await resolveIfCurrent(request, () => playGeneration.current, () => nextFavorite(was?.id));
        if (ep === null || request !== playGeneration.current || (a as any)._ep?.id !== was?.id) return;
        if (ep) { registerEpisodes([ep]); play(ep); }
      }
    });
    const hide = () => { if (document.visibilityState === 'hidden') save(); };
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', () => save());
    // after a reload, bring back the last thing played, paused, at the place it stopped
    const restoreRequest = playGeneration.current;
    db.cache.get('player:last').then(async (row) => {
      const id = row?.value as unknown as string | undefined;
      if (!id || (a as any)._ep || restoreRequest !== playGeneration.current) return;
      const ep = await resolveEpisode(id);
      const prog = await db.episodeProgress.get(id);
      if (!ep || (a as any)._ep || prog?.completed || restoreRequest !== playGeneration.current) return;
      const url = await resolveIfCurrent(restoreRequest, () => playGeneration.current, () => audioUrl(ep.audio)).catch(() => { if (restoreRequest === playGeneration.current) setError(navigator.onLine === false ? 'offline' : 'failed'); return null; });
      if (!url || (a as any)._ep || restoreRequest !== playGeneration.current) return;
      (a as any)._ep = ep;
      (a as any)._playGeneration = restoreRequest;
      (a as any)._manualEnded = false;
      bindSourceError(a, restoreRequest, ep.id, url);
      a.src = url;
      a.preload = 'metadata';
      a.addEventListener('loadedmetadata', () => { if (restoreRequest === playGeneration.current && (a as any)._ep?.id === ep.id) a.currentTime = prog?.position ?? 0; }, { once: true });
      setCurrent(ep);
      setPosition(prog?.position ?? 0);
    }).catch(() => { if (restoreRequest === playGeneration.current) setError(navigator.onLine === false ? 'offline' : 'failed'); });
    return () => {
      document.removeEventListener('visibilitychange', hide);
      savePlaybackRef.current = null;
      a.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = useCallback(async (e: BiayEpisode, startAt?: number) => {
    const request = ++playGeneration.current;
    closeHost();
    const a = audio.current!;
    const previous = (a as any)._ep as BiayEpisode | undefined;
    const same = previous?.id === e.id;
    if (same) {
      // Rebind errors immediately: the previous listener belongs to the old generation,
      // and the progress lookup below is asynchronous.
      const activeSrc = a.getAttribute('src');
      if (activeSrc) bindSourceError(a, request, e.id, activeSrc);
    }
    if (!same && !a.paused) {
      (a as any)._switchPause = true;
      a.pause();
    }
    if (!same && previous) {
      // Pause first, then flush the final clock position and all heard seconds before source replacement.
      await savePlaybackRef.current?.();
      if (request !== playGeneration.current) return;
    }
    void rememberEpisode(e);
    if (same) {
      const progress = await resolveIfCurrent(request, () => playGeneration.current, () => db.episodeProgress.get(e.id))
        .catch(() => { if (request === playGeneration.current) setError('failed'); return null; });
      if (progress === null) return;
      const shouldReplay = !!progress?.completed || a.ended || !!(a.duration && a.currentTime >= a.duration) || !!(a as any)._outroDone;
      if (shouldReplay) {
        const replayAt = startAt ?? showSetting(showKeyOf(e.id), 'skip');
        try { await creditListening(e.id, 0, { position: replayAt, completed: false }); }
        catch { if (request === playGeneration.current) setError('failed'); return; }
        if (request !== playGeneration.current) return;
        a.currentTime = replayAt;
        setPosition(replayAt);
      } else if (startAt !== undefined) a.currentTime = startAt;
    } else {
      setError(null);
      const resolved = await resolveIfCurrent(request, () => playGeneration.current, () => Promise.all([audioUrl(e.audio), db.episodeProgress.get(e.id)])).catch(() => { if (request === playGeneration.current) setError(navigator.onLine === false ? 'offline' : 'failed'); return null; });
      if (!resolved) return;
      const url = resolved[0];
      const prog = resolved[1];
      if (!url) { setError(navigator.onLine === false ? 'offline' : 'failed'); return; }
      const skip = showSetting(showKeyOf(e.id), 'skip');
      const at = startAt ?? (prog && !prog.completed && prog.position > 0 ? prog.position : skip);
      (a as any)._ep = e;
      (a as any)._playGeneration = request;
      (a as any)._outroDone = false;
      (a as any)._manualEnded = false;
      bindSourceError(a, request, e.id, url);
      a.src = url;
      a.preload = 'metadata';
      a.addEventListener('loadedmetadata', () => {
        if (request === playGeneration.current && (a as any)._ep?.id === e.id) a.currentTime = at;
      }, { once: true });
      setCurrent(e);
      setPosition(at);
      setDuration(0);
      db.cache.put({ key: 'player:last', value: e.id as unknown as string, ts: Date.now() }).catch(() => undefined);
      // Replaying a completed episode starts a new resumable session; preserve the historical listening ledger.
      // Do this after selecting the new episode so the Retry action targets the correct source if storage fails.
      if (prog?.completed) {
        try { await creditListening(e.id, 0, { position: at, completed: false }); }
        catch { if (request === playGeneration.current) setError('failed'); return; }
        if (request !== playGeneration.current) return;
      }
    }
    if (same && request === playGeneration.current) (a as any)._playGeneration = request;
    if (request !== playGeneration.current) return;
    const own = showSetting(showKeyOf(e.id), 'rate');
    a.playbackRate = own || rate;
    if (own) setRateState(own);
    try { await a.play(); } catch { /* autoplay blocked: user can press play */ }
    if (request !== playGeneration.current || (a as any)._ep?.id !== e.id) return;
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: e.title, artist: e.artist ?? e.album ?? 'Ascension', album: e.album ?? 'The Bible in a Year' });
      navigator.mediaSession.setActionHandler('play', () => {
         const active = (a as any)._ep as BiayEpisode | undefined;
         if (active) void play(active); else void a.play();
       });
      navigator.mediaSession.setActionHandler('pause', () => a.pause());
      navigator.mediaSession.setActionHandler('seekbackward', () => (a.currentTime = Math.max(0, a.currentTime - showPrefs(showKeyOf(e.id)).back)));
      navigator.mediaSession.setActionHandler('seekforward', () => (a.currentTime = a.currentTime + showPrefs(showKeyOf(e.id)).fwd));
      navigator.mediaSession.setActionHandler('nexttrack', () => { a.currentTime = a.duration || a.currentTime; });
      navigator.mediaSession.setActionHandler('previoustrack', () => { a.currentTime = 0; });
    }
  }, [rate]);

  useEffect(() => {
    if (sleep.mode !== 'minutes') return;
    const id = setInterval(() => setSleepState((x) => {
      if (x.mode !== 'minutes') return x;
      if (x.left <= 1) {
        // An in-flight source lookup must not restart playback after the timer has expired.
        playGeneration.current++;
        audio.current?.pause();
        return { mode: 'off', left: 0 };
      }
      return { mode: 'minutes', left: x.left - 1 };
    }), 1000);
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
      toggle: () => {
        const a = audio.current!;
        if (!a.paused) { a.pause(); return; }
        const active = (a as any)._ep as BiayEpisode | undefined;
        if (active) void play(active); else void a.play();
      },
      seek: (t) => (audio.current!.currentTime = t),
      fwd: current ? showPrefs(showKeyOf(current.id)).fwd : 30,
      back: current ? showPrefs(showKeyOf(current.id)).back : 15,
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
      error,
      retry: () => {
        const request = ++playGeneration.current;
        const a = audio.current!;
        const retryEpisode = (a as any)._ep as BiayEpisode | undefined;
        if (!retryEpisode) return;
        void (async () => {
          if (!a.paused) { (a as any)._switchPause = true; a.pause(); }
          // Pause first, then flush the final clock position and all heard seconds before retry replaces its source.
          await savePlaybackRef.current?.();
          if (request !== playGeneration.current || (a as any)._ep?.id !== retryEpisode.id) return;
          let at = a.currentTime || 0;
          const progress = await resolveIfCurrent(request, () => playGeneration.current, () => db.episodeProgress.get(retryEpisode.id))
            .catch(() => { if (request === playGeneration.current) setError('failed'); return null; });
          if (progress === null) return;
          if (progress?.completed) {
            at = showSetting(showKeyOf(retryEpisode.id), 'skip');
            try { await creditListening(retryEpisode.id, 0, { position: at, completed: false }); }
            catch { if (request === playGeneration.current) setError('failed'); return; }
            if (request !== playGeneration.current) return;
            a.currentTime = at;
            setPosition(at);
          }
          setError(null);
          const u = await resolveIfCurrent(request, () => playGeneration.current, () => audioUrl(retryEpisode.audio)).catch(() => { if (request === playGeneration.current) setError(navigator.onLine === false ? 'offline' : 'failed'); return null; });
          if (request !== playGeneration.current || (a as any)._ep?.id !== retryEpisode.id) return;
          if (!u) { setError(navigator.onLine === false ? 'offline' : 'failed'); return; }
          bindSourceError(a, request, retryEpisode.id, u);
          (a as any)._playGeneration = request;
          (a as any)._manualEnded = false;
          a.src = u; a.load();
          a.addEventListener('loadedmetadata', () => { if (request === playGeneration.current && (a as any)._ep?.id === retryEpisode.id && at > 0) a.currentTime = at; }, { once: true });
          try { await a.play(); } catch { /* autoplay blocked: the user can press play */ }
        })().catch(() => undefined);
      },
      stop: () => {
        ++playGeneration.current;
        const a = audio.current!;
        // closing keeps the place, so playing this episode again later picks up where it stopped (it does not start by itself)
        // Pause first, then flush before clearing _ep; the pause event may arrive after the dock is cleared.
        if (!a.paused) { (a as any)._switchPause = true; a.pause(); }
        void savePlaybackRef.current?.();
        setError(null);
        (audio.current as any)._ep = undefined;
        (audio.current as any)._playGeneration = undefined;
        audio.current!.removeAttribute('src');
        setCurrent(null);
        db.cache.delete('player:last').catch(() => undefined);
      },
    }),
    [current, playing, position, duration, rate, play, sleep, prefsV, error],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
