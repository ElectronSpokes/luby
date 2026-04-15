# Luby — Roadmap
*Maintained by: Cleireach*
*Last updated: 2026-04-15*

## Current State

**10 API route groups** with 7 AI-powered endpoints. **React 19 SPA** on Cloudflare Pages. **Hono + Bun API** on dedicated VM (10.0.110.27). **Capacitor 8** mobile shell for iOS and Android. **Gemini 2.5 Flash** for all AI features. **PostgreSQL 16** with 10 tables. **Authentik OIDC** for web auth, **Google Sign-In** for mobile.

The health tracking platform is live at myluby.net.

## What Was Built

### Core App (Mar 2026)
5 tracking domains live: food logging, hydration, movement, fasting timer, AI coaching plans. React SPA with Vite + Tailwind v4. Hono API on Bun with systemd management. PostgreSQL schema with migration system.

### AI Integration (Mar 2026)
7 Gemini 2.5 Flash endpoints: food vision scanning (camera -> base64 -> Gemini Vision), daily coaching plans, health insights, meal plan generation (7-day + shopping lists), recipe search, chat with Luby persona. All structured JSON output.

### Auth (Mar-Apr 2026)
Dual auth: Authentik OIDC for web (session cookies on `.myluby.net`), Google Sign-In SDK for mobile (own HS256 JWT, 30-day expiry). Both paths validate against same users table.

### Mobile Shell (Apr 2026)
Capacitor 8 scaffolded for iOS and Android. Native camera for food scanning. Haptic feedback on all logging actions. Google Sign-In via `@capgo/capacitor-social-login`. Auth token stored in Capacitor Preferences.

### Infrastructure (Mar 2026)
Vault AppRole integration (secrets at `secret/data/luby/api`). Cloudflare Pages auto-deploy via Gitea -> GitHub mirror. Cloudflare Tunnel for API at `api.myluby.net`. systemd service with security hardening (`ProtectSystem=strict`, `NoNewPrivileges=true`).

## What's Next

### Priority 1: App Store Submission
- [ ] iOS TestFlight build on Mac Mini M4 (10.0.15.10)
- [x] Android debug APK building on VM + installed on device
- [ ] Google Play submission (production signing needed)
- [ ] Apple Developer and Google Play Console credential setup

### Priority 2: Push Notifications
- [ ] Firebase Cloud Messaging (FCM) for Android
- [ ] APNs for iOS
- [ ] Device token storage in users table
- [ ] Fasting timer completion triggers
- [ ] Coaching plan ready notifications

### Priority 3: Offline Support
- [ ] better-sqlite3 local cache (package in deps, not yet wired)
- [ ] Sync queue for offline-created entries
- [ ] Conflict resolution for multi-device

### Priority 4: Voice Coaching
- [ ] Live voice coaching sessions (scaffold exists at `GET /ai/live-token`)
- [ ] Real-time AI coaching conversation

### Priority 5: Data and Insights
- [ ] Historical trends and charts (Recharts in deps)
- [ ] Weekly/monthly health summaries
- [ ] Goal setting and tracking

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
| Mobile App | Live (Android) | Capacitor shell, native camera, haptics |

## Sources

*Consolidated from:*
- `product/vision.md` — product philosophy and users
- `product/context.md` — current health and momentum
- `product/architecture.md` — system design and tech stack
- `CLAUDE.md` — implementation details
