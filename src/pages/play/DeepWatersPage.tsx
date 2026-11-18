import { useEffect, useMemo, useRef, useState } from 'react';
import GameHelp from '../../components/GameHelp';
import { bankSignature, deepWatersShare } from '../../lib/shareText';
import ShareButton from '../../components/ShareButton';
import { dayIndex, isPractice, markDailyDone, setPractice } from '../../lib/dailyGame';
import { dailyDeepPrompts, DEEP_POINTS, DEEP_ROUNDS, DEEP_SECONDS, DEEP_TIER_NAMES, deepHint, deepMissMessage, matchDeepAnswer, normalizeDeepAnswer, practiceDeepPrompts, suggestDeepAnswers } from '../../lib/deepWaters';
import { clearDeepSession, deepDiveStreak, loadDeepLogbook, loadDeepSession, recordDeepDive, saveDeepSession } from '../../lib/deepWatersSession';
import { clearDeepMisses, deepMissesText, loadDeepMisses, recordDeepMiss } from '../../lib/deepWatersMisses';
import { Art } from '../../arcade/art';
import { HEAVEN_M, MiniBasilica, SUMMIT_M, levelAt, miniPct } from '../../arcade/BasilicaScene';
import BasilicaStage from '../../arcade/BasilicaStage';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '../../styles/basilion.css';
import { burst, cue, countUp, reduced as motionOff } from '../../arcade/fx';

/** the colour of each rarity, shared by the answer, the landing sparks and the flash */
const RARE_HEX: Record<number, string[]> = { 1: ['#9aa1ab', '#d7dbe0'], 2: ['#3f8cff', '#9cc4ff', '#ffffff'], 3: ['#2fb36b', '#8be0b0', '#ffffff'], 4: ['#e0443e', '#ff9a8f', '#ffd23f'], 5: ['#a04bff', '#d3a8ff', '#ffffff', '#ff4fa3'], 6: ['#f0b429', '#ffe08a', '#ffffff', '#ffd23f'] };
import { DEEP_PLAYABLE, DEEP_WATERS, type DeepAnswer, type DeepPrompt } from '../../data/deepWaters';
import './DeepWatersPage.css';

interface RoundResult { prompt: string; guess: string; answer: string | null; tier: DeepAnswer['tier'] | null; points: number; timedOut: boolean; pearlBonus?: number }
/** the thing that stands for each rung: a candle for the nearest answer, the cross for the rarest */
const TIER_ART: Record<number, string> = { 1: 'candle', 2: 'bell', 3: 'dove', 4: 'baby-angel', 5: 'glowing-star', 6: 'latin-cross' };
/** a title for a finished dive, by points (our own names) */
const rankOf = (pts: number) => (pts >= 600 ? 'Keeper of the Lantern' : pts >= 450 ? 'Dome climber' : pts >= 300 ? 'Bell ringer' : pts >= 150 ? 'Sacristan' : 'Pilgrim at the door');
const PEARL_BONUS = 50; // our own addition: the keystone bonus (kept under its old name in the code)
const newPracticeSeed = () => Math.floor(Math.random() * 1_000_000);

export default function DeepWatersPage() {
  const [practice, setPracticeMode] = useState(isPractice());
  const [pack, setPackId] = useState<string | null>(() => { try { return isPractice() ? localStorage.getItem(PACK_KEY) : null; } catch { return null; } });
  const choosePack = (id: string | null) => { try { if (id) localStorage.setItem(PACK_KEY, id); else localStorage.removeItem(PACK_KEY); } catch { /* local storage may be unavailable */ } if (id) { setPractice(true); setPracticeMode(true); } setPackId(id); };
  const [packs, setPacks] = useState<PackMod | null>(null);
  useEffect(() => { let dead = false; void import('../../data/deepWatersPacks').then((m) => { if (!dead) setPacks(m); }); return () => { dead = true; }; }, []);
  if (pack && !packs) return <div className="page deep-waters bas"><p className="dw-title-note">Opening the pack…</p></div>;
  // each mode is its own dive: switching remounts it, and it loads that mode's own saved state
  return <DeepDive packs={packs} key={practice ? `practice:${pack ?? ''}` : 'daily'} practice={practice} pack={practice ? pack : null} onPack={choosePack} onPractice={(on) => { if (!on) choosePack(null); setPracticeMode((cur) => (cur === on ? cur : on)); }} />;
}

