/** What was added in this development period, by area. Each entry names a feature in the registry (src/lib/features.ts) so its link is the real route. */
export interface NewItem { id?: string; to?: string; title?: string; area: NewArea; date: string; line: string }
export type NewArea = 'Learn' | 'Study tools' | 'Pray' | 'Games' | 'Teach' | 'Library' | 'On your device';
export const NEW_AREAS: NewArea[] = ['Learn', 'Study tools', 'Pray', 'Games', 'Teach', 'Library', 'On your device'];

export const NEW_ITEMS: NewItem[] = [
  { id: 'study.curriculum', area: 'Learn', date: '2026-11-09', line: 'Catechism lessons are now a step-by-step journey, with lengths for a group and for study alone, and lists that show how much each lesson teaches.' },
  { id: 'learn.apologetics-tracks', area: 'Learn', date: '2026-11-09', line: 'Tracks that grow you step by step on one question, such as atheism, Protestant friends, Islam or natural law.' },
  { id: 'learn.kidsquestions', area: 'Learn', date: '2026-11-08', line: 'Eighty real questions children ask, with short answers at two levels and a note for the grown-up.' },
  { id: 'learn.claims', area: 'Learn', date: '2026-11-08', line: 'Common claims about the Church, checked fairly, with where each misunderstanding comes from.' },
  { id: 'learn.heresies', area: 'Learn', date: '2026-11-08', line: 'Each major error at its strongest, in the words of those who answered it, and where it breaks.' },
  { id: 'learn.timelapse', area: 'Learn', date: '2026-11-08', line: 'A map from Pentecost to 1600 with councils, martyrs, missions and foundations appearing in date order.' },
  { id: 'learn.lives', area: 'Learn', date: '2026-11-08', line: 'A saint’s life year by year, setbacks included, beside what was happening in the world.' },
  { id: 'learn.arguments', area: 'Learn', date: '2026-11-07', line: 'A teaching laid out as real sources in order, with the strongest objections.' },
  { id: 'learn.development', area: 'Learn', date: '2026-11-07', line: 'Follow a doctrine through time, from where it first appears to the words that were settled.' },
  { id: 'learn.words', area: 'Learn', date: '2026-11-07', line: 'Logos, ekklesia, homoousios: what each word meant and how it was used.' },
  { id: 'learn.zoom', area: 'Learn', date: '2026-11-07', line: 'One teaching as a sentence, a paragraph, a page, then the sources behind it.' },

  { id: 'study.ask-fathers', area: 'Study tools', date: '2026-11-08', line: 'Type a question and read what the Fathers and saints wrote on it, by century.' },
  { id: 'study.compare-fathers', area: 'Study tools', date: '2026-11-08', line: 'Two writers and one topic, their passages side by side.' },
  { id: 'study.apostolic-chain', area: 'Study tools', date: '2026-11-08', line: 'Who taught whom from the apostles to Augustine, each link with a quotation.' },
  { id: 'bible.compare-translations', area: 'Study tools', date: '2026-11-08', line: 'One passage in up to three translations, with the differing words marked.' },
  { id: 'bible.glossed', area: 'Study tools', date: '2026-11-08', line: 'A chapter set like a medieval glossed Bible, with the Glossa Ordinaria in the margins (switch it on in the reading settings).' },
  { id: 'bible.walks', area: 'Study tools', date: '2026-11-08', line: 'Follow a thread such as the mountain or the water across the map, stop by stop.' },
  { id: 'bible.slow', area: 'Study tools', date: '2026-11-08', line: 'The whole Bible over about seven years, a few verses a day, with a Father beside each reading.' },
  { id: 'bible.conversation', area: 'Study tools', date: '2026-11-07', line: 'One passage read by commentators in time order, from the Fathers to later writers.' },

  { id: 'pray.hymns', area: 'Pray', date: '2026-11-09', line: 'Veni Creator, Pange lingua, Salve Regina and more: Latin with public-domain English, by season.' },
  { id: 'pray.office-companion', area: 'Pray', date: '2026-11-08', line: 'Morning and Evening Prayer step by step, with a note on why we pray each part.' },
  { id: 'pray.readingstogether', area: 'Pray', date: '2026-11-08', line: 'Why a Sunday’s readings belong together: cross-references, a Father on the Gospel, and the Catechism.' },
  { id: 'pray.massalong', area: 'Pray', date: '2026-11-08', line: 'A quiet, large-print follow-along: one part of the Mass at a time with today’s readings.' },
  { id: 'pray.hardday', area: 'Pray', date: '2026-11-08', line: 'For a hard day: a verse, one line to say and a saint who has been there. Nothing to finish.' },
  { id: 'pray.mentors', area: 'Pray', date: '2026-11-08', line: 'Saints for grief, doubt, a new baby or a hard boss, in their own words.' },

  { id: 'learn.trivia', area: 'Games', date: '2026-11-08', line: 'A wheel of six categories; three right answers win a crown. Play a friend, Brother Bot or alone.' },
  { id: 'learn.online', area: 'Games', date: '2026-11-08', line: 'Open a quiz room and share a six-digit code. Friends join from their own phones, with no account.' },
  { id: 'learn.coop', area: 'Games', date: '2026-11-08', line: 'Solve today’s Verbum together with a code, and see every guess.' },
  { id: 'learn.leaderboard', area: 'Games', date: '2026-11-08', line: 'A friendly weekly board for a parish, class or family, by group code.' },

  { id: 'teach.dashboard', area: 'Teach', date: '2026-11-08', line: 'Lessons taught, average scores, the questions most missed and which lessons to teach again.' },
  { id: 'teach.parent', area: 'Teach', date: '2026-11-08', line: 'Add your children and get a weekly plan: a lesson each, a prayer, a saint and the Sunday Gospel.' },
  { id: 'teach.booklet', area: 'Teach', date: '2026-11-08', line: 'Turn an argument, a life or a reading into a printed booklet with sources and questions.' },

  { to: '/room', title: 'More works in the reading room', area: 'Library', date: '2026-11-09', line: 'More than seventy new public-domain works from the Fathers and later writers, including the Didache, Hermas, Bede, Newman and Chesterton.' },

  { id: 'you.passport', area: 'On your device', date: '2026-11-08', line: 'Private stamps for the saints, councils, feasts and games you have visited.' },
  { id: 'you.widgets', area: 'On your device', date: '2026-11-08', line: 'Today’s verse, verses to review and your game streak as widgets.' },
];

const KEY = 'sb:whatsnew:seen';
export const latestNew = () => NEW_ITEMS.reduce((m, i) => (i.date > m ? i.date : m), '');
export function seenDate(): string { try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; } }
/** True while there is something the person has not looked at yet: for a dot on the link to the page. */
export const hasUnseenWhatsNew = () => latestNew() > seenDate();
export function markWhatsNewSeen() { try { localStorage.setItem(KEY, latestNew()); } catch { /* private mode */ } }
