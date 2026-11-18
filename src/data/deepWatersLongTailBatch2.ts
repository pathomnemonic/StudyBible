import type { DeepPrompt } from './deepWaters';

type ReviewedPrompt = DeepPrompt & { commonGuesses: { guess: string; accepted: boolean; reason?: string }[]; reviewFlags?: string[] };

/** Hand-curated from GCatholic's Apostolic Constitutions catalogue. */
export const LONG_TAIL_BATCH_2_PROMPTS: ReviewedPrompt[] = [
  {
    "id": "longtail-apostolic-constitutions",
    "theme": "church-history",
    "prompt": "Name a papal apostolic constitution.",
    "context": "Apostolic constitutions are formal papal documents. This open list samples titles catalogued in the Apostolic Constitutions section of GCatholic.",
    "basis": "Source list: GCatholic, Documents by Type → Apostolic Constitutions (65 catalogue entries): https://gcatholic.org/documents/data/type-PAC . Titles are retained in their published Latin or commonly used form.",
    "answers": [
      {
        "answer": "Pastor Bonus",
        "tier": 1
      },
      {
        "answer": "Universi Dominici Gregis",
        "tier": 1
      },
      {
        "answer": "Fidei Depositum",
        "tier": 1
      },
      {
        "answer": "Anglicanorum Coetibus",
        "tier": 2
      },
      {
        "answer": "Ex Corde Ecclesiae",
        "tier": 2
      },
      {
        "answer": "Sacrae Disciplinae Leges",
        "tier": 2
      },
      {
        "answer": "Munificentissimus Deus",
        "tier": 2
      },
      {
        "answer": "Veritatis Gaudium",
        "tier": 2
      },
      {
        "answer": "Praedicate Evangelium",
        "tier": 2,
        "aliases": [
          "Predicate Evangelium"
        ]
      },
      {
        "answer": "Ecclesia in Urbe",
        "tier": 3
      },
      {
        "answer": "Divinus Perfectionis Magister",
        "tier": 1
      },
      {
        "answer": "Sacri Canones",
        "tier": 2
      },
      {
        "answer": "Sapientia Christiana",
        "tier": 3
      },
      {
        "answer": "Scripturarum Thesaurus",
        "tier": 3
      },
      {
        "answer": "Romano Pontifici Eligendo",
        "tier": 1
      },
      {
        "answer": "Sacram Unctionem Infirmorum",
        "tier": 3
      },
      {
        "answer": "Divinae Consortium Naturae",
        "tier": 3
      },
      {
        "answer": "Indulgentiarum Doctrina",
        "tier": 3
      },
      {
        "answer": "Quo Primum",
        "tier": 3
      },
      {
        "answer": "Immensa",
        "tier": 3
      },
      {
        "answer": "In Nomine Domini",
        "tier": 3
      },
      {
        "answer": "Pascite Gregem Dei",
        "tier": 4
      },
      {
        "answer": "Episcopalis Communio",
        "tier": 4
      },
      {
        "answer": "Vultum Dei Quaerere",
        "tier": 4
      },
      {
        "answer": "Spirituali Militum Curae",
        "tier": 4
      },
      {
        "answer": "Ut Sit",
        "tier": 4
      },
      {
        "answer": "Magnum Matrimonii Sacramentum",
        "tier": 3
      },
      {
        "answer": "Laudis Canticum",
        "tier": 3
      },
      {
        "answer": "Pontificalis Romani Recognitio",
        "tier": 3
      },
      {
        "answer": "Regimini Ecclesiae Universae",
        "tier": 4
      },
      {
        "answer": "Paenitemini",
        "tier": 4
      },
      {
        "answer": "Veterum Sapientia",
        "tier": 4
      },
      {
        "answer": "Humanae Salutis",
        "tier": 4
      },
      {
        "answer": "Sponsa Christi",
        "tier": 4
      },
      {
        "answer": "Provida Mater Ecclesia",
        "tier": 4
      },
      {
        "answer": "Deus Scientiarum Dominus",
        "tier": 4
      },
      {
        "answer": "Sapienti Consilio",
        "tier": 4
      },
      {
        "answer": "Vacante Sede Apostolica",
        "tier": 4
      },
      {
        "answer": "Ineffabilis Deus",
        "tier": 4
      },
      {
        "answer": "Providas Romanorum",
        "tier": 5
      },
      {
        "answer": "In Ecclesiarum Communione",
        "tier": 5
      },
      {
        "answer": "Constans Nobis",
        "tier": 5
      },
      {
        "answer": "Mirificus Eventus",
        "tier": 5
      },
      {
        "answer": "Sollicitudo Omnium Ecclesiarum",
        "tier": 5
      },
      {
        "answer": "Bis Saeculari Die",
        "tier": 5
      },
      {
        "answer": "Vacantis Apostolicae Sedis",
        "tier": 5
      },
      {
        "answer": "Servatoris Iesu Christi",
        "tier": 5
      },
      {
        "answer": "Suburbicariae Sabinae",
        "tier": 6
      },
      {
        "answer": "Etsi Nos In",
        "tier": 6
      },
      {
        "answer": "Commisum Nobis",
        "tier": 6
      },
      {
        "answer": "Reversurus",
        "tier": 6
      },
      {
        "answer": "Nelle Istituzioni",
        "tier": 5
      },
      {
        "answer": "Nei Giorni",
        "tier": 5
      },
      {
        "answer": "In Supremo Apostolatus",
        "tier": 5
      },
      {
        "answer": "Religiosa",
        "tier": 5
      },
      {
        "answer": "Postquam",
        "tier": 5
      },
      {
        "answer": "Alias Nos",
        "tier": 5
      },
      {
        "answer": "Licet ab Initio",
        "tier": 5
      },
      {
        "answer": "Establishment of an Apostolic Nunciature in South Sudan",
        "tier": 6
      },
      {
        "answer": "Instituting the Episcopal Hierarchy in China",
        "tier": 6
      }
    ],
    "commonGuesses": [
      {
        "guess": "Pastor Bonus",
        "accepted": true
      },
      {
        "guess": "Universi Dominici Gregis",
        "accepted": true
      },
      {
        "guess": "Ex Corde Ecclesiae",
        "accepted": true
      },
      {
        "guess": "Anglicanorum Coetibus",
        "accepted": true
      },
      {
        "guess": "Fidei Depositum",
        "accepted": true
      },
      {
        "guess": "Laudato Si’",
        "accepted": false,
        "reason": "An encyclical, not an apostolic constitution."
      },
      {
        "guess": "Evangelii Gaudium",
        "accepted": false,
        "reason": "An apostolic exhortation, not a constitution."
      },
      {
        "guess": "Dei Verbum",
        "accepted": false,
        "reason": "A Vatican II dogmatic constitution promulgated by an ecumenical council, not a papal apostolic constitution."
      },
      {
        "guess": "Lumen Gentium",
        "accepted": false,
        "reason": "A Vatican II dogmatic constitution promulgated by an ecumenical council, not a papal apostolic constitution."
      },
      {
        "guess": "Rerum Novarum",
        "accepted": false,
        "reason": "An encyclical."
      }
    ],
    "reviewFlags": [
      "The source catalogue includes a small number of entries whose English descriptive titles are used instead of a distinct Latin incipit.",
      "The two English descriptive titles at the end are listed as entries in the source catalogue; review their canonical title formatting before release."
    ]
  }
  ,{
  "id": "longtail-motu-proprio",
  "theme": "church-history",
  "prompt": "Name a papal motu proprio.",
  "context": "A motu proprio is a papal act issued on the pope’s own initiative. This open answer bank samples records explicitly catalogued under Motu Proprio; it is not a complete list.",
  "basis": "GCatholic, Documents by Type → Motu Proprio (232 catalogue entries): https://gcatholic.org/documents/data/type-PMP . Titles are transcribed or carefully shortened from catalogue headings; duplicate headings are listed only once.",
  "answers": [
    {
      "answer": "Amending Canons 106 and 126 of the Codex Canonum Ecclesiarum Orientalium",
      "tier": 1
    },
    {
      "answer": "Confirma fratres tuos",
      "tier": 2
    },
    {
      "answer": "Regulations for the Staff of the Roman Curia",
      "tier": 5
    },
    {
      "answer": "General Regulations of the Roman Curia",
      "tier": 5
    },
    {
      "answer": "On the Composition and Presidency of the Pontifical Commission for Vatican City State",
      "tier": 6
    },
    {
      "answer": "Immota manet",
      "tier": 3
    },
    {
      "answer": "Coniuncta cura",
      "tier": 6
    },
    {
      "answer": "Statutes of the Pontifical Committee for World Children’s Day",
      "tier": 6
    },
    {
      "answer": "On the distribution of the territory of the Diocese of Rome",
      "tier": 6
    },
    {
      "answer": "Statutes of the Pope’s Worldwide Prayer Network Vatican Foundation",
      "tier": 6
    },
    {
      "answer": "Fratello Sole",
      "tier": 6
    },
    {
      "answer": "Granting the liturgical cult of Brother Guy de Montpellier",
      "tier": 5
    },
    {
      "answer": "Amending the law on the judicial order and provisions for ordinary magistrates",
      "tier": 6
    },
    {
      "answer": "Munus Tribunalis",
      "tier": 6
    },
    {
      "answer": "Decree on the publication of regulatory measures in the Vatican City State",
      "tier": 6
    },
    {
      "answer": "On the limits and modalities of ordinary administration",
      "tier": 6
    },
    {
      "answer": "Modifying the Motu Proprio on transparency, control and competition in public contracts",
      "tier": 6
    },
    {
      "answer": "Ad theologiam promovendam",
      "tier": 4
    },
    {
      "answer": "Decree appointing the Pontifical Delegate to the Pontifical Urbanian University",
      "tier": 6
    },
    {
      "answer": "Modifying Canons 295–296 regarding Personal Prelatures",
      "tier": 5
    },
    {
      "answer": "Decree of Appointment of the members of the Higher Coordination Council of the Pontifical Lateran University",
      "tier": 6
    },
    {
      "answer": "On entities for formation to the Priesthood in the Diocese of Rome",
      "tier": 6
    },
    {
      "answer": "Iam Pridem",
      "tier": 5
    },
    {
      "answer": "Amending the penal law and judicial system of the Vatican City State",
      "tier": 6
    },
    {
      "answer": "Modifying the terms of recourse of a member dismissed from an Institute of Consecrated Life",
      "tier": 6
    },
    {
      "answer": "Vos estis lux mundi",
      "tier": 2
    },
    {
      "answer": "Vocare peccatores",
      "tier": 6
    },
    {
      "answer": "Il Diritto Nativo",
      "tier": 6
    },
    {
      "answer": "Regulation of the Independent Supervisory Commission of the Vicariate of Rome",
      "tier": 6
    },
    {
      "answer": "Decree for the assignment of sectors and pastoral services to the Auxiliary Bishops of Rome",
      "tier": 6
    },
    {
      "answer": "On the instrumental juridical persons of the Roman Curia",
      "tier": 6
    },
    {
      "answer": "On Caritas Internationalis",
      "tier": 5
    },
    {
      "answer": "Decree for the Sovereign Military Hospitaller Order of Saint John of Jerusalem of Rhodes and of Malta",
      "tier": 6
    },
    {
      "answer": "Decree on the full legal representation of the Second Section of the Dicastery for Evangelisation",
      "tier": 6
    },
    {
      "answer": "Ad charisma tuendum",
      "tier": 3
    },
    {
      "answer": "Recognitum Librum VI",
      "tier": 5
    },
    {
      "answer": "Assegnare alcune competenze",
      "tier": 5
    },
    {
      "answer": "Fidem servare",
      "tier": 5
    },
    {
      "answer": "Establishing the Pontifical Commission for the Verification and Application of Mitis Iudex",
      "tier": 6
    },
    {
      "answer": "Traditionis custodes",
      "tier": 1
    },
    {
      "answer": "Antiquum ministerium",
      "tier": 3
    },
    {
      "answer": "Amending the jurisdiction of the judicial bodies of Vatican City State",
      "tier": 6
    },
    {
      "answer": "On provisions regarding transparency in the management of public finances",
      "tier": 6
    },
    {
      "answer": "On the containment of expenditures for employees of the Holy See",
      "tier": 6
    },
    {
      "answer": "On amendments in matters of justice",
      "tier": 6
    },
    {
      "answer": "Spiritus Domini",
      "tier": 3
    },
    {
      "answer": "On certain competencies in economic-financial matters",
      "tier": 6
    },
    {
      "answer": "Ab initio",
      "tier": 5
    },
    {
      "answer": "Authenticum charismatis",
      "tier": 5
    },
    {
      "answer": "On transparency, control and competition in procedures for public contracts",
      "tier": 6
    },
    {
      "answer": "Law CCCLI on the Judicial System of Vatican City State",
      "tier": 6
    },
    {
      "answer": "Regarding the Office of Dean of the College of Cardinals",
      "tier": 6
    },
    {
      "answer": "L’esperienza storica",
      "tier": 6
    },
    {
      "answer": "Aperuit illis",
      "tier": 2
    },
    {
      "answer": "On the protection of minors and vulnerable persons",
      "tier": 5
    },
    {
      "answer": "Communis Vita",
      "tier": 4
    },
    {
      "answer": "Regarding the Pontifical Commission Ecclesia Dei",
      "tier": 5
    },
    {
      "answer": "Law CCLXXIV on the government of the Vatican City State",
      "tier": 6
    },
    {
      "answer": "Imparare a congedarsi",
      "tier": 5
    },
    {
      "answer": "Magnum Principium",
      "tier": 2
    }
  ],
  "commonGuesses": [
    {
      "guess": "Traditionis custodes",
      "accepted": true
    },
    {
      "guess": "Vos estis lux mundi",
      "accepted": true
    },
    {
      "guess": "Summorum Pontificum",
      "accepted": true
    },
    {
      "guess": "Mitis Iudex Dominus Iesus",
      "accepted": true
    },
    {
      "guess": "Antiquum ministerium",
      "accepted": true
    },
    {
      "guess": "Laudato si’",
      "accepted": false,
      "reason": "An encyclical, not a motu proprio."
    },
    {
      "guess": "Evangelii gaudium",
      "accepted": false,
      "reason": "An apostolic exhortation, not a motu proprio."
    },
    {
      "guess": "Pastor Bonus",
      "accepted": false,
      "reason": "An apostolic constitution."
    },
    {
      "guess": "Rosarium Virginis Mariæ",
      "accepted": false,
      "reason": "An apostolic letter."
    },
    {
      "guess": "Dei Verbum",
      "accepted": false,
      "reason": "A Vatican II dogmatic constitution."
    }
  ],
  "reviewFlags": [
    "The GCatholic catalogue includes both Latin incipit titles and descriptive English titles; the latter are preserved as catalogue headings.",
    "Several English titles are lightly shortened for readability; the catalogue page is the authority for inclusion."
  ]
}
  ,{
    "id": "longtail-apostolic-letters",
    "theme": "church-history",
    "prompt": "Name a papal apostolic letter.",
    "context": "Apostolic letters are a distinct category of papal document. This open list samples Latin incipits and titles catalogued as apostolic letters; it is not exhaustive.",
    "basis": "GCatholic, Documents by Type → Apostolic Letters (155 catalogue entries): https://gcatholic.org/documents/data/type-PAL . Titles are retained as listed; duplicate records and entries whose type is unclear are excluded.",
    "answers": [
      {
        "answer": "Rosarium Virginis Mariæ",
        "tier": 1
      },
      {
        "answer": "Novo millennio ineunte",
        "tier": 1
      },
      {
        "answer": "Mane nobiscum Domine",
        "tier": 2
      },
      {
        "answer": "Mulieris dignitatem",
        "tier": 2
      },
      {
        "answer": "Orientale lumen",
        "tier": 2
      },
      {
        "answer": "Tertio millennio adveniente",
        "tier": 2
      },
      {
        "answer": "Ordinatio sacerdotalis",
        "tier": 2
      },
      {
        "answer": "Dies Domini",
        "tier": 2
      },
      {
        "answer": "Divini amoris scientia",
        "tier": 3
      },
      {
        "answer": "Lætamur magnopere",
        "tier": 3
      },
      {
        "answer": "Operosam diem",
        "tier": 3
      },
      {
        "answer": "Vicesimus quintus annus",
        "tier": 3
      },
      {
        "answer": "Euntes in mundum universum",
        "tier": 3
      },
      {
        "answer": "Duodecimum sæculum",
        "tier": 3
      },
      {
        "answer": "Spiritus Domini",
        "tier": 3
      },
      {
        "answer": "Augustinum Hipponensem",
        "tier": 3
      },
      {
        "answer": "Dilecti amici",
        "tier": 3
      },
      {
        "answer": "Redemptionis anno",
        "tier": 3
      },
      {
        "answer": "Salvifici doloris",
        "tier": 3
      },
      {
        "answer": "Egregiæ Virtutis",
        "tier": 3
      },
      {
        "answer": "Sanctorum altrix",
        "tier": 3
      },
      {
        "answer": "Patres Ecclesiæ",
        "tier": 3
      },
      {
        "answer": "Rutilans agmen",
        "tier": 4
      },
      {
        "answer": "Lumen ecclesiæ",
        "tier": 4
      },
      {
        "answer": "Amoris officio",
        "tier": 4
      },
      {
        "answer": "Octogesima adveniens",
        "tier": 4
      },
      {
        "answer": "Africæ terrarum",
        "tier": 4
      },
      {
        "answer": "Sacrificium laudis",
        "tier": 4
      },
      {
        "answer": "In Spiritu Sancto",
        "tier": 4
      },
      {
        "answer": "Ambulate in dilectione",
        "tier": 4
      },
      {
        "answer": "Investigabiles divitias Christi",
        "tier": 4
      },
      {
        "answer": "Pacis nuntius",
        "tier": 4
      },
      {
        "answer": "Summi Dei Verbum",
        "tier": 4
      },
      {
        "answer": "Œcumenicum Concilium",
        "tier": 4
      },
      {
        "answer": "Inde a primis",
        "tier": 4
      },
      {
        "answer": "Dum mærenti animo",
        "tier": 5
      },
      {
        "answer": "Sacro vergente anno",
        "tier": 5
      },
      {
        "answer": "Veritatem facientes",
        "tier": 5
      },
      {
        "answer": "Cupimus Imprimis",
        "tier": 5
      },
      {
        "answer": "Impensiore caritate",
        "tier": 5
      },
      {
        "answer": "Nosti profecto",
        "tier": 5
      },
      {
        "answer": "Suavis agitata",
        "tier": 5
      },
      {
        "answer": "Commissum nobis",
        "tier": 5
      },
      {
        "answer": "Prædecessor noster",
        "tier": 5
      },
      {
        "answer": "Monasterii Sanctæ Mariæ",
        "tier": 5
      },
      {
        "answer": "Sagiensis diœcesis",
        "tier": 5
      },
      {
        "answer": "Leodiensis diœcesis",
        "tier": 5
      },
      {
        "answer": "Providentia opportuna",
        "tier": 5
      },
      {
        "answer": "Inter præstantiores",
        "tier": 5
      },
      {
        "answer": "Ex hac",
        "tier": 5
      },
      {
        "answer": "Per similes",
        "tier": 6
      },
      {
        "answer": "Quum ex Apostolico",
        "tier": 6
      },
      {
        "answer": "Cum tu",
        "tier": 6
      },
      {
        "answer": "Decessor Noster",
        "tier": 6
      },
      {
        "answer": "Dilectus filius",
        "tier": 6
      },
      {
        "answer": "Friburgensis archidiœcesis",
        "tier": 6
      },
      {
        "answer": "Singulare Illud",
        "tier": 5
      },
      {
        "answer": "Paterna Sane",
        "tier": 5
      },
      {
        "answer": "Christi nomen",
        "tier": 5
      },
      {
        "answer": "Bibliorum scientiam",
        "tier": 5
      }
    ],
    "commonGuesses": [
      {
        "guess": "Rosarium Virginis Mariæ",
        "accepted": true
      },
      {
        "guess": "Novo millennio ineunte",
        "accepted": true
      },
      {
        "guess": "Mulieris dignitatem",
        "accepted": true
      },
      {
        "guess": "Dies Domini",
        "accepted": true
      },
      {
        "guess": "Ordinatio sacerdotalis",
        "accepted": true
      },
      {
        "guess": "Evangelium vitae",
        "accepted": false,
        "reason": "An encyclical, not an apostolic letter."
      },
      {
        "guess": "Fides et ratio",
        "accepted": false,
        "reason": "An encyclical, not an apostolic letter."
      },
      {
        "guess": "Pastor Bonus",
        "accepted": false,
        "reason": "An apostolic constitution."
      },
      {
        "guess": "Summorum Pontificum",
        "accepted": false,
        "reason": "A motu proprio."
      },
      {
        "guess": "Dei Verbum",
        "accepted": false,
        "reason": "A Vatican II dogmatic constitution."
      }
    ],
    "reviewFlags": [
      "Several older entries are short Latin legal incipits; retain catalogue spellings and diacritics.",
      "Some modern apostolic letters are descriptive English titles; only the title field shown in the source is used."
    ]
  }
];