import type { DeepAnswer, DeepPrompt, DeepTheme } from './deepWaters';
import type { FactRule, Pool } from '../lib/deepWatersDerive';
import { deepTokens } from '../lib/deepWatersTokens';
import { BOOKS } from '../lib/canon';

/**
 * The lists that the derived Basilion questions are worked out from (see src/lib/deepWatersDerive.ts). Most are the lists of the hand-written and generated
 * questions already in the bank, read again by rule; the rest are small complete lists written here: the words of the common prayers and Scripture passages
 * (public-domain English texts), the parts of the Mass, and the popes since 1500.
 */

/* ---------- the words of a text ---------- */

/** the words of a short text as answers: each distinct word once; tier by how short, so the easy words come first */
function wordPool(id: string, title: string, theme: DeepTheme, text: string): Pool {
  const seen = new Set<string>();
  const answers: DeepAnswer[] = [];
  const times = new Map<string, number>();
  for (const raw of text.replace(/[—–]/g, ' ').split(/\s+/)) { const w = raw.replace(/[^A-Za-z'’]/g, '').replace(/['’]s$/, '').toLowerCase(); if (w) times.set(w, (times.get(w) ?? 0) + 1); }
  const facts: Record<string, Record<string, number | string>> = {};
  for (const raw of text.replace(/[—–]/g, ' ').split(/\s+/)) {
    const w = raw.replace(/[^A-Za-z'’]/g, '').replace(/['’]s$/, '');
    if (!w || w.length < 2) continue;
    const lower = w.toLowerCase();
    // words the game's matcher ignores can never be typed as an answer, and Roman-numeral-looking words would be read as numbers
    if (deepTokens(lower).length === 0 || /^[ivxlcdm]+$/.test(lower)) continue;
    const key = deepTokens(lower).join(' ');
    if (seen.has(key)) continue;
    seen.add(key);
    const n = lower.length;
    answers.push({ answer: lower, tier: (n <= 4 ? 1 : n <= 6 ? 2 : n <= 8 ? 3 : n <= 10 ? 4 : n <= 12 ? 5 : 6) as DeepAnswer['tier'] });
    facts[lower] = { times: times.get(lower) ?? 1 };
  }
  const freq = (kind: string, key: string, text: string, test: (n: number) => boolean): FactRule => ({ kind, key, text, test: (f) => test(f.times as number), min: 5 });
  return {
    id, noun: `word in ${title}`, theme, closed: true, answers, part: 'word', facts,
    factRules: [
      freq('freq', 'twice', `Name a word that appears more than once in ${title}.`, (n) => n >= 2),
      freq('freq', 'three', `Name a word that appears three or more times in ${title}.`, (n) => n >= 3),
      freq('freq', 'once', `Name a word that appears only once in ${title}.`, (n) => n === 1),
    ],
  };
}

const TEXTS: [string, string, DeepTheme, string][] = [
  ['our-father', 'the Our Father', 'devotion', 'Our Father, who art in heaven, hallowed be thy name; thy kingdom come, thy will be done on earth as it is in heaven. Give us this day our daily bread, and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.'],
  ['hail-mary', 'the Hail Mary', 'devotion', 'Hail Mary, full of grace, the Lord is with thee; blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.'],
  ['glory-be', 'the Glory Be', 'devotion', 'Glory be to the Father, and to the Son, and to the Holy Spirit, as it was in the beginning, is now, and ever shall be, world without end. Amen.'],
  ['apostles-creed', 'the Apostles’ Creed', 'doctrine', 'I believe in God, the Father almighty, creator of heaven and earth. I believe in Jesus Christ, his only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; he descended into hell; on the third day he rose again from the dead; he ascended into heaven, and is seated at the right hand of God the Father almighty; from there he will come to judge the living and the dead. I believe in the Holy Spirit, the holy catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.'],
  ['hail-holy-queen', 'the Hail Holy Queen', 'devotion', 'Hail, holy Queen, Mother of mercy, our life, our sweetness and our hope. To thee do we cry, poor banished children of Eve; to thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, thine eyes of mercy toward us, and after this our exile, show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary.'],
  ['memorare', 'the Memorare', 'devotion', 'Remember, O most gracious Virgin Mary, that never was it known that anyone who fled to thy protection, implored thy help, or sought thy intercession, was left unaided. Inspired by this confidence, I fly unto thee, O Virgin of virgins, my Mother; to thee do I come, before thee I stand, sinful and sorrowful. O Mother of the Word Incarnate, despise not my petitions, but in thy mercy hear and answer me. Amen.'],
  ['angel-of-god', 'the Guardian Angel prayer', 'devotion', 'Angel of God, my guardian dear, to whom God’s love commits me here, ever this day be at my side, to light and guard, to rule and guide. Amen.'],
  ['st-michael', 'the Prayer to Saint Michael', 'devotion', 'Saint Michael the Archangel, defend us in battle. Be our protection against the wickedness and snares of the devil. May God rebuke him, we humbly pray; and do thou, O Prince of the heavenly host, by the power of God, cast into hell Satan and all the evil spirits who prowl about the world seeking the ruin of souls. Amen.'],
  ['act-of-contrition', 'the Act of Contrition', 'devotion', 'O my God, I am heartily sorry for having offended thee, and I detest all my sins, because I dread the loss of heaven and the pains of hell; but most of all because they offend thee, my God, who art all good and deserving of all my love. I firmly resolve, with the help of thy grace, to sin no more and to avoid the near occasion of sin. Amen.'],
  ['anima-christi', 'the Anima Christi', 'devotion', 'Soul of Christ, sanctify me. Body of Christ, save me. Blood of Christ, inebriate me. Water from the side of Christ, wash me. Passion of Christ, strengthen me. O good Jesus, hear me. Within thy wounds hide me. Suffer me not to be separated from thee. From the malicious enemy defend me. In the hour of my death call me. And bid me come unto thee, that with thy saints I may praise thee for ever and ever. Amen.'],
  ['magnificat', 'the Magnificat', 'scripture', 'My soul doth magnify the Lord. And my spirit hath rejoiced in God my Saviour. Because he hath regarded the humility of his handmaid: for behold from henceforth all generations shall call me blessed. Because he that is mighty, hath done great things to me; and holy is his name. And his mercy is from generation unto generations, to them that fear him. He hath shewed might in his arm: he hath scattered the proud in the conceit of their heart. He hath put down the mighty from their seat, and hath exalted the humble. He hath filled the hungry with good things; and the rich he hath sent empty away. He hath received Israel his servant, being mindful of his mercy: As he spoke to our fathers, to Abraham and to his seed for ever.'],
  ['beatitudes', 'the Beatitudes', 'scripture', 'Blessed are the poor in spirit: for theirs is the kingdom of heaven. Blessed are the meek: for they shall possess the land. Blessed are they that mourn: for they shall be comforted. Blessed are they that hunger and thirst after justice: for they shall have their fill. Blessed are the merciful: for they shall obtain mercy. Blessed are the clean of heart: for they shall see God. Blessed are the peacemakers: for they shall be called the children of God. Blessed are they that suffer persecution for justice’ sake: for theirs is the kingdom of heaven.'],
  ['ten-commandments', 'the Ten Commandments', 'doctrine', 'I am the Lord thy God. Thou shalt not have strange gods before me. Thou shalt not take the name of the Lord thy God in vain. Remember to keep holy the Lord’s day. Honor thy father and thy mother. Thou shalt not kill. Thou shalt not commit adultery. Thou shalt not steal. Thou shalt not bear false witness against thy neighbor. Thou shalt not covet thy neighbor’s wife. Thou shalt not covet thy neighbor’s goods.'],
  ['psalm-23', 'Psalm 23', 'scripture', 'The Lord ruleth me, and I shall want nothing. He hath set me in a place of pasture. He hath brought me up, on the water of refreshment: he hath converted my soul. He hath led me on the paths of justice, for his own name’s sake. For though I should walk in the midst of the shadow of death, I will fear no evils, for thou art with me. Thy rod and thy staff, they have comforted me. Thou hast prepared a table before me against them that afflict me. Thou hast fattened my head with oil; and my chalice which inebriateth me, how goodly is it! And thy mercy will follow me all the days of my life. And that I may dwell in the house of the Lord, unto length of days.'],
];

