/**
 * Artwork for the games. Two sets, both bundled so the games work offline:
 *  - 3D icons: Microsoft Fluent UI Emoji, 3D style (MIT licence), public/arcade/3d
 *  - animated emoji: Google Noto Emoji Animation (CC BY 4.0), public/arcade/anim
 * Credits are in docs/DATA_SOURCES.md and the app's Sources page text.
 */
const base = (import.meta as unknown as { env: { BASE_URL: string } }).env.BASE_URL;
export const art3d = (name: string) => `${base}arcade/3d/${name}.webp`;
export const artAnim = (code: string) => `${base}arcade/anim/${code}.webp`;

/** A 3D icon. Decorative by default (the words beside it say what it is). */
export function Art({ n, size = 48, className = '', label }: { n: string; size?: number; className?: string; label?: string }) {
  return <img className={`arc-art ${className}`} src={art3d(n)} width={size} height={size} alt={label ?? ''} aria-hidden={label ? undefined : true} loading="lazy" decoding="async" draggable={false} />;
}
/** An animated emoji. */
export function Anim({ c, size = 64, className = '', label }: { c: string; size?: number; className?: string; label?: string }) {
  return <img className={`arc-anim ${className}`} src={artAnim(c)} width={size} height={size} alt={label ?? ''} aria-hidden={label ? undefined : true} decoding="async" draggable={false} />;
}

/** Which 3D icon stands for which game. */
export const GAME_ART: Record<string, string> = {
  '/play/deepwaters': 'whale', '/play/verbum': 'game-die', '/play/whichbook': 'open-book', '/play/whosaid': 'speech-balloon', '/play/saintguess': 'dove',
  '/play/quartets': 'puzzle-piece', '/play/chain': 'link', '/play/crossword': 'memo', '/play/wordsearch': 'magnifying-glass-tilted-left', '/play/cloister': 'scroll',
  '/play/termmatch': 'light-bulb', '/play/familyties': 'evergreen-tree', '/play/whoami': 'old-man', '/play/pilgrim': 'round-pushpin', '/play/artdetective': 'framed-picture',
  '/play/prophet': 'crystal-ball', '/play/doctrineladder': 'ladder', '/play/trivia': 'crown', '/play/online': 'world-map', '/play/quiznight': 'party-popper',
  '/play/leaderboard': 'sports-medal', '/play/coop': 'handshake', '/play/charades': 'performing-arts', '/play/trophies': 'trophy',
};
