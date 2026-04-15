# Architecture
*Maintained by: Ruairidh (CTO) + Cleireach*
*Last updated: 2026-04-15*

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
| **Validation** | Authentik JWKS verification | Google JWKS verification (no audience check — Android client ID differs from web) |
| **User matching** | By `sub` claim | By email (matches existing Authentik accounts) |

Auth middleware chains both: tries Authentik JWT first, then Luby JWT, then session cookie.

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
- iOS builds require Mac Mini M4 (10.0.15.10)

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

| Decision | Choice | Why |
|----------|--------|-----|
| Google Sign-In over Authentik for mobile | Native SDK | Deep-link OAuth was fragile (Chrome Custom Tabs blocked redirects, cookies didn't persist). Native Google Sign-In is one tap, no browser |
| Static import for Capacitor plugins | `import { SocialLogin }` not `await import()` | Dynamic imports hang in production-bundled WebView — Vite bundles the web polyfill, native bridge can't intercept |
| No JWT audience check | Verify signature only | Android Google Sign-In issues tokens with Android client ID as audience, not web client ID. Signature verification against Google JWKS is sufficient |
| Email-based user matching | `lookupUserByEmail()` | Google Sign-In users may already have Authentik accounts — match by email to avoid duplicate user records |
| Open CORS | `origin: (origin) => origin` | Capacitor WebView origin varies by platform and build type. Tightening deferred until all origins are catalogued |
