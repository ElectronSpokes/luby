# Standards
*Maintained by: Ruairidh (CTO)*
*Last updated: 2026-06-09 (reviewed against code through DD-18 — current; the 05-31 auth `/simplify` pass was refactor-only, no contract change)*

## Code Style

- **TypeScript** for all frontend and API code
- **Functional components** with hooks (no class components)
- **Tailwind CSS v4** for styling — no CSS modules or styled-components
- **`sql.json()`** for JSONB columns in postgres.js (never `JSON.stringify() + ::jsonb`)
- **Error responses**: always `await res.text()` before throwing on HTTP errors
- **No client-side API keys** — all AI calls go through the API proxy (see DD-5)

## Project Structure

```
/opt/luby/
├── api/                    # Hono + Bun backend
│   ├── src/
│   │   ├── index.ts        # App entry, CORS, route mounting
│   │   ├── db/             # Database client + migration runner (migrate.ts)
│   │   ├── routes/         # One file per entity
│   │   ├── middleware/      # Auth middleware (Authentik: web cookie / native HS256 JWT)
│   │   └── services/       # Gemini, Vault
│   ├── migrations/         # SQL migration files (e.g. 001-initial-schema.sql)
│   └── package.json
├── src/                    # React frontend
│   ├── App.tsx             # Main app with auth gate
│   ├── components/         # Feature components
│   ├── lib/                # api.ts, useAuth.ts, platform.ts, native/{deep-link,pkce,platform}.ts
│   ├── hooks/              # useAuthentikDeepLink.ts
│   └── types.ts            # Shared types
├── product/                # Product documentation (10 standard docs)
├── ios/                    # Capacitor iOS (generated)
├── android/                # Capacitor Android (generated)
├── capacitor.config.ts     # Capacitor config
├── doc-dependencies.yaml   # Code-to-doc freshness mapping
├── .env                    # Dev env (gitignored; VITE_API_URL only)
├── .env.production         # Production env (baked into dist/ at build time; VITE_API_URL + VITE_AUTHENTIK_CLIENT_ID)
└── vite.config.ts
```

## Capacitor / Mobile Standards

- **Static imports for native plugins** — `import { Browser } from '@capacitor/browser'`, never `await import()`. Dynamic imports hang in production-bundled WebView because Vite bundles the web polyfill and the native bridge can't intercept. The original rule was promoted as DD-13 (SocialLogin-specific); DD-13 is now Closed but the underlying invariant still applies for any future Capacitor plugin work.
- **Platform checks**: `Capacitor.isNativePlatform()` via `isNative()` from `lib/platform.ts` (the original luby helper) OR `isNativePlatform()` from `lib/native/platform.ts` (the dogfood-ported helper used by the native PKCE flow). Both are wrappers around the same Capacitor call.
- **Production builds**: comment out `server.url` and `server.cleartext` in `capacitor.config.ts`
- **`.env.production` must include all `VITE_*` vars** — `.env` is only used for dev. Missing vars silently become empty strings in the bundle
- **Permissions**: request camera/notification permissions lazily (when first needed, not on launch)
- **Auth tokens**: stored in Capacitor Preferences (`auth_token` + `auth_expires`) not cookies — cookies don't persist across app restarts on mobile (see DD-9). PKCE challenge artefacts (verifier/nonce/state) also live in Preferences for the duration of the browser hop, cleared on consume by `lib/native/pkce.ts`
- **Native deep-link callback**: handled via the dual-listener pattern in `lib/native/deep-link.ts` — `App.addListener('appUrlOpen', ...)` warm + `App.getLaunchUrl()` cold-start, with a `processed` dedup flag in `useAuthentikDeepLink` to handle Android versions that fire both

## Auth Standards

- **Web**: Authentik OIDC redirect flow → session cookie on `.myluby.net` (see DD-2). Server-side at `GET /api/v1/auth/login` + `GET /api/v1/auth/callback`; the callback uses the shared `exchangeCodeForTokens` helper from `api/src/services/authentik.ts`
- **Mobile (Android)**: Authentik OIDC PKCE with custom-scheme callback `net.myluby.app://callback` (see DD-17). Client flow: `useAuthentikDeepLink` hook (`src/hooks/useAuthentikDeepLink.ts`) subscribes to the deep-link return; `useAuth.login()` generates PKCE challenge → persists → builds Authentik authorize URL → `Browser.open()`. Server-side at `POST /api/v1/auth/mobile-callback` (uses the same helper with `code_verifier`), issues HS256 JWT (30-day, `type: 'luby_session'` claim — load-bearing per middleware guard)
- **iOS**: deferred to P1 (will need Universal Links / Associated Domains; out of v1 per DD-17)
- **Auth middleware chains**: Authentik JWT → Luby JWT → session cookie; first success short-circuits, all-fail = anonymous; protected routes assert auth explicitly → 401
- **User matching**: both web and mobile callbacks call `upsertUser({type: 'human', sub, email, name, preferred_username})` from `middleware/auth.ts` — `INSERT ... ON CONFLICT (sub) DO UPDATE`. DD-15's `users.email` non-UNIQUE caveat carries over
- **Token-exchange helper sharing**: web `GET /auth/callback` and mobile `POST /auth/mobile-callback` both go through `exchangeCodeForTokens(code, redirectUri, codeVerifier?)` in `api/src/services/authentik.ts` — single source of truth for the Authentik token endpoint POST + JWKS verification

## Testing

- **API**: curl endpoints before building frontend
- **AI**: verify model availability with a simple prompt before deploying
- **Mobile**: test on physical device (emulators miss camera/push edge cases)
- **Production APK**: always verify `VITE_*` vars are baked in — `grep 'api.myluby.net' dist/assets/index-*.js`
- **Offline**: test with airplane mode enabled

## Git Workflow

- **Main branch**: `main` (production)
- **Commit format**: `type: description` (feat, fix, chore, docs)
- **Deploy pipeline**: `git push origin main` → Forgejo mirror → GitHub → CF Pages auto-build
- **API deploys**: SSH to VM, `sudo systemctl restart luby-api`
- **Mobile builds**:
  - Android (on VM): `npm run build && npx cap sync android && cd android && ./gradlew assembleDebug`
  - iOS (on Mac Mini M4): `git pull && npm run build && npx cap sync && pod install`

## Documentation

- Product docs live in `product/` (10 standard docs per portfolio convention: architecture, context, roadmap, standards, decisions, operating-model, data-flow, session-notes, vision, use-cases). Plus 2 at root: `CLAUDE.md`, `README.md`.
- `doc-dependencies.yaml` maps code paths to docs for freshness tracking
- Specs live in the HALINOVA repo at `spec/luby/<spec-name>/` (per portfolio convention; none currently). Old location `agent-os/specs/luby/` is no longer the convention.
- API is self-documenting via route files (no OpenAPI for now)
- CLAUDE.md on the luby VM has operational reference
