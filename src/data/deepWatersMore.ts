import type { DeepAnswer, DeepPrompt, DeepTier } from './deepWaters';

/**
 * More Deep Waters prompts, written by hand. Nothing here is generated or copied from a source; it is the editors' own compilation and is flagged
 * as unreviewed in src/data/deepWaters.review.json until a person has checked it. `closed` prompts name a whole set and the list must equal it.
 */
type Row = [name: string, tier: DeepTier, aliases?: string];
const rows = (list: Row[]): DeepAnswer[] => list.map(([answer, tier, a]) => ({ answer, tier, ...(a ? { aliases: a.split('|') } : {}) }));

export const MORE_PROMPTS: DeepPrompt[] = [
  {
    id: 'sacraments', theme: 'doctrine',
    prompt: 'Name one of the seven sacraments.',
    context: 'The Catholic Church celebrates seven sacraments: three of initiation, two of healing and two at the service of communion.',
    closed: 7,
    answers: rows([
      ['Baptism', 1], ['Confirmation', 1, 'Chrismation'], ['Eucharist', 1, 'Holy Communion|Communion|Holy Eucharist|Lord\'s Supper'], ['Penance', 1, 'Reconciliation|Confession|Sacrament of Reconciliation|Sacrament of Penance|Confession of sins'],
      ['Anointing of the Sick', 2, 'Extreme Unction|Last Rites|Unction|Anointing'], ['Matrimony', 1, 'Marriage|Holy Matrimony|Sacrament of Marriage'], ['Holy Orders', 2, 'Ordination|Orders|Priesthood'],
    ]),
  },
  {
    id: 'virtues', theme: 'doctrine',
    prompt: 'Name one of the seven virtues: the three theological or the four cardinal.',
    context: 'The theological and cardinal virtues are the hinges on which the moral life turns.',
    closed: 7,
    answers: rows([
      ['Faith', 1], ['Hope', 1], ['Charity', 1, 'Love'], ['Justice', 1], ['Prudence', 2], ['Fortitude', 2, 'Courage|Strength'], ['Temperance', 2, 'Moderation'],
    ]),
  },
  {
    id: 'deadly-sins', theme: 'doctrine',
    prompt: 'Name one of the seven capital (deadly) sins.',
    context: 'They are called capital sins because they give rise to other sins.',
    closed: 7,
    answers: rows([
      ['Pride', 1, 'Vanity|Vainglory'], ['Greed', 1, 'Avarice|Covetousness'], ['Lust', 1], ['Envy', 1, 'Jealousy'], ['Gluttony', 1], ['Wrath', 1, 'Anger'], ['Sloth', 1, 'Acedia|Laziness'],
    ]),
  },
  {
    id: 'gifts', theme: 'doctrine',
    prompt: 'Name one of the seven gifts of the Holy Spirit.',
    context: 'The gifts, from Isaiah 11:2-3, complete and perfect the virtues of those who receive them.',
    closed: 7,
    answers: rows([
      ['Wisdom', 1], ['Understanding', 2], ['Counsel', 2, 'Right Judgment'], ['Fortitude', 2, 'Courage'], ['Knowledge', 2], ['Fear of the Lord', 2, 'Wonder and Awe|Awe'], ['Piety', 3, 'Reverence'],
    ]),
  },
  {
    id: 'fruits', theme: 'doctrine',
    prompt: 'Name one of the twelve fruits of the Holy Spirit listed in the Catechism.',
    context: 'Following Galatians 5:22-23 in the Latin tradition, the Catechism lists twelve: the first fruits of eternal glory.',
    closed: 12,
    answers: rows([
      ['Charity', 1, 'Love'], ['Joy', 1], ['Peace', 1], ['Patience', 1, 'Longanimity'], ['Kindness', 2], ['Goodness', 2], ['Gentleness', 2, 'Meekness'], ['Generosity', 3, 'Benignity'], ['Faithfulness', 2, 'Fidelity'], ['Modesty', 4], ['Self-control', 2, 'Continence|Self control'], ['Chastity', 2],
    ]),
  },
  {
    id: 'corporal-works', theme: 'doctrine',
    prompt: 'Name one of the seven corporal works of mercy.',
    context: 'Taken from Matthew 25 and the Book of Tobit, they are acts of charity toward the bodily needs of others.',
    closed: 7,
    answers: rows([
      ['Feed the hungry', 1, 'Give food to the hungry|Feeding the hungry'], ['Give drink to the thirsty', 1, 'Water the thirsty'], ['Clothe the naked', 1, 'Clothing the naked'], ['Visit the sick', 1, 'Care for the sick'],
      ['Shelter the homeless', 2, 'Harbor the homeless|Harbour the harbourless|Welcome the stranger|Shelter the stranger'], ['Visit the imprisoned', 2, 'Visit the prisoner|Visit the prisoners|Ransom the captive|Visit those in prison'], ['Bury the dead', 2, 'Burying the dead'],
    ]),
  },
  {
    id: 'spiritual-works', theme: 'doctrine',
    prompt: 'Name one of the seven spiritual works of mercy.',
    context: 'They are acts of charity toward the spiritual needs of others.',
    closed: 7,
    answers: rows([
      ['Instruct the ignorant', 2, 'Teach the ignorant|Instruct the uninstructed'], ['Counsel the doubtful', 2], ['Admonish the sinner', 2, 'Admonish sinners|Correct sinners|Warn the sinner'], ['Forgive offenses', 1, 'Forgive offences|Forgive all injuries|Forgive injuries|Forgive those who hurt you'],
      ['Bear wrongs patiently', 2, 'Bear wrongs with patience|Suffer wrongs patiently'], ['Comfort the afflicted', 1, 'Comfort the sorrowful|Console the sorrowful'], ['Pray for the living and the dead', 1, 'Pray for the living and dead|Pray for the dead|Pray for the living'],
    ]),
  },
  {
    id: 'plagues', theme: 'scripture',
    prompt: 'Name one of the ten plagues of Egypt.',
    context: 'Exodus 7-12 tells of ten signs that preceded the Exodus, ending with the death of the firstborn and the first Passover.',
    closed: 10,
    answers: rows([
      ['Water turned to blood', 1, 'Blood|Nile turned to blood|River of blood|Water to blood'], ['Frogs', 1], ['Gnats', 3, 'Lice|Mosquitoes|Fleas|Gnats or lice'], ['Flies', 3, 'Swarms of flies|Insects|Swarm|Beetles'], ['Boils', 2, 'Sores|Festering boils'],
      ['Death of livestock', 3, 'Pestilence|Livestock|Cattle|Plague on livestock|Disease on livestock|Murrain'], ['Hail', 2, 'Thunder and hail|Hailstorm'], ['Locusts', 1], ['Darkness', 1], ['Death of the firstborn', 1, 'Firstborn|Death of firstborn|Slaying of the firstborn|Death of the first born'],
    ]),
  },
  {
    id: 'sons-of-jacob', theme: 'scripture',
    prompt: 'Name one of the twelve sons of Jacob, the fathers of the tribes of Israel.',
    context: 'Genesis 29-35 names the twelve sons born to Jacob; the tribes of Israel descend from them, with Joseph\'s line counted through Ephraim and Manasseh.',
    closed: 12,
    answers: rows([
      ['Reuben', 2], ['Levi', 2], ['Simeon', 3], ['Judah', 1], ['Dan', 3], ['Naphtali', 4], ['Gad', 4], ['Asher', 4], ['Issachar', 4], ['Zebulun', 4, 'Zebulon'], ['Joseph', 1], ['Benjamin', 1],
    ]),
  },
  {
    id: 'minor-prophets', theme: 'scripture',
    prompt: 'Name one of the twelve Minor Prophets.',
    context: 'The twelve shorter prophetic books were counted together as one book in Jewish tradition.',
    closed: 12,
    answers: rows([
      ['Hosea', 3], ['Joel', 3], ['Amos', 3], ['Jonah', 1, 'Jonas'], ['Obadiah', 4, 'Abdias'], ['Micah', 3, 'Micheas'], ['Nahum', 4], ['Habakkuk', 4, 'Habacuc'], ['Zephaniah', 4, 'Sophonias'], ['Haggai', 4, 'Aggeus'], ['Zechariah', 3, 'Zacharias'], ['Malachi', 3, 'Malachias'],
    ]),
  },
  {
    id: 'ot-prophets', theme: 'scripture',
    prompt: 'Name a prophet of the Old Testament.',
    context: 'Israel\'s prophets include the writing prophets and the men and women who spoke for God without leaving a book. This list is long but not complete.',
    answers: rows([
      ['Isaiah', 1, 'Isaias'], ['Jeremiah', 1, 'Jeremias'], ['Ezekiel', 1, 'Ezechiel'], ['Daniel', 1], ['Elijah', 1, 'Elias'], ['Moses', 1], ['Elisha', 2, 'Eliseus'], ['Samuel', 1], ['Nathan', 2], ['Jonah', 1, 'Jonas'], ['Hosea', 3, 'Osee'], ['Joel', 3], ['Amos', 3], ['Obadiah', 4, 'Abdias'], ['Micah', 3, 'Micheas'], ['Nahum', 4],
      ['Habakkuk', 4, 'Habacuc'], ['Zephaniah', 4, 'Sophonias'], ['Haggai', 4, 'Aggeus'], ['Zechariah', 3, 'Zacharias'], ['Malachi', 3, 'Malachias'], ['Miriam', 3], ['Deborah', 3], ['Huldah', 4, 'Holda'], ['Gad', 4], ['Ahijah', 5, 'Ahijah the Shilonite|Achias'], ['Micaiah', 5, 'Micaiah son of Imlah|Michaias'],
      ['Balaam', 4], ['Aaron', 3], ['Abraham', 3], ['Baruch', 4], ['Azariah', 5, 'Azariah son of Oded'], ['Hanani', 5], ['Jehu', 5, 'Jehu son of Hanani'], ['Oded', 5], ['Shemaiah', 5], ['Iddo', 5], ['Uriah', 5, 'Urijah|Uriah son of Shemaiah'], ['Zechariah son of Jehoiada', 5], ['Eldad', 5], ['Enoch', 4], ['Medad', 5], 
    ]),
  },
  {
    id: 'kings-of-israel', theme: 'scripture',
    prompt: 'Name a king of Israel or Judah (the united or the divided kingdom).',
    context: 'From Saul to Zedekiah the Bible follows the kings of Israel and of Judah. This list is long but not complete.',
    answers: rows([
      ['David', 1], ['Solomon', 1], ['Saul', 1], ['Hezekiah', 2, 'Ezekias'], ['Josiah', 2, 'Josias'], ['Ahab', 2, 'Achab'], ['Jehoshaphat', 3, 'Josaphat'], ['Jeroboam', 2, 'Jeroboam I'], ['Rehoboam', 3, 'Roboam'], ['Jeroboam II', 4], ['Manasseh', 3, 'Manasses'], ['Uzziah', 3, 'Azariah|Ozias'], ['Ahaz', 3, 'Achaz'], ['Zedekiah', 3, 'Sedecias'],
      ['Jehoiakim', 4, 'Joakim'], ['Jehoiachin', 4, 'Jeconiah|Joachin'], ['Jehu', 3], ['Omri', 3, 'Amri'], ['Asa', 4], ['Joash', 4, 'Jehoash|Joas'], ['Amaziah', 4, 'Amasias'], ['Jotham', 4, 'Joatham'], ['Amon', 4], ['Jehoram', 4, 'Joram'], ['Ahaziah', 4, 'Ochozias'], ['Abijah', 5, 'Abijam|Abia'],
      ['Baasha', 5, 'Baasa'], ['Elah', 5], ['Zimri', 5, 'Zambri'], ['Nadab', 5], ['Pekah', 5, 'Phacee'], ['Pekahiah', 5], ['Menahem', 5], ['Hoshea', 4, 'Osee'], ['Shallum', 5], ['Jehoahaz', 5, 'Joachaz'], ['Ish-bosheth', 5, 'Ishbosheth|Eshbaal|Isboseth'], ['Athaliah', 4, 'Queen Athaliah'], ['Zechariah', 5],
    ]),
  },
  {
    id: 'judges', theme: 'scripture',
    prompt: 'Name a judge of Israel.',
    context: 'Before there were kings, God raised up judges to deliver Israel; the Book of Judges names twelve, and Eli and Samuel are called judges in 1 Samuel.',
    answers: rows([
      ['Samson', 1], ['Gideon', 1], ['Deborah', 1], ['Samuel', 1], ['Jephthah', 2, 'Jephte'], ['Ehud', 3, 'Aod'], ['Eli', 2, 'Heli'], ['Othniel', 3, 'Othoniel'], ['Shamgar', 4, 'Samgar'], ['Tola', 4, 'Thola'], ['Jair', 4], ['Ibzan', 5, 'Abesan'], ['Elon', 5, 'Ailon'], ['Abdon', 5], 
    ]),
  },
  {
    id: 'parables', theme: 'scripture',
    prompt: 'Name a parable of Jesus.',
    context: 'Jesus taught in stories drawn from farms, weddings, banquets and households. This list is long but not complete.',
    answers: rows([
      ['The Prodigal Son', 1, 'Prodigal Son|Lost Son|The Lost Son|The Father and Two Sons'], ['The Good Samaritan', 1, 'Good Samaritan'], ['The Sower', 1, 'Parable of the Sower|The Sower and the Seed|The Sower and the Soils|Sower'], ['The Mustard Seed', 1, 'Mustard Seed'], ['The Lost Sheep', 1, 'Lost Sheep'], ['The Ten Virgins', 1, 'Ten Virgins|Wise and Foolish Virgins|Ten Bridesmaids'],
      ['The Talents', 1, 'Talents|The Parable of the Talents|The Ten Minas|The Minas'], ['The Rich Fool', 2, 'Rich Fool'], ['The Lost Coin', 2, 'Lost Coin|The Lost Drachma'], ['The Wheat and the Weeds', 2, 'Wheat and Tares|Weeds|The Weeds|The Tares|Wheat and Weeds'], ['The Leaven', 2, 'Yeast|Leaven|The Yeast'], ['The Hidden Treasure', 2, 'Hidden Treasure|Treasure in the Field'], ['The Pearl of Great Price', 2, 'Pearl of Great Price|The Pearl|Pearl'],
      ['The Dragnet', 3, 'Net|The Net|Fishing Net'], ['The Unforgiving Servant', 2, 'Unforgiving Servant|The Unmerciful Servant|Unmerciful Servant'], ['The Workers in the Vineyard', 2, 'Laborers in the Vineyard|Labourers in the Vineyard|Workers in the Vineyard|The Vineyard Workers'], ['The Wicked Tenants', 2, 'Wicked Tenants|The Tenants|The Vineyard Tenants|Wicked Husbandmen'], ['The Two Sons', 3, 'Two Sons'],
      ['The Wedding Feast', 2, 'Wedding Banquet|The Great Banquet|Great Banquet|Wedding Garment|The Marriage Feast'], ['The Sheep and the Goats', 1, 'Sheep and Goats|Final Judgment|Last Judgment'], ['The Pharisee and the Tax Collector', 1, 'Pharisee and Publican|The Pharisee and the Publican|Pharisee and the Tax Collector'], ['The Persistent Widow', 2, 'Unjust Judge|The Unjust Judge|The Widow and the Judge|Persistent Widow'],
      ['The Friend at Midnight', 3, 'Persistent Friend|Importunate Friend'], ['The Barren Fig Tree', 3, 'Fig Tree|The Fig Tree|Barren Fig Tree'], ['The Rich Man and Lazarus', 1, 'Lazarus and the Rich Man|Dives and Lazarus'], ['The Dishonest Steward', 3, 'Unjust Steward|Shrewd Manager|The Shrewd Steward|Dishonest Manager|Unrighteous Steward'], ['The Growing Seed', 4, 'Seed Growing Secretly|Seed Growing by Itself'],
      ['The Wise and Foolish Builders', 2, 'Two Builders|House on the Rock|Wise Man Built His House on the Rock|House on Rock and Sand'], ['The Faithful Servant', 4, 'Faithful and Wise Servant|The Faithful and Wise Steward'], ['The Watchful Servants', 4, 'Watchful Servants|Servants Waiting|The Doorkeeper'], ['The Lamp under a Bushel', 4, 'Lamp under a Basket|Lamp on a Stand|Lamp under a Bushel'], ['The Tower Builder', 4, 'Counting the Cost|Building a Tower'],
      ['The Two Debtors', 4, 'Two Debtors|The Moneylender and Two Debtors'], ['The Humble Guest', 4, 'Places at the Table|Wedding Guest|Seats at the Feast'], 
    ]),
  },
  {
    id: 'miracles', theme: 'scripture',
    prompt: 'Name a miracle of Jesus recorded in the Gospels.',
    context: 'The Gospels record healings, exorcisms, nature miracles and raisings from the dead. This list is long but not complete.',
    answers: rows([
      ['Water into wine', 1, 'Wedding at Cana|Cana|Changing Water into Wine|Turning Water into Wine|First Miracle'], ['Feeding the five thousand', 1, 'Loaves and fishes|Multiplication of the loaves|Five loaves and two fish|Feeding of the 5000|Feeding the 5000|Five Thousand'], ['Walking on water', 1, 'Jesus Walks on Water|Walking on the Sea'], ['Calming the storm', 1, 'Stilling the storm|Calming the sea|Stilling of the Storm|Calming of the Storm'],
      ['Raising of Lazarus', 1, 'Lazarus|Raising Lazarus|Lazarus Raised'], ['Healing the blind man', 1, 'Healing of the Blind|Blind Man|Healing the Blind|Man Born Blind|Healing the Man Born Blind'], ['Healing the paralytic', 1, 'Paralytic|Healing of the Paralytic|Paralytic Lowered through the Roof|Man Let Down through the Roof'], ['Healing the leper', 2, 'Cleansing the Leper|Leper|Cleansing of the Leper'],
      ['Raising of Jairus\'s daughter', 2, 'Jairus\' Daughter|Jairus Daughter|Daughter of Jairus|Raising Jairus\' Daughter'], ['Raising the widow\'s son at Nain', 2, 'Widow of Nain|Widow\'s Son at Nain|Raising of the Son of the Widow of Nain|Nain'], ['Woman with the flow of blood', 2, 'Healing the Woman with a Hemorrhage|Hemorrhaging Woman|Woman with Hemorrhage|Woman with an Issue of Blood|Woman Touches His Cloak'],
      ['Gerasene demoniac', 2, 'Gadarene Demoniac|Legion|Healing the Demoniac|Demons into Swine|Gadarene Swine|Casting Out Legion'], ['Feeding the four thousand', 2, 'Feeding the 4000|Four Thousand|Seven Loaves'], ['Miraculous catch of fish', 2, 'Great Catch of Fish|Draught of Fishes|Catch of Fish|Great Catch|Miraculous Draught of Fish|153 Fish'], ['Healing Peter\'s mother-in-law', 3, 'Peter\'s Mother-in-law|Healing of Peter\'s Mother-in-law'],
      ['Healing the centurion\'s servant', 2, 'Centurion\'s Servant|Centurion\'s Slave|Roman Centurion\'s Servant'], ['Healing Bartimaeus', 2, 'Blind Bartimaeus|Bartimaeus|Healing of Bartimaeus'], ['Healing the ten lepers', 2, 'Ten Lepers|Cleansing the Ten Lepers'], ['Healing the man with a withered hand', 3, 'Withered Hand|Man with the Withered Hand'], ['Healing the deaf mute', 3, 'Deaf Mute|Healing the Deaf and Mute Man|Ephphatha'],
      ['Cursing the fig tree', 3, 'Withered Fig Tree|Fig Tree Cursed|Cursing of the Fig Tree'], ['Healing the official\'s son', 3, 'Nobleman\'s Son|Royal Official\'s Son|Healing the Nobleman\'s Son'], ['Healing at the pool of Bethesda', 3, 'Pool of Bethesda|Bethesda|Healing the Paralytic at Bethesda|Healing at Bethesda'], ['The coin in the fish\'s mouth', 4, 'Temple Tax|Coin in the Fish|Coin in the Fish\'s Mouth|Stater in the Fish'], ['Healing Malchus\'s ear', 4, 'Malchus|Healing of Malchus|Healing the High Priest\'s Servant\'s Ear'],
      ['Healing the Canaanite woman\'s daughter', 3, 'Syrophoenician Woman|Canaanite Woman|Healing the Syrophoenician Woman\'s Daughter|Daughter of the Syrophoenician Woman'], ['Healing the epileptic boy', 3, 'Boy with a Demon|Healing the Boy with an Unclean Spirit|Demon-possessed Boy|Healing the Possessed Boy'], ['Healing the man at Capernaum with an unclean spirit', 4, 'Man with an Unclean Spirit|Unclean Spirit in the Synagogue|Demoniac in the Synagogue'],
      ['Healing the blind man of Bethsaida', 4, 'Blind Man of Bethsaida|Bethsaida Blind Man|Blind Man at Bethsaida'], ['Healing the woman bent double', 4, 'Crippled Woman|Bent Woman|Woman Bent Over|Healing the Crippled Woman'], ['The Resurrection', 1, 'Rising from the Dead|Christ\'s Resurrection'], ['Healing the dumb demoniac', 4, 'Mute Demoniac|Dumb Demoniac|Healing the Mute Man'], 
      ['Healing the man with dropsy', 5, 'Dropsy|Man with Dropsy'],
    ]),
  },
  {
    id: 'pius', theme: 'church-history',
    prompt: 'Name one of the twelve popes who took the name Pius (Pius I to Pius XII).',
    context: 'Twelve popes have been called Pius, from the second century to Pius XII, who died in 1958.',
    closed: 12,
    answers: rows([
      ['Pius I', 5], ['Pius II', 5], ['Pius IV', 4], ['Pius III', 5], ['Pius V', 3], ['Pius VI', 4], ['Pius VII', 4], ['Pius VIII', 5], ['Pius IX', 2], ['Pius X', 2], ['Pius XI', 3], ['Pius XII', 1],
    ]),
  },
  {
    id: 'popes-20c', theme: 'church-history',
    prompt: 'Name a pope who reigned during the twentieth century (1901 to 2000).',
    context: 'Nine popes reigned in the twentieth century.',
    closed: 9,
    answers: rows([
      ['Pius X', 2], ['Leo XIII', 3], ['Benedict XV', 3], ['Pius XI', 3], ['Pius XII', 1], ['John XXIII', 1], ['Paul VI', 1], ['John Paul I', 2], ['John Paul II', 1, 'Karol Wojtyla|John Paul the Great'],
    ]),
  },
  {
    id: 'encyclicals', theme: 'church-history',
    prompt: 'Name a papal encyclical or major apostolic exhortation.',
    context: 'Popes teach the whole Church through letters named by their opening Latin words. This list is long but not complete.',
    answers: rows([
      ['Rerum Novarum', 1, 'On the Condition of Labor|On Capital and Labor'], ['Laudato Si', 1, 'Laudato Si\'|On Care for Our Common Home'], ['Humanae Vitae', 1, 'On Human Life'], ['Evangelium Vitae', 2, 'The Gospel of Life'], ['Deus Caritas Est', 2, 'God Is Love'], ['Spe Salvi', 3, 'Saved in Hope'], ['Caritas in Veritate', 3, 'Charity in Truth'], ['Fratelli Tutti', 2, 'On Fraternity and Social Friendship'],
      ['Lumen Fidei', 3, 'The Light of Faith'], ['Evangelii Gaudium', 2, 'The Joy of the Gospel'], ['Amoris Laetitia', 2, 'The Joy of Love'], ['Pacem in Terris', 2, 'Peace on Earth'], ['Mater et Magistra', 3, 'Mother and Teacher'], ['Quadragesimo Anno', 3, 'On Reconstruction of the Social Order'], ['Veritatis Splendor', 3, 'The Splendor of Truth'], ['Fides et Ratio', 3, 'Faith and Reason'],
      ['Ut Unum Sint', 4, 'That They May Be One'], ['Redemptor Hominis', 4, 'Redeemer of Man'], ['Dives in Misericordia', 4, 'Rich in Mercy'], ['Laborem Exercens', 4, 'On Human Work'], ['Sollicitudo Rei Socialis', 4, 'On Social Concern'], ['Centesimus Annus', 4, 'The Hundredth Year'], ['Redemptoris Missio', 4, 'Mission of the Redeemer'], ['Ecclesia de Eucharistia', 4, 'The Church from the Eucharist'],
      ['Dominum et Vivificantem', 5, 'Lord and Giver of Life'], ['Redemptoris Mater', 5, 'Mother of the Redeemer'], ['Mystici Corporis Christi', 4, 'The Mystical Body of Christ|Mystici Corporis'], ['Divino Afflante Spiritu', 4, 'Inspired by the Divine Spirit'], ['Humani Generis', 4, 'Concerning Some False Opinions'], ['Mediator Dei', 4, 'Mediator of God'], ['Casti Connubii', 4, 'On Christian Marriage'],
      ['Mit Brennender Sorge', 4, 'With Burning Anxiety'], ['Pascendi Dominici Gregis', 4, 'Pascendi|Feeding the Lord\'s Flock'], ['Aeterni Patris', 4, 'Of the Eternal Father'], ['Providentissimus Deus', 4, 'The Most Provident God'], ['Quanta Cura', 5], ['Ubi Primum', 5], ['Dilexit Nos', 3, 'He Loved Us'],
      ['Redemptoris Custos', 5, 'Guardian of the Redeemer'], ['Evangelii Nuntiandi', 3, 'Evangelization in the Modern World'], ['Familiaris Consortio', 3, 'The Family in the Modern World'], ['Christifideles Laici', 4, 'The Lay Members of Christ\'s Faithful People'], ['Pastores Dabo Vobis', 4, 'I Will Give You Shepherds'], ['Reconciliatio et Paenitentia', 5], ['Catechesi Tradendae', 4, 'Catechesis in Our Time'],
      ['Gaudete et Exsultate', 3, 'Rejoice and Be Glad'], ['Christus Vivit', 3, 'Christ Is Alive'], ['Querida Amazonia', 4, 'Beloved Amazon'], ['Sacramentum Caritatis', 4, 'Sacrament of Charity'], ['Verbum Domini', 4, 'The Word of the Lord'], ['Africae Munus', 5], ['Ecclesia in Europa', 5], ['Novo Millennio Ineunte', 4, 'At the Beginning of the New Millennium'],
    ]),
  },
  {
    id: 'holy-days', theme: 'liturgy',
    prompt: 'Name one of the six holy days of obligation (besides Sundays) kept in the United States.',
    context: 'Catholics in the United States are bound to attend Mass on six days besides Sundays. Other countries keep different days, and some days are moved to a Sunday in some provinces.',
    closed: 6,
    answers: rows([
      ['Christmas', 1, 'Nativity of the Lord|The Nativity of Our Lord|Nativity|Christmas Day|25 December'], ['Mary, Mother of God', 2, 'Solemnity of Mary the Holy Mother of God|Mother of God|Solemnity of Mary|Holy Mother of God|New Year\'s Day|1 January|January 1|Mary Mother of God'], ['Assumption', 1, 'Assumption of Mary|Assumption of the Blessed Virgin Mary|Feast of the Assumption|15 August|August 15'],
      ['Ascension', 2, 'Ascension of the Lord|Ascension Thursday|The Ascension|Feast of the Ascension'], ['All Saints', 1, 'All Saints\' Day|Solemnity of All Saints|1 November|November 1|All Saints Day'], ['Immaculate Conception', 1, 'Solemnity of the Immaculate Conception|8 December|December 8|Feast of the Immaculate Conception'],
    ]),
  },
  {
    id: 'liturgical-seasons', theme: 'liturgy',
    prompt: 'Name one of the five seasons of the liturgical year.',
    context: 'The Church year moves through Advent, Christmas, Ordinary Time, Lent and Easter, with the Easter Triduum at the heart of it.',
    closed: 5,
    answers: rows([['Advent', 1], ['Christmas', 1, 'Christmastide|Christmas Time'], ['Ordinary Time', 1, 'Ordinary'], ['Lent', 1, 'Lenten Season'], ['Easter', 1, 'Eastertide|Easter Time|Easter Season|Paschal Time']]),
  },
  {
    id: 'vestments', theme: 'liturgy',
    prompt: 'Name a liturgical vestment or an item of clerical dress.',
    context: 'Priests, deacons and bishops wear particular garments at Mass and in daily life. This list is long but not complete.',
    answers: rows([
      ['Chasuble', 1], ['Alb', 2], ['Stole', 1], ['Cincture', 3, 'Girdle'], ['Amice', 3], ['Dalmatic', 3], ['Cope', 3], ['Cassock', 2, 'Soutane'], ['Surplice', 3], ['Mitre', 2, 'Miter'], ['Zucchetto', 4, 'Skullcap|Calotte'], ['Biretta', 4], ['Pallium', 3], ['Maniple', 4], ['Humeral veil', 4],
      ['Tunicle', 5], ['Rochet', 5], ['Mozzetta', 5], ['Roman collar', 2, 'Clerical collar|Collar|Dog collar'], ['Pectoral cross', 3], ['Fanon', 5], ['Subcincture', 5], ['Gremial', 5, 'Gremiale'], ['Cappa magna', 4], ['Ferraiolo', 5], ['Habit', 3, 'Religious habit'], ['Scapular', 3], ['Wimple', 4], ['Veil', 3], 
    ]),
  },
  {
    id: 'church-furnishings', theme: 'liturgy',
    prompt: 'Name a sacred vessel, an object used at Mass, or a part of a Catholic church building.',
    context: 'The Mass uses sacred vessels and linens, and the church building has parts with their own names. This list is long but not complete.',
    answers: rows([
      ['Chalice', 1], ['Paten', 2], ['Ciborium', 3], ['Tabernacle', 1], ['Monstrance', 2, 'Ostensorium'], ['Altar', 1], ['Ambo', 3, 'Lectern|Pulpit'], ['Sanctuary', 2], ['Nave', 2], ['Apse', 3], ['Transept', 3], ['Baptismal font', 1, 'Font'], ['Confessional', 1], ['Sanctuary lamp', 3, 'Red lamp'], ['Thurible', 3, 'Censer'], ['Aspergillum', 4], ['Cruet', 4, 'Cruets'], ['Corporal', 4], ['Purificator', 4], ['Pall', 4], ['Lavabo', 4, 'Lavabo bowl|Lavabo dish'],
      ['Missal', 2, 'Roman Missal'], ['Lectionary', 2], ['Sacristy', 3], ['Narthex', 4, 'Vestibule|Porch'], ['Crucifix', 1], ['Stations of the Cross', 1, 'Stations'], ['Holy water font', 2, 'Stoup|Holy Water Stoup|Holy water stoup'], ['Pew', 3], ['Altar rail', 3, 'Communion rail'], ['Reredos', 5], ['Credence table', 4, 'Credence'], ['Pyx', 4], ['Chrismatory', 5, 'Oil stock'],
      ['Paschal candle', 2, 'Easter candle'], ['Advent wreath', 2], ['Rood screen', 5], ['Chancel', 4], ['Baldachin', 4, 'Baldacchino|Ciborium canopy'], ['Cathedra', 4, 'Bishop\'s chair'], ['Tabernacle veil', 5], ['Ambry', 5, 'Aumbry'], ['Piscina', 5], ['Sedilia', 5],
    ]),
  },
  {
    id: 'sacred-music', theme: 'art-music',
    prompt: 'Name a Catholic hymn, chant or piece of sacred music.',
    context: 'The Church\'s musical treasury includes Gregorian chant, hymns of the Office and the Mass, and polyphony. This list is long but not complete.',
    answers: rows([
      ['Salve Regina', 1], ['Ave Maria', 1], ['Tantum Ergo', 2], ['Veni Creator Spiritus', 2, 'Veni Creator'], ['Veni Sancte Spiritus', 2], ['Dies Irae', 2], ['Te Deum', 2], ['Pange Lingua', 2], ['Adoro Te Devote', 3], ['O Salutaris Hostia', 3, 'O Salutaris'], ['Regina Caeli', 2, 'Regina Coeli'], ['Ave Maris Stella', 3], ['Stabat Mater', 2], ['Magnificat', 2], ['Gloria', 2], ['Agnus Dei', 2], ['Kyrie', 2, 'Kyrie Eleison'], ['Sanctus', 3, 'Holy Holy Holy'],
      ['Requiem', 2, 'Requiem Aeternam'], ['Credo', 3], ['Missa Papae Marcelli', 5, 'Pope Marcellus Mass'], ['Miserere', 3, 'Allegri Miserere'], ['Alma Redemptoris Mater', 4], ['Ave Regina Caelorum', 4, 'Ave Regina Coelorum'], ['Salve Mater Misericordiae', 5], ['Victimae Paschali Laudes', 4, 'Victimae Paschali'], ['Lauda Sion', 4], ['Veni Veni Emmanuel', 2, 'O Come O Come Emmanuel'], ['Adeste Fideles', 1, 'O Come All Ye Faithful'], ['Silent Night', 1, 'Stille Nacht'],
      ['Panis Angelicus', 2], ['Ubi Caritas', 3], ['Jesu Dulcis Memoria', 4], ['Vexilla Regis', 3], ['Crux Fidelis', 5], ['Pange Lingua Gloriosi', 3], ['Attende Domine', 4], ['Rorate Caeli', 4, 'Rorate Coeli'], ['Puer Natus Est', 5], ['Resurrexi', 5], ['Haec Dies', 4], ['Exsultet', 3, 'Easter Proclamation'], ['Salve Festa Dies', 5], ['Christus Vincit', 4], ['Tu Es Petrus', 4], ['Sicut Cervus', 5], ['O Magnum Mysterium', 4], ['Ave Verum Corpus', 2], ['Bring Flowers of the Rarest', 4], ['Holy God We Praise Thy Name', 3, 'Grosser Gott'], ['Be Thou My Vision', 3], ['Immaculate Mary', 3, 'Lourdes Hymn'], ['Hail Holy Queen Enthroned Above', 4],
    ]),
  },
  {
    id: 'sacred-art', theme: 'art-music',
    prompt: 'Name a famous work of Christian sacred art, or a church or shrine known for its art.',
    context: 'Cathedrals, basilicas, frescoes and altarpieces have carried the faith in images for centuries. This list is long but not complete.',
    answers: rows([
      ['Sistine Chapel', 1], ['Pieta', 1, 'Pietà|Michelangelo\'s Pieta'], ['The Last Supper', 1, 'Last Supper|Leonardo\'s Last Supper'], ['Saint Peter\'s Basilica', 1, 'Saint Peters|St. Peter\'s|St Peter\'s Basilica|Saint Peter\'s'], ['Notre-Dame de Paris', 1, 'Notre Dame|Notre-Dame|Notre Dame Cathedral|Notre Dame de Paris'], ['Sagrada Familia', 1, 'Sagrada Família|La Sagrada Familia'], ['Chartres Cathedral', 2, 'Chartres'], ['Hagia Sophia', 2], ['Creation of Adam', 1, 'The Creation of Adam'],
      ['Cologne Cathedral', 3, 'Koelner Dom|Kolner Dom'], ['Transfiguration', 3, 'Raphael\'s Transfiguration|The Transfiguration of Raphael'], ['Isenheim Altarpiece', 4], ['Ghent Altarpiece', 4, 'Adoration of the Mystic Lamb'], ['Return of the Prodigal Son', 2, 'The Return of the Prodigal Son|Rembrandt Prodigal Son'], ['Last Judgment', 2, 'Michelangelo\'s Last Judgment|The Last Judgment'], ['Madonna of the Meadow', 5], ['Sistine Madonna', 3],
      ['Ecstasy of Saint Teresa', 3, 'Ecstasy of St. Teresa|The Ecstasy of Saint Teresa|Ecstasy of Teresa'], ['Calling of Saint Matthew', 3, 'Calling of St. Matthew|The Calling of Saint Matthew'], ['Annunciation', 2], ['Pantocrator', 3, 'Christ Pantocrator'], ['Our Lady of Guadalupe image', 3, 'Tilma|Image of Guadalupe'], ['Santa Maria Maggiore', 3], ['Saint John Lateran', 3, 'Lateran Basilica|Lateran|St. John Lateran|Saint John Lateran Basilica'], ['Saint Paul Outside the Walls', 4, 'St. Paul Outside the Walls|San Paolo fuori le Mura'],
      ['Westminster Cathedral', 4], ['Saint Mark\'s Basilica', 3, 'St. Mark\'s|San Marco|St Mark\'s Basilica'], ['Mont Saint-Michel', 3, 'Mont Saint Michel|Mont-Saint-Michel'], ['Basilica of the Sacred Heart', 4, 'Sacre-Coeur|Sacré-Coeur'], ['Duomo of Florence', 3, 'Florence Cathedral|Santa Maria del Fiore|Duomo'], ['Cathedral of Santiago de Compostela', 3, 'Santiago de Compostela'], ['Basilica of Our Lady of Guadalupe', 3, 'Basilica de Guadalupe'], ['Shrine of the Immaculate Conception', 4, 'National Shrine'], ['Church of the Holy Sepulchre', 2, 'Holy Sepulchre'], ['Church of the Nativity', 2], ['Basilica of the Annunciation', 3],
      ['Book of Kells', 3], ['Lindisfarne Gospels', 4], ['Codex Sinaiticus', 4], ['Gutenberg Bible', 3], ['Pieta Rondanini', 5, 'Rondanini Pieta'], ['Moses', 3, 'Michelangelo\'s Moses'], ['David', 4, 'Michelangelo\'s David'], ['Wieskirche', 5, 'Die Wies'], ['Church of Saint Francis in Assisi', 3, 'Basilica of Saint Francis|Basilica of St. Francis of Assisi'],
    ]),
  },
  {
    id: 'catholic-writers', theme: 'church-history',
    prompt: 'Name a Catholic writer, theologian or spiritual author since the year 1200.',
    context: 'From the scholastics and mystics to modern novelists and apologists, Catholic authors have shaped thought and prayer. This list is long but not complete.',
    answers: rows([
      ['Thomas Aquinas', 1, 'Aquinas|Saint Thomas Aquinas'], ['Thomas a Kempis', 2, 'Thomas à Kempis|Thomas Kempis'], ['Dante Alighieri', 2, 'Dante'], ['Teresa of Avila', 2, 'Teresa of Jesus'], ['John of the Cross', 2], ['Ignatius of Loyola', 2, 'Ignatius Loyola'], ['Thomas More', 2, 'Saint Thomas More'], ['Francis de Sales', 3], ['Blaise Pascal', 3, 'Pascal'], ['John Henry Newman', 2, 'Newman|Cardinal Newman|Saint John Henry Newman'], ['G. K. Chesterton', 1, 'Chesterton|GK Chesterton|G.K. Chesterton'],
      ['Flannery O\'Connor', 2, 'Flannery OConnor|OConnor'], ['Graham Greene', 3], ['Evelyn Waugh', 3], ['J. R. R. Tolkien', 2, 'Tolkien|JRR Tolkien|J.R.R. Tolkien'], ['Hilaire Belloc', 3, 'Belloc'], ['Thomas Merton', 2, 'Merton'], ['Dorothy Day', 2], ['Edith Stein', 2, 'Teresa Benedicta of the Cross|Saint Edith Stein'], ['Henri de Lubac', 4, 'De Lubac'], ['Hans Urs von Balthasar', 4, 'Von Balthasar|Balthasar'],
      ['Karl Rahner', 3, 'Rahner'], ['Joseph Ratzinger', 2, 'Benedict XVI|Pope Benedict XVI|Ratzinger'], ['Karol Wojtyla', 2, 'John Paul II|Pope John Paul II'], ['Fulton Sheen', 2, 'Fulton J. Sheen|Archbishop Sheen|Venerable Fulton Sheen'], ['Peter Kreeft', 3], ['Scott Hahn', 3], ['Walker Percy', 4], ['Sigrid Undset', 4], ['Georges Bernanos', 4, 'Bernanos'], ['Francois Mauriac', 4, 'François Mauriac|Mauriac'], ['Leon Bloy', 5, 'Léon Bloy'], ['Charles Peguy', 5, 'Charles Péguy'],
      ['Alessandro Manzoni', 5, 'Manzoni'], ['Gerard Manley Hopkins', 3, 'Hopkins'], ['Francis Thompson', 4], ['Robert Hugh Benson', 4, 'Hugh Benson'], ['Romano Guardini', 4, 'Guardini'], ['Josef Pieper', 5], ['Etienne Gilson', 4, 'Étienne Gilson|Gilson'], ['Jacques Maritain', 4, 'Maritain'], ['Yves Congar', 5, 'Congar'], ['Bernard Lonergan', 5, 'Lonergan'], ['Frank Sheed', 4, 'F. J. Sheed|Sheed'], ['Ronald Knox', 4, 'Knox|Msgr. Ronald Knox'],
      ['Julian of Norwich', 3, 'Dame Julian'], ['Catherine of Siena', 3], ['Bonaventure', 3], ['Meister Eckhart', 4, 'Eckhart'], ['Therese of Lisieux', 2, 'Thérèse of Lisieux|Little Flower|Story of a Soul'], ['Louis de Montfort', 4, 'Louis-Marie de Montfort|Saint Louis de Montfort'], ['Alphonsus Liguori', 3], ['Brother Lawrence', 3, 'Nicholas Herman|Brother Lawrence of the Resurrection'], ['Jean-Pierre de Caussade', 5, 'Caussade|De Caussade'], ['Jacques Bossuet', 5, 'Bossuet'], ['Francisco Suarez', 5, 'Suarez|Suárez'],
      ['Robert Bellarmine', 4], ['Peter Canisius', 4], ['Francisco de Vitoria', 5, 'Vitoria'], ['Bartolome de las Casas', 5, 'Bartolomé de las Casas|Las Casas'], ['Erasmus', 4, 'Desiderius Erasmus'], ['Thomas Cajetan', 5, 'Cajetan'], ['Johann Adam Mohler', 5, 'Möhler|Mohler'], ['Matthias Scheeben', 5, 'Scheeben'], ['Anne Catherine Emmerich', 5, 'Anne Catherine Emmerick'], ['Josemaria Escriva', 3, 'Josemaría Escrivá|Escriva|Saint Josemaria|Escrivá'], ['Luigi Giussani', 5, 'Giussani'],
    ]),
  },
  {
    id: 'seven-churches', theme: 'scripture',
    prompt: 'Name one of the seven churches addressed in the Book of Revelation.',
    context: 'Revelation 2 and 3 give a letter to each of seven churches of Asia Minor.',
    closed: 7,
    answers: rows([['Ephesus', 1], ['Smyrna', 2], ['Pergamum', 3, 'Pergamos|Pergamon'], ['Thyatira', 3], ['Philadelphia', 2], ['Sardis', 3], ['Laodicea', 2, 'Laodicia']]),
  },
  {
    id: 'marian-apparitions', theme: 'devotion',
    prompt: 'Name a place where the Church has approved an apparition of the Virgin Mary.',
    context: 'Only a few apparitions have been approved as worthy of belief. Belief in them is never required of Catholics. This list is long but not complete.',
    answers: rows([
      ['Lourdes', 1], ['Fatima', 1, 'Fátima|Our Lady of Fatima'], ['Guadalupe', 1, 'Our Lady of Guadalupe|Tepeyac'], ['La Salette', 3, 'La Salette-Fallavaux'], ['Knock', 3, 'Knock Shrine|Our Lady of Knock'],
      ['Rue du Bac', 4, 'Paris|Miraculous Medal|Rue du Bac Paris'], ['Pontmain', 4], ['Banneux', 4, 'Banneux Notre-Dame'], ['Beauraing', 4], ['Kibeho', 4], ['Laus', 5, 'Notre-Dame du Laus'],
      ['Siluva', 5, 'Šiluva'], ['Champion', 5, 'Champion Wisconsin|Our Lady of Good Help'], ['Gietrzwald', 5, 'Gietrzwałd'],
    ]),
  },
  {
    id: 'bible-mountains', theme: 'places', ignore: ['mount', 'mountain', 'mt', 'hill', 'the', 'of'],
    prompt: 'Name a mountain or hill in the Bible.',
    context: 'Scripture often sets great moments on high places. This list is long but not complete.',
    answers: rows([
      ['Sinai', 1, 'Mount Sinai'], ['Zion', 1, 'Mount Zion|Sion'], ['Olives', 1, 'Mount of Olives|Olivet'], ['Calvary', 1, 'Golgotha|Mount Calvary'], ['Ararat', 2, 'Mount Ararat'], ['Carmel', 2, 'Mount Carmel'], ['Tabor', 2, 'Mount Tabor'],
      ['Moriah', 2, 'Mount Moriah'], ['Horeb', 3, 'Mount Horeb'], ['Nebo', 3, 'Mount Nebo'], ['Hermon', 3, 'Mount Hermon'], ['Gilboa', 3, 'Mount Gilboa'], ['Gerizim', 4, 'Mount Gerizim'], ['Ebal', 4, 'Mount Ebal'],
      ['Pisgah', 4, 'Mount Pisgah'], ['Hor', 5, 'Mount Hor'], ['Seir', 5, 'Mount Seir'],
    ]),
  },
  {
    id: 'bible-rivers', theme: 'places', ignore: ['river', 'the', 'of'],
    prompt: 'Name a river in the Bible.',
    context: 'Rivers mark the borders and the stories of Scripture, from Eden. This list is long but not complete.',
    answers: rows([
      ['Jordan', 1, 'Jordan River'], ['Nile', 1, 'Nile River'], ['Euphrates', 2], ['Tigris', 3, 'Hiddekel'], ['Kidron', 3, 'Cedron|Kidron Valley|Brook Kidron'], ['Kishon', 4, 'Kishon River'], ['Jabbok', 4], ['Arnon', 4],
      ['Chebar', 4, 'Kebar|Chebar Canal'], ['Pishon', 4, 'Pison'], ['Gihon', 4], ['Cherith', 4, 'Kerith|Brook Cherith'], ['Abana', 5, 'Amana'], ['Pharpar', 5], ['Ulai', 5], ['Ahava', 5], ['Zered', 5, 'Brook Zered'],
    ]),
  },
  {
    id: 'bible-plants', theme: 'scripture',
    prompt: 'Name a tree, plant or crop in the Bible.',
    context: 'Scripture is full of trees, used again and again as pictures of life and faith. This list is long but not complete.',
    answers: rows([
      ['Olive', 1, 'Olive tree|Olives'], ['Fig', 1, 'Fig tree|Figs'], ['Vine', 1, 'Grapevine|Grape|Grapes|Vineyard'], ['Wheat', 1, 'Grain|Corn'], ['Mustard', 1, 'Mustard seed|Mustard plant|Mustard tree'], ['Cedar', 2, 'Cedar of Lebanon|Cedars'],
      ['Palm', 2, 'Palm tree|Date palm|Palms'], ['Lily', 2, 'Lilies|Lily of the field'], ['Thorn', 2, 'Thorns|Thorn bush|Thornbush|Thistle'], ['Barley', 3], ['Sycamore', 3, 'Sycamore tree|Sycamore fig'], ['Almond', 3, 'Almond tree'],
      ['Pomegranate', 3, 'Pomegranates'], ['Oak', 3, 'Oak tree|Oaks'], ['Hyssop', 3], ['Myrrh', 3], ['Frankincense', 3], ['Reed', 3, 'Reeds|Papyrus'], ['Balm', 4, 'Balm of Gilead'], ['Cypress', 4], ['Fir', 4, 'Fir tree'],
      ['Mandrake', 4, 'Mandrakes'], ['Acacia', 4, 'Shittim|Shittim wood'], ['Rose of Sharon', 4], ['Gourd', 4], ['Mint', 4], ['Flax', 4], ['Cummin', 5, 'Cumin'], ['Dill', 5, 'Anise'], ['Rue', 5], ['Terebinth', 5],
    ]),
  },
  {
    id: 'bible-animals', theme: 'scripture',
    prompt: 'Name an animal mentioned in the Bible.',
    context: 'Animals fill Scripture. This list is long but not complete.',
    answers: rows([
      ['Lion', 1, 'Lions'], ['Lamb', 1, 'Lambs'], ['Sheep', 1], ['Serpent', 1, 'Snake|Snakes|Serpents'], ['Dove', 1, 'Doves|Pigeon|Pigeons'], ['Donkey', 1, 'Ass|Donkeys|Colt'], ['Fish', 1, 'Fishes'], ['Camel', 2, 'Camels'], ['Raven', 2, 'Ravens'],
      ['Ox', 2, 'Oxen|Bull|Bulls'], ['Goat', 2, 'Goats|Scapegoat'], ['Eagle', 2, 'Eagles'], ['Whale', 2, 'Great fish'], ['Horse', 2, 'Horses'], ['Dog', 2, 'Dogs'], ['Wolf', 2, 'Wolves'], ['Swine', 2, 'Pig|Pigs'], ['Calf', 2, 'Golden calf'],
      ['Leopard', 3], ['Bear', 3, 'Bears'], ['Fox', 3, 'Foxes'], ['Sparrow', 3, 'Sparrows'], ['Locust', 3, 'Locusts'], ['Quail', 3], ['Ram', 3, 'Rams'], ['Frog', 3, 'Frogs'], ['Fly', 3, 'Flies'], ['Leviathan', 4], ['Hawk', 4], ['Owl', 4],
      ['Scorpion', 4, 'Scorpions'], ['Viper', 4, 'Adder|Vipers'], ['Gnat', 4, 'Gnats|Lice'], ['Behemoth', 5], ['Jackal', 5, 'Jackals'], ['Ostrich', 5], ['Peacock', 5, 'Peacocks'], ['Stork', 5], ['Asp', 5],
    ]),
  },
  {
    id: 'bible-instruments', theme: 'art-music',
    prompt: 'Name a musical instrument mentioned in the Bible.',
    context: 'Psalms and histories alike call for music: strings, winds and percussion. This list is long but not complete.',
    answers: rows([
      ['Harp', 1, 'Harps'], ['Trumpet', 1, 'Trumpets'], ['Lyre', 2, 'Lyres'], ['Cymbals', 2, 'Cymbal'], ['Flute', 2, 'Pipe|Pipes|Flutes'], ['Tambourine', 2, 'Timbrel|Tabret|Tambourines'], ['Horn', 2, 'Shofar|Ram\'s horn|Rams horn'],
      ['Bell', 3, 'Bells'], ['Psaltery', 4, 'Psalteries'], ['Lute', 4], ['Organ', 4], ['Sackbut', 5], ['Dulcimer', 5], ['Zither', 5], ['Castanets', 5, 'Sistrum'], ['Viol', 5],
    ]),
  },
];
