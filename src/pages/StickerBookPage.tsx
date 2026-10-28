import { Link } from 'react-router-dom';
import { STICKERS, loadStickers } from '../lib/stickers';

/** The sticker book: each sticker is a saint, earned by finishing a story, a game or a prayer. */
export default function StickerBookPage() {
  const have = new Set(loadStickers());
  return (
    <div className="page sticker-book">
      <h1>My sticker book</h1>
      <p className="lede">{have.size} of {STICKERS.length} stickers. Finish a story or a game to get the next saint.</p>
      <ul className="sticker-grid">
        {STICKERS.map((s) => (
          <li key={s.id} className={have.has(s.id) ? 'got' : 'locked'}>
            <span className="sticker-ico" aria-hidden="true">{have.has(s.id) ? s.icon : '❔'}</span>
            <strong>{have.has(s.id) ? s.name : '?'}</strong>
            <em>{have.has(s.id) ? s.why : 'Not yet'}</em>
          </li>
        ))}
      </ul>
      <p><Link className="btn" to="/study/kids">Read a story</Link> <Link className="btn ghost" to="/play">Play a game</Link></p>
    </div>
  );
}
