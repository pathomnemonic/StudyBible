/** Short prayer plans: a Scripture passage (shown in the reader's translation) and a traditional prayer for each day. */
export interface PlanDay { title: string; refs: string; prayer?: string }
export interface PrayerPlan { id: string; name: string; blurb: string; days: PlanDay[]; opening?: string }

const COME = 'Come, Holy Spirit, fill the hearts of thy faithful and kindle in them the fire of thy love. V. Send forth thy Spirit and they shall be created. R. And thou shalt renew the face of the earth.';
const JOSEPH = 'To thee, O blessed Joseph, we have recourse in our affliction, and having implored the help of thy most holy Spouse, we confidently invoke thy patronage also. Help us in our needs by thy power and strength. St Joseph, pray for us.';
const MISERERE = 'Have mercy on me, O God, according to thy great mercy; and according to the multitude of thy tender mercies blot out my iniquity. Create a clean heart in me, O God, and renew a right spirit within my bowels. Amen.';

export const PLANS: PrayerPlan[] = [
  { id: 'holy-spirit', name: 'Novena to the Holy Spirit', blurb: 'Nine days between the Ascension and Pentecost, the first novena: the apostles praying with Mary in the upper room (Acts 1:14).', opening: 'Begin each day with the Sign of the Cross, then read the passage, then pray the prayer below, then an Our Father, Hail Mary and Glory Be.', days: [
    { title: 'Day 1: Waiting in prayer', refs: 'Acts 1:12-14', prayer: COME },
    { title: 'Day 2: The promise of the Father', refs: 'Luke 24:46-49', prayer: COME },
    { title: 'Day 3: Another Advocate', refs: 'John 14:15-21', prayer: COME },
    { title: 'Day 4: The Spirit of truth', refs: 'John 16:5-15', prayer: COME },
    { title: 'Day 5: Wisdom and understanding', refs: 'Isaiah 11:1-3', prayer: COME },
    { title: 'Day 6: Fruits of the Spirit', refs: 'Galatians 5:16-25', prayer: COME },
    { title: 'Day 7: The Spirit helps us pray', refs: 'Romans 8:22-27', prayer: COME },
    { title: 'Day 8: Many gifts, one Spirit', refs: '1 Corinthians 12:4-13', prayer: COME },
    { title: 'Day 9: Pentecost', refs: 'Acts 2:1-11', prayer: COME },
  ] },
  { id: 'st-joseph', name: 'Novena to St Joseph', blurb: 'Nine days with the just man who protected the Holy Family. Prayed before his feast (19 March and 1 May) or in any need.', days: [
    { title: 'Day 1: A just man', refs: 'Matthew 1:18-21', prayer: JOSEPH },
    { title: 'Day 2: Obedient to God’s word', refs: 'Matthew 1:22-25', prayer: JOSEPH },
    { title: 'Day 3: Born in Bethlehem', refs: 'Luke 2:1-7', prayer: JOSEPH },
    { title: 'Day 4: Presented in the Temple', refs: 'Luke 2:22-33', prayer: JOSEPH },
    { title: 'Day 5: Flight into Egypt', refs: 'Matthew 2:13-15', prayer: JOSEPH },
    { title: 'Day 6: Return to Nazareth', refs: 'Matthew 2:19-23', prayer: JOSEPH },
    { title: 'Day 7: Finding Jesus in the Temple', refs: 'Luke 2:41-51', prayer: JOSEPH },
    { title: 'Day 8: The carpenter', refs: 'Matthew 13:53-58', prayer: JOSEPH },
    { title: 'Day 9: Home with Jesus and Mary', refs: 'Luke 2:51-52', prayer: JOSEPH },
  ] },
  { id: 'penitential', name: 'Seven days with the Penitential Psalms', blurb: 'The seven psalms the Church has long prayed for repentance, one a day, good for Lent or before Confession.', days: [
    { title: 'Day 1: Psalm 6', refs: 'Psalm 6', prayer: MISERERE },
    { title: 'Day 2: Psalm 32', refs: 'Psalm 32', prayer: MISERERE },
    { title: 'Day 3: Psalm 38', refs: 'Psalm 38', prayer: MISERERE },
    { title: 'Day 4: Psalm 51', refs: 'Psalm 51', prayer: MISERERE },
    { title: 'Day 5: Psalm 102', refs: 'Psalm 102', prayer: MISERERE },
    { title: 'Day 6: Psalm 130', refs: 'Psalm 130', prayer: MISERERE },
    { title: 'Day 7: Psalm 143', refs: 'Psalm 143', prayer: MISERERE },
  ] },
  { id: 'advent-magnificat', name: 'Advent week: Mary’s way of waiting', blurb: 'Seven days with those who waited for the Lord: Mary, Elizabeth, Zechariah and Simeon.', days: [
    { title: 'Day 1: The Annunciation', refs: 'Luke 1:26-38' }, { title: 'Day 2: The Visitation', refs: 'Luke 1:39-45' },
    { title: 'Day 3: The Magnificat', refs: 'Luke 1:46-56' }, { title: 'Day 4: The birth of John', refs: 'Luke 1:57-66' },
    { title: 'Day 5: Zechariah’s song', refs: 'Luke 1:67-79' }, { title: 'Day 6: Joseph’s dream', refs: 'Matthew 1:18-25' },
    { title: 'Day 7: Simeon and Anna', refs: 'Luke 2:25-38' },
  ] },
];
