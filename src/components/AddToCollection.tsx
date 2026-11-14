import { sameValue } from '../lib/canonical';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Target } from '../db/db';
import Modal from './Modal';
import { useToast } from './Toast';

/** "Add to collection": choose one of your collections, or start a new one, and the item joins it by reference. */
export default function AddToCollection({ target, label = '＋ Collection', small = true }: { target: Target | (() => Target | null); label?: string; small?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const cs = useLiveQuery(() => db.collections.orderBy('updatedAt').reverse().toArray(), []) ?? [];
  const toast = useToast();
  const resolve = () => (typeof target === 'function' ? target() : target);
  const put = async (id: number) => {
    const t = resolve();
    const c = await db.collections.get(id);
    if (!t || !c) return;
    if (c.items.some((x) => sameValue(x, t))) { toast(`Already in “${c.name}”.`); setOpen(false); return; }
    await db.collections.put({ ...c, items: [...c.items, t], updatedAt: Date.now() });
    toast(`Added to “${c.name}”.`);
    setOpen(false);
  };
  const create = async () => {
    const n = name.trim();
    if (!n) return;
    const id = (await db.collections.add({ name: n, items: [], createdAt: Date.now(), updatedAt: Date.now() } as never)) as number;
    setName('');
    await put(id);
  };
  return (
    <>
      <button className={`btn${small ? ' small' : ''} ghost`} onClick={() => setOpen(true)} aria-haspopup="dialog">{label}</button>
      {open && (
        <Modal title="Add to a collection" onClose={() => setOpen(false)}>
          {cs.length > 0 && (
            <ul className="list" style={{ marginBottom: 10 }}>
              {cs.map((c) => <li key={c.id}><button className="btn" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => void put(c.id!)}>{c.name} <span className="muted small">{c.items.length} {c.items.length === 1 ? 'item' : 'items'}</span></button></li>)}
            </ul>
          )}
          <label className="field"><span>{cs.length ? 'Or start a new collection' : 'Name your first collection'}</span>
            <span className="row" style={{ gap: 6 }}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Eucharist, Questions on Romans…" onKeyDown={(e) => e.key === 'Enter' && void create()} /><button className="btn primary" onClick={() => void create()}>Create and add</button></span>
          </label>
          <p className="muted small"><Link to="/library?tab=collections" onClick={() => setOpen(false)}>Manage collections</Link></p>
        </Modal>
      )}
    </>
  );
}
