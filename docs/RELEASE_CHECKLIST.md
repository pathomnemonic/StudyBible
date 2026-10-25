# Release checklist

Work down this list for every release. Items marked (data) apply only when datasets were rebuilt.

1. **Fast checks:** `npm run typecheck` and `npm test` pass.
2. **Build:** `npm run build`, then `npm run budget` (bundle and data size budgets).
3. **Browser checks:** with `npx vite preview --port 4173` running: `npm run e2e` (routes and offline reload) and `npm run e2e:a11y` (axe on the main screens and in every theme). Look at the reader on a phone-size window by eye.
4. **Generated documents:** `npm run docs:status`; commit the regenerated `docs/FEATURE_STATUS.md`.
5. **Data (data):** `npm run data:validate`; regenerate `public/data/manifest.json` (the offline pack list with sizes and checksums); read the diff for unexpected changes in size; run `npm test` again (the manifest test checks checksums).
6. **Rights review (data):** every new source has its licence and URL in `docs/DATA_SOURCES.md` and `docs/LICENSING.md`. Nothing copyrighted is bundled (ICEL Mass texts, NABRE, RSV-CE, the Catechism text, etc.).
7. **Migrations:** if the IndexedDB schema changed, add a version in `src/db/db.ts`, extend `tests/db.test.ts`, and check an upgrade from an older export.
8. **Server:** if the sync format changed, bump `PROTOCOL` in `server/app.ts`, keep the old behaviour for older apps, and run `tests/server.test.ts` and `tests/sync-engine.test.ts`.
9. **Security review:** `npm audit --omit=dev`; look for new endpoints without authentication or CSRF checks; make sure nothing logs request bodies, cookies or tokens.
10. **Offline packs:** download one pack in a real browser and check it shows "downloaded"; stop one halfway and restart it.
11. **Version and notes:** update `docs/CHANGELOG.md` (separate **App** and **Content** sections) and the version in `package.json`.
12. **Deploy** the built `dist/`. For the sync server, take a backup first (`BACKUP_DIR` snapshot) and keep the previous build to roll back to.
13. **Rollback:** redeploy the previous `dist/` (the service worker updates itself on the next visit) and, if the server's database changed, restore the pre-release snapshot (see docs/SERVER.md).
