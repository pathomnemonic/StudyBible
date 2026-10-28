import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { updateSettings } from '../lib/store';

const TILES: { to: string; title: string; icon: string; tone: string }[] = [
  { to: '/study/kids', title: 'Bible stories', icon: '📖', tone: 'k1' },
  { to: '/pray/prayers?tag=basic', title: 'Prayers', icon: '🙏', tone: 'k2' },
  { to: '/pray/devotions/rosary', title: 'The Rosary', icon: '📿', tone: 'k3' },
  { to: '/play/charades', title: 'Charades', icon: '🎭', tone: 'k4' },
  { to: '/play/quartets', title: 'Quartets', icon: '🔶', tone: 'k5' },
  { to: '/pray/sleep', title: 'Bedtime psalm', icon: '🌙', tone: 'k6' },
];

/** A child's front page: big pictures, a few safe places, and a grown-up question to leave. */
export default function KidsHome() {
  const [gate, setGate] = useState(false);
  return (
    <div className="page kids-home">
      <h1>Hello!</h1>
      <div className="kid-grid">
        {TILES.map((t) => <Link key={t.to} to={t.to} className={`kid-tile ${t.tone}`}><span aria-hidden="true">{t.icon}</span><strong>{t.title}</strong></Link>)}
      </div>
      <p><button className="btn small ghost" onClick={() => setGate(true)}>For grown-ups</button></p>
      {gate && <Gate onClose={() => setGate(false)} />}
    </div>
  );
}

function Gate({ onClose }: { onClose: () => void }) {
  const nav = useNavigate();
  const [a] = useState(() => 6 + Math.floor(Math.random() * 5)), [b] = useState(() => 6 + Math.floor(Math.random() * 5));
  const [v, setV] = useState('');
  const [bad, setBad] = useState(false);
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (+v === a * b) { updateSettings({ kidMode: false }); onClose(); nav('/today'); } else { setBad(true); setV(''); } };
  return (
    <Modal title="For grown-ups" onClose={onClose}>
      <p>To leave kid mode, answer this: what is {a} × {b}?</p>
      <form className="rowform" onSubmit={submit}>
        <input type="number" inputMode="numeric" value={v} onChange={(e) => setV(e.target.value)} aria-label={`${a} times ${b}`} autoFocus />
        <button className="btn primary" type="submit">Leave kid mode</button>
      </form>
      {bad && <p role="alert" className="muted">Not quite. Try again.</p>}
    </Modal>
  );
}

/** Where a grown-up turns kid mode on. */
export function KidModeStart() {
  const nav = useNavigate();
  return (
    <div className="page">
      <h1>Kid mode</h1>
      <p>A simple version of the app for a child: Bible stories, basic prayers, the Rosary, a bedtime psalm and a few games. Everything else is hidden until a grown-up answers a multiplication question.</p>
      <button className="btn primary big" onClick={() => { updateSettings({ kidMode: true }); nav('/kids'); }}>Start kid mode</button>
    </div>
  );
}
