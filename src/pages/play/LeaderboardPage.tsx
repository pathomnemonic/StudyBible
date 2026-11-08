import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DAILY_IDS, dailyDone, dayIndex } from '../../lib/dailyGame';
import { cleanGroup, cleanName, colourFor, groupProblem, nameProblem } from '../../lib/coop/names';
import { addPosts, standings, weekOf, weekStart, type Post } from '../../lib/coop/board';
import { openGroup, type GroupBoard } from '../../lib/coop/group';

interface Saved { group: string; nick: string; post: boolean }
const SAVE = 'sb:lb:v1';
const load = (): Saved | null => { try { const s = JSON.parse(localStorage.getItem(SAVE) ?? 'null') as Saved | null; return s && s.group && s.nick ? s : null; } catch { return null; } };
const store = (s: Saved | null) => { try { if (s) localStorage.setItem(SAVE, JSON.stringify(s)); else localStorage.removeItem(SAVE); } catch { /* private mode */ } };
const LOCAL = (g: string, n: string, w: number) => `sb:lb:posted:${g}:${n.toLowerCase()}:${w}`;
const readLocal = (g: string, n: string, w: number): Post[] => { try { return JSON.parse(localStorage.getItem(LOCAL(g, n, w)) ?? '[]') as Post[]; } catch { return []; } };
const writeLocal = (g: string, n: string, w: number, p: Post[]) => { try { localStorage.setItem(LOCAL(g, n, w), JSON.stringify(p)); } catch { /* private mode */ } };
const NAMES: Record<string, string> = { verbum: 'Verbum', quartets: 'Quartets', saintguess: 'Saint guess', whoami: 'Who am I', artdetective: 'Art detective', whosaid: 'Who said it', whichbook: 'Which book', chain: 'Chain', pilgrim: 'Pilgrim' };
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Today's finished daily puzzles, from this device's own record. */
function todays(): Post[] {
  const d = dayIndex();
  return DAILY_IDS.flatMap((g) => { const r = dailyDone(g); return r ? [{ d, g, r }] : []; });
}

export default function LeaderboardPage() {
  const [saved, setSaved] = useState<Saved | null>(load);
  const [group, setGroup] = useState('');
  const [nick, setNick] = useState('');
  const [err, setErr] = useState('');
  const join = () => {
    const e = groupProblem(group) ?? nameProblem(nick);
    if (e) { setErr(e); return; }
    const s = { group: cleanGroup(group), nick: cleanName(nick), post: false };
    store(s); setSaved(s); setErr('');
  };
  return (
    <div className="page lb">
      <h1>Weekly leaderboard</h1>
      <p className="muted">A friendly board for a parish, class or family. Pick a group code and a nickname. Each week, Monday to Sunday, the board adds up the daily puzzles that people in the group choose to post.</p>
      {saved ? <Board saved={saved} update={(s) => { store(s); setSaved(s); }} leave={() => { store(null); setSaved(null); }} /> : (
        <div className="card cp-card">
          <label className="field">Group code (4 to 12 letters or digits)
            <input value={group} maxLength={12} autoCapitalize="characters" onChange={(e) => setGroup(cleanGroup(e.target.value))} placeholder="For example, STMARYS" />
          </label>
          <label className="field">Your nickname
            <input value={nick} maxLength={20} autoComplete="nickname" onChange={(e) => setNick(e.target.value)} placeholder="Up to 20 characters" />
          </label>
          <button className="btn primary big" onClick={join}>Open the board</button>
          {err && <p className="cp-err" role="alert">{err}</p>}
          <p className="muted small">Everyone who uses the same group code sees the same board. Joining posts nothing; you choose whether to post your results once you are in.</p>
        </div>
      )}
      <section className="card cp-card" aria-label="Privacy">
        <h2 className="eyebrow-h">Privacy, plainly</h2>
        <ul className="small">
          <li>No account. Only a nickname and the results you choose to post: which game, how you did, and which day.</li>
          <li>Posting is off until you turn it on. Nothing else about you or your device is sent.</li>
          <li>Results travel through public message relays, sealed with a key made from the group code. The relays hold the sealed posts for the week and cannot read them.</li>
          <li>Anyone who knows or guesses the group code can read the board, and could post under any nickname. Pick a code that is not easy to guess, and share it only with your group.</li>
          <li>“Leave group” stops posting and clears the post held for your nickname on the relay.</li>
        </ul>
      </section>
      <p><Link className="btn ghost" to="/play">All games</Link></p>
    </div>
  );
}

