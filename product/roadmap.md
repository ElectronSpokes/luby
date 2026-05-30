# Luby — Roadmap
*Maintained by: Cleireach*
*Last updated: 2026-05-25*

## Current State

**10 API route groups** with 7 AI-powered endpoints. **React 19 SPA** on Cloudflare Pages. **Hono + Bun API** on dedicated VM (10.0.110.27). **Capacitor 8** mobile shell with Android + iOS scaffolds. **Gemini 2.5 Flash** for all AI features. **PostgreSQL 16** with 10 user-data tables (+ `_migrations`). **Authentik OIDC** for web auth, **Google Sign-In** for mobile.

The health tracking platform is live at myluby.net.

## Current Focus

**P0 Authentik PKCE mobile sign-in shipped 2026-05-30** — v0.2.0 + v0.2.1 live on household F-Droid; AC-9 first-install verified end-to-end on 48k's GrapheneOS Pixel. Closes DD-17 (GrapheneOS Sign-In blocker). Spec at `/opt/halinova/spec/luby/authentik-pkce-mobile/`.

**P0 F-Droid Distribution shipped 2026-05-26** — Luby installable + updatable via household F-Droid at `https://fdroid.myluby.net/repo`, release-signed APK pipeline live on `v*` tags. Spec at `/opt/halinova/spec/luby/fdroid-distribution/`.

**Most pickup-ready next moves**, in order of friction-cost:

1. **Maintenance items** (Maintenance & Watch section below) — small, no external dependencies, can be batched into one PR. Includes Vault-vs-`.env` source-of-truth audit (now with concrete data point from PKCE Wave 6 — luby-api runs env-only despite DD-6 claim).
2. **P5 expansion** of historical charts beyond the food-only `BarChart` already shipped — purely additive, no new infrastructure.
3. **P1 credential acquisition** (Apple Developer + Google Play Console + Firebase) — blocks the rest of P1; need 48k to start these processes externally.
4. **P4 voice client** — `GET /ai/live-token` server scaffold exists; client-side voice UI is greenfield.

P1 cannot meaningfully advance until the external credentials are in hand; P2/P3 are larger scoped greenfield work.

## What Was Built

### Core App (Mar 2026)
5 tracking domains live: food logging, hydration, movement, fasting timer, AI coaching plans. React SPA with Vite + Tailwind v4. Hono API on Bun with systemd management. PostgreSQL schema with migration system.

### AI Integration (Mar 2026)
7 Gemini 2.5 Flash endpoints: food vision scanning (camera → base64 → Gemini Vision), daily coaching plans, health insights, meal plan generation (7-day + shopping lists), recipe search, chat with Luby persona. All structured JSON output.

### Auth (Mar–Apr 2026)
Dual auth: Authentik OIDC for web (session cookies on `.myluby.net`), Google Sign-In SDK for mobile (own HS256 JWT, 30-day expiry). Both paths validate against same users table. See DD-1, DD-2, DD-14, DD-15 in `product/decisions.md` for rationale.

### Mobile Shell (Apr 2026)
Capacitor 8 scaffolded for both iOS and Android (`ios/` and `android/` directories present in repo). Native camera for food scanning. Haptic feedback on all logging actions. Google Sign-In via `@capgo/capacitor-social-login`. Auth token stored in Capacitor Preferences. Android debug APK builds on VM, installed on device.

### Infrastructure (Mar 2026)
Vault AppRole integration (secrets at `secret/data/luby/api`). Cloudflare Pages auto-deploy via Gitea (now Forgejo) → GitHub mirror. Cloudflare Tunnel for API at `api.myluby.net`. systemd service with security hardening (`ProtectSystem=strict`, `NoNewPrivileges=true`).

### Frontend chart (May 2026 — partial)
Basic recharts `BarChart` of the last 7 food entries shipped in `App.tsx:536`. First step toward P5 (Data and Insights).

## What's Next

### Priority 0: Authentik PKCE mobile sign-in — shipped 2026-05-30

*Spec at `/opt/halinova/spec/luby/authentik-pkce-mobile/` — shaped 2026-05-28; closes DD-17 (GrapheneOS Sign-In blocker) by replacing Google Sign-In on mobile with Authentik OIDC PKCE custom-scheme. Mirrors dogfood's 2026-05 Luggage pattern (D-SINGLE-AUTHENTIK-CLIENT, FR-19). Android-only at v1; iOS deferred to P1.*

