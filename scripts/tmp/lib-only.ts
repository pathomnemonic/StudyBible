import { buildLibrary } from '../ingest/library';
import { Report } from '../ingest/lib/util';
const report = new Report();
buildLibrary(report);
console.log(JSON.stringify(report.stats, null, 1).split('\n').filter((l) => /library\.(ignatius|julian|teresa-life|desales|hilton|anselm|therese|rolle|kempis|roman|baltimore|total)/.test(l)).join('\n'));
console.log('warnings', report.warnings.length, report.warnings.slice(0, 20), 'errors', report.errors);
