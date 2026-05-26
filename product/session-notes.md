# Luby — Session Notes
*Maintained by: /park command*

<!-- /park appends new entries at the top of the log below. /springboard reads the latest entry. -->

## Log

<!-- newest first -->

### 2026-05-26 — P0 F-Droid Distribution: shape + spec + tasks + verifier-pass landed end-to-end (5 commits across halinova + luby)

**Active task:** N/A — session closed cleanly at `/park`. P0 spec fully landed; ready for `/implement luby/fdroid-distribution` Wave 1.

**Pending user asks:** None.

**In progress:** Nothing — reached a clean handoff. P0 F-Droid Distribution moved from "no spec exists" to "verified spec ready for Wave 1 execution" in one continuous session.

**Blocked:** Nothing. Wave 1 (6 parallel infrastructure tasks) is fully unblocked.

**Decisions made this session (25 in spec-local decisions.md):**
- 16 shape-time: repo placement (standalone `fdroid.myluby.net`), Forgejo Actions on `v*` tags, skip in-app version-check endpoint, retire `/download/app.apk`, skip install instructions page, solo keystore ceremony (no Hudson), P0 wave placement, Vault paths, GPG-reuse, Caddy-on-infra-gateway, CF Tunnel reuse, bundle id net.myluby.app, versionCode-from-tag deferral, spec-location new convention, no Matrix ping, household-only repo (not f-droid.org public)
- 6 spec-time: versionCode = commit count, AntiFeatures = NonFreeNet+NonFreeDep, Bones VM as recovery machine, new Luby-scoped CI SSH key, F-Droid key rotation on compromise only, USB offsite for v1
- 3 verifier-time additions: D-FDROID-UPDATE-ON-GATEWAY (SSH-trigger `fdroid update` on infra-gateway, not in CI container), D-CADDY-NO-BASICAUTH (explicitly drop dogfood's basicauth block on Luby vhost), D-WORKSPACE-PARALLEL-DIR (Luby workspace at `/srv/fdroid-luby/`, parallel to dogfood's `/srv/fdroid/`)
- 2 in-place revisions post-verifier: D-VERSIONCODE-COMMIT-COUNT rationale corrected (dogfood uses `MAJOR*10000+MINOR*100+PATCH`, no minor-cap; commit-count is deliberate divergence not correction); D-VAULT-PATHS-NEW simplified from two Vault paths to one (F-Droid index key gateway-resident only)

**Relevant files:**
- `/opt/halinova/spec/luby/fdroid-distribution/shape.md` (NEW, 131L)
- `/opt/halinova/spec/luby/fdroid-distribution/spec.md` (NEW, 21 FR + 9 NFR + 5 US; revised post-verifier; Hub `1cdeb924-26df-46a5-b339-97b1dbe5a434` updated with new hash `be5a2eb...`)
- `/opt/halinova/spec/luby/fdroid-distribution/tasks.md` (NEW, 22 tasks across 5 waves; revised post-verifier)
- `/opt/halinova/spec/luby/fdroid-distribution/decisions.md` (NEW, 25 entries with verifier-pass revisions)
- `/opt/halinova/spec/luby/fdroid-distribution/tech-debt.md` (NEW, 2 rows post-verifier: TD-VERSIONCODE-COLLISION-RECOVERY + TD-GATEWAY-INDEX-KEY-NO-OFFSITE)
- `/opt/halinova/spec/luby/fdroid-distribution/status.md` (NEW)
- `ssh johnthomson@10.0.110.27:/opt/luby/product/roadmap.md` (MODIFIED — P0 track added ahead of P1)

**Cross-project references:**
- HALINOVA — P0 spec set lives at `/opt/halinova/spec/luby/fdroid-distribution/` (4 commits: `45ca5ec` shape, `04e12ce` spec, `f9aeadf` tasks, `df32209` verifier-pass revisions). Luby-side change is roadmap.md only. See `/opt/halinova/product/session-notes.md` for HALINOVA's own log. Spec-shaping work, no execution touched HALINOVA infra or services.
- dogfood — used as canonical reference for F-Droid pipeline pattern. Verifier source-verified live dogfood workflow YAML (via Forgejo API) + Caddyfile + `/srv/fdroid/` workspace (via SSH to infra-gateway). Findings F1, F2, F4, F5 all rooted in dogfood comparison. Luby's spec now explicitly notes the deliberate divergences (commit-count versionCode, no basicauth) vs the deliberate alignments (gateway-SSH fdroid update, gateway-resident index key, parallel-workspace dir).
- infra-gateway (10.0.100.4) — P0 will add `/srv/fdroid-luby/` workspace + `fdroid.myluby.net` Caddy vhost + CF Tunnel route. No work touched it this session; first touches happen in Wave 1 (IN-3, IN-4) of `/implement`.

**Uncommitted:** Clean. All 5 commits pushed to origin (halinova `45ca5ec`/`04e12ce`/`f9aeadf`/`df32209` on `admin_jt/HALINOVA`; luby `f9d856f` on `halinova/luby`). Both repos in sync with origin (0 ahead, 0 behind).