/* ---------- the parts of the Mass ---------- */

const MASS: [string, number][] = [
  ['Introductory Rites', 3], ['Entrance Chant', 3], ['Entrance Procession', 3], ['Sign of the Cross', 1], ['Greeting', 2], ['Penitential Act', 3], ['Kyrie', 2], ['Gloria', 1], ['Collect', 3],
  ['Liturgy of the Word', 1], ['First Reading', 1], ['Responsorial Psalm', 2], ['Second Reading', 1], ['Gospel Acclamation', 3], ['Alleluia', 2], ['Gospel', 1], ['Homily', 1], ['Creed', 1], ['Profession of Faith', 3],
  ['Prayer of the Faithful', 2], ['Universal Prayer', 4], ['Liturgy of the Eucharist', 1], ['Preparation of the Gifts', 3], ['Offertory', 1], ['Offertory Procession', 3], ['Prayer over the Offerings', 4],
  ['Eucharistic Prayer', 2], ['Preface', 3], ['Preface Dialogue', 5], ['Sanctus', 2], ['Epiclesis', 5], ['Institution Narrative', 4], ['Consecration', 1], ['Memorial Acclamation', 3], ['Anamnesis', 5],
  ['Intercessions', 4], ['Doxology', 4], ['Great Amen', 3], ['Communion Rite', 2], ['Lord’s Prayer', 1], ['Embolism', 6], ['Sign of Peace', 1], ['Fraction Rite', 4], ['Lamb of God', 1], ['Agnus Dei', 2],
  ['Invitation to Communion', 4], ['Communion', 1], ['Communion Chant', 3], ['Prayer after Communion', 3], ['Concluding Rites', 2], ['Announcements', 2], ['Blessing', 1], ['Dismissal', 1], ['Recessional', 3], ['Silent Reflection', 4],
];

/* ---------- the popes since 1500 (the year each began) ---------- */

const POPES: [string, number, number][] = [
  ['Pius III', 1503, 6], ['Julius II', 1503, 4], ['Leo X', 1513, 3], ['Adrian VI', 1522, 5], ['Clement VII', 1523, 4], ['Paul III', 1534, 4], ['Julius III', 1550, 5], ['Marcellus II', 1555, 5], ['Paul IV', 1555, 5], ['Pius IV', 1559, 5],
  ['Pius V', 1566, 3], ['Gregory XIII', 1572, 3], ['Sixtus V', 1585, 4], ['Urban VII', 1590, 6], ['Gregory XIV', 1590, 6], ['Innocent IX', 1591, 6], ['Clement VIII', 1592, 5], ['Leo XI', 1605, 6],
  ['Paul V', 1605, 5], ['Gregory XV', 1621, 5], ['Urban VIII', 1623, 4], ['Innocent X', 1644, 5], ['Alexander VII', 1655, 5], ['Clement IX', 1667, 6], ['Clement X', 1670, 6], ['Innocent XI', 1676, 5],
  ['Alexander VIII', 1689, 6], ['Innocent XII', 1691, 6], ['Clement XI', 1700, 5], ['Innocent XIII', 1721, 6], ['Benedict XIII', 1724, 6], ['Clement XII', 1730, 6], ['Benedict XIV', 1740, 5],
  ['Clement XIII', 1758, 5], ['Clement XIV', 1769, 5], ['Pius VI', 1775, 5], ['Pius VII', 1800, 4], ['Leo XII', 1823, 6], ['Pius VIII', 1829, 6], ['Gregory XVI', 1831, 5], ['Pius IX', 1846, 3],
  ['Leo XIII', 1878, 3], ['Pius X', 1903, 3], ['Benedict XV', 1914, 4], ['Pius XI', 1922, 3], ['Pius XII', 1939, 2], ['John XXIII', 1958, 1], ['Paul VI', 1963, 2], ['John Paul I', 1978, 2],
  ['John Paul II', 1978, 1], ['Benedict XVI', 2005, 1], ['Francis', 2013, 1], ['Leo XIV', 2025, 2],
];
const popePool = (): Pool => {
  const facts: Record<string, Record<string, number | string>> = {};
  for (const [n, y] of POPES) facts[n] = { start: y };
  const rule = (kind: string, key: string, text: string, test: (y: number) => boolean): FactRule => ({ kind, key, text, test: (f) => test(f.start as number) });
  return {
    id: 'popes-since-1500', noun: 'pope who began his reign after 1500', theme: 'church-history', closed: true,
    answers: POPES.map(([answer, , tier]) => ({ answer, tier: tier as DeepAnswer['tier'] })),
    facts,
    factRules: [
      rule('era', '1900', 'Name a pope who began his reign after 1900.', (y) => y > 1900),
      rule('era', '1800', 'Name a pope who began his reign after 1800.', (y) => y > 1800),
      rule('era', '1700', 'Name a pope who began his reign after 1700.', (y) => y > 1700),
      rule('era', '1950', 'Name a pope who began his reign after 1950.', (y) => y > 1950),
      rule('era', 'before1600', 'Name a pope who began his reign before 1600.', (y) => y < 1600),
      rule('era', 'before1700', 'Name a pope who began his reign before 1700.', (y) => y < 1700),
      rule('era', 'before1800', 'Name a pope who began his reign before 1800.', (y) => y < 1800),
      rule('decade', '1500s', 'Name a pope who began his reign in the 1500s.', (y) => y < 1600),
      rule('decade', '1600s', 'Name a pope who began his reign in the 1600s.', (y) => y >= 1600 && y < 1700),
      rule('decade', '1700s', 'Name a pope who began his reign in the 1700s.', (y) => y >= 1700 && y < 1800),
      rule('decade', '1800s', 'Name a pope who began his reign in the 1800s.', (y) => y >= 1800 && y < 1900),
      rule('decade', '1900s', 'Name a pope who began his reign in the 1900s.', (y) => y >= 1900 && y < 2000),
      rule('decade', '2000s', 'Name a pope who began his reign in the 2000s.', (y) => y >= 2000),
      rule('era', '1850to1960', 'Name a pope who began his reign between 1850 and 1960.', (y) => y >= 1850 && y <= 1960),
    ],
  };
};

/* ---------- small complete lists with facts about each answer ---------- */

