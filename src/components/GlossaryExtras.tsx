import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cccPara } from '../data/ccc';
import { citedScripture } from '../lib/citedScripture';
import { formatRef } from '../lib/refs';
import { convertRef } from '../lib/versification';
import { readerPath } from '../lib/nav';
import { useEditions } from '../data/EditionsContext';
import { useSettings } from '../lib/store';

/** The Scripture passages cited in the footnotes of the Catechism paragraph an entry points to, loaded only when opened. They are the Church's own citations, not ours. */
export default function GlossaryExtras({ para }: { para: number }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<{ label: string; to: string }[]>([]);
  const [done, setDone] = useState(false);
  const { get, editions } = useEditions();
  const [s] = useSettings();
  const ed = get(s.defaultEdition) ?? editions[0];
  const load = async () => {
    const p = await cccPara(para).catch(() => null);
    const out = citedScripture((p?.fn ?? []).map((f) => f.t), 6).map((ref) => ({ label: formatRef(ref), to: ed ? readerPath(ed, convertRef('kjv', 'vulgate', ref).ref) : '' })).filter((x) => x.to);
    setList(out);
    setDone(true);
  };
  return (
    <details className="gl-extra small" onToggle={(e) => { const o = (e.currentTarget as HTMLDetailsElement).open; setOpen(o); if (o && !done) void load(); }}>
      <summary>Scripture the Catechism cites here</summary>
      {open && !done && <span className="muted"> Looking…</span>}
      {done && (list.length ? <p className="chips">{list.map((r) => <Link key={r.label} className="chip" to={r.to}>{r.label}</Link>)}</p> : <p className="muted">The footnotes of this paragraph cite no Scripture passage the app could match.</p>)}
    </details>
  );
}
