/** Memento mori, kept gentle: how many weeks of a life are behind and (by the person's own estimate) ahead. */
export interface LifeStats { weeksLived: number; totalWeeks: number; weeksLeft: number; pct: number; yearsLived: number; yearsLeft: number; beyond: boolean; valid: boolean }

const WEEK = 7 * 86400000;
export function parseBirthday(s: string, now = new Date()): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T12:00:00`);
  if (Number.isNaN(d.getTime()) || d.getTime() > now.getTime() || now.getFullYear() - d.getFullYear() > 125) return null;
  return d;
}

export function lifeStats(birthday: string, expectancy: number, now = new Date()): LifeStats {
  const b = parseBirthday(birthday, now);
  const exp = Math.min(120, Math.max(1, Math.round(expectancy || 80)));
  const totalWeeks = Math.round(exp * 52.1775);
  if (!b) return { weeksLived: 0, totalWeeks, weeksLeft: totalWeeks, pct: 0, yearsLived: 0, yearsLeft: exp, beyond: false, valid: false };
  const weeksLived = Math.floor((now.getTime() - b.getTime()) / WEEK);
  const yearsLived = (now.getTime() - b.getTime()) / (365.2425 * 86400000);
  const beyond = weeksLived >= totalWeeks;
  return {
    weeksLived, totalWeeks, weeksLeft: Math.max(0, totalWeeks - weeksLived),
    pct: Math.min(100, Math.round((weeksLived / totalWeeks) * 100)),
    yearsLived: Math.floor(yearsLived), yearsLeft: Math.max(0, Math.round((exp - yearsLived) * 10) / 10), beyond, valid: true,
  };
}

/** Short, hopeful lines from Scripture and the tradition. Public-domain wording. */
export const MEMENTO_LINES: { text: string; src: string }[] = [
  { text: 'Teach us to number our days, that we may get a heart of wisdom.', src: 'Psalm 90:12' },
  { text: 'In all thy works remember thy last end, and thou shalt never sin.', src: 'Sirach 7:40 (Douay-Rheims)' },
  { text: 'Watch therefore, for you do not know on what day your Lord is coming.', src: 'Matthew 24:42' },
  { text: 'For here we have no lasting city, but we seek the city that is to come.', src: 'Hebrews 13:14' },
  { text: 'Remember, man, that thou art dust, and unto dust thou shalt return.', src: 'Ash Wednesday, after Genesis 3:19' },
  { text: 'Whatever you do, do it from the heart, as for the Lord.', src: 'Colossians 3:23' },
];
/** A line that changes each day but is the same all day. */
export const lineOfTheDay = (d = new Date()) => MEMENTO_LINES[(Math.floor(d.getTime() / 86400000)) % MEMENTO_LINES.length];

export const ESTIMATORS: { name: string; url: string; note: string }[] = [
  { name: 'U.S. Social Security life expectancy calculator', url: 'https://www.ssa.gov/oact/population/longevity.html', note: 'Enter your birth date and sex; it gives an average, not a prediction.' },
  { name: 'Living to 100 life expectancy calculator', url: 'https://www.livingto100.com/', note: 'Asks about health and habits; free, with an optional sign-up.' },
];
