# Architecture
*Maintained by: Ruairidh (CTO) + Cleireach*
*Last updated: 2026-05-25*

## Overview

Luby is a cross-platform mobile app backed by a Hono API. The frontend is a React app wrapped in Capacitor for native mobile deployment (iOS + Android), while the web version runs as a standard Vite SPA on Cloudflare Pages.

```
Mobile App (Capacitor)              Web App (CF Pages)
    ├── React + Tailwind               ├── React + Tailwind
    ├── Native Camera                  ├── Browser Camera
    ├── Authentik OIDC + PKCE          ├── Authentik OIDC
    │     (custom-scheme callback)     │
    ├── Push Notifications             ├── (no push)
    ├── Offline SQLite cache           ├── (online only)
    └── F-Droid (Android) / App Store  └── myluby.net
         \                              /
          \____________________________/
                      |
              https://api.myluby.net
                      |
            Hono API (Bun, port 3001)
            ├── Authentik (web cookie + mobile JWT)
            ├── PostgreSQL (data)
            ├── Gemini 2.5 Flash (AI)
            └── systemd on 10.0.110.27
```

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Mobile Shell | Capacitor 8 | Wraps existing React app, native APIs (camera, push, storage), App Store deployment |
| Frontend | React 19 + TypeScript | Already built, works well |
| Styling | Tailwind CSS v4 | Already in use, responsive |
| Build | Vite | Fast, already configured |
| API | Hono + Bun | Lightweight, fast, already deployed |
| Database | PostgreSQL 16 | Already running, JSONB for flexible schemas |
| AI | Google Gemini 2.5 Flash | Vision (food scanning), structured output (coaching/recipes), chat |
| Auth (web) | Authentik OIDC | Session cookies on `.myluby.net` |
| Auth (mobile) | Authentik OIDC + PKCE custom-scheme | `net.myluby.app://callback`; server exchanges code via `services/authentik.ts` helper, issues HS256 JWT (30-day, `type: 'luby_session'`); works on GrapheneOS / Android without Google Play Services per DD-17 |
| Hosting (web) | Cloudflare Pages | Auto-deploy via Gitea → GitHub mirror |
| Hosting (API) | Cloudflare Tunnel | Live at api.myluby.net |

## Auth Architecture

Two surfaces (web + mobile), one identity provider (Authentik), one users table:

| | Web | Mobile (Android) |
|---|---|---|
| **Provider** | Authentik OIDC | Authentik OIDC + PKCE custom-scheme callback |
| **Redirect URI** | `https://api.myluby.net/api/v1/auth/callback` | `net.myluby.app://callback` |
| **Flow** | Server redirect → callback → exchange code → set session cookie | `@capacitor/browser` opens authorize URL in system browser → custom-scheme intent fires → `POST /api/v1/auth/mobile-callback` exchanges `{code, code_verifier}` → Luby HS256 JWT (30-day) |
| **Token storage** | Authentik access token in `luby_session` cookie on `.myluby.net` | Luby HS256 JWT in Capacitor Preferences (per DD-9) |
| **Validation** | Authentik JWKS verification | id_token verified via Authentik JWKS (audience = `clientId`); Luby HS256 JWT verified by middleware on every API call (`type: 'luby_session'` claim required) |
| **User matching** | `upsertUser()` by Authentik `sub` | `upsertUser()` by Authentik `sub` (single helper — both flows converge per DD-17) |
| **Token-exchange helper** | `services/authentik.ts` — `exchangeCodeForTokens(code, redirectUri)` | Same helper, called with `(code, 'net.myluby.app://callback', code_verifier)` |

iOS is deferred to P1 — will use Universal Links / Associated Domains rather than custom scheme (different shape; out of v1 per DD-17 spec).

**Middleware chain.** Each request runs through the auth middleware in order: Authentik JWT → Luby JWT → session cookie. The first successful validation populates the request user and short-circuits the chain; if all three fail, the request continues as anonymous and any downstream route requiring auth returns 401. No anonymous fallback for protected routes — every route that touches per-user data asserts an authenticated user explicitly.

