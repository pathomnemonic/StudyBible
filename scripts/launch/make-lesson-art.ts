// Gives every catechism lesson up to four public-domain pictures from the artworks we already bundle (Doré engravings, Gothic Bible
// miniatures and museum paintings): first the pictures of the very passage the lesson reads, then pictures of what the lesson is about.
// Writes public/data/curriculum/lesson-art.json: { [lessonId]: artId[] }.   Run: npx tsx scripts/launch/make-lesson-art.ts
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseRefs, type Ref } from '../../src/lib/refs';

const root = process.cwd();
const dir = join(root, 'public/data/curriculum');
interface Art { id: string; title: string; theme: string; refs: string[]; artist: string }
const norm = (w: any): Art => ({ id: String(w.id), title: String(w.title ?? ''), theme: String(w.theme ?? ''), refs: Array.isArray(w.refs) ? w.refs : [], artist: String(w.artist ?? '') });
const arts: Art[] = [...JSON.parse(readFileSync(join(root, 'public/data/art.json'), 'utf8')).works, ...JSON.parse(readFileSync(join(root, 'public/data/art-more.json'), 'utf8')).works].map(norm);

/** pictures a child should not meet: killing, torture, the dead, sexual scenes */
const HARD = /massacre|slain|slaughter|death of|killed|behead|head of|burn|hang|stone[ds]?\b|martyrdom|lament|crucifix|entomb|scourg|thorns|falls beneath|christ shown|destruction|plague|sodom|lot and|bathsheba|susanna|tamar|samson|delilah|jael|judith|holofernes|rizpah|gideon.s sons|sacrifice of|nails|pilate|descent from|deposition|pietà|pieta|apocalypse|four horsemen|babylon|beast|dragon|whore|adulter|ahaziah|jezebel|athaliah|sennacherib|vashti|haman|agag|saul.*(sword|death)|death|dead|corpse|tears of saint peter/i;
/** never shown to anyone: titles that need a scholar's context */
const NEVER = /lot and his daughters|landscape with bathsheba|rizpah|susanna and the elders|tamar/i;

const spans = (s: string): Ref[] => s.split(';').flatMap((x) => { const p = parseRefs(x.trim()); return p.ok ? p.refs.map((r) => r.ref) : []; });
const overlap = (a: Ref, b: Ref) => a.book === b.book && a.c1 <= (b.c2 ?? b.c1) && b.c1 <= (a.c2 ?? a.c1);
const exactish = (a: Ref, b: Ref) => overlap(a, b) && (a.v1 === undefined || b.v1 === undefined || (a.c1 === b.c1 && a.v1 <= (b.v2 ?? b.v1 ?? 999) && (b.v1 ?? 0) <= (a.v2 ?? a.v1 ?? 999)));

