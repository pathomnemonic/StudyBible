import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadChains } from '../chains/load';
import { MODES, type Chain, type ChainMode } from '../chains/types';
import { GLOSSARY } from '../data/glossary';

const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const MODE_ORDER: ChainMode[] = ['claims', 'arguments', 'development', 'words', 'heresies'];

/** Items for a lesson's "Go deeper" list: the source chains, claim checks and zoom pages that cite the same Catechism paragraphs. */
export default function RelatedSources({ ccc }: { ccc: number[] }) {
  const [rel, setRel] = useState<(Chain & { mode: ChainMode })[]>([]);
  const key = ccc.join(',');
  useEffect(() => {
    let live = true; setRel([]);
    Promise.all(MODE_ORDER.map((m) => loadChains(m).then((cs) => cs.map((c) => ({ ...c, mode: m }))))).then((all) => {
      if (!live) return;
      const near = (n: number) => ccc.some((x) => Math.abs(x - n) <= 2);
      const hits = all.flat().filter((c) => [...c.steps, ...(c.objections ?? []).flatMap((o) => o.steps ?? [])].some((s) => s.ccc && near(s.ccc)) || (c.readNext ?? []).some(near));
      setRel(hits.slice(0, 4));
    });
    return () => { live = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const terms = GLOSSARY.filter((g) => ccc.some((x) => Math.abs(x - g.ccc) <= 3)).slice(0, 3);
  return (
    <>
      {rel.map((c) => <li key={c.mode + c.id}><Link to={`${MODES[c.mode].path}/${c.id}`}>{MODES[c.mode].title}: {c.title}</Link></li>)}
      {terms.map((g) => <li key={g.term}><Link to={`/study/zoom/${slug(g.term)}`}>{g.term}, at different distances</Link></li>)}
    </>
  );
}
