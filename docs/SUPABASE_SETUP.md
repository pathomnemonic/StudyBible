# StudyBible on Supabase: what is built, how to turn it on, how to check it

Built and tested, and **off**: the app uses the Supabase backend only when the build has both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, and the account screens only exist when the accounts switch is on (`VITE_ACCOUNTS=1`, see `ACCOUNTS_ROLLOUT.md`). Decisions behind it are in `SUPABASE_PLAN.md`.

## What exists

| Piece | Where |
|---|---|
| The `studybible` schema, row-level security and functions (`sync`, `export_all`, `stats`, `set_display_name`, `delete_my_data`) | `supabase/migrations/20261123000000_studybible_schema.sql` |
| The "delete my account everywhere" function (needs the service key, so it runs on Supabase, not in the app) | `supabase/functions/studybible-delete-account/index.ts` |
| The app side: the same surface as the self-hosted server's client, so the sync engine and account screens are unchanged | `src/sync/supabaseApi.ts` (loaded on first use, in its own chunk) |
| Account screens | two deletion actions, email password reset, no recovery codes, no security log |

## Turning it on (in this order; nothing before step 4 changes the live site)

1. **Apply the migration** to the project (Orion, through the Management API, or `supabase db push`). It only creates the `studybible` schema; it does not touch `public` or `old_game`.
2. **Expose the schema**: Settings, API, "Exposed schemas": add `studybible`.
3. **Deploy the function**: `supabase functions deploy studybible-delete-account`. Leave "verify JWT" on. Optional secret `STUDYBIBLE_ORIGINS` (default `https://pathomnemonic.github.io`).
4. **Redirect list**: add `https://pathomnemonic.github.io/StudyBible/` (Authentication, URL configuration). Without it confirmation and reset links fail.
5. **A real email provider** (custom SMTP). The built-in sender allows 2 emails an hour for the whole project: sign-up confirmation and password reset will not work for real users without this.
6. **Repository variables** (not secrets): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Settings, Secrets and variables, Variables). The deploy passes them to the build.
7. Build with `VITE_ACCOUNTS=1` (or the private preview switch) to show the account screens.

## How to check it on the live project (after steps 1 to 6, with a test account)

1. Sign up with a real email; confirm that the confirmation email arrives, and that its link returns to the app and signs in.
2. Write a note on device A; sync; see it on device B. Edit on B, delete on A, and see both changes arrive.
3. Reset the password by email; the link must come back to the app and show "Choose a new password".
4. Turn on the authenticator second step, sign out, sign in with the code.
5. **Anonymous refusal**: call `studybible.sync` with an anonymous session (Supabase can create one); it must fail with "sign in with an email".
6. **Row security**: with a second account, read `studybible.records` directly; it must return only that account's rows, and a direct insert must fail.
7. "Download my data" returns your notes. "Delete my StudyBible data" empties them and leaves you signed in (check another app of the same account still works).
8. "Delete my account everywhere" on a throwaway account removes the sign-in (check the Auth users list).

## What is not verified

Everything above was tested **in-process**: the SQL in a real Postgres (PGlite) with a stand-in for Supabase's own `auth` helpers, and the app code against a scripted client, and the sync engine end to end through both. **Nothing has run against the live project**: not the email flow, not the redirect handling (the PKCE return and the "password recovery" event are relied on as Supabase documents them), not the Edge Function (it is Deno code with no local test), not Supabase's MFA calls. The list above is how that gets checked.

## Not done on purpose, yet

* **The self-hosted server code stays** until the checks above pass on the live project; then it is removed, as decided.
* **Google Drive sync stays** (off) until Supabase sync is verified; then it is retired, as decided.
* Sign-in with Google or Apple needs providers set up in the project (none are), and Apple's is required in the iOS app if Google is offered.
* Live quiz rooms and the weekly leaderboard run on the self-hosted server and are not part of this port.
