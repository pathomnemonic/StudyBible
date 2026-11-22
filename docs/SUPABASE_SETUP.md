# StudyBible on Supabase: what is built, how to turn it on, how to check it

Built and tested, and **off**: the app uses the Supabase backend only when the build has both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, and the account screens only exist when the accounts switch is on (`VITE_ACCOUNTS=1`, see `ACCOUNTS_ROLLOUT.md`). Decisions behind it are in `SUPABASE_PLAN.md`.

## What exists

| Piece | Where |
|---|---|
| The `studybible` schema, row-level security and functions. Two migrations, **in this order**: the first creates it, the second turns profiles into per-app accounts (`create_account`, `account_status`, `delete_account`; sync and the rest require an account) | `supabase/migrations/20261123000000_studybible_schema.sql`, `20261123010000_studybible_accounts.sql` |
| The "delete my account everywhere" function (needs the service key, so it runs on Supabase, not in the app) | `supabase/functions/studybible-delete-account/index.ts` |
| The app side: the same surface as the self-hosted server's client, so the sync engine and account screens are unchanged | `src/sync/supabaseApi.ts` (loaded on first use, in its own chunk) |
| Account screens | "create your StudyBible account" step, "Continue with Google" (when the project has it on), two deletion actions, email password reset, no recovery codes, no security log |

## Turning it on (in this order; nothing before step 4 changes the live site)

1. **Apply both migrations, in order** (Orion, through the Management API, or `supabase db push`). They only create and change the `studybible` schema; they do not touch `public` or `old_game`. The second is safe whether or not the first was already applied.
2. **Expose the schema**: Settings, API, "Exposed schemas": add `studybible`.
3. **Deploy the function**: `supabase functions deploy studybible-delete-account`. Leave "verify JWT" on. Optional secret `STUDYBIBLE_ORIGINS` (default `https://pathomnemonic.github.io`).
4. **Redirect list**: add `https://pathomnemonic.github.io/StudyBible/` (Authentication, URL configuration). Without it confirmation and reset links fail.
5. **A real email provider** (custom SMTP). The built-in sender allows 2 emails an hour for the whole project: sign-up confirmation and password reset will not work for real users without this.
6. **Repository variables** (not secrets): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Settings, Secrets and variables, Variables). The deploy passes them to the build.
7. Build with `VITE_ACCOUNTS=1` (or the private preview switch) to show the account screens.

## How to check it on the live project (after steps 1 to 6, with a test account)

0. **The sign-in pool**: sign up with the same email in StudyBible and (with a test redirect) from another app or the dashboard; it should be ONE user, not two. If it is two, tell me: the account model in the plan needs rethinking.
1. Sign up with a real email; confirm that the confirmation email arrives, and that its link returns to the app and signs in, with a StudyBible account created (Account page shows your library, not "create your account").
1b. Sign in with an email that exists only in another app: the app must offer "Create your StudyBible account" and send nothing until you press it. Check `studybible.accounts` has no row before, one after.
2. Write a note on device A; sync; see it on device B. Edit on B, delete on A, and see both changes arrive.
3. Reset the password by email; the link must come back to the app and show "Choose a new password".
4. Turn on the authenticator second step, sign out, sign in with the code.
5. **Anonymous refusal**: call `studybible.sync` with an anonymous session (Supabase can create one); it must fail with "sign in with an email".
6. **Row security**: with a second account, read `studybible.records` directly; it must return only that account's rows, and a direct insert must fail.
7. "Download my data" returns your notes. "Delete my StudyBible account" removes the account and its data (check `studybible.*` has nothing for that user) and leaves the sign-in and any other app's data for the same sign-in untouched; sign in again and you are asked to create a new account, which starts empty.
8. The separate "Also remove my sign-in" on a throwaway account removes the sign-in (check the Auth users list). Skip this check if Mathews removes that button.
9. **Google**: after the setup below, "Continue with Google" returns to the app and lands on "create your StudyBible account" for a new person.

## What is not verified

Everything above was tested **in-process**: the SQL in a real Postgres (PGlite) with a stand-in for Supabase's own `auth` helpers, and the app code against a scripted client, and the sync engine end to end through both. **Nothing has run against the live project**: not the email flow, not the redirect handling (the PKCE return and the "password recovery" event are relied on as Supabase documents them), not the Edge Function (it is Deno code with no local test), not Supabase's MFA calls. The list above is how that gets checked.

## Not done on purpose, yet

* **The self-hosted server code stays** until the checks above pass on the live project; then it is removed, as decided.
* **Google Drive sync stays** (off) until Supabase sync is verified; then it is retired, as decided.
* Sign-in with Google or Apple needs providers set up in the project (none are), and Apple's is required in the iOS app if Google is offered.
* Live quiz rooms and the weekly leaderboard run on the self-hosted server and are not part of this port.

## Setting up Google sign-in (project side; nothing in the app changes)

1. In Google Cloud: an OAuth client of type *Web application*, and the OAuth consent screen (app name, support email, privacy policy link; "In production" for the public).
2. **Authorized redirect URI** on that client: `https://replaqmcwynrxclunkck.supabase.co/auth/v1/callback`.
3. In Supabase, Authentication, Providers, Google: switch it on and paste the client id and secret.
4. Each app's own address must be on the redirect list (StudyBible: `https://pathomnemonic.github.io/StudyBible/`). The app asks for it as its return address.
5. Apple's sign-in (required in the iOS app if Google is offered) is set up the same way, later.

One Google client serves every app on the project. That is also why a Google sign-in is the same sign-in in every app, with a separate account in each.

