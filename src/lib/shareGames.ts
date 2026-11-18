/**
 * The games that get their own link preview. A message app (WhatsApp, iMessage, Telegram) reads the page behind a link, and a page behind `#/play/...` is always
 * the app's front page, so each game here also has a small static page at `share/<slug>.html` that carries its own title, description and picture and then
 * opens the game. The names and blurbs must match the games menu (tests/sharePages.test.ts checks).
 */
export interface ShareGame { slug: string; path: string; name: string; blurb: string; image: string }
export const SHARE_GAMES: ShareGame[] = [
  { slug: 'deepwaters', path: '/play/deepwaters', name: 'Basilion', blurb: 'Seven Catholic prompts. Find a valid answer others might overlook.', image: 'og/basilion.jpg' },
  { slug: 'verbum', path: '/play/verbum', name: 'Creedle', blurb: 'Guess the five-letter word of the faith in six tries.', image: 'og/default.jpg' },
  { slug: 'whichbook', path: '/play/whichbook', name: 'Which Book?', blurb: 'Name the book of the Bible a verse comes from.', image: 'og/default.jpg' },
  { slug: 'whosaid', path: '/play/whosaid', name: 'Who Said It?', blurb: 'Five quotations from the saints: who said each?', image: 'og/default.jpg' },
  { slug: 'saintguess', path: '/play/saintguess', name: 'Saintdle', blurb: 'Name the saint from clues that get easier.', image: 'og/default.jpg' },
  { slug: 'quartets', path: '/play/quartets', name: 'Communions', blurb: 'Sixteen tiles, four hidden sets.', image: 'og/default.jpg' },
  { slug: 'chain', path: '/play/chain', name: 'Jacob’s Ladder', blurb: 'Change one letter at a time to turn one word into another.', image: 'og/default.jpg' },
  { slug: 'whoami', path: '/play/whoami', name: 'Who Am I?', blurb: 'A person from the Bible, from five clues.', image: 'og/default.jpg' },
  { slug: 'pilgrim', path: '/play/pilgrim', name: 'Holyguessr', blurb: 'Tap the map to place a city or mountain from Scripture.', image: 'og/default.jpg' },
  { slug: 'trivia', path: '/play/trivia', name: 'Trivia Chrism', blurb: 'Spin the wheel, win six crowns. Play a friend, the Bot, or alone.', image: 'og/default.jpg' },
  { slug: 'cloister', path: '/play/cloister', name: 'Scriggle', blurb: 'Link letters into words. Words of the faith score extra.', image: 'og/default.jpg' },
  { slug: 'crossword', path: '/play/crossword', name: 'Crossword', blurb: 'A small crossword of the faith, new each week.', image: 'og/default.jpg' },
];
/** the address to put in a message: the game's own preview page in a built app, otherwise the plain address of the game */
export const shareSlugFor = (path: string) => SHARE_GAMES.find((g) => g.path === path)?.slug;
