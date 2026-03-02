# Common Mistakes to Avoid

Learnings from past sessions - avoid repeating these errors.

## API & Data Format

- [2026-01-30] Docker container code not updating on restart - Hub uses built images not bind mounts; changes require `docker compose build hub-api` then `docker compose up -d`
- [2026-01-30] Shell heredocs corrupt TypeScript files - escaping `!`, quotes, template literals corrupts syntax; write file locally then `scp` to remote
- [2026-01-30] PostgreSQL recursive CTE type mismatch - `varchar(100)[]` vs `varchar[]` fails; cast explicitly: `name::TEXT` in both branches
- [2026-01-29] Hub edge API uses `from_node`/`to_node` not `from`/`to` - POST to /api/ecosystem/edges requires correct field names
- [2026-01-29] Hub status enum doesn't include "unhealthy" - valid values: `healthy | degraded | critical | unknown`
- [2026-01-29] Hub API uses X-Hub-Key header, not X-API-Key
- [2026-01-29] Hub API returns data in unexpected formats - `services` as JSON string, `metadata` as array; add defensive parsing
- [2026-01-29] Presigned URLs don't work across network boundaries - MinIO signatures tied to hostname; use content proxy instead
- [2026-01-28] API response format assumption - always `curl endpoint | jq .` before building frontend
- [2026-01-28] Zod schemas reject null for optional fields - omit field entirely instead of sending null
- [2026-01-22] FastAPI response wrappers nest data - verify exact structure with curl first
- [2026-01-20] API response unwrapping errors: `response.data.data` vs `response.data.data.intent`

## TypeScript / React

- [2026-01-28] Optional chaining with comparison - `array?.length > 0` returns `undefined > 0`; use `array && array.length > 0`
- [2026-01-29] vis-network font.bold expects string not boolean - use `font: { bold: isHub ? 'true' : undefined }`
- [2026-01-20] TypeScript `unknown` type can't be used in JSX - use `typeof x === 'string'` guard
- [2026-01-20] React Portal to `document.body` fails with flex - use dedicated `#modal-root` element
- [2026-01-20] Vite boilerplate `App.css` has conflicting styles - clear it for dashboard apps

## Tailwind CSS v4

- [2026-01-28] Different import syntax - use `@import "tailwindcss"` not `@tailwind base/components/utilities`
- [2026-01-28] Requires `@tailwindcss/vite` plugin - don't use postcss.config.js approach
- [2026-01-28] Creating postcss.config.js causes build failure - just use @tailwindcss/vite

## Proxmox / VM Provisioning

- [2026-01-26] VM clone must configure BEFORE first boot - clone without start, set VLAN, configure cloud-init, regenerate image, then start
- [2026-01-26] Cloud-init changes require image regeneration - `PUT /nodes/{node}/qemu/{vmid}/cloudinit` before starting
- [2026-01-26] Over-configuring cloud-init breaks networking - only change what's different (ipconfig0, net0)
- [2026-01-26] Building VMs from scratch vs templates - templates have tested cloud-init, network, SSH
- [2026-01-26] guest-exec API only accepts single executables - `/usr/bin/hostname` works, `/usr/bin/hostname -f` fails
- [2026-01-26] Disabling cloud-init network config breaks SSH key injection - modules interconnected

## Docker / Containers

- [2026-01-26] Vault agent in Docker with named volumes fails - use bind mounts instead
- [2026-01-26] Ubuntu docker.io doesn't include docker-compose-plugin - install binary separately
- [2026-01-26] Vault agent can't read files with 600 permissions - make world-readable (644)
- [2026-01-28] Satellite VM with 512MB RAM crashes Claude Code - minimum 2GB required

## Vault / Secrets

- [2026-01-22] Vault docker-entrypoint.sh auto-adds flags - use `entrypoint: vault` to bypass
- [2026-01-22] Shell escaping with `!` in curl JSON fails - write to file and use `curl -d @file.json`

## External APIs

- [2026-01-23] Authentik OAuth source not showing - must add to identification stage's `sources` array
- [2026-01-23] Authentik OAuth2 provider creation - `redirect_uris` must be array of objects
- [2026-01-23] Factory calling provider with wrong param name - check `__init__` signature
- [2026-01-23] Provider health check with self-signed cert - pass `verify_ssl=False`
- [2026-01-22] NetBox v2 token format: `Bearer nbt_<key>.<token>`
- [2026-01-20] StackStorm API uses HTTP Basic Auth for `/tokens`, not JSON body
- [2026-01-20] Emoji comparison fails due to variation selectors (U+FE0F) - strip before comparing

## Python / Backend

- [2026-01-22] Pydantic schema types must match DB column types exactly
- [2026-01-20] `datetime.utcnow()` is offset-naive - use `datetime.now(timezone.utc)`
- [2026-01-19] pysnmp `SnmpEngine()` leaks sockets - reuse or close dispatcher
- [2026-01-27] Referencing non-existent model attributes - read model definition first
- [2026-01-27] Distillation converter format mismatch - handle `{"items": [...], "count": N}` wrapper
- [2026-01-27] Trace serialization via `repr()` - empty list becomes string `"[]"`

## Matrix / Communications

- [2026-01-19] Matrix rooms with default preset aren't joinable - use `preset: public_chat`
- [2026-01-20] Matrix bot `deny_intent()` called wrong endpoint - deny has separate `/deny` endpoint
- [2026-01-20] Matrix bot notification room uses "first joined room" - need explicit config

## MCP / Claude Code

- [2026-01-28] Manual .mcp.json files don't work - use `claude mcp add-json --scope user`
- [2026-01-23] qdrant-client 1.7+ deprecated `search()` - use `query_points(query=embedding)`
- [2026-01-23] MinIO credentials mismatch - verify with `docker exec <container> env | grep MINIO`

## Cloudflare

- [2026-01-23] Created tunnel before checking existing - check config file first
- [2026-01-23] `config_src: local` tunnels can't be updated via API - edit host config
