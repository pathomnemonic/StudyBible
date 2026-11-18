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
    "context": "A motu proprio is a papal document issued on the pope's own initiative. This open list samples titles catalogued as motu proprio; it is not a complete list.",
    "basis": "GCatholic, Documents by Type → Motu Proprio (catalogue reports 232 entries): https://gcatholic.org/documents/data/type-PMP . Answer titles are transcribed from catalogue headings; descriptive English titles are retained where no Latin incipit is displayed.",
    "answers": [
      {
        "answer": "Motu proprio Amending Canons 106 and 126 of the Codex Canonum Ecclesiarum Orientalium",
        "tier": 6
      },
      {
        "answer": "Confirma fratres tuos",
        "tier": 6
      },
      {
        "answer": "Immota manet",
        "tier": 6
      },
      {
        "answer": "Coniuncta cura",
        "tier": 6
      },
      {
        "answer": "Munus Tribunalis",
        "tier": 6
      },
      {
        "answer": "Ad theologiam promovendam",
        "tier": 5
      },
      {
        "answer": "Iam Pridem",
        "tier": 5
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
        "answer": "Traditionis custodes",
        "tier": 1
      },
      {
        "answer": "Antiquum ministerium",
        "tier": 3
      },
      {
        "answer": "Spiritus Domini",
        "tier": 3
      },
      {
        "answer": "Ab initio",
        "tier": 4
      },
      {
        "answer": "Authenticum charismatis",
        "tier": 5
      },
      {
        "answer": "Communis Vita",
        "tier": 4
      },
      {
        "answer": "Aperuit illis",
        "tier": 2
      },
      {
        "answer": "Magnum Principium",
        "tier": 3
      },
      {
        "answer": "Maiorem hac dilectionem",
        "tier": 5
      },
      {
        "answer": "Sanctuarium in Ecclesia",
        "tier": 5
      },
      {
        "answer": "Humanam progressionem",
        "tier": 4
      },
      {
        "answer": "Sedula mater",
        "tier": 5
      },
      {
        "answer": "Come una madre amorevole",
        "tier": 4
      },
      {
        "answer": "De concordia inter Codices",
        "tier": 5
      },
      {
        "answer": "Mitis et misericors Iesus",
        "tier": 4
      },
      {
        "answer": "Mitis Iudex Dominus Iesus",
        "tier": 2
      },
      {
        "answer": "Fidelis dispensator et prudens",
        "tier": 4
      },
      {
        "answer": "Normas nonnullas",
        "tier": 4
      },
      {
        "answer": "Ministrorum institutio",
        "tier": 5
      },
      {
        "answer": "Fides per doctrinam",
        "tier": 5
      },
      {
        "answer": "Intima Ecclesiæ natura",
        "tier": 5
      },
      {
        "answer": "Latina lingua",
        "tier": 5
      },
      {
        "answer": "Porta fidei",
        "tier": 2
      },
      {
        "answer": "Quærit semper",
        "tier": 5
      },
      {
        "answer": "Ubicumque et semper",
        "tier": 4
      },
      {
        "answer": "Omnium in mentem",
        "tier": 4
      },
      {
        "answer": "Ecclesiæ unitatem",
        "tier": 5
      },
      {
        "answer": "Antiqua ordinatione",
        "tier": 6
      },
      {
        "answer": "Summorum Pontificum",
        "tier": 2
      },
      {
        "answer": "Totius orbis",
        "tier": 6
      },
      {
        "answer": "Misericordia Dei",
        "tier": 3
      },
      {
        "answer": "Sacramentorum sanctitatis tutela",
        "tier": 4
      },
      {
        "answer": "Spes ædificandi",
        "tier": 5
      },
      {
        "answer": "Inter munera academiarum",
        "tier": 6
      },
      {
        "answer": "Apostolos suos",
        "tier": 4
      },
      {
        "answer": "Ad tuendam fidem",
        "tier": 4
      },
      {
        "answer": "Stella Maris",
        "tier": 4
      },
      {
        "answer": "Vitæ mysterium",
        "tier": 5
      },
      {
        "answer": "Socialium scientiarum",
        "tier": 6
      },
      {
        "answer": "Inde a Pontificatus",
        "tier": 6
      },
      {
        "answer": "Europæ Orientalis",
        "tier": 6
      },
      {
        "answer": "Ecclesia Dei",
        "tier": 3
      },
      {
        "answer": "Iusti iudicis",
        "tier": 6
      },
      {
        "answer": "Decessores nostri",
        "tier": 6
      },
      {
        "answer": "Sollicita cura",
        "tier": 6
      },
      {
        "answer": "Quo civium iura",
        "tier": 6
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
        "guess": "Aperuit illis",
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
        "reason": "An apostolic constitution, not a motu proprio."
      },
      {
        "guess": "Dei Verbum",
        "accepted": false,
        "reason": "A Vatican II dogmatic constitution, not a motu proprio."
      },
      {
        "guess": "Familiaris consortio",
        "accepted": false,
        "reason": "An apostolic exhortation, not a motu proprio."
      }
    ],
    "reviewFlags": [
      "Titles are transcribed from the GCatholic Motu Proprio catalogue; the catalogue includes some records with descriptive English headings rather than a Latin incipit.",
      "The first descriptive heading is shortened to its identifying subject in the answer key; confirm preferred title normalization before release."
    ]
  }
];