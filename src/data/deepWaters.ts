/**
 * Curated Catholic knowledge prompts for Deep Waters.
 *
 * Two kinds of prompt:
 *  - `closed`: the set is finite and the list below is the whole set (the 21 ecumenical councils, the 24 Churches sui iuris, the 38 Doctors of
 *    the Church, the books of the Bible...). `tests/deepWaters.test.ts` checks each count, so an answer that is true cannot be missing.
 *  - open: the set has no end (religious orders, Marian titles, saints, devotions). The list is large but cannot be complete, so the game says
 *    "not on our list" for an unlisted answer, never "wrong".
 * Rarity (`tier`, 1 common to 5 deep cut) is the editors' judgement of how often a person would think of it. It is not survey data.
 * Names are spelled as a Catholic reference would; spelling variants and common alternatives go in `aliases` (see src/lib/deepWaters.ts for what
 * matching already ignores: case, accents, "Saint"/"St.", "of", "the", plurals, Roman numerals against digits, one typo in a long word).
 */
export type DeepTier = 1 | 2 | 3 | 4 | 5 | 6;
export interface DeepAnswer { answer: string; tier: DeepTier; aliases?: string[] }
/** What a question is about. A daily set aims for one question per theme before it repeats one. */
export type DeepTheme = 'scripture' | 'saints' | 'church-history' | 'liturgy' | 'doctrine' | 'devotion' | 'places' | 'art-music' | 'people';
export interface DeepPrompt {
  id: string;
  /** what the question is about (for balancing a daily set) */
  theme: DeepTheme;
  /** where the answers come from, when they were generated from the app's own data rather than written by hand */
  source?: string;
  /** for a hand-written question: the passages or documents its answer key was checked against */
  basis?: string;
  prompt: string;
  context: string;
  answers: DeepAnswer[];
  /** the list is the whole set, of this size */
  closed?: number;
  /** words that carry no meaning for this prompt and are ignored when matching ("council" in "Council of Trent") */
  ignore?: string[];
  /** set on a question that was worked out from a complete list by a rule (see src/lib/deepWatersDerive.ts); `pool` names the list */
  derived?: { pool: string; kind: string };
}

import { MORE_PROMPTS } from './deepWatersMore';
import { AUTHORED_PROMPTS } from './deepWatersAuthored';
import { LONG_LIST_PROMPTS } from './deepWatersLongLists';
import GENERATED_PROMPTS from './deepWaters.generated.json';
import REGION_PROMPTS from './deepWaters.regions.json';
import { LONG_LIST_2_PROMPTS } from './deepWatersLongLists2';
import { LONG_TAIL_PORTED } from './deepWatersLongTailPorted';
import { EASY_LIST_PROMPTS } from './deepWatersEasyLists';
import { EVERYDAY_PROMPTS } from './deepWatersEveryday2';
import { BROAD_PROMPTS } from './deepWatersEveryday3';
import { PATRON_SAINTS } from './deepWatersPatrons';
import { BATCH_PROMPTS } from './deepWatersBatch';
import { SIMPLER_PROMPTS, isEverydayList } from './deepWatersEveryday';
import { materialize, type DerivedEntry } from '../lib/deepWatersDerive';
import { singleTop, spreadTiers } from '../lib/deepWatersSpread';
import DERIVED_ENTRIES from './deepWaters.derived.json';
import { buildPools } from './deepWatersPools';

type Row = [name: string, tier: DeepTier, aliases?: string];
const rows = (list: Row[]): DeepAnswer[] => list.map(([answer, tier, a]) => ({ answer, tier, ...(a ? { aliases: a.split('|') } : {}) }));

