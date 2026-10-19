/** Shared data shapes. These are produced by scripts/ingest and consumed by the app. */

// ---------------------------------------------------------------------------
// Licensing & provenance
// ---------------------------------------------------------------------------

export type RightsStatus =
  | 'public-domain' // verified public domain, redistributable
  | 'open-license' // e.g. CC-BY: redistributable with attribution
  | 'licensed' // requires a license agreement; not bundled
  | 'external-link' // we only link to the publisher
  | 'metadata-only'; // facts / titles / references only, no text

export type VerificationStatus =
  | 'verified' // checked against the primary source by a person or by a deterministic check
  | 'source-metadata' // taken from the publisher's own metadata (e.g. the podcast feed)
  | 'machine-tagged' // derived from markup in a source edition, not reviewed
  | 'editorial' // an editorial suggestion; shown as such
  | 'unverified';

export interface Provenance {
  sourceId: string;
  sourceUrl: string;
  retrieved: string; // ISO date
  rights: RightsStatus;
  verification: VerificationStatus;
  /** e.g. sha256 of the downloaded archive */
  checksum?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Bible text
// ---------------------------------------------------------------------------

/** [verse number, text]. Verse 0 = continuation of the previous verse (paragraph break mid-verse). */
export type Run = [verse: number, text: string];

export type TextBlock = [kind: 'p' | 'm' | 'pi' | 'q1' | 'q2' | 'q3' | 'li1' | 'b' | 'nb', runs: Run[]];
export type HeadBlock = [kind: 's' | 'd' | 'ms' | 'sp' | 'r', text: string];
export type Block = TextBlock | HeadBlock;

export interface ChapterData {
  n: number;
  blocks: Block[];
  /** Footnotes by verse number. */
  notes?: Record<number, string[]>;
  /** For bridged verses ("v 3-4") maps first verse → last verse. */
  bridge?: Record<number, number>;
}

export interface BookData {
  id: string; // canon id
  edition: string;
  /** book id as it appears in the source (may differ, e.g. ESG→EST). */
  sourceBook?: string;
  title?: string;
  intro?: string[];
  chapters: ChapterData[];
}

export type Scheme = 'vulgate' | 'english';

export interface Edition {
  id: string;
  name: string;
  shortName: string;
  language: string;
  languageName: string;
  /** Versification scheme the edition's own numbering follows. */
  scheme: Scheme;
  tradition: string; // e.g. "Latin Vulgate (Clementine)"
  /** Base text and translation notes shown in the UI. */
  description: string;
  year?: string;
  translators?: string;
  catholicStatus: string; // plain statement, no overclaiming
  rights: RightsStatus;
  rightsBasis: string;
  attribution: string;
  sourceUrl: string;
  /** Where the full (offline-capable) text is available, if bundled. */
  bundled: boolean;
  offlineAllowed: boolean;
  /** Books whose text tradition differs so much from the anchor that verse alignment is unavailable. */
  unalignedBooks?: Record<string, string>;
  /** Chapters (book → list) where verse numbering is known to differ from the anchor numbering. */
  numberingDiffers?: Record<string, number[]>;
  /** If not bundled: how it could be added. */
  howToAdd?: string;
  rtl?: boolean;
}

export interface PlannedEdition {
  id: string;
  name: string;
  rights: 'licensed' | 'external-link';
  publisher: string;
  note: string;
  url?: string;
}

// ---------------------------------------------------------------------------
// Cross references, commentary, library
// ---------------------------------------------------------------------------

/** Cross-reference target, anchor numbering. `id` is a refId like "ROM.11.36" or "JHN.6.51-58". */
export type XrefEntry = [target: string, votes: number];

export type XrefFile = Record<string, XrefEntry[]>; // key "c.v"

export type AuthorityLevel =
  | 'doctrine' // official Catholic doctrine (Magisterium; defined)
  | 'magisterial' // authoritative Church teaching, not a solemn definition
  | 'father' // Church Father / early Christian writer
  | 'saint' // saint / doctor / spiritual master
  | 'scholarship' // theological opinion or scholarly interpretation
  | 'reflection' // private spiritual reflection / popular apologetics
  | 'historical' // historical commentary (may contain disputed interpretations)
  | 'media';

export type Period = 'apostolic' | 'patristic' | 'medieval' | 'early-modern' | 'modern' | 'contemporary';

export type ItemFormat = 'full-text' | 'excerpt' | 'summary' | 'external-link' | 'audio' | 'video';

export interface Source {
  id: string;
  name: string;
  kind: 'organization' | 'author' | 'collection';
  authority: AuthorityLevel;
  period?: Period;
  language: string;
  rights: RightsStatus;
  rightsNote: string;
  website?: string;
  formats: ItemFormat[];
  description: string;
}

export interface CommentaryItem {
  id: string;
  sourceId: string;
  author: string; // display
  authorId?: string;
  title: string;
  excerpt?: string;
  format: ItemFormat;
  authority: AuthorityLevel;
  period?: Period;
  /** Why this item is attached to the verse. */
  match: 'direct-citation' | 'explicit-reference' | 'verse-by-verse' | 'passage' | 'topic' | 'liturgical' | 'editorial';
  /** anchor refId(s) the item is attached to */
  refs: string[];
  url: string;
  date?: string;
  provenance: Provenance;
  translator?: string;
}
