# ReadPage review (Phase 9)

`src/pages/ReadPage.tsx` is the reader. It was about 1,000 lines; it is now 919 after moving the side-by-side view into `src/pages/read/ParallelView.tsx` (a self-contained component with its own props and state, covered by the reader end-to-end tests). That is the only code moved so far, on purpose: the rest is tightly coupled through shared selection state, and moving it without tests around it would add risk.

## What the component does today
| Responsibility | Where it sits | Notes |
|---|---|---|
| Route and chapter loading | `useParams`, `getBookText`, `data`/`error` state | Reads the edition and chapter from the URL, loads the book file, maps native to anchor numbering. |
| Selection (verses tapped or keyed) | `selNative`, `selAnchor`, `flash`, key handler | Tapping extends the selection (Psalm 50:4 then 5 gives 50:4-5); Escape clears it, a second Escape closes the panel. |
| Study panel and notes | `panel`, `noteFor`, `StudyPanel`, `NoteEditor`, `NotePopover` | Opens from a verse number or the `s` key; notes are keyed to Vulgate-anchored passage ids. |
| Highlights, bookmarks, memory cards | `setHighlight`, `toggleBookmark`, `newCard`, `applyColor` | Writes to IndexedDB through `db/ops`. |
| Reader chrome | `ReadingBar`, `BookPicker`, `BibleTools`, `TextSettings`, `Modal`s | Opens and closes about ten overlays from one `useState` each. |
| Atmosphere and sound | `atmosphereFor`, `setAmbience`, `Motes`, `useQuiet` | Optional; reads settings; independent of selection. |
| Reading progress | `ReadProgress`, `ChapterDone`, `useReadingTime`, plan hooks | Independent of selection. |
| Inline art, red letters, key terms, standard notes | `figs`, `red`, `termList`, `stdNotes` | Derived data loaded per chapter; passed to `ChapterText`. |
| Keyboard shortcuts | one `window` keydown handler | Reads refs so it can be registered once. |
| Parallel view | `ParallelView` (now its own file) | |

## Suggested next steps, each with its test first
1. **Overlay state**: the ten `useState` booleans (`picker`, `toolsOpen`, `compare`, `shortcuts`, `aloud`, `textSettings`, `editionPicker`, ...) can become one `overlay` value (or a small `useOverlays` hook) so two can never be open at once. Test first: `e2e/readerbar.mjs` plus a new test that opening one closes the other.
2. **Per-chapter derived data** (`figs`, `red`, `stdNotes`, `anchorDensity`, `termList`): move into a `useChapterExtras(book, chapter, edition)` hook returning one object. Test first: the existing study-panel and footnote e2e tests.
3. **Selection**: keep it where it is. It is the centre of the page; the tests in `e2e/versenote.mjs` and `e2e/a11y2.mjs` pin its behaviour (extend, clear, open panel, focus), so extract it last and only with those green.
4. **Shortcuts**: after (1), move the handler and the help dialog into `useReaderShortcuts`.

Not recommended: rewriting the component, or changing what the reader looks like, in the same change as any of the above.
