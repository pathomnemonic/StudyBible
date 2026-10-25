/**
 * Traditional Catholic devotions as step lists. Prayer texts are the long-standing public-domain
 * forms. Scripture is shown from the reader's own translation, so no biblical text is stored here.
 */
export interface Step {
  title: string;
  text?: string;
  /** Scripture shown in the reader's translation, as a user-style reference (KJV numbering). */
  refs?: string;
  /** Number of times the prayer is repeated; the page counts taps. */
  count?: number;
  note?: string;
}

export interface Devotion {
  id: string;
  name: string;
  blurb: string;
  steps: Step[];
}

export const SIGN = 'In the name of the Father, and of the Son, and of the Holy Spirit. Amen.';
export const CREED = 'I believe in God, the Father almighty, Creator of heaven and earth; and in Jesus Christ, his only Son, our Lord, who was conceived by the Holy Ghost, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; he descended into hell; on the third day he rose again from the dead; he ascended into heaven, and is seated at the right hand of God the Father almighty; from there he will come to judge the living and the dead. I believe in the Holy Ghost, the holy catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.';
export const PATER = 'Our Father, who art in heaven, hallowed be thy name; thy kingdom come; thy will be done on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.';
export const AVE = 'Hail Mary, full of grace, the Lord is with thee; blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.';
export const GLORIA = 'Glory be to the Father, and to the Son, and to the Holy Spirit, as it was in the beginning, is now, and ever shall be, world without end. Amen.';
const FATIMA = 'O my Jesus, forgive us our sins, save us from the fires of hell, lead all souls to heaven, especially those most in need of thy mercy.';
const SALVE = 'Hail, holy Queen, Mother of mercy, our life, our sweetness and our hope. To thee do we cry, poor banished children of Eve; to thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, thine eyes of mercy toward us, and after this our exile, show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary.';
const ROSARY_COLLECT = 'V. Pray for us, O holy Mother of God. R. That we may be made worthy of the promises of Christ. Let us pray. O God, whose only-begotten Son, by his life, death and resurrection, has purchased for us the rewards of eternal life, grant, we beseech thee, that meditating on these mysteries of the most holy Rosary of the Blessed Virgin Mary, we may imitate what they contain and obtain what they promise, through the same Christ our Lord. Amen.';

export interface MysterySet { id: string; name: string; days: number[]; mysteries: { title: string; refs: string; fruit: string }[] }

export const MYSTERIES: MysterySet[] = [
  { id: 'joyful', name: 'Joyful', days: [1, 6], mysteries: [
    { title: 'The Annunciation', refs: 'Luke 1:26-38', fruit: 'Humility' },
    { title: 'The Visitation', refs: 'Luke 1:39-56', fruit: 'Love of neighbour' },
    { title: 'The Nativity', refs: 'Luke 2:1-20', fruit: 'Poverty of spirit' },
    { title: 'The Presentation', refs: 'Luke 2:22-38', fruit: 'Obedience' },
    { title: 'The Finding in the Temple', refs: 'Luke 2:41-52', fruit: 'Joy in finding Jesus' },
  ] },
  { id: 'luminous', name: 'Luminous', days: [4], mysteries: [
    { title: 'The Baptism of Jesus', refs: 'Matthew 3:13-17', fruit: 'Openness to the Holy Spirit' },
    { title: 'The Wedding at Cana', refs: 'John 2:1-12', fruit: 'To Jesus through Mary' },
    { title: 'The Proclamation of the Kingdom', refs: 'Mark 1:14-15; Matthew 5:1-12', fruit: 'Repentance and trust in God' },
    { title: 'The Transfiguration', refs: 'Luke 9:28-36', fruit: 'Desire for holiness' },
    { title: 'The Institution of the Eucharist', refs: 'Luke 22:14-20', fruit: 'Adoration' },
  ] },
  { id: 'sorrowful', name: 'Sorrowful', days: [2, 5], mysteries: [
    { title: 'The Agony in the Garden', refs: 'Luke 22:39-46', fruit: 'Sorrow for sin' },
    { title: 'The Scourging at the Pillar', refs: 'John 19:1; Mark 15:15', fruit: 'Purity' },
    { title: 'The Crowning with Thorns', refs: 'Matthew 27:27-31', fruit: 'Courage' },
    { title: 'The Carrying of the Cross', refs: 'John 19:16-17; Luke 23:26-32', fruit: 'Patience' },
    { title: 'The Crucifixion', refs: 'Luke 23:33-46', fruit: 'Salvation of souls' },
  ] },
  { id: 'glorious', name: 'Glorious', days: [0, 3], mysteries: [
    { title: 'The Resurrection', refs: 'John 20:1-18', fruit: 'Faith' },
    { title: 'The Ascension', refs: 'Acts 1:6-11', fruit: 'Hope' },
    { title: 'The Descent of the Holy Spirit', refs: 'Acts 2:1-13', fruit: 'Love of God' },
    { title: 'The Assumption of Mary', refs: 'Revelation 12:1-6', fruit: 'Grace of a happy death' },
    { title: 'The Coronation of Mary', refs: 'Revelation 12:1; Luke 1:46-55', fruit: 'Trust in Mary’s intercession' },
  ] },
];

