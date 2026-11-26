import type { DeepAnswer, DeepPrompt, DeepTheme } from './deepWaters';

/**
 * The fifth hand-written batch: questions an ordinary Catholic can answer at once. Each names a category the player already has in mind (a saint who was a
 * soldier, something Catholics give up for Lent, a person Jesus healed) so that several answers come to mind immediately and the rarer ones are the climb.
 * Each line is `Answer|tier|alias;alias`. Tiers are editorial judgement of how many players would think of the answer (1 nearly everyone, 6 only a specialist),
 * not survey data. Written from memory of the standard references named in each `basis`; none of it has been reviewed by a person (see
 * src/data/deepWaters.review.json). Open lists say "not on our list" for an unlisted answer, never "wrong".
 */
const rows = (t: string): DeepAnswer[] => t.trim().split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
  const [answer, tier, al] = l.split('|');
  const aliases = al ? al.split(';').map((x) => x.trim()).filter(Boolean) : [];
  return { answer: answer.trim(), tier: Number(tier) as DeepAnswer['tier'], ...(aliases.length ? { aliases } : {}) };
});
const L = (id: string, theme: DeepTheme, prompt: string, context: string, basis: string, list: string, extra: Partial<DeepPrompt> = {}): DeepPrompt => ({ id: `authored5-${id}`, theme, basis, prompt, context, answers: rows(list), ...extra });
const LIVES = 'Hand-authored from Butler\'s Lives of the Saints and the Roman Martyrology.';

