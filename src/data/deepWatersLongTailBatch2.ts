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
];
