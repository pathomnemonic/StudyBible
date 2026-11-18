import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { currentStreak, dailyDone, dayIndex, loadPlays, playTotals, seeded } from '../../lib/dailyGame';
import { useSettings } from '../../lib/store';
import { levelOf } from '../../lib/arcadeLevel';
import { Anim, Art, GAME_ART } from '../../arcade/art';
import { blip, burst } from '../../arcade/fx';

interface Game { to: string; title: string; blurb: string; icon: string; color: string; time: string; who: string; daily?: string; isNew?: boolean }
interface Group { id: string; title: string; sub: string; games: Game[] }
const G = (to: string, title: string, blurb: string, icon: string, color: string, time: string, who: string, extra: Partial<Game> = {}): Game => ({ to, title, blurb, icon, color, time, who, ...extra });

const GROUPS: Group[] = [
  { id: 'deep', title: 'Climb', sub: 'One answer. A little time. The less obvious, the higher you go.', games: [
    G('/play/deepwaters', 'Basilion', 'Seven Catholic prompts. Find a valid answer others might overlook.', '⛪', '#7a4fb0', '4 min', 'Solo', { daily: 'deepwaters', isNew: true }),
  ] },
  { id: 'quick', title: 'Quick hits', sub: 'Two minutes or less. A new one every day.', games: [
    G('/play/verbum', 'Creedle', 'Guess the five-letter word of the faith in six tries.', '🟨', '#d4a017', '3 min', 'Solo', { daily: 'verbum' }),
    G('/play/whichbook', 'Which Book?', 'Name the book of the Bible a verse comes from.', '📖', '#4a7bd0', '2 min', 'Solo', { daily: 'whichbook' }),
    G('/play/whosaid', 'Who Said It?', 'Five quotations from the saints: who said each?', '💬', '#c0507a', '2 min', 'Solo', { daily: 'whosaid' }),
    G('/play/saintguess', 'Saintdle', 'Name the saint from clues that get easier.', '🕊️', '#2f8f6b', '2 min', 'Solo', { daily: 'saintguess' }),
  ] },
  { id: 'brain', title: 'Brain teasers', sub: 'Slow down, think, and feel clever.', games: [
    G('/play/quartets', 'Communions', 'Sixteen tiles, four hidden sets.', '🔶', '#e8812b', '5 min', 'Solo', { daily: 'quartets' }),
    G('/play/chain', 'Jacob’s Ladder', 'Change one letter at a time to turn one word into another.', '🔗', '#5a8f9a', '4 min', 'Solo', { daily: 'chain' }),
    G('/play/crossword', 'Crossword', 'A small crossword of the faith, new each week.', '✏️', '#8a5ac2', '10 min', 'Solo'),
    G('/play/wordsearch', 'Wordsearch', 'A weekly theme. Find the hidden words.', '🔍', '#4a9b8e', '6 min', 'Solo'),
    G('/play/cloister', 'Scriggle', 'Link letters into words. Words of the faith score extra.', '🔤', '#b9772e', '5 min', 'Solo'),
    G('/play/termmatch', 'Match the term', 'Pair five Catholic words with their meanings.', '🔗', '#8a5ac2', '2 min', 'Solo'),
    G('/play/familyties', 'Family ties', 'Who was the father or mother? From the genealogies of Scripture.', '🌳', '#5a8f5a', '3 min', 'Solo'),
    G('/play/whoami', 'Who Am I?', 'A person from the Bible, from five clues.', '🧔', '#6b7fd7', '3 min', 'Solo', { daily: 'whoami' }),
  ] },
  { id: 'explore', title: 'Explore and discover', sub: 'Maps, art and the stories behind them.', games: [
    G('/play/pilgrim', 'Holyguessr', 'Tap the map to place a city or mountain from Scripture.', '📍', '#c05050', '3 min', 'Solo', { daily: 'pilgrim' }),
    G('/play/artdetective', 'Art Detective', 'Name the Bible scene from an engraving.', '🖼️', '#a0522d', '3 min', 'Solo', { daily: 'artdetective' }),
    G('/play/prophet', 'The Prophet', 'Guess the year, the number or the count. Closer scores more.', '🔮', '#7a5ac2', '4 min', 'Solo'),
    G('/play/doctrineladder', 'Who Wants to Be a Saint?', 'Three levels of questions on what the Church teaches.', '🪜', '#4a7bd0', '6 min', 'Solo'),
  ] },
  { id: 'together', title: 'Play together', sub: 'One phone, a family, a classroom, a crowd.', games: [
    G('/play/trivia', 'Trivia Chrism', 'Spin the wheel, win six crowns. Play a friend, the Bot, or alone.', '👑', '#8a5ac2', '10 min', '1 to 4', { isNew: true }),
    G('/play/online', 'Play online with a code', 'Open a room, share six digits, and friends join from their own phones. No account.', '🌐', '#2f8f6b', '15 min', '2 to 50', { isNew: true }),
    G('/play/quiznight', 'Quiz night', 'Pass the phone around the family, or host a room.', '🎉', '#e8812b', '15 min', '2 or more'),
    G('/play/leaderboard', 'Weekly leaderboard', 'A Monday to Sunday board for your group, by code. Opt in, nickname only.', '🏅', '#b58a1f', '1 min', 'A group'),
    G('/play/coop', 'Creedle together', 'Solve today’s word with family or friends, one shared board.', '🤝', '#2f8a5b', '5 min', '2 or more'),
    G('/play/charades', 'Whom Do You Say?', 'Phone on your forehead: guess saints, stories and more.', '🎭', '#c0507a', '5 min', '2 or more'),
  ] },
];
const ALL = GROUPS.flatMap((g) => g.games);
/** The games we are proudest of: two big banners, then two more tiles. */
const BANNERS = ['/play/deepwaters', '/play/trivia'];
const FEATURED_TILES = ['/play/cloister', '/play/verbum'];
/** a game shown in the featured block is not listed again in its group, so no game appears twice */
const SHOWN_ABOVE_THE_GROUPS = [...BANNERS, ...FEATURED_TILES];