const CORE_PROMPTS: Omit<DeepPrompt, 'theme'>[] = [
  {
    id: 'orders',
    prompt: 'Name a Catholic religious order, congregation or society of apostolic life.',
    context: 'Religious families have different charisms, histories and rules of life. This list is long but not complete.',
    answers: rows([
      ['Benedictines', 1, 'Order of Saint Benedict|Benedictine Order|Benedictine monks'], ['Franciscans', 1, 'Order of Friars Minor|Friars Minor'], ['Jesuits', 1, 'Society of Jesus'], ['Dominicans', 1, 'Order of Preachers'],
      ['Carmelites', 2, 'Order of Carmelites|Order of the Brothers of the Blessed Virgin Mary of Mount Carmel'], ['Augustinians', 2, 'Order of Saint Augustine|Augustinian Friars'], ['Capuchins', 2, 'Order of Friars Minor Capuchin'], ['Cistercians', 3], ['Trappists', 3, 'Order of Cistercians of the Strict Observance|Trappist monks'],
      ['Redemptorists', 3, 'Congregation of the Most Holy Redeemer'], ['Salesians', 3, 'Salesians of Don Bosco|Society of Saint Francis de Sales'], ['Missionaries of Charity', 3], ['Sisters of Mercy', 2, 'Religious Sisters of Mercy'], ['Poor Clares', 3, 'Order of Saint Clare|Order of Poor Clares'],
      ['Ursulines', 3, 'Order of Saint Ursula'], ['Passionists', 3, 'Congregation of the Passion|Congregation of the Passion of Jesus Christ'], ['Marists', 4, 'Society of Mary'], ['Claretians', 4, 'Missionary Sons of the Immaculate Heart of Mary'], ['Carthusians', 4, 'Order of Carthusians'],
      ['Oratorians', 4, 'Oratory of Saint Philip Neri|Congregation of the Oratory'], ['Premonstratensians', 5, 'Norbertines|Canons Regular of Premontre|Order of Canons Regular of Prémontré'], ['Discalced Carmelites', 3, 'Teresian Carmelites'], ['De La Salle Brothers', 4, 'Brothers of the Christian Schools|Christian Brothers|Lasallian Brothers'],
      ['Piarists', 5, 'Order of the Pious Schools|Clerics Regular of the Pious Schools'], ['Mercedarians', 4, 'Order of Mercy|Order of the Blessed Virgin Mary of Mercy'], ['Trinitarians', 4, 'Order of the Most Holy Trinity|Order of the Most Holy Trinity and of the Captives'], ['Servites', 4, 'Servants of Mary|Order of Servants of Mary'],
      ['Camaldolese', 5, 'Camaldolese Benedictines|Order of Camaldoli'], ['Sylvestrines', 5, 'Sylvestrine Benedictines'], ['Vincentians', 3, 'Congregation of the Mission|Lazarists'], ['Daughters of Charity', 3, 'Daughters of Charity of Saint Vincent de Paul'], ['Sisters of Charity', 3],
      ['Little Sisters of the Poor', 4], ['Sisters of Saint Joseph', 3, 'Sisters of Saint Joseph of Carondelet'], ['Maryknoll', 3, 'Maryknoll Fathers and Brothers|Catholic Foreign Mission Society of America'], ['Paulists', 4, 'Missionary Society of Saint Paul the Apostle'], ['Holy Cross', 4, 'Congregation of Holy Cross|Holy Cross Fathers'],
      ['Society of the Divine Word', 4, 'Divine Word Missionaries|Verbites'], ['Oblates of Mary Immaculate', 4, 'Missionary Oblates|OMI'], ['Legionaries of Christ', 4], ['Theatines', 5, 'Clerics Regular of the Divine Providence'],
      ['Barnabites', 5, 'Clerics Regular of Saint Paul'], ['Somascans', 5, 'Clerics Regular of Somasca'], ['Camillians', 5, 'Order of Saint Camillus|Ministers of the Sick'], ['Brothers Hospitallers', 5, 'Hospitallers of Saint John of God|Order of Saint John of God'], ['Knights of Malta', 4, 'Sovereign Military Order of Malta|Knights Hospitaller|Order of Malta'],
      ['Teutonic Order', 5, 'Teutonic Knights'], ['Alexians', 5, 'Cellites'], ['Basilians', 4, 'Order of Saint Basil the Great'], ['Studites', 5], ['Cluniacs', 4, 'Order of Cluny'], ['Gilbertines', 5, 'Order of Saint Gilbert of Sempringham'],
      ['Minims', 5, 'Order of Minims|Order of Minim Friars'], ['Conventual Franciscans', 4, 'Friars Minor Conventual|Order of Friars Minor Conventual'], ['Sisters of Notre Dame de Namur', 5], ['Religious of the Sacred Heart', 4, 'Society of the Sacred Heart'], ['Visitandines', 5, 'Order of the Visitation of Holy Mary|Visitation Sisters|Sisters of the Visitation'],
      ['Sisters of Loreto', 5, 'Institute of the Blessed Virgin Mary|Loreto Sisters'], ['Presentation Sisters', 5], ['Brigittines', 5, 'Bridgettines|Order of the Most Holy Savior|Order of Saint Bridget'], ['Dominican Sisters', 3], ['Blessed Sacrament Fathers', 5, 'Congregation of the Blessed Sacrament|Eymardists'],
      ['Assumptionists', 5, 'Augustinians of the Assumption'], ['Spiritans', 5, 'Congregation of the Holy Spirit|Holy Ghost Fathers'], ['White Fathers', 5, 'Missionaries of Africa'], ['Comboni Missionaries', 5, 'Missionaries of the Sacred Heart'], ['Pallottines', 5, 'Society of the Catholic Apostolate'],
      ['Xaverians', 5, 'Xaverian Missionaries'], ['Consolata Missionaries', 5], ['Josephites', 5, 'Society of Saint Joseph of the Sacred Heart'], ['Resurrectionists', 5, 'Congregation of the Resurrection'], ['Rogationists', 5],
      ['Sisters of Life', 4], ['Dominican Sisters of Mary Mother of the Eucharist', 5], ['Missionaries of the Poor', 5], ['Little Brothers of Jesus', 5], ['Schoenstatt Sisters', 5],
    ]),
  },
  {
    id: 'marian',
    prompt: 'Name a title, apparition or invocation of the Blessed Virgin Mary.',
    context: 'Catholic devotion uses many titles drawn from Scripture, the Litany of Loreto, tradition and local devotion. This list is long but not complete.',
    answers: rows([
      ['Our Lady of Guadalupe', 1, 'Guadalupe|Virgin of Guadalupe'], ['Our Lady of Lourdes', 1, 'Lourdes'], ['Our Lady of Fatima', 1, 'Fatima|Our Lady of the Rosary of Fatima'], ['Mother of God', 1, 'Theotokos|God-bearer'], ['Immaculate Conception', 1, 'Our Lady of the Immaculate Conception|The Immaculate Conception'],
      ['Our Lady of Sorrows', 2, 'Mater Dolorosa|Our Lady of Dolors|Sorrowful Mother'], ['Our Lady of Mount Carmel', 2, 'Our Lady of Carmel|Mount Carmel'], ['Our Lady of Perpetual Help', 2, 'Perpetual Help|Our Mother of Perpetual Help'], ['Queen of Heaven', 2, 'Regina Caeli|Regina Coeli'], ['Star of the Sea', 2, 'Stella Maris'],
      ['Our Lady of the Rosary', 2, 'Queen of the Most Holy Rosary|Rosary Madonna'], ['Help of Christians', 3, 'Our Lady Help of Christians|Mary Help of Christians'], ['Seat of Wisdom', 3, 'Sedes Sapientiae'], ['Mystical Rose', 3, 'Rosa Mystica'],
      ['Undoer of Knots', 3, 'Mary Undoer of Knots|Untier of Knots'], ['Our Lady of Czestochowa', 3, 'Black Madonna of Czestochowa|Black Madonna|Our Lady of Częstochowa'], ['Ark of the Covenant', 3, 'Foederis Arca'], ['Tower of David', 4, 'Turris Davidica'], ['Tower of Ivory', 4, 'Turris Eburnea'], ['House of Gold', 4, 'Domus Aurea'],
      ['Gate of Heaven', 3, 'Ianua Caeli|Janua Coeli'], ['Morning Star', 3, 'Stella Matutina'], ['Health of the Sick', 3, 'Salus Infirmorum'], ['Refuge of Sinners', 3, 'Refugium Peccatorum'], ['Comforter of the Afflicted', 3, 'Consolatrix Afflictorum'], ['Queen of Peace', 3, 'Regina Pacis|Our Lady Queen of Peace'], ['Queen of Angels', 3, 'Regina Angelorum'],
      ['Mother of Mercy', 3, 'Mater Misericordiae|Our Lady of Mercy'], ['Mother of the Church', 2, 'Mater Ecclesiae'], ['Our Lady of Victory', 4, 'Our Lady of Lepanto'], ['Our Lady of Knock', 4, 'Knock'], ['Our Lady of La Salette', 4, 'La Salette'], ['Our Lady of Loreto', 4, 'Loreto|Holy House of Loreto'],
      ['Our Lady of Pompeii', 4, 'Pompeii|Our Lady of the Rosary of Pompeii'], ['Our Lady of Aparecida', 4, 'Aparecida'], ['Our Lady of Kazan', 4, 'Kazan Mother of God'], ['Our Lady of Vladimir', 4, 'Vladimir Mother of God|Vladimirskaya'], ['Our Lady of Walsingham', 4, 'Walsingham'], ['Our Lady of Montserrat', 4, 'Montserrat'],
      ['Our Lady of the Pillar', 4, 'Nuestra Senora del Pilar|Our Lady of Pilar'], ['Our Lady of Charity', 4, 'Our Lady of Charity of El Cobre|Virgen de la Caridad del Cobre|Caridad del Cobre'], ['Our Lady of Altagracia', 5, 'Nuestra Senora de la Altagracia'], ['Our Lady of Lujan', 5, 'Our Lady of Luján'], ['Our Lady of Coromoto', 5],
      ['Our Lady of Good Counsel', 4, 'Mother of Good Counsel'], ['Our Lady of Good Help', 5, 'Champion Apparition'], ['Our Lady of Banneux', 5, 'Virgin of the Poor|Banneux'], ['Our Lady of Beauraing', 5, 'Virgin of the Golden Heart|Beauraing'], ['Our Lady of Akita', 5, 'Akita'], ['Our Lady of Kibeho', 5, 'Kibeho'],
      ['Our Lady of Laus', 5, 'Laus'], ['Our Lady of Einsiedeln', 5, 'Einsiedeln'], ['Our Lady of Altotting', 5, 'Our Lady of Altötting|Altotting'], ['Our Lady of Mariazell', 5, 'Mariazell'], ['Our Lady of the Snows', 4, 'Santa Maria Maggiore|Madonna della Neve'], ['Salus Populi Romani', 4, 'Health of the Roman People'],
      ['Our Lady of Divine Providence', 4, 'Mother of Divine Providence'], ['Our Lady of Ransom', 4, 'Our Lady of Mercy of the Mercedarians|Nuestra Senora de la Merced'], ['Immaculate Heart of Mary', 2, 'Immaculate Heart'], ['Virgin Most Prudent', 4], ['Cause of Our Joy', 3, 'Causa Nostrae Laetitiae'],
      ['Mother of Divine Grace', 3, 'Mater Divinae Gratiae'], ['Mother Most Pure', 3, 'Mater Purissima'], ['Mother Most Chaste', 4, 'Mater Castissima'], ['Virgin Most Powerful', 4, 'Virgo Potens'], ['Mirror of Justice', 4, 'Speculum Iustitiae'], ['Vessel of Honour', 5, 'Vas Honorabile'],
      ['Spiritual Vessel', 5, 'Vas Spirituale'], ['Singular Vessel of Devotion', 5, 'Vas Insigne Devotionis'], ['Queen of Confessors', 5], ['Queen of Martyrs', 4], ['Queen of Apostles', 4], ['Queen of All Saints', 3], ['Queen Conceived Without Original Sin', 4], ['Queen Assumed into Heaven', 4], ['Queen of Families', 4],
      ['Our Lady of Sorrows of Sastin', 5, 'Sastin|Our Lady of Sorrows of Šaštín'], ['Our Lady of Siluva', 5, 'Our Lady of Šiluva|Siluva'], ['Our Lady of the Gate of Dawn', 5, 'Ausros Vartai|Our Lady of Ostra Brama|Ostra Brama'], ['Our Lady of Vailankanni', 5, 'Vailankanni|Our Lady of Good Health'], ['Our Lady of Manaoag', 5, 'Manaoag'], ['Our Lady of Peñafrancia', 5, 'Our Lady of Penafrancia'],
      ['Our Lady of La Naval', 5], ['Our Lady of Providence', 4], ['Our Lady of Prompt Succor', 5, 'Our Lady of Prompt Succour'], ['Our Lady of the Miraculous Medal', 3, 'Miraculous Medal|Our Lady of Graces'],     ]),
  },
  {
    id: 'fathers',
    prompt: 'Name an early Church Father or early Christian writer from before the eighth century.',
    context: 'The early centuries produced bishops, theologians and apologists whose writings shaped Christian doctrine. This list is long but not complete.',
    answers: rows([
      ['Augustine of Hippo', 1, 'Augustine|Saint Augustine|Aurelius Augustinus'], ['Jerome', 1, 'Saint Jerome|Hieronymus'], ['Ambrose of Milan', 2, 'Saint Ambrose|Ambrose'], ['Athanasius of Alexandria', 2, 'Athanasius|Saint Athanasius'], ['John Chrysostom', 2, 'Chrysostom|Saint John Chrysostom'], ['Basil the Great', 2, 'Basil of Caesarea|Saint Basil|Basil'],
      ['Gregory Nazianzen', 3, 'Gregory of Nazianzus|Gregory the Theologian'], ['Gregory of Nyssa', 3], ['Gregory the Great', 2, 'Pope Gregory I|Gregory I'], ['Irenaeus of Lyons', 3, 'Irenaeus'], ['Cyril of Alexandria', 3], ['Cyril of Jerusalem', 3], ['Clement of Alexandria', 3, 'Titus Flavius Clemens'],
      ['Clement of Rome', 2, 'Pope Clement I|Clement I|Clement'], ['Ignatius of Antioch', 2, 'Ignatius|Ignatius Theophorus'], ['Polycarp of Smyrna', 2, 'Polycarp'], ['Justin Martyr', 2, 'Justin the Martyr|Justin of Caesarea'], ['Tertullian', 3, 'Quintus Septimius Florens Tertullianus'], ['Origen', 3, 'Origen of Alexandria|Origen Adamantius'],
      ['Cyprian of Carthage', 3, 'Cyprian'], ['Hilary of Poitiers', 4, 'Hilary'], ['Leo the Great', 2, 'Pope Leo I|Leo I'], ['Ephrem the Syrian', 3, 'Ephrem|Ephraem|Ephrem of Syria'], ['John of Damascus', 4, 'John Damascene'], ['Eusebius of Caesarea', 3, 'Eusebius'], ['Lactantius', 4], ['Hippolytus of Rome', 4, 'Hippolytus'],
      ['Athenagoras of Athens', 5, 'Athenagoras'], ['Tatian', 5, 'Tatian the Assyrian'], ['Theophilus of Antioch', 5], ['Aristides of Athens', 5, 'Aristides'], ['Melito of Sardis', 5, 'Melito'], ['Papias of Hierapolis', 5, 'Papias'], ['Hermas', 4, 'Shepherd of Hermas|Hermas the Shepherd'], ['Minucius Felix', 5],
      ['Epiphanius of Salamis', 4, 'Epiphanius'], ['Isidore of Seville', 3, 'Isidore'], ['Maximus the Confessor', 4, 'Maximus'], ['Vincent of Lerins', 5, 'Vincent of Lérins'], ['John Cassian', 4, 'Cassian'], ['Rufinus of Aquileia', 5, 'Rufinus'], ['Peter Chrysologus', 4], ['Paulinus of Nola', 5], ['Prudentius', 5],
      ['Aphrahat', 5, 'Aphrahat the Persian Sage'], ['Dionysius of Alexandria', 5], ['Dionysius the Areopagite', 5, 'Pseudo-Dionysius|Pseudo-Dionysius the Areopagite'], ['Gregory Thaumaturgus', 5, 'Gregory the Wonderworker'], ['Theodoret of Cyrus', 5, 'Theodoret'], ['Didymus the Blind', 5],
      ['Macarius of Egypt', 5, 'Pseudo-Macarius'], ['Evagrius Ponticus', 5, 'Evagrius of Pontus'], ['Synesius of Cyrene', 5], ['Sophronius of Jerusalem', 5], ['Romanos the Melodist', 5], ['Pseudo-Barnabas', 5, 'Epistle of Barnabas|Barnabas'], ['Sulpicius Severus', 5], ['Optatus of Milevis', 5], ['Arnobius', 5, 'Arnobius of Sicca'],
      ['Novatian', 5], ['Cyril of Scythopolis', 5], ['Leontius of Byzantium', 5], ['Ambrosiaster', 5], ['Marius Victorinus', 5], ['Caesarius of Arles', 5], ['Fulgentius of Ruspe', 5], ['Boethius', 4], ['Cassiodorus', 5], ['Leander of Seville', 5],     ]),
  },
  {
    id: 'councils',
    prompt: 'Name one of the 21 ecumenical councils of the Catholic Church.',
    context: 'Councils gathered bishops from across the world to define doctrine and discipline. The Catholic Church counts twenty-one, from Nicaea in 325 to Vatican II.',
    closed: 21,
    ignore: ['council', 'ecumenical'],
    answers: rows([
      ['Nicaea I', 1, 'First Council of Nicaea|Nicaea|Nicea|Council of Nicaea|Nicaea 325'], ['Constantinople I', 2, 'First Council of Constantinople|Constantinople 381'], ['Ephesus', 2, 'Council of Ephesus|Ephesus 431'], ['Chalcedon', 2, 'Council of Chalcedon|Chalcedon 451'],
      ['Constantinople II', 3, 'Second Council of Constantinople|Constantinople 553'], ['Constantinople III', 4, 'Third Council of Constantinople|Constantinople 680'], ['Nicaea II', 3, 'Second Council of Nicaea|Nicaea 787'], ['Constantinople IV', 4, 'Fourth Council of Constantinople|Constantinople 869'],
      ['Lateran I', 4, 'First Lateran Council|First Council of the Lateran|Lateran 1123'], ['Lateran II', 4, 'Second Lateran Council|Second Council of the Lateran|Lateran 1139'], ['Lateran III', 4, 'Third Lateran Council|Third Council of the Lateran|Lateran 1179'], ['Lateran IV', 3, 'Fourth Lateran Council|Fourth Council of the Lateran|Lateran 1215'],
      ['Lyons I', 4, 'First Council of Lyons|First Council of Lyon|Lyon I|Lyon 1245'], ['Lyons II', 4, 'Second Council of Lyons|Second Council of Lyon|Lyon II|Lyon 1274'], ['Vienne', 4, 'Council of Vienne|Vienne 1311'], ['Constance', 3, 'Council of Constance|Constance 1414'],
      ['Florence', 3, 'Council of Florence|Ferrara-Florence|Council of Ferrara-Florence|Basel-Ferrara-Florence|Council of Basel-Ferrara-Florence|Basel-Ferrara-Florence Council'], ['Lateran V', 4, 'Fifth Lateran Council|Fifth Council of the Lateran|Lateran 1512'], ['Trent', 1, 'Council of Trent|Trent 1545'],
      ['Vatican I', 2, 'First Vatican Council|First Council of the Vatican|Vatican 1869'], ['Vatican II', 1, 'Second Vatican Council|Second Council of the Vatican|Vatican 1962'],
    ]),
  },
  {
    id: 'deuterocanon',
    prompt: 'Name a book, or a section of a book, in the Catholic Old Testament that is not in most Protestant Bibles.',
    context: 'The Catholic canon includes seven deuterocanonical books, plus Greek additions to Esther and Daniel.',
    ignore: ['book'],
    answers: rows([
      ['Tobit', 1, 'Tobias|Book of Tobit'], ['Judith', 1, 'Book of Judith'], ['Wisdom', 1, 'Wisdom of Solomon|Book of Wisdom'], ['Sirach', 1, 'Ecclesiasticus|Wisdom of Sirach|Wisdom of Ben Sira|Ben Sira|Book of Sirach'], ['Baruch', 2, 'Book of Baruch'],
      ['1 Maccabees', 1, 'First Maccabees|I Maccabees|1st Maccabees|Maccabees'], ['2 Maccabees', 1, 'Second Maccabees|II Maccabees|2nd Maccabees'], ['Additions to Esther', 3, 'Greek Esther|Greek Additions to Esther|Rest of Esther'], ['Prayer of Azariah', 3, 'Song of Azariah'], ['Song of the Three Young Men', 3, 'Song of the Three Children|Song of the Three Holy Children|Song of the Three Jews'],
      ['Susanna', 2, 'Story of Susanna|Susanna and the Elders'], ['Bel and the Dragon', 3, 'Bel and the Serpent'], ['Letter of Jeremiah', 4, 'Epistle of Jeremiah|Letter of Jeremias|Baruch 6'],
    ]),
  },
  {
    id: 'devotions',
    prompt: 'Name a Catholic prayer, devotion or pious practice beyond the Mass.',
    context: 'Catholic prayer includes liturgical prayer, popular devotions and forms of meditation. This list is long but not complete.',
    answers: rows([
      ['Rosary', 1, 'Holy Rosary|Marian Rosary|Rosary of the Blessed Virgin Mary'], ['Stations of the Cross', 1, 'Way of the Cross|Via Crucis|Via Dolorosa|Stations'], ['Eucharistic adoration', 1, 'Adoration|Adoration of the Blessed Sacrament|Holy Hour|Perpetual Adoration|Exposition of the Blessed Sacrament'], ['Novena', 1, 'Novenas'],
      ['Divine Mercy Chaplet', 2, 'Chaplet of Divine Mercy|Divine Mercy|Chaplet of the Divine Mercy'], ['Angelus', 2, 'The Angelus'], ['Lectio Divina', 2, 'Divine Reading'], ['Liturgy of the Hours', 2, 'Divine Office|Breviary|Office of Readings|Daily Office|Morning Prayer|Evening Prayer|Compline|Lauds|Vespers'], ['Benediction', 2, 'Benediction of the Blessed Sacrament'],
      ['Act of Contrition', 2], ['Memorare', 2, 'Prayer of Saint Bernard'], ['Hail Mary', 1, 'Ave Maria'], ['Our Father', 1, 'Lord\'s Prayer|Pater Noster'], ['Glory Be', 1, 'Gloria Patri'], ['Apostles\' Creed', 1, 'Apostles Creed'], ['Hail Holy Queen', 2, 'Salve Regina'],
      ['Examen', 3, 'Ignatian Examen|Daily Examen|Examination of Conscience'], ['Litany of Loreto', 3, 'Litany of the Blessed Virgin Mary|Litany of Our Lady'], ['Litany of the Saints', 3], ['Litany of the Sacred Heart', 4, 'Litany of the Sacred Heart of Jesus'], ['Litany of Saint Joseph', 4], ['Litany of the Holy Name', 4, 'Litany of the Holy Name of Jesus'],
      ['Jesus Prayer', 3, 'Prayer of the Heart'], ['Seven Sorrows Rosary', 4, 'Servite Rosary|Chaplet of the Seven Sorrows|Seven Sorrows Chaplet'], ['First Fridays', 3, 'First Fridays devotion|Nine First Fridays|Nine Fridays'], ['First Saturdays', 3, 'First Saturdays devotion|Five First Saturdays'],
      ['Sacred Heart devotion', 2, 'Devotion to the Sacred Heart|Sacred Heart of Jesus|Sacred Heart'], ['Consecration to Mary', 3, 'Total Consecration|Consecration to Jesus through Mary|33 Day Consecration|Marian Consecration'], ['Scapular', 3, 'Brown Scapular|Scapular of Mount Carmel|Carmelite Scapular'], ['Miraculous Medal', 3, 'Miraculous Medal devotion'],
      ['Chaplet of Saint Michael', 4, 'Saint Michael Chaplet|Chaplet of Saint Michael the Archangel'], ['Prayer to Saint Michael', 2, 'Saint Michael Prayer|Prayer to Saint Michael the Archangel'], ['Anima Christi', 4], ['Prayer of Saint Francis', 3, 'Make Me an Instrument of Your Peace|Peace Prayer|Saint Francis Prayer'], ['Come Holy Spirit', 3, 'Veni Sancte Spiritus|Veni Creator Spiritus|Prayer to the Holy Spirit'],
      ['Eternal Rest', 3, 'Eternal Rest Prayer|Requiem Aeternam'], ['Prayers for the Dead', 3, 'Praying for the souls in purgatory|Prayer for the Holy Souls'], ['Grace before Meals', 2, 'Blessing before Meals|Grace before meals|Bless Us O Lord'], ['Grace after Meals', 3, 'Thanksgiving after Meals'], ['Morning Offering', 3],
      ['Spiritual Communion', 4, 'Act of Spiritual Communion'], ['Pilgrimage', 2, 'Pilgrimages'], ['Procession', 3, 'Corpus Christi Procession|Eucharistic Procession|Processions'], ['Holy Water', 3, 'Blessing with holy water|Sprinkling with holy water'], ['Sign of the Cross', 1], ['Genuflection', 2],
      ['Lenten Fasting', 2, 'Fasting|Abstinence|Friday Abstinence|Lenten Penance'], ['Almsgiving', 3, 'Alms'], ['Chaplet of the Holy Wounds', 5, 'Chaplet of the Five Wounds'], ['Rosary of the Seven Joys', 5, 'Franciscan Crown|Franciscan Rosary|Crown of Our Lady'],
      ['Little Office of the Blessed Virgin Mary', 4, 'Little Office of Our Lady'], ['Saint Anthony Novena', 4, 'Tuesday Devotion to Saint Anthony'], ['Saint Joseph Novena', 4], ['Christmas Novena', 4, 'Novena of Christmas|Christmas Novena of Saint Andrew|Saint Andrew Christmas Novena'], ['Quarant\' Ore', 5, 'Forty Hours|Forty Hours Devotion|Forty Hours Adoration'],
      ['Tenebrae', 4, 'Service of Tenebrae'], ['Prayer Before the Crucifix', 4, 'En Ego|Behold O Kind and Most Sweet Jesus'], ['Prayer of Abandonment', 5, 'Prayer of Abandonment of Charles de Foucauld'], ['Fatima Prayer', 3, 'O My Jesus|Decade Prayer'], ['Guardian Angel Prayer', 2, 'Angel of God|Angel of God My Guardian Dear'],
      ['Prayer of Saint Ignatius', 4, 'Suscipe|Take Lord Receive|Prayer for Generosity'], ['Prayer of Saint Thomas Aquinas', 5, 'Prayer before Study|Creator Ineffable'], ['Prayer of Saint Augustine', 5], ['Prayer of Saint Patrick', 4, 'Saint Patrick\'s Breastplate|Breastplate of Saint Patrick|Lorica'], ['Te Deum', 3, 'Te Deum Laudamus'],
      ['Magnificat', 2, 'Canticle of Mary|Song of Mary'], ['Benedictus', 3, 'Canticle of Zechariah|Song of Zechariah'], ['Nunc Dimittis', 3, 'Canticle of Simeon|Song of Simeon'], ['Gloria', 2, 'Glory to God in the Highest|Gloria in Excelsis'], ['Regina Caeli', 3, 'Regina Coeli|Queen of Heaven Prayer'], ['Ave Maris Stella', 4, 'Hail Star of the Sea'], ['Tantum Ergo', 3], ['O Salutaris', 4, 'O Salutaris Hostia'], ['Pange Lingua', 4, 'Pange Lingua Gloriosi'], ['Adoro Te Devote', 4, 'Adoro Te'],
    ]),
  },
  {
    id: 'rites',
    prompt: 'Name one of the 24 Churches sui iuris in full communion with Rome (the Latin Church or an Eastern Catholic Church).',
    context: 'The Catholic Church is a communion of 24 Churches sui iuris: the Latin Church and 23 Eastern Catholic Churches, each with its own liturgical and spiritual tradition.',
    closed: 24,
    ignore: ['catholic', 'church', 'greek', 'rite'],
    answers: rows([
      ['Latin', 1, 'Latin Church|Roman Catholic|Roman Church|Roman Rite|Latin Rite|Roman Catholic Church|Western Church'],
      ['Maronite', 2, 'Maronite Church|Maronite Catholic Church|Maronite Rite'], ['Syro-Malabar', 2, 'Syro-Malabar Church|Syro Malabar Catholic Church|Syro-Malabar Catholic Church'], ['Ukrainian', 2, 'Ukrainian Greek Catholic Church|Ukrainian Catholic Church|Ukrainian Greek-Catholic Church|UGCC'],
      ['Melkite', 3, 'Melkite Greek Catholic Church|Melkite Church|Melchite|Melkite Catholic Church'], ['Chaldean', 3, 'Chaldean Catholic Church|Chaldean Church'], ['Armenian', 3, 'Armenian Catholic Church|Armenian Church|Armenian Rite'], ['Coptic', 3, 'Coptic Catholic Church|Coptic Church'], ['Syro-Malankara', 3, 'Syro-Malankara Catholic Church|Syro Malankara|Malankara Catholic Church'],
      ['Ruthenian', 4, 'Ruthenian Greek Catholic Church|Ruthenian Byzantine Catholic Church|Byzantine Catholic Church in America|Carpatho-Rusyn|Ruthenian Catholic Church'], ['Romanian', 4, 'Romanian Greek Catholic Church|Romanian Church United with Rome|Romanian Catholic Church'], ['Syriac', 4, 'Syriac Catholic Church|Syrian Catholic Church|Syriac Church'],
      ['Ethiopian', 4, 'Ethiopian Catholic Church|Ethiopic Catholic Church'], ['Eritrean', 4, 'Eritrean Catholic Church'], ['Slovak', 4, 'Slovak Greek Catholic Church|Slovak Catholic Church'], ['Hungarian', 4, 'Hungarian Greek Catholic Church|Hungarian Catholic Church'], ['Italo-Albanian', 5, 'Italo-Albanian Catholic Church|Italo-Greek|Italo-Albanian Church|Italo Albanian'],
      ['Albanian', 5, 'Albanian Greek Catholic Church|Albanian Byzantine Catholic Church|Albanian Catholic Church'], ['Belarusian', 5, 'Belarusian Greek Catholic Church|Belarusian Catholic Church|Byelorussian'], ['Bulgarian', 5, 'Bulgarian Greek Catholic Church|Bulgarian Catholic Church|Bulgarian Byzantine Catholic Church'], ['Hellenic', 5, 'Hellenic Greek Catholic Church|Greek Catholic Church of Greece'],
      ['Krizevci', 5, 'Križevci|Byzantine Catholic Church of Croatia and Serbia|Croatian and Serbian Greek Catholic Church|Greek Catholic Church of Croatia and Serbia|Krizevci Church|Eparchy of Krizevci'], ['Macedonian', 5, 'Macedonian Greek Catholic Church|Greek Catholic Church of Macedonia|Byzantine Catholic Church of Macedonia'], ['Russian', 5, 'Russian Greek Catholic Church|Russian Catholic Church|Russian Byzantine Catholic Church'],
    ]),
  },
  {
    id: 'popes',
    prompt: 'Name a pope who has been canonized or is venerated as a saint.',
    context: 'Many popes of the early Church, most of them martyrs, are honoured as saints, and several modern popes have been canonized. This list is long but not complete.',
    ignore: ['pope'],
    answers: rows([
      ['Peter', 1, 'Saint Peter|Simon Peter|Pope Peter'], ['Gregory the Great', 1, 'Gregory I|Pope Gregory I|Gregory I the Great'], ['John Paul II', 1, 'Pope John Paul II|Karol Wojtyla|John Paul 2|John Paul the Great'], ['Pius X', 2, 'Pope Pius X|Pius 10|Giuseppe Sarto'], ['Leo the Great', 2, 'Leo I|Pope Leo I|Leo 1'],
      ['John XXIII', 2, 'Pope John XXIII|John 23|Good Pope John'], ['Paul VI', 2, 'Pope Paul VI|Paul 6|Giovanni Battista Montini'], ['Clement I', 2, 'Clement of Rome|Pope Clement I'], ['Pius V', 2, 'Pope Pius V|Pius 5'], ['Linus', 3, 'Pope Linus'], ['Cletus', 3, 'Anacletus|Pope Cletus|Pope Anacletus'],
      ['Sylvester I', 3, 'Sylvester|Pope Sylvester I'], ['Damasus I', 3, 'Damasus|Pope Damasus'], ['Celestine V', 3, 'Pietro da Morrone|Pope Celestine V'], ['Gregory VII', 3, 'Hildebrand|Pope Gregory VII'], ['Leo IX', 4, 'Pope Leo IX'], ['Martin I', 3, 'Pope Martin I'], ['Callixtus I', 4, 'Callistus I|Calixtus I|Pope Callixtus'],
      ['Stephen I', 4, 'Pope Stephen I'], ['Fabian', 4, 'Pope Fabian|Fabianus'], ['Cornelius', 4, 'Pope Cornelius'], ['Sixtus II', 4, 'Xystus II|Pope Sixtus II'], ['Sixtus I', 5, 'Xystus I'], ['Sixtus III', 5, 'Xystus III'], ['Evaristus', 5], ['Alexander I', 5], ['Telesphorus', 5], ['Hyginus', 5], ['Pius I', 5], ['Anicetus', 5], ['Soter', 5],
      ['Eleutherius', 5, 'Eleutherus'], ['Victor I', 5], ['Zephyrinus', 5], ['Urban I', 5], ['Pontian', 5, 'Pontianus'], ['Lucius I', 5], ['Dionysius', 5], ['Felix I', 5], ['Eutychian', 5, 'Eutychianus'], ['Caius', 5, 'Gaius'], ['Marcellinus', 5], ['Marcellus I', 5], ['Eusebius', 5], ['Miltiades', 5, 'Melchiades'],
      ['Mark', 5, 'Pope Mark'], ['Julius I', 5], ['Siricius', 5], ['Anastasius I', 5], ['Innocent I', 4], ['Zosimus', 5], ['Boniface I', 5], ['Celestine I', 4, 'Pope Celestine I'], ['Hilarius', 5, 'Hilary|Hilarus'], ['Simplicius', 5], ['Felix III', 5], ['Gelasius I', 4, 'Gelasius'], ['Symmachus', 5], ['Hormisdas', 5],
      ['John I', 5], ['Agapetus I', 5, 'Agapitus I'], ['Silverius', 5], ['Eugene I', 5], ['Agatho', 5], ['Leo II', 5], ['Benedict II', 5], ['Sergius I', 5], ['Gregory II', 5], ['Gregory III', 5], ['Zachary', 5, 'Zacharias'], ['Paul I', 5], ['Leo III', 5], ['Paschal I', 5], ['Leo IV', 5], ['Nicholas I', 4, 'Nicholas the Great'], ['Adrian III', 5, 'Hadrian III'],
    ]),
  },
  {
    id: 'women',
    prompt: 'Name a woman in the Bible other than Mary, the mother of Jesus.',
    context: 'Scripture includes matriarchs, judges, prophets, queens, disciples and witnesses, in both Testaments and the deuterocanonical books. This list is long but not complete.',
    answers: rows([
      ['Eve', 1], ['Sarah', 1, 'Sarai'], ['Ruth', 1], ['Esther', 1, 'Hadassah'], ['Mary Magdalene', 1, 'Magdalene|Mary of Magdala'], ['Martha', 1, 'Martha of Bethany'], ['Elizabeth', 1, 'Elisabeth|Mother of John the Baptist'], ['Rachel', 1], ['Rebecca', 1, 'Rebekah'], ['Leah', 1], ['Hagar', 2], ['Delilah', 2], ['Bathsheba', 2], ['Jezebel', 2],
      ['Deborah', 2], ['Miriam', 2], ['Hannah', 2, 'Anna the mother of Samuel'], ['Abigail', 2], ['Judith', 2], ['Rahab', 2], ['Naomi', 2], ['Lydia', 2, 'Lydia of Thyatira'], ['Salome', 2], ['Anna', 2, 'Anna the prophetess|Anna the Prophetess'], ['Mary of Bethany', 2, 'Mary sister of Martha'], ['Lot\'s wife', 2, 'Wife of Lot'], ['Potiphar\'s wife', 3, 'Wife of Potiphar'],
      ['Jael', 3], ['Huldah', 3], ['Phoebe', 3], ['Priscilla', 3, 'Prisca'], ['Tabitha', 3, 'Dorcas'], ['Susanna', 3, 'Susannah'], ['Tamar', 3], ['Dinah', 3], ['Zipporah', 3], ['Orpah', 3], ['Michal', 3], ['Vashti', 3], ['Athaliah', 3], ['Herodias', 3], ['Joanna', 3, 'Joanna wife of Chuza'],
      ['Mary the mother of James', 3, 'Mary of Clopas|Mary Clopas|Mary the wife of Clopas|Mary mother of James and Joses'], ['Sapphira', 3], ['Rhoda', 3], ['Eunice', 4], ['Lois', 4], ['Junia', 4], ['Damaris', 4], ['Drusilla', 4], ['Bernice', 4, 'Berenice'], ['Claudia', 4], ['Chloe', 4], ['Apphia', 4], ['Euodia', 4, 'Evodia'], ['Syntyche', 4],
      ['Tryphena', 5], ['Tryphosa', 5], ['Persis', 5], ['Julia', 5], ['Shiphrah', 5], ['Puah', 5], ['Jochebed', 4], ['Queen of Sheba', 3, 'Sheba'], ['Widow of Zarephath', 4, 'Widow of Sarepta'], ['Shunammite woman', 4, 'Shunammite|Woman of Shunem'], ['Abishag', 4], ['Gomer', 4], ['Zeruiah', 5], ['Keturah', 5], ['Bilhah', 5], ['Zilpah', 5],
      ['Asenath', 5], ['Basemath', 5], ['Rizpah', 5], ['Maacah', 5], ['Hephzibah', 5], ['Samaritan woman', 2, 'Woman at the well|Woman of Samaria'], ['Syrophoenician woman', 4, 'Canaanite woman'], ['Widow of Nain', 4], ['Widow with two coins', 3, 'Widow\'s mite|Poor widow'], ['Woman with the flow of blood', 3, 'Hemorrhaging woman|Woman with an issue of blood'],
      ['Jairus\' daughter', 4], ['Peter\'s mother-in-law', 4], ['Pilate\'s wife', 3, 'Claudia Procula|Wife of Pilate'], ['Candace', 5, 'Queen of the Ethiopians'],     ]),
  },
  {
    id: 'places',
    prompt: 'Name a city, town or place mentioned in the New Testament.',
    context: 'Think beyond Jerusalem and Bethlehem: the Gospels and the early Church span Galilee, Judea, Asia Minor, Greece and Rome. This list is long but not complete.',
    answers: rows([
      ['Jerusalem', 1], ['Bethlehem', 1], ['Nazareth', 1], ['Rome', 1], ['Capernaum', 2], ['Galilee', 1], ['Judea', 2, 'Judaea'], ['Samaria', 2], ['Bethany', 2], ['Jericho', 2], ['Cana', 2], ['Emmaus', 2], ['Damascus', 2], ['Antioch', 2], ['Ephesus', 2], ['Corinth', 2], ['Athens', 2], ['Patmos', 3], ['Gethsemane', 2, 'Garden of Gethsemane'], ['Golgotha', 2, 'Calvary'],
      ['Mount of Olives', 2, 'Olivet'], ['Jordan', 2, 'Jordan River'], ['Sea of Galilee', 2, 'Lake of Gennesaret|Sea of Tiberias|Lake Tiberias'], ['Bethsaida', 3], ['Chorazin', 4, 'Korazin'], ['Nain', 4], ['Tiberias', 4], ['Magdala', 3], ['Caesarea Philippi', 3], ['Caesarea', 3, 'Caesarea Maritima'], ['Tyre', 3], ['Sidon', 3],
      ['Philippi', 3], ['Thessalonica', 3, 'Thessaloniki'], ['Berea', 4, 'Beroea'], ['Colossae', 3], ['Laodicea', 3], ['Smyrna', 4], ['Pergamum', 4, 'Pergamon'], ['Thyatira', 4], ['Sardis', 4], ['Philadelphia', 4], ['Galatia', 3], ['Tarsus', 3], ['Lystra', 4], ['Derbe', 4], ['Iconium', 4], ['Troas', 4], ['Miletus', 4], ['Joppa', 3, 'Jaffa'], ['Lydda', 4, 'Lod'],
      ['Cyprus', 3], ['Crete', 3], ['Malta', 3, 'Melita'], ['Puteoli', 5], ['Syracuse', 5], ['Rhegium', 5], ['Cenchreae', 5], ['Perga', 5], ['Paphos', 5], ['Salamis', 5], ['Neapolis', 5], ['Amphipolis', 5], ['Apollonia', 5], ['Cos', 5], ['Rhodes', 5], ['Patara', 5], ['Myra', 5], ['Cnidus', 5], ['Sychar', 4], ['Gaza', 4], ['Azotus', 5, 'Ashdod'], ['Gadara', 4, 'Gerasa|Gergesa'],
      ['Decapolis', 4], ['Bethphage', 5], ['Cenacle', 3, 'Upper Room'], ['Pool of Bethesda', 4, 'Bethesda'], ['Pool of Siloam', 4, 'Siloam'], ['Temple', 2, 'Temple of Jerusalem|The Temple|Jerusalem Temple'], ['Mount Tabor', 3, 'Tabor'], ['Mount of Beatitudes', 3], ['Mount Hermon', 5], ['Macedonia', 3], ['Achaia', 4, 'Achaea'], ['Asia', 4, 'Asia Minor'], ['Pamphylia', 5], ['Cilicia', 4], ['Phrygia', 5], ['Bithynia', 5], ['Pontus', 5], ['Cappadocia', 5],
      ['Illyricum', 5], ['Spain', 4, 'Hispania'], ['Egypt', 2], ['Babylon', 3], ['Nineveh', 4], ['Sodom', 3], ['Zion', 3], ['Arimathea', 4, 'Arimathaea'], ['Antipatris', 5], ['Ptolemais', 5, 'Acre'], ['Antioch in Pisidia', 4, 'Pisidian Antioch'], ['Fair Havens', 5], ['Three Taverns', 5], ['Appii Forum', 5, 'Forum of Appius'], ['Bethabara', 5, 'Bethany beyond the Jordan'],
    ]),
  },
  {
    id: 'apostles',
    prompt: 'Name one of the Twelve Apostles, or the apostle chosen to replace Judas.',
    context: 'Jesus chose twelve apostles; after Judas, Matthias was chosen to take his place. Paul and Barnabas are called apostles too, but are not counted among the Twelve.',
    closed: 13,
    answers: rows([
      ['Peter', 1, 'Simon Peter|Cephas'], ['John', 1, 'John the Apostle|John the Evangelist|John the Beloved Disciple|John son of Zebedee'], ['James the Greater', 2, 'James son of Zebedee|James the Great|James of Zebedee|James'], ['Andrew', 2], ['Matthew', 2, 'Levi|Matthew the Tax Collector|Matthew Levi'], ['Thomas', 1, 'Doubting Thomas|Didymus'],
      ['Philip', 3], ['Bartholomew', 3, 'Nathanael|Nathaniel'], ['James the Less', 4, 'James son of Alphaeus|James of Alphaeus|James the Lesser|James the Younger'], ['Thaddaeus', 4, 'Jude|Jude Thaddaeus|Judas Thaddaeus|Thaddeus|Saint Jude|Jude the Apostle|Lebbaeus|Judas son of James'], ['Simon the Zealot', 4, 'Simon the Canaanite|Simon Zelotes|Simon the Cananean|Zealot'],
      ['Judas Iscariot', 1, 'Judas|Iscariot'], ['Matthias', 3, 'Saint Matthias'],
    ]),
  },
  {
    id: 'doctors',
    prompt: 'Name a Doctor of the Church.',
    context: 'The Church has named 38 Doctors, saints whose teaching has been of special benefit to the whole Church. The most recent, Saint John Henry Newman, was named in 2025.',
    closed: 38,
    answers: rows([
      ['Thomas Aquinas', 1, 'Aquinas|Saint Thomas Aquinas|Thomas of Aquino|Angelic Doctor'], ['Augustine of Hippo', 1, 'Augustine|Saint Augustine'], ['Jerome', 1, 'Saint Jerome'], ['Ambrose of Milan', 1, 'Ambrose'], ['Gregory the Great', 1, 'Gregory I|Pope Gregory I'], ['Teresa of Avila', 1, 'Teresa of Jesus|Saint Teresa of Avila|Teresa of Ávila'], ['Therese of Lisieux', 1, 'Thérèse of Lisieux|Little Flower|Saint Therese|Therese of the Child Jesus|Thérèse of the Child Jesus'],
      ['Catherine of Siena', 1, 'Saint Catherine of Siena'], ['John of the Cross', 2, 'Saint John of the Cross|Juan de la Cruz'], ['Francis de Sales', 2, 'Saint Francis de Sales'], ['Bonaventure', 2, 'Saint Bonaventure|Seraphic Doctor'], ['John Chrysostom', 2, 'Chrysostom'], ['Basil the Great', 2, 'Basil|Basil of Caesarea'], ['Athanasius of Alexandria', 2, 'Athanasius'], ['Gregory Nazianzen', 3, 'Gregory of Nazianzus'],
      ['Alphonsus Liguori', 2, 'Alphonsus de Liguori|Alphonsus|Saint Alphonsus Liguori|Alphonsus Maria de Liguori'], ['Anselm', 2, 'Anselm of Canterbury|Saint Anselm'], ['Bernard of Clairvaux', 2, 'Bernard|Saint Bernard'], ['Albert the Great', 2, 'Albertus Magnus|Albert Magnus|Saint Albert the Great'], ['Antony of Padua', 2, 'Anthony of Padua|Saint Anthony of Padua|Anthony|Antony|Saint Anthony'], ['Robert Bellarmine', 3, 'Bellarmine'],
      ['Peter Canisius', 3, 'Canisius'], ['Hilary of Poitiers', 4, 'Hilary'], ['Cyril of Alexandria', 3], ['Cyril of Jerusalem', 3], ['John of Damascus', 4, 'John Damascene'], ['Ephrem the Syrian', 3, 'Ephrem|Ephraem'], ['Leo the Great', 2, 'Leo I|Pope Leo I'], ['Peter Chrysologus', 4], ['Isidore of Seville', 3, 'Isidore'], ['Bede the Venerable', 3, 'Bede|Venerable Bede'],
      ['Peter Damian', 4, 'Peter Damiani'], ['Lawrence of Brindisi', 4, 'Laurence of Brindisi'], ['Hildegard of Bingen', 3, 'Hildegard'], ['John of Avila', 4, 'Juan de Avila|John of Ávila'], ['Gregory of Narek', 5, 'Gregory of Narekatsi|Grigor Narekatsi'], ['John Henry Newman', 3, 'Newman|Saint John Henry Newman|Cardinal Newman'], ['Irenaeus of Lyons', 3, 'Irenaeus'],
    ]),
  },
  {
    id: 'ntbooks',
    prompt: 'Name a book of the New Testament.',
    context: 'The New Testament has 27 books: four Gospels, Acts, twenty-one letters and Revelation.',
    closed: 27,
    ignore: ['book', 'gospel', 'letter', 'epistle', 'according'],
    answers: rows([
      ['Matthew', 1, 'Gospel of Matthew|Gospel according to Matthew|Gospel of Saint Matthew'], ['Mark', 1, 'Gospel of Mark|Gospel according to Mark'], ['Luke', 1, 'Gospel of Luke|Gospel according to Luke'], ['John', 1, 'Gospel of John|Gospel according to John'], ['Acts', 1, 'Acts of the Apostles'], ['Romans', 1, 'Letter to the Romans|Epistle to the Romans'],
      ['1 Corinthians', 2, 'First Corinthians|I Corinthians|1st Corinthians'], ['2 Corinthians', 3, 'Second Corinthians|II Corinthians|2nd Corinthians'], ['Galatians', 2], ['Ephesians', 2], ['Philippians', 2], ['Colossians', 3], ['1 Thessalonians', 3, 'First Thessalonians|I Thessalonians'], ['2 Thessalonians', 4, 'Second Thessalonians|II Thessalonians'],
      ['1 Timothy', 3, 'First Timothy|I Timothy'], ['2 Timothy', 3, 'Second Timothy|II Timothy'], ['Titus', 4], ['Philemon', 4], ['Hebrews', 2], ['James', 2, 'Epistle of James|Letter of James'], ['1 Peter', 3, 'First Peter|I Peter'], ['2 Peter', 3, 'Second Peter|II Peter'], ['1 John', 3, 'First John|I John|First Epistle of John'], ['2 John', 5, 'Second John|II John'], ['3 John', 5, 'Third John|III John'], ['Jude', 4, 'Epistle of Jude|Letter of Jude'], ['Revelation', 1, 'Apocalypse|Book of Revelation|Apocalypse of John|Revelation of John'],
    ]),
  },
  {
    id: 'otbooks',
    prompt: 'Name a book of the Catholic Old Testament.',
    context: 'The Catholic Old Testament has 46 books: the Law, the historical books, the wisdom books and the prophets, including the deuterocanonical books.',
    closed: 46,
    ignore: ['book'],
    answers: rows([
      ['Genesis', 1], ['Exodus', 1], ['Leviticus', 2], ['Numbers', 2], ['Deuteronomy', 2], ['Joshua', 2], ['Judges', 2], ['Ruth', 1], ['1 Samuel', 2, 'First Samuel|I Samuel'], ['2 Samuel', 3, 'Second Samuel|II Samuel'], ['1 Kings', 3, 'First Kings|I Kings'], ['2 Kings', 3, 'Second Kings|II Kings'], ['1 Chronicles', 3, 'First Chronicles|I Chronicles'], ['2 Chronicles', 3, 'Second Chronicles|II Chronicles'],
      ['Ezra', 3], ['Nehemiah', 3], ['Tobit', 3, 'Tobias'], ['Judith', 2], ['Esther', 1], ['1 Maccabees', 3, 'First Maccabees|I Maccabees'], ['2 Maccabees', 3, 'Second Maccabees|II Maccabees'], ['Job', 1], ['Psalms', 1, 'Psalter|Book of Psalms|Psalm'], ['Proverbs', 1], ['Ecclesiastes', 2, 'Qoheleth|Koheleth'], ['Song of Songs', 2, 'Song of Solomon|Canticle of Canticles|Canticles|Song of Songs'],
      ['Wisdom', 2, 'Wisdom of Solomon'], ['Sirach', 2, 'Ecclesiasticus|Ben Sira'], ['Isaiah', 1], ['Jeremiah', 1], ['Lamentations', 2], ['Baruch', 3], ['Ezekiel', 2], ['Daniel', 1], ['Hosea', 3], ['Joel', 3], ['Amos', 3], ['Obadiah', 4, 'Abdias'], ['Jonah', 1, 'Jonas'], ['Micah', 3], ['Nahum', 4], ['Habakkuk', 4], ['Zephaniah', 4], ['Haggai', 4], ['Zechariah', 3], ['Malachi', 3],
    ]),
  },
  {
    id: 'mysteries',
    prompt: 'Name one of the twenty mysteries of the Rosary.',
    context: 'The Rosary has four sets of five mysteries: Joyful, Luminous, Sorrowful and Glorious.',
    closed: 20,
    ignore: ['mystery', 'of', 'the', 'our', 'lord'],
    answers: rows([
      ['The Annunciation', 1, 'Annunciation'], ['The Visitation', 2, 'Visitation'], ['The Nativity', 1, 'Nativity|Birth of Jesus|Birth of Our Lord'], ['The Presentation', 3, 'Presentation in the Temple|Presentation of Jesus'], ['The Finding in the Temple', 3, 'Finding of Jesus in the Temple|Finding the Child Jesus in the Temple'],
      ['The Baptism of the Lord', 2, 'Baptism of Jesus|Baptism in the Jordan|Baptism of Christ'], ['The Wedding at Cana', 2, 'Wedding Feast at Cana|Miracle at Cana|Self-Manifestation at Cana|Cana'], ['The Proclamation of the Kingdom', 4, 'Proclamation of the Kingdom of God|Proclamation of the Kingdom and the Call to Conversion|Call to Conversion'], ['The Transfiguration', 2, 'Transfiguration'], ['The Institution of the Eucharist', 3, 'Institution of the Eucharist|Last Supper'],
      ['The Agony in the Garden', 1, 'Agony in the Garden|Agony of Jesus in the Garden|Garden of Gethsemane|Prayer in the Garden'], ['The Scourging at the Pillar', 2, 'Scourging|Scourging at the Pillar|Flagellation'], ['The Crowning with Thorns', 2, 'Crowning with Thorns|Crown of Thorns'], ['The Carrying of the Cross', 2, 'Carrying of the Cross|Way of the Cross|Jesus Carries the Cross'], ['The Crucifixion', 1, 'Crucifixion|Crucifixion and Death of Jesus|Death of Jesus'],
      ['The Resurrection', 1, 'Resurrection'], ['The Ascension', 1, 'Ascension'], ['The Descent of the Holy Spirit', 2, 'Descent of the Holy Spirit|Pentecost|Coming of the Holy Spirit'], ['The Assumption', 2, 'Assumption|Assumption of Mary'], ['The Coronation of Mary', 3, 'Coronation of Mary|Coronation of the Blessed Virgin|Crowning of Mary|Coronation of Our Lady|Coronation'],
    ]),
  },
];


