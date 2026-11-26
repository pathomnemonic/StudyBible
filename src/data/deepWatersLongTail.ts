import type { DeepPrompt, DeepTier } from './deepWaters';

type Guess = { guess: string; accepted: boolean; reason?: string };
type CheckedPrompt = DeepPrompt & { commonGuesses: Guess[]; reviewFlags?: string[] };
type AliasMap = Record<string, string>;

// Names are hand-ordered by familiarity (recognisable first, specialist answers last), never alphabetically.
function ranked(names: string[], aliases: AliasMap = {}): DeepPrompt['answers'] {
  const cuts = [0.08, 0.20, 0.40, 0.65, 0.90].map((p) => Math.round(names.length * p));
  return names.map((answer, i) => {
    const tier = (i < cuts[0] ? 1 : i < cuts[1] ? 2 : i < cuts[2] ? 3 : i < cuts[3] ? 4 : i < cuts[4] ? 5 : 6) as DeepTier;
    const extra = aliases[answer];
    return { answer, tier, ...(extra ? { aliases: extra.split('|') } : {}) };
  });
}

const checkedLongTailPrompts: CheckedPrompt[] = [
  {
    id: 'longtail-all-popes', theme: 'people',
    prompt: 'Name a pope who is not canonized or venerated as a saint.',
    context: 'The list excludes popes already named in the saint-pope prompt and counts distinct persons, not repeated pontificates.',
    basis: 'Source list: Saecula, “All 267 Popes in Order”, following the Holy See list of Supreme Pontiffs: https://1765sanctumco.com/saecula/popes/ ; Leo XIV’s Vatican biography identifies him as the 267th Successor of Peter: https://www.vatican.va/content/leo-xiv/en/biography/documents/biografia_leone-xiv.html .',
    reviewFlags: ['The official ordinal count is 267 pontificates, not 266 distinct people: Benedict IX appears three times in the numbered sequence. This open answer key lists distinct papal persons, not repeated pontificates.', 'The Holy See’s list retains a small number of historically disputed early claimants (including Leo VIII, Benedict V and Sylvester III); they are included because the selected source follows the official list.'],
    answers: ranked([
      'Francis', 'Benedict XVI', 'Pius IX', 'Pius XII', 'Leo XIII',
      'Urban II', 'Innocent III', 'Gregory IX', 'Leo XIV', 'Adrian I',
      'Sylvester II', 'Benedict IX', 'Victor II', 'Alexander II', 'Paschal II',
      'Alexander III', 'Martin V', 'Pius II', 'Alexander VI', 'Julius II',
      'Paul III', 'Clement VII', 'Pius IV', 'Clement V', 'Boniface VIII',
      'Innocent IV', 'Anterus', 'John II', 'Benedict I', 'Gregory IV',
      'Eutichianus', 'Deusdedit', 'Alexander IV', 'Urban IV', 'Clement IV',
      'Pius XI', 'Marcellinus', 'Liberius', 'Anastasius II', 'Felix IV',
      'Boniface II', 'Vigilius', 'Pelagius I', 'John III', 'Pelagius II',
      'Sabinian', 'Boniface III', 'Boniface IV', 'Boniface V', 'Honorius I',
      'Severinus', 'John IV', 'Theodore I', 'Vitalian', 'Adeodatus II',
      'Donus', 'John V', 'Conon', 'John VI', 'John VII',
      'Sisinnius', 'Constantine', 'Stephen II', 'Stephen III', 'Stephen IV',
      'Eugene II', 'Valentine', 'Sergius II', 'Benedict III', 'Adrian II',
      'John VIII', 'Marinus I', 'Stephen V', 'Formosus', 'Boniface VI',
      'Stephen VI', 'Romanus', 'Theodore II', 'John IX', 'Benedict IV',
      'Leo V', 'Sergius III', 'Anastasius III', 'Lando', 'John X',
      'Leo VI', 'Stephen VII', 'John XI', 'Leo VII', 'Stephen VIII',
      'Marinus II', 'Agapetus II', 'John XII', 'Leo VIII', 'Benedict V',
      'John XIII', 'Benedict VI', 'Benedict VII', 'John XIV', 'John XV',
      'Gregory V', 'John XVII', 'John XVIII', 'Sergius IV', 'Benedict VIII',
      'John XIX', 'Sylvester III', 'Gregory VI', 'Clement II', 'Damasus II',
      'Stephen IX', 'Nicholas II', 'Victor III', 'Gelasius II', 'Callixtus II',
      'Honorius II', 'Innocent II', 'Celestine II', 'Lucius II', 'Eugene III',
      'Anastasius IV', 'Adrian IV', 'Lucius III', 'Urban III', 'Gregory VIII',
      'Clement III', 'Celestine III', 'Honorius III', 'Celestine IV', 'Gregory X',
      'Innocent V', 'Adrian V', 'John XXI', 'Nicholas III', 'Martin IV',
      'Honorius IV', 'Nicholas IV', 'Benedict XI', 'John XXII', 'Benedict XII',
      'Clement VI', 'Innocent VI', 'Urban V', 'Gregory XI', 'Urban VI',
      'Boniface IX', 'Innocent VII', 'Gregory XII', 'Eugene IV', 'Nicholas V',
      'Callixtus III', 'Paul II', 'Sixtus IV', 'Innocent VIII', 'Pius III',
      'Leo X', 'Adrian VI', 'Julius III', 'Marcellus II', 'Paul IV',
      'Gregory XIII', 'Sixtus V', 'Urban VII', 'Gregory XIV', 'Innocent IX',
      'Clement VIII', 'Leo XI', 'Paul V', 'Gregory XV', 'Urban VIII',
      'Innocent X', 'Alexander VII', 'Clement IX', 'Clement X', 'Innocent XI',
      'Alexander VIII', 'Innocent XII', 'Clement XI', 'Innocent XIII', 'Benedict XIII',
      'Clement XII', 'Benedict XIV', 'Clement XIII', 'Clement XIV', 'Pius VI',
      'Pius VII', 'Leo XII', 'Pius VIII', 'Gregory XVI', 'Benedict XV',
      'John Paul I',
    ], {
      'Deusdedit': 'Adeodatus I',
      'Adeodatus II': 'Pope Adeodatus II',
      'Stephen II': 'Stephen III (alternate numbering)',
      'Eutichianus': 'Eutichian',
      'Callixtus II': 'Callistus II',
      'Francis': 'Pope Francis',
      'Leo XIV': 'Pope Leo XIV'
    }),
    commonGuesses: [
      { guess: 'Urban II', accepted: true }, { guess: 'Innocent III', accepted: true }, { guess: 'Alexander VI', accepted: true },
      { guess: 'Leo XIII', accepted: true }, { guess: 'Clement VII', accepted: true },
      { guess: 'Peter', accepted: false, reason: 'Already covered by the saint-pope prompt.' },
      { guess: 'Gregory the Great', accepted: false, reason: 'Already covered by the saint-pope prompt.' },
      { guess: 'John Paul II', accepted: false, reason: 'Already covered by the saint-pope prompt.' },
      { guess: 'Pius X', accepted: false, reason: 'Already covered by the saint-pope prompt.' },
      { guess: 'John XXIII', accepted: false, reason: 'Already covered by the saint-pope prompt.' }
    ]
  },
  {
    id: 'longtail-latin-worship', theme: 'liturgy',
    prompt: 'Name a Latin word or phrase used in Catholic worship.',
    context: 'The source texts include the Roman Missal, the Liturgy of the Hours, and traditional Latin prayers and chant.',
    basis: 'Source lists and texts: Missale Romanum, editio typica tertia (2002), Ordo Missae; USCCB guidance on prayers in Latin; Divinum Officium Latin/English texts: https://www.usccb.org/resources/instruction-liturgical-formation-catholic-schools ; https://www.divinumofficium.com/ .',
    answers: ranked([
      'Kyrie eleison','Gloria in excelsis Deo','Credo in unum Deum','Sanctus','Agnus Dei',
      'Dominus vobiscum','Et cum spiritu tuo','Sursum corda','Habemus ad Dominum','Amen','Alleluia','Ite missa est',
      'Gloria Patri','Pater noster','Ave Maria','Salve Regina','Regina caeli','Veni Creator Spiritus','Veni Sancte Spiritus','Te Deum laudamus','Tantum ergo','O salutaris Hostia','Adoro te devote','Requiem aeternam',
      'Et in terra pax','Laudamus te','Benedicimus te','Adoramus te','Glorificamus te','Gratias agimus tibi','Propter magnam gloriam tuam','Domine Deus Rex caelestis','Qui tollis peccata mundi','Suscipe deprecationem nostram','Quoniam tu solus Sanctus','Tu solus Altissimus','Et incarnatus est','Et homo factus est','Crucifixus etiam pro nobis','Et resurrexit','Et ascendit in caelum','Et iterum venturus est','Et vitam venturi saeculi','Benedictus qui venit','Hosanna in excelsis','Mysterium fidei','Per ipsum et cum ipso','Libera nos quaesumus Domine','Pax Domini sit semper vobiscum','Ecce Agnus Dei','Domine non sum dignus','Corpus Christi','Sanguis Christi','Deo gratias','Verbum Domini',
      'Dignum et iustum est','Vere dignum et iustum est','Accipite et manducate','Hoc est enim Corpus meum','Hic est enim calix Sanguinis mei','Lux aeterna',
    ], {
      'Kyrie eleison':'Kyrie',
      'Gloria in excelsis Deo':'Gloria',
      'Credo in unum Deum':'Nicene Creed|Symbolum Nicaenum',
      'Sanctus':'Holy Holy Holy',
      'Agnus Dei':'Lamb of God',
      'Pater noster':'Our Father',
      'Ave Maria':'Hail Mary',
      'Salve Regina':'Hail Holy Queen',
      'Regina caeli':'Queen of Heaven',
      'Te Deum laudamus':'Te Deum',
      'Veni Creator Spiritus':'Come Creator Spirit',
      'Veni Sancte Spiritus':'Come Holy Spirit',
      'Ite missa est':'Go forth the Mass is ended',
      'Et cum spiritu tuo':'And with your spirit',
      'Sursum corda':'Lift up your hearts'
    }),
    commonGuesses: [
      { guess: 'Kyrie eleison', accepted: true }, { guess: 'Gloria in excelsis Deo', accepted: true },
      { guess: 'Sanctus', accepted: true }, { guess: 'Agnus Dei', accepted: true }, { guess: 'Sursum corda', accepted: true },
      { guess: 'In manus tuas', accepted: false, reason: 'A biblical Latin phrase, not in the selected Catholic worship texts.' },
      { guess: 'Ora pro nobis', accepted: false, reason: 'A Latin devotional phrase; not in the answer key and not verified for this source scope.' },
      { guess: 'Memento mori', accepted: false, reason: 'A Latin spiritual maxim, not a liturgical text in the cited scope.' },
      { guess: 'Veni vidi vici', accepted: false, reason: 'A classical Latin quotation, not Catholic worship.' },
      { guess: 'Carpe diem', accepted: false, reason: 'A classical Latin maxim, not Catholic worship.' }
    ]
  },
  {
    id: 'longtail-heresies', theme: 'church-history',
    prompt: 'Name a historical Christian heresy or heterodox doctrinal movement.',
    context: 'The list draws on Catholic historical reference works; labels and the identity of a movement’s founder are not always agreed.',
    basis: 'Source list: Catholic Encyclopedia and Catholic Answers historical entries on heresies and their principal teachers: https://www.newadvent.org/cathen/07256b.htm ; https://www.catholic.com/encyclopedia/heresy .',
    reviewFlags: ['Eponymous aliases identify conventional associations, not always a provable single founder. Some historical labels (especially later medieval and Reformation-era movements) are contested; retain the flag when reviewing.'],
    answers: ranked([
      'Arianism','Pelagianism','Nestorianism','Donatism','Gnosticism',
      'Monophysitism','Manichaeism','Marcionism','Docetism','Montanism','Jansenism','Iconoclasm',
      'Apollinarianism','Eutychianism','Monothelitism','Adoptionism','Sabellianism','Novatianism','Semi-Pelagianism','Priscillianism','Catharism','Waldensianism','Hussitism','Origenism',
      'Ebionitism','Valentinianism','Basilideanism','Carpocratianism','Sethianism','Ophitism','Cainitism','Encratism','Elkesaitism','Messalianism','Paulicianism','Bogomilism','Albigensianism','Wycliffism','Lollardy','Taboritism','Utraquism','Anomoeanism','Macedonianism','Pneumatomachianism','Homoianism','Homoiousianism','Aetianism','Patripassianism','Modalism','Monarchianism','Subordinationism','Tritheism','Conciliarism','Gallicanism','Febronianism','Quietism','Josephinism','Antidicomarianism','Collyridianism','Apellesianism','Bardaisanism',
      'Adamites','Hermogenianism','Acedianism','Priscillianism (Spanish movement)',
    ], {
      'Arianism':'Arius',
      'Pelagianism':'Pelagius',
      'Nestorianism':'Nestorius',
      'Donatism':'Donatus',
      'Marcionism':'Marcion',
      'Montanism':'Montanus',
      'Manichaeism':'Mani|Manichaeus',
      'Sabellianism':'Sabellius',
      'Novatianism':'Novatian',
      'Apollinarianism':'Apollinaris of Laodicea',
      'Eutychianism':'Eutyches',
      'Jansenism':'Cornelius Jansen',
      'Priscillianism':'Priscillian'
    }),
    commonGuesses: [
      { guess: 'Arianism', accepted: true }, { guess: 'Pelagianism', accepted: true },
      { guess: 'Nestorianism', accepted: true }, { guess: 'Gnosticism', accepted: true },
      { guess: 'Jansenism', accepted: true },
      { guess: 'Calvinism', accepted: false, reason: 'A Reformation tradition, not in the specific historical heresy catalogue used here.' },
      { guess: 'Mormonism', accepted: false, reason: 'A modern religious movement outside this historical heresy list.' },
      { guess: 'Buddhism', accepted: false, reason: 'A separate religion, not a Christian heresy.' },
      { guess: 'Atheism', accepted: false, reason: 'A non-theistic position, not a Christian doctrinal movement.' },
      { guess: 'Scholasticism', accepted: false, reason: 'A broad medieval theological method, not a heresy.' }
    ]
  },
  {
    id: 'longtail-italian-saints', theme: 'saints',
    prompt: 'Name a Catholic saint or blessed born in Italy.',
    context: 'The source catalogue records saints and blesseds by birthplace and death place; this answer key selects Italian-born figures.',
    basis: 'Source list: GCatholic, Saints and Blesseds of Italy, filtering the birthplace column to Italy: https://gcatholic.org/saints/data/country-IT.htm .',
    reviewFlags: ['For early saints whose birthplace is not explicitly recorded in the catalogue, verify the historical birthplace independently; the prompt requires birth in Italy, not merely death or veneration there.'],
    answers: ranked([
      'Francis of Assisi', 'Catherine of Siena', 'Benedict of Nursia', 'Clare of Assisi', 'Padre Pio',
      'Thomas Aquinas', 'Philip Neri', 'John Bosco', 'John XXIII', 'Rita of Cascia',
      'Gemma Galgani', 'Maria Goretti', 'Carlo Acutis', 'Pier Giorgio Frassati', 'Gianna Beretta Molla',
      'Giuseppe Moscati', 'Aloysius Gonzaga', 'Robert Bellarmine', 'Catherine of Bologna', 'Angela Merici',
      'Frances of Rome', 'Camillus de Lellis', 'Bernardino of Siena', 'Lawrence of Brindisi', 'Alphonsus Liguori',
      'Charles Borromeo', 'John Leonardi', 'Joseph Calasanz', 'Joseph of Cupertino',
      'Gerard Majella', 'Leonard of Port Maurice', 'Paul of the Cross', 'Veronica Giuliani', 'Bonaventure of Potenza',
      'Joseph Benedict Cottolengo', 'Luigi Orione', 'Gaspare del Bufalo', 'John of Capistrano', 'Pius V',
      'Celestine V', 'Gregory X', 'Urban V', 'Pope Damasus I', 'Pope Marcellus I',
      'Pope Eusebius', 'Pope Cornelius', 'Pope Fabian', 'Pope Sixtus II', 'Pope Pontian',
      'Pope Martin I', 'Pope Agatho', 'Angela of Foligno', 'Margaret of Cortona', 'Umiliana de Cerchi',
      'Juliana Falconieri', 'Francesca Romana', 'Catherine of Genoa', 'Giacomo Bianconi', 'Andrea Conti da Segni',
      'Giovanna da Orvieto', 'Alberto degli Abati', 'Chiara della Croce da Montefalco',
    ], {
      'Aloysius Gonzaga': 'Luigi Gonzaga',
      'Francis of Assisi': 'Saint Francis|St Francis',
      'Catherine of Siena': 'Saint Catherine of Siena',
      'Benedict of Nursia': 'Saint Benedict|Benedict',
      'Clare of Assisi': 'Saint Clare',
      'Padre Pio': 'Pio of Pietrelcina|Saint Pio',
      'Thomas Aquinas': 'Aquinas|Saint Thomas Aquinas',
      'John Bosco': 'Don Bosco|Saint John Bosco',
      'Philip Neri': 'Saint Philip Neri',
      'Gianna Beretta Molla': 'Saint Gianna Molla',
      'Carlo Acutis': 'Saint Carlo Acutis'
    }),
    commonGuesses: [
      { guess: 'Francis of Assisi', accepted: true }, { guess: 'Catherine of Siena', accepted: true },
      { guess: 'Padre Pio', accepted: true }, { guess: 'Thomas Aquinas', accepted: true }, { guess: 'Carlo Acutis', accepted: true },
      { guess: 'Anthony of Padua', accepted: false, reason: 'Born in Lisbon, Portugal; the prompt is limited to Italian birthplaces.' },
      { guess: 'Francis Xavier', accepted: false, reason: 'Born in the Kingdom of Navarre, not Italy.' },
      { guess: 'Teresa of Ávila', accepted: false, reason: 'Born in Spain, not Italy.' },
      { guess: 'John Paul II', accepted: false, reason: 'Born in Poland, not Italy.' },
      { guess: 'Augustine of Hippo', accepted: false, reason: 'Born in Roman North Africa, not Italy.' }
    ]
  },
  {
    id: 'longtail-english-martyrs', theme: 'saints',
    prompt: 'Name a Catholic confessor or martyr of the English Reformation and its aftermath.',
    context: 'The source catalogue covers English confessors and martyrs from 1534 to 1729, including the Elizabethan and later persecutions.',
    basis: 'Source list: Catholic Encyclopedia / Catholic Answers, “English Confessors and Martyrs (1534–1729)”: https://www.newadvent.org/cathen/05474a.htm ; https://www.catholic.com/encyclopedia/english-confessors-and-martyrs .',
    answers: ranked([
      'Thomas More','John Fisher','Edmund Campion','Margaret Clitherow','Robert Southwell',
      'John Houghton','Richard Reynolds','Cuthbert Mayne','Anne Line','Nicholas Owen','John Roberts','Henry Walpole',
      'Ralph Sherwin','Alexander Briant','John Payne','John Shert','Robert Johnson','William Filby','Luke Kirby','Thomas Cottam','William Lacey','Richard Kirkman','William Hart','Richard Thirkeld',
      'John Stone','John Forest','Humphrey Middlemore','William Exmew','Sebastian Newdigate','John Rochester','James Walworth','Thomas Johnson','William Greenwood','John Davye','Robert Salt','Walter Pierson','Thomas Greene','Thomas Scryven','Thomas Redyng','Richard Bere','Robert Horne','Richard Whiting','Hugh Farringdon','John Beche','John Thorne','Roger James','William Eynon','John Rugg','Adrian Fortescue','Margaret Pole','German Gardiner','John Felton','Thomas Plumtree','John Storey','Thomas Percy','Thomas Woodhouse','John Nelson','Thomas Nelson','Everard Hanse','Thomas Ford','Lawrence Richardson',
      'William Cuthbert','John Boste','John Cornelius','John Ingram','John Almond','Philip Howard',
    ], {
      'Thomas More':'Saint Thomas More|St Thomas More',
      'John Fisher':'Saint John Fisher',
      'Edmund Campion':'Saint Edmund Campion',
      'Margaret Clitherow':'Saint Margaret Clitherow',
      'Anne Line':'Saint Anne Line',
      'Nicholas Owen':'Saint Nicholas Owen',
      'Ralph Sherwin':'Saint Ralph Sherwin',
      'John Houghton':'Saint John Houghton'
    }),
    commonGuesses: [
      { guess: 'Thomas More', accepted: true }, { guess: 'John Fisher', accepted: true },
      { guess: 'Edmund Campion', accepted: true }, { guess: 'Margaret Clitherow', accepted: true }, { guess: 'Anne Line', accepted: true },
      { guess: 'Thomas Becket', accepted: false, reason: 'Martyred in 1170, centuries before the Reformation.' },
      { guess: 'Oliver Plunkett', accepted: false, reason: 'An Irish martyr, not part of this English Reformation catalogue.' },
      { guess: 'John Ogilvie', accepted: false, reason: 'A Scottish martyr, not in the source scope.' },
      { guess: 'Joan of Arc', accepted: false, reason: 'A French martyr from the fifteenth century.' },
      { guess: 'John Wycliffe', accepted: false, reason: 'A reformer who died before the period, not a Catholic martyr.' }
    ]
  },
  {
    id: 'longtail-korean-martyrs', theme: 'saints',
    prompt: 'Name a Catholic martyr of the persecutions in Korea.',
    context: 'The answer key draws from the 103 Korean martyrs canonized in 1984 and the wider documented Korean martyr catalogue.',
    basis: 'Source lists: Catholic Bishops’ Conference of Korea 103 Martyrs; Vatican canonization record; Dallet-derived list: https://english.cbck.or.kr/Saints103 ; https://www.vatican.va/news_services/liturgy/saints/ns_lit_doc_list_saints-jp-ii_en.html ; https://anthony.sogang.ac.kr/Dallet/KoreanSaintsList.html .',
    answers: ranked([
      'Andrew Kim Tae-gon','Paul Chong Ha-sang','Peter Yi Ho-yong','Protase Chong Kuk-bo','Agatha Kim A-gi',
      'Anna Pak A-gi','Agatha Yi So-sa','Magdalene Kim Ob-i','Augustine Yi Kwang-hon','Barbara Han A-gi','Lucy Pak Hui-sun','Damian Nam Myong-hyog',
      'Peter Kwon Tug-in','Joseph Chang Song-jib','Barbara Kim','Barbara Yi','Rose Kim','Martha Kim Song-im','Teresa Yi Mae-im','Anna Kim Chang-keum','John Baptist Yi Kwang-nyol','Magdalene Yi Yong-hui','Lucy Kim','Mary Won Kwi-im',
      'Mary Park Kun-a-gi','Barbara Kwon Hui','John Pak Hu-jae','Barbara Yi Chong-hui','Mary Yi Yon-hui','Agnes Kim Hyo-ju','Francis Choe Kyong-hwan','Laurent Imbert','Peter Maubant','Jacob Chastan','Augustine Yu Chin-gil','Magdalene Ho Kye-im','Sebastian Nam Yi-gwan','Juliet Kim','Agatha Chon Kyong-hyob','Charles Cho Shin-chol','Ignatius Kim Che-jun','Magdalene Pak Pong-son','Perpetua Hong Kum-ju','Columba Kim Hyo-im','Catherine Yi','Magdalene Cho','Peter Yu Tae-chol','Cecilia Yu So-sa','Peter Choe Chang-hub','Barbara Cho Chung-i','Magdalene Han Yong-i','Benedicta Hyon Kyong-nyon','Elisabeth Chong Chong-hye','Barbara Ko Sun-i','Magdalene Yi Yong-deog','Teresa Kim','Agatha Yi','Stephen Min Kuk-ka','Andrew Chong Kwang-yong',
      'Paul Ho-hyop','Augustine Pak Chong-won','Peter Hong Pyong-ju','Magdalene Son So-byeog','Agatha Yi Kyong-i','Maria Yi In-dog','Agatha Kwon Chin-i','Paul Hong Yong-ju','John Yi Munu','Barbara Choe Yong-i','Anthony Kim Song-u','Charles Hyon Song-mun','Peter Nam Kyong-mun','Lawrence Han I-hyong','Susanna U Surim','Joseph Im Chi-baeg','Teresa Kim Imi','Agatha Yi Kannan','Catherine Chong Choryom','Simon Berneux','Peter Aumaitre','Peter Dorie','Louis Beaulieu','Justin de Bretenières','Anthony Daveluy','Luke Hwang Sok-tu','Joseph Chang Chu-gi','John Yi Yun-il',
    ], {
      'Andrew Kim Tae-gon':'Saint Andrew Kim Taegon|Andrew Kim Taegon',
      'Paul Chong Ha-sang':'Saint Paul Chong Hasang|Paul Chong Hasang',
      'Peter Yi Ho-yong':'Peter Yi Hoyong',
      'Lucy Pak Hui-sun':'Lucia Pak Hui-sun|Lucia Park Huisun',
      'Francis Choe Kyong-hwan':'Francis Choe Kyong-hwan',
      'Laurent Imbert':'Laurent-Marie-Joseph Imbert|Saint Laurent Imbert',
      'Peter Maubant':'Pierre Maubant|Philibert Maubant',
      'Jacob Chastan':'Jacques Chastan|James Chastan',
      'Anthony Daveluy':'Antoine Daveluy',
      'Luke Hwang Sok-tu':'Lucas Hwang Sok-tu'
    }),
    commonGuesses: [
      { guess: 'Andrew Kim Tae-gon', accepted: true }, { guess: 'Paul Chong Ha-sang', accepted: true },
      { guess: 'Peter Yu Tae-chol', accepted: true }, { guess: 'Laurent Imbert', accepted: true }, { guess: 'Agnes Kim Hyo-ju', accepted: true },
      { guess: 'Robert Jermain Thomas', accepted: false, reason: 'A Protestant missionary, not a Catholic martyr in the canonized Korean group.' },
      { guess: 'Paul Miki', accepted: false, reason: 'A Japanese martyr, not a Korean martyr.' },
      { guess: 'Francis Xavier', accepted: false, reason: 'A missionary to Asia who was not martyred in Korea.' },
      { guess: 'Peter Claver', accepted: false, reason: 'A Jesuit saint associated with Colombia, not Korea.' },
      { guess: 'John Paul II', accepted: false, reason: 'The pope who canonized the group, not a martyr in it.' }
    ]
  },
  {
    id: 'longtail-japanese-martyrs', theme: 'saints',
    prompt: 'Name a Catholic martyr of the persecutions in Japan.',
    context: 'The answer key includes members of the 205 Martyrs of Japan and other well-documented Japanese persecution martyrs.',
    basis: 'Source lists: CatholicSaints.Info, “205 Martyrs of Japan” (profile directory); Vatican list of saints proclaimed by John Paul II: https://catholicsaints.info/205-martyrs-of-japan/ ; https://www.vatican.va/news_services/liturgy/saints/ns_lit_doc_list_saints-jp-ii_en.html .',
    answers: ranked([
      'Paul Miki','John Goto','James Kisai','Philip of Jesus','Peter Baptist',
      'Martin of the Ascension','Francis Blanco','Gonzalo Garcia','Anthony Deynan','Louis Ibaraki','Agatha of Kyoto','Agnes Takeya',
      'Alexius Sanbashi Saburo','Alfonso Navarrete-Benito','Alonso de Mena Navarette','Andreas Murayama Tokuan','Andreas Yakichi','Andrew Sushinda','Anna Kajiya','Antonio of Saint Bonaventure','Antonio of Saint Dominic','Antonius Domi','Antonius Hamanomachi','Antonius Kimura',
      'Antonius Kyuni','Antonius of Saint Francis','Antonius Ono','Antonius Sanga','Antonius Yamada','Antony Ixida','Apolinar Franco','Apollonia of Nagasaki','Baltasar de Torres Arias','Bartholomaeus Kawano Shichiemon','Bartholomaeus Mohyoe','Bartholomaeus Seki','Bartolome Diaz Laurel','Bartolome Gutierrez Rodriguez','Benedictus of Kyoto','Caius of Korea','Camillus Costanzo','Carlo Spinola','Catharina Hashimoto','Catharina of Nagasaki','Catharina Tanaka','Charles Spinola','Clara of Nagasaki','Clemens Ono','Cosmas of Kyoto','Cosmas Takeya Sozaburo','Damianus Tanda Yaichi','Didacus Tsuzu','Diego Carvalho','Dionysius Fugixima','Domingos Jorge','Dominic Magoshichi','Dominic Nihachi','Dominic of the Holy Rosary','Dominic Shobyoye','Dominic Tomaki',
      'Dominica Ogata','Dominicus Nakano','Dominicus of Saint Francis','Dominicus Yamada','Emmanuel Kosaburo','Ferdinand Ayala','Francis Galvez','Francis of Saint Bonaventure','Francisco Castellet Vinale','Francisco Morales Sedeño','Francisco of Saint Mary','Francisco Pacheco','Francisco Terrero de Ortega Perez','Franciscus Hashimoto','Franciscus Nihachi','Franciscus of Kyoto','Franciscus Shizaburo','Franciscus Takeya','Franciscus Yakichi','Gabriel of Kyoto','Gabriel of Saint Magdalen','Gaspar Fisogiro','Gaspar Koteda','Gaspar Sadamatsu','Giovanni Battista Zola','Gundisalvus Fusai Chozo','Hieronimus Soroku','Iacobus Bunzo Gengoro','Iacobus Hayashida','Ignatius Jorge-Fernandes',
    ], {
      'Paul Miki':'Saint Paul Miki',
      'John Goto':'John Soan de Goto|Saint John Goto',
      'James Kisai':'Saint James Kisai',
      'Philip of Jesus':'Philip of Jesus de las Casas',
      'Peter Baptist':'Peter Bautista',
      'Gonzalo Garcia':'Gonsalo Garcia',
      'Francis Blanco':'Francisco Blanco',
      'Martin of the Ascension':'Martin de la Ascension',
      'Agatha of Kyoto':'Blessed Agatha of Kyoto',
      'Agnes Takeya':'Blessed Agnes Takeya'
    }),
    commonGuesses: [
      { guess: 'Paul Miki', accepted: true }, { guess: 'John Goto', accepted: true },
      { guess: 'James Kisai', accepted: true }, { guess: 'Agatha of Kyoto', accepted: true }, { guess: 'Carlo Spinola', accepted: true },
      { guess: 'Andrew Kim Tae-gon', accepted: false, reason: 'A Korean martyr, not a martyr of Japan.' },
      { guess: 'Francis Xavier', accepted: false, reason: 'A missionary to Japan who died naturally in China.' },
      { guess: 'Thomas More', accepted: false, reason: 'An English Reformation martyr.' },
      { guess: 'Miguel Pro', accepted: false, reason: 'A Mexican martyr.' },
      { guess: 'Maximilian Kolbe', accepted: false, reason: 'Martyred in Auschwitz, not in Japan.' }
    ]
  },
  {
    id: 'longtail-augustine-works', theme: 'church-history',
    prompt: 'Name a surviving work by Augustine of Hippo.',
    context: 'Titles include books, dialogues, treatises, biblical commentaries preserved in the Augustinian corpus.',
    basis: 'Source bibliography: James J. O’Donnell, Georgetown University, “Augustine: Selected Bibliography”; Stanford Encyclopedia of Philosophy bibliography and corpus overview: https://faculty.georgetown.edu/jod/twayne/twaynebib.html ; https://plato.stanford.edu/entries/augustine/ .',
    answers: ranked([
      'Confessions','City of God','On the Trinity','On Christian Doctrine','Enchiridion',
      'The Happy Life','Against the Academics','Soliloquies','On Free Choice of the Will','On the Teacher','On Order','On Music',
      'On the Immortality of the Soul','On the Quantity of the Soul','On True Religion','On the Literal Meaning of Genesis','On Genesis Against the Manichees','On the Sermon on the Mount','On the Good of Marriage','On Holy Virginity','On Continence','On Patience','On the Good of Widowhood','On the Work of Monks',
      'On the Spirit and the Letter','On Nature and Grace','On Grace and Free Choice','On the Merits and Forgiveness of Sins','On Marriage and Concupiscence','On the Predestination of the Saints','On the Gift of Perseverance','On Rebuke and Grace','On Grace and Original Sin','On the Soul and Its Origin','On Catechizing Beginners','On Christian Combat','On the Care of the Dead','On the Divination of Demons','On Eighty-Three Questions','On the Morals of the Catholic Church','On the Morals of the Manichaeans','On the Usefulness of Belief','On Faith and the Creed','On the Creed','On the Psalms','Expositions on the Psalms','Tractates on the Gospel of John','Tractates on the First Letter of John','Questions on the Heptateuch','Locutions on the Heptateuch','Questions on the Gospels','Harmony of the Gospels','The Literal Meaning of Genesis','The Unfinished Literal Commentary on Genesis','Exposition of Galatians','Incomplete Exposition of Romans','Eighty-four Questions from Romans','The Retractions','The Enchiridion on Faith, Hope and Love','The Mirror of Scripture','Sermons','Letters',
    ], {
      'On the Creed': 'On the Creed to Catechumens',
      'Confessions':'Confessiones',
      'City of God':'De civitate Dei',
      'On the Trinity':'De Trinitate',
      'On Christian Doctrine':'De doctrina Christiana',
      'Enchiridion':'Handbook on Faith Hope and Love|Enchiridion on Faith Hope and Love|On Faith, Hope and Charity',
      'The Retractions':'Retractationes',
      'Against the Academics':'Contra Academicos',
      'Soliloquies':'Soliloquia',
      'On Free Choice of the Will':'De libero arbitrio'
    }),
    commonGuesses: [
      { guess: 'Confessions', accepted: true }, { guess: 'City of God', accepted: true },
      { guess: 'On the Trinity', accepted: true }, { guess: 'On Christian Doctrine', accepted: true }, { guess: 'Enchiridion', accepted: true },
      { guess: 'Summa Theologiae', accepted: false, reason: 'Written by Thomas Aquinas, not Augustine.' },
      { guess: 'On the Incarnation', accepted: false, reason: 'Athanasius is the author traditionally associated with this work.' },
      { guess: 'The Didache', accepted: false, reason: 'An anonymous early Christian text, not an Augustinian work.' },
      { guess: 'Proslogion', accepted: false, reason: 'Anselm of Canterbury’s work.' },
      { guess: 'The Imitation of Christ', accepted: false, reason: 'A later medieval devotional work.' }
    ]
  },
  {
    id: 'longtail-aquinas-works', theme: 'church-history',
    prompt: 'Name a work written by Thomas Aquinas.',
    context: 'The source catalogues include his theological treatises, disputed questions, biblical commentaries, philosophical commentaries, and liturgical works.',
    basis: 'Source bibliographies: Corpus Thomisticum, Opera omnia; Stanford Encyclopedia of Philosophy, “Thomas Aquinas”: https://www.corpusthomisticum.org/ ; https://plato.stanford.edu/entries/aquinas/ .',
    answers: ranked([
      'Summa Theologiae','Summa Contra Gentiles','Catena Aurea','Compendium of Theology','On Being and Essence',
      'On the Principles of Nature','Commentary on the Sentences','Disputed Questions on Truth','Disputed Questions on Power','Disputed Questions on Evil','On the Unity of the Intellect','On the Eternity of the World',
      'On the Separate Substances','On the Spiritual Creatures','On the Soul','On the Virtues','On Charity','On Kingship','On the Reasons of the Faith','On the Articles of Faith',
      'On the Mixture of Elements','On the Hidden Operations of Nature','On the Sorts','On the Motion of the Heart','On the Judgments of the Stars','On the Perfection of the Spiritual Life','On the Perfection of the Christian Life','On the Purchase and Sale of Time','On the Form of Absolution','On the Boethian De Trinitate','On Boethius De Hebdomadibus','Commentary on the Divine Names','Commentary on the Book of Causes','Commentary on Aristotle’s Physics','Commentary on Aristotle’s Metaphysics','Commentary on Aristotle’s Ethics','Commentary on Aristotle’s Politics','Commentary on Aristotle’s De Anima','Commentary on Aristotle’s De Interpretatione','Commentary on the Posterior Analytics','Commentary on the Categories','Commentary on the Meteorology','Commentary on On Generation and Corruption','Commentary on De Caelo','Commentary on Job','Commentary on Isaiah','Commentary on Jeremiah','Commentary on Matthew','Commentary on John','Commentary on Romans','Commentary on First Corinthians','Commentary on the Psalms','The Office of Corpus Christi','Pange Lingua','Adoro Te Devote','Lauda Sion','Tantum Ergo','O Salutaris Hostia','Exposition of the Hail Mary','Exposition of the Apostles’ Creed','Contra Impugnantes Dei Cultum','De Rationibus Fidei','De Unitate Intellectus contra Averroistas','De Veritate',
    ], {
      'On the Perfection of the Spiritual Life': 'On the Spiritual Life',
      'Summa Theologiae':'Summa Theologica',
      
      'On Being and Essence':'De ente et essentia',
      'On the Principles of Nature':'De principiis naturae',
      'On Kingship':'De regno',
      'Catena Aurea':'Golden Chain'
    }),
    commonGuesses: [
      { guess: 'Summa Theologiae', accepted: true }, { guess: 'Summa Contra Gentiles', accepted: true },
      { guess: 'Catena Aurea', accepted: true }, { guess: 'On Being and Essence', accepted: true }, { guess: 'De Regno', accepted: true },
      { guess: 'Confessions', accepted: false, reason: 'Written by Augustine of Hippo.' },
      { guess: 'Proslogion', accepted: false, reason: 'Written by Anselm of Canterbury.' },
      { guess: 'The Imitation of Christ', accepted: false, reason: 'A later medieval work not written by Aquinas.' },
      { guess: 'The Cloud of Unknowing', accepted: false, reason: 'An anonymous fourteenth-century text.' },
      { guess: 'Summa Theologiae by Bonaventure', accepted: false, reason: 'Bonaventure did not write the work titled Summa Theologiae.' }
    ]
  },
  {
    id: 'longtail-fathers-works', theme: 'church-history',
    prompt: 'Name a surviving writing by a Church Father other than Augustine.',
    context: 'The answer key draws on the Ante-Nicene and Nicene/Post-Nicene Fathers collections and standard patristic bibliographies.',
    basis: 'Source collections: Ante-Nicene Fathers and Nicene and Post-Nicene Fathers, hosted by New Advent; Oxford Bibliographies on the Apostolic Fathers: https://www.newadvent.org/fathers/ ; https://academic.oup.com/reference/62341/reference-article-abstract/561741752 .',
    answers: ranked([
      'On the Incarnation','Against Heresies','On the Holy Spirit','On the Priesthood','Life of Antony',
      'First Apology','Second Apology','Dialogue with Trypho','The Didache','First Clement','Second Clement','The Martyrdom of Polycarp',
      'Epistle to the Philippians','Epistle of Barnabas','Shepherd of Hermas','Epistle to Diognetus','Stromata','The Instructor','Exhortation to the Greeks','On First Principles','Against Celsus','On Prayer','Commentary on John','Commentary on Matthew',
      'On the Unity of the Church','On the Lapsed','On Mortality','On Works and Almsgiving','On the Lord’s Prayer','To Donatus','On the Mysteries','On the Sacraments','On the Duties of the Clergy','Hexaemeron','On the Christian Faith','Five Theological Orations','On the Love of the Poor','Life of Moses','The Great Catechism','On the Soul and Resurrection','On Virginity','Against Eunomius','Homilies on Matthew','Homilies on John','Homilies on Romans','Homilies on First Corinthians','Homilies on Genesis','Homilies on the Statues','On the Incomprehensible Nature of God','Homilies on Acts','Baptismal Instructions','Paschal Homily','On the Making of Man','On the Holy Images','An Exact Exposition of the Orthodox Faith','Demonstration of the Apostolic Preaching','On the Apostolic Preaching','Against the Jews','On the Resurrection','Letters to Serapion','Life of Macrina','The Apology of Aristides','Octavius','Divine Institutes','On the Deaths of the Persecutors','Ecclesiastical History','Chronicle','Life of Constantine','Letters of Ignatius','The Seven Epistles of Ignatius',
    ], {
      'On the Incarnation':'De Incarnatione',
      'Against Heresies':'Adversus Haereses',
      'On the Holy Spirit':'De Spiritu Sancto|On the Holy Spirit to Amphilochius',
      'Life of Antony':'The Life of Saint Antony',
      'First Apology':'Apologia Prima',
      'Second Apology':'Apologia Secunda',
      'The Instructor':'Paedagogus',
      'On First Principles':'De Principiis',
      'Ecclesiastical History':'Historia Ecclesiastica',
      'An Exact Exposition of the Orthodox Faith':'De Fide Orthodoxa'
    }),
    commonGuesses: [
      { guess: 'On the Incarnation', accepted: true }, { guess: 'Against Heresies', accepted: true },
      { guess: 'The Didache', accepted: true }, { guess: 'First Clement', accepted: true }, { guess: 'Life of Antony', accepted: true },
      { guess: 'Confessions', accepted: false, reason: 'Augustine is expressly excluded from this prompt.' },
      { guess: 'Summa Theologiae', accepted: false, reason: 'Aquinas is medieval, not an early Church Father.' },
      { guess: 'The Rule of St Benedict', accepted: false, reason: 'A monastic rule, not in the patristic work catalogue selected here.' },
      { guess: 'The Imitation of Christ', accepted: false, reason: 'A late medieval devotional work.' },
      { guess: 'Paradise Lost', accepted: false, reason: 'A seventeenth-century poem, not a patristic writing.' }
    ]
  },
  {
    id: 'longtail-catholic-shrines', theme: 'places',
    prompt: 'Name a Catholic shrine or pilgrimage sanctuary.',
    context: 'The answer key samples a real-world international directory of Catholic shrines and pilgrimage places across multiple continents.',
    basis: 'Source list: Catholic Tourist, Catholic Shrines directory, listing more than 200 places in dozens of countries: https://catholictourist.com/topics/catholic-shrines ; Catholic pilgrimage finder: https://catholicpilgrimagefinder.com/ .',
    answers: ranked([
      'Lourdes', 'Fatima', 'Santiago de Compostela', 'Czestochowa', 'Loreto',
      'Aparecida', 'Walsingham', 'Montserrat', 'Our Lady of Muxima', 'Akita',
      'Mariazell', 'Altötting', 'Einsiedeln', 'Saint Anne de Beaupré', 'Our Lady of Luján',
      'Our Lady of Charity', 'Our Lady of Coromoto', 'Our Lady of Vailankanni', 'Manaoag Shrine', 'Peñafrancia Shrine',
      'Antipolo Cathedral', 'Quiapo Church', 'Our Lady of Lebanon', 'Harissa Shrine', 'Our Lady of the Pillar',
      'Our Lady of Meritxell', 'Our Lady of Good Counsel', 'Our Lady of Cobre', 'Our Lady of Chiquinquirá', 'Our Lady of Zapopan',
      'Our Lady of Ocotlán', 'Our Lady of San Juan de los Lagos', 'Our Lady of Luján Basilica', 'Our Lady of Andacollo', 'Our Lady of the Valley',
      'Our Lady of Charity of El Cobre', 'Our Lady of Mercy of El Quinche', 'Our Lady of Las Lajas', 'Our Lady of Suyapa', 'Our Lady of the Angels',
      'Our Lady of La Vang', 'Our Lady of Sheshan', 'Our Lady of China', 'Our Lady of Madhu', 'Our Lady of Good Health',
      'Shrine of St Joseph Montreal', 'National Shrine of St Frances Xavier Cabrini', 'Shrine of St Anthony Padua', 'Basilica of St Anthony Padua', 'Shrine of St Rita Cascia',
      'Shrine of St Padre Pio', 'Shrine of St Michael the Archangel', 'Shrine of St James the Greater', 'Shrine of St Thérèse of Lisieux', 'Shrine of St John Vianney',
      'Shrine of St Francis of Assisi', 'Shrine of St Charbel', 'Shrine of St Joseph of Cupertino', 'Shrine of the Three Kings', 'Basilica of St Paul Outside the Walls',
    ], {
      'Lourdes': 'Our Lady of Lourdes',
      'Fatima': 'Our Lady of Fatima',
      'Czestochowa': 'Our Lady of Częstochowa',
      'Aparecida': 'Our Lady of Aparecida',
      'Shrine of the Three Kings': 'Shrine of the Three Magi|Shrine of the Three Wise Men',
      'Basilica of St Paul Outside the Walls': 'Basilica of Saint Paul Outside the Walls|San Paolo fuori le Mura'
    }),
    commonGuesses: [
      { guess: 'Lourdes', accepted: true }, { guess: 'Fatima', accepted: true },
      { guess: 'Montserrat', accepted: true }, { guess: 'Walsingham', accepted: true }, { guess: 'Santiago de Compostela', accepted: true },
      { guess: 'Vatican Museums', accepted: false, reason: 'A museum complex, not a shrine or pilgrimage sanctuary.' },
      { guess: 'Mount Sinai', accepted: false, reason: 'A biblical holy mountain, not a Catholic shrine.' },
      { guess: 'Westminster Abbey', accepted: false, reason: 'An Anglican church, not a Catholic shrine.' },
      { guess: 'Church of the Holy Sepulchre', accepted: false, reason: 'A shared Christian pilgrimage site not included in this Catholic shrine directory selection.' },
      { guess: 'Mount Athos', accepted: false, reason: 'An Orthodox monastic peninsula, not a Catholic shrine.' }
    ]
  },
  {
    id: 'longtail-patron-professions', theme: 'saints',
    prompt: 'Name a saint traditionally invoked as patron of an occupation or profession.',
    context: 'Patronage traditions vary by region and guild; the source catalogues document the associations rather than imposing one universal list.',
    basis: 'Source lists: Catholic Answers Encyclopedia, “Patron Saints”; Catholic Online patronage A–Z: https://www.catholic.com/encyclopedia/patron-saints ; https://www.catholic.org/saints/patron.php .',
    reviewFlags: ['Occupational patronage can vary by country and guild. Confirm entries with a specific documented occupation before treating this list as reviewed.'],
    answers: ranked([
      'Joseph', 'Luke', 'Cecilia', 'Francis of Assisi', 'Isidore the Farmer',
      'Cosmas', 'Damian', 'Crispin', 'Crispinian', 'Eligius',
      'Anne', 'Christopher', 'Andrew', 'Bartholomew', 'Mark',
      'Catherine of Alexandria', 'Ivo of Kermartin', 'Raymond of Penyafort', 'Raymond Nonnatus', 'Hubert',
      'Lydia', 'Cloud', 'Lawrence', 'Barbara', 'Agatha',
      'Apollonia', 'Ambrose', 'Gregory the Great', 'David', 'Columba',
      'Benedict', 'Blaise', 'John Bosco', 'John of God', 'Camillus de Lellis',
      'Vincent de Paul', 'Martin of Tours', 'Nicholas of Myra', 'Eraclius', 'Honorius of Amiens',
      'Notburga', 'Zita', 'Martha', 'Dunstan', 'Genesius',
      'Julian the Hospitaller', 'Fiacre', 'Gerard Majella', 'Roch', 'Sebastian',
      'Florian', 'Urban I', 'Vincent of Saragossa', 'Thomas More', 'Thomas Aquinas',
      'Albert the Great', 'Francis de Sales', 'John the Baptist', 'Catherine of Siena', 'Isidore of Seville',
      'Joseph Calasanz', 'John Nepomucene', 'Dismas',
    ], {
      'Joseph': 'Saint Joseph|Joseph the Worker',
      'Luke': 'Saint Luke the Evangelist',
      'Cecilia': 'Saint Cecilia',
      'Isidore the Farmer': 'Isidore the Laborer|Isidore the Husbandman',
      'Cosmas': 'Saint Cosmas',
      'Damian': 'Saint Damian',
      'Eligius': 'Eloi|Saint Eligius',
      'Anne': 'Saint Anne',
      'Christopher': 'Saint Christopher'
    }),
    commonGuesses: [
      { guess: 'Joseph', accepted: true }, { guess: 'Cecilia', accepted: true },
      { guess: 'Luke', accepted: true }, { guess: 'Crispin', accepted: true }, { guess: 'Andrew', accepted: true },
      { guess: 'Joan of Arc', accepted: false, reason: 'Not a commonly documented occupational patron in the cited catalogues.' },
      { guess: 'Francis Xavier', accepted: false, reason: 'A missionary patron, not one of the occupation entries selected here.' },
      { guess: 'Peter Claver', accepted: false, reason: 'A patron of missions and enslaved people, not in the occupation list selected.' },
      { guess: 'Therese of Lisieux', accepted: false, reason: 'A patron of missions, not a profession entry in this key.' },
      { guess: 'Augustine of Hippo', accepted: false, reason: 'A theologian and bishop, not a listed trade patron.' }
    ]
  },
  {
    id: 'longtail-patron-illnesses', theme: 'saints',
    prompt: 'Name a saint traditionally invoked for an illness, disability, or medical condition.',
    context: 'The list records popular patronage traditions; it does not imply that intercession replaces medical care or that patronage is exclusive.',
    basis: 'Source lists: Catholic World Network, “Patron Saints—Health & Illness”; Catholic Online patronage index: https://www.catholicworldnetwork.com/patron-saint-of ; https://www.catholic.org/saints/patron.php .',
    reviewFlags: ['Health patronage is devotional and sometimes region-specific. Confirm each saint-condition association against the cited directory before treating this list as reviewed.'],
    answers: ranked([
      'Lucy', 'Blaise', 'Roch', 'Dymphna', 'Damien de Veuster',
      'Lidwina of Schiedam', 'Vitus', 'Teresa of Ávila', 'Polycarp', 'Apollinaris',
      'Genevieve', 'Aloysius Gonzaga', 'Alphonsus Liguori', 'Bonaventure', 'Agatha of Catania',
      'Scholastica', 'Maximilian Kolbe', 'Clare of Assisi', 'Timothy', 'Marianne Cope',
      'John Neumann', 'Joachim', 'Raphael the Archangel', 'Pantaleon', 'Erasmus',
      'Anthony the Abbot', 'Anthony of Padua', 'Peregrine Laziosi', 'Rita of Cascia', 'Bernadette Soubirous',
      'John the Baptist', 'Martin de Porres', 'Elizabeth of Hungary', 'Camillus de Lellis', 'Vincent de Paul',
      'Margaret of Cortona', 'Monica', 'Martha', 'Michael the Archangel', 'Christopher',
      'Joseph', 'Francis of Assisi', 'Juliana Falconieri', 'Euphemia', 'Margaret of Antioch',
      'Benedict Joseph Labre', 'Rose of Lima', 'Aloysius of Gonzaga', 'Notburga', 'Swithbert',
      'Giles', 'Anthony of Egypt', 'Radegund', 'Fiacre', 'Aidan of Lindisfarne',
      'Erhard of Regensburg', 'Catherine of Sweden', 'Ovidius', 'Denis of Paris', 'Quentin of Amiens',
    ], {
      'Lucy': 'Lucia of Syracuse|Saint Lucy',
      'Blaise': 'Saint Blaise',
      'Dymphna': 'Saint Dymphna',
      'Roch': 'Saint Roch|Rocco',
      'Peregrine Laziosi': 'Saint Peregrine',
      'Catherine of Sweden': 'Saint Catherine of Sweden',
      'Ovidius': 'Saint Ovidius',
      'Denis of Paris': 'Saint Denis of Paris',
      'Quentin of Amiens': 'Saint Quentin of Amiens'
    }),
    commonGuesses: [
      { guess: 'Lucy', accepted: true }, { guess: 'Blaise', accepted: true },
      { guess: 'Dymphna', accepted: true }, { guess: 'Roch', accepted: true }, { guess: 'Peregrine Laziosi', accepted: true },
      { guess: 'Francis of Assisi', accepted: true },
      { guess: 'Anthony of Padua', accepted: true },
      { guess: 'Joan of Arc', accepted: false, reason: 'Not included in the cited health-patron catalogues.' },
      { guess: 'John Paul II', accepted: false, reason: 'Not a health-patron entry in the cited lists.' },
      { guess: 'Thomas Aquinas', accepted: false, reason: 'Not a condition-specific patron in the cited catalogue.' }
    ]
  },
  {
    id: 'longtail-patron-countries', theme: 'saints',
    prompt: 'Name a saint or Marian title traditionally named patron of a country.',
    context: 'Country patronages can be multiple, historical, or locally qualified; the source directory is a catalogue rather than a universal decree.',
    basis: 'Source lists: CatholicSaints.info “Patron Saints of Countries” (124 country entries); Catholic Encyclopedia “Patron Saints”: https://catholicsaints.info/patron-saints-of-countries/ ; https://www.newadvent.org/cathen/11562a.htm .',
    reviewFlags: ['National patronages are not always exclusive or formally defined by one universal list; verify every saint-country pairing against the country entry and diocesan or episcopal source.'],
    answers: ranked([
      'Patrick', 'James the Greater', 'George', 'Andrew', 'Stephen of Hungary',
      'Denis of Paris', 'Michael the Archangel', 'Joseph', 'Anne', 'Our Lady of the Immaculate Conception',
      'Thomas the Apostle', 'Bridget of Sweden', 'Olaf of Norway', 'David of Wales', 'Willibrord',
      'Henry of Uppsala', 'Ansgar', 'Casimir', 'Adalbert of Prague', 'Stanislaus of Krakow',
      'Florian', 'Anthony of Padua', 'Francis Borgia', 'Vincent of Saragossa', 'Rose of Lima',
      'Our Lady of Guadalupe', 'Our Lady of Aparecida', 'Our Lady of Lanka', 'Our Lady of the Angels', 'Our Lady of the Snows',
      'Our Lady of Help', 'Our Lady of Mount Carmel', 'Our Lady of the Rosary', 'Our Lady of Good Counsel', 'Our Lady of Częstochowa',
      'Our Lady of Lebanon', 'Our Lady of the Gate of Dawn', 'Our Lady of Vailankanni', 'Our Lady of Muxima', 'Our Lady of China',
      'Our Lady of Africa', 'Our Lady of Akita', 'Our Lady of Knock', 'Our Lady of Fatima', 'Our Lady of Lourdes',
      'Our Lady of Walsingham', 'Our Lady of the Cape', 'Our Lady of Peace', 'Our Lady of the Assumption', 'Our Lady of Sorrows',
      'Our Lady of the Rosary of Pompeii', 'Boris and Gleb', 'Catherine of Alexandria', 'Cyril and Methodius', 'John the Baptist',
      'Benedict of Nursia', 'Adelaide of Burgundy', 'Elizabeth of Hungary', 'Teresia of Calcutta', 'Kateri Tekakwitha',
      'John Vianney',
    ], {
      'Patrick': 'Saint Patrick',
      'James the Greater': 'Saint James the Greater|James the Apostle',
      'George': 'Saint George',
      'Andrew': 'Saint Andrew',
      'Our Lady of Guadalupe': 'Virgin of Guadalupe',
      'Our Lady of Aparecida': 'Aparecida'
    }),
    commonGuesses: [
      { guess: 'Patrick', accepted: true }, { guess: 'George', accepted: true },
      { guess: 'Andrew', accepted: true }, { guess: 'Our Lady of Guadalupe', accepted: true }, { guess: 'Stephen of Hungary', accepted: true },
      { guess: 'Christopher', accepted: false, reason: 'A patron of travellers, not a country patron in the cited country directory.' },
      { guess: 'Francis of Assisi', accepted: false, reason: 'Not a country patron in the selected source list.' },
      { guess: 'Joan of Arc', accepted: false, reason: 'A national heroine, but not one of the patron entries in the source directory.' },
      { guess: 'Peter the Apostle', accepted: false, reason: 'Not listed as a national patron in the cited catalogue.' },
      { guess: 'Therese of Lisieux', accepted: false, reason: 'Not listed as a country patron in the selected source.' }
    ]
  },
  {
    id: 'longtail-ancient-sees', theme: 'places',
    prompt: 'Name an ancient episcopal see or city of the early Church.',
    context: 'The answer key samples historically attested episcopal centres from the first seven centuries, including sees whose ancient names differ from modern ones.',
    basis: 'Source directories: GCatholic historical dioceses and titular sees; Catholic Hierarchy historical dioceses; standard ancient Church geography: https://gcatholic.org/dioceses/ ; https://www.catholic-hierarchy.org/ .',
    reviewFlags: ['Ancient see boundaries and foundation dates are sometimes disputed; the key uses place names attested as episcopal centres, not a claim about exact founding years.'],
    answers: ranked([
      'Alexandria', 'Constantinople', 'Carthage', 'Edessa', 'Nicaea',
      'Caesarea Maritima', 'Caesarea Cappadocia', 'Nicomedia', 'Chalcedon', 'Tarsus',
      'Seleucia-Ctesiphon', 'Nisibis', 'Bostra', 'Tyre', 'Sidon',
      'Damascus', 'Emesa', 'Ptolemais', 'Scythopolis', 'Gaza',
      'Ascalon', 'Joppa', 'Lydda', 'Ancyra',
      'Gangra', 'Pessinus', 'Cyzicus', 'Synnada', 'Hierapolis',
      'Iconium', 'Lystra', 'Derbe', 'Antioch Pisidia', 'Miletus',
      'Magnesia', 'Tralles', 'Philadelphia in Lydia', 'Samosata', 'Melitene',
      'Amida', 'Arbela', 'Ravenna', 'Milan', 'Aquileia',
      'Lyon', 'Arles', 'Tours', 'Poitiers', 'Trier',
      'Cologne', 'Reims', 'Toledo', 'Seville', 'Braga',
      'Salona', 'Sirmium', 'Patras', 'Heraclea', 'Byzantium',
      'Pella', 'Beroea',
    ], {
      'Lydda': 'Diospolis'
    }),
    commonGuesses: [
      { guess: 'Alexandria', accepted: true }, { guess: 'Nicaea', accepted: true },
      { guess: 'Nicomedia', accepted: true }, { guess: 'Carthage', accepted: true }, { guess: 'Edessa', accepted: true },
      { guess: 'Nazareth', accepted: false, reason: 'An important Gospel town, but not one of the episcopal sees selected in this key.' },
      { guess: 'Bethlehem', accepted: false, reason: 'A major biblical place, but not in this ancient-see answer key.' },
      { guess: 'Jericho', accepted: false, reason: 'An Old Testament and Gospel city, not included as an episcopal see here.' },
      { guess: 'Mount Sinai', accepted: false, reason: 'A mountain, not a city or episcopal see.' },
      { guess: 'Galilee', accepted: false, reason: 'A region, not a city or episcopal see.' }
    ]
  },
  {
    id: 'longtail-catholic-symbols', theme: 'art-music',
    prompt: 'Name a symbol or iconographic motif used in Catholic Christian art.',
    context: 'The list draws on traditional Christian iconography in Scripture, liturgy, church art, and Catholic devotional imagery.',
    basis: 'Source references: Catholic Encyclopedia, “Symbolism”; Oxford Dictionary of Christian Art and Architecture; Catholic iconographic reference collections: https://www.newadvent.org/cathen/14373b.htm .',
    answers: ranked([
      'Lamb', 'Fish', 'Dove', 'Anchor', 'Chi-Rho',
      'Keys of Peter', 'Alpha and Omega', 'Pelican', 'Phoenix', 'Lion',
      'Eagle', 'Ox', 'Winged Man', 'Grapes', 'Wheat',
      'Vine', 'Bread', 'Chalice', 'Olive Branch', 'Palm Branch',
      'Lily', 'Rose', 'Shell', 'Crown of Thorns', 'Sacred Heart',
      'Immaculate Heart', 'Flaming Heart', 'Rooster', 'Serpent', 'Apple',
      'Pomegranate', 'Fountain', 'Well', 'Ship', 'Anchor Cross',
      'Tau Cross', 'Maltese Cross', 'Jerusalem Cross', 'Cross Pattée', 'Cross Potent',
      'INRI', 'Halo', 'Nimbus', 'Mandorla', 'Vesica Piscis',
      'Hand of God', 'Eye of Providence', 'Triquetra', 'Trinity Knot', 'Book of the Gospels',
      'Scroll', 'Book with Seven Seals', 'Sword', 'Censer', 'Incense',
      'Rainbow', 'Ladder', 'Jacob’s Ladder', 'Burning Bush', 'Manna',
      'Fountain of Life', 'Unicorn', 'Stag', 'Butterfly', 'Bee',
      'Scales', 'Sword and Palm', 'Crown', 'Globus Cruciger', 'Shepherd’s Staff',
      'Lamb with Banner', 'Five Wounds',
    ], {
      'Chi-Rho': '☧|Chrismon',
      'Keys of Peter': 'Keys|Keys of the Kingdom',
      'Winged Man': 'Man of Matthew|Angel of Matthew',
      'Ox': 'Ox of Luke',
      'Eagle': 'Eagle of John',
      'Lion': 'Lion of Mark',
      'Lamb': 'Agnus Dei',
      'Fish': 'Ichthys',
      'Pelican': 'Pelican in her Piety'
    }),
    commonGuesses: [
      { guess: 'Lamb', accepted: true }, { guess: 'Fish', accepted: true },
      { guess: 'Dove', accepted: true }, { guess: 'Anchor', accepted: true }, { guess: 'Chi-Rho', accepted: true },
      { guess: 'Menorah', accepted: false, reason: 'A Jewish ritual symbol, not a Catholic Christian iconographic motif in this key.' },
      { guess: 'Om', accepted: false, reason: 'A Hindu sacred syllable, not Catholic iconography.' },
      { guess: 'Crescent moon', accepted: false, reason: 'Not in the cited traditional Christian symbol set.' },
      { guess: 'Yin-yang', accepted: false, reason: 'A symbol from Chinese philosophy, not Catholic iconography.' },
      { guess: 'Pentagram', accepted: false, reason: 'Not one of the selected traditional Catholic symbols.' }
    ]
  },
  {
    id: 'longtail-catholic-universities', theme: 'people',
    prompt: 'Name a Catholic university or college.',
    context: 'The answer key samples institutions in international Catholic higher-education directories and Catholic university associations.',
    basis: 'Source lists: International Federation of Catholic Universities member directory; Association of Catholic Colleges and Universities; institutional histories: https://www.fiuc.org/ ; https://www.accunet.org/ .',
    answers: ranked([
      'University of Notre Dame','Georgetown University','Boston College','Fordham University','Loyola University Chicago',
      'Catholic University of America','Villanova University','Loyola Marymount University','Saint Louis University','University of San Diego','Santa Clara University','Creighton University',
      'Marquette University','Duquesne University','Seton Hall University','University of Dayton','DePaul University','Xavier University','Gonzaga University','University of Scranton','Regis University','John Carroll University','Loyola University Maryland','University of Portland',
      'University of St Thomas','Barry University','St John’s University','Manhattan College','Providence College','College of the Holy Cross','Assumption University','Benedictine College','Thomas Aquinas College','Franciscan University of Steubenville','Ave Maria University','Belmont Abbey College','Mount St Mary’s University','Loyola University New Orleans','Spring Hill College','University of Dallas','Sacred Heart University','Misericordia University','Catholic University of Portugal','University of Navarra','Pontifical Gregorian University','Pontifical Lateran University','Pontifical University of St Thomas Aquinas','Pontifical Salesian University','Pontifical Urbaniana University','University of Notre Dame Australia','Australian Catholic University','University of Santo Tomas','Ateneo de Manila University','De La Salle University','Sophia University','Fu Jen Catholic University','Louvain Catholic University','University of Fribourg','Universidad Católica de Chile','Pontifical Catholic University of Peru',
      'Universidad Católica Argentina','Universidad Pontificia Comillas','Università Cattolica del Sacro Cuore','Catholic University of Leuven','University of St Joseph Beirut','Catholic University of Rwanda','Catholic University of Eastern Africa','Tangaza University','Catholic University of Ghana',
    ], {
      'University of Notre Dame':'Notre Dame',
      'Catholic University of America':'CUA',
      'University of St Thomas':'St Thomas University',
      'University of Navarra':'Universidad de Navarra',
      'University of Santo Tomas':'UST Manila',
      'Australian Catholic University':'ACU',
      'Fu Jen Catholic University':'FJCU'
    }),
    commonGuesses: [
      { guess: 'University of Notre Dame', accepted: true }, { guess: 'Georgetown University', accepted: true },
      { guess: 'Boston College', accepted: true }, { guess: 'University of Santo Tomas', accepted: true }, { guess: 'University of Navarra', accepted: true },
      { guess: 'Harvard University', accepted: false, reason: 'Not a Catholic institution in the cited association directories.' },
      { guess: 'Yale University', accepted: false, reason: 'Not a Catholic university.' },
      { guess: 'University of Oxford', accepted: false, reason: 'Not classified as a Catholic university in the cited directories.' },
      { guess: 'Brigham Young University', accepted: false, reason: 'A Latter-day Saint university, not Catholic.' },
      { guess: 'Liberty University', accepted: false, reason: 'A Protestant evangelical institution, not Catholic.' }
    ]
  },
  {
    id: 'longtail-minor-basilicas', theme: 'places',
    prompt: 'Name a church formally designated a minor basilica.',
    context: 'The list samples the worldwide register of minor basilicas and uses the church’s commonly published name.',
    basis: 'Source list: GCatholic, “Basilicas in the World” and country-level Minor Basilica registers, including 94 in the United States: https://gcatholic.org/churches/bas ; https://gcatholic.org/churches/data/basUS .',
    answers: ranked([
      'Basilica of St Mary Minneapolis','Our Lady of Victory Basilica','St Josaphat Basilica','Basilica of the National Shrine of the Assumption','Basilica of the Immaculate Conception',
      'Basilica of the Blessed Virgin of Gethsemani','Basilica of St Francis of Assisi San Francisco','Mission Basilica San Diego','Cathedral Basilica of Saints Peter and Paul','Cathedral Basilica of St Augustine','St Mary’s Cathedral Basilica Galveston','Basilica of St Adalbert Grand Rapids',
      'Cathedral Basilica of the Immaculate Conception Denver','Cathedral Basilica of St James Brooklyn','St Mary’s Basilica Phoenix','Basilica of the National Shrine of the Immaculate Conception','Basilica of the Sacred Heart Notre Dame','Basilica of St Lawrence Asheville','Basilica of St Mary Richmond','Basilica of St Patrick Montreal','Basilica of Sainte-Anne-de-Beaupré','Basilica of Our Lady of Guadalupe','Basilica of the National Shrine of Mary Queen of the Universe',
      'Basilica of the National Shrine of the Little Flower','Basilica of St Mary of the Immaculate Conception Norfolk','Basilica of the Sacred Heart of Jesus Atlanta','Basilica of St Peter in Chains Cincinnati','Basilica of St John the Baptist Charleston','Basilica of St Michael the Archangel Pensacola','Basilica of St Mary Star of the Sea Key West','Basilica of the Assumption Baltimore','Basilica of St Louis King of France','Basilica of St Mary of the Angels Olean','Basilica of St Hyacinth Chicago','Basilica of St Anne Detroit','Basilica of St Mary of the Immaculate Conception Portland','Basilica of St Mary in Wilmington','Basilica of St Mary in Loretto','Basilica of St Peter Niles','Basilica of Our Lady of Sorrows Chicago','Basilica of St Patrick’s Old Cathedral','Basilica of St Mary of the Immaculate Conception Galesburg','Basilica of St Mary of the Immaculate Conception Cincinnati','Basilica of St Mary in Ottawa','Basilica of Notre-Dame de Montréal','Basilica of Notre-Dame de Québec','Basilica of Our Lady of Luján','Basilica of Our Lady of Aparecida','Basilica of Our Lady of the Rosary of Fatima','Basilica of Our Lady of the Pillar','Basilica of Our Lady of the Valley','Basilica of Our Lady of Mercy Barcelona','Basilica of the Immaculate Conception Barcelona','Basilica of the Holy Family Barcelona','Basilica of Our Lady of the Rosary Pompeii','Basilica of St Anthony Padua','Basilica of St Francis Assisi','Basilica of St Rita Cascia','Basilica of St Nicholas Bari','Basilica of St Mark Venice','Basilica of San Vitale Ravenna',
      'Basilica of Our Lady of the Rosary of Chiquinquirá','Basilica of Our Lady of the Angels Cartago','Basilica of St Martin Tours','Basilica of St Sernin Toulouse','Basilica of the Sacred Heart Brussels','Basilica of Our Lady of Peace Yamoussoukro','Basilica of the Immaculate Conception Washington',
    ]),
    commonGuesses: [
      { guess: 'St Mary’s Basilica Phoenix', accepted: true }, { guess: 'Basilica of St Mary Minneapolis', accepted: true },
      { guess: 'St Josaphat Basilica', accepted: true }, { guess: 'Our Lady of Victory Basilica', accepted: true }, { guess: 'Basilica of Our Lady of Guadalupe', accepted: true },
      { guess: 'St Peter’s Basilica', accepted: false, reason: 'A major basilica, not a minor basilica.' },
      { guess: 'St John Lateran', accepted: false, reason: 'A major basilica.' },
      { guess: 'Westminster Abbey', accepted: false, reason: 'Not a Catholic minor basilica.' },
      { guess: 'Notre-Dame Cathedral Paris', accepted: false, reason: 'Not designated a minor basilica in this source register.' },
      { guess: 'Hagia Sophia', accepted: false, reason: 'Not a Catholic minor basilica.' }
    ]
  },
  {
    id: 'longtail-mass-parts', theme: 'liturgy',
    prompt: 'Name a text, response, or ritual part of the Roman Rite Mass.',
    context: 'The source is the Order of Mass and the General Instruction of the Roman Missal; the prompt asks for a component, not a liturgical object.',
    basis: 'Source texts: General Instruction of the Roman Missal and the Order of Mass, USCCB; Missale Romanum, editio typica tertia: https://www.usccb.org/prayer-worship/the-mass/general-instruction-of-the-roman-missal ; https://www.vatican.va/roman_curia/congregations/ccdds/documents/rc_con_ccdds_doc_20030317_ordinamento-messale_en.html .',
    answers: ranked([
      'Introductory Rites','Penitential Act','Liturgy of the Word','Liturgy of the Eucharist','Concluding Rites',
      'Entrance Chant','Greeting','Sign of the Cross','Penitential Act Confiteor','Kyrie','Gloria','Collect',
      'First Reading','Responsorial Psalm','Second Reading','Gospel Acclamation','Gospel','Homily','Profession of Faith','Universal Prayer','Prayer of the Faithful','Preparation of the Gifts','Presentation of the Gifts','Offertory Chant',
      'Invitation to Prayer','Prayer over the Offerings','Preface','Holy Holy Holy','Eucharistic Prayer','Epiclesis','Institution Narrative','Consecration','Anamnesis','Oblation','Intercessions','Doxology','Great Amen','Lord’s Prayer','Embolism','Doxology after the Lord’s Prayer','Sign of Peace','Fraction Rite','Commingling','Agnus Dei','Invitation to Communion','Ecce Agnus Dei','Communion','Communion Antiphon','Prayer after Communion','Blessing','Dismissal','Final Hymn','Silence after Readings','Silence after Homily','Silence after Communion','Alleluia before Gospel','Sequence','Credo','Sanctus','Mysterium Fidei','Memorial Acclamation','Amen after Eucharistic Prayer','Ite missa est','Benedicamus Domino',
      'Prayers at the Foot of the Altar','Orate Fratres','Suscipiat Dominus','Preface Dialogue','Sursum Corda','Habemus ad Dominum','Lift up your hearts','The Lord be with you',
    ]),
    commonGuesses: [
      { guess: 'Penitential Act', accepted: true }, { guess: 'Liturgy of the Word', accepted: true },
      { guess: 'Eucharistic Prayer', accepted: true }, { guess: 'Sign of Peace', accepted: true }, { guess: 'Fraction Rite', accepted: true },
      { guess: 'Chasuble', accepted: false, reason: 'A vestment, not a text or ritual part of the Mass.' },
      { guess: 'Chalice', accepted: false, reason: 'A sacred vessel, not a Mass text or ritual part.' },
      { guess: 'Adoration', accepted: false, reason: 'A devotional practice outside the Mass.' },
      { guess: 'Rosary', accepted: false, reason: 'A devotion, not part of the Order of Mass.' },
      { guess: 'Baptism', accepted: false, reason: 'A separate sacrament, not a component of the Mass.' }
    ]
  },
  {
    id: 'longtail-late-medieval-theologians', theme: 'people',
    prompt: 'Name a Christian theologian or ecclesiastical writer active between 800 and 1199.',
    context: 'The historical window bridges the early Fathers and the later medieval writers already represented elsewhere in the bank.',
    basis: 'Source references: Oxford Dictionary of the Christian Church; standard histories of medieval theology; Stanford Encyclopedia of Philosophy entries on medieval figures: https://www.oxfordreference.com/ ; https://plato.stanford.edu/ .',
    answers: ranked([
      'Anselm of Canterbury','Bernard of Clairvaux','John Scotus Eriugena','Peter Abelard','Peter Lombard',
      'Alcuin of York','Rabanus Maurus','Peter Damian','Hildegard of Bingen','Hugh of St Victor','Richard of St Victor','Lanfranc of Canterbury',
      'Hincmar of Reims','Ratramnus of Corbie','Gottschalk of Orbais','Paschasius Radbertus','Erigena','Odo of Cluny','Odilo of Cluny','Peter the Venerable','Anselm of Laon','Gilbert de la Porrée','William of Champeaux','Rupert of Deutz','Honorius Augustodunensis',
      'John of Salisbury','Gerhoh of Reichersberg','Hugh of Fleury','Berno of Reichenau','Ratherius of Verona','Atto of Vercelli','Fulbert of Chartres','Adalbold of Utrecht','Burchard of Worms','Ivo of Chartres','Gratian','Hildebert of Lavardin','Marbode of Rennes','Suger of Saint-Denis','Aelred of Rievaulx','William of St Thierry','Isaac of Stella','Peter of Celle','Adam of St Victor','Herman of Carinthia','Adelard of Bath','Robert of Melun','Robert of Arbrissel','Gilbert of Sempringham','Norbert of Xanten','Bruno of Cologne','Stephen Harding','Bernard of Tiron','William of Hirsau','Anselm of Havelberg','Hugh of Amiens','Gerard of Cenad','Theophylact of Ohrid','Euthymius Zigabenus','Theodore Balsamon','Michael Psellos','Nicholas of Methone','Simeon the New Theologian','Theophylact of Bulgaria','Leo of Ostia','Desiderius of Monte Cassino','Hugh of Cluny',
    ], {
      'John Scotus Eriugena':'Eriugena|Johannes Scotus Eriugena',
      'Anselm of Canterbury':'Saint Anselm|Anselm',
      'Bernard of Clairvaux':'Saint Bernard',
      'Peter Abelard':'Abelard',
      'Peter Lombard':'Lombard',
      'Hildegard of Bingen':'Saint Hildegard'
    }),
    commonGuesses: [
      { guess: 'Anselm of Canterbury', accepted: true }, { guess: 'Bernard of Clairvaux', accepted: true },
      { guess: 'Peter Abelard', accepted: true }, { guess: 'Hildegard of Bingen', accepted: true }, { guess: 'Peter Lombard', accepted: true },
      { guess: 'Thomas Aquinas', accepted: false, reason: 'Born after the stated period.' },
      { guess: 'Augustine of Hippo', accepted: false, reason: 'Lived before the stated period.' },
      { guess: 'Martin Luther', accepted: false, reason: 'Lived after the stated period and was a Reformation figure.' },
      { guess: 'John Calvin', accepted: false, reason: 'Lived after the stated period.' },
      { guess: 'Francis of Assisi', accepted: false, reason: 'A religious founder, not a theologian in the selected 800–1199 writer list.' }
    ]
  },
  {
    id: 'longtail-martyrdom-texts', theme: 'church-history',
    prompt: 'Name an early Christian act, passion, or martyrdom account.',
    context: 'The answer key samples the early Christian martyr-act tradition, including canonical, liturgical, and later hagiographical texts.',
    basis: 'Source collections: Acta Martyrum and the Bollandist Acta Sanctorum; Early Christian Writings; New Advent patristic texts: https://www.earlychristianwritings.com/ ; https://www.newadvent.org/fathers/ .',
    reviewFlags: ['Some martyr acts survive in later recensions and their historical reliability varies. The prompt asks for a known text, not for proof that every narrative detail is historical.'],
    answers: ranked([
      'Martyrdom of Polycarp','Passion of Perpetua and Felicity','Acts of the Scillitan Martyrs','Acts of Justin','Passion of Fructuosus',
      'Martyrdom of Pionius','Acts of Cyprian','Martyrdom of Carpus and Papylus','Acts of Euplius','Passion of Montanus and Lucius','Martyrdom of Marian and James','Passion of Crispina',
      'Acts of Maximilian','Martyrdom of Marcellinus and Peter','Passion of Sergius and Bacchus','Martyrdom of Ignatius','Martyrdom of James the Persian','Passion of Alban','Acts of the Martyrs of Lyons','Martyrdom of Conon','Acts of Phileas','Acts of Philemon','Passion of the Forty Martyrs of Sebaste',
      'Martyrdom of Agape Chionia and Irene','Passion of Theodotus of Ancyra','Martyrdom of Julitta and Quiricus','Acts of Tarachus Probus and Andronicus','Passion of Eulalia','Martyrdom of Vincent of Saragossa','Acts of the Martyrs of Abitinae','Passion of Sabina','Martyrdom of George','Acts of Acacius','Passion of Barbara','Martyrdom of Catherine of Alexandria','Acts of Theodore the Recruit','Passion of Artemius','Martyrdom of Menas','Martyrdom of Anastasia','Acts of Felix of Nola','Passion of Agnes','Acts of Nereus and Achilleus','Passion of Sebastian','Martyrdom of Boniface of Tarsus','Acts of Quirinus of Neuss','Passion of Margaret of Antioch','Martyrdom of Lucy','Passion of Cecilia','Acts of the Twelve Martyrs of Scetis','Martyrdom of the Monks of Sinai','Passion of the Martyrs of Palestine','Martyrdom of Theodore Stratelates','Acts of Thomas the Apostle','Acts of Paul and Thecla','Martyrdom of James the Just','Martyrdom of Simeon of Jerusalem','Passion of Eustathius and Companions','Martyrdom of Cosmas and Damian','Passion of Drosis','Acts of the Martyrs of Persia','Passion of the Martyrs of Agaunum','Martyrdom of Cyril of Gortyna',
    ], {
      'Acts of the Martyrs of Lyons': 'Passion of the Martyrs of Vienne',
      'Martyrdom of James the Persian': 'Passion of James Intercisus'
    }),
    commonGuesses: [
      { guess: 'Martyrdom of Polycarp', accepted: true }, { guess: 'Passion of Perpetua and Felicity', accepted: true },
      { guess: 'Acts of the Scillitan Martyrs', accepted: true }, { guess: 'Acts of Justin', accepted: true }, { guess: 'Passion of Fructuosus', accepted: true },
      { guess: 'The Didache', accepted: false, reason: 'An early Church order, not a martyrdom account.' },
      { guess: 'Confessions', accepted: false, reason: 'An autobiographical work, not a martyr act.' },
      { guess: 'Summa Theologiae', accepted: false, reason: 'A medieval theological work.' },
      { guess: 'The Rule of Benedict', accepted: false, reason: 'A monastic rule, not a martyrdom narrative.' },
      { guess: 'The Gospel of Matthew', accepted: false, reason: 'A canonical Gospel, not a martyr-act text.' }
    ]
  },
  {
    id: 'longtail-relics', theme: 'devotion',
    prompt: 'Name a relic traditionally venerated in a Catholic church or shrine.',
    context: 'The list records objects or remains reported as relics; inclusion does not certify historical authenticity.',
    basis: 'Source lists: Catholic shrine and pilgrimage catalogues; diocesan shrine inventories; Catholic Encyclopedia entries on relics and veneration: https://www.newadvent.org/cathen/12734a.htm ; https://catholictourist.com/topics/catholic-shrines .',
    reviewFlags: ['Relics have differing historical evidentiary status. This prompt is about reported Catholic veneration, not authentication; disputed items should remain flagged during human review.'],
    answers: ranked([
      'True Cross','Shroud of Turin','Holy Lance','Veil of Veronica','Crown of Thorns',
      'Holy Tunic of Trier','Chains of Saint Peter','Holy Crib','Sandal of Saint Peter','Girdle of Thomas','House of Loreto','Holy Stairs',
      'Wood of the Cross','Nails of the Cross','Sponge of the Passion','Titulus Crucis','Column of the Flagellation','Scourging Pillar','Holy Chalice of Valencia','Spear of Longinus','Seamless Robe of Christ','Tunic of Argenteuil','Holy Coat of Trier','Holy Face of Manoppello','Blood of Saint Januarius',
      'Tongue of Saint Anthony','Tongue of Saint John Nepomuk','Heart of Saint Camillus','Heart of Saint Teresa of Ávila','Heart of Saint John Vianney','Heart of Saint Padre Pio','Arm of Saint Francis Xavier','Right hand of Saint Stephen','Finger of Saint Thomas','Head of Saint Catherine of Siena','Head of Saint John the Baptist','Skull of Saint Valentine','Skull of Saint James','Bones of Saint Peter','Bones of Saint Paul','Bones of Saint Mark','Relics of Saint Luke','Relics of Saint Andrew','Relics of Saint Nicholas','Relics of Saint Benedict','Relics of Saint Scholastica','Relics of Saint Clare','Relics of Saint Francis','Relics of Saint Dominic','Relics of Saint Thomas Aquinas','Relics of Saint Rita','Relics of Saint Thérèse','Relics of Saint Bernadette','Relics of Saint John Bosco','Relics of Saint Carlo Acutis','Relics of Saint Monica','Relics of Saint Augustine','Relics of Saint Ambrose','Relics of Saint Charles Borromeo','Relics of Saint Philip Neri','Relics of Saint Catherine of Siena','Relics of Saint Pio','Relics of Saint Elizabeth Ann Seton','Relics of Saint Kateri Tekakwitha','Relics of Saint John Paul II','Relics of Saint Gianna Molla','Relics of Saint Frances Xavier Cabrini','Relics of Saint Oscar Romero','Relics of Saint Joseph',
    ]),
    commonGuesses: [
      { guess: 'True Cross', accepted: true }, { guess: 'Shroud of Turin', accepted: true },
      { guess: 'Holy Lance', accepted: true }, { guess: 'Veil of Veronica', accepted: true }, { guess: 'Crown of Thorns', accepted: true },
      { guess: 'Holy Grail', accepted: false, reason: 'A legendary object with competing traditions, not treated here as a catalogued relic.' },
      { guess: 'Ark of the Covenant', accepted: false, reason: 'A biblical sacred object, not a Catholic relic venerated as such.' },
      { guess: 'Stone of Scone', accepted: false, reason: 'A coronation stone, not a Catholic relic.' },
      { guess: 'Menorah', accepted: false, reason: 'A Jewish sacred object, not a Catholic relic.' },
      { guess: 'Holy Hand Grenade', accepted: false, reason: 'A fictional object, not a relic.' }
    ]
  },
  {
    id: 'longtail-pilgrimage-routes', theme: 'places',
    prompt: 'Name a historic Catholic pilgrimage route or walking way.',
    context: 'The source directory lists named pilgrimage routes across Europe, the Americas, Asia, and other regions.',
    basis: 'Source list: Destinationes, “Pilgrim Routes & Caminos” (80 named routes): https://www.destinationes.com/routes ; Catholic pilgrimage finder route and destination directory: https://catholicpilgrimagefinder.com/ .',
    answers: ranked([
      'Camino Francés','Via Francigena','Camino Portugués','Camino Primitivo','Chartres Pilgrimage',
      'California Mission Trail','St Francis Way','Camino del Norte','Camino Inglés','Via di Francesco','Camino Finisterre','St Olav’s Way',
      'Birgittaleden','Augustine Camino','Altötting Pilgrimage','Aparecida Pilgrimage','Camino Mozárabe','Camino Sanabrés','Camino de Invierno','Camino Lebaniego','Camino de Madrid','Camino de Levante','Camino Catalán','Camino Aragonés',
      'Via Romea Germanica','Via Romea Strata','Via Postumia','Via Lauretana','Via Matildica','Via degli Abati','Cammino di San Benedetto','Cammino di Sant’Antonio','Cammino Celeste','Cammino Materano','Cammino di San Francesco','Cammino di Assisi','Cammino di San Jacopo','Cammino di San Vili','Cammino delle Dolomiti','Cammino del Salento','Cammino di Oropa','Cammino di San Colombano','Cammino di San Vicinio','Cammino di San Rocco','Cammino di Santa Barbara','Cammino di San Nilo','Cammino di San Filippo Neri','Camino de la Lana','Camino de Uclés','Camino de Santiago de Gran Canaria','Camin del Oriente','Camino de San Salvador','Camino de Baztan','Camino de Fisterra','Camino de Muxía','Camino de Puy','Camino de Le Puy','Camino de la Costa','Camino de San Rosendo','Camino de San Frutos','Camino de Guadalupe','Pilgrimage to Walsingham','Pilgrimage to Knock','Pilgrimage to Lourdes','Pilgrimage to Fatima','Pilgrimage to Czestochowa','Pilgrimage to Mariazell','Pilgrimage to Rome','Pilgrimage to Santiago','Pilgrimage to Loreto','Pilgrimage to Montserrat','Pilgrimage to Aparecida',
    ], {
      'Camino Francés':'French Way',
      'Via Francigena':'Way of the Franks',
      'Camino Portugués':'Portuguese Way',
      'Camino Primitivo':'Original Way',
      'St Olav’s Way':'St Olav Way'
    }),
    commonGuesses: [
      { guess: 'Camino Francés', accepted: true }, { guess: 'Via Francigena', accepted: true },
      { guess: 'Camino Portugués', accepted: true }, { guess: 'Chartres Pilgrimage', accepted: true }, { guess: 'St Olav’s Way', accepted: true },
      { guess: 'Route 66', accepted: false, reason: 'A highway route, not a Catholic pilgrimage route.' },
      { guess: 'Silk Road', accepted: false, reason: 'A historic trade network, not a Catholic pilgrimage itinerary.' },
      { guess: 'Appian Way', accepted: false, reason: 'An ancient Roman road, not a pilgrimage route in the source list.' },
      { guess: 'Hadrian’s Wall Path', accepted: false, reason: 'A modern walking trail, not a Catholic pilgrimage route.' },
      { guess: 'Pacific Crest Trail', accepted: false, reason: 'A hiking trail, not a pilgrimage route.' }
    ]
  },
  {
    id: 'longtail-city-patrons', theme: 'saints',
    prompt: 'Name a saint traditionally named patron of a city or town.',
    context: 'The answer key samples Catholic patronage directories and local civic patron traditions, which may vary between dioceses and historical periods.',
    basis: 'Source lists: Catholic Online Patron Saints A–Z; CatholicSaints.info Patronage Groups and city patronage listings: https://www.catholic.org/saints/patron.php ; https://catholicsaints.info/patronage-groups/ .',
    reviewFlags: ['Civic patronage varies by local tradition and date. Verify the city named for each patron before treating the list as reviewed.'],
    answers: ranked([
      'Ambrose of Milan', 'Januarius of Naples', 'Petronius of Bologna', 'Mark the Evangelist', 'Nicholas of Myra',
      'Agatha of Catania', 'Lucia of Syracuse', 'Fermin of Pamplona', 'Eulalia of Barcelona', 'Roch of Montpellier',
      'Martin of Tours', 'John the Baptist', 'Dionysius of Paris', 'Genevieve of Paris', 'Isidore of Madrid',
      'Our Lady of the Pillar', 'Our Lady of Guadalupe', 'Our Lady of Aparecida', 'Our Lady of Luján', 'Our Lady of Chiquinquirá',
      'Our Lady of Coromoto', 'Our Lady of the Angels', 'Our Lady of Częstochowa', 'Catherine of Siena', 'Francis of Assisi',
      'Anthony of Padua', 'Theodore', 'Demetrius of Thessaloniki', 'Spyridon of Trimythous', 'Andrew the Apostle',
      'Peter the Apostle', 'Paul the Apostle', 'Athanasius of Alexandria', 'Cyril of Alexandria', 'Sabas the Sanctified',
      'Basil the Great', 'John Chrysostom', 'Rita of Cascia', 'Zita of Lucca', 'Petronilla',
      'Agnes of Rome', 'Cecilia of Rome', 'Lawrence of Rome', 'Sebastian', 'Barbara',
      'Christopher', 'Urban of Langres', 'Felicity of Rome', 'Faustina Kowalska', 'Wenceslaus',
      'Eric of Sweden', 'Willibrord', 'Bavo of Ghent', 'Servatius of Maastricht', 'Remigius of Reims',
      'Firmin of Amiens', 'Aignan of Orleans', 'Martin of Braga', 'Fructuosus of Tarragona', 'Leander of Seville',
      'Isidore of Seville', 'Cucuphas', 'Eulalia of Mérida', 'Vincent of Saragossa',
    ], {
      'Januarius of Naples': 'San Gennaro',
      'Petronius of Bologna': 'Saint Petronius',
      'Isidore of Madrid': 'Isidore the Farmer',
      'Our Lady of the Pillar': 'Our Lady of Zaragoza',
      'Cucuphas': 'Cucufas'
    }),
    commonGuesses: [
      { guess: 'Ambrose of Milan', accepted: true }, { guess: 'Januarius of Naples', accepted: true },
      { guess: 'Mark the Evangelist', accepted: true }, { guess: 'Genevieve of Paris', accepted: true }, { guess: 'Isidore of Madrid', accepted: true },
      { guess: 'Christopher', accepted: true },
      { guess: 'Joan of Arc', accepted: false, reason: 'A national heroine, not a listed civic patron.' },
      { guess: 'Francis Xavier', accepted: false, reason: 'A missionary patron, not a city patron in this source selection.' },
      { guess: 'Therese of Lisieux', accepted: false, reason: 'Not a civic patron in the cited list.' },
      { guess: 'Michael the Archangel', accepted: false, reason: 'A patron of several groups and places, but no particular city is specified here.' }
    ]
  },
  {
    id: 'longtail-francis-canonizations', theme: 'saints',
    prompt: 'Name a saint canonized by John Paul II, Benedict XVI, or Francis.',
    context: 'The answer key samples official Vatican canonization records from 2000 through 2025, under Benedict XVI, and Francis.',
    basis: 'Source lists: Holy See, Dicastery for the Causes of Saints, canonizations by pontificate and year; Vatican News canonicalization records: https://www.vatican.va/news_services/liturgy/saints/index_saints_en.html ; https://www.vaticannews.va/en/pope/news/2025-04/pope-francis-canonizations-saints.html .',
    reviewFlags: ['Group canonizations can involve dozens or hundreds of people; this open answer key is a sample, not the complete set of everyone canonized since 2000. Check names and canonical spellings against the Vatican record before marking reviewed.'],
    answers: ranked([
      'John Paul II', 'Teresa of Calcutta', 'Oscar Romero', 'John Henry Newman', 'Charles de Foucauld',
      'Titus Brandsma', 'Carlo Acutis', 'Pier Giorgio Frassati', 'Devasahayam Pillai', 'Joseph Vaz',
      'Pedro Calungsod', 'Marianne Cope', 'Anna Schaffer', 'Jacques Berthieu', 'José de Anchieta',
      'Louis Martin', 'Zélie Martin', 'Dulce Lopes Pontes', 'Bartolo Longo', 'Marguerite Bays',
      'Junípero Serra', 'José Sánchez del Río', 'Cristóbal Magallanes', 'David Galván', 'Toribio Romo',
      'Pedro de Jesús Maldonado', 'Rodrigo Aguilar Alemán', 'Julio Álvarez Mendoza', 'Luis Batiz Sainz', 'Mateo Correa Magallanes',
      'Atilano Cruz Alvarado', 'Margarito Flores García', 'David Roldán Lara', 'Salvador Lara Puente', 'Agustín Caloca Cortés',
      'José María Robles Hurtado', 'Miguel de la Mora', 'Andrés Solá Molist', 'José María Gran Cirera', 'Juan Alonso Fernández',
      'Faustino Villanueva', 'Pedro Poveda', 'Álvaro del Portillo', 'Guadalupe Ortiz de Landázuri', 'Elizabeth of the Trinity',
      'Maria Troncatti', 'Maria Guadalupe García Zavala', 'Maria Alfonsina Danil Ghattas', 'Vincenzo Grossi', 'Francesco Spinelli',
      'Giovanni Battista Piamarta', 'Ludovico da Casoria', 'Nicola da Longobardi', 'Amato Ronconi', 'Giuseppina Vannini',
      'Andrés Bessette', 'Mariam Thresia', 'María de la Purísima', 'Nazaria Ignacia', 'María del Carmen Sallés',
      'Josemaría Escrivá', 'Padre Pio', 'Juan Diego', 'Pedro de San José Betancur', 'Daniel Comboni',
      'Arnold Janssen', 'Joseph Freinademetz', 'Gianna Beretta Molla', 'Luigi Orione', 'Hannibal Maria Di Francia',
      'Rafael Guízar y Valencia', 'Filippo Smaldone', 'Rosa Venerini', 'Theodore Guerin', 'George Preca',
      'Charles of Mount Argus', 'Nuno de Santa Maria', 'Maria Bernarda Bütler', 'Alphonsa of the Immaculate Conception', 'Jeanne Jugan',
      'Damien of Molokai', 'Mary MacKillop', 'Stanislaus Kazimierczyk', 'Guido Maria Conforti', 'Luigi Guanella',
      'Bonifacia Rodríguez y Castro', 'Kateri Tekakwitha',
    ], {
      'Andrés Bessette': 'André Bessette',
      'Daniel Comboni': 'Daniele Comboni',
      'Teresa of Calcutta': 'Mother Teresa|Saint Teresa of Calcutta',
      'John Paul II': 'Saint John Paul II',
      'Oscar Romero': 'Saint Óscar Romero',
      'John Henry Newman': 'Saint John Henry Newman',
      'Charles de Foucauld': 'Saint Charles de Foucauld',
      'Carlo Acutis': 'Saint Carlo Acutis',
      'Pier Giorgio Frassati': 'Saint Pier Giorgio Frassati',
      'Pedro de San José Betancur': 'Saint Pedro de San José Betancur|Peter of Saint Joseph Betancur',
      'Josemaría Escrivá': 'Josemaria Escriva|Saint Josemaria Escriva',
      'Padre Pio': 'Pio of Pietrelcina|Saint Pio',
      'Juan Diego': 'Saint Juan Diego',
      'José Sánchez del Río': 'Jose Sanchez del Rio|Saint José Sánchez del Río',
      'Mariam Thresia': 'Saint Mariam Thresia',
      'Maria Troncatti': 'Saint Maria Troncatti'
    }),
    commonGuesses: [
      { guess: 'Teresa of Calcutta', accepted: true }, { guess: 'John Paul II', accepted: true },
      { guess: 'Oscar Romero', accepted: true }, { guess: 'Carlo Acutis', accepted: true }, { guess: 'John Henry Newman', accepted: true },
      { guess: 'Augustine of Hippo', accepted: false, reason: 'Canonized in late antiquity, before the year 2000.' },
      { guess: 'Thomas Aquinas', accepted: false, reason: 'Canonized in 1323, before the year 2000.' },
      { guess: 'Ignatius of Loyola', accepted: false, reason: 'Canonized in 1622, before the year 2000.' },
      { guess: 'Francis of Assisi', accepted: false, reason: 'Canonized in 1228, before the year 2000.' },
      { guess: 'Therese of Lisieux', accepted: false, reason: 'Canonized in 1925, before the year 2000.' }
    ]
  }
];

