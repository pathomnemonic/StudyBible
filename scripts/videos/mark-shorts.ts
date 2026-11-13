// One-off backfill: marks the Shorts among each creator's newest videos (the ones the Feed can show). New uploads are marked by refresh.ts.
// Run: npx tsx scripts/videos/mark-shorts.ts [perChannel=40]
import { readFileSync, writeFileSync } from 'node:fs';
import { buildManifest } from '../ingest/manifest';
import { markShorts, type LibVideo } from './refresh';

const LIB = 'public/data/media/video_library.json';
const per = +(process.argv[2] ?? 40);
const lib = JSON.parse(readFileSync(LIB, 'utf8')) as { videos: LibVideo[] };
const seen = new Map<number, number>();
const todo = lib.videos.filter((v) => { const n = seen.get(v[2]) ?? 0; seen.set(v[2], n + 1); return n < per; });
const n = await markShorts(todo);
writeFileSync(LIB, JSON.stringify(lib)); buildManifest();
console.log(`checked ${todo.length}, marked ${n} Shorts`);
