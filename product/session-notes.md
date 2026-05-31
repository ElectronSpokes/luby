# Luby — Session Notes
*Maintained by: /park command*

<!-- /park appends new entries at the top of the log below. /springboard reads the latest entry. -->

## Log

<!-- newest first -->

### 2026-05-31 — Full review→hardening→feature sweep + uncovered & fixed a 3-month-stale web deploy

**Active task:** N/A — session closed cleanly at /park ("great job today, lets park; i can look into the others from their own springboards").

**Pending user asks:** None. User deferred dogfood-build + cosmogenic investigations to those projects' own springboards.

**In progress:** Nothing. Six PRs merged + several direct landings; all verified.

**Blocked:** Nothing on Luby. (dogfood.band + cosmogenic web are stale — see Cross-project references — but deferred by the user to their own springboards.)

**Decisions:**
- **DD-6 amended** — ratified `.env`-primary reality (systemd unit loads only `/opt/luby/api/.env`, never `config-env/vault.env`; startup logs "No Vault config"). Vault is a warm standby. Reconciled the drifted `session_secret` into Vault (KV v2 v2) so a future wiring-flip can't silently invalidate mobile JWTs.
- **DD-16 resolved** — CORS narrowed from open-reflection (`origin:(o)=>o||'*'`) to a closed 7-origin allowlist. Android native origin is `https://localhost` (Cap8 default scheme) — corrected from stale `http://localhost` note.
- **DD-18 added** — VM Node 20→24 LTS (unblocks `@capacitor/cli` v8; `engines.node>=22`). luby-api is Bun, untouched.
- `/simplify` gate: origin-ahead-only fallback (no substrate session), nothing ahead → silent skip. PR #1 was itself a /simplify pass.

