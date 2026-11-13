import { readFileSync } from 'node:fs';
import { loadVersification } from '../../src/lib/versification';
import { Report } from '../ingest/lib/util';
import { buildBiay } from '../ingest/biay';
import { buildManifest } from '../ingest/manifest';

/**
 * Rebuilds the Bible in a Year episode list from the feed saved at data/raw/biay.rss.xml, then the offline-pack manifest.
 * The scheduled deploy fetches the feed first (see .github/workflows/pages.yml). Run:  npx tsx scripts/podcasts/refresh-biay.ts
 */
loadVersification(JSON.parse(readFileSync('public/data/versification.json', 'utf8')));
const report = new Report();
buildBiay(report);
buildManifest();
console.log('Bible in a Year refreshed.');
