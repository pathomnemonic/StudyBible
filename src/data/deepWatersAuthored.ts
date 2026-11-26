import type { DeepPrompt } from './deepWaters';

/**
 * Hand-authored Deep Waters prompts. Each answer key was chosen one answer at a time (not generated from a list or a template), with a source and an
 * explicit scope. They began as ChatGPT's hand-authored batch; they were then checked and corrected here, and the tiers were moved to the six-band scale.
 * Every one is still unreviewed by a person (see src/data/deepWaters.review.json). Tiers are editorial judgement of familiarity, not survey data.
 */
export const AUTHORED_PROMPTS: DeepPrompt[] = [
 {
  "id": "authored-pauline-coworkers",
  "theme": "people",
  "basis": "Hand-authored answer key; sources: Acts 13–28; Romans 16; 1 Corinthians 16; Colossians 4; 2 Timothy 4.",
  "prompt": "Name a person who worked with or was named by Paul in Acts or his letters.",
  "context": "Think of travelling companions, church leaders and people greeted or commended in Paul's letters.",
  "answers": [
   {
    "answer": "Barnabas",
    "tier": 1
   },
   {
    "answer": "Silas",
    "tier": 1
   },
   {
    "answer": "Timothy",
    "tier": 1
   },
   {
    "answer": "Titus",
    "tier": 1
   },
   {
    "answer": "Luke",
    "tier": 1
   },
   {
    "answer": "John Mark",
    "tier": 2,
    "aliases": [
     "Mark"
    ]
   },
   {
    "answer": "Priscilla",
    "tier": 2,
    "aliases": [
     "Prisca"
    ]
   },
   {
    "answer": "Aquila",
    "tier": 2
   },
   {
    "answer": "Phoebe",
    "tier": 2
   },
   {
    "answer": "Tychicus",
    "tier": 3
   },
   {
    "answer": "Aristarchus",
    "tier": 3
   },
   {
    "answer": "Trophimus",
    "tier": 4
   },
   {
    "answer": "Epaphras",
    "tier": 3
   },
   {
    "answer": "Epaphroditus",
    "tier": 3
   },
   {
    "answer": "Onesimus",
    "tier": 3
   },
   {
    "answer": "Sosthenes",
    "tier": 3
   },
   {
    "answer": "Erastus",
    "tier": 3
   },
   {
    "answer": "Gaius",
    "tier": 2
   },
   {
    "answer": "Sopater",
    "tier": 4
   },
   {
    "answer": "Secundus",
    "tier": 4
   },
   {
    "answer": "Tertius",
    "tier": 4
   },
   {
    "answer": "Crescens",
    "tier": 6
   },
   {
    "answer": "Demas",
    "tier": 3
   },
   {
    "answer": "Apollos",
    "tier": 2
   },
   {
    "answer": "Andronicus",
    "tier": 4
   },
   {
    "answer": "Junia",
    "tier": 4
   },
   {
    "answer": "Jason",
    "tier": 3
   },
   {
    "answer": "Mnason",
    "tier": 6
   }
  ]
 },
 {
  "id": "authored-romans16-women",
  "theme": "people",
  "basis": "Hand-authored answer key; sources: Romans 16:1–15.",
  "prompt": "Name a woman Paul greets or mentions in Romans 16.",
  "context": "Ten women are named or identified by a family tie in this chapter.",
  "answers": [
   {
    "answer": "Phoebe",
    "tier": 1
   },
   {
    "answer": "Prisca",
    "tier": 1,
    "aliases": [
     "Priscilla"
    ]
   },
   {
    "answer": "Mary",
    "tier": 1
   },
   {
    "answer": "Junia",
    "tier": 2
   },
   {
    "answer": "Tryphaena",
    "tier": 3
   },
   {
    "answer": "Tryphosa",
    "tier": 3
   },
   {
    "answer": "Persis",
    "tier": 3
   },
   {
    "answer": "Rufus's mother",
    "tier": 4,
    "aliases": [
     "Mother of Rufus"
    ]
   },
   {
    "answer": "Julia",
    "tier": 3
   },
   {
    "answer": "Nereus's sister",
    "tier": 6,
    "aliases": [
     "Sister of Nereus"
    ]
   }
  ],
  "closed": 10
 },
 {
  "id": "authored-luke-parables",
  "theme": "scripture",
  "basis": "Hand-authored answer key; sources: Luke 10:25–37; 12:13–21; 13:6–9; 14:7–24; 15:8–32; 16:1–31; 18:1–14.",
  "prompt": "Name a parable of Jesus that appears only in Luke's Gospel.",
  "context": "Matthew has a related banquet story (the Wedding Feast); Luke's version is counted because it is told differently.",
  "answers": [
   {
    "answer": "The Good Samaritan",
    "tier": 1,
    "aliases": [
     "Good Samaritan"
    ]
   },
   {
    "answer": "The Rich Fool",
    "tier": 2
   },
   {
    "answer": "The Barren Fig Tree",
    "tier": 2
   },
   {
    "answer": "The Great Banquet",
    "tier": 2
   },
   {
    "answer": "The Lowest Seat at the Banquet",
    "tier": 3,
    "aliases": [
     "The Wedding Feast Seats"
    ]
   },
   {
    "answer": "The Lost Coin",
    "tier": 1
   },
   {
    "answer": "The Prodigal Son",
    "tier": 1,
    "aliases": [
     "The Lost Son"
    ]
   },
   {
    "answer": "The Shrewd Manager",
    "tier": 3,
    "aliases": [
     "The Unjust Steward"
    ]
   },
   {
    "answer": "The Rich Man and Lazarus",
    "tier": 2
   },
   {
    "answer": "The Persistent Widow",
    "tier": 2
   },
   {
    "answer": "The Pharisee and the Tax Collector",
    "tier": 2
   },
   {
    "answer": "The Friend at Midnight",
    "tier": 3
   },
   {
    "answer": "The Tower Builder",
    "tier": 3
   },
   {
    "answer": "The King Going to War",
    "tier": 4
   },
   {
    "answer": "The Two Debtors",
    "tier": 3,
    "aliases": [
     "The Moneylender and Two Debtors"
    ]
   },
   {
    "answer": "The Unworthy Servants",
    "tier": 4,
    "aliases": [
     "The Servant's Duty",
     "The Worthless Servants"
    ]
   }
  ]
 },
 {
  "id": "authored-pauline-letters",
  "theme": "scripture",
  "basis": "Hand-authored answer key; sources: Romans; 1–2 Corinthians; Galatians; Ephesians; Philippians; Colossians; 1–2 Thessalonians; 1–2 Timothy; Titus; Philemon.",
  "prompt": "Name a New Testament letter that names Paul as its author.",
  "context": "Thirteen letters. Hebrews does not name its author, so it is not counted.",
  "answers": [
   {
    "answer": "Romans",
    "tier": 1
   },
   {
    "answer": "1 Corinthians",
    "tier": 1,
    "aliases": [
     "First Corinthians"
    ]
   },
   {
    "answer": "2 Corinthians",
    "tier": 1,
    "aliases": [
     "Second Corinthians"
    ]
   },
   {
    "answer": "Galatians",
    "tier": 1
   },
   {
    "answer": "Ephesians",
    "tier": 1
   },
   {
    "answer": "Philippians",
    "tier": 1
   },
   {
    "answer": "Colossians",
    "tier": 1
   },
   {
    "answer": "1 Thessalonians",
    "tier": 2,
    "aliases": [
     "First Thessalonians"
    ]
   },
   {
    "answer": "2 Thessalonians",
    "tier": 2,
    "aliases": [
     "Second Thessalonians"
    ]
   },
   {
    "answer": "1 Timothy",
    "tier": 2,
    "aliases": [
     "First Timothy"
    ]
   },
   {
    "answer": "2 Timothy",
    "tier": 2,
    "aliases": [
     "Second Timothy"
    ]
   },
   {
    "answer": "Titus",
    "tier": 2
   },
   {
    "answer": "Philemon",
    "tier": 2
   }
  ],
  "closed": 13
 },
 {
  "id": "authored-resurrection-witnesses",
  "theme": "scripture",
  "basis": "Hand-authored answer key; sources: Matthew 28; Luke 24; John 20–21; Acts 9; 1 Corinthians 15:5–8.",
  "prompt": "Name a person or group who met the risen Jesus in the New Testament.",
  "context": "People who only heard a report, or saw angels at the tomb, are not counted.",
  "answers": [
   {
    "answer": "Mary Magdalene",
    "tier": 1
   },
   {
    "answer": "Peter",
    "tier": 1,
    "aliases": [
     "Simon Peter",
     "Cephas"
    ]
   },
   {
    "answer": "The beloved disciple",
    "tier": 2,
    "aliases": [
     "John (traditional identification)"
    ]
   },
   {
    "answer": "Thomas",
    "tier": 1,
    "aliases": [
     "Didymus"
    ]
   },
   {
    "answer": "Cleopas",
    "tier": 3
   },
   {
    "answer": "James",
    "tier": 2,
    "aliases": [
     "James the brother of the Lord"
    ]
   },
   {
    "answer": "Mary the mother of James",
    "tier": 3
   },
   {
    "answer": "The two disciples on the road to Emmaus",
    "tier": 2
   },
   {
    "answer": "The Twelve",
    "tier": 1,
    "aliases": [
     "The Eleven"
    ]
   },
   {
    "answer": "The five hundred brothers",
    "tier": 4
   },
   {
    "answer": "Paul",
    "tier": 1,
    "aliases": [
     "Saul of Tarsus"
    ]
   },
   {
    "answer": "The women at the tomb",
    "tier": 2,
    "aliases": [
     "The women who came to the tomb"
    ]
   },
   {
    "answer": "The seven disciples at the Sea of Tiberias",
    "tier": 4,
    "aliases": [
     "The disciples fishing at Tiberias"
    ]
   }
  ]
 },
 {
  "id": "authored-marian-litany",
  "theme": "devotion",
  "basis": "Hand-authored answer key; Litany of Loreto, current text.",
  "prompt": "Name an invocation from the Litany of Loreto.",
  "context": "The traditional litany, including the invocations added in 2020, not every title ever given to Mary.",
  "answers": [
   {
    "answer": "Holy Mary",
    "tier": 1
   },
   {
    "answer": "Holy Mother of God",
    "tier": 1
   },
   {
    "answer": "Mother of Christ",
    "tier": 1
   },
   {
    "answer": "Holy Virgin of virgins",
    "tier": 2
   },
   {
    "answer": "Mother of the Church",
    "tier": 2
   },
   {
    "answer": "Mother of mercy",
    "tier": 3,
    "aliases": [
     "Mother of Mercy"
    ]
   },
   {
    "answer": "Mother of divine grace",
    "tier": 3
   },
   {
    "answer": "Mother of hope",
    "tier": 3
   },
   {
    "answer": "Mother most pure",
    "tier": 1
   },
   {
    "answer": "Mother most chaste",
    "tier": 2
   },
   {
    "answer": "Mother inviolate",
    "tier": 3
   },
   {
    "answer": "Mother undefiled",
    "tier": 3
   },
   {
    "answer": "Mother most amiable",
    "tier": 3
   },
   {
    "answer": "Mother most admirable",
    "tier": 3
   },
   {
    "answer": "Mother of good counsel",
    "tier": 2,
    "aliases": [
     "Mother of Good Counsel"
    ]
   },
   {
    "answer": "Mother of our Creator",
    "tier": 3
   },
   {
    "answer": "Mother of our Savior",
    "tier": 2,
    "aliases": [
     "Mother of our Saviour"
    ]
   },
   {
    "answer": "Virgin most prudent",
    "tier": 2
   },
   {
    "answer": "Virgin most venerable",
    "tier": 3
   },
   {
    "answer": "Virgin most renowned",
    "tier": 4
   },
   {
    "answer": "Virgin most powerful",
    "tier": 3
   },
   {
    "answer": "Virgin most merciful",
    "tier": 3
   },
   {
    "answer": "Virgin most faithful",
    "tier": 3
   },
   {
    "answer": "Mirror of justice",
    "tier": 3
   },
   {
    "answer": "Seat of wisdom",
    "tier": 2
   },
   {
    "answer": "Cause of our joy",
    "tier": 3
   },
   {
    "answer": "Spiritual vessel",
    "tier": 4
   },
   {
    "answer": "Vessel of honor",
    "tier": 4,
    "aliases": [
     "Vessel of honour"
    ]
   },
   {
    "answer": "Singular vessel of devotion",
    "tier": 5,
    "aliases": [
     "Vessel of devotion"
    ]
   },
   {
    "answer": "Mystical rose",
    "tier": 2
   },
   {
    "answer": "Tower of David",
    "tier": 2
   },
   {
    "answer": "Tower of ivory",
    "tier": 3
   },
   {
    "answer": "House of gold",
    "tier": 3
   },
   {
    "answer": "Ark of the covenant",
    "tier": 2
   },
   {
    "answer": "Gate of heaven",
    "tier": 1
   },
   {
    "answer": "Morning star",
    "tier": 1
   },
   {
    "answer": "Health of the sick",
    "tier": 1
   },
   {
    "answer": "Refuge of sinners",
    "tier": 1
   },
   {
    "answer": "Solace of migrants",
    "tier": 4,
    "aliases": [
     "Comfort of migrants"
    ]
   },
   {
    "answer": "Comforter of the afflicted",
    "tier": 1
   },
   {
    "answer": "Help of Christians",
    "tier": 1
   },
   {
    "answer": "Queen of angels",
    "tier": 1
   },
   {
    "answer": "Queen of patriarchs",
    "tier": 3
   },
   {
    "answer": "Queen of prophets",
    "tier": 3
   },
   {
    "answer": "Queen of apostles",
    "tier": 2
   },
   {
    "answer": "Queen of martyrs",
    "tier": 2
   },
   {
    "answer": "Queen of confessors",
    "tier": 3
   },
   {
    "answer": "Queen of virgins",
    "tier": 2
   },
   {
    "answer": "Queen of all saints",
    "tier": 1
   },
   {
    "answer": "Queen conceived without original sin",
    "tier": 3,
    "aliases": [
     "Queen conceived without sin",
     "Queen of the Immaculate Conception"
    ]
   },
   {
    "answer": "Queen assumed into heaven",
    "tier": 2,
    "aliases": [
     "Queen of the Assumption",
     "Queen taken up into heaven"
    ]
   },
   {
    "answer": "Queen of the most holy Rosary",
    "tier": 2,
    "aliases": [
     "Queen of the Rosary",
     "Queen of the Holy Rosary"
    ]
   },
   {
    "answer": "Queen of families",
    "tier": 3,
    "aliases": [
     "Queen of the family"
    ]
   },
   {
    "answer": "Queen of peace",
    "tier": 1
   }
  ]
 },
 {
  "id": "authored-early-martyrs",
  "theme": "saints",
  "basis": "Hand-authored answer key; sources: Acts 7; early martyr acts and patristic witnesses, including the Martyrdom of Polycarp.",
  "prompt": "Name a martyr of the early Church, before the conversion of Constantine.",
  "context": "From the apostles to the persecution under Diocletian, ending around the year 313.",
  "answers": [
   {
    "answer": "Stephen",
    "tier": 1,
    "aliases": [
     "Stephen the Protomartyr"
    ]
   },
   {
    "answer": "Ignatius of Antioch",
    "tier": 1,
    "aliases": [
     "Ignatius"
    ]
   },
   {
    "answer": "James son of Zebedee",
    "tier": 2,
    "aliases": [
     "James"
    ]
   },
   {
    "answer": "Polycarp of Smyrna",
    "tier": 1,
    "aliases": [
     "Polycarp"
    ]
   },
   {
    "answer": "Justin Martyr",
    "tier": 1
   },
   {
    "answer": "Perpetua",
    "tier": 1
   },
   {
    "answer": "Felicity",
    "tier": 1,
    "aliases": [
     "Felicitas"
    ]
   },
   {
    "answer": "Pionius",
    "tier": 4
   },
   {
    "answer": "Blandina",
    "tier": 2
   },
   {
    "answer": "Potinus",
    "tier": 4,
    "aliases": [
     "Pothinus"
    ]
   },
   {
    "answer": "Speratus",
    "tier": 4
   },
   {
    "answer": "Cyprian of Carthage",
    "tier": 1,
    "aliases": [
     "Cyprian"
    ]
   },
   {
    "answer": "Lawrence of Rome",
    "tier": 1,
    "aliases": [
     "Lawrence"
    ]
   },
   {
    "answer": "Agnes of Rome",
    "tier": 1,
    "aliases": [
     "Agnes"
    ]
   },
   {
    "answer": "Cecilia of Rome",
    "tier": 2,
    "aliases": [
     "Cecilia"
    ]
   },
   {
    "answer": "Sixtus II",
    "tier": 2
   },
   {
    "answer": "Fructuosus of Tarragona",
    "tier": 4,
    "aliases": [
     "Fructuosus"
    ]
   },
   {
    "answer": "Eulalia of Mérida",
    "tier": 3,
    "aliases": [
     "Eulalia"
    ]
   },
   {
    "answer": "Quirinus of Neuss",
    "tier": 6,
    "aliases": [
     "Quirinus"
    ]
   },
   {
    "answer": "Pancras of Rome",
    "tier": 3,
    "aliases": [
     "Pancras"
    ]
   },
   {
    "answer": "Crispina of Thagura",
    "tier": 6,
    "aliases": [
     "Crispina"
    ]
   },
   {
    "answer": "Peter",
    "tier": 1,
    "aliases": [
     "Simon Peter",
     "Saint Peter"
    ]
   },
   {
    "answer": "Paul",
    "tier": 1,
    "aliases": [
     "Saul of Tarsus",
     "Saint Paul"
    ]
   },
   {
    "answer": "Sebastian",
    "tier": 2
   },
   {
    "answer": "Agatha of Sicily",
    "tier": 2,
    "aliases": [
     "Agatha"
    ]
   },
   {
    "answer": "Lucy of Syracuse",
    "tier": 2,
    "aliases": [
     "Lucy",
     "Lucia"
    ]
   },
   {
    "answer": "George",
    "tier": 3,
    "aliases": [
     "George of Lydda"
    ]
   },
   {
    "answer": "Alban",
    "tier": 4,
    "aliases": [
     "Alban of Verulamium"
    ]
   }
  ]
 },
 {
  "id": "authored-prophets-before-kings",
  "theme": "scripture",
  "basis": "Hand-authored answer key; sources: 1 Samuel 15; 2 Samuel 12; 1 Kings 18–22; 2 Kings 1–9; Isaiah 7; Jeremiah 21–38.",
  "prompt": "Name a prophet who confronted or warned a king of Israel or Judah.",
  "context": "Prophets whose meetings with a king are told in Scripture, from Samuel to Jeremiah.",
  "answers": [
   {
    "answer": "Samuel",
    "tier": 1
   },
   {
    "answer": "Nathan",
    "tier": 1
   },
   {
    "answer": "Gad",
    "tier": 3
   },
   {
    "answer": "Ahijah of Shiloh",
    "tier": 3,
    "aliases": [
     "Ahijah"
    ]
   },
   {
    "answer": "Elijah",
    "tier": 1
   },
   {
    "answer": "Shemaiah",
    "tier": 4
   },
   {
    "answer": "Elisha",
    "tier": 1
   },
   {
    "answer": "Micaiah son of Imlah",
    "tier": 3,
    "aliases": [
     "Micaiah"
    ]
   },
   {
    "answer": "Isaiah",
    "tier": 1
   },
   {
    "answer": "Jeremiah",
    "tier": 1
   },
   {
    "answer": "Urijah son of Shemaiah",
    "tier": 6,
    "aliases": [
     "Urijah"
    ]
   },
   {
    "answer": "Hanani",
    "tier": 4
   },
   {
    "answer": "Jehu son of Hanani",
    "tier": 4,
    "aliases": [
     "Jehu"
    ]
   },
   {
    "answer": "Azariah son of Oded",
    "tier": 4,
    "aliases": [
     "Azariah"
    ]
   },
   {
    "answer": "The man of God from Judah",
    "tier": 5
   }
  ]
 },
 {
  "id": "authored-women-in-acts",
  "theme": "people",
  "basis": "Hand-authored answer key; sources: Acts 1:14; 9:36–42; 12:12; 16:14–15; 18:2, 18, 26; 21:8–9.",
  "prompt": "Name a woman named in the Acts of the Apostles.",
  "context": "Eight women are named in Acts as part of the community of believers.",
  "answers": [
   {
    "answer": "Mary the mother of Jesus",
    "tier": 1,
    "aliases": [
     "Mary"
    ]
   },
   {
    "answer": "Sapphira",
    "tier": 2
   },
   {
    "answer": "Mary the mother of John Mark",
    "tier": 3
   },
   {
    "answer": "Tabitha",
    "tier": 1,
    "aliases": [
     "Dorcas"
    ]
   },
   {
    "answer": "Lydia",
    "tier": 1
   },
   {
    "answer": "Damaris",
    "tier": 3
   },
   {
    "answer": "Priscilla",
    "tier": 1,
    "aliases": [
     "Prisca"
    ]
   },
   {
    "answer": "Rhoda",
    "tier": 2
   }
  ],
  "closed": 8
 },
 {
  "id": "authored-jesus-healings",
  "theme": "scripture",
  "basis": "Hand-authored answer key; sources: Matthew 8–9; Mark 1–10; Luke 4–18; John 4–9.",
  "prompt": "Name an illness or disability that Jesus healed in the Gospels.",
  "context": "Give the condition, not the person's name.",
  "answers": [
   {
    "answer": "Blindness",
    "tier": 1
   },
   {
    "answer": "Leprosy",
    "tier": 1
   },
   {
    "answer": "Paralysis",
    "tier": 1
   },
   {
    "answer": "Withered hand",
    "tier": 2
   },
   {
    "answer": "Hemorrhage",
    "tier": 2,
    "aliases": [
     "Chronic bleeding"
    ]
   },
   {
    "answer": "Fever",
    "tier": 1
   },
   {
    "answer": "Deafness",
    "tier": 2
   },
   {
    "answer": "Dropsy",
    "tier": 4,
    "aliases": [
     "Edema"
    ]
   },
   {
    "answer": "Speech impairment",
    "tier": 2,
    "aliases": [
     "Mute condition"
    ]
   },
   {
    "answer": "Bent back",
    "tier": 4,
    "aliases": [
     "Inability to stand upright"
    ]
   },
   {
    "answer": "Seizures associated with an unclean spirit",
    "tier": 3
   },
   {
    "answer": "Ear injury",
    "tier": 3,
    "aliases": [
     "Severed ear"
    ]
   },
   {
    "answer": "Lameness",
    "tier": 2
   }
  ]
 },
 {
  "id": "authored-johannine-titles",
  "theme": "scripture",
  "basis": "Hand-authored answer key; sources: John 1; 4; 6; 8–15; 19–20.",
  "prompt": "Name a title or image used for Jesus in the Gospel of John.",
  "context": "Titles Jesus uses for himself and titles others give him.",
  "answers": [
   {
    "answer": "The Word",
    "tier": 1,
    "aliases": [
     "The Logos"
    ]
   },
   {
    "answer": "The Lamb of God",
    "tier": 1
   },
   {
    "answer": "The Son of God",
    "tier": 1
   },
   {
    "answer": "The Son of Man",
    "tier": 1
   },
   {
    "answer": "The Messiah",
    "tier": 1,
    "aliases": [
     "The Christ"
    ]
   },
   {
    "answer": "The King of Israel",
    "tier": 2
   },
   {
    "answer": "The Savior of the world",
    "tier": 2
   },
   {
    "answer": "The Bread of Life",
    "tier": 1
   },
   {
    "answer": "The Light of the World",
    "tier": 1
   },
   {
    "answer": "The Door",
    "tier": 2,
    "aliases": [
     "The Gate"
    ]
   },
   {
    "answer": "The Good Shepherd",
    "tier": 1
   },
   {
    "answer": "The Resurrection and the Life",
    "tier": 1
   },
   {
    "answer": "I AM",
    "tier": 1
   },
   {
    "answer": "The Way",
    "tier": 1
   },
   {
    "answer": "The Truth",
    "tier": 1
   },
   {
    "answer": "The Life",
    "tier": 1
   },
   {
    "answer": "The True Vine",
    "tier": 1
   },
   {
    "answer": "Rabbi",
    "tier": 1,
    "aliases": [
     "Teacher"
    ]
   },
   {
    "answer": "Lord",
    "tier": 1
   },
   {
    "answer": "The Holy One of God",
    "tier": 2
   },
   {
    "answer": "The Prophet",
    "tier": 3
   },
   {
    "answer": "The King of the Jews",
    "tier": 3
   },
   {
    "answer": "The Chosen One of God",
    "tier": 5
   }
  ]
 },
 {
  "id": "authored-revelation-images",
  "theme": "scripture",
  "basis": "Hand-authored answer key; Revelation 1–22.",
  "prompt": "Name an image or figure from the visions of Revelation.",
  "context": "Pictures seen by John, not ideas like faith or hope.",
  "answers": [
   {
    "answer": "The seven lampstands",
    "tier": 1
   },
   {
    "answer": "The seven stars",
    "tier": 1
   },
   {
    "answer": "The Lamb",
    "tier": 1
   },
   {
    "answer": "The four living creatures",
    "tier": 1
   },
   {
    "answer": "The twenty-four elders",
    "tier": 1
   },
   {
    "answer": "The four horsemen",
    "tier": 1
   },
   {
    "answer": "The scroll with seven seals",
    "tier": 2
   },
   {
    "answer": "The woman clothed with the sun",
    "tier": 1
   },
   {
    "answer": "The great red dragon",
    "tier": 1
   },
   {
    "answer": "Michael and his angels",
    "tier": 2
   },
   {
    "answer": "The beast from the sea",
    "tier": 1
   },
   {
    "answer": "The beast from the earth",
    "tier": 2
   },
   {
    "answer": "The image of the beast",
    "tier": 2
   },
   {
    "answer": "The number 666",
    "tier": 1
   },
   {
    "answer": "The two witnesses",
    "tier": 1
   },
   {
    "answer": "The seven bowls",
    "tier": 2
   },
   {
    "answer": "The great harlot Babylon",
    "tier": 2
   },
   {
    "answer": "The New Jerusalem",
    "tier": 1
   },
   {
    "answer": "The river of the water of life",
    "tier": 2
   },
   {
    "answer": "The tree of life",
    "tier": 1
   },
   {
    "answer": "The seven trumpets",
    "tier": 2
   },
   {
    "answer": "The rider on the white horse",
    "tier": 2,
    "aliases": [
     "Faithful and True"
    ]
   },
   {
    "answer": "The 144,000",
    "tier": 2
   },
   {
    "answer": "Gog and Magog",
    "tier": 4
   },
   {
    "answer": "The book of life",
    "tier": 3
   },
   {
    "answer": "The lake of fire",
    "tier": 3
   },
   {
    "answer": "The locusts from the abyss",
    "tier": 4
   },
   {
    "answer": "The sea of glass",
    "tier": 4
   },
   {
    "answer": "The Alpha and the Omega",
    "tier": 2
   },
   {
    "answer": "The angel with the little scroll",
    "tier": 5
   },
   {
    "answer": "The rainbow around the throne",
    "tier": 4
   }
  ]
 },
 {
  "id": "authored-liturgical-observances",
  "theme": "liturgy",
  "basis": "Hand-authored answer key; General Roman Calendar and Universal Norms on the Liturgical Year.",
  "prompt": "Name a season, feast or major observance of the Catholic liturgical year.",
  "context": "Seasons, Holy Week days, solemnities and feasts of the Lord and of Mary, and the great solemnities of saints; not memorials.",
  "answers": [
   {
    "answer": "Advent",
    "tier": 1
   },
   {
    "answer": "Christmas",
    "tier": 1
   },
   {
    "answer": "Lent",
    "tier": 1
   },
   {
    "answer": "Holy Week",
    "tier": 1
   },
   {
    "answer": "Easter",
    "tier": 1
   },
   {
    "answer": "Ordinary Time",
    "tier": 1
   },
   {
    "answer": "Ash Wednesday",
    "tier": 1
   },
   {
    "answer": "Palm Sunday",
    "tier": 1
   },
   {
    "answer": "Holy Thursday",
    "tier": 1
   },
   {
    "answer": "Good Friday",
    "tier": 1
   },
   {
    "answer": "Holy Saturday",
    "tier": 2
   },
   {
    "answer": "Pentecost",
    "tier": 1
   },
   {
    "answer": "Easter Vigil",
    "tier": 2
   },
   {
    "answer": "Epiphany",
    "tier": 1
   },
   {
    "answer": "Ascension",
    "tier": 1
   },
   {
    "answer": "Corpus Christi",
    "tier": 2
   },
   {
    "answer": "Trinity Sunday",
    "tier": 2
   },
   {
    "answer": "Christ the King",
    "tier": 2
   },
   {
    "answer": "Baptism of the Lord",
    "tier": 2
   },
   {
    "answer": "Holy Family",
    "tier": 2
   },
   {
    "answer": "Mary, Mother of God",
    "tier": 2
   },
   {
    "answer": "Immaculate Conception",
    "tier": 1
   },
   {
    "answer": "Assumption of Mary",
    "tier": 1
   },
   {
    "answer": "All Saints",
    "tier": 1
   },
   {
    "answer": "All Souls",
    "tier": 1
   },
   {
    "answer": "Annunciation",
    "tier": 2
   },
   {
    "answer": "Visitation",
    "tier": 3
   },
   {
    "answer": "Presentation of the Lord",
    "tier": 3,
    "aliases": [
     "Candlemas"
    ]
   },
   {
    "answer": "Transfiguration",
    "tier": 2
   },
   {
    "answer": "Exaltation of the Holy Cross",
    "tier": 3
   },
   {
    "answer": "Nativity of John the Baptist",
    "tier": 3
   },
   {
    "answer": "Peter and Paul",
    "tier": 3,
    "aliases": [
     "Saints Peter and Paul"
    ]
   },
   {
    "answer": "Divine Mercy Sunday",
    "tier": 3
   },
   {
    "answer": "Gaudete Sunday",
    "tier": 3
   },
   {
    "answer": "Laetare Sunday",
    "tier": 4
   },
   {
    "answer": "Sacred Heart",
    "tier": 2
   },
   {
    "answer": "Our Lady of Sorrows",
    "tier": 4
   },
   {
    "answer": "Michael, Gabriel and Raphael",
    "tier": 5,
    "aliases": [
     "Archangels"
    ]
   },
   {
    "answer": "Dedication of the Lateran Basilica",
    "tier": 6,
    "aliases": [
     "Lateran Basilica"
    ]
   },
   {
    "answer": "Chair of Saint Peter",
    "tier": 5
   }
  ]
 },
 {
  "id": "authored-pauls-first-journey",
  "theme": "places",
  "basis": "Hand-authored answer key; sources: Acts 13:1–14:28.",
  "prompt": "Name a place on Paul and Barnabas's first missionary journey.",
  "context": "The route in Acts 13 and 14, out and back again.",
  "answers": [
   {
    "answer": "Antioch",
    "tier": 1,
    "aliases": [
     "Antioch in Syria"
    ]
   },
   {
    "answer": "Salamis",
    "tier": 2
   },
   {
    "answer": "Seleucia",
    "tier": 3
   },
   {
    "answer": "Paphos",
    "tier": 2
   },
   {
    "answer": "Perga",
    "tier": 2
   },
   {
    "answer": "Antioch in Pisidia",
    "tier": 2
   },
   {
    "answer": "Iconium",
    "tier": 3
   },
   {
    "answer": "Lystra",
    "tier": 2
   },
   {
    "answer": "Derbe",
    "tier": 3
   },
   {
    "answer": "Attalia",
    "tier": 3
   },
   {
    "answer": "Cyprus",
    "tier": 1
   },
   {
    "answer": "Pamphylia",
    "tier": 4
   },
   {
    "answer": "Pisidia",
    "tier": 6
   },
   {
    "answer": "Lycaonia",
    "tier": 5
   }
  ]
 }
];
