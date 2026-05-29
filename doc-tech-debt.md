# Doc Tech Debt

Tracks docs that became stale during /implement but were deferred (vs updated now).
Each row: when noticed, which wave, which doc, why deferred, when resolved.

| Date | Wave | Doc | Reason | Resolved |
|------|------|-----|--------|----------|
| 2026-05-29 | Wave 2 (luby/authentik-pkce-mobile) | `product/architecture.md` | New endpoint `POST /api/v1/auth/mobile-callback` not listed in API route table; dual-auth section still showed Google. Spec owned the update in Wave 5 DO-2 (per FR-15). Batched with FE-6 UI flip + BE-3 Google removal so the doc churn lands as one coherent update. | 2026-05-29 Wave 5 DO-2 (luby commit pending in Wave 5 bundle) |
| 2026-05-29 | Wave 2 (luby/authentik-pkce-mobile) | `product/standards.md` | Auth Standards section still named Google Sign-In as the mobile path. Spec owned the update in Wave 5 DO-3 (per FR-16). | 2026-05-29 Wave 5 DO-3 (luby commit pending in Wave 5 bundle) |
| 2026-05-29 | Wave 2 (luby/authentik-pkce-mobile) | `product/data-flow.md` | End-to-end mobile auth flow not yet describing PKCE path. Spec gap — DO tasks in Wave 5 covered architecture/standards/decisions but NOT data-flow.md explicitly. | OPEN — still a gap. Pick up at next Luby session; rewrite the mobile sign-in flow to describe browser hop + custom-scheme callback + token exchange instead of the old Google ID token path. Low priority; flow doc is reference-only. |