/** A lively front door for the games: a "play this next" banner, a Surprise me button, and colorful tiles grouped by mood. */
export default function PlayHome() {
  const nav = useNavigate();
  const dailies = ALL.filter((g) => g.daily);
  const todo = dailies.filter((g) => !dailyDone(g.daily!));
  const [cfg] = useSettings();
  const streak = currentStreak();
  const totals = playTotals();
  const plays = loadPlays();
  const heroPool = todo.filter((g) => !SHOWN_ABOVE_THE_GROUPS.includes(g.to));
  const featured = useMemo(() => (heroPool.length ? heroPool[Math.floor(seeded(dayIndex() + 3)() * heroPool.length)] : ALL.find((g) => g.to === '/play/crossword')!), [todo.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const surprise = () => { const pool = todo.length ? todo : ALL; nav(pool[Math.floor(Math.random() * pool.length)].to); };
  const lv = levelOf(totals.games, totals.days, streak);
  // reaching a new level since the last visit to this page is celebrated once (the first visit only records the level)
  const [levelUp, setLevelUp] = useState<number | null>(null);
  useEffect(() => {
    try {
      const key = 'sb:arcade:level';
      const seen = parseInt(localStorage.getItem(key) ?? '0', 10);
      localStorage.setItem(key, String(lv.level));
      if (seen > 0 && lv.level > seen) { setLevelUp(lv.level); burst(); blip('win'); window.setTimeout(() => setLevelUp(null), 3000); }
    } catch { /* private mode: no celebration */ }
  }, [lv.level]);
  const played = Object.keys(plays.games ?? {}).length;
  const TIPS = ['A fresh puzzle lands every day. Come back tomorrow!', 'Not sure? Tap Surprise me and let the dice decide.', 'Friends can join a quiz with just six digits.', 'Three right answers in a category wins a crown.', 'Every game here works without an account.', cfg.hideStreaks ? 'Your finished games are kept right here on your device.' : 'Streaks are kept right here on your device.'];
  const [tip, setTip] = useState(0);
  useEffect(() => { if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return; const t = window.setInterval(() => setTip((x) => (x + 1) % TIPS.length), 6000); return () => window.clearInterval(t); }, [TIPS.length]);
  const letters = 'GAMES'.split('');
  const hues = ['#e8812b', '#4a7bd0', '#c0507a', '#2f8f6b', '#d4a017'];
  return (
    <div className="page play-home play-fun gp">
      <div className="gp-doodles" aria-hidden="true">{['✨', '🎲', '🕊️', '⭐', '🔔', '🧩', '👑', '📿'].map((d, i) => <span key={i} style={{ ['--x' as string]: `${(i * 13 + 6) % 92}%`, ['--d' as string]: `${i * 1.7}s`, ['--s' as string]: `${1.1 + (i % 3) * 0.5}rem` }}>{d}</span>)}</div>
      <header className="pf-top gp-top">
        <h1 className="gp-title" aria-label="Games">{letters.map((l, i) => <span key={i} aria-hidden="true" style={{ ['--h' as string]: hues[i], ['--i' as string]: i }}>{l}</span>)}</h1>
        <Link className="streak-chip gp-streak" to="/play/trophies">{cfg.hideStreaks ? <><Art n="sports-medal" size={22} /> {totals.games} game{totals.games === 1 ? '' : 's'} finished · trophies</> : <><Anim c="1f525" size={24} /> {streak} day streak · trophies</>}</Link>
      </header>
      {levelUp !== null && <div className="arc-win arc-levelup" role="status"><Anim c="2728" size={96} /><strong>Level {levelUp}!</strong></div>}
      <section className="gp-hud" aria-label="Your level">
        <span className="gp-lv" aria-hidden="true"><Art n="star" size={56} className="gp-lv-star" /><b>{lv.level}</b></span>
        <div className="gp-lv-main">
          <strong>Level {lv.level}</strong>
          <div className="gp-xp" role="progressbar" aria-label={`Level ${lv.level}, ${lv.into} of ${lv.need} to the next`} aria-valuemin={0} aria-valuemax={lv.need} aria-valuenow={lv.into}><i style={{ width: `${Math.round((lv.into / lv.need) * 100)}%` }} /></div>
          <small>{lv.into} / {lv.need} XP to level {lv.level + 1}</small>
        </div>
        <div className="gp-stars" aria-label={`${dailies.length - todo.length} of ${dailies.length} daily puzzles done today`}><b>{dailies.length - todo.length}<small>/{dailies.length}</small></b><span>⭐ today</span></div>
      </section>
      <div className="gp-mascot" role="note"><span className="gp-bot" aria-hidden="true"><Anim c="1f60e" size={54} /></span><p key={tip}>{TIPS[tip]}</p></div>
      <section className="gp-featured" aria-labelledby="pf-featured">
        <h2 id="pf-featured" className="gp-banner"><span>Featured</span></h2>
        <Link to="/play/deepwaters" className="gp-dive gp-basilion">
          <span className="gp-dive-bubbles" aria-hidden="true"><i /><i /><i /><i /><i /></span>
          <Art n="church" size={110} className="gp-dive-whale" />
          <span className="gp-dive-text">
            <small>{dailyDone('deepwaters') ? 'Climb complete' : 'Daily climb'}</small>
            <strong>Basilion</strong>
            <em>{dailyDone('deepwaters') ? `Today: ${dailyDone('deepwaters')}. Practise or come back tomorrow.` : 'Seven questions. Climb higher than everyone else.'}</em>
          </span>
          <span className="gp-dive-go" aria-hidden="true">▶</span>
        </Link>
        <Link to="/play/trivia" className="gp-dive gp-crown">
          <span className="gp-dive-bubbles" aria-hidden="true"><i /><i /><i /><i /><i /></span>
          <Art n="crown" size={104} className="gp-dive-whale" />
          <span className="gp-dive-text">
            <small>Up to 4 players, or the Bot</small>
            <strong>Trivia Chrism</strong>
            <em>Spin the wheel, win six crowns, spend your coins on power-ups.</em>
          </span>
          <span className="gp-dive-go" aria-hidden="true">▶</span>
        </Link>
        <ul className="pf-grid gp-feat-tiles">
          {FEATURED_TILES.map((to, i) => { const g = ALL.find((x) => x.to === to)!; const r = g.daily ? dailyDone(g.daily) : null; return (
            <li key={g.to} style={{ ['--i' as string]: i }}>
              <Link className="pf-tile" to={g.to} style={{ ['--c' as string]: g.color }}>
                <span className="pf-ico gp-blob" aria-hidden="true">{GAME_ART[g.to] ? <Art n={GAME_ART[g.to]} size={76} /> : g.icon}</span>
                <span className="pf-badge gp-burst">★ Top pick</span>
                {r && <span className="pf-badge done gp-star">⭐ {r}</span>}
                <strong className="pf-title">{g.title}</strong>
                <span className="pf-blurb">{g.blurb}</span>
                <span className="pf-meta"><span>⏱ {g.time}</span><span>👤 {g.who}</span><span className="pf-play">Play ▶</span></span>
              </Link>
            </li>); })}
        </ul>
      </section>
      <section className="pf-hero gp-hero" style={{ ['--c' as string]: featured.color }} aria-label="Play this next">
        <i className="gp-bulbs" aria-hidden="true" />
        <span className="pf-hero-ico" aria-hidden="true">{GAME_ART[featured.to] ? <Art n={GAME_ART[featured.to]} size={120} /> : featured.icon}</span>
        <div className="pf-hero-text">
          <p className="pf-kicker">{todo.length ? `${todo.length} daily puzzle${todo.length === 1 ? '' : 's'} waiting` : 'All of today’s puzzles are done'}</p>
          <h2>{todo.length ? `Play ${featured.title}!` : `Try ${featured.title}!`}</h2>
          <p>{featured.blurb}</p>
          <p className="pf-hero-actions"><Link className="btn primary big" to={featured.to}>Let’s go →</Link> <button className="btn big gp-dice" onClick={surprise}><span aria-hidden="true">🎲</span> Surprise me</button></p>
        </div>
      </section>
      {GROUPS.map((grp) => ({ ...grp, games: grp.games.filter((g) => !SHOWN_ABOVE_THE_GROUPS.includes(g.to)) })).filter((grp) => grp.games.length).map((grp) => (
        <section key={grp.id} className="pf-group" aria-labelledby={`pf-${grp.id}`}>
          <h2 id={`pf-${grp.id}`} className="gp-banner"><span>{grp.title}</span></h2>
          <p className="muted small pf-sub">{grp.sub}</p>
          <ul className="pf-grid">
            {grp.games.map((g, i) => {
              const r = g.daily ? dailyDone(g.daily) : null;
              return (
                <li key={g.to} style={{ ['--i' as string]: i, ['--t' as string]: `${[-1.4, 1, -0.6, 1.5, -1, 0.7][i % 6]}deg` }}>
                  <Link className="pf-tile" to={g.to} style={{ ['--c' as string]: g.color }}>
                    <span className="pf-ico gp-blob" aria-hidden="true">{GAME_ART[g.to] ? <Art n={GAME_ART[g.to]} size={76} /> : g.icon}</span>
                    {g.isNew && <span className="pf-badge gp-burst">NEW!</span>}
                    {r && <span className="pf-badge done gp-star">⭐ {r}</span>}
                    <strong className="pf-title">{g.title}</strong>
                    <span className="pf-blurb">{g.blurb}</span>
                    <span className="pf-meta"><span>⏱ {g.time}</span><span>👤 {g.who}</span><span className="pf-play">Play ▶</span></span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <p className="muted small arc-credit">Art: Fluent Emoji 3D © Microsoft (MIT licence); animated emoji © Google, Noto Emoji Animation (CC BY 4.0). Fonts: Lilita One and Fredoka (SIL OFL).</p>
      <p className="muted small">{played ? `You have tried ${played} of ${ALL.length} games.` : `${ALL.length} games, no account needed.`}</p>
    </div>
  );
}
