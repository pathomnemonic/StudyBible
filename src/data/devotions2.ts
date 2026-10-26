import { AVE, PATER, SIGN, type Devotion, type Step } from './devotions';

/**
 * More traditional devotions. The litanies and the Divine Praises are long-used texts in the public domain
 * (the Litany of Loreto includes the three invocations added by Pope Francis in 2020).
 */
const litany = (title: string, rows: string[], reply: string, note?: string): Step => ({ title, text: rows.map((r) => `${r}, ${reply}`).join('\n'), note });

export const LORETO: Devotion = {
  id: 'loreto', name: 'Litany of Loreto', blurb: 'The litany of Our Lady, in the call-and-response of the Church. About eight minutes.',
  steps: [
    { title: 'Opening', text: 'Lord, have mercy. (Lord, have mercy.)\nChrist, have mercy. (Christ, have mercy.)\nLord, have mercy. (Lord, have mercy.)\nChrist, hear us. (Christ, graciously hear us.)', note: 'The leader says the first line; everyone answers in the brackets.' },
    { title: 'The Holy Trinity', text: 'God the Father of heaven, have mercy on us.\nGod the Son, Redeemer of the world, have mercy on us.\nGod the Holy Spirit, have mercy on us.\nHoly Trinity, one God, have mercy on us.' },
    litany('Holy Mary', ['Holy Mary', 'Holy Mother of God', 'Holy Virgin of virgins', 'Mother of Christ', 'Mother of the Church', 'Mother of mercy', 'Mother of hope', 'Mother of divine grace', 'Mother most pure', 'Mother most chaste', 'Mother inviolate', 'Mother undefiled'], 'pray for us', 'Reply to each: pray for us.'),
    litany('Mother', ['Mother most amiable', 'Mother most admirable', 'Mother of good counsel', 'Mother of our Creator', 'Mother of our Savior'], 'pray for us'),
    litany('Virgin', ['Virgin most prudent', 'Virgin most venerable', 'Virgin most renowned', 'Virgin most powerful', 'Virgin most merciful', 'Virgin most faithful'], 'pray for us'),
    litany('Titles from Scripture and the Fathers', ['Mirror of justice', 'Seat of wisdom', 'Cause of our joy', 'Spiritual vessel', 'Vessel of honor', 'Singular vessel of devotion', 'Mystical rose', 'Tower of David', 'Tower of ivory', 'House of gold', 'Ark of the covenant', 'Gate of heaven', 'Morning star'], 'pray for us'),
    litany('Help of the needy', ['Health of the sick', 'Refuge of sinners', 'Solace of migrants', 'Comforter of the afflicted', 'Help of Christians'], 'pray for us'),
    litany('Queen', ['Queen of angels', 'Queen of patriarchs', 'Queen of prophets', 'Queen of apostles', 'Queen of martyrs', 'Queen of confessors', 'Queen of virgins', 'Queen of all saints', 'Queen conceived without original sin', 'Queen assumed into heaven', 'Queen of the most holy Rosary', 'Queen of families', 'Queen of peace'], 'pray for us'),
    { title: 'Lamb of God', text: 'Lamb of God, who takest away the sins of the world, spare us, O Lord.\nLamb of God, who takest away the sins of the world, graciously hear us, O Lord.\nLamb of God, who takest away the sins of the world, have mercy on us.' },
    { title: 'Closing prayer', text: 'V. Pray for us, O holy Mother of God.\nR. That we may be made worthy of the promises of Christ.\n\nLet us pray. Grant, we beseech thee, O Lord God, that we thy servants may enjoy perpetual health of mind and body, and by the glorious intercession of blessed Mary ever Virgin, be delivered from present sorrow and enjoy eternal happiness. Through Christ our Lord. Amen.' },
  ],
};

export const JOSEPH: Devotion = {
  id: 'litany-st-joseph', name: 'Litany of St Joseph', blurb: 'Joseph, guardian of the Holy Family and patron of the Church, workers and the dying.',
  steps: [
    { title: 'Opening', text: 'Lord, have mercy. (Lord, have mercy.)\nChrist, have mercy. (Christ, have mercy.)\nLord, have mercy. (Lord, have mercy.)\nChrist, hear us. (Christ, graciously hear us.)\nGod the Father of heaven, have mercy on us.\nGod the Son, Redeemer of the world, have mercy on us.\nGod the Holy Spirit, have mercy on us.\nHoly Trinity, one God, have mercy on us.' },
    litany('Joseph, son and spouse', ['Holy Mary, pray for us. Saint Joseph', 'Renowned offspring of David', 'Light of patriarchs', 'Spouse of the Mother of God', 'Chaste guardian of the Virgin', 'Foster father of the Son of God', 'Diligent protector of Christ', 'Head of the Holy Family'], 'pray for us'),
    litany('Joseph most…', ['Joseph most just', 'Joseph most chaste', 'Joseph most prudent', 'Joseph most strong', 'Joseph most obedient', 'Joseph most faithful'], 'pray for us'),
    litany('Model and patron', ['Mirror of patience', 'Lover of poverty', 'Model of workers', 'Glory of home life', 'Guardian of virgins', 'Pillar of families', 'Comfort of the troubled', 'Hope of the sick', 'Patron of the dying', 'Terror of demons', 'Protector of Holy Church'], 'pray for us'),
    { title: 'Lamb of God', text: 'Lamb of God, who takest away the sins of the world, spare us, O Lord.\nLamb of God, who takest away the sins of the world, graciously hear us, O Lord.\nLamb of God, who takest away the sins of the world, have mercy on us.' },
    { title: 'Closing', text: 'V. He made him lord of his household.\nR. And ruler of all his possessions.\n\nLet us pray. O God, who in thine ineffable providence didst vouchsafe to choose blessed Joseph to be the spouse of thy most holy Mother, grant, we beseech thee, that we may be worthy to have him for our intercessor in heaven whom on earth we venerate as our protector. Who livest and reignest world without end. Amen.' },
  ],
};

