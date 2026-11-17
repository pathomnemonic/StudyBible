import { describe, expect, it } from 'vitest';
import { DEEP_WATERS } from '../src/data/deepWaters';
import { LONG_LIST_2_PROMPTS } from '../src/data/deepWatersLongLists2';
import { deepTokens } from '../src/lib/deepWatersTokens';
import { matchDeepAnswer } from '../src/lib/deepWaters';

const P = (id: string) => DEEP_WATERS.find((p) => p.id === `authored2-${id}`)!;
const status = (id: string, g: string) => matchDeepAnswer(P(id), g).status;

const ACCEPT: Record<string, string[]> = {
  'nt-people': ['peter', 'paul', 'mary magdalene', 'pontius pilate', 'lazarus', 'zacchaeus', 'barnabas', 'lydia', 'timothy', 'nicodemus', 'caiaphas', 'herod'],
  'catholic-songs': ['silent night', 'ave maria', 'tantum ergo', 'dies irae', 'salve regina', 'o come o come emmanuel', 'on eagles wings', 'holy holy holy', 'panis angelicus', 'be not afraid'],
  'catholic-authors': ['chesterton', 'tolkien', 'dante', 'graham greene', 'flannery oconnor', 'evelyn waugh', 'hilaire belloc', 'thomas merton', 'newman'],
  'sacred-composers': ['bach', 'mozart', 'handel', 'palestrina', 'verdi', 'haydn', 'allegri', 'tallis', 'bruckner', 'faure'],
  'old-masters': ['michelangelo', 'raphael', 'caravaggio', 'giotto', 'fra angelico', 'bernini', 'rubens', 'el greco', 'botticelli', 'titian'],
  'women-saints': ['mary magdalene', 'teresa of avila', 'clare of assisi', 'joan of arc', 'monica', 'agnes', 'cecilia', 'bernadette', 'mother teresa', 'faustina', 'kateri tekakwitha'],
  'famous-churches': ['notre dame', 'sagrada familia', 'chartres', 'cologne cathedral', 'canterbury cathedral', 'saint peters basilica', 'santa maria maggiore'],
  universities: ['notre dame', 'georgetown', 'boston college', 'fordham', 'villanova', 'gonzaga', 'gregorian'],
  denominations: ['lutheran', 'baptist', 'methodist', 'anglican', 'orthodox', 'presbyterian', 'quakers', 'pentecostal', 'mormon'],
  'bible-objects': ['ark of the covenant', 'sling', 'crown of thorns', 'manger', 'harp', 'sandals', 'sword', 'yoke', 'lamp', 'cross'],
  martyrs: ['stephen', 'polycarp', 'ignatius of antioch', 'perpetua', 'agnes', 'lawrence', 'sebastian', 'cyprian', 'justin martyr', 'alban'],
  'roman-emperors': ['augustus', 'nero', 'constantine', 'diocletian', 'hadrian', 'trajan', 'marcus aurelius', 'caligula', 'julian'],
  'us-cities-saints': ['san francisco', 'saint louis', 'san diego', 'santa fe', 'corpus christi', 'sacramento', 'saint paul'],
  abbeys: ['monte cassino', 'cluny', 'clairvaux', 'gethsemani', 'lindisfarne', 'iona', 'montserrat', 'mont saint michel'],
  'ot-stories': ['noahs ark', 'david and goliath', 'jonah and the whale', 'tower of babel', 'burning bush', 'cain and abel', 'samson and delilah', 'adam and eve', 'esther'],
  'genesis-people': ['adam', 'eve', 'noah', 'abraham', 'sarah', 'isaac', 'jacob', 'esau', 'joseph', 'rebekah', 'lot', 'tamar'],
  'british-isles-saints': ['patrick', 'brigid', 'columba', 'bede', 'cuthbert', 'thomas becket', 'thomas more', 'david', 'edmund campion'],
  'christmas-songs': ['silent night', 'jingle bells', 'white christmas', 'o holy night', 'the first noel', 'good king wenceslas', 'carol of the bells', 'last christmas'],
  'patron-occupations': ['farmers', 'musicians', 'travelers', 'nurses', 'teachers', 'pilots', 'lawyers', 'bakers', 'soldiers'],
  'church-titles': ['pontiff', 'cardinal', 'bishop', 'monsignor', 'abbot', 'deacon', 'nun', 'camerlengo', 'nuncio'],
  'church-architecture': ['nave', 'transept', 'apse', 'altar', 'stained glass', 'flying buttress', 'gargoyle', 'crypt', 'rose window'],
  'catholic-films': ['the passion of the christ', 'ben-hur', 'sister act', 'the mission', 'a man for all seasons', 'the two popes', 'the exorcist'],
  'christmas-customs': ['christmas tree', 'advent wreath', 'nativity scene', 'midnight mass', 'caroling', 'las posadas', 'advent calendar'],
  'english-monarchs': ['henry viii', 'elizabeth i', 'richard iii', 'william the conqueror', 'victoria', 'charles i', 'mary i', 'alfred the great', 'edward the confessor'],
  'kings-people': ['solomon', 'elijah', 'elisha', 'ahab', 'jezebel', 'hezekiah', 'josiah', 'naaman', 'queen of sheba'],
  'samuel-people': ['david', 'saul', 'samuel', 'goliath', 'jonathan', 'bathsheba', 'absalom', 'eli', 'hannah'],
  'acts-people': ['peter', 'paul', 'stephen', 'barnabas', 'lydia', 'cornelius', 'ananias', 'timothy', 'gamaliel'],
  'rome-churches': ['saint peters basilica', 'saint john lateran', 'santa maria maggiore', 'il gesu', 'pantheon', 'san clemente'],
  'catholic-prayers': ['our father', 'hail mary', 'glory be', 'act of contrition', 'memorare', 'angelus', 'rosary', 'nicene creed', 'prayer to saint michael'],
};
const REJECT: Record<string, string[]> = {
  'nt-people': ['moses', 'david', 'abraham'],
  'catholic-songs': ['happy birthday', 'jingle bells'],
  'catholic-authors': ['shakespeare', 'mark twain', 'c s lewis'],
  'sacred-composers': ['taylor swift', 'elvis'],
  'old-masters': ['picasso', 'andy warhol', 'monet'],
  'women-saints': ['joan baez', 'queen victoria'],
  'famous-churches': ['eiffel tower', 'taj mahal'],
  universities: ['harvard', 'stanford', 'yale'],
  denominations: ['buddhism', 'islam'],
  'bible-objects': ['smartphone', 'television'],
  martyrs: ['joan of arc', 'thomas more'],
  'roman-emperors': ['julius caesar', 'cleopatra', 'napoleon'],
  'us-cities-saints': ['chicago', 'new york'],
  abbeys: ['stonehenge', 'taj mahal'],
  'ot-stories': ['sermon on the mount', 'good samaritan'],
  'genesis-people': ['moses', 'david', 'solomon'],
  'british-isles-saints': ['francis of assisi', 'padre pio'],
  'christmas-songs': ['happy birthday', 'bohemian rhapsody'],
  'patron-occupations': ['astronauts', 'youtubers'],
  'church-titles': ['sheriff', 'mayor'],
  'church-architecture': ['skyscraper', 'swimming pool'],
  'catholic-films': ['star wars', 'titanic', 'jaws'],
  'christmas-customs': ['fireworks', 'easter egg hunt'],
  'english-monarchs': ['napoleon', 'louis xiv', 'robert the bruce'],
  'kings-people': ['moses', 'abraham'],
  'samuel-people': ['elijah', 'solomon the wise'],
  'acts-people': ['jesus', 'moses'],
  'rome-churches': ['colosseum', 'trevi fountain'],
  'catholic-prayers': ['serenity prayer', 'shema'],
};

