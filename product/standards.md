# Standards
*Maintained by: Ruairidh (CTO)*
*Last updated: 2026-04-15*

## Code Style

- **TypeScript** for all frontend and API code
- **Functional components** with hooks (no class components)
- **Tailwind CSS v4** for styling — no CSS modules or styled-components
- **`sql.json()`** for JSONB columns in postgres.js (never `JSON.stringify() + ::jsonb`)
- **Error responses**: always `await res.text()` before throwing on HTTP errors
- **No client-side API keys** — all AI calls go through the API proxy

## Project Structure

```
/opt/luby/
├── api/                    # Hono + Bun backend
│   ├── src/
│   │   ├── index.ts        # App entry, CORS, route mounting
│   │   ├── db/             # Database client + migrations
│   │   ├── routes/         # One file per entity
│   │   ├── middleware/      # Auth middleware (dual: Authentik + Google)
│   │   └── services/       # Gemini, Vault
│   ├── migrations/         # SQL migration files
│   └── package.json
├── src/                    # React frontend
│   ├── App.tsx             # Main app with auth gate
│   ├── components/         # Feature components
│   ├── lib/                # api.ts, useAuth.ts, platform.ts
│   └── types.ts            # Shared types
├── product/                # Product documentation
├── ios/                    # Capacitor iOS (generated)
├── android/                # Capacitor Android (generated)
├── capacitor.config.ts     # Capacitor config
├── doc-dependencies.yaml   # Code-to-doc freshness mapping
├── .env                    # Dev env (VITE_API_URL, VITE_GOOGLE_CLIENT_ID)
├── .env.production         # Production env (baked into dist/ at build time)
└── vite.config.ts
```

## Capacitor / Mobile Standards

- **Static imports for native plugins** — `import { SocialLogin } from '@capgo/capacitor-social-login'`, never `await import()`. Dynamic imports hang in production-bundled WebView because Vite bundles the web polyfill and the native bridge can't intercept
- **Platform checks**: `Capacitor.isNativePlatform()` via `isNative()` from `lib/platform.ts`
- **Production builds**: comment out `server.url` and `server.cleartext` in `capacitor.config.ts`
- **`.env.production` must include all `VITE_*` vars** — `.env` is only used for dev. Missing vars silently become empty strings in the bundle
- **Permissions**: request camera/notification permissions lazily (when first needed, not on launch)
- **Auth tokens**: stored in Capacitor Preferences (not cookies — cookies don't persist across app restarts on mobile)

## Auth Standards

- **Web**: Authentik OIDC redirect flow → session cookie on `.myluby.net`
- **Mobile**: Google Sign-In SDK (`@capgo/capacitor-social-login`) → `POST /auth/google-signin` → Luby HS256 JWT (30-day)
- **Auth middleware chains both**: Authentik JWT → Luby JWT → session cookie
- **User matching by email**: Google Sign-In users matched to existing Authentik accounts via `lookupUserByEmail()`
- **No JWT audience check on Google tokens**: Android client ID differs from web client ID. Signature verification against Google JWKS is sufficient

## Testing

- **API**: curl endpoints before building frontend
- **AI**: verify model availability with a simple prompt before deploying
- **Mobile**: test on physical device (emulators miss camera/push edge cases)
- **Production APK**: always verify `VITE_*` vars are baked in — `grep 'api.myluby.net' dist/assets/index-*.js`
- **Offline**: test with airplane mode enabled

## Git Workflow

- **Main branch**: `main` (production)
- **Commit format**: `type: description` (feat, fix, chore, docs)
- **Deploy pipeline**: `git push origin main` → Gitea mirror → GitHub → CF Pages auto-build
- **API deploys**: SSH to VM, `sudo systemctl restart luby-api`
- **Mobile builds**:
  - Android (on VM): `npm run build && npx cap sync android && cd android && ./gradlew assembleDebug`
  - iOS (on Mac Mini M4): `git pull && npm run build && npx cap sync && pod install`

## Documentation

- Product docs live in `product/` (7 standard docs)
- `doc-dependencies.yaml` maps code paths to docs for freshness tracking
- Specs live in HALINOVA repo at `agent-os/specs/luby/`
- API is self-documenting via route files (no OpenAPI for now)
- CLAUDE.md on the luby VM has operational reference