type Facts = Record<string, Record<string, number | string>>;
const rules = (list: [string, string, string, (f: Record<string, number | string>) => boolean, number?][]): FactRule[] => list.map(([kind, key, text, test, min]) => ({ kind, key, text, test, ...(min ? { min } : {}) }));

/** each pool below is built from the bank's own answer list for it, so the names always match */
function withFacts(base: DeepPrompt[], id: string, noun: string, theme: DeepTheme, from: string, facts: Facts, factRules: FactRule[]): Pool | null {
  const src = base.find((p) => p.id === from);
  if (!src) return null;
  return { id, noun, theme, closed: true, answers: src.answers, facts, factRules };
}

const COUNCIL_FACTS: Facts = {
  'Nicaea I': { year: 325, where: 'east' }, 'Constantinople I': { year: 381, where: 'east' }, Ephesus: { year: 431, where: 'east' }, Chalcedon: { year: 451, where: 'east' },
  'Constantinople II': { year: 553, where: 'east' }, 'Constantinople III': { year: 680, where: 'east' }, 'Nicaea II': { year: 787, where: 'east' }, 'Constantinople IV': { year: 869, where: 'east' },
  'Lateran I': { year: 1123, where: 'rome' }, 'Lateran II': { year: 1139, where: 'rome' }, 'Lateran III': { year: 1179, where: 'rome' }, 'Lateran IV': { year: 1215, where: 'rome' },
  'Lyons I': { year: 1245, where: 'west' }, 'Lyons II': { year: 1274, where: 'west' }, Vienne: { year: 1311, where: 'west' }, Constance: { year: 1414, where: 'west' }, Florence: { year: 1439, where: 'west' },
  'Lateran V': { year: 1512, where: 'rome' }, Trent: { year: 1545, where: 'west' }, 'Vatican I': { year: 1869, where: 'rome' }, 'Vatican II': { year: 1962, where: 'rome' },
};
const councilRules = rules([
  ['era', 'before800', 'Name an ecumenical council held before the year 800.', (f) => (f.year as number) < 800],
  ['era', 'before1000', 'Name an ecumenical council held in the first thousand years.', (f) => (f.year as number) < 1000],
  ['era', 'after1000', 'Name an ecumenical council held after the year 1000.', (f) => (f.year as number) > 1000],
  ['era', 'after1400', 'Name an ecumenical council held after the year 1400.', (f) => (f.year as number) > 1400],
  ['era', '1100to1300', 'Name an ecumenical council held between 1100 and 1300.', (f) => (f.year as number) >= 1100 && (f.year as number) <= 1300],
  ['where', 'east', 'Name an ecumenical council held in the East (Nicaea, Constantinople, Ephesus or Chalcedon).', (f) => f.where === 'east'],
  ['where', 'rome', 'Name an ecumenical council held in Rome (at the Lateran or the Vatican).', (f) => f.where === 'rome'],
  ['where', 'west', 'Name an ecumenical council held in the West outside Rome.', (f) => f.where === 'west', 5],
]);

const SONS_FACTS: Facts = Object.fromEntries(['Reuben', 'Simeon', 'Levi', 'Judah', 'Issachar', 'Zebulun'].map((n) => [n, { mother: 'Leah' }]).concat([['Joseph', { mother: 'Rachel' }], ['Benjamin', { mother: 'Rachel' }], ['Dan', { mother: 'Bilhah' }], ['Naphtali', { mother: 'Bilhah' }], ['Gad', { mother: 'Zilpah' }], ['Asher', { mother: 'Zilpah' }]] as [string, { mother: string }][]));
const sonsRules = rules([['mother', 'leah', 'Name a son of Jacob born to Leah.', (f) => f.mother === 'Leah']]);

const MYSTERY_SET: Record<string, string> = {
  'The Annunciation': 'Joyful', 'The Visitation': 'Joyful', 'The Nativity': 'Joyful', 'The Presentation': 'Joyful', 'The Finding in the Temple': 'Joyful',
  'The Baptism of the Lord': 'Luminous', 'The Wedding at Cana': 'Luminous', 'The Proclamation of the Kingdom': 'Luminous', 'The Transfiguration': 'Luminous', 'The Institution of the Eucharist': 'Luminous',
  'The Agony in the Garden': 'Sorrowful', 'The Scourging at the Pillar': 'Sorrowful', 'The Crowning with Thorns': 'Sorrowful', 'The Carrying of the Cross': 'Sorrowful', 'The Crucifixion': 'Sorrowful',
  'The Resurrection': 'Glorious', 'The Ascension': 'Glorious', 'The Descent of the Holy Spirit': 'Glorious', 'The Assumption': 'Glorious', 'The Coronation of Mary': 'Glorious',
};
const mysteryRules = rules(['Joyful', 'Luminous', 'Sorrowful', 'Glorious'].map((k) => ['set', k, `Name one of the five ${k} Mysteries of the Rosary.`, (f: Record<string, number | string>) => f.set === k, 5] as [string, string, string, (f: Record<string, number | string>) => boolean, number]));

const MASS_SECTION: Record<string, string> = {};
for (const [section, names] of Object.entries({
  intro: ['Introductory Rites', 'Entrance Chant', 'Entrance Procession', 'Sign of the Cross', 'Greeting', 'Penitential Act', 'Kyrie', 'Gloria', 'Collect'],
  word: ['Liturgy of the Word', 'First Reading', 'Responsorial Psalm', 'Second Reading', 'Gospel Acclamation', 'Alleluia', 'Gospel', 'Homily', 'Creed', 'Profession of Faith', 'Prayer of the Faithful', 'Universal Prayer'],
  eucharist: ['Liturgy of the Eucharist', 'Preparation of the Gifts', 'Offertory', 'Offertory Procession', 'Prayer over the Offerings', 'Eucharistic Prayer', 'Preface', 'Preface Dialogue', 'Sanctus', 'Epiclesis', 'Institution Narrative', 'Consecration', 'Memorial Acclamation', 'Anamnesis', 'Intercessions', 'Doxology', 'Great Amen'],
  communion: ['Communion Rite', 'Lord’s Prayer', 'Embolism', 'Sign of Peace', 'Fraction Rite', 'Lamb of God', 'Agnus Dei', 'Invitation to Communion', 'Communion', 'Communion Chant', 'Prayer after Communion', 'Silent Reflection'],
  conclude: ['Concluding Rites', 'Announcements', 'Blessing', 'Dismissal', 'Recessional'],
})) for (const n of names) MASS_SECTION[n] = section;
const massRules = rules([
  ['section', 'intro', 'Name a part of the Introductory Rites of the Mass.', (f) => f.section === 'intro'],
  ['section', 'word', 'Name a part of the Liturgy of the Word.', (f) => f.section === 'word'],
  ['section', 'eucharist', 'Name a part of the Liturgy of the Eucharist, including the Eucharistic Prayer.', (f) => f.section === 'eucharist'],
  ['section', 'communion', 'Name a part of the Communion Rite.', (f) => f.section === 'communion'],
]);

const POPE_NAME_RULES = (): FactRule[] => ['Pius', 'Clement', 'Innocent', 'Leo'].map((n) => ({ kind: 'named', key: n.toLowerCase(), text: `Name a pope named ${n} since 1500.`, test: (f) => f.name === n, min: 5 }));

