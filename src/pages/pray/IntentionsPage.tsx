import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tip } from '../../components/Hints';

interface Intention { id: string; text: string; for?: string; added: string; prayed: number; last?: string; answered?: string }
const KEY = 'sb:intentions';
const load = (): Intention[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; } };
const save = (l: Intention[]) => { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch { /* private mode */ } };
const today = () => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; };

/** A private list of the people and needs you are praying for, with a one-tap "I prayed" and a place for answered prayers. */
export default function IntentionsPage() {
  const [list, setList] = useState<Intention[]>(load);
  const [text, setText] = useState('');
  const [who, setWho] = useState('');
  const [showDone, setShowDone] = useState(false);
  const put = (l: Intention[]) => { setList(l); save(l); };
  const add = () => { if (!text.trim()) return; put([{ id: String(Date.now()), text: text.trim(), for: who.trim() || undefined, added: today(), prayed: 0 }, ...list]); setText(''); setWho(''); };
  const pray = (id: string) => put(list.map((x) => (x.id === id ? { ...x, prayed: x.prayed + (x.last === today() ? 0 : 1), last: today() } : x)));
  const open = list.filter((x) => !x.answered);
  const done = list.filter((x) => x.answered);
  const prayedToday = open.filter((x) => x.last === today()).length;
  return (
    <div className="page">
      <h1>Prayer list</h1>
      <Tip id="intentions" title="Pray for people by name">Add a person or a need. Tap “I prayed” each day you remember it. When God answers, mark it answered and keep the story.</Tip>
      <p className="lede">The people and needs you carry. Private to this device.</p>
      <form className="card" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <label className="stack"><span>Who or what?</span><input value={who} onChange={(e) => setWho(e.target.value)} placeholder="Mom, my parish, a friend’s surgery…" aria-label="Who or what" /></label>
        <label className="stack"><span>The intention</span><textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Healing, a decision, a conversion, thanks…" aria-label="The intention" /></label>
        <button className="btn primary" type="submit" disabled={!text.trim()}>Add to my list</button>
      </form>
      {open.length > 0 && <p className="muted small">{prayedToday} of {open.length} prayed for today</p>}
      <ul className="int-list">
        {open.map((x) => (
          <li key={x.id} className="card">
            <div><strong>{x.for ?? 'Intention'}</strong><p style={{ margin: '2px 0' }}>{x.text}</p><span className="muted small">Added {x.added} · prayed {x.prayed} {x.prayed === 1 ? 'day' : 'days'}</span></div>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <button className="btn small primary" disabled={x.last === today()} onClick={() => pray(x.id)}>{x.last === today() ? 'Prayed today ✓' : 'I prayed'}</button>
              <button className="btn small" onClick={() => put(list.map((y) => (y.id === x.id ? { ...y, answered: today() } : y)))}>Answered</button>
              <button className="btn small" onClick={() => { if (confirm('Remove this intention?')) put(list.filter((y) => y.id !== x.id)); }}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
      {!open.length && <p className="muted">Nothing here yet. Add the first person you want to pray for.</p>}
      {done.length > 0 && <>
        <button className="btn small" onClick={() => setShowDone(!showDone)} aria-expanded={showDone}>{showDone ? 'Hide' : 'Show'} answered prayers ({done.length})</button>
        {showDone && <ul className="int-list">{done.map((x) => <li key={x.id} className="card"><strong>{x.for ?? 'Intention'}</strong> · answered {x.answered}<p style={{ margin: '2px 0' }}>{x.text}</p><button className="btn small" onClick={() => put(list.map((y) => (y.id === x.id ? { ...y, answered: undefined } : y)))}>Reopen</button></li>)}</ul>}
      </>}
    </div>
  );
}