export const todaysMysteries = (day = new Date().getDay()) => MYSTERIES.find((m) => m.days.includes(day)) ?? MYSTERIES[0];

export function rosary(set: MysterySet): Devotion {
  const steps: Step[] = [
    { title: 'Sign of the Cross', text: SIGN },
    { title: 'Apostles’ Creed', text: CREED },
    { title: 'Our Father', text: PATER },
    { title: 'Three Hail Marys', text: AVE, count: 3, note: 'For an increase of faith, hope and charity.' },
    { title: 'Glory Be', text: GLORIA },
  ];
  set.mysteries.forEach((m, i) => {
    const n = `${set.name} mystery ${i + 1}`;
    steps.push({ title: `${i + 1}. ${m.title}`, refs: m.refs, note: `${n}. Fruit of the mystery: ${m.fruit}.` });
    steps.push({ title: 'Our Father', text: PATER });
    steps.push({ title: 'Ten Hail Marys', text: AVE, count: 10 });
    steps.push({ title: 'Glory Be', text: GLORIA });
    steps.push({ title: 'Fatima prayer', text: FATIMA });
  });
  steps.push({ title: 'Hail, Holy Queen', text: SALVE });
  steps.push({ title: 'Closing prayer', text: ROSARY_COLLECT });
  steps.push({ title: 'Sign of the Cross', text: SIGN });
  return { id: `rosary-${set.id}`, name: `The Rosary — ${set.name} mysteries`, blurb: '', steps };
}

export const ANGELUS: Devotion = {
  id: 'angelus', name: 'The Angelus', blurb: 'Said morning, noon and evening, remembering the Incarnation.',
  steps: [
    { title: 'The angel of the Lord declared unto Mary', text: 'V. The angel of the Lord declared unto Mary. R. And she conceived by the Holy Ghost.' },
    { title: 'Hail Mary', text: AVE },
    { title: 'Behold the handmaid', text: 'V. Behold the handmaid of the Lord. R. Be it done unto me according to thy word.' },
    { title: 'Hail Mary', text: AVE },
    { title: 'And the Word was made flesh', text: 'V. And the Word was made flesh. R. And dwelt among us.' },
    { title: 'Hail Mary', text: AVE },
    { title: 'Pray for us', text: 'V. Pray for us, O holy Mother of God. R. That we may be made worthy of the promises of Christ.' },
    { title: 'Let us pray', text: 'Pour forth, we beseech thee, O Lord, thy grace into our hearts, that we, to whom the incarnation of Christ thy Son was made known by the message of an angel, may by his passion and cross be brought to the glory of his resurrection. Through the same Christ our Lord. Amen.' },
    { title: 'Glory Be (three times)', text: GLORIA, count: 3, note: 'Some add Eternal rest for the faithful departed at evening.' },
  ],
};

export const REGINA: Devotion = {
  id: 'regina-caeli', name: 'Regina Caeli', blurb: 'Said in place of the Angelus through Eastertide.',
  steps: [
    { title: 'Regina Caeli', text: 'Queen of heaven, rejoice, alleluia. For he whom thou didst merit to bear, alleluia, has risen as he said, alleluia. Pray for us to God, alleluia.' },
    { title: 'Rejoice', text: 'V. Rejoice and be glad, O Virgin Mary, alleluia. R. For the Lord has truly risen, alleluia.' },
    { title: 'Let us pray', text: 'O God, who gave joy to the world through the resurrection of thy Son, our Lord Jesus Christ, grant, we beseech thee, that through the intercession of the Virgin Mary, his Mother, we may attain the joys of everlasting life. Through the same Christ our Lord. Amen.' },
  ],
};

