import { describe, expect, it } from 'vitest';
import { DEEP_WATERS, type DeepPrompt } from '../src/data/deepWaters';
import { dailyDeepPrompts, deepMissMessage, deepTokens, DEEP_POINTS, DEEP_ROUNDS, findDeepAnswer, matchDeepAnswer, practiceDeepPrompts } from '../src/lib/deepWaters';

const P = (id: string): DeepPrompt => DEEP_WATERS.find((p) => p.id === id)!;
const says = (id: string, guess: string) => findDeepAnswer(P(id), guess)?.answer ?? null;

describe('Deep Waters content', () => {
  it('has enough prompts for a seven-round daily set, each with a clear question and context', () => {
    expect(DEEP_ROUNDS).toBe(7);
    expect(DEEP_WATERS.length).toBeGreaterThanOrEqual(14);
    expect(new Set(DEEP_WATERS.map((p) => p.id)).size).toBe(DEEP_WATERS.length);
    for (const p of DEEP_WATERS) {
      expect(p.prompt.trim().length, p.id).toBeGreaterThan(12);
      expect(p.context.trim().length, p.id).toBeGreaterThan(20);
      expect(p.answers.length, p.id).toBeGreaterThanOrEqual(p.closed ?? 12);
      for (const a of p.answers) expect([1, 2, 3, 4, 5], `${p.id} ${a.answer}`).toContain(a.tier);
    }
  });

  it('no two answers of a prompt can be mistaken for each other (their matching forms never collide)', () => {
    const bad: string[] = [];
    for (const p of DEEP_WATERS) {
      const seen = new Map<string, string>();
      for (const a of p.answers) for (const spelling of [a.answer, ...(a.aliases ?? [])]) {
        const key = deepTokens(spelling, p.ignore).join(' ');
        if (!key) { bad.push(`${p.id}: "${spelling}" reduces to nothing`); continue; }
        const owner = seen.get(key);
        if (owner && owner !== a.answer) bad.push(`${p.id}: "${spelling}" (${a.answer}) collides with ${owner}`);
        seen.set(key, a.answer);
      }
    }
    expect(bad).toEqual([]);
  });

  it('a prompt that names a whole set lists exactly that set', () => {
    const sizes = Object.fromEntries(DEEP_WATERS.filter((p) => p.closed).map((p) => [p.id, p.answers.length]));
    expect(sizes).toEqual({ councils: 21, rites: 24, apostles: 13, doctors: 37, ntbooks: 27, otbooks: 46, mysteries: 20 });
    for (const p of DEEP_WATERS.filter((x) => x.closed)) expect(p.answers.length, p.id).toBe(p.closed);
  });

  it('the closed sets are the right sets', () => {
    const names = (id: string) => P(id).answers.map((a) => a.answer);
    expect(names('councils')).toEqual(expect.arrayContaining(['Nicaea I', 'Constantinople I', 'Ephesus', 'Chalcedon', 'Constantinople II', 'Constantinople III', 'Nicaea II', 'Constantinople IV', 'Lateran I', 'Lateran II', 'Lateran III', 'Lateran IV', 'Lyons I', 'Lyons II', 'Vienne', 'Constance', 'Florence', 'Lateran V', 'Trent', 'Vatican I', 'Vatican II']));
    expect(names('ntbooks')).toEqual(expect.arrayContaining(['Matthew', 'Acts', 'Philemon', '3 John', 'Jude', 'Revelation']));
    expect(names('otbooks')).toEqual(expect.arrayContaining(['Genesis', 'Tobit', 'Judith', '1 Maccabees', 'Sirach', 'Baruch', 'Malachi']));
    expect(names('otbooks')).not.toContain('Revelation');
    expect(names('apostles')).toContain('Matthias');
    expect(names('apostles')).not.toContain('Paul');
    expect(names('doctors')).toEqual(expect.arrayContaining(['Irenaeus of Lyons', 'Gregory of Narek', 'John of Avila', 'Hildegard of Bingen']));
    expect(names('rites')).toEqual(expect.arrayContaining(['Latin', 'Maronite', 'Syro-Malabar', 'Eritrean', 'Krizevci']));
  });

  it('daily prompts are stable, unique and change with the day; practice sets are reproducible and separate', () => {
    const a = dailyDeepPrompts(20600), b = dailyDeepPrompts(20600), c = dailyDeepPrompts(20601);
    expect(a).toEqual(b);
    expect(a).toHaveLength(DEEP_ROUNDS);
    expect(new Set(a.map((p) => p.id)).size).toBe(DEEP_ROUNDS);
    expect(c.map((p) => p.id)).not.toEqual(a.map((p) => p.id));
    expect(practiceDeepPrompts(123)).toEqual(practiceDeepPrompts(123));
    expect(dailyDeepPrompts(123)).not.toEqual(practiceDeepPrompts(123));
  });

  it('uses an explicit increasing editorial score ladder', () => {
    expect([1, 2, 3, 4, 5].map((n) => DEEP_POINTS[n as 1 | 2 | 3 | 4 | 5])).toEqual([1, 2, 4, 8, 16]);
  });
});

