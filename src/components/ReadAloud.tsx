import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { Link } from 'react-router-dom';
import { useSettings } from '../lib/store';
import { useBiay } from '../data/biay';
import { usePlayer } from '../data/PlayerContext';
import { parseRefId } from '../lib/refs';
import { rangesOverlap } from '../db/ops';


interface V {
  n: number;
  text: string;
}

/**
 * Read-aloud using the browser's built-in speech synthesis (no audio is sent anywhere by this app; some browsers use
 * cloud voices, which the browser documents). Highlights the verse being read, skips back and forth by verse, and can
 * continue into the next chapter. Latin has no standard browser voice, so choose any voice you find intelligible.
 */
export default function ReadAloud({ verses, lang = 'en', startAt, onVerse, onClose, onChapterEnd, biayFor }: { biayFor?: { book: string; chapters: number[] }; verses: V[]; lang?: string; startAt?: number; onVerse: (n: number | null) => void; onClose: () => void; onChapterEnd?: () => void }) {
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
    try {
      const v = sessionStorage.getItem('aloudAuto');
      auto = v === '1';
      sessionStorage.removeItem('aloudAuto');
    } catch {
      /* ignore */
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const toggle = () => {
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
    if (playRef.current) speak(n);
  };
  // changing speed or voice takes effect from the current verse
  useEffect(() => {
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
      {list.length > 0 && (
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
      {lang === 'la' && <span className="muted small" style={{ width: '100%' }}>No browser has a Latin voice; pick one that suits Ecclesiastical pronunciation, or use the English text.</span>}
    </div>
  );
}
