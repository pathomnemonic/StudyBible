import { join } from 'node:path';
import { fetchAll } from './fetch';
import { buildBible } from './bible';
import { buildXrefs } from './xrefs';
import { buildCatena } from './catena';
import { buildBiay } from './biay';
import { buildLibrary } from './library';
import { buildHaydock } from './haydock';
import { buildChalloner } from './challoner';
import { buildTerms } from './terms';
import { buildDaily } from './daily';
import { buildLectionary } from './lectionary';
import { buildLens } from './lens';
import { buildExternal } from './external';
import { buildManifest } from './manifest';
import { buildChurchDocs } from './church';
import { buildOriginal } from './original';
import { buildPlaces, buildTopics } from './reference';
import { buildEditorial } from './editorial';
import { buildCurated } from './curated';
import { loadVersification } from '../../src/lib/versification';
import { PROVENANCE, Report, today, writeJson } from './lib/util';

async function main() {
  const [cmd = 'all', ...rest] = process.argv.slice(2);
  const report = new Report();
  const run = async (name: string, fn: () => Promise<void> | void) => {
    const t0 = Date.now();
    console.log(`\n== ${name}`);
    try {
      await fn();
    } catch (e: any) {
      report.error(`${name}: ${e.stack ?? e}`);
    }
    console.log(`   ${name} done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  };
  if (cmd === 'validate') {
    const { execSync } = await import('node:child_process');
    execSync('npx vitest run tests/data.test.ts', { stdio: 'inherit' });
    return;
  }
  if (cmd === 'fetch' || cmd === 'all') await run('fetch', () => fetchAll(rest));
  if (cmd === 'build' || cmd === 'all') {
    await run('bible', () => {
      const { vers } = buildBible(report);
      loadVersification(vers);
    });
    await run('xrefs', () => buildXrefs(report));
    await run('catena', () => buildCatena(report));
    await run('biay', () => buildBiay(report));
    await run('haydock', () => buildHaydock(report));
    await run('challoner', () => buildChalloner(report));
    await run('library', () => buildLibrary(report));
    await run('curated', () => buildCurated(report));
    await run('church', () => buildChurchDocs(report));
    await run('original', () => buildOriginal(report));
    await run('places', () => buildPlaces(report));
    await run('topics', () => buildTopics(report));
    await run('editorial', () => buildEditorial(report));
    await run('lens', () => buildLens(report));
    await run('terms', () => buildTerms(report));
    await run('daily', () => buildDaily(report));
    await run('lectionary', () => buildLectionary(report));
    await run('external', () => buildExternal(report));
    await run('manifest', () => buildManifest());
  }
  if (cmd === 'build' || cmd === 'all') {
    writeJson(join(PROVENANCE, 'build-report.json'), { generated: today(), errors: report.errors, warnings: report.warnings.slice(0, 500), warningCount: report.warnings.length, stats: report.stats }, true);
    console.log(`\nwarnings: ${report.warnings.length}, errors: ${report.errors.length}`);
    for (const e of report.errors) console.error('ERROR', e);
    if (report.errors.length) process.exit(1);
  }
}
main();