export const EVERYDAY_PROMPTS: DeepPrompt[] = [
  L('saint-soldiers', 'saints', 'Name a saint who was a soldier.', 'Several saints served in armies before or while they were Christians, and some died for refusing to give up their faith. This list is not complete.', LIVES, `
Sebastian|1
George|1
Martin of Tours|1|Martin
Joan of Arc|1|Joan
Ignatius of Loyola|2|Ignatius
Maurice|3
Longinus|3
Florian|3
Demetrius|3|Demetrius of Thessalonica
Eustace|4
Expeditus|4
Adrian of Nicomedia|4
Theodore of Amasea|4
Victor of Marseilles|4
Camillus de Lellis|4|Camillus
Gereon|5
Procopius|5
Mercurius|5
Acacius|5
`),
  L('saint-rulers', 'saints', 'Name a saint who was a king, a queen or an emperor.', 'The Church has canonized rulers who governed with care for the poor and the faith. This list is not complete.', LIVES, `
Louis IX of France|1|Saint Louis;King Louis IX;Louis IX
Wenceslaus|1|Good King Wenceslas;Wenceslas
Helena|1|Helen;Empress Helena
Elizabeth of Hungary|2|Elizabeth
Stephen of Hungary|2|King Stephen of Hungary
Edward the Confessor|2
Henry II|3|Emperor Henry II
Olaf|3|Olaf of Norway
Margaret of Scotland|3|Queen Margaret of Scotland
Casimir|3
Ferdinand III of Castile|3|Ferdinand III
Clotilde|4|Clotilda
Elizabeth of Portugal|4
Hedwig|4|Jadwiga
Kunigunde|4
Oswald|4
Canute|4
Edmund the Martyr|4
Pulcheria|5
`),
  L('saint-nuns', 'saints', 'Name a saint who was a nun or a sister.', 'Women who took vows and lived in a convent or a community of sisters include many of the best known saints. This list is not complete.', LIVES, `
Teresa of Avila|1|Teresa of Ávila;Saint Teresa
Clare of Assisi|1|Clare
Therese of Lisieux|1|Thérèse of Lisieux;Little Flower;Saint Therese
Mother Teresa|1|Teresa of Calcutta;Mother Teresa of Calcutta
Faustina|1|Faustina Kowalska
Bernadette|2|Bernadette Soubirous
Hildegard of Bingen|2|Hildegard
Scholastica|2
Bridget of Sweden|2|Brigid of Sweden
Catherine Laboure|3|Catherine Labouré
Elizabeth Ann Seton|3|Mother Seton
Katharine Drexel|3|Katherine Drexel
Rita of Cascia|2|Rita
Gertrude|3|Gertrude the Great
Mechtilde|5
Colette|4
Josephine Bakhita|3|Bakhita
Mary MacKillop|4
Frances Xavier Cabrini|3|Mother Cabrini
Teresa Benedicta of the Cross|3|Edith Stein
Jeanne Jugan|5
Louise de Marillac|4
Margaret Mary Alacoque|3
`),
  L('saint-founders', 'saints', 'Name a saint who founded a religious order or community.', 'Many orders and congregations began with a single saint and a handful of companions. This list is not complete.', LIVES, `
Benedict|1|Benedict of Nursia
Francis of Assisi|1|Francis
Dominic|1|Dominic de Guzman
Ignatius of Loyola|1|Ignatius
Clare of Assisi|1|Clare
Teresa of Avila|2|Teresa of Ávila
Mother Teresa|1|Teresa of Calcutta
John Bosco|1|Don Bosco
Vincent de Paul|2
Elizabeth Ann Seton|3
Angela Merici|3
John of God|3
Philip Neri|3
Louise de Marillac|4
Francis de Sales|3
Jane Frances de Chantal|4
Bernard of Clairvaux|3
Bruno|3
Norbert|4
Alphonsus Liguori|3
Paul of the Cross|4
Camillus de Lellis|4
Frances Xavier Cabrini|3
Katharine Drexel|4
John Baptist de la Salle|3
Brigid of Kildare|3
Columba|4
Peter Julian Eymard|5
Daniel Comboni|5
Josemaria Escriva|3|Josemaría Escrivá
Giuseppe Cottolengo|5
`),
  L('saint-missionaries', 'saints', 'Name a saint who was a missionary.', 'Missionary saints carried the faith to new peoples, often at great cost. This list is not complete.', LIVES, `
Paul|1|Paul the Apostle
Patrick|1
Francis Xavier|1
Boniface|2
Augustine of Canterbury|3
Cyril|3
Methodius|3
Junipero Serra|2|Junípero Serra
Isaac Jogues|3
Damien of Molokai|2|Father Damien;Damien
Peter Claver|3
Columba|3
Aidan|4
Ansgar|4
Cuthbert|4
Thomas|2|Thomas the Apostle
Andrew|2
Francis Solano|5
Frances Xavier Cabrini|3
John de Brebeuf|3|Jean de Brébeuf
Pedro Calungsod|4
Lorenzo Ruiz|4
Teresa of Calcutta|2
Willibrord|5
Gall|5
Columbanus|4
Killian|5
`),
  L('saint-hermits-monks', 'saints', 'Name a saint who was a monk or a hermit.', 'The first monks lived alone in the desert, and later ones lived together in monasteries under a rule. This list is not complete.', LIVES, `
Benedict|1|Benedict of Nursia
Anthony the Abbot|1|Anthony of Egypt;Anthony the Great;Anthony of the Desert
Jerome|2
Bernard of Clairvaux|2|Bernard
Francis of Assisi|2
Bruno|3
Pachomius|4
Romuald|4
Simeon Stylites|3
Paul of Thebes|4
Hilarion|4
Columba|3
Cuthbert|3
Bede|3|The Venerable Bede
Anselm|3|Anselm of Canterbury
Benedict Joseph Labre|5
Mary of Egypt|4
Gregory the Great|3
Aelred|5
Charbel Makhlouf|4|Sharbel
John Cassian|5
Basil|2|Basil the Great
Meinrad|5
`),
  L('saint-mystics', 'saints', 'Name a saint known for visions or mystical experience.', 'Some saints reported visions, ecstasies or a deep union with God. The Church allows but does not require belief in private revelations. This list is not complete.', LIVES, `
Teresa of Avila|1|Teresa of Ávila
John of the Cross|1
Padre Pio|1|Pio of Pietrelcina
Faustina|1|Faustina Kowalska
Bernadette|1|Bernadette Soubirous
Catherine of Siena|2
Hildegard of Bingen|2|Hildegard
Joan of Arc|2
Francis of Assisi|2
Bridget of Sweden|3|Brigid of Sweden
Margaret Mary Alacoque|3
Gertrude the Great|4|Gertrude
Catherine Laboure|3|Catherine Labouré
Juan Diego|2
Jacinta Marto|3|Jacinta
Francisco Marto|3|Francisco
Gemma Galgani|4
Rose of Lima|4
Angela of Foligno|5
Bonaventure|5
Ignatius of Loyola|3
Teresa of Calcutta|4
John Vianney|4
Paul|2|Paul the Apostle
John|2|John the Apostle
`),
  L('saint-teachers', 'saints', 'Name a saint who was a teacher or an educator.', 'Some saints gave their lives to teaching children, the poor and the young, and many founded schools. This list is not complete.', LIVES, `
John Bosco|1|Don Bosco
Thomas Aquinas|2
Augustine|1|Augustine of Hippo
John Baptist de la Salle|2|De La Salle
Elizabeth Ann Seton|2|Mother Seton
Katharine Drexel|3
Angela Merici|3
Ignatius of Loyola|3
Peter Canisius|4
Joseph Calasanz|4|Joseph Calasanctius
Marcellin Champagnat|5
Mary Mackillop|4
Madeleine Sophie Barat|5
Rose Philippine Duchesne|4
Albert the Great|3|Albertus Magnus
Bede|3
John Henry Newman|2|Cardinal Newman
`),
  L('saint-healers', 'saints', 'Name a saint who was a doctor, a nurse or a healer.', 'Saints who tended the sick include physicians, nurses and founders of hospitals. This list is not complete.', LIVES, `
Luke|1|Luke the Evangelist
Camillus de Lellis|2|Camillus
John of God|3
Gianna Beretta Molla|2|Gianna Molla;Gianna
Giuseppe Moscati|3|Joseph Moscati
Cosmas and Damian|3|Cosmas;Damian
Pantaleon|4|Panteleimon
Damien of Molokai|2|Father Damien
Elizabeth of Hungary|3
Vincent de Paul|3
Louise de Marillac|4
Frances Xavier Cabrini|4
Raphael|2|Raphael the Archangel
Roch|3|Rocco
Aloysius Gonzaga|3
Martin de Porres|2
Teresa of Calcutta|2|Mother Teresa
Jeanne Jugan|5
Francis of Assisi|3
Hildegard of Bingen|3
Peter Claver|4
Bernadette|3
`),
  L('saint-converts', 'saints', 'Name a saint who was a convert or who changed his or her life dramatically.', 'Some saints began as persecutors, sinners, soldiers or unbelievers before a dramatic change of life. This list is not complete.', LIVES, `
Paul|1|Saul;Paul the Apostle
Augustine|1|Augustine of Hippo
Francis of Assisi|1
Ignatius of Loyola|1
Mary Magdalene|1
Matthew|2|Levi
Mary of Egypt|3
Edith Stein|2|Teresa Benedicta of the Cross
Justin Martyr|3|Justin
Zacchaeus|3
Dismas|2|The Good Thief;Good Thief
Longinus|3
Elizabeth Ann Seton|3
John Henry Newman|2|Cardinal Newman
Bartolo Longo|5
Charles de Foucauld|3
Moses the Black|4
Margaret of Cortona|4
Pelagia|5
Camillus de Lellis|3
Olga|4
Vladimir|4
Cyprian|4
Thais|5
`),
  L('saint-young', 'saints', 'Name a saint who died young.', 'Many saints died as children or young adults, some as martyrs and some of illness. This list is not complete.', LIVES, `
Agnes|1|Agnes of Rome
Maria Goretti|1
Therese of Lisieux|1|Thérèse of Lisieux
Carlo Acutis|1
Tarcisius|3
Dominic Savio|2
Aloysius Gonzaga|3
Stanislaus Kostka|3
Jacinta Marto|2|Jacinta
Francisco Marto|2|Francisco
Pedro Calungsod|3
Kateri Tekakwitha|3|Kateri
Cecilia|3
Lucy|2|Lucia
Agatha|2
Pier Giorgio Frassati|2
Perpetua|3
Rose of Viterbo|5
Gabriel of Our Lady of Sorrows|4|Gabriel Possenti
John Berchmans|4
Teresa of the Andes|4
Joan of Arc|2
Pancras|4
Vitus|4
Barbara|3
Margaret of Antioch|4
Ursula|4
`),
  L('saint-married', 'saints', 'Name a saint who was married.', 'Not all saints were priests or nuns. Many were husbands, wives, mothers and fathers. This list is not complete.', LIVES, `
Joseph|1|Saint Joseph
Anne|1|Saint Anne;Ann
Joachim|1
Elizabeth|2|Saint Elizabeth
Zechariah|3|Zachary
Monica|1
Peter|1|Simon Peter
Thomas More|2
Louis IX|3|Louis IX of France
Elizabeth of Hungary|3
Gianna Beretta Molla|2|Gianna Molla
Zelie Martin|2|Zélie Martin
Louis Martin|2
Rita of Cascia|2|Rita
Elizabeth Ann Seton|2|Mother Seton
Isidore the Farmer|2|Isidore
Maria Torribia|5
Brigid of Sweden|3|Bridget of Sweden
Frances of Rome|3
Paula|5
Perpetua|3
Henry II|4
Margaret of Scotland|4
Edward the Confessor|4
Catherine of Genoa|5
Helena|3
Stephen of Hungary|4
Ladislaus|5
`),
  L('saint-writers', 'saints', 'Name a saint who wrote books.', 'Many saints left writings that are still read: sermons, letters, autobiographies and works of theology. This list is not complete.', LIVES, `
Augustine|1|Augustine of Hippo
Thomas Aquinas|1
Teresa of Avila|1
John of the Cross|1
Francis de Sales|2
Jerome|2
Ambrose|2
Catherine of Siena|2
Therese of Lisieux|1|Thérèse of Lisieux
Bede|3|The Venerable Bede
Bonaventure|3
Anselm|3|Anselm of Canterbury
Hildegard of Bingen|2|Hildegard
Bernard of Clairvaux|3
Alphonsus Liguori|3
Ignatius of Loyola|2
Thomas More|2
Edith Stein|3|Teresa Benedicta of the Cross
Faustina|1|Faustina Kowalska
John Henry Newman|2|Cardinal Newman
Athanasius|3
Gregory the Great|3
Basil|3
John Chrysostom|3
Benedict|2
Francis of Assisi|3
Josemaria Escriva|3
John Paul II|1|Pope John Paul II
Albert the Great|4
Robert Bellarmine|4
Gregory of Nazianzus|4
Isidore of Seville|4
Peter Damian|5
Cyril of Jerusalem|5
Catherine of Genoa|5
Paul|1|Paul the Apostle
Luke|2
John|2
Mark|2
Matthew|2
`),
  L('saint-animal', 'saints', 'Name a saint who is known for an animal.', 'Many saints are shown in art with an animal that belongs to their story. This list is not complete.', LIVES, `
Francis of Assisi|1|Francis
Jerome|1
Anthony the Abbot|2|Anthony of Egypt
Roch|2|Rocco
Anthony of Padua|3
Dominic|3
Blaise|4
Martin de Porres|2
Mark|3|Mark the Evangelist
Luke|3|Luke the Evangelist
Gertrude|4
Brendan|3
Cuthbert|3
Giles|3
Hubert|3
Eustace|4
Gall|4
Columba|4
Kevin|4
Melangell|5
Paul|5
John|3|John the Evangelist
Agnes|2
Patrick|2
Margaret of Antioch|4
`),
  L('saint-feast-known', 'saints', 'Name a saint with a well known feast day.', 'Some saints\' days are marked far beyond the Church with parades, gifts and foods. This list is not complete.', 'Hand-authored from the General Roman Calendar and popular customs.', `
Patrick|1|St. Patrick;Saint Patrick
Valentine|1
Nicholas|1|Saint Nick;Santa Claus
Joseph|1
Francis of Assisi|2|Francis
Anthony of Padua|2
Michael|2|Michael the Archangel
John the Baptist|2
Peter|2
Paul|2
George|2
Lucy|2
Stephen|2
Martin of Tours|3
Andrew|2
Cecilia|3
Blaise|3
Brigid|3|Brigid of Kildare
David|3
Thomas Aquinas|3
Joan of Arc|3
Mary Magdalene|2
Anne|2
Barbara|3
Catherine of Alexandria|3
Agnes|3
Sebastian|3
Teresa of Avila|3
Therese of Lisieux|3
John Bosco|3
Elizabeth|3
Nicholas of Myra|3
Rose of Lima|3
Martin de Porres|3
Juan Diego|3
Jude|2
Ignatius of Loyola|3
Dominic|3
Augustine|3
Monica|3
Gabriel|3
Raphael|3
Wenceslaus|3
Casimir|4
Lawrence|3
Bartholomew|3
Matthew|3
Luke|3
Mark|3
James|3
John the Evangelist|3
`),
  L('jesus-healed', 'scripture', 'Name a person whom Jesus healed or raised from the dead.', 'The Gospels tell of many people Jesus healed, some by name and some described only by their illness. This list is not complete.', 'Hand-authored from the four Gospels.', `
Lazarus|1
Blind Bartimaeus|1|Bartimaeus
The paralytic|2|Paralytic;Paralyzed man;Man lowered through the roof
Jairus' daughter|1|Daughter of Jairus;Jairus daughter
Widow of Nain's son|3|Son of the widow of Nain
Peter's mother-in-law|2|Simon Peter's mother-in-law
The centurion's servant|2|Centurion's servant;Servant of the centurion
The woman with the issue of blood|1|Woman with the hemorrhage;Woman who touched his cloak;Woman with a hemorrhage
The ten lepers|2|Ten lepers
The man born blind|2|Man born blind;Blind man
The Gerasene demoniac|3|Gerasene man;Demoniac of the Gerasenes
The Canaanite woman's daughter|3|Syrophoenician woman's daughter
The deaf man|3|Deaf mute;Deaf and mute man
The man with the withered hand|3|Man with a withered hand
The man at the pool of Bethesda|3|Man at Bethesda;Sick man at the pool
Malchus|3|High priest's servant
The official's son|4|Royal official's son;Nobleman's son
The woman bent over|4|Crippled woman
The man with dropsy|5
`),
  L('people-at-cross', 'scripture', 'Name someone who was at the crucifixion of Jesus.', 'The Gospels name those who stood by the Cross, those who mocked him and those who took his body down. This list is not complete.', 'Hand-authored from the four Gospels.', `
Mary|1|Mary the mother of Jesus;Virgin Mary;Our Lady
John|1|John the Apostle;The beloved disciple;Beloved disciple
Mary Magdalene|1
Pontius Pilate|1|Pilate
The centurion|2|Centurion
The good thief|2|Dismas;Penitent thief
The bad thief|3|Impenitent thief;Gestas
Joseph of Arimathea|2
Nicodemus|3
Simon of Cyrene|2
Mary of Clopas|3|Mary the wife of Clopas
Salome|4
Mary the mother of James|4
Longinus|3
The soldiers|2|Roman soldiers
Veronica|3
The women of Jerusalem|4|Daughters of Jerusalem
Barabbas|2
Caiaphas|3
Herod|3|Herod Antipas
The chief priests|3|Chief priests
The crowd|3
`),
  L('nativity-people', 'scripture', 'Name someone (or something) in the Christmas story.', 'The Gospels of Matthew and Luke tell of the birth of Jesus, and tradition has added to the scene. This list is not complete.', 'Hand-authored from Matthew 1 to 2 and Luke 1 to 2, with the customary crib figures.', `
Mary|1
Joseph|1
Jesus|1|The baby Jesus;Baby Jesus
The shepherds|1|Shepherds
The angels|1|Angels
The three kings|1|Three Kings;Three wise men;Wise men;Magi;The Magi
Herod|2|King Herod
The angel Gabriel|1|Gabriel
The star|1|Star of Bethlehem
The innkeeper|2|Innkeeper
The manger|1|Manger
The donkey|2|Donkey
The ox|2|Ox
Caspar|3|Gaspar;Casper
Melchior|3
Balthasar|3|Balthazar
Elizabeth|2
Zechariah|3|Zachary
John the Baptist|2|John
Simeon|3
Anna|3|Anna the prophetess
Caesar Augustus|3|Augustus
Quirinius|4
The sheep|3|Sheep;Lambs
The stable|2|Stable
Gold|2
Frankincense|2
Myrrh|2
Bethlehem|1
Nazareth|2
Egypt|2
`),
  L('iam-sayings', 'scripture', 'Name one of the "I am" sayings of Jesus in John\'s Gospel.', 'In John\'s Gospel Jesus says "I am" and then names who he is. There are seven of them in the Gospel (plus "I am" without a noun).', 'Hand-authored from the Gospel of John (6:35, 8:12, 10:7, 10:11, 11:25, 14:6, 15:1).', `
The bread of life|1|Bread of life;I am the bread of life;Bread
The light of the world|1|Light of the world;I am the light of the world;Light
The door|2|The gate;The door of the sheep;I am the door;Gate
The good shepherd|1|Good shepherd;The shepherd;I am the good shepherd;Shepherd
The resurrection and the life|2|Resurrection and the life;I am the resurrection;The resurrection
The way, the truth and the life|1|The way;The truth;The life;Way truth life;The way the truth and the life
The true vine|2|The vine;True vine;I am the vine;Vine
`, { closed: 7 }),
  L('lent-sacrifices', 'devotion', 'Name something Catholics give up for Lent.', 'Many Catholics give up something for the forty days of Lent as a sacrifice, in the spirit of fasting, prayer and almsgiving. This list is long but not complete.', 'Hand-authored from common Lenten customs in the Catholic Church.', `
Chocolate|1
Sweets|1|Candy;Sugar
Meat|1|Red meat
Alcohol|1|Drinking;Beer;Wine
Social media|1|Facebook;Instagram;TikTok
Coffee|1
Desserts|1|Dessert
Soda|2|Soft drinks;Pop
Television|2|TV
Video games|2|Gaming
Fast food|2
Snacks|2|Snacking
Ice cream|2
Cookies|3
Cheese|4
Fried food|3
Swearing|2|Cursing;Bad language
Complaining|2
Gossip|2|Gossiping
Sleeping in|3
Hitting snooze|4
Shopping|3
Smoking|3
Caffeine|3
Chips|3|Crisps
Pizza|3
Music|3
Eating between meals|4
Their phone|3|Phone;Smartphone
The internet|4
Gum|4
Fries|4|French fries
Netflix|2
`),
  L('mass-actions', 'liturgy', 'Name something Catholics do at Mass.', 'The Mass has a pattern, and the people take part throughout. This list is long but not complete.', 'Hand-authored from the Order of Mass in the Roman Missal.', `
Pray|1|Praying
Sing|1|Singing;Sing hymns
Kneel|1|Kneeling
Stand|1|Standing
Sit|1|Sitting
Make the sign of the cross|1|Sign of the cross;Bless themselves
Receive communion|1|Take communion;Go to communion;Communion
Listen to the readings|2|Listen to the Gospel;Listen;Hear the readings
Listen to the homily|2|Listen to the sermon;Homily;Sermon
Say the Creed|2|Recite the Creed;Creed
Give the sign of peace|2|Exchange the sign of peace;Shake hands;Sign of peace
Make an offering|2|Give to the collection;Put money in the basket;Collection
Say the Our Father|2|Our Father
Genuflect|2|Genuflection
Say Amen|2|Amen
Say the Confiteor|3|I confess
Strike the breast|3|Beat their breast
Bow|3|Bow the head
Respond to the priest|3|Responses
Pray for the dead|4
Pray the Gloria|3|Gloria
Sing the Alleluia|3|Alleluia
Say the responsorial psalm|4|Respond to the psalm;Psalm
Pray the Lord Have Mercy|3|Kyrie
Say the Holy Holy Holy|3|Sanctus;Holy Holy Holy
Say the Lamb of God|3|Agnus Dei
Hear the Gospel|2|Gospel
Pray the Prayers of the Faithful|3|Prayer of the faithful;Petitions
Receive a blessing|2|Blessing
Make three small crosses|4|Three crosses before the Gospel
Light candles|4
Pray silently|3|Silent prayer
Dip fingers in holy water|2|Holy water
Say "Thanks be to God"|3|Thanks be to God
Say "And with your spirit"|3|And with your spirit
`),
  L('holy-week', 'devotion', 'Name something Catholics do or celebrate during Holy Week.', 'Holy Week, from Palm Sunday to Holy Saturday, retraces the last days of Jesus and leads to Easter. This list is long but not complete.', 'Hand-authored from the Roman Missal and Holy Week customs.', `
Palm Sunday procession|1|Palm Sunday;Procession with palms;Carry palms
Holy Thursday Mass|1|Mass of the Lord's Supper;Holy Thursday;Maundy Thursday
Washing of the feet|1|Foot washing;Wash feet;Washing feet
Good Friday service|1|Good Friday;Celebration of the Lord's Passion
Veneration of the cross|1|Kiss the cross;Venerate the cross;Adoration of the cross
Stations of the Cross|1|Way of the Cross;Stations
Easter Vigil|1|Holy Saturday vigil;Easter vigil Mass
Lighting the Paschal candle|2|Paschal candle;Light the Easter candle;Fire
Baptisms at the Vigil|3|Baptisms;Baptize new Catholics;RCIA initiation
Fasting|2|Fast
Abstaining from meat|2|No meat on Friday
Reading the Passion|2|Passion reading;Passion narrative;Hear the Passion
Tenebrae|3
Chrism Mass|4|Mass of Chrism
Adoration at the altar of repose|3|Altar of repose;Watch with the Lord;Adoration
Confession|2|Go to confession
Easter egg hunt|3
Blessing of the Easter food|4|Blessing of baskets
Seven Last Words|4
Sing the Exsultet|4|Exsultet
Strip the altar|4|Stripping of the altar
Renew baptismal promises|3|Renewal of baptismal promises
Sing Alleluia again|3|Alleluia returns
Church bells silent|4|Bells silent
`),
  L('catholic-food', 'devotion', 'Name a food that Catholics eat on a feast day or in a season.', 'Feast days and seasons have their foods: some eaten for the feast and some for the fast. This list is long but not complete.', 'Hand-authored from common Catholic customs.', `
Hot cross buns|1|Hot cross bun
Fish|1|Fish on Friday;Fish fry;Fish sticks
Easter eggs|1|Eggs;Easter egg
Lamb|1|Easter lamb;Roast lamb;Lamb cake
Pancakes|1|Shrove Tuesday pancakes;Pancake Tuesday
King cake|2|Kings cake;Rosca de Reyes;Three kings cake
Pretzels|2|Pretzel
Paczki|3|Paczkis;Polish doughnuts
Panettone|3
Christmas ham|3|Ham
Tamales|3
Fruitcake|3
Gingerbread|3
Yule log|3|Buche de Noel;Bûche de Noël
Eggnog|3
Easter bread|3|Paska;Kulich
Pierogi|3
Candy canes|3|Candy cane
Stollen|4
Simnel cake|4
Mince pies|4|Mince pie
Wafer|3|Oplatek;Christmas wafer
Cod|4|Bacalao;Salt cod
Lent soup|4|Lenten soup
Pan de muerto|3|Bread of the dead
Soul cakes|4|Soul cake
Chestnuts|4
Cookies|3|Christmas cookies
`),
  L('blessed-things', 'liturgy', 'Name something that a priest blesses.', 'The Church blesses people and also things set apart for holy use or for the good of those who use them. This list is long but not complete.', 'Hand-authored from the Roman Ritual (Book of Blessings).', `
Water|1|Holy water
Palms|1|Palm branches;Palm Sunday palms
Rosaries|1|Rosary beads;Rosary
Candles|1|Candle;Candles on Candlemas
Homes|1|House;Houses;Home
Medals|2|Medal;Saint medals
Ashes|2|Ashes on Ash Wednesday
Throats|2|Throat;Throats on the feast of Saint Blaise
Animals|2|Pets;Pet blessing;Pets on Saint Francis' feast day
Easter food|3|Food;Baskets;Easter baskets
Marriages|2|Weddings;Couples
Rings|2|Wedding rings
Children|1|Babies;Newborns
The sick|2|Sick people
Pregnant women|3|Expectant mothers
Cars|3|Vehicles
Fields|3|Crops;Farms
Statues|2|Statue;Images
Crosses|2|Crucifixes;Cross
Churches|2|New church;Church buildings
Ships|4|Boats;Fleets
Chalices|3|Chalice
Vestments|3
Bells|3
Chrism|3|Oil;Holy oil;Oil of the sick
Bread|2|Loaves;Saint Anthony's bread
Wine|3
Salt|4
Graves|3|Cemeteries;Graves on All Souls
Pilgrims|3|Pilgrimage
Scapulars|3|Scapular
Incense|4
Fire|3|Easter fire
Seeds|4
`),
  L('mass-words', 'liturgy', 'Name a word or phrase you hear at Mass.', 'Even people who have not been to Mass for years know the sound of it. These are words that come up again and again in the Mass. This list is long but not complete.', 'Hand-authored from the Order of Mass in the Roman Missal.', `
Amen|1
Alleluia|1|Hallelujah
Lord|1
Peace|1|Peace be with you;Sign of peace
Holy|1|Holy Holy Holy
Body of Christ|1|The Body of Christ
Blood of Christ|1
Communion|1
Let us pray|1
The Lord be with you|2|Lord be with you
And with your spirit|2|And also with you
Thanks be to God|2
Praise to you Lord Jesus Christ|3
The Gospel of the Lord|2|Gospel of the Lord
The word of the Lord|2|Word of the Lord
Lamb of God|1|Agnus Dei
Lord have mercy|2|Kyrie;Kyrie eleison
Glory to God|2|Gloria
Hosanna|2|Hosanna in the highest
I believe|2
We believe|2
Father|1
Son|1
Holy Spirit|1|Holy Ghost
Blessed|2
Behold the Lamb of God|3|Behold the Lamb
Lord I am not worthy|2|Lord I am not worthy that you should enter under my roof
Go in peace|2|Go forth
The Mass is ended|3|Ite missa est
Let us proclaim the mystery of faith|3|Mystery of faith
Do this in memory of me|3|In memory of me
This is my body|2|This is my Body
Through him with him in him|4
Eternal life|2
Mercy|2
Sin|2|Sins
Forgive|2|Forgiveness
Heaven|1
Angels|2
Thanksgiving|3|Eucharist
Offertory|3|Offering
Homily|3
Readings|2
`),
  L('catholic-symbols-everyday', 'art-music', 'Name something you would see on a rosary or in a rosary prayer.', 'Its prayers have words everyone knows. This list is long but not complete.', 'Hand-authored from the standard form of the Rosary.', `
Crucifix|1|Cross
Beads|1|Rosary beads
Hail Mary|1
Our Father|1
Glory Be|1|Glory be to the Father
Medal|2|Center medal;Centre medal
Mysteries|1|Mystery
Decade|2|Decades
Apostles' Creed|2|Creed;Apostles Creed
Hail Holy Queen|2|Salve Regina
Joyful mysteries|1|Joyful
Sorrowful mysteries|1|Sorrowful
Glorious mysteries|1|Glorious
Luminous mysteries|2|Luminous;Mysteries of light
Annunciation|2
Visitation|3
Nativity|2
Presentation|3
Finding in the Temple|3
Agony in the Garden|2
Scourging at the Pillar|2|Scourging
Crowning with Thorns|2
Carrying of the Cross|2
Crucifixion|1
Resurrection|1
Ascension|2
Descent of the Holy Spirit|2|Pentecost
Assumption|2
Coronation of Mary|2|Crowning of Mary;Coronation
Baptism of Jesus|3
Wedding at Cana|3
Proclamation of the Kingdom|4
Transfiguration|3
Institution of the Eucharist|3|Last Supper
Fatima prayer|3|O my Jesus;Oh my Jesus
Five decades|2
Fifty-three Hail Marys|4
Sign of the Cross|2
`),
  L('visions-appearances', 'scripture', 'Name someone who had a vision, dream or heavenly message in the Bible.', 'God speaks to people throughout the Bible by dreams, visions and angels. This list is not complete.', 'Hand-authored from the Old and New Testaments.', `
Joseph|1|Joseph the patriarch;Joseph son of Jacob
Joseph the husband of Mary|1|Joseph of Nazareth
Jacob|1|Israel
Daniel|1
Peter|2
Paul|1|Saul
John|2|John of Patmos
Mary|1
Zechariah|2
Isaiah|2
Ezekiel|2
Samuel|3
Abraham|2
Moses|2
Elijah|3
Jeremiah|3
Gideon|4
Solomon|3
Nebuchadnezzar|3
Pharaoh|3
The Magi|2|The wise men;Three kings
Cornelius|4
Ananias|4
Stephen|3
Joshua|4
Balaam|4
Hagar|4
Gabriel|2
Samson's mother|5
Manoah|5
Lot|4
Jonah|4
`),
  L('shepherds-bible', 'scripture', 'Name a shepherd or a keeper of sheep in the Bible.', 'Shepherds appear everywhere in the Bible, and God is called a shepherd. This list is not complete.', 'Hand-authored from the Old and New Testaments.', `
David|1
Moses|1
Abel|2
Abraham|2
Isaac|2
Jacob|2
Rachel|3
Amos|3
Jesus|1|The Good Shepherd;Good Shepherd
The shepherds of Bethlehem|1|Shepherds;Nativity shepherds
Lot|4
Laban|3
Joseph|3
Zipporah|4
Jethro|4
Jabal|5
Reuben|5
The sons of Jacob|3|Jacob's sons
Job|4
Nabal|5
`),
  L('long-lived-bible', 'scripture', 'Name a person in the Bible who lived a very long time.', 'Genesis gives the ages of the first fathers, many of whom lived hundreds of years. This list is not complete.', 'Hand-authored from Genesis 5, 9, 11, 25 and Deuteronomy 34.', `
Methuselah|1
Noah|1
Adam|1
Enoch|2
Seth|3
Abraham|2
Isaac|3
Jacob|3
Moses|2
Sarah|3
Lamech|4
Jared|4
Kenan|5
Mahalalel|5
Cainan|5
Shem|3
Terah|4
Eber|5
Joseph|3
Aaron|3
Joshua|3
Job|4
Peleg|5
Arphaxad|6
Nahor|5
Serug|6
Reu|6
Salah|6
`),
];
