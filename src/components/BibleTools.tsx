import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Fold from './Fold';
import Modal from './Modal';
import { BIBLE_TOOLS } from '../lib/bibleTools';
import type { Book } from '../lib/canon';

const PAUL = new Set(['ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM']);

/** Everything that helps understand what is being read, in one sheet: first what is about this book, then words and topics. */
export default function BibleTools({ book, chapter, onClose }: { book: Book; chapter: number; onClose: () => void }) {
  const nav = useNavigate();
  const [word, setWord] = useState('');
  const here: [string, string, string][] = [
    [`/study/books/${book.id}`, `About ${book.name}`, 'Who wrote it, when, and an outline of the whole book.'],
    ...(book.group === 'Gospels' ? ([['/study/synopsis', 'Compare the Gospels', 'See this story in Matthew, Mark, Luke and John side by side.']] as [string, string, string][]) : []),
    ...(PAUL.has(book.id) ? ([[`/study/pauline?l=${book.id}`, `The argument of ${book.name}`, 'Paul’s letter in outline.']] as [string, string, string][]) : []),
    [`/study/passage/${book.id}.${chapter}`, `Study ${book.name} ${chapter}`, 'Everything on this chapter in one place: Fathers, notes, art and more.'],
  ];
  const go = (to: string) => { onClose(); nav(to); };
  return (
    <Modal title="Bible tools" onClose={onClose}>
      <div className="bible-tools">
        <form role="search" onSubmit={(e) => { e.preventDefault(); if (word.trim()) go(`/study/concordance?w=${encodeURIComponent(word.trim())}`); }} className="row" style={{ gap: 6 }}>
          <input type="search" value={word} onChange={(e) => setWord(e.target.value)} placeholder="Look up a word in the whole Bible" aria-label="Look up a word in the whole Bible" style={{ flex: 1 }} />
          <button className="btn primary small">Look up</button>
        </form>
        <h3 className="eyebrow-h">This book</h3>
        <ul className="bt-list">{here.map(([to, t, d]) => <li key={to}><button onClick={() => go(to)}><strong>{t}</strong><span>{d}</span></button></li>)}</ul>
        <Fold id="bt:text" title="Understand the text"><ul className="bt-list">{BIBLE_TOOLS.filter((t) => t.group === 'text').map((t) => <li key={t.to}><button onClick={() => go(t.to)}><strong>{t.label}</strong><span>{t.blurb}</span></button></li>)}</ul></Fold>
        <Fold id="bt:words" title="Words and topics"><ul className="bt-list">{BIBLE_TOOLS.filter((t) => t.group === 'words').map((t) => <li key={t.to}><button onClick={() => go(t.to)}><strong>{t.label}</strong><span>{t.blurb}</span></button></li>)}</ul></Fold>
        <p className="muted small">More study material, such as story trails, study paths and the Scripture universe, is under <Link to="/study" onClick={onClose}>Study</Link>.</p>
      </div>
    </Modal>
  );
}
