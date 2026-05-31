# Luby

Personal wellness tracking — food, hydration, movement, fasting timers, and AI coaching.
Live at [myluby.net](https://myluby.net); installable on Android via the household F-Droid repo (`fdroid.myluby.net`).

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite + Tailwind v4 |
| Mobile | Capacitor 8 (Android + iOS scaffolds) |
| API | Hono + Bun (`api/`, port 3001) |
| Database | PostgreSQL 16 |
| AI | Google Gemini 2.5 Flash (7 proxy endpoints) |
| Auth | Authentik OIDC — web (session cookie) + Android (OIDC PKCE custom-scheme) |
| Hosting | Cloudflare Pages (web) + Cloudflare Tunnel (API) |

## Structure

```
api/            Hono + Bun API (routes, services, migrations)
src/            React SPA (components, hooks, lib)
android/ ios/   Capacitor native shells
product/        Product docs (architecture, decisions, roadmap, system-diagram, …)
metadata/       F-Droid listing metadata
```

## Development

```bash
npm install
npm run dev                       # Vite dev server on :3000
cd api && bun run src/index.ts    # API on :3001 (reads api/.env)
npm test                          # vitest
```

Production APKs build via Forgejo Actions on `v*` tags and publish to the household F-Droid repo. The web frontend auto-deploys to Cloudflare Pages on push to `main` (via the GitHub mirror).

## Docs

Architecture, design decisions (DD-N), roadmap, and the system-wiring diagram live in [`product/`](./product/). Start with [`product/architecture.md`](./product/architecture.md) and [`product/system-diagram.md`](./product/system-diagram.md).
