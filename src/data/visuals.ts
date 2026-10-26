/** Hand-written diagrams of the faith, each with a plain statement and Catechism paragraphs. Content only; the page draws them. */
export interface Node { id: string; label: string; short?: string; detail: string; ccc?: string; when?: string }
export interface Visual {
  id: string; title: string; kind: 'wheel' | 'flow' | 'timeline' | 'columns' | 'trinity' | 'cross';
  blurb: string; nodes: Node[]; groups?: { title: string; ids: string[] }[]; center?: string; note?: string;
}

export const VISUALS: Visual[] = [
  {
    id: 'trinity', title: 'The Holy Trinity', kind: 'trinity', blurb: 'One God in three Persons: who is who, and who is not who.', center: 'GOD',
    nodes: [
      { id: 'father', label: 'Father', detail: 'The first Person: the source of all, who from eternity begets the Son. “Our Father” is how Jesus taught us to pray.', ccc: '238-242' },
      { id: 'son', label: 'Son', detail: 'The second Person: eternally begotten of the Father, who became man in Jesus Christ for our salvation.', ccc: '240-241, 461-463' },
      { id: 'spirit', label: 'Holy Spirit', detail: 'The third Person: who proceeds from the Father and the Son, the Lord and giver of life, who dwells in the Church and in our hearts.', ccc: '243-248' },
    ],
    note: 'The Father is not the Son, the Son is not the Spirit, the Spirit is not the Father, yet each is God, and there is one God, not three. The Church calls this the central mystery of the faith (CCC 234).',
  },
  {
    id: 'sacraments', title: 'The seven sacraments', kind: 'wheel', blurb: 'Seven signs Christ gave, grouped by what they do in a life.', center: 'Christ',
    nodes: [
      { id: 'baptism', label: 'Baptism', short: 'New birth', detail: 'Frees from sin, makes us children of God and members of the Church. The door to all the other sacraments.', ccc: '1213-1274' },
      { id: 'confirmation', label: 'Confirmation', short: 'Sealed', detail: 'Completes baptism with the gift of the Holy Spirit, strengthening us to witness to Christ.', ccc: '1285-1321' },
      { id: 'eucharist', label: 'Eucharist', short: 'Food', detail: 'The Body and Blood of Christ, the source and summit of the Christian life.', ccc: '1322-1419' },
      { id: 'penance', label: 'Penance', short: 'Healing', detail: 'Forgiveness of sins after baptism, through confession to a priest and absolution.', ccc: '1422-1498' },
      { id: 'anointing', label: 'Anointing of the Sick', short: 'Healing', detail: 'Grace of strength and comfort for those who are seriously ill or growing old.', ccc: '1499-1532' },
      { id: 'orders', label: 'Holy Orders', short: 'Service', detail: 'Christ’s priesthood given to bishops, priests and deacons to serve the Church.', ccc: '1536-1600' },
      { id: 'matrimony', label: 'Matrimony', short: 'Service', detail: 'A man and a woman make a lifelong covenant of love, open to children, as a sign of Christ and the Church.', ccc: '1601-1666' },
    ],
    groups: [{ title: 'Initiation', ids: ['baptism', 'confirmation', 'eucharist'] }, { title: 'Healing', ids: ['penance', 'anointing'] }, { title: 'Service of communion', ids: ['orders', 'matrimony'] }],
  },
  {
    id: 'pillars', title: 'The four parts of the Catechism', kind: 'columns', blurb: 'The whole faith in four pillars: believe, celebrate, live, pray.',
    nodes: [
      { id: 'creed', label: 'The Creed', short: 'What we believe', detail: 'The faith professed: God, creation, Christ, the Spirit, the Church, resurrection and life everlasting.', ccc: '26-1065' },
      { id: 'sacr', label: 'The sacraments', short: 'What we celebrate', detail: 'The faith celebrated: the liturgy and the seven sacraments.', ccc: '1066-1690' },
      { id: 'life', label: 'Life in Christ', short: 'How we live', detail: 'The faith lived: the dignity of the person, the virtues, the law and grace, the Ten Commandments.', ccc: '1691-2557' },
      { id: 'prayer', label: 'Christian prayer', short: 'How we pray', detail: 'The faith prayed: how to pray and the Our Father.', ccc: '2558-2865' },
    ],
  },
  {
    id: 'commandments', title: 'The Ten Commandments', kind: 'columns', blurb: 'Love of God first, then love of neighbor: two tablets.',
    nodes: [
      { id: 'c1', label: '1. No other gods', detail: 'Worship and serve God alone: trust him above every other good, and give nothing else the place that belongs to him. It forbids idolatry, superstition and putting money, power or pleasure first.', ccc: '2084-2141' },
      { id: 'c2', label: '2. God’s name', detail: 'Honor God’s name; do not use it lightly or falsely.', ccc: '2142-2167' },
      { id: 'c3', label: '3. The Lord’s Day', detail: 'Keep Sunday holy: take part in Mass, rest from unnecessary work, and make room for family, friends and mercy. The Lord’s Day recalls both creation and the Resurrection.', ccc: '2168-2195' },
      { id: 'c4', label: '4. Honor parents', detail: 'Honor father and mother; the duties of family and of citizens.', ccc: '2196-2257' },
      { id: 'c5', label: '5. Do not kill', detail: 'Respect for every human life from conception to natural death.', ccc: '2258-2330' },
      { id: 'c6', label: '6. Purity', detail: 'Chastity in every state of life; faithfulness in marriage.', ccc: '2331-2400' },
      { id: 'c7', label: '7. Do not steal', detail: 'Justice, honest work and care for the poor.', ccc: '2401-2463' },
      { id: 'c8', label: '8. Tell the truth', detail: 'Honesty; do not lie or harm another’s good name.', ccc: '2464-2513' },
      { id: 'c9', label: '9. Pure of heart', detail: 'Guard thoughts and desires; purity of heart.', ccc: '2514-2533' },
      { id: 'c10', label: '10. Do not covet', detail: 'Freedom from envy and greed; trust in God’s providence.', ccc: '2534-2557' },
    ],
    groups: [{ title: 'Love of God', ids: ['c1', 'c2', 'c3'] }, { title: 'Love of neighbor', ids: ['c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10'] }],
  },
  {
    id: 'virtues', title: 'The virtues and gifts', kind: 'columns', blurb: 'Seven virtues, seven gifts, twelve fruits: how grace grows a life.',
    nodes: [
      { id: 'faith', label: 'Faith', detail: 'Believing God and all he has revealed, because he is truth itself. Faith is a gift of grace and a free human act, and it is lived out in works of love.', ccc: '1814-1816' },
      { id: 'hope', label: 'Hope', detail: 'Trusting God’s promises and desiring heaven.', ccc: '1817-1821' },
      { id: 'charity', label: 'Charity', detail: 'Loving God above all and neighbor as self.', ccc: '1822-1829' },
      { id: 'prudence', label: 'Prudence', detail: 'Seeing what is truly good and choosing the right means.', ccc: '1806' },
      { id: 'justice', label: 'Justice', detail: 'The steady will to give God and neighbor what is due: to worship God, to pay fair wages, keep promises and respect the rights of every person.', ccc: '1807' },
      { id: 'fortitude', label: 'Fortitude', detail: 'Firmness in difficulty and constancy in the good.', ccc: '1808' },
      { id: 'temperance', label: 'Temperance', detail: 'Moderating the pull of pleasure and keeping desire in order: in food and drink, in sexuality, in the use of money and time, so that we are free to love.', ccc: '1809' },
    ],
    groups: [{ title: 'Theological: from God, toward God', ids: ['faith', 'hope', 'charity'] }, { title: 'Cardinal: the hinges of the moral life', ids: ['prudence', 'justice', 'fortitude', 'temperance'] }],
  },
  {
    id: 'mass', title: 'The Mass, step by step', kind: 'flow', blurb: 'Two tables: the Word, then the Eucharist.',
    nodes: [
      { id: 'intro', label: 'Introductory rites', detail: 'Entrance, greeting, penitential act, Gloria and the opening prayer prepare us to listen.', ccc: '1348' },
      { id: 'word', label: 'Liturgy of the Word', detail: 'Readings from the Old Testament, a psalm, an apostle, and the Gospel; homily; Creed; prayers of the faithful.', ccc: '1349' },
      { id: 'offer', label: 'Preparation of the gifts', detail: 'Bread and wine are brought forward with our gifts for the poor.', ccc: '1350' },
      { id: 'prayer', label: 'Eucharistic Prayer', detail: 'The priest gives thanks and, by Christ’s words and the Spirit’s power, bread and wine become his Body and Blood.', ccc: '1352-1354' },
      { id: 'comm', label: 'Communion', detail: 'The Our Father, the sign of peace, the Lamb of God, and receiving Christ.', ccc: '1355' },
      { id: 'send', label: 'Concluding rites', detail: 'Blessing and dismissal: go in peace to love and serve the Lord.', ccc: '1332' },
    ],
  },
  {
    id: 'year', title: 'The Church’s year', kind: 'wheel', blurb: 'Seasons that walk us through the life of Christ every year.', center: 'Christ',
    nodes: [
      { id: 'advent', label: 'Advent', short: 'Violet', detail: 'Four weeks of waiting for Christ’s coming in history, in glory, and in our hearts.', ccc: '524' },
      { id: 'christmas', label: 'Christmas', short: 'White', detail: 'The birth of the Lord through his baptism: God with us.', ccc: '525-526' },
      { id: 'ot1', label: 'Ordinary Time I', short: 'Green', detail: 'Weeks after Christmas: the Lord’s public ministry.', ccc: '1163-1167' },
      { id: 'lent', label: 'Lent', short: 'Violet', detail: 'Forty days of prayer, fasting and almsgiving to prepare for Easter.', ccc: '540, 1438' },
      { id: 'triduum', label: 'Easter Triduum', short: 'White', detail: 'Holy Thursday, Good Friday and the Easter Vigil: the heart of the year.', ccc: '1168-1169' },
      { id: 'easter', label: 'Easter', short: 'White', detail: 'Fifty days of joy, to Ascension and Pentecost.', ccc: '1169' },
      { id: 'ot2', label: 'Ordinary Time II', short: 'Green', detail: 'The long season of growth until Christ the King and Advent again.', ccc: '1163-1167' },
    ],
  },
  {
    id: 'salvation', title: 'Salvation history', kind: 'timeline', blurb: 'The story of God’s plan, from creation to the Church.',
    nodes: [
      { id: 'creation', label: 'Creation and Fall', when: 'In the beginning', detail: 'God makes the world good and humanity in his image. Sin enters, and God promises a Savior.', ccc: '279-421' },
      { id: 'noah', label: 'Noah', when: 'The flood', detail: 'A covenant with all creation: the rainbow.', ccc: '56-58' },
      { id: 'abraham', label: 'Abraham', when: 'c. 2000 BC', detail: 'God calls Abraham and promises descendants, land and blessing for all nations.', ccc: '59-61' },
      { id: 'moses', label: 'Moses and the Exodus', when: 'c. 1300 BC', detail: 'God frees Israel from slavery and gives the Law at Sinai: a covenant people.', ccc: '62, 2056-2063' },
      { id: 'david', label: 'David', when: 'c. 1000 BC', detail: 'God promises a king whose kingdom will never end: the line of the Messiah.', ccc: '439, 559' },
      { id: 'prophets', label: 'The prophets', when: 'c. 800–400 BC', detail: 'Call Israel back to God and promise a new covenant and a suffering Servant.', ccc: '64, 702' },
      { id: 'christ', label: 'Jesus Christ', when: 'c. 4 BC – AD 30', detail: 'The Word becomes flesh, teaches, dies and rises: the fulfillment of every promise.', ccc: '422-682' },
      { id: 'pentecost', label: 'Pentecost and the Church', when: 'AD 30', detail: 'The Holy Spirit is poured out and the Church is sent to all nations.', ccc: '726, 767' },
      { id: 'return', label: 'Christ’s return', when: 'At the end', detail: 'Christ will come again in glory to judge, and God will be all in all.', ccc: '671-679' },
    ],
  },
  {
    id: 'mercy', title: 'Works of mercy', kind: 'columns', blurb: 'Fourteen ways to love: seven for the body, seven for the soul.',
    nodes: [
      { id: 'm1', label: 'Feed the hungry', detail: 'Share food with those in need. At the Last Judgment Christ says, “I was hungry and you gave me food.” It can mean food banks, a meal for a neighbor, or giving to relief agencies.' },
      { id: 'm2', label: 'Give drink to the thirsty', detail: 'Give drink to those who thirst, in the literal sense of safe water and in the sense of refreshment for the weary. Jesus says a cup of cold water given in his name will not lose its reward.' },
      { id: 'm3', label: 'Clothe the naked', detail: 'Provide clothing, shelter and basic dignity to those who lack them, whether through donations, coat drives or helping someone find work.' },
      { id: 'm4', label: 'Shelter the homeless', detail: 'Welcome strangers and those without a home.' },
      { id: 'm5', label: 'Visit the sick', detail: 'Care for and visit those who are ill: bring company, practical help and prayer. Tell the parish when someone would like a visit or the Anointing of the Sick.' },
      { id: 'm6', label: 'Visit the imprisoned', detail: 'Bring hope to prisoners and their families by visits, letters, prayer and support after release. Christ counts it as done to him.' },
      { id: 'm7', label: 'Bury the dead', detail: 'Honor the dead and comfort the mourning.' },
      { id: 's1', label: 'Counsel the doubtful', detail: 'Help those who are unsure what to do or what to believe, by listening, offering advice from the Gospel and from experience, and recommending good guidance.' },
      { id: 's2', label: 'Instruct the ignorant', detail: 'Teach what is true and good: share the faith with children, friends and new Catholics, and help others learn. It is the work of parents, catechists and teachers.' },
      { id: 's3', label: 'Admonish the sinner', detail: 'Gently and honestly help others turn from wrong, with humility, in private, aiming at their good. It is love, not scolding, and it begins with seeing our own faults.' },
      { id: 's4', label: 'Comfort the sorrowful', detail: 'Be present to those who grieve: show up, listen, and offer help with practical things. Often what helps most is simply staying close.' },
      { id: 's5', label: 'Forgive injuries', detail: 'Let go of resentment and forgive as God has forgiven us. Forgiveness does not mean excusing what was done; it means refusing to be ruled by bitterness.' },
      { id: 's6', label: 'Bear wrongs patiently', detail: 'Bear wrongs and difficult people patiently, without returning evil for evil. It takes the strength of the cross and the grace of the Spirit.' },
      { id: 's7', label: 'Pray for the living and the dead', detail: 'Pray for everyone, the living and the dead: family, friends, enemies, the suffering, and the souls in purgatory. Prayer is a real work of mercy.' },
    ],
    groups: [{ title: 'Corporal', ids: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'] }, { title: 'Spiritual', ids: ['s1', 's2', 's3', 's4', 's5', 's6', 's7'] }],
    note: 'See CCC 2447.',
  },
  {
    id: 'canon', title: 'The Catholic Bible: 73 books', kind: 'columns', blurb: 'How the books are grouped in the Catholic canon.',
    nodes: [
      { id: 'pent', label: 'Pentateuch (5)', detail: 'Genesis, Exodus, Leviticus, Numbers, Deuteronomy: creation, covenant and law.', ccc: '120' },
      { id: 'hist', label: 'Historical books (16)', detail: 'Joshua through 2 Maccabees, including Tobit, Judith, 1–2 Maccabees.', ccc: '120' },
      { id: 'wis', label: 'Wisdom and poetry (7)', detail: 'Job, Psalms, Proverbs, Ecclesiastes, Song of Songs, Wisdom, Sirach.', ccc: '120' },
      { id: 'prop', label: 'Prophets (18)', detail: 'Isaiah, Jeremiah, Lamentations, Baruch, Ezekiel, Daniel and the twelve minor prophets.', ccc: '120' },
      { id: 'gos', label: 'Gospels and Acts (5)', detail: 'Matthew, Mark, Luke, John and Acts of the Apostles.', ccc: '124-127' },
      { id: 'let', label: 'Letters (21)', detail: 'Paul’s letters, Hebrews, and the Catholic letters: James, Peter, John, Jude.', ccc: '120' },
      { id: 'rev', label: 'Revelation (1)', detail: 'The vision of Christ’s final victory: the Lamb, the heavenly liturgy, the defeat of evil and the new Jerusalem. It was written to encourage persecuted Christians.', ccc: '120' },
    ],
    groups: [{ title: 'Old Testament (46)', ids: ['pent', 'hist', 'wis', 'prop'] }, { title: 'New Testament (27)', ids: ['gos', 'let', 'rev'] }],
  },
];
