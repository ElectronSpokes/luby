# Experiment 002: CI/CD Pipeline

## Purpose
Test Forgejo CI/CD workflows and pipeline configurations for automated builds, tests, and deployments.

## Setup

### 1. Install act_runner
```bash
mkdir -p ~/bin
curl -L -o ~/bin/act_runner "https://gitea.com/gitea/act_runner/releases/download/v0.2.13/act_runner-0.2.13-linux-amd64"
chmod +x ~/bin/act_runner
```

### 2. Register runner
Get a registration token from Forgejo:
- Repo level: `{repo}/settings/actions/runners`
- User level: `/user/settings/actions/runners`

```bash
~/bin/act_runner register \
  --instance http://git.theflux.life:3000 \
  --token YOUR_TOKEN \
  --name "dev-runner" \
  --labels "docker,ubuntu-latest,linux" \
  --no-interactive
```

### 3. Set up systemd service (recommended)

Create user service file at `~/.config/systemd/user/act_runner.service`:
```ini
[Unit]
Description=Forgejo Actions Runner
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/john/projects/northernlights
ExecStart=/home/john/bin/act_runner daemon --config .runner.yaml
Restart=on-failure
RestartSec=10
Environment=HOME=/home/john
Environment=PATH=/home/john/.nvm/versions/node/v20.19.6/bin:/home/john/bin:/home/john/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

[Install]
WantedBy=default.target
```

**Important**: The PATH must include Node.js location - `actions/checkout@v4` requires it.

Enable and start:
```bash
systemctl --user daemon-reload
systemctl --user enable act_runner.service
systemctl --user start act_runner.service
```

Enable lingering (run without login):
```bash
loginctl enable-linger $USER
```

### Alternative: Manual start
```bash
# Run from directory containing .runner file
nohup ~/bin/act_runner daemon > ~/act_runner.log 2>&1 &
```

## Stack
- Forgejo Actions (GitHub Actions compatible)
- act_runner v0.2.13
- YAML workflow definitions

## Workflows Tested

| Workflow | File | Purpose |
|----------|------|---------|
| CI | `.forgejo/workflows/ci.yaml` | Validates project structure, experiment READMEs |
| CLAUDE.md Check | `.forgejo/workflows/claude-md-check.yaml` | Validates CLAUDE.md sections on changes to `.claude/` |
| PR Check | `.forgejo/workflows/pr-check.yaml` | PR-specific validations (title, description, changed files) |

## Learnings

1. **Runner labels matter** - Workflows specify `runs-on: docker`, runner must have matching label
2. **Registration creates `.runner` file** - Daemon must run from directory containing this file
3. **Host mode** - Labels like `docker:host` run directly on host, not in containers
4. **Jobs queue until runner available** - No runner = jobs stay "pending"
5. **User systemd services** - Use `~/.config/systemd/user/` for services without root access
6. **Lingering** - Enable with `loginctl enable-linger` for services to run without active login
7. **Systemd PATH is minimal** - Must explicitly set PATH including Node.js for GitHub Actions
8. **Config file labels override** - If using `.runner.yaml`, set `labels: []` to use registered labels from `.runner`
9. **Docker not required for host mode** - Set empty labels in config to avoid Docker socket errors

## Branch Protection

Main branch requires these checks to pass before merge:
- `CI / validate-structure (pull_request)`
- `CI / check-claude-config (pull_request)`
- `PR Check / pr-validation (pull_request)`
- `PR Check / diff-check (pull_request)`

## Status
✅ Complete

## Notes
- PR check workflow validated on 2026-01-11
- Branch protection enabled on 2026-01-11
