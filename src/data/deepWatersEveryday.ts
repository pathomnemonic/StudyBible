/**
 * Which Basilion questions are asked. A player has 45 seconds and should have an answer come to mind at once, the way it does in the games this one is modelled
 * on ("name something you ride standing up"). The lists below are the ones an ordinary Catholic can reach into straight away (saints, apostles, parables, the
 * sacraments, a Christmas carol, a church part). The rest stay in the data as answer lists, and a few feed the letter questions, but they are never asked:
 * the places named in one book of the Bible, a saint by feast month, the words of a prayer, the church councils, and the like are the kind of question that
 * leaves you with nothing to type.
 */
const OBSCURE: RegExp[] = [
  /^places-[A-Z0-9]{3}$/, /^places-x-/, /^saints-\d\d$/, /^saints-abbot$/, /^saints-letter-/, /^people-[A-Z]+$/,
  /^(ancient-sees|late-medieval-theologians|martyrdom-texts|francis-canonizations|vatican-ii-documents|abbeys|english-martyrs|pius|seven-churches|pauline-coworkers|romans16-women|marian-litany|early-martyrs|prophets-before-kings|women-in-acts|johannine-titles|revelation-images|pauls-first-journey|foreign-rulers|minor-prophets|rites|patron-illnesses)$/,
];
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
const FACT_OBSCURE = new Set(['councils', 'apostles-creed', 'magnificat', 'psalm-23', 'beatitudes', 'our-father', 'hail-mary', 'hail-holy-queen', 'memorare', 'glory-be', 'act-of-contrition', 'st-michael', 'anima-christi', 'angel-of-god', 'ten-commandments']);
/** a question worked out by rule is asked only for a familiar list and a simple rule */
export const isEverydayRule = (pool: string, kind: string) => (LETTER_KINDS.has(kind) ? (LETTER_POOLS[pool] ?? []).includes(kind) : !FACT_OBSCURE.has(pool) && !/^places-in-/.test(pool));