const CORE_THEMES: Record<string, DeepTheme> = {
  orders: 'church-history', marian: 'devotion', fathers: 'church-history', councils: 'church-history', deuterocanon: 'scripture', devotions: 'devotion', rites: 'church-history',
  popes: 'saints', women: 'scripture', places: 'places', apostles: 'scripture', doctors: 'saints', ntbooks: 'scripture', otbooks: 'scripture', mysteries: 'devotion',
};
const core: DeepPrompt[] = CORE_PROMPTS.map((p) => ({ ...p, theme: CORE_THEMES[p.id] ?? 'doctrine' }));

/** the hand-written and generated questions, before the derived ones */
const bareId = (id: string) => id.replace(/^(authored\d?-|ported-)/, '');
const RAW_PROMPTS: DeepPrompt[] = [...core, ...MORE_PROMPTS, ...AUTHORED_PROMPTS, ...LONG_LIST_PROMPTS, ...(GENERATED_PROMPTS as DeepPrompt[]), ...(REGION_PROMPTS as DeepPrompt[]), ...LONG_LIST_2_PROMPTS, ...LONG_TAIL_PORTED, ...EASY_LIST_PROMPTS, ...EVERYDAY_PROMPTS, ...BROAD_PROMPTS, PATRON_SAINTS, ...BATCH_PROMPTS];
/** the hand lists as authored (their own tiers): the rule-derived questions are worked out from these */
export const HAND_PROMPTS: DeepPrompt[] = RAW_PROMPTS.map((p) => (SIMPLER_PROMPTS[bareId(p.id)] ? { ...p, prompt: SIMPLER_PROMPTS[bareId(p.id)] } : p));
/** the hand lists as played: the same answers, scored over all six tiers by rank (see spreadTiers) */
export const BASE_PROMPTS: DeepPrompt[] = HAND_PROMPTS.map(spreadTiers);
/** which hand lists are everyday ones is judged on the authored tiers (spreading would make every list look easy) */
const EVERYDAY_IDS = new Set(HAND_PROMPTS.filter(isEverydayList).map((p) => p.id));
export const isEverydayPrompt = (p: { id: string }) => EVERYDAY_IDS.has(p.id);

