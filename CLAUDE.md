# CLAUDE.md - Luby

> Part of the Northernlights Network — Vitality Wellness Companion

## Overview

**Luby** is a health and wellness companion with AI-powered food logging, hydration tracking, movement monitoring, fasting management, meal planning, recipes, and coaching. React frontend deployed via Cloudflare Pages, Hono API on Bun with PostgreSQL, Capacitor for mobile (Android/iOS).

## Quick Start

```bash
# Frontend dev server
npm install
npm run dev    # Starts on port 3000

# API (separate terminal)
cd api
bun install
bun run src/index.ts  # Starts on port 3001

# Or via systemd
sudo systemctl start luby-api
```

## Services

| Service | Port | How |
|---------|------|-----|
| Frontend (dev) | 3000 | `npm run dev` (Vite) |
| Frontend (prod) | — | CF Pages at myluby.net |
| API | 3001 | `luby-api.service` (systemd) |
| PostgreSQL | 5432 | localhost (user: luby, db: luby) |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| API | Hono, Bun, TypeScript |
| Database | PostgreSQL 16 |
| AI | Google Gemini (server-side proxy, 7 endpoints) |
| Auth | Authentik OIDC + Google Sign-In (mobile) |
| Charts | Recharts |
| Animation | Motion (Framer Motion) |
| Mobile | Capacitor 8 (Android + iOS) |
| Deployment | Cloudflare Pages (frontend), CF Tunnel (API) |

## Project Structure

```
/opt/luby/
├── src/                     # React frontend
│   ├── App.tsx              # Main app with all views
│   ├── types.ts             # TypeScript types
│   ├── lib/                 # Utilities, auth hook, API client, haptics
│   └── components/          # Feature components
│       ├── LoginPage.tsx    # Auth (Authentik OIDC + Google Sign-In)
│       ├── AIAssistant.tsx  # AI chat assistant
│       ├── FoodScanner.tsx  # Camera food scanning
│       ├── MenuPlanner.tsx  # Meal planning + shopping lists
│       └── Recipes.tsx      # Recipe suggestions
├── api/                     # Hono API (Bun)
│   ├── src/
│   │   ├── index.ts         # App entry, route mounting, middleware
│   │   ├── config.ts        # Auth/OIDC config (single source of truth)
│   │   ├── types.ts         # API types
│   │   ├── middleware/       # Auth middleware (session + JWT)
│   │   ├── routes/          # 10 route files
│   │   │   ├── auth.ts      # Login, callback, session, Google token
│   │   │   ├── ai.ts        # Gemini proxy (7 endpoints)
│   │   │   ├── food.ts      # Food entry CRUD
│   │   │   ├── hydration.ts # Hydration CRUD
│   │   │   ├── movement.ts  # Movement CRUD
│   │   │   ├── fasting.ts   # Fasting session CRUD
│   │   │   ├── meals.ts     # Meal plan CRUD
│   │   │   ├── recipes.ts   # Recipe CRUD
│   │   │   ├── coaching.ts  # Daily coaching plans
│   │   │   └── chat.ts      # Chat history
│   │   ├── db/
│   │   │   ├── client.ts    # postgres.js connection
│   │   │   └── migrate.ts   # SQL migration runner
│   │   └── services/
│   │       └── vault.ts     # Vault AppRole secret loading
│   └── migrations/
│       └── 001-initial-schema.sql
├── android/                 # Capacitor Android project
├── ios/                     # Capacitor iOS project
├── capacitor.config.ts      # Capacitor config (live reload to dev server)
├── config-env/              # Vault AppRole credentials
│   └── vault.env
├── product/                 # Product documentation
└── .claude/rules/           # Guidelines
```

## Database Schema

9 tables in PostgreSQL:

| Table | Purpose |
|-------|---------|
| users | Auth users (sub, email, name) |
| food_entries | Food log (calories, protein, fiber, carbs, fat, sugar) |
| hydration_entries | Water intake |
| movement_entries | Exercise (type, duration, intensity) |
| fasting_sessions | Intermittent fasting (start, end, target) |
| meal_plans | Weekly meal plans (JSONB meals per day) |
| shopping_items | Shopping list (linked to meal plans) |
| recipes | Saved recipes (ingredients, instructions, macros) |
| coaching_plans | Daily AI coaching (eating + movement steps) |
| chat_messages | AI assistant conversation history |

## Auth

- **Web**: Authentik OIDC (provider slug: `luby`, client_id: `Y4QdQejb5Ep6nSnjXCEMeW34PNzgcinm3WAlx7eX`)
- **Mobile**: Google Sign-In SDK → token exchange at `/api/v1/auth/google/token`
- **Session**: Cookie-based on `.myluby.net` (secure, sameSite: None for cross-origin)
- **Mobile CORS**: `capacitor://localhost` (iOS), `http://localhost` (Android)

## Mobile (Capacitor)

- **Bundle ID**: `net.myluby.app`
- **Deep link scheme**: `net.myluby.app://`
- **Plugins**: camera, haptics, preferences, social-login, browser, app
- **Live reload**: `capacitor.config.ts` points at `http://10.0.110.27:3000` (comment out for prod)
- **Build**: `npm run build && npx cap sync && cd android && ./gradlew assembleDebug`
- **APK served at**: `/download/app.apk` (debug builds)

## Deployment

- **Frontend**: Gitea push → GitHub mirror (sync_on_commit) → CF Pages auto-build
- **API**: systemd `luby-api.service` on VM 10.0.110.27
- **API URL**: `https://api.myluby.net` → CF Tunnel → `http://10.0.110.27:3001`
- **Frontend URL**: `https://myluby.net` (CF Pages)

## Environment

- **Host**: luby (10.0.110.27)
- **Hub**: northernlights-hub (10.0.100.11:3100)
- **Project ID**: 197e53b7-eef0-44af-930f-f4d065d0dd2a
- **Gitea**: http://git.theflux.life:3000/halinova/luby
- **GitHub mirror**: ElectronSpokes/luby
- **CF Zone ID**: 5263f84ac5711ed347deed5f337f8c4a
- **Vault**: `secret/data/luby/api` (database_url, gemini_api_key, authentik creds, session_secret)
- **Vault AppRole**: role_id=`87582477-9ac0-38e4-57b5-212f31c29a5b`

## Workflow Commands

| Command | Purpose |
|---------|---------|
| `/springboard` | Start work session |
| `/compound` | Capture learnings |
| `/implement` | Implement from tasks |

## Detailed Guidelines

See the rules files:
- @.claude/rules/common-mistakes.md
- @.claude/rules/patterns.md
- @.claude/rules/decisions.md
- @.claude/rules/hub-integration.md

## Critical Reminders

- **Gemini key is server-side only** — verify with `grep -c "AIzaSy" dist/assets/*.js` = 0
- **Hub API uses X-Hub-Key header**, not X-API-Key
- **Cross-origin cookies**: domain `.myluby.net`, secure, sameSite None
- **Capacitor live reload**: comment out `server.url` in capacitor.config.ts for production APK builds
- **Test API with curl** before building frontend: `curl endpoint | jq .`
