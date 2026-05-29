# Doc Tech Debt

Tracks docs that became stale during /implement but were deferred (vs updated now).
Each row: when noticed, which wave, which doc, why deferred.

| Date | Wave | Doc | Reason |
|------|------|-----|--------|
| 2026-05-29 | Wave 2 (luby/authentik-pkce-mobile) | `product/architecture.md` | New endpoint `POST /api/v1/auth/mobile-callback` not listed in API route table; dual-auth section still shows Google. Spec owns the update in Wave 5 DO-2 (per FR-15). Batched with FE-6 UI flip + BE-3 Google removal so the doc churn lands as one coherent update. |
| 2026-05-29 | Wave 2 (luby/authentik-pkce-mobile) | `product/standards.md` | Auth Standards section still names Google Sign-In as the mobile path. Spec owns the update in Wave 5 DO-3 (per FR-16). Same batching rationale as architecture.md. |
| 2026-05-29 | Wave 2 (luby/authentik-pkce-mobile) | `product/data-flow.md` | End-to-end mobile auth flow not yet describing PKCE path. Spec gap — DO tasks in Wave 5 cover architecture/standards/decisions but NOT data-flow.md explicitly. Pick up alongside DO-2 OR open a new DO-4 task at next session. |
