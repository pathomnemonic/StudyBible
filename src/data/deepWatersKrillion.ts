import type { DeepAnswer, DeepPrompt } from './deepWaters';
import GENERATED_PROMPTS from './deepWaters.generated.json';
import { deepTokens } from '../lib/deepWatersTokens';

/** 2,416 accessible Krillion-style prompts built from the app's shipped Catholic/Bible answer corpora. */
type SourceAnswer = { answer: string; tier: 1|2|3|4|5|6; aliases?: string[] };
const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
const clean = (s: string) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const key = (s: string) => deepTokens(s).join(' ');
const unique = (xs: SourceAnswer[]) => {
  const seen = new Set<string>();
  return xs.filter((x) => { const k = key(x.answer); if (!k || seen.has(k)) return false; seen.add(k); return true; })
    .filter((x) => x.answer.trim().split(/\s+/).length <= 4);
};
const raw = GENERATED_PROMPTS as Array<{id:string; answers:SourceAnswer[]}>;
const pools = [
  { key: 'saint', label: 'saint', theme: 'saints' as const, source: 'App-shipped saints reference corpus (saints-any in deepWaters.generated.json)', answers: unique(raw.find((x) => x.id === 'saints-any')!.answers) },
  { key: 'place', label: 'biblical place', theme: 'places' as const, source: 'App-shipped OpenBible place corpus by biblical book (places-* in deepWaters.generated.json)', answers: unique(raw.filter((x) => x.id.startsWith('places-')).flatMap((x) => x.answers)) },
];
const candidates: Array<{pool: typeof pools[number]; kind:string; prompt:string; answers:SourceAnswer[]}> = [];
function add(pool: typeof pools[number], kind: string, phrase: string, test: (name:string)=>boolean) {
  const answers = pool.answers.filter((a) => test(clean(a.answer)));
  if (answers.length < 25) return;
  const canonical = new Set(answers.map((a)=>key(a.answer)));
  if (!answers.some((a) => (a.aliases ?? []).some((alias) => alias.trim().split(/\s+/).length <= 4 && key(alias) !== key(a.answer) && !canonical.has(key(alias))))) return;
  candidates.push({ pool, kind, prompt: 'Name a ' + pool.label + ' ' + phrase + '.', answers });
}
for (const pool of pools) {
  const s = (name:string) => clean(name);
  for (const x of letters) {
    add(pool,'contains','containing the letter ' + x.toUpperCase(),a=>s(a).includes(x));
    add(pool,'starts','starting with ' + x.toUpperCase(),a=>s(a).startsWith(x));
    add(pool,'ends','ending with ' + x.toUpperCase(),a=>s(a).endsWith(x));
    add(pool,'double','containing ' + x.toUpperCase() + ' twice',a=>(s(a).split(x).length-1)>=2);
  }
  for (const x of letters) for (const y of letters) if (x!==y) {
    add(pool,'both','containing both ' + x.toUpperCase() + ' and ' + y.toUpperCase(),a=>s(a).includes(x)&&s(a).includes(y));
    add(pool,'either','containing ' + x.toUpperCase() + ' or ' + y.toUpperCase(),a=>s(a).includes(x)||s(a).includes(y));
    add(pool,'not','containing ' + x.toUpperCase() + ' but not ' + y.toUpperCase(),a=>s(a).includes(x)&&!s(a).includes(y));
    add(pool,'ordered','with ' + x.toUpperCase() + ' before ' + y.toUpperCase(),a=>s(a).indexOf(x)>=0&&s(a).indexOf(y)>s(a).indexOf(x));
    add(pool,'startcontains','starting with ' + x.toUpperCase() + ' and containing ' + y.toUpperCase(),a=>s(a).startsWith(x)&&s(a).includes(y));
    add(pool,'endcontains','ending with ' + x.toUpperCase() + ' and containing ' + y.toUpperCase(),a=>s(a).endsWith(x)&&s(a).includes(y));
    add(pool,'xor','containing exactly one of ' + x.toUpperCase() + ' and ' + y.toUpperCase(),a=>s(a).includes(x)!==s(a).includes(y));
  }
  for(let i=0;i<26;i++)for(let j=i+1;j<26;j++)for(let k=j+1;k<26;k++){
    const x=letters[i],y=letters[j],z=letters[k];
    add(pool,'tripleall','containing all three letters ' + x.toUpperCase() + ', ' + y.toUpperCase() + ' and ' + z.toUpperCase(),a=>s(a).includes(x)&&s(a).includes(y)&&s(a).includes(z));
    add(pool,'tripleany','containing at least one of ' + x.toUpperCase() + ', ' + y.toUpperCase() + ' or ' + z.toUpperCase(),a=>s(a).includes(x)||s(a).includes(y)||s(a).includes(z));
  }
  for(let n=4;n<=24;n++){
    add(pool,'length','with exactly ' + n + ' letters',a=>a.replace(/[^a-z]/gi,'').length===n);
    add(pool,'atleast','with at least ' + n + ' letters',a=>a.replace(/[^a-z]/gi,'').length>=n);
  }
  for(let n=1;n<=5;n++) add(pool,'words','with exactly ' + n + ' words',a=>a.trim().split(/\s+/).length===n);
}
const uniquePrompts = [...new Map(candidates.map((c)=>[c.prompt,c])).values()];
const selected: typeof candidates = [];
for (const poolKey of ['saint','place']) {
  const buckets = new Map<string,typeof candidates>();
  for (const c of uniquePrompts.filter((x)=>x.pool.key===poolKey)) {
    if(!buckets.has(c.kind)) buckets.set(c.kind,[]);
    buckets.get(c.kind)!.push(c);
  }
  const kinds=[...buckets.keys()]; let cursor=0;
  const target = poolKey === 'saint' ? 1200 : 1216;
  while(selected.filter((x)=>x.pool.key===poolKey).length<target && kinds.some((k)=>buckets.get(k)!.length)) {
    const kind=kinds[cursor++%kinds.length], bucket=buckets.get(kind)!;
    if(bucket.length) selected.push(bucket.shift()!);
  }
}
if(selected.length!==2416) throw new Error('Expected 2,416 complete prompts, generated ' + selected.length);
const prompts: DeepPrompt[] = selected.map((c,index)=>{
  const ordered=[...c.answers].sort((a,b)=>a.tier-b.tier||a.answer.localeCompare(b.answer));
  const canonical = new Set(ordered.map((a)=>key(a.answer)));
  const aliasKeys = new Set<string>();
  const answers:DeepAnswer[]=ordered.map((a,i)=>{
    const pct=(i+1)/ordered.length;
    const tier=(pct<=0.08?1:pct<=0.20?2:pct<=0.40?3:pct<=0.65?4:pct<=0.90?5:6) as DeepAnswer['tier'];
    const aliases=(a.aliases??[]).filter((x)=>x.trim().split(/\s+/).length<=4 && key(x)!==key(a.answer) && !canonical.has(key(x)) && !aliasKeys.has(key(x)));
    if(aliases.length) aliasKeys.add(key(aliases[0]));
    return {answer:a.answer,tier,...(aliases.length?{aliases:[aliases[0]]}:{})};
  });
  return {id:'krillion-' + c.pool.key + '-' + String(index+1).padStart(4,'0'),theme:c.pool.theme,source:c.pool.source,status:'draft',prompt:c.prompt,context:'A quick category-and-letter challenge. Answers are drawn from the app-shipped reference corpus; this open list is not claimed to exhaust all valid real-world answers.',answers};
});
export const KRILLION_PROMPTS: DeepPrompt[] = prompts;