/** the books' groups, from the app's own canon table */
function bookFacts(): { facts: Facts; rules: FactRule[] } {
  const facts: Facts = {};
  for (const b of BOOKS) facts[b.name === 'Acts of the Apostles' ? 'Acts' : b.name] = { testament: b.testament, group: b.group, chapters: b.chapters, deutero7: ['Tobit', 'Judith', 'Wisdom', 'Sirach', 'Baruch', '1 Maccabees', '2 Maccabees'].includes(b.name) ? 1 : 0 };
  return {
    facts,
    rules: rules([
      ['group', 'ot', 'Name a book of the Old Testament.', (f) => f.testament === 'OT', 5],
      ['group', 'nt', 'Name a book of the New Testament.', (f) => f.testament === 'NT', 5],
      ['group', 'pentateuch', 'Name a book of the Pentateuch.', (f) => f.group === 'Pentateuch', 5],
      ['group', 'history', 'Name a historical book of the Old Testament.', (f) => f.group === 'Historical Books', 5],
      ['group', 'wisdom', 'Name a Wisdom book of the Old Testament.', (f) => f.group === 'Wisdom Books', 5],
      ['group', 'prophets', 'Name a book from the prophets section of the Old Testament.', (f) => f.group === 'Prophets', 5],
      ['group', 'gospels', 'Name one of the four Gospels.', (f) => f.group === 'Gospels', 4],
      ['group', 'paul', 'Name a letter of Paul.', (f) => f.group === 'Pauline Letters', 5],
      ['group', 'letters', 'Name a letter in the New Testament.', (f) => f.group === 'Pauline Letters' || f.group === 'General Letters', 5],
      ['group', 'general', 'Name a New Testament letter that is not in the Pauline group.', (f) => f.group === 'General Letters', 5],
      ['group', 'deutero', 'Name a deuterocanonical book of the Old Testament.', (f) => f.deutero7 === 1, 5],
      ['group', 'onechapter', 'Name a book of the Bible with only one chapter.', (f) => f.chapters === 1 && f.testament !== undefined && f.group !== 'Acts' && f.group !== 'Revelation', 5],
    ]),
  };
}


/* ---------- hand-written facts about the answers of some lists (each name must be on its list: tests/deepWatersDerived.test.ts checks) ---------- */