**Commits in this session:**
- halinova `45ca5ec` shape(luby/fdroid-distribution): P0 F-Droid Distribution — shape + decisions + tech-debt
- halinova `04e12ce` spec(luby/fdroid-distribution): detailed spec — 21 FR + 9 NFR + 5 US
- halinova `f9aeadf` tasks(luby/fdroid-distribution): 22 tasks across 5 waves
- halinova `df32209` verify(luby/fdroid-distribution): apply spec-verifier findings — align with dogfood lived pattern
- luby `f9d856f` docs(roadmap): add P0 F-Droid Distribution ahead of P1

**Next steps:**
1. **`/implement luby/fdroid-distribution` Wave 1** — 6 parallel infrastructure tasks (IN-1..IN-6): Vault writer policy, CF DNS+Tunnel, Caddy vhost (NO basicauth), `/srv/fdroid-luby/` workspace dir, fdroidserver+Caddy sanity check, CI scp SSH key. All S complexity, no external blockers. Natural starting point.
2. **Wave 2 (keystore ceremony) prep** — before firing Wave 2, schedule: KS-5 pre-check requires Bones (10.0.110.23) to have 48k's GPG private key. Run `ssh johnthomson@10.0.110.23 'gpg --list-secret-keys'` first; if absent, import via `gpg --export-secret-keys <id> | ssh johnthomson@10.0.110.23 'gpg --import'`. This is the catastrophic-loss-class gate before v0.1.0 publication.
3. **Process refinement (banked, not a task)** — chained `/shape-spec → /write-spec → /create-tasks` in one session this time elided per-stage verifier passes; retroactive verifier-pass caught 7 actionable findings (3 HIGH + 4 MEDIUM). Existing memory `feedback_spec_verifier_before_commit.md` already names the discipline (N=6 evidence base now including today). Next chained-skill session: run verifier BETWEEN each stage, not at the end. Pattern reusable across portfolio.
4. **Wave 3 BU-3 (Forgejo workflow) — expect iteration** — per dogfood lived experience (CI-1 + FE-20 recovery arcs surfaced 2-3 fix-and-retag cycles for the equivalent task). Capture broken-tag-no-APK trail per dogfood precedent.

**Watch for:** Nothing — no Luby services changed, no API code touched, repo idle phase continues (last code commit on luby still 2026-04-16; last service restart still 2026-05-04). The 1 roadmap doc commit + 4 halinova-side spec commits don't trigger any deploy. P0 work begins only when `/implement` fires.

---
### 2026-05-25 — First /springboard luby + full doc-standard closeout (4 commits, /park entry)

**Active task:** N/A — session closed cleanly at "What's next?" prompt after 4 commits + worktree cleanup. All planned work complete.

**Pending user asks:** None.

**In progress:** Nothing — reached a clean handoff point.

**Blocked:** Nothing.

**Decisions made this session:**
- DD-AUDIT (decisions.md location standardised to `product/decisions.md` per portfolio convention; old `.claude/rules/decisions.md` replaced with one-line redirect)
- DD-13: Static import for Capacitor plugins (promoted from architecture.md Key Decisions table)
- DD-14: No JWT audience check on Google Sign-In tokens (promoted; the `aud` mismatch between Android client ID and web client ID is the structural reason)
- DD-15: Email-based user matching on Google Sign-In (promoted; surfaced the `users.email` non-UNIQUE schema caveat)
- DD-16: Open CORS, tightening deferred (promoted; deliberate technical debt with concrete unblocking step)
- DD-4 status: Closed (express removed from `api/package.json`; legacy-compat watch-for satisfied)
- DD-7 watch-for: table count updated 9 → 10 user-data tables

**Relevant files:**
- ssh johnthomson@10.0.110.27:/opt/luby/product/decisions.md (NEW — 16 DD entries + DD-AUDIT)
- ssh johnthomson@10.0.110.27:/opt/luby/product/architecture.md (Data Schema subsection, auth tightening, iOS scaffold clarity, Key Decisions → DD-N cross-refs)
- ssh johnthomson@10.0.110.27:/opt/luby/product/roadmap.md (Current Focus, P5 partial status, P1 credential blocker, P3 client/server split, new Maintenance & Watch section)
- ssh johnthomson@10.0.110.27:/opt/luby/product/vision.md (header convention added — was the only product doc without `*Maintained by:*` + `*Last updated:*`)
- ssh johnthomson@10.0.110.27:/opt/luby/product/context.md (Stage Active → Steady-state; Momentum freshened; Morag credential blocker; Ruairidh decisions.md cross-ref; Cleireach doc count 7 → 10)
- ssh johnthomson@10.0.110.27:/opt/luby/product/standards.md (Forgejo, 10-doc count, spec location convention, DD-1/2/5/9/13/14/15 cross-refs, auth middleware failure semantics)
- ssh johnthomson@10.0.110.27:/opt/luby/product/use-cases.md (header conform, UC-9 production-vs-debug clarification, UC-11 partial-chart drift fix)
- ssh johnthomson@10.0.110.27:/opt/luby/product/data-flow.md (Forgejo, migration path fix, Mobile split into Android-on-VM + iOS-on-Mac, decisions.md ref in Sources)
- ssh johnthomson@10.0.110.27:/opt/luby/product/operating-model.md (VITE_API_URL correction, frontend path /opt/luby/web → /opt/luby/src/, migration files path, Mobile build flow split, Vault bootstrap-cred clarity)
- ssh johnthomson@10.0.110.27:/opt/luby/product/session-notes.md (this entry + the mid-session entry below)
- ssh johnthomson@10.0.110.27:/opt/luby/.claude/rules/decisions.md (replaced with redirect pointer)
- /opt/halinova-wt/83a404bf (removed — was the worktree this session ran in)
- /opt/halinova (canonical; `feat/lubby1` branch deleted — was 0 commits ahead of main, placeholder for upcoming Luby work that never landed there)

