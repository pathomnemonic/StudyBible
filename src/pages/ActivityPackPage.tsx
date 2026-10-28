import { Link, useParams } from 'react-router-dom';
import { CROSSWORDS, type Crossword } from '../data/crosswords';
import { WS_THEMES } from '../data/wordsearch';
import { makeGrid } from './play/WordsearchPage';
import { layout } from './play/CrosswordPage';
import { makeMaze, mazeLines } from '../lib/maze';
import PrintButton from '../components/PrintButton';

interface Pack { id: string; title: string; theme: string; crossword: number; verse: string; verseRef: string; colorTitle: string; art: 'wreath' | 'star' | 'cross' | 'candle' | 'dove'; draw: string; prayer: string }
const PACKS: Pack[] = [
  { id: 'advent', title: 'Advent', theme: 'christmas', crossword: 3, verse: 'Be watchful, be alert, for you do not know when the time will come.', verseRef: 'Mark 13:33', colorTitle: 'The Advent wreath', art: 'wreath', draw: 'Draw what you are waiting for this Advent.', prayer: 'Come, Lord Jesus.' },
  { id: 'christmas', title: 'Christmas', theme: 'christmas', crossword: 10, verse: 'Glory to God in the highest, and on earth peace among those whom he favors!', verseRef: 'Luke 2:14', colorTitle: 'The star of Bethlehem', art: 'star', draw: 'Draw the scene at the manger.', prayer: 'Thank you, Jesus, for coming to us.' },
  { id: 'lent', title: 'Lent', theme: 'lent', crossword: 20, verse: 'Return to me with all your heart.', verseRef: 'Joel 2:12', colorTitle: 'The cross of Lent', art: 'cross', draw: 'Draw one kind thing you will do for someone this Lent.', prayer: 'Lord, help me to pray, fast and give.' },
  { id: 'easter', title: 'Easter', theme: 'lent', crossword: 30, verse: 'He is not here; he has risen!', verseRef: 'Luke 24:6', colorTitle: 'The Easter candle', art: 'candle', draw: 'Draw the empty tomb on Easter morning.', prayer: 'Alleluia! Christ is risen.' },
  { id: 'saints', title: 'The Saints', theme: 'saints', crossword: 40, verse: 'Let your light shine before others.', verseRef: 'Matthew 5:16', colorTitle: 'A saint’s halo and dove', art: 'dove', draw: 'Draw your favorite saint.', prayer: 'Holy saints of God, pray for us.' },
];