interface Table { tags: Record<string, string[]>; rules: [tag: string, text: string, min?: number][] }
const TABLES: Record<string, Table> = {
  doctors: {
    tags: {
      c4: ['Athanasius of Alexandria', 'Basil the Great', 'Gregory Nazianzen', 'Hilary of Poitiers', 'Ambrose of Milan', 'Cyril of Jerusalem', 'Ephrem the Syrian'],
      c5: ['John Chrysostom', 'Augustine of Hippo', 'Jerome', 'Cyril of Alexandria', 'Leo the Great', 'Peter Chrysologus'],
      early: ['Irenaeus of Lyons', 'Athanasius of Alexandria', 'Basil the Great', 'Gregory Nazianzen', 'Hilary of Poitiers', 'Ambrose of Milan', 'Cyril of Jerusalem', 'Ephrem the Syrian', 'John Chrysostom', 'Augustine of Hippo', 'Jerome', 'Cyril of Alexandria', 'Leo the Great', 'Peter Chrysologus'],
      medieval: ['Gregory of Narek', 'Peter Damian', 'Anselm', 'Bernard of Clairvaux', 'Hildegard of Bingen', 'Antony of Padua', 'Albert the Great', 'Bonaventure', 'Thomas Aquinas', 'Catherine of Siena'],
      modern: ['Teresa of Avila', 'Peter Canisius', 'John of the Cross', 'John of Avila', 'Robert Bellarmine', 'Lawrence of Brindisi', 'Francis de Sales', 'Alphonsus Liguori', 'Therese of Lisieux', 'John Henry Newman'],
      east: ['Athanasius of Alexandria', 'Basil the Great', 'Gregory Nazianzen', 'John Chrysostom', 'Cyril of Jerusalem', 'Cyril of Alexandria', 'John of Damascus', 'Ephrem the Syrian', 'Gregory of Narek'],
    },
    rules: [['c4', 'Name a Doctor of the Church who died in the 300s.', 5], ['c5', 'Name a Doctor of the Church who died in the 400s.', 5], ['early', 'Name a Doctor of the Church who died before the year 500.'], ['medieval', 'Name a Doctor of the Church who died between 1000 and 1500.'], ['modern', 'Name a Doctor of the Church who died after 1500.'], ['east', 'Name a Doctor of the Church from the Christian East.']],
  },
  kings: {
    tags: {
      judah: ['Hezekiah', 'Josiah', 'Jehoshaphat', 'Rehoboam', 'Manasseh', 'Uzziah', 'Ahaz', 'Zedekiah', 'Jehoiakim', 'Jehoiachin', 'Asa', 'Joash', 'Amaziah', 'Jotham', 'Amon', 'Jehoram', 'Ahaziah', 'Abijah', 'Jehoahaz', 'Shallum', 'Athaliah'],
      israel: ['Jeroboam', 'Jeroboam II', 'Ahab', 'Jehu', 'Omri', 'Baasha', 'Elah', 'Zimri', 'Nadab', 'Pekah', 'Pekahiah', 'Menahem', 'Hoshea', 'Shallum', 'Jehoahaz', 'Joash', 'Jehoram', 'Ahaziah', 'Zechariah'],
    },
    rules: [['judah', 'Name a king (or the queen) who ruled the southern kingdom of Judah.'], ['israel', 'Name a king who ruled the northern kingdom of Israel.']],
  },
  miracles: {
    tags: {
      nature: ['Water into wine', 'Feeding the five thousand', 'Walking on water', 'Calming the storm', 'Feeding the four thousand', 'Miraculous catch of fish', 'Cursing the fig tree', 'The coin in the fish\'s mouth'],
      exorcism: ['Gerasene demoniac', 'Healing the man at Capernaum with an unclean spirit', 'Healing the dumb demoniac', 'Healing the Canaanite woman\'s daughter', 'Healing the epileptic boy'],
      galilee: ['Water into wine', 'Feeding the five thousand', 'Walking on water', 'Calming the storm', 'Feeding the four thousand', 'Miraculous catch of fish', 'The coin in the fish\'s mouth', 'Healing Peter\'s mother-in-law', 'Healing the centurion\'s servant', 'Healing the official\'s son', 'Woman with the flow of blood', 'Raising of Jairus\'s daughter', 'Raising the widow\'s son at Nain', 'Healing the man with a withered hand', 'Gerasene demoniac', 'Healing the man at Capernaum with an unclean spirit', 'Healing the blind man of Bethsaida', 'Healing the deaf mute', 'Healing the dumb demoniac'],
    },
    rules: [['nature', 'Name a miracle of Jesus over nature, bread or water.', 6], ['exorcism', 'Name a miracle in which Jesus drove out an unclean spirit.', 5], ['galilee', 'Name a miracle of Jesus worked in or around Galilee.', 8]],
  },
  rulers: {
    tags: {
      egypt: ['Pharaoh', 'Neco', 'Hophra', 'Shishak', 'Tirhakah', 'So of Egypt'],
      assyria: ['Sennacherib', 'Tiglath-pileser', 'Shalmaneser', 'Sargon', 'Esarhaddon'],
      persia: ['Cyrus', 'Darius', 'Xerxes', 'Artaxerxes', 'Vashti'],
      rome: ['Caesar Augustus', 'Tiberius', 'Claudius', 'Pontius Pilate', 'Felix', 'Festus', 'Quirinius', 'Gallio', 'Sergius Paulus'],
      herod: ['Herod the Great', 'Herod Antipas', 'Archelaus', 'Philip the Tetrarch', 'Herod Agrippa I', 'Herod Agrippa II'],
      greek: ['Alexander the Great', 'Antiochus Epiphanes', 'Antiochus III', 'Demetrius I', 'Ptolemy', 'Seleucus IV', 'Alexander Balas'],
      neighbors: ['Melchizedek', 'Abimelech of Gerar', 'Balak', 'Sihon', 'Og', 'Eglon', 'Jabin', 'Agag', 'Achish', 'Ben-hadad', 'Hazael', 'Rezin', 'Mesha', 'Hadadezer', 'Toi', 'Nahash', 'Hanun', 'Cushan-rishathaim', 'Chedorlaomer', 'Amraphel', 'Adoni-bezek', 'Adoni-zedek', 'Zebah and Zalmunna', 'Hiram'],
      governors: ['Pontius Pilate', 'Felix', 'Festus', 'Quirinius', 'Gallio', 'Sergius Paulus'],
    },
    rules: [['egypt', 'Name a king of Egypt in the Bible.', 6], ['assyria', 'Name a king of Assyria in the Bible.', 5], ['persia', 'Name a king or queen of Persia in the Bible.', 5], ['rome', 'Name a Roman emperor or governor in the New Testament.', 8], ['herod', 'Name a member of the Herod family in the New Testament.', 6], ['greek', 'Name a Greek or Hellenistic king in the books of the Maccabees.', 6], ['governors', 'Name a Roman governor in the New Testament.', 6]],
  },
  foods: {
    tags: {
      fruit: ['Figs', 'Grapes', 'Dates', 'Pomegranates', 'Raisins', 'Melons', 'Apples', 'Olives'],
      grain: ['Bread', 'Barley', 'Wheat', 'Parched grain', 'Unleavened bread', 'Showbread', 'Raisin cakes', 'Millet', 'Spelt', 'Fine flour', 'Wafers'],
      vegetable: ['Lentils', 'Beans', 'Cucumbers', 'Leeks', 'Onions', 'Garlic', 'Gourds', 'Vetches', 'Bitter herbs'],
      seasoning: ['Cumin', 'Dill', 'Mint', 'Rue', 'Coriander', 'Mustard', 'Salt'],
      meat: ['Fish', 'Quail', 'Locusts', 'Lamb', 'Goat', 'Kid', 'Fatted calf', 'Eggs', 'Broiled fish'],
      drink: ['Wine', 'Water', 'New wine', 'Vinegar', 'Milk'],
    },
    rules: [['fruit', 'Name a fruit in the Bible.', 8], ['grain', 'Name a grain or bread in the Bible.', 8], ['vegetable', 'Name a vegetable or legume in the Bible.', 8], ['seasoning', 'Name a herb, spice or seasoning in the Bible.', 6], ['meat', 'Name an animal food in the Bible.', 8], ['drink', 'Name a drink in the Bible.', 5]],
  },
  vestments: {
    tags: {
      mass: ['Alb', 'Amice', 'Cincture', 'Stole', 'Chasuble', 'Maniple'],
      bishop: ['Mitre', 'Pectoral cross', 'Zucchetto', 'Rochet', 'Mozzetta', 'Cappa magna', 'Ferraiolo', 'Pallium', 'Biretta'],
      head: ['Mitre', 'Zucchetto', 'Biretta', 'Veil', 'Wimple'],
    },
    rules: [['mass', 'Name a vestment a priest puts on to say Mass.', 6], ['bishop', 'Name a vestment or insignia worn by a bishop.', 8], ['head', 'Name a covering for the head worn in the Church.', 5]],
  },
  furnishings: {
    tags: {
      vessel: ['Chalice', 'Paten', 'Ciborium', 'Monstrance', 'Pyx', 'Chrismatory', 'Thurible', 'Cruet'],
      building: ['Nave', 'Apse', 'Transept', 'Narthex', 'Chancel', 'Sanctuary', 'Sacristy'],
      sanctuary: ['Altar', 'Ambo', 'Tabernacle', 'Sanctuary lamp', 'Sedilia', 'Credence table', 'Cathedra', 'Baldachin', 'Reredos', 'Altar rail'],
    },
    rules: [['vessel', 'Name a sacred vessel used in the liturgy.', 8], ['building', 'Name a part of a church building.', 7], ['sanctuary', 'Name something found in or around the sanctuary of a church.', 8]],
  },
  encyclicals: {
    tags: {
      jp2: ['Redemptor Hominis', 'Dives in Misericordia', 'Laborem Exercens', 'Sollicitudo Rei Socialis', 'Centesimus Annus', 'Redemptoris Missio', 'Ecclesia de Eucharistia', 'Dominum et Vivificantem', 'Redemptoris Mater', 'Veritatis Splendor', 'Fides et Ratio', 'Ut Unum Sint', 'Evangelium Vitae', 'Familiaris Consortio', 'Christifideles Laici', 'Pastores Dabo Vobis', 'Reconciliatio et Paenitentia', 'Catechesi Tradendae', 'Redemptoris Custos', 'Ecclesia in Europa', 'Novo Millennio Ineunte'],
      benedict: ['Deus Caritas Est', 'Spe Salvi', 'Caritas in Veritate', 'Sacramentum Caritatis', 'Verbum Domini', 'Africae Munus'],
      francis: ['Lumen Fidei', 'Laudato Si', 'Fratelli Tutti', 'Dilexit Nos', 'Evangelii Gaudium', 'Amoris Laetitia', 'Gaudete et Exsultate', 'Christus Vivit', 'Querida Amazonia'],
      social: ['Rerum Novarum', 'Quadragesimo Anno', 'Mater et Magistra', 'Pacem in Terris', 'Laborem Exercens', 'Sollicitudo Rei Socialis', 'Centesimus Annus', 'Caritas in Veritate', 'Laudato Si', 'Fratelli Tutti'],
      family: ['Humanae Vitae', 'Evangelium Vitae', 'Casti Connubii', 'Familiaris Consortio', 'Amoris Laetitia'],
      faith: ['Fides et Ratio', 'Aeterni Patris', 'Providentissimus Deus', 'Divino Afflante Spiritu', 'Verbum Domini'],
    },
    rules: [['benedict', 'Name a document of Pope Benedict XVI.', 6], ['francis', 'Name a document of Pope Francis.', 8], ['social', 'Name a papal document on the Church\'s social teaching.', 8], ['family', 'Name a papal document on marriage, family or life.', 5], ['faith', 'Name a papal document on Scripture, faith or reason.', 5]],
  },
  shrines: {
    tags: {
      italy: ['Loreto', 'Assisi', 'San Giovanni Rotondo', 'Santa Croce in Gerusalemme', 'San Lorenzo fuori le Mura', 'San Sebastiano', 'Catacombs of Rome', 'Scala Santa', 'Saint John Lateran', 'Saint Mary Major', 'Saint Paul Outside the Walls', 'Saint Peter\'s Basilica', 'Basilica of Saint Anthony of Padua', 'Siena', 'Cascia', 'Lanciano', 'Turin', 'Manoppello', 'Orvieto', 'Monte Cassino', 'Subiaco', 'Norcia', 'La Verna', 'Porziuncola', 'San Damiano'],
      france: ['Lourdes', 'Mont-Saint-Michel', 'Chartres', 'Lisieux', 'Paray-le-Monial', 'Nevers', 'La Salette', 'Pontmain', 'Rocamadour', 'Vezelay', 'Conques', 'Ars', 'Mont Sainte-Odile'],
      spain: ['Santiago de Compostela', 'Montserrat', 'Avila', 'Alba de Tormes', 'Our Lady of the Pillar', 'Covadonga', 'Loyola', 'Javier'],
      holyland: ['Basilica of the Annunciation', 'Church of the Nativity', 'Church of the Holy Sepulchre', 'Gethsemane', 'Mount of Olives', 'Via Dolorosa', 'Mount Tabor', 'Mount Nebo', 'Cana', 'Capernaum', 'Tabgha', 'Emmaus', 'Bethany', 'Ein Karem'],
      germanic: ['Kevelaer', 'Altotting', 'Mariazell', 'Einsiedeln', 'Cologne Cathedral', 'Aachen', 'Trier'],
      americas: ['Guadalupe', 'Aparecida', 'Lujan', 'Sainte-Anne-de-Beaupre', 'Saint Joseph\'s Oratory', 'Cap-de-la-Madeleine', 'National Shrine of the Immaculate Conception', 'Our Lady of Good Help', 'Our Lady of Charity', 'Our Lady of the Angels of Cartago', 'Our Lady of Suyapa', 'San Juan de los Lagos', 'Our Lady of Copacabana'],
      isles: ['Knock', 'Croagh Patrick', 'Lough Derg', 'Glendalough', 'Walsingham'],
      poland: ['Czestochowa', 'Divine Mercy Sanctuary', 'Wadowice', 'Kalwaria Zebrzydowska', 'Lichen'],
    },
    rules: [['italy', 'Name a Catholic shrine or pilgrimage site in Italy.', 12], ['france', 'Name a Catholic shrine or pilgrimage site in France.', 8], ['spain', 'Name a Catholic shrine or pilgrimage site in Spain.', 6], ['holyland', 'Name a pilgrimage site in the Holy Land.', 8], ['germanic', 'Name a Catholic shrine in Germany, Austria or Switzerland.', 6], ['americas', 'Name a Catholic shrine in the Americas.', 8], ['isles', 'Name a pilgrimage site in Ireland or Britain.', 5], ['poland', 'Name a Catholic shrine in Poland.', 5]],
  },
  parables: {
    tags: { matthew: ['The Ten Virgins', 'The Talents', 'The Wheat and the Weeds', 'The Hidden Treasure', 'The Pearl of Great Price', 'The Dragnet', 'The Unforgiving Servant', 'The Workers in the Vineyard', 'The Two Sons', 'The Sheep and the Goats'] },
    rules: [['matthew', 'Name a parable of Jesus found only in Matthew\'s Gospel.', 8]],
  },
  animals: {
    tags: {
      bird: ['Dove', 'Raven', 'Eagle', 'Sparrow', 'Hawk', 'Owl', 'Ostrich', 'Peacock', 'Stork', 'Quail'],
      farm: ['Sheep', 'Lamb', 'Donkey', 'Ox', 'Goat', 'Camel', 'Swine', 'Calf', 'Ram', 'Horse'],
      wild: ['Lion', 'Wolf', 'Leopard', 'Bear', 'Fox', 'Jackal'],
    },
    rules: [['bird', 'Name a bird in the Bible.', 8], ['farm', 'Name a farm or pack animal in the Bible.', 8], ['wild', 'Name a wild beast in the Bible.', 6]],
  },
  plants: {
    tags: {
      tree: ['Olive', 'Fig', 'Cedar', 'Palm', 'Sycamore', 'Almond', 'Pomegranate', 'Oak', 'Cypress', 'Fir', 'Acacia', 'Terebinth'],
      herb: ['Mustard', 'Hyssop', 'Myrrh', 'Frankincense', 'Balm', 'Mint', 'Cummin', 'Dill', 'Rue'],
    },
    rules: [['tree', 'Name a tree in the Bible.', 8], ['herb', 'Name a herb, spice or resin in the Bible.', 8]],
  },
  trades: {
    tags: {
      farming: ['Farmer', 'Shepherd', 'Vinedresser', 'Gardener', 'Sower', 'Reaper', 'Gleaner', 'Thresher', 'Herdsman', 'Hired hand'],
      craft: ['Carpenter', 'Potter', 'Tentmaker', 'Weaver', 'Tanner', 'Fuller', 'Goldsmith', 'Silversmith', 'Blacksmith', 'Coppersmith', 'Mason', 'Builder', 'Master builder', 'Seller of purple', 'Perfumer'],
      war: ['Soldier', 'Centurion', 'Archer', 'Armor-bearer', 'Charioteer', 'Spy', 'Executioner'],
      service: ['Servant', 'Slave', 'Steward', 'Cook', 'Baker', 'Cupbearer', 'Nurse', 'Midwife', 'Hired hand', 'Messenger', 'Gatekeeper', 'Watchman'],
      holy: ['Priest', 'Levite', 'Prophet', 'Scribe', 'Exorcist', 'Evangelist'],
    },
    rules: [['farming', 'Name a farming or herding job in the Bible.', 8], ['craft', 'Name a craft or building trade in the Bible.', 8], ['war', 'Name a soldier\'s job in the Bible.', 6], ['service', 'Name a household or service job in the Bible.', 8], ['holy', 'Name a religious job or calling in the Bible.', 5]],
  },
  peoples: {
    tags: {
      canaan: ['Canaanites', 'Amorites', 'Hittites', 'Hivites', 'Perizzites', 'Jebusites', 'Girgashites'],
      kin: ['Moabites', 'Ammonites', 'Edomites', 'Midianites', 'Amalekites', 'Ishmaelites'],
      empire: ['Egyptians', 'Babylonians', 'Assyrians', 'Persians', 'Medes', 'Romans', 'Greeks', 'Chaldeans'],
      letters: ['Ephesians', 'Philippians', 'Colossians', 'Thessalonians', 'Corinthians', 'Galatians', 'Romans'],
      pentecost: ['Parthians', 'Medes', 'Elamites', 'Cappadocians', 'Phrygians', 'Pamphylians', 'Libyans', 'Cretans', 'Arabs', 'Romans', 'Cyrenians'],
    },
    rules: [['canaan', 'Name one of the seven nations of Canaan.', 7], ['kin', 'Name a people descended from Abraham\'s family or from the neighbors of Israel in the desert.', 6], ['empire', 'Name a great power that ruled the Bible lands.', 8], ['letters', 'Name a people to whom Paul wrote a letter.', 7], ['pentecost', 'Name a people present in Jerusalem at Pentecost.', 8]],
  },
};
const tableFacts = (t: Table): { facts: Facts; rules: FactRule[] } => {
  const facts: Facts = {};
  for (const [tag, names] of Object.entries(t.tags)) for (const n of names) facts[n] = { t: `${(facts[n]?.t as string) ?? '|'}${tag}|` };
  return { facts, rules: t.rules.map(([tag, text, min]) => ({ kind: 'table', key: tag, text, test: (f) => String(f.t ?? '').includes(`|${tag}|`), ...(min ? { min } : {}) })) };
};
export const TABLE_NAMES = (): { pool: string; names: string[] }[] => Object.entries(TABLES).map(([pool, t]) => ({ pool, names: [...new Set(Object.values(t.tags).flat())] }));

