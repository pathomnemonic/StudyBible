import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { Link } from 'react-router-dom';
import { useSettings } from '../lib/store';
import { useBiay } from '../data/biay';
import { usePlayer } from '../data/PlayerContext';
import { parseRefId } from '../lib/refs';
import { rangesOverlap } from '../db/ops';
import { recordingFor, type Recording } from '../data/librivox';

// one recording element for the whole app, so the reading carries on across chapters without a gap
let lv: HTMLAudioElement | null = null;

interface V {
  n: number;
  text: string;
}

/**
 * Read-aloud using the browser's built-in speech synthesis (no audio is sent anywhere by this app; some browsers use
 * cloud voices, which the browser documents). Highlights the verse being read, skips back and forth by verse, and can
 * continue into the next chapter. Latin has no standard browser voice, so choose any voice you find intelligible.
 */
export default function ReadAloud({ verses, lang = 'en', startAt, onVerse, onClose, onChapterEnd, biayFor, recorded }: { recorded?: { edition: string; book: string; chapter: number }; biayFor?: { book: string; chapters: number[] }; verses: V[]; lang?: string; startAt?: number; onVerse: (n: number | null) => void; onClose: () => void; onChapterEnd?: () => void }) {
  const [s, set] = useSettings();
  const [i, setI] = useState(() => Math.max(0, verses.findIndex((v) => v.n === startAt)));
  const [playing, setPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const iRef = useRef(i);
  const playRef = useRef(false);
  iRef.current = i;
  const { biay } = useBiay();
  const player = usePlayer();
  const episodes = (biay && biayFor
    ? [...biay.dayEpisode.values()].filter((e) => e.audio && e.passages.some((p) => { const r = parseRefId(p); return r && biayFor.chapters.some((c) => rangesOverlap(r, { book: biayFor.book, c1: c, c2: c })); }))
    : []
  ).sort((a, b) => (a.day ?? 0) - (b.day ?? 0)).slice(0, 3);
  const supported = typeof speechSynthesis !== 'undefined';
  // a recorded human reading (LibriVox), when this edition has one for the chapter
  const [rec, setRec] = useState<Recording | null>(null);
  const [mode, setModeState] = useState<'voice' | 'recorded'>(() => { try { return localStorage.getItem('sb:aloudMode') === 'voice' ? 'voice' : 'recorded'; } catch { return 'recorded'; } });
  const setMode = (m: 'voice' | 'recorded') => { setModeState(m); try { localStorage.setItem('sb:aloudMode', m); } catch { /* private mode */ } };
  useEffect(() => { let live = true; setRec(null); if (recorded) recordingFor(recorded.edition, recorded.book, recorded.chapter).then((r) => live && setRec(r)); return () => { live = false; }; }, [recorded?.edition, recorded?.book, recorded?.chapter]);
  const useRec = !!rec && mode === 'recorded';
  const starts = useRef<number[]>([]);
  useEffect(() => {
    if (!rec) return;
    const w = verses.map((v) => v.text.split(/\s+/).filter(Boolean).length);
    const total = w.reduce((a, b) => a + b, 0) || 1;
    let at = 0;
    starts.current = w.map((x) => { const t = rec.t0 + ((rec.t1 - rec.t0) * at) / total; at += x; return t; });
  }, [rec, verses]);
  const stopRec = () => { if (lv && !lv.paused) lv.pause(); };
  const playRec = useCallback((idx: number, seek = true) => {
    if (!rec) return;
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    if (!lv) lv = new Audio();
    const a = lv;
    const at = starts.current[idx] ?? rec.t0;
    const same = a.src === rec.url;
    if (!same) { a.src = rec.url; a.preload = 'auto'; }
    const go = () => { if (seek) a.currentTime = at; a.playbackRate = s.ttsRate; void a.play().catch(() => setPlaying(false)); };
    if (same && a.readyState >= 1) go(); else a.addEventListener('loadedmetadata', go, { once: true });
    playRef.current = true;
    setPlaying(true);
    setI(idx);
    onVerse(verses[idx]?.n ?? null);
  }, [rec, verses, s.ttsRate, onVerse]);
  // follow the recording: highlight the verse being read, and move on to the next chapter when this one ends
  useEffect(() => {
    if (!useRec || !rec) return;
    const a = (lv ??= new Audio());
    const tick = () => {
      if (a.paused || a.src !== rec.url) return;
      const t = a.currentTime;
      if (t >= rec.t1 - 0.3) { try { sessionStorage.setItem('aloudAuto', 'rec'); } catch { /* ignore */ } onVerse(null); setPlaying(false); playRef.current = false; onChapterEnd?.(); return; }
      let k = 0;
      for (let j = 0; j < starts.current.length; j++) if (starts.current[j] <= t) k = j;
      if (k !== iRef.current) { setI(k); onVerse(verses[k]?.n ?? null); }
    };
    a.addEventListener('timeupdate', tick);
    a.addEventListener('pause', () => setPlaying(false));
    a.addEventListener('play', () => setPlaying(true));
    return () => a.removeEventListener('timeupdate', tick);
  }, [useRec, rec, verses, onVerse, onChapterEnd]);

  useEffect(() => {
    if (!supported) return;
    const load = () => setVoices(speechSynthesis.getVoices());
    load();
    speechSynthesis.addEventListener('voiceschanged', load);
    return () => speechSynthesis.removeEventListener('voiceschanged', load);
  }, [supported]);

  const speak = useCallback(
    (idx: number) => {
      if (!supported) return;
      speechSynthesis.cancel();
      if (idx >= verses.length) {
        playRef.current = false;
        setPlaying(false);
        onVerse(null);
        try {
          sessionStorage.setItem('aloudAuto', '1');
        } catch {
          /* ignore */
        }
        onChapterEnd?.();
        return;
      }
      setI(idx);
      onVerse(verses[idx].n);
      const u = new SpeechSynthesisUtterance(verses[idx].text);
      const v = voices.find((x) => x.name === s.ttsVoice);
      if (v) {
        u.voice = v;
        u.lang = v.lang;
      } else u.lang = lang === 'la' ? 'it-IT' : lang;
      u.rate = s.ttsRate;
      u.onend = () => playRef.current && speak(idx + 1);
      u.onerror = (e) => {
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          playRef.current = false;
          setPlaying(false);
        }
      };
      speechSynthesis.speak(u);
    },
    [verses, voices, s.ttsVoice, s.ttsRate, lang, supported, onVerse, onChapterEnd],
  );

  // continuing from the previous chapter: start automatically
  useEffect(() => {
    let auto = false;
    let autoRec = false;
    try {
      const v = sessionStorage.getItem('aloudAuto');
      auto = v === '1';
      autoRec = v === 'rec';
      sessionStorage.removeItem('aloudAuto');
    } catch {
      /* ignore */
    }
    if (autoRec) {
      // the recording is already playing on into this chapter: pick it up where it is
      const t = setTimeout(() => { if (lv && !lv.paused) { playRef.current = true; setPlaying(true); } }, 500);
      return () => clearTimeout(t);
    }
    if (auto && supported) {
      const t = setTimeout(() => {
        playRef.current = true;
        setPlaying(true);
        speak(0);
      }, 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      playRef.current = false;
      if (supported) speechSynthesis.cancel();
      onVerse(null);
      // leaving the page (or closing) stops the recording, but a hand-over to the next chapter keeps it going
      try { if (sessionStorage.getItem('aloudAuto') !== 'rec') stopRec(); } catch { stopRec(); }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const toggle = () => {
    if (useRec) {
      if (playing) { stopRec(); playRef.current = false; setPlaying(false); } else playRec(iRef.current, !(lv && lv.src === rec!.url && lv.currentTime >= rec!.t0 && lv.currentTime < rec!.t1));
      return;
    }
    if (playing) {
      playRef.current = false;
      setPlaying(false);
      speechSynthesis.cancel();
    } else {
      playRef.current = true;
      setPlaying(true);
      speak(iRef.current);
    }
  };
  const jump = (d: number) => {
    const n = Math.max(0, Math.min(verses.length - 1, iRef.current + d));
    setI(n);
    onVerse(verses[n].n);
    if (useRec) { if (playRef.current) playRec(n); return; }
    if (playRef.current) speak(n);
  };
  // changing speed or voice takes effect from the current verse
  useEffect(() => {
    if (useRec) { if (lv) lv.playbackRate = s.ttsRate; return; }
    if (playRef.current) speak(iRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.ttsRate, s.ttsVoice]);

  if (!supported)
    return (
      <div className="readaloud" role="region" aria-label="Read aloud">
        <span className="small">This browser has no built-in speech. Try Chrome, Edge, Safari or Firefox, or your device’s screen reader.</span>
        <button className="btn small" onClick={onClose}>Close</button>
      {episodes.length > 0 && (
        <span className="small" style={{ width: '100%' }}>
          Prefer a human voice? Fr. Mike Schmitz reads and reflects on this chapter in <em>The Bible in a Year</em>:{' '}
          {episodes.map((e) => (
            <span key={e.id} style={{ marginRight: 10 }}>
              <button className="linklike" onClick={() => { speechSynthesis?.cancel(); void player.play(e); }}>▶ Day {e.day}</button>{' '}
              <Link to={`/listen/episode/${e.id}`}>details</Link>
            </span>
          ))}
        </span>
      )}
      </div>
    );
  const pref = lang === 'la' ? '' : lang.slice(0, 2);
  const list = voices.filter((v) => !pref || v.lang.toLowerCase().startsWith(pref));
  return (
    <div className="readaloud" role="region" aria-label="Read aloud controls">
      <button className="icon-btn" onClick={() => jump(-1)} aria-label="Previous verse"><Icon name="chevL" /></button>
      <button className="btn primary small" onClick={toggle} aria-label={playing ? 'Pause reading' : 'Read aloud'}>
        <Icon name={playing ? 'pause' : 'play'} size={14} /> {playing ? 'Pause' : 'Read aloud'}
      </button>
      <button className="icon-btn" onClick={() => jump(1)} aria-label="Next verse"><Icon name="chevR" /></button>
      <span className="muted small" aria-live="polite">Verse {verses[i]?.n}</span>
      <label className="small">Speed <select value={s.ttsRate} onChange={(e) => set({ ttsRate: +e.target.value })} aria-label="Reading speed">{[0.7, 0.85, 1, 1.15, 1.3, 1.5, 1.75].map((r) => <option key={r} value={r}>{r}×</option>)}</select></label>
      {rec && (
        <label className="small">Reader <select value={mode} onChange={(e) => { stopRec(); if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); playRef.current = false; setPlaying(false); setMode(e.target.value as 'voice' | 'recorded'); }} aria-label="Who reads">
          <option value="recorded">Recorded voice (LibriVox)</option>
          <option value="voice">Computer voice</option>
        </select></label>
      )}
      {!useRec && list.length > 0 && (
        <label className="small">Voice <select value={s.ttsVoice} onChange={(e) => set({ ttsVoice: e.target.value })} aria-label="Voice" style={{ maxWidth: 180 }}><option value="">Default</option>{list.map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}</select></label>
      )}
      <button className="icon-btn" onClick={onClose} aria-label="Close read aloud"><Icon name="close" /></button>

      {episodes.length > 0 && (
        <span className="small" style={{ width: '100%' }}>
          Prefer a human voice? Fr. Mike Schmitz reads and reflects on this chapter in <em>The Bible in a Year</em>:{' '}
          {episodes.map((e) => (
            <span key={e.id} style={{ marginRight: 10 }}>
              <button className="linklike" onClick={() => { speechSynthesis?.cancel(); void player.play(e); }}>▶ Day {e.day}</button>{' '}
              <Link to={`/listen/episode/${e.id}`}>details</Link>
            </span>
          ))}
        </span>
      )}
      {useRec && rec && <span className="muted small" style={{ width: '100%' }}>Read by {rec.reader || 'a volunteer'} for <a href={rec.page} target="_blank" rel="noreferrer">LibriVox</a> (public domain). Where each verse falls in the recording is estimated, so the highlight can drift by a few seconds.</span>}
      {lang === 'la' && <span className="muted small" style={{ width: '100%' }}>No browser has a Latin voice; pick one that suits Ecclesiastical pronunciation, or use the English text.</span>}
    </div>
  );
}