/**
 * How many questions the bank holds: 72 days of seven (it was 378 until the letter rules that asked for two conditions at once were dropped, and the lists cannot yet fill a year with one-rule questions). A question comes back no sooner than a whole cycle (72 days) minus four days. The questions after the hand-written and generated ones are derived by rule (see
 * src/lib/deepWatersDerive.ts and src/data/deepWatersPools.ts) up to this size, with no theme holding more than a quarter of the bank.
 */
export const BANK_SIZE = 72 * 7;
const THEME_SHARE = 0.31;
export const themeCaps = (() => {
  const held: Record<string, number> = {};
  for (const p of BASE_PROMPTS.filter(isEverydayPrompt)) held[p.theme] = (held[p.theme] ?? 0) + 1;
  const cap: Record<string, number> = {};
  for (const t of ['scripture', 'saints', 'church-history', 'liturgy', 'doctrine', 'devotion', 'places', 'art-music', 'people']) cap[t] = Math.floor(BANK_SIZE * THEME_SHARE) - (held[t] ?? 0);
  return cap;
})();

/** Every prompt: the hand-written groups, the groups generated from the app's own data (see scripts/deepwaters), and the questions derived by rule from complete lists. */
export const DEEP_WATERS: DeepPrompt[] = [...BASE_PROMPTS, ...materialize(buildPools(HAND_PROMPTS), DERIVED_ENTRIES as DerivedEntry[]).map(singleTop)];

/** The questions that are asked: the ones a player can answer at once (see src/data/deepWatersEveryday.ts). The rest of DEEP_WATERS is answer data for them and for the tests. */
export const DEEP_PLAYABLE: DeepPrompt[] = DEEP_WATERS.filter((p) => p.derived || isEverydayPrompt(p));