/* ---------- the lists already in the bank, read again by rule ---------- */

interface Spec { id: string; from: string | RegExp; noun: string; theme: DeepTheme; part?: Pool['part']; weight?: number }
const SPECS: Spec[] = [
  { id: 'saints', from: 'saints-any', noun: 'saint', theme: 'saints', weight: 3 },
  { id: 'calendar-saints', from: 'authored-calendar-saints', noun: 'saint in the General Roman Calendar', theme: 'saints', weight: 2 },
  { id: 'saint-popes', from: 'popes', noun: 'pope who is a saint', theme: 'saints' },
  { id: 'bible-people', from: /^people-/, noun: 'person in the Bible', theme: 'people', weight: 3 },
  { id: 'bible-women', from: 'roles-women', noun: 'woman in the Bible', theme: 'people' },
  { id: 'bible-places', from: /^places-/, noun: 'place named in the Bible', theme: 'places', weight: 3 },
  { id: 'shrines', from: 'authored-shrines', noun: 'Catholic shrine or pilgrimage site', theme: 'places' },
  { id: 'orders', from: 'orders', noun: 'Catholic religious order', theme: 'church-history' },
  { id: 'fathers', from: 'fathers', noun: 'Church Father or early Christian writer', theme: 'church-history' },
  { id: 'writers', from: 'catholic-writers', noun: 'Catholic writer', theme: 'church-history' },
  { id: 'encyclicals', from: 'encyclicals', noun: 'papal encyclical or exhortation', theme: 'church-history', part: 'title' },
  { id: 'heresies', from: 'authored-heresies', noun: 'heresy the Church has condemned', theme: 'church-history' },
  { id: 'classics', from: 'authored-catholic-classics', noun: 'Catholic classic', theme: 'church-history', part: 'title' },
  { id: 'papal-names', from: 'authored-papal-names', noun: 'papal name', theme: 'church-history' },
  { id: 'marian', from: 'marian', noun: 'title or apparition of Mary', theme: 'devotion' },
  { id: 'devotions', from: 'devotions', noun: 'Catholic prayer or devotion', theme: 'devotion' },
  { id: 'loreto', from: 'authored-marian-litany', noun: 'invocation in the Litany of Loreto', theme: 'devotion' },
  { id: 'vestments', from: 'vestments', noun: 'vestment or item of clerical dress', theme: 'liturgy' },
  { id: 'furnishings', from: 'church-furnishings', noun: 'object or part of a Catholic church', theme: 'liturgy' },
  { id: 'latin', from: 'authored-latin-worship', noun: 'Latin phrase from Catholic worship', theme: 'liturgy', part: 'phrase' },
  { id: 'observances', from: 'authored-liturgical-observances', noun: 'season, feast or observance of the liturgical year', theme: 'liturgy' },
  { id: 'music', from: 'sacred-music', noun: 'hymn, chant or piece of sacred music', theme: 'art-music', part: 'title' },
  { id: 'art', from: 'sacred-art', noun: 'work of sacred art or famous church', theme: 'art-music', part: 'title' },
  { id: 'symbols', from: 'authored-christian-symbols', noun: 'symbol used in Christian art', theme: 'art-music' },
  { id: 'theology', from: 'authored-theology-terms', noun: 'term used in Catholic theology', theme: 'doctrine' },
  { id: 'events-of-jesus', from: 'authored-life-of-jesus', noun: 'event in the life of Jesus', theme: 'scripture' },
  { id: 'titles-of-jesus', from: 'authored-titles-of-jesus', noun: 'title given to Jesus', theme: 'scripture' },
  { id: 'peoples', from: 'authored-biblical-peoples', noun: 'people or nation in the Bible', theme: 'scripture' },
  { id: 'rulers', from: 'authored-foreign-rulers', noun: 'foreign ruler in the Bible', theme: 'scripture' },
  { id: 'foods', from: 'authored-foods', noun: 'food or drink in the Bible', theme: 'scripture' },
  { id: 'trades', from: 'authored-occupations', noun: 'trade or occupation in the Bible', theme: 'scripture' },
  { id: 'revelation', from: 'authored-revelation-images', noun: 'image in Revelation', theme: 'scripture' },
  { id: 'kings', from: 'kings-of-israel', noun: 'king of Israel or Judah', theme: 'scripture' },
  { id: 'prophets', from: 'ot-prophets', noun: 'prophet of the Old Testament', theme: 'scripture' },
  { id: 'parables', from: 'parables', noun: 'parable of Jesus', theme: 'scripture', part: 'title' },
  { id: 'miracles', from: 'miracles', noun: 'miracle of Jesus', theme: 'scripture' },
  { id: 'animals', from: 'bible-animals', noun: 'animal in the Bible', theme: 'scripture' },
  { id: 'plants', from: 'bible-plants', noun: 'plant or crop in the Bible', theme: 'scripture' },
  { id: 'doctors', from: 'doctors', noun: 'Doctor of the Church', theme: 'saints' },
  { id: 'councils', from: 'councils', noun: 'ecumenical council', theme: 'church-history' },
  { id: 'rites', from: 'rites', noun: 'Church in full communion with Rome', theme: 'church-history' },
  { id: 'mysteries', from: 'mysteries', noun: 'mystery of the Rosary', theme: 'devotion' },
  { id: 'apostles', from: 'apostles', noun: 'apostle', theme: 'scripture' },
  { id: 'saint-first-names', from: 'authored4-saint-first-names', noun: 'first name that a saint has had', theme: 'saints' },
  { id: 'saint-cities', from: 'authored4-cities-named-for-saints', noun: 'city or town named after a saint', theme: 'places' },
  { id: 'catholic-countries', from: 'authored4-catholic-countries', noun: 'country where Catholics are the largest group', theme: 'places' },
  { id: 'italy-cities', from: 'authored4-italian-cities', noun: 'city or town in Italy', theme: 'places' },
  { id: 'spain-cities', from: 'authored4-spanish-cities', noun: 'city or town in Spain', theme: 'places' },
];

