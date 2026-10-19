import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FEATURES, STATUS_LABEL } from '../src/featureStatus';
import { ROOT } from './ingest/lib/util';

const lines = ['# Feature status', '', 'Generated from `src/featureStatus.ts` (`npm run docs:status`). The same table is shown in the app under About.', ''];
let area = '';
for (const f of FEATURES) {
  if (f.area !== area) {
    area = f.area;
    lines.push('', `## ${area}`, '', '| Feature | Status | Notes |', '|---|---|---|');
  }
  lines.push(`| ${f.name} | **${STATUS_LABEL[f.status]}** | ${f.detail} |`);
}
writeFileSync(join(ROOT, 'docs/FEATURE_STATUS.md'), lines.join('\n') + '\n');