## Components

### Mobile App (Capacitor)

| Plugin | Package | Purpose |
|--------|---------|---------|
| Camera | `@capacitor/camera` | Native camera for food scanning |
| Haptics | `@capacitor/haptics` | Tactile feedback on logging |
| Preferences | `@capacitor/preferences` | Auth token + PKCE challenge storage (verifier/nonce/state during browser hop) |
| App | `@capacitor/app` | App lifecycle + `appUrlOpen` listener + `getLaunchUrl` for cold-start deep-link |
| Browser | `@capacitor/browser` | External links + Authentik authorize URL (PKCE sign-in flow) |

**Build chain (production APK):**
```
npm run build (Vite, reads .env.production)
  → dist/ with VITE_API_URL=https://api.myluby.net baked in
npx cap sync android
  → copies dist/ + capacitor.config.json into android/app/
cd android && ./gradlew assembleDebug
  → app-debug.apk (12MB)
```

**Android build stack on VM (10.0.110.27):**
- OpenJDK 21
- Android SDK at `/home/johnthomson/android-sdk`
- Gradle via wrapper (`android/gradlew`)

**iOS scaffold:**
- `ios/` directory is present in the repo (scaffolded via `npx cap add ios`)
- No build has been produced from this host — iOS builds require Mac Mini M4 (10.0.15.10) for `pod install` + Xcode
- Pipeline on Mac: `git pull && npm run build && npx cap sync && pod install && (build via Xcode/CLI)`

### API (port 3001)

| Route Group | Purpose |
|-------------|---------|
| `/api/v1/auth/login` | Authentik OIDC redirect (web) |
| `/api/v1/auth/callback` | Authentik callback — cookie-based (web). Uses shared `exchangeCodeForTokens` helper |
| `/api/v1/auth/mobile-callback` | Authentik PKCE token exchange (native Android). POST `{code, code_verifier, state?, nonce?}` → `{token, expiresIn}`. Uses shared `exchangeCodeForTokens` helper with `code_verifier` |
| `/api/v1/auth/logout` | Clear session |
| `/api/v1/auth/me` | Current user |
| `/api/v1/food/*` | Food entry CRUD |
| `/api/v1/hydration/*` | Hydration CRUD |
| `/api/v1/movement/*` | Movement CRUD |
| `/api/v1/fasting/*` | Fasting sessions |
| `/api/v1/meals/*` | Meal plans + shopping lists |
| `/api/v1/recipes/*` | Recipe CRUD |
| `/api/v1/coaching/*` | Daily coaching plans |
| `/api/v1/chat/*` | Chat message history |
| `/api/v1/ai/*` | 7 Gemini proxy endpoints |
| `/download/app.apk` | Debug APK download (temporary, no auth) |

### Data Schema

Single PostgreSQL 16 database on `10.0.110.27:5432`. Schema lives in `api/migrations/001-initial-schema.sql` (single file per DD-7). Runner is `api/src/db/migrate.ts`, applied on API startup before serving. End-to-end data flows (logging, AI scanning, coaching, chat, auth, deploy) are documented in `product/data-flow.md` — not duplicated here.

