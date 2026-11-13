# Feature opportunities (second cycle)

Found by reading the 179-entry feature registry (`src/lib/features.ts`), the data directories and the code. Where something already exists, the entry says what would make it meaningfully better. Each entry describes what the person actually experiences.

Legend: **S** small (days), **M** medium (a week or two), **L** large. "Offline" says whether it works with no connection.

## Status (updated after the second cycle)
**Built:** 3 (the Back pill lists up to four earlier passages), 36 (table cards on the family sheet), 11 (done-state only; the rhythm and Today step are not), 12 (templates, passages only), 13 (note-to-note links), 14 and 15 (Review tab), 16 (web-page export), 17 (partly: writings and collection button on each life), 20 and 23 (partly: children and collection button), 27 (Sunday buttons), 30 (the prayer list takes a verse; Examen and Rosary do not show it yet), 31 (readiness card), 33 (prefilled report), 34 (collections in the vault zip).
**Already existed in some form:** 6 ("Compare in three translations" is in the books drawer), 29 (the Examination of conscience page can remember where you were, opt-in), 10 (the Catechism page shows each footnote's Scripture as links), 22 (the Archaeology tab of The biblical world), 25 (season blurbs on the Church year page).
**Not built:** 1, 2, 4, 5, 7, 8, 9, 18, 19, 21, 24, 26, 28, 32, 35, 37, 38. (4 exists as separate tools: Who quoted this, The Fathers on this passage and Across the centuries.)

## Study and Scripture
1. **Verse-by-verse reading mode with the commentary collapsed under each verse (M, offline).** Today the study panel opens beside the text. In a "reading with notes" mode each verse has a one-line marker that expands to the best single note (Haydock, Challoner or Catena) in place, so a slow reader never leaves the page. Reuses the study-panel ranking that already picks "start here" items.
2. **"Why is this here?" on every connection (S, offline).** Each item in the panel already carries a match type. Surface it as a plain sentence ("The Catechism quotes this verse in a footnote of §1324") with the footnote text, so people see the evidence, not just a label.
3. **Passage history trail (S, offline).** A breadcrumb strip in the reader showing the last five passages you jumped between via cross-references, each tappable, extending the existing "Back to John 3:16" pill from one step to a trail.
4. **Cross-reference explorer with direction (M, offline).** For a verse, show what it quotes, what quotes it and what echoes it as three short lists, drawn from the existing xref, quotation and typology data, rather than one mixed list.
5. **Reading-level toggle for study notes (M, offline).** The lessons already have a "simple words" version for chains. Offer the same for Catechism paragraphs and Church-document excerpts using the grade-band vocabulary, clearly marked as a paraphrase with the original one tap away.
6. **Passage compare across three translations in the reader itself (S).** `compare-translations` exists as a page; place the same three-column view as a third mode in the books drawer next to "side by side", so no page change is needed.
7. **Word-frequency map for a book (M, offline).** From the concordance data: which key words dominate a book, with a tap to see each occurrence in context. A visual "book fingerprint" next to "Book at a glance".
8. **Audio-linked reading position (M, offline after download).** Bible in a Year already links days to chapters. Add "read along" highlighting of the verse being spoken when the recording gives chapter markers, falling back to chapter level when it does not.
9. **Verse of the day for your reading (S).** Uses your own highlights (exists) plus a "from the chapter you read yesterday" option, with the same quote-source labels.
10. **Scripture index of the Catechism, by passage (S, offline).** The reverse of "Catechism by verse": open any CCC paragraph and see every Bible passage it cites as links, grouped by book. The glossary now does this for one paragraph; extend it to the Catechism reader.

## Notes, collections and personal study
11. **Collections as study plans (M, offline).** A collection becomes a stepped plan: mark items done, set a rhythm ("one item a day"), and get the next item on Today. Reuses user plans and the plan banner.
12. **Collection templates (S).** Start a collection from a template: "Seven sacraments", "Marian passages", "Prepare for Sunday" pre-filled with passages and Catechism paragraphs the app already holds, editable afterwards.
13. **Note-to-note links (M, offline).** Type `[[` in a note to link another of your notes; the target shows a backlink. The backlinks panel built this cycle already computes collection and same-passage backlinks; this adds the third kind.
14. **Weekly review (S).** A Sunday card: notes you wrote this week, passages you highlighted, questions still open. Draws on the "revisit" dates notes already have.
15. **Question inbox (S).** All notes of kind "question" in one list with a status (open, answered), and a button "look it up" that opens Ask the Catechism / Ask the Fathers with the question pre-filled.
16. **Share a collection as a read-only page (M, needs a host).** Export already makes Markdown and print. Add a self-contained HTML file that works offline from a USB stick or email, no server involved.

## Saints, history and geography
17. **Saint profiles that gather what the app already holds (M, offline).** One page per saint combining: Butler's life (public domain), feast date, century and place, works in the Fathers library, quotations marked with their verification status, related saints, and the Church-history events of their lifetime. No new biography is written, and a section is shown only where a source exists.
18. **Saints by religious order and movement (S, offline).** A filterable list (Benedictines, Franciscans, Dominicans, Jesuits, Carmelites, martyrs of a given persecution) built from tags on existing saint data, each entry linking to its profile.
19. **"What was happening then?" strip on a saint or Father (S, offline).** Councils, emperors and events from the existing Church-history timeline for the person's years.
20. **Biblical character profiles tied to passages (M, offline).** The People page exists; give each person a card with: passages they appear in (from the name index), family relations (genealogy data), places (map data), and a short sourced summary where one exists.
21. **Places with then-and-now context (M, offline).** From the maps data: each place shows the passages that mention it, an archaeology note where the app has one, and a modern name.
22. **Archaeology reference shelf (S).** A browsable list of the archaeology entries already in the biblical-world data, filterable by book and period, each linking to its passage.
23. **Interactive genealogy with passage links (M).** The genealogies page lists lines; make each person tappable to open their profile and the verse that names them.

## Liturgy and prayer
24. **Eastern Catholic calendar layer (L, offline).** The Byzantine day view exists. Add a switch for the Julian-based Eastern calendar with feasts, fasts and the day's Troparion where a public-domain source exists, clearly marked where the Eastern and Roman dates differ.
25. **Season explainer cards (S, offline).** A short card for Advent, Christmas, Lent, Triduum, Easter and Ordinary Time on Today, written once and reused: what the colour, the readings and the customs mean.
26. **Feast-day explainer (M).** For each feast in the app's calendar, "why we keep this": the event, the readings, the prayer, linked saints. Many feasts already have a card; fill gaps and add "what to do today" ideas.
27. **Readings navigation by lectionary cycle (S).** On the readings page, a Sunday/weekday cycle switch and next/previous Sunday buttons so people can prepare ahead without the date picker.
28. **Divine Office with the whole day in one scroll (M, offline).** The Office companion works by hour. Add a "today's hours" overview with the next hour highlighted, and a psalter-week view showing where this week's psalms sit.
29. **Examination of conscience that remembers (S, local only).** Optional private memory of which commandment sections you opened, so the next examination starts where you left off. Stays on the device and is excluded from sync by default.
30. **Prayer intentions linked to Scripture (S).** Attach a verse to a prayer-list intention; it appears with the intention in the Daily Examen and the Rosary.

## Offline, reliability and trust
31. **Offline readiness checklist (S).** A single card: "Ready for a flight: yes/no", listing missing Bibles, packs and episodes, each with a button. The new Downloads summary is the data source.
32. **Source-trust badge on every quotation (S, offline).** A small glyph showing verified word-for-word, translation variant, paraphrase or unverified, with a tap for the verification note. Uses the existing verification files; it does not claim anything new.
33. **Report-a-problem with context (S).** Every item already has "Report a problem". Prefill the issue with the item id, source, and app version so a maintainer can fix it in one step.
34. **Data export for everything, in open formats (S, offline).** Notes export exists; add collections (Markdown now) and highlights to the single zip a person can open in any editor, with a README explaining the layout.

## Learning, family and groups
35. **Lesson "next best step" on Today (S).** If you are partway through a lesson or unit, Today shows the next step with its time estimate. The resume data exists.
36. **Family discussion cards from the Sunday Gospel (S, offline).** The family sheet exists as a page; turn it into three swipeable question cards sized for the dinner table, large print.
37. **Class roster with offline progress (L).** The teacher dashboard exists; add a printable progress sheet per student that works without a server, using the shared class code only for the live session.
38. **Spaced review across lessons and the Catechism (M, offline).** The memory deck covers verses; extend it to key lesson facts and glossary terms using the same scheduler, so one daily review covers everything you chose to keep.
