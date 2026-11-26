import type { DeepPrompt } from './deepWaters';

/**
 * The second hand-written batch: long open lists (50 to 140 answers each) with a real long tail, chosen one answer at a time and spread over six rarity
 * tiers. None of these is generated from a template. They are open: the game says "not on our list" for an unlisted answer, never "wrong".
 * Every one is unreviewed by a person (see src/data/deepWaters.review.json). Tiers are editorial judgement of familiarity, not survey data.
 */
export const LONG_LIST_PROMPTS: DeepPrompt[] = [
 {
  "id": "authored-latin-worship",
  "theme": "liturgy",
  "basis": "Hand-authored; Roman Missal, Liturgy of the Hours, Graduale Romanum and common Latin hymns.",
  "prompt": "Name a Latin word or phrase used in Catholic worship.",
  "context": "Words and prayers of the Mass, the Hours, hymns and church announcements, in Latin.",
  "answers": [
   {
    "answer": "Kyrie eleison",
    "tier": 1,
    "aliases": [
     "Kyrie"
    ]
   },
   {
    "answer": "Gloria in excelsis Deo",
    "tier": 1,
    "aliases": [
     "Gloria in excelsis",
     "Gloria"
    ]
   },
   {
    "answer": "Credo",
    "tier": 2
   },
   {
    "answer": "Sanctus",
    "tier": 2
   },
   {
    "answer": "Credo in unum Deum",
    "tier": 3
   },
   {
    "answer": "Benedictus",
    "tier": 3
   },
   {
    "answer": "Agnus Dei",
    "tier": 1
   },
   {
    "answer": "Pater noster",
    "tier": 1
   },
   {
    "answer": "Ave Maria",
    "tier": 1
   },
   {
    "answer": "Dominus vobiscum",
    "tier": 2
   },
   {
    "answer": "Et cum spiritu tuo",
    "tier": 2
   },
   {
    "answer": "Ite missa est",
    "tier": 2
   },
   {
    "answer": "Deo gratias",
    "tier": 2
   },
   {
    "answer": "Per Christum Dominum nostrum",
    "tier": 4
   },
   {
    "answer": "Amen",
    "tier": 1
   },
   {
    "answer": "Alleluia",
    "tier": 1
   },
   {
    "answer": "Hosanna in excelsis",
    "tier": 3,
    "aliases": [
     "Hosanna"
    ]
   },
   {
    "answer": "Confiteor",
    "tier": 2
   },
   {
    "answer": "Mea culpa",
    "tier": 1,
    "aliases": [
     "Mea maxima culpa"
    ]
   },
   {
    "answer": "Orate fratres",
    "tier": 3
   },
   {
    "answer": "Sursum corda",
    "tier": 3
   },
   {
    "answer": "Habemus ad Dominum",
    "tier": 5
   },
   {
    "answer": "Dignum et iustum est",
    "tier": 5,
    "aliases": [
     "Vere dignum et iustum est"
    ]
   },
   {
    "answer": "Lumen Christi",
    "tier": 3
   },
   {
    "answer": "Exsultet",
    "tier": 3,
    "aliases": [
     "Exultet"
    ]
   },
   {
    "answer": "Magnificat",
    "tier": 2
   },
   {
    "answer": "Nunc dimittis",
    "tier": 3
   },
   {
    "answer": "Te Deum",
    "tier": 2
   },
   {
    "answer": "Salve Regina",
    "tier": 1
   },
   {
    "answer": "Regina caeli",
    "tier": 2,
    "aliases": [
     "Regina coeli"
    ]
   },
   {
    "answer": "Ave Maris Stella",
    "tier": 4
   },
   {
    "answer": "Veni Creator Spiritus",
    "tier": 2
   },
   {
    "answer": "Veni Sancte Spiritus",
    "tier": 3
   },
   {
    "answer": "Pange lingua",
    "tier": 3
   },
   {
    "answer": "Tantum ergo",
    "tier": 2
   },
   {
    "answer": "O salutaris hostia",
    "tier": 3
   },
   {
    "answer": "Adoro te devote",
    "tier": 4
   },
   {
    "answer": "Stabat Mater",
    "tier": 2
   },
   {
    "answer": "Dies irae",
    "tier": 2
   },
   {
    "answer": "Requiem aeternam",
    "tier": 2,
    "aliases": [
     "Requiem"
    ]
   },
   {
    "answer": "In paradisum",
    "tier": 4
   },
   {
    "answer": "Libera me",
    "tier": 5
   },
   {
    "answer": "Miserere",
    "tier": 3
   },
   {
    "answer": "De profundis",
    "tier": 3
   },
   {
    "answer": "Asperges me",
    "tier": 4
   },
   {
    "answer": "Vidi aquam",
    "tier": 5
   },
   {
    "answer": "Introitus",
    "tier": 5
   },
   {
    "answer": "Domine non sum dignus",
    "tier": 2
   },
   {
    "answer": "Ecce Agnus Dei",
    "tier": 3
   },
   {
    "answer": "Corpus Christi",
    "tier": 1
   },
   {
    "answer": "Hoc est enim corpus meum",
    "tier": 3
   },
   {
    "answer": "Mysterium fidei",
    "tier": 4
   },
   {
    "answer": "Pax Domini sit semper vobiscum",
    "tier": 4,
    "aliases": [
     "Pax Domini"
    ]
   },
   {
    "answer": "Gloria Patri",
    "tier": 2
   },
   {
    "answer": "Sicut erat in principio",
    "tier": 5
   },
   {
    "answer": "Domine labia mea aperies",
    "tier": 5
   },
   {
    "answer": "Deus in adiutorium meum intende",
    "tier": 5
   },
   {
    "answer": "Laudate Dominum",
    "tier": 3
   },
   {
    "answer": "Laus Deo",
    "tier": 4
   },
   {
    "answer": "Ad maiorem Dei gloriam",
    "tier": 2,
    "aliases": [
     "AMDG"
    ]
   },
   {
    "answer": "In nomine Patris",
    "tier": 2,
    "aliases": [
     "In nomine Patris et Filii et Spiritus Sancti"
    ]
   },
   {
    "answer": "Pax vobiscum",
    "tier": 2
   },
   {
    "answer": "Pax Christi",
    "tier": 3
   },
   {
    "answer": "Oremus",
    "tier": 2
   },
   {
    "answer": "Tu es Petrus",
    "tier": 3
   },
   {
    "answer": "Ubi caritas",
    "tier": 3,
    "aliases": [
     "Ubi caritas et amor"
    ]
   },
   {
    "answer": "Adeste fideles",
    "tier": 2
   },
   {
    "answer": "Veni Emmanuel",
    "tier": 4
   },
   {
    "answer": "Gaudete",
    "tier": 3
   },
   {
    "answer": "Rorate caeli",
    "tier": 4
   },
   {
    "answer": "Puer natus est",
    "tier": 5
   },
   {
    "answer": "Panis angelicus",
    "tier": 2
   },
   {
    "answer": "Ave verum corpus",
    "tier": 2
   },
   {
    "answer": "Sub tuum praesidium",
    "tier": 3
   },
   {
    "answer": "Memorare",
    "tier": 2
   },
   {
    "answer": "Anima Christi",
    "tier": 3
   },
   {
    "answer": "Suscipe",
    "tier": 5
   },
   {
    "answer": "Laudes",
    "tier": 3
   },
   {
    "answer": "Missale Romanum",
    "tier": 4
   },
   {
    "answer": "Lectio divina",
    "tier": 2
   },
   {
    "answer": "In persona Christi",
    "tier": 4
   },
   {
    "answer": "Ex opere operato",
    "tier": 3
   },
   {
    "answer": "Ex cathedra",
    "tier": 1
   },
   {
    "answer": "Sede vacante",
    "tier": 2
   },
   {
    "answer": "Habemus papam",
    "tier": 1
   },
   {
    "answer": "Urbi et orbi",
    "tier": 1
   },
   {
    "answer": "Motu proprio",
    "tier": 2
   },
   {
    "answer": "Nihil obstat",
    "tier": 3
   },
   {
    "answer": "Imprimatur",
    "tier": 3
   },
   {
    "answer": "Ad limina",
    "tier": 4
   },
   {
    "answer": "Ad orientem",
    "tier": 3
   },
   {
    "answer": "Versus populum",
    "tier": 4
   },
   {
    "answer": "Pie Jesu",
    "tier": 3
   },
   {
    "answer": "Introibo ad altare Dei",
    "tier": 4
   },
   {
    "answer": "Lavabo",
    "tier": 5
   },
   {
    "answer": "Vexilla regis",
    "tier": 4
   },
   {
    "answer": "O filii et filiae",
    "tier": 4
   },
   {
    "answer": "Victimae paschali laudes",
    "tier": 4
   },
   {
    "answer": "Benedicamus Domino",
    "tier": 4
   },
   {
    "answer": "Te lucis ante terminum",
    "tier": 5
   },
   {
    "answer": "Christus vincit",
    "tier": 5
   },
   {
    "answer": "Crux fidelis",
    "tier": 6
   },
   {
    "answer": "Salve festa dies",
    "tier": 6
   },
   {
    "answer": "Suscipiat Dominus",
    "tier": 6
   },
   {
    "answer": "Christus natus est",
    "tier": 6
   }
  ]
 },
 {
  "id": "authored-heresies",
  "theme": "church-history",
  "basis": "Hand-authored; the decrees of the ecumenical councils, Denzinger-Hünermann and standard Church histories.",
  "prompt": "Name a heresy or doctrinal error the Church has condemned.",
  "context": "Teachings rejected by a council or a pope, from the early Church to the modern era.",
  "answers": [
   {
    "answer": "Arianism",
    "tier": 1
   },
   {
    "answer": "Docetism",
    "tier": 3
   },
   {
    "answer": "Semi-Arianism",
    "tier": 5,
    "aliases": [
     "Homoiousianism"
    ]
   },
   {
    "answer": "Gnosticism",
    "tier": 1
   },
   {
    "answer": "Marcionism",
    "tier": 3
   },
   {
    "answer": "Montanism",
    "tier": 3
   },
   {
    "answer": "Sabellianism",
    "tier": 3,
    "aliases": [
     "Modalism"
    ]
   },
   {
    "answer": "Adoptionism",
    "tier": 3
   },
   {
    "answer": "Monarchianism",
    "tier": 5
   },
   {
    "answer": "Donatism",
    "tier": 2
   },
   {
    "answer": "Pelagianism",
    "tier": 1
   },
   {
    "answer": "Semi-Pelagianism",
    "tier": 3
   },
   {
    "answer": "Nestorianism",
    "tier": 2
   },
   {
    "answer": "Monophysitism",
    "tier": 2
   },
   {
    "answer": "Eutychianism",
    "tier": 4
   },
   {
    "answer": "Apollinarianism",
    "tier": 4,
    "aliases": [
     "Apollinarism"
    ]
   },
   {
    "answer": "Monothelitism",
    "tier": 3
   },
   {
    "answer": "Monoenergism",
    "tier": 6
   },
   {
    "answer": "Iconoclasm",
    "tier": 2
   },
   {
    "answer": "Manichaeism",
    "tier": 2,
    "aliases": [
     "Manichaeanism",
     "Manicheism"
    ]
   },
   {
    "answer": "Priscillianism",
    "tier": 5
   },
   {
    "answer": "Novatianism",
    "tier": 4
   },
   {
    "answer": "Ebionitism",
    "tier": 5
   },
   {
    "answer": "Patripassianism",
    "tier": 5
   },
   {
    "answer": "Subordinationism",
    "tier": 4
   },
   {
    "answer": "Macedonianism",
    "tier": 5,
    "aliases": [
     "Pneumatomachianism"
    ]
   },
   {
    "answer": "Photinianism",
    "tier": 6
   },
   {
    "answer": "Origenism",
    "tier": 4
   },
   {
    "answer": "Encratism",
    "tier": 6
   },
   {
    "answer": "Millenarianism",
    "tier": 4,
    "aliases": [
     "Chiliasm"
    ]
   },
   {
    "answer": "Tritheism",
    "tier": 5
   },
   {
    "answer": "Valentinianism",
    "tier": 4
   },
   {
    "answer": "Basilidianism",
    "tier": 6
   },
   {
    "answer": "Paulicianism",
    "tier": 6
   },
   {
    "answer": "Bogomilism",
    "tier": 5
   },
   {
    "answer": "Catharism",
    "tier": 2,
    "aliases": [
     "Albigensianism",
     "Albigensian heresy"
    ]
   },
   {
    "answer": "Waldensianism",
    "tier": 3
   },
   {
    "answer": "Joachimism",
    "tier": 6
   },
   {
    "answer": "Fraticelli",
    "tier": 6
   },
   {
    "answer": "Free Spirit",
    "tier": 6,
    "aliases": [
     "Brethren of the Free Spirit"
    ]
   },
   {
    "answer": "Hussitism",
    "tier": 3
   },
   {
    "answer": "Lollardy",
    "tier": 3,
    "aliases": [
     "Wycliffism"
    ]
   },
   {
    "answer": "Conciliarism",
    "tier": 4
   },
   {
    "answer": "Gallicanism",
    "tier": 3
   },
   {
    "answer": "Jansenism",
    "tier": 2
   },
   {
    "answer": "Quietism",
    "tier": 4
   },
   {
    "answer": "Baianism",
    "tier": 6
   },
   {
    "answer": "Febronianism",
    "tier": 6
   },
   {
    "answer": "Fideism",
    "tier": 5
   },
   {
    "answer": "Traditionalism",
    "tier": 6
   },
   {
    "answer": "Ontologism",
    "tier": 6
   },
   {
    "answer": "Semirationalism",
    "tier": 6
   },
   {
    "answer": "Hermesianism",
    "tier": 6
   },
   {
    "answer": "Rationalism",
    "tier": 4
   },
   {
    "answer": "Modernism",
    "tier": 2
   },
   {
    "answer": "Americanism",
    "tier": 4
   },
   {
    "answer": "Indifferentism",
    "tier": 4
   },
   {
    "answer": "Pantheism",
    "tier": 4
   },
   {
    "answer": "Antinomianism",
    "tier": 5
   },
   {
    "answer": "Socinianism",
    "tier": 5
   },
   {
    "answer": "Unitarianism",
    "tier": 3
   },
   {
    "answer": "Audianism",
    "tier": 6
   },
   {
    "answer": "Deism",
    "tier": 4
   }
  ]
 },
 {
  "id": "authored-catholic-classics",
  "theme": "church-history",
  "basis": "Hand-authored; standard lists of Catholic spiritual and theological classics.",
  "prompt": "Name a classic work of Catholic theology or spirituality.",
  "context": "Books by saints, Doctors, Fathers and modern authors that Catholics have long read.",
  "answers": [
   {
    "answer": "Confessions",
    "tier": 1
   },
   {
    "answer": "City of God",
    "tier": 1
   },
   {
    "answer": "Summa Theologiae",
    "tier": 1,
    "aliases": [
     "Summa Theologica",
     "Summa"
    ]
   },
   {
    "answer": "The Imitation of Christ",
    "tier": 1,
    "aliases": [
     "Imitation of Christ"
    ]
   },
   {
    "answer": "Summa contra Gentiles",
    "tier": 3
   },
   {
    "answer": "Introduction to the Devout Life",
    "tier": 2
   },
   {
    "answer": "Story of a Soul",
    "tier": 1
   },
   {
    "answer": "Interior Castle",
    "tier": 2
   },
   {
    "answer": "The Way of Perfection",
    "tier": 3
   },
   {
    "answer": "The Book of Her Life",
    "tier": 4,
    "aliases": [
     "Life of Teresa of Avila"
    ]
   },
   {
    "answer": "Dark Night of the Soul",
    "tier": 2,
    "aliases": [
     "Dark Night"
    ]
   },
   {
    "answer": "Ascent of Mount Carmel",
    "tier": 4
   },
   {
    "answer": "Spiritual Canticle",
    "tier": 4
   },
   {
    "answer": "Living Flame of Love",
    "tier": 5
   },
   {
    "answer": "Spiritual Exercises",
    "tier": 1
   },
   {
    "answer": "The Rule of Saint Benedict",
    "tier": 1,
    "aliases": ["Rule of Benedict"]
   },
   {
    "answer": "Rule of Saint Augustine",
    "tier": 4
   },
   {
    "answer": "The Dialogue",
    "tier": 3,
    "aliases": [
     "Dialogue of Saint Catherine of Siena"
    ]
   },
   {
    "answer": "Revelations of Divine Love",
    "tier": 3
   },
   {
    "answer": "The Cloud of Unknowing",
    "tier": 3
   },
   {
    "answer": "Divine Comedy",
    "tier": 1,
    "aliases": [
     "The Divine Comedy"
    ]
   },
   {
    "answer": "Pensees",
    "tier": 3,
    "aliases": [
     "Pascal's Pensees"
    ]
   },
   {
    "answer": "Apologia Pro Vita Sua",
    "tier": 3,
    "aliases": [
     "Apologia"
    ]
   },
   {
    "answer": "Grammar of Assent",
    "tier": 5,
    "aliases": [
     "An Essay in Aid of a Grammar of Assent"
    ]
   },
   {
    "answer": "The Idea of a University",
    "tier": 4,
    "aliases": [
     "Idea of a University"
    ]
   },
   {
    "answer": "The Everlasting Man",
    "tier": 4
   },
   {
    "answer": "The Seven Storey Mountain",
    "tier": 2
   },
   {
    "answer": "The Spirit of the Liturgy",
    "tier": 3
   },
   {
    "answer": "Introduction to Christianity",
    "tier": 3
   },
   {
    "answer": "Jesus of Nazareth",
    "tier": 3
   },
   {
    "answer": "Catechism of the Catholic Church",
    "tier": 1
   },
   {
    "answer": "Roman Catechism",
    "tier": 4,
    "aliases": [
     "Catechism of the Council of Trent"
    ]
   },
   {
    "answer": "Catechism of Saint Pius X",
    "tier": 5
   },
   {
    "answer": "Against Heresies",
    "tier": 3,
    "aliases": [
     "Adversus Haereses"
    ]
   },
   {
    "answer": "On the Incarnation",
    "tier": 3
   },
   {
    "answer": "Life of Antony",
    "tier": 3,
    "aliases": [
     "Life of Saint Anthony"
    ]
   },
   {
    "answer": "Ecclesiastical History",
    "tier": 4,
    "aliases": [
     "History of the Church"
    ]
   },
   {
    "answer": "On the Trinity",
    "tier": 3,
    "aliases": [
     "De Trinitate"
    ]
   },
   {
    "answer": "On Christian Doctrine",
    "tier": 4
   },
   {
    "answer": "Enchiridion",
    "tier": 6
   },
   {
    "answer": "Retractions",
    "tier": 6
   },
   {
    "answer": "Moralia in Job",
    "tier": 6
   },
   {
    "answer": "Pastoral Care",
    "tier": 4,
    "aliases": [
     "Pastoral Rule"
    ]
   },
   {
    "answer": "Dialogues of Gregory the Great",
    "tier": 5
   },
   {
    "answer": "The Sentences",
    "tier": 5,
    "aliases": [
     "Four Books of Sentences"
    ]
   },
   {
    "answer": "Proslogion",
    "tier": 4
   },
   {
    "answer": "Cur Deus Homo",
    "tier": 4
   },
   {
    "answer": "Monologion",
    "tier": 6
   },
   {
    "answer": "The Journey of the Mind into God",
    "tier": 5,
    "aliases": [
     "Itinerarium mentis in Deum"
    ]
   },
   {
    "answer": "Little Flowers of Saint Francis",
    "tier": 3,
    "aliases": [
     "Fioretti",
     "The Little Flowers"
    ]
   },
   {
    "answer": "Sic et Non",
    "tier": 6
   },
   {
    "answer": "Scivias",
    "tier": 4
   },
   {
    "answer": "Sermons on the Song of Songs",
    "tier": 5
   },
   {
    "answer": "On Loving God",
    "tier": 5
   },
   {
    "answer": "The Practice of the Presence of God",
    "tier": 3
   },
   {
    "answer": "True Devotion to Mary",
    "tier": 3
   },
   {
    "answer": "The Secret of Mary",
    "tier": 5
   },
   {
    "answer": "The Glories of Mary",
    "tier": 4
   },
   {
    "answer": "The Spiritual Combat",
    "tier": 4
   },
   {
    "answer": "Treatise on the Love of God",
    "tier": 5
   },
   {
    "answer": "Abandonment to Divine Providence",
    "tier": 4
   },
   {
    "answer": "Divine Mercy in My Soul",
    "tier": 2,
    "aliases": [
     "Diary of Saint Faustina",
     "Diary of Faustina"
    ]
   },
   {
    "answer": "The Way",
    "tier": 3,
    "aliases": [
     "Camino"
    ]
   },
   {
    "answer": "Furrow",
    "tier": 5
   },
   {
    "answer": "The Forge",
    "tier": 6
   },
   {
    "answer": "Love and Responsibility",
    "tier": 4
   },
   {
    "answer": "Theology of the Body",
    "tier": 2
   },
   {
    "answer": "Crossing the Threshold of Hope",
    "tier": 4
   },
   {
    "answer": "The Spirit of Catholicism",
    "tier": 5
   },
   {
    "answer": "The Lord",
    "tier": 4
   },
   {
    "answer": "Sayings of the Desert Fathers",
    "tier": 4
   },
   {
    "answer": "The Ladder of Divine Ascent",
    "tier": 4
   },
   {
    "answer": "Catena Aurea",
    "tier": 4
   },
   {
    "answer": "On Being and Essence",
    "tier": 6
   },
   {
    "answer": "The Life of Moses",
    "tier": 6
   },
   {
    "answer": "Testament of Saint Francis",
    "tier": 6
   }
  ]
 },
 {
  "id": "authored-calendar-saints",
  "theme": "saints",
  "basis": "Hand-authored; General Roman Calendar of the Roman Missal (third typical edition and later decrees).",
  "prompt": "Name a saint with a memorial or feast in the General Roman Calendar.",
  "context": "Obligatory and optional memorials and saints' feasts, not solemnities.",
  "answers": [
   {
    "answer": "Basil the Great",
    "tier": 2,
    "aliases": [
     "Basil"
    ]
   },
   {
    "answer": "Gregory Nazianzen",
    "tier": 4,
    "aliases": [
     "Gregory of Nazianzus"
    ]
   },
   {
    "answer": "Hilary of Poitiers",
    "tier": 5,
    "aliases": [
     "Hilary"
    ]
   },
   {
    "answer": "Raymond of Penyafort",
    "tier": 6
   },
   {
    "answer": "Anthony the Abbot",
    "tier": 3,
    "aliases": [
     "Anthony of Egypt",
     "Anthony of the Desert",
     "Anthony the Great"
    ]
   },
   {
    "answer": "Fabian",
    "tier": 6
   },
   {
    "answer": "Sebastian",
    "tier": 2
   },
   {
    "answer": "Agnes",
    "tier": 2
   },
   {
    "answer": "Vincent of Saragossa",
    "tier": 5,
    "aliases": [
     "Vincent of Zaragoza",
     "Vincent"
    ]
   },
   {
    "answer": "Francis de Sales",
    "tier": 3
   },
   {
    "answer": "Timothy",
    "tier": 3
   },
   {
    "answer": "Titus",
    "tier": 4
   },
   {
    "answer": "Angela Merici",
    "tier": 5
   },
   {
    "answer": "Thomas Aquinas",
    "tier": 1
   },
   {
    "answer": "John Bosco",
    "tier": 2,
    "aliases": [
     "Don Bosco"
    ]
   },
   {
    "answer": "Agatha",
    "tier": 2
   },
   {
    "answer": "Paul Miki",
    "tier": 5
   },
   {
    "answer": "Jerome Emiliani",
    "tier": 6
   },
   {
    "answer": "Scholastica",
    "tier": 2
   },
   {
    "answer": "Cyril and Methodius",
    "tier": 3
   },
   {
    "answer": "Seven Holy Founders of the Servite Order",
    "tier": 6,
    "aliases": [
     "Servite Founders"
    ]
   },
   {
    "answer": "Polycarp",
    "tier": 3
   },
   {
    "answer": "Peter Damian",
    "tier": 5
   },
   {
    "answer": "Casimir",
    "tier": 5
   },
   {
    "answer": "Perpetua",
    "tier": 2
   },
   {
    "answer": "Felicity",
    "tier": 3
   },
   {
    "answer": "John of God",
    "tier": 4
   },
   {
    "answer": "Frances of Rome",
    "tier": 5
   },
   {
    "answer": "Patrick",
    "tier": 1
   },
   {
    "answer": "Cyril of Jerusalem",
    "tier": 5
   },
   {
    "answer": "Joseph",
    "tier": 1
   },
   {
    "answer": "Turibius of Mogrovejo",
    "tier": 6
   },
   {
    "answer": "Francis of Paola",
    "tier": 5
   },
   {
    "answer": "Isidore of Seville",
    "tier": 4
   },
   {
    "answer": "Vincent Ferrer",
    "tier": 4
   },
   {
    "answer": "John Baptist de La Salle",
    "tier": 4
   },
   {
    "answer": "Stanislaus",
    "tier": 5
   },
   {
    "answer": "Martin I",
    "tier": 6
   },
   {
    "answer": "Anselm",
    "tier": 3,
    "aliases": [
     "Anselm of Canterbury"
    ]
   },
   {
    "answer": "George",
    "tier": 2
   },
   {
    "answer": "Adalbert",
    "tier": 6
   },
   {
    "answer": "Fidelis of Sigmaringen",
    "tier": 6
   },
   {
    "answer": "Mark",
    "tier": 2
   },
   {
    "answer": "Peter Chanel",
    "tier": 6
   },
   {
    "answer": "Louis de Montfort",
    "tier": 5,
    "aliases": [
     "Louis Grignion de Montfort"
    ]
   },
   {
    "answer": "Catherine of Siena",
    "tier": 1
   },
   {
    "answer": "Pius V",
    "tier": 5
   },
   {
    "answer": "Joseph the Worker",
    "tier": 2
   },
   {
    "answer": "Athanasius",
    "tier": 3
   },
   {
    "answer": "Philip",
    "tier": 3
   },
   {
    "answer": "James the Less",
    "tier": 3
   },
   {
    "answer": "Matthias",
    "tier": 3
   },
   {
    "answer": "Nereus and Achilleus",
    "tier": 6
   },
   {
    "answer": "Pancras",
    "tier": 5
   },
   {
    "answer": "John I",
    "tier": 6
   },
   {
    "answer": "Bernardine of Siena",
    "tier": 4
   },
   {
    "answer": "Christopher Magallanes",
    "tier": 6
   },
   {
    "answer": "Bede",
    "tier": 3,
    "aliases": [
     "The Venerable Bede"
    ]
   },
   {
    "answer": "Gregory VII",
    "tier": 5
   },
   {
    "answer": "Mary Magdalene de' Pazzi",
    "tier": 6
   },
   {
    "answer": "Philip Neri",
    "tier": 3
   },
   {
    "answer": "Augustine of Canterbury",
    "tier": 4
   },
   {
    "answer": "Paul VI",
    "tier": 3
   },
   {
    "answer": "Justin Martyr",
    "tier": 3,
    "aliases": [
     "Justin"
    ]
   },
   {
    "answer": "Marcellinus and Peter",
    "tier": 6
   },
   {
    "answer": "Charles Lwanga",
    "tier": 4
   },
   {
    "answer": "Boniface",
    "tier": 3
   },
   {
    "answer": "Norbert",
    "tier": 5
   },
   {
    "answer": "Ephrem",
    "tier": 5,
    "aliases": [
     "Ephrem the Syrian"
    ]
   },
   {
    "answer": "Barnabas",
    "tier": 2
   },
   {
    "answer": "Anthony of Padua",
    "tier": 1
   },
   {
    "answer": "Romuald",
    "tier": 6
   },
   {
    "answer": "Aloysius Gonzaga",
    "tier": 3
   },
   {
    "answer": "Paulinus of Nola",
    "tier": 5
   },
   {
    "answer": "John Fisher",
    "tier": 4
   },
   {
    "answer": "Thomas More",
    "tier": 1
   },
   {
    "answer": "Cyril of Alexandria",
    "tier": 5
   },
   {
    "answer": "Irenaeus",
    "tier": 4
   },
   {
    "answer": "First Martyrs of the Church of Rome",
    "tier": 6
   },
   {
    "answer": "Thomas",
    "tier": 2
   },
   {
    "answer": "Elizabeth of Portugal",
    "tier": 5
   },
   {
    "answer": "Anthony Zaccaria",
    "tier": 6
   },
   {
    "answer": "Maria Goretti",
    "tier": 2
   },
   {
    "answer": "Benedict",
    "tier": 1
   },
   {
    "answer": "Henry",
    "tier": 5
   },
   {
    "answer": "Camillus de Lellis",
    "tier": 5
   },
   {
    "answer": "Bonaventure",
    "tier": 3
   },
   {
    "answer": "Apollinaris",
    "tier": 6
   },
   {
    "answer": "Lawrence of Brindisi",
    "tier": 5
   },
   {
    "answer": "Mary Magdalene",
    "tier": 1
   },
   {
    "answer": "Bridget of Sweden",
    "tier": 4,
    "aliases": [
     "Bridget"
    ]
   },
   {
    "answer": "James",
    "tier": 2
   },
   {
    "answer": "Joachim",
    "tier": 3
   },
   {
    "answer": "Anne",
    "tier": 2
   },
   {
    "answer": "Martha",
    "tier": 3
   },
   {
    "answer": "Lazarus",
    "tier": 4
   },
   {
    "answer": "Peter Chrysologus",
    "tier": 6
   },
   {
    "answer": "Ignatius of Loyola",
    "tier": 1
   },
   {
    "answer": "Alphonsus Liguori",
    "tier": 3
   },
   {
    "answer": "Eusebius of Vercelli",
    "tier": 6
   },
   {
    "answer": "Peter Julian Eymard",
    "tier": 6
   },
   {
    "answer": "John Vianney",
    "tier": 2,
    "aliases": [
     "Curé d'Ars",
     "Cure of Ars"
    ]
   },
   {
    "answer": "Dominic",
    "tier": 1
   },
   {
    "answer": "Teresa Benedicta of the Cross",
    "tier": 3,
    "aliases": [
     "Edith Stein"
    ]
   },
   {
    "answer": "Lawrence",
    "tier": 2
   },
   {
    "answer": "Clare",
    "tier": 2,
    "aliases": [
     "Clare of Assisi"
    ]
   },
   {
    "answer": "Pontian",
    "tier": 6
   },
   {
    "answer": "Hippolytus",
    "tier": 5
   },
   {
    "answer": "Maximilian Kolbe",
    "tier": 2
   },
   {
    "answer": "Stephen of Hungary",
    "tier": 5
   },
   {
    "answer": "Jane Frances de Chantal",
    "tier": 5
   },
   {
    "answer": "John Eudes",
    "tier": 6
   },
   {
    "answer": "Bernard",
    "tier": 3,
    "aliases": [
     "Bernard of Clairvaux"
    ]
   },
   {
    "answer": "Pius X",
    "tier": 3
   },
   {
    "answer": "Rose of Lima",
    "tier": 3
   },
   {
    "answer": "Bartholomew",
    "tier": 3
   },
   {
    "answer": "Louis IX",
    "tier": 3,
    "aliases": [
     "Louis of France"
    ]
   },
   {
    "answer": "Joseph Calasanz",
    "tier": 6
   },
   {
    "answer": "Monica",
    "tier": 2
   },
   {
    "answer": "Augustine",
    "tier": 1,
    "aliases": [
     "Augustine of Hippo"
    ]
   },
   {
    "answer": "Gregory the Great",
    "tier": 2
   },
   {
    "answer": "Peter Claver",
    "tier": 4
   },
   {
    "answer": "Robert Bellarmine",
    "tier": 4
   },
   {
    "answer": "Januarius",
    "tier": 5,
    "aliases": [
     "Gennaro"
    ]
   },
   {
    "answer": "Matthew",
    "tier": 2
   },
   {
    "answer": "Andrew Kim Taegon",
    "tier": 5
   },
   {
    "answer": "Pius of Pietrelcina",
    "tier": 2,
    "aliases": [
     "Padre Pio"
    ]
   },
   {
    "answer": "Vincent de Paul",
    "tier": 2
   },
   {
    "answer": "Wenceslaus",
    "tier": 4,
    "aliases": [
     "Wenceslas"
    ]
   },
   {
    "answer": "Lawrence Ruiz",
    "tier": 5,
    "aliases": [
     "Lorenzo Ruiz"
    ]
   },
   {
    "answer": "Michael",
    "tier": 1
   },
   {
    "answer": "Gabriel",
    "tier": 2
   },
   {
    "answer": "Raphael",
    "tier": 2
   },
   {
    "answer": "Jerome",
    "tier": 2
   },
   {
    "answer": "Therese of Lisieux",
    "tier": 1,
    "aliases": [
     "Little Flower"
    ]
   },
   {
    "answer": "Francis of Assisi",
    "tier": 1
   },
   {
    "answer": "Bruno",
    "tier": 4
   },
   {
    "answer": "Faustina",
    "tier": 2,
    "aliases": [
     "Faustina Kowalska"
    ]
   },
   {
    "answer": "Teresa of Calcutta",
    "tier": 1,
    "aliases": [
     "Mother Teresa"
    ]
   },
   {
    "answer": "Denis",
    "tier": 6
   },
   {
    "answer": "John Leonardi",
    "tier": 6
   },
   {
    "answer": "Callistus I",
    "tier": 5,
    "aliases": [
     "Calixtus"
    ]
   },
   {
    "answer": "Teresa of Avila",
    "tier": 1
   },
   {
    "answer": "Hedwig",
    "tier": 6
   },
   {
    "answer": "Margaret Mary Alacoque",
    "tier": 4
   },
   {
    "answer": "Ignatius of Antioch",
    "tier": 3
   },
   {
    "answer": "Luke",
    "tier": 1
   },
   {
    "answer": "Isaac Jogues",
    "tier": 5
   },
   {
    "answer": "Paul of the Cross",
    "tier": 5
   },
   {
    "answer": "John Paul II",
    "tier": 1
   },
   {
    "answer": "John XXIII",
    "tier": 2
   },
   {
    "answer": "John of Capistrano",
    "tier": 6
   },
   {
    "answer": "Anthony Claret",
    "tier": 5
   },
   {
    "answer": "Simon",
    "tier": 3
   },
   {
    "answer": "Jude",
    "tier": 2
   },
   {
    "answer": "Martin de Porres",
    "tier": 2
   },
   {
    "answer": "Charles Borromeo",
    "tier": 3
   },
   {
    "answer": "Leo the Great",
    "tier": 3
   },
   {
    "answer": "Martin of Tours",
    "tier": 2
   },
   {
    "answer": "Josaphat",
    "tier": 6
   },
   {
    "answer": "Albert the Great",
    "tier": 3
   },
   {
    "answer": "Margaret of Scotland",
    "tier": 5
   },
   {
    "answer": "Gertrude",
    "tier": 4
   },
   {
    "answer": "Elizabeth of Hungary",
    "tier": 2
   },
   {
    "answer": "Cecilia",
    "tier": 2
   },
   {
    "answer": "Clement I",
    "tier": 4,
    "aliases": [
     "Clement of Rome"
    ]
   },
   {
    "answer": "Columban",
    "tier": 5
   },
   {
    "answer": "Andrew Dung-Lac",
    "tier": 6
   },
   {
    "answer": "Catherine of Alexandria",
    "tier": 3
   },
   {
    "answer": "Andrew",
    "tier": 1
   },
   {
    "answer": "Francis Xavier",
    "tier": 2
   },
   {
    "answer": "John Damascene",
    "tier": 5,
    "aliases": [
     "John of Damascus"
    ]
   },
   {
    "answer": "Nicholas",
    "tier": 1
   },
   {
    "answer": "Ambrose",
    "tier": 2
   },
   {
    "answer": "Juan Diego",
    "tier": 2
   },
   {
    "answer": "Damasus I",
    "tier": 6
   },
   {
    "answer": "Lucy",
    "tier": 2
   },
   {
    "answer": "John of the Cross",
    "tier": 2
   },
   {
    "answer": "Peter Canisius",
    "tier": 5
   },
   {
    "answer": "Stephen",
    "tier": 1
   },
   {
    "answer": "John the Evangelist",
    "tier": 1,
    "aliases": [
     "John"
    ]
   },
   {
    "answer": "Thomas Becket",
    "tier": 3
   },
   {
    "answer": "Sylvester I",
    "tier": 5
   },
   {
    "answer": "Holy Innocents",
    "tier": 3
   }
  ]
 },
 {
  "id": "authored-shrines",
  "theme": "places",
  "basis": "Hand-authored; Holy See and diocesan lists of shrines and pilgrimage destinations.",
  "prompt": "Name a Catholic shrine or pilgrimage site.",
  "context": "Marian shrines, saints' tombs, holy places in the Holy Land and churches pilgrims visit.",
  "answers": [
   {
    "answer": "Lourdes",
    "tier": 1
   },
   {
    "answer": "Fatima",
    "tier": 1
   },
   {
    "answer": "Guadalupe",
    "tier": 1,
    "aliases": [
     "Our Lady of Guadalupe",
     "Basilica of Guadalupe"
    ]
   },
   {
    "answer": "Santiago de Compostela",
    "tier": 1,
    "aliases": [
     "Compostela"
    ]
   },
   {
    "answer": "Loreto",
    "tier": 3,
    "aliases": [
     "Holy House of Loreto"
    ]
   },
   {
    "answer": "Assisi",
    "tier": 1
   },
   {
    "answer": "San Giovanni Rotondo",
    "tier": 4
   },
   {
    "answer": "Knock",
    "tier": 3,
    "aliases": [
     "Knock Shrine"
    ]
   },
   {
    "answer": "Czestochowa",
    "tier": 3,
    "aliases": [
     "Jasna Gora",
     "Our Lady of Czestochowa"
    ]
   },
   {
    "answer": "Montserrat",
    "tier": 3
   },
   {
    "answer": "Mont-Saint-Michel",
    "tier": 3,
    "aliases": [
     "Mont Saint Michel"
    ]
   },
   {
    "answer": "Chartres",
    "tier": 3,
    "aliases": [
     "Chartres Cathedral"
    ]
   },
   {
    "answer": "Medjugorje",
    "tier": 2
   },
   {
    "answer": "Walsingham",
    "tier": 3,
    "aliases": [
     "Our Lady of Walsingham"
    ]
   },
   {
    "answer": "Aparecida",
    "tier": 3,
    "aliases": [
     "Our Lady of Aparecida"
    ]
   },
   {
    "answer": "Lujan",
    "tier": 5,
    "aliases": [
     "Our Lady of Lujan"
    ]
   },
   {
    "answer": "Kevelaer",
    "tier": 6
   },
   {
    "answer": "Altotting",
    "tier": 5
   },
   {
    "answer": "Mariazell",
    "tier": 5
   },
   {
    "answer": "Einsiedeln",
    "tier": 5
   },
   {
    "answer": "Lisieux",
    "tier": 2
   },
   {
    "answer": "Paray-le-Monial",
    "tier": 5
   },
   {
    "answer": "Nevers",
    "tier": 6
   },
   {
    "answer": "La Salette",
    "tier": 4,
    "aliases": [
     "Our Lady of La Salette"
    ]
   },
   {
    "answer": "Pontmain",
    "tier": 6
   },
   {
    "answer": "Beauraing",
    "tier": 6
   },
   {
    "answer": "Banneux",
    "tier": 6
   },
   {
    "answer": "Siluva",
    "tier": 6
   },
   {
    "answer": "Ta' Pinu",
    "tier": 6
   },
   {
    "answer": "Basilica of the Annunciation",
    "tier": 2,
    "aliases": [
     "Nazareth"
    ]
   },
   {
    "answer": "Church of the Nativity",
    "tier": 1,
    "aliases": [
     "Bethlehem"
    ]
   },
   {
    "answer": "Church of the Holy Sepulchre",
    "tier": 1,
    "aliases": [
     "Holy Sepulchre"
    ]
   },
   {
    "answer": "Gethsemane",
    "tier": 2,
    "aliases": [
     "Garden of Gethsemane"
    ]
   },
   {
    "answer": "Mount of Olives",
    "tier": 3
   },
   {
    "answer": "Via Dolorosa",
    "tier": 2
   },
   {
    "answer": "Mount Tabor",
    "tier": 4
   },
   {
    "answer": "Mount Nebo",
    "tier": 4
   },
   {
    "answer": "Cana",
    "tier": 3
   },
   {
    "answer": "Capernaum",
    "tier": 3
   },
   {
    "answer": "Tabgha",
    "tier": 5
   },
   {
    "answer": "Emmaus",
    "tier": 4
   },
   {
    "answer": "Bethany",
    "tier": 4
   },
   {
    "answer": "Ein Karem",
    "tier": 5
   },
   {
    "answer": "House of the Virgin Mary",
    "tier": 4,
    "aliases": [
     "Ephesus"
    ]
   },
   {
    "answer": "Saint Peter's Basilica",
    "tier": 1,
    "aliases": [
     "Saint Peter's",
     "Vatican"
    ]
   },
   {
    "answer": "Saint John Lateran",
    "tier": 2,
    "aliases": [
     "Lateran Basilica",
     "Basilica of Saint John Lateran"
    ]
   },
   {
    "answer": "Saint Mary Major",
    "tier": 2,
    "aliases": [
     "Santa Maria Maggiore"
    ]
   },
   {
    "answer": "Saint Paul Outside the Walls",
    "tier": 3,
    "aliases": [
     "San Paolo fuori le Mura"
    ]
   },
   {
    "answer": "Santa Croce in Gerusalemme",
    "tier": 6
   },
   {
    "answer": "San Lorenzo fuori le Mura",
    "tier": 6
   },
   {
    "answer": "San Sebastiano",
    "tier": 6,
    "aliases": [
     "Basilica of San Sebastiano"
    ]
   },
   {
    "answer": "Catacombs of Rome",
    "tier": 3,
    "aliases": [
     "Roman Catacombs",
     "Catacombs"
    ]
   },
   {
    "answer": "Scala Santa",
    "tier": 5,
    "aliases": [
     "Holy Stairs"
    ]
   },
   {
    "answer": "Basilica of Saint Anthony of Padua",
    "tier": 3,
    "aliases": [
     "Padua"
    ]
   },
   {
    "answer": "Siena",
    "tier": 4
   },
   {
    "answer": "Cascia",
    "tier": 5
   },
   {
    "answer": "Lanciano",
    "tier": 5
   },
   {
    "answer": "Turin",
    "tier": 2,
    "aliases": [
     "Shroud of Turin",
     "Turin Cathedral"
    ]
   },
   {
    "answer": "Manoppello",
    "tier": 6
   },
   {
    "answer": "Orvieto",
    "tier": 5
   },
   {
    "answer": "Monte Cassino",
    "tier": 3,
    "aliases": [
     "Montecassino"
    ]
   },
   {
    "answer": "Subiaco",
    "tier": 5
   },
   {
    "answer": "Norcia",
    "tier": 5
   },
   {
    "answer": "La Verna",
    "tier": 5
   },
   {
    "answer": "Porziuncola",
    "tier": 4,
    "aliases": [
     "Portiuncula"
    ]
   },
   {
    "answer": "San Damiano",
    "tier": 5
   },
   {
    "answer": "Avila",
    "tier": 5
   },
   {
    "answer": "Alba de Tormes",
    "tier": 6
   },
   {
    "answer": "Our Lady of the Pillar",
    "tier": 3,
    "aliases": [
     "Zaragoza",
     "Pilar"
    ]
   },
   {
    "answer": "Covadonga",
    "tier": 5
   },
   {
    "answer": "Loyola",
    "tier": 5,
    "aliases": [
     "Sanctuary of Loyola"
    ]
   },
   {
    "answer": "Javier",
    "tier": 6
   },
   {
    "answer": "Divine Mercy Sanctuary",
    "tier": 3,
    "aliases": [
     "Krakow"
    ]
   },
   {
    "answer": "Wadowice",
    "tier": 5
   },
   {
    "answer": "Kalwaria Zebrzydowska",
    "tier": 6
   },
   {
    "answer": "Lichen",
    "tier": 6
   },
   {
    "answer": "Kibeho",
    "tier": 5
   },
   {
    "answer": "Basilica of Our Lady of Peace",
    "tier": 6,
    "aliases": [
     "Yamoussoukro"
    ]
   },
   {
    "answer": "Namugongo",
    "tier": 5,
    "aliases": [
     "Uganda Martyrs Shrine"
    ]
   },
   {
    "answer": "Sainte-Anne-de-Beaupre",
    "tier": 3,
    "aliases": [
     "Sainte Anne de Beaupre"
    ]
   },
   {
    "answer": "Saint Joseph's Oratory",
    "tier": 3,
    "aliases": [
     "Montreal"
    ]
   },
   {
    "answer": "Cap-de-la-Madeleine",
    "tier": 6
   },
   {
    "answer": "National Shrine of the Immaculate Conception",
    "tier": 2,
    "aliases": [
     "Washington Basilica"
    ]
   },
   {
    "answer": "Our Lady of Good Help",
    "tier": 5,
    "aliases": [
     "Champion"
    ]
   },
   {
    "answer": "Our Lady of Charity",
    "tier": 5,
    "aliases": [
     "El Cobre"
    ]
   },
   {
    "answer": "Our Lady of the Angels of Cartago",
    "tier": 6,
    "aliases": [
     "Cartago"
    ]
   },
   {
    "answer": "Our Lady of Suyapa",
    "tier": 6
   },
   {
    "answer": "San Juan de los Lagos",
    "tier": 6
   },
   {
    "answer": "Our Lady of Copacabana",
    "tier": 6
   },
   {
    "answer": "Croagh Patrick",
    "tier": 3
   },
   {
    "answer": "Lough Derg",
    "tier": 4
   },
   {
    "answer": "Glendalough",
    "tier": 4
   },
   {
    "answer": "Rocamadour",
    "tier": 5
   },
   {
    "answer": "Vezelay",
    "tier": 6,
    "aliases": [
     "Vézelay"
    ]
   },
   {
    "answer": "Conques",
    "tier": 6
   },
   {
    "answer": "Cologne Cathedral",
    "tier": 4,
    "aliases": [
     "Shrine of the Three Kings"
    ]
   },
   {
    "answer": "Aachen",
    "tier": 5
   },
   {
    "answer": "Trier",
    "tier": 5,
    "aliases": [
     "Holy Robe"
    ]
   },
   {
    "answer": "Ars",
    "tier": 4
   },
   {
    "answer": "Mont Sainte-Odile",
    "tier": 6
   }
  ]
 },
 {
  "id": "authored-biblical-peoples",
  "theme": "scripture",
  "basis": "Hand-authored; Genesis 10, Joshua 3, Acts 2 and the books named.",
  "prompt": "Name a people, tribe or nation named in the Bible.",
  "context": "Peoples Israel met, and groups to whom letters or sermons were sent, in either Testament.",
  "answers": [
   {
    "answer": "Israelites",
    "tier": 1,
    "aliases": [
     "Hebrews"
    ]
   },
   {
    "answer": "Egyptians",
    "tier": 1
   },
   {
    "answer": "Philistines",
    "tier": 1
   },
   {
    "answer": "Babylonians",
    "tier": 1
   },
   {
    "answer": "Assyrians",
    "tier": 1
   },
   {
    "answer": "Persians",
    "tier": 2
   },
   {
    "answer": "Romans",
    "tier": 1
   },
   {
    "answer": "Medes",
    "tier": 3
   },
   {
    "answer": "Greeks",
    "tier": 2
   },
   {
    "answer": "Canaanites",
    "tier": 1
   },
   {
    "answer": "Amorites",
    "tier": 2
   },
   {
    "answer": "Hittites",
    "tier": 2
   },
   {
    "answer": "Hivites",
    "tier": 4
   },
   {
    "answer": "Perizzites",
    "tier": 4
   },
   {
    "answer": "Jebusites",
    "tier": 3
   },
   {
    "answer": "Girgashites",
    "tier": 6
   },
   {
    "answer": "Amalekites",
    "tier": 2
   },
   {
    "answer": "Midianites",
    "tier": 2
   },
   {
    "answer": "Moabites",
    "tier": 2
   },
   {
    "answer": "Ammonites",
    "tier": 2
   },
   {
    "answer": "Edomites",
    "tier": 2,
    "aliases": [
     "Idumeans"
    ]
   },
   {
    "answer": "Samaritans",
    "tier": 1
   },
   {
    "answer": "Phoenicians",
    "tier": 3
   },
   {
    "answer": "Arameans",
    "tier": 4,
    "aliases": [
     "Syrians"
    ]
   },
   {
    "answer": "Chaldeans",
    "tier": 3
   },
   {
    "answer": "Elamites",
    "tier": 5
   },
   {
    "answer": "Parthians",
    "tier": 4
   },
   {
    "answer": "Cretans",
    "tier": 3
   },
   {
    "answer": "Cilicians",
    "tier": 5
   },
   {
    "answer": "Galatians",
    "tier": 2
   },
   {
    "answer": "Ephesians",
    "tier": 2
   },
   {
    "answer": "Corinthians",
    "tier": 2
   },
   {
    "answer": "Philippians",
    "tier": 2
   },
   {
    "answer": "Colossians",
    "tier": 3
   },
   {
    "answer": "Thessalonians",
    "tier": 2
   },
   {
    "answer": "Cappadocians",
    "tier": 5
   },
   {
    "answer": "Phrygians",
    "tier": 5
   },
   {
    "answer": "Pamphylians",
    "tier": 5
   },
   {
    "answer": "Libyans",
    "tier": 5
   },
   {
    "answer": "Arabs",
    "tier": 4
   },
   {
    "answer": "Cushites",
    "tier": 4,
    "aliases": [
     "Ethiopians"
    ]
   },
   {
    "answer": "Sabeans",
    "tier": 5
   },
   {
    "answer": "Kenites",
    "tier": 5
   },
   {
    "answer": "Rephaim",
    "tier": 5
   },
   {
    "answer": "Anakim",
    "tier": 5
   },
   {
    "answer": "Horites",
    "tier": 6
   },
   {
    "answer": "Emim",
    "tier": 6
   },
   {
    "answer": "Zamzummim",
    "tier": 6
   },
   {
    "answer": "Geshurites",
    "tier": 6
   },
   {
    "answer": "Gibeonites",
    "tier": 4
   },
   {
    "answer": "Kittim",
    "tier": 6
   },
   {
    "answer": "Cherethites",
    "tier": 6
   },
   {
    "answer": "Pelethites",
    "tier": 6
   },
   {
    "answer": "Ishmaelites",
    "tier": 3
   },
   {
    "answer": "Jews",
    "tier": 1
   },
   {
    "answer": "Galileans",
    "tier": 3
   },
   {
    "answer": "Sidonians",
    "tier": 4
   },
   {
    "answer": "Tyrians",
    "tier": 4
   },
   {
    "answer": "Gadarenes",
    "tier": 5
   },
   {
    "answer": "Gerasenes",
    "tier": 5
   },
   {
    "answer": "Cyrenians",
    "tier": 5
   },
   {
    "answer": "Athenians",
    "tier": 3
   },
   {
    "answer": "Lycaonians",
    "tier": 6
   },
   {
    "answer": "Bereans",
    "tier": 5
   },
   {
    "answer": "Levites",
    "tier": 2
   },
   {
    "answer": "Rechabites",
    "tier": 5
   },
   {
    "answer": "Nethinim",
    "tier": 6
   },
   {
    "answer": "Hagrites",
    "tier": 6
   },
   {
    "answer": "Maacathites",
    "tier": 6
   },
   {
    "answer": "Lydians",
    "tier": 6
   }
  ]
 },
 {
  "id": "authored-foreign-rulers",
  "theme": "scripture",
  "basis": "Hand-authored; the books of Genesis to Esther, Daniel, the Gospels and Acts.",
  "prompt": "Name a foreign king, queen, emperor or governor in the Bible.",
  "context": "Rulers outside Israel and Judah.",
  "answers": [
   {
    "answer": "Pharaoh",
    "tier": 1
   },
   {
    "answer": "Nebuchadnezzar",
    "tier": 1
   },
   {
    "answer": "Cyrus",
    "tier": 2
   },
   {
    "answer": "Darius",
    "tier": 2
   },
   {
    "answer": "Xerxes",
    "tier": 3,
    "aliases": [
     "Ahasuerus"
    ]
   },
   {
    "answer": "Belshazzar",
    "tier": 2
   },
   {
    "answer": "Artaxerxes",
    "tier": 3
   },
   {
    "answer": "Sennacherib",
    "tier": 3
   },
   {
    "answer": "Tiglath-pileser",
    "tier": 4,
    "aliases": [
     "Pul"
    ]
   },
   {
    "answer": "Shalmaneser",
    "tier": 4
   },
   {
    "answer": "Sargon",
    "tier": 5
   },
   {
    "answer": "Esarhaddon",
    "tier": 5
   },
   {
    "answer": "Hiram",
    "tier": 3
   },
   {
    "answer": "Melchizedek",
    "tier": 2
   },
   {
    "answer": "Abimelech of Gerar",
    "tier": 3
   },
   {
    "answer": "Balak",
    "tier": 3
   },
   {
    "answer": "Sihon",
    "tier": 4
   },
   {
    "answer": "Og",
    "tier": 3
   },
   {
    "answer": "Eglon",
    "tier": 4
   },
   {
    "answer": "Jabin",
    "tier": 4
   },
   {
    "answer": "Agag",
    "tier": 3
   },
   {
    "answer": "Achish",
    "tier": 4
   },
   {
    "answer": "Ben-hadad",
    "tier": 4,
    "aliases": [
     "Benhadad"
    ]
   },
   {
    "answer": "Hazael",
    "tier": 4
   },
   {
    "answer": "Rezin",
    "tier": 5
   },
   {
    "answer": "Mesha",
    "tier": 5
   },
   {
    "answer": "Merodach-baladan",
    "tier": 6
   },
   {
    "answer": "Evil-merodach",
    "tier": 5
   },
   {
    "answer": "Neco",
    "tier": 4,
    "aliases": [
     "Necho"
    ]
   },
   {
    "answer": "Hophra",
    "tier": 6
   },
   {
    "answer": "Shishak",
    "tier": 4,
    "aliases": [
     "Shoshenq"
    ]
   },
   {
    "answer": "Tirhakah",
    "tier": 6
   },
   {
    "answer": "So of Egypt",
    "tier": 6
   },
   {
    "answer": "Herod the Great",
    "tier": 1,
    "aliases": [
     "Herod"
    ]
   },
   {
    "answer": "Herod Antipas",
    "tier": 1
   },
   {
    "answer": "Archelaus",
    "tier": 3
   },
   {
    "answer": "Philip the Tetrarch",
    "tier": 5
   },
   {
    "answer": "Herod Agrippa I",
    "tier": 3,
    "aliases": [
     "Agrippa I"
    ]
   },
   {
    "answer": "Herod Agrippa II",
    "tier": 3,
    "aliases": [
     "Agrippa"
    ]
   },
   {
    "answer": "Caesar Augustus",
    "tier": 1,
    "aliases": [
     "Augustus"
    ]
   },
   {
    "answer": "Tiberius",
    "tier": 1,
    "aliases": [
     "Tiberius Caesar"
    ]
   },
   {
    "answer": "Claudius",
    "tier": 2
   },
   {
    "answer": "Aretas",
    "tier": 5
   },
   {
    "answer": "Queen of Sheba",
    "tier": 1,
    "aliases": [
     "Sheba"
    ]
   },
   {
    "answer": "Candace",
    "tier": 4
   },
   {
    "answer": "Darius the Mede",
    "tier": 4
   },
   {
    "answer": "Vashti",
    "tier": 3
   },
   {
    "answer": "Hadadezer",
    "tier": 6
   },
   {
    "answer": "Toi",
    "tier": 6
   },
   {
    "answer": "Nahash",
    "tier": 5
   },
   {
    "answer": "Hanun",
    "tier": 5
   },
   {
    "answer": "Cushan-rishathaim",
    "tier": 6
   },
   {
    "answer": "Chedorlaomer",
    "tier": 5
   },
   {
    "answer": "Amraphel",
    "tier": 6
   },
   {
    "answer": "Adoni-bezek",
    "tier": 5
   },
   {
    "answer": "Adoni-zedek",
    "tier": 5
   },
   {
    "answer": "Zebah and Zalmunna",
    "tier": 5
   },
   {
    "answer": "Alexander the Great",
    "tier": 3,
    "aliases": [
     "Alexander of Macedon"
    ]
   },
   {
    "answer": "Antiochus Epiphanes",
    "tier": 3,
    "aliases": [
     "Antiochus IV"
    ]
   },
   {
    "answer": "Antiochus III",
    "tier": 6
   },
   {
    "answer": "Demetrius I",
    "tier": 6
   },
   {
    "answer": "Ptolemy",
    "tier": 5
   },
   {
    "answer": "Seleucus IV",
    "tier": 6
   },
   {
    "answer": "Alexander Balas",
    "tier": 6
   },
   {
    "answer": "Pontius Pilate",
    "tier": 1,
    "aliases": [
     "Pilate"
    ]
   },
   {
    "answer": "Felix",
    "tier": 3
   },
   {
    "answer": "Festus",
    "tier": 3
   },
   {
    "answer": "Quirinius",
    "tier": 3
   },
   {
    "answer": "Gallio",
    "tier": 3
   },
   {
    "answer": "Sergius Paulus",
    "tier": 4
   }
  ]
 },
 {
  "id": "authored-theology-terms",
  "theme": "doctrine",
  "basis": "Hand-authored; Catechism of the Catholic Church glossary and standard theological dictionaries.",
  "prompt": "Name a term used in Catholic theology.",
  "context": "Words from doctrine, moral teaching and the study of Scripture.",
  "answers": [
   {
    "answer": "Trinity",
    "tier": 1
   },
   {
    "answer": "Incarnation",
    "tier": 1
   },
   {
    "answer": "Redemption",
    "tier": 2
   },
   {
    "answer": "Resurrection",
    "tier": 1
   },
   {
    "answer": "Grace",
    "tier": 1
   },
   {
    "answer": "Original sin",
    "tier": 1
   },
   {
    "answer": "Mortal sin",
    "tier": 1
   },
   {
    "answer": "Venial sin",
    "tier": 2
   },
   {
    "answer": "Purgatory",
    "tier": 1
   },
   {
    "answer": "Transubstantiation",
    "tier": 1
   },
   {
    "answer": "Beatific vision",
    "tier": 3
   },
   {
    "answer": "Real Presence",
    "tier": 2
   },
   {
    "answer": "Sacrament",
    "tier": 1
   },
   {
    "answer": "Sacramental",
    "tier": 3
   },
   {
    "answer": "Ex opere operato",
    "tier": 4
   },
   {
    "answer": "Indulgence",
    "tier": 2
   },
   {
    "answer": "Immaculate Conception",
    "tier": 1
   },
   {
    "answer": "Assumption",
    "tier": 1
   },
   {
    "answer": "Theotokos",
    "tier": 3
   },
   {
    "answer": "Hypostatic union",
    "tier": 3
   },
   {
    "answer": "Consubstantial",
    "tier": 3
   },
   {
    "answer": "Homoousios",
    "tier": 4
   },
   {
    "answer": "Filioque",
    "tier": 3
   },
   {
    "answer": "Apostolic succession",
    "tier": 2
   },
   {
    "answer": "Magisterium",
    "tier": 2
   },
   {
    "answer": "Infallibility",
    "tier": 2
   },
   {
    "answer": "Deposit of faith",
    "tier": 3
   },
   {
    "answer": "Sensus fidei",
    "tier": 5,
    "aliases": [
     "Sensus fidelium"
    ]
   },
   {
    "answer": "Natural law",
    "tier": 2
   },
   {
    "answer": "Conscience",
    "tier": 2
   },
   {
    "answer": "Concupiscence",
    "tier": 4
   },
   {
    "answer": "Contrition",
    "tier": 2
   },
   {
    "answer": "Absolution",
    "tier": 2
   },
   {
    "answer": "Penance",
    "tier": 1
   },
   {
    "answer": "Satisfaction",
    "tier": 4
   },
   {
    "answer": "Viaticum",
    "tier": 3
   },
   {
    "answer": "Epiclesis",
    "tier": 5
   },
   {
    "answer": "Anamnesis",
    "tier": 5
   },
   {
    "answer": "Concelebration",
    "tier": 5
   },
   {
    "answer": "Collegiality",
    "tier": 4
   },
   {
    "answer": "Subsidiarity",
    "tier": 4
   },
   {
    "answer": "Solidarity",
    "tier": 3
   },
   {
    "answer": "Common good",
    "tier": 3
   },
   {
    "answer": "Preferential option for the poor",
    "tier": 3
   },
   {
    "answer": "Evangelization",
    "tier": 2
   },
   {
    "answer": "Inculturation",
    "tier": 5
   },
   {
    "answer": "Ecumenism",
    "tier": 2
   },
   {
    "answer": "Catechesis",
    "tier": 2
   },
   {
    "answer": "Vocation",
    "tier": 1
   },
   {
    "answer": "Charism",
    "tier": 3
   },
   {
    "answer": "Evangelical counsels",
    "tier": 4
   },
   {
    "answer": "Beatitude",
    "tier": 2
   },
   {
    "answer": "Theosis",
    "tier": 5,
    "aliases": [
     "Divinization"
    ]
   },
   {
    "answer": "Apophatic theology",
    "tier": 6
   },
   {
    "answer": "Kenosis",
    "tier": 4
   },
   {
    "answer": "Perichoresis",
    "tier": 6,
    "aliases": [
     "Circumincession"
    ]
   },
   {
    "answer": "Analogy of being",
    "tier": 6,
    "aliases": [
     "Analogia entis"
    ]
   },
   {
    "answer": "Hylomorphism",
    "tier": 6
   },
   {
    "answer": "Transignification",
    "tier": 6
   },
   {
    "answer": "Limbo",
    "tier": 3
   },
   {
    "answer": "Particular judgment",
    "tier": 3
   },
   {
    "answer": "Last Judgment",
    "tier": 2
   },
   {
    "answer": "Communion of saints",
    "tier": 2
   },
   {
    "answer": "Parousia",
    "tier": 4
   },
   {
    "answer": "Eschatology",
    "tier": 3
   },
   {
    "answer": "Soteriology",
    "tier": 4
   },
   {
    "answer": "Christology",
    "tier": 3
   },
   {
    "answer": "Ecclesiology",
    "tier": 4
   },
   {
    "answer": "Pneumatology",
    "tier": 5
   },
   {
    "answer": "Mariology",
    "tier": 3
   },
   {
    "answer": "Sanctifying grace",
    "tier": 3
   },
   {
    "answer": "Actual grace",
    "tier": 4
   },
   {
    "answer": "Justification",
    "tier": 2
   },
   {
    "answer": "Sanctification",
    "tier": 2
   },
   {
    "answer": "Merit",
    "tier": 4
   },
   {
    "answer": "Predestination",
    "tier": 3
   },
   {
    "answer": "Free will",
    "tier": 1
   },
   {
    "answer": "Providence",
    "tier": 2
   },
   {
    "answer": "Revelation",
    "tier": 1
   },
   {
    "answer": "Inspiration",
    "tier": 3
   },
   {
    "answer": "Inerrancy",
    "tier": 3
   },
   {
    "answer": "Canon",
    "tier": 2
   },
   {
    "answer": "Tradition",
    "tier": 1
   },
   {
    "answer": "Exegesis",
    "tier": 3
   },
   {
    "answer": "Typology",
    "tier": 4
   },
   {
    "answer": "Four senses of Scripture",
    "tier": 5
   },
   {
    "answer": "Anagogical sense",
    "tier": 6
   },
   {
    "answer": "Hermeneutics",
    "tier": 4
   },
   {
    "answer": "Analogy of faith",
    "tier": 5
   },
   {
    "answer": "Hierarchy",
    "tier": 2
   },
   {
    "answer": "Laity",
    "tier": 2
   },
   {
    "answer": "Clergy",
    "tier": 2
   },
   {
    "answer": "Episcopacy",
    "tier": 5
   },
   {
    "answer": "Sacramental character",
    "tier": 5,
    "aliases": [
     "Indelible character"
    ]
   },
   {
    "answer": "Matter and form",
    "tier": 4
   },
   {
    "answer": "Ex cathedra",
    "tier": 2
   },
   {
    "answer": "Ordinary Magisterium",
    "tier": 5
   },
   {
    "answer": "Development of doctrine",
    "tier": 3
   },
   {
    "answer": "Hierarchy of truths",
    "tier": 5
   },
   {
    "answer": "Domestic Church",
    "tier": 3
   },
   {
    "answer": "Mystical Body",
    "tier": 3
   },
   {
    "answer": "People of God",
    "tier": 3
   },
   {
    "answer": "Spiritual communion",
    "tier": 4
   },
   {
    "answer": "Eucharistic fast",
    "tier": 4
   },
   {
    "answer": "Apostolate",
    "tier": 3
   },
   {
    "answer": "Conversion",
    "tier": 1
   },
   {
    "answer": "Metanoia",
    "tier": 6
   },
   {
    "answer": "Kerygma",
    "tier": 5
   },
   {
    "answer": "Diaconate",
    "tier": 4
   },
   {
    "answer": "Asceticism",
    "tier": 4
   },
   {
    "answer": "Mysticism",
    "tier": 3
   },
   {
    "answer": "Discernment of spirits",
    "tier": 4
   },
   {
    "answer": "Sin of omission",
    "tier": 3
   },
   {
    "answer": "Occasion of sin",
    "tier": 4
   },
   {
    "answer": "Scandal",
    "tier": 4
   }
  ]
 },
 {
  "id": "authored-life-of-jesus",
  "theme": "scripture",
  "basis": "Hand-authored; the four Gospels.",
  "prompt": "Name an event in the life of Jesus told in the Gospels.",
  "context": "The events of his life, from the Gospels.",
  "answers": [
   {
    "answer": "Annunciation",
    "tier": 1
   },
   {
    "answer": "Nativity",
    "tier": 1,
    "aliases": [
     "Birth of Jesus"
    ]
   },
   {
    "answer": "Visitation",
    "tier": 3
   },
   {
    "answer": "Visit of the shepherds",
    "tier": 1,
    "aliases": [
     "Adoration of the shepherds"
    ]
   },
   {
    "answer": "Circumcision",
    "tier": 4
   },
   {
    "answer": "Presentation in the Temple",
    "tier": 2,
    "aliases": [
     "Presentation"
    ]
   },
   {
    "answer": "Visit of the Magi",
    "tier": 1,
    "aliases": [
     "Epiphany",
     "Adoration of the Magi"
    ]
   },
   {
    "answer": "Flight into Egypt",
    "tier": 2
   },
   {
    "answer": "Massacre of the Holy Innocents",
    "tier": 3,
    "aliases": [
     "Slaughter of the Innocents"
    ]
   },
   {
    "answer": "Return to Nazareth",
    "tier": 6
   },
   {
    "answer": "Finding in the Temple",
    "tier": 2,
    "aliases": [
     "Boy Jesus in the Temple"
    ]
   },
   {
    "answer": "Baptism in the Jordan",
    "tier": 1,
    "aliases": [
     "Baptism of Jesus"
    ]
   },
   {
    "answer": "Temptation in the desert",
    "tier": 1,
    "aliases": [
     "Temptation of Jesus"
    ]
   },
   {
    "answer": "Calling of the first disciples",
    "tier": 2
   },
   {
    "answer": "Wedding at Cana",
    "tier": 1
   },
   {
    "answer": "Cleansing of the Temple",
    "tier": 2
   },
   {
    "answer": "Conversation with Nicodemus",
    "tier": 3
   },
   {
    "answer": "Woman at the well",
    "tier": 2,
    "aliases": [
     "Samaritan woman"
    ]
   },
   {
    "answer": "Healing of the official's son",
    "tier": 6
   },
   {
    "answer": "Rejection at Nazareth",
    "tier": 3
   },
   {
    "answer": "Calling of Matthew",
    "tier": 3
   },
   {
    "answer": "Sermon on the Mount",
    "tier": 1
   },
   {
    "answer": "Sermon on the Plain",
    "tier": 6
   },
   {
    "answer": "Calming of the storm",
    "tier": 2,
    "aliases": [
     "Stilling of the storm"
    ]
   },
   {
    "answer": "Healing of the Gerasene demoniac",
    "tier": 3
   },
   {
    "answer": "Raising of Jairus's daughter",
    "tier": 2
   },
   {
    "answer": "Healing of the woman with a hemorrhage",
    "tier": 3
   },
   {
    "answer": "Feeding of the five thousand",
    "tier": 1,
    "aliases": [
     "Loaves and fishes"
    ]
   },
   {
    "answer": "Walking on water",
    "tier": 1
   },
   {
    "answer": "Peter's confession",
    "tier": 2,
    "aliases": [
     "Confession of Peter"
    ]
   },
   {
    "answer": "Transfiguration",
    "tier": 1
   },
   {
    "answer": "Healing of the boy with a spirit",
    "tier": 4
   },
   {
    "answer": "Raising of the widow's son at Nain",
    "tier": 3,
    "aliases": [
     "Widow of Nain"
    ]
   },
   {
    "answer": "Anointing by a sinful woman",
    "tier": 4
   },
   {
    "answer": "Mission of the seventy",
    "tier": 4,
    "aliases": [
     "Sending of the seventy-two"
    ]
   },
   {
    "answer": "Visit to Martha and Mary",
    "tier": 3
   },
   {
    "answer": "Healing of the ten lepers",
    "tier": 3
   },
   {
    "answer": "Zacchaeus",
    "tier": 2
   },
   {
    "answer": "Raising of Lazarus",
    "tier": 1
   },
   {
    "answer": "Healing of Bartimaeus",
    "tier": 3
   },
   {
    "answer": "Blessing of the children",
    "tier": 3
   },
   {
    "answer": "Rich young man",
    "tier": 3
   },
   {
    "answer": "Triumphal entry",
    "tier": 1,
    "aliases": [
     "Palm Sunday",
     "Entry into Jerusalem"
    ]
   },
   {
    "answer": "Cursing of the fig tree",
    "tier": 4
   },
   {
    "answer": "Question about paying taxes",
    "tier": 4,
    "aliases": [
     "Render to Caesar"
    ]
   },
   {
    "answer": "Widow's offering",
    "tier": 4,
    "aliases": [
     "Widow's mite"
    ]
   },
   {
    "answer": "Anointing at Bethany",
    "tier": 3
   },
   {
    "answer": "Last Supper",
    "tier": 1
   },
   {
    "answer": "Washing of the feet",
    "tier": 1,
    "aliases": [
     "Washing of the disciples' feet"
    ]
   },
   {
    "answer": "Agony in the garden",
    "tier": 1,
    "aliases": [
     "Garden of Gethsemane"
    ]
   },
   {
    "answer": "Betrayal by Judas",
    "tier": 1
   },
   {
    "answer": "Arrest",
    "tier": 2,
    "aliases": [
     "Arrest of Jesus"
    ]
   },
   {
    "answer": "Trial before the Sanhedrin",
    "tier": 3
   },
   {
    "answer": "Peter's denial",
    "tier": 2,
    "aliases": [
     "Denial of Peter"
    ]
   },
   {
    "answer": "Trial before Pilate",
    "tier": 2
   },
   {
    "answer": "Appearance before Herod",
    "tier": 4
   },
   {
    "answer": "Scourging",
    "tier": 2,
    "aliases": [
     "Scourging at the pillar"
    ]
   },
   {
    "answer": "Crowning with thorns",
    "tier": 2
   },
   {
    "answer": "Carrying of the cross",
    "tier": 1
   },
   {
    "answer": "Crucifixion",
    "tier": 1,
    "aliases": [
     "Death of Jesus"
    ]
   },
   {
    "answer": "Burial",
    "tier": 2
   },
   {
    "answer": "Empty tomb",
    "tier": 1,
    "aliases": [
     "Resurrection"
    ]
   },
   {
    "answer": "Appearance to Mary Magdalene",
    "tier": 3
   },
   {
    "answer": "Road to Emmaus",
    "tier": 1,
    "aliases": [
     "Emmaus"
    ]
   },
   {
    "answer": "Appearance to Thomas",
    "tier": 2,
    "aliases": [
     "Doubting Thomas"
    ]
   },
   {
    "answer": "Breakfast on the shore",
    "tier": 4,
    "aliases": [
     "Sea of Tiberias"
    ]
   },
   {
    "answer": "Great Commission",
    "tier": 2
   },
   {
    "answer": "Ascension",
    "tier": 1
   },
   {
    "answer": "Miraculous catch of fish",
    "tier": 3
   },
   {
    "answer": "Healing of the paralytic",
    "tier": 2,
    "aliases": [
     "Paralytic lowered through the roof"
    ]
   },
   {
    "answer": "Healing of the man born blind",
    "tier": 3
   }
  ]
 },
 {
  "id": "authored-foods",
  "theme": "scripture",
  "basis": "Hand-authored; the Old and New Testaments.",
  "prompt": "Name a food or drink mentioned in the Bible.",
  "context": "Staples, feasts, spices and the fruits of the land, in either Testament.",
  "answers": [
   {
    "answer": "Bread",
    "tier": 1
   },
   {
    "answer": "Wine",
    "tier": 1
   },
   {
    "answer": "Honey",
    "tier": 1
   },
   {
    "answer": "Olive oil",
    "tier": 2,
    "aliases": [
     "Oil"
    ]
   },
   {
    "answer": "Milk",
    "tier": 2
   },
   {
    "answer": "Figs",
    "tier": 1,
    "aliases": [
     "Fig"
    ]
   },
   {
    "answer": "Grapes",
    "tier": 1
   },
   {
    "answer": "Dates",
    "tier": 3
   },
   {
    "answer": "Pomegranates",
    "tier": 3,
    "aliases": [
     "Pomegranate"
    ]
   },
   {
    "answer": "Raisins",
    "tier": 4
   },
   {
    "answer": "Barley",
    "tier": 2
   },
   {
    "answer": "Wheat",
    "tier": 1
   },
   {
    "answer": "Lentils",
    "tier": 3,
    "aliases": [
     "Lentil stew",
     "Red stew"
    ]
   },
   {
    "answer": "Beans",
    "tier": 5
   },
   {
    "answer": "Cucumbers",
    "tier": 4
   },
   {
    "answer": "Melons",
    "tier": 4
   },
   {
    "answer": "Leeks",
    "tier": 4
   },
   {
    "answer": "Onions",
    "tier": 4
   },
   {
    "answer": "Garlic",
    "tier": 4
   },
   {
    "answer": "Fish",
    "tier": 1
   },
   {
    "answer": "Quail",
    "tier": 2
   },
   {
    "answer": "Manna",
    "tier": 1
   },
   {
    "answer": "Locusts",
    "tier": 3
   },
   {
    "answer": "Lamb",
    "tier": 1
   },
   {
    "answer": "Goat",
    "tier": 2
   },
   {
    "answer": "Kid",
    "tier": 3
   },
   {
    "answer": "Fatted calf",
    "tier": 2
   },
   {
    "answer": "Curds",
    "tier": 4,
    "aliases": [
     "Butter"
    ]
   },
   {
    "answer": "Cheese",
    "tier": 4
   },
   {
    "answer": "Vinegar",
    "tier": 3,
    "aliases": [
     "Sour wine"
    ]
   },
   {
    "answer": "Salt",
    "tier": 3
   },
   {
    "answer": "Cumin",
    "tier": 4
   },
   {
    "answer": "Dill",
    "tier": 4
   },
   {
    "answer": "Mint",
    "tier": 4
   },
   {
    "answer": "Rue",
    "tier": 6
   },
   {
    "answer": "Almonds",
    "tier": 3
   },
   {
    "answer": "Pistachios",
    "tier": 6
   },
   {
    "answer": "Honeycomb",
    "tier": 3
   },
   {
    "answer": "Parched grain",
    "tier": 5,
    "aliases": [
     "Roasted grain"
    ]
   },
   {
    "answer": "Unleavened bread",
    "tier": 1,
    "aliases": [
     "Matzah"
    ]
   },
   {
    "answer": "Showbread",
    "tier": 3,
    "aliases": [
     "Bread of the Presence"
    ]
   },
   {
    "answer": "Raisin cakes",
    "tier": 4,
    "aliases": [
     "Cakes"
    ]
   },
   {
    "answer": "Olives",
    "tier": 2
   },
   {
    "answer": "Bitter herbs",
    "tier": 2
   },
   {
    "answer": "Gourds",
    "tier": 5
   },
   {
    "answer": "Eggs",
    "tier": 4
   },
   {
    "answer": "Millet",
    "tier": 6
   },
   {
    "answer": "Spelt",
    "tier": 6
   },
   {
    "answer": "Vetches",
    "tier": 6,
    "aliases": [
     "Fitches"
    ]
   },
   {
    "answer": "Coriander",
    "tier": 5
   },
   {
    "answer": "Mustard",
    "tier": 3
   },
   {
    "answer": "Nuts",
    "tier": 5
   },
   {
    "answer": "Fine flour",
    "tier": 4
   },
   {
    "answer": "Water",
    "tier": 1
   },
   {
    "answer": "New wine",
    "tier": 3
   },
   {
    "answer": "Apples",
    "tier": 3
   },
   {
    "answer": "Pods",
    "tier": 4,
    "aliases": [
     "Husks",
     "Carob pods"
    ]
   },
   {
    "answer": "Cakes of figs",
    "tier": 6
   },
   {
    "answer": "Broiled fish",
    "tier": 3
   },
   {
    "answer": "Wafers",
    "tier": 6
   }
  ]
 },
 {
  "id": "authored-occupations",
  "theme": "scripture",
  "basis": "Hand-authored; the Old and New Testaments.",
  "prompt": "Name a trade or occupation mentioned in the Bible.",
  "context": "Work done by people in either Testament.",
  "answers": [
   {
    "answer": "Shepherd",
    "tier": 1
   },
   {
    "answer": "Farmer",
    "tier": 1
   },
   {
    "answer": "Fisherman",
    "tier": 1
   },
   {
    "answer": "Carpenter",
    "tier": 1
   },
   {
    "answer": "Tax collector",
    "tier": 1
   },
   {
    "answer": "Soldier",
    "tier": 2
   },
   {
    "answer": "Centurion",
    "tier": 2
   },
   {
    "answer": "Priest",
    "tier": 1
   },
   {
    "answer": "Prophet",
    "tier": 1
   },
   {
    "answer": "Levite",
    "tier": 3
   },
   {
    "answer": "Judge",
    "tier": 2
   },
   {
    "answer": "Scribe",
    "tier": 2
   },
   {
    "answer": "Physician",
    "tier": 2
   },
   {
    "answer": "Potter",
    "tier": 2
   },
   {
    "answer": "Tentmaker",
    "tier": 2
   },
   {
    "answer": "Weaver",
    "tier": 4
   },
   {
    "answer": "Tanner",
    "tier": 3
   },
   {
    "answer": "Fuller",
    "tier": 5
   },
   {
    "answer": "Seller of purple",
    "tier": 3
   },
   {
    "answer": "Goldsmith",
    "tier": 3
   },
   {
    "answer": "Silversmith",
    "tier": 3
   },
   {
    "answer": "Blacksmith",
    "tier": 4
   },
   {
    "answer": "Coppersmith",
    "tier": 4
   },
   {
    "answer": "Mason",
    "tier": 3,
    "aliases": [
     "Stonemason"
    ]
   },
   {
    "answer": "Builder",
    "tier": 2
   },
   {
    "answer": "Master builder",
    "tier": 4
   },
   {
    "answer": "Sailor",
    "tier": 3
   },
   {
    "answer": "Shipmaster",
    "tier": 5
   },
   {
    "answer": "Helmsman",
    "tier": 5
   },
   {
    "answer": "Merchant",
    "tier": 2
   },
   {
    "answer": "Moneychanger",
    "tier": 2
   },
   {
    "answer": "Innkeeper",
    "tier": 2
   },
   {
    "answer": "Cupbearer",
    "tier": 3
   },
   {
    "answer": "Baker",
    "tier": 3
   },
   {
    "answer": "Cook",
    "tier": 4
   },
   {
    "answer": "Steward",
    "tier": 3
   },
   {
    "answer": "Servant",
    "tier": 2
   },
   {
    "answer": "Slave",
    "tier": 2
   },
   {
    "answer": "Hired hand",
    "tier": 3,
    "aliases": [
     "Hired servant"
    ]
   },
   {
    "answer": "Vinedresser",
    "tier": 3
   },
   {
    "answer": "Gardener",
    "tier": 3
   },
   {
    "answer": "Sower",
    "tier": 2
   },
   {
    "answer": "Reaper",
    "tier": 3
   },
   {
    "answer": "Gleaner",
    "tier": 5
   },
   {
    "answer": "Thresher",
    "tier": 5
   },
   {
    "answer": "Watchman",
    "tier": 3
   },
   {
    "answer": "Gatekeeper",
    "tier": 4,
    "aliases": [
     "Doorkeeper"
    ]
   },
   {
    "answer": "Midwife",
    "tier": 2
   },
   {
    "answer": "Musician",
    "tier": 2
   },
   {
    "answer": "Singer",
    "tier": 3
   },
   {
    "answer": "Harpist",
    "tier": 3,
    "aliases": [
     "Lyre player"
    ]
   },
   {
    "answer": "Trumpeter",
    "tier": 4
   },
   {
    "answer": "Hunter",
    "tier": 2
   },
   {
    "answer": "Herdsman",
    "tier": 3
   },
   {
    "answer": "Magician",
    "tier": 3
   },
   {
    "answer": "Sorcerer",
    "tier": 3
   },
   {
    "answer": "Fortune-teller",
    "tier": 4
   },
   {
    "answer": "Governor",
    "tier": 2
   },
   {
    "answer": "Lawyer",
    "tier": 3,
    "aliases": [
     "Expert in the law"
    ]
   },
   {
    "answer": "Embalmer",
    "tier": 5
   },
   {
    "answer": "Perfumer",
    "tier": 5
   },
   {
    "answer": "Spy",
    "tier": 4
   },
   {
    "answer": "Messenger",
    "tier": 3
   },
   {
    "answer": "Charioteer",
    "tier": 5
   },
   {
    "answer": "Archer",
    "tier": 4
   },
   {
    "answer": "Armor-bearer",
    "tier": 4,
    "aliases": [
     "Armour-bearer"
    ]
   },
   {
    "answer": "Executioner",
    "tier": 6
   },
   {
    "answer": "Jailer",
    "tier": 3
   },
   {
    "answer": "Town clerk",
    "tier": 5
   },
   {
    "answer": "Nurse",
    "tier": 5,
    "aliases": [
     "Wet nurse"
    ]
   },
   {
    "answer": "Exorcist",
    "tier": 4
   },
   {
    "answer": "Evangelist",
    "tier": 3
   },
   {
    "answer": "Orator",
    "tier": 5
   }
  ]
 },
 {
  "id": "authored-papal-names",
  "theme": "church-history",
  "basis": "Hand-authored; the Annuario Pontificio list of popes.",
  "prompt": "Name a name taken by a pope as his papal name.",
  "context": "Any regnal name used by at least one pope.",
  "answers": [
   {
    "answer": "Peter",
    "tier": 1
   },
   {
    "answer": "Linus",
    "tier": 3
   },
   {
    "answer": "Clement",
    "tier": 1
   },
   {
    "answer": "Anacletus",
    "tier": 4,
    "aliases": [
     "Cletus"
    ]
   },
   {
    "answer": "Evaristus",
    "tier": 5
   },
   {
    "answer": "Alexander",
    "tier": 2
   },
   {
    "answer": "Sixtus",
    "tier": 3
   },
   {
    "answer": "Telesphorus",
    "tier": 5
   },
   {
    "answer": "Hyginus",
    "tier": 5
   },
   {
    "answer": "Pius",
    "tier": 1
   },
   {
    "answer": "Anicetus",
    "tier": 6
   },
   {
    "answer": "Soter",
    "tier": 6
   },
   {
    "answer": "Eleutherius",
    "tier": 6,
    "aliases": [
     "Eleuterus"
    ]
   },
   {
    "answer": "Victor",
    "tier": 3
   },
   {
    "answer": "Zephyrinus",
    "tier": 6
   },
   {
    "answer": "Callixtus",
    "tier": 3,
    "aliases": [
     "Calixtus",
     "Callistus"
    ]
   },
   {
    "answer": "Urban",
    "tier": 2
   },
   {
    "answer": "Pontian",
    "tier": 5
   },
   {
    "answer": "Anterus",
    "tier": 6
   },
   {
    "answer": "Fabian",
    "tier": 5
   },
   {
    "answer": "Cornelius",
    "tier": 4
   },
   {
    "answer": "Lucius",
    "tier": 4
   },
   {
    "answer": "Stephen",
    "tier": 2
   },
   {
    "answer": "Dionysius",
    "tier": 5
   },
   {
    "answer": "Felix",
    "tier": 3
   },
   {
    "answer": "Eutychian",
    "tier": 6
   },
   {
    "answer": "Caius",
    "tier": 6,
    "aliases": [
     "Gaius"
    ]
   },
   {
    "answer": "Marcellinus",
    "tier": 5
   },
   {
    "answer": "Marcellus",
    "tier": 4
   },
   {
    "answer": "Eusebius",
    "tier": 5
   },
   {
    "answer": "Miltiades",
    "tier": 6
   },
   {
    "answer": "Sylvester",
    "tier": 3
   },
   {
    "answer": "Mark",
    "tier": 4
   },
   {
    "answer": "Julius",
    "tier": 3
   },
   {
    "answer": "Liberius",
    "tier": 5
   },
   {
    "answer": "Damasus",
    "tier": 3
   },
   {
    "answer": "Siricius",
    "tier": 6
   },
   {
    "answer": "Anastasius",
    "tier": 4
   },
   {
    "answer": "Innocent",
    "tier": 1
   },
   {
    "answer": "Zosimus",
    "tier": 5
   },
   {
    "answer": "Boniface",
    "tier": 2
   },
   {
    "answer": "Celestine",
    "tier": 3
   },
   {
    "answer": "Leo",
    "tier": 1
   },
   {
    "answer": "Hilarius",
    "tier": 6,
    "aliases": [
     "Hilary"
    ]
   },
   {
    "answer": "Simplicius",
    "tier": 6
   },
   {
    "answer": "Gelasius",
    "tier": 4
   },
   {
    "answer": "Symmachus",
    "tier": 6
   },
   {
    "answer": "Hormisdas",
    "tier": 6
   },
   {
    "answer": "John",
    "tier": 1
   },
   {
    "answer": "Agapetus",
    "tier": 6
   },
   {
    "answer": "Silverius",
    "tier": 6
   },
   {
    "answer": "Vigilius",
    "tier": 6
   },
   {
    "answer": "Pelagius",
    "tier": 5
   },
   {
    "answer": "Benedict",
    "tier": 1
   },
   {
    "answer": "Gregory",
    "tier": 1
   },
   {
    "answer": "Sabinian",
    "tier": 6
   },
   {
    "answer": "Deusdedit",
    "tier": 6
   },
   {
    "answer": "Honorius",
    "tier": 4
   },
   {
    "answer": "Severinus",
    "tier": 6
   },
   {
    "answer": "Theodore",
    "tier": 5
   },
   {
    "answer": "Martin",
    "tier": 3
   },
   {
    "answer": "Eugene",
    "tier": 3
   },
   {
    "answer": "Vitalian",
    "tier": 6
   },
   {
    "answer": "Adeodatus",
    "tier": 6
   },
   {
    "answer": "Donus",
    "tier": 6
   },
   {
    "answer": "Agatho",
    "tier": 6
   },
   {
    "answer": "Conon",
    "tier": 6
   },
   {
    "answer": "Sergius",
    "tier": 4
   },
   {
    "answer": "Sisinnius",
    "tier": 6
   },
   {
    "answer": "Constantine",
    "tier": 5
   },
   {
    "answer": "Zachary",
    "tier": 5,
    "aliases": [
     "Zacharias"
    ]
   },
   {
    "answer": "Paul",
    "tier": 1
   },
   {
    "answer": "Adrian",
    "tier": 3,
    "aliases": [
     "Hadrian"
    ]
   },
   {
    "answer": "Nicholas",
    "tier": 3
   },
   {
    "answer": "Marinus",
    "tier": 6
   },
   {
    "answer": "Formosus",
    "tier": 5
   },
   {
    "answer": "Romanus",
    "tier": 6
   },
   {
    "answer": "Lando",
    "tier": 6
   },
   {
    "answer": "Paschal",
    "tier": 4
   },
   {
    "answer": "Valentine",
    "tier": 6
   },
   {
    "answer": "Francis",
    "tier": 1
   },
   {
    "answer": "John Paul",
    "tier": 1
   }
  ]
 },
 {
  "id": "authored-titles-of-jesus",
  "theme": "scripture",
  "basis": "Hand-authored; the New Testament and messianic prophecies.",
  "prompt": "Name a title or name given to Jesus in the Bible.",
  "context": "Titles from the Old Testament prophecies, the Gospels, Acts, the letters and Revelation.",
  "answers": [
   {
    "answer": "Christ",
    "tier": 1,
    "aliases": [
     "Messiah",
     "The Messiah",
     "The Christ"
    ]
   },
   {
    "answer": "Lord",
    "tier": 1
   },
   {
    "answer": "Son of God",
    "tier": 1
   },
   {
    "answer": "Son of Man",
    "tier": 1
   },
   {
    "answer": "Son of David",
    "tier": 2
   },
   {
    "answer": "Lamb of God",
    "tier": 1
   },
   {
    "answer": "The Word",
    "tier": 2,
    "aliases": [
     "Logos"
    ]
   },
   {
    "answer": "Emmanuel",
    "tier": 1,
    "aliases": [
     "Immanuel"
    ]
   },
   {
    "answer": "Savior",
    "tier": 1,
    "aliases": [
     "Saviour"
    ]
   },
   {
    "answer": "Redeemer",
    "tier": 2
   },
   {
    "answer": "King of Kings",
    "tier": 2
   },
   {
    "answer": "King of the Jews",
    "tier": 2
   },
   {
    "answer": "Lord of Lords",
    "tier": 4
   },
   {
    "answer": "Prince of Peace",
    "tier": 2
   },
   {
    "answer": "Wonderful Counselor",
    "tier": 3,
    "aliases": [
     "Wonderful Counsellor"
    ]
   },
   {
    "answer": "Mighty God",
    "tier": 3
   },
   {
    "answer": "Everlasting Father",
    "tier": 3
   },
   {
    "answer": "Good Shepherd",
    "tier": 1
   },
   {
    "answer": "Bread of Life",
    "tier": 1
   },
   {
    "answer": "Light of the World",
    "tier": 1
   },
   {
    "answer": "True Vine",
    "tier": 2
   },
   {
    "answer": "The Way, the Truth and the Life",
    "tier": 2,
    "aliases": [
     "Way",
     "The Way"
    ]
   },
   {
    "answer": "The Door",
    "tier": 3,
    "aliases": [
     "The Gate"
    ]
   },
   {
    "answer": "Resurrection and the Life",
    "tier": 2
   },
   {
    "answer": "Alpha and Omega",
    "tier": 1
   },
   {
    "answer": "Rabbi",
    "tier": 2
   },
   {
    "answer": "Teacher",
    "tier": 2
   },
   {
    "answer": "Master",
    "tier": 3
   },
   {
    "answer": "High Priest",
    "tier": 2,
    "aliases": [
     "Great High Priest"
    ]
   },
   {
    "answer": "Mediator",
    "tier": 3
   },
   {
    "answer": "Bridegroom",
    "tier": 3
   },
   {
    "answer": "Cornerstone",
    "tier": 2,
    "aliases": [
     "Chief Cornerstone"
    ]
   },
   {
    "answer": "The Rock",
    "tier": 3
   },
   {
    "answer": "Morning Star",
    "tier": 3,
    "aliases": [
     "Bright Morning Star"
    ]
   },
   {
    "answer": "Root of Jesse",
    "tier": 4
   },
   {
    "answer": "Lion of Judah",
    "tier": 2
   },
   {
    "answer": "The Branch",
    "tier": 4
   },
   {
    "answer": "Suffering Servant",
    "tier": 3
   },
   {
    "answer": "Holy One of God",
    "tier": 3,
    "aliases": [
     "Holy One"
    ]
   },
   {
    "answer": "Righteous One",
    "tier": 4
   },
   {
    "answer": "Last Adam",
    "tier": 4,
    "aliases": [
     "Second Adam"
    ]
   },
   {
    "answer": "Firstborn",
    "tier": 4
   },
   {
    "answer": "Firstfruits",
    "tier": 5
   },
   {
    "answer": "Head of the Church",
    "tier": 3
   },
   {
    "answer": "Chief Shepherd",
    "tier": 5
   },
   {
    "answer": "Great Shepherd",
    "tier": 5
   },
   {
    "answer": "Author and Perfecter of our faith",
    "tier": 4
   },
   {
    "answer": "Advocate",
    "tier": 4
   },
   {
    "answer": "Judge",
    "tier": 3
   },
   {
    "answer": "Faithful and True",
    "tier": 4
   },
   {
    "answer": "Living Stone",
    "tier": 4
   },
   {
    "answer": "Image of the invisible God",
    "tier": 4
   },
   {
    "answer": "Radiance of God's glory",
    "tier": 5
   },
   {
    "answer": "Nazarene",
    "tier": 3
   },
   {
    "answer": "Galilean",
    "tier": 5
   },
   {
    "answer": "Carpenter",
    "tier": 3
   },
   {
    "answer": "Son of Mary",
    "tier": 4
   },
   {
    "answer": "Prophet",
    "tier": 3
   },
   {
    "answer": "King of Israel",
    "tier": 3
   },
   {
    "answer": "Heir of all things",
    "tier": 6
   },
   {
    "answer": "Sun of Righteousness",
    "tier": 5
   },
   {
    "answer": "Dayspring",
    "tier": 6,
    "aliases": [
     "Dawn from on high"
    ]
   },
   {
    "answer": "Desire of the nations",
    "tier": 6
   },
   {
    "answer": "Wisdom of God",
    "tier": 4
   },
   {
    "answer": "Power of God",
    "tier": 5
   },
   {
    "answer": "Son of the Most High",
    "tier": 4
   },
   {
    "answer": "Anointed One",
    "tier": 3
   },
   {
    "answer": "Chosen One",
    "tier": 5
   },
   {
    "answer": "The Amen",
    "tier": 5
   },
   {
    "answer": "The First and the Last",
    "tier": 4
   },
   {
    "answer": "The Living One",
    "tier": 5
   },
   {
    "answer": "Lamb that was slain",
    "tier": 4,
    "aliases": [
     "Lamb who was slain"
    ]
   },
   {
    "answer": "Physician",
    "tier": 4
   },
   {
    "answer": "Bread from heaven",
    "tier": 3,
    "aliases": [
     "Bread of Heaven"
    ]
   }
  ]
 },
 {
  "id": "authored-christian-symbols",
  "theme": "art-music",
  "basis": "Hand-authored; standard references on Christian iconography.",
  "prompt": "Name a symbol or attribute used in Christian art.",
  "context": "Signs for Christ, for the Evangelists, and objects that identify a saint.",
  "answers": [
   {
    "answer": "Cross",
    "tier": 1
   },
   {
    "answer": "Crucifix",
    "tier": 1
   },
   {
    "answer": "Chi-Rho",
    "tier": 2,
    "aliases": [
     "Chi Rho"
    ]
   },
   {
    "answer": "Fish",
    "tier": 1,
    "aliases": [
     "Ichthys"
    ]
   },
   {
    "answer": "Anchor",
    "tier": 2
   },
   {
    "answer": "Dove",
    "tier": 1
   },
   {
    "answer": "Lamb",
    "tier": 1
   },
   {
    "answer": "Good Shepherd",
    "tier": 2
   },
   {
    "answer": "Pelican",
    "tier": 3
   },
   {
    "answer": "Phoenix",
    "tier": 4
   },
   {
    "answer": "Alpha and Omega",
    "tier": 2
   },
   {
    "answer": "Peacock",
    "tier": 4
   },
   {
    "answer": "IHS",
    "tier": 2
   },
   {
    "answer": "INRI",
    "tier": 2
   },
   {
    "answer": "Triquetra",
    "tier": 4
   },
   {
    "answer": "Shield of the Trinity",
    "tier": 5
   },
   {
    "answer": "Sacred Heart",
    "tier": 1
   },
   {
    "answer": "Crown of thorns",
    "tier": 1
   },
   {
    "answer": "Nails",
    "tier": 3
   },
   {
    "answer": "Halo",
    "tier": 1,
    "aliases": [
     "Nimbus"
    ]
   },
   {
    "answer": "Chalice",
    "tier": 1
   },
   {
    "answer": "Host",
    "tier": 2
   },
   {
    "answer": "Monstrance",
    "tier": 3
   },
   {
    "answer": "Lily",
    "tier": 2
   },
   {
    "answer": "Rose",
    "tier": 2
   },
   {
    "answer": "Palm branch",
    "tier": 2,
    "aliases": [
     "Palm"
    ]
   },
   {
    "answer": "Keys",
    "tier": 1,
    "aliases": [
     "Crossed keys"
    ]
   },
   {
    "answer": "Sword",
    "tier": 2
   },
   {
    "answer": "Wheel",
    "tier": 3
   },
   {
    "answer": "Gridiron",
    "tier": 3
   },
   {
    "answer": "Arrows",
    "tier": 2
   },
   {
    "answer": "Skull",
    "tier": 3
   },
   {
    "answer": "Book",
    "tier": 2
   },
   {
    "answer": "Scroll",
    "tier": 3
   },
   {
    "answer": "Quill",
    "tier": 4
   },
   {
    "answer": "Lion",
    "tier": 2
   },
   {
    "answer": "Ox",
    "tier": 3
   },
   {
    "answer": "Eagle",
    "tier": 2
   },
   {
    "answer": "Winged man",
    "tier": 3
   },
   {
    "answer": "Scallop shell",
    "tier": 3
   },
   {
    "answer": "Pilgrim staff",
    "tier": 3
   },
   {
    "answer": "Crozier",
    "tier": 3
   },
   {
    "answer": "Mitre",
    "tier": 3
   },
   {
    "answer": "Stigmata",
    "tier": 2
   },
   {
    "answer": "Candle",
    "tier": 3
   },
   {
    "answer": "Lamp",
    "tier": 3
   },
   {
    "answer": "Tablets of the Law",
    "tier": 3,
    "aliases": [
     "Ten Commandments"
    ]
   },
   {
    "answer": "Star",
    "tier": 2
   },
   {
    "answer": "Rainbow",
    "tier": 3
   },
   {
    "answer": "Olive branch",
    "tier": 2
   },
   {
    "answer": "Vine",
    "tier": 3
   },
   {
    "answer": "Wheat",
    "tier": 3
   },
   {
    "answer": "Grapes",
    "tier": 2
   },
   {
    "answer": "Net",
    "tier": 3
   },
   {
    "answer": "Boat",
    "tier": 3
   },
   {
    "answer": "Rooster",
    "tier": 3,
    "aliases": [
     "Cock"
    ]
   },
   {
    "answer": "Serpent",
    "tier": 2,
    "aliases": [
     "Snake"
    ]
   },
   {
    "answer": "Dragon",
    "tier": 2
   },
   {
    "answer": "Unicorn",
    "tier": 5
   },
   {
    "answer": "Tower",
    "tier": 4
   },
   {
    "answer": "Basket of roses",
    "tier": 5
   },
   {
    "answer": "Bees",
    "tier": 5
   },
   {
    "answer": "Wolf",
    "tier": 4
   },
   {
    "answer": "Ladder",
    "tier": 4
   },
   {
    "answer": "Burning bush",
    "tier": 4
   },
   {
    "answer": "Ark",
    "tier": 3
   },
   {
    "answer": "Sponge",
    "tier": 4
   },
   {
    "answer": "Lance",
    "tier": 3,
    "aliases": [
     "Spear"
    ]
   },
   {
    "answer": "Pillar",
    "tier": 4
   },
   {
    "answer": "Scourge",
    "tier": 4
   },
   {
    "answer": "Dice",
    "tier": 5
   },
   {
    "answer": "Purse",
    "tier": 5,
    "aliases": [
     "Moneybag"
    ]
   },
   {
    "answer": "Thirty pieces of silver",
    "tier": 3
   },
   {
    "answer": "Hand of God",
    "tier": 4
   },
   {
    "answer": "Eye of Providence",
    "tier": 4
   },
   {
    "answer": "Rosary",
    "tier": 1
   },
   {
    "answer": "Pallium",
    "tier": 5
   },
   {
    "answer": "Tiara",
    "tier": 3
   },
   {
    "answer": "Fleur-de-lis",
    "tier": 6
   },
   {
    "answer": "Mandorla",
    "tier": 6
   },
   {
    "answer": "Veil of Veronica",
    "tier": 5
   },
   {
    "answer": "Shroud",
    "tier": 3
   },
   {
    "answer": "Burning heart",
    "tier": 4
   }
  ]
 }
];
