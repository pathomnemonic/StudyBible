import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { updateSettings, useSettings } from '../lib/store';
import { BRAND } from '../lib/brand';
import { db } from '../db/db';
import { loadBiay, type BiayView } from '../data/biay';
import { getLibraryIndex } from '../data/content';
import { allRecordedWorks } from '../data/librivox';
import FavoritesPicker from './FavoritesPicker';

const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const put = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

/** True once the reader has seen the intro, or the older setup or tour: those readers are never shown it again. */
export const introSeen = () => get('sb:intro') === '1' || get('sb:tour') === '1' || !!get('sb:welcomed') || !!get('sb:setup');

type Biay = 'ask' | 'yes' | 'start' | 'no';

/** Where in Bible in a Year to carry on: today becomes day N, and the days before it count as heard. */
async function catchUp(day: number) {
  const n = Math.max(1, Math.min(365, Math.round(day) || 1));
  await db.planProgress.put({ planId: 'biay', startedAt: Date.now(), status: 'active', done: Array.from({ length: n - 1 }, (_, i) => i), offsetDays: n - 1 } as never);
  updateSettings({ activePlan: 'biay' });
}

function BiayCard({ onDone }: { onDone: (note: string) => void }) {
  const [mode, setMode] = useState<Biay>('ask');
  const [day, setDay] = useState(1);
  const [find, setFind] = useState('');
  const [view, setView] = useState<BiayView | null>(null);
  const [s] = useSettings();
  useEffect(() => { loadBiay().then(setView).catch(() => undefined); }, []);
  const title = (d: number) => view?.dayEpisode.get(d)?.short ?? '';
  const hits = useMemo(() => {
    const q = find.trim().toLowerCase();
    if (!q || !view) return [];
    return [...view.dayEpisode.entries()].filter(([, e]) => `${e.short} ${e.title}`.toLowerCase().includes(q)).sort((a, b) => a[0] - b[0]).slice(0, 5);
  }, [find, view]);
  const settle = async (m: Biay) => {
    if (m === 'yes') { await catchUp(day); onDone(`Bible in a Year: you carry on at day ${day}.`); }
    else if (m === 'start') { await catchUp(1); onDone('Bible in a Year starts at day 1.'); }
    else {
      updateSettings({ activePlan: '', dashboard: { ...s.dashboard, hidden: [...new Set([...s.dashboard.hidden, 'biay'])] } });
      onDone('We left Bible in a Year out. It is still in the Media tab if you change your mind.');
    }
  };
  return (
    <>
      <p className="welcome-sub">Bible in a Year with Fr. Mike Schmitz is in the app with its reading plan. Have you listened to it before?</p>
      {mode === 'ask' && (
        <div className="welcome-chips" role="group" aria-label="Bible in a Year">
          <button className="welcome-chip" onClick={() => setMode('yes')}><strong>Yes, I was partway through</strong><span>Jump straight to where you were</span></button>
          <button className="welcome-chip" onClick={() => setMode('start')}><strong>No, but I would like to</strong><span>Start at day 1</span></button>
          <button className="welcome-chip" onClick={() => setMode('no')}><strong>Not for me</strong><span>Pick other Catholic media instead</span></button>
        </div>
      )}
      {mode === 'yes' && (
        <div className="intro-box">
          <label className="welcome-row"><span>Which day do you listen to next?</span>
            <input type="number" min={1} max={365} value={day} aria-label="Day number" onChange={(e) => setDay(Math.max(1, Math.min(365, +e.target.value || 1)))} /></label>
          <p className="small" role="status">{title(day) ? <>Day {day}: <strong>{title(day)}</strong></> : `Day ${day}`}</p>
          <label className="welcome-row"><span>Or search for its title</span>
            <input type="search" value={find} placeholder="Words from the episode title" aria-label="Find an episode" onChange={(e) => setFind(e.target.value)} /></label>
          {hits.length > 0 && <ul className="intro-hits">{hits.map(([d, e]) => <li key={d}><button className="btn small" onClick={() => { setDay(d); setFind(''); }}>Day {d}: {e.short}</button></li>)}</ul>}
          <div className="row" style={{ gap: 8, marginTop: 8 }}>
            <button className="btn" onClick={() => setMode("ask")}>Change answer</button>
            <button className="btn primary" onClick={() => void settle('yes')}>Carry on from day {day}</button>
          </div>
        </div>
      )}
      {mode === 'start' && (
        <div className="intro-box">
          <p>Great. You begin with day 1 and go at your own pace: nothing is missed if you skip a day.</p>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" onClick={() => setMode("ask")}>Change answer</button>
            <button className="btn primary" onClick={() => void settle('start')}>Start at day 1</button>
          </div>
        </div>
      )}
      {mode === 'no' && (
        <div className="intro-box">
          <p className="small">Choose any podcasts, audiobooks or video creators you like. Media puts them first.</p>
          <FavoritesPicker compact />
          <div className="row" style={{ gap: 8, marginTop: 8 }}>
            <button className="btn" onClick={() => setMode("ask")}>Change answer</button>
            <button className="btn primary" onClick={() => void settle('no')}>Done</button>
          </div>
        </div>
      )}
    </>
  );
}

