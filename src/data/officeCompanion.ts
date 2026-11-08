/**
 * The Daily Office Companion: plain-language notes for each part of Morning Prayer (Lauds)
 * and Evening Prayer (Vespers). The prayers themselves come from public/data/office/office.json
 * (the traditional, public-domain psalter). The explanations are ours; where a note quotes a
 * source, the quote is checked word for word against the bundled text by tests/officeCompanion.test.ts.
 */

export type PartId = 'opening' | 'hymn' | 'psalmody' | 'reading' | 'responsory' | 'canticle' | 'intercessions' | 'ourfather' | 'collect' | 'blessing';
export type HourId = 'lauds' | 'vespers';

/** A quotation and where it is found. Exactly one of ccc / ref / work+section is set. */
export interface Quote {
  /** Shown as the source line */
  label: string;
  text: string;
  ccc?: number;
  /** Scripture OSIS range inside one chapter, e.g. PSA.119.164 */
  ref?: string;
  work?: string;
  section?: string;
}

export interface PartNote {
  id: PartId;
  title: string;
  /** What this part is, in a sentence or two */
  what: string;
  /** Why the Church prays it here */
  why: string;
  quote?: Quote;
}

export const PARTS: PartNote[] = [
  {
    id: 'opening', title: 'Opening versicle',
    what: 'You begin with a short call and answer, and the Gloria. At Lauds the traditional office also uses the Invitatory psalm before the hours; this companion starts with the versicle.',
    why: 'We cannot pray on our own strength. So the hour begins by asking God to open our mouths and to come and help us. The Gloria turns the first words to the Trinity.',
    quote: { label: 'Psalm 51:15 (WEB Catholic)', text: 'Lord, open my lips', ref: 'PSA.51.15' },
  },
  {
    id: 'hymn', title: 'Hymn',
    what: 'A short poem in verse, sung or read, that sets the tone of the hour, the season or the feast.',
    why: 'The hymn brings the hour of the day into the prayer. It speaks of dawn at Lauds and of evening at Vespers, and it carries the season of the Church year.',
    quote: { label: 'Catechism 1177', text: 'expressing the symbolism of the time of day, the liturgical season, or the feast being celebrated', ccc: 1177 },
  },
  {
    id: 'psalmody', title: 'Psalmody with antiphons',
    what: 'The psalms of the day. Each psalm is framed by an antiphon, a short line that points to the way the psalm is being prayed. Each psalm ends with the Gloria.',
    why: 'The psalms are the prayer book Jesus himself prayed. The Church gives them to us so we pray with his words and not only our own. The Gloria at the end gives each psalm a Christian ending. The antiphon helps us hear it that way.',
    quote: { label: 'Catechism 2587', text: 'The Psalter is the book in which the Word of God becomes man\'s prayer', ccc: 2587 },
  },
  {
    id: 'reading', title: 'Short reading',
    what: 'One or two verses of Scripture, read slowly, often with a pause for silence afterward.',
    why: 'After praising God with the psalms, we stop and let God speak. The brief reading gives the hour a word to carry out into the day.',
    quote: { label: 'Catechism 1177', text: 'reveal more deeply the meaning of the mystery being celebrated, assist in understanding the psalms, and prepare for silent prayer', ccc: 1177 },
  },
  {
    id: 'responsory', title: 'Responsory',
    what: 'A short call and response. One side says a line, the other repeats it, and the verse is turned over in a short echo.',
    why: 'The repeating helps the reading sink in, as when you say a line to yourself again. It asks the heart to keep up with the voice.',
    quote: { label: 'Catechism 1176', text: 'harmonizing the voice with the praying heart', ccc: 1176 },
  },
  {
    id: 'canticle', title: 'Gospel canticle',
    what: 'The high point of the hour. At Lauds it is the Benedictus, the song of Zechariah. At Vespers it is the Magnificat, the song of Mary. Both come from the first chapter of Luke.',
    why: 'Zechariah praises God at the dawn of salvation, and Lauds is the morning hour. Mary praises God for what he has done for the lowly, and the Church sings it at day\'s end as thanks. Both songs are the Gospel itself turned into prayer. The antiphon is said before and after.',
  },
  {
    id: 'intercessions', title: 'Intercessions',
    what: 'Short petitions for the Church, the world and the people we know. Praying them is one of the main ways the laity share in the hour.',
    why: 'In the hours Christ prays through his Body, and a Body prays for its members. Morning prayers offer the day to God. Evening prayers give thanks and ask mercy for what went wrong. The petitions here are our own plain words, not those of any breviary. You can add the names you carry.',
    quote: { label: 'Catechism 1175', text: 'continues his priestly work through his Church', ccc: 1175 },
  },
  {
    id: 'ourfather', title: 'Our Father',
    what: 'The prayer the Lord taught, said aloud together, or alone if you pray alone.',
    why: 'Every hour of the day ends or is gathered up in the prayer Jesus gave. It is the shortest summary of everything we have asked.',
    quote: { label: 'Catechism 2701', text: 'Jesus teaches a vocal prayer, the Our Father', ccc: 2701 },
  },
  {
    id: 'collect', title: 'Concluding prayer',
    what: 'One short prayer that gathers up the hour. The traditional name is the collect, because it "collects" the prayers of all.',
    why: 'Many people prayed many things during the hour. One prayer by one voice gathers it all and offers it to the Father through Christ. The words are few; what counts is the heart behind them.',
    quote: { label: 'Catechism 2700', text: 'Whether or not our prayer is heard depends not on the number of words, but on the fervor of our souls', ccc: 2700 },
  },
  {
    id: 'blessing', title: 'Blessing and dismissal',
    what: 'A short blessing, with an answer, to close the hour.',
    why: 'The hour ends where Mass ends: with thanks and a sending. The hours are meant to reach back to the Eucharist and forward to the rest of the day.',
    quote: { label: 'Catechism 1178', text: 'like an extension of the Eucharistic celebration', ccc: 1178 },
  },
];

