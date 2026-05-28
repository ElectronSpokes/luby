# Luby — Architecture Decisions
*Maintained by: Cleireach*
*Last updated: 2026-05-25*

<!-- New decisions append to the bottom. Format: ## DD-N: <title> -->
<!-- Content promoted from .claude/rules/decisions.md on 2026-05-25 as DD-1..DD-12. See DD-AUDIT below. -->

## DD-1: Google Sign-In for mobile, Authentik OIDC for web

**Date:** 2026-03
**Decision:** Mobile uses the Google Sign-In SDK (`@capgo/capacitor-social-login`); web uses Authentik OIDC redirect flow.
**Rationale:** Mobile deep-link OIDC was unreliable — Chrome Custom Tabs blocked redirects and cookies didn't persist. Native Google Sign-In is one tap, no browser, no deep-link fragility.
**Implementation:** Mobile ID token exchanged server-side at `POST /api/v1/auth/google-signin`; server issues HS256 JWT (30-day).
**Status:** Partly superseded 2026-05-28 — see DD-17. Google Sign-In remains the preferred path on Play-Services-equipped devices but is incompatible with GrapheneOS / non-Play-Services Android (Credential Manager API can't route to Sandboxed Google Play). Mobile gains a parallel Authentik OIDC PKCE custom-scheme path; user picks provider at sign-in time. Original "Chrome Custom Tabs blocked redirects" rationale is stale — dogfood proved out PKCE custom-scheme on Capacitor 8 in 2026-05.

## DD-2: Session cookies over JWT (web only)

**Date:** 2026-03
**Decision:** Web auth uses a session cookie on `.myluby.net`; no JWT.
**Rationale:** Simpler for a personal app. Cookie works across the CF Pages frontend and the CF Tunnel API.
**Watch for:** Mobile path diverged at DD-1 — mobile uses HS256 JWT (30-day), not cookies. Cookies don't persist across app restarts on mobile.

## DD-3: Cross-origin sameSite=None

**Date:** 2026-03
**Decision:** Session cookie set with `SameSite=None; Secure`.
**Rationale:** Required for `capacitor://localhost` (iOS) and `http://localhost` (Android) to send cookies to `api.myluby.net`.

## DD-4: Hono over Express

**Date:** 2026-03
**Decision:** API framework is Hono, not Express.
**Rationale:** Lighter, Bun-native, better TypeScript support.
**Status:** Closed 2026-05-25 — express has been removed from `api/package.json`; the legacy-compat watch-for is satisfied. No further action.

## DD-5: Gemini server-side only

**Date:** 2026-03
**Decision:** All AI calls proxied through `/api/v1/ai/*`; the API key never reaches the client.
**Rationale:** Client-side keys would leak into the bundle and rotate badly.
**Verify:** `grep -c 'AIzaSy' dist/assets/*.js` must return 0 in any production build.

## DD-6: Vault AppRole for secrets

**Date:** 2026-03
**Decision:** API loads secrets from Vault via AppRole at startup (DB URL, Gemini key, auth creds). `.env` fallback for local dev only.
**Rationale:** Avoids env-files-as-source-of-truth drift. Vault path: `secret/data/luby/api`.

## DD-7: Single migration file for v1

**Date:** 2026-03
**Decision:** All v1 tables in `001-initial-schema.sql`.
**Rationale:** Schema is stable enough that splitting per-table costs more than it gives.
**Current count (2026-05-25):** 10 user-data tables + `_migrations` meta (was "9 tables" at the original 2026-03 decision; +1 since).
**Watch for:** Split when schema evolves substantially.

## DD-8: Single App.tsx over router

**Date:** 2026-03
**Decision:** All views in a single `App.tsx` with tab-based navigation; no router library.
**Rationale:** Works well for mobile-first layout.
**Watch for:** Refactor to a `pages/` directory when `App.tsx` exceeds ~2000 lines.

## DD-9: Capacitor Preferences for auth tokens

**Date:** 2026-03
**Decision:** Mobile auth tokens stored via Capacitor Preferences plugin; `localStorage` used as a cache for offline UX.
**Rationale:** API is source of truth; the local store is a cache, not state.

## DD-10: Gitea → GitHub → CF Pages pipeline

**Date:** 2026-03
**Decision:** Push to Gitea (now Forgejo), auto-mirror to GitHub, CF Pages auto-deploys.
**Rationale:** One `git push` ships the frontend with no manual deploy step.

## DD-11: CF Tunnel for API

**Date:** 2026-03
**Decision:** API exposed via Cloudflare Tunnel at `api.myluby.net`, not direct port forwarding.
**Rationale:** Tunnel handles TLS termination, no firewall port management.

## DD-12: APK served from API

**Date:** 2026-03
**Decision:** Debug APK download at `/download/app.apk` on the API for dev distribution.
**Rationale:** Quick path to install on a device while iterating.
**Status:** Closed 2026-05-26 — replaced by P0 F-Droid Distribution (`/opt/halinova/spec/luby/fdroid-distribution/`). Release-signed APKs now published to `https://fdroid.myluby.net/repo`; the `/download/app.apk` route was removed from `api/src/index.ts` in CL-1.

---

## DD-AUDIT: decisions.md location standardised

**Date:** 2026-05-25
**Decision:** Architecture decisions live in `product/decisions.md`, not `.claude/rules/decisions.md`.
**Rationale:** HALINOVA portfolio standard requires `product/decisions.md` as the canonical location (loaded by `/springboard` and audited by DaChief `STANDARD_DOCS`). Content lifted from `.claude/rules/decisions.md` as DD-1..DD-12; old file replaced with a one-line redirect.
**Watch for:** Some decisions visible in `product/architecture.md`'s Key Decisions table aren't yet captured as DD-N entries — promote on next material touch.
**Status:** Partly closed 2026-05-25 — DD-13..DD-16 promoted from architecture.md's Key Decisions table in the same commit. DD-1 (Google Sign-In) was the only Key Decisions row already covered (matched DD-1).

---

## DD-13: Static import for Capacitor plugins

**Date:** 2026-04 *(recorded 2026-05-25)*
**Decision:** Capacitor plugin entry points are imported statically (`import { SocialLogin } from '@capgo/capacitor-social-login'`), never dynamically (`await import('...')`).
**Rationale:** Dynamic imports hang in production-bundled WebView. Vite bundles the web polyfill, and the native bridge cannot intercept a polyfill loaded dynamically — the call resolves against the polyfill instead of the native plugin.
**Implementation:** Enforced as a standard in `product/standards.md` under "Capacitor / Mobile Standards".

## DD-14: No JWT audience check on Google Sign-In tokens

**Date:** 2026-04 *(recorded 2026-05-25)*
**Decision:** Server-side validation of Google ID tokens verifies signature against Google JWKS only; the `aud` claim is NOT checked.
**Rationale:** Android Google Sign-In issues tokens with the Android client ID as audience, not the web client ID. Auto-validating `aud` would reject every mobile login. Signature verification against Google JWKS is the security boundary.
**Watch for:** If a future scenario calls for accepting Google ID tokens from a third-party context outside the controlled mobile/web client pair, revisit — `aud` validation becomes load-bearing then.

## DD-15: Email-based user matching on Google Sign-In

**Date:** 2026-04 *(recorded 2026-05-25)*
**Decision:** When a Google Sign-In flow completes, the server matches the user via `lookupUserByEmail()` rather than creating a new user keyed off the Google `sub` claim.
**Rationale:** Many users already have Authentik accounts created via the web OIDC flow. Matching by email avoids producing duplicate `users` rows for the same person who comes in via two auth providers.
**Watch for:** The `users.sub` column is `UNIQUE NOT NULL` but `users.email` has no UNIQUE constraint (see `api/migrations/001-initial-schema.sql`). Multi-row-per-email is therefore possible if the matching logic ever creates instead of returning an existing row. Email-as-identity also assumes stable email-to-account binding upstream — if Authentik allows email changes without propagation, matching can become incorrect.

## DD-16: Open CORS, tightening deferred

**Date:** 2026-04 *(recorded 2026-05-25)*
**Decision:** CORS middleware uses `origin: (origin) => origin` — every Origin header is reflected, no allowlist.
**Rationale:** Capacitor WebView origin varies by platform and build type (`capacitor://localhost` on iOS, `http://localhost` on Android, sometimes `https://localhost` in release builds), and a tightened allowlist would risk locking out a build variant before all origins are catalogued.
**Status:** Deliberate technical debt — kept open during mobile-first development.
**Watch for:** Until an explicit allowlist lands, CORS provides no origin-level defence — the auth middleware is the only barrier. Next step: catalogue every Capacitor origin actually used across iOS dev/release and Android dev/release builds, then narrow to that set + the production web origin.
## DD-17: Google Sign-In on Android excludes GrapheneOS / non-Play-Services devices

**Date:** 2026-05-28
**Decision:** Add an Authentik OIDC PKCE custom-scheme sign-in path to the Luby Android app as a parallel option to Google Sign-In. Track as new roadmap priority; ship before any further F-Droid release where practical.
**Rationale:** Google Sign-In via Credential Manager (`GetSignInWithGoogleOption`) requires deeply-integrated Google Play Services. GrapheneOS does not ship Play Services; even with Sandboxed Google Play installed, the Credential Manager API does not reliably route to the sandboxed Play provider — every sign-in attempt returns `NoCredentialException` ("no credentials available"), regardless of OAuth client configuration, SHA-1 registration, or system-level credential-provider toggles. Confirmed live 2026-05-28 with all three remediation paths exhausted: new release-keystore SHA-1 added to OAuth client in correct project, Google Play services cache cleared, system credential-provider toggle verified on. This is a known and documented incompatibility, not a Luby code or configuration issue. The primary Luby user is on GrapheneOS and cannot sign into the F-Droid-distributed Android app as a result.
**Implementation:** Mirror dogfood's lived pattern (`band.dogfood.app://callback` PKCE custom-scheme flow on Capacitor 8, shipped 2026-05). Add `net.myluby.app://callback` as a redirect URI on the Luby Authentik OIDC client, enable PKCE, and route the existing Authentik authorization-code flow through a system-browser tab with the custom-scheme callback returning to the app. Server side: add `/api/v1/auth/authentik-mobile-callback` exchanging the auth code for a Luby HS256 JWT (same 30-day token shape as existing Google Sign-In path; reuses `lookupUserByEmail` matching per DD-15).
**Status:** Open — spec needed. Workaround: open `https://myluby.net` in Vanadium / mobile browser; web Authentik flow works on GrapheneOS today.
**Watch for:** PKCE custom-scheme callback on Capacitor 8 has known fragility with deep-link races when the app is killed during the browser hop — see dogfood's Wave 1 Phase B notes (`/opt/dogfood/product/session-notes.md`, parks 2026-05-04) for the proven fix pattern. iOS will need a parallel Universal Links / Associated Domains shape; out of scope at first cut.
**Supersedes (in part):** DD-1 — original "Mobile deep-link OIDC was unreliable" finding is stale (March 2026; predates Capacitor 8 + dogfood's PKCE proof). Google Sign-In remains the path for Play-Services-equipped devices; Authentik PKCE becomes the fallback for non-Play-Services devices. User picks at sign-in time.