function Board({ saved, update, leave }: { saved: Saved; update: (s: Saved) => void; leave: () => void }) {
  const today = useMemo(dayIndex, []);
  const week = weekOf(today);
  const [gb, setGb] = useState<GroupBoard | null>(null);
  const [, bump] = useState(0);
  const [note, setNote] = useState('');
  const gbRef = useRef<GroupBoard | null>(null);
  const todo = todays();

  useEffect(() => {
    let off = () => undefined as void, gone = false;
    openGroup(saved.group, week).then((g) => { if (gone) { g.close(); return; } gbRef.current = g; setGb(g); off = g.subscribe(() => bump((n) => n + 1)); }, () => setNote('Could not reach a relay. Check your connection.'));
    return () => { gone = true; off(); gbRef.current?.close(); gbRef.current = null; };
  }, [saved.group, week]);

  const postNow = async (g: GroupBoard) => {
    const have = addPosts(readLocal(saved.group, saved.nick, week), g.mine(saved.nick), week);
    const next = addPosts(have, todays(), week);
    const sent = await g.post(saved.nick, next);
    writeLocal(saved.group, saved.nick, week, sent);
  };
  // when posting is on, share today's finished puzzles once the week's earlier posts have had a moment to arrive
  const results = JSON.stringify(todo);
  useEffect(() => {
    if (!gb || !saved.post || !todo.length) return;
    const t = setTimeout(() => { void postNow(gb); }, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gb, saved.post, saved.nick, results]);

  const rows = standings(gb?.members() ?? [], week);
  const monday = weekStart(week);
  const days = Array.from({ length: 7 }, (_, i) => monday + i);
  const mon = new Date(monday * 864e5).toLocaleDateString(undefined, { day: 'numeric', month: 'long', timeZone: 'UTC' });
  const leaveNow = async () => {
    if (gbRef.current) await gbRef.current.clear(saved.nick);
    writeLocal(saved.group, saved.nick, week, []);
    setTimeout(leave, 300);
  };
  return (
    <div>
      <div className="cp-top">
        <div>Group <b className="cp-code">{saved.group}</b> · you are <b style={{ color: colourFor(saved.nick) }}>{saved.nick}</b></div>
        <button className="btn ghost small" onClick={() => { if (confirm(`Leave the group ${saved.group}? Your posted results are cleared from the relay.`)) void leaveNow(); }}>Leave group</button>
      </div>
      <label className="cp-toggle">
        <input type="checkbox" checked={saved.post} onChange={(e) => update({ ...saved, post: e.target.checked })} />
        <span>Post my daily results to this group</span>
      </label>
      <p className="muted small">{saved.post
        ? (todo.length ? `Today you have finished ${todo.map((t) => NAMES[t.g] ?? t.g).join(', ')}. ${todo.length === 1 ? 'It is' : 'They are'} posted (once per game per day).` : 'Finish a daily puzzle and it is posted for you. One post per game per day.')
        : 'Off. Nothing is posted until you turn this on.'}</p>
      {saved.post && gb && <button className="btn small" onClick={() => void postNow(gb)} disabled={!todo.length}>Post now</button>}
      <h2 className="eyebrow-h" style={{ marginTop: 14 }}>Week of Monday {mon}</h2>
      {rows.length === 0 ? <p className="muted">No results posted yet this week. {gb ? '' : 'Connecting…'}</p> : (
        <table className="cp-table">
          <thead><tr><th>#</th><th>Name</th>{days.map((d, i) => <th key={d} className={d === today ? 'now' : ''} scope="col">{DAY_LETTERS[i]}</th>)}<th>Pts</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.n} className={r.n.toLowerCase() === saved.nick.toLowerCase() ? 'me' : ''}>
                <td>{i + 1}</td>
                <th scope="row" className="cp-nm" style={{ color: colourFor(r.n) }}>{r.n}</th>
                {days.map((d) => <td key={d} className={d === today ? 'now' : ''}>{r.perDay[d] ?? '·'}</td>)}
                <td><b>{r.points}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted small">Points: Verbum scores by guesses (six for a first try, one for six), other dailies three each for finishing, one for a miss. The week follows your own time zone.</p>
      {note && <p className="cp-err" role="alert">{note}</p>}
    </div>
  );
}
