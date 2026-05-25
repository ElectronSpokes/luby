# Luby — Data Flow
*Maintained by: Cleireach*
*Last updated: 2026-05-25*
*Companion to: product/operating-model.md (who runs what), product/architecture.md (system design)*

---

## Purpose

This document maps how data moves through myluby.net — from user health logging to AI coaching to mobile sync.

---

## Data Stores

| Store | Host | Port | What it holds |
|-------|------|------|---------------|
| PostgreSQL 16 | localhost (10.0.110.27) | 5432 | All application data — users, health entries, AI output, chat |
| Capacitor Preferences | Mobile device | — | Auth token + expiry (local only) |

Single database, no external storage services.

---

## Flow 1: Health Logging (Food / Hydration / Movement)

```
User action (tap log button)
  |
  |  Haptic feedback (native)
  v
React UI -> api.ts
  |
  |  POST /api/v1/{food|hydration|movement}
  |  Auth: cookie (web) or Bearer JWT (mobile)
  v
Hono API (auth middleware validates)
  |
  |  SQL INSERT into {entity}_entries
  |  (user_id, values, timestamp as epoch ms)
  v
PostgreSQL
  food_entries | hydration_entries | movement_entries
  Indexed on (user_id, timestamp)
```

---

## Flow 2: Food Scanning (Camera -> Gemini Vision)

```
User taps scan button
  |
  v
Capacitor Camera (native) or file input (web)
  |
  |  Photo captured as base64
  v
POST /api/v1/ai/scan-food
  |  { image: base64, mimeType }
  v
Gemini 2.5 Flash (Vision, inline image)
  |  -> { name, calories, protein, fiber, carbs, fat, sugar }
  v
Response returned to UI
  |  User confirms/edits values
  v
POST /api/v1/food
  |  Standard food entry creation
  v
PostgreSQL food_entries
```

---

## Flow 3: AI Coaching

```
User opens Coaching tab
  |
  v
GET /api/v1/coaching/{today's date}
  |
  +--> If exists in DB: return cached plan
  |
  +--> If not: POST /api/v1/ai/coaching-plan
         |  { stats: today's food/hydration/movement }
         v
       Gemini 2.5 Flash (structured JSON output)
         |  { focus, eatingSteps[], movementSteps[] }
         v
       POST /api/v1/coaching (persist)
         v
       PostgreSQL coaching_plans
         UNIQUE(user_id, date) — one plan per day
```

---

## Flow 4: Meal Planning

```
User requests meal plan
  |
  |  POST /api/v1/ai/generate-meal-plan
  |  { preferences }
  v
Gemini 2.5 Flash (structured JSON)
  |  7-day plan: { day, breakfast, lunch, dinner, snack }
  |  + shopping list
  v
POST /api/v1/meals (persist plan)
POST /api/v1/meals/{id}/shopping (persist items)
  v
PostgreSQL
  meal_plans (meals as JSONB)
  shopping_items (FK to meal_plan, with checked boolean)
```

---

## Flow 5: Chat

```
User sends message
  |
  |  POST /api/v1/ai/chat
  |  { messages: [{role, content}], stats }
  v
Gemini 2.5 Flash (chat mode)
  |  System prompt: Luby persona + user's health stats as context
  v
Response + full history persisted
  v
PostgreSQL chat_messages
  (user_id, role: user|assistant, content, timestamp)
```

---

## Flow 6: Auth (Web)

```
User clicks Login
  |
  v
GET /api/v1/auth/login
  |  Set state + nonce cookies
  |  Redirect to Authentik (auth.theflux.life)
  v
Authentik OIDC flow
  |  User authenticates
  v
GET /api/v1/auth/callback
  |  Exchange code for tokens
  |  Verify ID token via Authentik JWKS
  |  Upsert user in PostgreSQL
  v
Set luby_session cookie (.myluby.net, httpOnly, secure, SameSite=None)
  |  Redirect to frontend
  v
All subsequent requests include cookie
```

---

## Flow 7: Auth (Mobile)

```
User taps Sign In with Google
  |
  v
Google Sign-In SDK (native, via @capgo/capacitor-social-login)
  |  Returns idToken
  v
POST /api/v1/auth/google-signin
  |  Verify idToken against Google JWKS
  |  Lookup/create user in PostgreSQL
  |  Sign HS256 JWT (30-day, SESSION_SECRET from Vault)
  v
Token returned to app
  |  Stored in Capacitor Preferences (auth_token)
  v
All subsequent requests: Authorization: Bearer <token>
```

---

## Flow 8: Credentials

```
API startup
  |
  |  loadSecretsFromVault()
  |  AppRole auth (role_id + secret_id from .env)
  v
Vault (10.0.25.2:8200, HTTPS)
  |  secret/data/luby/api
  v
Environment populated:
  DATABASE_URL, GEMINI_API_KEY,
  AUTHENTIK_*, SESSION_SECRET, GOOGLE_CLIENT_ID
  |
  |  Fallback to .env values if Vault unreachable
  v
Hono app initialises
  |
  |  Run migrations (api/src/db/migrate.ts)
  v
Ready to serve
```

---

## Flow 9: Deploy Pipeline

```
Frontend:
  git push origin main (on Luby VM or locally)
    -> Forgejo auto-mirrors to GitHub (sync_on_commit)
      -> GitHub -> CF Pages auto-build
        -> Live at myluby.net

API:
  SSH to 10.0.110.27
    -> edit code
      -> sudo systemctl restart luby-api
        -> migrations auto-run on startup

Mobile (Android):
  On the VM (10.0.110.27)
    -> npm run build && npx cap sync android
      -> cd android && ./gradlew assembleDebug
        -> debug APK installed on device

Mobile (iOS):
  Mac Mini M4 (10.0.15.10)
    -> git pull && npm run build && npx cap sync && pod install
      -> Xcode build -> TestFlight submission
```

---

## Data Lifecycle

| Data | Retention | Growth rate |
|------|-----------|-------------|
| Health entries (food/hydration/movement) | Indefinite | ~10-30 rows/day per user |
| Fasting sessions | Indefinite | ~1-2/day per user |
| Coaching plans | Indefinite (one per day) | 1/day per user |
| Meal plans + shopping | Indefinite | ~1/week per user |
| Chat messages | Indefinite | ~5-20/session |
| Recipes | Indefinite | ~1-3/week per user |

---

## Sources

*Consolidated from:*
- `product/architecture.md` — system design, auth flow, AI integration
- `CLAUDE.md` — API routes, deployment details
- `api/src/routes/` — route handlers
- `api/migrations/` — schema definitions (single file: `001-initial-schema.sql`)
- `api/src/db/migrate.ts` — migration runner (applied on API startup)
- `product/decisions.md` — DD-N entries for auth, secrets, schema choices
