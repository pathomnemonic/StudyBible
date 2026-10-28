import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCccScripture } from '../data/ccc';

/** At the end of a chapter: the Catechism paragraphs whose footnotes cite it, so the reading leads into what the Church teaches from it. */
export default function ChapterCatechism({ book, anchorChapters }: { book: string; anchorChapters: number[] }) {
  const [paras, setParas] = useState<{ n: number; quoted: boolean }[]>([]);
  const key = anchorChapters.join(',');
  useEffect(() => {
    let live = true;
    getCccScripture(book).then((cites) => {
      if (!live) return;
      const m = new Map<number, boolean>();
      for (const [c1, , c2, , para, q] of cites ?? []) if (anchorChapters.some((c) => c >= c1 && c <= c2)) m.set(para, (m.get(para) ?? false) || !!q);
      setParas([...m.entries()].sort((a, b) => Number(b[1]) - Number(a[1]) || a[0] - b[0]).slice(0, 8).map(([n, quoted]) => ({ n, quoted })));
    });
    return () => { live = false; };
  }, [book, key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!paras.length) return null;
  return (
    <section className="chapter-ccc" aria-label="The Catechism on this chapter">
      <h3 className="eyebrow-h">The Catechism on this chapter</h3>
      <div className="chips">{paras.map((p) => <Link key={p.n} className="chip" to={`/study/catechism/${p.n}`} title={p.quoted ? 'Quotes this chapter' : 'Cites this chapter'}>§{p.n}</Link>)}</div>
    </section>
  );
}
