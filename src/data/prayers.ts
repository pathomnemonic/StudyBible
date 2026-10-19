/**
 * Traditional Catholic prayers in long-established English wording whose text is not subject to a modern
 * translation copyright. Liturgical texts (the Mass, the Creeds as proclaimed, the Lectionary) are ICEL/USCCB
 * copyrighted and are deliberately NOT included.
 */
export interface Prayer {
  id: string;
  title: string;
  text: string;
  source: string;
}
export const PRAYERS: Prayer[] = [
  { id: 'our-father', title: 'Our Father', source: 'Matthew 6:9–13 (traditional English wording)', text: 'Our Father, who art in heaven, hallowed be thy name; thy kingdom come; thy will be done on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.' },
  { id: 'hail-mary', title: 'Hail Mary', source: 'Luke 1:28, 1:42 with the Church’s traditional petition', text: 'Hail Mary, full of grace, the Lord is with thee; blessed art thou amongst women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.' },
  { id: 'glory-be', title: 'Glory Be', source: 'Traditional doxology', text: 'Glory be to the Father, and to the Son, and to the Holy Ghost. As it was in the beginning, is now, and ever shall be, world without end. Amen.' },
  { id: 'memorare', title: 'The Memorare', source: 'Traditional prayer to Mary (16th-century form)', text: 'Remember, O most gracious Virgin Mary, that never was it known that anyone who fled to thy protection, implored thy help, or sought thy intercession was left unaided. Inspired by this confidence, I fly unto thee, O Virgin of virgins, my Mother; to thee do I come, before thee I stand, sinful and sorrowful. O Mother of the Word Incarnate, despise not my petitions, but in thy mercy hear and answer me. Amen.' },
  { id: 'anima-christi', title: 'Anima Christi', source: 'Medieval prayer, traditional English', text: 'Soul of Christ, sanctify me. Body of Christ, save me. Blood of Christ, inebriate me. Water from the side of Christ, wash me. Passion of Christ, strengthen me. O good Jesus, hear me. Within thy wounds hide me. Suffer me not to be separated from thee. From the malicious enemy defend me. In the hour of my death call me, and bid me come to thee, that with thy saints I may praise thee for ever and ever. Amen.' },
  { id: 'come-holy-spirit', title: 'Come, Holy Spirit', source: 'Veni Sancte Spiritus, traditional versicle and prayer', text: 'Come, Holy Spirit, fill the hearts of thy faithful, and kindle in them the fire of thy love. Send forth thy Spirit and they shall be created; and thou shalt renew the face of the earth.' },
  { id: 'act-of-contrition', title: 'Act of Contrition', source: 'Traditional form', text: 'O my God, I am heartily sorry for having offended thee, and I detest all my sins because I dread the loss of heaven and the pains of hell, but most of all because they offend thee, my God, who art all good and deserving of all my love. I firmly resolve, with the help of thy grace, to sin no more and to avoid the near occasions of sin. Amen.' },
  { id: 'prayer-before-scripture', title: 'Before reading Scripture', source: 'Based on Psalm 118:18 (Vulgate numbering); traditional spirit', text: 'Open thou my eyes, O Lord, and I shall consider the wondrous things of thy law. Speak, Lord, for thy servant heareth. Amen.' },
];
