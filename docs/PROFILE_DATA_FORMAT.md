# Profile data format (saints, biblical people, places)

File: `public/data/profiles/profiles.json`. It ships empty on purpose. The app has the structure, the checks and the pages; the facts must come from reviewed sources.

```json
{
  "version": 1,
  "profiles": [
    {
      "id": "thomas-aquinas",
      "kind": "saint",
      "name": "Thomas Aquinas",
      "alternateNames": ["Tommaso d’Aquino", "Thomas of Aquino"],
      "authorId": "aquinas",
      "feast": "01-28",
      "period": { "from": 1225, "to": 1274 },
      "passages": ["JHN.6.51-58"],
      "related": [{ "id": "albert-the-great", "relation": "student of", "source": { "label": "…", "kind": "historical" } }],
      "facts": [{ "text": "…", "source": { "label": "…", "kind": "historical", "url": "…" }, "confidence": "certain" }]
    },
    {
      "id": "capernaum",
      "kind": "place",
      "name": "Capernaum",
      "identification": { "ancient": "Kapharnaum", "modern": "…", "confidence": "probable", "source": { "label": "…", "kind": "historical" } },
      "facts": [ … ]
    }
  ]
}
```

Rules, enforced by `validateProfiles` (src/lib/profiles.ts) and `tests/profiles.test.ts`:

- `id` is stable and never reused: lower-case words joined by hyphens, unique within its `kind`.
- Every fact names a source (`label` and `kind`: scripture, magisterium, historical or editorial). No bare assertions.
- A place's modern identification must say how sure it is (`certain`, `probable`, `disputed`).
- `feast` is `MM-DD`; `period.from` is not after `period.to`.
- Every `related.id` must exist in the file; relations carry their own source.
- `authorId` ties a saint to their writings in the library by identity, not by matching names.

Adding data: put entries in the file, run `npx vitest run tests/profiles.test.ts`, then rebuild the manifest (`npx tsx -e "import {buildManifest} from './scripts/ingest/manifest'; buildManifest()"`). Add the source's licence to `public/data/licenses.json` under `profiles`.
No schema migration is involved: this is static data, not synced user data.
