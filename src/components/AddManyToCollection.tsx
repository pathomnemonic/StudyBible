import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { sameValue } from '../lib/canonical';
import { db, type Target } from '../db/db';
import Modal from './Modal';
import { useToast } from './Toast';

/** "Save these to a collection": adds every item of a result set, skipping any already there. */
export default function AddManyToCollection({ targets, label = 'Save all to a collection' }: { targets: Target[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const cs = useLiveQuery(() => db.collections.orderBy('updatedAt').reverse().toArray(), []) ?? [];
  const toast = useToast();
  const put = async (id: number) => {
    const c = await db.collections.get(id);
    if (!c) return;
    const fresh = targets.filter((t) => !c.items.some((x) => sameValue(x, t)));
    if (fresh.length) await db.collections.put({ ...c, items: [...c.items, ...fresh], updatedAt: Date.now() });
    toast(fresh.length ? `Added ${fresh.length} to “${c.name}”.` : `All already in “${c.name}”.`);
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
      <button className="btn small" disabled={!targets.length} onClick={() => setOpen(true)} aria-haspopup="dialog">{label}</button>
      {open && (
        <Modal title={`Save ${targets.length} results to a collection`} onClose={() => setOpen(false)}>
          {cs.length > 0 && <ul className="list" style={{ marginBottom: 10 }}>{cs.map((c) => <li key={c.id}><button className="btn" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => void put(c.id!)}>{c.name} <span className="muted small">{c.items.length} items</span></button></li>)}</ul>}
          <label className="field"><span>{cs.length ? 'Or start a new collection' : 'Name your first collection'}</span>
            <span className="row" style={{ gap: 6 }}><input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void create()} /><button className="btn primary" onClick={() => void create()}>Create and add</button></span>
          </label>
        </Modal>
      )}
    </>
  );
}
