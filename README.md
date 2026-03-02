# northernlights

Dev project for Claude Code project setup. This is a living code space for Claude projects best practices.

## Quick Start

```bash
# Clone
git clone http://git.theflux.life:3000/hudson/northernlights.git
cd northernlights

# Start Claude Code
claude
```

## Project Structure

```
northernlights/
├── .claude/              # Claude Code configuration
│   ├── CLAUDE.md         # Project knowledge (the source of truth)
│   ├── settings.json     # Permissions
│   ├── commands/         # Slash commands
│   ├── subagents/        # Specialized agents
│   ├── hooks/
│   └── rules/            # Shared learnings from fleet (NEW)
│       ├── common-mistakes.md
│       ├── patterns.md
│       ├── decisions.md
│       ├── hub-integration.md
│       └── satellite-provisioning.md
├── .forgejo/workflows/   # CI/CD
├── experiments/          # Individual experiments
└── README.md             # This file
```

## Development

This project uses Claude Code with the Boris workflow.

### Available Commands

| Command | Description |
|---------|-------------|
| `/new-experiment` | Create a new experiment directory |
| `/plan-feature` | Plan before implementing (use Plan mode) |
| `/code-review` | Review staged changes |
| `/commit-push-pr` | Ship changes |
| `/compound` | Capture learnings (auto-pushes to hub) |
| `/hub-search` | Search hub before implementing |
| `/new-munro` | Create a new satellite project |

### Workflow

1. **Plan** - Use `/plan-feature` or Plan mode (Shift+Tab twice)
2. **Implement** - Switch to auto-accept once plan is solid
3. **Review** - Use `/code-review` to check work
4. **Ship** - Use `/commit-push-pr` to commit and push

## Rules Files (Fleet Learnings)

The `.claude/rules/` directory contains shared learnings from across the Northernlights fleet:

| File | Purpose |
|------|---------|
| `common-mistakes.md` | API, Proxmox, Docker errors to avoid |
| `patterns.md` | Proven development approaches |
| `decisions.md` | Architecture decisions |
| `hub-integration.md` | Hub tools and workflows |
| `satellite-provisioning.md` | Deployment guide |
| `validate-config.sh` | Validation script |

These files are auto-loaded by Claude based on relevance. Update them via `/compound` to share learnings across all satellites.

### Syncing Rules to Satellites

```bash
# On satellite: pull latest rules
git remote add starter http://git.theflux.life:3000/hudson/northernlights.git
git fetch starter
git checkout starter/main -- .claude/rules/
```

### Validating Setup

```bash
bash .claude/rules/validate-config.sh
```

## Hub Integration

Connect to the **Northernlights Hub** for cross-project knowledge sharing:

```bash
claude mcp add-json northernlights-hub --scope user '{
  "command": "/home/johnthomson/.bun/bin/bun",
  "args": ["run", "/opt/northernlights-hub/mcp/src/index.ts"],
  "env": {
    "HUB_API_URL": "http://northernlights-hub.theflux.life:3100",
    "HUB_API_KEY": "<your-key>",
    "CURRENT_PROJECT_ID": "<project-id>"
  }
}'
```

Then use `/hub-search` before implementing, and `/compound` will auto-push universal learnings.

## Setting Up New Satellites

**Important:** Always run satellite setup from the hub VM, not from other satellites.

See `.claude/rules/satellite-provisioning.md` for the full guide.

Quick steps:
1. Clone template to new satellite
2. Customize CLAUDE.md
3. Create springboard.yaml config
4. Register with Hub
5. Setup MCP server

## The Compound Loop

```
Plan → Work → Review → COMPOUND → (repeat)
                          ↓
                    Mistakes → Common Mistakes section
                    Patterns → Patterns That Work section
                    Knowledge → Learnings section
```

**Each completed task makes the system smarter.**

## License

MIT
