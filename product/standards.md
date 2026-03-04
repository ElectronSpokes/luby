# Standards

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
│   │   ├── middleware/      # Auth middleware
│   │   └── services/       # Gemini, Vault
│   ├── migrations/         # SQL migration files
│   └── package.json
├── src/                    # React frontend
│   ├── App.tsx             # Main app with auth gate
│   ├── components/         # Feature components
│   ├── lib/                # api.ts, useAuth.ts
│   └── types.ts            # Shared types
├── product/                # Product documentation
├── ios/                    # Capacitor iOS (generated)
├── android/                # Capacitor Android (generated)
├── capacitor.config.ts     # Capacitor config
└── vite.config.ts
```

## Testing

- **API**: curl endpoints before building frontend
- **AI**: verify model availability with a simple prompt before deploying
- **Mobile**: test on physical device (emulators miss camera/push edge cases)
- **Offline**: test with airplane mode enabled

## Git Workflow

- **Main branch**: `main` (production)
- **Commit format**: `type: description` (feat, fix, chore, docs)
- **Deploy pipeline**: `git push origin main` → Gitea mirror → GitHub → CF Pages auto-build
- **API deploys**: SSH to VM, `sudo systemctl restart luby-api`
- **Mobile releases**: Capacitor build → app store submission (manual for now)

## Documentation

- Product docs live in `product/`
- Specs live in HALINOVA repo at `agent-os/specs/luby/`
- API is self-documenting via route files (no OpenAPI for now)
- CLAUDE.md on the luby VM has operational reference

## Mobile-Specific Standards

- **Capacitor plugins**: use official `@capacitor/*` packages where available
- **Platform checks**: `Capacitor.isNativePlatform()` to branch native vs web behaviour
- **Deep links**: `myluby.net` scheme for app-to-web continuity
- **Permissions**: request camera/notification permissions lazily (when first needed, not on launch)
- **Offline-first**: write to local SQLite immediately, sync to server in background
