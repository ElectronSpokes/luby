# Architecture Decisions — Luby

## Auth

- **Google Sign-In for mobile, Authentik OIDC for web** (2026-03): Mobile deep-link OIDC flow was unreliable. Google Sign-In SDK gives native UX, token exchanged server-side at /api/v1/auth/google/token
- **Session cookies over JWT** (2026-03): Simpler for a personal app. Cookie on .myluby.net works across CF Pages frontend and tunnel API
- **Cross-origin sameSite None** (2026-03): Required for capacitor://localhost (iOS) and http://localhost (Android) to send cookies to api.myluby.net

## API

- **Hono over Express** (2026-03): Lighter, Bun-native, better TypeScript support. Express kept as dependency for legacy compatibility
- **Gemini server-side only** (2026-03): All AI calls proxied through /api/v1/ai/ endpoints. API key never reaches client. Verify: grep -c "AIzaSy" dist/assets/*.js = 0
- **Vault AppRole for secrets** (2026-03): Login-per-startup, loads DB URL, Gemini key, auth creds from Vault. Falls back to .env for local dev
- **Single migration file for v1** (2026-03): All 9 tables in 001-initial-schema.sql. Will split when schema evolves

## Frontend

- **Single App.tsx over router** (2026-03): All views in one file with tab-based navigation. Works well for mobile-first layout. Refactor to pages/ when it exceeds ~2000 lines
- **localStorage for offline state** (2026-03): Capacitor Preferences plugin for auth tokens. API is source of truth; localStorage is cache for offline UX

## Deployment

- **Gitea → GitHub → CF Pages pipeline** (2026-03): Push to Gitea, auto-mirrors to GitHub, CF Pages auto-deploys. One git push ships frontend
- **CF Tunnel for API** (2026-03): No need to expose port directly. Tunnel handles TLS termination
- **APK served from API** (2026-03): /download/app.apk endpoint for quick dev distribution. Replace with proper distribution for prod
