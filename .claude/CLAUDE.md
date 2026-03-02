# CLAUDE.md - northernlights

## Project Overview

Dev project for Claude Code project setup. This is a living code space for Claude projects best practices.

## Repository

http://git.theflux.life:3000/hudson/northernlights.git

## Quick Start

```bash
# Clone
git clone http://git.theflux.life:3000/hudson/northernlights.git
cd northernlights

# This is a multi-stack sandbox - no default build
# Each experiment has its own setup in experiments/
```

## Project Structure

```
northernlights/
├── .claude/              # Claude Code configuration
│   ├── CLAUDE.md         # This file - project knowledge
│   ├── commands/         # Slash commands
│   ├── subagents/        # Specialized agents
│   └── hooks/            # Automation
├── .forgejo/workflows/   # CI/CD pipelines
├── experiments/          # Individual experiments (one dir each)
│   └── README.md         # Index of experiments
└── README.md
```

## Rules for This Project

### 1. Document All Experiments
Every experiment, test, or learning should be documented in this CLAUDE.md file under the "Experiments Log" section below.

### 2. Each Experiment Gets Its Own Directory
```
experiments/
├── 001-node-setup/
│   ├── README.md
│   └── ...
├── 002-python-api/
│   ├── README.md
│   └── ...
```

### 3. Always Include a README
Every sub-project/experiment must have a README.md explaining:
- What it tests/demonstrates
- How to run it
- What was learned

## Verification

Before completing any task:
1. [ ] Experiment is in its own directory under `experiments/`
2. [ ] README.md exists for the experiment
3. [ ] This CLAUDE.md is updated with learnings

## Common Mistakes to Avoid

### General
- ❌ Creating experiments in root directory (use `experiments/` folder)
- ❌ Forgetting to document learnings in CLAUDE.md
- ❌ Experiments without README files
- ❌ Not numbering experiments (use format: `NNN-name/`)

### Repository Hygiene
- ❌ Committing zip files: Delete zip archives after extracting, before committing
- ❌ Committing extraction artifacts: Remove extracted directories if contents were copied elsewhere
- ❌ Windows Zone.Identifier files: These are Windows security metadata files that should never be committed (add `*:Zone.Identifier` to .gitignore)

### Claude Code Setup
- ❌ Not testing slash commands after creating them
- ❌ Permissions too broad or too narrow
- ❌ Subagents without clear scope/purpose
- ❌ Appending content with instruction text: When adding sections to CLAUDE.md, integrate cleanly without "Add these sections..." preamble
- ❌ Forgetting to update slash commands list: When adding new commands, update the Slash Commands section in CLAUDE.md

## Slash Commands

### Quick Workflow
- `/research` - Research a topic before planning
- `/plan-feature` - Plan a new feature in Plan mode
- `/code-review` - Review staged changes
- `/commit-push-pr` - Commit, push, and create PR
- `/ship` - Full pipeline: review → commit → push → compound
- `/compound` - Capture learnings after completing work

### Spec-Driven Development (for larger features)
- `/plan-product` - Establish vision, architecture, standards (run once per project)
- `/shape-spec` - Iteratively gather requirements (1-3 questions at a time)
- `/write-spec` - Create detailed specification from shaped requirements
- `/create-tasks` - Break specification into implementable tasks
- `/orchestrate` - Assign task groups to specialized agents
- `/implement` - Execute tasks from orchestration plan

### Project Management
- `/new-experiment` - Create a new experiment directory
- `/hub-search` - Search the Northernlights Hub for relevant learnings
- `/new-munro` - Create a new satellite project connected to the hub
- `/sync-from-starter` - Sync commands and subagents from northernlights-starter

## Subagents

### Code Quality
- `code-simplifier` - Simplify code after implementation
- `verify-build` - Verify build passes
- `experiment-reviewer` - Review experiment documentation
- `learning-extractor` - Identify what to compound from completed work

### Specialist Agents (for /orchestrate)
- `backend-specialist` - APIs, databases, services, business logic
- `frontend-specialist` - UI components, state, user interactions
- `test-specialist` - Unit, integration, and e2e tests