- [x] Authentik admin: extend Luby OIDC client with `net.myluby.app://callback` redirect URI + enable PKCE
- [x] Port dogfood PKCE library (`/opt/dogfood/lib/native/{deep-link,pkce,platform}.ts` + `/opt/dogfood/hooks/useDeepLinkAuth.ts`) into Luby `src/lib/native/` + `src/hooks/`
- [x] AndroidManifest intent-filter for `net.myluby.app://callback`
- [x] Server `POST /api/v1/auth/mobile-callback` endpoint (Authentik token exchange + JWKS verify + `lookupUserByEmail` + Luby HS256 JWT issue)
- [x] Replace mobile sign-in UI in `src/lib/useAuth.ts`: drop SocialLogin block, add Authentik PKCE flow
- [x] Remove Google Sign-In end-to-end: `@capgo/capacitor-social-login` package, `POST /auth/google-signin` route, `GOOGLE_CLIENT_ID` in Vault + env, Google Cloud OAuth Android (debug + release) + Web clients in project `gen-lang-client-0511482895` *(Vault key removal deferred per TD-WAVE6-RE4-VAULT-PATCH-DEFERRED; GCP OAuth client deletion is user-owned, pending)*
- [x] DD status updates in `product/decisions.md`: DD-1 → closed, DD-13 → closed, DD-14 → closed, DD-17 → closed
- [x] NFR-7 parity verification (`gradlew :app:dependencies | grep com.google.gms` returns empty — mirrors dogfood spec NFR-7)
- [x] Test coverage: port at least dogfood's `tests/hooks/use-deep-link-auth.test.ts` (7 vitest branches); full 43-test corpus stretch *(47/47 across 5 files)*
- [x] F-Droid release: cut `v0.2.0` tag (material API-level auth change); first-install verification on 48k's GrapheneOS Pixel; in-place update preserves session *(v0.2.0 shipped; v0.2.1 stub fired for update-flow verify)*

### Priority 0: F-Droid Distribution — completed 2026-05-26

*Spec at `/opt/halinova/spec/luby/fdroid-distribution/` — 5 waves landed in S2+S3+S4. Reused dogfood's lived F-Droid pipeline pattern (IN-6 precedent).*

- [x] Vault writer policy + new paths (`secret/data/luby/release-keystore`, `secret/data/luby/fdroid-repo-key`)
- [x] Cloudflare DNS + Tunnel route for `fdroid.myluby.net` → existing CF Tunnel → infra-gateway 10.0.100.4
- [x] Caddyfile vhost on infra-gateway serving `/srv/fdroid-luby/repo/`
- [x] Release keystore generation + Vault storage + offsite GPG-encrypted backup to 48k's key
- [x] Solo recovery verification ceremony (separate-machine decrypt + sign throwaway APK)
- [x] F-Droid repo init + index signing key generation
- [x] `android/app/build.gradle` release signing configuration
- [x] F-Droid metadata YAML (`metadata/net.myluby.app.yml`)
- [x] Forgejo Actions workflow `.forgejo/workflows/release-apk.yaml` triggered on `v*` tags
- [x] First publication: tag `v0.1.0` → CI run → APK at `fdroid.myluby.net/repo`
- [x] First-install verification on 48k's device (uninstall debug APK → add repo → install Luby)
- [x] Update-flow verification: tag `v0.1.1` → F-Droid client surfaces update → in-place install
- [x] Remove `/download/app.apk` route from `api/src/index.ts` (closes DD-12 watch-for)

### Priority 1: App Store Submission

**Blocker (must come first):**
- [ ] **Apple Developer account** + **Google Play Console account** + **Firebase Cloud Messaging project** — external credential acquisition. P1 cannot meaningfully advance without these in hand.

**Then:**
- [ ] iOS build on Mac Mini M4 (10.0.15.10) — `ios/` scaffold present; needs `pod install` + Xcode build + TestFlight upload
- [x] Android debug APK building on VM + installed on device
- [→P0] Production-signed Android APK (release keystore, not debug) — *moved to P0 F-Droid Distribution*
- [ ] Google Play submission (production signing + listing assets) — *will reuse P0's release keystore*
- [→P0] Replace `/download/app.apk` dev distribution with proper signed distribution (DD-12 watch-for) — *closed by P0 retiring the route entirely*

### Priority 2: Push Notifications
- [ ] Firebase Cloud Messaging (FCM) for Android
- [ ] APNs for iOS
- [ ] Device token storage column on users table (schema migration)
- [ ] Fasting timer completion triggers
- [ ] Coaching plan ready notifications

