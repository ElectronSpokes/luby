# Luby — Context Assessment
*Maintained by: Cleireach*
*Last updated: 2026-04-12*

## Health & momentum

**Stage:** Active development (Capacitor mobile app in progress)
**Momentum:** Medium — core web app deployed, API live, mobile app scaffolded with native camera and Google Sign-In
**Health:** Green — API running on systemd, CF Pages auto-deploying, Authentik OIDC working, Gemini AI proxy endpoints live

## Chief projections

*What each chief focuses on when working in Luby's context.*

**Treoir (CEO):** Personal wellness tool as a proving ground for AI-coached product UX — validates the "AI that actually knows your day" thesis. Low-risk sandbox for product innovation patterns reusable across the portfolio.

**Stiubhart (CFO):** Minimal infrastructure cost — single VM (10.0.110.27), Gemini 2.5 Flash for AI (pay-per-use), CF Pages for hosting (free tier), Authentik shared SSO. No expensive GPU or dedicated compute.

**Ruairidh (CTO):** Clean Hono+Bun API stack, Capacitor for cross-platform mobile, PostgreSQL with JSONB flexibility, Vault AppRole for secrets. Reference implementation for lightweight satellite API pattern.

**Morag (CPO):** Food scanning UX (camera → AI analysis → log), coaching quality (personalised not generic), daily flow simplicity (log anything in seconds). The "do you actually open it daily?" test.

**Fionnlagh (COO):** Single systemd service reliability, Gitea→GitHub→CF Pages deploy pipeline, tunnel connectivity (api.myluby.net), mobile build pipeline on Mac Mini M4.

**Sine (CMO):** "One app, one brain" positioning — anti-bloat wellness. Personal tool narrative, not a startup. Authenticity over growth metrics.

**Cleireach (CoS):** Documentation completeness (vision, architecture, standards done — context and roadmap needed), spec pipeline alignment with portfolio standards.

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
