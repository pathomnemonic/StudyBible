import { useEffect, useMemo, useRef, useState } from 'react';
import GameHelp from '../../components/GameHelp';
import { bankSignature, deepWatersShare } from '../../lib/shareText';
import ShareButton from '../../components/ShareButton';
import { dayIndex, isPractice, markDailyDone, setPractice } from '../../lib/dailyGame';
import { dailyDeepPrompts, DEEP_POINTS, DEEP_ROUNDS, DEEP_SECONDS, DEEP_TIER_NAMES, deepHint, deepMissMessage, matchDeepAnswer, normalizeDeepAnswer, practiceDeepPrompts, suggestDeepAnswers } from '../../lib/deepWaters';
import { clearDeepSession, deepDiveStreak, loadDeepLogbook, loadDeepSession, recordDeepDive, saveDeepSession } from '../../lib/deepWatersSession';
import { clearDeepMisses, deepMissesText, loadDeepMisses, recordDeepMiss } from '../../lib/deepWatersMisses';
import { Art } from '../../arcade/art';
import BasilicaScene, { MiniBasilica, SUMMIT_M, levelAt, miniPct } from '../../arcade/BasilicaScene';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '../../styles/basilion.css';
import { blip, burst } from '../../arcade/fx';
import { DEEP_WATERS, type DeepAnswer, type DeepPrompt } from '../../data/deepWaters';
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
  // each mode is its own dive: switching remounts it, and it loads that mode's own saved state
  return <DeepDive key={practice ? 'practice' : 'daily'} practice={practice} onPractice={(on) => setPracticeMode((cur) => (cur === on ? cur : on))} />;
}

