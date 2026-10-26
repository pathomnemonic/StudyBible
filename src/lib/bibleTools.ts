/** Tools for studying the Bible text. They live with the Bible tab: open from the reader's menu, from the tools bar on each page, or from the Explore page. */
export type ToolGroup = 'text' | 'words' | 'world' | 'big' | 'sources';
export interface BibleTool { to: string; label: string; blurb: string; group: ToolGroup; match: string }
export const TOOL_GROUPS: [ToolGroup, string][] = [['text', 'The text'], ['words', 'Words and topics'], ['world', 'People and places'], ['big', 'The big picture'], ['sources', 'Sources']];
const t = (to: string, label: string, blurb: string, group: ToolGroup): BibleTool => ({ to, label, blurb, group, match: to });
export const BIBLE_TOOLS: BibleTool[] = [
  t('/study/books', 'Books and outlines', 'An introduction and outline for each of the 73 books.', 'text'),
  t('/study/synopsis', 'Gospel comparison', 'Matthew, Mark, Luke and John side by side.', 'text'),
  t('/study/pauline', 'Paul’s letters', 'The argument of each letter, in outline.', 'text'),
  t('/study/index', 'Parables, miracles, prophecies', 'Indexes with every passage linked.', 'text'),
  t('/study/dossier', 'Passage dossier', 'Everything on one passage, in one printable page.', 'text'),
  t('/study/lexicon', 'Greek and Hebrew words', 'Look up a word and see every place it appears.', 'words'),
  t('/study/concordance', 'Concordance', 'Every verse containing a word, counted by book.', 'words'),
  t('/study/topical', 'Topical index', 'Thousands of topics with their passages.', 'words'),
  t('/study/terms', 'Key words and phrases', 'Son of Man, Kingdom of God, Lamb of God: what they mean.', 'words'),
  t('/study/quotations', 'Who quoted this verse?', 'Every Father and saint who cites a passage.', 'words'),
  t('/study/fulfilment', 'Promise and fulfilment', 'Types and prophecies, in the Fathers’ own words.', 'words'),
  t('/study/maps', 'Maps', 'Places named in Scripture.', 'world'),
  t('/study/world', 'The biblical world', 'Journeys, eras and archaeology.', 'world'),
  t('/study/timespace', 'Time and place', 'Slide through the story and watch the map follow.', 'world'),
  t('/study/people', 'Genealogies', 'Family trees from Adam to Jesus.', 'world'),
  t('/study/gallery', 'Gallery', 'Paintings and engravings of Bible scenes.', 'world'),
  t('/study/universe', 'Scripture universe', 'All 73 books as a galaxy.', 'big'),
  t('/study/constellation', 'Constellation', 'Books as stars, joined by cross-references.', 'big'),
  t('/study/themes', 'Biblical theology explorer', 'Follow a theme from Genesis to Revelation.', 'big'),
  t('/study/concepts', 'Web of themes', 'How the great themes are tied together.', 'big'),
  t('/study/voices', 'Voices through time', 'The Fathers and saints on one timeline.', 'big'),
  t('/study/textual', 'Textual history', 'Where manuscripts and editions differ.', 'sources'),
  t('/study/manuscripts', 'Manuscripts', 'Zoom into real pages, from a 4th-century fragment of John.', 'sources'),
  t('/study/sources', 'Sources and licensing', 'Where every text comes from.', 'sources'),
];
import { inStudyTools } from './tabs';
export const isBibleToolPath = (p: string) => inStudyTools(p);
