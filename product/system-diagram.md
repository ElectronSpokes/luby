# Luby — System Diagram

*Maintained by: Scotty · Last updated: 2026-05-31 (post-Authentik-PKCE)*

Visual companion to `architecture.md`. The PNG is the rendered artifact; the Mermaid block below is the editable source of truth — keep them consistent when the wiring changes.

![Luby system wiring](./system-diagram.png)

## The three flows

1. **Runtime (blue):** Luby app → `api.myluby.net` → CF Tunnel `5bc61fcb` → Hono API (`10.0.110.27:3001`) → PostgreSQL for data; `→ Gemini 2.5 Flash` for the 7 `/ai/*` routes. Secrets from Vault `secret/data/luby/api` (env-primary in practice).
2. **Auth (green):** app opens system browser → `auth.theflux.life` (Authentik) → `net.myluby.app://callback` deep-link → `POST /auth/mobile-callback {code, code_verifier}` → API exchanges code + JWKS-verifies id_token → 30-day Luby HS256 JWT in Capacitor Preferences. Works on GrapheneOS, no Google Play Services.
3. **CI/CD (orange):** `tag v*` → Forgejo Actions (`android-build-box`) → build signed APK → scp to infra-gateway (`10.0.100.4`) → `ssh fdroid update` → phone pulls from `fdroid.myluby.net/repo`. Separately, `push main` → GitHub mirror → CF Pages rebuilds `myluby.net`.

## LLM boundary

Luby's AI is **cloud Gemini 2.5 Flash** — it is the only household product wired to cloud AI. The on-prem GPU fleet (**Bones** `10.0.110.23`, **Arnie** `10.0.110.24`; Ollama/vLLM/ComfyUI) powers other HALINOVA products but is **not** used by Luby. Sovereign-AI swap = repoint the `/ai/*` proxy target from Gemini to a Bones/Arnie endpoint.

## Mermaid source

```mermaid
flowchart TB
  subgraph DEV["USER DEVICES"]
    APP["📱 GrapheneOS Pixel<br/>Luby app · net.myluby.app<br/>Capacitor 8 + React 19 · offline SQLite"]
    WEB["🖥 Web browser<br/>myluby.net · React 19 SPA"]
  end

  subgraph CF["CLOUDFLARE EDGE · DNS · Pages · Tunnels"]
    FD["fdroid.myluby.net"]
    API_DNS["api.myluby.net<br/>Tunnel 5bc61fcb"]
    AUTH_DNS["auth.theflux.life"]
    PAGES["myluby.net → CF Pages"]
  end

  subgraph ONPREM["ON-PREM · theflux.life · 10.0.0.0/8"]
    GW["infra-gateway 10.0.100.4<br/>Caddy · /srv/fdroid-luby/repo"]
    subgraph VM["LUBY VM · 10.0.110.27"]
      HAPI["Hono API (Bun) :3001<br/>10 route groups · auth middleware<br/>7 AI proxy routes"]
      PG["PostgreSQL 16 :5432"]
      VAULT["Vault 10.0.25.2<br/>secret/data/luby/api"]
      BUILD["Android build stack<br/>JDK21 · SDK · gradlew"]
    end
    AUTHENTIK["Authentik<br/>OIDC + PKCE provider"]
    FORGEJO["Forgejo git.theflux.life:3000<br/>halinova/luby + Actions runner"]
  end

  subgraph EXT["EXTERNAL / SEPARATE"]
    GEMINI["Google Gemini 2.5 Flash<br/>Luby's LLM — 7 /ai/* routes"]
    GHUB["GitHub mirror<br/>ElectronSpokes/luby"]
    GPU["ON-PREM GPU FLEET<br/>Bones / Arnie · NOT used by Luby"]
  end

  %% runtime
  APP -->|runtime| API_DNS --> HAPI
  WEB --> PAGES
  WEB -.->|api| API_DNS
  HAPI --> PG
  HAPI -->|AI| GEMINI
  HAPI --> VAULT
  %% auth
  APP -->|auth| AUTH_DNS --> AUTHENTIK
  AUTHENTIK -->|JWKS verify| HAPI
  %% ci/cd
  FORGEJO -->|tag v* build APK| GW
  GW --> FD -->|install/update| APP
  FORGEJO -->|push main| GHUB --> PAGES
  BUILD -.-> FORGEJO
```
