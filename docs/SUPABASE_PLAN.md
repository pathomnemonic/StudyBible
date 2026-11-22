# Moving accounts and sync to the shared Supabase project: proposal

**Status: a proposal. Nothing here has been built or applied.** It needs a yes from Mathews on the open decisions at the end, and some facts about the shared project that only Orion can read (the checklist for that is at the bottom).

## What stays and what is replaced

| Today (self-hosted Node + SQLite, built, off) | On Supabase |
|---|---|
| email + password, scrypt, sessions in our table | **Supabase Auth** (the one account across all of Mathews's apps) |
| Google / Microsoft / Apple sign-in (`server/oauth.ts`, built, off) | Supabase Auth's own providers. `server/oauth.ts` is no longer needed |
| lock-out, authenticator-app second step, recovery codes, security log | Supabase Auth's rate limits and TOTP multi-factor. **Recovery codes and our security log have no equivalent** and would be dropped |
| operator invites, reset codes by hand | password reset by email (see the email-limit warning below) |
| `records` table and the `/api/sync` call | a Postgres table and one database function with the same behavior |
| download everything / delete account | a database function, plus an Edge Function for the part a browser cannot do |
| the sync engine in the app (`src/sync/engine.ts`) | **unchanged.** It already talks to "a backend" through one interface (`SyncBackend`), which is how Drive sync plugs in. Supabase becomes a third backend |
| live quiz rooms and weekly leaderboard (`server/app.ts`, in memory) | **not part of this port.** A Supabase Realtime version would be separate work |

The app stays **local-first**: it works with no account and no network, sync is something you turn on, and the offline queue and the "newer record wins, a note edited on two devices keeps both" rules stay exactly as they are, because the same engine runs them.

## Proposed namespace

One dedicated Postgres schema, **`studybible`**, instead of prefixed tables in `public`. Nothing in it can collide with the Dx-family tables, and one `drop schema studybible cascade` removes the whole app's data layer.

```
studybible.profiles    (user_id uuid primary key references auth.users on delete cascade,
                        display_name text, created_at timestamptz default now())
studybible.sync_state  (user_id uuid primary key references auth.users on delete cascade,
                        seq bigint not null default 0, records int not null default 0, bytes bigint not null default 0)
studybible.records     (user_id uuid references auth.users on delete cascade,
                        tbl text not null,            -- notes, highlights, bookmarks, ...: a fixed list, checked
                        uid text not null,
                        updated_at bigint not null,   -- the writer's clock, as today
                        deleted boolean not null default false,
                        payload jsonb not null,
                        seq bigint not null,
                        primary key (user_id, tbl, uid))
                       + index (user_id, seq)
```

* **No trigger on `auth.users`.** The auth system is shared, so a trigger there would fire when someone signs up to any other app. A person's `profiles` row is created the first time they use StudyBible.
* The schema must be added to the project's **exposed schemas** (API settings) for the browser to call its functions. Orion can do that.

## Row-level security

* RLS **on** for all three tables, nothing granted to `anon`, `usage` on the schema granted only to `authenticated`.
* `select` policies: `user_id = (select auth.uid())`. So a signed-in person can only ever read their own rows.
* **No insert, update or delete policies at all.** Every write goes through the functions below, which check the person with `auth.uid()`, validate the shape and size, and keep `seq` correct. A browser cannot write a row directly.
* The functions are `security definer` with an empty `search_path`, execute revoked from `public`/`anon`, granted to `authenticated`. They never trust a user id passed in by the caller.

## The functions (the whole server, in SQL)

* `studybible.sync(p_protocol int, p_cursor bigint, p_changes jsonb)` returns `{ cursor, more, rejected, changes }`: the same call and the same rules as `/api/sync` today (reject a shape that is wrong or a record too large, newer `updated_at` wins, a deletion is a row with `deleted = true`, page the answer, per-person limits of 200,000 records and 100 MB). The per-person `seq` is bumped by updating `sync_state` inside the call, which serializes one person's writes. A shared global sequence would not do: two writes could commit out of order and a device could skip a row for good.
* `studybible.export_all()` returns everything the person has, as the download does today.
* `studybible.delete_my_data()` deletes their `records`, `sync_state` and `profiles` rows.

## Deleting an account: the part to decide

The stores require an in-app way to delete the account once accounts exist. With **one shared account across apps**, "delete my account" has two meanings, and a browser cannot remove an `auth.users` row at all (that needs the service key, which must never be in the app).

* An **Edge Function** `studybible-delete-account`, called with the person's own session, would: delete their StudyBible data; then, **only if they have no data in any other app**, delete the auth user. If they do, it deletes only StudyBible's data and says so plainly ("your account is still used by another app; its data was not touched").
* **This needs a fact I do not have**: how the other apps (Dx Dash and the rest) key their data to a user, so the check "do they have data elsewhere" can be written. Without it the safe default is to delete only StudyBible's data and leave the sign-in.
* Whether that satisfies Apple's rule (an account created in the app must be deletable in the app) when the sign-in survives is a question for the store-launch step. It may be that deleting the shared sign-in everywhere, with a clear warning, is the only fully compliant choice.

## What I will not do

* Put the service key, the Management API token or any secret in the app or the repo. The app needs only the project URL and the **anon key**, which are public by design (RLS is what protects the data).
* Load the Supabase client on every page. It adds tens of kilobytes and the entry bundle is within 4 KB of its budget, so it goes in a lazily loaded chunk, used only by the account pages.
* Apply anything to the live project before the SQL has passed tests (below) and Mathews has agreed.

## How it would be tested without touching the live project

* The migration SQL lives in `supabase/migrations/`, and the sync and RLS behavior is tested in the unit tests against an in-process Postgres (PGlite) with a stand-in for `auth.uid()`: the same cases the Node server's tests cover today (two devices, a deletion, a conflict, a refused shape, limits, "cannot read another person's rows", "cannot write directly").
* Orion applies the migration to the live project and checks the result there, as offered.
* Only then does the app get a Supabase backend behind the existing accounts switch, off by default, like everything else here.

## Free-plan facts that matter for launch

* **Email**: the built-in sender allows only a few messages an hour. Sign-up confirmation and password reset **will fail under real use**; a real email provider (SMTP) must be configured before launch.
* A free project **pauses after a week of no activity** (Orion's keep-alive watch covers that) and has a 500 MB database and limited egress. It is fine for a beta, and probably not for a public launch of several apps.
* One project for every app means one project's outage, quota or mistake affects all of them.

## Decisions I need from Mathews

1. Is the schema-per-app approach (`studybible`) agreed?
2. Keep the self-hosted server code as an unsupported alternative, or remove it once Supabase works?
3. Is losing recovery codes and the in-app security log acceptable?
4. Account deletion: delete only StudyBible's data (and keep the shared sign-in), or remove the sign-in everywhere with a warning?
5. Is the **optional Google Drive sync** (built, off) still wanted once Supabase sync exists, or retired?

## What I need Orion to read (read-only) from the project

1. The auth settings: which providers are on, whether email confirmation is required, the redirect URL list, the SMTP/custom-email setting.
2. The names of the existing schemas and whether any trigger sits on `auth.users`.
3. How Dx Dash keys its rows to a user (the column name and what it references), and any shared tables for profiles or "which apps does this person use".
4. The RLS pattern already used, so StudyBible's matches it.
5. Which schemas the API currently exposes, and the Edge Functions already deployed.
6. The anon key and project URL (public values, for the build setting only). **Not** the Management token or any service key.

## What was read from the live project (Nov 22), and what it changes

Read by Orion, read-only. Public values only; no Management token or service key was shared.

* **Project** `replaqmcwynrxclunkck` (ca-central-1, Free plan). Schemas: `public` (the Dx family, about 171 tables and views), `old_game` (the frozen v1; **not to be touched**), plus system schemas. No `studybible` schema yet. **No trigger on `auth.users`**, so the "no trigger" rule above costs nothing.
* **Anonymous sign-ins are enabled.** Those people hold the same `authenticated` role as everyone else, so a rule that only checks "signed in" would let an anonymous visitor store up to 100 MB in `studybible.records`. **Every StudyBible function must refuse them**: check `(auth.jwt() ->> 'is_anonymous')::boolean is not true` as well as `auth.uid() is not null`, and the tests must cover it. Sign-up is also open, so the per-person limits in the functions matter.
* **Email**: confirmation is ON, there is no custom SMTP, and the limit is **2 emails per hour for the whole project**. A real email provider is a **launch blocker**, not a nicety, and it will also affect every other app sharing the project.
* **No sign-in providers are configured.** Google and Apple sign-in (Apple's is required in the iOS app if Google is offered) each need their own client credentials set up in the project. Until then, accounts are email and password only.
* **Redirect allow list** holds only Dx addresses, `http://localhost:5173/**` and the Dx native scheme. StudyBible's address, `https://pathomnemonic.github.io/StudyBible/`, must be added or confirmation and reset links fail. The native store apps will need their own scheme added later.
* **This app uses `#/` routes, and Supabase returns its result in the address.** The default way returns the tokens in the `#` part, which would collide with the router. The app must use the **PKCE flow**, which comes back as `?code=…` before the `#`, and call `exchangeCodeForSession` on load, then move on to `#/account`. This is a design requirement, not a detail.
* **Rows in the Dx tables carry a `user_id` that references the shared auth user**, with RLS written as `auth.uid() = user_id`. StudyBible's policies use the same form on `studybible.records`.
* **The two existing Edge Functions** (`pro-checkout`, `stripe-webhook`) belong to Dx's paid tier. StudyBible has no paid tier and must not call or depend on them.

### Deleting an account, after seeing how Dx stores data

"Does this person have data in another app" would mean checking about 28 Dx tables that carry a `user_id`, and any other app's tables, from inside a StudyBible function. That check would break whenever another app adds a table. Two simpler ways, for Mathews to choose between:

1. **Recommended: StudyBible deletes only its own data**, and says plainly that the shared sign-in remains because other apps may use it. Removing the sign-in itself is a separate, clearly labelled "delete my account everywhere" action.
2. A small shared registry (`public.app_memberships(user_id, app)`) that every app writes to, so the Edge Function can ask it. This needs a change in the shared `public` schema, which is Mathews's call and affects the Dx family.

Whether option 1 satisfies the Apple and Google account-deletion rule must be checked at store-launch time against their current wording; I have not verified it.

