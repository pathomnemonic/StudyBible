/** Six more nine-day plans: a Scripture passage for each day, and a prayer written for this app (shown in the reader's translation). */
import type { PrayerPlan } from './novenas';

const PERPETUAL = 'Mother of Perpetual Help, you hold the Child Jesus and point us to him. In every need I run to you. Look on my troubles, give me patience, and keep me close to your Son. Our Lady of Perpetual Help, pray for us.';
const ANTHONY = 'St Anthony, faithful friend and teacher of the Gospel, you helped many find what was lost. Pray for me, that I may find again what I have lost, above all my peace and my trust in God, and that I may share with the poor what I have been given. St Anthony, pray for us.';
const JUDE = 'St Jude, apostle and servant of Christ, helper of those who feel they have nowhere left to turn, pray for me. Ask God to give me courage in hard things and hope when hope seems small. St Jude, pray for us.';
const MEDAL = 'Mary, conceived without sin, you gave a medal to St Catherine Labouré as a sign of your care. Pray for me and for all who wear it. Keep us close to your Son, and bring us home. O Mary, conceived without sin, pray for us who have recourse to you.';
const KING = 'Christ our King, your kingdom is truth and life, holiness and grace, justice, love and peace. Rule my heart and my home, my work and my country. Let your kingdom come, and your will be done on earth as in heaven.';
const AUGUSTINE = 'St Augustine, restless heart that found its rest in God, pray for me. Teach me to seek the truth with honesty, to turn from what is empty, and to love God with all my heart. St Augustine, pray for us.';