/** what a lesson is about (a regular expression over its title, idea and words) -> which pictures fit (over title and theme) */
const RULES: { when: RegExp; art: RegExp; w: number }[] = [
  { when: /eucharist|mass\b|bread|real presence|last supper|communion|altar|tabernacle|host\b/i, art: /last supper|emmaus|manna|supper|passover|melchizedek/i, w: 1 },
  { when: /baptis|water|born again|font|initiation|jordan/i, art: /baptism|baptis|jordan|john the baptist|naaman|noah|flood|red sea|crossing/i, w: 1 },
  { when: /mary\b|annunciation|hail mary|rosary|mother of god|immaculate|visitation|assumption/i, art: /annunciation|visitation|madonna|virgin|nativity|presentation|hannah|mary/i, w: 1 },
  { when: /creat|made us|world|cosmos|beginning|garden|eden|stewardship|nature/i, art: /creation|eden|adam and eve|paradise|origins|noah|light/i, w: 1 },
  { when: /\bsin\b|fall\b|adam|eve\b|original|temptation|mortal|venial|conscience/i, art: /adam and eve|eden|temptation|cain|babel|prodigal/i, w: 1 },
  { when: /resurrect|easter|risen|rise\b|empty tomb|eternal life|new life|last things|heaven/i, art: /resurrection|noli|ascension|emmaus|appearance/i, w: 1 },
  { when: /\bcross|passion|redempt|sacrifice|atone|suffering|lent|salvation/i, art: /crucifixion|passion|cross|entomb|lamentation|gethsemane|arrest/i, w: 1 },
  { when: /incarnation|christmas|nativity|advent|emmanuel|jesus is born|infancy|holy family|epiphany|magi/i, art: /nativity|magi|shepherds|flight into egypt|presentation|childhood|holy family|annunciation/i, w: 1 },
  { when: /holy spirit|pentecost|confirmation|church\b|apostles|acts\b|mission|evangeli/i, art: /pentecost|acts|apostle|paul|peter|stephen|conversion|philip|ascension/i, w: 1 },
  { when: /commandment|law\b|moses|covenant|sinai|decalogue|moral|virtue|beatitude/i, art: /moses|exodus|sinai|commandments|ten commandments|covenant|sermon|teaching of jesus/i, w: 1 },
  { when: /mercy|forgive|reconcil|confession|penance|contrition|repent|prodigal/i, art: /prodigal|woman caught|forgive|zacchaeus|peter.*(tears|denial)|good samaritan|denial of peter/i, w: 1 },
  { when: /neighbo|charity|poor|alms|works of mercy|justice|solidarity|common good|service|generos/i, art: /good samaritan|lazarus|rich man|widow|poor|ruth|feed|loaves|washing/i, w: 1 },
  { when: /prayer|pray\b|psalm|our father|worship|praise|adoration|silence|contemplat|lectio/i, art: /psalm|david|gethsemane|hannah|solomon|temple|anna|simeon/i, w: 1 },
  { when: /bible|scripture|gospel|inspired|canon|word of god|revelation|tradition|lectio/i, art: /evangelist|initial|letters|john.*writing|jerome|moses|isaiah|prophet/i, w: 1 },
  { when: /angel|guardian|michael|gabriel|raphael|tobit|tobias/i, art: /angel|tobit|tobias|annunciation|jacob.*ladder|raphael/i, w: 1 },
  { when: /king\b|david|solomon|messiah|christ the king|throne|kingdom/i, art: /david|solomon|kingdom|kings|anoint|temple|entry into jerusalem/i, w: 1 },
  { when: /prophet|isaiah|jeremiah|elijah|exile|return|john the baptist|advent/i, art: /prophet|isaiah|jeremiah|elijah|elisha|daniel|ezekiel|jonah|exile|john the baptist/i, w: 1 },
  { when: /abraham|faith|trust|promise|patriarch|isaac|jacob|joseph|israel/i, art: /abraham|isaac|jacob|joseph|patriarch|rebekah|hagar/i, w: 1 },
  { when: /marriage|matrimony|wedding|family|spouse|love and|chastity|vocation|holy orders|priest/i, art: /cana|isaac and rebekah|holy family|ruth|tobias|wedding|marriage|temple|presentation/i, w: 1 },
  { when: /heal|anoint|sick|miracle|sacrament of|lazarus|blind|cure/i, art: /heal|miracle|lazarus|blind|centurion|canaanite|raising|paralytic|leper/i, w: 1 },
  { when: /saint|martyr|holiness|hero|witness|stephen|paul\b|peter\b|apostle/i, art: /stephen|paul|peter|philip|apostle|conversion|acts|evangelist/i, w: 1 },
  { when: /trinity|father|son and|three persons|god is one|who is god|divine/i, art: /baptism|annunciation|creation|transfiguration|pentecost|abraham.*(three|angels)|light/i, w: 1 },
  { when: /judgment|hell|purgatory|last judgment|death|end times|second coming|apocalyps/i, art: /revelation|resurrection|ascension|lazarus|rich man|last judgment/i, w: 1 },
  { when: /parable|kingdom of god|teaching|sermon|disciple|follow/i, art: /parable|teaching|sower|prodigal|samaritan|sermon|gospel ministry|ministry/i, w: 1 },
];
const PILLAR_FALLBACK: Record<string, RegExp> = { creed: /creation|nativity|resurrection|ministry|madonna/i, sacrament: /last supper|baptism|emmaus|manna/i, moral: /moses|sermon|samaritan|teaching|prodigal/i, prayer: /psalm|david|gethsemane|hannah|solomon/i };
const pillarKey = (p: string) => (/creed|revel|faith|god|trinity|christ|church|mary|last/i.test(p) ? 'creed' : /sacrament|liturg|worship|mass|eucharist/i.test(p) ? 'sacrament' : /moral|life|commandment|virtue|beatitude|justice|vocation/i.test(p) ? 'moral' : /prayer|pray/i.test(p) ? 'prayer' : 'creed');

const used = new Map<string, number>();
const out: Record<string, string[]> = {};
const stats: Record<string, { n: number; any: number; byRef: number }> = {};
for (const f of readdirSync(dir).filter((x) => /^grade-.*\.json$/.test(x)).sort()) {
  const g = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const kid = g.band === 'primary' || g.band === 'elementary';
  const s = (stats[g.band] ??= { n: 0, any: 0, byRef: 0 });
  for (const u of g.units) for (const l of u.lessons) {
    s.n++;
    const text = [l.title, l.idea, l.question, (l.vocab ?? []).join(' '), u.title].join(' ');
    const own = spans(l.scripture ?? '');
    const rules = RULES.filter((r) => r.when.test(text));
    const scored = arts.filter((a) => !NEVER.test(a.title) && !(kid && HARD.test(a.title))).map((a) => {
      let sc = 0; let ref = false;
      const theirs = a.refs.flatMap((r) => spans(r));
      if (theirs.some((t) => own.some((o) => exactish(t, o)))) { sc += 100; ref = true; }
      else if (theirs.some((t) => own.some((o) => overlap(t, o)))) sc += 45;
      for (const r of rules) if (r.art.test(a.title) || r.art.test(a.theme)) sc += 60 * r.w;
      if (sc === 0) { const fb = PILLAR_FALLBACK[pillarKey(u.pillar)]; if (fb && (fb.test(a.title) || fb.test(a.theme))) sc += 8; }
      return { a, sc, ref };
    }).filter((x) => x.sc > 0);
    const picked: typeof scored = []; const themes = new Set<string>();
    while (picked.length < 4) {
      let best: (typeof scored)[number] | null = null; let bestV = -1e9;
      for (const c of scored) {
        if (picked.includes(c)) continue;
        const v = c.sc - (c.ref ? 0 : 14 * (used.get(c.a.id) ?? 0)) - (themes.has(c.a.theme) ? 18 : 0);
        if (v > bestV) { bestV = v; best = c; }
      }
      if (!best || bestV < 14) break;
      picked.push(best); themes.add(best.a.theme);
    }
    if (picked.length) { out[l.id] = picked.map((p) => p.a.id); s.any++; if (picked.some((p) => p.ref)) s.byRef++; for (const p of picked) used.set(p.a.id, (used.get(p.a.id) ?? 0) + 1); }
  }
}
writeFileSync(join(dir, 'lesson-art.json'), JSON.stringify(out));
const top = [...used.entries()].sort((x, y) => y[1] - x[1]).slice(0, 5);
console.log(JSON.stringify(stats), 'distinct pictures used:', used.size, 'most reused:', top.map(([i, n]) => `${i}×${n}`).join(' '));
