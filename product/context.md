# Luby — Context Assessment
*Maintained by: Cleireach*
*Last updated: 2026-05-25*

## Health & momentum

**Stage:** Steady-state / maintenance — last code commit 2026-04-16, last service restart 2026-05-04. Production APK installed and working on Android; web live at myluby.net.
**Momentum:** Steady — no active development wave since mid-April; doc set freshened 2026-05-25 (full 12/12 standard compliance + cross-refs between architecture, decisions, and roadmap).
**Health:** Green — API running on systemd, CF Pages auto-deploying, dual auth working (Authentik web + Google Sign-In mobile), Gemini AI proxy endpoints live, Android APK on device.

## Chief projections

*What each chief focuses on when working in Luby's context.*

**Treoir (CEO):** Personal wellness tool as a proving ground for AI-coached product UX — validates the "AI that actually knows your day" thesis. Low-risk sandbox for product innovation patterns reusable across the portfolio.

**Stiubhart (CFO):** Minimal infrastructure cost — single VM (10.0.110.27), Gemini 2.5 Flash for AI (pay-per-use), CF Pages for hosting (free tier), Authentik shared SSO. No expensive GPU or dedicated compute.

**Ruairidh (CTO):** Clean Hono+Bun API stack, Capacitor 8 for cross-platform mobile, dual auth (Authentik + Google Sign-In), PostgreSQL with JSONB flexibility, Vault AppRole for secrets. Reference implementation for lightweight satellite API + mobile pattern. Android build stack on VM, iOS builds on Mac Mini M4. See `product/decisions.md` (16 DD-N entries + DD-AUDIT) for full architectural rationale.

**Morag (CPO):** Food scanning UX (camera -> AI analysis -> log), coaching quality (personalised not generic), daily flow simplicity (log anything in seconds). The "do you actually open it daily?" test. App Store submission is the next milestone — currently blocked on external credential acquisition (Apple Developer + Google Play Console + FCM) per roadmap P1.

**Fionnlagh (COO):** Single systemd service reliability, Forgejo->GitHub->CF Pages deploy pipeline, tunnel connectivity (api.myluby.net), Android build chain on VM (npm build -> cap sync -> gradle), iOS pipeline on Mac Mini M4.

**Sine (CMO):** "One app, one brain" positioning — anti-bloat wellness. Personal tool narrative, not a startup. Authenticity over growth metrics.

**Cleireach (CoS):** All 10 product docs current (2026-05-25 — full portfolio-standard set with decisions.md promoted from `.claude/rules/` + roadmap Current Focus + Maintenance & Watch surface). `doc-dependencies.yaml` live; /implement and /simplify doc freshness checks enabled.

**Ceannas (CIO):** Gemini integration quality across 7 AI endpoints, food scanning accuracy, coaching relevance. Data privacy — personal health data stays on owned infrastructure.

**Aoibhneas (CJO):** Daily-use tool as energy source — something 48k built for himself, used by himself. Joy in utility. Risk: feature creep turning a simple tool into the bloatware it replaced.

## Cleireach maintenance notes

*Standard triggers (all projects):*
- After any executive meeting in Luby context
- When a wave milestone ships
- When an open question moves to `decisions/`
- When health or momentum changes

*Luby-specific triggers:*
- After mobile app milestone (TestFlight, Play Store)
- When new AI endpoint is added
- When auth flow changes (web or mobile)
- After coaching model or prompt changes