/** the special packs are a separate chunk, loaded when the page opens, so the daily game does not carry them */
type PackMod = typeof import('../../data/deepWatersPacks');
const PACK_KEY = 'cathology.deepwaters.pack';
const PACK_BEST = 'cathology.deepwaters.packbest';
const loadPackBest = (): Record<string, number> => { try { return JSON.parse(localStorage.getItem(PACK_BEST) ?? '{}') as Record<string, number>; } catch { return {}; } };
const savePackBest = (id: string, score: number) => { try { const b = loadPackBest(); if (score > (b[id] ?? 0)) { b[id] = score; localStorage.setItem(PACK_BEST, JSON.stringify(b)); } } catch { /* local storage may be unavailable */ } };

function DeepDive({ packs, practice, pack, onPack, onPractice }: { packs: PackMod | null; practice: boolean; pack: string | null; onPack: (id: string | null) => void; onPractice: (on: boolean) => void }) {
  const today = dayIndex();
  const [snapshot] = useState(() => loadDeepSession(today, practice));
  const [practiceSeed, setPracticeSeed] = useState(snapshot?.practiceSeed ?? newPracticeSeed);
  const canResume = Boolean(snapshot && snapshot.practice === practice && snapshot.practiceSeed === practiceSeed && (snapshot.pack ?? null) === pack);
  const prompts = useMemo(() => {
    if (canResume && snapshot) {
      const byId = new Map((packs?.DEEP_ALL ?? DEEP_WATERS).map((p) => [p.id, p]));
      const restored = snapshot.promptIds.map((id) => byId.get(id)).filter((p): p is DeepPrompt => Boolean(p));
      if (restored.length === DEEP_ROUNDS) return restored;
    }
    return practice ? (pack && packs ? packs.packDeepPrompts(pack, practiceSeed) : practiceDeepPrompts(practiceSeed)) : dailyDeepPrompts(today);
  }, [practice, pack, packs, practiceSeed, today, canResume, snapshot]);
  const restoredRemaining = snapshot?.deadlineAt ? Math.max(0, snapshot.deadlineAt - Date.now()) : DEEP_SECONDS * 1000;
  const [round, setRound] = useState(canResume ? snapshot!.round : 0);
  const [seconds, setSeconds] = useState(canResume ? Math.ceil(restoredRemaining / 1000) : DEEP_SECONDS);
  const [guess, setGuess] = useState(canResume ? snapshot!.guess : '');
  const [locked, setLocked] = useState(canResume && snapshot!.phase === 'locked');
  const [feedback, setFeedback] = useState('');
  const [history, setHistory] = useState<RoundResult[]>(canResume ? snapshot!.history as RoundResult[] : []);
  const [result, setResult] = useState<RoundResult | null>(canResume && snapshot!.phase === 'locked' ? (snapshot!.history[snapshot!.history.length - 1] as RoundResult ?? null) : null);
  const [score, setScore] = useState(canResume ? snapshot!.score : 0);
  const [done, setDone] = useState(canResume && snapshot!.phase === 'done');
  // a dive begins when the player says so: the questions are not shown, and no clock runs, until then (a dive already under way resumes at once)
  const [begun, setBegun] = useState(canResume);
  // each round opens with the question alone in a glass box (no input, no clock), and a locked-in answer rises up the basilica before its points are shown
  const [reading, setReading] = useState(false);
  const [rising, setRising] = useState(false);
  const [flash, setFlash] = useState(0);
  const [shake, setShake] = useState(false);
  const ptsRef = useRef<HTMLSpanElement>(null);
  useEffect(() => { if (locked && !rising && ptsRef.current) countUp(ptsRef.current, 700); }, [locked, rising]);
  const [showHint, setShowHint] = useState(false);
  const [misses, setMisses] = useState(loadDeepMisses);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (begun && !locked && !done && !reading) inputRef.current?.focus(); }, [begun, round, locked, done, reading]);
  useEffect(() => { if (locked && !done && !rising) nextRef.current?.focus(); }, [locked, done, rising]);
  useEffect(() => {
    if (!reading) return;
    const t = window.setTimeout(() => { deadlineRef.current = Date.now() + DEEP_SECONDS * 1000; remainingRef.current = DEEP_SECONDS * 1000; setSeconds(DEEP_SECONDS); setReading(false); }, motionOff() ? 700 : 1500);
    return () => window.clearTimeout(t);
  }, [reading]);
  useEffect(() => {
    if (!rising) return;
    const t = window.setTimeout(() => {
      setRising(false); cue('land', result?.tier ?? 1);
      const tier = result?.tier ?? 0;
      if (tier >= 2) burst(window.innerWidth / 2, window.innerHeight * 0.42, 14 + tier * 12, RARE_HEX[tier]);
      if (tier >= 4 && !motionOff()) { setFlash(tier); window.setTimeout(() => setFlash(0), 700); }
      if (tier >= 5 && !motionOff()) { setShake(true); window.setTimeout(() => setShake(false), 450); }
    }, motionOff() ? 500 : 2100);
    return () => window.clearTimeout(t);
  }, [rising]); // eslint-disable-line react-hooks/exhaustive-deps
  const prompt: DeepPrompt = prompts[round];
  const deadlineRef = useRef<number>(snapshot?.deadlineAt ?? Date.now() + restoredRemaining);
  const remainingRef = useRef<number>(restoredRemaining);
  const [logbook, setLogbook] = useState(loadDeepLogbook());
  const restoredDone = useRef(canResume && snapshot!.phase === 'done');
  const streak = deepDiveStreak(logbook, today);
  const pearlPool = prompts.flatMap((p) => p.answers.filter((a) => a.tier >= 5).map((a) => a.answer));
  const pearlAnswer = !practice && pearlPool.length ? pearlPool[Math.abs(today * 31) % pearlPool.length] : null;
  const pearlFound = history.some((item) => (item.pearlBonus ?? 0) > 0);

  useEffect(() => {
    if (!begun || done || locked || reading) return;
    // the clock runs against a fixed deadline: leaving the page, switching tabs or reloading does not stop it, so a question cannot be looked up elsewhere or reset
    const update = () => setSeconds(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)));
    const timer = window.setInterval(update, 200);
    document.addEventListener('visibilitychange', update);
    update();
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, [begun, done, locked, round, reading]);

  useEffect(() => {
    if (!begun || seconds !== 0 || locked || done || reading || !prompt) return;
    const missed: RoundResult = { prompt: prompt.prompt, guess: '', answer: null, tier: null, points: 0, timedOut: true };
    deadlineRef.current = 0;
    setLocked(true); setResult(missed); setHistory((h) => [...h, missed]); cue('miss');
  }, [begun, seconds, locked, done, reading, prompt]);

  useEffect(() => {
    if (done && pack && !restoredDone.current) savePackBest(pack, score);
    if (done && !practice && !restoredDone.current) {
      markDailyDone('deepwaters', `${score} pts`, score >= 200);
      const entries = recordDeepDive({ day: today, score, scoredRounds: history.filter((r) => r.points > 0).length, totalRounds: DEEP_ROUNDS, pearlFound: history.some((r) => (r.pearlBonus ?? 0) > 0), practice: false });
      setLogbook(entries);
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!begun) return;
    saveDeepSession({
      version: 1, day: today, practice, practiceSeed, pack, promptIds: prompts.map((p) => p.id),
      round, phase: done ? 'done' : locked ? 'locked' : 'playing', score,
      history: history.map((entry, index) => ({ promptId: prompts[index]?.id ?? '', prompt: entry.prompt, guess: entry.guess, answer: entry.answer, tier: entry.tier, points: entry.points, timedOut: entry.timedOut, pearlBonus: entry.pearlBonus })),
      guess, deadlineAt: done || locked || reading ? null : deadlineRef.current,
      remainingMs: seconds * 1000,
      paused: false, pearlAnswer,
      pearlFound,
    });
  }, [begun, today, practice, pack, practiceSeed, prompts, round, done, locked, reading, score, history, guess, seconds]);

  const begin = () => { setSeconds(DEEP_SECONDS); setReading(true); setBegun(true); cue('next'); };

  // only a practice dive can be restarted; a daily dive is final once begun
  const reset = () => {
    if (!practice) return;
    clearDeepSession(true);
    setPracticeSeed(newPracticeSeed());
    setReading(false); setRising(false);
    setRound(0); setSeconds(DEEP_SECONDS); setGuess(''); setLocked(false); setFeedback('');
    setResult(null); setHistory([]); setScore(0); setDone(false); setShowHint(false); setBegun(false);
  };

  const submit = () => {
    if (locked || done) return;
    const trimmed = guess.trim();
    if (!trimmed) { setFeedback('Type an answer before locking it in.'); return; }
    const match = matchDeepAnswer(prompt, trimmed);
    if (match.status !== 'match') {
      if (match.status === 'none') setMisses(recordDeepMiss({ promptId: prompt.id, prompt: prompt.prompt, guess: trimmed }));
      setFeedback(deepMissMessage(prompt, match)); return;
    }
    const found = match.answer;
    const basePoints = DEEP_POINTS[found.tier];
    const pearlBonus = pearlAnswer && normalizeDeepAnswer(found.answer) === normalizeDeepAnswer(pearlAnswer) ? PEARL_BONUS : 0;
    const points = basePoints + pearlBonus;
    const entry: RoundResult = { prompt: prompt.prompt, guess: trimmed, answer: found.answer, tier: found.tier, points, timedOut: false, pearlBonus };
    if (pearlBonus > 0) burst();
    setScore((s) => s + points); setResult(entry); setHistory((h) => [...h, entry]);
    setLocked(true); deadlineRef.current = 0; setFeedback(''); setRising(true); cue('submit');
    window.setTimeout(() => cue('rise'), 260);
  };

  const advance = () => {
    if (round + 1 >= DEEP_ROUNDS) { setDone(true); cue('final'); return; }
    cue('next');
    setRound((n) => n + 1); setSeconds(DEEP_SECONDS); setReading(true); setGuess(''); setLocked(false);
    setFeedback(''); setResult(null); setShowHint(false);
  };

  // the result as a row of symbols (one per question, a higher one is rarer) so it can be shared without giving the answers away
  const share = deepWatersShare({ day: today, practice, score, rounds: history, zone: levelAt(score * 10).name, pearl: pearlFound, bank: bankSignature(DEEP_PLAYABLE.map((p) => p.id)) });
  const timerTone = seconds <= 10 ? 'urgent' : seconds <= 25 ? 'warm' : 'calm';
  const suggestions = useMemo(() => guess.trim() && !locked ? suggestDeepAnswers(prompt, guess) : [], [prompt, guess, locked]);

  // what the player sees counts a locked-in answer only once it has landed
  const shownScore = rising && result ? score - result.points : score;
  const depth = score * 10;
  const zone = levelAt(depth);
  const pct = (m: number) => `${(Math.min(SUMMIT_M, m) / SUMMIT_M) * 100}%`;
  const best = logbook.reduce((m, e) => Math.max(m, e.score), 0);

  return (
    <div className={`page deep-waters bas${shake ? ' dw-shake' : ''}`}>
      {flash > 0 && <div className="dw-flash" data-tier={flash} aria-hidden="true" />}
      <BasilicaStage height={begun ? depth : 0} begun={begun} />
      {begun && !done && (
        <div className="dw-gauge" aria-hidden="true">
          <MiniBasilica height={depth} />
          <b className="dw-gauge-marker" style={{ bottom: `${miniPct(depth)}%` }}><Art n="dove" size={26} /></b>
        </div>
      )}
      {!begun && !done && (
        <header className="dw-head dw-title">
          <p className="dw-kicker">{pack ? `Special pack · ${packs?.packById(pack)?.name ?? ''}` : practice ? 'Practice ascent' : 'The daily ascent'}</p>
          <h1>Basilion <em>climb the basilica</em></h1>
          <p className="dw-title-sub">Seven questions. Forty-five seconds each. The rarer the answer, the higher you climb. Reach the Cross and the climb goes on, into the heavens.</p>
          <div className="dw-title-stats">
            <span><b>{streak}</b><small>DAY STREAK</small></span>
            <span><b>{(best * 10).toLocaleString()}</b><small>BEST HEIGHT (M)</small></span>
            <span><b>{logbook.length}</b><small>CLIMBS</small></span>
          </div>
          <button type="button" className="dw-begin" onClick={begin}>Begin ascent <span aria-hidden="true">▶</span></button>
          <p className="dw-title-note">{pack ? 'A pack climb is not counted in your streak. Each time is a fresh deal.' : practice ? 'Practice climbs are not counted.' : `Climb #${today}. The same seven questions for everyone today.`}</p>
          {(pack || practice) && <button type="button" className="dw-hint-button" onClick={() => (pack ? onPack(null) : onPractice(false))}>{pack ? '← All packs and practice' : '← Back to the daily climb'}</button>}
          {!pack && packs && (
            <section className="dw-packs" aria-label="Special packs">
              <h2>Special packs</h2>
              <p>The daily climb asks things that come to mind at once. These are the deeper lists, for when you want a harder climb.</p>
              <ul>
                {packs.PACKS.filter((k) => packs.packPrompts(k.id).length >= 12).map((k) => { const best = loadPackBest()[k.id]; return (
                  <li key={k.id}><button type="button" onClick={() => onPack(k.id)}><b>{k.name}</b><small>{k.blurb}</small><i>{packs.packPrompts(k.id).length.toLocaleString()} questions{k.hard ? ' · hard' : ''}{best ? ` · best ${best}` : ''}</i></button></li>
                ); })}
              </ul>
            </section>
          )}
        </header>
      )}
      {(!begun || done) && (<GameHelp how={[
        'Each round gives you a Catholic or biblical category. Enter one answer from the curated key before the 45-second timer runs out.',
        'A recognized answer earns more points when it is a rarer one: 10, 15, 30, 60, 85 or 100 points, so a full climb can reach 700. Every point takes you 10 metres higher up the basilica.',
        'Use the optional hint if you get stuck. Rarity is curated for the game, not calculated from player surveys.',
        'The answer key is curated, not exhaustive. A valid answer may be missing; an unlisted answer does not mean it is wrong.',
        'One hidden keystone is worth a 50-point bonus (our own addition). It is selected from the rarest accepted answers in today’s set.',
        'The daily set is shared by everyone using the same local calendar date. Practice runs do not count.'
      ]} onPractice={onPractice} />)}
      {!begun && !done ? null : !done ? (
        <>
          <div className="dw-topline">
            <span className="dw-round-count">STEP <b>{round + 1}</b><i> / {DEEP_ROUNDS}</i>{practice && <em className="dw-mode">{pack ? 'PACK' : 'PRACTICE'}</em>}</span>
            <span className="dw-height"><b>{(shownScore * 10).toLocaleString()}</b> m</span>
            <span className="dw-score"><b>{shownScore}</b><small>PTS</small></span>
            <div className={`dw-clock ${timerTone}`} role="timer" aria-label={`${seconds} seconds remaining`} style={{ ['--o2' as string]: `${(seconds / DEEP_SECONDS) * 100}%` }}>
              <span>{seconds}</span>
            </div>
          </div>
          <div className="dw-progress" role="group" aria-label={`Round ${round + 1} of ${DEEP_ROUNDS}`}>
            {Array.from({ length: DEEP_ROUNDS }, (_, i) => <span key={i} className={i < round ? 'past' : i === round ? 'current' : ''}><i /></span>)}
          </div>
          <section className={`dw-card${reading ? ' reading' : ''}${rising ? ' rising' : ''}`}>
            {rising && result ? (
              <div className="dw-rise" data-tier={result.tier ?? undefined} aria-live="polite">
                <span className="dw-rise-streaks" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ left: `${6 + i * 11}%`, animationDelay: `${(i % 4) * 0.18}s` }} />)}</span>
                <span className="dw-rise-chip">{result.answer}</span>
                <small>climbing…</small>
              </div>
            ) : <>
                        <h2>{prompt.prompt}</h2>
            {reading && <p className="dw-ready" aria-live="polite">Read the question…</p>}
            {!locked && !reading && <div className="dw-hint-wrap">
              <button className="dw-hint-button" type="button" onClick={() => setShowHint((v) => !v)} aria-expanded={showHint}>
                <span aria-hidden="true">✧</span> {showHint ? 'Hide hint' : 'Need a nudge? Reveal a hint'}
              </button>
              {showHint && <p className="dw-hint">{deepHint(prompt)}</p>}
            </div>}
            {!reading && <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
              <label className="dw-answer-label" htmlFor="dw-answer">YOUR ANSWER</label>
              <div className="dw-entry">
                <input id="dw-answer" ref={inputRef} value={guess} onChange={(e) => { setGuess(e.target.value); setFeedback(''); }} disabled={locked} autoComplete="off" autoCapitalize="words" placeholder="Type a name, place, prayer…" />
                {!locked && <button className="dw-submit" type="submit">Lock it in <span aria-hidden="true">↗</span></button>}
              </div>
            </form>}
            <p className="dw-feedback" aria-live="polite">{feedback}</p>
            {suggestions.length > 0 && <div className="dw-suggestions" aria-label="Possible spelling corrections">
              <small>Did you mean? Choose a suggestion, then lock it in yourself.</small>
              {suggestions.map((item) => <button key={item.answer} type="button" onClick={() => { setGuess(item.answer); setFeedback(''); }}>{item.answer}</button>)}
            </div>}
            {locked && result && (
              <div className={`dw-reveal ${result.points ? 'scored' : ''}`} data-tier={result.tier ?? undefined}>
                <div className="dw-reveal-heading">
                  <span className="dw-reveal-symbol" aria-hidden="true">{result.tier ? <Art n={TIER_ART[result.tier]} size={52} /> : null}</span>
                  <div><strong>{result.points ? <>+<span ref={ptsRef}>{result.points}</span> points</> : result.timedOut ? 'Time is up' : 'No score this round'}</strong><small>{result.points ? DEEP_TIER_NAMES[result.tier!] : 'Keep exploring the answer key'}</small></div>
                </div>
                {result.answer && <span className="dw-correct-answer">{result.answer}</span>}
                {(result.pearlBonus ?? 0) > 0 && <strong className="dw-pearl-bonus"><Art n="gem-stone" size={36} className="dw-pearl-gem" /> Keystone found · +{result.pearlBonus} bonus</strong>}
                <p className="dw-context">{prompt.context}</p>
                <button type="button" ref={nextRef} className="dw-next" onClick={advance}>{round + 1 === DEEP_ROUNDS ? 'View your climb' : 'Next round'} <span aria-hidden="true">→</span></button>
              </div>
            )}
            </>}
          </section>
        </>
      ) : (
        <section className="dw-card dw-results">
          <p className="dw-kicker">CLIMB COMPLETE</p>
          <Art n="trophy" size={104} className="dw-trophy" />
          <h2>{score}<small> pts</small></h2>
          <p className="dw-rank">{rankOf(score)}</p>
          <p className="dw-depth">{(score * 10).toLocaleString()} metres up · {zone.name}{score * 10 >= HEAVEN_M ? ' · you reached the light of Heaven' : score * 10 > SUMMIT_M ? ' · you climbed past the Cross' : score * 10 >= SUMMIT_M ? ' · you reached the Cross' : ''}</p>
          <p>{score >= 450 ? 'You know your way around the whole building.' : score >= 200 ? 'A strong climb. There are more floors to reach.' : 'The upper floors reward curiosity. Try another climb.'}</p>
          {!practice && <p className="dw-streak">Current streak: <strong>{streak}</strong> day{streak === 1 ? '' : 's'} · {logbook.length} logged climbs</p>}
          {!practice && logbook.length > 1 && (
            <div className="dw-log" aria-label="Your last climbs">
              <ol>{logbook.slice(-7).map((e) => (
                <li key={e.day} className={e.day === today ? 'today' : ''} title={`${e.score} points`}>
                  <b>{e.score}</b>
                  <i style={{ ['--p' as string]: Math.max(0.06, Math.min(1, e.score / (DEEP_ROUNDS * 100))) }} />
                  <small>{new Date(e.day * 86_400_000).toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' })}</small>
                </li>))}
              </ol>
            </div>
          )}
          {pearlFound && <p className="dw-pearl-bonus">You found the keystone of the day.</p>}
          <div className="dw-result-stats"><span><b>{history.filter((r) => r.points > 0).length}</b><small>ROUNDS SCORED</small></span><span><b>{Math.max(...history.map((r) => r.points), 0)}</b><small>BEST ROUND</small></span><span><b>{history.filter((r) => r.timedOut).length}</b><small>TIMEOUTS</small></span></div>
          <ol>{history.map((r, i) => <li key={i}><span>{r.prompt}</span><b>{r.points ? `+${r.points}` : '—'}</b><small>{r.answer ?? (r.timedOut ? 'Time expired' : 'No recognized answer')}</small>
            {prompts[i] && <details className="dw-key"><summary>Answer key ({prompts[i].answers.length})</summary>
              <ul className="dw-answer-list">{[...prompts[i].answers].sort((x, y) => y.tier - x.tier || x.answer.localeCompare(y.answer)).slice(0, 40).map((a) => <li key={a.answer}><span>{a.answer}</span><b>{DEEP_POINTS[a.tier]} pts</b></li>)}</ul>
              {prompts[i].answers.length > 40 && <small>…and {prompts[i].answers.length - 40} more</small>}
            </details>}</li>)}</ol>
          {misses.length > 0 && <div className="dw-misses">
            <p>{misses.length} answer{misses.length === 1 ? '' : 's'} you tried {misses.length === 1 ? 'is' : 'are'} not on our list. The list is not complete, so some may be right. They are kept only on this device.</p>
            <button type="button" className="dw-hint-button" onClick={() => { void navigator.clipboard?.writeText(deepMissesText(misses)).then(() => setCopied(true)).catch(() => setCopied(false)); }}>{copied ? 'Copied' : 'Copy the list to send us'}</button>
            <button type="button" className="dw-hint-button" onClick={() => { clearDeepMisses(); setMisses([]); setCopied(false); }}>Clear</button>
          </div>}
          <div className="dw-actions"><ShareButton text={share} path="/play/deepwaters" label="Share result" className="btn" />{practice
            ? <button className="dw-submit" onClick={reset}>Climb again ↗</button>
            : <button className="dw-submit" onClick={() => { setPractice(true); onPractice(true); }}>Practice climb ↗</button>}</div>
        </section>
      )}
      {(!begun || done) && <p className="dw-foot">{pack ? 'SPECIAL PACK · NOT COUNTED' : practice ? 'PRACTICE CLIMB · NOT COUNTED' : 'DAILY CLIMB · ONE COUNTED FINISH PER DAY'}</p>}
    </div>
  );
}