| Table | Purpose | Key columns / constraints |
|-------|---------|---------------------------|
| `users` | Accounts; dual-auth (Authentik + Google) | `id SERIAL PK`, `sub TEXT UNIQUE NOT NULL`, `email TEXT`, `name TEXT`, `created_at`, `updated_at` |
| `food_entries` | Manual + AI-scanned food logs with macros | `user_id FK`, `name`, `calories/protein/fiber/carbs/fat/sugar NUMERIC`, `timestamp BIGINT (epoch ms)` |
| `hydration_entries` | Water intake | `user_id FK`, `amount NUMERIC`, `timestamp BIGINT` |
| `movement_entries` | Activity logs | `user_id FK`, `type`, `duration NUMERIC`, `intensity CHECK IN ('low','medium','high')`, `timestamp BIGINT` |
| `fasting_sessions` | Active + completed fasting timers | `user_id FK`, `start_time/end_time BIGINT`, `target_duration NUMERIC`, `status CHECK IN ('active','completed')` |
| `meal_plans` | One row per day of an AI meal plan | `user_id FK`, `day TEXT`, `meals JSONB` |
| `shopping_items` | Shopping list (optionally tied to a meal plan) | `user_id FK`, `meal_plan_id FK ON DELETE SET NULL`, `name`, `category`, `checked BOOLEAN` |
| `recipes` | Saved AI recipe results | `user_id FK`, `name`, `description`, `ingredients/instructions JSONB`, macros NUMERIC |
| `coaching_plans` | AI-generated daily plans | `user_id FK`, `date TEXT`, `focus`, `eating_steps/movement_steps JSONB`, **`UNIQUE(user_id, date)`** |
| `chat_messages` | Chat history with Luby persona | `user_id FK`, `role CHECK IN ('user','assistant')`, `content TEXT`, `timestamp BIGINT` |
| `_migrations` | Migration tracking meta-table | `name TEXT UNIQUE NOT NULL`, `applied_at` |

**Indexes:** All per-user time-series tables carry a `(user_id, timestamp)` composite index for fast latest-N queries; `coaching_plans` has `(user_id, date)`; per-user single-list tables (`fasting_sessions`, `meal_plans`, `shopping_items`, `recipes`) have `(user_id)`. See migration file for exact index DDL.

**Notable shape:** All entity tables use UUID PKs except `users` (SERIAL) and `_migrations` (SERIAL). All timestamps in entity tables are `BIGINT` epoch-milliseconds (client-supplied), not `TIMESTAMPTZ` (server-side); `created_at` audit timestamps are `TIMESTAMPTZ DEFAULT NOW()`. The `users.sub` column is `UNIQUE NOT NULL` but `users.email` has no UNIQUE constraint — see DD-15 for the email-matching interaction.

### AI Endpoints

| Endpoint | Feature | Model |
|----------|---------|-------|
| POST `/ai/coaching-plan` | Daily coaching | gemini-2.5-flash |
| POST `/ai/insight` | Quick health tip | gemini-2.5-flash |
| POST `/ai/scan-food` | Camera food analysis | gemini-2.5-flash (vision) |
| POST `/ai/generate-meal-plan` | Weekly meal plan | gemini-2.5-flash |
| POST `/ai/search-recipes` | Recipe search | gemini-2.5-flash |
| POST `/ai/chat` | Chat with Luby | gemini-2.5-flash |
| GET `/ai/live-token` | Voice call API key | — |

## External Dependencies

| Service | Purpose | Credentials |
|---------|---------|-------------|
| Google Gemini API | AI (vision, chat, structured) | Vault `secret/data/luby/api` |
| Authentik | OIDC authentication for both web and native Android (PKCE custom-scheme callback at `net.myluby.app://callback`) | Vault `secret/data/luby/api` |
| Cloudflare | Pages hosting + Tunnel | Vault `secret/data/halinova/cloudflare` |
| Apple Developer | iOS App Store | TBD |
| Google Play Console | Android Store | TBD |
| Firebase Cloud Messaging | Push notifications | TBD |

## Key Decisions

*Full rationale + status for each: see `product/decisions.md` (DD-N entries).*

| Decision | Choice | DD |
|----------|--------|----|
| Authentik OIDC + PKCE custom-scheme for native Android mobile sign-in | Single OIDC client extended with `net.myluby.app://callback` redirect URI; replaces Google Sign-In | DD-17 |
| Email-based user matching legacy carry-over | Pre-DD-17 web flow used `upsertUser()` by `sub`; Google flow used `lookupUserByEmail()` — both consolidated on `upsertUser()` per DD-17 implementation. DD-15's `users.email` non-UNIQUE schema caveat still applies | DD-15 |
| Open CORS | `origin: (origin) => origin` — tightening deferred until all Capacitor origins catalogued | DD-16 |
