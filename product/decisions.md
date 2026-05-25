# Luby — Architecture Decisions
*Maintained by: Cleireach*
*Last updated: 2026-05-25*

<!-- New decisions append to the bottom. Format: ## DD-N: <title> -->
<!-- Content promoted from .claude/rules/decisions.md on 2026-05-25 as DD-1..DD-12. See DD-AUDIT at bottom. -->

## DD-1: Google Sign-In for mobile, Authentik OIDC for web

**Date:** 2026-03
**Decision:** Mobile uses the Google Sign-In SDK (`@capgo/capacitor-social-login`); web uses Authentik OIDC redirect flow.
**Rationale:** Mobile deep-link OIDC was unreliable — Chrome Custom Tabs blocked redirects and cookies didn't persist. Native Google Sign-In is one tap, no browser, no deep-link fragility.
**Implementation:** Mobile ID token exchanged server-side at `POST /api/v1/auth/google-signin`; server issues HS256 JWT (30-day).

## DD-2: Session cookies over JWT (web only)

**Date:** 2026-03
**Decision:** Web auth uses a session cookie on `.myluby.net`; no JWT.
**Rationale:** Simpler for a personal app. Cookie works across the CF Pages frontend and the CF Tunnel API.
**Watch for:** Mobile path diverged at DD-1 — mobile uses HS256 JWT (30-day), not cookies. Cookies don't persist across app restarts on mobile.

## DD-3: Cross-origin sameSite=None

**Date:** 2026-03
**Decision:** Session cookie set with `SameSite=None; Secure`.
**Rationale:** Required for `capacitor://localhost` (iOS) and `http://localhost` (Android) to send cookies to `api.myluby.net`.

## DD-4: Hono over Express

**Date:** 2026-03
**Decision:** API framework is Hono, not Express.
**Rationale:** Lighter, Bun-native, better TypeScript support.
**Watch for:** Express kept as a dependency for legacy compatibility — review for removal once nothing else references it.

## DD-5: Gemini server-side only

**Date:** 2026-03
**Decision:** All AI calls proxied through `/api/v1/ai/*`; the API key never reaches the client.
**Rationale:** Client-side keys would leak into the bundle and rotate badly.
**Verify:** `grep -c 'AIzaSy' dist/assets/*.js` must return 0 in any production build.

## DD-6: Vault AppRole for secrets

**Date:** 2026-03
**Decision:** API loads secrets from Vault via AppRole at startup (DB URL, Gemini key, auth creds). `.env` fallback for local dev only.
**Rationale:** Avoids env-files-as-source-of-truth drift. Vault path: `secret/data/luby/api`.

## DD-7: Single migration file for v1

**Date:** 2026-03
**Decision:** All v1 tables in `001-initial-schema.sql`.
**Rationale:** Schema is stable enough that splitting per-table costs more than it gives.
**Watch for:** Split when schema evolves substantially.

## DD-8: Single App.tsx over router

**Date:** 2026-03
**Decision:** All views in a single `App.tsx` with tab-based navigation; no router library.
**Rationale:** Works well for mobile-first layout.
**Watch for:** Refactor to a `pages/` directory when `App.tsx` exceeds ~2000 lines.

## DD-9: Capacitor Preferences for auth tokens

**Date:** 2026-03
**Decision:** Mobile auth tokens stored via Capacitor Preferences plugin; `localStorage` used as a cache for offline UX.
**Rationale:** API is source of truth; the local store is a cache, not state.

## DD-10: Gitea → GitHub → CF Pages pipeline

**Date:** 2026-03
**Decision:** Push to Gitea (now Forgejo), auto-mirror to GitHub, CF Pages auto-deploys.
**Rationale:** One `git push` ships the frontend with no manual deploy step.

## DD-11: CF Tunnel for API

**Date:** 2026-03
**Decision:** API exposed via Cloudflare Tunnel at `api.myluby.net`, not direct port forwarding.
**Rationale:** Tunnel handles TLS termination, no firewall port management.

## DD-12: APK served from API

**Date:** 2026-03
**Decision:** Debug APK download at `/download/app.apk` on the API for dev distribution.
**Rationale:** Quick path to install on a device while iterating.
**Watch for:** Replace with proper distribution (Play Store / F-Droid / signed direct download) before any non-dev use. No auth on this route — fine for dev, not for prod.

---

## DD-AUDIT: decisions.md location standardised

**Date:** 2026-05-25
**Decision:** Architecture decisions live in `product/decisions.md`, not `.claude/rules/decisions.md`.
**Rationale:** HALINOVA portfolio standard requires `product/decisions.md` as the canonical location (loaded by `/springboard` and audited by DaChief `STANDARD_DOCS`). Content lifted from `.claude/rules/decisions.md` as DD-1..DD-12; old file replaced with a one-line redirect.
**Watch for:** Some decisions visible in `product/architecture.md`'s Key Decisions table (static Capacitor imports, no JWT audience check, email-based user matching, open CORS) aren't yet captured as DD-N entries — promote on next material touch.