function unionOf(base: DeepPrompt[], from: string | RegExp): DeepAnswer[] {
  const hits = base.filter((p) => (typeof from === 'string' ? p.id === from : from.test(p.id)));
  // two spellings that the game's matcher reads as the same answer ("Gate of Ephraim", "Ephraim Gate") are one answer
  const byKey = new Map<string, DeepAnswer>();
  for (const p of hits) for (const a of p.answers) {
    const forms = [a.answer, ...(a.aliases ?? [])].map((x) => deepTokens(x, p.ignore).join(' '));
    const key = forms[0];
    const old = byKey.get(key);
    if (!old || a.tier < old.tier) byKey.set(key, a);
  }
  // an alias of one answer that is the name of another would also collide: the first one in the list keeps it
  const out: DeepAnswer[] = [];
  const taken = new Set<string>();
  for (const a of [...byKey.values()].sort((x, y) => x.tier - y.tier || x.answer.localeCompare(y.answer))) {
    const forms = [a.answer, ...(a.aliases ?? [])].map((x) => deepTokens(x).join(' '));
    if (forms.some((f) => taken.has(f))) { const keep = (a.aliases ?? []).filter((x) => !taken.has(deepTokens(x).join(' '))); if (taken.has(forms[0])) continue; out.push({ ...a, ...(keep.length ? { aliases: keep } : { aliases: undefined }) }); for (const f of [forms[0], ...keep.map((x) => deepTokens(x).join(' '))]) taken.add(f); continue; }
    out.push(a); for (const f of forms) taken.add(f);
  }
  return out.map((a) => (a.aliases === undefined ? { answer: a.answer, tier: a.tier } : a));
}

