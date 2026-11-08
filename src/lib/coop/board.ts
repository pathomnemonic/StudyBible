/** Weekly results for a group. Pure functions: the week runs Monday to Sunday by the local calendar. */
export interface Post { d: number; g: string; r: string }
export interface Member { n: string; e: Post[] }

/** Day numbers count from 1 January 1970 (a Thursday), as dayIndex() in dailyGame does. */
export const weekOf = (day: number) => Math.floor((day + 3) / 7);
export const weekStart = (week: number) => week * 7 - 3; // the Monday
export const inWeek = (day: number, week: number) => weekOf(day) === week;
export const dayLabel = (day: number) => new Date(day * 864e5).toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' });

/** Points for one result: Verbum scores by guesses used; everything else is a flat three for finishing. */
export function pointsFor(game: string, result: string): number {
  if (game === 'verbum') {
    const m = /^(\d)\/(\d)/.exec(result);
    return m ? Math.max(1, Number(m[2]) + 1 - Number(m[1])) : 1;
  }
  return /miss|fail|lost/i.test(result) ? 1 : 3;
}

/** Keep only well-formed posts of this week, at most one per game per day (on a clash the smaller text stands, so every device agrees). */
export function cleanPosts(raw: unknown, week: number): Post[] {
  const m = new Map<string, Post>();
  for (const p of Array.isArray(raw) ? raw : []) {
    if (!p || !Number.isInteger(p.d) || !inWeek(p.d, week) || typeof p.g !== 'string' || typeof p.r !== 'string') continue;
    const post: Post = { d: p.d, g: p.g.slice(0, 20), r: p.r.slice(0, 30) };
    const k = `${post.d}:${post.g}`;
    const cur = m.get(k);
    if (!cur || post.r < cur.r) m.set(k, post);
  }
  return [...m.values()].sort((a, b) => a.d - b.d || a.g.localeCompare(b.g));
}
/** Add posts to what a member already has; a game already posted for a day is not replaced by this device's own later post. */
export function addPosts(have: Post[], add: Post[], week: number): Post[] {
  const keep = new Set(have.map((p) => `${p.d}:${p.g}`));
  return cleanPosts([...have, ...add.filter((p) => !keep.has(`${p.d}:${p.g}`))], week);
}

export interface Row { n: string; points: number; games: number; days: number; perDay: Record<number, number> }
export function standings(members: Member[], week: number): Row[] {
  const rows = members.map((m) => {
    const posts = cleanPosts(m.e, week);
    const perDay: Record<number, number> = {};
    let points = 0;
    for (const p of posts) { const v = pointsFor(p.g, p.r); points += v; perDay[p.d] = (perDay[p.d] ?? 0) + v; }
    return { n: m.n, points, games: posts.length, days: Object.keys(perDay).length, perDay };
  }).filter((r) => r.games > 0);
  return rows.sort((a, b) => b.points - a.points || b.games - a.games || a.n.localeCompare(b.n));
}