function normalizeGuess(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

for (const p of checkedLongTailPrompts) {
  if (p.answers.length < 60) throw new Error(`${p.id}: open answer bank has only ${p.answers.length} answers`);
  if (p.closed !== undefined) throw new Error(`${p.id}: long-tail prompt must remain open`);
  if (!p.basis || !p.basis.includes('https://')) throw new Error(`${p.id}: missing named source list and URL`);
  if (new Set(p.answers.map(a => a.tier)).size !== 6) throw new Error(`${p.id}: all six familiarity tiers must be represented`);
  if (p.commonGuesses.length !== 10) throw new Error(`${p.id}: expected exactly ten common guesses`);
  const canonical = new Set<string>();
  for (const a of p.answers) {
    const key = normalizeGuess(a.answer);
    if (canonical.has(key)) throw new Error(`${p.id}: duplicate answer ${a.answer}`);
    canonical.add(key);
  }
  const accepted = new Set(p.answers.flatMap(a => [a.answer, ...(a.aliases ?? [])]).map(normalizeGuess));
  const seenForms = new Map<string, string>();
  for (const a of p.answers) for (const form of [a.answer, ...(a.aliases ?? [])]) {
    const key = normalizeGuess(form); const prior = seenForms.get(key);
    if (prior && prior !== a.answer) throw new Error(`${p.id}: alias collision between ${prior} and ${a.answer} via ${form}`);
    seenForms.set(key, a.answer);
  }
  if (/\b(above|below)\b/i.test(`${p.prompt} ${p.context}`)) throw new Error(`${p.id}: directional language is not allowed in player-facing text`);
  for (const g of p.commonGuesses) {
    if (!g.guess.trim()) throw new Error(`${p.id}: empty common guess`);
    if (g.accepted && !accepted.has(normalizeGuess(g.guess))) throw new Error(`${p.id}: accepted common guess not in key: ${g.guess}`);
    if (!g.accepted && (!g.reason || accepted.has(normalizeGuess(g.guess)))) throw new Error(`${p.id}: rejected common guess needs a reason and must not match: ${g.guess}`);
  }
}

export const LONG_TAIL_PROMPTS: CheckedPrompt[] = checkedLongTailPrompts;
