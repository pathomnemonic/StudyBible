/** More nine-day plans: a Scripture passage for each day, and a prayer written for this app (shown in the reader's translation). */
import type { PrayerPlan } from './novenas';

const GUADALUPE = 'Holy Mary, Mother of God and our mother, you appeared to St Juan Diego as one of his own people and asked for a church where you could show your love and compassion. Look on me and on everyone I carry in my heart. Take my troubles into your care, and lead me always to your Son. Our Lady of Guadalupe, pray for us.';
const THERESE = 'St Thérèse, little flower of Jesus, you showed that holiness is found in small things done with great love. Pray for me. Teach me to trust God as a child trusts a parent, to bear small sufferings with a smile, and to let my life be a quiet act of love. St Thérèse, pray for us.';
const FRANCIS = 'St Francis, brother of all creatures, you left everything to follow Christ in poverty and joy. Pray for me, that I may love God above all things, serve the poor, care for creation, and be an instrument of peace. St Francis, pray for us.';
const MONICA = 'St Monica, patient mother, you prayed and wept for your son until he came to God. Pray for me and for every parent who longs for a child to return to the faith. Teach us to trust that no prayer said in love is wasted. St Monica, pray for us.';
const SOULS = 'Eternal rest grant unto them, O Lord, and let perpetual light shine upon them. May the souls of all the faithful departed, through the mercy of God, rest in peace. Amen.';
const LOURDES = 'Immaculate Mother, you appeared at Lourdes to Bernadette and invited us to pray and do penance. Look with love on the sick and the suffering, and on all who care for them. Bring us comfort in our trials and peace to our hearts. Our Lady of Lourdes, pray for us.';
const MICHAEL = 'St Michael the Archangel, defend us in battle. Be our protection against the wickedness and snares of the devil. May God rebuke him, we humbly pray; and do thou, O prince of the heavenly host, by the power of God, thrust into hell Satan and all the evil spirits who prowl about the world seeking the ruin of souls. Amen.';
const FAMILY = 'Jesus, Mary and Joseph, holy family of Nazareth, bless our families. Make our homes places of prayer, patience and forgiveness. Teach us to love each other as you loved one another, and to welcome Christ in every guest. Holy Family, pray for us.';