const choirs: [string, string][] = [
  ['Seraphim', 'may the Lord make us worthy to burn with the fire of perfect charity.'],
  ['Cherubim', 'may the Lord grant us grace to leave the ways of sin and run in the paths of Christian perfection.'],
  ['Thrones', 'may the Lord infuse into our hearts a true and sincere spirit of humility.'],
  ['Dominations', 'may the Lord give us grace to govern our senses and overcome any unruly passions.'],
  ['Powers', 'may the Lord protect our souls against the snares and temptations of the devil.'],
  ['Virtues', 'may the Lord preserve us from evil and from falling into sin.'],
  ['Principalities', 'may God fill our souls with a true spirit of obedience.'],
  ['Archangels', 'may the Lord give us perseverance in faith and in all good works, that we may attain the glory of heaven.'],
  ['Angels', 'may the Lord grant us to be protected by them in this mortal life and conducted hereafter to heaven.'],
];
export const MICHAEL: Devotion = {
  id: 'st-michael', name: 'Chaplet of St Michael', blurb: 'Nine salutations to the nine choirs of angels, each with an Our Father and three Hail Marys. A Servite devotion approved by Pius IX.',
  steps: [
    { title: 'Sign of the Cross', text: SIGN },
    { title: 'Opening', text: 'O God, come to my assistance. O Lord, make haste to help me. Glory be to the Father…' },
    ...choirs.flatMap(([c, p], i): Step[] => [
      { title: `${i + 1}. The choir of ${c}`, text: `By the intercession of St Michael and the celestial choir of ${c}, ${p} Amen.`, note: 'Then one Our Father and three Hail Marys.' },
      { title: 'Our Father', text: PATER },
      { title: 'Hail Mary', text: AVE, count: 3 },
    ]),
    { title: 'Closing prayers', text: 'Our Father, in honor of St Michael. Our Father, in honor of St Gabriel. Our Father, in honor of St Raphael. Our Father, in honor of our Guardian Angel.', note: 'Four Our Fathers.', count: 1 },
    { title: 'Prayer to St Michael', text: 'St Michael the Archangel, defend us in battle. Be our protection against the wickedness and snares of the devil. May God rebuke him, we humbly pray; and do thou, O Prince of the heavenly host, by the power of God, cast into hell Satan and all the evil spirits who prowl about the world seeking the ruin of souls. Amen.' },
  ],
};

