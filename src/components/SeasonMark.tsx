import type { LiturgicalDay } from '../liturgy/compute';
import { addDays, easter, parseIso } from '../liturgy/compute';

const V = '#6a3d9a', R = '#d98aa8', G = '#2e7d4f', GOLD = '#c9a227', RED = '#b3261e', W = '#f3efe2';

/** What to say about the season in a few words: the candle of Advent, the days to Easter, the days since it. */
export function seasonCaption(ld: LiturgicalDay): string {
  const d = parseIso(ld.date);
  if (ld.season === 'advent') return `Advent: week ${ld.week ?? 1}, ${(ld.week ?? 1)} candle${(ld.week ?? 1) === 1 ? '' : 's'} lit`;
  if (ld.season === 'lent') { const left = Math.round((easter(d.getUTCFullYear()).getTime() - d.getTime()) / 864e5); return left > 0 ? `Lent: ${left} day${left === 1 ? '' : 's'} to Easter` : 'Lent'; }
  if (ld.season === 'triduum') return 'The Sacred Triduum';
  if (ld.season === 'easter') { const since = Math.round((d.getTime() - easter(d.getUTCFullYear()).getTime()) / 864e5); return `Easter: day ${since + 1} of fifty`; }
  if (ld.season === 'christmas') return 'Christmas season';
  return 'Ordinary Time';
}
export { addDays };

/** A small drawing of the season: the Advent wreath with its candles lit, the cross of Lent, the Easter candle, the Christmas star, a leaf for Ordinary Time. */
export default function SeasonMark({ ld, size = 18 }: { ld: LiturgicalDay; size?: number }) {
  const caption = seasonCaption(ld);
  const lit = Math.min(4, ld.week ?? 1);
  let body: JSX.Element;
  if (ld.season === 'advent') {
    body = (<>
      <ellipse cx="20" cy="31" rx="15" ry="6" fill="none" stroke={G} strokeWidth="3" />
      {[8, 15, 25, 32].map((x, i) => (<g key={i}><rect x={x - 2} y="16" width="4" height="12" rx="1" fill={i === 2 ? R : V} />{i < lit && <path d={`M${x} 9 q3 4 0 7 q-3 -3 0 -7z`} fill={GOLD} />}</g>))}
    </>);
  } else if (ld.season === 'lent') {
    body = (<><rect x="17" y="5" width="6" height="31" rx="1.5" fill={V} /><rect x="9" y="13" width="22" height="6" rx="1.5" fill={V} /></>);
  } else if (ld.season === 'triduum') {
    body = (<><rect x="17" y="5" width="6" height="31" rx="1.5" fill={RED} /><rect x="9" y="13" width="22" height="6" rx="1.5" fill={RED} /><circle cx="20" cy="16" r="2.4" fill={W} /></>);
  } else if (ld.season === 'easter') {
    body = (<><rect x="14" y="15" width="12" height="21" rx="2" fill={W} stroke="#bbb" strokeWidth="1" /><path d="M20 3 q6 8 0 12 q-6 -4 0 -12z" fill={GOLD} /><path d="M20 22 v8 M16 26 h8" stroke={RED} strokeWidth="2" /></>);
  } else if (ld.season === 'christmas') {
    body = (<path d="M20 3 l4.5 11 11.5 1 -9 7.5 3 11.5 -10 -6.5 -10 6.5 3 -11.5 -9 -7.5 11.5 -1z" fill={GOLD} />);
  } else {
    body = (<><path d="M8 30 C8 14 20 6 34 6 C34 22 24 33 8 30z" fill={G} /><path d="M8 30 L26 14" stroke="#cfe8d6" strokeWidth="1.6" fill="none" /></>);
  }
  return <svg className="season-mark" width={size} height={size} viewBox="0 0 40 40" role="img" aria-label={caption} style={{ verticalAlign: '-0.2em' }}><title>{caption}</title>{body}</svg>;
}
