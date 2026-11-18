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
  ,{
    "id": "longtail-curial-decrees",
    "theme": "church-history",
    "prompt": "Name a decree issued by a Roman Curia dicastery or office.",
    "context": "The Roman Curia publishes decrees on liturgy, indulgences, ecclesiastical governance and other matters. This open list samples the source catalogue and is not exhaustive.",
    "basis": "GCatholic, Documents by Type → Decrees from the Roman Curia (132 catalogue entries): https://gcatholic.org/documents/data/type-CDC . Titles are transcribed from catalogue headings; recurring observances are dated to distinguish entries.",
    "answers": [
      {
        "answer": "On the excommunication of the bishops of the Priestly Fraternity of Saint Pius X",
        "tier": 1
      },
      {
        "answer": "Rescript on the establishment of the Interdicastery Commission on Artificial Intelligence",
        "tier": 6
      },
      {
        "answer": "Special Jubilee Year for the 8th centenary of the death of Saint Francis of Assisi",
        "tier": 3
      },
      {
        "answer": "Rescript on placing the Pontifical Committee for the World Day of Children within the Dicastery for Laity, Family and Life",
        "tier": 6
      },
      {
        "answer": "Regulation for the implementation of Per meglio armonizzare",
        "tier": 6
      },
      {
        "answer": "Rescript on provisions regarding family benefits",
        "tier": 6
      },
      {
        "answer": "On the Formulary and Biblical Readings for the Mass for the Care of Creation",
        "tier": 5
      },
      {
        "answer": "On the discipline of Mass Intentions",
        "tier": 4
      },
      {
        "answer": "Inscribing the Optional Memorial of St. Teresa of Calcutta in the General Roman Calendar",
        "tier": 2
      },
      {
        "answer": "Granting of the Indulgence for World Day for Grandparents and the Elderly (2024)",
        "tier": 4
      },
      {
        "answer": "Declaration of excommunication of Archbishop Carlo Maria Viganò",
        "tier": 3
      },
      {
        "answer": "Rescript on the Transitional Norms of the Chapter of the Papal Basilica of Saint Peter",
        "tier": 6
      },
      {
        "answer": "Indulgences conceded for the Ordinary Jubilee Year 2025",
        "tier": 2
      },
      {
        "answer": "Rescript on the Canons and Coadjutor Canons of Saint Mary Major",
        "tier": 6
      },
      {
        "answer": "Indulgences conceded for the National Eucharistic Pilgrimage and National Eucharistic Congress in USA",
        "tier": 4
      },
      {
        "answer": "Derogation from Articles 15 and 65 of Regolamento proprio",
        "tier": 6
      },
      {
        "answer": "Indulgences conceded for World Day for Grandparents and the Elderly (2023)",
        "tier": 4
      },
      {
        "answer": "Rescript on the duties of the Office of the Auditor General",
        "tier": 6
      },
      {
        "answer": "On readings for Mass ad postulandam continentiam",
        "tier": 6
      },
      {
        "answer": "Rescript on the implementation of Traditionis custodes",
        "tier": 3
      },
      {
        "answer": "Rescript on the transfer of competence of the pastoral care of tourism",
        "tier": 6
      },
      {
        "answer": "Rescript on the regulation of the Control Commission for the renewal of the Pontifical Swiss Guard barracks",
        "tier": 6
      },
      {
        "answer": "Rescript on the administration and management of financial activities and liquidity",
        "tier": 6
      },
      {
        "answer": "Rescript for the offices of adjunct secretaries in the Second Section of the Dicastery for Evangelisation",
        "tier": 6
      },
      {
        "answer": "Rescript on the erection of public associations of the faithful",
        "tier": 5
      },
      {
        "answer": "Indulgences conceded for World Day for Grandparents and the Elderly (2022)",
        "tier": 5
      },
      {
        "answer": "Rescript allowing the conferment of the office of Major Superior to a non-clerical member",
        "tier": 6
      },
      {
        "answer": "On the office of the President and Vice-President of Episcopal Conferences",
        "tier": 5
      },
      {
        "answer": "Plenary Indulgences for the deceased faithful",
        "tier": 4
      },
      {
        "answer": "Giving effect to the dispositions of canon 838 of the Code of Canon Law",
        "tier": 5
      },
      {
        "answer": "Requiring all visitors to the Vatican to have COVID Green Pass",
        "tier": 6
      },
      {
        "answer": "On the regulations for the implementation of the Motu Proprio dated 19 May 2020",
        "tier": 6
      },
      {
        "answer": "On international associations of the faithful",
        "tier": 4
      },
      {
        "answer": "Restricting the private celebration of the Holy Mass in St. Peter’s Basilica",
        "tier": 4
      },
      {
        "answer": "On the celebration of Saints Martha, Mary and Lazarus in the General Roman Calendar",
        "tier": 3
      },
      {
        "answer": "Inscribing the Optional Memorials of Sts. Gregory of Narek, John de Avila and Hildegard of Bingen",
        "tier": 4
      },
      {
        "answer": "Permitting priests to say four Masses on Christmas, Mary Mother of God and Epiphany",
        "tier": 5
      },
      {
        "answer": "For the celebration of Triduum in time of Covid-19",
        "tier": 4
      },
      {
        "answer": "Granting of special Indulgences to the faithful in the current pandemic",
        "tier": 3
      },
      {
        "answer": "Cum sanctissima",
        "tier": 3
      },
      {
        "answer": "Quo magis",
        "tier": 3
      },
      {
        "answer": "Inscribing the Optional Memorial of the Blessed Virgin Mary of Loreto in the General Roman Calendar",
        "tier": 4
      },
      {
        "answer": "Inscribing the Optional Memorial of St. Paul VI in the General Roman Calendar",
        "tier": 3
      },
      {
        "answer": "Indulgences conceded for the World Meeting of Families 2018",
        "tier": 4
      },
      {
        "answer": "Lætitiæ plena",
        "tier": 5
      },
      {
        "answer": "Indulgences conceded for the Jubilee Year of St. Aloysius Gonzaga",
        "tier": 5
      },
      {
        "answer": "Allowing the celebration of a votive Mass of the Immaculate Heart on 13 May 2017",
        "tier": 5
      },
      {
        "answer": "The Gift of the Priestly Vocation",
        "tier": 2
      },
      {
        "answer": "Resurrectionis Dominicæ",
        "tier": 3
      },
      {
        "answer": "Rescript on the changes to the statutes of Financial Security Committee",
        "tier": 6
      },
      {
        "answer": "Rite of Washing of Feet",
        "tier": 3
      },
      {
        "answer": "Rescript establishing the Pontifical Commission for the Activities of the Health Sector of Public Jurists of the Church",
        "tier": 6
      },
      {
        "answer": "Indulgences conceded for the Year of Consecrated Life",
        "tier": 4
      },
      {
        "answer": "Inscribing the Optional Memorials of Sts. John XXIII and John Paul II in the General Roman Calendar",
        "tier": 3
      },
      {
        "answer": "Indulgences conceded for the 28th World Youth Day",
        "tier": 4
      },
      {
        "answer": "Paternas vices",
        "tier": 3
      },
      {
        "answer": "Special Indulgences conceded for the 21st World Day of the Sick",
        "tier": 4
      },
      {
        "answer": "Indulgences for the Year of Faith",
        "tier": 3
      },
      {
        "answer": "Granting a Plenary Indulgence for the 7th World Meeting of Families",
        "tier": 4
      },
      {
        "answer": "Erection of the Personal Ordinariate of the Chair of Saint Peter",
        "tier": 3
      }
    ],
    "commonGuesses": [
      {
        "guess": "Quo magis",
        "accepted": true
      },
      {
        "guess": "Cum sanctissima",
        "accepted": true
      },
      {
        "guess": "Lætitiæ plena",
        "accepted": true
      },
      {
        "guess": "Paternas vices",
        "accepted": true
      },
      {
        "guess": "Rite of Washing of Feet",
        "accepted": true
      },
      {
        "guess": "Traditionis custodes",
        "accepted": false,
        "reason": "A papal motu proprio, not a curial decree."
      },
      {
        "guess": "Pastor Bonus",
        "accepted": false,
        "reason": "A papal apostolic constitution."
      },
      {
        "guess": "Laudato si’",
        "accepted": false,
        "reason": "A papal encyclical."
      },
      {
        "guess": "Rosarium Virginis Mariæ",
        "accepted": false,
        "reason": "A papal apostolic letter."
      },
      {
        "guess": "Dei Verbum",
        "accepted": false,
        "reason": "A Vatican II dogmatic constitution."
      }
    ],
    "reviewFlags": [
      "The source catalogue classifies some rescripts and indulgence grants as decrees; the prompt follows the catalogue classification.",
      "Recurring annual observances include the year in the answer key to keep individual entries distinct."
    ]
  }
  ,{
    "id": "longtail-curial-instructions",
    "theme": "church-history",
    "prompt": "Name an instruction issued by a Roman Curia dicastery or office.",
    "context": "Curial instructions provide guidance on liturgy, doctrine, formation, ecclesiastical life and pastoral practice. This open list samples the catalogue and is not exhaustive.",
    "basis": "GCatholic, Documents by Type → Instructions from the Roman Curia (78 catalogue entries): https://gcatholic.org/documents/data/type-CIN . Published catalogue titles are used, including Latin incipits and English titles.",
    "answers": [
      {
        "answer": "The Identity of the Catholic School for a Culture of Dialogue",
        "tier": 5
      },
      {
        "answer": "On the Affiliation of Institutes of Higher Studies",
        "tier": 6
      },
      {
        "answer": "On the Aggregation of Institutes of Higher Studies",
        "tier": 6
      },
      {
        "answer": "On the Incorporation of Institutes of Higher Studies",
        "tier": 6
      },
      {
        "answer": "The pastoral conversion of the Parish community in the service of the evangelising mission of the Church",
        "tier": 4
      },
      {
        "answer": "Ecclesiæ Sponsæ Imago",
        "tier": 5
      },
      {
        "answer": "On studies of canon law in light of the reform of cases regarding the nullity of marriage",
        "tier": 6
      },
      {
        "answer": "Cor Orans",
        "tier": 3
      },
      {
        "answer": "Ad resurgendum cum Christo",
        "tier": 3
      },
      {
        "answer": "Universæ Ecclesiæ",
        "tier": 2
      },
      {
        "answer": "Dignitas Personæ",
        "tier": 2
      },
      {
        "answer": "The Word of God in the Life and Mission of the Church",
        "tier": 4
      },
      {
        "answer": "Sanctorum Mater",
        "tier": 4
      },
      {
        "answer": "On the criteria for the discernment of vocations with regard to persons in view of admission to the seminary",
        "tier": 6
      },
      {
        "answer": "Dignitas connubii",
        "tier": 3
      },
      {
        "answer": "Erga migrantes caritas Christi",
        "tier": 3
      },
      {
        "answer": "Redemptionis sacramentum",
        "tier": 1
      },
      {
        "answer": "The Priest, Pastor and Leader of the Parish Community",
        "tier": 5
      },
      {
        "answer": "Starting Afresh from Christ",
        "tier": 3
      },
      {
        "answer": "On the sending abroad and sojourn of diocesan priests from mission territories",
        "tier": 6
      },
      {
        "answer": "On the conferment of papal honours",
        "tier": 5
      },
      {
        "answer": "Liturgiam authenticam",
        "tier": 2
      },
      {
        "answer": "Ardens felicitatis",
        "tier": 5
      },
      {
        "answer": "Verbi Sponsa",
        "tier": 5
      },
      {
        "answer": "On Inter-Institute Collaboration for Formation",
        "tier": 6
      },
      {
        "answer": "Ecclesiæ de mysterio",
        "tier": 3
      },
      {
        "answer": "Instruction on Diocesan Synods",
        "tier": 5
      },
      {
        "answer": "On the admission to seminary of candidates coming from other seminaries or religious families",
        "tier": 6
      },
      {
        "answer": "Instruction for Applying the Liturgical Prescriptions of the Code of Canons of the Eastern Churches",
        "tier": 6
      },
      {
        "answer": "Varietates legitimæ",
        "tier": 3
      },
      {
        "answer": "On some aspects of the use of instruments of social communication in promoting the doctrine of the faith",
        "tier": 6
      },
      {
        "answer": "Ætatis novæ",
        "tier": 3
      },
      {
        "answer": "Donum veritatis",
        "tier": 2
      },
      {
        "answer": "Directives on Formation",
        "tier": 5
      },
      {
        "answer": "On the study of the Fathers of the Church in the formation of priests",
        "tier": 5
      },
      {
        "answer": "Donum vitæ",
        "tier": 1
      },
      {
        "answer": "Libertatis conscientia",
        "tier": 3
      },
      {
        "answer": "Libertatis nuntius",
        "tier": 3
      },
      {
        "answer": "Essential Elements in the Church’s Teaching on Religious Life",
        "tier": 4
      },
      {
        "answer": "Pastoralis actio",
        "tier": 4
      },
      {
        "answer": "Inæstimabile donum",
        "tier": 4
      },
      {
        "answer": "Postquam Apostoli",
        "tier": 5
      },
      {
        "answer": "On liturgical formation in seminaries",
        "tier": 5
      },
      {
        "answer": "Mutuæ relationes",
        "tier": 3
      },
      {
        "answer": "On the theological formation of future priests",
        "tier": 5
      },
      {
        "answer": "Secreta continere",
        "tier": 5
      },
      {
        "answer": "Instruction on the Solution of Marriage in Favour of the Faithful",
        "tier": 6
      },
      {
        "answer": "Immensæ caritatis",
        "tier": 3
      },
      {
        "answer": "In quibus rerum circumstantiis",
        "tier": 5
      },
      {
        "answer": "General Instruction of the Liturgy of the Hours",
        "tier": 2
      },
      {
        "answer": "Per Instructionem",
        "tier": 6
      },
      {
        "answer": "Liturgicæ instaurationes",
        "tier": 3
      },
      {
        "answer": "Sacramentali communione",
        "tier": 4
      },
      {
        "answer": "Calendaria Particularia",
        "tier": 4
      },
      {
        "answer": "On delaying the effective date for the Apostolic Constitution Missale Romanum",
        "tier": 6
      },
      {
        "answer": "Venite Seorsum",
        "tier": 4
      },
      {
        "answer": "Memoriale domini",
        "tier": 3
      },
      {
        "answer": "Actio pastoralis",
        "tier": 4
      },
      {
        "answer": "Fidei custos",
        "tier": 5
      },
      {
        "answer": "Ut sive sollicite",
        "tier": 5
      }
    ],
    "commonGuesses": [
      {
        "guess": "Redemptionis sacramentum",
        "accepted": true
      },
      {
        "guess": "Dignitas personae",
        "accepted": true
      },
      {
        "guess": "Donum vitae",
        "accepted": true
      },
      {
        "guess": "Liturgiam authenticam",
        "accepted": true
      },
      {
        "guess": "Universae Ecclesiae",
        "accepted": true
      },
      {
        "guess": "Pastor Bonus",
        "accepted": false,
        "reason": "An apostolic constitution."
      },
      {
        "guess": "Traditionis custodes",
        "accepted": false,
        "reason": "A motu proprio."
      },
      {
        "guess": "Laudato si’",
        "accepted": false,
        "reason": "An encyclical."
      },
      {
        "guess": "Rosarium Virginis Mariae",
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
      "Some older records have both Latin incipits and descriptive English titles; the answer bank uses the page's primary title.",
      "The source catalogue's category is followed even where a text is also discussed as a broader pastoral or doctrinal document."
    ]
  }
  ,{
    "id": "longtail-curial-notes",
    "theme": "church-history",
    "prompt": "Name a note, explanatory note, or responsum published by a Roman Curia office.",
    "context": "Curial notes and responsa clarify doctrine, discipline, liturgy and pastoral questions. This open list samples published catalogue entries and is not exhaustive.",
    "basis": "GCatholic, Documents by Type → Notes from the Roman Curia (100 catalogue entries): https://gcatholic.org/documents/data/type-CNT . Titles are transcribed from the catalogue; recurring subjects are distinguished by their individual published title.",
    "answers": [
      {
        "answer": "Explanatory Note on the decree of excommunication of the bishops of the Priestly Fraternity of Saint Pius X",
        "tier": 6
      },
      {
        "answer": "On the future episcopal ordinations of the Priestly Fraternity of Saint Pius X",
        "tier": 6
      },
      {
        "answer": "On the Value of Matrimony as an Exclusive Union and Mutual Belonging",
        "tier": 5
      },
      {
        "answer": "Mater Populi Fidelis",
        "tier": 2
      },
      {
        "answer": "Press Release regarding the Writings of Maria Valtorta",
        "tier": 5
      },
      {
        "answer": "Antiqua et nova",
        "tier": 1
      },
      {
        "answer": "On the obligation to attend Mass when a holyday of obligation is transferred",
        "tier": 5
      },
      {
        "answer": "False Mysticism and Spiritual Abuse",
        "tier": 4
      },
      {
        "answer": "The Queen of Peace: About the Spiritual Experience connected with Medjugorje",
        "tier": 3
      },
      {
        "answer": "On the administration of the Eucharist to divorcees living in a new union",
        "tier": 4
      },
      {
        "answer": "On the celebration of Holy Week 2022",
        "tier": 2
      },
      {
        "answer": "Responsa ad dubia on certain provisions of Traditionis custodes",
        "tier": 3
      },
      {
        "answer": "On the organization of the Eucharistic Celebrations in St. Peter’s Basilica",
        "tier": 5
      },
      {
        "answer": "Explanatory note on the decree on international associations of the faithful",
        "tier": 5
      },
      {
        "answer": "On the 16th Ordinary General Assembly of the Synod of Bishops",
        "tier": 3
      },
      {
        "answer": "Commentary on the Responsum ad dubium",
        "tier": 4
      },
      {
        "answer": "On the celebration of Holy Week 2021",
        "tier": 2
      },
      {
        "answer": "On distribution of ashes in time of pandemic",
        "tier": 3
      },
      {
        "answer": "On the morality of using some anti-Covid-19 vaccines",
        "tier": 2
      },
      {
        "answer": "On the Sunday of the Word of God",
        "tier": 2
      },
      {
        "answer": "On the Sacrament of Reconciliation in the current pandemic",
        "tier": 4
      },
      {
        "answer": "Approving seven Eucharistic Prefaces for the Extraordinary Form of the Roman Rite",
        "tier": 5
      },
      {
        "answer": "On the liturgical celebration in honour of Saints in the Extraordinary Form of the Roman Rite",
        "tier": 5
      },
      {
        "answer": "On the importance of the internal forum and the inviolability of the sacramental seal",
        "tier": 4
      },
      {
        "answer": "Notification on the Memorial of the Blessed Virgin Mary, Mother of the Church",
        "tier": 3
      },
      {
        "answer": "On the worship for the pilgrimage of relics of the Blesseds",
        "tier": 5
      },
      {
        "answer": "Pastoral recommendations for the Year of Faith",
        "tier": 3
      },
      {
        "answer": "Christian Witness in a Multi-Religious World: Recommendations for Conduct",
        "tier": 2
      },
      {
        "answer": "Towards reforming the international financial and monetary systems in the context of global public authority",
        "tier": 5
      },
      {
        "answer": "On the banalization of sexuality and certain interpretations of Light of the World",
        "tier": 6
      },
      {
        "answer": "On the 8th Assembly of Chinese Catholic Representatives",
        "tier": 5
      },
      {
        "answer": "A brief introduction to the modifications made in the Normae de gravioribus delictis",
        "tier": 5
      },
      {
        "answer": "The norms of the Motu Proprio Sacramentorum sanctitatis tutela: Historical introduction",
        "tier": 6
      },
      {
        "answer": "Statement on the Murphy Case in response to a New York Times article",
        "tier": 5
      },
      {
        "answer": "On personal ordinariates for Anglicans entering the Catholic Church",
        "tier": 3
      },
      {
        "answer": "Clarification on procured abortion",
        "tier": 4
      },
      {
        "answer": "Concerning the four prelates of the Society of Saint Pius X",
        "tier": 5
      },
      {
        "answer": "On poverty, trade and development to the member States of the UN Conference on Trade and Development",
        "tier": 6
      },
      {
        "answer": "On the prayer used on Good Friday",
        "tier": 3
      },
      {
        "answer": "Explanatory note on the increase in dioceses of continual Eucharistic adoration for priests and vocations",
        "tier": 5
      },
      {
        "answer": "Doctrinal note on some aspects of evangelization",
        "tier": 4
      },
      {
        "answer": "Commentary on responses to questions on artificial nutrition and hydration",
        "tier": 5
      },
      {
        "answer": "Commentary on responses to questions regarding certain aspects of the doctrine on the Church",
        "tier": 5
      },
      {
        "answer": "On cluster munitions",
        "tier": 6
      },
      {
        "answer": "Notification on the Insertion of Saints in the General Roman Calendar",
        "tier": 4
      },
      {
        "answer": "On the liturgy of the beginning of the Petrine ministry of the Bishop of Rome",
        "tier": 4
      },
      {
        "answer": "Explanatory Note on the Notification on the works of Father Jon Sobrino, S.J.",
        "tier": 6
      },
      {
        "answer": "On pontifical master of papal ceremonies, custodians and promoters of Roman liturgy",
        "tier": 6
      },
      {
        "answer": "On the international trade in conventional weapons",
        "tier": 6
      },
      {
        "answer": "The juridical nature and extension of the recognitio of the Holy See",
        "tier": 6
      },
      {
        "answer": "Actus formalis defectionis ab Ecclesia catholica",
        "tier": 5
      },
      {
        "answer": "Adhesion of the Holy See to the protocol on explosive remnants of war",
        "tier": 6
      },
      {
        "answer": "Communique on new procedures in the rite of Beatification",
        "tier": 4
      },
      {
        "answer": "On the rites of the Vacant See",
        "tier": 4
      },
      {
        "answer": "Answer to 3 questions concerning the interpretation of the clause de consensum partium of canon 1681 CIC",
        "tier": 6
      },
      {
        "answer": "Note regarding the Minister of the Sacrament of Anointing of the Sick",
        "tier": 4
      },
      {
        "answer": "On iconography and liturgy",
        "tier": 4
      },
      {
        "answer": "Introductive note to Apostolorum Successores",
        "tier": 5
      },
      {
        "answer": "Elements to establish the area of canonical responsibility of the diocesan Bishop on clerics incardinated within the diocese",
        "tier": 6
      },
      {
        "answer": "The function of ecclesiastical authority on temporal goods",
        "tier": 6
      }
    ],
    "commonGuesses": [
      {
        "guess": "Antiqua et nova",
        "accepted": true
      },
      {
        "guess": "Mater Populi Fidelis",
        "accepted": true
      },
      {
        "guess": "Responsa ad dubia on certain provisions of Traditionis custodes",
        "accepted": true
      },
      {
        "guess": "Christian Witness in a Multi-Religious World",
        "accepted": true
      },
      {
        "guess": "Actus formalis defectionis ab Ecclesia catholica",
        "accepted": true
      },
      {
        "guess": "Traditionis custodes",
        "accepted": false,
        "reason": "A motu proprio rather than a curial note."
      },
      {
        "guess": "Laudato si’",
        "accepted": false,
        "reason": "An encyclical."
      },
      {
        "guess": "Redemptionis sacramentum",
        "accepted": false,
        "reason": "A curial instruction."
      },
      {
        "guess": "Pastor Bonus",
        "accepted": false,
        "reason": "An apostolic constitution."
      },
      {
        "guess": "Dei Verbum",
        "accepted": false,
        "reason": "A Vatican II dogmatic constitution."
      }
    ],
    "reviewFlags": [
      "Some entries are responsa or explanatory notes; the prompt names those forms explicitly.",
      "The answer bank follows the source catalogue's document category."
    ]
  }
  ,{
    "id": "longtail-curial-documents",
    "theme": "church-history",
    "prompt": "Name a document published by a Roman Curia dicastery, pontifical council, or commission.",
    "context": "Curial offices publish doctrinal, pastoral, ecumenical, educational, social and bioethical documents. This open list samples the catalogue and is not exhaustive.",
    "basis": "GCatholic, Documents by Type → Documents from the Roman Curia (213 catalogue entries): https://gcatholic.org/documents/data/type-CZZ . Titles are taken from catalogue records; repeated annual resources are distinguished by publication year.",
    "answers": [
      {
        "answer": "On Christian anthropology in the face of some future scenarios for humanity",
        "tier": 5
      },
      {
        "answer": "The Bishop of Rome",
        "tier": 3
      },
      {
        "answer": "Primacy and synodality in ecumenical dialogues and responses to Ut unum sint",
        "tier": 4
      },
      {
        "answer": "Towards Full Presence: A Pastoral Reflection on Engagement with Social Media",
        "tier": 2
      },
      {
        "answer": "Vademecum on certain points of procedure in treating cases of sexual abuse of minors committed by clerics (2022)",
        "tier": 2
      },
      {
        "answer": "Pandemic and Challenges for Education: Children and adolescents dealing with COVID-19",
        "tier": 4
      },
      {
        "answer": "Children and COVID-19",
        "tier": 5
      },
      {
        "answer": "Pastoral Guidelines for the Celebration of World Youth Day in the Particular Churches",
        "tier": 4
      },
      {
        "answer": "Pastoral Orientations on Climate Displaced People",
        "tier": 4
      },
      {
        "answer": "Response to a dubium regarding the blessing of the unions of same-sex couples",
        "tier": 2
      },
      {
        "answer": "Report on the Holy See’s institutional knowledge and decision-making related to former Cardinal Theodore McCarrick",
        "tier": 3
      },
      {
        "answer": "Vademecum on certain points of procedure in treating cases of sexual abuse of minors committed by clerics (2020)",
        "tier": 2
      },
      {
        "answer": "Responses on the validity of baptism",
        "tier": 3
      },
      {
        "answer": "The Bishop and Christian Unity: An ecumenical vademecum",
        "tier": 4
      },
      {
        "answer": "Strong in the Face of Tribulation",
        "tier": 4
      },
      {
        "answer": "Directory for Catechesis",
        "tier": 1
      },
      {
        "answer": "Pastoral guidelines concerning the civil registration of clergy in China",
        "tier": 5
      },
      {
        "answer": "Towards a path of dialogue on the question of gender theory in education",
        "tier": 5
      },
      {
        "answer": "On the Christian perspective on sport and the human person",
        "tier": 4
      },
      {
        "answer": "Sinodality in the life and mission of the Church",
        "tier": 3
      },
      {
        "answer": "Œconomicæ et pecuniariæ quæstiones",
        "tier": 2
      },
      {
        "answer": "Educating to fraternal humanism—Building a civilization of love 50 years after Populorum progressio",
        "tier": 4
      },
      {
        "answer": "Instructions for Compiling the Annual Report on the State and Activity of Tribunals",
        "tier": 6
      },
      {
        "answer": "Final Report on the Apostolic Visitation of Institutes of Women Religious in the United States of America",
        "tier": 5
      },
      {
        "answer": "Guide for large celebrations",
        "tier": 5
      },
      {
        "answer": "Sensus fidei in the life of the Church",
        "tier": 3
      },
      {
        "answer": "Resources for the Week of Prayer for Christian Unity 2014",
        "tier": 4
      },
      {
        "answer": "God the Trinity and the Unity of Humanity",
        "tier": 3
      },
      {
        "answer": "Enchiridion della Nuova Evangelizzazione",
        "tier": 6
      },
      {
        "answer": "Theology Today: Perspectives, Principles and Criteria",
        "tier": 2
      },
      {
        "answer": "Law concerning the prevention and countering of illegal activities in the financial and monetary sectors in Vatican City State and the Holy See",
        "tier": 6
      },
      {
        "answer": "Resources for the Week of Prayer for Christian Unity 2010",
        "tier": 4
      },
      {
        "answer": "In Search of a Universal Ethic: A New Look at the Natural Law",
        "tier": 2
      },
      {
        "answer": "Pastoral Recommendations of the Plenary Assembly of the Pontifical Commission for Latin America",
        "tier": 5
      },
      {
        "answer": "Why the Concept of Brain Death is Valid as a Definition of Death",
        "tier": 3
      },
      {
        "answer": "Resources for the Week of Prayer for Christian Unity 2009",
        "tier": 4
      },
      {
        "answer": "Guidelines for the Use of Psychology in the Admission and Formation of Candidates for the Priesthood",
        "tier": 4
      },
      {
        "answer": "Reform of the Higher Institutes of Religious Sciences",
        "tier": 6
      },
      {
        "answer": "Responses to questions on the validity of baptism with certain formulas",
        "tier": 4
      },
      {
        "answer": "The role of the national delegate for the International Eucharistic Congresses",
        "tier": 5
      },
      {
        "answer": "Foundational theological document for the International Eucharistic Congress of Quebec",
        "tier": 6
      },
      {
        "answer": "Educating Together in Catholic Schools: Shared Mission of Consecrated Persons and Lay Faithful",
        "tier": 4
      },
      {
        "answer": "Responses to questions on artificial nutrition and hydration",
        "tier": 3
      },
      {
        "answer": "Booklets published in preparation for the Week of Prayer for Christian Unity 2008",
        "tier": 5
      },
      {
        "answer": "Responses to some questions regarding certain aspects of the Church",
        "tier": 2
      },
      {
        "answer": "Explanatory Note on the Letter of Pope Benedict XVI to Chinese Catholics",
        "tier": 4
      },
      {
        "answer": "Guidelines for the Pastoral Care of the Road-Street",
        "tier": 6
      },
      {
        "answer": "The Hope of Salvation for Infants Who Die Without Being Baptised",
        "tier": 2
      },
      {
        "answer": "Manual for chaplains and pastoral agents of the Apostleship of the Sea",
        "tier": 6
      },
      {
        "answer": "Notification on the works of Father Jon Sobrino, S.J.",
        "tier": 4
      },
      {
        "answer": "The Fight Against Corruption",
        "tier": 5
      },
      {
        "answer": "Booklets published in preparation for the Week of Prayer for Christian Unity 2007",
        "tier": 5
      },
      {
        "answer": "The Via Pulchritudinis: Privileged Pathway for Evangelisation and Dialogue",
        "tier": 4
      },
      {
        "answer": "Final Document of the 2nd World Congress for the Pastoral Care of Foreign Students",
        "tier": 6
      },
      {
        "answer": "Guidelines for the Pastoral Care of Gypsies",
        "tier": 5
      },
      {
        "answer": "Final Document of the 2nd Asian Congress on Pilgrimages and Shrines",
        "tier": 5
      },
      {
        "answer": "Catholic Cultural Centres (4th edition)",
        "tier": 5
      },
      {
        "answer": "Final Document of the 1st International Meeting of Pastoral Care for the Liberation of Women of the Street",
        "tier": 6
      },
      {
        "answer": "Booklets published in preparation for the Week of Prayer for Christian Unity 2006",
        "tier": 5
      },
      {
        "answer": "Final Document of the 12th International Seminar for Catholic Civil Aviation Chaplains and Chaplaincy Members",
        "tier": 6
      }
    ],
    "commonGuesses": [
      {
        "guess": "Directory for Catechesis",
        "accepted": true
      },
      {
        "guess": "Theology Today: Perspectives, Principles and Criteria",
        "accepted": true
      },
      {
        "guess": "In Search of a Universal Ethic",
        "accepted": true
      },
      {
        "guess": "The Bishop and Christian Unity",
        "accepted": true
      },
      {
        "guess": "Antiqua et nova",
        "accepted": false,
        "reason": "A note from the Roman Curia, not a document in this catalogue category."
      },
      {
        "guess": "Laudato si’",
        "accepted": false,
        "reason": "A papal encyclical."
      },
      {
        "guess": "Redemptionis sacramentum",
        "accepted": false,
        "reason": "A Roman Curia instruction."
      },
      {
        "guess": "Pastor Bonus",
        "accepted": false,
        "reason": "A papal apostolic constitution."
      },
      {
        "guess": "Dei Verbum",
        "accepted": false,
        "reason": "A Vatican II dogmatic constitution."
      },
      {
        "guess": "Traditionis custodes",
        "accepted": false,
        "reason": "A papal motu proprio."
      }
    ],
    "reviewFlags": [
      "The catalogue includes some vademecums and directories under Documents; category membership follows the source index.",
      "A recurring Week of Prayer resource is distinguished by publication year."
    ]
  }
  ,{
    "id": "longtail-archdioceses",
    "theme": "places",
    "prompt": "Name a Catholic archdiocese in the world.",
    "context": "The Catholic Church includes archdioceses of different rites and jurisdictions. This open list samples the archiepiscopal sees catalogued by GCatholic; it is not exhaustive.",
    "basis": "GCatholic, Catholic Dioceses in the World → Archiepiscopal Sees (Archdioceses), 77 entries: https://gcatholic.org/dioceses/data/type-arch . Rite labels are added where the catalogue lists multiple archdioceses with the same city-name.",
    "answers": [
      {
        "answer": "Acerenza",
        "tier": 6
      },
      {
        "answer": "Ahvaz",
        "tier": 6
      },
      {
        "answer": "Aix-en-Provence",
        "tier": 4
      },
      {
        "answer": "Akka (Greek-Melkite)",
        "tier": 6
      },
      {
        "answer": "Alba Iulia",
        "tier": 5
      },
      {
        "answer": "Albi",
        "tier": 5
      },
      {
        "answer": "Aleppo (Maronite)",
        "tier": 4
      },
      {
        "answer": "Aleppo (Syriac)",
        "tier": 5
      },
      {
        "answer": "Aleppo (Armenian)",
        "tier": 6
      },
      {
        "answer": "Amalfi–Cava de’ Tirreni",
        "tier": 5
      },
      {
        "answer": "Antélias",
        "tier": 6
      },
      {
        "answer": "Athens",
        "tier": 3
      },
      {
        "answer": "Auch",
        "tier": 6
      },
      {
        "answer": "Avignon",
        "tier": 4
      },
      {
        "answer": "Baalbek (Greek-Melkite)",
        "tier": 6
      },
      {
        "answer": "Baghdad (Roman)",
        "tier": 3
      },
      {
        "answer": "Baghdad (Syriac)",
        "tier": 5
      },
      {
        "answer": "Baghdad (Armenian)",
        "tier": 6
      },
      {
        "answer": "Bāniyās (Greek-Melkite)",
        "tier": 6
      },
      {
        "answer": "Bar",
        "tier": 6
      },
      {
        "answer": "Bassorah",
        "tier": 6
      },
      {
        "answer": "Beirut (Maronite)",
        "tier": 4
      },
      {
        "answer": "Bourges",
        "tier": 5
      },
      {
        "answer": "Brindisi–Ostuni",
        "tier": 5
      },
      {
        "answer": "Cambrai",
        "tier": 4
      },
      {
        "answer": "Camerino–San Severino Marche–Matelica",
        "tier": 6
      },
      {
        "answer": "Canberra and Goulburn",
        "tier": 4
      },
      {
        "answer": "Capua",
        "tier": 5
      },
      {
        "answer": "Chambéry–Saint-Jean-de-Maurienne–Tarentaise",
        "tier": 6
      },
      {
        "answer": "Crotone–Santa Severina",
        "tier": 6
      },
      {
        "answer": "Cyprus (Maronite)",
        "tier": 6
      },
      {
        "answer": "Damascus (Maronite)",
        "tier": 5
      },
      {
        "answer": "Diarbekir (Chaldean)",
        "tier": 6
      },
      {
        "answer": "Erbil (Chaldean)",
        "tier": 4
      },
      {
        "answer": "Ferrara–Comacchio",
        "tier": 6
      },
      {
        "answer": "Gaeta",
        "tier": 5
      },
      {
        "answer": "Haifa and Holy Land (Maronite)",
        "tier": 5
      },
      {
        "answer": "Hassaké–Nisibi (Syriac)",
        "tier": 6
      },
      {
        "answer": "Hobart",
        "tier": 4
      },
      {
        "answer": "Istanbul (Armenian)",
        "tier": 4
      },
      {
        "answer": "Lanciano–Ortona",
        "tier": 6
      },
      {
        "answer": "Latakia (Greek-Melkite)",
        "tier": 5
      },
      {
        "answer": "Lucca",
        "tier": 4
      },
      {
        "answer": "Luxembourg",
        "tier": 2
      },
      {
        "answer": "Lviv (Armenian)",
        "tier": 5
      },
      {
        "answer": "Manfredonia–Vieste–San Giovanni Rotondo",
        "tier": 5
      },
      {
        "answer": "Matera–Irsina",
        "tier": 4
      },
      {
        "answer": "Monaco",
        "tier": 3
      },
      {
        "answer": "Monreale",
        "tier": 5
      },
      {
        "answer": "Mossul (Syriac)",
        "tier": 6
      },
      {
        "answer": "Mossul–Aqrā (Chaldean)",
        "tier": 6
      },
      {
        "answer": "Otranto",
        "tier": 4
      },
      {
        "answer": "Petra and Philadelphia (Greek-Melkite)",
        "tier": 5
      },
      {
        "answer": "Rabat",
        "tier": 3
      },
      {
        "answer": "Rhodes",
        "tier": 4
      },
      {
        "answer": "Rossano–Cariati",
        "tier": 6
      },
      {
        "answer": "Saïdā (Greek-Melkite)",
        "tier": 6
      },
      {
        "answer": "Sant’Angelo dei Lombardi–Conza–Nusco–Bisaccia",
        "tier": 6
      },
      {
        "answer": "Santiago del Estero",
        "tier": 3
      },
      {
        "answer": "Sens",
        "tier": 5
      }
    ],
    "commonGuesses": [
      {
        "guess": "Acerenza",
        "accepted": true
      },
      {
        "guess": "Ahvaz",
        "accepted": true
      },
      {
        "guess": "Athens",
        "accepted": true
      },
      {
        "guess": "Beirut",
        "accepted": true
      },
      {
        "guess": "Rabat",
        "accepted": true
      },
      {
        "guess": "Rome",
        "accepted": false,
        "reason": "The Roman see is a metropolitan archdiocese, not one of the catalogue's 77 archiepiscopal sees."
      },
      {
        "guess": "New York",
        "accepted": false,
        "reason": "A metropolitan archdiocese."
      },
      {
        "guess": "Los Angeles",
        "accepted": false,
        "reason": "A metropolitan archdiocese."
      },
      {
        "guess": "Canterbury",
        "accepted": false,
        "reason": "Not a Catholic archdiocese."
      },
      {
        "guess": "Constantinople",
        "accepted": false,
        "reason": "The current Latin Catholic archdiocese is not listed under this type; use the specific Catholic jurisdiction."
      }
    ],
    "reviewFlags": [
      "Same-name sees are distinguished by rite in parentheses."
    ]
  },
  {
    "id": "longtail-apostolic-vicariates",
    "theme": "places",
    "prompt": "Name a Catholic apostolic vicariate.",
    "context": "An apostolic vicariate is a particular Church governed by a vicar apostolic, usually in mission territories. This open list samples the current Roman-Rite apostolic vicariates in the catalogue.",
    "basis": "GCatholic, Catholic Dioceses in the World → Apostolic Vicariates (79 entries): https://gcatholic.org/dioceses/data/type-apvc . Place-names follow the catalogue; alternative spellings are not separate answers.",
    "answers": [
      {
        "answer": "Aguarico",
        "tier": 4
      },
      {
        "answer": "Aleppo",
        "tier": 3
      },
      {
        "answer": "Alexandria of Egypt",
        "tier": 3
      },
      {
        "answer": "Anatolia",
        "tier": 4
      },
      {
        "answer": "Archipelago of the Comores",
        "tier": 6
      },
      {
        "answer": "Awasa",
        "tier": 5
      },
      {
        "answer": "Aysén",
        "tier": 5
      },
      {
        "answer": "Beirut",
        "tier": 3
      },
      {
        "answer": "Benghazi",
        "tier": 5
      },
      {
        "answer": "Bontoc–Lagawe",
        "tier": 6
      },
      {
        "answer": "Brunei",
        "tier": 4
      },
      {
        "answer": "Camiri",
        "tier": 5
      },
      {
        "answer": "Caroní",
        "tier": 5
      },
      {
        "answer": "Chaco Paraguayo",
        "tier": 6
      },
      {
        "answer": "Darién",
        "tier": 5
      },
      {
        "answer": "Derna",
        "tier": 6
      },
      {
        "answer": "El Beni",
        "tier": 5
      },
      {
        "answer": "El Petén",
        "tier": 5
      },
      {
        "answer": "Esmeraldas",
        "tier": 4
      },
      {
        "answer": "Galápagos",
        "tier": 4
      },
      {
        "answer": "Gambella",
        "tier": 6
      },
      {
        "answer": "Guapi",
        "tier": 6
      },
      {
        "answer": "Harar",
        "tier": 5
      },
      {
        "answer": "Hosanna",
        "tier": 6
      },
      {
        "answer": "Ingwavuma",
        "tier": 6
      },
      {
        "answer": "Inírida",
        "tier": 6
      },
      {
        "answer": "Iquitos",
        "tier": 3
      },
      {
        "answer": "Istanbul",
        "tier": 3
      },
      {
        "answer": "Izabal",
        "tier": 5
      },
      {
        "answer": "Jaén en Perú (San Francisco Javier)",
        "tier": 6
      },
      {
        "answer": "Jimma–Bonga",
        "tier": 6
      },
      {
        "answer": "Jolo",
        "tier": 4
      },
      {
        "answer": "Leticia",
        "tier": 5
      },
      {
        "answer": "Luang Prabang",
        "tier": 5
      },
      {
        "answer": "Makokou",
        "tier": 6
      },
      {
        "answer": "Meki",
        "tier": 6
      },
      {
        "answer": "Méndez",
        "tier": 6
      },
      {
        "answer": "Mitú",
        "tier": 6
      },
      {
        "answer": "Mongo",
        "tier": 6
      },
      {
        "answer": "Napo",
        "tier": 6
      },
      {
        "answer": "Nekemte",
        "tier": 6
      },
      {
        "answer": "Nepal",
        "tier": 4
      },
      {
        "answer": "Northern Arabia",
        "tier": 2
      },
      {
        "answer": "Ñuflo de Chávez",
        "tier": 6
      },
      {
        "answer": "Pakse",
        "tier": 6
      },
      {
        "answer": "Pando",
        "tier": 6
      },
      {
        "answer": "Phnom Penh",
        "tier": 2
      },
      {
        "answer": "Pilcomayo",
        "tier": 6
      },
      {
        "answer": "Pucallpa",
        "tier": 5
      },
      {
        "answer": "Puerto Ayacucho",
        "tier": 5
      },
      {
        "answer": "Puerto Carreño",
        "tier": 6
      },
      {
        "answer": "Puerto Gaitán",
        "tier": 6
      },
      {
        "answer": "Puerto Leguízamo–Solano",
        "tier": 6
      },
      {
        "answer": "Puerto Maldonado",
        "tier": 4
      },
      {
        "answer": "Puerto Princesa",
        "tier": 5
      },
      {
        "answer": "Puyo",
        "tier": 5
      },
      {
        "answer": "Quetta",
        "tier": 5
      },
      {
        "answer": "Requena",
        "tier": 6
      },
      {
        "answer": "Reyes",
        "tier": 6
      },
      {
        "answer": "Rodrigues",
        "tier": 6
      }
    ],
    "commonGuesses": [
      {
        "guess": "Northern Arabia",
        "accepted": true
      },
      {
        "guess": "Aguarico",
        "accepted": true
      },
      {
        "guess": "Iquitos",
        "accepted": true
      },
      {
        "guess": "Phnom Penh",
        "accepted": true
      },
      {
        "guess": "Puerto Maldonado",
        "accepted": true
      },
      {
        "guess": "Apostolic Vicariate of Nepal",
        "accepted": false,
        "reason": "The accepted short-form answer is Nepal; the list is of named jurisdictions, not title phrases."
      },
      {
        "guess": "Apostolic Prefecture of Ulaanbaatar",
        "accepted": false,
        "reason": "Apostolic prefecture, not vicariate."
      },
      {
        "guess": "Diocese of Rome",
        "accepted": false,
        "reason": "A diocese, not an apostolic vicariate."
      },
      {
        "guess": "Archdiocese of Manila",
        "accepted": false,
        "reason": "An archdiocese."
      },
      {
        "guess": "Military Ordinariate of the United States",
        "accepted": false,
        "reason": "A military ordinariate."
      }
    ],
    "reviewFlags": [
      "The source catalogue's 79 entries are apostolic vicariates; only the Roman-Rite list is used here."
    ]
  }
];