import { useEffect, useMemo, useRef, useState } from 'react';
import GameHelp from '../../components/GameHelp';
import ShareButton from '../../components/ShareButton';
import { dayIndex, isPractice, markDailyDone } from '../../lib/dailyGame';
import { dailyDeepPrompts, DEEP_POINTS, DEEP_ROUNDS, DEEP_SECONDS, DEEP_TIER_NAMES, deepHint, deepMissMessage, matchDeepAnswer, practiceDeepPrompts, suggestDeepAnswers } from '../../lib/deepWaters';
import type { DeepAnswer, DeepPrompt } from '../../data/deepWaters';
import './DeepWatersPage.css';

interface RoundResult { prompt: string; guess: string; answer: string | null; tier: DeepAnswer['tier'] | null; points: number; timedOut: boolean }
const newPracticeSeed = () => Math.floor(Math.random() * 1_000_000);

export default function DeepWatersPage() {
  const today = dayIndex();
  const [practice, setPracticeMode] = useState(isPractice());
  const [practiceSeed, setPracticeSeed] = useState(newPracticeSeed);
  const prompts = useMemo(() => practice ? practiceDeepPrompts(practiceSeed) : dailyDeepPrompts(today), [practice, practiceSeed, today]);
  const [round, setRound] = useState(0);
  const [seconds, setSeconds] = useState(DEEP_SECONDS);
  const [guess, setGuess] = useState('');
  const [locked, setLocked] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [result, setResult] = useState<RoundResult | null>(null);
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const prompt: DeepPrompt = prompts[round];
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  // a new question puts the cursor in the answer box; a locked one moves it to the button that goes on, so a keyboard player never loses their place
  useEffect(() => { if (!done && !locked) inputRef.current?.focus(); }, [round, locked, done, practiceSeed, practice]);
  useEffect(() => { if (locked) nextRef.current?.focus(); }, [locked]);

  useEffect(() => {
    if (done || locked) return;
    const timer = window.setInterval(() => setSeconds((n) => Math.max(0, n - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [done, locked, round]);

  useEffect(() => {
    if (seconds !== 0 || locked || done || !prompt) return;
    const missed: RoundResult = { prompt: prompt.prompt, guess: '', answer: null, tier: null, points: 0, timedOut: true };
    setLocked(true); setResult(missed); setHistory((h) => [...h, missed]);
  }, [seconds, locked, done, prompt]);

  useEffect(() => {
    if (done && !practice) markDailyDone('deepwaters', `${score} pts`, score >= 32);
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = (nextPractice = practice) => {
    if (nextPractice) setPracticeSeed(newPracticeSeed());
    setRound(0); setSeconds(DEEP_SECONDS); setGuess(''); setLocked(false); setFeedback('');
    setResult(null); setHistory([]); setScore(0); setDone(false); setShowAnswers(false); setShowHint(false);
  };

  const submit = () => {
    if (locked || done) return;
    const trimmed = guess.trim();
    if (!trimmed) { setFeedback('Type an answer before locking it in.'); return; }
    const match = matchDeepAnswer(prompt, trimmed);
    if (match.status !== 'match') { setFeedback(deepMissMessage(prompt, match)); return; }
    const found = match.answer;
    const points = DEEP_POINTS[found.tier];
    const entry: RoundResult = { prompt: prompt.prompt, guess: trimmed, answer: found.answer, tier: found.tier, points, timedOut: false };
    setScore((s) => s + points); setResult(entry); setHistory((h) => [...h, entry]);
    setLocked(true); setFeedback('');
  };

  const advance = () => {
    if (round + 1 >= DEEP_ROUNDS) { setDone(true); return; }
    setRound((n) => n + 1); setSeconds(DEEP_SECONDS); setGuess(''); setLocked(false);
    setFeedback(''); setResult(null); setShowAnswers(false); setShowHint(false);
  };

  const share = `Deep Waters ${practice ? 'practice' : '#' + today}\n${score} points\n${history.map((r, i) => `${i + 1}. ${r.points ? '+' + r.points : '—'}`).join('\n')}`;
  const accepted = useMemo(() => [...prompt.answers].sort((a, b) => b.tier - a.tier || a.answer.localeCompare(b.answer)), [prompt]);
  // a whole set is listed in full; an open one shows the deepest cuts and says there are more
  const shownAnswers = useMemo(() => (prompt.closed ? accepted : accepted.slice(0, 15)), [prompt, accepted]);
  const timerTone = seconds <= 7 ? 'urgent' : seconds <= 15 ? 'warm' : 'calm';
  const suggestions = useMemo(() => guess.trim() && !locked ? suggestDeepAnswers(prompt, guess) : [], [prompt, guess, locked]);

  return (
    <div className="page deep-waters">
      <div className="dw-atmosphere" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <header className="dw-head">
        <p className="dw-kicker"><span className="dw-orbit" /> A Catholic rare-answer challenge</p>
        <h1>Deep <em>Waters</em></h1>
        <p>Seven rounds. One answer each. Find a recognized answer in our curated key.</p>
      </header>
      <GameHelp how={[
        'Each round gives you a Catholic or biblical category. Enter one answer from the curated key before the 30-second timer runs out.',
        'A recognized answer earns more points when it is a deeper cut: 1, 2, 4, 8 or 16 points.',
        'Use the optional hint if you get stuck. Rarity is curated for the game, not calculated from player surveys.',
        'Spelling does not need to be exact: capital letters, accents, "Saint" and "St.", Roman numerals or digits, and one typo in a long word are all fine. If a guess could mean more than one answer you will be asked to be more specific.',
        'For questions with a fixed answer (the 21 councils, the 37 Doctors of the Church, the books of the Bible) the list is complete. For open questions it is long but not complete: an answer we do not know is called "not on our list", never wrong.',
        'The daily set is shared by everyone using the same local calendar date. Practice runs do not count.'
      ]} onPractice={(on) => { setPracticeMode(on); reset(on); }} />
      {!done ? (
        <>
          <div className="dw-status">
            <span className="dw-round-count">DIVE <b>{String(round + 1).padStart(2, '0')}</b><i> / 07</i></span>
            <span className="dw-score"><b>{score}</b><small>POINTS</small></span>
            <div className={`dw-clock ${timerTone}`} role="timer" aria-label={`${seconds} seconds remaining`} style={{ ['--timer-angle' as string]: `${(seconds / DEEP_SECONDS) * 360}deg` }}>
              <span>{seconds}</span><small>SEC</small>
            </div>
          </div>
          <div className="dw-progress" aria-label={`Round ${round + 1} of ${DEEP_ROUNDS}`}>
            {Array.from({ length: DEEP_ROUNDS }, (_, i) => <span key={i} className={i < round ? 'past' : i === round ? 'current' : ''}><i /></span>)}
          </div>
          <section className="dw-card">
            <div className="dw-card-top"><span className="dw-round-label">THE QUESTION</span><span className="dw-daily-tag">{practice ? 'PRACTICE DIVE' : 'TODAY’S DIVE'}</span></div>
            <h2>{prompt.prompt}</h2>
            <p className="dw-context">{prompt.context}</p>
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
              <span>SCORING</span>{([1,2,3,4,5] as const).map((tier) => <i key={tier} title={`${DEEP_TIER_NAMES[tier]}: ${DEEP_POINTS[tier]} points`}><b>{DEEP_POINTS[tier]}</b></i>)}<small>rarer answers score more</small>
            </div>}
            {locked && result && (
              <div className={`dw-reveal ${result.points ? 'scored' : ''}`}>
                <div className="dw-reveal-heading">
                  <span className="dw-reveal-symbol">{result.points ? '✦' : '○'}</span>
                  <div><strong>{result.points ? `+${result.points} points` : result.timedOut ? 'Time is up' : 'No score this round'}</strong><small>{result.points ? DEEP_TIER_NAMES[result.tier!] : 'Keep exploring the answer key'}</small></div>
                </div>
                {result.answer && <span className="dw-correct-answer">{result.answer}</span>}
                <p>{prompt.context}</p>
                <button type="button" className="dw-hint-button" onClick={() => setShowAnswers((v) => !v)}>{showAnswers ? 'Hide answer key' : `See accepted answers (${accepted.length})`}</button>
                {showAnswers && <><ul className="dw-answer-list">{shownAnswers.map((a) => <li key={a.answer}><span>{a.answer}</span><b>{DEEP_POINTS[a.tier]} pts</b></li>)}</ul>{shownAnswers.length < accepted.length && <p className="small">…and {accepted.length - shownAnswers.length} more. This list is not complete: other true answers may exist.</p>}</>}
                <button type="button" ref={nextRef} className="dw-next" onClick={advance}>{round + 1 === DEEP_ROUNDS ? 'View dive summary' : 'Next round'} <span aria-hidden="true">→</span></button>
              </div>
            )}
          </section>
          <p className="dw-microcopy">No penalty for a wrong attempt. Find an answer that fits before the clock runs out.</p>
        </>
      ) : (
        <section className="dw-card dw-results">
          <p className="dw-kicker">DIVE COMPLETE</p>
          <h2>{score}<small> pts</small></h2>
          <p>{score >= 48 ? 'You know your way around the deep end.' : score >= 24 ? 'A strong dive. There is more beneath the surface.' : 'The deep end rewards curiosity. Try another dive.'}</p>
          <div className="dw-result-stats"><span><b>{history.filter((r) => r.points > 0).length}</b><small>ROUNDS SCORED</small></span><span><b>{Math.max(...history.map((r) => r.points), 0)}</b><small>BEST ROUND</small></span><span><b>{history.filter((r) => r.timedOut).length}</b><small>TIMEOUTS</small></span></div>
          <ol>{history.map((r, i) => <li key={i}><span>{r.prompt}</span><b>{r.points ? `+${r.points}` : '—'}</b><small>{r.answer ?? (r.timedOut ? 'Time expired' : 'No recognized answer')}</small></li>)}</ol>
          <div className="dw-actions"><ShareButton text={share} path="/play/deepwaters" label="Share result" className="btn" /><button className="dw-submit" onClick={() => reset(practice)}>Dive again ↗</button></div>
        </section>
      )}
      <p className="dw-foot">{practice ? 'PRACTICE RUN · NOT COUNTED' : 'DAILY DIVE · ONE COUNTED FINISH PER DAY'}</p>
    </div>
  );
}
