# Architecture

## Overview

Luby is a cross-platform mobile app backed by a Hono API. The frontend is a React app wrapped in Capacitor for native mobile deployment (iOS + Android), while the web version runs as a standard Vite SPA on Cloudflare Pages.

```
Mobile App (Capacitor)              Web App (CF Pages)
    ├── React + Tailwind               ├── React + Tailwind
    ├── Native Camera                  ├── Browser Camera
    ├── Push Notifications             ├── (no push)
    ├── Offline SQLite cache           ├── (online only)
    └── App Store / Google Play        └── myluby.net
         \                              /
          \____________________________/
                      |
              https://api.myluby.net
                      |
            Hono API (Bun, port 3001)
            ├── Authentik OIDC auth
            ├── PostgreSQL (data)
            ├── Gemini 2.5 Flash (AI)
            └── systemd on 10.0.110.27
```

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Mobile Shell | Capacitor | Wraps existing React app, native APIs (camera, push, storage), App Store deployment. Minimal code changes vs React Native rewrite |
| Frontend | React 19 + TypeScript | Already built, works well |
| Styling | Tailwind CSS v4 | Already in use, responsive |
| Build | Vite | Fast, already configured |
| API | Hono + Bun | Lightweight, fast, already deployed |
| Database | PostgreSQL 16 | Already running, JSONB for flexible schemas |
| AI | Google Gemini 2.5 Flash | Vision (food scanning), structured output (coaching/recipes), chat |
| Auth | Authentik OIDC | Already configured, session cookies |
| Hosting (web) | Cloudflare Pages | Already deployed at myluby.net |
| Hosting (API) | Cloudflare Tunnel | Already live at api.myluby.net |

## Components

### Mobile App (Capacitor)

- **Camera Plugin** — native camera for food scanning (better than browser `getUserMedia`)
- **Push Notifications Plugin** — fasting timers, hydration reminders, coaching nudges
- **Storage Plugin** — SQLite for offline data cache
- **Haptics** — tactile feedback on logging actions
- **App Plugin** — deep linking, background refresh

### API (existing, port 3001)

| Route Group | Purpose |
|-------------|---------|
| `/api/v1/auth/*` | OIDC login/callback/logout/me |
| `/api/v1/food/*` | Food entry CRUD |
| `/api/v1/hydration/*` | Hydration CRUD |
| `/api/v1/movement/*` | Movement CRUD |
| `/api/v1/fasting/*` | Fasting sessions |
| `/api/v1/meals/*` | Meal plans + shopping lists |
| `/api/v1/recipes/*` | Recipe CRUD |
| `/api/v1/coaching/*` | Daily coaching plans |
| `/api/v1/chat/*` | Chat message history |
| `/api/v1/ai/*` | 7 Gemini proxy endpoints |

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

## Data Flow

### Food Scanning (mobile)
```
Camera → Capacitor Camera Plugin → base64 image
  → POST /ai/scan-food → Gemini Vision → { name, calories, protein, ... }
  → POST /food → PostgreSQL → UI update
```

### Offline Logging
```
User logs entry → SQLite (local) → UI update immediately
  → When online: sync queue → POST /food → PostgreSQL
  → Conflict resolution: server timestamp wins
```

### Push Notifications
```
API registers device token → stored in users table
  → Fasting timer expires → server sends push via FCM/APNs
  → Hydration reminder → cron job checks last entry → push if >2hrs
```

## External Dependencies

| Service | Purpose | Credentials |
|---------|---------|-------------|
| Google Gemini API | AI (vision, chat, structured) | Vault `secret/data/luby/api` |
| Authentik | OIDC authentication | Vault `secret/data/luby/api` |
| Cloudflare | Pages hosting + Tunnel | Vault `secret/data/halinova/cloudflare` |
| Apple Developer | iOS App Store | TBD |
| Google Play Console | Android Store | TBD |
| Firebase Cloud Messaging | Push notifications | TBD |
