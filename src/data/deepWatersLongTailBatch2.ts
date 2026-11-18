import type { DeepPrompt } from './deepWaters';

type ReviewedPrompt = DeepPrompt & { commonGuesses: { guess: string; accepted: boolean; reason?: string }[]; reviewFlags?: string[] };

/** Hand-authored long-tail questions with individually checked answer examples and source trails. */
export const LONG_TAIL_BATCH_2_PROMPTS: ReviewedPrompt[] = [
{
  "id": "longtail-missionary-saints",
  "theme": "saints",
  "prompt": "Name a missionary saint or blessed.",
  "context": "Catholic missionaries have served in every region of the world, from the early medieval missions to modern missionary congregations. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Missionaries,” a directory of 817 profiled saints, blesseds and venerables: https://catholicsaints.info/saints-who-were-missionaries/ . The answer key selects 60 named saints and blesseds; the source directory also includes venerables.",
  "answers": [
    {
      "answer": "Francis Xavier",
      "tier": 1
    },
    {
      "answer": "Paul Miki",
      "tier": 1
    },
    {
      "answer": "Peter Claver",
      "tier": 1
    },
    {
      "answer": "Damien of Molokai",
      "tier": 1
    },
    {
      "answer": "Junípero Serra",
      "tier": 1
    },
    {
      "answer": "Patrick",
      "tier": 2
    },
    {
      "answer": "Boniface",
      "tier": 2
    },
    {
      "answer": "Daniel Comboni",
      "tier": 2
    },
    {
      "answer": "Peter Chanel",
      "tier": 2
    },
    {
      "answer": "Isaac Jogues",
      "tier": 2
    },
    {
      "answer": "Jean de Brébeuf",
      "tier": 2
    },
    {
      "answer": "Frances Xavier Cabrini",
      "tier": 2
    },
    {
      "answer": "Charles Lwanga",
      "tier": 3
    },
    {
      "answer": "Joseph Freinademetz",
      "tier": 3
    },
    {
      "answer": "Matteo Ricci",
      "tier": 3
    },
    {
      "answer": "John de Britto",
      "tier": 3
    },
    {
      "answer": "Toribio de Mogrovejo",
      "tier": 3
    },
    {
      "answer": "Peter Canisius",
      "tier": 3
    },
    {
      "answer": "Francis Solano",
      "tier": 3
    },
    {
      "answer": "Roque González",
      "tier": 3
    },
    {
      "answer": "José de Anchieta",
      "tier": 3
    },
    {
      "answer": "Augustine of Canterbury",
      "tier": 3
    },
    {
      "answer": "Willibrord",
      "tier": 3
    },
    {
      "answer": "Ansgar",
      "tier": 3
    },
    {
      "answer": "Charles Garnier",
      "tier": 4
    },
    {
      "answer": "Gabriel Lalemant",
      "tier": 4
    },
    {
      "answer": "Noël Chabanel",
      "tier": 4
    },
    {
      "answer": "Antoine Daniel",
      "tier": 4
    },
    {
      "answer": "René Goupil",
      "tier": 4
    },
    {
      "answer": "John of Goto",
      "tier": 4
    },
    {
      "answer": "James Kisai",
      "tier": 4
    },
    {
      "answer": "Diego Luis de San Vitores",
      "tier": 4
    },
    {
      "answer": "Ignatius de Azevedo",
      "tier": 4
    },
    {
      "answer": "Charles Spinola",
      "tier": 4
    },
    {
      "answer": "Francisco Pacheco",
      "tier": 4
    },
    {
      "answer": "Anthony Mary Claret",
      "tier": 4
    },
    {
      "answer": "Théophane Vénard",
      "tier": 4
    },
    {
      "answer": "Peter of Saint Joseph de Betancur",
      "tier": 4
    },
    {
      "answer": "Francis Borgia",
      "tier": 4
    },
    {
      "answer": "Adrian of Dalmatia",
      "tier": 5
    },
    {
      "answer": "Agathangelus Nourry",
      "tier": 5
    },
    {
      "answer": "Agno of Zaragoza",
      "tier": 5
    },
    {
      "answer": "Aleixo Delgado",
      "tier": 5
    },
    {
      "answer": "Alessandro Dordi",
      "tier": 5
    },
    {
      "answer": "Alfonso Gomez de Encinas",
      "tier": 5
    },
    {
      "answer": "Alfonso Navarrete-Benito",
      "tier": 5
    },
    {
      "answer": "Alfredo Cremonesi",
      "tier": 5
    },
    {
      "answer": "Alonso de Baena",
      "tier": 5
    },
    {
      "answer": "Alphonsus de Mena",
      "tier": 5
    },
    {
      "answer": "Alphonsus Pacheco",
      "tier": 5
    },
    {
      "answer": "Álvaro Borralho Mendes",
      "tier": 5
    },
    {
      "answer": "Amaro Vaz",
      "tier": 5
    },
    {
      "answer": "André Gonçalves",
      "tier": 5
    },
    {
      "answer": "Ángel Hernández-Ranera De Diego",
      "tier": 5
    },
    {
      "answer": "Angelus de Scarpetti",
      "tier": 6
    },
    {
      "answer": "Antonio Francesco Marzorati",
      "tier": 6
    },
    {
      "answer": "Antonio Vallesio",
      "tier": 6
    },
    {
      "answer": "Antony Bonfadini",
      "tier": 6
    },
    {
      "answer": "Augustine Gazotich",
      "tier": 6
    },
    {
      "answer": "Bento de Castro",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Francis Xavier",
      "accepted": true
    },
    {
      "guess": "Paul Miki",
      "accepted": true
    },
    {
      "guess": "Peter Claver",
      "accepted": true
    },
    {
      "guess": "Damien of Molokai",
      "accepted": true
    },
    {
      "guess": "Junípero Serra",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A Dominican theologian, not ordinarily classified as a missionary in the source directory."
    },
    {
      "guess": "Catherine of Siena",
      "accepted": false,
      "reason": "A lay Dominican mystic, not classified as a missionary."
    },
    {
      "guess": "Benedict of Nursia",
      "accepted": false,
      "reason": "A monastic founder rather than a missionary."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A military and national figure, not a missionary."
    },
    {
      "guess": "Therese of Lisieux",
      "accepted": false,
      "reason": "Patroness of missions, but not herself a missionary."
    }
  ],
  "reviewFlags": []
},
{
  "id": "longtail-priest-saints",
  "theme": "saints",
  "prompt": "Name a saint or blessed who was a priest.",
  "context": "Priests have served the Church in parish ministry, missions, education, spiritual direction and reform. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Priests,” a directory of more than 5,000 profiled saints, blesseds and venerables: https://catholicsaints.info/saints-who-were-priests/ . The answer key uses named saints and blesseds from the directory.",
  "answers": [
    {
      "answer": "John Vianney",
      "tier": 1
    },
    {
      "answer": "John Bosco",
      "tier": 1
    },
    {
      "answer": "Vincent de Paul",
      "tier": 1
    },
    {
      "answer": "Ignatius of Loyola",
      "tier": 1
    },
    {
      "answer": "Philip Neri",
      "tier": 1
    },
    {
      "answer": "Francis Xavier",
      "tier": 2
    },
    {
      "answer": "Thomas Aquinas",
      "tier": 2
    },
    {
      "answer": "Anthony of Padua",
      "tier": 2
    },
    {
      "answer": "Dominic",
      "tier": 2
    },
    {
      "answer": "Padre Pio",
      "tier": 2
    },
    {
      "answer": "Francis de Sales",
      "tier": 2
    },
    {
      "answer": "John of the Cross",
      "tier": 2
    },
    {
      "answer": "Jerome",
      "tier": 3
    },
    {
      "answer": "Augustine of Hippo",
      "tier": 3
    },
    {
      "answer": "Ambrose of Milan",
      "tier": 3
    },
    {
      "answer": "Gregory the Great",
      "tier": 3
    },
    {
      "answer": "Bede the Venerable",
      "tier": 3
    },
    {
      "answer": "Bernard of Clairvaux",
      "tier": 3
    },
    {
      "answer": "Alphonsus Liguori",
      "tier": 3
    },
    {
      "answer": "Camillus de Lellis",
      "tier": 3
    },
    {
      "answer": "John Eudes",
      "tier": 3
    },
    {
      "answer": "Peter Claver",
      "tier": 3
    },
    {
      "answer": "Charles Borromeo",
      "tier": 3
    },
    {
      "answer": "Robert Bellarmine",
      "tier": 3
    },
    {
      "answer": "John Henry Newman",
      "tier": 4
    },
    {
      "answer": "Peter Canisius",
      "tier": 4
    },
    {
      "answer": "Peter Damian",
      "tier": 4
    },
    {
      "answer": "Lawrence of Brindisi",
      "tier": 4
    },
    {
      "answer": "John of Ávila",
      "tier": 4
    },
    {
      "answer": "Joseph Cafasso",
      "tier": 4
    },
    {
      "answer": "Joseph of Cupertino",
      "tier": 4
    },
    {
      "answer": "Peter Julian Eymard",
      "tier": 4
    },
    {
      "answer": "Paul of the Cross",
      "tier": 4
    },
    {
      "answer": "Leonard of Port Maurice",
      "tier": 4
    },
    {
      "answer": "John Leonardi",
      "tier": 4
    },
    {
      "answer": "Cajetan",
      "tier": 4
    },
    {
      "answer": "Raymond of Peñafort",
      "tier": 4
    },
    {
      "answer": "Ivo of Kermartin",
      "tier": 4
    },
    {
      "answer": "Isidore of Seville",
      "tier": 4
    },
    {
      "answer": "John Baptist de La Salle",
      "tier": 5
    },
    {
      "answer": "John Berchmans",
      "tier": 5
    },
    {
      "answer": "Aloysius Gonzaga",
      "tier": 5
    },
    {
      "answer": "Francis Borgia",
      "tier": 5
    },
    {
      "answer": "John Neumann",
      "tier": 5
    },
    {
      "answer": "Turibius of Mogrovejo",
      "tier": 5
    },
    {
      "answer": "Daniel Comboni",
      "tier": 5
    },
    {
      "answer": "Peter Chanel",
      "tier": 5
    },
    {
      "answer": "Anthony Mary Claret",
      "tier": 5
    },
    {
      "answer": "Bruno of Cologne",
      "tier": 5
    },
    {
      "answer": "Norbert of Xanten",
      "tier": 5
    },
    {
      "answer": "Peter Fourier",
      "tier": 5
    },
    {
      "answer": "Joseph Calasanz",
      "tier": 5
    },
    {
      "answer": "Philip Benizi",
      "tier": 5
    },
    {
      "answer": "Louis-Marie Grignion de Montfort",
      "tier": 5
    },
    {
      "answer": "Aaron of Auxerre",
      "tier": 6
    },
    {
      "answer": "Acardo of Avranches",
      "tier": 6
    },
    {
      "answer": "Adalbero of Lambach",
      "tier": 6
    },
    {
      "answer": "Adalbert of Liège",
      "tier": 6
    },
    {
      "answer": "Adalberto of Salzburg",
      "tier": 6
    },
    {
      "answer": "Adelpreto of Arco",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "John Vianney",
      "accepted": true
    },
    {
      "guess": "John Bosco",
      "accepted": true
    },
    {
      "guess": "Vincent de Paul",
      "accepted": true
    },
    {
      "guess": "Ignatius of Loyola",
      "accepted": true
    },
    {
      "guess": "Philip Neri",
      "accepted": true
    },
    {
      "guess": "Thomas More",
      "accepted": false,
      "reason": "A lay statesman and martyr, not a priest."
    },
    {
      "guess": "Catherine of Siena",
      "accepted": false,
      "reason": "A lay Dominican, not a priest."
    },
    {
      "guess": "Francis of Assisi",
      "accepted": false,
      "reason": "He was ordained a deacon, not a priest."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A laywoman, not a priest."
    },
    {
      "guess": "Elizabeth Ann Seton",
      "accepted": false,
      "reason": "A religious sister and foundress, not a priest."
    }
  ],
  "reviewFlags": []
},
{
  "id": "longtail-nun-saints",
  "theme": "saints",
  "prompt": "Name a saint or blessed who was a nun or religious sister.",
  "context": "Women religious have belonged to contemplative, monastic, teaching, nursing and missionary communities. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Nuns,” a directory of 1,365 profiled saints, blesseds and venerables: https://catholicsaints.info/saints-who-were-nuns/ . The answer key uses saints and blesseds; the source includes additional venerables.",
  "answers": [
    {
      "answer": "Teresa of Ávila",
      "tier": 1
    },
    {
      "answer": "Thérèse of Lisieux",
      "tier": 1
    },
    {
      "answer": "Clare of Assisi",
      "tier": 1
    },
    {
      "answer": "Hildegard of Bingen",
      "tier": 1
    },
    {
      "answer": "Scholastica",
      "tier": 1
    },
    {
      "answer": "Catherine Labouré",
      "tier": 2
    },
    {
      "answer": "Faustina Kowalska",
      "tier": 2
    },
    {
      "answer": "Teresa Benedicta of the Cross",
      "tier": 2
    },
    {
      "answer": "Catherine of Bologna",
      "tier": 2
    },
    {
      "answer": "Gertrude the Great",
      "tier": 2
    },
    {
      "answer": "Agnes of Bohemia",
      "tier": 2
    },
    {
      "answer": "Bernadette Soubirous",
      "tier": 2
    },
    {
      "answer": "Etheldreda",
      "tier": 3
    },
    {
      "answer": "Hilda of Whitby",
      "tier": 3
    },
    {
      "answer": "Lioba",
      "tier": 3
    },
    {
      "answer": "Walburga",
      "tier": 3
    },
    {
      "answer": "Bridget of Sweden",
      "tier": 3
    },
    {
      "answer": "Agnes of Montepulciano",
      "tier": 3
    },
    {
      "answer": "Clare of Montefalco",
      "tier": 3
    },
    {
      "answer": "Maria Mazzarello",
      "tier": 3
    },
    {
      "answer": "Frances Xavier Cabrini",
      "tier": 3
    },
    {
      "answer": "Mary MacKillop",
      "tier": 3
    },
    {
      "answer": "Elizabeth Ann Seton",
      "tier": 3
    },
    {
      "answer": "Angela Merici",
      "tier": 3
    },
    {
      "answer": "Adela Mardosewicz",
      "tier": 4
    },
    {
      "answer": "Adelaide of Lanckuvade",
      "tier": 4
    },
    {
      "answer": "Adelaide of Trebnitz",
      "tier": 4
    },
    {
      "answer": "Adèle de Batz de Trenquelléon",
      "tier": 4
    },
    {
      "answer": "Adelfa Soro Bó",
      "tier": 4
    },
    {
      "answer": "Adelheidis of Tennenbach",
      "tier": 4
    },
    {
      "answer": "Adelindis of Buchau",
      "tier": 4
    },
    {
      "answer": "Agnes of Bagno di Romagna",
      "tier": 4
    },
    {
      "answer": "Agnes of Büren",
      "tier": 4
    },
    {
      "answer": "Agnes of Chatillon",
      "tier": 4
    },
    {
      "answer": "Agnès of Jesus",
      "tier": 4
    },
    {
      "answer": "Agnes Phila",
      "tier": 4
    },
    {
      "answer": "Agnese of Seville",
      "tier": 4
    },
    {
      "answer": "Agnese Pacifica Panas",
      "tier": 4
    },
    {
      "answer": "Agostina of the Assumption",
      "tier": 4
    },
    {
      "answer": "Agueda Hernández Amorós",
      "tier": 5
    },
    {
      "answer": "Aimée-Adèle le Bouteiller",
      "tier": 5
    },
    {
      "answer": "Aldara Ériz de Lugo",
      "tier": 5
    },
    {
      "answer": "Alessandrina of Foligno",
      "tier": 5
    },
    {
      "answer": "Alexandrina di Letto",
      "tier": 5
    },
    {
      "answer": "Alfonsa Clerici",
      "tier": 5
    },
    {
      "answer": "Alicja Maria Jadwiga Kotowska",
      "tier": 5
    },
    {
      "answer": "Alix le Clerc",
      "tier": 5
    },
    {
      "answer": "Alphonsine Anuarite Nengapeta",
      "tier": 5
    },
    {
      "answer": "Alruna of Cham",
      "tier": 5
    },
    {
      "answer": "Amata of San Sisto",
      "tier": 5
    },
    {
      "answer": "Amparo Carbonell Muñoz",
      "tier": 5
    },
    {
      "answer": "Amparo Hinojosa Naveros",
      "tier": 5
    },
    {
      "answer": "Ana Ballesta Gelmá",
      "tier": 5
    },
    {
      "answer": "Ana Julia Duque Heckner",
      "tier": 5
    },
    {
      "answer": "Andrea Calle González",
      "tier": 6
    },
    {
      "answer": "Angela Bartolomea dei Ranzi",
      "tier": 6
    },
    {
      "answer": "Angela Isabella dei Ranzi",
      "tier": 6
    },
    {
      "answer": "Angela Serafina Correggiari",
      "tier": 6
    },
    {
      "answer": "Angelina di Marsciano",
      "tier": 6
    },
    {
      "answer": "Adela of Pfalzel",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Teresa of Ávila",
      "accepted": true
    },
    {
      "guess": "Thérèse of Lisieux",
      "accepted": true
    },
    {
      "guess": "Clare of Assisi",
      "accepted": true
    },
    {
      "guess": "Hildegard of Bingen",
      "accepted": true
    },
    {
      "guess": "Scholastica",
      "accepted": true
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A laywoman and military leader, not a nun."
    },
    {
      "guess": "Catherine of Siena",
      "accepted": false,
      "reason": "A lay Dominican tertiary, not a nun."
    },
    {
      "guess": "Mary Magdalene",
      "accepted": false,
      "reason": "A disciple of Jesus, not a religious sister."
    },
    {
      "guess": "Elizabeth of Hungary",
      "accepted": false,
      "reason": "A married queen and widow, not a nun."
    },
    {
      "guess": "Kateri Tekakwitha",
      "accepted": false,
      "reason": "A consecrated lay virgin, not a member of a religious congregation."
    }
  ],
  "reviewFlags": []
},
{
  "id": "longtail-teacher-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who was a teacher.",
  "context": "Catholic holy people have taught in schools, universities, seminaries, catechetical settings and religious communities. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Teachers,” a directory of 758 profiled saints, blesseds and venerables: https://catholicsaints.info/saints-who-were-teachers/ . The answer key samples named people across all three stages of recognition.",
  "answers": [
    {
      "answer": "John Baptist de La Salle",
      "tier": 1
    },
    {
      "answer": "John Bosco",
      "tier": 1
    },
    {
      "answer": "Elizabeth Ann Seton",
      "tier": 1
    },
    {
      "answer": "Mary MacKillop",
      "tier": 1
    },
    {
      "answer": "Thomas Aquinas",
      "tier": 1
    },
    {
      "answer": "Augustine of Hippo",
      "tier": 2
    },
    {
      "answer": "Jerome",
      "tier": 2
    },
    {
      "answer": "Bede the Venerable",
      "tier": 2
    },
    {
      "answer": "Catherine of Siena",
      "tier": 2
    },
    {
      "answer": "Teresa of Ávila",
      "tier": 2
    },
    {
      "answer": "Angela Merici",
      "tier": 2
    },
    {
      "answer": "Edith Stein",
      "tier": 2
    },
    {
      "answer": "Alcuin",
      "tier": 3
    },
    {
      "answer": "John Henry Newman",
      "tier": 3
    },
    {
      "answer": "Hildegard of Bingen",
      "tier": 3
    },
    {
      "answer": "John of the Cross",
      "tier": 3
    },
    {
      "answer": "Peter Canisius",
      "tier": 3
    },
    {
      "answer": "Robert Bellarmine",
      "tier": 3
    },
    {
      "answer": "Bonaventure",
      "tier": 3
    },
    {
      "answer": "John Chrysostom",
      "tier": 3
    },
    {
      "answer": "Basil the Great",
      "tier": 3
    },
    {
      "answer": "Joseph Calasanz",
      "tier": 3
    },
    {
      "answer": "Marcellin Champagnat",
      "tier": 3
    },
    {
      "answer": "Francis de Sales",
      "tier": 3
    },
    {
      "answer": "Aimo Taparelli",
      "tier": 4
    },
    {
      "answer": "Alan the Great of Lille",
      "tier": 4
    },
    {
      "answer": "Alanus de Rupe",
      "tier": 4
    },
    {
      "answer": "Albert of Haigerloch",
      "tier": 4
    },
    {
      "answer": "Alexander of Cîteaux",
      "tier": 4
    },
    {
      "answer": "Alfons Maria Mazurek",
      "tier": 4
    },
    {
      "answer": "Alfonsa Clerici",
      "tier": 4
    },
    {
      "answer": "Alfonso de Rojas",
      "tier": 4
    },
    {
      "answer": "Alfredo Ildefonso Schuster",
      "tier": 4
    },
    {
      "answer": "Alfredo Parte-Saiz",
      "tier": 4
    },
    {
      "answer": "Alix le Clerc",
      "tier": 4
    },
    {
      "answer": "Alvarez of Cordova",
      "tier": 4
    },
    {
      "answer": "Álvaro Ibáñez Lázaro",
      "tier": 4
    },
    {
      "answer": "Ambrose of Camaldoli",
      "tier": 4
    },
    {
      "answer": "Ambrose Sansedoni of Siena",
      "tier": 4
    },
    {
      "answer": "Acacio Calleja Santamaría",
      "tier": 5
    },
    {
      "answer": "Achilleo of Alexandria",
      "tier": 5
    },
    {
      "answer": "Adela Mardosewicz",
      "tier": 5
    },
    {
      "answer": "Agnes Phila",
      "tier": 5
    },
    {
      "answer": "Agustín García Calvo",
      "tier": 5
    },
    {
      "answer": "Agustín Pedro Calvo",
      "tier": 5
    },
    {
      "answer": "Anastasio Garzón González",
      "tier": 5
    },
    {
      "answer": "Andrea Carlo Ferrari",
      "tier": 5
    },
    {
      "answer": "Andrea Giacinto Longhin",
      "tier": 5
    },
    {
      "answer": "Andrés Pradas Lahoz",
      "tier": 5
    },
    {
      "answer": "Andrés Zarraquino Herrero",
      "tier": 5
    },
    {
      "answer": "Andrii Ischak",
      "tier": 5
    },
    {
      "answer": "Ángel Alonso Escribano",
      "tier": 5
    },
    {
      "answer": "Ángel Hernández-Ranera De Diego",
      "tier": 5
    },
    {
      "answer": "Angel Martínez Miquélez",
      "tier": 5
    },
    {
      "answer": "Angelus Agostini Mazzinghi",
      "tier": 6
    },
    {
      "answer": "Angelus of Furci",
      "tier": 6
    },
    {
      "answer": "Anna Ellmerer",
      "tier": 6
    },
    {
      "answer": "Anne Mary Javouhey",
      "tier": 6
    },
    {
      "answer": "Anselmo Polanco",
      "tier": 6
    },
    {
      "answer": "Antoine Chevrier",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "John Baptist de La Salle",
      "accepted": true
    },
    {
      "guess": "John Bosco",
      "accepted": true
    },
    {
      "guess": "Elizabeth Ann Seton",
      "accepted": true
    },
    {
      "guess": "Mary MacKillop",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": true
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A military leader, not a teacher in the source directory."
    },
    {
      "guess": "Padre Pio",
      "accepted": false,
      "reason": "A priest and mystic, not classified as a teacher in the directory."
    },
    {
      "guess": "Francis of Assisi",
      "accepted": false,
      "reason": "A religious founder, not classified as a teacher in the directory."
    },
    {
      "guess": "Bernadette Soubirous",
      "accepted": false,
      "reason": "A religious sister and Marian visionary, not classified as a teacher."
    },
    {
      "guess": "Christopher Columbus",
      "accepted": false,
      "reason": "Not a Catholic saint, blessed or venerable."
    }
  ]
},
{
  "id": "longtail-soldier-saints",
  "theme": "saints",
  "prompt": "Name a saint or blessed who was a soldier.",
  "context": "Many saints and blesseds served in the military before or during their Christian lives. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Soldiers,” a directory of 545 profiled saints, blesseds and venerables: https://catholicsaints.info/saints-who-were-soldiers/ . The answer key samples named people from the directory and related soldier profiles.",
  "answers": [
    {
      "answer": "Joan of Arc",
      "tier": 1
    },
    {
      "answer": "George",
      "tier": 1
    },
    {
      "answer": "Martin of Tours",
      "tier": 1
    },
    {
      "answer": "Sebastian",
      "tier": 1
    },
    {
      "answer": "Ignatius of Loyola",
      "tier": 1
    },
    {
      "answer": "Maurice",
      "tier": 2
    },
    {
      "answer": "Longinus",
      "tier": 2
    },
    {
      "answer": "Florian of Lorch",
      "tier": 2
    },
    {
      "answer": "Theodore Stratelates",
      "tier": 2
    },
    {
      "answer": "Acacius of Byzantium",
      "tier": 2
    },
    {
      "answer": "Adrian of Nicomedia",
      "tier": 2
    },
    {
      "answer": "Alban of Britain",
      "tier": 2
    },
    {
      "answer": "Alexander of Bergamo",
      "tier": 3
    },
    {
      "answer": "Bacchus",
      "tier": 3
    },
    {
      "answer": "Bessus",
      "tier": 3
    },
    {
      "answer": "Cassius of Como",
      "tier": 3
    },
    {
      "answer": "Crescentinus of Saldo",
      "tier": 3
    },
    {
      "answer": "Domninus",
      "tier": 3
    },
    {
      "answer": "Donatus of Münstereifel",
      "tier": 3
    },
    {
      "answer": "Edisto",
      "tier": 3
    },
    {
      "answer": "Ephysius of Sardinia",
      "tier": 3
    },
    {
      "answer": "Expeditus of Melitene",
      "tier": 3
    },
    {
      "answer": "Ferrutius",
      "tier": 3
    },
    {
      "answer": "Florentius the Martyr",
      "tier": 3
    },
    {
      "answer": "Adolf IV of Schauenburg",
      "tier": 4
    },
    {
      "answer": "Adrian Fortescue",
      "tier": 4
    },
    {
      "answer": "Albert of Pontida",
      "tier": 4
    },
    {
      "answer": "Alberto Leccapecore",
      "tier": 4
    },
    {
      "answer": "Alojzije Viktor Stepinac",
      "tier": 4
    },
    {
      "answer": "Alvarus Garcia",
      "tier": 4
    },
    {
      "answer": "Andrea Bordino",
      "tier": 4
    },
    {
      "answer": "Andrea Gallerani",
      "tier": 4
    },
    {
      "answer": "Andrew Dotti",
      "tier": 4
    },
    {
      "answer": "Angelo Tancredi",
      "tier": 4
    },
    {
      "answer": "Anselm of Rot an der Rot",
      "tier": 4
    },
    {
      "answer": "Arnold of Queralt",
      "tier": 4
    },
    {
      "answer": "Artale",
      "tier": 4
    },
    {
      "answer": "Augustine Novello",
      "tier": 4
    },
    {
      "answer": "Beltrão de Caia",
      "tier": 4
    },
    {
      "answer": "Benvenutus of Gubbio",
      "tier": 5
    },
    {
      "answer": "Berengar de Banares",
      "tier": 5
    },
    {
      "answer": "Bernard de Figuerols",
      "tier": 5
    },
    {
      "answer": "Ambrose of Ferentino",
      "tier": 5
    },
    {
      "answer": "Licinius of Como",
      "tier": 5
    },
    {
      "answer": "Menas Kallikelados",
      "tier": 5
    },
    {
      "answer": "Nicasius of Jerusalem",
      "tier": 5
    },
    {
      "answer": "Pantaleimon of Bisceglia",
      "tier": 5
    },
    {
      "answer": "Phanurius",
      "tier": 5
    },
    {
      "answer": "Quirinus the Jailer",
      "tier": 5
    },
    {
      "answer": "Secundus of Asti",
      "tier": 5
    },
    {
      "answer": "Secundus of Como",
      "tier": 5
    },
    {
      "answer": "Sergius of Bisceglia",
      "tier": 5
    },
    {
      "answer": "Severinus of Como",
      "tier": 5
    },
    {
      "answer": "Terence of Pesaro",
      "tier": 5
    },
    {
      "answer": "Menas of Egypt",
      "tier": 6
    },
    {
      "answer": "Theodore of Amasea",
      "tier": 6
    },
    {
      "answer": "Marcellus the Centurion",
      "tier": 6
    },
    {
      "answer": "Julius the Veteran",
      "tier": 6
    },
    {
      "answer": "Candidus of the Theban Legion",
      "tier": 6
    },
    {
      "answer": "Exuperius of the Theban Legion",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Joan of Arc",
      "accepted": true
    },
    {
      "guess": "George",
      "accepted": true
    },
    {
      "guess": "Martin of Tours",
      "accepted": true
    },
    {
      "guess": "Sebastian",
      "accepted": true
    },
    {
      "guess": "Ignatius of Loyola",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A theologian, not a soldier."
    },
    {
      "guess": "Francis of Assisi",
      "accepted": false,
      "reason": "A religious founder, not a soldier."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A Carmelite nun and mystic."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A parish priest, not a soldier."
    },
    {
      "guess": "Christopher Columbus",
      "accepted": false,
      "reason": "Not a Catholic saint, blessed or venerable."
    }
  ]
},
{
  "id": "longtail-convert-saints",
  "theme": "saints",
  "prompt": "Name a saint or blessed who was a convert.",
  "context": "Conversions to Christianity and later conversions within Christian life have shaped the stories of many Catholic saints and blesseds. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Converts,” a directory of 651 profiled saints, blesseds and venerables: https://catholicsaints.info/saints-who-were-converts/ . The answer key samples named people from this directory.",
  "answers": [
    {
      "answer": "Augustine of Hippo",
      "tier": 1
    },
    {
      "answer": "Paul the Apostle",
      "tier": 1
    },
    {
      "answer": "Edith Stein",
      "tier": 1
    },
    {
      "answer": "John Henry Newman",
      "tier": 1
    },
    {
      "answer": "Olga of Kiev",
      "tier": 1
    },
    {
      "answer": "Vladimir I of Kiev",
      "tier": 2
    },
    {
      "answer": "Helena",
      "tier": 2
    },
    {
      "answer": "Mary of Egypt",
      "tier": 2
    },
    {
      "answer": "Moses the Black",
      "tier": 2
    },
    {
      "answer": "Alban of Britain",
      "tier": 2
    },
    {
      "answer": "Kateri Tekakwitha",
      "tier": 2
    },
    {
      "answer": "Charles Lwanga",
      "tier": 2
    },
    {
      "answer": "Afra of Augsburg",
      "tier": 3
    },
    {
      "answer": "Anne Line",
      "tier": 3
    },
    {
      "answer": "Boniface of Tarsus",
      "tier": 3
    },
    {
      "answer": "Caedwalla of Wessex",
      "tier": 3
    },
    {
      "answer": "Cyril of Jerusalem",
      "tier": 3
    },
    {
      "answer": "Edwin of Northumbria",
      "tier": 3
    },
    {
      "answer": "Flora of Cordoba",
      "tier": 3
    },
    {
      "answer": "Genesius of Rome",
      "tier": 3
    },
    {
      "answer": "Hermengild",
      "tier": 3
    },
    {
      "answer": "Ludmila",
      "tier": 3
    },
    {
      "answer": "Margaret Clitherow",
      "tier": 3
    },
    {
      "answer": "Methodius",
      "tier": 3
    },
    {
      "answer": "Natalia",
      "tier": 4
    },
    {
      "answer": "Philemon of Antinoe",
      "tier": 4
    },
    {
      "answer": "Theodota of Thrace",
      "tier": 4
    },
    {
      "answer": "Augustinus Jeong Yak-jong",
      "tier": 4
    },
    {
      "answer": "Agata Phutta Bi",
      "tier": 4
    },
    {
      "answer": "Agatha Han Sin-ae",
      "tier": 4
    },
    {
      "answer": "Anthony Turner",
      "tier": 4
    },
    {
      "answer": "Catherine of Leuven",
      "tier": 4
    },
    {
      "answer": "Ceferino Jimenez-Malla",
      "tier": 4
    },
    {
      "answer": "Charles Steeb",
      "tier": 4
    },
    {
      "answer": "Cosmas da Carboniam",
      "tier": 4
    },
    {
      "answer": "Daudi Okelo",
      "tier": 4
    },
    {
      "answer": "Demetrios of Philadelphia",
      "tier": 4
    },
    {
      "answer": "Edward Coleman",
      "tier": 4
    },
    {
      "answer": "Edward James",
      "tier": 4
    },
    {
      "answer": "Edward Waterson",
      "tier": 5
    },
    {
      "answer": "Egbert of Villers",
      "tier": 5
    },
    {
      "answer": "Eustachius of Huy",
      "tier": 5
    },
    {
      "answer": "Franciscus Bae Gwan-gyeom",
      "tier": 5
    },
    {
      "answer": "Gundisalvus Fusai Chozo",
      "tier": 5
    },
    {
      "answer": "Helinand of Pronleroy",
      "tier": 5
    },
    {
      "answer": "Henry Heath",
      "tier": 5
    },
    {
      "answer": "Herman of Scheda",
      "tier": 5
    },
    {
      "answer": "Iacobus Hayashida",
      "tier": 5
    },
    {
      "answer": "Asterius of Périgord",
      "tier": 5
    },
    {
      "answer": "Asterius of Petra",
      "tier": 5
    },
    {
      "answer": "Audax of Thora",
      "tier": 5
    },
    {
      "answer": "Audifax of Persia",
      "tier": 5
    },
    {
      "answer": "Augustine Tchao",
      "tier": 5
    },
    {
      "answer": "Aurea of Cordoba",
      "tier": 5
    },
    {
      "answer": "Auxibius of Soli",
      "tier": 6
    },
    {
      "answer": "Bacchilo of Messina",
      "tier": 6
    },
    {
      "answer": "Balthasar",
      "tier": 6
    },
    {
      "answer": "Baptus of Magnesia",
      "tier": 6
    },
    {
      "answer": "Barbea of Edessa",
      "tier": 6
    },
    {
      "answer": "Basilides of Alexandria",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Augustine of Hippo",
      "accepted": true
    },
    {
      "guess": "Paul the Apostle",
      "accepted": true
    },
    {
      "guess": "Edith Stein",
      "accepted": true
    },
    {
      "guess": "John Henry Newman",
      "accepted": true
    },
    {
      "guess": "Olga of Kiev",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A lifelong Christian, not a convert."
    },
    {
      "guess": "Francis Xavier",
      "accepted": false,
      "reason": "A lifelong Christian and missionary, not listed as a convert."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A lifelong Catholic, not listed as a convert."
    },
    {
      "guess": "Benedict of Nursia",
      "accepted": false,
      "reason": "A lifelong Christian monk, not listed as a convert."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A lifelong Christian, not listed as a convert."
    }
  ]
},
{
  "id": "longtail-physician-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who was a physician.",
  "context": "The Church remembers physicians who served the sick as professionals, religious, missionaries and martyrs. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Physicians,” 65 profiled saints, blesseds and venerables: https://catholicsaints.info/saints-who-were-physicians/ . The answer key uses 60 catalogue entries.",
  "answers": [
    {
      "answer": "Luke the Evangelist",
      "tier": 1
    },
    {
      "answer": "Cosmas",
      "tier": 1
    },
    {
      "answer": "Damian",
      "tier": 1
    },
    {
      "answer": "Joseph Moscati",
      "tier": 1
    },
    {
      "answer": "Gianna Beretta Molla",
      "tier": 1
    },
    {
      "answer": "Blaise",
      "tier": 2
    },
    {
      "answer": "Panteleon",
      "tier": 2
    },
    {
      "answer": "Richard Pampuri",
      "tier": 2
    },
    {
      "answer": "José Gregorio Hernández-Cisneros",
      "tier": 2
    },
    {
      "answer": "Ladislao Batthyány-Strattmann",
      "tier": 2
    },
    {
      "answer": "Giuseppe Ambrosoli",
      "tier": 2
    },
    {
      "answer": "Cyrus the Physician",
      "tier": 2
    },
    {
      "answer": "Antiochus of Sebaste",
      "tier": 3
    },
    {
      "answer": "Antiochus of Sulci",
      "tier": 3
    },
    {
      "answer": "Codratus of Corinth",
      "tier": 3
    },
    {
      "answer": "Diomedes of Tarsus",
      "tier": 3
    },
    {
      "answer": "Francis of Nagasaki",
      "tier": 3
    },
    {
      "answer": "Nicander of Alexandria",
      "tier": 3
    },
    {
      "answer": "Sampson of Constantinople",
      "tier": 3
    },
    {
      "answer": "Philip Benizi",
      "tier": 3
    },
    {
      "answer": "Aemilianus the Martyr",
      "tier": 3
    },
    {
      "answer": "Agapetus of Ruthenia",
      "tier": 3
    },
    {
      "answer": "Alexander of Vienne",
      "tier": 3
    },
    {
      "answer": "Anthony Mary Zaccaria",
      "tier": 3
    },
    {
      "answer": "Caesarius of Nanzianzen",
      "tier": 4
    },
    {
      "answer": "Antôn Nguyen Huu Quynh",
      "tier": 4
    },
    {
      "answer": "Cyprian of Calamizzi",
      "tier": 4
    },
    {
      "answer": "Ðaminh Nguyen",
      "tier": 4
    },
    {
      "answer": "Domèce",
      "tier": 4
    },
    {
      "answer": "Domninus the Physician",
      "tier": 4
    },
    {
      "answer": "Elian of Emesa",
      "tier": 4
    },
    {
      "answer": "Giuse Hoàng Luong Canh",
      "tier": 4
    },
    {
      "answer": "Iosephus Ma Taishun",
      "tier": 4
    },
    {
      "answer": "Ithier of Nevers",
      "tier": 4
    },
    {
      "answer": "Joachim Sakakibara",
      "tier": 4
    },
    {
      "answer": "John the Physician",
      "tier": 4
    },
    {
      "answer": "Marcus Ji Tianxiang",
      "tier": 4
    },
    {
      "answer": "Rene Goupil",
      "tier": 4
    },
    {
      "answer": "Rocco Gonzalez",
      "tier": 4
    },
    {
      "answer": "Simon Phan Ðac Hòa",
      "tier": 5
    },
    {
      "answer": "Bartolomé Díaz Laurel",
      "tier": 5
    },
    {
      "answer": "Donatus of Urbino",
      "tier": 5
    },
    {
      "answer": "Gabriel of Ferrara",
      "tier": 5
    },
    {
      "answer": "Gabriel of Saint Magdalen",
      "tier": 5
    },
    {
      "answer": "Giles of Santarém",
      "tier": 5
    },
    {
      "answer": "Giovanni Giovenale Ancina",
      "tier": 5
    },
    {
      "answer": "Jacques Désiré Laval",
      "tier": 5
    },
    {
      "answer": "Mark of Montegallo",
      "tier": 5
    },
    {
      "answer": "Paul Dochier",
      "tier": 5
    },
    {
      "answer": "Pere Tarrés i Claret",
      "tier": 5
    },
    {
      "answer": "Talaleo of Egea",
      "tier": 5
    },
    {
      "answer": "Ursicinus of Ravenna",
      "tier": 5
    },
    {
      "answer": "Valentine of Rome",
      "tier": 5
    },
    {
      "answer": "William Firmatus",
      "tier": 5
    },
    {
      "answer": "Zenobius of Aegea",
      "tier": 6
    },
    {
      "answer": "Zenobius of Antioch",
      "tier": 6
    },
    {
      "answer": "Emanuele Stablum",
      "tier": 6
    },
    {
      "answer": "Enrico Beretta",
      "tier": 6
    },
    {
      "answer": "Étienne-Pierre Morlanne",
      "tier": 6
    },
    {
      "answer": "Guido Vidal França Schäffer",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Luke the Evangelist",
      "accepted": true
    },
    {
      "guess": "Cosmas",
      "accepted": true
    },
    {
      "guess": "Damian",
      "accepted": true
    },
    {
      "guess": "Joseph Moscati",
      "accepted": true
    },
    {
      "guess": "Gianna Beretta Molla",
      "accepted": true
    },
    {
      "guess": "Florence Nightingale",
      "accepted": false,
      "reason": "An Anglican nurse, not a Catholic saint, blessed or venerable."
    },
    {
      "guess": "Albert Schweitzer",
      "accepted": false,
      "reason": "A Protestant theologian and physician, not a Catholic saint."
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A theologian, not a physician."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A priest, not a physician."
    },
    {
      "guess": "Elizabeth Ann Seton",
      "accepted": false,
      "reason": "A religious sister and educator, not a physician."
    }
  ]
},
{
  "id": "longtail-nurse-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who was a nurse.",
  "context": "Nurses and caregivers appear among the Church’s saints, blesseds and venerables, especially in hospital and charitable orders. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Nurses,” 68 profiles across saints, blesseds and venerables: https://catholicsaints.info/saints-who-were-nurses/ . All answer names are drawn from the 68 listed records.",
  "answers": [
    {
      "answer": "Bartholomew Buonpedoni",
      "tier": 1
    },
    {
      "answer": "Maria Bertilla Boscardin",
      "tier": 1
    },
    {
      "answer": "Martin de Porres",
      "tier": 1
    },
    {
      "answer": "Hanna Helena Chrzanowska",
      "tier": 1
    },
    {
      "answer": "Leonella Sgorbati",
      "tier": 1
    },
    {
      "answer": "Maria Euthymia Üffing",
      "tier": 2
    },
    {
      "answer": "Maria Troncatti",
      "tier": 2
    },
    {
      "answer": "Mary Restituta Kafka",
      "tier": 2
    },
    {
      "answer": "Agostina Petrantoni",
      "tier": 2
    },
    {
      "answer": "María Natividad Venegas de La Torre",
      "tier": 2
    },
    {
      "answer": "Mary Elizabeth Hesselblad",
      "tier": 2
    },
    {
      "answer": "Cecilia Schelingová",
      "tier": 2
    },
    {
      "answer": "Edward Joannes Maria Poppe",
      "tier": 3
    },
    {
      "answer": "Enrico Rebuschini",
      "tier": 3
    },
    {
      "answer": "José Olallo Valdés",
      "tier": 3
    },
    {
      "answer": "Juliana of Mont Cornillon",
      "tier": 3
    },
    {
      "answer": "Liduina Meneguzzi",
      "tier": 3
    },
    {
      "answer": "Luigi Maria Monti",
      "tier": 3
    },
    {
      "answer": "Marguerite Rutan",
      "tier": 3
    },
    {
      "answer": "Maria Corsini Beltrame Quattrocchi",
      "tier": 3
    },
    {
      "answer": "Maria Ludovica de Angelis",
      "tier": 3
    },
    {
      "answer": "María Pilar Gullón Yturriaga",
      "tier": 3
    },
    {
      "answer": "Maria Rafols-Bruna",
      "tier": 3
    },
    {
      "answer": "Maria Rosa Molas y Vallvé",
      "tier": 3
    },
    {
      "answer": "Benvenutus of Gubbio",
      "tier": 4
    },
    {
      "answer": "Francisco Gárate Aranguren",
      "tier": 4
    },
    {
      "answer": "María Angélica Pérez",
      "tier": 4
    },
    {
      "answer": "Marie-Catherine de Saint-Augustin",
      "tier": 4
    },
    {
      "answer": "Bertille",
      "tier": 4
    },
    {
      "answer": "Benito Solana Ruiz",
      "tier": 4
    },
    {
      "answer": "Bonaventure of Barcelona",
      "tier": 4
    },
    {
      "answer": "Dénise Leclerc",
      "tier": 4
    },
    {
      "answer": "Dolores Úrsula Caro Martín",
      "tier": 4
    },
    {
      "answer": "Esther Paniagua Alonso",
      "tier": 4
    },
    {
      "answer": "Gertrude Prosperi",
      "tier": 4
    },
    {
      "answer": "Josefa Laborra Goyeneche",
      "tier": 4
    },
    {
      "answer": "Juliana Kubitzki",
      "tier": 4
    },
    {
      "answer": "Mary of Saint Joseph Alvarado Cardozo",
      "tier": 4
    },
    {
      "answer": "Michael Kozaki",
      "tier": 4
    },
    {
      "answer": "Francisca Pons Sarda",
      "tier": 5
    },
    {
      "answer": "Ismael Tajadura Marcos",
      "tier": 5
    },
    {
      "answer": "Josep Tarrats Comaposada",
      "tier": 5
    },
    {
      "answer": "Juan Agustín Codera Marqués",
      "tier": 5
    },
    {
      "answer": "Juan Bautista Egozcuezábal Aldaz",
      "tier": 5
    },
    {
      "answer": "Luczja Heymann",
      "tier": 5
    },
    {
      "answer": "Lukarda of Oberweimar",
      "tier": 5
    },
    {
      "answer": "María Asunción Mayoral Peña",
      "tier": 5
    },
    {
      "answer": "Maria Christophora Klomfass",
      "tier": 5
    },
    {
      "answer": "María Dolores Barroso Villaseñor",
      "tier": 5
    },
    {
      "answer": "María Isabel López García",
      "tier": 5
    },
    {
      "answer": "Martina Vázquez Gordo",
      "tier": 5
    },
    {
      "answer": "Octavia Iglesias Blanco",
      "tier": 5
    },
    {
      "answer": "Olga Pérez-Monteserín Núñez",
      "tier": 5
    },
    {
      "answer": "Paul-Hélène Saint Raymond",
      "tier": 5
    },
    {
      "answer": "Teuzzo of Razzuolo",
      "tier": 6
    },
    {
      "answer": "Alessandra Ghilardi",
      "tier": 6
    },
    {
      "answer": "Anna Maria Sorti",
      "tier": 6
    },
    {
      "answer": "Celeste Maria Ossoli",
      "tier": 6
    },
    {
      "answer": "Coloma Antònia Martí y Valls",
      "tier": 6
    },
    {
      "answer": "Edda Maria Caterina Roda",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Martin de Porres",
      "accepted": true
    },
    {
      "guess": "Maria Bertilla Boscardin",
      "accepted": true
    },
    {
      "guess": "Hanna Helena Chrzanowska",
      "accepted": true
    },
    {
      "guess": "José Olallo Valdés",
      "accepted": true
    },
    {
      "guess": "Mary Restituta Kafka",
      "accepted": true
    },
    {
      "guess": "Florence Nightingale",
      "accepted": false,
      "reason": "An Anglican nurse, not a Catholic saint, blessed or venerable."
    },
    {
      "guess": "Clare of Assisi",
      "accepted": false,
      "reason": "A religious founder, not listed in this nurse directory."
    },
    {
      "guess": "Teresa of Calcutta",
      "accepted": false,
      "reason": "A missionary sister, but not in this nurse directory."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A priest, not a nurse."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A military leader, not a nurse."
    }
  ]
},
{
  "id": "longtail-hermit-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who lived as a hermit.",
  "context": "Some holy men and women lived in solitude or as hermits, while others began hermit lives before founding communities. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Hermits,” 896 profiles: https://catholicsaints.info/saints-who-were-hermits/ . The answer key uses named entries from the directory.",
  "answers": [
    {
      "answer": "Anthony the Great",
      "tier": 1
    },
    {
      "answer": "Paul of Thebes",
      "tier": 1
    },
    {
      "answer": "Benedict of Nursia",
      "tier": 1
    },
    {
      "answer": "John the Baptist",
      "tier": 1
    },
    {
      "answer": "Jerome",
      "tier": 1
    },
    {
      "answer": "Mary of Egypt",
      "tier": 2
    },
    {
      "answer": "Romuald",
      "tier": 2
    },
    {
      "answer": "Bruno of Cologne",
      "tier": 2
    },
    {
      "answer": "Peter Damian",
      "tier": 2
    },
    {
      "answer": "Simon Stylites",
      "tier": 2
    },
    {
      "answer": "Hilarion",
      "tier": 2
    },
    {
      "answer": "Sabas",
      "tier": 2
    },
    {
      "answer": "Arsenius the Great",
      "tier": 3
    },
    {
      "answer": "Macarius of Egypt",
      "tier": 3
    },
    {
      "answer": "Pachomius",
      "tier": 3
    },
    {
      "answer": "Moses the Black",
      "tier": 3
    },
    {
      "answer": "Onuphrius",
      "tier": 3
    },
    {
      "answer": "Euthymius the Great",
      "tier": 3
    },
    {
      "answer": "Theodosius the Cenobiarch",
      "tier": 3
    },
    {
      "answer": "Augustine Novello",
      "tier": 3
    },
    {
      "answer": "Alruna of Cham",
      "tier": 3
    },
    {
      "answer": "Ammon of Cyprus",
      "tier": 3
    },
    {
      "answer": "Andrew of Segni",
      "tier": 3
    },
    {
      "answer": "Alericus",
      "tier": 3
    },
    {
      "answer": "Adalbert of Caramaico",
      "tier": 4
    },
    {
      "answer": "Agapios of Vatopedi",
      "tier": 4
    },
    {
      "answer": "Alanus of Sassovivo",
      "tier": 4
    },
    {
      "answer": "Albert of Genoa",
      "tier": 4
    },
    {
      "answer": "Albert of Siena",
      "tier": 4
    },
    {
      "answer": "Alexander of Kouchta",
      "tier": 4
    },
    {
      "answer": "Andrea Caccioli",
      "tier": 4
    },
    {
      "answer": "Angela of Bohemia",
      "tier": 4
    },
    {
      "answer": "Angelus of Foligno",
      "tier": 4
    },
    {
      "answer": "Angelus of Furci",
      "tier": 4
    },
    {
      "answer": "Anselmo",
      "tier": 4
    },
    {
      "answer": "Antimo of Urbino",
      "tier": 4
    },
    {
      "answer": "Bartolomeo of Simeri",
      "tier": 4
    },
    {
      "answer": "Benedict Revelli",
      "tier": 4
    },
    {
      "answer": "Benedict Ricasoli",
      "tier": 4
    },
    {
      "answer": "Benigno of Vallumbrosa",
      "tier": 5
    },
    {
      "answer": "Benno of Metz",
      "tier": 5
    },
    {
      "answer": "Berthold of Scheide",
      "tier": 5
    },
    {
      "answer": "Bertold of Mount Carmel",
      "tier": 5
    },
    {
      "answer": "Bogumilus of Gniezno",
      "tier": 5
    },
    {
      "answer": "Bronislava of Poland",
      "tier": 5
    },
    {
      "answer": "Adam of Cantalupo in Sabina",
      "tier": 5
    },
    {
      "answer": "Adam of San Sabine",
      "tier": 5
    },
    {
      "answer": "Angelo of Acquapagana",
      "tier": 5
    },
    {
      "answer": "Angelus of Gualdo Tadino",
      "tier": 5
    },
    {
      "answer": "Angelus Sinesius",
      "tier": 5
    },
    {
      "answer": "Anthony Manzi",
      "tier": 5
    },
    {
      "answer": "Archan of Etting",
      "tier": 5
    },
    {
      "answer": "Bellatanus of Perugia",
      "tier": 5
    },
    {
      "answer": "Benincasa of Montepulciano",
      "tier": 5
    },
    {
      "answer": "Bernard of Sithiu",
      "tier": 6
    },
    {
      "answer": "Bertrada of Saint Gallen",
      "tier": 6
    },
    {
      "answer": "Bodard of Poitiers",
      "tier": 6
    },
    {
      "answer": "Cherilde of Saint George",
      "tier": 6
    },
    {
      "answer": "Choulélaios of Cyprus",
      "tier": 6
    },
    {
      "answer": "Christian of Landais",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Anthony the Great",
      "accepted": true
    },
    {
      "guess": "Paul of Thebes",
      "accepted": true
    },
    {
      "guess": "Mary of Egypt",
      "accepted": true
    },
    {
      "guess": "Benedict of Nursia",
      "accepted": true
    },
    {
      "guess": "Romuald",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A Dominican friar and theologian, not a hermit."
    },
    {
      "guess": "Francis Xavier",
      "accepted": false,
      "reason": "A missionary, not a hermit."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A military leader, not a hermit."
    },
    {
      "guess": "John Bosco",
      "accepted": false,
      "reason": "A priest and educator, not a hermit."
    },
    {
      "guess": "Elizabeth Ann Seton",
      "accepted": false,
      "reason": "A religious sister and educator, not a hermit."
    }
  ]
},
{
  "id": "longtail-cardinal-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who was a cardinal.",
  "context": "The Church has recognized cardinals as saints, blesseds and venerables, including bishops, theologians, reformers and popes. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Cardinals,” 67 profiles: https://catholicsaints.info/saints-who-were-cardinals/ . All answer names are selected from this directory.",
  "answers": [
    {
      "answer": "John Henry Newman",
      "tier": 1
    },
    {
      "answer": "John Fisher",
      "tier": 1
    },
    {
      "answer": "Charles Borromeo",
      "tier": 1
    },
    {
      "answer": "Robert Bellarmine",
      "tier": 1
    },
    {
      "answer": "Gregory Barbarigo",
      "tier": 1
    },
    {
      "answer": "John Paul II",
      "tier": 2
    },
    {
      "answer": "John XXIII",
      "tier": 2
    },
    {
      "answer": "Paul VI",
      "tier": 2
    },
    {
      "answer": "Pius V",
      "tier": 2
    },
    {
      "answer": "Pius X",
      "tier": 2
    },
    {
      "answer": "Pius IX",
      "tier": 2
    },
    {
      "answer": "Bonaventure",
      "tier": 2
    },
    {
      "answer": "Peter Damian",
      "tier": 3
    },
    {
      "answer": "Nicholas Albergati",
      "tier": 3
    },
    {
      "answer": "Stefan Wyszyński",
      "tier": 3
    },
    {
      "answer": "Iuliu Hossu",
      "tier": 3
    },
    {
      "answer": "Clemens August von Galen",
      "tier": 3
    },
    {
      "answer": "Andrea Carlo Ferrari",
      "tier": 3
    },
    {
      "answer": "Bernardo degli Uberti",
      "tier": 3
    },
    {
      "answer": "Galdinus of Milan",
      "tier": 3
    },
    {
      "answer": "Callistus II",
      "tier": 3
    },
    {
      "answer": "Urban II",
      "tier": 3
    },
    {
      "answer": "Benedict XI",
      "tier": 3
    },
    {
      "answer": "Innocent XI",
      "tier": 3
    },
    {
      "answer": "Gelasius II",
      "tier": 4
    },
    {
      "answer": "Leo III",
      "tier": 4
    },
    {
      "answer": "Leo IV",
      "tier": 4
    },
    {
      "answer": "Sergius I",
      "tier": 4
    },
    {
      "answer": "Innocent V",
      "tier": 4
    },
    {
      "answer": "Victor III",
      "tier": 4
    },
    {
      "answer": "Alojzije Viktor Stepinac",
      "tier": 4
    },
    {
      "answer": "Berardo dei Marsi",
      "tier": 4
    },
    {
      "answer": "Bernhard of Rodez",
      "tier": 4
    },
    {
      "answer": "Ciriaco María Sancha Hervás",
      "tier": 4
    },
    {
      "answer": "Claudio di Portaceli",
      "tier": 4
    },
    {
      "answer": "Conrad of Urach",
      "tier": 4
    },
    {
      "answer": "Cristoforo Amerio",
      "tier": 4
    },
    {
      "answer": "Francis Ronci",
      "tier": 4
    },
    {
      "answer": "Giovanni Dominici",
      "tier": 4
    },
    {
      "answer": "Giovanni Orsini",
      "tier": 5
    },
    {
      "answer": "Giuseppe Benedetto Dusmet",
      "tier": 5
    },
    {
      "answer": "Henry of Albano",
      "tier": 5
    },
    {
      "answer": "Henry of Segusio",
      "tier": 5
    },
    {
      "answer": "Hugh of Ostia",
      "tier": 5
    },
    {
      "answer": "Louis Allemand",
      "tier": 5
    },
    {
      "answer": "Marcelo Spínola y Maestre",
      "tier": 5
    },
    {
      "answer": "Matthew of Albano",
      "tier": 5
    },
    {
      "answer": "Paul Burali d’Arezzo",
      "tier": 5
    },
    {
      "answer": "Peter Igneus",
      "tier": 5
    },
    {
      "answer": "Peter of Luxembourg",
      "tier": 5
    },
    {
      "answer": "Pierre de Barellis",
      "tier": 5
    },
    {
      "answer": "Raymond of Toulouse",
      "tier": 5
    },
    {
      "answer": "Stephen of Palestrina",
      "tier": 5
    },
    {
      "answer": "Vincent of Cologne",
      "tier": 5
    },
    {
      "answer": "August Józef Hlond",
      "tier": 6
    },
    {
      "answer": "Cesare Baronio",
      "tier": 6
    },
    {
      "answer": "Elia dalla Costa",
      "tier": 6
    },
    {
      "answer": "François-Xavier Nguyên Van Thuán",
      "tier": 6
    },
    {
      "answer": "Pietro Marcellino Corradini",
      "tier": 6
    },
    {
      "answer": "Sisto Riario Sforza",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "John Henry Newman",
      "accepted": true
    },
    {
      "guess": "John Fisher",
      "accepted": true
    },
    {
      "guess": "Charles Borromeo",
      "accepted": true
    },
    {
      "guess": "Robert Bellarmine",
      "accepted": true
    },
    {
      "guess": "John Paul II",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A Dominican friar, not a cardinal."
    },
    {
      "guess": "Francis of Assisi",
      "accepted": false,
      "reason": "A religious founder, not a cardinal."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A parish priest, not a cardinal."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A Carmelite nun, not a cardinal."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A laywoman and military leader, not a cardinal."
    }
  ]
},
{
  "id": "longtail-deacon-saints",
  "theme": "saints",
  "prompt": "Name a saint or blessed who was a deacon.",
  "context": "Deacons served the early Church and later communities as preachers, administrators, missionaries and martyrs. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Deacons,” a directory of 237 profiles: https://catholicsaints.info/saints-who-were-deacons/ . Names follow the source index.",
  "answers": [
    {
      "answer": "Stephen",
      "tier": 1
    },
    {
      "answer": "Lawrence",
      "tier": 1
    },
    {
      "answer": "Vincent of Saragossa",
      "tier": 1
    },
    {
      "answer": "Ephrem the Syrian",
      "tier": 1
    },
    {
      "answer": "Francis of Assisi",
      "tier": 1
    },
    {
      "answer": "Philip the Deacon",
      "tier": 2
    },
    {
      "answer": "Phoebe",
      "tier": 2
    },
    {
      "answer": "Alcuin",
      "tier": 2
    },
    {
      "answer": "Romanus the Melodist",
      "tier": 2
    },
    {
      "answer": "Peter the Deacon",
      "tier": 2
    },
    {
      "answer": "Arsenius the Great",
      "tier": 2
    },
    {
      "answer": "Andrew of Crete",
      "tier": 2
    },
    {
      "answer": "Prochorus",
      "tier": 3
    },
    {
      "answer": "Nicanor",
      "tier": 3
    },
    {
      "answer": "Timothy",
      "tier": 3
    },
    {
      "answer": "Titus",
      "tier": 3
    },
    {
      "answer": "Agapitus I",
      "tier": 3
    },
    {
      "answer": "Boniface IV",
      "tier": 3
    },
    {
      "answer": "Leo IX",
      "tier": 3
    },
    {
      "answer": "Nicholas I",
      "tier": 3
    },
    {
      "answer": "Silverius",
      "tier": 3
    },
    {
      "answer": "Siricius",
      "tier": 3
    },
    {
      "answer": "Zachary",
      "tier": 3
    },
    {
      "answer": "Gregory X",
      "tier": 3
    },
    {
      "answer": "Abdiesus",
      "tier": 4
    },
    {
      "answer": "Abibus of Alexandria",
      "tier": 4
    },
    {
      "answer": "Abibus of Edessa",
      "tier": 4
    },
    {
      "answer": "Abundantius of Rome",
      "tier": 4
    },
    {
      "answer": "Abundius",
      "tier": 4
    },
    {
      "answer": "Aceolus of Amiens",
      "tier": 4
    },
    {
      "answer": "Achilleus of Vienne",
      "tier": 4
    },
    {
      "answer": "Acius of Amiens",
      "tier": 4
    },
    {
      "answer": "Adalbert of Egmond",
      "tier": 4
    },
    {
      "answer": "Agapitus the Deacon",
      "tier": 4
    },
    {
      "answer": "Agathangelus",
      "tier": 4
    },
    {
      "answer": "Agathopodes of Antioch",
      "tier": 4
    },
    {
      "answer": "Agathopus the Deacon",
      "tier": 4
    },
    {
      "answer": "Alypius Stylites",
      "tier": 4
    },
    {
      "answer": "Amantius of Wintershoven",
      "tier": 4
    },
    {
      "answer": "Ammon of Heraclea",
      "tier": 5
    },
    {
      "answer": "Ammonius the Deacon",
      "tier": 5
    },
    {
      "answer": "Andeolus of Smyrna",
      "tier": 5
    },
    {
      "answer": "Andrew of Fiesole",
      "tier": 5
    },
    {
      "answer": "Anianus of Wilparting",
      "tier": 5
    },
    {
      "answer": "Anianus the Deacon",
      "tier": 5
    },
    {
      "answer": "Apollinare of Trieste",
      "tier": 5
    },
    {
      "answer": "Apseus of Arbela",
      "tier": 5
    },
    {
      "answer": "Archelaus of Ostia",
      "tier": 5
    },
    {
      "answer": "Arialdus of Milan",
      "tier": 5
    },
    {
      "answer": "Arsenius of Scetis",
      "tier": 5
    },
    {
      "answer": "Athanasius of Jerusalem",
      "tier": 5
    },
    {
      "answer": "Augebert of Champagne",
      "tier": 5
    },
    {
      "answer": "Augurius the Martyr",
      "tier": 5
    },
    {
      "answer": "Avertinus of Tours",
      "tier": 5
    },
    {
      "answer": "Avitus of Auxerre",
      "tier": 6
    },
    {
      "answer": "Azadanes the Deacon",
      "tier": 6
    },
    {
      "answer": "Baldomerus of Saint Justus",
      "tier": 6
    },
    {
      "answer": "Baldwin",
      "tier": 6
    },
    {
      "answer": "Barhadbescialas",
      "tier": 6
    },
    {
      "answer": "Basil of Tiberiopolis",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Stephen",
      "accepted": true
    },
    {
      "guess": "Lawrence",
      "accepted": true
    },
    {
      "guess": "Vincent of Saragossa",
      "accepted": true
    },
    {
      "guess": "Ephrem the Syrian",
      "accepted": true
    },
    {
      "guess": "Francis of Assisi",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A priest and friar, not a deacon."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A priest, not a deacon."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A laywoman, not a deacon."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A nun, not a deacon."
    },
    {
      "guess": "Dominic",
      "accepted": false,
      "reason": "A priest and founder, not a deacon."
    }
  ]
},
{
  "id": "longtail-writer-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who was a writer.",
  "context": "Catholic saints have written theology, philosophy, poetry, letters, histories, spiritual classics and fiction. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Writers,” a directory of 431 profiles: https://catholicsaints.info/saints-who-were-writers/ . The answer bank samples named people in that index.",
  "answers": [
    {
      "answer": "Augustine of Hippo",
      "tier": 1
    },
    {
      "answer": "Jerome",
      "tier": 1
    },
    {
      "answer": "Thomas Aquinas",
      "tier": 1
    },
    {
      "answer": "John Henry Newman",
      "tier": 1
    },
    {
      "answer": "Teresa of Ávila",
      "tier": 1
    },
    {
      "answer": "Francis de Sales",
      "tier": 2
    },
    {
      "answer": "Bonaventure",
      "tier": 2
    },
    {
      "answer": "Catherine of Siena",
      "tier": 2
    },
    {
      "answer": "Hildegard of Bingen",
      "tier": 2
    },
    {
      "answer": "John of the Cross",
      "tier": 2
    },
    {
      "answer": "Bede the Venerable",
      "tier": 2
    },
    {
      "answer": "G. K. Chesterton",
      "tier": 2
    },
    {
      "answer": "Gregory the Great",
      "tier": 3
    },
    {
      "answer": "John Chrysostom",
      "tier": 3
    },
    {
      "answer": "Athanasius",
      "tier": 3
    },
    {
      "answer": "Basil the Great",
      "tier": 3
    },
    {
      "answer": "Ambrose of Milan",
      "tier": 3
    },
    {
      "answer": "Bernard of Clairvaux",
      "tier": 3
    },
    {
      "answer": "Thomas à Kempis",
      "tier": 3
    },
    {
      "answer": "Dante Alighieri",
      "tier": 3
    },
    {
      "answer": "Flannery O'Connor",
      "tier": 3
    },
    {
      "answer": "J. R. R. Tolkien",
      "tier": 3
    },
    {
      "answer": "Dorothy Day",
      "tier": 3
    },
    {
      "answer": "Thomas Merton",
      "tier": 3
    },
    {
      "answer": "Edith Stein",
      "tier": 4
    },
    {
      "answer": "Julian of Norwich",
      "tier": 4
    },
    {
      "answer": "Meister Eckhart",
      "tier": 4
    },
    {
      "answer": "Peter Canisius",
      "tier": 4
    },
    {
      "answer": "Robert Bellarmine",
      "tier": 4
    },
    {
      "answer": "Alphonsus Liguori",
      "tier": 4
    },
    {
      "answer": "John of Ávila",
      "tier": 4
    },
    {
      "answer": "Irenaeus of Lyons",
      "tier": 4
    },
    {
      "answer": "Justin Martyr",
      "tier": 4
    },
    {
      "answer": "Origen",
      "tier": 4
    },
    {
      "answer": "Clement of Alexandria",
      "tier": 4
    },
    {
      "answer": "Tertullian",
      "tier": 4
    },
    {
      "answer": "Cyprian of Carthage",
      "tier": 4
    },
    {
      "answer": "Eusebius of Caesarea",
      "tier": 4
    },
    {
      "answer": "Isidore of Seville",
      "tier": 4
    },
    {
      "answer": "Anselm of Canterbury",
      "tier": 5
    },
    {
      "answer": "Acardo of Avranches",
      "tier": 5
    },
    {
      "answer": "Alan the Great of Lille",
      "tier": 5
    },
    {
      "answer": "Alanus de Rupe",
      "tier": 5
    },
    {
      "answer": "Alberto Pandoni",
      "tier": 5
    },
    {
      "answer": "Amalarius of Metz",
      "tier": 5
    },
    {
      "answer": "Ambrose of Camaldoli",
      "tier": 5
    },
    {
      "answer": "Anacleto González Flores",
      "tier": 5
    },
    {
      "answer": "Ángel Martínez Miquélez",
      "tier": 5
    },
    {
      "answer": "Angelo Carletti",
      "tier": 5
    },
    {
      "answer": "Angelo Tancredi",
      "tier": 5
    },
    {
      "answer": "Anne of Saint Bartholomew",
      "tier": 5
    },
    {
      "answer": "Antoine-Frédéric Ozanam",
      "tier": 5
    },
    {
      "answer": "Anton Martin Slomsek",
      "tier": 5
    },
    {
      "answer": "Antonio Rosmini-Serbati",
      "tier": 5
    },
    {
      "answer": "Armand of Zierikzee",
      "tier": 6
    },
    {
      "answer": "Arnald Arench",
      "tier": 6
    },
    {
      "answer": "Arnulf of Leuven",
      "tier": 6
    },
    {
      "answer": "Astolfo Lobo",
      "tier": 6
    },
    {
      "answer": "Augustinus Jeong Yak-jong",
      "tier": 6
    },
    {
      "answer": "Basilissa Fernandez",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Augustine of Hippo",
      "accepted": true
    },
    {
      "guess": "Jerome",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": true
    },
    {
      "guess": "John Henry Newman",
      "accepted": true
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": true
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A military leader, not listed as a writer in the source index."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A parish priest, not listed as a writer."
    },
    {
      "guess": "Francis of Assisi",
      "accepted": false,
      "reason": "A religious founder; not included in this answer key."
    },
    {
      "guess": "Padre Pio",
      "accepted": false,
      "reason": "A priest and mystic, not listed as a writer."
    },
    {
      "guess": "Christopher Columbus",
      "accepted": false,
      "reason": "Not a Catholic saint, blessed or venerable."
    }
  ]
},
{
  "id": "longtail-poet-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who was a poet.",
  "context": "Catholic poets wrote hymns, canticles, devotional verse and poetry in many languages and traditions. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Poets,” 97 profiles: https://catholicsaints.info/saints-who-were-poets/ . The answer bank selects 60 named entries from the index.",
  "answers": [
    {
      "answer": "David",
      "tier": 1
    },
    {
      "answer": "John of the Cross",
      "tier": 1
    },
    {
      "answer": "Ephrem the Syrian",
      "tier": 1
    },
    {
      "answer": "Ambrose of Milan",
      "tier": 1
    },
    {
      "answer": "Bede the Venerable",
      "tier": 1
    },
    {
      "answer": "Jacopone da Todi",
      "tier": 2
    },
    {
      "answer": "Rabanus Maurus",
      "tier": 2
    },
    {
      "answer": "Raymond Lull",
      "tier": 2
    },
    {
      "answer": "Tommaso of Celano",
      "tier": 2
    },
    {
      "answer": "Aengus the Culdee",
      "tier": 2
    },
    {
      "answer": "Aldhelm of Sherborne",
      "tier": 2
    },
    {
      "answer": "Andrew of Crete",
      "tier": 2
    },
    {
      "answer": "Alan the Great of Lille",
      "tier": 3
    },
    {
      "answer": "Albert of Csanád",
      "tier": 3
    },
    {
      "answer": "Anne of Saint Bartholomew",
      "tier": 3
    },
    {
      "answer": "Arnulf of Leuven",
      "tier": 3
    },
    {
      "answer": "Edmund Bojanowski",
      "tier": 3
    },
    {
      "answer": "Florencio López Egea",
      "tier": 3
    },
    {
      "answer": "Herman the Cripple",
      "tier": 3
    },
    {
      "answer": "Jarich of Mariegaarde",
      "tier": 3
    },
    {
      "answer": "Joan Franquesa Costa",
      "tier": 3
    },
    {
      "answer": "John Baptist Spagnuolo",
      "tier": 3
    },
    {
      "answer": "Leandro",
      "tier": 3
    },
    {
      "answer": "Lojze Grozde",
      "tier": 3
    },
    {
      "answer": "Max Josef Metzger",
      "tier": 4
    },
    {
      "answer": "Narcís Sitjà Basté",
      "tier": 4
    },
    {
      "answer": "Nikollë Prennushi",
      "tier": 4
    },
    {
      "answer": "Notkar Balbulus",
      "tier": 4
    },
    {
      "answer": "Valentín Díez Serna",
      "tier": 4
    },
    {
      "answer": "Victor Chumillas-Fernández",
      "tier": 4
    },
    {
      "answer": "Adrian of Canterbury",
      "tier": 4
    },
    {
      "answer": "Amphilocus of Iconium",
      "tier": 4
    },
    {
      "answer": "Anatolius of Constantinople",
      "tier": 4
    },
    {
      "answer": "Angilbert of Centula",
      "tier": 4
    },
    {
      "answer": "Athenogenes of Pontus",
      "tier": 4
    },
    {
      "answer": "Avitus of Vienne",
      "tier": 4
    },
    {
      "answer": "Bartholomew of Rossano",
      "tier": 4
    },
    {
      "answer": "Brinolfo Algotsson",
      "tier": 4
    },
    {
      "answer": "Brogan of Ross Tuirc",
      "tier": 4
    },
    {
      "answer": "Caedmon",
      "tier": 5
    },
    {
      "answer": "Carthage the Younger",
      "tier": 5
    },
    {
      "answer": "César de Bus",
      "tier": 5
    },
    {
      "answer": "Colman Mac Ui Cluasigh of Cork",
      "tier": 5
    },
    {
      "answer": "Colman of Cloyne",
      "tier": 5
    },
    {
      "answer": "Columba of Iona",
      "tier": 5
    },
    {
      "answer": "Cosmas the Melodist",
      "tier": 5
    },
    {
      "answer": "Costanzo of Vercelli",
      "tier": 5
    },
    {
      "answer": "Donatus of Fiesoli",
      "tier": 5
    },
    {
      "answer": "Amadeus of Portugal",
      "tier": 5
    },
    {
      "answer": "Amalarius of Metz",
      "tier": 5
    },
    {
      "answer": "Anacleto González Flores",
      "tier": 5
    },
    {
      "answer": "Antonio Rosmini-Serbati",
      "tier": 5
    },
    {
      "answer": "Herman Joseph",
      "tier": 5
    },
    {
      "answer": "Henry Suso",
      "tier": 5
    },
    {
      "answer": "Peter the Venerable",
      "tier": 6
    },
    {
      "answer": "Francisco Martín Fernández de Posadas",
      "tier": 6
    },
    {
      "answer": "Frowin of Engelberg",
      "tier": 6
    },
    {
      "answer": "Fructuoso Pérez Márquez",
      "tier": 6
    },
    {
      "answer": "Fulton John Sheen",
      "tier": 6
    },
    {
      "answer": "Gennaro Maria Sarnelli",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "David",
      "accepted": true
    },
    {
      "guess": "John of the Cross",
      "accepted": true
    },
    {
      "guess": "Ephrem the Syrian",
      "accepted": true
    },
    {
      "guess": "Ambrose of Milan",
      "accepted": true
    },
    {
      "guess": "Bede the Venerable",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A theologian and hymn writer, but not included in this poet directory."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A military leader, not a poet."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A parish priest, not listed as a poet."
    },
    {
      "guess": "Francis Xavier",
      "accepted": false,
      "reason": "A missionary, not listed as a poet."
    },
    {
      "guess": "Teresa of Calcutta",
      "accepted": false,
      "reason": "A missionary sister, not listed as a poet."
    }
  ]
},
{
  "id": "longtail-farmer-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who worked as a farmer or gardener.",
  "context": "The Church’s calendar includes farm workers, gardeners and people whose holiness grew out of ordinary rural life. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Farmers,” 63 profiles: https://catholicsaints.info/saints-who-were-farmers/ . All entries are drawn from the source index.",
  "answers": [
    {
      "answer": "Isidore the Farmer",
      "tier": 1
    },
    {
      "answer": "André Bessette",
      "tier": 1
    },
    {
      "answer": "Juan Diego",
      "tier": 1
    },
    {
      "answer": "Felix of Nola",
      "tier": 1
    },
    {
      "answer": "Nicholas of Flüe",
      "tier": 1
    },
    {
      "answer": "Edmund Rice",
      "tier": 2
    },
    {
      "answer": "Franz Jägerstätter",
      "tier": 2
    },
    {
      "answer": "Sebastian of Aparicio",
      "tier": 2
    },
    {
      "answer": "Pope Fabian",
      "tier": 2
    },
    {
      "answer": "Guy of Anderlecht",
      "tier": 2
    },
    {
      "answer": "Ignatius of Laconi",
      "tier": 2
    },
    {
      "answer": "John Saziari",
      "tier": 2
    },
    {
      "answer": "Albert of Bergamo",
      "tier": 3
    },
    {
      "answer": "Everard of Villers",
      "tier": 3
    },
    {
      "answer": "Giles of Laurenzana",
      "tier": 3
    },
    {
      "answer": "Gratia of Cattaro",
      "tier": 3
    },
    {
      "answer": "John Finch",
      "tier": 3
    },
    {
      "answer": "Marianna Biernacka",
      "tier": 3
    },
    {
      "answer": "Ralph Milner",
      "tier": 3
    },
    {
      "answer": "Auguste Chapdelaine",
      "tier": 3
    },
    {
      "answer": "Bertrand of Le Mans",
      "tier": 3
    },
    {
      "answer": "Conon of Pamphylia",
      "tier": 3
    },
    {
      "answer": "Gaudericus of Mirepoix",
      "tier": 3
    },
    {
      "answer": "Magnus of Anagni",
      "tier": 3
    },
    {
      "answer": "Fran Mirakaj",
      "tier": 4
    },
    {
      "answer": "Isidore of Saint Joseph",
      "tier": 4
    },
    {
      "answer": "Sebastià Llorens Telarroja",
      "tier": 4
    },
    {
      "answer": "Stanislaw Kostka Starowieyski",
      "tier": 4
    },
    {
      "answer": "Adolofu Mukasa Ludigo",
      "tier": 4
    },
    {
      "answer": "Anatoli Kiriggwajjo",
      "tier": 4
    },
    {
      "answer": "Anna Wang",
      "tier": 4
    },
    {
      "answer": "Anrê Tuong",
      "tier": 4
    },
    {
      "answer": "Antôn Nguyen Ðích",
      "tier": 4
    },
    {
      "answer": "Ðaminh Nguyen Ðuc Mao",
      "tier": 4
    },
    {
      "answer": "Ðaminh Nhi",
      "tier": 4
    },
    {
      "answer": "Daminh Ninh",
      "tier": 4
    },
    {
      "answer": "Giovanni Battista Clemente Saggio",
      "tier": 4
    },
    {
      "answer": "Giuse Tuân",
      "tier": 4
    },
    {
      "answer": "Giuse Túc",
      "tier": 4
    },
    {
      "answer": "John Yi Yun-on",
      "tier": 5
    },
    {
      "answer": "Joseph Luu",
      "tier": 5
    },
    {
      "answer": "Lambert of Saragossa",
      "tier": 5
    },
    {
      "answer": "Leobinus of Chartres",
      "tier": 5
    },
    {
      "answer": "Leolucas of Corleone",
      "tier": 5
    },
    {
      "answer": "Luke the Younger",
      "tier": 5
    },
    {
      "answer": "Maria Mazzarello",
      "tier": 5
    },
    {
      "answer": "Michael Garicoïts",
      "tier": 5
    },
    {
      "answer": "Myron the Wonder Worker",
      "tier": 5
    },
    {
      "answer": "Paul the Simple",
      "tier": 5
    },
    {
      "answer": "Paulinus of Aquileia",
      "tier": 5
    },
    {
      "answer": "Paulus Ge Tingzhu",
      "tier": 5
    },
    {
      "answer": "Peter Cho Hwa-so",
      "tier": 5
    },
    {
      "answer": "Peter the Farmer",
      "tier": 5
    },
    {
      "answer": "Phocas the Gardener",
      "tier": 5
    },
    {
      "answer": "Raymond Nonnatus",
      "tier": 6
    },
    {
      "answer": "Rocco González",
      "tier": 6
    },
    {
      "answer": "Stêphanô Nguyen Van Vinh",
      "tier": 6
    },
    {
      "answer": "Vinh Son Tuong",
      "tier": 6
    },
    {
      "answer": "Vinh-Son Duong",
      "tier": 6
    },
    {
      "answer": "Walstan of Bawburgh",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Isidore the Farmer",
      "accepted": true
    },
    {
      "guess": "André Bessette",
      "accepted": true
    },
    {
      "guess": "Juan Diego",
      "accepted": true
    },
    {
      "guess": "Nicholas of Flüe",
      "accepted": true
    },
    {
      "guess": "Felix of Nola",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A Dominican friar and theologian, not a farmer in the source directory."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A military leader, not a farmer."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A parish priest, not a farmer."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A Carmelite nun, not a farmer."
    },
    {
      "guess": "Francis Xavier",
      "accepted": false,
      "reason": "A missionary, not a farmer."
    }
  ]
},
{
  "id": "longtail-servant-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who worked as a servant.",
  "context": "Some saints spent part of their lives in domestic service, caregiving or humble work for others. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Servants,” 71 profiles: https://catholicsaints.info/saints-who-were-servants/ . The answer key samples 60 names from the directory.",
  "answers": [
    {
      "answer": "Zita of Lucca",
      "tier": 1
    },
    {
      "answer": "Martin de Porres",
      "tier": 1
    },
    {
      "answer": "Maria Goretti",
      "tier": 1
    },
    {
      "answer": "Jeanne Jugan",
      "tier": 1
    },
    {
      "answer": "Notburga",
      "tier": 1
    },
    {
      "answer": "Isidore Bakanja",
      "tier": 2
    },
    {
      "answer": "Angela Salawa",
      "tier": 2
    },
    {
      "answer": "Faustina Kowalska",
      "tier": 2
    },
    {
      "answer": "Anne Catherine Emmerich",
      "tier": 2
    },
    {
      "answer": "Sebastian of Aparicio",
      "tier": 2
    },
    {
      "answer": "Radegund",
      "tier": 2
    },
    {
      "answer": "Rafqa",
      "tier": 2
    },
    {
      "answer": "Aimée-Adèle le Bouteiller",
      "tier": 3
    },
    {
      "answer": "Arnold of Stromberg",
      "tier": 3
    },
    {
      "answer": "Bartholomew Buonpedoni",
      "tier": 3
    },
    {
      "answer": "Catherine Soiron",
      "tier": 3
    },
    {
      "answer": "Eusebia Palomino Yenes",
      "tier": 3
    },
    {
      "answer": "Gertrude van Oosten",
      "tier": 3
    },
    {
      "answer": "Giselbert of Cappenberg",
      "tier": 3
    },
    {
      "answer": "John Carey",
      "tier": 3
    },
    {
      "answer": "John Mason",
      "tier": 3
    },
    {
      "answer": "John Roche",
      "tier": 3
    },
    {
      "answer": "John Shert",
      "tier": 3
    },
    {
      "answer": "Margherita of Verona",
      "tier": 3
    },
    {
      "answer": "Maria Fortunata Viti",
      "tier": 4
    },
    {
      "answer": "Oringa of the Cross",
      "tier": 4
    },
    {
      "answer": "Patrick Salmon",
      "tier": 4
    },
    {
      "answer": "Ralph Ashley",
      "tier": 4
    },
    {
      "answer": "Thérèse Soiron",
      "tier": 4
    },
    {
      "answer": "Ulrika Fransiska Nisch",
      "tier": 4
    },
    {
      "answer": "Walembert of Cambrai",
      "tier": 4
    },
    {
      "answer": "William Browne",
      "tier": 4
    },
    {
      "answer": "Adelelmus",
      "tier": 4
    },
    {
      "answer": "Agathodorus of Pergamus",
      "tier": 4
    },
    {
      "answer": "Apollo of Nicomedia",
      "tier": 4
    },
    {
      "answer": "Armogastes of Africa",
      "tier": 4
    },
    {
      "answer": "Asaph of Llanelwy",
      "tier": 4
    },
    {
      "answer": "Candida Maria de Jesus Cipitria y Barriola",
      "tier": 4
    },
    {
      "answer": "Charles Lwanga",
      "tier": 4
    },
    {
      "answer": "Cian of Wales",
      "tier": 5
    },
    {
      "answer": "Cronion Eunus",
      "tier": 5
    },
    {
      "answer": "Crotates of Nicomedia",
      "tier": 5
    },
    {
      "answer": "Cyneburga of Gloucester",
      "tier": 5
    },
    {
      "answer": "Dorotheus of Nicomedia",
      "tier": 5
    },
    {
      "answer": "Essuperanzio of Zurich",
      "tier": 5
    },
    {
      "answer": "Felicity of Carthage",
      "tier": 5
    },
    {
      "answer": "Gondolf of Saintes",
      "tier": 5
    },
    {
      "answer": "Gunthildis of Suffersheim",
      "tier": 5
    },
    {
      "answer": "Hermogenes of Melitene",
      "tier": 5
    },
    {
      "answer": "Hyacinth of Caesarea",
      "tier": 5
    },
    {
      "answer": "Hyacinth of Rome",
      "tier": 5
    },
    {
      "answer": "Indes of Nicomedia",
      "tier": 5
    },
    {
      "answer": "Ioannes Baptista Luo Tingyin",
      "tier": 5
    },
    {
      "answer": "Isacius of Nicomedia",
      "tier": 5
    },
    {
      "answer": "Ischyrion",
      "tier": 6
    },
    {
      "answer": "John of Rome",
      "tier": 6
    },
    {
      "answer": "John Rigby",
      "tier": 6
    },
    {
      "answer": "Juliana of Pavilly",
      "tier": 6
    },
    {
      "answer": "Lambert of Saragossa",
      "tier": 6
    },
    {
      "answer": "Leopardus the Slave",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Zita of Lucca",
      "accepted": true
    },
    {
      "guess": "Martin de Porres",
      "accepted": true
    },
    {
      "guess": "Maria Goretti",
      "accepted": true
    },
    {
      "guess": "Jeanne Jugan",
      "accepted": true
    },
    {
      "guess": "Notburga",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A theologian and friar, not listed as a servant."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A priest, not listed as a servant."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A military leader, not a domestic servant."
    },
    {
      "guess": "Francis Xavier",
      "accepted": false,
      "reason": "A missionary, not listed as a servant."
    },
    {
      "guess": "Catherine of Siena",
      "accepted": false,
      "reason": "A lay Dominican mystic, not listed as a servant."
    }
  ]
},
{
  "id": "longtail-shepherd-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or biblical figure who was a shepherd.",
  "context": "The shepherd’s life appears in Scripture and in the biographies of saints and blesseds. This open list includes biblical shepherds and later Christian figures; it is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Shepherds,” 70 profiles: https://catholicsaints.info/saints-who-were-shepherds/ . The answer bank follows the source index.",
  "answers": [
    {
      "answer": "David",
      "tier": 1
    },
    {
      "answer": "Abraham",
      "tier": 1
    },
    {
      "answer": "Patrick",
      "tier": 1
    },
    {
      "answer": "Cuthbert of Lindisfarne",
      "tier": 1
    },
    {
      "answer": "Wendelin",
      "tier": 1
    },
    {
      "answer": "Amos",
      "tier": 2
    },
    {
      "answer": "Pope Pius V",
      "tier": 2
    },
    {
      "answer": "Dominic of Silos",
      "tier": 2
    },
    {
      "answer": "John of God",
      "tier": 2
    },
    {
      "answer": "Pascal Baylon",
      "tier": 2
    },
    {
      "answer": "Peter Chanel",
      "tier": 2
    },
    {
      "answer": "Pedro de San José Betancur",
      "tier": 2
    },
    {
      "answer": "Aldericus of Füssenich",
      "tier": 3
    },
    {
      "answer": "Atanasio Vidaurreta Labra",
      "tier": 3
    },
    {
      "answer": "Buenaventura García-Paredes Pallasá",
      "tier": 3
    },
    {
      "answer": "Dominic Barberi",
      "tier": 3
    },
    {
      "answer": "Eberhard of Tüntenhausen",
      "tier": 3
    },
    {
      "answer": "Francisco Sánchez Márquez",
      "tier": 3
    },
    {
      "answer": "Gezelin of Schlebusch",
      "tier": 3
    },
    {
      "answer": "José Xavier Gorosterratzu y Jaunarena",
      "tier": 3
    },
    {
      "answer": "Leopold of Gaiche",
      "tier": 3
    },
    {
      "answer": "Mariano of Roccacasale",
      "tier": 3
    },
    {
      "answer": "Tommaso Acerbis",
      "tier": 3
    },
    {
      "answer": "Vinebault",
      "tier": 3
    },
    {
      "answer": "Edward Joseph Flanagan",
      "tier": 4
    },
    {
      "answer": "Martyrs of Perga",
      "tier": 4
    },
    {
      "answer": "Agostino Roscelli",
      "tier": 4
    },
    {
      "answer": "Allucio of Campugliano",
      "tier": 4
    },
    {
      "answer": "Belina of Troyes",
      "tier": 4
    },
    {
      "answer": "Benezet the Bridge Builder",
      "tier": 4
    },
    {
      "answer": "Blasius of Armentarius",
      "tier": 4
    },
    {
      "answer": "Carloman",
      "tier": 4
    },
    {
      "answer": "Charles of Sezze",
      "tier": 4
    },
    {
      "answer": "Claudian of Perga",
      "tier": 4
    },
    {
      "answer": "Conon of Perga",
      "tier": 4
    },
    {
      "answer": "Cristobal Magallanes Jara",
      "tier": 4
    },
    {
      "answer": "Cuthman",
      "tier": 4
    },
    {
      "answer": "Diodorus of Perga",
      "tier": 4
    },
    {
      "answer": "Drogo",
      "tier": 4
    },
    {
      "answer": "Eberhard of Luzy",
      "tier": 5
    },
    {
      "answer": "Emilian Cucullatus",
      "tier": 5
    },
    {
      "answer": "Felix of Cantalice",
      "tier": 5
    },
    {
      "answer": "Gregory of Crete",
      "tier": 5
    },
    {
      "answer": "Juan Macías",
      "tier": 5
    },
    {
      "answer": "Leobinus of Chartres",
      "tier": 5
    },
    {
      "answer": "Lomer of Corbion",
      "tier": 5
    },
    {
      "answer": "Macarius of Egypt",
      "tier": 5
    },
    {
      "answer": "Magnus of Anagni",
      "tier": 5
    },
    {
      "answer": "Malchus of Syria",
      "tier": 5
    },
    {
      "answer": "Mamas",
      "tier": 5
    },
    {
      "answer": "Mark of Antioch",
      "tier": 5
    },
    {
      "answer": "Michael Garicoïts",
      "tier": 5
    },
    {
      "answer": "Papias of Perga",
      "tier": 5
    },
    {
      "answer": "Philaret of Calabria",
      "tier": 5
    },
    {
      "answer": "Potenzianus of Sens",
      "tier": 6
    },
    {
      "answer": "Quadragesimus of Policastro",
      "tier": 6
    },
    {
      "answer": "Raymond Nonnatus",
      "tier": 6
    },
    {
      "answer": "Sabinianus of Sens",
      "tier": 6
    },
    {
      "answer": "Salvator of Horta",
      "tier": 6
    },
    {
      "answer": "Serafino of Montegranar",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "David",
      "accepted": true
    },
    {
      "guess": "Abraham",
      "accepted": true
    },
    {
      "guess": "Amos",
      "accepted": true
    },
    {
      "guess": "Patrick",
      "accepted": true
    },
    {
      "guess": "Cuthbert of Lindisfarne",
      "accepted": true
    },
    {
      "guess": "Moses",
      "accepted": false,
      "reason": "A biblical leader, but not included in this shepherd answer bank."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A military leader, not a shepherd."
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A theologian, not a shepherd."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A parish priest, not a shepherd in the source index."
    },
    {
      "guess": "Francis Xavier",
      "accepted": false,
      "reason": "A missionary, not a shepherd."
    }
  ]
},
{
  "id": "longtail-married-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who was married.",
  "context": "Many holy people were spouses and parents before, during or after their lives of public service in the Church. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Married,” 1,073 profiles: https://catholicsaints.info/saints-who-were-married/ . The answer list samples named figures in that directory, including biblical figures and later saints.",
  "answers": [
    {
      "answer": "Joseph",
      "tier": 1
    },
    {
      "answer": "Mary, Mother of Jesus",
      "tier": 1
    },
    {
      "answer": "Peter the Apostle",
      "tier": 1
    },
    {
      "answer": "Monica",
      "tier": 1
    },
    {
      "answer": "Elizabeth of Hungary",
      "tier": 1
    },
    {
      "answer": "Louis IX of France",
      "tier": 2
    },
    {
      "answer": "Zélie Martin",
      "tier": 2
    },
    {
      "answer": "Louis Martin",
      "tier": 2
    },
    {
      "answer": "Thomas More",
      "tier": 2
    },
    {
      "answer": "Joanna of Chuza",
      "tier": 2
    },
    {
      "answer": "Priscilla",
      "tier": 2
    },
    {
      "answer": "Aquila",
      "tier": 2
    },
    {
      "answer": "Abraham",
      "tier": 3
    },
    {
      "answer": "Sarah",
      "tier": 3
    },
    {
      "answer": "Isaac",
      "tier": 3
    },
    {
      "answer": "Rebecca",
      "tier": 3
    },
    {
      "answer": "Jacob",
      "tier": 3
    },
    {
      "answer": "Rachel",
      "tier": 3
    },
    {
      "answer": "Leah",
      "tier": 3
    },
    {
      "answer": "Moses",
      "tier": 3
    },
    {
      "answer": "Zipporah",
      "tier": 3
    },
    {
      "answer": "David",
      "tier": 3
    },
    {
      "answer": "Bathsheba",
      "tier": 3
    },
    {
      "answer": "Elizabeth of Portugal",
      "tier": 3
    },
    {
      "answer": "Rita of Cascia",
      "tier": 4
    },
    {
      "answer": "Frances of Rome",
      "tier": 4
    },
    {
      "answer": "Bridget of Sweden",
      "tier": 4
    },
    {
      "answer": "Hedwig of Silesia",
      "tier": 4
    },
    {
      "answer": "Catherine of Genoa",
      "tier": 4
    },
    {
      "answer": "Gianna Beretta Molla",
      "tier": 4
    },
    {
      "answer": "Maria Corsini Beltrame Quattrocchi",
      "tier": 4
    },
    {
      "answer": "Louis and Zélie Martin",
      "tier": 4
    },
    {
      "answer": "Joachim",
      "tier": 4
    },
    {
      "answer": "Anne",
      "tier": 4
    },
    {
      "answer": "Mary of Cleophas",
      "tier": 4
    },
    {
      "answer": "Salome",
      "tier": 4
    },
    {
      "answer": "Cleopas",
      "tier": 4
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
      "answer": "Philemon",
      "tier": 5
    },
    {
      "answer": "Apphia",
      "tier": 5
    },
    {
      "answer": "Aquila of Sinope",
      "tier": 5
    },
    {
      "answer": "Blandina",
      "tier": 5
    },
    {
      "answer": "Felix of Nola",
      "tier": 5
    },
    {
      "answer": "Gorgonia",
      "tier": 5
    },
    {
      "answer": "Gordianus",
      "tier": 5
    },
    {
      "answer": "Gregory of Nazianzus",
      "tier": 5
    },
    {
      "answer": "Helena",
      "tier": 5
    },
    {
      "answer": "Ludmila",
      "tier": 5
    },
    {
      "answer": "Maurus of Porec",
      "tier": 5
    },
    {
      "answer": "Natalia of Nicomedia",
      "tier": 5
    },
    {
      "answer": "Paula of Rome",
      "tier": 5
    },
    {
      "answer": "Perpetua",
      "tier": 5
    },
    {
      "answer": "Theodora of Alexandria",
      "tier": 5
    },
    {
      "answer": "Valerian",
      "tier": 6
    },
    {
      "answer": "Adalbert of Ostrevant",
      "tier": 6
    },
    {
      "answer": "Adam Arakawa",
      "tier": 6
    },
    {
      "answer": "Alexius Sato Seisuke",
      "tier": 6
    },
    {
      "answer": "Álvaro Santos Cejudo Moreno Chocano",
      "tier": 6
    },
    {
      "answer": "Antero Mateo García",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Joseph",
      "accepted": true
    },
    {
      "guess": "Mary, Mother of Jesus",
      "accepted": true
    },
    {
      "guess": "Peter the Apostle",
      "accepted": true
    },
    {
      "guess": "Monica",
      "accepted": true
    },
    {
      "guess": "Elizabeth of Hungary",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A Dominican friar who never married."
    },
    {
      "guess": "Clare of Assisi",
      "accepted": false,
      "reason": "A religious sister who never married."
    },
    {
      "guess": "Francis Xavier",
      "accepted": false,
      "reason": "A Jesuit priest who never married."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A Carmelite nun who never married."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A diocesan priest who never married."
    }
  ]
},
{
  "id": "longtail-widow-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who was a widow.",
  "context": "Many women continued lives of prayer, charity and service after the death of a spouse. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Widows,” 223 profiles: https://catholicsaints.info/saints-who-were-widows/ . The answer list uses names from the source directory.",
  "answers": [
    {
      "answer": "Adelindis of Buchau",
      "tier": 1
    },
    {
      "answer": "Alda of Siena",
      "tier": 1
    },
    {
      "answer": "Anna Maria Adorni Botti",
      "tier": 1
    },
    {
      "answer": "Anna Rosa Gattorno",
      "tier": 1
    },
    {
      "answer": "Concepcion Cabrera de Armida",
      "tier": 1
    },
    {
      "answer": "Eurosia Fabris",
      "tier": 2
    },
    {
      "answer": "Louise degli Albertoni",
      "tier": 2
    },
    {
      "answer": "Margaret Pole",
      "tier": 2
    },
    {
      "answer": "Maria Corsini Beltrame Quattrocchi",
      "tier": 2
    },
    {
      "answer": "Alruna of Cham",
      "tier": 2
    },
    {
      "answer": "Angelina di Marsciano",
      "tier": 2
    },
    {
      "answer": "Antonia of Florence",
      "tier": 2
    },
    {
      "answer": "Celina Chludzinska",
      "tier": 3
    },
    {
      "answer": "Dorothy of Montau",
      "tier": 3
    },
    {
      "answer": "Elisabetta Sanna",
      "tier": 3
    },
    {
      "answer": "Émilie Tavernier Gamelin",
      "tier": 3
    },
    {
      "answer": "Gaetana Sterni",
      "tier": 3
    },
    {
      "answer": "Jacoba de Settesoli",
      "tier": 3
    },
    {
      "answer": "Marcelina Darowska",
      "tier": 3
    },
    {
      "answer": "Margaret of Lorraine",
      "tier": 3
    },
    {
      "answer": "Margaret of Savoy",
      "tier": 3
    },
    {
      "answer": "Marianna Biernacka",
      "tier": 3
    },
    {
      "answer": "Marie of the Incarnation",
      "tier": 3
    },
    {
      "answer": "Anna Kajiya",
      "tier": 3
    },
    {
      "answer": "Beatrice Bicchieri",
      "tier": 4
    },
    {
      "answer": "Christina of Spoleto",
      "tier": 4
    },
    {
      "answer": "Delphine of Glandèves",
      "tier": 4
    },
    {
      "answer": "Ela of Lacock",
      "tier": 4
    },
    {
      "answer": "Esclaramunda of Majorca",
      "tier": 4
    },
    {
      "answer": "Frances d’Amboise",
      "tier": 4
    },
    {
      "answer": "Gisella of Ungarn",
      "tier": 4
    },
    {
      "answer": "Humiliana de’ Cerchi",
      "tier": 4
    },
    {
      "answer": "Ivetta of Huy",
      "tier": 4
    },
    {
      "answer": "Jeanne Marie de Maille",
      "tier": 4
    },
    {
      "answer": "Louise of Savoy",
      "tier": 4
    },
    {
      "answer": "Maria del Carmen of the Child Jesus",
      "tier": 4
    },
    {
      "answer": "María Lorenza Requenses de Longo",
      "tier": 4
    },
    {
      "answer": "Amalia Abad Casasempere de Maestre",
      "tier": 4
    },
    {
      "answer": "Bertha de Marbais",
      "tier": 4
    },
    {
      "answer": "Bertrada of Saint Gallen",
      "tier": 5
    },
    {
      "answer": "Constance de Castro",
      "tier": 5
    },
    {
      "answer": "Delfina of Pedralbes",
      "tier": 5
    },
    {
      "answer": "Eleanora",
      "tier": 5
    },
    {
      "answer": "Émilie d’Oultremont d’Hoogvorst",
      "tier": 5
    },
    {
      "answer": "Helen del Cavalcanti",
      "tier": 5
    },
    {
      "answer": "Helen Duglioli",
      "tier": 5
    },
    {
      "answer": "Helen of Poland",
      "tier": 5
    },
    {
      "answer": "Ida of Hohenfels",
      "tier": 5
    },
    {
      "answer": "Maria Mancini",
      "tier": 5
    },
    {
      "answer": "Maria of Haarlem",
      "tier": 5
    },
    {
      "answer": "Bonizzella Cacciaconti",
      "tier": 5
    },
    {
      "answer": "Elisabetta Berti",
      "tier": 5
    },
    {
      "answer": "Helwisa",
      "tier": 5
    },
    {
      "answer": "Hilsindis",
      "tier": 5
    },
    {
      "answer": "Isabella Fernandes",
      "tier": 6
    },
    {
      "answer": "Lucrecia García Solanas",
      "tier": 6
    },
    {
      "answer": "Maria Alvarez Marco",
      "tier": 6
    },
    {
      "answer": "Marie de la Dive veuve du Verdier de la Sorinière",
      "tier": 6
    },
    {
      "answer": "Marie-Louise-Élisabeth de Lamoignon de Dolé de Champlâtreux",
      "tier": 6
    },
    {
      "answer": "Mary Mamala",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Monica",
      "accepted": true
    },
    {
      "guess": "Rita of Cascia",
      "accepted": true
    },
    {
      "guess": "Elizabeth of Hungary",
      "accepted": true
    },
    {
      "guess": "Frances of Rome",
      "accepted": true
    },
    {
      "guess": "Jane Frances de Chantal",
      "accepted": true
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A Carmelite nun, not a widow."
    },
    {
      "guess": "Clare of Assisi",
      "accepted": false,
      "reason": "A religious sister, not a widow."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A military leader, not a widow."
    },
    {
      "guess": "Catherine of Siena",
      "accepted": false,
      "reason": "A lay Dominican, not a widow."
    },
    {
      "guess": "Bernadette Soubirous",
      "accepted": false,
      "reason": "A religious sister, not a widow."
    }
  ]
},
{
  "id": "longtail-lawyer-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who worked as a lawyer.",
  "context": "Some Catholic holy people studied, practiced or taught law before or during their service to the Church. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Lawyers,” 87 profiles: https://catholicsaints.info/saints-who-were-lawyers/ . The answer bank samples named entries from the directory.",
  "answers": [
    {
      "answer": "Alphonsus Maria de Liguori",
      "tier": 1
    },
    {
      "answer": "Francis de Sales",
      "tier": 1
    },
    {
      "answer": "Thomas More",
      "tier": 1
    },
    {
      "answer": "Ivo of Kermartin",
      "tier": 1
    },
    {
      "answer": "Thomas à Becket",
      "tier": 1
    },
    {
      "answer": "Charles Borromeo",
      "tier": 2
    },
    {
      "answer": "Jerome",
      "tier": 2
    },
    {
      "answer": "Raymond of Penyafort",
      "tier": 2
    },
    {
      "answer": "John of Ávila",
      "tier": 2
    },
    {
      "answer": "John of Capistrano",
      "tier": 2
    },
    {
      "answer": "Paulinus of Nola",
      "tier": 2
    },
    {
      "answer": "James of the Marches",
      "tier": 2
    },
    {
      "answer": "Gregory Barbarigo",
      "tier": 3
    },
    {
      "answer": "Fidelis of Sigmaringen",
      "tier": 3
    },
    {
      "answer": "Bernardine Realino",
      "tier": 3
    },
    {
      "answer": "Augustine Novello",
      "tier": 3
    },
    {
      "answer": "Bartholomew Longo",
      "tier": 3
    },
    {
      "answer": "Benedict of Urbino",
      "tier": 3
    },
    {
      "answer": "Bernardine of Fossa",
      "tier": 3
    },
    {
      "answer": "Contardo Ferrini",
      "tier": 3
    },
    {
      "answer": "John of Vercelli",
      "tier": 3
    },
    {
      "answer": "Richard of Chichester",
      "tier": 3
    },
    {
      "answer": "John Houghton",
      "tier": 3
    },
    {
      "answer": "Saint Aprus of Toul",
      "tier": 3
    },
    {
      "answer": "Agustín Alcalá y Henke",
      "tier": 4
    },
    {
      "answer": "Alain Dieulangard",
      "tier": 4
    },
    {
      "answer": "Anacleto González Flores",
      "tier": 4
    },
    {
      "answer": "Angelo Carletti",
      "tier": 4
    },
    {
      "answer": "Antoine-Frédéric Ozanam",
      "tier": 4
    },
    {
      "answer": "Antonio Franco",
      "tier": 4
    },
    {
      "answer": "Crescentius of Fabriano",
      "tier": 4
    },
    {
      "answer": "Demosthenes Ranzi",
      "tier": 4
    },
    {
      "answer": "Dermot O’Hurley",
      "tier": 4
    },
    {
      "answer": "Gennaro Maria Sarnelli",
      "tier": 4
    },
    {
      "answer": "Giacomo Villa",
      "tier": 4
    },
    {
      "answer": "Giuseppe Antonio Tovini",
      "tier": 4
    },
    {
      "answer": "Henry of Segusio",
      "tier": 4
    },
    {
      "answer": "Humbert of Romans",
      "tier": 4
    },
    {
      "answer": "Jacopone da Todi",
      "tier": 4
    },
    {
      "answer": "James the Almsgiver",
      "tier": 5
    },
    {
      "answer": "Jean of Hainaut",
      "tier": 5
    },
    {
      "answer": "John Storey",
      "tier": 5
    },
    {
      "answer": "José Almunia López-Teruel",
      "tier": 5
    },
    {
      "answer": "José María Rojas Lobo",
      "tier": 5
    },
    {
      "answer": "José Perpiñá Nácher",
      "tier": 5
    },
    {
      "answer": "Luigi Beltrame Quattrocchi",
      "tier": 5
    },
    {
      "answer": "Manuel Basulto Jiménez",
      "tier": 5
    },
    {
      "answer": "Marcelo Spínola y Maestre",
      "tier": 5
    },
    {
      "answer": "Mark Fantucci",
      "tier": 5
    },
    {
      "answer": "Miguel Gómez Loza",
      "tier": 5
    },
    {
      "answer": "Nazju Falzon",
      "tier": 5
    },
    {
      "answer": "Paul Burali d’Arezzo",
      "tier": 5
    },
    {
      "answer": "Paul of Wallachia",
      "tier": 5
    },
    {
      "answer": "Peter de Geremia",
      "tier": 5
    },
    {
      "answer": "Pierre de Barellis",
      "tier": 6
    },
    {
      "answer": "Pierre-Robert Regnet",
      "tier": 6
    },
    {
      "answer": "Pietro da Imola",
      "tier": 6
    },
    {
      "answer": "Pietro of Gubbio",
      "tier": 6
    },
    {
      "answer": "Ponzio of Barellis",
      "tier": 6
    },
    {
      "answer": "Rosario Angelo Livatino",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Thomas More",
      "accepted": true
    },
    {
      "guess": "Francis de Sales",
      "accepted": true
    },
    {
      "guess": "Thomas à Becket",
      "accepted": true
    },
    {
      "guess": "Alphonsus Liguori",
      "accepted": true
    },
    {
      "guess": "Ivo of Kermartin",
      "accepted": true
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A military leader, not a lawyer."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A parish priest, not a lawyer."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A Carmelite nun, not a lawyer."
    },
    {
      "guess": "Francis Xavier",
      "accepted": false,
      "reason": "A missionary, not a lawyer."
    },
    {
      "guess": "Bernadette Soubirous",
      "accepted": false,
      "reason": "A religious sister and visionary, not a lawyer."
    }
  ]
},
{
  "id": "longtail-abbess-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who was an abbess.",
  "context": "Abbesses led monasteries of women across many centuries and regions of the Church. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Abbesses,” 243 profiles: https://catholicsaints.info/saints-who-were-abbesses/ . Names are sampled from the source index.",
  "answers": [
    {
      "answer": "Hilda of Whitby",
      "tier": 1
    },
    {
      "answer": "Brigid of Kildare",
      "tier": 1
    },
    {
      "answer": "Scholastica",
      "tier": 1
    },
    {
      "answer": "Etheldreda",
      "tier": 1
    },
    {
      "answer": "Walburga",
      "tier": 1
    },
    {
      "answer": "Gertrude of Nivelles",
      "tier": 2
    },
    {
      "answer": "Hildegard of Bingen",
      "tier": 2
    },
    {
      "answer": "Thecla of Kitzingen",
      "tier": 2
    },
    {
      "answer": "Lioba",
      "tier": 2
    },
    {
      "answer": "Bertilla",
      "tier": 2
    },
    {
      "answer": "Gertrude of Helfta",
      "tier": 2
    },
    {
      "answer": "Adelindis of Buchau",
      "tier": 2
    },
    {
      "answer": "Agnes of Montepulciano",
      "tier": 3
    },
    {
      "answer": "Agnes of Prague",
      "tier": 3
    },
    {
      "answer": "Austrebertha of Pavilly",
      "tier": 3
    },
    {
      "answer": "Bathilde",
      "tier": 3
    },
    {
      "answer": "Begga of Andenne",
      "tier": 3
    },
    {
      "answer": "Ava of Denain",
      "tier": 3
    },
    {
      "answer": "Gertrude of Trzebnica",
      "tier": 3
    },
    {
      "answer": "Gertrude of Altenberg",
      "tier": 3
    },
    {
      "answer": "Gertrude Prosperi",
      "tier": 3
    },
    {
      "answer": "Ida of Nivelles",
      "tier": 3
    },
    {
      "answer": "Matilda of Ringelheim",
      "tier": 3
    },
    {
      "answer": "Radegund",
      "tier": 3
    },
    {
      "answer": "Abdela",
      "tier": 4
    },
    {
      "answer": "Achea of Kill-Glais",
      "tier": 4
    },
    {
      "answer": "Ada of Le Mans",
      "tier": 4
    },
    {
      "answer": "Adalsindis of Bèze",
      "tier": 4
    },
    {
      "answer": "Adelaide of Guelders",
      "tier": 4
    },
    {
      "answer": "Adele of Orp-le-Grand",
      "tier": 4
    },
    {
      "answer": "Adelina of Mortain",
      "tier": 4
    },
    {
      "answer": "Adeloga of Kitzingen",
      "tier": 4
    },
    {
      "answer": "Agapes of Nicomedia",
      "tier": 4
    },
    {
      "answer": "Agilberta of Jouarre",
      "tier": 4
    },
    {
      "answer": "Aldegundis",
      "tier": 4
    },
    {
      "answer": "Aldetrudis",
      "tier": 4
    },
    {
      "answer": "Almut of Wetter",
      "tier": 4
    },
    {
      "answer": "Amelberga of Susteren",
      "tier": 4
    },
    {
      "answer": "Angadrisma of Beauvais",
      "tier": 4
    },
    {
      "answer": "Anstrudis of Laon",
      "tier": 5
    },
    {
      "answer": "Attala of Strasbourg",
      "tier": 5
    },
    {
      "answer": "Attalia",
      "tier": 5
    },
    {
      "answer": "Aurea of Amiens",
      "tier": 5
    },
    {
      "answer": "Aurea of Boves",
      "tier": 5
    },
    {
      "answer": "Aurea of Paris",
      "tier": 5
    },
    {
      "answer": "Balda of Jouarre",
      "tier": 5
    },
    {
      "answer": "Baldegundis",
      "tier": 5
    },
    {
      "answer": "Basilissa of Øhren",
      "tier": 5
    },
    {
      "answer": "Beata of Ribnitz",
      "tier": 5
    },
    {
      "answer": "Beatrice da Silva Meneses",
      "tier": 5
    },
    {
      "answer": "Maria Mancini",
      "tier": 5
    },
    {
      "answer": "Maria Teresa Fasce",
      "tier": 5
    },
    {
      "answer": "Matthia dei Nazzarei",
      "tier": 5
    },
    {
      "answer": "Petronilla of Moncel",
      "tier": 5
    },
    {
      "answer": "Prudence Castori",
      "tier": 6
    },
    {
      "answer": "Ragenfreda",
      "tier": 6
    },
    {
      "answer": "Roland of Hasnon",
      "tier": 6
    },
    {
      "answer": "Salomea of Galicia",
      "tier": 6
    },
    {
      "answer": "Santucci Terrebotti",
      "tier": 6
    },
    {
      "answer": "Seraphina Sforza",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Hilda of Whitby",
      "accepted": true
    },
    {
      "guess": "Brigid of Kildare",
      "accepted": true
    },
    {
      "guess": "Scholastica",
      "accepted": true
    },
    {
      "guess": "Etheldreda",
      "accepted": true
    },
    {
      "guess": "Walburga",
      "accepted": true
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A military leader, not an abbess."
    },
    {
      "guess": "Catherine of Siena",
      "accepted": false,
      "reason": "A lay Dominican, not an abbess."
    },
    {
      "guess": "Teresa of Calcutta",
      "accepted": false,
      "reason": "A foundress and religious sister, not an abbess."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A priest, not an abbess."
    },
    {
      "guess": "Francis Xavier",
      "accepted": false,
      "reason": "A missionary priest, not an abbess."
    }
  ]
},
{
  "id": "longtail-lay-brother-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who was a lay brother.",
  "context": "Lay brothers served religious communities through practical work, hospitality, prayer and care of their communities. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Lay Brothers,” 128 profiles: https://catholicsaints.info/saints-who-were-lay-brothers/ . Names are sampled from the source index.",
  "answers": [
    {
      "answer": "Gerard Majella",
      "tier": 1
    },
    {
      "answer": "Alonso Rodriguez",
      "tier": 1
    },
    {
      "answer": "Alexis Falconieri",
      "tier": 1
    },
    {
      "answer": "Amatus Ronconi",
      "tier": 1
    },
    {
      "answer": "Bernard of Corleone",
      "tier": 1
    },
    {
      "answer": "Agustín Nogal Tobar",
      "tier": 2
    },
    {
      "answer": "Albert of Genoa",
      "tier": 2
    },
    {
      "answer": "Aldericus of Füssenich",
      "tier": 2
    },
    {
      "answer": "Alexander of Foigny",
      "tier": 2
    },
    {
      "answer": "Amadeus of Portugal",
      "tier": 2
    },
    {
      "answer": "Ambrose Fernandez",
      "tier": 2
    },
    {
      "answer": "Andrew of Segni",
      "tier": 2
    },
    {
      "answer": "Anthony of Stroncone",
      "tier": 3
    },
    {
      "answer": "Arnold of Clairvaux",
      "tier": 3
    },
    {
      "answer": "Augustine Novello",
      "tier": 3
    },
    {
      "answer": "Avertano of Lucca",
      "tier": 3
    },
    {
      "answer": "Bartolomé Aiutamicristo",
      "tier": 3
    },
    {
      "answer": "Benvenutus of Gubbio",
      "tier": 3
    },
    {
      "answer": "Bernard Perani",
      "tier": 3
    },
    {
      "answer": "Biagio of L’Aquila",
      "tier": 3
    },
    {
      "answer": "Bonaventure of Barcelona",
      "tier": 3
    },
    {
      "answer": "Claudio Granzotto",
      "tier": 3
    },
    {
      "answer": "Conrad of Heisterbach",
      "tier": 3
    },
    {
      "answer": "Diego Oddi",
      "tier": 3
    },
    {
      "answer": "Dominic Collins",
      "tier": 4
    },
    {
      "answer": "Egidius of Villers",
      "tier": 4
    },
    {
      "answer": "Everard of Villers",
      "tier": 4
    },
    {
      "answer": "Ezequiél Prieto Otero",
      "tier": 4
    },
    {
      "answer": "Fernando de Pablos Fernández",
      "tier": 4
    },
    {
      "answer": "Francisco Gárate Aranguren",
      "tier": 4
    },
    {
      "answer": "Frederick of Ratisbon",
      "tier": 4
    },
    {
      "answer": "Gabriel of Saint Magdalen",
      "tier": 4
    },
    {
      "answer": "Garcia d’Aure",
      "tier": 4
    },
    {
      "answer": "Gérard Cagnoli",
      "tier": 4
    },
    {
      "answer": "Gezelin of Schlebusch",
      "tier": 4
    },
    {
      "answer": "Gil Belascoain Ilagorri",
      "tier": 4
    },
    {
      "answer": "Giovanni Bodeo",
      "tier": 4
    },
    {
      "answer": "Gratia of Cattaro",
      "tier": 4
    },
    {
      "answer": "Hanz Wagner",
      "tier": 4
    },
    {
      "answer": "Isidore of Saint Joseph",
      "tier": 5
    },
    {
      "answer": "Isidro Alonso Peña",
      "tier": 5
    },
    {
      "answer": "István Sándor",
      "tier": 5
    },
    {
      "answer": "Jacobinus de Canepaci",
      "tier": 5
    },
    {
      "answer": "James Grissinger",
      "tier": 5
    },
    {
      "answer": "James of Luino",
      "tier": 5
    },
    {
      "answer": "Jean of Caramola",
      "tier": 5
    },
    {
      "answer": "Joachim Piccolomini",
      "tier": 5
    },
    {
      "answer": "Joaquín Zubillaga Echarri",
      "tier": 5
    },
    {
      "answer": "John Amero",
      "tier": 5
    },
    {
      "answer": "Juan Nuñez Orcajo",
      "tier": 5
    },
    {
      "answer": "Leonardus Kimura",
      "tier": 5
    },
    {
      "answer": "Mariano of Roccacasale",
      "tier": 5
    },
    {
      "answer": "Michele de la Rosa",
      "tier": 5
    },
    {
      "answer": "Nevolo of Faenza",
      "tier": 5
    },
    {
      "answer": "Nicolaus Fukunaga Keian",
      "tier": 6
    },
    {
      "answer": "Orlando of Vallombrosa",
      "tier": 6
    },
    {
      "answer": "Ornandus of Vicogne",
      "tier": 6
    },
    {
      "answer": "Ovidio Bravo Porras",
      "tier": 6
    },
    {
      "answer": "Paul Mary",
      "tier": 6
    },
    {
      "answer": "Pedro Armendáriz Zabaleta",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Gerard Majella",
      "accepted": true
    },
    {
      "guess": "Alonso Rodriguez",
      "accepted": true
    },
    {
      "guess": "Alexis Falconieri",
      "accepted": true
    },
    {
      "guess": "Amatus Ronconi",
      "accepted": true
    },
    {
      "guess": "Bernard of Corleone",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A priest and theologian, not a lay brother."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A diocesan priest, not a lay brother."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A laywoman and military leader, not a lay brother."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A nun, not a lay brother."
    },
    {
      "guess": "Francis Xavier",
      "accepted": false,
      "reason": "A Jesuit priest, not a lay brother."
    }
  ]
},
{
  "id": "longtail-prior-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who was a prior.",
  "context": "Priors led monasteries, convents and religious houses, often as deputies to an abbot or abbess. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Priors,” 156 profiles: https://catholicsaints.info/saints-who-were-priors/ . Names follow the source index.",
  "answers": [
    {
      "answer": "Benedict of Nursia",
      "tier": 1
    },
    {
      "answer": "Dominic",
      "tier": 1
    },
    {
      "answer": "Bernard of Clairvaux",
      "tier": 1
    },
    {
      "answer": "John Soreth",
      "tier": 1
    },
    {
      "answer": "Humbert of Romans",
      "tier": 1
    },
    {
      "answer": "James of Voragine",
      "tier": 2
    },
    {
      "answer": "John van Ruysbroeck",
      "tier": 2
    },
    {
      "answer": "Ivo of Chartres",
      "tier": 2
    },
    {
      "answer": "Augustine Novello",
      "tier": 2
    },
    {
      "answer": "Giovanni Dominici",
      "tier": 2
    },
    {
      "answer": "Nicholas Albergati",
      "tier": 2
    },
    {
      "answer": "Raymond of Capua",
      "tier": 2
    },
    {
      "answer": "Adalbert Radiouski",
      "tier": 3
    },
    {
      "answer": "Adelelmo of Engelberg",
      "tier": 3
    },
    {
      "answer": "Airaldus of Maurienne",
      "tier": 3
    },
    {
      "answer": "Alacrinus of Casamari",
      "tier": 3
    },
    {
      "answer": "Albert of Haigerloch",
      "tier": 3
    },
    {
      "answer": "Albertinus of Fonte Avellana",
      "tier": 3
    },
    {
      "answer": "Alfons Maria Mazurek",
      "tier": 3
    },
    {
      "answer": "Alfredo Ildefonso Schuster",
      "tier": 3
    },
    {
      "answer": "Aloysius Luis Rabata",
      "tier": 3
    },
    {
      "answer": "Andrew Abellon",
      "tier": 3
    },
    {
      "answer": "Ángel Marina Álvarez",
      "tier": 3
    },
    {
      "answer": "Angelo of Massaccio",
      "tier": 3
    },
    {
      "answer": "Angelus Agostini Mazzinghi",
      "tier": 4
    },
    {
      "answer": "Anselmo Polanco",
      "tier": 4
    },
    {
      "answer": "Anthony of Ilbenstadt",
      "tier": 4
    },
    {
      "answer": "Antonio della Chiesa",
      "tier": 4
    },
    {
      "answer": "Antony of Pavoni",
      "tier": 4
    },
    {
      "answer": "Arnaldo of Liniberio",
      "tier": 4
    },
    {
      "answer": "Arnold Wala",
      "tier": 4
    },
    {
      "answer": "Augustine Fangi",
      "tier": 4
    },
    {
      "answer": "Bartolomeo di Cervere",
      "tier": 4
    },
    {
      "answer": "Berthold of Garsten",
      "tier": 4
    },
    {
      "answer": "Boniface of Canterbury",
      "tier": 4
    },
    {
      "answer": "Boniface of Valperga",
      "tier": 4
    },
    {
      "answer": "Boniface of Villers",
      "tier": 4
    },
    {
      "answer": "Brocard of Strasbourg",
      "tier": 4
    },
    {
      "answer": "Buenaventura García-Paredes Pallasá",
      "tier": 4
    },
    {
      "answer": "Charles of Sayn",
      "tier": 5
    },
    {
      "answer": "Christian de Chergé",
      "tier": 5
    },
    {
      "answer": "Christian Lemarchand",
      "tier": 5
    },
    {
      "answer": "Conrad of Urach",
      "tier": 5
    },
    {
      "answer": "Constantine of Orval",
      "tier": 5
    },
    {
      "answer": "Constantius of Fabriano",
      "tier": 5
    },
    {
      "answer": "Cristiano of Perugia",
      "tier": 5
    },
    {
      "answer": "Damiano",
      "tier": 5
    },
    {
      "answer": "Daniel of Schönau",
      "tier": 5
    },
    {
      "answer": "Eberhard of Schäftlarn",
      "tier": 5
    },
    {
      "answer": "Engelbert of Schäftlarn",
      "tier": 5
    },
    {
      "answer": "Francis Ronci",
      "tier": 5
    },
    {
      "answer": "Frederick of Saint-Vanne",
      "tier": 5
    },
    {
      "answer": "Fulk of Montdidier",
      "tier": 5
    },
    {
      "answer": "Gabriel of Ferrara",
      "tier": 5
    },
    {
      "answer": "Geoffrey of Peronne",
      "tier": 6
    },
    {
      "answer": "Geremia Lambertenghi",
      "tier": 6
    },
    {
      "answer": "Gerlac of Obermarchtal",
      "tier": 6
    },
    {
      "answer": "Germain of Talloires",
      "tier": 6
    },
    {
      "answer": "Gervais-Protais Brunel",
      "tier": 6
    },
    {
      "answer": "Giacomo Bianconi of Mevania",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Benedict of Nursia",
      "accepted": true
    },
    {
      "guess": "Dominic",
      "accepted": true
    },
    {
      "guess": "Bernard of Clairvaux",
      "accepted": true
    },
    {
      "guess": "John Soreth",
      "accepted": true
    },
    {
      "guess": "Humbert of Romans",
      "accepted": true
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A military leader, not a prior."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A parish priest, not a prior."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A nun, not a prior."
    },
    {
      "guess": "Thomas More",
      "accepted": false,
      "reason": "A lay statesman, not a prior."
    },
    {
      "guess": "Francis Xavier",
      "accepted": false,
      "reason": "A missionary priest, not a prior."
    }
  ]
},
{
  "id": "longtail-psalms",
  "theme": "scripture",
  "prompt": "Name a psalm.",
  "context": "The Psalter contains 150 psalms. Some are known by memorable lines or themes; others are easier to recall by number. This open answer key samples 60 distinct psalms.",
  "basis": "The 150 psalms in the Catholic Book of Psalms; numbering follows the Hebrew/modern English numbering used in most contemporary Catholic Bible editions. Psalm numbers are the identifying titles.",
  "answers": [
    {
      "answer": "Psalm 23",
      "tier": 1
    },
    {
      "answer": "Psalm 51",
      "tier": 1
    },
    {
      "answer": "Psalm 91",
      "tier": 1
    },
    {
      "answer": "Psalm 121",
      "tier": 1
    },
    {
      "answer": "Psalm 139",
      "tier": 1
    },
    {
      "answer": "Psalm 1",
      "tier": 2
    },
    {
      "answer": "Psalm 22",
      "tier": 2
    },
    {
      "answer": "Psalm 27",
      "tier": 2
    },
    {
      "answer": "Psalm 46",
      "tier": 2
    },
    {
      "answer": "Psalm 100",
      "tier": 2
    },
    {
      "answer": "Psalm 117",
      "tier": 2
    },
    {
      "answer": "Psalm 150",
      "tier": 2
    },
    {
      "answer": "Psalm 2",
      "tier": 3
    },
    {
      "answer": "Psalm 8",
      "tier": 3
    },
    {
      "answer": "Psalm 16",
      "tier": 3
    },
    {
      "answer": "Psalm 19",
      "tier": 3
    },
    {
      "answer": "Psalm 24",
      "tier": 3
    },
    {
      "answer": "Psalm 32",
      "tier": 3
    },
    {
      "answer": "Psalm 34",
      "tier": 3
    },
    {
      "answer": "Psalm 37",
      "tier": 3
    },
    {
      "answer": "Psalm 42",
      "tier": 3
    },
    {
      "answer": "Psalm 63",
      "tier": 3
    },
    {
      "answer": "Psalm 84",
      "tier": 3
    },
    {
      "answer": "Psalm 103",
      "tier": 3
    },
    {
      "answer": "Psalm 3",
      "tier": 4
    },
    {
      "answer": "Psalm 4",
      "tier": 4
    },
    {
      "answer": "Psalm 6",
      "tier": 4
    },
    {
      "answer": "Psalm 12",
      "tier": 4
    },
    {
      "answer": "Psalm 13",
      "tier": 4
    },
    {
      "answer": "Psalm 15",
      "tier": 4
    },
    {
      "answer": "Psalm 20",
      "tier": 4
    },
    {
      "answer": "Psalm 25",
      "tier": 4
    },
    {
      "answer": "Psalm 29",
      "tier": 4
    },
    {
      "answer": "Psalm 30",
      "tier": 4
    },
    {
      "answer": "Psalm 40",
      "tier": 4
    },
    {
      "answer": "Psalm 43",
      "tier": 4
    },
    {
      "answer": "Psalm 47",
      "tier": 4
    },
    {
      "answer": "Psalm 48",
      "tier": 4
    },
    {
      "answer": "Psalm 65",
      "tier": 4
    },
    {
      "answer": "Psalm 67",
      "tier": 5
    },
    {
      "answer": "Psalm 68",
      "tier": 5
    },
    {
      "answer": "Psalm 72",
      "tier": 5
    },
    {
      "answer": "Psalm 74",
      "tier": 5
    },
    {
      "answer": "Psalm 80",
      "tier": 5
    },
    {
      "answer": "Psalm 85",
      "tier": 5
    },
    {
      "answer": "Psalm 89",
      "tier": 5
    },
    {
      "answer": "Psalm 92",
      "tier": 5
    },
    {
      "answer": "Psalm 96",
      "tier": 5
    },
    {
      "answer": "Psalm 98",
      "tier": 5
    },
    {
      "answer": "Psalm 104",
      "tier": 5
    },
    {
      "answer": "Psalm 110",
      "tier": 5
    },
    {
      "answer": "Psalm 116",
      "tier": 5
    },
    {
      "answer": "Psalm 118",
      "tier": 5
    },
    {
      "answer": "Psalm 130",
      "tier": 5
    },
    {
      "answer": "Psalm 136",
      "tier": 6
    },
    {
      "answer": "Psalm 145",
      "tier": 6
    },
    {
      "answer": "Psalm 5",
      "tier": 6
    },
    {
      "answer": "Psalm 9",
      "tier": 6
    },
    {
      "answer": "Psalm 14",
      "tier": 6
    },
    {
      "answer": "Psalm 18",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Psalm 23",
      "accepted": true
    },
    {
      "guess": "Psalm 51",
      "accepted": true
    },
    {
      "guess": "Psalm 91",
      "accepted": true
    },
    {
      "guess": "Psalm 121",
      "accepted": true
    },
    {
      "guess": "Psalm 139",
      "accepted": true
    },
    {
      "guess": "Psalm 119",
      "accepted": false,
      "reason": "A valid psalm, but it is not in this 60-answer sample."
    },
    {
      "guess": "Psalm 150",
      "accepted": true
    },
    {
      "guess": "Psalm 1",
      "accepted": true
    },
    {
      "guess": "Psalm 42",
      "accepted": true
    },
    {
      "guess": "Psalm 88",
      "accepted": false,
      "reason": "A valid psalm, but not included in this answer key."
    }
  ]
},
{
  "id": "longtail-old-testament-places",
  "theme": "places",
  "prompt": "Name a place in the Old Testament.",
  "context": "The Old Testament names cities, towns, wildernesses, valleys, fortresses and places of exile. This open list is not complete; some places also appear later in Scripture.",
  "basis": "Hand-curated from the Catholic Old Testament, cross-checked against Bible book texts and biblical atlases. Answer key uses 60 distinct named places.",
  "answers": [
    {
      "answer": "Jerusalem",
      "tier": 1
    },
    {
      "answer": "Bethlehem",
      "tier": 1
    },
    {
      "answer": "Jericho",
      "tier": 1
    },
    {
      "answer": "Hebron",
      "tier": 1
    },
    {
      "answer": "Mount Sinai",
      "tier": 1
    },
    {
      "answer": "Bethel",
      "tier": 2
    },
    {
      "answer": "Beersheba",
      "tier": 2
    },
    {
      "answer": "Shiloh",
      "tier": 2
    },
    {
      "answer": "Shechem",
      "tier": 2
    },
    {
      "answer": "Samaria",
      "tier": 2
    },
    {
      "answer": "Nineveh",
      "tier": 2
    },
    {
      "answer": "Susa",
      "tier": 2
    },
    {
      "answer": "Ur",
      "tier": 3
    },
    {
      "answer": "Haran",
      "tier": 3
    },
    {
      "answer": "Ai",
      "tier": 3
    },
    {
      "answer": "Gibeon",
      "tier": 3
    },
    {
      "answer": "Gilgal",
      "tier": 3
    },
    {
      "answer": "Mizpah",
      "tier": 3
    },
    {
      "answer": "Ramah",
      "tier": 3
    },
    {
      "answer": "Dan",
      "tier": 3
    },
    {
      "answer": "Hazor",
      "tier": 3
    },
    {
      "answer": "Megiddo",
      "tier": 3
    },
    {
      "answer": "Lachish",
      "tier": 3
    },
    {
      "answer": "En Gedi",
      "tier": 3
    },
    {
      "answer": "Hobah",
      "tier": 4
    },
    {
      "answer": "Dothan",
      "tier": 4
    },
    {
      "answer": "Succoth",
      "tier": 4
    },
    {
      "answer": "Penuel",
      "tier": 4
    },
    {
      "answer": "Mahanaim",
      "tier": 4
    },
    {
      "answer": "Jabesh-Gilead",
      "tier": 4
    },
    {
      "answer": "Tirzah",
      "tier": 4
    },
    {
      "answer": "Tappuah",
      "tier": 4
    },
    {
      "answer": "Azekah",
      "tier": 4
    },
    {
      "answer": "Adullam",
      "tier": 4
    },
    {
      "answer": "Engannim",
      "tier": 4
    },
    {
      "answer": "Shunem",
      "tier": 4
    },
    {
      "answer": "Zarephath",
      "tier": 4
    },
    {
      "answer": "Aphek",
      "tier": 4
    },
    {
      "answer": "Rimmon",
      "tier": 4
    },
    {
      "answer": "Kadesh-barnea",
      "tier": 5
    },
    {
      "answer": "Hormah",
      "tier": 5
    },
    {
      "answer": "Ezion-geber",
      "tier": 5
    },
    {
      "answer": "Ecbatana",
      "tier": 5
    },
    {
      "answer": "Shur",
      "tier": 5
    },
    {
      "answer": "Luz",
      "tier": 5
    },
    {
      "answer": "Ophrah",
      "tier": 5
    },
    {
      "answer": "Ophir",
      "tier": 5
    },
    {
      "answer": "Pithom",
      "tier": 5
    },
    {
      "answer": "Rameses",
      "tier": 5
    },
    {
      "answer": "Migdol",
      "tier": 5
    },
    {
      "answer": "Kiriath-jearim",
      "tier": 5
    },
    {
      "answer": "Anathoth",
      "tier": 5
    },
    {
      "answer": "Beth-horon",
      "tier": 5
    },
    {
      "answer": "Gath-hepher",
      "tier": 5
    },
    {
      "answer": "En-rogel",
      "tier": 6
    },
    {
      "answer": "Geba",
      "tier": 6
    },
    {
      "answer": "Ziklag",
      "tier": 6
    },
    {
      "answer": "Makkedah",
      "tier": 6
    },
    {
      "answer": "Goshen",
      "tier": 6
    },
    {
      "answer": "Etham",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Jerusalem",
      "accepted": true
    },
    {
      "guess": "Bethlehem",
      "accepted": true
    },
    {
      "guess": "Jericho",
      "accepted": true
    },
    {
      "guess": "Hebron",
      "accepted": true
    },
    {
      "guess": "Mount Sinai",
      "accepted": true
    },
    {
      "guess": "Capernaum",
      "accepted": false,
      "reason": "A New Testament Galilean town, not an Old Testament place."
    },
    {
      "guess": "Nazareth",
      "accepted": false,
      "reason": "A New Testament town, not an Old Testament place."
    },
    {
      "guess": "Nineveh",
      "accepted": true
    },
    {
      "guess": "Susa",
      "accepted": true
    },
    {
      "guess": "Golgotha",
      "accepted": false,
      "reason": "A New Testament place associated with the crucifixion."
    }
  ]
},
{
  "id": "longtail-monk-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who was a monk.",
  "context": "Monks have shaped Christian prayer, learning, missionary work and community life across the centuries. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Monks,” 2,273 profiles: https://catholicsaints.info/saints-who-were-monks/ . The answer bank samples names from the source index.",
  "answers": [
    {
      "answer": "Benedict of Nursia",
      "tier": 1
    },
    {
      "answer": "Francis of Assisi",
      "tier": 1
    },
    {
      "answer": "Anthony the Great",
      "tier": 1
    },
    {
      "answer": "Bernard of Clairvaux",
      "tier": 1
    },
    {
      "answer": "Thomas Merton",
      "tier": 1
    },
    {
      "answer": "Dominic",
      "tier": 2
    },
    {
      "answer": "Bruno of Cologne",
      "tier": 2
    },
    {
      "answer": "Romuald",
      "tier": 2
    },
    {
      "answer": "Bede the Venerable",
      "tier": 2
    },
    {
      "answer": "John of the Cross",
      "tier": 2
    },
    {
      "answer": "Peter Damian",
      "tier": 2
    },
    {
      "answer": "John Cassian",
      "tier": 2
    },
    {
      "answer": "Pachomius",
      "tier": 3
    },
    {
      "answer": "Macarius of Egypt",
      "tier": 3
    },
    {
      "answer": "Moses the Black",
      "tier": 3
    },
    {
      "answer": "Sabas",
      "tier": 3
    },
    {
      "answer": "Hilarion",
      "tier": 3
    },
    {
      "answer": "Euthymius the Great",
      "tier": 3
    },
    {
      "answer": "Theodosius the Cenobiarch",
      "tier": 3
    },
    {
      "answer": "John Climacus",
      "tier": 3
    },
    {
      "answer": "Nilus of Sinai",
      "tier": 3
    },
    {
      "answer": "Isaac of Nineveh",
      "tier": 3
    },
    {
      "answer": "Maximus the Confessor",
      "tier": 3
    },
    {
      "answer": "Symeon the New Theologian",
      "tier": 3
    },
    {
      "answer": "Acardo of Avranches",
      "tier": 4
    },
    {
      "answer": "Adelelmo of Engelberg",
      "tier": 4
    },
    {
      "answer": "Adalbert of Tegernsee",
      "tier": 4
    },
    {
      "answer": "Adam of San Sabine",
      "tier": 4
    },
    {
      "answer": "Agapios of Vatopedi",
      "tier": 4
    },
    {
      "answer": "Alan the Great of Lille",
      "tier": 4
    },
    {
      "answer": "Albert of Pontida",
      "tier": 4
    },
    {
      "answer": "Alexander of Cîteaux",
      "tier": 4
    },
    {
      "answer": "Almus of Balmerino",
      "tier": 4
    },
    {
      "answer": "Anselm of Anchin",
      "tier": 4
    },
    {
      "answer": "Anselm of Rot an der Rot",
      "tier": 4
    },
    {
      "answer": "Arnold of Gemblours",
      "tier": 4
    },
    {
      "answer": "Arnulf of Leuven",
      "tier": 4
    },
    {
      "answer": "Balsamus of Cava",
      "tier": 4
    },
    {
      "answer": "Bartolomeo of Simeri",
      "tier": 4
    },
    {
      "answer": "Alberic of Cîteaux",
      "tier": 5
    },
    {
      "answer": "Alfred of Hildesheim",
      "tier": 5
    },
    {
      "answer": "Amadeus of Lausanne",
      "tier": 5
    },
    {
      "answer": "Andrew of Crete",
      "tier": 5
    },
    {
      "answer": "Angelus Sinesius",
      "tier": 5
    },
    {
      "answer": "Benedict of Aniane",
      "tier": 5
    },
    {
      "answer": "Benigno of Vallumbrosa",
      "tier": 5
    },
    {
      "answer": "Benincasa of Cava",
      "tier": 5
    },
    {
      "answer": "Berengar de Alenys",
      "tier": 5
    },
    {
      "answer": "Berthold of Garsten",
      "tier": 5
    },
    {
      "answer": "Bruno of Querfurt",
      "tier": 5
    },
    {
      "answer": "Cadfael of England",
      "tier": 5
    },
    {
      "answer": "Conon of Naso",
      "tier": 5
    },
    {
      "answer": "Frowin of Engelberg",
      "tier": 5
    },
    {
      "answer": "Gerlac of Obermarchtal",
      "tier": 5
    },
    {
      "answer": "Alericus",
      "tier": 6
    },
    {
      "answer": "Alramo of Niederaltaich",
      "tier": 6
    },
    {
      "answer": "Athanasius of Jerusalem",
      "tier": 6
    },
    {
      "answer": "Bertold of Mount Carmel",
      "tier": 6
    },
    {
      "answer": "Bogumilus of Gniezno",
      "tier": 6
    },
    {
      "answer": "Christian of Landais",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Benedict of Nursia",
      "accepted": true
    },
    {
      "guess": "Francis of Assisi",
      "accepted": true
    },
    {
      "guess": "Anthony the Great",
      "accepted": true
    },
    {
      "guess": "Bernard of Clairvaux",
      "accepted": true
    },
    {
      "guess": "Thomas Merton",
      "accepted": true
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A laywoman and military leader, not a monk."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A diocesan priest, not a monk."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A nun, not a monk."
    },
    {
      "guess": "Thomas More",
      "accepted": false,
      "reason": "A lay statesman, not a monk."
    },
    {
      "guess": "Francis Xavier",
      "accepted": false,
      "reason": "A Jesuit missionary priest, not a monk."
    }
  ]
},
{
  "id": "longtail-lay-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who lived as a lay person.",
  "context": "Not every holy person was a priest or religious. The Church also recognizes married people, workers, students and other lay men and women. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Lifelong Lay People,” 1,957 profiles: https://catholicsaints.info/saints-who-were-lifelong-lay-people/ . The answer key samples people from the directory.",
  "answers": [
    {
      "answer": "Thomas More",
      "tier": 1
    },
    {
      "answer": "Joan of Arc",
      "tier": 1
    },
    {
      "answer": "Kateri Tekakwitha",
      "tier": 1
    },
    {
      "answer": "Pier Giorgio Frassati",
      "tier": 1
    },
    {
      "answer": "Carlo Acutis",
      "tier": 1
    },
    {
      "answer": "Gianna Beretta Molla",
      "tier": 2
    },
    {
      "answer": "Louis and Zélie Martin",
      "tier": 2
    },
    {
      "answer": "John Henry Newman",
      "tier": 2
    },
    {
      "answer": "Edith Stein",
      "tier": 2
    },
    {
      "answer": "Elizabeth Ann Seton",
      "tier": 2
    },
    {
      "answer": "Alberto Marvelli",
      "tier": 2
    },
    {
      "answer": "Chiara Badano",
      "tier": 2
    },
    {
      "answer": "Aldo Mei",
      "tier": 3
    },
    {
      "answer": "Aldo Puglisi",
      "tier": 3
    },
    {
      "answer": "Alexis Choemon",
      "tier": 3
    },
    {
      "answer": "Alexandria of Nagasaki",
      "tier": 3
    },
    {
      "answer": "Alphonse Mazurek",
      "tier": 3
    },
    {
      "answer": "Anacleto González Flores",
      "tier": 3
    },
    {
      "answer": "Andreas Gim Gwang-Ok",
      "tier": 3
    },
    {
      "answer": "Andrew Sushinda",
      "tier": 3
    },
    {
      "answer": "Angela Salawa",
      "tier": 3
    },
    {
      "answer": "Anna Kolesárová",
      "tier": 3
    },
    {
      "answer": "Anna of Hokusanbara",
      "tier": 3
    },
    {
      "answer": "Antoni Julian Nowowiejski",
      "tier": 3
    },
    {
      "answer": "Adalbert of Ostrevant",
      "tier": 4
    },
    {
      "answer": "Adrian Fortescue",
      "tier": 4
    },
    {
      "answer": "Agata Phutta Bi",
      "tier": 4
    },
    {
      "answer": "Agatha Han Sin-ae",
      "tier": 4
    },
    {
      "answer": "Agatha Yun Jeom-Hye",
      "tier": 4
    },
    {
      "answer": "Agnes Takeda",
      "tier": 4
    },
    {
      "answer": "Agnes Takeya",
      "tier": 4
    },
    {
      "answer": "Agustín Alcalá y Henke",
      "tier": 4
    },
    {
      "answer": "Agustín Fernández Vázquez",
      "tier": 4
    },
    {
      "answer": "Albert of Bergamo",
      "tier": 4
    },
    {
      "answer": "Albertina Berkenbrock",
      "tier": 4
    },
    {
      "answer": "Alda of Siena",
      "tier": 4
    },
    {
      "answer": "Alessandra Sabattini",
      "tier": 4
    },
    {
      "answer": "Alexander Blake",
      "tier": 4
    },
    {
      "answer": "Alexandre Planas Saurí",
      "tier": 4
    },
    {
      "answer": "Alexis Sanbashi Saburo",
      "tier": 5
    },
    {
      "answer": "Alexius Nakamura",
      "tier": 5
    },
    {
      "answer": "Alexius Sato Seisuke",
      "tier": 5
    },
    {
      "answer": "Alexius Sugi Shohachi",
      "tier": 5
    },
    {
      "answer": "Altrude of Rome",
      "tier": 5
    },
    {
      "answer": "Álvaro Santos Cejudo Moreno Chocano",
      "tier": 5
    },
    {
      "answer": "Amadeus of Savoy",
      "tier": 5
    },
    {
      "answer": "Amalia Abad Casasempere de Maestre",
      "tier": 5
    },
    {
      "answer": "Ana María Aranda Riera",
      "tier": 5
    },
    {
      "answer": "Andreas Murayama Tokuan",
      "tier": 5
    },
    {
      "answer": "Andreas Yamamoto Shichiemon",
      "tier": 5
    },
    {
      "answer": "Andrés Casinello Barroeta",
      "tier": 5
    },
    {
      "answer": "Andrés Rueda Rojas",
      "tier": 5
    },
    {
      "answer": "Andrew the Catechist",
      "tier": 5
    },
    {
      "answer": "Adriana Morales Solís",
      "tier": 5
    },
    {
      "answer": "Angelica of Milazzo",
      "tier": 6
    },
    {
      "answer": "Angelo da Pesche d’Isernia",
      "tier": 6
    },
    {
      "answer": "Anicet Hryciuk",
      "tier": 6
    },
    {
      "answer": "Anna Kajiya",
      "tier": 6
    },
    {
      "answer": "Anna Hamard",
      "tier": 6
    },
    {
      "answer": "Agatha of Kyoto",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Thomas More",
      "accepted": true
    },
    {
      "guess": "Joan of Arc",
      "accepted": true
    },
    {
      "guess": "Kateri Tekakwitha",
      "accepted": true
    },
    {
      "guess": "Pier Giorgio Frassati",
      "accepted": true
    },
    {
      "guess": "Carlo Acutis",
      "accepted": true
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A diocesan priest, not a lifelong lay person."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A Carmelite nun, not a lifelong lay person."
    },
    {
      "guess": "Francis Xavier",
      "accepted": false,
      "reason": "A Jesuit priest, not a lifelong lay person."
    },
    {
      "guess": "Benedict of Nursia",
      "accepted": false,
      "reason": "A monk, not a lifelong lay person."
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A Dominican priest and friar, not a lifelong lay person."
    }
  ]
},
{
  "id": "longtail-visionary-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who had a vision.",
  "context": "Many Catholics are known for reported visions of Christ, Mary, angels or the saints. This open list is not complete, and the Church’s judgment on individual claims varies.",
  "basis": "CatholicSaints.info, “Saints who were Visionaries,” 259 profiles: https://catholicsaints.info/saints-who-were-visionaries/ . Inclusion in the index is not a claim that every vision has ecclesiastical approval.",
  "answers": [
    {
      "answer": "Bernadette Soubirous",
      "tier": 1
    },
    {
      "answer": "Catherine of Siena",
      "tier": 1
    },
    {
      "answer": "Teresa of Ávila",
      "tier": 1
    },
    {
      "answer": "Faustina Kowalska",
      "tier": 1
    },
    {
      "answer": "John Bosco",
      "tier": 1
    },
    {
      "answer": "Anne Catherine Emmerich",
      "tier": 2
    },
    {
      "answer": "Anne Marie Taigi",
      "tier": 2
    },
    {
      "answer": "Alexandrina Maria da Costa",
      "tier": 2
    },
    {
      "answer": "Hildegard of Bingen",
      "tier": 2
    },
    {
      "answer": "Julian of Norwich",
      "tier": 2
    },
    {
      "answer": "Bridget of Sweden",
      "tier": 2
    },
    {
      "answer": "Catherine Labouré",
      "tier": 2
    },
    {
      "answer": "Alda of Siena",
      "tier": 3
    },
    {
      "answer": "Angela of Foligno",
      "tier": 3
    },
    {
      "answer": "Christina of Stommeln",
      "tier": 3
    },
    {
      "answer": "Christina Ebner",
      "tier": 3
    },
    {
      "answer": "Dorothy of Montau",
      "tier": 3
    },
    {
      "answer": "Mary of Agreda",
      "tier": 3
    },
    {
      "answer": "Mary of the Divine Heart",
      "tier": 3
    },
    {
      "answer": "Maria Valtorta",
      "tier": 3
    },
    {
      "answer": "Edvige Carboni",
      "tier": 3
    },
    {
      "answer": "Alexandrina of Balazar",
      "tier": 3
    },
    {
      "answer": "Gemma Galgani",
      "tier": 3
    },
    {
      "answer": "Padre Pio",
      "tier": 3
    },
    {
      "answer": "Abundus of Villers",
      "tier": 4
    },
    {
      "answer": "Adam of Saxony",
      "tier": 4
    },
    {
      "answer": "Agnes of Chatillon",
      "tier": 4
    },
    {
      "answer": "Agnès of Jesus",
      "tier": 4
    },
    {
      "answer": "Agostina of the Assumption",
      "tier": 4
    },
    {
      "answer": "Ambrose Sansedoni of Siena",
      "tier": 4
    },
    {
      "answer": "Andrea Caccioli",
      "tier": 4
    },
    {
      "answer": "Andrew Dotti",
      "tier": 4
    },
    {
      "answer": "Andrew of Segni",
      "tier": 4
    },
    {
      "answer": "Angelina of Spoleto",
      "tier": 4
    },
    {
      "answer": "Anne Mary Javouhey",
      "tier": 4
    },
    {
      "answer": "Archangela Girlani",
      "tier": 4
    },
    {
      "answer": "Bartholomew Buonpedoni",
      "tier": 4
    },
    {
      "answer": "Bartolomeo Pucci-Franceschi",
      "tier": 4
    },
    {
      "answer": "Bentivoglio de Bonis",
      "tier": 4
    },
    {
      "answer": "Benvenuta Bojani",
      "tier": 5
    },
    {
      "answer": "Benvenuto Mareni",
      "tier": 5
    },
    {
      "answer": "Bertold of Mount Carmel",
      "tier": 5
    },
    {
      "answer": "Candida of Como",
      "tier": 5
    },
    {
      "answer": "Catherine of Racconigi",
      "tier": 5
    },
    {
      "answer": "Christina Ciccarelli",
      "tier": 5
    },
    {
      "answer": "Christina of Retters",
      "tier": 5
    },
    {
      "answer": "Cisinandus of Tarouca",
      "tier": 5
    },
    {
      "answer": "Clara Isabella Fornari",
      "tier": 5
    },
    {
      "answer": "Columba of Rieti",
      "tier": 5
    },
    {
      "answer": "Conrad of Heisterbach",
      "tier": 5
    },
    {
      "answer": "Drogo of Baume",
      "tier": 5
    },
    {
      "answer": "Egbert of Villers",
      "tier": 5
    },
    {
      "answer": "Elia of San Clemente",
      "tier": 5
    },
    {
      "answer": "Élisabeth Eppinger",
      "tier": 5
    },
    {
      "answer": "Elizabeth Achler",
      "tier": 6
    },
    {
      "answer": "Erminia of Rheims",
      "tier": 6
    },
    {
      "answer": "Esperanza de Jesus",
      "tier": 6
    },
    {
      "answer": "Francinaina Cirer-Carbonell",
      "tier": 6
    },
    {
      "answer": "Francis Bruno",
      "tier": 6
    },
    {
      "answer": "Franco of Siena",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Bernadette Soubirous",
      "accepted": true
    },
    {
      "guess": "Catherine of Siena",
      "accepted": true
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": true
    },
    {
      "guess": "Faustina Kowalska",
      "accepted": true
    },
    {
      "guess": "John Bosco",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A theologian, but not one of the visionaries in this answer key."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "Her voices and visions are well-known, but she is not included in this source sample."
    },
    {
      "guess": "Francis Xavier",
      "accepted": false,
      "reason": "A missionary, not listed in this visionary index."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A priest, not listed in this visionary sample."
    },
    {
      "guess": "Carlo Acutis",
      "accepted": false,
      "reason": "A modern lay saint, not listed in this visionary index."
    }
  ]
},
{
  "id": "longtail-musician-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who was a musician.",
  "context": "Catholic holy people have composed, performed or preserved sacred music, from chant and hymnody to modern music ministry. This open list is drawn from a source index of 64 profiles.",
  "basis": "CatholicSaints.info, “Saints who were Musicians,” 64 profiles: https://catholicsaints.info/saints-who-were-musicians/ . All answer names are drawn from the source index.",
  "answers": [
    {
      "answer": "King David",
      "tier": 1
    },
    {
      "answer": "Pope Gregory the Great",
      "tier": 1
    },
    {
      "answer": "Hildegard of Bingen",
      "tier": 1
    },
    {
      "answer": "Bede the Venerable",
      "tier": 1
    },
    {
      "answer": "Gregory of Narek",
      "tier": 1
    },
    {
      "answer": "Alphonsus Maria de Liguori",
      "tier": 2
    },
    {
      "answer": "Ambrose of Milan",
      "tier": 2
    },
    {
      "answer": "Columba of Iona",
      "tier": 2
    },
    {
      "answer": "Dunstan of Canterbury",
      "tier": 2
    },
    {
      "answer": "Odo of Cluny",
      "tier": 2
    },
    {
      "answer": "Raymond Lull",
      "tier": 2
    },
    {
      "answer": "Tutilo of Saint Gall",
      "tier": 2
    },
    {
      "answer": "Aldhelm of Sherborne",
      "tier": 3
    },
    {
      "answer": "Benedict of Nursia",
      "tier": 3
    },
    {
      "answer": "Ephrem the Syrian",
      "tier": 3
    },
    {
      "answer": "Francis of Assisi",
      "tier": 3
    },
    {
      "answer": "John of the Cross",
      "tier": 3
    },
    {
      "answer": "Leo II",
      "tier": 3
    },
    {
      "answer": "Caradoc of Wales",
      "tier": 3
    },
    {
      "answer": "Godric of Finchale",
      "tier": 3
    },
    {
      "answer": "Hervé",
      "tier": 3
    },
    {
      "answer": "Benignus of Armagh",
      "tier": 3
    },
    {
      "answer": "Fulk of Toulouse",
      "tier": 3
    },
    {
      "answer": "Peter Casani",
      "tier": 3
    },
    {
      "answer": "Anne Catherine Emmerich",
      "tier": 4
    },
    {
      "answer": "Carlos Manuel Cecilio Rodriguez Santiago",
      "tier": 4
    },
    {
      "answer": "Edward Kazmierski",
      "tier": 4
    },
    {
      "answer": "Félix Echevarría Gorostiaga",
      "tier": 4
    },
    {
      "answer": "Francisco Bandrés Sánchez",
      "tier": 4
    },
    {
      "answer": "Fructuoso Pérez Márquez",
      "tier": 4
    },
    {
      "answer": "Giovanni Giovenale Ancina",
      "tier": 4
    },
    {
      "answer": "Giulio of Montevergine",
      "tier": 4
    },
    {
      "answer": "Hyacinth-Marie Cormier",
      "tier": 4
    },
    {
      "answer": "Jarogniew Wojciechowski",
      "tier": 4
    },
    {
      "answer": "Jose Tàpies y Sirvant",
      "tier": 4
    },
    {
      "answer": "Juan Otazua y Madariaga",
      "tier": 4
    },
    {
      "answer": "Lucien Botovasoa",
      "tier": 4
    },
    {
      "answer": "Manuel Fernández-Herba Pereira",
      "tier": 4
    },
    {
      "answer": "Maria Dina Bélanger",
      "tier": 4
    },
    {
      "answer": "María Romero Meneses",
      "tier": 5
    },
    {
      "answer": "María Severina Díaz-Pardo Gauna",
      "tier": 5
    },
    {
      "answer": "Marie-Elisabeth Pélissier",
      "tier": 5
    },
    {
      "answer": "Noël-Hilaire Le Conte",
      "tier": 5
    },
    {
      "answer": "Pacificus",
      "tier": 5
    },
    {
      "answer": "Rafał Chyliński",
      "tier": 5
    },
    {
      "answer": "Ranieri Scacceri",
      "tier": 5
    },
    {
      "answer": "Robert Montserrat Beliart",
      "tier": 5
    },
    {
      "answer": "Rosario Ciércoles Gascón",
      "tier": 5
    },
    {
      "answer": "Victor Chumillas-Fernández",
      "tier": 5
    },
    {
      "answer": "Arnold of Arnoldsweiler",
      "tier": 5
    },
    {
      "answer": "Benildus",
      "tier": 5
    },
    {
      "answer": "Benno of Meissen",
      "tier": 5
    },
    {
      "answer": "Colman of Cloyne",
      "tier": 5
    },
    {
      "answer": "Eugenius of Toledo",
      "tier": 5
    },
    {
      "answer": "Maria Crucified Satellico",
      "tier": 6
    },
    {
      "answer": "Maria da Conceição Santos",
      "tier": 6
    },
    {
      "answer": "Maria Giuseppina Benvenuti",
      "tier": 6
    },
    {
      "answer": "Maria Orsola Bussone",
      "tier": 6
    },
    {
      "answer": "Philip Evans",
      "tier": 6
    },
    {
      "answer": "Carlo Crespi Croci",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "King David",
      "accepted": true
    },
    {
      "guess": "Pope Gregory the Great",
      "accepted": true
    },
    {
      "guess": "Hildegard of Bingen",
      "accepted": true
    },
    {
      "guess": "Bede the Venerable",
      "accepted": true
    },
    {
      "guess": "Gregory of Narek",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A theologian and hymn writer, but not included in this musician index."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A military leader, not a musician in the source index."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A parish priest, not listed as a musician."
    },
    {
      "guess": "Francis Xavier",
      "accepted": false,
      "reason": "A missionary priest, not listed as a musician."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A Carmelite nun and writer, not listed as a musician."
    }
  ]
},
{
  "id": "longtail-child-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who died as a child.",
  "context": "The Church remembers children and teenagers who died as martyrs, witnesses of faith or in lives of exceptional holiness. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who Died as Children,” 176 profiles: https://catholicsaints.info/saints-who-died-as-children/ . The answer key samples 60 names from the directory.",
  "answers": [
    {
      "answer": "Carlo Acutis",
      "tier": 1
    },
    {
      "answer": "Dominic Savio",
      "tier": 1
    },
    {
      "answer": "Imelda Lambertini",
      "tier": 1
    },
    {
      "answer": "Laura Vicuña",
      "tier": 1
    },
    {
      "answer": "Maria Goretti",
      "tier": 1
    },
    {
      "answer": "Holy Innocents",
      "tier": 2
    },
    {
      "answer": "Agnes of Rome",
      "tier": 2
    },
    {
      "answer": "Panacea de’Muzzi",
      "tier": 2
    },
    {
      "answer": "Rolando Rivi",
      "tier": 2
    },
    {
      "answer": "Karoliny Kózkówny",
      "tier": 2
    },
    {
      "answer": "Benigna Cardoso da Silva",
      "tier": 2
    },
    {
      "answer": "Antonia Mesina",
      "tier": 2
    },
    {
      "answer": "Adilio Daronch",
      "tier": 3
    },
    {
      "answer": "Albertina Berkenbrock",
      "tier": 3
    },
    {
      "answer": "Andreas Yakichi",
      "tier": 3
    },
    {
      "answer": "Antoni Ulma",
      "tier": 3
    },
    {
      "answer": "Antonio Gaitán Perabad",
      "tier": 3
    },
    {
      "answer": "Benedictus of Kyoto",
      "tier": 3
    },
    {
      "answer": "Daudi Okelo",
      "tier": 3
    },
    {
      "answer": "Jildo Irwa",
      "tier": 3
    },
    {
      "answer": "Juan Barrera Méndez",
      "tier": 3
    },
    {
      "answer": "Lucia of Kyoto",
      "tier": 3
    },
    {
      "answer": "Anna Wang",
      "tier": 3
    },
    {
      "answer": "Agatha Yi",
      "tier": 3
    },
    {
      "answer": "Antonius Banzai Orusu",
      "tier": 4
    },
    {
      "answer": "Antonius Ono",
      "tier": 4
    },
    {
      "answer": "Barbara Ulma",
      "tier": 4
    },
    {
      "answer": "Bibiana Khamphai",
      "tier": 4
    },
    {
      "answer": "Catharina Hashimoto",
      "tier": 4
    },
    {
      "answer": "Cecilia Butsi",
      "tier": 4
    },
    {
      "answer": "Didacus Hayashida",
      "tier": 4
    },
    {
      "answer": "Dominic Nihachi",
      "tier": 4
    },
    {
      "answer": "Dominic Tomaki",
      "tier": 4
    },
    {
      "answer": "Elisabeth Sato",
      "tier": 4
    },
    {
      "answer": "Franciscus Hashimoto",
      "tier": 4
    },
    {
      "answer": "Franciscus Nihachi",
      "tier": 4
    },
    {
      "answer": "Franciscus Takeya",
      "tier": 4
    },
    {
      "answer": "Franciscus Yakichi",
      "tier": 4
    },
    {
      "answer": "Franciszek Ulma",
      "tier": 4
    },
    {
      "answer": "Iacobus Bunzo Gengoro",
      "tier": 5
    },
    {
      "answer": "Iacobus of Hiji",
      "tier": 5
    },
    {
      "answer": "Ignatius Jorge-Fernandes",
      "tier": 5
    },
    {
      "answer": "Ignatius Uchibori",
      "tier": 5
    },
    {
      "answer": "Ioannes Hamanomachi",
      "tier": 5
    },
    {
      "answer": "Ioannes Nishi Mataishi",
      "tier": 5
    },
    {
      "answer": "Iusta Amagasu",
      "tier": 5
    },
    {
      "answer": "Laurentius Yamada",
      "tier": 5
    },
    {
      "answer": "Lucia Kurogane",
      "tier": 5
    },
    {
      "answer": "Ludovica Hashimoto",
      "tier": 5
    },
    {
      "answer": "Ludovicus Minami",
      "tier": 5
    },
    {
      "answer": "Ludovicus Onizuka",
      "tier": 5
    },
    {
      "answer": "Maria Phon",
      "tier": 5
    },
    {
      "answer": "Maria Ulma",
      "tier": 5
    },
    {
      "answer": "Martha of Hokusanbara",
      "tier": 5
    },
    {
      "answer": "Martha of Kyoto",
      "tier": 6
    },
    {
      "answer": "Michaël Tanda",
      "tier": 6
    },
    {
      "answer": "Michaël Tomachi",
      "tier": 6
    },
    {
      "answer": "Monica of Kyoto",
      "tier": 6
    },
    {
      "answer": "Paulus of Hokusanbara",
      "tier": 6
    },
    {
      "answer": "Paulus Tomachi",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Carlo Acutis",
      "accepted": true
    },
    {
      "guess": "Dominic Savio",
      "accepted": true
    },
    {
      "guess": "Imelda Lambertini",
      "accepted": true
    },
    {
      "guess": "Laura Vicuña",
      "accepted": true
    },
    {
      "guess": "Maria Goretti",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "He died as an adult, not as a child."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "She died as a young adult, not a child."
    },
    {
      "guess": "Bernadette Soubirous",
      "accepted": false,
      "reason": "She died as an adult, not as a child."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "He died as an adult, not as a child."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "She died as an adult, not as a child."
    }
  ]
},
{
  "id": "longtail-father-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who was a father.",
  "context": "Many holy men were husbands and fathers before or during lives of service, and several are remembered for the way they raised their families. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Fathers,” 263 profiles: https://catholicsaints.info/saints-who-were-fathers/ . Names in this key are selected from the directory; biblical patriarchs in the same index are included.",
  "answers": [
    {
      "answer": "Joseph, husband of Mary",
      "tier": 1
    },
    {
      "answer": "Abraham",
      "tier": 1
    },
    {
      "answer": "Adam",
      "tier": 1
    },
    {
      "answer": "Joachim",
      "tier": 1
    },
    {
      "answer": "Louis Martin",
      "tier": 1
    },
    {
      "answer": "Thomas More",
      "tier": 2
    },
    {
      "answer": "Louis IX of France",
      "tier": 2
    },
    {
      "answer": "Zélie and Louis Martin",
      "tier": 2
    },
    {
      "answer": "Edmund Rice",
      "tier": 2
    },
    {
      "answer": "Franz Jägerstätter",
      "tier": 2
    },
    {
      "answer": "Ceferino Jiménez Malla",
      "tier": 2
    },
    {
      "answer": "Anacleto González Flores",
      "tier": 2
    },
    {
      "answer": "Charlemagne",
      "tier": 3
    },
    {
      "answer": "Charles of Austria",
      "tier": 3
    },
    {
      "answer": "Erik IV of Denmark",
      "tier": 3
    },
    {
      "answer": "Giuseppe Antonio Tovini",
      "tier": 3
    },
    {
      "answer": "John of God",
      "tier": 3
    },
    {
      "answer": "Aquila",
      "tier": 3
    },
    {
      "answer": "Philemon",
      "tier": 3
    },
    {
      "answer": "Zechariah",
      "tier": 3
    },
    {
      "answer": "John Amias",
      "tier": 3
    },
    {
      "answer": "John Bretton",
      "tier": 3
    },
    {
      "answer": "John Colombini",
      "tier": 3
    },
    {
      "answer": "John de Montmirail",
      "tier": 3
    },
    {
      "answer": "Adalbert of Ostrevant",
      "tier": 4
    },
    {
      "answer": "Adrian Fortescue",
      "tier": 4
    },
    {
      "answer": "Alexius Sato Seisuke",
      "tier": 4
    },
    {
      "answer": "Amadeus of Clermont",
      "tier": 4
    },
    {
      "answer": "Antero Mateo García",
      "tier": 4
    },
    {
      "answer": "Antoni Tort Rexachs",
      "tier": 4
    },
    {
      "answer": "Archan of Etting",
      "tier": 4
    },
    {
      "answer": "Arturo Ros Montalt",
      "tier": 4
    },
    {
      "answer": "Augustinus Jeong Yak-jong",
      "tier": 4
    },
    {
      "answer": "Balthasar Kagayama Hanzaemon",
      "tier": 4
    },
    {
      "answer": "Bartlomiej Osypiuk",
      "tier": 4
    },
    {
      "answer": "Bartolomeo Pucci-Franceschi",
      "tier": 4
    },
    {
      "answer": "Bernard of Vienne",
      "tier": 4
    },
    {
      "answer": "Carlos Díaz Gandía",
      "tier": 4
    },
    {
      "answer": "Cosmas of Kyoto",
      "tier": 4
    },
    {
      "answer": "Cosmas Takeya Sozaburo",
      "tier": 5
    },
    {
      "answer": "Daniel of Ungrispach",
      "tier": 5
    },
    {
      "answer": "Dionisius Saeki Zenka",
      "tier": 5
    },
    {
      "answer": "Emilian Kovch",
      "tier": 5
    },
    {
      "answer": "Filip Geryluk",
      "tier": 5
    },
    {
      "answer": "Filip Siphong Onphithakt",
      "tier": 5
    },
    {
      "answer": "Francis Taylor",
      "tier": 5
    },
    {
      "answer": "Franciszek Stryjas",
      "tier": 5
    },
    {
      "answer": "Gaspar Nishi Genka",
      "tier": 5
    },
    {
      "answer": "Gerricus of Gerresheim",
      "tier": 5
    },
    {
      "answer": "Gilbert of Neufontaines",
      "tier": 5
    },
    {
      "answer": "Gregorio Díez Blanco",
      "tier": 5
    },
    {
      "answer": "Henry of Treviso",
      "tier": 5
    },
    {
      "answer": "Hroznata of Bohemia",
      "tier": 5
    },
    {
      "answer": "Ignacy Franczuk",
      "tier": 5
    },
    {
      "answer": "Ioannes Ariie Kiemon",
      "tier": 6
    },
    {
      "answer": "Ioannes Hashimoto Tahyoe",
      "tier": 6
    },
    {
      "answer": "Ioannes Hattori Jingoro",
      "tier": 6
    },
    {
      "answer": "Ioannes Kyusaku",
      "tier": 6
    },
    {
      "answer": "Ioannes Onizuka Naizen",
      "tier": 6
    },
    {
      "answer": "Ioannes Tomachi",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Joseph, husband of Mary",
      "accepted": true
    },
    {
      "guess": "Abraham",
      "accepted": true
    },
    {
      "guess": "Louis Martin",
      "accepted": true
    },
    {
      "guess": "Thomas More",
      "accepted": true
    },
    {
      "guess": "Joachim",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A Dominican priest who did not marry or father children."
    },
    {
      "guess": "Francis Xavier",
      "accepted": false,
      "reason": "A Jesuit priest who did not marry or father children."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A Carmelite nun, not a father."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A laywoman who did not marry or have children."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A diocesan priest who did not marry or father children."
    }
  ]
},
{
  "id": "longtail-mother-saints",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who was a mother.",
  "context": "Many holy women were mothers before or during lives of prayer, charity and service. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Mothers,” 255 profiles: https://catholicsaints.info/saints-who-were-mothers/ . Names in this key are selected from the directory.",
  "answers": [
    {
      "answer": "Monica",
      "tier": 1
    },
    {
      "answer": "Anne, mother of Mary",
      "tier": 1
    },
    {
      "answer": "Mary, mother of Jesus",
      "tier": 1
    },
    {
      "answer": "Elizabeth",
      "tier": 1
    },
    {
      "answer": "Zélie Martin",
      "tier": 1
    },
    {
      "answer": "Gianna Beretta Molla",
      "tier": 2
    },
    {
      "answer": "Concepcion Cabrera de Armida",
      "tier": 2
    },
    {
      "answer": "Anne Marie Taigi",
      "tier": 2
    },
    {
      "answer": "Rita of Cascia",
      "tier": 2
    },
    {
      "answer": "Elizabeth of Hungary",
      "tier": 2
    },
    {
      "answer": "Frances of Rome",
      "tier": 2
    },
    {
      "answer": "Jane Frances de Chantal",
      "tier": 2
    },
    {
      "answer": "Juana de Aza",
      "tier": 3
    },
    {
      "answer": "Emilie Tavernier Gamelin",
      "tier": 3
    },
    {
      "answer": "Eurosia Fabris",
      "tier": 3
    },
    {
      "answer": "Gaetana Sterni",
      "tier": 3
    },
    {
      "answer": "Elisabetta Canori Mora",
      "tier": 3
    },
    {
      "answer": "Dorothy of Montau",
      "tier": 3
    },
    {
      "answer": "Margaret Pole",
      "tier": 3
    },
    {
      "answer": "Marcelina Darowska",
      "tier": 3
    },
    {
      "answer": "Anna Rosa Gattorno",
      "tier": 3
    },
    {
      "answer": "Maria Corsini Beltrame Quattrocchi",
      "tier": 3
    },
    {
      "answer": "Maria Cristina di Savoia",
      "tier": 3
    },
    {
      "answer": "Margaret of Lorraine",
      "tier": 3
    },
    {
      "answer": "Adela",
      "tier": 4
    },
    {
      "answer": "Aldara Ériz de Lugo",
      "tier": 4
    },
    {
      "answer": "Alruna of Cham",
      "tier": 4
    },
    {
      "answer": "Amalia Abad Casasempere de Maestre",
      "tier": 4
    },
    {
      "answer": "Anna Kajiya",
      "tier": 4
    },
    {
      "answer": "Antonia of Florence",
      "tier": 4
    },
    {
      "answer": "Barbara Sim Jo-i",
      "tier": 4
    },
    {
      "answer": "Bertrada of Laon",
      "tier": 4
    },
    {
      "answer": "Bézela of Göda",
      "tier": 4
    },
    {
      "answer": "Christina of Spoleto",
      "tier": 4
    },
    {
      "answer": "Ela of Lacock",
      "tier": 4
    },
    {
      "answer": "Émilie d’Oultremont d’Hoogvorst",
      "tier": 4
    },
    {
      "answer": "Gerardesca of Pisa",
      "tier": 4
    },
    {
      "answer": "Helen del Cavalcanti",
      "tier": 4
    },
    {
      "answer": "Helen of Poland",
      "tier": 4
    },
    {
      "answer": "Herminia Martínez Amigó de Martínez",
      "tier": 5
    },
    {
      "answer": "Hildegard the Empress",
      "tier": 5
    },
    {
      "answer": "Ioanna Takeda",
      "tier": 5
    },
    {
      "answer": "Irene of Hungary",
      "tier": 5
    },
    {
      "answer": "Isabella Fernandes",
      "tier": 5
    },
    {
      "answer": "Ivetta of Huy",
      "tier": 5
    },
    {
      "answer": "Jacoba de Settesoli",
      "tier": 5
    },
    {
      "answer": "Louise degli Albertoni",
      "tier": 5
    },
    {
      "answer": "Lucia Sato",
      "tier": 5
    },
    {
      "answer": "Lucia Yakichi",
      "tier": 5
    },
    {
      "answer": "Magdalena Kyusaku",
      "tier": 5
    },
    {
      "answer": "Magdalena of Hokusanbara",
      "tier": 5
    },
    {
      "answer": "Maria Alvarez Marco",
      "tier": 5
    },
    {
      "answer": "Maria Gengoro",
      "tier": 5
    },
    {
      "answer": "Maria Ito",
      "tier": 5
    },
    {
      "answer": "Maria Mancini",
      "tier": 6
    },
    {
      "answer": "Maria of Kyoto",
      "tier": 6
    },
    {
      "answer": "María Teresa Ferragud Roig de Masiá",
      "tier": 6
    },
    {
      "answer": "Maria Yi Seong",
      "tier": 6
    },
    {
      "answer": "Marianna Biernacka",
      "tier": 6
    },
    {
      "answer": "Marie of the Incarnation",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Monica",
      "accepted": true
    },
    {
      "guess": "Anne, mother of Mary",
      "accepted": true
    },
    {
      "guess": "Mary, mother of Jesus",
      "accepted": true
    },
    {
      "guess": "Zélie Martin",
      "accepted": true
    },
    {
      "guess": "Gianna Beretta Molla",
      "accepted": true
    },
    {
      "guess": "Clare of Assisi",
      "accepted": false,
      "reason": "A religious sister, not a mother."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A Carmelite nun, not a mother."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A laywoman who did not marry or have children."
    },
    {
      "guess": "Catherine of Siena",
      "accepted": false,
      "reason": "A lay Dominican who did not marry or have children."
    },
    {
      "guess": "Bernadette Soubirous",
      "accepted": false,
      "reason": "A religious sister, not a mother."
    }
  ]
},
{
  "id": "longtail-royal-saints",
  "theme": "saints",
  "prompt": "Name a saint or blessed who was a prince, princess, king, or queen.",
  "context": "The Church’s saints and blesseds include monarchs, royal heirs, princes and princesses from many countries. This open list is not complete.",
  "basis": "CatholicSaints.info, “Saints who were Princes,” 94 profiles; “Saints who were Princesses,” 118 profiles; related kings and queens indexes: https://catholicsaints.info/saints-who-were-princes/ ; https://catholicsaints.info/saints-who-were-princesses/ ; https://catholicsaints.info/saints-who-were-kings/ ; https://catholicsaints.info/saints-who-were-queens/ .",
  "answers": [
    {
      "answer": "Louis IX of France",
      "tier": 1
    },
    {
      "answer": "Edward the Confessor",
      "tier": 1
    },
    {
      "answer": "Stephen of Hungary",
      "tier": 1
    },
    {
      "answer": "Elizabeth of Hungary",
      "tier": 1
    },
    {
      "answer": "Margaret of Scotland",
      "tier": 1
    },
    {
      "answer": "Casimir of Poland",
      "tier": 2
    },
    {
      "answer": "Wenceslaus of Bohemia",
      "tier": 2
    },
    {
      "answer": "Olaf II of Norway",
      "tier": 2
    },
    {
      "answer": "Ferdinand III of Castile",
      "tier": 2
    },
    {
      "answer": "Canute IV of Denmark",
      "tier": 2
    },
    {
      "answer": "Henry II",
      "tier": 2
    },
    {
      "answer": "Olga of Kiev",
      "tier": 2
    },
    {
      "answer": "Alfred the Great",
      "tier": 3
    },
    {
      "answer": "Clotilde",
      "tier": 3
    },
    {
      "answer": "Bathilde",
      "tier": 3
    },
    {
      "answer": "Cunegundes",
      "tier": 3
    },
    {
      "answer": "Pulcheria",
      "tier": 3
    },
    {
      "answer": "Helena of Constantinople",
      "tier": 3
    },
    {
      "answer": "Hedwig of Silesia",
      "tier": 3
    },
    {
      "answer": "Ethelburga of Kent",
      "tier": 3
    },
    {
      "answer": "Ethelburga of Wessex",
      "tier": 3
    },
    {
      "answer": "Bertha of Kent",
      "tier": 3
    },
    {
      "answer": "Theodelinda",
      "tier": 3
    },
    {
      "answer": "Margaret of Hungary",
      "tier": 3
    },
    {
      "answer": "Adelaide of Trebnitz",
      "tier": 4
    },
    {
      "answer": "Edigna of Puch",
      "tier": 4
    },
    {
      "answer": "Gisella of Hungary",
      "tier": 4
    },
    {
      "answer": "Helen of Poland",
      "tier": 4
    },
    {
      "answer": "Irene of Hungary",
      "tier": 4
    },
    {
      "answer": "Irmengard",
      "tier": 4
    },
    {
      "answer": "Isabella of France",
      "tier": 4
    },
    {
      "answer": "Jane of Portugal",
      "tier": 4
    },
    {
      "answer": "Mafalda of Portugal",
      "tier": 4
    },
    {
      "answer": "Maria Cristina of Savoy",
      "tier": 4
    },
    {
      "answer": "Salomea of Galicia",
      "tier": 4
    },
    {
      "answer": "Sancha of Majorca",
      "tier": 4
    },
    {
      "answer": "Theodolinda the Queen",
      "tier": 4
    },
    {
      "answer": "Abdela",
      "tier": 4
    },
    {
      "answer": "Adela of Blois",
      "tier": 4
    },
    {
      "answer": "Adela of Messines",
      "tier": 5
    },
    {
      "answer": "Adela of Pfalzel",
      "tier": 5
    },
    {
      "answer": "Adelaide of Burgundy",
      "tier": 5
    },
    {
      "answer": "Adeloga of Kitzingen",
      "tier": 5
    },
    {
      "answer": "Agnes of Prague",
      "tier": 5
    },
    {
      "answer": "Alburga of Wilton",
      "tier": 5
    },
    {
      "answer": "Alena of Brussels",
      "tier": 5
    },
    {
      "answer": "Alkelda of Middleham",
      "tier": 5
    },
    {
      "answer": "Almedha",
      "tier": 5
    },
    {
      "answer": "Althryda",
      "tier": 5
    },
    {
      "answer": "Angelina of Serbia",
      "tier": 5
    },
    {
      "answer": "Antusa of Constantinople",
      "tier": 5
    },
    {
      "answer": "Arianell",
      "tier": 5
    },
    {
      "answer": "Aurelia of Strasbourg",
      "tier": 5
    },
    {
      "answer": "Bega",
      "tier": 5
    },
    {
      "answer": "Benedicta of Lorraine",
      "tier": 6
    },
    {
      "answer": "Bertille of Thuringia",
      "tier": 6
    },
    {
      "answer": "Bova of Rheims",
      "tier": 6
    },
    {
      "answer": "Canna",
      "tier": 6
    },
    {
      "answer": "Cecilia of Lorraine",
      "tier": 6
    },
    {
      "answer": "Aelfflaed of Whitby",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Louis IX of France",
      "accepted": true
    },
    {
      "guess": "Edward the Confessor",
      "accepted": true
    },
    {
      "guess": "Stephen of Hungary",
      "accepted": true
    },
    {
      "guess": "Elizabeth of Hungary",
      "accepted": true
    },
    {
      "guess": "Margaret of Scotland",
      "accepted": true
    },
    {
      "guess": "Thomas More",
      "accepted": false,
      "reason": "A statesman and martyr, not a royal."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A military leader, not a member of a royal family."
    },
    {
      "guess": "Catherine of Siena",
      "accepted": false,
      "reason": "A lay Dominican, not a royal."
    },
    {
      "guess": "Francis of Assisi",
      "accepted": false,
      "reason": "A religious founder, not a royal."
    },
    {
      "guess": "John Henry Newman",
      "accepted": false,
      "reason": "A priest and cardinal, not a royal."
    }
  ]
},
{
  "id": "longtail-founders-of-congregations",
  "theme": "saints",
  "prompt": "Name a saint, blessed, or venerable who founded a religious congregation.",
  "context": "Many Catholic religious communities began through the work of a founder or foundress. This open list includes people who founded congregations, institutes or religious families; it is not complete.",
  "basis": "CatholicSaints.info, “Saints who Founded Religious Congregations,” 571 profiles: https://catholicsaints.info/saints-who-founded-religious-congregations/ . Answer examples are selected from the source index, with familiar founders in the common tiers and less familiar founders in the long tail.",
  "answers": [
    {
      "answer": "Benedict of Nursia",
      "tier": 1
    },
    {
      "answer": "Francis of Assisi",
      "tier": 1
    },
    {
      "answer": "Dominic",
      "tier": 1
    },
    {
      "answer": "Ignatius of Loyola",
      "tier": 1
    },
    {
      "answer": "Teresa of Ávila",
      "tier": 1
    },
    {
      "answer": "John Bosco",
      "tier": 2
    },
    {
      "answer": "John Baptist de La Salle",
      "tier": 2
    },
    {
      "answer": "Vincent de Paul",
      "tier": 2
    },
    {
      "answer": "Philip Neri",
      "tier": 2
    },
    {
      "answer": "Camillus de Lellis",
      "tier": 2
    },
    {
      "answer": "Peter Nolasco",
      "tier": 2
    },
    {
      "answer": "Angela Merici",
      "tier": 2
    },
    {
      "answer": "John of God",
      "tier": 3
    },
    {
      "answer": "Alphonsus Liguori",
      "tier": 3
    },
    {
      "answer": "Norbert of Xanten",
      "tier": 3
    },
    {
      "answer": "Peter Fourier",
      "tier": 3
    },
    {
      "answer": "John Eudes",
      "tier": 3
    },
    {
      "answer": "Mary Ward",
      "tier": 3
    },
    {
      "answer": "Jeanne Jugan",
      "tier": 3
    },
    {
      "answer": "Marcellin Champagnat",
      "tier": 3
    },
    {
      "answer": "Louise de Marillac",
      "tier": 3
    },
    {
      "answer": "Elizabeth Ann Seton",
      "tier": 3
    },
    {
      "answer": "Don Bosco",
      "tier": 3
    },
    {
      "answer": "Joseph Calasanz",
      "tier": 3
    },
    {
      "answer": "Luigi Biraghi",
      "tier": 4
    },
    {
      "answer": "Luigi Boccardo",
      "tier": 4
    },
    {
      "answer": "Luigi Caburlotto",
      "tier": 4
    },
    {
      "answer": "Luigi Maria Monti",
      "tier": 4
    },
    {
      "answer": "Luigi Monza",
      "tier": 4
    },
    {
      "answer": "Luigi Novarese",
      "tier": 4
    },
    {
      "answer": "Luigi Talamoni",
      "tier": 4
    },
    {
      "answer": "Luigi Variara",
      "tier": 4
    },
    {
      "answer": "Luigia Poloni",
      "tier": 4
    },
    {
      "answer": "Malgorzata Szewczyk",
      "tier": 4
    },
    {
      "answer": "Manuel Domingo y Sol",
      "tier": 4
    },
    {
      "answer": "Manuela de Jesús Arias Espinosa",
      "tier": 4
    },
    {
      "answer": "Marcelina Darowska",
      "tier": 4
    },
    {
      "answer": "Marcelo Spínola y Maestre",
      "tier": 4
    },
    {
      "answer": "Marco Antonio Durando",
      "tier": 4
    },
    {
      "answer": "Margaret of Savoy",
      "tier": 5
    },
    {
      "answer": "Margaretha Flesch",
      "tier": 5
    },
    {
      "answer": "Maria Anna Blondin",
      "tier": 5
    },
    {
      "answer": "Maria Anna Rosa Caiani",
      "tier": 5
    },
    {
      "answer": "Maria Bárbara Maix",
      "tier": 5
    },
    {
      "answer": "Maria Caridad Brader",
      "tier": 5
    },
    {
      "answer": "Maria Catalina Troiani",
      "tier": 5
    },
    {
      "answer": "Maria Clara of the Child Jesus",
      "tier": 5
    },
    {
      "answer": "Maria Crocifissa Curcio",
      "tier": 5
    },
    {
      "answer": "Maria del Carmen of the Child Jesus",
      "tier": 5
    },
    {
      "answer": "Maria del Carmen Rendiles Martinez",
      "tier": 5
    },
    {
      "answer": "María del Tránsito de Jesús Sacramentado",
      "tier": 5
    },
    {
      "answer": "María Dolores Rodríguez Sopeña",
      "tier": 5
    },
    {
      "answer": "María Emilia Riquelme y Zayas",
      "tier": 5
    },
    {
      "answer": "Maria Franciszka Siedliska",
      "tier": 5
    },
    {
      "answer": "Maria Gargani",
      "tier": 6
    },
    {
      "answer": "Maria Karłowska",
      "tier": 6
    },
    {
      "answer": "María Lorenza Requenses de Longo",
      "tier": 6
    },
    {
      "answer": "Maria Louise Merkert",
      "tier": 6
    },
    {
      "answer": "Maria Luigia Velotti",
      "tier": 6
    },
    {
      "answer": "Maria Pilar Izquierdo Albero",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Francis of Assisi",
      "accepted": true
    },
    {
      "guess": "Benedict of Nursia",
      "accepted": true
    },
    {
      "guess": "Dominic",
      "accepted": true
    },
    {
      "guess": "Ignatius of Loyola",
      "accepted": true
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A Dominican theologian, not a founder of a religious congregation."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A diocesan priest, not a founder of a religious congregation."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A military leader, not a religious founder."
    },
    {
      "guess": "Bernadette Soubirous",
      "accepted": false,
      "reason": "A religious sister and visionary, not a congregational founder."
    },
    {
      "guess": "Carlo Acutis",
      "accepted": false,
      "reason": "A lay saint, not a founder of a religious congregation."
    }
  ]
},
{
  "id": "longtail-saints-spain",
  "theme": "saints",
  "prompt": "Name a saint or blessed associated with Spain.",
  "context": "Spain has a long Christian history, and its saints and blesseds include martyrs, bishops, religious, mystics and laypeople. This open list is not complete.",
  "basis": "GCatholic, “Saints and Blesseds of Spain” (380 saints and 2,567 blesseds; association is based on birthplace and/or death place): https://gcatholic.org/saints/data/country-ES.htm . Names follow the catalogue.",
  "answers": [
    {
      "answer": "Teresa of Ávila",
      "tier": 1
    },
    {
      "answer": "John of the Cross",
      "tier": 1
    },
    {
      "answer": "Ignatius of Loyola",
      "tier": 1
    },
    {
      "answer": "Francis Xavier",
      "tier": 1
    },
    {
      "answer": "Dominic of Osma",
      "tier": 1
    },
    {
      "answer": "Isidore the Farmer",
      "tier": 2
    },
    {
      "answer": "John of God",
      "tier": 2
    },
    {
      "answer": "Isidore of Seville",
      "tier": 2
    },
    {
      "answer": "Leocadia of Toledo",
      "tier": 2
    },
    {
      "answer": "Eulalia of Mérida",
      "tier": 2
    },
    {
      "answer": "John of Ávila",
      "tier": 2
    },
    {
      "answer": "Josemaría Escrivá",
      "tier": 2
    },
    {
      "answer": "Torcuato",
      "tier": 3
    },
    {
      "answer": "Cecilio de Granada",
      "tier": 3
    },
    {
      "answer": "Geroncio de Italica",
      "tier": 3
    },
    {
      "answer": "Eufrasio de Iliturgi",
      "tier": 3
    },
    {
      "answer": "Hesiquio de Cazorla",
      "tier": 3
    },
    {
      "answer": "Indaletio de Almería",
      "tier": 3
    },
    {
      "answer": "Segundo de Abula",
      "tier": 3
    },
    {
      "answer": "Tesifonte de Vergium",
      "tier": 3
    },
    {
      "answer": "Orentius",
      "tier": 3
    },
    {
      "answer": "Patientia",
      "tier": 3
    },
    {
      "answer": "Leto de Lezuza",
      "tier": 3
    },
    {
      "answer": "Vicente de Lezuza",
      "tier": 3
    },
    {
      "answer": "Augurio de Tarragona",
      "tier": 4
    },
    {
      "answer": "Eulogio de Tarragona",
      "tier": 4
    },
    {
      "answer": "Fructuoso de Tarragona",
      "tier": 4
    },
    {
      "answer": "Mauro de Valencia",
      "tier": 4
    },
    {
      "answer": "Justa",
      "tier": 4
    },
    {
      "answer": "Rufina",
      "tier": 4
    },
    {
      "answer": "Celedonio",
      "tier": 4
    },
    {
      "answer": "Emeterio",
      "tier": 4
    },
    {
      "answer": "Facundo",
      "tier": 4
    },
    {
      "answer": "Germán de Gerona",
      "tier": 4
    },
    {
      "answer": "Justo de Gerona",
      "tier": 4
    },
    {
      "answer": "Paulino de Gerona",
      "tier": 4
    },
    {
      "answer": "Primitivo",
      "tier": 4
    },
    {
      "answer": "Sicio de Gerona",
      "tier": 4
    },
    {
      "answer": "Centola",
      "tier": 4
    },
    {
      "answer": "Severo de Barcelona",
      "tier": 5
    },
    {
      "answer": "Engracia de Zaragoza",
      "tier": 5
    },
    {
      "answer": "Eulalia de Barcelona",
      "tier": 5
    },
    {
      "answer": "Apodemo de Zaragoza",
      "tier": 5
    },
    {
      "answer": "Cayo de Zaragoza",
      "tier": 5
    },
    {
      "answer": "Ceciliano de Zaragoza",
      "tier": 5
    },
    {
      "answer": "Claudio",
      "tier": 5
    },
    {
      "answer": "Cremencio de Zaragoza",
      "tier": 5
    },
    {
      "answer": "Cristeta de Talavera",
      "tier": 5
    },
    {
      "answer": "Cucuphas",
      "tier": 5
    },
    {
      "answer": "Evencio de Zaragoza",
      "tier": 5
    },
    {
      "answer": "Faustus",
      "tier": 5
    },
    {
      "answer": "Félix de Gerona",
      "tier": 5
    },
    {
      "answer": "Félix de Zaragoza",
      "tier": 5
    },
    {
      "answer": "Frontón de Zaragoza",
      "tier": 5
    },
    {
      "answer": "Januarius",
      "tier": 6
    },
    {
      "answer": "Julia de Mérida",
      "tier": 6
    },
    {
      "answer": "Julia de Zaragoza",
      "tier": 6
    },
    {
      "answer": "Juliana",
      "tier": 6
    },
    {
      "answer": "Justo",
      "tier": 6
    },
    {
      "answer": "Lucrecia de Mérida",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Teresa of Ávila",
      "accepted": true
    },
    {
      "guess": "John of the Cross",
      "accepted": true
    },
    {
      "guess": "Ignatius of Loyola",
      "accepted": true
    },
    {
      "guess": "Francis Xavier",
      "accepted": true
    },
    {
      "guess": "Dominic of Osma",
      "accepted": true
    },
    {
      "guess": "Patrick",
      "accepted": false,
      "reason": "A saint associated with Ireland, not a Spain entry in the source catalogue."
    },
    {
      "guess": "Francis of Assisi",
      "accepted": false,
      "reason": "An Italian saint, not a Spain entry in the source catalogue."
    },
    {
      "guess": "Benedict of Nursia",
      "accepted": false,
      "reason": "An Italian saint, not a Spain entry in the source catalogue."
    },
    {
      "guess": "Catherine of Siena",
      "accepted": false,
      "reason": "An Italian saint, not a Spain entry in the source catalogue."
    },
    {
      "guess": "Thomas More",
      "accepted": false,
      "reason": "An English saint, not a Spain entry in the source catalogue."
    }
  ]
},
{
  "id": "longtail-saints-germany",
  "theme": "saints",
  "prompt": "Name a saint or blessed associated with Germany.",
  "context": "Germany’s Christian history includes early martyrs, missionaries, abbesses, bishops, theologians and modern witnesses. This open list is not complete.",
  "basis": "GCatholic, “Saints and Blesseds of Germany” (183 saints and 179 blesseds; association is based on birthplace and/or death place): https://gcatholic.org/saints/data/country-DE . Names follow the catalogue.",
  "answers": [
    {
      "answer": "Boniface",
      "tier": 1
    },
    {
      "answer": "Hildegard of Bingen",
      "tier": 1
    },
    {
      "answer": "Albert the Great",
      "tier": 1
    },
    {
      "answer": "Elizabeth of Hungary",
      "tier": 1
    },
    {
      "answer": "Edith Stein",
      "tier": 1
    },
    {
      "answer": "Afra of Augsburg",
      "tier": 2
    },
    {
      "answer": "Gereon of Cologne",
      "tier": 2
    },
    {
      "answer": "Ursula",
      "tier": 2
    },
    {
      "answer": "Marcellina",
      "tier": 2
    },
    {
      "answer": "Radegund of Poitiers",
      "tier": 2
    },
    {
      "answer": "Ansgar",
      "tier": 2
    },
    {
      "answer": "Fidelis of Sigmaringen",
      "tier": 2
    },
    {
      "answer": "Martin of Trier",
      "tier": 3
    },
    {
      "answer": "Eucharius of Trier",
      "tier": 3
    },
    {
      "answer": "Valerius of Trier",
      "tier": 3
    },
    {
      "answer": "Mallosus",
      "tier": 3
    },
    {
      "answer": "Viktor of Xanten",
      "tier": 3
    },
    {
      "answer": "Ferrutius",
      "tier": 3
    },
    {
      "answer": "Cassius",
      "tier": 3
    },
    {
      "answer": "Florentius",
      "tier": 3
    },
    {
      "answer": "Valentine of Trier",
      "tier": 3
    },
    {
      "answer": "Maternus of Cologne",
      "tier": 3
    },
    {
      "answer": "Agritius of Trier",
      "tier": 3
    },
    {
      "answer": "Maximinus of Trier",
      "tier": 3
    },
    {
      "answer": "Paulinus of Trier",
      "tier": 4
    },
    {
      "answer": "Lubentius",
      "tier": 4
    },
    {
      "answer": "Bonosus of Trier",
      "tier": 4
    },
    {
      "answer": "Britto of Trier",
      "tier": 4
    },
    {
      "answer": "Felix of Trier",
      "tier": 4
    },
    {
      "answer": "Kastor of Karden",
      "tier": 4
    },
    {
      "answer": "Felicius",
      "tier": 4
    },
    {
      "answer": "Odilia of Cologne",
      "tier": 4
    },
    {
      "answer": "Potentinus",
      "tier": 4
    },
    {
      "answer": "Quiriacus of Trier",
      "tier": 4
    },
    {
      "answer": "Simplicius",
      "tier": 4
    },
    {
      "answer": "Severin of Cologne",
      "tier": 4
    },
    {
      "answer": "Alban of Mainz",
      "tier": 4
    },
    {
      "answer": "Aureus of Mainz",
      "tier": 4
    },
    {
      "answer": "Severus of Trier",
      "tier": 4
    },
    {
      "answer": "Valentin of Rhaetia",
      "tier": 5
    },
    {
      "answer": "Modestus of Trier",
      "tier": 5
    },
    {
      "answer": "Justina of Mainz",
      "tier": 5
    },
    {
      "answer": "Fibicius of Trier",
      "tier": 5
    },
    {
      "answer": "Fridolin of Säckingen",
      "tier": 5
    },
    {
      "answer": "Nicetius of Trier",
      "tier": 5
    },
    {
      "answer": "Rusticus of Trier",
      "tier": 5
    },
    {
      "answer": "Magnerich of Trier",
      "tier": 5
    },
    {
      "answer": "Everigisil of Cologne",
      "tier": 5
    },
    {
      "answer": "Bertoare",
      "tier": 5
    },
    {
      "answer": "Wendelin of Trier",
      "tier": 5
    },
    {
      "answer": "Landelin of Ettenheimmünster",
      "tier": 5
    },
    {
      "answer": "Moduald of Trier",
      "tier": 5
    },
    {
      "answer": "Goar of the Rhineland",
      "tier": 5
    },
    {
      "answer": "Emmeram of Regensburg",
      "tier": 5
    },
    {
      "answer": "Modesta of Oeren",
      "tier": 6
    },
    {
      "answer": "Kunibert of Cologne",
      "tier": 6
    },
    {
      "answer": "Germanus of Granfelden",
      "tier": 6
    },
    {
      "answer": "Kilian",
      "tier": 6
    },
    {
      "answer": "Colmán",
      "tier": 6
    },
    {
      "answer": "Totnan",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Boniface",
      "accepted": true
    },
    {
      "guess": "Hildegard of Bingen",
      "accepted": true
    },
    {
      "guess": "Albert the Great",
      "accepted": true
    },
    {
      "guess": "Elizabeth of Hungary",
      "accepted": true
    },
    {
      "guess": "Edith Stein",
      "accepted": true
    },
    {
      "guess": "Patrick",
      "accepted": false,
      "reason": "A saint associated with Ireland, not a Germany entry in the source catalogue."
    },
    {
      "guess": "Francis of Assisi",
      "accepted": false,
      "reason": "An Italian saint, not a Germany entry in the source catalogue."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A Spanish saint, not a Germany entry in the source catalogue."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A French saint, not a Germany entry in the source catalogue."
    },
    {
      "guess": "Thomas More",
      "accepted": false,
      "reason": "An English saint, not a Germany entry in the source catalogue."
    }
  ]
},
{
  "id": "longtail-saints-poland",
  "theme": "saints",
  "prompt": "Name a saint or blessed associated with Poland.",
  "context": "Poland’s saints and blesseds include early missionaries, medieval rulers, religious, priests, laypeople and witnesses of the twentieth century. This open list is not complete.",
  "basis": "GCatholic, “Saints and Blesseds of Poland” (36 saints and 283 blesseds; association is based on birthplace and/or death place): https://gcatholic.org/saints/data/country-PL . Names follow the catalogue.",
  "answers": [
    {
      "answer": "John Paul II",
      "tier": 1
    },
    {
      "answer": "Faustina Kowalska",
      "tier": 1
    },
    {
      "answer": "Maximilian Kolbe",
      "tier": 1
    },
    {
      "answer": "Stanislaus of Szczepanów",
      "tier": 1
    },
    {
      "answer": "Hyacinth of Poland",
      "tier": 1
    },
    {
      "answer": "Hedwig of Silesia",
      "tier": 2
    },
    {
      "answer": "John Cantius",
      "tier": 2
    },
    {
      "answer": "Casimir",
      "tier": 2
    },
    {
      "answer": "Stanisław Kostka",
      "tier": 2
    },
    {
      "answer": "Andrzej Bobola",
      "tier": 2
    },
    {
      "answer": "Josaphat Kuntsevich",
      "tier": 2
    },
    {
      "answer": "Teresa Benedicta of the Cross",
      "tier": 2
    },
    {
      "answer": "Adalbert of Prague",
      "tier": 3
    },
    {
      "answer": "Andrew Zorard",
      "tier": 3
    },
    {
      "answer": "Wincenty Kadłubek",
      "tier": 3
    },
    {
      "answer": "Czesław Odrowąż",
      "tier": 3
    },
    {
      "answer": "Bronisława",
      "tier": 3
    },
    {
      "answer": "Salomea Piastówna",
      "tier": 3
    },
    {
      "answer": "Kinga",
      "tier": 3
    },
    {
      "answer": "Yolanda of Poland",
      "tier": 3
    },
    {
      "answer": "Dorothea of Montau",
      "tier": 3
    },
    {
      "answer": "Hedwig of Poland",
      "tier": 3
    },
    {
      "answer": "Szymon of Lipnica",
      "tier": 3
    },
    {
      "answer": "John of Dukla",
      "tier": 3
    },
    {
      "answer": "Michał Giedrojć",
      "tier": 4
    },
    {
      "answer": "Stanisław Kazimierczyk",
      "tier": 4
    },
    {
      "answer": "Władysław of Gielniow",
      "tier": 4
    },
    {
      "answer": "Jan Chojeński",
      "tier": 4
    },
    {
      "answer": "Regina Protmann",
      "tier": 4
    },
    {
      "answer": "Melichar Grodecki",
      "tier": 4
    },
    {
      "answer": "Jan Sarkander",
      "tier": 4
    },
    {
      "answer": "Zofia Czeska-Maciejowska",
      "tier": 4
    },
    {
      "answer": "Stanisław Papczyński",
      "tier": 4
    },
    {
      "answer": "Raffaele Chyliński",
      "tier": 4
    },
    {
      "answer": "Edmund Bojanowski",
      "tier": 4
    },
    {
      "answer": "Maria Merkert",
      "tier": 4
    },
    {
      "answer": "Zygmunt Szczęsny Feliński",
      "tier": 4
    },
    {
      "answer": "Maria Angela Truszkowska",
      "tier": 4
    },
    {
      "answer": "Maria Karłowska",
      "tier": 4
    },
    {
      "answer": "Maria Ursula of Jesus",
      "tier": 5
    },
    {
      "answer": "Alicja Kotowska",
      "tier": 5
    },
    {
      "answer": "Leon Nowakowski",
      "tier": 5
    },
    {
      "answer": "Marian Skrzypczak",
      "tier": 5
    },
    {
      "answer": "Bernardina Jabłońska",
      "tier": 5
    },
    {
      "answer": "Bronisław Komorowski",
      "tier": 5
    },
    {
      "answer": "Franciszek Rogaczewski",
      "tier": 5
    },
    {
      "answer": "Józef Kurzawa",
      "tier": 5
    },
    {
      "answer": "Marian Górecki",
      "tier": 5
    },
    {
      "answer": "Michał Piaszczyński",
      "tier": 5
    },
    {
      "answer": "Stanisław Kubista",
      "tier": 5
    },
    {
      "answer": "Wincenty Matuszewski",
      "tier": 5
    },
    {
      "answer": "Władysław Demski",
      "tier": 5
    },
    {
      "answer": "Włodzimierz Laskowski",
      "tier": 5
    },
    {
      "answer": "Zygmunt Sajna",
      "tier": 5
    },
    {
      "answer": "Anicet Hryciuk",
      "tier": 6
    },
    {
      "answer": "Antoni Julian Nowowiejski",
      "tier": 6
    },
    {
      "answer": "Bolesław Strzelecki",
      "tier": 6
    },
    {
      "answer": "Franciszek Harazim",
      "tier": 6
    },
    {
      "answer": "Henryk Hlebowicz",
      "tier": 6
    },
    {
      "answer": "Ignacy Antonowicz",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "John Paul II",
      "accepted": true
    },
    {
      "guess": "Faustina Kowalska",
      "accepted": true
    },
    {
      "guess": "Maximilian Kolbe",
      "accepted": true
    },
    {
      "guess": "Stanislaus of Szczepanów",
      "accepted": true
    },
    {
      "guess": "Hyacinth of Poland",
      "accepted": true
    },
    {
      "guess": "Patrick",
      "accepted": false,
      "reason": "A saint associated with Ireland, not a Poland entry in the source catalogue."
    },
    {
      "guess": "Francis of Assisi",
      "accepted": false,
      "reason": "An Italian saint, not a Poland entry in the source catalogue."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A Spanish saint, not a Poland entry in the source catalogue."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A French saint, not a Poland entry in the source catalogue."
    },
    {
      "guess": "Thomas More",
      "accepted": false,
      "reason": "An English saint, not a Poland entry in the source catalogue."
    }
  ]
},
{
  "id": "longtail-catholic-devotions",
  "theme": "devotion",
  "prompt": "Name a Catholic devotional practice.",
  "context": "Catholics express devotion through visits, processions, pilgrimages, blessings, acts of veneration and recurring devotional observances. This open list is not complete; it focuses on practices rather than the words of individual prayers.",
  "basis": "USCCB, “Popular Devotional Practices: Basic Questions and Answers,” and the Vatican’s Directory on Popular Piety and the Liturgy: https://www.usccb.org/prayer-and-worship/prayers-and-devotions/prayers/popular-devotional-practices-basic-questions-and-answers ; https://www.vatican.va/roman_curia/congregations/ccdds/documents/rc_con_ccdds_doc_20020513_vers-direttorio_en.html .",
  "answers": [
    {
      "answer": "The Rosary",
      "tier": 1
    },
    {
      "answer": "Stations of the Cross",
      "tier": 1
    },
    {
      "answer": "Eucharistic adoration",
      "tier": 1
    },
    {
      "answer": "Sacred Heart devotion",
      "tier": 1
    },
    {
      "answer": "Divine Mercy devotion",
      "tier": 1
    },
    {
      "answer": "First Friday devotion",
      "tier": 2
    },
    {
      "answer": "First Saturday devotion",
      "tier": 2
    },
    {
      "answer": "Corpus Christi procession",
      "tier": 2
    },
    {
      "answer": "May crowning of Mary",
      "tier": 2
    },
    {
      "answer": "Brown Scapular devotion",
      "tier": 2
    },
    {
      "answer": "Miraculous Medal devotion",
      "tier": 2
    },
    {
      "answer": "Perpetual adoration",
      "tier": 2
    },
    {
      "answer": "Holy Hour",
      "tier": 3
    },
    {
      "answer": "Forty Hours Devotion",
      "tier": 3
    },
    {
      "answer": "Eucharistic procession",
      "tier": 3
    },
    {
      "answer": "Pilgrimage to a shrine",
      "tier": 3
    },
    {
      "answer": "Veneration of relics",
      "tier": 3
    },
    {
      "answer": "Visit to the Seven Churches",
      "tier": 3
    },
    {
      "answer": "Blessing of homes",
      "tier": 3
    },
    {
      "answer": "Blessing of throats",
      "tier": 3
    },
    {
      "answer": "Via Lucis",
      "tier": 3
    },
    {
      "answer": "Via Matris",
      "tier": 3
    },
    {
      "answer": "Pentecost novena",
      "tier": 3
    },
    {
      "answer": "May devotion to Mary",
      "tier": 3
    },
    {
      "answer": "Enthronement of the Sacred Heart in the home",
      "tier": 4
    },
    {
      "answer": "Consecration to the Sacred Heart",
      "tier": 4
    },
    {
      "answer": "Consecration to the Immaculate Heart of Mary",
      "tier": 4
    },
    {
      "answer": "Consecration to Saint Joseph",
      "tier": 4
    },
    {
      "answer": "Enrollment in the Brown Scapular",
      "tier": 4
    },
    {
      "answer": "Green Scapular devotion",
      "tier": 4
    },
    {
      "answer": "Devotion to the Infant Jesus of Prague",
      "tier": 4
    },
    {
      "answer": "Devotion to the Holy Face",
      "tier": 4
    },
    {
      "answer": "Devotion to the Precious Blood",
      "tier": 4
    },
    {
      "answer": "Devotion to the Holy Wounds",
      "tier": 4
    },
    {
      "answer": "Devotion to the Seven Sorrows of Mary",
      "tier": 4
    },
    {
      "answer": "Devotion to the Seven Joys of Mary",
      "tier": 4
    },
    {
      "answer": "Devotion to the Holy Family",
      "tier": 4
    },
    {
      "answer": "Devotion to the Holy Angels",
      "tier": 4
    },
    {
      "answer": "Devotion to the Guardian Angels",
      "tier": 4
    },
    {
      "answer": "Devotion to the Five First Saturdays",
      "tier": 5
    },
    {
      "answer": "Devotion to the Nine First Fridays",
      "tier": 5
    },
    {
      "answer": "Pilgrimage to Lourdes",
      "tier": 5
    },
    {
      "answer": "Pilgrimage to Fatima",
      "tier": 5
    },
    {
      "answer": "Pilgrimage to Guadalupe",
      "tier": 5
    },
    {
      "answer": "Pilgrimage to the Holy Land",
      "tier": 5
    },
    {
      "answer": "Pilgrimage to Rome",
      "tier": 5
    },
    {
      "answer": "Pilgrimage to Santiago de Compostela",
      "tier": 5
    },
    {
      "answer": "Pilgrimage to Knock",
      "tier": 5
    },
    {
      "answer": "Pilgrimage to Czestochowa",
      "tier": 5
    },
    {
      "answer": "Visit to a cemetery in November",
      "tier": 5
    },
    {
      "answer": "Procession on Palm Sunday",
      "tier": 5
    },
    {
      "answer": "Procession on Good Friday",
      "tier": 5
    },
    {
      "answer": "Blessing of animals on Saint Francis’ feast",
      "tier": 5
    },
    {
      "answer": "Blessing of candles on Candlemas",
      "tier": 5
    },
    {
      "answer": "Blessing of Easter food",
      "tier": 6
    },
    {
      "answer": "Blessing of homes on Epiphany",
      "tier": 6
    },
    {
      "answer": "Blessing of throats on Saint Blaise’s feast",
      "tier": 6
    },
    {
      "answer": "Blessing of the sick with relics",
      "tier": 6
    },
    {
      "answer": "Rogation procession",
      "tier": 6
    },
    {
      "answer": "Stational church visit",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "The Rosary",
      "accepted": true
    },
    {
      "guess": "Stations of the Cross",
      "accepted": true
    },
    {
      "guess": "Eucharistic adoration",
      "accepted": true
    },
    {
      "guess": "Sacred Heart devotion",
      "accepted": true
    },
    {
      "guess": "Divine Mercy devotion",
      "accepted": true
    },
    {
      "guess": "Hail Mary",
      "accepted": false,
      "reason": "A prayer, not a devotional practice."
    },
    {
      "guess": "Our Father",
      "accepted": false,
      "reason": "A prayer, not a devotional practice."
    },
    {
      "guess": "Nicene Creed",
      "accepted": false,
      "reason": "A profession of faith, not a devotional practice."
    },
    {
      "guess": "Psalm 23",
      "accepted": false,
      "reason": "A biblical psalm, not a devotional practice."
    },
    {
      "guess": "Quo Primum",
      "accepted": false,
      "reason": "A papal document, not a devotional practice."
    }
  ],
  "reviewFlags": [
    "Pilgrimage, procession, blessing and veneration practices are included where they function as Catholic popular piety; some are also liturgical or sacramental observances.",
    "The answer list excludes individual prayer formulas because the core bank already asks “Name a prayer.”"
  ]
},
{
  "id": "longtail-old-testament-miracles",
  "theme": "scripture",
  "prompt": "Name a miracle or supernatural sign in the Old Testament.",
  "context": "The Old Testament recounts miracles, prophetic signs and extraordinary acts of divine protection or provision. This open list is not complete; it excludes the ten plagues of Egypt, which have their own prompt.",
  "basis": "Hand-curated from the Catholic Old Testament, with references checked against the narrative accounts in Genesis, Exodus, Numbers, Joshua, Judges, 1–2 Samuel, 1–2 Kings, Daniel and Tobit. Titles are concise descriptions of individual events.",
  "answers": [
    {
      "answer": "Parting of the Red Sea",
      "tier": 1
    },
    {
      "answer": "Manna in the wilderness",
      "tier": 1
    },
    {
      "answer": "Jericho’s walls fall",
      "tier": 1
    },
    {
      "answer": "Daniel in the lions’ den",
      "tier": 1
    },
    {
      "answer": "The three young men survive the fiery furnace",
      "tier": 1
    },
    {
      "answer": "Water from the rock at Horeb",
      "tier": 2
    },
    {
      "answer": "The Jordan River parts for Joshua",
      "tier": 2
    },
    {
      "answer": "Elijah raises the widow’s son",
      "tier": 2
    },
    {
      "answer": "Naaman is healed of leprosy",
      "tier": 2
    },
    {
      "answer": "Elisha raises the Shunammite woman’s son",
      "tier": 2
    },
    {
      "answer": "The sun stands still for Joshua",
      "tier": 2
    },
    {
      "answer": "Balaam’s donkey speaks",
      "tier": 2
    },
    {
      "answer": "The burning bush",
      "tier": 3
    },
    {
      "answer": "The pillar of cloud and fire",
      "tier": 3
    },
    {
      "answer": "Quail provided in the wilderness",
      "tier": 3
    },
    {
      "answer": "Aaron’s staff blossoms",
      "tier": 3
    },
    {
      "answer": "The earth swallows Korah’s company",
      "tier": 3
    },
    {
      "answer": "Gideon’s fleece sign",
      "tier": 3
    },
    {
      "answer": "Elijah fed by ravens",
      "tier": 3
    },
    {
      "answer": "The widow’s flour and oil do not run out",
      "tier": 3
    },
    {
      "answer": "Fire falls on Elijah’s sacrifice at Carmel",
      "tier": 3
    },
    {
      "answer": "Elisha makes an axe head float",
      "tier": 3
    },
    {
      "answer": "The angel strikes the Assyrian army",
      "tier": 3
    },
    {
      "answer": "Hezekiah’s life is extended",
      "tier": 3
    },
    {
      "answer": "The Flood and Noah’s preservation",
      "tier": 4
    },
    {
      "answer": "The rainbow covenant sign",
      "tier": 4
    },
    {
      "answer": "Lot’s wife becomes a pillar of salt",
      "tier": 4
    },
    {
      "answer": "Jacob’s ladder vision",
      "tier": 4
    },
    {
      "answer": "Jacob wrestles with the angel",
      "tier": 4
    },
    {
      "answer": "Moses’ staff becomes a serpent",
      "tier": 4
    },
    {
      "answer": "Moses’ hand becomes leprous and is healed",
      "tier": 4
    },
    {
      "answer": "The waters of Marah become sweet",
      "tier": 4
    },
    {
      "answer": "Water from the rock at Meribah",
      "tier": 4
    },
    {
      "answer": "The bronze serpent heals the Israelites",
      "tier": 4
    },
    {
      "answer": "The ark of the covenant returns from the Philistines",
      "tier": 4
    },
    {
      "answer": "Samuel’s thunderstorm at Mizpah",
      "tier": 4
    },
    {
      "answer": "Elijah calls down fire on the soldiers of Ahaziah",
      "tier": 4
    },
    {
      "answer": "Elijah is taken up in a whirlwind",
      "tier": 4
    },
    {
      "answer": "Elisha parts the Jordan with Elijah’s mantle",
      "tier": 4
    },
    {
      "answer": "Elisha purifies the spring at Jericho",
      "tier": 5
    },
    {
      "answer": "Elisha multiplies the widow’s oil",
      "tier": 5
    },
    {
      "answer": "Elisha purifies the poisoned stew",
      "tier": 5
    },
    {
      "answer": "Elisha multiplies the twenty barley loaves",
      "tier": 5
    },
    {
      "answer": "Elisha’s servant sees the heavenly army",
      "tier": 5
    },
    {
      "answer": "The Aramean army is struck with blindness",
      "tier": 5
    },
    {
      "answer": "A dead man revived by touching Elisha’s bones",
      "tier": 5
    },
    {
      "answer": "Jeroboam’s hand withers and is restored",
      "tier": 5
    },
    {
      "answer": "The altar at Bethel splits",
      "tier": 5
    },
    {
      "answer": "The shadow moves backward on Ahaz’s sundial",
      "tier": 5
    },
    {
      "answer": "Nebuchadnezzar is restored after his madness",
      "tier": 5
    },
    {
      "answer": "The writing appears on Belshazzar’s wall",
      "tier": 5
    },
    {
      "answer": "Jonah is preserved in the great fish",
      "tier": 5
    },
    {
      "answer": "Tobit’s blindness is healed with fish gall",
      "tier": 5
    },
    {
      "answer": "Fire from heaven consumes Solomon’s temple offering",
      "tier": 5
    },
    {
      "answer": "Sarah conceives Isaac in old age",
      "tier": 6
    },
    {
      "answer": "Moses’ face shines after speaking with God",
      "tier": 6
    },
    {
      "answer": "God opens Hagar’s eyes to the well",
      "tier": 6
    },
    {
      "answer": "The angel strengthens Elijah in the wilderness",
      "tier": 6
    },
    {
      "answer": "The angel touches Gideon’s offering and fire consumes it",
      "tier": 6
    },
    {
      "answer": "Heavenly horsemen appear to Judas Maccabeus",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Parting of the Red Sea",
      "accepted": true
    },
    {
      "guess": "Manna in the wilderness",
      "accepted": true
    },
    {
      "guess": "Daniel in the lions’ den",
      "accepted": true
    },
    {
      "guess": "Jericho’s walls fall",
      "accepted": true
    },
    {
      "guess": "The three young men survive the fiery furnace",
      "accepted": true
    },
    {
      "guess": "Turning water into wine",
      "accepted": false,
      "reason": "A miracle of Jesus in the New Testament."
    },
    {
      "guess": "Walking on water",
      "accepted": false,
      "reason": "A miracle of Jesus in the New Testament."
    },
    {
      "guess": "The raising of Lazarus",
      "accepted": false,
      "reason": "A miracle of Jesus in the New Testament."
    },
    {
      "guess": "The ten plagues of Egypt",
      "accepted": false,
      "reason": "A separate existing prompt covers the plagues of Egypt."
    },
    {
      "guess": "The multiplication of the loaves by Jesus",
      "accepted": false,
      "reason": "A New Testament miracle of Jesus."
    }
  ],
  "reviewFlags": [
    "Some entries are prophetic signs or supernatural visions rather than healing miracles; the prompt explicitly includes supernatural signs.",
    "The ten plagues of Egypt are excluded to avoid overlap with the existing plagues prompt.",
    "Two distinct water-from-rock events are retained because Exodus 17 and Numbers 20 are separate episodes."
  ]
},
{
  "id": "longtail-saints-ireland",
  "theme": "saints",
  "prompt": "Name a saint or blessed associated with Ireland.",
  "context": "The Church’s saints and blesseds have lived, served or died in Ireland across many centuries. This open list is not complete.",
  "basis": "GCatholic, Saints and Blesseds of Ireland (126 saints and 24 blesseds): https://gcatholic.org/saints/data/country-IE . Association is based on birthplace and/or death place.",
  "answers": [
    {
      "answer": "Patrick",
      "tier": 1
    },
    {
      "answer": "Brigid of Kildare",
      "tier": 1
    },
    {
      "answer": "Columba of Iona",
      "tier": 1
    },
    {
      "answer": "Kevin of Glendalough",
      "tier": 1
    },
    {
      "answer": "Ciarán of Clonmacnoise",
      "tier": 1
    },
    {
      "answer": "Declan of Ardmore",
      "tier": 2
    },
    {
      "answer": "Palladius",
      "tier": 2
    },
    {
      "answer": "Ailbe of Emly",
      "tier": 2
    },
    {
      "answer": "Enda of Aran",
      "tier": 2
    },
    {
      "answer": "Brendan of Clonfert",
      "tier": 2
    },
    {
      "answer": "Canice of Aghaboe",
      "tier": 2
    },
    {
      "answer": "Ita of Killeedy",
      "tier": 2
    },
    {
      "answer": "Sechnall",
      "tier": 3
    },
    {
      "answer": "Benignus of Armagh",
      "tier": 3
    },
    {
      "answer": "Mél of Ardagh",
      "tier": 3
    },
    {
      "answer": "Asicus of Elphin",
      "tier": 3
    },
    {
      "answer": "Muredach of Killala",
      "tier": 3
    },
    {
      "answer": "Macartan of Clogher",
      "tier": 3
    },
    {
      "answer": "Colmán of Dromore",
      "tier": 3
    },
    {
      "answer": "Mac Nisse of Connor",
      "tier": 3
    },
    {
      "answer": "Conleth of Kildare",
      "tier": 3
    },
    {
      "answer": "Kieran of Saigir",
      "tier": 3
    },
    {
      "answer": "Tigernach of Clogher",
      "tier": 3
    },
    {
      "answer": "Fachtna of Ross",
      "tier": 3
    },
    {
      "answer": "Luman",
      "tier": 4
    },
    {
      "answer": "Forcherne",
      "tier": 4
    },
    {
      "answer": "Gwinear",
      "tier": 4
    },
    {
      "answer": "Ausilio",
      "tier": 4
    },
    {
      "answer": "Kenan",
      "tier": 4
    },
    {
      "answer": "Milchuo",
      "tier": 4
    },
    {
      "answer": "Mawgan of Man",
      "tier": 4
    },
    {
      "answer": "Gibrian",
      "tier": 4
    },
    {
      "answer": "Moninne of Killeavy",
      "tier": 4
    },
    {
      "answer": "Beaidh",
      "tier": 4
    },
    {
      "answer": "Jarlath of Tuam",
      "tier": 4
    },
    {
      "answer": "Lughadh",
      "tier": 4
    },
    {
      "answer": "Senán of Inis Cathaigh",
      "tier": 4
    },
    {
      "answer": "Finnian of Clonard",
      "tier": 4
    },
    {
      "answer": "Sinell of Clogher",
      "tier": 4
    },
    {
      "answer": "Fedlimid of Clogher",
      "tier": 5
    },
    {
      "answer": "Fachanan of Ross",
      "tier": 5
    },
    {
      "answer": "Athracht of Killaraght",
      "tier": 5
    },
    {
      "answer": "Davnet of Sliabh Beagh",
      "tier": 5
    },
    {
      "answer": "Comgall of Bangor",
      "tier": 5
    },
    {
      "answer": "Moluag of Lismore",
      "tier": 5
    },
    {
      "answer": "Fridolin of Säckingen",
      "tier": 5
    },
    {
      "answer": "Budoc de Dol",
      "tier": 5
    },
    {
      "answer": "Fiacre",
      "tier": 5
    },
    {
      "answer": "Gobain",
      "tier": 5
    },
    {
      "answer": "Dympna",
      "tier": 5
    },
    {
      "answer": "Eunan (Adomnán of Iona)",
      "tier": 5
    },
    {
      "answer": "Máel Ruba",
      "tier": 5
    },
    {
      "answer": "Fergus of Scotland",
      "tier": 5
    },
    {
      "answer": "Plechelmus",
      "tier": 5
    },
    {
      "answer": "Meldan",
      "tier": 6
    },
    {
      "answer": "Duchonna",
      "tier": 6
    },
    {
      "answer": "Catald of Taranto",
      "tier": 6
    },
    {
      "answer": "Disibod",
      "tier": 6
    },
    {
      "answer": "Fintan of Rheinau",
      "tier": 6
    },
    {
      "answer": "Maimbod",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Patrick",
      "accepted": true
    },
    {
      "guess": "Brigid of Kildare",
      "accepted": true
    },
    {
      "guess": "Columba of Iona",
      "accepted": true
    },
    {
      "guess": "Kevin of Glendalough",
      "accepted": true
    },
    {
      "guess": "Ciarán of Clonmacnoise",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A Catholic saint, but not in this country's answer-key sample."
    },
    {
      "guess": "Francis of Assisi",
      "accepted": false,
      "reason": "A Catholic saint, but not in this country's answer-key sample."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A Catholic saint, but not in this country's answer-key sample."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A Catholic saint, but not in this country's answer-key sample."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A Catholic saint, but not in this country's answer-key sample."
    }
  ]
},
{
  "id": "longtail-saints-france",
  "theme": "saints",
  "prompt": "Name a saint or blessed associated with France.",
  "context": "The Church’s saints and blesseds have lived, served or died in France across many centuries. This open list is not complete.",
  "basis": "GCatholic, Saints and Blesseds of France (1,110 saints and 665 blesseds): https://gcatholic.org/saints/data/country-FR . Association is based on birthplace and/or death place.",
  "answers": [
    {
      "answer": "Mary Magdalene",
      "tier": 1
    },
    {
      "answer": "Martin of Tours",
      "tier": 1
    },
    {
      "answer": "Joan of Arc",
      "tier": 1
    },
    {
      "answer": "Bernard of Clairvaux",
      "tier": 1
    },
    {
      "answer": "Thérèse of Lisieux",
      "tier": 1
    },
    {
      "answer": "Genevieve of Paris",
      "tier": 2
    },
    {
      "answer": "Blandine of Lyon",
      "tier": 2
    },
    {
      "answer": "Irenaeus of Lyons",
      "tier": 2
    },
    {
      "answer": "Denis of Paris",
      "tier": 2
    },
    {
      "answer": "Vincent de Paul",
      "tier": 2
    },
    {
      "answer": "Louise de Marillac",
      "tier": 2
    },
    {
      "answer": "John Eudes",
      "tier": 2
    },
    {
      "answer": "Hilaire of Poitiers",
      "tier": 3
    },
    {
      "answer": "Remigius of Rheims",
      "tier": 3
    },
    {
      "answer": "Clotilde",
      "tier": 3
    },
    {
      "answer": "Radegund",
      "tier": 3
    },
    {
      "answer": "Hugh of Cluny",
      "tier": 3
    },
    {
      "answer": "Bernadette Soubirous",
      "tier": 3
    },
    {
      "answer": "Marguerite-Marie Alacoque",
      "tier": 3
    },
    {
      "answer": "Jean-Baptiste de La Salle",
      "tier": 3
    },
    {
      "answer": "Louis-Marie Grignion de Montfort",
      "tier": 3
    },
    {
      "answer": "Francis de Sales",
      "tier": 3
    },
    {
      "answer": "John of the Cross",
      "tier": 3
    },
    {
      "answer": "Jane Frances de Chantal",
      "tier": 3
    },
    {
      "answer": "Maximin d’Aix",
      "tier": 4
    },
    {
      "answer": "Front of Périgueux",
      "tier": 4
    },
    {
      "answer": "Démèter de Gap",
      "tier": 4
    },
    {
      "answer": "Estelle de Saintes",
      "tier": 4
    },
    {
      "answer": "Ruf d’Avignon",
      "tier": 4
    },
    {
      "answer": "Crescent de Vienne",
      "tier": 4
    },
    {
      "answer": "Exupère de Vienne",
      "tier": 4
    },
    {
      "answer": "Félicien de Vienne",
      "tier": 4
    },
    {
      "answer": "Séverin de Vienne",
      "tier": 4
    },
    {
      "answer": "Zacharie de Vienne",
      "tier": 4
    },
    {
      "answer": "Marcel of Chalon",
      "tier": 4
    },
    {
      "answer": "Pothin de Lyon",
      "tier": 4
    },
    {
      "answer": "Alexandre de Lyon",
      "tier": 4
    },
    {
      "answer": "Bénigne de Dijon",
      "tier": 4
    },
    {
      "answer": "Épipode de Lyon",
      "tier": 4
    },
    {
      "answer": "Symphorien of Autun",
      "tier": 5
    },
    {
      "answer": "Valérien de Tournus",
      "tier": 5
    },
    {
      "answer": "Andoche de Saulieu",
      "tier": 5
    },
    {
      "answer": "Félix de Saulieu",
      "tier": 5
    },
    {
      "answer": "Thyrse de Saulieu",
      "tier": 5
    },
    {
      "answer": "Andéol",
      "tier": 5
    },
    {
      "answer": "Ferjeux de Besançon",
      "tier": 5
    },
    {
      "answer": "Ferréol de Besançon",
      "tier": 5
    },
    {
      "answer": "Aphrodise de Béziers",
      "tier": 5
    },
    {
      "answer": "Éleuthère de Tournai",
      "tier": 5
    },
    {
      "answer": "Martial de Limoges",
      "tier": 5
    },
    {
      "answer": "Rustique de Narbonne",
      "tier": 5
    },
    {
      "answer": "Savinien de Sens",
      "tier": 5
    },
    {
      "answer": "Trophime d’Arles",
      "tier": 5
    },
    {
      "answer": "Paul de Narbonne",
      "tier": 5
    },
    {
      "answer": "Ilpide de Brioude",
      "tier": 6
    },
    {
      "answer": "Ilpize de Brioude",
      "tier": 6
    },
    {
      "answer": "Pons de Cimiez",
      "tier": 6
    },
    {
      "answer": "Saturnin de Toulouse",
      "tier": 6
    },
    {
      "answer": "Dévote",
      "tier": 6
    },
    {
      "answer": "Foy d’Agen",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Mary Magdalene",
      "accepted": true
    },
    {
      "guess": "Martin of Tours",
      "accepted": true
    },
    {
      "guess": "Joan of Arc",
      "accepted": true
    },
    {
      "guess": "Bernard of Clairvaux",
      "accepted": true
    },
    {
      "guess": "Thérèse of Lisieux",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A Catholic saint, but not in this country's answer-key sample."
    },
    {
      "guess": "Francis of Assisi",
      "accepted": false,
      "reason": "A Catholic saint, but not in this country's answer-key sample."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A Catholic saint, but not in this country's answer-key sample."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A Catholic saint, but not in this country's answer-key sample."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A Catholic saint, but not in this country's answer-key sample."
    }
  ]
},
{
  "id": "longtail-saints-italy",
  "theme": "saints",
  "prompt": "Name a saint or blessed associated with Italy.",
  "context": "The Church’s saints and blesseds have lived, served or died in Italy across many centuries. This open list is not complete.",
  "basis": "GCatholic, Saints and Blesseds of Italy (1,386 saints and 599 blesseds): https://gcatholic.org/saints/data/country-IT . Association is based on birthplace and/or death place.",
  "answers": [
    {
      "answer": "Francis of Assisi",
      "tier": 1
    },
    {
      "answer": "Catherine of Siena",
      "tier": 1
    },
    {
      "answer": "Anthony of Padua",
      "tier": 1
    },
    {
      "answer": "Benedict of Nursia",
      "tier": 1
    },
    {
      "answer": "Rita of Cascia",
      "tier": 1
    },
    {
      "answer": "Francis Xavier",
      "tier": 2
    },
    {
      "answer": "Clare of Assisi",
      "tier": 2
    },
    {
      "answer": "Padre Pio",
      "tier": 2
    },
    {
      "answer": "John Bosco",
      "tier": 2
    },
    {
      "answer": "Philip Neri",
      "tier": 2
    },
    {
      "answer": "Maria Goretti",
      "tier": 2
    },
    {
      "answer": "Carlo Acutis",
      "tier": 2
    },
    {
      "answer": "Peter",
      "tier": 3
    },
    {
      "answer": "Paul",
      "tier": 3
    },
    {
      "answer": "Linus",
      "tier": 3
    },
    {
      "answer": "Anacletus (Cletus)",
      "tier": 3
    },
    {
      "answer": "Agnes of Rome",
      "tier": 3
    },
    {
      "answer": "Cecilia",
      "tier": 3
    },
    {
      "answer": "Lucy of Syracuse",
      "tier": 3
    },
    {
      "answer": "Sebastian",
      "tier": 3
    },
    {
      "answer": "Lawrence of Rome",
      "tier": 3
    },
    {
      "answer": "Agatha of Catania",
      "tier": 3
    },
    {
      "answer": "Ambrose of Milan",
      "tier": 3
    },
    {
      "answer": "Thomas Aquinas",
      "tier": 3
    },
    {
      "answer": "Edisto di Roma",
      "tier": 4
    },
    {
      "answer": "Torpes of Pisa",
      "tier": 4
    },
    {
      "answer": "Martiniano",
      "tier": 4
    },
    {
      "answer": "Processo",
      "tier": 4
    },
    {
      "answer": "Costanza",
      "tier": 4
    },
    {
      "answer": "Felice",
      "tier": 4
    },
    {
      "answer": "Marciano di Siracusa",
      "tier": 4
    },
    {
      "answer": "Ermacora di Aquileia",
      "tier": 4
    },
    {
      "answer": "Fortunato di Aquileia",
      "tier": 4
    },
    {
      "answer": "Celso",
      "tier": 4
    },
    {
      "answer": "Nazario",
      "tier": 4
    },
    {
      "answer": "Sinoto di Capua",
      "tier": 4
    },
    {
      "answer": "Rufo di Capua",
      "tier": 4
    },
    {
      "answer": "Avendrace",
      "tier": 4
    },
    {
      "answer": "Nicomede di Roma",
      "tier": 4
    },
    {
      "answer": "Rufus of Rome",
      "tier": 5
    },
    {
      "answer": "Domitilla",
      "tier": 5
    },
    {
      "answer": "Felice di Nola",
      "tier": 5
    },
    {
      "answer": "Titus Flavius Clemens",
      "tier": 5
    },
    {
      "answer": "Flavia Domitilla",
      "tier": 5
    },
    {
      "answer": "Marco Galileo di Atina",
      "tier": 5
    },
    {
      "answer": "Vittorino di Amiterno",
      "tier": 5
    },
    {
      "answer": "Ponzio di Cimiez",
      "tier": 5
    },
    {
      "answer": "Saturnino di Cagliari",
      "tier": 5
    },
    {
      "answer": "Eusebio di Vercelli",
      "tier": 5
    },
    {
      "answer": "Massimo di Torino",
      "tier": 5
    },
    {
      "answer": "Gaudenzio di Novara",
      "tier": 5
    },
    {
      "answer": "Massimo di Pavia",
      "tier": 5
    },
    {
      "answer": "Siro di Pavia",
      "tier": 5
    },
    {
      "answer": "Costanzo di Perugia",
      "tier": 5
    },
    {
      "answer": "Secondo of Asti",
      "tier": 6
    },
    {
      "answer": "Gaudenzio of Brescia",
      "tier": 6
    },
    {
      "answer": "Vigilius of Trent",
      "tier": 6
    },
    {
      "answer": "Zeno of Verona",
      "tier": 6
    },
    {
      "answer": "Prospero of Reggio",
      "tier": 6
    },
    {
      "answer": "Apollinaris of Ravenna",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Francis of Assisi",
      "accepted": true
    },
    {
      "guess": "Catherine of Siena",
      "accepted": true
    },
    {
      "guess": "Anthony of Padua",
      "accepted": true
    },
    {
      "guess": "Benedict of Nursia",
      "accepted": true
    },
    {
      "guess": "Rita of Cascia",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A Catholic saint, but not in this country's answer-key sample."
    },
    {
      "guess": "Francis of Assisi",
      "accepted": false,
      "reason": "A Catholic saint, but not in this country's answer-key sample."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A Catholic saint, but not in this country's answer-key sample."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A Catholic saint, but not in this country's answer-key sample."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A Catholic saint, but not in this country's answer-key sample."
    }
  ]
},
{
  "id": "longtail-saints-portugal",
  "theme": "saints",
  "prompt": "Name a saint or blessed associated with Portugal.",
  "context": "The Church’s saints and blesseds have lived, served or died in Portugal across many centuries. This open list is not complete.",
  "basis": "GCatholic, Saints and Blesseds of Portugal (41 saints and 56 blesseds): https://gcatholic.org/saints/data/country-PT . Association is based on birthplace and/or death place.",
  "answers": [
    {
      "answer": "Anthony of Padua",
      "tier": 1
    },
    {
      "answer": "Elizabeth of Portugal",
      "tier": 1
    },
    {
      "answer": "Francisco and Jacinta Marto",
      "tier": 1
    },
    {
      "answer": "Nuno Álvares Pereira",
      "tier": 1
    },
    {
      "answer": "John of God",
      "tier": 1
    },
    {
      "answer": "Damasus I",
      "tier": 2
    },
    {
      "answer": "Beatriz da Silva",
      "tier": 2
    },
    {
      "answer": "Alexandrina Maria da Costa",
      "tier": 2
    },
    {
      "answer": "Teotónio of Coimbra",
      "tier": 2
    },
    {
      "answer": "Rita Amada de Jesus",
      "tier": 2
    },
    {
      "answer": "Joana of Portugal",
      "tier": 2
    },
    {
      "answer": "Mafalda of Portugal",
      "tier": 2
    },
    {
      "answer": "Pedro de Rates",
      "tier": 3
    },
    {
      "answer": "Manços de Évora",
      "tier": 3
    },
    {
      "answer": "Ovídio",
      "tier": 3
    },
    {
      "answer": "Librada (Vilgeforte)",
      "tier": 3
    },
    {
      "answer": "Victor de Braga",
      "tier": 3
    },
    {
      "answer": "Ercolano",
      "tier": 3
    },
    {
      "answer": "Taurino",
      "tier": 3
    },
    {
      "answer": "Engracia de Zaragoza",
      "tier": 3
    },
    {
      "answer": "Júlia",
      "tier": 3
    },
    {
      "answer": "Máxima",
      "tier": 3
    },
    {
      "answer": "Veríssimo",
      "tier": 3
    },
    {
      "answer": "Anominata do Alentejo",
      "tier": 3
    },
    {
      "answer": "Comba do Alentejo",
      "tier": 4
    },
    {
      "answer": "Jordão de Évora",
      "tier": 4
    },
    {
      "answer": "Potâmio",
      "tier": 4
    },
    {
      "answer": "Apollonius of Portugal",
      "tier": 4
    },
    {
      "answer": "Leontius of Portugal",
      "tier": 4
    },
    {
      "answer": "Apríngio",
      "tier": 4
    },
    {
      "answer": "Martinho de Dume e Braga",
      "tier": 4
    },
    {
      "answer": "Iria de Tomar",
      "tier": 4
    },
    {
      "answer": "Frutuoso de Dume e Braga",
      "tier": 4
    },
    {
      "answer": "Félix Torcato",
      "tier": 4
    },
    {
      "answer": "Vítor de Braga",
      "tier": 4
    },
    {
      "answer": "Elías de Córdoba",
      "tier": 4
    },
    {
      "answer": "Rosendo",
      "tier": 4
    },
    {
      "answer": "Senhorinha de Basto",
      "tier": 4
    },
    {
      "answer": "Geraldo de Moissac",
      "tier": 4
    },
    {
      "answer": "Gonzalo of Amarante",
      "tier": 5
    },
    {
      "answer": "Sancha de Portugal",
      "tier": 5
    },
    {
      "answer": "Teresa de Portugal",
      "tier": 5
    },
    {
      "answer": "Gil Rodrigues de Valadares",
      "tier": 5
    },
    {
      "answer": "Lorenço de Lisboa",
      "tier": 5
    },
    {
      "answer": "Gonçalo de Lagos",
      "tier": 5
    },
    {
      "answer": "Amadeu of Portugal",
      "tier": 5
    },
    {
      "answer": "Aleixo Delgado",
      "tier": 5
    },
    {
      "answer": "Álvaro Borralho Mendes",
      "tier": 5
    },
    {
      "answer": "Amaro Vaz",
      "tier": 5
    },
    {
      "answer": "André Gonçalves",
      "tier": 5
    },
    {
      "answer": "António Correia",
      "tier": 5
    },
    {
      "answer": "Antônio Fernandes",
      "tier": 5
    },
    {
      "answer": "António Soares",
      "tier": 5
    },
    {
      "answer": "Bento de Castro",
      "tier": 5
    },
    {
      "answer": "Brás Ribeiro",
      "tier": 6
    },
    {
      "answer": "Diogo de Andrade",
      "tier": 6
    },
    {
      "answer": "Diogo Pires Mimoso",
      "tier": 6
    },
    {
      "answer": "Domingos Fernandes",
      "tier": 6
    },
    {
      "answer": "Francisco Alvares",
      "tier": 6
    },
    {
      "answer": "Manuel Fernández-Herba Pereira",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Anthony of Padua",
      "accepted": true
    },
    {
      "guess": "Elizabeth of Portugal",
      "accepted": true
    },
    {
      "guess": "Francisco and Jacinta Marto",
      "accepted": true
    },
    {
      "guess": "Nuno Álvares Pereira",
      "accepted": true
    },
    {
      "guess": "John of God",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A Catholic saint, but not in this country's answer-key sample."
    },
    {
      "guess": "Francis of Assisi",
      "accepted": false,
      "reason": "A Catholic saint, but not in this country's answer-key sample."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A Catholic saint, but not in this country's answer-key sample."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A Catholic saint, but not in this country's answer-key sample."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A Catholic saint, but not in this country's answer-key sample."
    }
  ]
},
{
  "id": "longtail-saints-mexico",
  "theme": "saints",
  "prompt": "Name a saint or blessed associated with Mexico.",
  "context": "Mexico’s saints and blesseds include early missionaries, Indigenous converts, Cristero martyrs, founders and modern witnesses. This open list is not complete.",
  "basis": "GCatholic, Saints and Blesseds of Mexico (35 saints and 26 blesseds): https://gcatholic.org/saints/data/country-MX.htm . Association is based on birthplace and/or death place.",
  "answers": [
    {
      "answer": "Juan Diego Cuauhtlatoatzin",
      "tier": 1
    },
    {
      "answer": "Felipe de Jesús",
      "tier": 1
    },
    {
      "answer": "Sebastián de Aparicio",
      "tier": 1
    },
    {
      "answer": "Rafael Guízar y Valencia",
      "tier": 1
    },
    {
      "answer": "José Luis Sánchez del Río",
      "tier": 1
    },
    {
      "answer": "Cristóbal Magallanes Jara",
      "tier": 2
    },
    {
      "answer": "José María de Yermo y Parres",
      "tier": 2
    },
    {
      "answer": "María Concepción Cabrera de Armida",
      "tier": 2
    },
    {
      "answer": "María de Jesús Sacramentado",
      "tier": 2
    },
    {
      "answer": "María Inés Teresa del Santísimo Sacramento",
      "tier": 2
    },
    {
      "answer": "Moisés Lira Serafín",
      "tier": 2
    },
    {
      "answer": "Miguel Gómez Loza",
      "tier": 2
    },
    {
      "answer": "David Galván Bermúdez",
      "tier": 3
    },
    {
      "answer": "David Roldán Lara",
      "tier": 3
    },
    {
      "answer": "Luis Batis Sáinz",
      "tier": 3
    },
    {
      "answer": "Manuel Morales",
      "tier": 3
    },
    {
      "answer": "Salvador Lara Puente",
      "tier": 3
    },
    {
      "answer": "Agustín Caloca Cortés",
      "tier": 3
    },
    {
      "answer": "David Uribe Velasco",
      "tier": 3
    },
    {
      "answer": "Jenaro Sánchez Delgadillo",
      "tier": 3
    },
    {
      "answer": "José Isabel Flores Varela",
      "tier": 3
    },
    {
      "answer": "José María Robles Hurtado",
      "tier": 3
    },
    {
      "answer": "Julio Álvarez Mendoza",
      "tier": 3
    },
    {
      "answer": "Margarito Flores García",
      "tier": 3
    },
    {
      "answer": "Mateo Correa Magallanes",
      "tier": 4
    },
    {
      "answer": "Miguel de la Mora y de la Mora",
      "tier": 4
    },
    {
      "answer": "Pedro Esqueda Ramírez",
      "tier": 4
    },
    {
      "answer": "Rodrigo Aguilar Alemán",
      "tier": 4
    },
    {
      "answer": "Román Adame Rosales",
      "tier": 4
    },
    {
      "answer": "Sabás Reyes Salazar",
      "tier": 4
    },
    {
      "answer": "Anacleto González Flores",
      "tier": 4
    },
    {
      "answer": "Andrés Solá Molist",
      "tier": 4
    },
    {
      "answer": "Antonio Pérez Larios",
      "tier": 4
    },
    {
      "answer": "Ezequiel Huerta Gutiérrez",
      "tier": 4
    },
    {
      "answer": "Jorge Vargas González",
      "tier": 4
    },
    {
      "answer": "José Ramón Miguel Agustín Pro Juárez",
      "tier": 4
    },
    {
      "answer": "José Trinidad Rangel Montaño",
      "tier": 4
    },
    {
      "answer": "Luis Padilla Gómez",
      "tier": 4
    },
    {
      "answer": "Ramón Vargas González",
      "tier": 4
    },
    {
      "answer": "Salvador Huerta Gutiérrez",
      "tier": 5
    },
    {
      "answer": "Atilano Cruz Alvarado",
      "tier": 5
    },
    {
      "answer": "Jesús Méndez Montoya",
      "tier": 5
    },
    {
      "answer": "Justino Orona Madrigal",
      "tier": 5
    },
    {
      "answer": "Toribio Romo González",
      "tier": 5
    },
    {
      "answer": "Tranquilino Ubiarco Robles",
      "tier": 5
    },
    {
      "answer": "Elías del Socorro",
      "tier": 5
    },
    {
      "answer": "Luis Magaña Servín",
      "tier": 5
    },
    {
      "answer": "Ángel Darío Acosta Zurita",
      "tier": 5
    },
    {
      "answer": "José María Escoto Ruiz",
      "tier": 5
    },
    {
      "answer": "Reginaldo Hernández Ramírez",
      "tier": 5
    },
    {
      "answer": "Pedro de Jesús Maldonado Lucero",
      "tier": 5
    },
    {
      "answer": "María Vicenta de Santa Dorotea",
      "tier": 5
    },
    {
      "answer": "María Guadalupe",
      "tier": 5
    },
    {
      "answer": "María del Carmen",
      "tier": 5
    },
    {
      "answer": "Antonio",
      "tier": 6
    },
    {
      "answer": "Juan",
      "tier": 6
    },
    {
      "answer": "Bartolomé Díaz Laurel",
      "tier": 6
    },
    {
      "answer": "Bartolomé Gutiérrez Rodríguez",
      "tier": 6
    },
    {
      "answer": "Jacinto de los Ángeles",
      "tier": 6
    },
    {
      "answer": "Juan Bautista",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Juan Diego Cuauhtlatoatzin",
      "accepted": true
    },
    {
      "guess": "Felipe de Jesús",
      "accepted": true
    },
    {
      "guess": "Sebastián de Aparicio",
      "accepted": true
    },
    {
      "guess": "Rafael Guízar y Valencia",
      "accepted": true
    },
    {
      "guess": "José Luis Sánchez del Río",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "Francis of Assisi",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    }
  ],
  "reviewFlags": []
},
{
  "id": "longtail-saints-belgium",
  "theme": "saints",
  "prompt": "Name a saint or blessed associated with Belgium.",
  "context": "Belgium’s saints and blesseds include missionaries, bishops, abbesses, martyrs and medieval religious figures. This open list is not complete.",
  "basis": "GCatholic, Saints and Blesseds of Belgium: https://gcatholic.org/saints/data/country-BE.htm . Association is based on birthplace and/or death place.",
  "answers": [
    {
      "answer": "Martin de Tongres",
      "tier": 1
    },
    {
      "answer": "Piat de Tournai",
      "tier": 1
    },
    {
      "answer": "Chrysolius the Armenian",
      "tier": 1
    },
    {
      "answer": "Maternus of Cologne",
      "tier": 1
    },
    {
      "answer": "Servais de Tongres",
      "tier": 1
    },
    {
      "answer": "Bavo of Ghent",
      "tier": 2
    },
    {
      "answer": "Gertrude of Nivelles",
      "tier": 2
    },
    {
      "answer": "Dymphna",
      "tier": 2
    },
    {
      "answer": "Hubert of Liège",
      "tier": 2
    },
    {
      "answer": "Rumoldus of Mechelen",
      "tier": 2
    },
    {
      "answer": "Landelin of Lobbes",
      "tier": 2
    },
    {
      "answer": "Vincent Madelgaire",
      "tier": 2
    },
    {
      "answer": "Agricola of Tongeren",
      "tier": 3
    },
    {
      "answer": "Ursicinus of Tongeren",
      "tier": 3
    },
    {
      "answer": "Designatus",
      "tier": 3
    },
    {
      "answer": "Resignatus",
      "tier": 3
    },
    {
      "answer": "Sulpitius",
      "tier": 3
    },
    {
      "answer": "Quirillus",
      "tier": 3
    },
    {
      "answer": "Eucherius of Maastricht",
      "tier": 3
    },
    {
      "answer": "Falco",
      "tier": 3
    },
    {
      "answer": "Eucharius of Maastricht",
      "tier": 3
    },
    {
      "answer": "Éleuthère de Tournai",
      "tier": 3
    },
    {
      "answer": "Domitien",
      "tier": 3
    },
    {
      "answer": "Helier",
      "tier": 3
    },
    {
      "answer": "Monon",
      "tier": 4
    },
    {
      "answer": "Achaire de Noyon",
      "tier": 4
    },
    {
      "answer": "Monon de Nassogne",
      "tier": 4
    },
    {
      "answer": "Landelin de Lobbes",
      "tier": 4
    },
    {
      "answer": "Foillan",
      "tier": 4
    },
    {
      "answer": "Livinus of Ghent",
      "tier": 4
    },
    {
      "answer": "Éloi de Noyon",
      "tier": 4
    },
    {
      "answer": "Landoaldus of Maastricht",
      "tier": 4
    },
    {
      "answer": "Remacle de Stavelot",
      "tier": 4
    },
    {
      "answer": "Trudo",
      "tier": 4
    },
    {
      "answer": "Bertuin de Malonne",
      "tier": 4
    },
    {
      "answer": "Truiden",
      "tier": 4
    },
    {
      "answer": "Tillo of Solignac",
      "tier": 4
    },
    {
      "answer": "Goedele of Brussels",
      "tier": 4
    },
    {
      "answer": "Ursmer of Lobbes",
      "tier": 4
    },
    {
      "answer": "Bérégise d’Andage",
      "tier": 5
    },
    {
      "answer": "Ermin de Lobbes",
      "tier": 5
    },
    {
      "answer": "Frédegand de Deurne",
      "tier": 5
    },
    {
      "answer": "Eucher d’Orléans",
      "tier": 5
    },
    {
      "answer": "Harlindis of Maaseik",
      "tier": 5
    },
    {
      "answer": "Floribert",
      "tier": 5
    },
    {
      "answer": "Gerulf of Drongen",
      "tier": 5
    },
    {
      "answer": "Relindis of Maaseik",
      "tier": 5
    },
    {
      "answer": "Théodulphe de Lobbes",
      "tier": 5
    },
    {
      "answer": "Dodon de Wallers",
      "tier": 5
    },
    {
      "answer": "Hilduard",
      "tier": 5
    },
    {
      "answer": "Amelberga of Temse",
      "tier": 5
    },
    {
      "answer": "Gummarus of Lier",
      "tier": 5
    },
    {
      "answer": "Hiltrude de Liesse",
      "tier": 5
    },
    {
      "answer": "Theodard of Liège",
      "tier": 5
    },
    {
      "answer": "Amandus of Maastricht",
      "tier": 6
    },
    {
      "answer": "Wiro of Roermond",
      "tier": 6
    },
    {
      "answer": "Plechelmus",
      "tier": 6
    },
    {
      "answer": "Adelbert of Egmond",
      "tier": 6
    },
    {
      "answer": "Lebuinus of Deventer",
      "tier": 6
    },
    {
      "answer": "Radbod of Utrecht",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Martin de Tongres",
      "accepted": true
    },
    {
      "guess": "Piat de Tournai",
      "accepted": true
    },
    {
      "guess": "Chrysolius the Armenian",
      "accepted": true
    },
    {
      "guess": "Maternus of Cologne",
      "accepted": true
    },
    {
      "guess": "Servais de Tongres",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "Francis of Assisi",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    }
  ],
  "reviewFlags": []
},
{
  "id": "longtail-saints-netherlands",
  "theme": "saints",
  "prompt": "Name a saint or blessed associated with the Netherlands.",
  "context": "The Netherlands’ saints and blesseds include early missionaries, bishops, martyrs and modern witnesses. This open list is not complete.",
  "basis": "GCatholic, Saints and Blesseds of the Netherlands: https://gcatholic.org/saints/data/country-NL.htm . Association is based on birthplace and/or death place.",
  "answers": [
    {
      "answer": "Willibrord",
      "tier": 1
    },
    {
      "answer": "Boniface",
      "tier": 1
    },
    {
      "answer": "Peter Canisius",
      "tier": 1
    },
    {
      "answer": "Servais de Tongres",
      "tier": 1
    },
    {
      "answer": "Lambert of Maastricht",
      "tier": 1
    },
    {
      "answer": "Lebuinus of Deventer",
      "tier": 2
    },
    {
      "answer": "Radbod of Utrecht",
      "tier": 2
    },
    {
      "answer": "Ansfried of Utrecht",
      "tier": 2
    },
    {
      "answer": "Bernold of Utrecht",
      "tier": 2
    },
    {
      "answer": "Frederik of Utrecht",
      "tier": 2
    },
    {
      "answer": "Gerlach of Houthem",
      "tier": 2
    },
    {
      "answer": "Lidwina of Schiedam",
      "tier": 2
    },
    {
      "answer": "Monulphe of Maastricht",
      "tier": 3
    },
    {
      "answer": "Benignus of Utrecht",
      "tier": 3
    },
    {
      "answer": "Gondulphe",
      "tier": 3
    },
    {
      "answer": "Perpète de Maastricht",
      "tier": 3
    },
    {
      "answer": "Jean L’Agneau",
      "tier": 3
    },
    {
      "answer": "Remacle of Stavelot",
      "tier": 3
    },
    {
      "answer": "Théodard of Maastricht",
      "tier": 3
    },
    {
      "answer": "Amandus of Maastricht",
      "tier": 3
    },
    {
      "answer": "Wiro of Roermond",
      "tier": 3
    },
    {
      "answer": "Tillo of Solignac",
      "tier": 3
    },
    {
      "answer": "Oda of Scotland",
      "tier": 3
    },
    {
      "answer": "Otger",
      "tier": 3
    },
    {
      "answer": "Plechelmus",
      "tier": 4
    },
    {
      "answer": "Adelbert of Egmond",
      "tier": 4
    },
    {
      "answer": "Adalar of Erfurt",
      "tier": 4
    },
    {
      "answer": "Bosa of York",
      "tier": 4
    },
    {
      "answer": "Eoban of Utrecht",
      "tier": 4
    },
    {
      "answer": "Gundekar",
      "tier": 4
    },
    {
      "answer": "Hamund",
      "tier": 4
    },
    {
      "answer": "Hathawulf",
      "tier": 4
    },
    {
      "answer": "Scirebald",
      "tier": 4
    },
    {
      "answer": "Waccar",
      "tier": 4
    },
    {
      "answer": "Walter of Utrecht",
      "tier": 4
    },
    {
      "answer": "Wintrung",
      "tier": 4
    },
    {
      "answer": "Marcellinus of Deventer",
      "tier": 4
    },
    {
      "answer": "Gregory of Utrecht",
      "tier": 4
    },
    {
      "answer": "Odrada of Alem",
      "tier": 4
    },
    {
      "answer": "Odulfus of Utrecht",
      "tier": 5
    },
    {
      "answer": "Jeroen of Noordwijk",
      "tier": 5
    },
    {
      "answer": "Odwulf of Evesham",
      "tier": 5
    },
    {
      "answer": "Hunger of Utrecht",
      "tier": 5
    },
    {
      "answer": "Gerulf of Drongen",
      "tier": 5
    },
    {
      "answer": "Siard of Friesland",
      "tier": 5
    },
    {
      "answer": "Ida of Louvain",
      "tier": 5
    },
    {
      "answer": "Adrianus of Hilvarenbeek",
      "tier": 5
    },
    {
      "answer": "Andreas Wouters",
      "tier": 5
    },
    {
      "answer": "Antonius van Hoornaar",
      "tier": 5
    },
    {
      "answer": "Antonius van Weert",
      "tier": 5
    },
    {
      "answer": "Cornelius van Wijk",
      "tier": 5
    },
    {
      "answer": "Franciscus de Roye",
      "tier": 5
    },
    {
      "answer": "Godefried of Duynen",
      "tier": 5
    },
    {
      "answer": "Godefried of Melveren",
      "tier": 5
    },
    {
      "answer": "Hieronymus van Weert",
      "tier": 6
    },
    {
      "answer": "Jacobus Lacops",
      "tier": 6
    },
    {
      "answer": "Joannes Lenaerts",
      "tier": 6
    },
    {
      "answer": "Johannes Heer",
      "tier": 6
    },
    {
      "answer": "Leonardus van Veghel",
      "tier": 6
    },
    {
      "answer": "Nicasius Janssen van Heeze",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Willibrord",
      "accepted": true
    },
    {
      "guess": "Boniface",
      "accepted": true
    },
    {
      "guess": "Peter Canisius",
      "accepted": true
    },
    {
      "guess": "Servais de Tongres",
      "accepted": true
    },
    {
      "guess": "Lambert of Maastricht",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "Francis of Assisi",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    }
  ],
  "reviewFlags": []
},
{
  "id": "longtail-saints-england",
  "theme": "saints",
  "prompt": "Name a saint or blessed associated with England.",
  "context": "England’s saints and blesseds include early British Christians, Anglo-Saxon kings, missionaries, abbesses and martyrs. This open list is not complete.",
  "basis": "GCatholic, Saints and Blesseds of England: https://gcatholic.org/saints/data/country-QE.htm . Association is based on birthplace and/or death place.",
  "answers": [
    {
      "answer": "Alban",
      "tier": 1
    },
    {
      "answer": "Augustine of Canterbury",
      "tier": 1
    },
    {
      "answer": "Bede the Venerable",
      "tier": 1
    },
    {
      "answer": "Cuthbert",
      "tier": 1
    },
    {
      "answer": "Etheldreda",
      "tier": 1
    },
    {
      "answer": "Patrick",
      "tier": 2
    },
    {
      "answer": "Aidan of Lindisfarne",
      "tier": 2
    },
    {
      "answer": "Benedict Biscop",
      "tier": 2
    },
    {
      "answer": "Wilfrid",
      "tier": 2
    },
    {
      "answer": "Edmund of East Anglia",
      "tier": 2
    },
    {
      "answer": "Swithun",
      "tier": 2
    },
    {
      "answer": "Margaret of Scotland",
      "tier": 2
    },
    {
      "answer": "Lucius of Britain",
      "tier": 3
    },
    {
      "answer": "Augulus",
      "tier": 3
    },
    {
      "answer": "Aaron of Caerleon",
      "tier": 3
    },
    {
      "answer": "Julius of Caerleon",
      "tier": 3
    },
    {
      "answer": "Gwinear",
      "tier": 3
    },
    {
      "answer": "Illtud",
      "tier": 3
    },
    {
      "answer": "Dyfrig",
      "tier": 3
    },
    {
      "answer": "Petroc",
      "tier": 3
    },
    {
      "answer": "Constantine of Dumnonia",
      "tier": 3
    },
    {
      "answer": "Teilo",
      "tier": 3
    },
    {
      "answer": "Æthelberht of Kent",
      "tier": 3
    },
    {
      "answer": "Laurence of Canterbury",
      "tier": 3
    },
    {
      "answer": "Mellitus of Canterbury",
      "tier": 4
    },
    {
      "answer": "Justus of Canterbury",
      "tier": 4
    },
    {
      "answer": "Malo of Brittany",
      "tier": 4
    },
    {
      "answer": "Oswald of Northumbria",
      "tier": 4
    },
    {
      "answer": "Paulinus of York",
      "tier": 4
    },
    {
      "answer": "Felix of Burgundy",
      "tier": 4
    },
    {
      "answer": "Birinus of Dorchester",
      "tier": 4
    },
    {
      "answer": "Oswine of Deira",
      "tier": 4
    },
    {
      "answer": "Honorius of Canterbury",
      "tier": 4
    },
    {
      "answer": "Ithamar of Rochester",
      "tier": 4
    },
    {
      "answer": "Finan of Lindisfarne",
      "tier": 4
    },
    {
      "answer": "Cedd",
      "tier": 4
    },
    {
      "answer": "Deusdedit of Canterbury",
      "tier": 4
    },
    {
      "answer": "Tudda",
      "tier": 4
    },
    {
      "answer": "Chad of Mercia",
      "tier": 4
    },
    {
      "answer": "Colmán of Lindisfarne",
      "tier": 5
    },
    {
      "answer": "Mildgyth",
      "tier": 5
    },
    {
      "answer": "Kyneburgha",
      "tier": 5
    },
    {
      "answer": "Bega",
      "tier": 5
    },
    {
      "answer": "Eata of Hexham",
      "tier": 5
    },
    {
      "answer": "Æthelburh of Barking",
      "tier": 5
    },
    {
      "answer": "Theodore of Tarsus",
      "tier": 5
    },
    {
      "answer": "Ywi of Lindisfarne",
      "tier": 5
    },
    {
      "answer": "Erkenwald",
      "tier": 5
    },
    {
      "answer": "Sæbbi of Essex",
      "tier": 5
    },
    {
      "answer": "Eadberht of Lindisfarne",
      "tier": 5
    },
    {
      "answer": "Werburgh",
      "tier": 5
    },
    {
      "answer": "Osgyth",
      "tier": 5
    },
    {
      "answer": "Bosa of York",
      "tier": 5
    },
    {
      "answer": "Hædde of Winchester",
      "tier": 5
    },
    {
      "answer": "Aldhelm of Sherborne",
      "tier": 6
    },
    {
      "answer": "Suitbert of Kaiserswerth",
      "tier": 6
    },
    {
      "answer": "Guthlac of Crowland",
      "tier": 6
    },
    {
      "answer": "Hildelith of Barking",
      "tier": 6
    },
    {
      "answer": "Egwin of Evesham",
      "tier": 6
    },
    {
      "answer": "Frithuswith of Oxford",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Alban",
      "accepted": true
    },
    {
      "guess": "Augustine of Canterbury",
      "accepted": true
    },
    {
      "guess": "Bede the Venerable",
      "accepted": true
    },
    {
      "guess": "Cuthbert",
      "accepted": true
    },
    {
      "guess": "Etheldreda",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "Francis of Assisi",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    }
  ],
  "reviewFlags": []
},
{
  "id": "longtail-chinese-martyrs",
  "theme": "saints",
  "prompt": "Name a martyr of China.",
  "context": "The Catholic martyrs of China include Chinese laypeople, priests and religious as well as foreign missionaries. This open list samples the canonized 120 Martyrs of China; it is not complete.",
  "basis": "The named roll of the 120 Martyrs of China, canonized together on 1 October 2000: https://miraculousmiracles.org/martyrs/ . Names follow the published roll; transliteration variants are normalized in aliases where appropriate.",
  "answers": [
    {
      "answer": "Augustine Zhao Rong",
      "tier": 1
    },
    {
      "answer": "Agnes Cao Guiying",
      "tier": 1
    },
    {
      "answer": "John of Triora",
      "tier": 1
    },
    {
      "answer": "Paul Liu Hanzuo",
      "tier": 1
    },
    {
      "answer": "John Gabriel Perboyre",
      "tier": 1
    },
    {
      "answer": "Francis Regis Clet",
      "tier": 2
    },
    {
      "answer": "Peter Sanz",
      "tier": 2
    },
    {
      "answer": "Francis Serrano",
      "tier": 2
    },
    {
      "answer": "Joachim Royo",
      "tier": 2
    },
    {
      "answer": "John Alcober",
      "tier": 2
    },
    {
      "answer": "Francis Diaz",
      "tier": 2
    },
    {
      "answer": "Peter Wu Guosheng",
      "tier": 2
    },
    {
      "answer": "Joseph Zhang Dapeng",
      "tier": 3
    },
    {
      "answer": "Gabriel-Taurin Dufresse",
      "tier": 3
    },
    {
      "answer": "Joseph Yuan",
      "tier": 3
    },
    {
      "answer": "Thaddeus Liu",
      "tier": 3
    },
    {
      "answer": "Peter Liu",
      "tier": 3
    },
    {
      "answer": "Joachim Ho",
      "tier": 3
    },
    {
      "answer": "Auguste Chapdelaine",
      "tier": 3
    },
    {
      "answer": "Lawrence Bai Xiaoman",
      "tier": 3
    },
    {
      "answer": "Jerome Lu Tingmei",
      "tier": 3
    },
    {
      "answer": "Laurence Wang Bing",
      "tier": 3
    },
    {
      "answer": "Agatha Lin",
      "tier": 3
    },
    {
      "answer": "Joseph Zhang Wenlan",
      "tier": 3
    },
    {
      "answer": "Paul Chen Changpin",
      "tier": 4
    },
    {
      "answer": "John Baptist Luo Tingyin",
      "tier": 4
    },
    {
      "answer": "Martha Wang Luo Mande",
      "tier": 4
    },
    {
      "answer": "Jean-Pierre Néel",
      "tier": 4
    },
    {
      "answer": "Martin Wu Xuesheng",
      "tier": 4
    },
    {
      "answer": "John Zhang Tianshen",
      "tier": 4
    },
    {
      "answer": "John Chen Xianheng",
      "tier": 4
    },
    {
      "answer": "Lucy Yi Zhenmei",
      "tier": 4
    },
    {
      "answer": "Gregorio Grassi",
      "tier": 4
    },
    {
      "answer": "Francis Fogolla",
      "tier": 4
    },
    {
      "answer": "Elias Facchini",
      "tier": 4
    },
    {
      "answer": "Théodoric Balat",
      "tier": 4
    },
    {
      "answer": "Andrew Bauer",
      "tier": 4
    },
    {
      "answer": "Anthony Fantosati",
      "tier": 4
    },
    {
      "answer": "Joseph Mary Gambaro",
      "tier": 4
    },
    {
      "answer": "Cesidio Giacomantonio",
      "tier": 5
    },
    {
      "answer": "Mary Hermina of Jesus",
      "tier": 5
    },
    {
      "answer": "Marie de la Paix Giuliani",
      "tier": 5
    },
    {
      "answer": "Maria Chiara Nanetti",
      "tier": 5
    },
    {
      "answer": "Marie of Saint Natalie",
      "tier": 5
    },
    {
      "answer": "Marie of Saint Just",
      "tier": 5
    },
    {
      "answer": "Marie-Adolphine",
      "tier": 5
    },
    {
      "answer": "Mary Amandina",
      "tier": 5
    },
    {
      "answer": "John Zhang Huan",
      "tier": 5
    },
    {
      "answer": "Patrick Dong Bodi",
      "tier": 5
    },
    {
      "answer": "John Wang Rui",
      "tier": 5
    },
    {
      "answer": "Philip Zhang Zhihe",
      "tier": 5
    },
    {
      "answer": "John Zhang Jingguang",
      "tier": 5
    },
    {
      "answer": "Thomas Shen Jihe",
      "tier": 5
    },
    {
      "answer": "Simon Qin Chunfu",
      "tier": 5
    },
    {
      "answer": "Peter Wu Anbang",
      "tier": 6
    },
    {
      "answer": "Chi Zhuzi",
      "tier": 6
    },
    {
      "answer": "Francis Zhang Rong",
      "tier": 6
    },
    {
      "answer": "Matthew Feng De",
      "tier": 6
    },
    {
      "answer": "Peter Zhang Banniu",
      "tier": 6
    },
    {
      "answer": "James Yan Guodong",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Augustine Zhao Rong",
      "accepted": true
    },
    {
      "guess": "Agnes Cao Guiying",
      "accepted": true
    },
    {
      "guess": "John of Triora",
      "accepted": true
    },
    {
      "guess": "Paul Liu Hanzuo",
      "accepted": true
    },
    {
      "guess": "John Gabriel Perboyre",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "Francis of Assisi",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    }
  ],
  "reviewFlags": []
},
{
  "id": "longtail-eucharistic-miracles",
  "theme": "devotion",
  "prompt": "Name a reported Eucharistic miracle.",
  "context": "Reports of extraordinary events associated with the Eucharist appear in Catholic devotional history around the world. This open list samples the Carlo Acutis exhibition catalogue; inclusion in a catalogue does not imply that every report has the same ecclesiastical status.",
  "basis": "Carlo Acutis, “The Eucharistic Miracles of the World” exhibition catalogue, Miracles by Country index: https://www.miracolieucaristici.org/en/Liste/list.html . Answers use the catalogue’s published place-and-date headings, transcribed in concise form.",
  "answers": [
    {
      "answer": "Lanciano, 750",
      "tier": 1
    },
    {
      "answer": "Bolsena, 1264",
      "tier": 1
    },
    {
      "answer": "Buenos Aires, 1992–1996",
      "tier": 1
    },
    {
      "answer": "Santarém, 1247",
      "tier": 1
    },
    {
      "answer": "Sokółka, 2008",
      "tier": 1
    },
    {
      "answer": "Fiecht, 1310",
      "tier": 2
    },
    {
      "answer": "Seefeld, 1384",
      "tier": 2
    },
    {
      "answer": "Weiten-Raxendorf, 1411",
      "tier": 2
    },
    {
      "answer": "Bois-Seigneur-Isaac, 1405",
      "tier": 2
    },
    {
      "answer": "Bruges, 1203",
      "tier": 2
    },
    {
      "answer": "Brussels, 1370",
      "tier": 2
    },
    {
      "answer": "Herentals, 1412",
      "tier": 2
    },
    {
      "answer": "Herkenrode-Hasselt, 1317",
      "tier": 3
    },
    {
      "answer": "Liège, 1374",
      "tier": 3
    },
    {
      "answer": "Tumaco, 1906",
      "tier": 3
    },
    {
      "answer": "Ludbreg, 1411",
      "tier": 3
    },
    {
      "answer": "St. Mary of Egypt, 4th–5th century",
      "tier": 3
    },
    {
      "answer": "Scete, 3rd–5th century",
      "tier": 3
    },
    {
      "answer": "Avignon, 1433",
      "tier": 3
    },
    {
      "answer": "Blanot, 1331",
      "tier": 3
    },
    {
      "answer": "Bordeaux, 1822",
      "tier": 3
    },
    {
      "answer": "Dijon, 1430",
      "tier": 3
    },
    {
      "answer": "Douai, 1254",
      "tier": 3
    },
    {
      "answer": "Faverney, 1608",
      "tier": 3
    },
    {
      "answer": "La Rochelle, 1461",
      "tier": 4
    },
    {
      "answer": "Neuvy-Saint-Sépulcre, 1257",
      "tier": 4
    },
    {
      "answer": "Les Ulmes, 1668",
      "tier": 4
    },
    {
      "answer": "Marseille-en-Beauvais, 1533",
      "tier": 4
    },
    {
      "answer": "Paris, 1290",
      "tier": 4
    },
    {
      "answer": "Pressac, 1643",
      "tier": 4
    },
    {
      "answer": "Augsburg, 1194",
      "tier": 4
    },
    {
      "answer": "Benningen, 1216",
      "tier": 4
    },
    {
      "answer": "Bettbrunn, 1125",
      "tier": 4
    },
    {
      "answer": "Erding, 1417",
      "tier": 4
    },
    {
      "answer": "Kranenburg, 1280",
      "tier": 4
    },
    {
      "answer": "Regensburg, 1255",
      "tier": 4
    },
    {
      "answer": "Walldürn, 1330",
      "tier": 4
    },
    {
      "answer": "Weingarten",
      "tier": 4
    },
    {
      "answer": "Wilsnack, 1383",
      "tier": 4
    },
    {
      "answer": "Chirattakonam, 2001",
      "tier": 5
    },
    {
      "answer": "Morne-Rouge, 1902",
      "tier": 5
    },
    {
      "answer": "Saint-André de la Réunion, 1902",
      "tier": 5
    },
    {
      "answer": "Alatri, 1228",
      "tier": 5
    },
    {
      "answer": "Saint Clare of Assisi, 1240",
      "tier": 5
    },
    {
      "answer": "Asti, 1535",
      "tier": 5
    },
    {
      "answer": "Bagno di Romagna, 1412",
      "tier": 5
    },
    {
      "answer": "Canosio, 1630",
      "tier": 5
    },
    {
      "answer": "Cascia, 1330",
      "tier": 5
    },
    {
      "answer": "Cava dei Tirreni, 1656",
      "tier": 5
    },
    {
      "answer": "Dronero, 1631",
      "tier": 5
    },
    {
      "answer": "San Mauro La Bruca, 1969",
      "tier": 5
    },
    {
      "answer": "Ferrara, 1171",
      "tier": 5
    },
    {
      "answer": "Florence, 1230–1595",
      "tier": 5
    },
    {
      "answer": "Gruaro (Valvasone), 1294",
      "tier": 5
    },
    {
      "answer": "Macerata, 1356",
      "tier": 6
    },
    {
      "answer": "Mogoro, 1604",
      "tier": 6
    },
    {
      "answer": "Morrovalle, 1560",
      "tier": 6
    },
    {
      "answer": "Offida, 1273–1280",
      "tier": 6
    },
    {
      "answer": "Patierno (Naples), 1772",
      "tier": 6
    },
    {
      "answer": "Rimini, 1227",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Lanciano",
      "accepted": true
    },
    {
      "guess": "Bolsena-Orvieto",
      "accepted": true
    },
    {
      "guess": "Santarém",
      "accepted": true
    },
    {
      "guess": "Buenos Aires",
      "accepted": true
    },
    {
      "guess": "Sokółka",
      "accepted": true
    },
    {
      "guess": "Thomas Aquinas",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "Francis of Assisi",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    },
    {
      "guess": "John Vianney",
      "accepted": false,
      "reason": "A valid Catholic figure or term, but not included in this prompt’s source-backed answer sample."
    }
  ],
  "reviewFlags": [
    "The source page describes this as a Church-approved photographic exhibition. This answer key uses the catalogue headings as published; listing does not imply that every historical report has the same level or form of ecclesiastical recognition.",
    "Where the catalogue lists multiple events in one place (Rome or Turin), the individual date is included to distinguish them."
  ]
},
{
  "id": "longtail-saints-austria",
  "theme": "saints",
  "prompt": "Name a saint or blessed associated with Austria.",
  "context": "Austria’s saints and blesseds include early missionaries, bishops, religious, laypeople and modern martyrs. This open list is not complete.",
  "basis": "GCatholic, Saints and Blesseds of Austria (25 saints and 35 blesseds): https://gcatholic.org/saints/data/country-AT . Association is based on birthplace and/or death place.",
  "answers": [
    {
      "answer": "Florian of Lorch",
      "tier": 1
    },
    {
      "answer": "Leopold III of Austria",
      "tier": 1
    },
    {
      "answer": "Peter Canisius",
      "tier": 1
    },
    {
      "answer": "Klemens Maria Hofbauer",
      "tier": 1
    },
    {
      "answer": "Franz Jägerstätter",
      "tier": 1
    },
    {
      "answer": "Romedius",
      "tier": 2
    },
    {
      "answer": "Severinus of Noricum",
      "tier": 2
    },
    {
      "answer": "Erentrudis of Salzburg",
      "tier": 2
    },
    {
      "answer": "Rupert of Salzburg",
      "tier": 2
    },
    {
      "answer": "Coloman of Stockerau",
      "tier": 2
    },
    {
      "answer": "Hemma of Gurk",
      "tier": 2
    },
    {
      "answer": "Maria Restituta",
      "tier": 2
    },
    {
      "answer": "Modestus",
      "tier": 3
    },
    {
      "answer": "Sturmius",
      "tier": 3
    },
    {
      "answer": "Vergilius of Salzburg",
      "tier": 3
    },
    {
      "answer": "Eusebius of Rankweil",
      "tier": 3
    },
    {
      "answer": "Notburga of Rattenberg",
      "tier": 3
    },
    {
      "answer": "Marco d’Aviano",
      "tier": 3
    },
    {
      "answer": "Charles of Austria",
      "tier": 3
    },
    {
      "answer": "László Batthyány-Strattmann",
      "tier": 3
    },
    {
      "answer": "Maria Teresa Ledóchowska",
      "tier": 3
    },
    {
      "answer": "Engelbert Kolland",
      "tier": 3
    },
    {
      "answer": "Jakob Gapp",
      "tier": 3
    },
    {
      "answer": "Otto Neururer",
      "tier": 3
    },
    {
      "answer": "Maximilian von Celeia",
      "tier": 4
    },
    {
      "answer": "Vitale",
      "tier": 4
    },
    {
      "answer": "Giovanni",
      "tier": 4
    },
    {
      "answer": "Chunialdus of Salzburg",
      "tier": 4
    },
    {
      "answer": "Gislarius of Salzburg",
      "tier": 4
    },
    {
      "answer": "Batho of Freising",
      "tier": 4
    },
    {
      "answer": "Berthold von Garsten",
      "tier": 4
    },
    {
      "answer": "Everardo di Hilpolstein-Biburg",
      "tier": 4
    },
    {
      "answer": "Tommaso da Olera",
      "tier": 4
    },
    {
      "answer": "Anton Martin Slomšek",
      "tier": 4
    },
    {
      "answer": "Maria Bárbara da Santíssima Trindade",
      "tier": 4
    },
    {
      "answer": "Jakob (Franz Alexander Kern)",
      "tier": 4
    },
    {
      "answer": "Anton Maria Schwartz",
      "tier": 4
    },
    {
      "answer": "Hildegard Burjan",
      "tier": 4
    },
    {
      "answer": "Maria Ursula of Jesus",
      "tier": 4
    },
    {
      "answer": "Włodzimierz Laskowski",
      "tier": 5
    },
    {
      "answer": "Józef Cebula",
      "tier": 5
    },
    {
      "answer": "Maria Berchmana Johanna",
      "tier": 5
    },
    {
      "answer": "Carl Lampert",
      "tier": 5
    },
    {
      "answer": "Roger Vallée",
      "tier": 5
    },
    {
      "answer": "Bernard Perrin",
      "tier": 5
    },
    {
      "answer": "Gérard-Martin (Gérard Cendrier)",
      "tier": 5
    },
    {
      "answer": "Henri Euzenat",
      "tier": 5
    },
    {
      "answer": "Jean Batiffol",
      "tier": 5
    },
    {
      "answer": "Jean Chavet",
      "tier": 5
    },
    {
      "answer": "Jean Lépicier",
      "tier": 5
    },
    {
      "answer": "Jean Perriolat",
      "tier": 5
    },
    {
      "answer": "Jean Tinturier",
      "tier": 5
    },
    {
      "answer": "Jules Grand",
      "tier": 5
    },
    {
      "answer": "Louis Pourtois",
      "tier": 5
    },
    {
      "answer": "Marcel Callo",
      "tier": 6
    },
    {
      "answer": "Robert Saumont",
      "tier": 6
    },
    {
      "answer": "Roger (Paul Le Ber)",
      "tier": 6
    },
    {
      "answer": "Xavier (André Boucher)",
      "tier": 6
    },
    {
      "answer": "Anton Durcovici",
      "tier": 6
    },
    {
      "answer": "Emmanuel Gómez González",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Florian of Lorch",
      "accepted": true
    },
    {
      "guess": "Leopold III of Austria",
      "accepted": true
    },
    {
      "guess": "Peter Canisius",
      "accepted": true
    },
    {
      "guess": "Klemens Maria Hofbauer",
      "accepted": true
    },
    {
      "guess": "Franz Jägerstätter",
      "accepted": true
    },
    {
      "guess": "Patrick",
      "accepted": false,
      "reason": "A saint associated with Ireland, not listed in the Austria country catalogue."
    },
    {
      "guess": "Francis of Assisi",
      "accepted": false,
      "reason": "An Italian saint, not listed in the Austria country catalogue."
    },
    {
      "guess": "Teresa of Ávila",
      "accepted": false,
      "reason": "A Spanish saint, not listed in the Austria country catalogue."
    },
    {
      "guess": "Joan of Arc",
      "accepted": false,
      "reason": "A French saint, not listed in the Austria country catalogue."
    },
    {
      "guess": "Thomas More",
      "accepted": false,
      "reason": "An English saint, not listed in the Austria country catalogue."
    }
  ],
  "reviewFlags": [
    "The catalogue records birthplace and death place separately; association with Austria can mean either, not necessarily Austrian birth."
  ]
},
{
  "id": "longtail-catholic-calendar",
  "theme": "liturgy",
  "prompt": "Name a celebration on the Catholic liturgical calendar.",
  "context": "The Roman Catholic calendar includes solemnities, feasts and memorials of the Lord, Mary and the saints. This open list samples celebrations across the liturgical year.",
  "basis": "USCCB, Liturgical Year and Calendar; General Roman Calendar in the Roman Missal: https://www.usccb.org/prayer-and-worship/liturgical-year-and-calendar . Entries include solemnities, feasts and memorials; local calendars may add others.",
  "answers": [
    {
      "answer": "Christmas Day",
      "tier": 1
    },
    {
      "answer": "Easter Sunday",
      "tier": 1
    },
    {
      "answer": "Pentecost Sunday",
      "tier": 1
    },
    {
      "answer": "Epiphany of the Lord",
      "tier": 1
    },
    {
      "answer": "All Saints",
      "tier": 1
    },
    {
      "answer": "Assumption of the Blessed Virgin Mary",
      "tier": 2
    },
    {
      "answer": "Immaculate Conception",
      "tier": 2
    },
    {
      "answer": "Corpus Christi",
      "tier": 2
    },
    {
      "answer": "Sacred Heart of Jesus",
      "tier": 2
    },
    {
      "answer": "Palm Sunday of the Passion of the Lord",
      "tier": 2
    },
    {
      "answer": "Good Friday",
      "tier": 2
    },
    {
      "answer": "Holy Thursday (Evening Mass of the Lord’s Supper)",
      "tier": 2
    },
    {
      "answer": "Mary, Mother of God",
      "tier": 3
    },
    {
      "answer": "Presentation of the Lord",
      "tier": 3
    },
    {
      "answer": "Annunciation of the Lord",
      "tier": 3
    },
    {
      "answer": "Nativity of Saint John the Baptist",
      "tier": 3
    },
    {
      "answer": "Saint Joseph, Spouse of the Blessed Virgin Mary",
      "tier": 3
    },
    {
      "answer": "Saints Peter and Paul, Apostles",
      "tier": 3
    },
    {
      "answer": "Transfiguration of the Lord",
      "tier": 3
    },
    {
      "answer": "Exaltation of the Holy Cross",
      "tier": 3
    },
    {
      "answer": "Our Lord Jesus Christ, King of the Universe",
      "tier": 3
    },
    {
      "answer": "Divine Mercy Sunday",
      "tier": 3
    },
    {
      "answer": "Baptism of the Lord",
      "tier": 3
    },
    {
      "answer": "Nativity of the Blessed Virgin Mary",
      "tier": 3
    },
    {
      "answer": "Conversion of Saint Paul",
      "tier": 4
    },
    {
      "answer": "Chair of Saint Peter",
      "tier": 4
    },
    {
      "answer": "Saints Timothy and Titus",
      "tier": 4
    },
    {
      "answer": "Saint Thomas Aquinas",
      "tier": 4
    },
    {
      "answer": "Saint Patrick",
      "tier": 4
    },
    {
      "answer": "Saint Mark, Evangelist",
      "tier": 4
    },
    {
      "answer": "Saint Barnabas, Apostle",
      "tier": 4
    },
    {
      "answer": "Saint Thomas, Apostle",
      "tier": 4
    },
    {
      "answer": "Saint James, Apostle",
      "tier": 4
    },
    {
      "answer": "Saint Lawrence, Deacon and Martyr",
      "tier": 4
    },
    {
      "answer": "Saint Mary Magdalene",
      "tier": 4
    },
    {
      "answer": "Saints Martha, Mary and Lazarus",
      "tier": 4
    },
    {
      "answer": "Saint Monica",
      "tier": 4
    },
    {
      "answer": "Saint Augustine",
      "tier": 4
    },
    {
      "answer": "Saint Gregory the Great",
      "tier": 4
    },
    {
      "answer": "Saint Agnes",
      "tier": 5
    },
    {
      "answer": "Saint Blaise",
      "tier": 5
    },
    {
      "answer": "Saint Scholastica",
      "tier": 5
    },
    {
      "answer": "Saint Polycarp",
      "tier": 5
    },
    {
      "answer": "Saints Perpetua and Felicity",
      "tier": 5
    },
    {
      "answer": "Saint Isidore the Farmer",
      "tier": 5
    },
    {
      "answer": "Saint Athanasius",
      "tier": 5
    },
    {
      "answer": "Saint Bede",
      "tier": 5
    },
    {
      "answer": "Saint Boniface",
      "tier": 5
    },
    {
      "answer": "Saint Anthony of Padua",
      "tier": 5
    },
    {
      "answer": "Saint Irenaeus",
      "tier": 5
    },
    {
      "answer": "Saint Benedict",
      "tier": 5
    },
    {
      "answer": "Saint Bridget of Sweden",
      "tier": 5
    },
    {
      "answer": "Saint Clare of Assisi",
      "tier": 5
    },
    {
      "answer": "Saint Francis of Assisi",
      "tier": 5
    },
    {
      "answer": "Saints Cornelius and Cyprian",
      "tier": 6
    },
    {
      "answer": "Saints Cosmas and Damian",
      "tier": 6
    },
    {
      "answer": "Saint Wenceslaus",
      "tier": 6
    },
    {
      "answer": "Saint Jerome Emiliani",
      "tier": 6
    },
    {
      "answer": "Saint Josaphat",
      "tier": 6
    },
    {
      "answer": "Saint Charles Borromeo",
      "tier": 6
    }
  ],
  "commonGuesses": [
    {
      "guess": "Christmas Day",
      "accepted": true
    },
    {
      "guess": "Easter Sunday",
      "accepted": true
    },
    {
      "guess": "Pentecost Sunday",
      "accepted": true
    },
    {
      "guess": "Epiphany of the Lord",
      "accepted": true
    },
    {
      "guess": "All Saints",
      "accepted": true
    },
    {
      "guess": "The Rosary",
      "accepted": false,
      "reason": "A devotional practice, not a liturgical celebration."
    },
    {
      "guess": "Hail Mary",
      "accepted": false,
      "reason": "A prayer, not a calendar celebration."
    },
    {
      "guess": "Psalm 23",
      "accepted": false,
      "reason": "A biblical psalm, not a calendar celebration."
    },
    {
      "guess": "Stations of the Cross",
      "accepted": false,
      "reason": "A devotional practice, not a calendar celebration."
    },
    {
      "guess": "The Angelus",
      "accepted": false,
      "reason": "A prayer devotion, not a calendar celebration."
    }
  ],
  "reviewFlags": [
    "This is a sample of the General Roman Calendar, not a complete calendar; local and national calendars include additional celebrations."
  ]
}
];