---

## Hub Integration (Recommended)

This project can connect to the **Northernlights Hub** for cross-project knowledge sharing. The hub stores learnings, patterns, and insights that compound across all your projects.

### Why Connect?

- **Search before implementing** - Find patterns others have discovered
- **Share learnings** - Your insights help other projects
- **Avoid repeated mistakes** - Hub knows what went wrong before
- **Cross-pollinate** - Audio buffer insights might help your API project

### Setup (One-Time)

```bash
# Add MCP server globally (works in all projects)
claude mcp add-json northernlights-hub --scope user '{
  "command": "/path/to/.bun/bin/bun",
  "args": ["run", "/opt/northernlights-hub/mcp/src/index.ts"],
  "env": {
    "HUB_API_URL": "http://localhost:3100",
    "HUB_API_KEY": "<your-hub-api-key>"
  }
}'

# Verify connection
claude mcp list
```

### Usage

Once connected, Claude has access to hub tools:

| Action | How |
|--------|-----|
| Search for patterns | "Search the hub for error handling" |
| Get task context | "Get hub context for implementing auth" |
| Add a learning | "Add to hub: [title] - [content]" |
| List projects | "What projects are in the hub?" |

### The Compound → Hub Flow

```
Local Work → /compound → CLAUDE.md updated
                ↓
        Universal learning?
                ↓
        Push to Hub → Available to ALL projects
```

### Naming Convention: Munros

Projects in the hub follow the Scottish Munros naming theme:
- `ben-nevis` - Core infrastructure
- `cairngorm` - API services
- `glencoe` - Frontend apps
- etc.

Pick a munro for your project when registering with the hub!

---

## Experiments Log

Document each experiment here as you complete them.

### Template:
```
### Experiment NNN: [Name]
**Date:** YYYY-MM-DD
**Directory:** experiments/NNN-name/
**Purpose:** What this tests/demonstrates
**Outcome:** What was learned
**Status:** ✅ Complete / 🔄 In Progress / ❌ Failed
```

---

### Experiment 001: Initial Setup
**Date:** 2025-01-11
**Directory:** experiments/001-initial-setup/
**Purpose:** Validate the Boris workflow template and project structure
**Outcome:** (To be filled after testing)
**Status:** 🔄 In Progress

---

### Experiment 002: CI/CD Pipeline
**Date:** 2026-01-11
**Directory:** experiments/002-cicd-pipeline/
**Purpose:** Test Forgejo CI/CD workflows and pipeline configurations
**Outcome:** Successfully set up act_runner for dev environment. CI validates project structure and CLAUDE.md. Key learning: runner labels must match workflow `runs-on` values.
**Status:** ✅ Complete

---

### Experiment 003: Multi-Stack Structure
**Date:** 2026-01-11
**Directory:** experiments/003-multi-stack/
**Purpose:** Define best practices for structuring experiments across different tech stacks
**Outcome:** Documented guidelines for Node/TS, Python, Rust, Go, and Shell. Key decisions: per-experiment .gitignore, isolated dependencies, standardized README template.
**Status:** ✅ Complete

---

<!--
CONTRIBUTION GUIDE:
1. Add new experiments to the log above
2. Update "Common Mistakes" when you find patterns
3. Add new slash commands as workflows emerge
This compounds learnings over time.
-->

## Patterns That Work

Patterns that have been validated through use. Apply these proactively.

### General
- ✅ Plan before implementing: Use `/research` → `/plan-feature` before coding
- ✅ Small commits: Commit frequently with clear messages
- ✅ Compound after shipping: Always run `/compound` to capture learnings
- ✅ Match workflow to task size: Quick workflow for small tasks, spec-driven for medium/large features

### Code Organization
- ✅ One thing per file: Each file should have a single responsibility
- ✅ Descriptive names: Names should explain purpose, not implementation

### Command Design
- ✅ Include "When to Use" guidance: Commands should explain their purpose and when to choose them over alternatives
- ✅ Reference existing documentation: Use established methodologies (Agent OS, Compound Engineering) as templates for new workflows

