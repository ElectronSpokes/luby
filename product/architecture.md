# Architecture
*Maintained by: Ruairidh (CTO) + Cleireach*
*Last updated: 2026-05-25*

## Overview

Luby is a cross-platform mobile app backed by a Hono API. The frontend is a React app wrapped in Capacitor for native mobile deployment (iOS + Android), while the web version runs as a standard Vite SPA on Cloudflare Pages.

```
Mobile App (Capacitor)              Web App (CF Pages)
    ├── React + Tailwind               ├── React + Tailwind
    ├── Native Camera                  ├── Browser Camera
    ├── Google Sign-In SDK             ├── Authentik OIDC
    ├── Push Notifications             ├── (no push)
    ├── Offline SQLite cache           ├── (online only)
    └── App Store / Google Play        └── myluby.net
         \                              /
          \____________________________/
                      |
              https://api.myluby.net
                      |
            Hono API (Bun, port 3001)
            ├── Dual auth (Authentik + Google)
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
| Auth (mobile) | Google Sign-In SDK | `@capgo/capacitor-social-login`, server issues HS256 JWT |
| Hosting (web) | Cloudflare Pages | Auto-deploy via Gitea → GitHub mirror |
| Hosting (API) | Cloudflare Tunnel | Live at api.myluby.net |

## Auth Architecture

Dual auth paths converging on the same users table:

| | Web | Mobile |
|---|---|---|
| **Provider** | Authentik OIDC | Google Sign-In SDK |
| **Plugin** | — | `@capgo/capacitor-social-login` |
| **Flow** | Redirect → callback → session cookie | Native popup → ID token → `POST /auth/google-signin` → Luby JWT |
| **Token** | Authentik access token in `luby_session` cookie | HS256 JWT (30-day, signed with `SESSION_SECRET`) |
| **Validation** | Authentik JWKS verification | Google JWKS verification (no audience check — Android client ID differs from web; see DD-14) |
| **User matching** | By `sub` claim | By email — `lookupUserByEmail()` (see DD-15) |

**Middleware chain.** Each request runs through the auth middleware in order: Authentik JWT → Luby JWT → session cookie. The first successful validation populates the request user and short-circuits the chain; if all three fail, the request continues as anonymous and any downstream route requiring auth returns 401. No anonymous fallback for protected routes — every route that touches per-user data asserts an authenticated user explicitly.

## Components

### Mobile App (Capacitor)

| Plugin | Package | Purpose |
|--------|---------|---------|
| Camera | `@capacitor/camera` | Native camera for food scanning |
| Haptics | `@capacitor/haptics` | Tactile feedback on logging |
| Preferences | `@capacitor/preferences` | Auth token storage |
| Social Login | `@capgo/capacitor-social-login` | Google Sign-In (native SDK) |
| App | `@capacitor/app` | App lifecycle |
| Browser | `@capacitor/browser` | External links |

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
| `/api/v1/auth/callback` | Authentik callback (web) |
| `/api/v1/auth/google-signin` | Google ID token exchange (mobile) |
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
| Google Cloud (OAuth) | Android Sign-In | Web client ID in Vault, Android client via SHA-1 fingerprint |
| Authentik | OIDC authentication (web) | Vault `secret/data/luby/api` |
| Cloudflare | Pages hosting + Tunnel | Vault `secret/data/halinova/cloudflare` |
| Apple Developer | iOS App Store | TBD |
| Google Play Console | Android Store | TBD |
| Firebase Cloud Messaging | Push notifications | TBD |

## Key Decisions

*Full rationale + status for each: see `product/decisions.md` (DD-N entries).*

| Decision | Choice | DD |
|----------|--------|----|
| Google Sign-In over Authentik for mobile | Native SDK (no deep-link OIDC) | DD-1 |
| Static import for Capacitor plugins | `import { SocialLogin }` not `await import()` — dynamic imports hang in production WebView | DD-13 |
| No JWT audience check on Google tokens | Verify signature only — Android `aud` differs from web | DD-14 |
| Email-based user matching on Google Sign-In | `lookupUserByEmail()` to avoid duplicate accounts | DD-15 |
| Open CORS | `origin: (origin) => origin` — tightening deferred until all Capacitor origins catalogued | DD-16 |