export const MERCY: Devotion = {
  id: 'divine-mercy', name: 'Chaplet of Divine Mercy', blurb: 'Prayed on ordinary rosary beads, given to St Faustina. Often prayed at three o’clock.',
  steps: [
    { title: 'Sign of the Cross', text: SIGN },
    { title: 'Opening', text: 'You expired, Jesus, but the source of life gushed forth for souls, and the ocean of mercy opened up for the whole world. O Fount of Life, unfathomable Divine Mercy, envelop the whole world and empty Yourself out upon us.', note: 'Then three times: O Blood and Water, which gushed forth from the Heart of Jesus as a fount of mercy for us, I trust in You.', count: 3 },
    { title: 'Our Father', text: PATER },
    { title: 'Hail Mary', text: AVE },
    { title: 'Apostles’ Creed', text: CREED },
    ...[1, 2, 3, 4, 5].flatMap((n): Step[] => [
      { title: `Decade ${n}: on the large bead`, text: 'Eternal Father, I offer You the Body and Blood, Soul and Divinity of Your dearly beloved Son, Our Lord, Jesus Christ, in atonement for our sins and those of the whole world.' },
      { title: `Decade ${n}: on the ten small beads`, text: 'For the sake of His sorrowful Passion, have mercy on us and on the whole world.', count: 10 },
    ]),
    { title: 'Closing', text: 'Holy God, Holy Mighty One, Holy Immortal One, have mercy on us and on the whole world.', count: 3 },
    { title: 'Optional closing prayer', text: 'Eternal God, in whom mercy is endless and the treasury of compassion inexhaustible, look kindly upon us and increase Your mercy in us, that in difficult moments we might not despair nor become despondent, but with great confidence submit ourselves to Your holy will, which is Love and Mercy itself.' },
    { title: 'Sign of the Cross', text: SIGN },
  ],
};

const STATION_VERSICLE = 'V. We adore thee, O Christ, and we praise thee. R. Because by thy holy cross thou hast redeemed the world.';
const STATION_END = 'Our Father, Hail Mary, Glory be. Have mercy on us, O Lord. Have mercy on us.';