export const EXTRA_PLANS: PrayerPlan[] = [
  { id: 'guadalupe', name: 'Novena to Our Lady of Guadalupe', blurb: 'Nine days ending on her feast, 12 December. She appeared to St Juan Diego in 1531 on the hill of Tepeyac, near Mexico City.', days: [
    { title: 'Day 1: The angel greets Mary', refs: 'Luke 1:26-38', prayer: GUADALUPE },
    { title: 'Day 2: Mary visits Elizabeth', refs: 'Luke 1:39-45', prayer: GUADALUPE },
    { title: 'Day 3: Mary’s song', refs: 'Luke 1:46-55', prayer: GUADALUPE },
    { title: 'Day 4: He has looked on the lowly', refs: 'Luke 1:46-50', prayer: GUADALUPE },
    { title: 'Day 5: Do whatever he tells you', refs: 'John 2:1-11', prayer: GUADALUPE },
    { title: 'Day 6: Who are my mother and brothers?', refs: 'Luke 8:19-21', prayer: GUADALUPE },
    { title: 'Day 7: Behold your mother', refs: 'John 19:25-27', prayer: GUADALUPE },
    { title: 'Day 8: Mary in the upper room', refs: 'Acts 1:12-14', prayer: GUADALUPE },
    { title: 'Day 9: The woman clothed with the sun', refs: 'Revelation 12:1-6', prayer: GUADALUPE },
  ] },
  { id: 'therese', name: 'Novena to St Thérèse', blurb: 'Nine days with the Little Flower, ending on her feast, 1 October. Thérèse promised to “spend my heaven doing good on earth”.', days: [
    { title: 'Day 1: Like a little child', refs: 'Matthew 18:1-5', prayer: THERESE },
    { title: 'Day 2: Come to me', refs: 'Matthew 11:25-30', prayer: THERESE },
    { title: 'Day 3: Love is the greatest', refs: '1 Corinthians 13:1-13', prayer: THERESE },
    { title: 'Day 4: Abiding in Christ', refs: 'John 15:1-11', prayer: THERESE },
    { title: 'Day 5: The little way of service', refs: 'Luke 16:10-13', prayer: THERESE },
    { title: 'Day 6: Strength in weakness', refs: '2 Corinthians 12:7-10', prayer: THERESE },
    { title: 'Day 7: The hidden life', refs: 'Colossians 3:1-4', prayer: THERESE },
    { title: 'Day 8: Pray without ceasing', refs: '1 Thessalonians 5:16-18', prayer: THERESE },
    { title: 'Day 9: A heart on fire', refs: 'Luke 24:28-32', prayer: THERESE },
  ] },
  { id: 'francis', name: 'Novena to St Francis of Assisi', blurb: 'Nine days ending on his feast, 4 October. A time to pray for peace, for the poor and for creation.', days: [
    { title: 'Day 1: Leave everything and follow me', refs: 'Matthew 19:16-22', prayer: FRANCIS },
    { title: 'Day 2: Do not worry', refs: 'Matthew 6:25-34', prayer: FRANCIS },
    { title: 'Day 3: Blessed are the poor in spirit', refs: 'Matthew 5:1-12', prayer: FRANCIS },
    { title: 'Day 4: The mission of the twelve', refs: 'Matthew 10:5-15', prayer: FRANCIS },
    { title: 'Day 5: Creation praises God', refs: 'Genesis 1:20-31', prayer: FRANCIS },
    { title: 'Day 6: Peacemakers', refs: 'Romans 12:14-21', prayer: FRANCIS },
    { title: 'Day 7: Care for the least', refs: 'Matthew 25:31-40', prayer: FRANCIS },
    { title: 'Day 8: The marks of Christ', refs: 'Galatians 6:14-18', prayer: FRANCIS },
    { title: 'Day 9: Rebuild my Church', refs: 'Ephesians 2:19-22', prayer: FRANCIS },
  ] },
  { id: 'monica', name: 'Novena to St Monica', blurb: 'Nine days for a loved one who has drifted from the faith, ending on her feast, 27 August. A novena for parents, spouses and friends.', days: [
    { title: 'Day 1: Do not lose heart', refs: 'Luke 18:1-8', prayer: MONICA },
    { title: 'Day 2: The father runs to meet his son', refs: 'Luke 15:11-24', prayer: MONICA },
    { title: 'Day 3: The shepherd seeks the lost', refs: 'Luke 15:1-7', prayer: MONICA },
    { title: 'Day 4: The woman and the unjust judge', refs: 'Luke 18:1-5', prayer: MONICA },
    { title: 'Day 5: Ask, seek, knock', refs: 'Matthew 7:7-11', prayer: MONICA },
    { title: 'Day 6: Tears and joy', refs: 'John 16:20-24', prayer: MONICA },
    { title: 'Day 7: The faith of a Canaanite mother', refs: 'Matthew 15:21-28', prayer: MONICA },
    { title: 'Day 8: A mother’s sorrow', refs: 'Luke 7:11-17', prayer: MONICA },
    { title: 'Day 9: Nothing can separate us', refs: 'Romans 8:35-39', prayer: MONICA },
  ] },
  { id: 'all-souls', name: 'Novena for the holy souls', blurb: 'Nine days of prayer for the dead, often begun on 24 October to end on All Souls’ Day, 2 November.', days: [
    { title: 'Day 1: The Lord is my shepherd', refs: 'Psalm 23', prayer: SOULS },
    { title: 'Day 2: The souls of the just', refs: 'Wisdom 3:1-9', prayer: SOULS },
    { title: 'Day 3: Judas Maccabeus prays for the dead', refs: '2 Maccabees 12:38-46', prayer: SOULS },
    { title: 'Day 4: Lazarus, come out', refs: 'John 11:17-27', prayer: SOULS },
    { title: 'Day 5: In my Father’s house', refs: 'John 14:1-6', prayer: SOULS },
    { title: 'Day 6: We shall be changed', refs: '1 Corinthians 15:51-57', prayer: SOULS },
    { title: 'Day 7: Do not grieve as others do', refs: '1 Thessalonians 4:13-18', prayer: SOULS },
    { title: 'Day 8: Purified as by fire', refs: '1 Corinthians 3:10-15', prayer: SOULS },
    { title: 'Day 9: A new heaven and a new earth', refs: 'Revelation 21:1-7', prayer: SOULS },
  ] },
  { id: 'lourdes', name: 'Novena to Our Lady of Lourdes', blurb: 'Nine days for the sick and for those who care for them, ending on her feast, 11 February. Our Lady appeared to St Bernadette in 1858.', days: [
    { title: 'Day 1: The Lord heals the broken-hearted', refs: 'Psalm 147:1-6', prayer: LOURDES },
    { title: 'Day 2: Jesus heals many', refs: 'Matthew 8:14-17', prayer: LOURDES },
    { title: 'Day 3: Your faith has made you well', refs: 'Mark 5:25-34', prayer: LOURDES },
    { title: 'Day 4: The man at the pool', refs: 'John 5:1-9', prayer: LOURDES },
    { title: 'Day 5: Come to the water', refs: 'Isaiah 55:1-3', prayer: LOURDES },
    { title: 'Day 6: Penance and conversion', refs: 'Luke 13:1-5', prayer: LOURDES },
    { title: 'Day 7: Bear one another’s burdens', refs: 'Galatians 6:1-5', prayer: LOURDES },
    { title: 'Day 8: Anointing the sick', refs: 'James 5:13-16', prayer: LOURDES },
    { title: 'Day 9: Mary, health of the sick', refs: 'John 2:1-5', prayer: LOURDES },
  ] },
  { id: 'michael', name: 'Novena to St Michael and the angels', blurb: 'Nine days with the angels, ending on the feast of the Archangels, 29 September, or at any time of struggle.', days: [
    { title: 'Day 1: Angels worship God', refs: 'Isaiah 6:1-8', prayer: MICHAEL },
    { title: 'Day 2: Michael and the dragon', refs: 'Revelation 12:7-12', prayer: MICHAEL },
    { title: 'Day 3: The angel guards the way', refs: 'Exodus 23:20-23', prayer: MICHAEL },
    { title: 'Day 4: Raphael, God heals', refs: 'Tobit 12:6-22', prayer: MICHAEL },
    { title: 'Day 5: Gabriel brings good news', refs: 'Luke 1:26-38', prayer: MICHAEL },
    { title: 'Day 6: Their angels see the Father', refs: 'Matthew 18:1-10', prayer: MICHAEL },
    { title: 'Day 7: The angel frees Peter', refs: 'Acts 12:1-11', prayer: MICHAEL },
    { title: 'Day 8: Ministering spirits', refs: 'Hebrews 1:5-14', prayer: MICHAEL },
    { title: 'Day 9: The armor of God', refs: 'Ephesians 6:10-18', prayer: MICHAEL },
  ] },
  { id: 'holy-family', name: 'Novena to the Holy Family', blurb: 'Nine days for families, ending on the Feast of the Holy Family, the Sunday in the octave of Christmas.', days: [
    { title: 'Day 1: A family at Nazareth', refs: 'Luke 2:39-40', prayer: FAMILY },
    { title: 'Day 2: Joseph takes Mary home', refs: 'Matthew 1:18-25', prayer: FAMILY },
    { title: 'Day 3: Jesus born in poverty', refs: 'Luke 2:1-7', prayer: FAMILY },
    { title: 'Day 4: The shepherds visit', refs: 'Luke 2:8-20', prayer: FAMILY },
    { title: 'Day 5: Simeon and Anna', refs: 'Luke 2:22-38', prayer: FAMILY },
    { title: 'Day 6: Flight into Egypt', refs: 'Matthew 2:13-23', prayer: FAMILY },
    { title: 'Day 7: Lost and found', refs: 'Luke 2:41-50', prayer: FAMILY },
    { title: 'Day 8: Obedient and growing', refs: 'Luke 2:51-52', prayer: FAMILY },
    { title: 'Day 9: Love in the household', refs: 'Colossians 3:12-21', prayer: FAMILY },
  ] },
];
