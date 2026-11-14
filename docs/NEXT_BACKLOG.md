# Third-cycle backlog: where every item stands (14 November 2026)

Key: **Done** (built, tested, in the app) · **Existed** (already in the app before this cycle) · **Partial** (what is built, what is not) · **Data** (needs a reviewed source; nothing is invented) · **Decision** (needs the owner) · **Platform** (needs infrastructure or store work).

## Priority 1: finish the second-cycle features
**Collections.** Done: summary line (items, done, last changed), search (name, description, tags, items), duplicate, tags, make a reading plan, in-app links from saints and family-line people (browser-verified). Existed: reorder, ticks, templates, Markdown / web page / print export. Partial: folders and categories (tags cover grouping; folders not built), item types (passages, notes, highlights, bookmarks, Catechism, works, episodes, readings, topics, links exist; saints, prayers, glossary entries and lessons are saved as links). Not built: richer export title page and table of contents; templates beyond Scripture-only (saint study, prayer collection, Father reading list, Sunday preparation: the Sunday page exists separately).

**Notes and review.** Done: `[[` picker, version history (last five), come-back actions (Reviewed, next week, add to collection), export only notes with one tag, data health check. Existed: backlinks (collections, same passage, note-to-note), tag filter, pinning, templates (Observe/Interpret/Apply, Lectio divina, Prayer, Theological questions, Questions, Argument map, Historical context), question inbox and weekly review, note-to-passage panel in the study panel. Not built: note categories beyond tags; search across linked titles.

**Compare the Fathers.** Existed: passage-centred "The Fathers on a passage", by-century listing, two-Father comparison, authors side by side with direct versus editorial. Not built: author profile pages (Data), comparison export, reviewed topic tags (Data).

**Ask the sources.** Done: source filters, save a question, exact Catechism location with in-place expansion. Existed: passage-to-source (dossier) and source-to-passage (Catechism page lists the Scripture it cites), source-type labels. Not built: related-question suggestions, save the results (not just the question) into a collection.

**Glossary.** Done: letter index. Existed: A to Z, search, Church's own words, Scripture cited, related terms, lessons that teach each word. Data: confusable-pair comparison and any simplified explanation need reviewed text.

**Offline manager.** Done: saved-copy check (reads each saved pack back), problem-report diagnostics. Existed: per-Bible and per-pack download, stop and resume, real sizes and dates, partly saved flags, remove each, flight-readiness card. Not built: pause and reorder queue, automatic update checks (the app updates itself on a new build), per-book Bible downloads.

## Priority 2: reference libraries
**Partial (framework done, data needed).** Data format, validation (every fact sourced, uncertainty stated), search page, profile page and empty state are built and tested (`docs/PROFILE_DATA_FORMAT.md`). Saint, biblical person and place **profiles**, alternate names, orders, relationships, chronology, identifications, journeys, historical map layers: **Data** (reviewed tables with stable ids).

## Priority 3: reading and search
Existed: copy formats (now five), parallel reading and saved comparisons, chapter and book progress, typography settings, focus mode, footnote navigation, history, command palette quick-jump, scripture search with filters and saved searches. **Decision**: verse-by-verse notes mode (recommended as a small optional mode; not started because it touches the Reader). Not built: persistent passage context panel, chapter-ending action choice.

## Priority 4: connected study tools
Existed: passage dossier, themes explorer, typology, timeline, genealogy explorer, topical index (parables, miracles), Gospel comparison, quotation explorer ("who quoted this"), promise and fulfilment, doctrine explorer, councils, document library, cross-reference network, knowledge graph, map of connections. Data: separate parables and miracles indexes with their own tagging.

## Priority 5 and 6: prayer, liturgy, audio
Existed: Today, readings with previous and next Sunday, Prepare for Sunday, novenas, Lectio, Examen, Rosary, Divine Office, prayer journal, intentions, liturgies of several traditions. Data or Decision: Eastern calendar framework needs sources and a tradition to start with; audio read-along needs verse timings; video library breadth is a curation task.

## Priority 7: educational and interactive
Done: Match the term, Family ties, student worksheet and answer key. Existed: Scripture memorization with spaced repetition, Which Book, Who Said It, Doctrine ladder, lesson quizzes, lesson-linked reading lists and sources, study paths and tracks, teacher dashboard and planner.

## Priority 8: product experience
Done: shared problem-report helper (build, screen, no private text), data health check. Existed: command palette, favorites, history, onboarding tour, contextual tips, empty states, keyboard shortcuts, reading themes, data export and backup, What's new, feature directory (Everything). Not built: rearranging home cards, customizable shortcuts.

## Cross-cutting requirements the reviewer asked for
Every new item was checked against the code and the feature registry first (the dossier was found to exist, and a mistaken overwrite was undone before commit). Provenance labels are kept. New stored fields (collection tags, note history) are optional and unindexed, so no migration is needed. Each feature has unit tests and a browser check in `e2e/review.mjs` (27 sections); the deployed site was checked with the same suite. Feature status is in `docs/FEATURE_STATUS.md`.