export const STATIONS: Devotion = {
  id: 'stations', name: 'Stations of the Cross', blurb: 'The traditional fourteen stations, with the prayers after St Alphonsus Liguori and the Scripture beside each. Stations marked “traditional” are not told in the Gospels, so a nearby prophecy is shown.',
  steps: [
    { title: 'Opening prayer', text: 'O my Jesus, I come to walk with thee the way thou didst walk for me. Give me a heart that is sorry for my sins and grateful for thy love. Make me, by this devotion, more like thee. Amen.', note: 'Make the Sign of the Cross. At each station, genuflect and say the versicle; then read, pray and meditate.' },
    ...[
      ['Jesus is condemned to death', 'Matthew 27:22-26', '', 'My adorable Jesus, it was not Pilate, no, it was my sins that condemned thee to die. By the merits of this sorrowful journey, assist my soul on its journey to eternity.'],
      ['Jesus takes up his cross', 'John 19:16-17', '', 'My most beloved Jesus, I embrace all the sufferings thou hast destined for me until death. By the pain thou didst suffer in carrying the cross, give me the necessary help to carry mine with perfect patience and resignation.'],
      ['Jesus falls the first time', 'Isaiah 53:4-6', 'Traditional', 'My beloved Jesus, it is not the weight of the cross but of my sins which has made thee suffer so much. By the merits of this first fall, deliver me from the misfortune of falling into mortal sin.'],
      ['Jesus meets his afflicted Mother', 'Luke 2:34-35', 'Traditional', 'My most loving Jesus, by the sorrow thou didst experience in meeting thy Mother, grant me the grace of a truly sincere devotion to thy Blessed Mother. And thou, my Queen, who wast overwhelmed with sorrow, obtain for me by thy intercession a tender and lasting remembrance of the Passion of thy Son.'],
      ['Simon of Cyrene helps Jesus carry the cross', 'Luke 23:26', '', 'My most beloved Jesus, I will not refuse the cross as Simon did; I accept it and embrace it. I accept in particular the death thou hast destined for me, with all the pains that may accompany it.'],
      ['Veronica wipes the face of Jesus', 'Isaiah 53:2-3', 'Traditional', 'My most beloved Jesus, thy face was beautiful before, but in this journey it has lost all its beauty. Alas, my soul also was once beautiful when it received thy grace in baptism, but I have disfigured it since by my sins. Thou alone, my Redeemer, canst restore it to its former beauty.'],
      ['Jesus falls the second time', 'Psalm 22:6-8', 'Traditional', 'My Jesus, by the weight of my sins thou wast made to fall again. By the merits of this second fall, give me the grace to persevere in thy friendship until death, and keep me from relapsing into sin.'],
      ['Jesus meets the women of Jerusalem', 'Luke 23:27-31', '', 'My Jesus, laden with sorrows, I weep for the offences I have committed against thee, because of the pains they deserve, and still more because of the displeasure they have caused thee, who hast loved me so much.'],
      ['Jesus falls the third time', 'Isaiah 53:7-8', 'Traditional', 'My most gentle Jesus, by the weakness thou didst suffer in going to Calvary, give me strength to overcome all human respect and all my wicked passions, which have led me to despise thy friendship.'],
      ['Jesus is stripped of his garments', 'John 19:23-24', '', 'My Jesus, by the torment thou didst suffer in being stripped of thy garments, help me to strip myself of all attachment to the things of earth, and to place all my love in thee, who art so worthy of my love.'],
      ['Jesus is nailed to the cross', 'Luke 23:33-34', '', 'My Jesus, nailed to the cross, I offer thee my will, because thou wast pleased to be fastened to the cross for love of me. Let me not wander from thee: nail my heart to thy holy will.'],
      ['Jesus dies on the cross', 'Luke 23:44-46; John 19:28-30', '', 'My Jesus, thou didst die for love of me. Make me die rather than offend thee again. In thy wounds I place my hope, and into thy hands I commend my spirit.'],
      ['Jesus is taken down from the cross', 'Luke 23:50-53', '', 'O Mother of sorrows, for the love of this Son, accept me as thy child and pray for me. And thou, my Redeemer, since thou hast died for me, permit me to love thee, for I wish only thee and nothing more.'],
      ['Jesus is laid in the tomb', 'John 19:40-42', '', 'My buried Jesus, I kiss the stone that encloses thee. But thou didst rise again the third day. I beseech thee, by thy resurrection, make me rise glorious with thee at the last day, to be always united with thee in heaven.'],
    ].map(([t, r, tr, pr], i): Step => ({
      title: `${i + 1}. ${t}`, refs: r,
      text: `${STATION_VERSICLE}\n\n${pr}`,
      note: `${tr ? `${tr} station. ` : ''}${STATION_END}`,
    })),
    { title: 'Closing prayer', text: 'Lord Jesus Christ, thou didst walk this way for me. Keep me close to thee, and bring me, through thy cross, to the joy of thy resurrection. Pray also for the intentions of the Holy Father, with an Our Father, Hail Mary and Glory be. Amen.' },
  ],
};

export const SORROWS: Devotion = {
  id: 'seven-sorrows', name: 'Chaplet of the Seven Sorrows', blurb: 'Seven Hail Marys for each sorrow of Mary, a devotion of the Servite order.',
  steps: [
    { title: 'Sign of the Cross', text: SIGN },
    { title: 'Act of contrition', text: 'O my God, I am heartily sorry for having offended thee, and I detest all my sins, because of thy just punishments, but most of all because they offend thee, my God, who art all good and deserving of all my love. I firmly resolve, with the help of thy grace, to sin no more and to avoid the near occasion of sin. Amen.' },
    ...[
      ['The prophecy of Simeon', 'Luke 2:34-35'],
      ['The flight into Egypt', 'Matthew 2:13-15'],
      ['The loss of the child Jesus', 'Luke 2:43-46'],
      ['Mary meets Jesus on the way of the cross', 'Luke 23:27-31'],
      ['The crucifixion', 'John 19:25-30'],
      ['Jesus is taken down from the cross', 'Matthew 27:57-59'],
      ['The burial of Jesus', 'John 19:40-42'],
    ].map(([t, r], i): Step => ({ title: `${i + 1}. ${t}`, refs: r, text: AVE, count: 7, note: 'Pray seven Hail Marys, meditating on this sorrow.' })),
    { title: 'Closing', text: 'V. Pray for us, O Virgin most sorrowful. R. That we may be made worthy of the promises of Christ.' },
  ],
};
