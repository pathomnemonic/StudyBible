// Fetches the canonized saints from Wikidata (public, CC0) into scripts/deepwaters/cache/saints-wikidata.json, once, so the build never needs the network.
//   npx tsx scripts/deepwaters/wikidata-saints.ts
// Each saint: English label, aliases, the number of Wikipedia language editions that have an article (a cheap, offline stand-in for how well known a person is),
// sex, occupations, countries, religious order and year of death. Nothing here is used by the game directly: scripts/deepwaters/saint-categories.ts turns it into lists.
import { writeFileSync } from 'node:fs';

const ENDPOINT = 'https://query.wikidata.org/sparql';
async function sparql(query: string): Promise<Record<string, { value: string }>[]> {
  const res = await fetch(`${ENDPOINT}?query=${encodeURIComponent(query)}`, { headers: { Accept: 'application/sparql-results+json', 'User-Agent': 'cathology-build/0.1 (offline list builder)' } });
  if (!res.ok) throw new Error(`Wikidata ${res.status}`);
  return (await res.json()).results.bindings;
}
const Q = (id: string) => id.split('/').pop()!;
// Wikidata tags canonization four ways: saint, Catholic saint, pre-congregation saint, canonized saint
const SAINTS = 'VALUES ?st { wd:Q43115 wd:Q3464126 wd:Q18344276 wd:Q123110154 } ?s wdt:P411 ?st . ?s wdt:P31 wd:Q5 .';

const base = await sparql(`SELECT ?s ?sL ?sl (MIN(?sx) AS ?sex) (MIN(?d) AS ?death) WHERE { ${SAINTS} ?s rdfs:label ?sL FILTER(LANG(?sL)="en") ?s wikibase:sitelinks ?sl OPTIONAL { ?s wdt:P21 ?sx } OPTIONAL { ?s wdt:P570 ?d } } GROUP BY ?s ?sL ?sl`);
const saints: Record<string, { label: string; links: number; sex?: string; death?: number; aliases: string[]; occ: string[]; country: string[]; order: string[] }> = {};
for (const b of base) saints[Q(b.s.value)] = { label: b.sL.value, links: Number(b.sl.value), sex: b.sex ? Q(b.sex.value) : undefined, death: b.death ? Number(b.death.value.slice(0, b.death.value.startsWith('-') ? 5 : 4)) : undefined, aliases: [], occ: [], country: [], order: [] };
const multi = async (prop: string, key: 'occ' | 'country' | 'order') => {
  for (const b of await sparql(`SELECT ?s ?vL WHERE { ${SAINTS} ?s wdt:${prop} ?v . ?v rdfs:label ?vL FILTER(LANG(?vL)="en") }`)) { const s = saints[Q(b.s.value)]; if (s && !s[key].includes(b.vL.value)) s[key].push(b.vL.value); }
};
await multi('P106', 'occ'); await multi('P27', 'country'); await multi('P611', 'order');
for (const b of await sparql(`SELECT ?s ?a WHERE { ${SAINTS} ?s skos:altLabel ?a FILTER(LANG(?a)="en") }`)) { const s = saints[Q(b.s.value)]; if (s && !s.aliases.includes(b.a.value)) s.aliases.push(b.a.value); }
writeFileSync(new URL('./cache/saints-wikidata.json', import.meta.url).pathname, JSON.stringify(saints));
console.log(`saved ${Object.keys(saints).length} saints`);
