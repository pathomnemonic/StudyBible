# Deep Waters — Krillion batch 2 notes

## Scope and method

This batch adds 14 open-answer prompts. Each prompt is a short `Name…` question with a list of independently typeable names or short terms. No cloze, lesson quiz, sentence answer, or multiple-choice prompt is included. Lists are intentionally open, not exhaustive, except where the source defines a genuinely closed set (none of these 14 is marked closed).

Every displayed answer is at most four words. Alternative names are placed in `aliases`; ordinary spelling, punctuation, Saint/St., articles, plurals and similar normalizations are left to the existing matcher and are not duplicated as aliases. Prompt-level `ignore` lists remove only category words that add no identifying information.

## Sources by question

| ID | Source and scope |
|---|---|
| `bible-trades` | Douay-Rheims Bible, public-domain Scripture text in the app's Bible data. Checked against occupational references across Genesis, Exodus, Samuel/Kings, the Gospels, Acts, the Pauline letters and Revelation. |
| `bible-foods` | Douay-Rheims Bible, public-domain Scripture text in the app's Bible data; food and drink references across Exodus, Numbers, Ruth, Samuel, Kings, Psalms, Proverbs, Daniel and the Gospels. |
| `bible-objects` | Douay-Rheims Bible, public-domain Scripture text in the app's Bible data; objects and artifacts in Genesis, Exodus, Numbers, Samuel, Kings, the Gospels and Acts. |
| `saint-founders` | *Catholic Encyclopedia* (1913, public domain), entries on religious orders and founders; Vatican saint biographies; histories published by the relevant institutes. |
| `saint-patronages` | Archdiocese of Boston, “Patron Saints”; *Catholic Encyclopedia* (1913), “Patron Saints”; individual saint biographies and established devotional references. Patronage can be traditional rather than a formal declaration. |
| `encyclicals` | Holy See, official papal encyclical indexes and texts: https://www.vatican.va/content/vatican/en/holy_father.html and pontificate-specific encyclical indexes, including https://www.vatican.va/content/francesco/en/encyclicals.html and https://www.vatican.va/content/paul-vi/en/encyclicals.html. |
| `early-heresies` | *Catholic Encyclopedia* (1913, public domain), “Heresies” index and individual entries; historical accounts of early doctrinal controversies. |
| `liturgical-vestments` | USCCB, *General Instruction of the Roman Missal*, nos. 335–343: https://www.usccb.org/prayer-and-worship/the-mass/general-instruction-of-the-roman-missal/girm-chapter-6; *Catholic Encyclopedia* (1913), “Vestments”: https://www.newadvent.org/cathen/15388a.htm. |
| `liturgical-books` | *Catholic Encyclopedia* (1913), “Liturgical Books”: https://www.newadvent.org/cathen/09296a.htm; USCCB, “Sacred Books”: https://www.usccb.org/sites/default/files/about/public-affairs/upload/how-to-cover-the-mass.pdf. Eastern book names are checked against the relevant Byzantine liturgical tradition. |
| `latin-prayers` | Roman Missal, Liturgy of the Hours, and the public-domain *Raccolta*; the list includes traditional prayers, canticles and devotional texts commonly known by Latin titles. |
| `church-architecture` | *Catholic Encyclopedia* (1913), entries on church architecture and church furnishings; standard architectural terminology. Eastern terms are included only for identifiable church-plan or sanctuary features. |
| `roman-basilicas` | Holy See, “Papal Basilicas”: https://www.iubilaeum2025.va/en/pellegrinaggio/cammini-giubilari-dentro-roma/basiliche-papali.html; Vatican papal basilica portal: https://basilicas.vatican.va/en.html; official church/basilica histories for the other historic Roman sites. |
| `church-historians` | *Catholic Encyclopedia* (1913), entries on Eusebius and ecclesiastical historians; public-domain primary chronicles and standard histories of Christianity. |
| `saint-missionaries` | Vatican saint biographies and missionary histories; *Catholic Encyclopedia* (1913), missionary and saint entries. The list includes saints known for evangelization and the establishment of Christian communities. |

## Rarity tiers

All tiers in this batch are **editorial judgement** about how readily an ordinary Catholic or churchgoer is likely to recall an answer. They are not derived from player telemetry, search popularity, or an invented familiarity database. The lists are ordered from generally familiar to more specialist/obscure names, then tiered on the requested six-level point ladder. No numeric corpus-frequency analysis was performed for this batch.

The distribution is deliberately approximate to the requested 8/12/20/25/25/10% profile. A few small lists deviate slightly to keep every tier represented and preserve sensible rank order.

## Review state

All 14 prompts are marked `status: 'draft'`. The review registry must retain them as `unreviewed`; no question is marked reviewed. The tests include three must-accept inputs (one using an alias) and two must-reject inputs (wrong category and near miss) for every prompt. Human review of every answer and its tier is still required before publication.