**Relevant files:**
- `ssh johnthomson@10.0.110.27:/opt/luby/` — src/App.tsx (P5 charts), api/src/index.ts (CORS), api/src/routes/auth.ts + services/authentik.ts + lib/api.ts + hooks/useAuthentikDeepLink.ts (PR#1 simplify), api/migrations/001-initial-schema.sql (email invariant), package.json + android/*.gradle (Cap8), README.md, product/{decisions,roadmap,data-flow,architecture,system-diagram.md+png}
- Infra (no repo): Forgejo push-mirror `halinova/luby` recreated w/ fresh PAT; CF Pages `luby` manual deploy triggered (c5fa25bc, deploy:success)
- `~/.claude/projects/-opt-halinova/memory/ref-diagram-tooling.md` (new)

**Cross-project references:**
- **dogfood** — Forgejo→GitHub push mirror was auth-broken (same expired ElectronSpokes PAT); **fixed** (delete+recreate w/ new token, GitHub caught up to 7d90067, auto-sync restored). BUT dogfood.band is stale from a SEPARATE cause: **CF Pages builds are FAILING** (3× build:failure on current main since ~May 26) — needs the build log diagnosed from dogfood's own springboard. See `ssh johnthomson@10.0.100.2:/opt/dogfood/product/session-notes.md`.
- **halinova** — Luby Authentik-PKCE spec set landed on halinova/main (merge `ab6dc87`), TD-PARK-SIMPLIFY-1 closed; `mmdc-png` (mermaid-cli) installed on HALINOVA; 4 Hub learnings banked (7d456666 simplify-cast, vault-drift, 1640ed61 two-break-deploy, diagram-tooling). See `/opt/halinova/product/session-notes.md`.

**Uncommitted:** Clean. Luby main in sync with origin (0 ahead/behind). All 6 PRs merged + branches pruned.

**Next steps:**
1. **luby CF Pages auto-build is DEAD since ~Mar 3** — GitHub App webhook stopped firing builds on push (web was 3mo stale, hidden behind the also-broken mirror). Reconnect the GitHub App in CF Pages dashboard (luby project → Settings → Builds & deployments) so pushes auto-deploy; until then every web deploy needs a manual CF API trigger.
2. **Rotate the GitHub PAT** — `ghp_…` was shared in plaintext (no expiry). Regenerate + store in Vault `secret/halinova/github` + rotation reminder (silent expiry caused this whole incident; covers luby+dogfood).
3. **P5 tail** (optional, additive) — fasting-history chart, day-aggregation, weekly/monthly server summaries. Cut a `v*` tag to ship the new charts to the Pixel app (web has them now).
4. dogfood + cosmogenic — deferred to their own springboards (dogfood CF build failure; cosmogenic CF last deploy Mar 15, unchecked).

**Watch for:** myluby.net now serves the P5 charts (bundle `index-CtkilbaN.js`). luby-api was **restarted** mid-session (CORS deploy) and the **VM is now on Node 24**. Vault `session_secret` reconciled. Both luby + dogfood GitHub mirrors now auto-sync (8h interval + on-commit). The luby CF auto-build still needs the dashboard reconnect (#1) — until then merges won't auto-appear on the web.

---

### 2026-05-29 — Authentik PKCE mobile sign-in spec — Waves 1–5 landed end-to-end (5 luby/main commits + 4 halinova status commits); Wave 6 release fire pending

**Active task:** N/A — session closed cleanly at /park after user picked "/park here; come back fresh for Wave 6" from cadence question. Code side of `spec/luby/authentik-pkce-mobile` is COMPLETE; only the release fire (Wave 6 RE-1..RE-8) remains.

**Pending user asks:** None.

**In progress:** Nothing. Five waves of authentik-pkce-mobile fully landed (luby/main `48516e9`→`9fa5d83`; halinova feat/luby-authentik-pkce-shape `a79daf0`→`c41e8e8`). luby-api restarted twice mid-session (after BE-2 and after Wave 4); /auth/mobile-callback live (HTTP 400 on empty body), /auth/google-signin gone (HTTP 404). vitest 47/47 pass across 5 test files (TE-1 hook 7 branches + TE-2 pkce 13 + TE-3 deep-link 13 + TE-4 roundtrip 10 + BE-1 helper 4).

**Blocked:** Nothing technical. **Pre-ship gate** before Wave 6 RE-5: `VITE_AUTHENTIK_CLIENT_ID` needs to land in `.env.production` (FE-5 hook fallback is `'luby-api'` dev default; Authentik will reject the wrong client_id in real PKCE flow → v0.2.0 APK would fail authorize URL with 'invalid client' on the Pixel). Real value lives in Vault `secret/data/luby/api` key `authentik_client_id` or visible in the Luby OIDC client page in Authentik admin UI.

**Decisions:**
- **IN-1 closed mid-session** — 48k did Authentik admin UI step (added `net.myluby.app://callback` second redirect URI + toggled PKCE on, kept Confidential client type). AC-11 web sign-in smoke-test at myluby.net PASS — OQ-1 did NOT fire (Authentik's "Code Challenge Required" toggle is compatible with the non-PKCE web flow on Confidential clients). No IN-1a branch needed.
- **D-REPLACE-NOT-PARALLEL ratified** in code — single Authentik auth path for both web and mobile (Android); no parallel Google fallback maintained. Confirmed mid-session via user question "are we keeping the google and graphen build separate?" — answer: NO, single build, single auth, single OIDC client. iOS deferred to P1 (Universal Links shape; out of v1).
- **Existing Google-issued Luby JWTs preserved** — Wave 4 didn't invalidate them. Middleware accepts `type: 'luby_session'` JWTs regardless of how they were minted; old tokens expire naturally at 30-day TTL. Smooth upgrade path per US-5.
- **BE-1 helper signature is a strict superset of OQ-2's spec contract** — `exchangeCodeForTokens` returns `{accessToken, idToken, expiresIn, claims}` so both web `/callback` (needs accessToken for cookie + expiresIn for maxAge) and mobile `/mobile-callback` (needs claims for upsertUser + signing) use the same call without extending.
- **FE-4 path-segregate (option a) chosen** — existing `src/lib/platform.ts` (`isNative` + `getPlatform`) kept AS-IS; new `src/lib/native/platform.ts` exports `isNativePlatform`, `getPlatform`, `isAndroid`, `isIOS`. FE-5 hook imports from new location; existing callers (lib/useAuth.ts) keep their import path.
- **Wave 4 BE-3 + BE-4 cleanup also removed unused imports** — `sql` (only used by google-signin), `lookupUserByEmail` + `getJwks` (neither used after BE-1 + BE-3). Stale comment in middleware/auth.ts updated to reference `/auth/mobile-callback` instead of removed `/auth/google-signin`.
- **VITE_AUTHENTIK_CLIENT_ID gate captured** — not blocking implementation but blocks RE-5; pre-flight item in spec status.md + this park.
- **`/simplify` deferred — reason: skill not installed on this satellite** (continuing S3+S4 pattern). 5 unreviewed code-touching commits captured as TD-PARK-SIMPLIFY-1 in `spec/luby/authentik-pkce-mobile/tech-debt.md` (48516e9 + 82519ed + e13a59b + 91c3528 + 9fa5d83); named pickup trigger = first iteration of /simplify-aware work touching `api/src/routes/auth.ts` or `src/hooks/useAuthentikDeepLink.ts`.

**Relevant files:**
- `ssh johnthomson@10.0.110.27:/opt/luby/api/src/services/authentik.ts` (NEW, BE-1 helper)
- `ssh johnthomson@10.0.110.27:/opt/luby/api/src/routes/auth.ts` (270L → 113L: web `/callback` refactored, new `/mobile-callback`, `/google-signin` removed)
- `ssh johnthomson@10.0.110.27:/opt/luby/api/src/middleware/auth.ts` (stale comment updated)
- `ssh johnthomson@10.0.110.27:/opt/luby/api/src/services/vault.ts` (`google_client_id` removed from SECRET_MAPPING)
- `ssh johnthomson@10.0.110.27:/opt/luby/api/src/config.ts` (`googleClientId` removed from getConfig)
- `ssh johnthomson@10.0.110.27:/opt/luby/api/tests/services/authentik.test.ts` (NEW, 4 branches)
- `ssh johnthomson@10.0.110.27:/opt/luby/src/lib/native/{deep-link,pkce,platform}.ts` (NEW, dogfood ports)
- `ssh johnthomson@10.0.110.27:/opt/luby/src/hooks/useAuthentikDeepLink.ts` (NEW, 134L; dogfood port + adapter rewrite)
- `ssh johnthomson@10.0.110.27:/opt/luby/src/lib/useAuth.ts` (FE-6: 122L → 81L SocialLogin → Authentik PKCE swap)
- `ssh johnthomson@10.0.110.27:/opt/luby/android/app/src/main/AndroidManifest.xml` (intent-filter for `net.myluby.app://callback`)
- `ssh johnthomson@10.0.110.27:/opt/luby/package.json` (vitest added, @capgo/capacitor-social-login removed)
- `ssh johnthomson@10.0.110.27:/opt/luby/vitest.config.ts` (NEW, root config: node env + tests/** + api/tests/** include patterns)
- `ssh johnthomson@10.0.110.27:/opt/luby/.env.production` (VITE_GOOGLE_CLIENT_ID stripped; VITE_API_URL only)
- `ssh johnthomson@10.0.110.27:/opt/luby/.env` (VITE_GOOGLE_CLIENT_ID stripped; gitignored, local-only)
- `ssh johnthomson@10.0.110.27:/opt/luby/tests/{hooks/use-authentik-deep-link,lib/native/{pkce,deep-link},integration/deep-link-pkce-roundtrip}.test.ts` (4 NEW test files, 43 branches)
- `ssh johnthomson@10.0.110.27:/opt/luby/product/{decisions,architecture,standards}.md` (DO-1/2/3 updates; DD-13/14/17 → Closed; arch Auth section + diagram + tables rewritten; standards Capacitor + Auth Standards rewritten)
- `ssh johnthomson@10.0.110.27:/opt/luby/doc-tech-debt.md` (NEW; deferral tracking — Wave 2's architecture.md + standards.md entries resolved by DO-2/DO-3; data-flow.md flagged OPEN as spec gap)
- `/opt/halinova-wt/c6884ef1/spec/luby/authentik-pkce-mobile/{status,tech-debt}.md` (per-wave status updates + TD-PARK-SIMPLIFY-1)
- Cross-host reads: `ssh johnthomson@10.0.100.2:/opt/dogfood/{lib/native,hooks,tests,components/auth,package.json,vitest.config.ts,tsconfig.json}/*` (used as source-of-truth for all FE-2/3/4/5 ports + all TE-1..4 test ports + Wave 3 FE-6 NativeAuthButton authorize-URL pattern reference)

**Cross-project references:**
- **halinova** — spec set at `/opt/halinova/spec/luby/authentik-pkce-mobile/` advanced via 4 status commits on `feat/luby-authentik-pkce-shape` branch (worktree `/opt/halinova-wt/c6884ef1`): `a79daf0` (Wave 1) + `d9d5317` (Wave 2) + `310917b` (Waves 3+4) + `c41e8e8` (Wave 5). Branch is now 7 commits ahead of `halinova/main` (3 from S5 shape+spec+tasks + 4 status updates from this session). All pushed to origin/feat/luby-authentik-pkce-shape; awaiting FF-merge to halinova/main whenever convenient. Canonical activity is on duilleag-side per latest park `56c8b98` — no conflict expected on `spec/luby/`. Also TD-PARK-SIMPLIFY-1 added to spec tech-debt.md. See `/opt/halinova/product/session-notes.md` for any halinova-side park entry on this.
- **dogfood** — used as canonical reference for the entire implementation: PKCE library (`lib/native/{deep-link,pkce,platform}.ts` byte-identical port), hook composition (`hooks/useDeepLinkAuth.ts` adapter rewrite for JWT/Preferences shape), authorize-URL pattern (`components/auth/NativeAuthButton.tsx` → adapted into luby `src/lib/useAuth.ts` login() native branch), test corpus (43 branches across 4 files ported). No dogfood-side commits this session — purely consumer of dogfood's published 2026-05 Luggage spec. One spec-gap finding worth dogfood's side noting at next dogfood session: dogfood's `useDeepLinkAuth` hook hardcodes `window.location.href = outcome.route` on success; if dogfood ever flips to a Capacitor SPA shape (state in React, not cookies), they'll hit the same adapter rewrite luby just did (FE-5 (d) "no window.location.href reload" rule).

**Uncommitted:** Clean across luby/main (after session-note commit lands as final park step). Halinova worktree `c6884ef1` will be clean after tech-debt + this session-note commit. Local-only: luby `/opt/luby/.env` (VITE_GOOGLE_CLIENT_ID stripped, gitignored).

**Commits in this session:**

luby/main (5 commits, all pushed to origin/main):
- `48516e9` feat(luby/authentik-pkce-mobile): Wave 1 — BE-1 + FE-1..FE-4 + AN-1 (10 files, +704/-33)
- `82519ed` feat(luby/authentik-pkce-mobile): Wave 2 — FE-5 + BE-2 (3 files, +231)
- `e13a59b` feat(luby/authentik-pkce-mobile): Wave 3 — FE-6 UI swap (1 file, +27/-68)
- `91c3528` feat(luby/authentik-pkce-mobile): Wave 4 — Google removal (FE-7 + FE-8 + BE-3 + BE-4) (7 files, +2/-94)
- `9fa5d83` feat(luby/authentik-pkce-mobile): Wave 5 — tests + docs (TE-1..4 + DO-1..3) (8 files, +757/-44)

halinova/feat/luby-authentik-pkce-shape (4 commits, all pushed to origin):
- `a79daf0` status(luby/authentik-pkce-mobile): Wave 1 closed
- `d9d5317` status(luby/authentik-pkce-mobile): Wave 2 closed
- `310917b` status(luby/authentik-pkce-mobile): Waves 3+4 closed
- `c41e8e8` status(luby/authentik-pkce-mobile): Wave 5 closed

**Simplify gate (Step 2.5):** `/simplify` skill not installed on this satellite (per S3+S4 precedent). Falls back to `--no-simplify` semantics per gate failure mode. 5 unreviewed code-touching commits — 48516e9 + 82519ed + e13a59b + 91c3528 + 9fa5d83 — captured as TD-PARK-SIMPLIFY-1 in `spec/luby/authentik-pkce-mobile/tech-debt.md`. Named pickup trigger: first /simplify-aware session touching `api/src/routes/auth.ts` or `src/hooks/useAuthentikDeepLink.ts`.

**Next steps:**

1. **Land VITE_AUTHENTIK_CLIENT_ID in `.env.production`** — pre-ship gate. Real value lives in Vault `secret/data/luby/api` key `authentik_client_id` (or visible in Authentik admin UI as Luby OIDC client identifier). RE-5 v0.2.0 ship will produce a broken APK without it (Authentik rejects 'luby-api' fallback as invalid client).
2. **`/implement luby/authentik-pkce-mobile` Wave 6** — RE-1 + RE-2 verification gates (`gradle :app:dependencies | grep com.google.gms` empty; bundle no `client_secret`) → **RE-3 delete Google Cloud OAuth clients** in project `gen-lang-client-0511482895` (least-reversible; user-owned via Google Cloud Console: 2 Android clients + 1 Web client) → RE-4 `vault kv patch secret/data/luby/api GOOGLE_CLIENT_ID=` + restart luby-api → RE-5 tag `v0.2.0` → CI auto-builds + publishes APK to `https://fdroid.myluby.net/repo` → **RE-6 first-install on 48k's GrapheneOS Pixel** (manual AC-9 verification — the gates moment for the whole spec) → RE-7 stub `v0.2.1` for update flow verify → RE-8 close P0 on roadmap.
3. **carry-forward from S3+S4+S5: Physical USB delivery (KS-4 tail)** — pull `halinova:~/keystore-backups/luby-release-2026-05-26.gpg` → Windows laptop → USB → mum's offsite per dogfood AC-7 precedent. Still pending; not blocking PKCE wave but needed for catastrophic-loss survivability before any next F-Droid-class fire.
4. **FF-merge halinova `feat/luby-authentik-pkce-shape` → main** when convenient. Branch 7 commits ahead of halinova/main (3 shape+spec+tasks from S5 + 4 status updates from this session). All pushed. Canonical S154 duilleag-side activity — no conflict on `spec/luby/`. Can FF without coordination.
5. **Worktree close** — `/opt/halinova-wt/c6884ef1` retained per default; pass `--close` to /park at end of Wave 6 cycle (per worktree-day walkthrough) OR let GC sweeper reap. Note: this /park ran from `/opt/halinova-wt/99a04502` which is the orphan from S4 (reaped from worktree registry during 2-day session gap, files only on disk, not in `git worktree list`); the live worktree for the PKCE spec branch is c6884ef1.
6. **data-flow.md mobile auth section rewrite** — flagged OPEN in `luby:/opt/luby/doc-tech-debt.md`; Wave 5 DO tasks didn't explicitly own it (spec gap). Low priority; pick up alongside next Luby session touching data-flow.md OR open a new DO-4 task at next session.

**Watch for:**

- **VITE_AUTHENTIK_CLIENT_ID pre-ship gate** — if missed and RE-5 fires, the published v0.2.0 APK on the Pixel will fail authorize URL with 'invalid client' (the wrong client_id 'luby-api' instead of the real OIDC identifier). RE-1 + RE-2 don't catch this — they verify Google removal, not Authentik configuration correctness. Add a smoke-curl against the Authentik authorize URL with the bundled client_id as a pre-RE-5 sanity check if motivated.
- **RE-6 first-install on Pixel** — per dogfood FE-15..FE-19 fold-back arc, expect 1-3 fix-and-retag cycles on first fire. Don't be surprised; capture broken-tag trail per dogfood precedent. Most likely failure points: deep-link race (warm + cold listener) — FE-5 hook carries dogfood-proven `processed` dedup; PKCE state survival across browser hop — Capacitor Preferences write/read tested by TE-1..TE-4; AndroidManifest intent-filter — XML validated but only on-device install proves it routes correctly.
- **Existing Google-issued Luby JWTs on user device** — middleware accepts them via `type: 'luby_session'` regardless of provenance; expire naturally at 30-day TTL. User upgrading to v0.2.0 stays signed in until their existing JWT expires; then they re-sign-in via the new Authentik PKCE path. Smooth upgrade per US-5; no migration code needed.
- **Concurrent halinova canonical activity** — S154 duilleag pipeline work (4 commits since session start: `56c8b98` park + `4d4f35c` + `c57e924` + earlier). Different code area; no FF-merge conflict expected for luby spec branch.
- **Pre-existing luby tsconfig gap** — `tsconfig.json` lacks `strict: true` + `vite/client` types reference (dogfood has both). Surfaced this session as a discriminated-union narrowing failure in the FE-5 hook (sidestepped with `Extract<>` cast at the `outcome.error` access; documented inline). Also fires `import.meta.env` typing errors on `api.ts` + `useAuth.ts` + the new hook. Project-wide fix touches multiple files outside this spec; deferred. Worth a future small spec or M&W item.
- **Mac-side iOS PKCE work** — out of v1 per DD-17 (iOS uses Universal Links / Associated Domains, not custom scheme; different shape). When P1 starts post-Apple-Developer-credential acquisition, budget for the iOS path — won't be a copy-paste from Android.
- **Hub session went stale during session** — register at 2026-05-28T06:29 UTC; session re-engaged 2026-05-29 after >24h gap; substrate marked stale automatically. /park submitting park event despite stale marker. Worth checking the substrate-side handling of park-on-stale in case it 4xxs.

---


### 2026-05-28 — Diagnosed GrapheneOS Sign-In block; shaped + spec'd + tasked Authentik PKCE mobile wave (P0)

**Active task:** N/A — session closed cleanly at `/park`. Spec + tasks complete; `/implement luby/authentik-pkce-mobile` Wave 1 is the next pickup.

**Pending user asks:** None.

**In progress:** Nothing. Shape + Spec + Tasks all landed and committed across both repos.

**Blocked:** Nothing technical. Authentik admin access needed at IN-1 implementation time (extend OIDC client + enable PKCE). All other Wave 1 tasks runnable now.

**Decisions:**
- **DD-17 captured then reconciled** in `/opt/luby/product/decisions.md` — first commit (0488690) framed as "parallel option to Google Sign-In"; second commit (c09acf7) reconciled to "replace Google Sign-In" per shape D-REPLACE-NOT-PARALLEL. DD-1, DD-13, DD-14 superseded by DD-17 on spec ship.
- **Wave promotion**: M&W row "Authentik PKCE mobile sign-in path" removed; promoted to new Priority 0 in `/opt/luby/product/roadmap.md` (ahead of P1 App Store which is externally blocked).
- **11 spec-local decisions** in halinova spec dir — D-REPLACE-NOT-PARALLEL, D-EXTEND-EXISTING-OIDC-CLIENT, D-PORT-DOGFOOD-PKCE-LIB, D-MOBILE-CALLBACK-DISTINCT-PATH, D-REUSE-EXISTING-JWT-SHAPE, D-IN-SCOPE-GOOGLE-REMOVAL, D-WAVE-PROMOTE-P0, D-IOS-OUT-OF-SCOPE-V1, D-NO-MIGRATION-NEEDED, D-CONFIDENTIAL-CLIENT-PLUS-PKCE, D-NFR7-PARITY-CLAIMED.
- **Verifier discipline at every gate**: shape pass surfaced 7 findings (2 HIGH, 2 MEDIUM, 3 LOW); spec pass 12 (4 HIGH, 5 MEDIUM, 3 LOW); tasks pass 14 (1 HIGH, 3 MEDIUM, 3 LOW + 7 spot-checked-clean). All actionable findings source-verified per `feedback_subagent_verifier_source_verify` (grep against cited file:line, ~30s each) and applied before commit. Single-session evidence base for the per-gate verifier discipline.

**Relevant files:**
- `ssh johnthomson@10.0.110.27:/opt/luby/product/decisions.md` (DD-17 capture + reconciliation; DD-1 status updated)
- `ssh johnthomson@10.0.110.27:/opt/luby/product/roadmap.md` (M&W → P0 promotion + Current Focus update)
- `/opt/halinova-wt/c6884ef1/spec/luby/authentik-pkce-mobile/{shape,decisions,spec,tasks,status,tech-debt}.md` (full spec set)
- Source-verified reads: `/opt/luby/api/src/{routes/auth.ts,middleware/auth.ts,services/vault.ts,config.ts,index.ts}`, `/opt/luby/src/lib/{useAuth.ts,platform.ts}`, `/opt/luby/android/app/src/main/AndroidManifest.xml`, `/opt/luby/package.json`
- Cross-ref reads: `/opt/dogfood/api/src/routes/auth.ts` (L165-220 PKCE handler), `/opt/dogfood/{lib/native/{deep-link,pkce,platform}.ts,hooks/useDeepLinkAuth.ts,tests/{hooks,lib/native,integration}/}`, `/opt/halinova/spec/dogfood/native-android/{spec,decisions,status,tasks}.md` (NFR-5, NFR-7, FE-15..FE-19 fold-back arc)
- `ssh johnthomson@10.0.110.27:/tmp/apk-fp/release.apk` (extracted v0.1.1 F-Droid APK + apksigner verify diagnostic: SHA-1 `6400c7fe9c6137048b89a1760908980630aaded3` confirmed against new release client)
- Hub doc registered: `adf09ef7-5207-4c3d-8ac6-f43df0fb9f2f` (spec.md)

**Cross-project references:**
- **halinova** — spec set at `/opt/halinova/spec/luby/authentik-pkce-mobile/` advanced via 3 commits on `feat/luby-authentik-pkce-shape` branch (worktree `/opt/halinova-wt/c6884ef1`): `5e72d36` shape + `4bfc909` spec + `ef23b84` tasks. All pushed to origin; awaiting FF-merge to halinova/main whenever convenient. Worktree retained (default; pass `--close` to /park at end of cycle). Mid-session worktree salvage: prior orphan `/opt/halinova-wt/99a04502` (from S4 retained worktree) was reaped from canonical's worktree registry during the 2-day session gap with files still on disk; spawned fresh `c6884ef1` and moved files in via `git -C /opt/halinova worktree add` + `mv`. See `/opt/halinova/product/session-notes.md` for any halinova-side park entry on this.
- **dogfood** — used as canonical reference throughout: PKCE library (`lib/native/{deep-link,pkce,platform}.ts`), hook composition (`hooks/useDeepLinkAuth.ts`), custom-scheme callback shape, server-side confidential-client + PKCE token-exchange (`api/src/routes/auth.ts:L165`), D-SINGLE-AUTHENTIK-CLIENT precedent, FE-15..FE-19 fold-back hardening, NFR-5 + NFR-7 acceptance pattern. **Finding worth dogfood's side**: web `/auth/callback` GET at `/opt/luby/api/src/routes/auth.ts:L84` uses `upsertUser()` while `/auth/google-signin` POST at L144-159 uses `lookupUserByEmail()` + manual SQL — divergent user-creation patterns in the same file with no documented reason. Captured in luby tasks.md BE-2 as "do NOT follow google-signin handler's pattern" warning. If dogfood has a similar dual-pattern surface in its own routes, worth a sweep next dogfood session.

**Uncommitted:** Clean across both luby/main and halinova worktree at session-note write time (session-note commit + push lands as the final step of /park).

**Commits in this session:**

luby/main (2 commits, all pushed to origin/main):
- `0488690` docs(decisions/roadmap): DD-17 GrapheneOS Sign-In blocker + M&W row for Authentik PKCE follow-on
- `c09acf7` docs(decisions/roadmap): reconcile DD-17 to single-Authentik path + promote PKCE wave to P0

halinova/feat/luby-authentik-pkce-shape (3 commits, all pushed to origin):
- `5e72d36` shape(luby/authentik-pkce-mobile): replace mobile Google Sign-In with Authentik OIDC PKCE
- `4bfc909` spec(luby/authentik-pkce-mobile): full spec.md + status — 25 FRs, 9 NFRs, 6 US, 12 ACs
- `ef23b84` tasks(luby/authentik-pkce-mobile): 29-task breakdown across 6 waves

**Simplify gate (Step 2.5):** All 4 session-window commits are doc-only — `product/decisions.md`, `product/roadmap.md`, and `spec/luby/authentik-pkce-mobile/*.md` paths all match the `product/**`, `spec/**`, and `**/*.md` allowlists. Silent skip; no TD-PARK-SIMPLIFY row added. Cross-tree lens on canonical halinova (`6014475`) is another session's work (duilleag rigging-failure investigation) — out of luby session scope.

**Next steps:**
1. **`/implement luby/authentik-pkce-mobile` Wave 1** — 7 parallel tasks (IN-1 Authentik admin + BE-1 helper extract + FE-1 vitest setup + FE-2/FE-3/FE-4 library port + AN-1 manifest). All S complexity; only external dependency is Authentik admin access for IN-1. Natural starting point; could land as a single bundled commit. Real-time risk gate: IN-1's web sign-in smoke-test (OQ-1).
2. **FF-merge halinova `feat/luby-authentik-pkce-shape` → main** when convenient. Branch is 3 commits ahead of main; concurrent halinova session `01KSPCQ1` is on canonical writing `spec/halinova/external-call-resilience/` so no conflict on `spec/luby/`. Can FF without coordination.
3. **Physical USB delivery (KS-4 tail, carry-forward from S4)** — pull `halinova:~/keystore-backups/luby-release-2026-05-26.gpg` → Windows laptop → USB → mum's offsite per dogfood AC-7 precedent. Still pending; not blocking PKCE wave but should land before any next F-Droid catastrophic-loss scenario.
4. **Worktree close** — `/opt/halinova-wt/c6884ef1` retained per default; pass `--close` to /park at end of cycle (per worktree-day walkthrough) OR let GC sweeper reap.
5. **DD-1/13/14/17 final close** happens at spec-ship time (post-`/implement` + post-RE-5 v0.2.0 tag).

**Watch for:**
- **OQ-1 (Authentik "Code Challenge Required" toggle semantics)** — IN-1's smoke-test of web sign-in at `myluby.net` after the admin change is the real-time risk gate. If web breaks (because the toggle is enforced globally on the client rather than per-redirect-URI), branch into IN-1a adding PKCE to web `/auth/login` route too. Per dogfood's `authentik-rotation.md` the toggle is unlikely to break web, but verify.
- **FE-5 adapter rewrite complexity** — tagged L (Large) in tasks.md; expect ~4-8 hours. If escalates further, split into FE-5a (interface rewrites) + FE-5b (success branch + Preferences) per Risks table.
- **Cross-server file transfer pattern** — FE-2/FE-3/FE-4 + TE-1..TE-4 source files live on dogfood VM (10.0.100.2), not luby VM. Tasks.md "Notes for the implementer" has scp recipes (two-hop via halinova OR scp-to-/tmp-then-scp-onward).
- **Concurrent halinova canonical session 01KSPCQ1** — actively writing `/opt/halinova/spec/halinova/external-call-resilience/` per latest canonical commit `6014475`. Different spec dir; no FF-merge conflict expected for luby spec branch.
- **F-Droid v0.2.0 first-install on 48k's Pixel** — the AC-9 acceptance gate. Per dogfood FE-15..FE-19 lived experience, expect 1-3 fix-and-retag cycles on first fire. Don't be surprised; capture broken-tag trail per dogfood precedent.

---



### 2026-05-26 — P0 F-Droid Distribution Wave 4 + Wave 5 closed end-to-end; v1 SHIPPED on real device

**Active task:** N/A — session closed cleanly at `/park`. All 22 tasks landed. Outstanding tail (physical USB delivery of offsite GPG blob) is deferred but does not gate anything.

**Pending user asks:** None.

**In progress:** Nothing. Spec v1 SHIPPED — Luby installable + updatable via household F-Droid at `https://fdroid.myluby.net/repo`, verified end-to-end on 48k's Pixel (install + in-place update + session preservation).

**Blocked:** Nothing technical. Physical USB delivery of `halinova:~/keystore-backups/luby-release-2026-05-26.gpg` deferred but pending (catastrophic-loss survivability for APK keystore; blob ready, awaits USB copy + offsite drop).

**Decisions:**
- **D-RE1-DROP-ZONE-ONLY** — RE-1 test-fire used a `feat/release-test` branch with the workflow edited to scp into `/srv/fdroid-luby/repo-staging/` and skip the `fdroid update` + NFR-3 verify steps. Acceptance terminates at scp per spec. First fdroid update on prod fired at RE-2. Smallest deviation from prod workflow; least gateway-side persistent infra.
- **D-CADDY-NO-CACHE-FDROID-META** — Caddy vhost on infra-gateway now sets `Cache-Control: no-cache, no-store, must-revalidate` for `/repo/index*`, `/repo/entry.*`, `/repo/diff/*`. APKs keep default 4h cache (immutable content-hashed). Resolves CF edge-cache staleness that surfaced during RE-4; future fires self-invalidate at the edge.
- **D-RE4-TRIVIAL-COMMIT-AS-CHANGELOG** — RE-4 needed a trivial commit to bump versionCode; chose to seed root `CHANGELOG.md` rather than touch existing `README.md` (latter is the generic northernlights template, not Luby-specific — surfaced as Maintenance & Watch row).
- **D-PUSH-LANDING** — luby/main 4 closure commits pushed direct to origin/main. Halinova feat/lubby1 rebased onto current origin/main and FF-merged into main + branch deleted on origin. Worktree retained for any spec follow-on; not closed.
- `/simplify deferred — reason: skill not installed on this satellite` (same situation as TD-PARK-SIMPLIFY-1 from S3). Already captured as TD-PARK-SIMPLIFY-2 in spec/luby/fdroid-distribution/tech-debt.md, naming the one unreviewed code-touching commit (luby `5d3d992` CL-1 route removal, 15-line deletion of a deprecated dev-distribution handler).

**Relevant files:**
- `ssh johnthomson@10.0.110.27:/opt/luby/api/src/index.ts` (CL-1: removed `/download/app.apk` handler, 15 lines deleted)
- `ssh johnthomson@10.0.110.27:/opt/luby/product/roadmap.md` (CL-2: P0 closed + Mobile App row + Maintenance & Watch row for README template finding)
- `ssh johnthomson@10.0.110.27:/opt/luby/product/decisions.md` (CL-3: DD-12 Status: Closed)
- `ssh johnthomson@10.0.110.27:/opt/luby/CHANGELOG.md` (NEW, seeded with v0.1.0 + v0.1.1 entries for RE-4 trivial-commit)
- `ssh johnthomson@10.0.100.4:/home/johnthomson/infra-gateway/Caddyfile` (Cache-Control no-cache override for Luby F-Droid index/entry/diff paths; backup `.pre-cachefix-2026-05-26` retained)
- `ssh johnthomson@10.0.100.4:/srv/fdroid-luby/repo/{index-v2.json,entry.jar,index-v1.jar,net.myluby.app_39.apk,net.myluby.app_40.apk,...}` (live F-Droid repo state — both APKs in catalogue, index lists both versions)
- `ssh johnthomson@10.0.100.4:/srv/fdroid-luby/repo-staging/` (RE-1 staging dir; empty post-cleanup, retained for future test fires)
- `/opt/halinova-wt/99a04502/spec/luby/fdroid-distribution/{status.md,tech-debt.md}` (Wave 4 + Wave 5 entries + 2 new TD rows: TD-CF-CACHE-INVALIDATION-AFTER-FDROID-UPDATE [closed], TD-PARK-SIMPLIFY-2 [open])
- `~/.claude/projects/-opt-luby/memory/patterns-fdroid-distribution.md` (added F-Droid + CF cache + no-basicauth pattern)

**Cross-project references:**
- **halinova** — Wave 4 + Wave 5 status + 2 new TD rows landed on spec at `/opt/halinova/spec/luby/fdroid-distribution/`. Branch `feat/lubby1` rebased onto current origin/main (was 22+ commits behind from concurrent S150-S152 activity) then FF-merged into main as `180b4d3`; branch deleted on origin. Worktree `/opt/halinova-wt/99a04502` retained for any spec follow-on. See `/opt/halinova/product/session-notes.md` for HALINOVA's own log.
- **infra-gateway (10.0.100.4)** — Caddyfile patched with Cache-Control override for Luby F-Droid index/entry/diff paths (verified live: `index-v2.json` now returns `no-cache, no-store, must-revalidate`; APK paths still `max-age=14400`). Backup `Caddyfile.pre-cachefix-2026-05-26` retained. `docker-compose restart caddy` required (reload-via-exec doesn't inherit env_file vars; captured behaviour for future Caddy ops). Also created `/srv/fdroid-luby/repo-staging/` dir for RE-1 (empty post-cleanup, retained).
- **dogfood** — used as reference for fdroidserver workflow + Caddy vhost pattern throughout; surfaced one cross-product latent finding worth banking: dogfood's `fdroid.dogfood.band` vhost has the same `browse off` directive that's silently broken under Caddy v2 — currently masked by basicauth. Captured as TD-DOGFOOD-CADDY-BROWSE-OFF-LATENT in luby spec's tech-debt.md (from prior S3); revisit when dogfood Caddyfile is next touched.

**Uncommitted:** Clean across both luby and halinova worktree at session-note write time (session-note commit + push lands as the final step of /park).

**Commits in this session:**

luby/main (5 commits, all pushed to origin/main):
- `774b319` docs: seed CHANGELOG with v0.1.0 + v0.1.1 entries
- `5d3d992` chore(api): remove /download/app.apk dev distribution route
- `e52b981` docs(roadmap): close P0 F-Droid Distribution
- `4043736` docs(decisions): close DD-12 — APK served from API
- `90a85ba` docs(roadmap): add Maintenance & Watch row for stale README template

luby tags (live, on origin):
- `v0.1.0` → ec07d7b (RE-2 production fire; CI 1063, 4min 10s)
- `v0.1.1` → 774b319 (RE-4 update flow; CI 1066, 4min 9s)

luby tags (created + deleted during session):
- `v0.0.0-test` → 48fd8a8 on `feat/release-test` (RE-1 test fire; CI 1062, 3min 52s) — tag + branch + staging APK all cleaned up post-success

halinova/main (1 commit, FF'd + pushed):
- `180b4d3` implement(luby/fdroid-distribution): Wave 4 + Wave 5 close — v1 SHIPPED (rebased from feat/lubby1 onto current origin/main; was 2c6c77b pre-rebase)

halinova feat/lubby1: deleted on origin; local-only on canonical because worktree holds the ref (harmless).

**Simplify gate (Step 2.5):** `/simplify` skill not installed on this satellite (same as S3). Falls back to `--no-simplify` semantics per gate failure-mode. Unreviewed code-touching commits: luby `5d3d992` (api/src/index.ts, 15-line deletion of `/download/app.apk` handler). Captured in TD-PARK-SIMPLIFY-2 (written THIS session as part of `180b4d3`) with named pickup trigger.

**Next steps:**
1. **Physical USB delivery (KS-4 tail)** — pull `halinova:~/keystore-backups/luby-release-2026-05-26.gpg` to Windows laptop → copy to USB → deliver offsite (mum's house per dogfood AC-7 precedent). One short session to land catastrophic-loss survivability for the APK keystore.
2. **Maintenance & Watch sweep** (Luby roadmap) — batch any/all of: Vault-vs-`.env` source-of-truth audit, `@capacitor/cli` 7→8 bump, CORS catalogue (DD-16 watch-for), README rewrite (replace generic northernlights template with Luby-specific intro + pointer to product/ doc set). All small, no external dependencies, parallel-batchable.
3. **P5 chart expansion** — extend the existing recharts `BarChart` at `App.tsx:536` to cover hydration / movement / fasting trends. Purely additive, no new infrastructure.
4. **P1 credential acquisition** (Apple Developer + Google Play Console + Firebase Cloud Messaging) — external action 48k needs to start to unblock the rest of P1 (iOS + Play Store path).
5. **Worktree close** (halinova-side) — `/opt/halinova-wt/99a04502` can be reaped via `/worktree --close` or natural cycle. v1 is shipped; no pending spec work expected on this branch.

**Watch for:**
- **Future F-Droid spec adoption (Spark / Cosmogenic / etc.)** — propagate the Caddy Cache-Control override at vhost authoring time, BEFORE first publication. Without it, every household F-Droid repo without basicauth would silently inherit the 4h CF Browser Cache TTL stall. Captured in patterns-fdroid-distribution.md.
- **Dogfood Caddy `browse off` latent bug** (TD-DOGFOOD-CADDY-BROWSE-OFF-LATENT) — fix in the same commit if dogfood ever drops basicauth, OR opportunistically when dogfood Caddyfile is next touched. One-line surgical fix.
- **TD-METADATA-GATEWAY-DRIFT** — if any metadata text edits land before option B (CI workflow extension) lands, remember to manually scp + ssh fdroid update on the gateway. CI workflow only scps APK.
- **F-Droid client caching at the device side** — even with `no-cache` from origin, the F-Droid client app may have its own short-TTL local cache. Today the manual purge + force-refresh path was needed. If future updates surface delays of 1-2 minutes despite the Caddy fix, that's the device-side cache, not the edge.

---


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
