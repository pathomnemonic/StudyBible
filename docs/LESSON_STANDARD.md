# The standard a catechism lesson is held to

The aim of the lessons is not that someone has taken in the whole Catechism. It is that they know the faith well enough to live it, explain it, and think about the questions people really ask. So the lessons put the most relevant and most argued topics first, teach them through sources, and give people practice in talking about them.

## Where this comes from

- **The 2020 Directory for Catechesis.** The kerygma is the first and repeated announcement at every age. Catechesis follows God's own pedagogy in salvation history, and its methodology treats human experience, memory, language (narrative, art and digital), the group and the space together. [Summary at the Catholic Herald](https://catholicherald.org/columns/herald-of-hope/new-directory-for-catechesis-connects-faith-formation-with-evangelization/), [USCCB participant manual](https://usccb.org/resources/Participant%20Manual_DFC_0.pdf).
- **Rosenshine's principles of instruction.** Review earlier material at the start, teach in small steps, ask many questions, check understanding, give guided then independent practice, and review weekly and monthly. [Overview](https://www.structural-learning.com/post/rosenshines-principles-a-teachers-guide).
- **Teaching apologetics to young people.** Be interactive, begin from culture the learner already knows (clips, current events), allow open questions, do not pretend to have every answer, and tie ideas to a lived faith. [Sean McDowell](https://seanmcdowell.org/assets/files/Teaching-Apologetics-to-Young-People.pdf), [Equip](https://www.equip.org/article/a-practical-guide-to-teaching-students-apologetics).

## The checklist, and where each item lives

| Criterion | In the lessons |
|---|---|
| Starts by recalling earlier learning | Warm-up questions from earlier lessons open every lesson from the elementary grades up (a review of the lesson's own vocabulary is not enough). |
| One clear question and idea | Every lesson has an essential question and one big idea. |
| Small steps with questions | The step-by-step path (a few steps, each with something to do). |
| Sources a learner can check | Scripture and Catechism numbers stay inline in the text. |
| Checks understanding | Quick check after the teaching, and a quiz that explains each answer and lets the learner try again. |
| Practice and application | An activity, a try-it and a way to live it this week. |
| Beauty, story and media | Public-domain art, the saint's story, and (middle grades up) curated videos, talks and readings. |
| Talk and debate | Discussion questions, plus "Debate it" on the big-question lessons: say their view first, name agreement, reply with a reason and a source, say what would change your mind, swap sides. |
| Honest about open questions | The debate steps say plainly that an honest question is allowed. |
| Prayer and sending | Every lesson ends in a prayer. |
| Family and community | The family mode, and a take-home note for teachers. |
| Teacher support | Timed plan, script, misconceptions, assessment, answer key. |

## What gets featured

Big-question lessons are chosen the way the apologetics tracks are: they answer what people really ask or argue about (does God exist, why suffering, the Bible, the Eucharist, Mary, the Church's history, sexuality, life issues, other religions). The list is in `data/curated/featured-lessons.json` and each item names the tracks that go deeper. Adults and parents see the adult list, students the teen list.

## Media

Videos, talks and readings for a lesson come from the apologetics tracks: chosen by hand, linked at their source, never generated and never picked by a search. A lesson with no curated media shows none. Run `npx tsx scripts/launch/make-lesson-links.ts` after editing the tracks or the featured list.