describe('Deep Waters accepts the true answers a reasonable player gives', () => {
  // Every one of these was rejected by the first version of the game, which listed 12 to 23 answers per question.
  const TRUE: Record<string, string[]> = {
    women: ['Mary Magdalene', 'Martha', 'Elizabeth', 'Rachel', 'Rebecca', 'Leah', 'Hagar', 'Naomi', 'Bathsheba', 'Anna', 'Salome', 'Mary of Bethany', 'Rebekah', 'Jezebel', 'Delilah'],
    councils: ['Lateran I', 'Lateran V', 'Vienne', 'Constantinople IV', 'Lyons I', 'Council of Vienne', 'Second Council of Constantinople', 'Lateran III', 'Fourth Lateran Council', 'Council of Trent', 'Vatican 2', 'First Council of Nicaea', 'Ferrara-Florence'],
    orders: ['Ursulines', 'Passionists', 'Marists', 'Sisters of Mercy', 'Claretians', 'Camaldolese', 'Mercedarians', 'Trinitarians', 'Poor Clares', 'Norbertines', 'Vincentians', 'Society of Jesus', 'Order of Preachers'],
    fathers: ['Polycarp', 'Ignatius of Antioch', 'Clement of Rome', 'Leo the Great', 'Gregory of Nyssa', 'Papias', 'Lactantius', 'Justin Martyr', 'St. Augustine', 'Saint Jerome'],
    marian: ['Our Lady of Perpetual Help', 'Mother of God', 'Theotokos', 'Immaculate Conception', 'Our Lady of Victory', 'Our Lady of the Rosary', 'Queen of Peace', 'Our Lady of Charity', 'Stella Maris', 'Lourdes', 'Guadalupe'],
    deuterocanon: ['Maccabees', 'Letter of Jeremiah', 'Ecclesiasticus', 'Wisdom of Solomon', 'Susanna', 'Tobias'],
    places: ['Damascus', 'Athens', 'Rome', 'Galilee', 'Jericho', 'Bethany', 'Tarsus', 'Cana', 'Emmaus', 'Samaria', 'Gethsemane', 'Golgotha', 'Calvary'],
    popes: ['Linus', 'Cletus', 'Sixtus II', 'Gregory VII', 'Pius X', 'Paul VI', 'John XXIII', 'Leo IX', 'Pope John Paul II', 'St. Peter'],
    devotions: ['Sacred Heart devotion', 'Chaplet of Divine Mercy', 'Litany of the Saints', 'Adoration', 'Scapular', 'Miraculous Medal', 'Via Crucis', 'Holy Hour', 'Angelus', 'Rosary', 'Stations of the Cross', 'Divine Office', 'Hail Mary', 'Magnificat'],
    rites: ['Maronite', 'Syro-Malabar', 'Roman Rite', 'Slovak Greek Catholic Church', 'Hungarian Greek Catholic Church', 'Italo-Albanian Catholic Church', 'Armenian Catholic Church', 'Ukrainian Catholic Church', 'Coptic Catholic Church'],
    apostles: ['Peter', 'Simon Peter', 'Andrew', 'James the Greater', 'John', 'Thomas', 'Philip', 'Bartholomew', 'Matthew', 'Thaddaeus', 'Jude', 'Simon the Zealot', 'Judas Iscariot', 'Matthias', 'Levi'],
    doctors: ['Thomas Aquinas', 'Aquinas', 'Teresa of Avila', 'Thérèse of Lisieux', 'Francis de Sales', 'John of the Cross', 'Albertus Magnus', 'Anthony of Padua', 'Bede', 'Catherine of Siena', 'Augustine'],
    ntbooks: ['Romans', 'First Corinthians', '2 Timothy', 'Gospel of John', 'Letter of James', 'Third John', 'Apocalypse', 'Hebrews'],
    otbooks: ['Genesis', 'Song of Solomon', 'Qoheleth', 'First Samuel', 'II Kings', 'Ecclesiasticus', 'Psalm', 'Habakkuk'],
    mysteries: ['Annunciation', 'The Visitation', 'Agony in the Garden', 'Scourging', 'Crowning with Thorns', 'Transfiguration', 'Wedding at Cana', 'Pentecost', 'Assumption', 'Finding in the Temple', 'Institution of the Eucharist'],
  };
  for (const [id, guesses] of Object.entries(TRUE)) {
    it(`${id}: ${guesses.length} true answers are recognised`, () => {
      const missed = guesses.filter((g) => says(id, g) === null);
      expect(missed).toEqual([]);
    });
  }
});