/** A few numbers from the library itself, so the claims on the cards stay true as it grows. */
function useStats() {
  const [st, setSt] = useState<{ works: number; authors: number; recorded: number } | null>(null);
  useEffect(() => {
    Promise.all([getLibraryIndex(), allRecordedWorks()]).then(([l, r]) => {
      const works = l?.works ?? [];
      setSt({ works: works.length, authors: new Set(works.map((w) => w.authorId)).size, recorded: Object.keys(r ?? {}).length });
    }).catch(() => undefined);
  }, []);
  return st;
}

/**
 * The first-run introduction: a few short cards, the same for everyone, that show the most distinctive parts of the app.
 * Nothing in it is required: Skip is on every card, and every choice has a default. Everything else is explained in place, the first time it is opened.
 */
export default function Intro() {
  const [on, setOn] = useState(() => !introSeen());
  const [i, setI] = useState(0);
  const [note, setNote] = useState('');
  const nav = useNavigate();
  const [s] = useSettings();
  const stats = useStats();
  const card = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = () => { setI(0); setNote(''); setOn(true); };
    window.addEventListener('studybible:tour', h);
    return () => window.removeEventListener('studybible:tour', h);
  }, []);
  useEffect(() => { if (on) { updateSettings({ ambienceTipSeen: true }); card.current?.focus(); } }, [on, i]);
  useEffect(() => {
    if (!on) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') finish(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  if (!on) return null;
  const finish = (to?: string) => {
    put('sb:intro', '1'); put('sb:tour', '1'); put('sb:welcomed', '1'); put('sb:setup', '2');
    updateSettings({ onboarded: true });
    setOn(false);
    if (to) nav(to);
  };
  const n = (v: number) => v.toLocaleString();
  const CARDS: { icon: string; title: string; body: React.ReactNode }[] = [
    { icon: '✝️', title: `Welcome to ${BRAND.name}`, body: (
      <>
        <p className="welcome-sub">One Catholic app for the whole day. A minute of tips, and you are in.</p>
        <ul className="intro-list">
          <li><strong>Read</strong> the Bible with the saints beside every verse</li>
          <li><strong>Listen</strong> to Bible in a Year and the saints’ own books</li>
          <li><strong>Pray</strong> with the Mass readings, Rosary and Liturgy of the Hours</li>
          <li><strong>Learn</strong> the faith and answer hard questions</li>
          <li><strong>Play</strong> games with friends, no account needed</li>
        </ul>
      </>) },
    { icon: '📖', title: 'The Bible, with the saints beside every verse', body: (
      <>
        <p className="welcome-sub">Tap any verse to see what the Church Fathers and saints wrote about it, next to the Catechism, cross-references, original-language words and paintings.</p>
        <ul className="intro-list">
          <li>{stats ? <>A library of <strong>{n(stats.works)} works by {n(stats.authors)} authors</strong>, searchable and linked to the verses they discuss</> : 'A large library of the saints’ own writings, linked to the verses they discuss'}</li>
          <li>Read what they said in their own words, not a summary</li>
          <li>Ask a question in plain words and see where the Fathers answered it</li>
        </ul>
        <p><Link className="btn small" to="/read/webc/JHN/6" onClick={() => finish()}>Try it: John 6, the Bread of Life</Link></p>
      </>) },
    { icon: '🎧', title: 'Bible in a Year', body: <BiayCard onDone={(m) => { setNote(m); setI((x) => x + 1); }} /> },
    { icon: '🛡️', title: 'Answers to hard questions', body: (
      <>
        <p className="welcome-sub">The apologetics hub gives short answers with verses, Catechism paragraphs and the Fathers’ own words.</p>
        <ul className="intro-list">
          <li><strong>Is that true?</strong> Common claims about the Church, fairly checked</li>
          <li><strong>The Argument Map</strong> shows a teaching as a chain of real sources, with the strongest objections</li>
          <li><strong>Learn to answer</strong> tracks take you step by step, on atheism, Protestant friends, Islam and more</li>
        </ul>
        <p><Link className="btn small" to="/study/apologetics-tracks" onClick={() => finish()}>See the hub</Link></p>
      </>) },
    { icon: '🔊', title: 'The saints’ books, read aloud', body: (
      <>
        <p className="welcome-sub">{stats ? <><strong>{n(stats.recorded)} books</strong> from the library have free LibriVox recordings.</> : 'Many books in the library have free LibriVox recordings.'} Listen in the car, on a walk or at the sink.</p>
        <ul className="intro-list">
          <li>Augustine’s <em>Confessions</em>, the <em>Imitation of Christ</em> and more</li>
          <li>Your place is kept, and recordings work offline once downloaded</li>
        </ul>
        <p><Link className="btn small" to="/listen/audiobooks" onClick={() => finish()}>Browse the recordings</Link></p>
      </>) },
    { icon: '🎓', title: 'Learn and play', body: (
      <>
        <p className="welcome-sub">Catechism lessons for every age from kindergarten to adults, each with the sources, pictures and a quiz. Teachers get slides and live classroom games.</p>
        <ul className="intro-list">
          <li>Games to play alone, on one phone or with friends by a shared code</li>
          <li>New things show a red dot and a short note the first time you open them</li>
          <li>Everything is in <strong>Search</strong> and on the <strong>Everything</strong> page</li>
        </ul>
        {note && <p className="welcome-note" role="status">{note}</p>}
      </>) },
  ];
  const last = i === CARDS.length - 1;
  const c = CARDS[i];
  return (
    <div className="welcome-layer" role="dialog" aria-modal="true" aria-label={`Welcome to ${BRAND.name}`}>
      <div className="welcome-card intro-card" ref={card} tabIndex={-1}>
        <div className="welcome-dots" aria-hidden>{CARDS.map((_, k) => <i key={k} className={k === i ? 'on' : k < i ? 'done' : ''} />)}</div>
        <p className="welcome-step">{i + 1} of {CARDS.length} <button type="button" className="welcome-skip" onClick={() => finish()}>Skip</button></p>
        <h1 className="welcome-title"><span aria-hidden="true">{c.icon}</span> {c.title}</h1>
        {c.body}
        <div className="welcome-bar">
          {i > 0 ? <button className="btn" onClick={() => setI(i - 1)}>Back</button> : <span />}
          <span className="welcome-right">
            {last ? <button className="btn primary" onClick={() => finish()}>Start exploring</button> : <button className="btn primary" onClick={() => setI(i + 1)}>{i === 2 ? 'Skip this' : 'Next'}</button>}
          </span>
        </div>
      </div>
    </div>
  );
}
