/** Pilgrim guides that work with no signal: what the place means, where to pray, a Scripture reading and a prayer for the way. Facts are the well-established ones; opening hours and Mass times change, so check the shrine’s own site. */
export interface Site {
  id: string; name: string; place: string; lang: string; tag: string;
  story: string;
  stops: { name: string; note: string }[];
  scripture: { ref: string; why: string }[];
  prayer: { title: string; text: string };
  phrases: [string, string][];
  saints: string[];
  site: string;
}

export const PILGRIM_SITES: Site[] = [
  {
    id: 'rome', name: 'Rome', place: 'Italy', lang: 'Italian', tag: 'The city of Peter and Paul',
    story: 'Rome is where Peter and Paul were martyred, and the Church has gathered around their tombs since the first centuries. Pilgrims come to stand with the apostles, to cross a Holy Door in a Jubilee year, and to see the Pope.',
    stops: [
      { name: 'St. Peter’s Basilica', note: 'Built over the tomb of St. Peter. The Vatican grottoes and the excavations (scavi, booked ahead) go down to the burial place.' },
      { name: 'St. John Lateran', note: 'The cathedral of the Bishop of Rome and the “mother of all churches.”' },
      { name: 'St. Paul Outside the Walls', note: 'Built over the tomb of St. Paul.' },
      { name: 'St. Mary Major', note: 'The oldest church in the West dedicated to Our Lady; it holds the Salus Populi Romani icon.' },
      { name: 'Catacombs of St. Callixtus', note: 'Early Christian burial galleries along the Appian Way.' },
      { name: 'Scala Santa and Santa Croce', note: 'Stairs traditionally linked to Christ’s Passion, and relics of the Cross.' },
    ],
    scripture: [{ ref: 'Matthew 16:13-19', why: 'You are Peter, and on this rock I will build my Church.' }, { ref: 'Acts 28:11-16', why: 'Paul arrives in Rome.' }],
    prayer: { title: 'Prayer on the way to Rome', text: 'Lord Jesus, you built your Church on the faith of Peter. As I walk where your apostles gave their lives, strengthen my faith, deepen my love for your Church, and send me home a better witness. St. Peter and St. Paul, pray for me.' },
    phrases: [['Where is the church?', 'Dov’è la chiesa?'], ['What time is Mass?', 'A che ora è la Messa?'], ['Thank you', 'Grazie'], ['Please', 'Per favore'], ['Excuse me', 'Scusi'], ['Where is confession?', 'Dov’è la confessione?']],
    saints: ['St. Peter', 'St. Paul', 'St. Ignatius of Antioch', 'St. Agnes', 'St. Philip Neri'], site: 'https://www.vatican.va',
  },
  {
    id: 'holyland', name: 'The Holy Land', place: 'Israel and Palestine', lang: 'Hebrew and Arabic', tag: 'Walk where Jesus walked',
    story: 'Here the Gospels take place. Pilgrims have walked to Bethlehem, Nazareth, Galilee and Jerusalem since the earliest centuries. The Franciscans have cared for many of the shrines since the 1300s.',
    stops: [
      { name: 'Church of the Nativity, Bethlehem', note: 'Built over the place traditionally honored as Christ’s birth.' },
      { name: 'Basilica of the Annunciation, Nazareth', note: 'Where the Angel Gabriel greeted Mary.' },
      { name: 'Sea of Galilee and Capernaum', note: 'The center of Jesus’ ministry; the home of Peter.' },
      { name: 'Mount of Olives and Gethsemane', note: 'The garden of the agony; the Church of All Nations.' },
      { name: 'Via Dolorosa', note: 'The traditional way of the Cross through Jerusalem.' },
      { name: 'Church of the Holy Sepulchre', note: 'Built over Calvary and the empty tomb.' },
    ],
    scripture: [{ ref: 'Luke 2:1-20', why: 'The birth in Bethlehem.' }, { ref: 'John 20:1-18', why: 'The empty tomb.' }, { ref: 'Psalm 122', why: 'I rejoiced when they said, “Let us go to the house of the Lord.”' }],
    prayer: { title: 'Prayer in the Holy Land', text: 'Lord, you walked these roads, taught these hills and gave your life in this city. Let me see with the eyes of faith, listen with an open heart, and pray for peace for every person who lives here. Mary, Mother of Jesus, pray for us.' },
    phrases: [['Peace', 'Shalom (Hebrew) / Salaam (Arabic)'], ['Thank you', 'Toda / Shukran'], ['Please', 'Bevakasha / Min fadlak'], ['Hello', 'Shalom / Marhaba']],
    saints: ['St. Helena', 'St. Jerome', 'St. Francis of Assisi'], site: 'https://www.custodia.org',
  },
  {
    id: 'lourdes', name: 'Lourdes', place: 'France', lang: 'French', tag: 'Healing and hope',
    story: 'In 1858 Our Lady appeared to a fourteen-year-old girl, Bernadette Soubirous, eighteen times at the grotto of Massabielle. She asked for prayer, penance and a chapel. Millions of sick and healthy pilgrims come each year.',
    stops: [
      { name: 'The Grotto', note: 'The place of the apparitions; pilgrims touch the rock and light candles.' },
      { name: 'The baths', note: 'Pilgrims may bathe in the spring water, with helpers, as a sign of repentance and trust.' },
      { name: 'Basilica of the Immaculate Conception', note: 'Built above the grotto, with the Rosary Basilica below.' },
      { name: 'Torchlight procession', note: 'Each evening, a Marian procession with the rosary and candles.' },
      { name: 'Stations of the Cross', note: 'A path up the hill with life-sized stations.' },
    ],
    scripture: [{ ref: 'Luke 1:46-55', why: 'Mary’s Magnificat.' }, { ref: 'John 2:1-11', why: 'Do whatever he tells you.' }],
    prayer: { title: 'Prayer at Lourdes', text: 'Our Lady of Lourdes, you showed Bernadette the way of prayer and humble trust. Obtain for me the healing I need most, whether of body or of soul, and for all the sick I carry here. Immaculate Mary, pray for us.' },
    phrases: [['Thank you', 'Merci'], ['Please', 'S’il vous plaît'], ['Where is the grotto?', 'Où est la grotte ?'], ['I need help', 'J’ai besoin d’aide']],
    saints: ['St. Bernadette Soubirous'], site: 'https://www.lourdes-france.org',
  },
  {
    id: 'fatima', name: 'Fátima', place: 'Portugal', lang: 'Portuguese', tag: 'Prayer, penance, peace',
    story: 'In 1917 Our Lady appeared to three shepherd children, Lúcia, Francisco and Jacinta, calling for prayer of the rosary, penance and conversion. The Church has approved the devotion; the two younger children were canonized in 2017.',
    stops: [
      { name: 'Chapel of the Apparitions', note: 'On the spot where Our Lady appeared at the Cova da Iria.' },
      { name: 'Basilica of Our Lady of the Rosary', note: 'Holds the tombs of Francisco, Jacinta and Lúcia.' },
      { name: 'Valinhos and the Way of the Cross', note: 'The path the children walked, with stations.' },
      { name: 'Candlelight rosary', note: 'In the season of pilgrimage, a procession each evening on the 12th and 13th.' },
    ],
    scripture: [{ ref: 'Luke 11:27-28', why: 'Blessed are those who hear the word of God and keep it.' }, { ref: 'Revelation 12:1', why: 'A woman clothed with the sun.' }],
    prayer: { title: 'Fátima prayer', text: 'O my Jesus, forgive us our sins, save us from the fires of hell, lead all souls to heaven, especially those most in need of your mercy.' },
    phrases: [['Thank you', 'Obrigado / Obrigada'], ['Please', 'Por favor'], ['Where is Mass?', 'Onde é a Missa?']],
    saints: ['St. Francisco Marto', 'St. Jacinta Marto'], site: 'https://www.fatima.pt',
  },
  {
    id: 'santiago', name: 'Santiago de Compostela', place: 'Spain', lang: 'Spanish', tag: 'The Way of St. James',
    story: 'For over a thousand years pilgrims have walked the Camino to the tomb of St. James the Apostle. The way itself is the prayer: early mornings, shared meals, sore feet, and strangers who become friends. Pilgrims who walk at least the last 100 km can receive the Compostela.',
    stops: [
      { name: 'Cathedral of Santiago', note: 'Holds the tomb of St. James; pilgrims embrace the statue of the saint.' },
      { name: 'Pilgrim Mass', note: 'Celebrated daily at the cathedral, with the pilgrims’ blessing.' },
      { name: 'Pilgrim’s Office', note: 'Where the Compostela is issued on presenting the stamped pilgrim passport.' },
      { name: 'The scallop shell', note: 'The sign of the pilgrim; every way leads to the same place.' },
    ],
    scripture: [{ ref: 'Mark 10:35-45', why: 'James and John ask for places; Jesus teaches service.' }, { ref: 'Acts 12:1-2', why: 'James is the first apostle to be martyred.' }],
    prayer: { title: 'A pilgrim’s morning prayer', text: 'Lord, you are the way. Bless my feet today, keep me safe and patient, and give me eyes for the people you put on my path. St. James, pray for me. Buen Camino.' },
    phrases: [['Good way!', '¡Buen Camino!'], ['Thank you', 'Gracias'], ['A bed, please', 'Una cama, por favor'], ['Water', 'Agua']],
    saints: ['St. James the Greater'], site: 'https://catedraldesantiago.es',
  },
  {
    id: 'assisi', name: 'Assisi', place: 'Italy', lang: 'Italian', tag: 'Poverty, joy and peace',
    story: 'St. Francis was born here in 1181 and gave up everything to follow Christ. St. Clare followed him. The hill town is a place of quiet, simple prayer and of the great frescoes of Giotto.',
    stops: [
      { name: 'Basilica of St. Francis', note: 'The tomb of St. Francis, with the frescoes of his life.' },
      { name: 'San Damiano', note: 'Where the crucifix spoke to Francis: “Rebuild my Church.”' },
      { name: 'Porziuncola', note: 'The little chapel in St. Mary of the Angels where the Franciscan movement began.' },
      { name: 'Basilica of St. Clare', note: 'The tomb of St. Clare and the San Damiano crucifix.' },
      { name: 'Eremo delle Carceri', note: 'The hermitage in the hills where Francis went to pray.' },
    ],
    scripture: [{ ref: 'Matthew 19:21', why: 'Go, sell what you have and follow me.' }, { ref: 'Galatians 6:14', why: 'Far be it from me to glory except in the Cross.' }],
    prayer: { title: 'Peace prayer attributed to St. Francis', text: 'Lord, make me an instrument of your peace. Where there is hatred, let me sow love; where there is injury, pardon; where there is doubt, faith; where there is despair, hope; where there is darkness, light; and where there is sadness, joy.' },
    phrases: [['Peace and good', 'Pace e bene'], ['Thank you', 'Grazie'], ['Where is the chapel?', 'Dov’è la cappella?']],
    saints: ['St. Francis of Assisi', 'St. Clare of Assisi', 'Bl. Carlo Acutis'], site: 'https://www.sanfrancescoassisi.org',
  },
  {
    id: 'guadalupe', name: 'Guadalupe', place: 'Mexico', lang: 'Spanish', tag: 'Mother of the Americas',
    story: 'In December 1531 Our Lady appeared to St. Juan Diego on the hill of Tepeyac and left her image on his tilma. It is one of the most visited Marian shrines in the world.',
    stops: [
      { name: 'Basilica of Our Lady of Guadalupe', note: 'The modern basilica, where the tilma is displayed above the altar.' },
      { name: 'The old basilica and Tepeyac chapel', note: 'The hill where Our Lady appeared.' },
      { name: 'Capilla del Pocito', note: 'The chapel built over a spring.' },
    ],
    scripture: [{ ref: 'Luke 1:39-45', why: 'Mary visits Elizabeth.' }, { ref: 'Revelation 12:1', why: 'A woman clothed with the sun.' }],
    prayer: { title: 'Prayer to Our Lady of Guadalupe', text: 'Holy Mary of Guadalupe, Mother of the true God, you promised to show your love and compassion to all who ask. Hear my prayer, take my cares to your Son, and make me a faithful child of the Church.' },
    phrases: [['Thank you', 'Gracias'], ['Please', 'Por favor'], ['What time is Mass?', '¿A qué hora es la Misa?']],
    saints: ['St. Juan Diego'], site: 'https://virgendeguadalupe.org.mx',
  },
  {
    id: 'knock', name: 'Knock and Walsingham', place: 'Ireland and England', lang: 'English', tag: 'Our Lady in the British Isles',
    story: 'At Knock in County Mayo in 1879 a silent apparition of Our Lady, St. Joseph, St. John and the Lamb on an altar was seen by villagers. At Walsingham in 1061 Our Lady asked for a replica of the Holy House of Nazareth; the shrine was destroyed in the Reformation and revived in the 20th century.',
    stops: [
      { name: 'Knock Shrine', note: 'The gable wall where the apparition was seen, and the basilica.' },
      { name: 'National Shrine of Our Lady, Walsingham', note: 'The Holy House replica and the Slipper Chapel, where pilgrims begin the last mile barefoot.' },
    ],
    scripture: [{ ref: 'John 19:25-27', why: 'Behold your mother.' }],
    prayer: { title: 'Hail Mary', text: 'Hail Mary, full of grace, the Lord is with thee; blessed art thou amongst women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.' },
    phrases: [['Thank you', 'Thank you / Go raibh maith agat (Irish)'], ['Where is the shrine?', 'Where is the shrine?']],
    saints: ['Our Lady of Knock', 'Our Lady of Walsingham'], site: 'https://www.knockshrine.ie',
  },
];

export const CHECKLIST: [string, string][] = [
  ['docs', 'Passport, tickets, insurance, and a copy of each, on paper and in your phone'],
  ['bible', 'Save your Bible, the study data and a few audio episodes (Downloads and offline)'],
  ['study', 'Check the Downloads page shows everything you need as “on this device”'],
  ['mass', 'Check the shrine’s own site for Mass and confession times'],
  ['shoes', 'Broken-in walking shoes; a small bag; water'],
  ['rosary', 'A rosary and a small notebook (or the app’s journal)'],
  ['modest', 'Modest clothing: many churches require covered shoulders and knees'],
  ['intent', 'Write down the intentions you are carrying for others'],
  ['power', 'A charger or power bank, and the app set to keep working offline'],
];
