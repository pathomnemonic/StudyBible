import { readFileSync } from 'node:fs';
import { parsePlainText } from './plaintext';
const [file, cfgJson] = process.argv.slice(2);
const cfg = JSON.parse(cfgJson);
const secs = parsePlainText(readFileSync('data/raw/' + file, 'utf8'), cfg);
const w = secs.map((s) => s.paras.join(' ').split(/\s+/).length);
console.log(secs.length, 'sections; total words', w.reduce((a, b) => a + b, 0));
secs.forEach((s, i) => console.log(i + 1, w[i], s.title));