### Priority 3: Offline Support
*Currently under-scoped — split below into client + server work.*

**Client:**
- [ ] better-sqlite3 local cache (package in deps at `12.4.1`, zero imports — wiring not started)
- [ ] Sync queue for offline-created entries
- [ ] Conflict-resolution semantics (single-user multi-device — pick last-write-wins or explicit-merge)

**Server:**
- [ ] Sync endpoint per entity (`POST /api/v1/{entity}/sync` accepting a batch with client timestamps)
- [ ] `client_id` + `client_created_at` columns on entity tables to support de-dup

### Priority 4: Voice Coaching
- [x] `GET /ai/live-token` server scaffold (returns API key)
- [ ] Client-side voice UI (audio capture, stream to live API, render assistant responses)
- [ ] Live conversation persistence to `chat_messages`

### Priority 5: Data and Insights
- [x] Basic food trend chart (`BarChart`, last 7 entries, in App.tsx) — partial
- [ ] Expand chart coverage: hydration, movement, fasting completion
- [ ] Weekly/monthly health summaries (server-aggregated)
- [ ] Goal setting and tracking (new entity + UI)

## Maintenance & Watch

Small items with no priority slot. Batchable; pick up alongside any active work.

| Item | Source | Notes |
|------|--------|-------|
| `@capacitor/cli` version bump | observed | Pinned at `^7.5.0` while runtime `@capacitor/*` is `^8.x`. Verify intentional or bump to 8.x. |
| `data-flow.md` migration path fix | observed | References `api/src/db/migrations/` — actual path is `api/migrations/`. One-line fix when touched. |
| Promote `users.email` UNIQUE consideration | DD-15 watch-for | Schema allows duplicate-email rows; matching logic prevents in practice. Decide whether to add `UNIQUE(email)` constraint or document the invariant. |
| Catalogue Capacitor origins, narrow CORS | DD-16 watch-for | Currently `origin: (origin) => origin`. Catalogue iOS dev/release + Android dev/release origins, then narrow to allowlist + production web origin. |
| `App.tsx` refactor threshold | DD-8 watch-for | Currently 1082 lines (~54% of 2000-line threshold). No action yet; revisit if it crosses ~1500. |
| Vault-vs-`.env` source-of-truth audit | DD-6 + systemd config | `luby-api.service` EnvironmentFile is `/opt/luby/api/.env`; verify Vault AppRole is primary path and `.env` only holds bootstrap creds, not the real secrets. |
| Root `README.md` is generic template | observed S4 | Root `/opt/luby/README.md` is the generic `northernlights` Claude Code project-setup template (refs `hudson/northernlights` repo, `.claude/` layout), not Luby-specific. Surfaced when RE-4 needed a trivial commit and CHANGELOG.md was seeded instead. Rewrite when next touched — one short Luby-specific intro + pointer to `product/` doc set. |

## Product Lines

| Feature | Status | Description |
|---------|--------|-------------|
| Food Tracking | Live | Manual + AI camera scanning, macro breakdown |
| Hydration | Live | Water intake logging |
| Movement | Live | Activity type, duration, intensity |
| Fasting | Live | Timer with target duration, active/completed states |
| Coaching | Live | AI-generated daily plans with eating and movement steps |
| Meal Planning | Live | 7-day AI meal plans with shopping lists |
| Recipes | Live | AI recipe search and save |
| Chat | Live | Conversational AI with health context |
| Charts | Live (partial) | Food-entries `BarChart` shipped; hydration/movement/fasting + weekly/monthly pending |
| Mobile App | Live (Android via household F-Droid, release-signed); iOS scaffold present | Capacitor shell, native camera, haptics. Release-signed APK distributed via `https://fdroid.myluby.net/repo`; iOS not yet built |

## Sources

*Consolidated from:*
- `product/vision.md` — product philosophy and users
- `product/context.md` — current health and momentum
- `product/architecture.md` — system design and tech stack
- `product/decisions.md` — DD-N entries (rationale, status, watch-fors)
- `product/use-cases.md` — 12 UCs (UC-9 → P1, UC-11 → P5, UC-12 → P3)
- `product/data-flow.md` — end-to-end data flows
- `CLAUDE.md` — implementation details
- `/opt/halinova/spec/luby/fdroid-distribution/` — P0 spec (shape + decisions, 2026-05-25)
