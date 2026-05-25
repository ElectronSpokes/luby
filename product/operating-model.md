# Luby — Operating Model
*Maintained by: Cleireach*
*Last updated: 2026-05-25*

---

## What Luby is in the stack

Luby is a product satellite — a personal health tracking platform at myluby.net. It's the simplest product in the portfolio: one VM, one service, one database, no Docker. AI inference is handled by Google Gemini (external API), not Bones.

```
cosmogenic.org          <- philosophy
  DaChief               <- executive intelligence
    Hub                 <- knowledge network
      HALINOVA          <- infrastructure
        Luby            <- this product (health tracking)
```

---

## Services and where they run

### API (10.0.110.27, VLAN 110)

| Service | Unit | Port | Notes |
|---------|------|------|-------|
| luby-api | `luby-api.service` | 3001 | Hono + Bun, on-failure restart (5s delay) |
| PostgreSQL 16 | `postgresql.service` | 5432 | localhost only |

No Docker on this VM. Pure native: Bun process + system PostgreSQL.

Codebase: `/opt/luby`
Env: `/opt/luby/api/.env` (gitignored, secrets from Vault at startup via AppRole; `.env` carries the Vault bootstrap creds + dev fallback values)
Memory footprint: ~85 MB resident (Bun process)
Security: `ProtectSystem=strict`, `NoNewPrivileges=true` in systemd unit

### Frontend (Cloudflare Pages)

- Domain: `myluby.net` + `www.myluby.net`
- Deploy: Forgejo push mirror → GitHub (`ElectronSpokes/luby`) → CF Pages auto-build
- Build-time env: `VITE_API_URL=https://api.myluby.net` (in both `.env` and `.env.production`), baked into `dist/` at Vite build time. Verify with `grep 'api.myluby.net' dist/assets/index-*.js`.

### Mobile (Capacitor 8)

- Bundle: `net.myluby.app`
- Android build: on the VM (10.0.110.27) — OpenJDK 21 + Android SDK at `/home/johnthomson/android-sdk`. `npm run build && npx cap sync android && cd android && ./gradlew assembleDebug`.
- iOS build: on Mac Mini M4 (10.0.15.10) — `git pull && npm run build && npx cap sync && pod install`, then Xcode build / TestFlight submission.
- iOS and Android scaffolds (`ios/`, `android/`) are both present in the repo.

### External exposure

- `api.myluby.net` → Cloudflare Tunnel (`5bc61fcb`) → `http://10.0.110.27:3001`
- CF Zone: `5263f84ac5711ed347deed5f337f8c4a`

### Remote dependencies

| Host | What Luby uses it for |
|------|----------------------|
| Authentik (10.0.25.3) | OIDC login for web users |
| Vault (10.0.25.2) | All secrets via AppRole auth |
| Hub (10.0.100.11) | Knowledge network (project registered) |
| Google Gemini API | All AI features (external, API key in Vault) |
| Google JWKS | Mobile auth token verification |

---

## How changes get made

| What | How |
|------|-----|
| Frontend | Edit in `/opt/luby/src/` (React) + `/opt/luby/index.html`, `git push` → auto-deploys via CF Pages |
| API | SSH to 10.0.110.27, edit code, `sudo systemctl restart luby-api` |
| Database | Migration files in `api/migrations/`, runner at `api/src/db/migrate.ts`, auto-run on API startup |
| Mobile (Android) | Build on VM (npm + cap sync + gradlew), install debug APK on device |
| Mobile (iOS) | Build on Mac Mini M4 (cap sync + pod install + Xcode), TestFlight/Play submission |

No CI/CD pipeline. Frontend is automatic on push. API requires manual restart. Mobile requires either VM (Android) or Mac (iOS).

---

## Authentication

| Platform | Method | Token storage |
|----------|--------|---------------|
| Web | Authentik OIDC (`auth.theflux.life`) | `luby_session` httpOnly cookie on `.myluby.net` |
| Mobile | Google Sign-In SDK → own HS256 JWT (30-day) | Capacitor Preferences (`auth_token`) |

Both paths validate against the same `users` table. Auth middleware chains Authentik JWT → Luby JWT → session cookie; first success short-circuits, all-fail = anonymous. See `product/decisions.md` DD-1, DD-2, DD-14, DD-15 for rationale.

---

## Credential management

Vault path: `secret/data/luby/api`
AppRole role ID: `87582477-9ac0-38e4-57b5-212f31c29a5b`

Secrets loaded once at startup via `loadSecretsFromVault()`. Falls back to `.env` if Vault unreachable. To rotate: update Vault secret, restart API service.

Secrets managed: `DATABASE_URL`, `GEMINI_API_KEY`, `AUTHENTIK_ISSUER`, `AUTHENTIK_CLIENT_ID`, `AUTHENTIK_CLIENT_SECRET`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID`.

---

## Scheduled tasks

None. All AI calls are on-demand and synchronous. No Celery, no cron.

---

## What Luby does NOT own

| Concern | Owned by |
|---------|----------|
| AI inference | Google Gemini (external API) |
| Identity/SSO | Authentik |
| Secrets | Vault |
| Git repos | Forgejo |
| DNS/CDN | Cloudflare |
| Infrastructure | HALINOVA |
| iOS builds | Mac Mini M4 (10.0.15.10) |

---

## Sources

*Consolidated from:*
- `CLAUDE.md` — implementation details
- `product/architecture.md` — system design, auth flow, Data Schema
- `product/decisions.md` — DD-N entries (rationale, status, watch-fors)
- `product/context.md` — current health and momentum
- `product/data-flow.md` — end-to-end data flows
