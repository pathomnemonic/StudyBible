# Security

If you find a vulnerability in the app or the optional sync server (`server/`), please report it privately by email to the project owner or through GitHub's private vulnerability reporting for this repository, rather than in a public issue. Include the steps to reproduce it and the version or commit. You will get an answer within a week.

Notes for people who run the server: it listens on 127.0.0.1 by default, expects an HTTPS reverse proxy in front of it, trusts `X-Forwarded-For` only if `TRUST_PROXY=1`, and stores synced notes in readable form (sync is not end-to-end encrypted). See docs/SERVER.md.
