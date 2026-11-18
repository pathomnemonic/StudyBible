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
      "tier": 5
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
      "tier": 6
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
}
  ,{
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
        "tier": 5
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
        "tier": 5
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
        "tier": 3
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
        "tier": 4
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
  }
  ,{
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
        "answer": "Benito Solana Ruiz",
        "tier": 5
      },
      {
        "answer": "Benvenutus of Gubbio",
        "tier": 4
      },
      {
        "answer": "Bonaventure of Barcelona",
        "tier": 5
      },
      {
        "answer": "Cecilia Schelingová",
        "tier": 3
      },
      {
        "answer": "Dénise Leclerc",
        "tier": 5
      },
      {
        "answer": "Dolores Úrsula Caro Martín",
        "tier": 5
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
        "answer": "Esther Paniagua Alonso",
        "tier": 5
      },
      {
        "answer": "Francisca Pons Sarda",
        "tier": 6
      },
      {
        "answer": "Francisco Gárate Aranguren",
        "tier": 4
      },
      {
        "answer": "Gertrude Prosperi",
        "tier": 5
      },
      {
        "answer": "Hanna Helena Chrzanowska",
        "tier": 2
      },
      {
        "answer": "Ismael Tajadura Marcos",
        "tier": 6
      },
      {
        "answer": "José Olallo Valdés",
        "tier": 3
      },
      {
        "answer": "Josefa Laborra Goyeneche",
        "tier": 5
      },
      {
        "answer": "Josep Tarrats Comaposada",
        "tier": 6
      },
      {
        "answer": "Juan Agustín Codera Marqués",
        "tier": 6
      },
      {
        "answer": "Juan Bautista Egozcuezábal Aldaz",
        "tier": 6
      },
      {
        "answer": "Juliana Kubitzki",
        "tier": 5
      },
      {
        "answer": "Juliana of Mont Cornillon",
        "tier": 3
      },
      {
        "answer": "Leonella Sgorbati",
        "tier": 2
      },
      {
        "answer": "Liduina Meneguzzi",
        "tier": 3
      },
      {
        "answer": "Luczja Heymann",
        "tier": 6
      },
      {
        "answer": "Luigi Maria Monti",
        "tier": 3
      },
      {
        "answer": "Lukarda of Oberweimar",
        "tier": 6
      },
      {
        "answer": "Marguerite Rutan",
        "tier": 3
      },
      {
        "answer": "María Angélica Pérez",
        "tier": 4
      },
      {
        "answer": "María Asunción Mayoral Peña",
        "tier": 6
      },
      {
        "answer": "Maria Christophora Klomfass",
        "tier": 6
      },
      {
        "answer": "Maria Corsini Beltrame Quattrocchi",
        "tier": 3
      },
      {
        "answer": "María Dolores Barroso Villaseñor",
        "tier": 6
      },
      {
        "answer": "Maria Euthymia Üffing",
        "tier": 2
      },
      {
        "answer": "María Isabel López García",
        "tier": 6
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
        "answer": "Maria Troncatti",
        "tier": 2
      },
      {
        "answer": "Marie-Catherine de Saint-Augustin",
        "tier": 4
      },
      {
        "answer": "Martina Vázquez Gordo",
        "tier": 6
      },
      {
        "answer": "Mary of Saint Joseph Alvarado Cardozo",
        "tier": 5
      },
      {
        "answer": "Mary Restituta Kafka",
        "tier": 2
      },
      {
        "answer": "Octavia Iglesias Blanco",
        "tier": 6
      },
      {
        "answer": "Olga Pérez-Monteserín Núñez",
        "tier": 6
      },
      {
        "answer": "Paul-Hélène Saint Raymond",
        "tier": 6
      },
      {
        "answer": "Teuzzo of Razzuolo",
        "tier": 6
      },
      {
        "answer": "Agostina Petrantoni",
        "tier": 2
      },
      {
        "answer": "Bertille",
        "tier": 4
      },
      {
        "answer": "Maria Bertilla Boscardin",
        "tier": 1
      },
      {
        "answer": "María Natividad Venegas de La Torre",
        "tier": 2
      },
      {
        "answer": "Maria Rosa Molas y Vallvé",
        "tier": 3
      },
      {
        "answer": "Martin de Porres",
        "tier": 1
      },
      {
        "answer": "Mary Elizabeth Hesselblad",
        "tier": 2
      },
      {
        "answer": "Michael Kozaki",
        "tier": 5
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
        "answer": "Mary of Egypt",
        "tier": 2
      },
      {
        "answer": "Benedict of Nursia",
        "tier": 1
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
        "answer": "John the Baptist",
        "tier": 1
      },
      {
        "answer": "Jerome",
        "tier": 1
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
        "answer": "Onuphrius",
        "tier": 3
      },
      {
        "answer": "Arsenius the Great",
        "tier": 2
      },
      {
        "answer": "Macarius of Egypt",
        "tier": 2
      },
      {
        "answer": "Pachomius",
        "tier": 2
      },
      {
        "answer": "Moses the Black",
        "tier": 2
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
        "answer": "Alericus",
        "tier": 5
      },
      {
        "answer": "Adalbert of Caramaico",
        "tier": 5
      },
      {
        "answer": "Adam of Cantalupo in Sabina",
        "tier": 6
      },
      {
        "answer": "Adam of San Sabine",
        "tier": 6
      },
      {
        "answer": "Agapios of Vatopedi",
        "tier": 5
      },
      {
        "answer": "Alanus of Sassovivo",
        "tier": 5
      },
      {
        "answer": "Albert of Genoa",
        "tier": 5
      },
      {
        "answer": "Albert of Siena",
        "tier": 5
      },
      {
        "answer": "Alexander of Kouchta",
        "tier": 5
      },
      {
        "answer": "Alruna of Cham",
        "tier": 4
      },
      {
        "answer": "Ammon of Cyprus",
        "tier": 4
      },
      {
        "answer": "Andrea Caccioli",
        "tier": 5
      },
      {
        "answer": "Andrew of Segni",
        "tier": 4
      },
      {
        "answer": "Angela of Bohemia",
        "tier": 5
      },
      {
        "answer": "Angelo of Acquapagana",
        "tier": 6
      },
      {
        "answer": "Angelus of Foligno",
        "tier": 5
      },
      {
        "answer": "Angelus of Furci",
        "tier": 5
      },
      {
        "answer": "Angelus of Gualdo Tadino",
        "tier": 6
      },
      {
        "answer": "Angelus Sinesius",
        "tier": 6
      },
      {
        "answer": "Anselmo",
        "tier": 5
      },
      {
        "answer": "Anthony Manzi",
        "tier": 6
      },
      {
        "answer": "Antimo of Urbino",
        "tier": 5
      },
      {
        "answer": "Archan of Etting",
        "tier": 6
      },
      {
        "answer": "Augustine Novello",
        "tier": 3
      },
      {
        "answer": "Bartolomeo of Simeri",
        "tier": 5
      },
      {
        "answer": "Bellatanus of Perugia",
        "tier": 6
      },
      {
        "answer": "Benedict Revelli",
        "tier": 5
      },
      {
        "answer": "Benedict Ricasoli",
        "tier": 5
      },
      {
        "answer": "Benigno of Vallumbrosa",
        "tier": 5
      },
      {
        "answer": "Benincasa of Montepulciano",
        "tier": 6
      },
      {
        "answer": "Benno of Metz",
        "tier": 5
      },
      {
        "answer": "Bernard of Sithiu",
        "tier": 6
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
        "answer": "Bertrada of Saint Gallen",
        "tier": 6
      },
      {
        "answer": "Bodard of Poitiers",
        "tier": 6
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
  }
  ,{
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
        "tier": 5
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
  }
];