### Subagent Usage
- ✅ code-simplifier for repo hygiene: Run it even on non-code repos to catch accidental commits and cleanup opportunities
- ✅ Clear coordination patterns: Specialist subagents should document which files they own and how to signal completion

---

## Learnings

Knowledge gained that informs future work.

### Workflow
- The `/compound` step is what makes this system improve over time
- Skipping compound means the same mistakes will repeat
- The compound loop is self-reinforcing: learnings added in one session prevent mistakes in the very next task
- Hybrid workflow = Agent OS (spec-driven) + Compound Engineering (learning loop) - best of both worlds
- Spec-driven development creates `specs/<feature>/` directory with shape.md, spec.md, tasks.md, orchestration.yml

### Technical
- Windows creates `filename:Zone.Identifier` files when downloading from the internet - these should be in .gitignore
- The code-simplifier subagent analyzes git history to find recent changes, making it useful for periodic repo cleanup

### Methodology
- Agent OS contribution: Shape requirements iteratively (1-3 questions at a time), not all at once
- Specialist subagents enable parallel implementation when orchestrated correctly
- Task dependencies should be explicit to enable safe parallelization

---

## Multi-Agent Workflow

For complex tasks, use multiple Claude Code instances in parallel:

### Terminal Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Tab 1: Main         │ Tab 2: Tests        │ Tab 3: Docs     │
│ Primary impl        │ Write/run tests     │ Update docs     │
│                     │                     │                 │
│ You orchestrate     │ Works in parallel   │ Works in parallel│
└─────────────────────────────────────────────────────────────┘
```

### When to Use Parallel Agents
- Large features with multiple components
- Need tests written alongside implementation
- Documentation needs to stay in sync

### How to Coordinate
1. Start main agent with the implementation
2. Once structure is clear, spin up test agent
3. Docs agent updates as features solidify
4. Use Tab 1 to orchestrate and review

### Communication Pattern
Each agent should know:
- What the other agents are working on
- What files to avoid modifying (prevent conflicts)
- When to pause for integration

---

## Compound Engineering Pipeline

The full workflow that makes each iteration easier:

### Quick Workflow (small tasks)
```
/research → /plan-feature → implement → /ship
```

### Spec-Driven Workflow (medium/large features)
```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  SPEC-DRIVEN (from Agent OS)                                            │
│  ───────────────────────────                                            │
│                                                                         │
│  /plan-product   Establish vision, architecture, standards (ONCE)       │
│       ↓                                                                 │
│  /shape-spec     Gather requirements iteratively                        │
│       ↓                                                                 │
│  /write-spec     Create detailed specification                          │
│       ↓                                                                 │
│  /create-tasks   Break into implementable tasks                         │
│       ↓                                                                 │
│  /orchestrate    Assign to specialized agents                           │
│       ↓                                                                 │
│  /implement      Execute tasks (parallel or sequential)                 │
│       ↓                                                                 │
│  ───────────────────────────                                            │
│  COMPOUND ENGINEERING (from Dan Shipper + Boris)                        │
│       ↓                                                                 │
│  /ship           Simplify → Review → Commit → Compound                  │
│       ↓                                                                 │
│  CLAUDE.md       Updated with learnings                                 │
│       ↓                                                                 │
│  Next feature    Easier because system learned                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### When to Use What

| Situation | Workflow |
|-----------|----------|
| New project | `/plan-product` first, then features |
| Small fix/tweak | Just do it → `/ship` |
| Small feature (<2h) | `/research` → `/plan-feature` → implement → `/ship` |
| Medium feature (2-8h) | `/shape-spec` → `/write-spec` → `/create-tasks` → implement → `/ship` |
| Large feature (>8h) | Full pipeline with `/orchestrate` and parallel agents |

### Key Principle

> "In normal engineering, every feature makes the next harder.
> In compound engineering, every feature makes the next easier."
> — Dan Shipper

This only works if you **actually compound** — capture and codify learnings after every task.
