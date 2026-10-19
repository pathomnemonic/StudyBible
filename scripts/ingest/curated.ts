import { join } from 'node:path';
import { CURATED, PUBLIC_DATA, REGISTRY, readJson, Report, writeJson } from './lib/util';
import { parseRefId } from '../../src/lib/refs';

/** Copy hand-curated registries into public/data after validating them. Only *verified* Catechism links ship. */
export function buildCurated(report: Report) {
  const doctrine = readJson(join(CURATED, 'doctrine.json'));
  for (const t of doctrine.topics) {
    for (const r of t.scripture) if (!parseRefId(r)) report.error(`doctrine topic ${t.id}: bad passage id ${r}`);
    for (const d of t.docs) if (!doctrine.documents[d]) report.error(`doctrine topic ${t.id}: unknown document ${d}`);
    for (const rel of t.related) if (!doctrine.topics.some((x: any) => x.id === rel)) report.error(`doctrine topic ${t.id}: unknown related topic ${rel}`);
  }
  writeJson(join(PUBLIC_DATA, 'doctrine/doctrine.json'), doctrine);

  const ccc = readJson(join(CURATED, 'ccc-links.json'));
  const verified = ccc.links.filter((l: any) => l.verified);
  const dropped = ccc.links.length - verified.length;
  if (dropped) report.warn(`ccc-links: ${dropped} unverified link(s) not shipped; run npm run verify:ccc`);
  for (const l of verified) if (!parseRefId(l.ref)) report.error(`ccc link bad ref ${l.ref}`);
  writeJson(join(PUBLIC_DATA, 'doctrine/ccc-links.json'), { links: verified.map((l: any) => ({ ref: l.ref, para: l.para, kind: l.kind, verifiedOn: l.verifiedOn })) });

  const overviews = readJson(join(CURATED, 'book-overviews.json'));
  writeJson(join(PUBLIC_DATA, 'doctrine/book-overviews.json'), overviews.overviews);
  const ent = readJson(join(CURATED, 'entities.json'));
  for (const e of ent.entities) for (const r of e.passages) if (!parseRefId(r)) report.error(`entity ${e.id}: bad passage ${r}`);
  writeJson(join(PUBLIC_DATA, 'doctrine/entities.json'), ent.entities);
  writeJson(join(PUBLIC_DATA, 'registry/sources.json'), readJson(join(REGISTRY, 'sources.json')));
  writeJson(join(PUBLIC_DATA, 'registry/authors.json'), readJson(join(REGISTRY, 'authors.json')));
  report.stats['curated'] = { topics: doctrine.topics.length, cccLinksShipped: verified.length };
}
