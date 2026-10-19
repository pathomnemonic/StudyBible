import { getJson } from './loader';
import type { Source } from '../lib/types';

export interface CatenaGroup {
  c: number;
  v1: number;
  v2: number;
  scripture?: string;
  items: { a: string; id: string; l: string; t: string }[];
}
export const getCatena = (book: string) => getJson<{ source: string; groups: CatenaGroup[] }>(`commentary/catena/${book}.json`, true);
export const getGlossa = (book: string) => getJson<Record<string, [string, string][]>>(`commentary/glossa/${book}.json`, true);

export interface LibraryWorkMeta {
  indexOnly?: boolean;
  sectionUrl?: string;
  id: string;
  title: string;
  author: string;
  authorId: string;
  period: string;
  authority: string;
  kind: string;
  year?: string;
  description: string;
  scriptureMode: string;
  translator?: string;
  rightsEvidence?: string;
  printSource?: string;
  source: { name: string; url: string; retrieved: string };
  rights: string;
  format: string;
  sections: { id: string; title: string; scripture: string[]; words: number }[];
}
export const getLibraryIndex = () => getJson<{ generated: string; works: LibraryWorkMeta[] }>('library/index.json', true);
/** [c1, v1, c2, v2, workId, sectionIdx, 's'|'t', snippet] */
export type LibScriptureEntry = [number, number, number, number, string, number, 's' | 't', string];
export const getLibScripture = (book: string) => getJson<LibScriptureEntry[]>(`library/scripture/${book}.json`, true);
export const getWork = (id: string) => getJson<{ id: string; sections: { id: string; title: string; paras: string[]; scripture: string[] }[] }>(`library/works/${id}.json`);
export const getFulltextIndex = () => getJson<{ sections: [string, number][]; postings: Record<string, number[]> }>('library/fulltext-index.json', true);

export interface BiayEpisode {
  id: string;
  day: number | null;
  year: number | null;
  kind: 'day' | 'bonus';
  title: string;
  short: string;
  date: string;
  duration: number | null;
  audio: string;
  page: string;
  player?: string;
  description: string;
  passages: string[];
  passageSource: string;
}
export interface BiayData {
  meta: Record<string, string>;
  days: Record<string, { passages: string[]; title?: string }>;
  episodes: BiayEpisode[];
}
export const getBiay = () => getJson<BiayData>('media/biay.json', true);

export interface DoctrineTopic {
  id: string;
  title: string;
  summary: string;
  ccc: [number, number][];
  scripture: string[];
  docs: string[];
  related: string[];
  keywords: string[];
}
export interface DoctrineDoc {
  title: string;
  body: string;
  level: string;
  url: string;
}
export interface DoctrineData {
  levels: Record<string, string>;
  documents: Record<string, DoctrineDoc>;
  topics: DoctrineTopic[];
}
export const getDoctrine = () => getJson<DoctrineData>('doctrine/doctrine.json', true);
export const getCccLinks = () => getJson<{ links: { ref: string; para: number; kind: 'quotation' | 'discussion'; verifiedOn: string }[] }>('doctrine/ccc-links.json', true);
export const getOverviews = () => getJson<Record<string, string>>('doctrine/book-overviews.json', true);
export const getSources = () => getJson<{ sources: Source[] }>('registry/sources.json', true);
export const getAuthors = () => getJson<{ authors: Record<string, { name: string; dates: string; period: string; bio: string }> }>('registry/authors.json', true);

export const cccUrl = (para: number) => `https://www.scborromeo.org/ccc/para/${para}.htm`;
export const CCC_OFFICIAL = 'https://www.vatican.va/archive/ENG0015/_INDEX.HTM';

export interface Entity { id: string; name: string; kind: 'person' | 'place'; aliases: string[]; passages: string[] }
export const getEntities = () => getJson<Entity[]>('doctrine/entities.json', true);

/** [c1, v1, c2, v2, text] */
export type HaydockEntry = [number, number, number, number, string];
export interface ChallonerBook {
  intro: string;
  chapters: Record<string, string>;
  notes: [number, number, number, number, string][];
}
export const getChalloner = (book: string) => getJson<ChallonerBook>(`commentary/challoner/${book}.json`, true);
export const getHaydock = (book: string) => getJson<HaydockEntry[]>(`commentary/haydock/${book}.json`, true);

/** [c1, v1, c2, v2, resourceId] */
export type ResourceRef = [number, number, number, number, string];
export interface ResourceRow {
  id: string;
  source: string;
  type: string;
  title: string;
  url: string;
  author?: string;
  date?: string;
  how: 'publisher-supplied' | 'human-reviewed' | 'url-slug' | 'feed-lectionary' | 'url-pattern';
  note?: string;
  tags?: string[];
  show?: string;
  basis?: 'page-read' | 'title-and-summary' | 'lectionary-confirmed' | 'lectionary-date' | 'url-pattern';
  audio?: string;
  reviewedBy?: string;
  reviewedOn?: string;
}
export interface ResourceSource {
  id: string;
  name: string;
  kind: string;
  site: string;
  section: string;
  policy?: string;
  search?: string;
  youtubeQuery?: string;
  podcastQuery?: string;
  group?: 'creators' | 'scholars';
}
export const getResourceSources = () => getJson<ResourceSource[]>('resources/sources.json', true);
export const getResourceRefs = (book: string) => getJson<ResourceRef[]>(`resources/${book}.json`, true);
export const getResourceCatalog = () => getJson<Record<string, ResourceRow>>('resources/catalog.json', true);

/** [c1, v1, c2, v2, documentIndex, articleNumber] */
export type MagisteriumRef = [number, number, number, number, number, number];
export interface MagisteriumDoc {
  id: string;
  title: string;
  short: string;
  author: string;
  date: string;
  kind: string;
  focus: string;
  url: string;
  era: string;
  articles: number;
  citations: number;
}
export const getMagisteriumRefs = (book: string) => getJson<MagisteriumRef[]>(`magisterium/${book}.json`, true);
export const getMagisteriumIndex = () => getJson<{ generated: string; documents: MagisteriumDoc[] }>('magisterium/index.json', true);

export interface Place {
  n: string;
  r?: string;
  lat: number;
  lon: number;
  /** approximate location */
  a?: 1;
  c?: string;
  v: string[];
  nv: number;
}
export const getPlaces = () => getJson<(Place | null)[]>('maps/places.json', true);
/** [chapter, verse, placeIndex] in anchor numbering */
export const getPlacesByBook = (book: string) => getJson<[number, number, number][]>(`maps/by-book/${book}.json`, true);
export const getTopicIndex = () => getJson<[string, number][]>('topics/index.json', true);
export const getTopics = () => getJson<Record<string, [string, number][]>>('topics/topics.json', true);
/** [c1, v1, c2, v2, topicIndex, score] */
export const getTopicsByBook = (book: string) => getJson<[number, number, number, number, number, number][]>(`topics/by-book/${book}.json`, true);
export const getAttributions = () => Promise.all([getJson<{ attribution: string }>('maps/_meta.json', true), getJson<{ attribution: string }>('topics/_meta.json', true)]);
