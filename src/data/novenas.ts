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

const MERCY_N = 'Most Merciful Jesus, whose very nature is to have compassion on us and to forgive us, do not look upon our sins but upon our trust which we place in your infinite goodness. Receive us all into the abode of your most compassionate Heart, and never let us escape from it. We beg this of you by your love which unites you to the Father and the Holy Spirit. Amen.';
const IMMACULATE = 'O God, who by the Immaculate Conception of the Blessed Virgin didst prepare a worthy dwelling for thy Son, we beseech thee that, as thou didst preserve her from every stain by the foreseen death of thy Son, so thou wouldst grant that we, through her intercession, may come to thee with pure hearts. Through Christ our Lord. Amen.';
const HEART = 'O Sacred Heart of Jesus, fountain of every blessing, I adore thee, I love thee, and with lively sorrow for my sins I offer thee this poor heart of mine. Make me humble, patient, pure and wholly obedient to thy will. Grant, good Jesus, that I may live in thee and for thee. Protect me in the midst of danger; comfort me in my afflictions. Amen.';
export const MORE_PLANS: PrayerPlan[] = [
  { id: 'divine-mercy', name: 'Divine Mercy Novena', blurb: 'Nine days from Good Friday to the eve of Divine Mercy Sunday, each day for a different group of souls, with the Chaplet of Divine Mercy.', opening: 'Each day, pray the Chaplet of Divine Mercy (Prayer → Devotions), then the prayer below for the day’s intention.', days: [
    { title: 'Day 1: All mankind, especially sinners', refs: 'John 3:16-17', prayer: MERCY_N },
    { title: 'Day 2: Priests and religious', refs: 'Matthew 9:36-38', prayer: MERCY_N },
    { title: 'Day 3: Devout and faithful souls', refs: 'Psalm 103:8-14', prayer: MERCY_N },
    { title: 'Day 4: Those who do not yet know Jesus', refs: 'Acts 10:34-36', prayer: MERCY_N },
    { title: 'Day 5: Christians separated from the Church', refs: 'John 17:20-23', prayer: MERCY_N },
    { title: 'Day 6: The meek and humble, and children', refs: 'Matthew 11:28-30', prayer: MERCY_N },
    { title: 'Day 7: Souls who venerate and glorify God’s mercy', refs: 'Luke 1:50-54', prayer: MERCY_N },
    { title: 'Day 8: The souls in purgatory', refs: 'John 14:1-3', prayer: MERCY_N },
    { title: 'Day 9: Lukewarm souls', refs: 'Revelation 3:14-22', prayer: MERCY_N },
  ] },
  { id: 'o-antiphons', name: 'The O Antiphons', blurb: 'The seven great titles of Christ prayed at Evening Prayer from 17 to 23 December, one a day. The first letters of the Latin titles, read backward, spell “Ero cras”: “Tomorrow I will be there.”', days: [
    { title: 'Dec 17: O Wisdom', refs: 'Isaiah 11:2-3', prayer: 'O Wisdom, who camest out of the mouth of the Most High, and reachest from one end to another, mightily and sweetly ordering all things: Come and teach us the way of prudence.' },
    { title: 'Dec 18: O Lord (Adonai)', refs: 'Exodus 3:2-6', prayer: 'O Adonai, and Ruler of the house of Israel, who appearedst to Moses in the burning bush, and gavest him the law on Sinai: Come and redeem us with an outstretched arm.' },
    { title: 'Dec 19: O Root of Jesse', refs: 'Isaiah 11:10', prayer: 'O Root of Jesse, who standest for an ensign of the people, before whom kings shall keep silence, and unto whom the Gentiles shall make supplication: Come and deliver us, and tarry not.' },
    { title: 'Dec 20: O Key of David', refs: 'Isaiah 22:22', prayer: 'O Key of David, and Sceptre of the house of Israel; that openest, and no man shutteth; and shuttest, and no man openeth: Come and bring the prisoner out of the prison house, and him that sitteth in darkness and the shadow of death.' },
    { title: 'Dec 21: O Dayspring', refs: 'Isaiah 9:2', prayer: 'O Dayspring, Brightness of the Light everlasting, and Sun of Righteousness: Come and enlighten them that sit in darkness and the shadow of death.' },
    { title: 'Dec 22: O King of the Gentiles', refs: 'Isaiah 28:16', prayer: 'O King of the Gentiles, and their Desire; the Cornerstone, who makest both one: Come and save mankind, whom thou formedst of clay.' },
    { title: 'Dec 23: O Emmanuel', refs: 'Isaiah 7:14', prayer: 'O Emmanuel, our King and our Lawgiver, the Desire of all nations, and their Salvation: Come and save us, O Lord our God.' },
  ] },
  { id: 'immaculate-conception', name: 'Novena to the Immaculate Conception', blurb: 'Nine days from 29 November to 7 December, before the feast of the Immaculate Conception on 8 December.', days: [
    { title: 'Day 1: The promise', refs: 'Genesis 3:15', prayer: IMMACULATE },
    { title: 'Day 2: Full of grace', refs: 'Luke 1:26-28', prayer: IMMACULATE },
    { title: 'Day 3: Her yes', refs: 'Luke 1:29-38', prayer: IMMACULATE },
    { title: 'Day 4: Blessed among women', refs: 'Luke 1:39-45', prayer: IMMACULATE },
    { title: 'Day 5: Her song', refs: 'Luke 1:46-55', prayer: IMMACULATE },
    { title: 'Day 6: At Cana', refs: 'John 2:1-5', prayer: IMMACULATE },
    { title: 'Day 7: At the Cross', refs: 'John 19:25-27', prayer: IMMACULATE },
    { title: 'Day 8: The woman clothed with the sun', refs: 'Revelation 12:1-6', prayer: IMMACULATE },
    { title: 'Day 9: Chosen before the world began', refs: 'Ephesians 1:3-6', prayer: IMMACULATE },
  ] },
  { id: 'sacred-heart', name: 'Novena to the Sacred Heart', blurb: 'Nine days with the heart of Jesus, often prayed before the Solemnity of the Sacred Heart (the Friday after Corpus Christi) or at any time.', days: [
    { title: 'Day 1: A new heart', refs: 'Ezekiel 36:26-28', prayer: HEART },
    { title: 'Day 2: He knows our frame', refs: 'Psalm 103:8-14', prayer: HEART },
    { title: 'Day 3: Gentle and lowly of heart', refs: 'Matthew 11:28-30', prayer: HEART },
    { title: 'Day 4: Rivers of living water', refs: 'John 7:37-39', prayer: HEART },
    { title: 'Day 5: Abide in my love', refs: 'John 15:9-12', prayer: HEART },
    { title: 'Day 6: The pierced side', refs: 'John 19:31-37', prayer: HEART },
    { title: 'Day 7: The shepherd and the lost sheep', refs: 'Luke 15:1-7', prayer: HEART },
    { title: 'Day 8: The breadth and length and height', refs: 'Ephesians 3:14-19', prayer: HEART },
    { title: 'Day 9: God is love', refs: '1 John 4:7-16', prayer: HEART },
  ] },
];
