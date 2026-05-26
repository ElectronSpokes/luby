# Luby — Session Notes
*Maintained by: /park command*

<!-- /park appends new entries at the top of the log below. /springboard reads the latest entry. -->

## Log

<!-- newest first -->

### 2026-05-26 — P0 F-Droid Distribution Waves 1+2+3 shipped end-to-end (15/22 tasks); live repo + signed APK pipeline ready for Wave 4 release fire

**Active task:** N/A — session closed cleanly at `/park`. Three waves done; Wave 4 (Release Fire) is the next step.

**Pending user asks:** None.

**In progress:** Nothing. Wave 1 (Infrastructure) + Wave 2 (Keystore Ceremony) + Wave 3 (Build Pipeline) all complete. Wave 4 starts with RE-1 test-fire on a feature branch with `v0.0.0-test` tag.

**Blocked:** Nothing technical. Physical USB delivery of the offsite GPG blob (`halinova:~/keystore-backups/luby-release-2026-05-26.gpg`) is deferred but pending — does NOT gate Wave 4, but should land before RE-3 first-install for catastrophic-loss survivability.

**Decisions made this session (most captured in commit bodies + status.md + tech-debt.md):**
- Spec deviation captured: Categories `Health & Fitness` (spec FR-14, Google Play's name) → `Sports & Health` (f-droid canonical category; lint complains anyway due to fdroidserver 2.4.4 schema-load bug)
- IN-1 no-op finding: existing `luby-app` Vault policy already grants `create+list+read+update` on `secret/data/luby/*` (wildcard) — release-keystore path auto-covered when KS-3 wrote it; no policy edit needed; mild deviation from FR-9's "narrowed read-only" wording accepted per BU-4 v1-reuse note
- IN-6 SSH key NOT restricted via `from=` / `command=` per user direction (parity with dogfood's `INFRA_GATEWAY_SSH_KEY_B64` pattern)
- BU-1 false starts converged on dogfood's exact gradle pattern: `(... ?: '1') as Integer` for versionCode + hoisted `def hasReleaseKeystore` for clean ternary
- Three operational learnings worth memory-routing (see Compound below): PKCS12 storepass==keypass invariant, PowerShell `>` mangles binary GPG output, Caddy v2 `browse off` is mis-parsed (latent in dogfood)
- Push decisions per-commit (luby Wave 3 commit → push; halinova feat/lubby1 → leave local)

**Relevant files:**
- `ssh johnthomson@10.0.110.27:/opt/luby/android/app/build.gradle` (BU-1 release signing + version injection)
- `ssh johnthomson@10.0.110.27:/opt/luby/metadata/net.myluby.app.yml` + `net.myluby.app/en-US/{short_description.txt,full_description.txt,icon.png}` (BU-2)
- `ssh johnthomson@10.0.110.27:/opt/luby/.forgejo/workflows/release-apk.yaml` (BU-3, 218L, 15 steps)
- `ssh johnthomson@10.0.110.27:/opt/luby/product/session-notes.md` (this entry)
- `/opt/halinova/spec/luby/fdroid-distribution/{status.md,tech-debt.md,ceremony-evidence/README.md,ceremony-evidence/2026-05-26-recovery.log,ceremony-evidence/2026-05-26-recovery.jar}` (halinova-side spec artefacts)
- `/opt/halinova/.gitignore` (Wave 2: narrow `!spec/*/*/ceremony-evidence/*.log` exception)
- `halinova:~/keystore-backups/luby-release-2026-05-26.gpg` (KS-4 offsite GPG blob, awaiting USB)
- `ssh johnthomson@10.0.100.4:/srv/fdroid-luby/{config.yml,keystore.p12,repo/index-v2.json,metadata/net.myluby.app.yml}` (gateway: F-Droid workspace + signed index + metadata pre-staged)
- `ssh johnthomson@10.0.100.4:/home/johnthomson/infra-gateway/{Caddyfile,docker-compose.yml}` (Wave 1 IN-3: Luby vhost + bind mount; backups `.pre-luby` retained)
- `ssh -i ~/.cloudflared.key root@10.0.20.4:/etc/cloudflared/config.yml` (Wave 1 IN-2: tunnel ingress addition for `fdroid.myluby.net`; backup `config.yml.bak.*` retained on tunnel host)
- `ssh johnthomson@10.0.110.23:~/.gnupg/` (Wave 2 KS-5: 48k's GPG private key imported for recovery ceremony — survives across waves)
- Vault `secret/data/luby/release-keystore` (KS-3: 4 fields — storeFile/storePassword/keyAlias/keyPassword)
- Forgejo Actions secrets on `halinova/luby`: `FDROID_SCP_KEY`, `VAULT_ADDR`, `VAULT_APPROLE_ROLE_ID`, `VAULT_APPROLE_SECRET_ID`

**Cross-project references:**
- **halinova** — spec set at `/opt/halinova/spec/luby/fdroid-distribution/` advanced with 4 commits on `feat/lubby1` branch (worktree `/opt/halinova-wt/99a04502`): `cdd5501` Wave 1 close + `bdb79a3` GPG pre-check + `13b4ae0` Wave 2 close (ceremony-evidence + .gitignore exception) + `48fbda7` Wave 3 close (status + 2 new TD rows). First three pushed to `origin/feat/lubby1`; **48fbda7 left local per user's explicit decision this session**. Spec is the canonical source-of-truth for waves; status.md tracks per-task findings. See `/opt/halinova/product/session-notes.md` for HALINOVA's own log.
- **dogfood** — used as canonical reference throughout (Caddyfile vhost shape, Forgejo workflow template, gradle signingConfigs pattern, GPG offsite-USB precedent). Surfaced one latent bug to capture on dogfood's side: `TD-DOGFOOD-CADDY-BROWSE-OFF-LATENT` in Luby's spec/tech-debt.md (Caddy v2 mis-parses `browse off` as a template path; dogfood is currently masked by basicauth firing first). Worth fixing next time dogfood Caddyfile is touched.
- **infra-gateway (10.0.100.4)** — `/srv/fdroid-luby/` workspace created (Wave 1 IN-4) + Caddyfile vhost added (IN-3, NO basicauth) + bind mount added to docker-compose.yml (IN-3) + workspace populated by KS-2 (`fdroid init` direct via keytool) + metadata pre-staged (BU-2) + signed `index-v2.json` reachable at `https://fdroid.myluby.net/repo/index-v2.json` (HTTP 200). All artefacts owned by `johnthomson:johnthomson` mode 0600.
- **cloudflare-tunnel (10.0.20.4)** — tunnel ingress rule for `fdroid.myluby.net → http://10.0.100.4:80` added (Wave 1 IN-2). Brief ~3s outage across all tunnel hostnames during systemctl restart. Steady-state config `/opt/halinova/config/steady-state/cloudflared.yaml` says `ssh_reachable: false` from VLAN 110 but it actually IS reachable — worth correcting in a future halinova doc pass.
- **bones (10.0.110.23)** — 48k's GPG private key imported (Wave 2 KS-5 pre-check) via 2-hop (Windows → HALINOVA → Bones, ASCII-armored, ssh -t for pinentry). Bones can now run recovery ceremonies for ANY product's catastrophic-loss blob in future (luggage, luby, future ones).

**Uncommitted:** Clean across all touched repos. Halinova worktree has 1 commit (48fbda7) ahead of origin/feat/lubby1 — left local per user's explicit decision. Luby commit `1d81f68` pushed to `origin/main`.

**Commits in this session:**
- luby `1d81f68` implement(fdroid-distribution): Wave 3 BU-1/BU-2/BU-3 build pipeline (on `main`, pushed)
- halinova `cdd5501` implement(luby/fdroid-distribution): Wave 1 — 6/6 infra tasks landed end-to-end (on `feat/lubby1`, pushed)
- halinova `bdb79a3` implement(luby/fdroid-distribution): Wave 2 GPG pre-check — Bones key imported (on `feat/lubby1`, pushed)
- halinova `13b4ae0` implement(luby/fdroid-distribution): Wave 2 — 5/5 keystore-ceremony tasks landed (on `feat/lubby1`, pushed)
- halinova `48fbda7` implement(luby/fdroid-distribution): Wave 3 close — status + 2 new TD rows (on `feat/lubby1`, **LOCAL ONLY** per user)

**Simplify gate (Step 2.5):** `/simplify` skill not installed on this satellite. Falls back to `--no-simplify` semantics per gate failure-mode. Unreviewed code-touching commits: luby `1d81f68` (build.gradle + metadata YAML + .forgejo/workflows/release-apk.yaml) + halinova worktree `13b4ae0` (.gitignore single-line exception; other paths in that commit under `spec/**` are doc-allowlisted). Captured as TD-PARK-SIMPLIFY-1 in `/opt/halinova/spec/luby/fdroid-distribution/tech-debt.md` with named pickup trigger (first iteration of BU-3 during RE-1 test-fire).

**Next steps:**
1. **RE-1 test-fire** — create a feature branch on `halinova/luby` (e.g. `feat/release-test`), tag `v0.0.0-test`, push to trigger the BU-3 workflow. Watch CI run end-to-end against a STAGING dir (`/srv/fdroid-luby/repo-staging/`, NOT `/srv/fdroid-luby/repo/`). Per dogfood precedent (CI-1 + FE-20 recovery arcs), expect 2-3 iterations on first run — typically container-image issues, gradle plugin compatibility, or Vault env-var quoting. Delete the throwaway tag post-test.
2. **RE-2 v0.1.0 production fire** — once RE-1 is clean, tag `v0.1.0` on `main`, push, observe CI to completion. Verify `https://fdroid.myluby.net/repo/index-v2.json` updates within 30s (NFR-3) + APK reachable at `https://fdroid.myluby.net/repo/net.myluby.app_<versionCode>.apk`. This is the live commitment point — KS-5 ceremony already proven (Wave 2 complete).
3. **RE-3 first install on 48k's Pixel** — uninstall current debug-signed Luby APK → add `https://fdroid.myluby.net/repo` to F-Droid client repositories → install Luby from catalogue → walk Sign-In + food-log + coaching-plan happy paths. Per FR-17.
4. **RE-4 update flow** — cut `v0.1.1` patch (trivial change, e.g. README comment) → CI publishes → F-Droid client surfaces update → in-place install → verify session preserved (no re-sign-in). Per FR-18, NFR-8.
5. **Wave 5 closure (CL-1, CL-2, CL-3)** — remove `/download/app.apk` route from `api/src/index.ts` + `systemctl restart luby-api` + verify 404 (CL-1, closes DD-12 watch-for) + tick all P0 task checkboxes in `product/roadmap.md` + update Mobile App row to "Live (Android via household F-Droid, release-signed)" (CL-2) + DD-12 Status: Closed (CL-3).
6. **Physical USB delivery (KS-4 tail)** — pull `halinova:~/keystore-backups/luby-release-2026-05-26.gpg` to Windows laptop (`scp johnthomson@10.0.110.16:~/keystore-backups/luby-release-2026-05-26.gpg ...`) → copy to USB → deliver offsite (mum's house per dogfood AC-7 precedent). Deferred from KS-4; does not gate Wave 4 but should land before RE-3 first-install for catastrophic-loss survivability.
7. **Push halinova `48fbda7`** to `origin/feat/lubby1` when ready to batch with Wave 4 commits (left local this session per explicit user decision; one trivial `git push origin feat/lubby1` from `/opt/halinova-wt/99a04502` does it).

**Watch for:**
- **Wave 4 first-fire iteration** — per dogfood CI-1/FE-20 precedent, BU-3's first live tag will likely surface 2-3 issues. Don't be surprised. Capture broken-tag-no-APK trail per dogfood pattern.
- **dachief-portfolio-runner availability** — workflow runs on `runs-on: docker` on this shared runner (10.0.110.12). If runner is busy with another job, Luby's run queues. Not a blocker, just a latency consideration.
- **TD-METADATA-GATEWAY-DRIFT** — if you edit any metadata text (description / icon refresh / categories) before option B (CI workflow extension) lands, remember to manually `scp metadata/* gateway:/srv/fdroid-luby/metadata/` + `ssh fdroid update -c`. CI workflow only scps APK.
- **Concurrent halinova activity** — another tab advanced canonical's main by ~8 commits during this session (S150-S151 activity per session-notes). Worktree `feat/lubby1` diverged from main accordingly. If FF-merging `feat/lubby1` to main later, rebase first.

---


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