export const HOLY_HOUR: Devotion = {
  id: 'holy-hour', name: 'A Holy Hour', blurb: 'A guide for an hour (or less) before the Blessed Sacrament, with silences, Scripture, prayers and the Divine Praises.',
  steps: [
    { title: 'Arrive', text: 'Genuflect, kneel or sit, and make the Sign of the Cross. Let yourself be quiet. You do not have to do anything. He is here.', note: 'A moment to settle.', seconds: 60 },
    { title: 'Adoration', text: 'My Lord and my God, I believe that you are truly here, body and blood, soul and divinity. I adore you, and I thank you for coming to be with me.', seconds: 45 },
    { title: 'Scripture: “Could you not watch one hour?”', refs: 'Matthew 26:36-41', note: 'Read slowly. Let one word stay with you.', seconds: 120 },
    { title: 'Silence', text: 'Rest in his presence. If your mind wanders, return gently. Speak to him as to a friend.', note: 'Five minutes of silence.', seconds: 300 },
    { title: 'Anima Christi', text: 'Soul of Christ, sanctify me. Body of Christ, save me. Blood of Christ, inebriate me. Water from the side of Christ, wash me. Passion of Christ, strengthen me. O good Jesus, hear me. Within thy wounds hide me. Suffer me not to be separated from thee. From the malicious enemy defend me. In the hour of my death call me, and bid me come to thee, that with thy saints I may praise thee for ever and ever. Amen.' },
    { title: 'Thanksgiving', text: 'Thank him for three things from this week. Name them out loud or in your heart.', seconds: 120 },
    { title: 'Scripture: “I am the bread of life”', refs: 'John 6:35-40', seconds: 120 },
    { title: 'Silence', text: 'Be still. Listen for what he is asking of you.', note: 'Another five minutes.', seconds: 300 },
    { title: 'Petition and intercession', text: 'Bring him the people you carry: family, friends, the sick, the dead, the Church, the world. Pray for each by name.', seconds: 180 },
    { title: 'Sorrow', text: 'O my God, I am heartily sorry for having offended thee, and I detest all my sins, because of thy just punishments, but most of all because they offend thee, my God, who art all good and deserving of all my love. I firmly resolve, with the help of thy grace, to sin no more and to avoid the near occasion of sin. Amen.', seconds: 60 },
    { title: 'Resolve', text: 'Choose one concrete thing you will do because of this hour. Ask for the grace to do it.', seconds: 90 },
    { title: 'Tantum Ergo', text: 'Down in adoration falling,\nThis great Sacrament we hail;\nOver ancient forms of worship\nNewer rites of grace prevail;\nFaith will tell us Christ is present,\nWhen our human senses fail.\n\nTo the everlasting Father,\nAnd the Son who reigns on high,\nWith the Holy Spirit proceeding\nForth from each eternally,\nBe salvation, honor, blessing,\nMight and endless majesty. Amen.' },
    { title: 'The Divine Praises', text: 'Blessed be God.\nBlessed be his holy Name.\nBlessed be Jesus Christ, true God and true man.\nBlessed be the name of Jesus.\nBlessed be his most Sacred Heart.\nBlessed be his most Precious Blood.\nBlessed be Jesus in the most holy Sacrament of the altar.\nBlessed be the Holy Spirit, the Paraclete.\nBlessed be the great Mother of God, Mary most holy.\nBlessed be her holy and Immaculate Conception.\nBlessed be her glorious Assumption.\nBlessed be the name of Mary, Virgin and Mother.\nBlessed be Saint Joseph, her most chaste spouse.\nBlessed be God in his angels and in his saints.' },
    { title: 'Leave in peace', text: 'Thank you, Lord, for this time. Stay with me through the day. Amen.', note: 'Make the Sign of the Cross and genuflect as you go.' },
  ],
};
const ACT = 'O my God, I am heartily sorry for having offended thee, and I detest all my sins, because of thy just punishments, but most of all because they offend thee, my God, who art all good and deserving of all my love. I firmly resolve, with the help of thy grace, to sin no more and to avoid the near occasion of sin. Amen.';
export const CONFESSION: Devotion = {
  id: 'confession', name: 'Going to Confession', blurb: 'A step-by-step guide to the sacrament, with what to say. Nothing you type or tap here is saved or sent.',
  steps: [
    { title: 'Ask for light', text: 'Come, Holy Spirit, fill the hearts of thy faithful, and kindle in them the fire of thy love.\n\nLord, help me to see my sins as you see them, and to trust your mercy more than I fear my failures.', note: 'Take a few quiet minutes.', seconds: 45 },
    { title: 'Examine your conscience', text: 'Look over your life since your last good Confession: your love of God (prayer, Mass, his name), your love of others (family, work, truth, purity, justice, forgiveness) and your own heart. Use the Examination of conscience page if you want a list.', note: 'You must confess every mortal sin you remember, in kind and number. Venial sins are good to confess too.', seconds: 120 },
    { title: 'Be truly sorry', text: 'Sorrow is the heart of repentance: you are sorry because you have hurt God and others, and you want to turn back. If your sorrow feels thin, ask for more. God works with a willing heart.', seconds: 30 },
    { title: 'Greet the priest', text: 'Make the Sign of the Cross as he does. Then say:\n\n“Bless me, Father, for I have sinned. It has been ___ since my last Confession.”', note: 'If it has been a long time, just say so. If you are nervous or new, tell him; he will help you.' },
    { title: 'Tell your sins', text: 'Say them simply and honestly, in kind and number for serious sins. Do not explain them away and do not carry the details of other people. When you are done, say:\n\n“For these and all my sins, I am sorry.”', note: 'The priest is bound by the seal of confession and may never reveal anything you say (CCC 1467).' },
    { title: 'Listen', text: 'The priest may give counsel, then a penance (a prayer or an act of kindness). Accept it and remember it.' },
    { title: 'Act of Contrition', text: ACT, note: 'Say it aloud, or in your own words if you prefer.' },
    { title: 'Absolution', text: 'The priest extends his hand and says:\n\n“God, the Father of mercies, through the death and resurrection of his Son has reconciled the world to himself and sent the Holy Spirit among us for the forgiveness of sins; through the ministry of the Church may God give you pardon and peace, and I absolve you from your sins in the name of the Father, and of the Son, and of the Holy Spirit.”\n\nAnswer: “Amen.”', note: 'Your sins are forgiven.' },
    { title: 'Go in peace', text: 'Priest: “Give thanks to the Lord, for he is good.”\nYou: “His mercy endures for ever.”\nPriest: “The Lord has freed you from your sins. Go in peace.”' },
    { title: 'Thank God and do your penance', text: 'Thank him in the church, and do your penance soon. If you forgot a sin, it is forgiven; mention it next time. If you can, make amends to anyone you have wronged.', note: 'Welcome home.' },
  ],
};
export const MORE: Devotion[] = [HOLY_HOUR, LORETO, JOSEPH, MICHAEL];