export const HOUR_NOTES: Record<HourId, { name: string; english: string; when: string; why: string; canticleName: string }> = {
  lauds: {
    name: 'Lauds', english: 'Morning Prayer', when: 'At dawn or in the morning',
    canticleName: 'Canticle of Zechariah (Benedictus)',
    why: 'Lauds means "praises." It is prayed at the start of the day. The Church links the rising light to the Resurrection and gives the day to God before it begins.',
  },
  vespers: {
    name: 'Vespers', english: 'Evening Prayer', when: 'At sunset or in the evening',
    canticleName: 'Canticle of Mary (Magnificat)',
    why: 'Vespers is prayed as the day ends. It gives thanks for the day, asks pardon for what went wrong, and looks to the light that does not go out.',
  },
};

/** Short, original petitions (our own words, not from any breviary) */
export const INTERCESSIONS: Record<HourId, string[]> = {
  lauds: [
    'Lord, we give you this new day. Let what we do and say be for your glory.',
    'Bless the Church, our pope and our bishop, and all who serve in your name.',
    'Watch over those who work today, and those who cannot work.',
    'Be near the sick, the lonely and the dying.',
    'Keep our families and friends in your peace.',
  ],
  vespers: [
    'Lord, we thank you for this day and for what you have given us in it.',
    'Forgive what we have done wrong, and what we have failed to do.',
    'Bring home those who travel, and give rest to those who labor.',
    'Remember the poor, the prisoners and the persecuted.',
    'Receive into your light those who have died, especially the ones we love.',
  ],
};

/** The three or four quotations in "Why we pray the hours" */
export const WHY_QUOTES: Quote[] = [
  { label: 'Catechism 1174', text: 'so devised that the whole course of the day and night is made holy by the praise of God', ccc: 1174 },
  { label: 'Psalm 119:164 (WEB Catholic)', text: 'Seven times a day, I praise you', ref: 'PSA.119.164' },
  { label: 'Cyprian of Carthage, On the Lord\'s Prayer 34', text: 'observed the third, sixth, and ninth hour, as it were, for a sacrament of the Trinity', work: 'cyprian', section: 'iv.v.iv' },
  { label: 'John Cassian, Institutes 3', text: 'meditation on the Psalms and the rest of the Scriptures is never entirely omitted', work: 'cassian-works', section: 'iv.iii.iii' },
];

export const WHY_INTRO = [
  'Jesus prayed the Psalms. The first Christians, who were Jews, kept the Jewish hours of prayer, and the Church has gone on praying at set times ever since. The aim is to make the whole day an offering to God.',
  'The hours of the day echo the day of the Lord. Lauds greets the dawn and the Resurrection. Vespers closes the day with thanks. In between, the Church prays at mid-morning, noon and mid-afternoon, and again at night.',
  'You do not have to be a priest or a monk. The Church invites everyone to join, even alone, because this is the prayer of the whole Body of Christ.',
];

export const HONESTY =
  'A simple pattern, not the official four-week psalter. The psalms, readings, hymns and prayers here come from the traditional (pre-1970) Roman psalter, which is in the public domain and runs on a one-week cycle. The modern Liturgy of the Hours has a four-week psalter and English texts under copyright, so they are not in this app. Use your parish\'s book for the official hours.';

export const LAST_KEY = 'sb:office-companion';
export interface LastPrayed { hour: HourId; date: string }
