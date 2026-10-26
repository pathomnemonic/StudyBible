/** Tools that help read the Bible: they live with the Bible tab, not under Study. */
export interface BibleTool { to: string; label: string; blurb: string; group: 'text' | 'words'; match: string }
export const BIBLE_TOOLS: BibleTool[] = [
  { to: '/study/books', label: 'Books and outlines', blurb: 'An introduction and outline for each of the 73 books.', group: 'text', match: '/study/books' },
  { to: '/study/synopsis', label: 'Gospel comparison', blurb: 'Matthew, Mark, Luke and John side by side.', group: 'text', match: '/study/synopsis' },
  { to: '/study/pauline', label: 'Paul’s letters', blurb: 'The argument of each letter, in outline.', group: 'text', match: '/study/pauline' },
  { to: '/study/index', label: 'Parables, miracles, prophecies, covenants', blurb: 'Indexes with every passage linked.', group: 'text', match: '/study/index' },
  { to: '/study/textual', label: 'Textual history', blurb: 'Where manuscripts and editions differ.', group: 'text', match: '/study/textual' },
  { to: '/study/manuscripts', label: 'Manuscripts', blurb: 'Zoom into real pages, from a 4th-century fragment of John.', group: 'text', match: '/study/manuscripts' },
  { to: '/study/terms', label: 'Key words and phrases', blurb: 'Son of Man, Kingdom of God, Lamb of God: what they mean and where they occur.', group: 'words', match: '/study/terms' },
  { to: '/study/concordance', label: 'Concordance', blurb: 'Every verse containing a word, counted by book.', group: 'words', match: '/study/concordance' },
  { to: '/study/topical', label: 'Topical index', blurb: 'Thousands of topics with their passages.', group: 'words', match: '/study/topical' },
];
export const isBibleToolPath = (p: string) => BIBLE_TOOLS.some((t) => p === t.match || p.startsWith(t.match + '/') || p.startsWith(t.match + '?'));
