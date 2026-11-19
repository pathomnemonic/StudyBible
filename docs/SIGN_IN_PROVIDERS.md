# Sign in with Google, Microsoft or Apple

Built, tested and **off**. Nothing about it shows anywhere until two switches are on: the accounts switch (see `docs/ACCOUNTS_ROLLOUT.md`) and `OAUTH=on` on the server with at least one provider's credentials. With either missing there are no routes, no buttons and no mention of it.

## What it does and does not do

* A provider (Google and so on) only **proves who someone is**. It does not store their notes. Notes and highlights still sync to the account on your server, in the same SQLite file as every other account.
* Someone can create an account with a provider, or add a provider to an account they already have (Account page, "Ways to sign in"). An account made with a provider has no password until its owner sets one; the settings that ask for a password (change email, second step, delete) ask them to set one first.
* A provider account is **never joined to an existing account just because the emails match**. That would let anyone who controls a lookalike address take the account over. The owner signs in the usual way and adds the provider from their account page.
* A person who turned on a second step (authenticator code) is **not** signed in by a provider alone: they see a message to use their password and code. Handling the code after a provider sign-in is not built yet.
* If a provider does not promise the email is verified (Microsoft never does), the account gets a placeholder address (`...@sign-in.invalid`) instead, so no one can claim an address that is not theirs.

## How it works (so you can judge it)

OpenID Connect, authorization-code flow:

1. `GET /api/auth/oauth/<provider>/start` makes a one-time **state**, a **nonce** and a **PKCE** verifier, saves them for 10 minutes in the database, and sends the browser to the provider.
2. The provider sends the browser to `GET /api/auth/oauth/<provider>/callback` (Apple posts to it). The state is looked up and **deleted in the same step**, so a replayed or invented state finds nothing.
3. The server swaps the code for an ID token, then checks it itself with no third-party library: RS256 or ES256 only (never `none`), the signature against the provider's published keys, issuer, audience (your client id), expiry and the nonce.
4. It finds or creates the account, starts a normal session cookie, and sends the browser to `<PUBLIC_URL>/#/account?signed_in=<provider>` (or `?sign_in_error=<reason>`).

Nothing about this adds an external database or a paid service.

## What you need to provide

You need **an address on the internet that runs the bundled server over HTTPS**. The GitHub Pages copy cannot do this (it has no server). Providers refuse plain `http` except for `localhost` while testing, and Apple refuses `localhost` altogether.

Settings for every provider:

| Variable | Meaning |
|---|---|
| `OAUTH` | `on` to turn sign-in providers on. Anything else, or unset, leaves them off |
| `PUBLIC_URL` | the address people use to reach the app, with no path, for example `https://study.example.org` |

The return address you register with each provider is always `PUBLIC_URL` followed by `/api/auth/oauth/<provider>/callback`, for example `https://study.example.org/api/auth/oauth/google/callback`.

### Google (the easiest, and the one to start with)

Free. You need a Google account and about twenty minutes.

1. Open the Google Cloud console, create a project, and set up the **OAuth consent screen**: app name, a support email, and (for anyone beyond test users) a link to your privacy policy and your domain. Leave it in "Testing" with your own account as a test user while you try it; it must be "In production" for the public. Basic sign-in (name, email, picture) needs no Google review.
2. Create credentials → **OAuth client ID** → application type **Web application**.
3. Under **Authorized redirect URIs** add exactly `https://<your address>/api/auth/oauth/google/callback`.
4. Copy the **client ID** and **client secret** to me (or set them on the server yourself):

   ```
   GOOGLE_CLIENT_ID=...apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=...
   ```

### Microsoft (personal and work accounts)

Free. In Microsoft Entra ("App registrations") register an app, choose "Accounts in any organizational directory and personal Microsoft accounts", add a **Web** redirect URI `https://<your address>/api/auth/oauth/microsoft/callback`, and create a client secret (**it expires**, at most 24 months, so put the date in a calendar).

```
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_TENANT=common        # optional: common (default), organizations, consumers, or one tenant's id
```

### Apple

Needs the **Apple Developer Program** (paid yearly) and a real domain. In the developer account: create an **App ID** with "Sign in with Apple", then a **Services ID** (this is the client id), configure it with your domain and the return URL `https://<your address>/api/auth/oauth/apple/callback`, then create a **Key** with "Sign in with Apple" and download the `.p8` file once (Apple will not show it again).

```
APPLE_CLIENT_ID=com.example.study.web     # the Services ID
APPLE_TEAM_ID=...                          # 10 characters, top right of the developer account
APPLE_KEY_ID=...                           # 10 characters, from the key
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

Apple only sends the person's name the first time they sign in, and may give a private relay email address. If an app on the App Store offers other sign-in services, Apple requires "Sign in with Apple" too.

### Other services

Facebook, GitHub, X and others are not OpenID Connect in the same way and are **not built**. Any service that is plain OpenID Connect can be added in a few lines (see `providersFromEnv` in `server/oauth.ts`).

## Turning it on

```
npm run build
OAUTH=on PUBLIC_URL=https://study.example.org GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... npm start
```

Start-up stops with a plain message if `PUBLIC_URL` is missing, is not https, or a provider is half set up. The app itself must also be built with the accounts switch (`VITE_ACCOUNTS=1`, or the preview switch to try it privately).

## Honest limits

* Tested end to end against a pretend provider (a local server that signs real tokens), not yet against the real Google, Microsoft or Apple. The first real run is the real test, so try Google with your own account before anyone else.
* No provider is contacted until someone presses a button.
* Removing the last way to sign in is refused.

## "Does this remove the need for an external database?"

There is already **no external database**: accounts and synced notes live in one SQLite file next to the server (`DB_PATH`), made by Node's built-in `node:sqlite`, with optional daily verified backups. What the server does need is a host that keeps a disk between restarts and runs Node. Signing in with Google does not change that: Google proves identity but stores none of your readers' notes, so those still need somewhere to live.

The ways to avoid even that file:

1. **No accounts** (what the app does today): everything stays on the device, with export and import files for backup. No server of any kind.
2. **Sync through the reader's own cloud storage** (for example a hidden app folder in their Google Drive). You would hold no data at all, and Google would hold it under the reader's own account. It is a real option but a different build: it needs Google's Drive permission (reviewed by Google), and merging changes between devices from files is harder than from a server. Not built.
3. **Today's design**: one small server and one file you back up.