function DeepDive({ practice, onPractice }: { practice: boolean; onPractice: (on: boolean) => void }) {
  const today = dayIndex();
  const [snapshot] = useState(() => loadDeepSession(today, practice));
  const [practiceSeed, setPracticeSeed] = useState(snapshot?.practiceSeed ?? newPracticeSeed);
  const canResume = Boolean(snapshot && snapshot.practice === practice && snapshot.practiceSeed === practiceSeed);
  const prompts = useMemo(() => {
    if (canResume && snapshot) {
      const byId = new Map(DEEP_WATERS.map((p) => [p.id, p]));
      const restored = snapshot.promptIds.map((id) => byId.get(id)).filter((p): p is DeepPrompt => Boolean(p));
      if (restored.length === DEEP_ROUNDS) return restored;
    }
    return practice ? practiceDeepPrompts(practiceSeed) : dailyDeepPrompts(today);
  }, [practice, practiceSeed, today, canResume, snapshot]);
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
  const [showAnswers, setShowAnswers] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [misses, setMisses] = useState(loadDeepMisses);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (begun && !locked && !done) inputRef.current?.focus(); }, [begun, round, locked, done]);
  useEffect(() => { if (locked && !done) nextRef.current?.focus(); }, [locked, done]);
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
    if (!begun || done || locked) return;
    // the clock runs against a fixed deadline: leaving the page, switching tabs or reloading does not stop it, so a question cannot be looked up elsewhere or reset
    const update = () => setSeconds(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)));
    const timer = window.setInterval(update, 200);
    document.addEventListener('visibilitychange', update);
    update();
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, [begun, done, locked, round]);

  useEffect(() => {
    if (!begun || seconds !== 0 || locked || done || !prompt) return;
    const missed: RoundResult = { prompt: prompt.prompt, guess: '', answer: null, tier: null, points: 0, timedOut: true };
    deadlineRef.current = 0;
    setLocked(true); setResult(missed); setHistory((h) => [...h, missed]);
  }, [begun, seconds, locked, done, prompt]);

  useEffect(() => {
    if (done && !practice && !restoredDone.current) {
      markDailyDone('deepwaters', `${score} pts`, score >= 200);
      const entries = recordDeepDive({ day: today, score, scoredRounds: history.filter((r) => r.points > 0).length, totalRounds: DEEP_ROUNDS, pearlFound: history.some((r) => (r.pearlBonus ?? 0) > 0), practice: false });
      setLogbook(entries);
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!begun) return;
    saveDeepSession({
      version: 1, day: today, practice, practiceSeed, promptIds: prompts.map((p) => p.id),
      round, phase: done ? 'done' : locked ? 'locked' : 'playing', score,
      history: history.map((entry, index) => ({ promptId: prompts[index]?.id ?? '', prompt: entry.prompt, guess: entry.guess, answer: entry.answer, tier: entry.tier, points: entry.points, timedOut: entry.timedOut, pearlBonus: entry.pearlBonus })),
      guess, deadlineAt: done || locked ? null : deadlineRef.current,
      remainingMs: seconds * 1000,
      paused: false, pearlAnswer,
      pearlFound,
    });
  }, [begun, today, practice, practiceSeed, prompts, round, done, locked, score, history, guess, seconds]);

  const begin = () => { deadlineRef.current = Date.now() + DEEP_SECONDS * 1000; remainingRef.current = DEEP_SECONDS * 1000; setSeconds(DEEP_SECONDS); setBegun(true); };

  // only a practice dive can be restarted; a daily dive is final once begun
  const reset = () => {
    if (!practice) return;
    clearDeepSession(true);
    setPracticeSeed(newPracticeSeed());
    deadlineRef.current = Date.now() + DEEP_SECONDS * 1000; remainingRef.current = DEEP_SECONDS * 1000;
    setRound(0); setSeconds(DEEP_SECONDS); setGuess(''); setLocked(false); setFeedback('');
    setResult(null); setHistory([]); setScore(0); setDone(false); setShowAnswers(false); setShowHint(false); setShowAllAnswers(false); setBegun(false);
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
    if (pearlBonus > 0) { burst(); blip('win'); }
    setScore((s) => s + points); setResult(entry); setHistory((h) => [...h, entry]);
    setLocked(true); deadlineRef.current = 0; setFeedback('');
  };

  const advance = () => {
    if (round + 1 >= DEEP_ROUNDS) { setDone(true); return; }
    setRound((n) => n + 1); deadlineRef.current = Date.now() + DEEP_SECONDS * 1000; remainingRef.current = DEEP_SECONDS * 1000; setSeconds(DEEP_SECONDS); setGuess(''); setLocked(false);
    setFeedback(''); setResult(null); setShowAnswers(false); setShowHint(false); setShowAllAnswers(false);
  };

  // the result as a row of symbols (one per question, a higher one is rarer) so it can be shared without giving the answers away
  const share = deepWatersShare({ day: today, practice, score, rounds: history, zone: levelAt(score * 10).name, pearl: pearlFound, bank: bankSignature(DEEP_WATERS.map((p) => p.id)) });
  const accepted = useMemo(() => [...prompt.answers].sort((a, b) => b.tier - a.tier || a.answer.localeCompare(b.answer)), [prompt]);
  const SHOWN_MAX = 15;
  const shownAnswers = prompt.closed || showAllAnswers ? accepted : accepted.slice(0, SHOWN_MAX);
  const timerTone = seconds <= 7 ? 'urgent' : seconds <= 15 ? 'warm' : 'calm';
  const suggestions = useMemo(() => guess.trim() && !locked ? suggestDeepAnswers(prompt, guess) : [], [prompt, guess, locked]);

  const depth = score * 10;
  const zone = levelAt(depth);
  const pct = (m: number) => `${(Math.min(SUMMIT_M, m) / SUMMIT_M) * 100}%`;
  const best = logbook.reduce((m, e) => Math.max(m, e.score), 0);

  return (
    <div className="page deep-waters bas">
      <BasilicaScene height={begun ? depth : 0} begun={begun} />
      {begun && !done && (
        <div className="dw-gauge" aria-hidden="true">
          <MiniBasilica height={depth} />
          <b className="dw-gauge-marker" style={{ bottom: `${miniPct(depth)}%` }}><Art n="dove" size={26} /></b>
        </div>
      )}
      {!begun && !done && (
        <header className="dw-head dw-title">
          <p className="dw-kicker">{practice ? 'Practice ascent' : 'The daily ascent'}</p>
          <h1>Basilion <em>climb the basilica</em></h1>
          <p className="dw-title-sub">Seven questions. Twenty-five seconds each. The rarer the answer, the higher you climb.</p>
          <div className="dw-title-stats">
            <span><b>{streak}</b><small>DAY STREAK</small></span>
            <span><b>{(best * 10).toLocaleString()}</b><small>BEST HEIGHT (M)</small></span>
            <span><b>{logbook.length}</b><small>CLIMBS</small></span>
          </div>
          <button type="button" className="dw-begin" onClick={begin}>Begin ascent <span aria-hidden="true">▶</span></button>
          <p className="dw-title-note">{practice ? 'Practice climbs are not counted.' : `Climb #${today}. The same seven questions for everyone today.`}</p>
        </header>
      )}
      <GameHelp how={[
        'Each round gives you a Catholic or biblical category. Enter one answer from the curated key before the 25-second timer runs out.',
        'A recognized answer earns more points when it is a rarer one: 10, 15, 30, 60, 85 or 100 points, so a full climb can reach 700. Every point takes you 10 metres higher up the basilica.',
        'Use the optional hint if you get stuck. Rarity is curated for the game, not calculated from player surveys.',
        'The answer key is curated, not exhaustive. A valid answer may be missing; an unlisted answer does not mean it is wrong.',
        'One hidden keystone is worth a 50-point bonus (our own addition). It is selected from the rarest accepted answers in today’s set.',
        'The daily set is shared by everyone using the same local calendar date. Practice runs do not count.'
      ]} onPractice={onPractice} />
      {!begun && !done ? null : !done ? (
        <>
          <div className="dw-depthbar"><small>HEIGHT</small><b>{depth.toLocaleString()}<i> m</i></b><span>{zone.name}</span></div>
          <div className="dw-status">
            <span className="dw-round-count">STEP <b>{String(round + 1).padStart(2, '0')}</b><i> / 07</i></span>
            <span className="dw-score"><b>{score}</b><small>POINTS</small></span>
            <div className={`dw-clock ${timerTone}`} role="timer" aria-label={`${seconds} seconds remaining`} style={{ ['--o2' as string]: `${(seconds / DEEP_SECONDS) * 100}%` }}>
              <span>{seconds}</span><small>SEC</small><i className="dw-o2"><b /></i>
            </div>
          </div>
          <div className="dw-progress" role="group" aria-label={`Round ${round + 1} of ${DEEP_ROUNDS}`}>
            {Array.from({ length: DEEP_ROUNDS }, (_, i) => <span key={i} className={i < round ? 'past' : i === round ? 'current' : ''}><i /></span>)}
          </div>
          <section className="dw-card">
            <div className="dw-card-top"><span className="dw-round-label">THE QUESTION</span><span className="dw-daily-tag">{practice ? 'PRACTICE CLIMB' : 'TODAY’S CLIMB'}</span></div>
            <h2>{prompt.prompt}</h2>
            {!locked && <div className="dw-hint-wrap">
              <button className="dw-hint-button" type="button" onClick={() => setShowHint((v) => !v)} aria-expanded={showHint}>
                <span aria-hidden="true">✧</span> {showHint ? 'Hide hint' : 'Need a nudge? Reveal a hint'}
              </button>
              {showHint && <p className="dw-hint">{deepHint(prompt)}</p>}
            </div>}
            <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
              <label className="dw-answer-label" htmlFor="dw-answer">YOUR ANSWER</label>
              <div className="dw-entry">
                <input id="dw-answer" ref={inputRef} value={guess} onChange={(e) => { setGuess(e.target.value); setFeedback(''); }} disabled={locked} autoComplete="off" autoCapitalize="words" placeholder="Type a name, place, prayer…" />
                {!locked && <button className="dw-submit" type="submit">Lock it in <span aria-hidden="true">↗</span></button>}
              </div>
            </form>
            <p className="dw-feedback" aria-live="polite">{feedback}</p>
            {suggestions.length > 0 && <div className="dw-suggestions" aria-label="Possible spelling corrections">
              <small>Did you mean? Choose a suggestion, then lock it in yourself.</small>
              {suggestions.map((item) => <button key={item.answer} type="button" onClick={() => { setGuess(item.answer); setFeedback(''); }}>{item.answer}</button>)}
            </div>}
            {!locked && <div className="dw-scoring-key" aria-label="Scoring guide">
              <span>SCORING</span>{([1,2,3,4,5,6] as const).map((tier) => <i key={tier} title={`${DEEP_TIER_NAMES[tier]}: ${DEEP_POINTS[tier]} points`}><Art n={TIER_ART[tier]} size={26} /><b>{DEEP_POINTS[tier]}</b></i>)}<small>rarer answers score more</small>
            </div>}
            {locked && result && (
              <div className={`dw-reveal ${result.points ? 'scored' : ''}`} data-tier={result.tier ?? undefined}>
                <div className="dw-reveal-heading">
                  <span className="dw-reveal-symbol" aria-hidden="true">{result.tier ? <Art n={TIER_ART[result.tier]} size={52} /> : null}</span>
                  <div><strong>{result.points ? `+${result.points} points` : result.timedOut ? 'Time is up' : 'No score this round'}</strong><small>{result.points ? DEEP_TIER_NAMES[result.tier!] : 'Keep exploring the answer key'}</small></div>
                </div>
                {result.answer && <span className="dw-correct-answer">{result.answer}</span>}
                {(result.pearlBonus ?? 0) > 0 && <strong className="dw-pearl-bonus"><Art n="gem-stone" size={36} className="dw-pearl-gem" /> Keystone found · +{result.pearlBonus} bonus</strong>}
                <p className="dw-context">{prompt.context}</p>
                <button type="button" className="dw-hint-button" onClick={() => setShowAnswers((v) => !v)}>{showAnswers ? 'Hide answer key' : `Explore all ${accepted.length} accepted answers`}</button>
                {showAnswers && <ul className="dw-answer-list">{shownAnswers.map((a) => <li key={a.answer}><span>{a.answer}</span><b>{DEEP_POINTS[a.tier]} pts</b></li>)}</ul>}
                {showAnswers && shownAnswers.length < accepted.length && <button type="button" className="dw-hint-button" onClick={() => setShowAllAnswers(true)}>…and {accepted.length - shownAnswers.length} more. Show all</button>}
                <button type="button" ref={nextRef} className="dw-next" onClick={advance}>{round + 1 === DEEP_ROUNDS ? 'View your climb' : 'Next round'} <span aria-hidden="true">→</span></button>
              </div>
            )}
          </section>
          <p className="dw-microcopy">No penalty for a wrong attempt. Find an answer that fits before the clock runs out.</p>
        </>
      ) : (
        <section className="dw-card dw-results">
          <p className="dw-kicker">CLIMB COMPLETE</p>
          <Art n="trophy" size={104} className="dw-trophy" />
          <h2>{score}<small> pts</small></h2>
          <p className="dw-rank">{rankOf(score)}</p>
          <p className="dw-depth">{(score * 10).toLocaleString()} metres up · {zone.name}{score * 10 >= SUMMIT_M ? ' · you reached the Cross' : ''}</p>
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
          <ol>{history.map((r, i) => <li key={i}><span>{r.prompt}</span><b>{r.points ? `+${r.points}` : '—'}</b><small>{r.answer ?? (r.timedOut ? 'Time expired' : 'No recognized answer')}</small></li>)}</ol>
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
      <p className="dw-foot">{practice ? 'PRACTICE CLIMB · NOT COUNTED' : 'DAILY CLIMB · ONE COUNTED FINISH PER DAY'}</p>
    </div>
  );
}
