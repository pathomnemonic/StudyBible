import { useEffect, useMemo, useState } from 'react';
import GameHelp from '../../components/GameHelp';
import ShareButton from '../../components/ShareButton';
import { dayIndex, isPractice, markDailyDone } from '../../lib/dailyGame';
import { dailyDeepPrompts, DEEP_POINTS, DEEP_ROUNDS, DEEP_SECONDS, DEEP_TIER_NAMES, findDeepAnswer, practiceDeepPrompts } from '../../lib/deepWaters';
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
  const prompt: DeepPrompt = prompts[round];

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
    setResult(null); setHistory([]); setScore(0); setDone(false); setShowAnswers(false);
  };

  const submit = () => {
    if (locked || done) return;
    const trimmed = guess.trim();
    if (!trimmed) { setFeedback('Enter an answer first.'); return; }
    const found = findDeepAnswer(prompt, trimmed);
    if (!found) { setFeedback('Not recognized. Try another answer.'); return; }
    const points = DEEP_POINTS[found.tier];
    const entry: RoundResult = { prompt: prompt.prompt, guess: trimmed, answer: found.answer, tier: found.tier, points, timedOut: false };
    setScore((s) => s + points); setResult(entry); setHistory((h) => [...h, entry]);
    setLocked(true); setFeedback('');
  };

  const advance = () => {
    if (round + 1 >= DEEP_ROUNDS) { setDone(true); return; }
    setRound((n) => n + 1); setSeconds(DEEP_SECONDS); setGuess(''); setLocked(false); setFeedback(''); setResult(null); setShowAnswers(false);
  };

  const share = `Deep Waters ${practice ? 'practice' : '#' + today}\n${score} points\n${history.map((r, i) => `${i + 1}. ${r.points ? '+' + r.points : '—'}`).join('\n')}`;
  const accepted = useMemo(() => [...prompt.answers].sort((a, b) => b.tier - a.tier || a.answer.localeCompare(b.answer)), [prompt]);

  return (
    <div className="page deep-waters">
      <header className="dw-head">
        <p className="dw-kicker">A Catholic rare-answer game</p>
        <h1>Deep Waters</h1>
        <p>Seven questions. Twenty-five seconds each. Go beyond the obvious.</p>
      </header>
      <GameHelp how={[
        'Each round gives you a broad Catholic or biblical prompt. Enter one answer before the 25-second timer runs out.',
        'A recognized answer earns more points when it is a deeper cut: 1, 2, 4, 8 or 16 points.',
        'Rarity is curated for the game, not calculated from player-survey statistics. Answers must still be accurate.',
        'If an answer is not recognized, try another spelling or a different answer while time remains.',
        'The daily set is shared by everyone using the same local calendar date. Practice runs do not count.'
      ]} onPractice={(on) => { setPracticeMode(on); reset(on); }} />
      {!done ? (
        <>
          <div className="dw-status">
            <span>ROUND {round + 1} / {DEEP_ROUNDS}</span>
            <span>{score} POINTS</span>
            <span className={seconds <= 7 ? 'dw-urgent' : ''}>{seconds}s</span>
          </div>
          <div className="dw-progress" aria-label={`Round ${round + 1} of ${DEEP_ROUNDS}`}>
            {Array.from({ length: DEEP_ROUNDS }, (_, i) => <span key={i} className={i < round ? 'past' : i === round ? 'current' : ''} />)}
          </div>
          <section className="dw-card">
            <span className="dw-round-label">THE QUESTION</span>
            <h2>{prompt.prompt}</h2>
            <p className="dw-context">{prompt.context}</p>
            <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
              <label className="dw-answer-label" htmlFor="dw-answer">Your answer</label>
              <div className="dw-entry">
                <input id="dw-answer" value={guess} onChange={(e) => { setGuess(e.target.value); setFeedback(''); }} disabled={locked} autoComplete="off" autoCapitalize="words" />
                {!locked && <button className="btn primary" type="submit">Lock answer</button>}
              </div>
            </form>
            <p className="dw-feedback" aria-live="polite">{feedback}</p>
            {locked && result && (
              <div className={`dw-reveal ${result.points ? 'scored' : ''}`}>
                {result.points ? <><strong>+{result.points} points · {DEEP_TIER_NAMES[result.tier!]}</strong><span>{result.answer}</span></> : <><strong>{result.timedOut ? 'Time is up.' : 'No score this round.'}</strong><span>{result.timedOut ? 'The accepted answers are below.' : result.answer}</span></>}
                <p>{prompt.context}</p>
                <button type="button" className="btn ghost" onClick={() => setShowAnswers((v) => !v)}>{showAnswers ? 'Hide' : 'See'} accepted answers</button>
                {showAnswers && <ul className="dw-answer-list">{accepted.map((a) => <li key={a.answer}><span>{a.answer}</span><b>{DEEP_POINTS[a.tier]} pts</b></li>)}</ul>}
                <button type="button" className="btn primary dw-next" onClick={advance}>{round + 1 === DEEP_ROUNDS ? 'See results' : 'Next question →'}</button>
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="dw-card dw-results">
          <p className="dw-kicker">DIVE COMPLETE</p>
          <h2>{score} points</h2>
          <p>{score >= 48 ? 'You know your way around the deep end.' : score >= 24 ? 'A strong dive. There is more beneath the surface.' : 'The deep end rewards curiosity. Try another dive.'}</p>
          <ol>{history.map((r, i) => <li key={i}><span>{r.prompt}</span><b>{r.points ? `+${r.points}` : '—'}</b><small>{r.answer ?? (r.timedOut ? 'Time expired' : 'No recognized answer')}</small></li>)}</ol>
          <div className="dw-actions"><ShareButton text={share} path="/play/deepwaters" label="Share result" className="btn" /><button className="btn primary" onClick={() => reset(practice)}>Dive again</button></div>
        </section>
      )}
      <p className="dw-foot">{practice ? 'Practice run · not counted' : 'Daily dive · one counted finish per day'}</p>
    </div>
  );
}