describe('the third batch of hand-written long lists', () => {
  it('are open questions in the bank, long enough to have a tail, with a basis and five or more rarity tiers', () => {
    expect(LONG_LIST_2_PROMPTS.length).toBeGreaterThanOrEqual(13);
    for (const p of LONG_LIST_2_PROMPTS) {
      expect(DEEP_WATERS, p.id).toContain(p);
      if (p.closed) { expect(p.answers.length, p.id).toBe(p.closed); expect(p.closed, p.id).toBeGreaterThanOrEqual(12); continue; }
      expect(p.answers.length, p.id).toBeGreaterThanOrEqual(60);
      expect(new Set(p.answers.map((a) => a.tier)).size, p.id).toBeGreaterThanOrEqual(5);
      expect(p.basis?.length ?? 0, p.id).toBeGreaterThan(15);
    }
  });
  it('have no two answers that the matcher reads as the same name', () => {
    for (const p of LONG_LIST_2_PROMPTS) {
      const seen = new Map<string, string>();
      for (const a of p.answers) {
        const k = deepTokens(a.answer).join(' ');
        expect(seen.has(k), `${p.id}: "${a.answer}" duplicates "${seen.get(k)}"`).toBe(false);
        seen.set(k, a.answer);
      }
    }
  });
  it('accept what a player would reasonably type and reject what is out of scope', () => {
    for (const [id, guesses] of Object.entries(ACCEPT)) for (const g of guesses) expect(['match', 'ambiguous'], `${id}: ${g}`).toContain(status(id, g));
    for (const [id, guesses] of Object.entries(REJECT)) for (const g of guesses) expect(status(id, g), `${id}: ${g}`).not.toBe('match');
  });
});
