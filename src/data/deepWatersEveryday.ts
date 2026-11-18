/**
 * Which Basilion questions are asked. A player has 45 seconds and should have an answer come to mind at once, the way it does in the games this one is modelled
 * on ("name something you ride standing up"). The lists below are the ones an ordinary Catholic can reach into straight away (saints, apostles, parables, the
 * sacraments, a Christmas carol, a church part). The rest stay in the data as answer lists, and a few feed the letter questions, but they are never asked:
 * the places named in one book of the Bible, a saint by feast month, the words of a prayer, the church councils, and the like are the kind of question that
 * leaves you with nothing to type.
 */
const OBSCURE: RegExp[] = [
  /^gpt-(?!saint-patronages)/,
  /^places-[A-Z0-9]{3}$/, /^places-x-/, /^saints-\d\d$/, /^saints-abbot$/, /^saints-letter-/, /^people-[A-Z]+$/,
  /^(spiritual-works|deuterocanon|councils|heresies|catholic-classics|fathers-works|augustine-works|aquinas-works|encyclicals|patron-countries|theology-terms|italian-saints|ancient-sees|late-medieval-theologians|martyrdom-texts|francis-canonizations|vatican-ii-documents|abbeys|english-martyrs|pius|seven-churches|pauline-coworkers|romans16-women|marian-litany|early-martyrs|prophets-before-kings|women-in-acts|johannine-titles|revelation-images|pauls-first-journey|foreign-rulers|minor-prophets|rites|patron-illnesses)$/,
];
/** Plainer wording for questions whose first wording was long or hard to take in. No question is too easy: "Name a prayer" is better than a clever one. */
export const SIMPLER_PROMPTS: Record<string, string> = {
  devotions: 'Name a Catholic prayer or devotion.', marian: 'Name a title or apparition of Mary.', popes: 'Name a pope who is a saint.', women: 'Name a woman in the Bible other than Mary.',
  places: 'Name a place in the New Testament.', otbooks: 'Name a book of the Old Testament.', mysteries: 'Name a mystery of the Rosary.', sacraments: 'Name a sacrament.',
  virtues: 'Name one of the seven virtues.', 'deadly-sins': 'Name one of the seven deadly sins.', fruits: 'Name a fruit of the Holy Spirit.', 'corporal-works': 'Name a corporal work of mercy.',
  plagues: 'Name a plague of Egypt.', 'sons-of-jacob': 'Name a son of Jacob.', 'kings-of-israel': 'Name a king of Israel or Judah.', 'holy-days': 'Name a holy day of obligation.',
  'liturgical-seasons': 'Name a season of the Church year.', 'church-furnishings': 'Name something used at Mass or found in a church.', 'sacred-music': 'Name a hymn or piece of Church music.',
  'sacred-art': 'Name a famous church or work of religious art.', 'marian-apparitions': 'Name a place where Mary appeared.', 'bible-mountains': 'Name a mountain in the Bible.',
  'bible-plants': 'Name a tree or plant in the Bible.', 'bible-animals': 'Name an animal in the Bible.', 'jesus-healings': 'Name an illness that Jesus healed.', 'liturgical-observances': 'Name a Catholic feast or season.',
  'latin-worship': 'Name a Latin word or phrase used in the Church.', 'biblical-peoples': 'Name a nation or people in the Bible.', 'life-of-jesus': 'Name an event in the life of Jesus.',
  foods: 'Name a food or drink in the Bible.', occupations: 'Name a job in the Bible.', 'papal-names': 'Name a name popes have taken.', 'titles-of-jesus': 'Name a title of Jesus.',
  'christian-symbols': 'Name a Christian symbol.', 'catholic-songs': 'Name a hymn sung in church.', 'stations-of-the-cross': 'Name a Station of the Cross.', 'patron-occupations': 'Name a job that has a patron saint.',
  'bible-objects': 'Name an object in the Bible.', 'church-titles': 'Name a title or role in the Catholic Church.', 'church-architecture': 'Name a part of a church building.',
  'catholic-films': 'Name a movie or show about Jesus, the Bible or the saints.', 'old-masters': 'Name an artist who made art for the Church.', 'sacred-composers': 'Name a composer of sacred music.',
  denominations: 'Name a Christian church or denomination.', orders: 'Name a Catholic religious order.', 'resurrection-witnesses': 'Name someone who met the risen Jesus.', 'pauline-letters': 'Name a letter of Paul.',
  'luke-parables': 'Name a parable from Luke\'s Gospel.', apostles: 'Name one of the twelve apostles.', 'cities-named-for-saints': 'Name a city or town named after a saint.', 'gpt-saint-patronages': 'Name a patron saint.', 'saint-first-names': "Name a saint's first name.",
};
/** the lists that questions worked out by a letter rule may be built from, and the rules that stay: the ones a player can hold in the head ("starts with J", "has an R") */
export const LETTER_POOLS: Record<string, string[]> = {
  saints: ['start', 'has'], 'calendar-saints': ['start', 'has'], 'saint-first-names': ['start', 'has'], 'bible-people': ['start', 'has'], 'bible-books': ['start', 'has'],
  'bible-places': ['start', 'has'], 'italy-cities': ['start', 'has'], 'spain-cities': ['start', 'has'], 'saint-cities': ['start', 'has'], 'catholic-countries': ['start'], 'bible-women': ['start', 'has'],
};
const bare = (id: string) => id.replace(/^(authored\d?-|ported-)/, '');
/** a hand-written list is asked unless it is one of the obscure ones, or has too few answers that nearly everyone would name (fewer than three of the first tier) */
export const isEverydayList = (p: { id: string; answers: { tier: number }[] }) => !OBSCURE.some((r) => r.test(bare(p.id))) && p.answers.filter((a) => a.tier === 1).length >= 3;
const LETTER_KINDS = new Set(['start', 'has', 'without', 'end', 'range', 'atleast', 'atmost', 'words', 'hasword', 'digit', 'vowelstart', 'vowelend', 'consstart']);
/** questions about a fact (an apostle who was a fisherman, a mystery of the Rosary) are fine for any list but these obscure ones */
const FACT_OBSCURE = new Set(['councils', 'kings', 'apostles-creed', 'magnificat', 'psalm-23', 'beatitudes', 'our-father', 'hail-mary', 'hail-holy-queen', 'memorare', 'glory-be', 'act-of-contrition', 'st-michael', 'anima-christi', 'angel-of-god', 'ten-commandments']);
/** a question worked out by rule is asked only for a familiar list and a simple rule */
export const isEverydayRule = (pool: string, kind: string) => (LETTER_KINDS.has(kind) ? (LETTER_POOLS[pool] ?? []).includes(kind) : !FACT_OBSCURE.has(pool) && !/^places-in-/.test(pool));
