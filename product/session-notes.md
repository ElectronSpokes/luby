# Luby — Session Notes
*Maintained by: /park command*

<!-- /park appends new entries at the top of the log below. /springboard reads the latest entry. -->

## Log

<!-- newest first -->

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
