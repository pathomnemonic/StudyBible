# Ambitious features: a long-term proposal

None of these is built. Each is assessed against what the app already has, so the order and cost are honest. Common rules: the core app must keep working with no network and no AI service; nothing personal leaves the device unless the person chooses; every claim carries its source.

## 1. An evidence-grounded Catholic study assistant
**What a person experiences.** They type a question ("Why do Catholics pray for the dead?"). They get an answer made of short excerpts from the library, each labelled and linked, followed by an optional written synthesis clearly marked as generated. They never get an unsourced paragraph.

**Architecture (retrieval first, generation optional).**
1. *Index.* A static, versioned search index built at build time from what the app already holds: Catechism paragraphs (with their footnotes), Church documents, the Fathers and saints library, Summa articles, Catena and Haydock notes, glossary entries and the apologetics chains. Each chunk keeps `{id, kind, author, work, section, period, language, verification}`. Retrieval is BM25 plus the existing patristic stemmer in `fathersSearch`; an optional small embedding model run in the browser (WebGPU/WASM) can rerank. This index is already half built: Ask the Fathers does retrieval today with no generation.
2. *Classify every passage into one of four labels before it is shown*: **Official teaching** (Catechism, councils, papal documents), **Historical commentary** (Fathers, medieval and modern commentators, with the author and date), **Theological opinion** (individual theologians, apologetics tracks, with the author), **Generated synthesis** (anything a model wrote). The label comes from the source record, never from the model.
3. *Answer without a model.* The default answer is the ranked, labelled excerpts grouped by those four headings, each with the source link, plus "what the sources agree on" only as a count of shared terms (as Compare Two Fathers does today). This is the version that always works offline.
4. *Optional synthesis.* If the person supplies their own API key (or points to a local model), the app sends only the question and the retrieved excerpts, with an instruction to answer using only those excerpts, quote them, cite by id, and say "the library does not address this" when it does not. The reply is post-checked: every cited id must exist in the retrieved set and every quotation must appear verbatim in its source; a reply that fails is discarded and the excerpt view is shown instead. It is displayed under a banner "AI summary of the sources above. It can be wrong."
5. *Privacy.* The key and the questions stay in the browser. No account, no server of ours. Nothing is sent unless the person presses "Summarise these sources".

**Reuse.** `fathersSearch`, `fathersEngine`, `AskPage`, Catechism index, `verification` data, argument chains and `StudyItem.match/authority/period` fields.
**New infrastructure.** A build step for the index (about 30-60 MB compressed, an offline pack); a source-class map; an optional provider adapter. No backend.
**Complexity.** Retrieval and labelled answers: M. Optional synthesis with verification: L.
**Data needed.** A mapping from every source to an authority class; the verification flags for quotations.
**Main risks.** Misleading synthesis (mitigated by verbatim checks and the banner); retrieval missing the right passage (mitigated by showing the search terms and offering "search the library"); doctrinal framing mistakes (mitigated by never letting the model assign the authority label).
**Offline.** Retrieval and the labelled answer: yes. Synthesis: only with a local model.

## 2. A conversational Bible study tutor
Socratic prompts on a passage ("What does Nicodemus misunderstand?") that reveal sourced hints in steps. Build as a scripted flow over the same retrieval: the questions come from the lesson and chain data already in the app (the Debate-it protocol and apologetics tracks are the pattern), and a model, if used, only rephrases the hint. **Reuse:** lessons, tracks, study panel. **Infrastructure:** none beyond item 1. **Complexity:** M for scripted, L with a model. **Risks:** a tutor that argues instead of asking. **Offline:** scripted version yes.

## 3. A visual theological knowledge graph
A navigable graph of doctrines, passages, councils, Fathers and saints with typed edges ("quotes", "defined at", "develops"). The personal graph, constellation, concept graph, doctrine map and argument chains already exist as separate views. The work is a single normalised edge list built from them, with one viewer. **Infrastructure:** a build-time graph file; a WebGL or canvas layout. **Complexity:** L (data unification is the hard part). **Risks:** a pretty graph with weak edges; show the edge's source on tap. **Offline:** yes.

## 4. Manuscript and textual criticism explorer
The manuscripts and textual-history pages exist. Add a variant browser: for a verse, the major variants, the manuscripts that read each, and how translations choose. **Data:** a curated variant table (public-domain apparatus such as the SBLGNT/Westcott-Hort apparatus where licensing allows). **Complexity:** L. **Risks:** licensing; presenting disputed readings as settled. **Offline:** yes after download.

## 5. Synchronised recorded Scripture audio
Highlight the verse being read. Needs verse-level timing for each recording. LibriVox and Bible in a Year give chapter or day audio but not verse timings. Options: forced alignment run offline at build time on public-domain recordings (a script, output shipped as small JSON), or chapter-level sync only. **Reuse:** audio player, reader verse spans, listen-while-you-read. **Complexity:** L. **Risks:** alignment errors on archaic text. **Offline:** yes with downloaded audio.

## 6. A fuller original-language environment
The words page and lexicon exist. Add interlinear display for a chapter (Greek NT, Hebrew OT) with morphology tooltips, tap a word for lexicon and every occurrence. **Data:** morphologically tagged public-domain texts (MorphGNT, OSHB). **Complexity:** L. **Risks:** licensing of lexicon glosses; heavy data (about 20-40 MB). **Offline:** yes as a pack.

## 7. An advanced catechesis platform
Beyond the 456 lessons: unit pacing calendars, assessments with a printable answer key, parent letters, and a lesson authoring tool so a catechist can adapt a lesson and keep it. **Reuse:** lesson model, the standard in `docs/LESSON_STANDARD.md`, slides, bell ringers. **Infrastructure:** local lesson overrides stored like notes and included in backup. **Complexity:** L. **Risks:** divergence from approved curricula; show the original beside the edit. **Offline:** yes.

## 8. Native mobile applications
The app is a PWA with a launch kit (`docs/LAUNCH.md`). Wrap it with Capacitor to gain store presence, push reminders and background audio, while keeping one codebase. **Infrastructure:** store accounts, signing, review. **Complexity:** M for a wrapper, L to go fully native. **Risks:** store policy on religious content is fine; IndexedDB eviction behaves differently, so keep the backup nudge. **Offline:** yes.

## 9. Optional end-to-end encrypted sync
Today sync (self-hosted) stores notes readable on the server. Add a passphrase-derived key (PBKDF2 or Argon2 in WASM) that encrypts each record's payload before upload; the server stores ciphertext plus `{table, uid, updatedAt}` which it needs for ordering. The conflict-preserving merge already works on plain records on the client, so it is unchanged. **Risks:** a lost passphrase loses the data (say so before enabling); search cannot run on the server. **Complexity:** M-L. **Offline:** yes (sync is the optional part).

## 10. Collaborative Bible study groups
Shared collections and notes within a small group, with comments. Needs an identity and a shared store, so a server or a peer-to-peer layer. The live-class relay (sealed with a class code) shows a no-account pattern. **Infrastructure:** group keys, invitations, moderation. **Complexity:** L. **Risks:** privacy of shared reflections, moderation, safeguarding when minors are present. **Offline:** read yes, collaborate no.

## Suggested order
1. Labelled retrieval answers (item 1, steps 1-3): it reuses the most and needs no service.
2. Encrypted sync (9): makes the existing optional sync safe to recommend.
3. Knowledge graph data unification (3): feeds 1 and 2.
4. Interlinear (6) and manuscript variants (4): data-heavy, independent.
5. Audio sync (5), tutor (2), catechesis authoring (7), wrapper (8), groups (10).