const Art = ({ kind }: { kind: Pack['art'] }) => {
  const s = { fill: 'none', stroke: '#000', strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  return (
    <svg viewBox="0 0 300 300" width="100%" style={{ maxWidth: 420, display: 'block', margin: '0 auto' }} role="img" aria-label="An outline to color in">
      {kind === 'wreath' && (<g {...s}><ellipse cx="150" cy="200" rx="110" ry="48" /><ellipse cx="150" cy="200" rx="78" ry="28" />{[70, 120, 180, 230].map((x, i) => (<g key={x}><rect x={x - 12} y={110 - (i === 1 || i === 2 ? 14 : 0)} width="24" height="78" rx="4" /><path d={`M${x} ${76 - (i === 1 || i === 2 ? 14 : 0)} q16 20 0 32 q-16 -12 0 -32z`} /></g>))}{[[60, 188], [110, 232], [190, 232], [240, 188], [150, 150]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="9" />)}</g>)}
      {kind === 'star' && (<g {...s}><path d="M150 20 l30 85 90 4 -72 56 26 88 -74 -50 -74 50 26 -88 -72 -56 90 -4z" /><path d="M150 70 l14 38 40 2 -32 25 11 39 -33 -22 -33 22 11 -39 -32 -25 40 -2z" /><path d="M20 270 q130 -30 260 0" /></g>)}
      {kind === 'cross' && (<g {...s}><rect x="125" y="30" width="50" height="240" rx="6" /><rect x="60" y="85" width="180" height="50" rx="6" /><path d="M70 270 q80 -30 160 0" /><path d="M110 60 q40 -30 80 0 q-40 -10 -80 0z" /></g>)}
      {kind === 'candle' && (<g {...s}><rect x="105" y="120" width="90" height="150" rx="8" /><path d="M150 30 q45 55 0 90 q-45 -35 0 -90z" /><path d="M150 60 q18 28 0 46 q-18 -18 0 -46z" /><path d="M150 160 v60 M125 188 h50" /><path d="M120 270 h60" /></g>)}
      {kind === 'dove' && (<g {...s}><circle cx="150" cy="70" r="52" /><circle cx="150" cy="70" r="40" strokeDasharray="4 8" /><path d="M80 210 q40 -70 110 -40 q30 -40 70 -20 q-30 30 -40 50 q10 40 -60 50 q-40 0 -80 -40z" /><circle cx="205" cy="172" r="4" fill="#000" /></g>)}
    </svg>
  );
};

const CrosswordSheet = ({ p, answers }: { p: Crossword; answers: boolean }) => {
  const L = layout(p);
  const across = p.words.filter((w) => w.d === 'a').sort((a, b) => L.num(a) - L.num(b));
  const down = p.words.filter((w) => w.d === 'd').sort((a, b) => L.num(a) - L.num(b));
  return (
    <>
      <div className="pk-cw" style={{ gridTemplateColumns: `repeat(${p.cols}, 1fr)`, maxWidth: p.cols * 34 }}>
        {Array.from({ length: p.rows * p.cols }, (_, i) => { const k = `${Math.floor(i / p.cols)},${i % p.cols}`; return L.cells.has(k) ? <span key={k} className="pk-cell">{L.start.has(k) && <i>{L.start.get(k)}</i>}{answers ? L.cells.get(k) : ''}</span> : <span key={k} className="pk-block" />; })}
      </div>
      {!answers && <div className="pk-clues"><div><b>Across</b>{across.map((w) => <p key={`${w.r}${w.c}a`}>{L.num(w)}. {w.clue} ({w.w.length})</p>)}</div><div><b>Down</b>{down.map((w) => <p key={`${w.r}${w.c}d`}>{L.num(w)}. {w.clue} ({w.w.length})</p>)}</div></div>}
    </>
  );
};

/** A set of printable pages for a season: a picture to color, a wordsearch, a crossword, a maze, a verse to learn and a page to draw on. Print it or save it as a PDF. */
export default function ActivityPackPage() {
  const { season } = useParams();
  const pack = PACKS.find((x) => x.id === season);
  if (!pack) {
    return (
      <div className="page">
        <h1>Printable activity packs</h1>
        <p className="lede">A few pages for each season: color, wordsearch, crossword, maze and a verse to learn. Print them for home, class or parish.</p>
        <ul className="list">{PACKS.map((x) => <li key={x.id}><Link to={`/print/pack/${x.id}`}><strong>{x.title}</strong></Link></li>)}</ul>
      </div>
    );
  }
  const theme = WS_THEMES.find((t) => t.id === pack.theme)!;
  const { grid, placed } = makeGrid(theme.words, 11, 7 + pack.title.length);
  const cw = CROSSWORDS[pack.crossword % CROSSWORDS.length];
  const maze = makeMaze(14, 14, 11 + pack.title.length);
  const lines = mazeLines(maze);
  return (
    <div className="page pack">
      <div className="row between no-print"><h1>{pack.title} activity pack</h1><PrintButton label="Print the pack" className="btn small primary" /></div>
      <p className="muted small no-print">Five pages. Use “Save as PDF” in the print dialog to keep it.</p>
      <div className="print-sheet pack-sheet">
        <section className="pk-page"><h2>{pack.title}: color me</h2><p className="pk-sub">{pack.colorTitle}</p><Art kind={pack.art} /><p className="pk-line">Name: ______________________</p></section>
        <section className="pk-page"><h2>Wordsearch</h2><p className="pk-sub">{theme.title}. Find the words and circle them.</p>
          <div className="pk-ws" style={{ gridTemplateColumns: 'repeat(11, 1fr)' }}>{grid.flat().map((c, i) => <span key={i}>{c}</span>)}</div>
          <p className="pk-words">{placed.map((x) => x.word).join('   ·   ')}</p></section>
        <section className="pk-page"><h2>Crossword</h2><CrosswordSheet p={cw} answers={false} /><p className="pk-sub" style={{ marginTop: 10 }}>Answers: {cw.words.map((w) => w.w.toUpperCase()).join(', ')}</p></section>
        <section className="pk-page"><h2>Maze</h2><p className="pk-sub">Find the way from the start to the end.</p>
          <svg viewBox="-0.5 -1 15.5 16.4" width="100%" style={{ maxWidth: 460, display: 'block', margin: '0 auto' }} role="img" aria-label="A maze"><g stroke="#000" strokeWidth="0.14" strokeLinecap="round">{lines.map(([a, b, c, d], i) => <line key={i} x1={a} y1={b} x2={c} y2={d} />)}</g><text x="0.2" y="-0.15" fontSize="0.6">Start</text><text x="12.8" y="15.1" fontSize="0.6">End</text></svg></section>
        <section className="pk-page"><h2>Learn by heart</h2><blockquote className="pk-verse">“{pack.verse}”<br /><small>{pack.verseRef}</small></blockquote>
          <p className="pk-sub">{pack.draw}</p><div className="pk-draw" /><p className="pk-line">My prayer: {pack.prayer}</p></section>
      </div>
    </div>
  );
}