**Cross-project references:**
- HALINOVA — worktree `/opt/halinova-wt/83a404bf` removed + `feat/lubby1` branch deleted (placeholder, 0 commits ahead of main). HALINOVA canonical main also advanced from `703d7d5` → `ddd6f96` during this session via concurrent activity (unrelated). See `/opt/halinova/product/session-notes.md` for HALINOVA's own log.

**Uncommitted:** Clean. All 4 commits pushed to luby main and in sync with origin (0 ahead, 0 behind). HALINOVA canonical clean.

**Commits in this session (luby main):**
- `9530cc0` docs: review pass on 6 remaining product docs — drift fixes, DD cross-refs, header convention
- `5f5f976` docs: roadmap review — current focus, P5 partial, maintenance section, P1 credential blocker
- `efc53d0` docs: architecture + decisions review — DD-13..DD-16, schema section, auth + iOS clarifications
- `6e5804a` docs: promote .claude/rules/decisions.md → product/decisions.md (DD-N format)

**Next steps:**
1. **Pickup-friendly: P5 chart expansion** — basic recharts `BarChart` for last-7-food-entries already shipped at `App.tsx:536`; extending to hydration/movement/fasting is additive, no new infrastructure. Could land in one short session.
2. **Pickup-friendly: Maintenance & Watch items** — Vault-vs-`.env` source-of-truth audit (read-only, safe), `@capacitor/cli` 7→8 bump (verify intent or bump), CORS catalogue (DD-16 watch-for; needs cataloguing iOS dev/release + Android dev/release origins). See `product/roadmap.md` Maintenance & Watch table for full list.
3. **Blocked: P1 App Store submission** — needs 48k to start external credential processes (Apple Developer + Google Play Console + Firebase Cloud Messaging) before any P1 work can advance.
4. **Pattern reusable elsewhere** — first-springboard audit framework (decisions.md promotion → architecture review → roadmap review → 6-doc cleanup pass) applies to any portfolio product that hasn't been /springboard'd before. Cosmogenic, FAWB, possibly others may benefit.

**Watch for:** Nothing — no Luby services changed, no code touched, repo idle phase continues (last code commit still 2026-04-16; last service restart still 2026-05-04). The 4 doc commits today don't trigger any redeploy.

---

### 2026-05-25 — First /springboard luby; doc-standard compliance closeout

**In progress:** First real `/springboard luby` against the project (cut from a HALINOVA worktree). Audit surfaced one standard-compliance gap: `product/decisions.md` missing. Promoted 12 existing decisions from `.claude/rules/decisions.md` into DD-N format at the canonical location; replaced the old file with a one-line redirect.

**Decisions:**
- DD-AUDIT: decisions.md location standardised to `product/decisions.md`.

**Uncommitted:** None — all work committed and pushed in this session.

**Next steps:**
1. Promote the Key Decisions table from `product/architecture.md` (static Capacitor imports, no JWT audience check, email-based user matching, open CORS) into DD-13..DD-16 next time architecture.md is touched.
2. Decide whether the HALINOVA-side `feat/lubby1` branch is for upcoming Luby work — if not, delete; currently identical to main.
3. Pick up roadmap Priority 1 (App Store submission) when ready — iOS TestFlight build on Mac Mini M4 (10.0.15.10), Google Play submission needs production signing.

**Watch for:** Nothing — no Luby services changed; repo has been idle since 2026-04-16, so docs are not stale relative to code.

*Note: this entry was a mid-session compaction commit. The comprehensive /park entry above (also dated 2026-05-25) covers the full session arc including the 3 commits that followed this one.*

---

### 2026-04-16 — /park + /springboard verification

**In progress:** Rolling out session-notes.md to all portfolio products. Testing the /park → /springboard handoff cycle works for Luby specifically.

**Decisions:** None — process verification only.

**Uncommitted:** Unknown — this is a seed entry, not from a real Luby work session.

**Next steps:**
1. Verify `/springboard luby` reproduces these next steps verbatim in a new session
2. Roll out session-notes.md to Cosmogenic (10.0.110.25)

**Watch for:** Nothing — no Luby services changed.

---
