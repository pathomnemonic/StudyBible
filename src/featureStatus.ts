export type Status = 'working' | 'partial' | 'needs-license' | 'needs-credentials' | 'planned';

export interface Feature {
  area: string;
  name: string;
  status: Status;
  detail: string;
}

/** The honest feature matrix. Also rendered in the app (About → Feature status) and mirrored in docs/FEATURE_STATUS.md. */
export const FEATURES: Feature[] = [
  { area: 'Scripture', name: 'Douay-Rheims, Clementine Vulgate, WEB (Catholic): 73 books, offline', status: 'working', detail: 'Public-domain texts ingested from eBible.org USFM; paragraphs, poetry, headings and footnotes preserved.' },
  { area: 'Scripture', name: 'Parallel view, verse comparison, translation switching that keeps the passage', status: 'working', detail: 'Aligned through the Vulgate anchor. Psalms are mapped by reviewed rules; other chapters whose numbering differs are flagged, never silently mismatched.' },
  { area: 'Scripture', name: 'Verse-level alignment for Tobit, Judith, Sirach, Esther, Daniel across Greek vs Vulgate texts', status: 'partial', detail: 'These books follow different textual traditions; chapter-level alignment only, with an explicit notice.' },
  { area: 'Scripture', name: 'RSV-CE, RSV-2CE, NABRE, Jerusalem Bible / NJB', status: 'needs-license', detail: 'Under copyright. The edition registry, anchor mapping (English scheme) and attribution records are ready; a licence and text file are required.' },
  { area: 'Scripture', name: 'Maps and appendices', status: 'planned', detail: 'Not in the public-domain sources used; the data model allows per-edition introductions and footnotes.' },
  { area: 'Study', name: 'Verse study panel with provenance, authority level and match reason on every item', status: 'working', detail: 'Never lists a source for a verse unless the data links it; empty sections say so.' },
  { area: 'Study', name: 'Catechism links', status: 'partial', detail: '29 verse-level citations, each verified against the paragraph text; topic ranges for 18 doctrine topics. The full Scripture index of the CCC needs a licensed data file. CCC text is never stored.' },
  { area: 'Study', name: 'Church Fathers: Catena Aurea (all four Gospels, CrossWire), Haydock Catholic Bible Commentary (protocanon), Augustine, Chrysostom, Irenaeus, Athanasius, Cyril, Glossa Ordinaria (Latin)', status: 'working', detail: 'Public-domain: CrossWire Catena (Public Domain licence), SermonIndex Haydock module, CCEL translations. 24 works in the library plus a link-out Summa index.' },
  { area: 'Study', name: 'Saints library (Teresa of Ávila, Catherine of Siena, Brother Lawrence)', status: 'partial', detail: 'Several popular translations were left out because their copyright status could not be verified.' },
  { area: 'Study', name: 'Popes and Vatican documents', status: 'partial', detail: 'Linked (not copied) with authority labels; text search of them is not included.' },
  { area: 'Study', name: 'Catholic Answers, Word on Fire, Ascension Presents', status: 'needs-credentials', detail: 'No public APIs or reuse licences. Only search links and a curated-link schema are provided; no content is imported. A partnership/licence would unlock richer integration.' },
  { area: 'Study', name: 'Semantic / concept search with AI', status: 'planned', detail: 'Not implemented. Concept search currently uses editorial topic keywords and a people/places index, clearly labelled. If added, AI results will be marked as such.' },
  { area: 'Search', name: 'Exact phrase, partial words, references, scope filters, fuzzy suggestions, recent & saved searches', status: 'working', detail: 'Client-side indexes built on demand; Scripture across all editions; library full-text at section level.' },
  { area: 'Listen', name: 'Bible in a Year: 1,847 episodes mapped from the official feed; plan, canonical and release order; queue; progress; resume', status: 'working', detail: 'Passages come from feed metadata voted across yearly releases; two days have no passages in the feed and are flagged for review.' },
  { area: 'Listen', name: 'Transcripts and captions', status: 'planned', detail: 'The official feed provides none. The schema supports them if Ascension publishes transcripts or grants access.' },
  { area: 'Listen', name: 'Video and other podcasts', status: 'planned', detail: 'Links to official YouTube channels only; adding more feeds is a matter of adding a feed entry.' },
  { area: 'Pray', name: 'Liturgical calendar, seasons, cycles, calendar view, local calendars (via LitCal)', status: 'working', detail: 'Offline computation plus the open LitCal API when online.' },
  { area: 'Pray', name: 'Daily Mass readings', status: 'needs-license', detail: 'The Lectionary is copyrighted and no open reference list exists for ordinary days. Solemnities and feasts are shown via LitCal; everything else via an imported or hand-entered reference list.' },
  { area: 'Pray', name: 'Saint biographies and homilies for the day', status: 'partial', detail: 'The day’s celebrations come from LitCal (names, ranks). Biographies need a licensed or public-domain source (e.g. a public-domain Lives of the Saints) which has not been ingested yet.' },
  { area: 'Pray', name: 'Lectio Divina, prayer journal, traditional prayers, quiet reading, plans (11+ built in, custom plans)', status: 'working', detail: 'Optional; no streak pressure (streak display is off by default).' },
  { area: 'Pray', name: 'Audio Scripture', status: 'partial', detail: 'Device text-to-speech only. Recorded audio would need a licensed or public-domain recording per edition.' },
  { area: 'Pray', name: 'Reminders', status: 'partial', detail: 'Work while the app is open/installed. True background push needs a server or native wrapper.' },
  { area: 'Library', name: 'Notes (Markdown), highlights (6 colours), bookmarks, folders, tags, collections, personal cross-references, journal, export/import', status: 'working', detail: 'Stored in IndexedDB on the device, anchored to stable Vulgate-based ids so they survive translation changes.' },
  { area: 'Library', name: 'Accounts & cross-device sync', status: 'working', detail: 'Optional: needs the bundled Node server (npm start, or the Dockerfile) that you host yourself; the app works fully offline without it. Last-writer-wins sync of notes, highlights, bookmarks, journal, plans and attached links. Not end-to-end encrypted; no email password reset (operators use npm run admin). See docs/SERVER.md.' },
  { area: 'Pray', name: 'Today page: Mass readings, Bible in a Year, verse of the day, where you left off', status: 'working', detail: 'Readings need the LitCal calendar online or an imported lectionary. The Bible in a Year day follows the calendar year.' },
  { area: 'Library', name: 'Study data offline packs', status: 'working', detail: 'Download commentary, the Fathers library and resource links in Settings. Publisher links and audio still need a connection.' },
  { area: 'Study', name: 'Catholic Answers articles linked to verses', status: 'partial', detail: 'Links to individual catholic.com pages (permitted by their permissions page) matched by hand from title and summary: about 75 pages across ~25 passages so far, plus 73 Bible Navigator pages. A complete index needs Catholic Answers’ own mapping; the database and import path are ready (docs/OUTREACH_CATHOLIC_ANSWERS.md).' },
  { area: 'Study', name: 'Catholic creators (Jimmy Akin, Trent Horn, Matt Fradd, Brant Pitre, Word on Fire…)', status: 'partial', detail: 'A handful of individually linked pages and episodes, plus per-passage YouTube and podcast search links for each creator. Embedded playback for YouTube, Spotify, Apple Podcasts, Vimeo and audio files.' },
  { area: 'Platform', name: 'Installable offline PWA, light/dark/sepia, accessibility labels, responsive layout', status: 'working', detail: 'Service worker caches the app shell and any Scripture or content you open (or download in Settings).' },
  { area: 'Data', name: 'Ingestion pipeline with provenance, checksums, validation and reports', status: 'working', detail: 'npm run data:fetch / data:build / data:validate; see docs/INGESTION.md.' },
];

export const STATUS_LABEL: Record<Status, string> = {
  working: 'Working',
  partial: 'Partial',
  'needs-license': 'Needs licence',
  'needs-credentials': 'Needs credentials / agreement',
  planned: 'Planned',
};
