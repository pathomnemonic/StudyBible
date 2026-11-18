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
];
