# Patterns That Work

Proven approaches to follow in HALINOVA development.

## API Development

- **Test endpoints with curl before frontend**: `curl endpoint | jq .` saves time vs assuming response structure
- **Phased implementation**: for multi-layer features (Hub -> NOVA -> Frontend), test each layer before proceeding
- **TypeScript types first**: update types/*.ts before components for autocomplete and compile-time checks
- **Defensive API parsing**: use isinstance() checks, json.loads() fallback for string fields from Hub
- **Content proxy for internal storage**: add API endpoint that fetches from MinIO and streams to client

## Data Architecture

- **Tree-building on server side**: build hierarchical trees in API layer, return nested structure to frontend
- **PostgreSQL depth validation**: use recursive CTE in trigger function for hierarchy constraints
- **Explicit SQL column selection**: postgres.js may not serialize computed columns with `SELECT *`
- **Hub POST upsert for updates**: use POST with full data instead of PATCH; ON CONFLICT handles existing

## Frontend Patterns

- **Screenshot debugging for CSS**: immediately reveals if CSS isn't loading vs layout issues
- **Verify CSS compilation**: `npm run build`, check CSS file size (Tailwind should be 30-50+ kB)
- **Vite fixed port config**: `port: 5173`, `strictPort: true`, `host: true` in vite.config.ts
- **Tailwind v4 + Vite**: install `@tailwindcss/vite`, add to plugins, use `@import "tailwindcss"`
- **Cross-origin CORS**: add `CORSMiddleware` with `allow_origins=["*"]` when dashboard fetches from different host
- **React modals**: add `<div id="modal-root">` in index.html, use createPortal
- **Null safety**: `(value || 'default').method()` for optional fields

## Infrastructure Operations

- **Pre-task trace check**: ALWAYS `hub_trace_context` before VM create/delete or multi-provider workflows
- **Proxmox VM deletion**: 1) stop_vm, 2) wait 5-10s, 3) configure_vm(protection=0), 4) destroy_vm
- **Proxmox async awareness**: clone/stop/start return UPID immediately - use wait_for_task or sleep
- **VM provisioning sequence**: clone (don't start) -> VLAN tag -> ipconfig0 ONLY -> regenerate cloud-init -> start
- **Clone from templates, not scratch builds**: templates have tested cloud-init, network, SSH
- **Proxmox CPU mode "host"**: for best performance and compatibility

## Vault / Secrets

- **Vault agent Docker setup**: bind mounts, `user: "root"`, `apparmor:unconfined`, chmod 777 secrets dir
- **Vault unseal requires 3 of 5 keys**: store in separate secure locations
- **Vault-first credential loading**: fetch from Vault at startup, fall back to env vars
- **Multi-product Vault**: path-based separation (`secret/halinova/*`, `secret/fawb/*`)
- **PATCH to add fields**: `curl -X PATCH -d '{"data": {"new_field": "value"}}'` preserves other fields

## Provider Integration

- **ProviderFactory pattern**: centralizes Vault credential fetching, caches instances
- **Cached singleton**: reuse factory for 5 minutes to prevent API session exhaustion
- **New provider pattern**: `models.py` -> `client.py` -> `__init__.py` -> integrate with vault/factory
- **safe_call() wrapper**: catches errors gracefully for partial test completion
- **Group API methods**: section comments (`# DNS Operations`) improve navigation

## Tracing & Learnings

- **Learning-trace linkage**: use `hub_learning_from_trace` to connect wisdom to evidence
- **Automatic execution tracing**: integrate at ExecutionEngine level, enable via NOVA_TRACING_ENABLED=true
- **ProviderFactory tracing**: wrap providers with TraceMiddleware using `_wrap_provider()` helper
- **Test with synchronous providers**: Proxmox, NetBox show actual ops; HALI is async (0 ops captured)
- **Gold traces for distillation**: copy from `execution-traces/traces/` to `gold-traces/gold/`
- **hub_suggest_learnings**: analyze trace patterns, surface data-driven insights at compound time
- **Mode classification**: `building` (code) vs `operating` (infrastructure) for learnings

## Sync & Data Flow

- **NetBox VM sync pattern**: fetch VMs, map to ecosystem node, POST upsert to Hub, create edges
- **Test sync immediately**: `curl -X POST endpoint | jq .` and check logs for validation errors
- **OPNsense ARP + DHCP combined**: ARP has MAC/manufacturer, DHCP has hostnames; merge for best data
- **Check existing records**: `if ip in existing_ips: skip` to avoid duplicates

## Testing

- **Run frontend tests via Docker**: `docker run --rm -v /path:/app -w /app node:20-alpine npm run test:run`
- **Integration tests in Docker**: `docker run --rm --network host -v /path:/app python:3.12-slim ...`
- **Test from within container**: Docker internal hostnames differ from external access
- **E2E with real simulation**: stop SNMP container to trigger device_down flow

## Code Organization

- **Template method pattern**: base class `simulate()` handles common logic, subclasses implement handlers
- **Helper methods**: `_success_result()`, `_failure_result()` reduce boilerplate
- **Local imports**: import inside methods to avoid circular dependencies
- **Extract helpers at 3+ repeats**: keeps code DRY, centralizes logic
- **Guard against None**: `if name and "." not in name` not just `"." not in name`

## Deployment

- **scp for remote file transfers**: shell heredocs corrupt complex files; write locally then scp
- **rsync exclude .env**: `--delete` will remove env files the service depends on
- **Deploy to Intelligence VM**: avoids breaking local stack; use `scp` + `ssh systemctl restart`
- **Systemd for Python apps**: venv path in Environment, EnvironmentFile for secrets
- **Document infra changes immediately**: prevents startup failures after reboot

## Cloudflare

- **Caddy DNS-01 challenge**: `acme_dns cloudflare {$CF_TOKEN}` for internal domains
- **Add to existing cloudflared config**: when tunnel already runs on suitable host
- **Test tunnel via external DNS**: `curl --resolve "host:443:$(dig +short host @1.1.1.1 | head -1)"`
- **noTLSVerify for self-signed**: in originRequest for backend certs

## Matrix

- **Test via curl API calls**: no Matrix client needed; check bot logs for parsing
- **Use nio AsyncClient within container**: avoids URL/auth issues

## Ecosystem Graph

- **Query before infra tasks**: `/api/v1/ecosystem/impact?if_down={node}` for blast radius
- **Satellite self-registration**: read springboard.yaml, call Hub register_node(), handle unavailability gracefully
- **Edges required for visualization**: parent_id alone doesn't render; create explicit edge records