export const MORE_PLANS3: PrayerPlan[] = [
  { id: 'perpetual-help', name: 'Novena to Our Lady of Perpetual Help', blurb: 'Nine days with the icon of Mary and the Child. Often prayed on Tuesdays or ahead of her feast, 27 June.', days: [
    { title: 'Day 1: Mary says yes', refs: 'Luke 1:26-38', prayer: PERPETUAL },
    { title: 'Day 2: She goes in haste', refs: 'Luke 1:39-45', prayer: PERPETUAL },
    { title: 'Day 3: She keeps all these things', refs: 'Luke 2:15-19', prayer: PERPETUAL },
    { title: 'Day 4: A sword will pierce your soul', refs: 'Luke 2:22-35', prayer: PERPETUAL },
    { title: 'Day 5: They have no wine', refs: 'John 2:1-11', prayer: PERPETUAL },
    { title: 'Day 6: Standing at the cross', refs: 'John 19:25-27', prayer: PERPETUAL },
    { title: 'Day 7: Praying with the apostles', refs: 'Acts 1:12-14', prayer: PERPETUAL },
    { title: 'Day 8: Cast your cares on him', refs: '1 Peter 5:6-11', prayer: PERPETUAL },
    { title: 'Day 9: The Lord is my help', refs: 'Psalm 121', prayer: PERPETUAL },
  ] },
  { id: 'anthony', name: 'Novena to St Anthony of Padua', blurb: 'Nine days for what is lost, and for the poor, ending on his feast, 13 June.', days: [
    { title: 'Day 1: The lost sheep', refs: 'Luke 15:1-7', prayer: ANTHONY },
    { title: 'Day 2: The lost coin', refs: 'Luke 15:8-10', prayer: ANTHONY },
    { title: 'Day 3: The lost son', refs: 'Luke 15:11-24', prayer: ANTHONY },
    { title: 'Day 4: Where your treasure is', refs: 'Matthew 6:19-21', prayer: ANTHONY },
    { title: 'Day 5: Sell what you have', refs: 'Luke 12:32-34', prayer: ANTHONY },
    { title: 'Day 6: Go and preach', refs: 'Mark 16:15-20', prayer: ANTHONY },
    { title: 'Day 7: The word is near you', refs: 'Romans 10:8-15', prayer: ANTHONY },
    { title: 'Day 8: Let the little ones come', refs: 'Mark 10:13-16', prayer: ANTHONY },
    { title: 'Day 9: Joy in heaven', refs: 'Luke 15:25-32', prayer: ANTHONY },
  ] },
  { id: 'jude', name: 'Novena to St Jude', blurb: 'Nine days for hard cases and hopeless-seeming trials, ending on his feast, 28 October.', days: [
    { title: 'Day 1: Out of the depths', refs: 'Psalm 130', prayer: JUDE },
    { title: 'Day 2: The Lord is near the brokenhearted', refs: 'Psalm 34:15-22', prayer: JUDE },
    { title: 'Day 3: Do not be anxious', refs: 'Philippians 4:4-9', prayer: JUDE },
    { title: 'Day 4: Jude’s letter: keep yourselves in love', refs: 'Jude 1:17-25', prayer: JUDE },
    { title: 'Day 5: The storm is stilled', refs: 'Mark 4:35-41', prayer: JUDE },
    { title: 'Day 6: Hope against hope', refs: 'Romans 4:18-25', prayer: JUDE },
    { title: 'Day 7: My grace is enough', refs: '2 Corinthians 12:7-10', prayer: JUDE },
    { title: 'Day 8: Joy after sorrow', refs: 'Psalm 126', prayer: JUDE },
    { title: 'Day 9: The God of all comfort', refs: '2 Corinthians 1:3-7', prayer: JUDE },
  ] },
  { id: 'miraculous-medal', name: 'Novena to Our Lady of the Miraculous Medal', blurb: 'Nine days with Mary, ending on her feast, 27 November. She appeared to St Catherine Labouré in Paris in 1830.', days: [
    { title: 'Day 1: A woman and her offspring', refs: 'Genesis 3:14-15', prayer: MEDAL },
    { title: 'Day 2: Full of grace', refs: 'Luke 1:26-31', prayer: MEDAL },
    { title: 'Day 3: Blessed are you among women', refs: 'Luke 1:39-45', prayer: MEDAL },
    { title: 'Day 4: My soul magnifies the Lord', refs: 'Luke 1:46-55', prayer: MEDAL },
    { title: 'Day 5: Do whatever he tells you', refs: 'John 2:1-11', prayer: MEDAL },
    { title: 'Day 6: Behold your mother', refs: 'John 19:25-27', prayer: MEDAL },
    { title: 'Day 7: Mary and the Spirit', refs: 'Acts 1:12-14', prayer: MEDAL },
    { title: 'Day 8: A sign in heaven', refs: 'Revelation 12:1-6', prayer: MEDAL },
    { title: 'Day 9: She prays for us', refs: 'Hebrews 12:1-2', prayer: MEDAL },
  ] },
  { id: 'christ-the-king', name: 'Novena to Christ the King', blurb: 'Nine days ending on the Solemnity of Christ the King, the last Sunday of the Church’s year.', days: [
    { title: 'Day 1: The Lord is king', refs: 'Psalm 93', prayer: KING },
    { title: 'Day 2: Your king comes, humble', refs: 'Zechariah 9:9-10', prayer: KING },
    { title: 'Day 3: His kingdom will have no end', refs: 'Daniel 7:13-14', prayer: KING },
    { title: 'Day 4: My kingdom is not of this world', refs: 'John 18:33-37', prayer: KING },
    { title: 'Day 5: Remember me in your kingdom', refs: 'Luke 23:35-43', prayer: KING },
    { title: 'Day 6: The image of the invisible God', refs: 'Colossians 1:12-20', prayer: KING },
    { title: 'Day 7: He must reign', refs: '1 Corinthians 15:20-28', prayer: KING },
    { title: 'Day 8: The Shepherd King', refs: 'Ezekiel 34:11-16', prayer: KING },
    { title: 'Day 9: King of kings', refs: 'Revelation 19:11-16', prayer: KING },
  ] },
  { id: 'augustine', name: 'Novena to St Augustine', blurb: 'Nine days for restless hearts and anyone searching for truth, ending on his feast, 28 August.', days: [
    { title: 'Day 1: You made us for yourself', refs: 'Psalm 63:1-8', prayer: AUGUSTINE },
    { title: 'Day 2: Seek and you will find', refs: 'Matthew 7:7-11', prayer: AUGUSTINE },
    { title: 'Day 3: Take and read', refs: 'Romans 13:11-14', prayer: AUGUSTINE },
    { title: 'Day 4: Come to me, all who labour', refs: 'Matthew 11:25-30', prayer: AUGUSTINE },
    { title: 'Day 5: The truth will set you free', refs: 'John 8:31-36', prayer: AUGUSTINE },
    { title: 'Day 6: Love, and do what you will', refs: '1 John 4:7-12', prayer: AUGUSTINE },
    { title: 'Day 7: A tear and a prayer', refs: 'Luke 7:11-17', prayer: AUGUSTINE },
    { title: 'Day 8: Late have I loved you', refs: 'Song of Songs 2:8-14', prayer: AUGUSTINE },
    { title: 'Day 9: Our heart is restless', refs: 'Romans 8:28-39', prayer: AUGUSTINE },
  ] },
];