/** the Bible's 73 books as one complete list, from the two testament lists, with the group each belongs to */
function bookPool(base: DeepPrompt[]): Pool {
  const ot = base.find((p) => p.id === 'otbooks'), nt = base.find((p) => p.id === 'ntbooks');
  const answers = [...(ot?.answers ?? []), ...(nt?.answers ?? [])];
  const { facts, rules: factRules } = bookFacts();
  return { id: 'bible-books', noun: 'book of the Bible', theme: 'scripture', closed: true, answers, part: 'title', facts, factRules };
}

/** saints in a category, and the places of one book, are lists in their own right */
const CATEGORY_SAINTS: [string, string, string][] = [
  ['saints-martyr', 'saint-martyrs', 'saint who was a martyr'], ['saints-bishop', 'saint-bishops', 'saint who was a bishop'], ['saints-abbot', 'saint-abbots', 'saint who was an abbot or abbess'],
  ...['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => [`saints-${String(i + 1).padStart(2, '0')}`, `feast-${m.toLowerCase()}`, `saint whose feast is in ${m}`] as [string, string, string]),
];
const BOOK_PLACES: [string, string][] = [['JOS', 'Joshua'], ['1CH', '1 Chronicles'], ['JDG', 'Judges'], ['NUM', 'Numbers'], ['JER', 'Jeremiah'], ['ISA', 'Isaiah'], ['2CH', '2 Chronicles'], ['ACT', 'Acts'], ['GEN', 'Genesis'], ['1KI', '1 Kings'], ['2KI', '2 Kings'], ['1SA', '1 Samuel'], ['EZK', 'Ezekiel'], ['DEU', 'Deuteronomy'], ['2SA', '2 Samuel']];

const firstWord = (s: string) => deepTokens(s.split(/[\s,]+/)[0] ?? '')[0] ?? '';
/** the saints whose first name is also a Bible name, or also a book of the Bible */
function namedAfter(saints: DeepAnswer[], names: Set<string>, id: string, noun: string): Pool | null {
  const answers = saints.filter((a) => names.has(firstWord(a.answer)));
  return answers.length >= 30 ? { id, noun, theme: 'saints', closed: false, answers } : null;
}

/** every list the derived questions are worked out from */
export function buildPools(base: DeepPrompt[]): Pool[] {
  const pools: Pool[] = [];
  for (const s of SPECS) {
    const answers = unionOf(base, s.from);
    if (!answers.length) continue;
    const closedBase = typeof s.from === 'string' ? base.find((p) => p.id === s.from)?.closed : undefined;
    const pool: Pool = { id: s.id, noun: s.noun, theme: s.theme, closed: !!closedBase, answers, ...(s.part ? { part: s.part } : {}), ...(s.weight ? { weight: s.weight } : {}), ...(typeof s.from === 'string' ? { ignore: base.find((p) => p.id === s.from)?.ignore } : {}) };
    if (['councils', 'saint-popes'].includes(s.id)) pool.numerals = true;
    if (s.id === 'councils') { pool.facts = COUNCIL_FACTS; pool.factRules = councilRules; }
    if (s.id === 'mysteries') { pool.facts = Object.fromEntries(Object.entries(MYSTERY_SET).map(([k, v]) => [k, { set: v }])); pool.factRules = mysteryRules; }
    if (s.id === 'apostles') { pool.facts = Object.fromEntries(['Peter', 'Andrew', 'James the Greater', 'John'].map((n) => [n, { fisher: 1 }])); pool.factRules = rules([['trade', 'fishermen', 'Name an apostle who was a fisherman.', (f) => f.fisher === 1, 4]]); }
    const table = TABLES[s.id];
    if (table) { const t = tableFacts(table); pool.facts = t.facts; pool.factRules = [...(pool.factRules ?? []), ...t.rules]; }
    pools.push(pool);
  }
  const sons = withFacts(base, 'sons-of-jacob', 'son of Jacob', 'scripture', 'sons-of-jacob', SONS_FACTS, sonsRules);
  if (sons) pools.push(sons);
  pools.push(bookPool(base));
  const popeP = popePool();
  popeP.numerals = true;
  for (const [n, y] of POPES) popeP.facts![n] = { ...popeP.facts![n], start: y, name: n.split(' ')[0] };
  popeP.factRules = [...popeP.factRules!, ...POPE_NAME_RULES()];
  pools.push(popeP);
  const mass: Pool = { id: 'mass', noun: 'part of the Mass', theme: 'liturgy', closed: false, part: 'name', answers: MASS.map(([answer, tier]) => ({ answer, tier: tier as DeepAnswer['tier'] })), facts: Object.fromEntries(MASS.map(([n]) => [n, { section: MASS_SECTION[n] ?? '' }])), factRules: massRules };
  pools.push(mass);
  for (const [id, title, theme, text] of TEXTS) pools.push(wordPool(id, title, theme, text));
  for (const [from, id, noun] of CATEGORY_SAINTS) { const answers = unionOf(base, from); if (answers.length >= 20) pools.push({ id, noun, theme: 'saints', closed: false, answers }); }
  for (const [code, book] of BOOK_PLACES) { const answers = unionOf(base, `places-${code}`); if (answers.length >= 60) pools.push({ id: `places-in-${code.toLowerCase()}`, noun: `place named in ${book}`, theme: 'places', closed: false, answers }); }
  const saints = unionOf(base, 'saints-any');
  const people = unionOf(base, /^people-/);
  const personNames = new Set(people.map((a) => firstWordOf(a.answer)).filter((w) => w.length > 2 && !people.some((x) => false)));
  const bookNames = new Set(BOOKS.flatMap((b) => b.name.split(' ').filter((w) => !/^\d/.test(w) && w.length > 2 && !['the', 'of', 'songs', 'song', 'acts', 'apostles'].includes(w.toLowerCase())).map((w) => deepTokens(w)[0] ?? '')));
  const a = namedAfter(saints, personNames, 'saints-named-for-bible', 'saint whose first name is also the name of a person in the Bible'); if (a) pools.push(a);
  const b = namedAfter(saints, bookNames, 'saints-named-for-books', 'saint with a Bible-book first name'); if (b) pools.push(b);
  return pools;
}
/** a person's first token, only when the person has a one-word name (so "Peter" counts, "Simon Peter" does not decide) */
function firstWordOf(name: string) { return name.trim().split(/\s+/).length === 1 ? firstWord(name) : ''; }