describe('Deep Waters matching', () => {
  it('ignores case, accents, punctuation, "Saint"/"St.", little words and word order', () => {
    expect(says('orders', '  SOCIETY of JESUS ')).toBe('Jesuits');
    expect(says('doctors', 'thérèse   of LISIEUX!')).toBe('Therese of Lisieux');
    expect(says('fathers', 'St Augustine')).toBe('Augustine of Hippo');
    expect(says('fathers', 'Saint Augustine of Hippo')).toBe('Augustine of Hippo');
    expect(says('councils', 'Council of Trent')).toBe('Trent');
    expect(says('women', "Lot's wife")).toBe("Lot's wife");
    expect(says('women', 'Lots wife')).toBe("Lot's wife");
    expect(says('women', 'Magdalene Mary')).toBe('Mary Magdalene');
  });

  it('reads Roman numerals, digits and ordinals as the same number', () => {
    expect(says('councils', 'Lateran 4')).toBe('Lateran IV');
    expect(says('councils', 'Fourth Lateran')).toBe('Lateran IV');
    expect(says('councils', 'Vatican II')).toBe('Vatican II');
    expect(says('popes', 'John Paul 2')).toBe('John Paul II');
    expect(says('ntbooks', '1st Corinthians')).toBe('1 Corinthians');
    expect(says('otbooks', 'Second Kings')).toBe('2 Kings');
  });

  it('forgives one typo in a long word, but never in a number or a short word', () => {
    expect(says('orders', 'Benedictins')).toBe('Benedictines');
    expect(says('orders', 'Dominicians')).toBe('Dominicans');
    expect(says('fathers', 'Ignatius of Antioc')).toBe('Ignatius of Antioch');
    expect(says('councils', 'Chalcedan')).toBe('Chalcedon');
    expect(says('councils', 'Lateran 7')).toBeNull();
    expect(says('popes', 'Leo 6')).toBeNull();
    expect(says('orders', 'Jesits')).toBeNull(); // too short a word to guess at
  });

  it('accepts a singular or plural form', () => {
    expect(says('orders', 'Jesuit')).toBe('Jesuits');
    expect(says('orders', 'Franciscan')).toBe('Franciscans');
    expect(says('ntbooks', 'Philippian')).toBe('Philippians');
  });

  it('asks for more when a guess fits several answers, and never picks one', () => {
    for (const [id, guess] of [['councils', 'Lateran'], ['councils', 'Constantinople'], ['councils', 'Vatican'], ['women', 'Mary'], ['popes', 'Gregory'], ['popes', 'Leo']] as const) {
      const m = matchDeepAnswer(P(id), guess);
      expect(m.status, `${id}: ${guess}`).toBe('ambiguous');
      expect(deepMissMessage(P(id), m)).toMatch(/more specific/);
    }
  });

  it('does not accept things that are not answers', () => {
    expect(says('orders', 'Opus Dei')).toBeNull(); // a personal prelature, not a religious order
    expect(says('apostles', 'Paul')).toBeNull(); // an apostle, but not one of the Twelve or Matthias
    expect(says('otbooks', 'Revelation')).toBeNull();
    expect(says('councils', 'Council of Jerusalem')).toBeNull(); // Acts 15, not one of the 21
    expect(says('councils', '')).toBeNull();
    expect(says('councils', '   ')).toBeNull();
    expect(says('doctors', 'Francis')).toBeNull();
  });

  it('says "not on our list" for an open question and "not one of the N" for a closed one, and never calls an answer wrong', () => {
    const open = deepMissMessage(P('orders'), matchDeepAnswer(P('orders'), 'Zzyzx Brothers'));
    const closed = deepMissMessage(P('councils'), matchDeepAnswer(P('councils'), 'Zzyzx'));
    expect(open).toMatch(/not on our list/i);
    expect(open).toMatch(/may still be right/i);
    expect(open).not.toMatch(/wrong|incorrect|not recognized/i);
    expect(closed).toBe('That is not one of the 21. Try another.');
  });

  it('scores by the tier of the answer it matched, whichever spelling was typed', () => {
    const a = P('councils').answers.find((x) => x.answer === 'Trent')!;
    expect(a.tier).toBe(1);
    expect(matchDeepAnswer(P('councils'), 'Council of Trent')).toMatchObject({ status: 'match', answer: { answer: 'Trent' }, exact: true });
    expect(matchDeepAnswer(P('councils'), 'Chalcedan')).toMatchObject({ status: 'match', answer: { answer: 'Chalcedon' }, exact: false });
  });
});
