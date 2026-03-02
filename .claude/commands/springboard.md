# Springboard

Check where you are in the project pipeline and launch into the right next step. Run this at the start of any session.

## Usage

```
/springboard
```

## Purpose

Answer two questions:
1. **Where are we?** - What exists, what's the project state
2. **Where to next?** - What command should we run

## Instructions

### Step 1: Check Project State

Scan for key artifacts:

```bash
# Check what exists
ls -la research/         2>/dev/null  # Raw docs (PRD, designs, mockups)
ls -la product/          2>/dev/null  # Vision docs
ls -la product-plan/     2>/dev/null  # Design OS export
ls -la specs/            2>/dev/null  # Technical specs
ls -la src/              2>/dev/null  # Implementation
ls -la CLAUDE.md         2>/dev/null  # Project handover
```

### Step 2: Determine Pipeline Position

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           PROJECT PIPELINE                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  PHASE 0: INPUT     PHASE 1: VISION     PHASE 2: DESIGN    PHASE 3: BUILD   │
│  ──────────────     ──────────────      ──────────────     ──────────────   │
│                                                                               │
│  [ ] research/      [ ] product/        [ ] product-plan/  [ ] specs/        │
│      ├── prd.md         └── vision.md       ├── README.md      └── */spec.md │
│      ├── designs/       └── arch.md         ├── sections/  [ ] src/          │
│      └── research/      └── standards.md    └── data-model/    └── (code)   │
│                                                                               │
│  Commands:          Commands:           Commands:          Commands:         │
│  (add docs here)    /plan-product       /design-import     /design-to-spec   │
│                                         /ui-first          /design-to-tasks  │
│                                                            /implement        │
│                                                            /orchestrate      │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Step 3: Generate Status Report

Present findings:

```
SPRINGBOARD
===========
Project: [name from CLAUDE.md or directory]

ARTIFACTS FOUND:
────────────────
Raw Inputs:
  research/                [✓ X files | ✗ missing]

Vision & Planning:
  product/vision.md        [✓ exists | ✗ missing]
  product/architecture.md  [✓ exists | ✗ missing]
  product/standards.md     [✓ exists | ✗ missing]

Design OS Export:
  product-plan/README.md   [✓ exists | ✗ missing]
  product-plan/sections/   [✓ X sections | ✗ missing]
  product-plan/data-model/ [✓ exists | ✗ missing]

Specs & Tasks:
  specs/                   [✓ X specs | ✗ missing]

Implementation:
  src/                     [✓ exists | ✗ missing]

CURRENT POSITION: [Phase X - Description]
────────────────

RECOMMENDED NEXT STEP:
──────────────────────
[Command recommendation based on state]
```

### Step 4: Recommend Next Action

Based on what exists:

| State | Position | Next Command |
|-------|----------|--------------|
| Nothing exists | Phase 0 | Add docs to `research/` or `/plan-product` |
| `research/` has docs | Phase 0 ready | `/design-import` |
| `product/` only | Phase 1 complete | Add docs to `research/` → `/design-import` |
| `product-plan/` exists | Phase 2 ready | `/ui-first` |
| `product-plan/sections/` populated | Phase 2 complete | `/ui-first` → `/design-to-spec` |
| `specs/` exist | Phase 3 ready | `/design-to-tasks` or `/implement` |
| `specs/*/tasks.md` exist | Phase 3 in progress | `/implement` or `/orchestrate` |
| `src/` has code | Phase 3 active | Continue implementation or `/compound` |

### Step 5: Ask About Existing Docs

If in Phase 0 (nothing exists), ask:

"I don't see any project artifacts yet.

**Do you have existing documentation?**
- PRD, designs, mockups, specs?

If yes → Share them and we'll run `/design-import`
If no → We'll start fresh with `/plan-product`"

### Step 6: Offer Quick Actions

Based on position, offer relevant quick actions:

```
QUICK ACTIONS:
──────────────
[1] Run recommended: /ui-first
[2] Search hub for patterns: hub_search "[project domain]"
[3] Check recent learnings: hub_get_context "[current task]"
[4] Review CLAUDE.md for context
```

## Example Outputs

### Example 1: Fresh Project (No Docs)
```
SPRINGBOARD
===========
Project: fawb

ARTIFACTS FOUND:
────────────────
Raw Inputs:           ✗ research/ missing
Vision & Planning:    ✗ None
Design OS Export:     ✗ None
Specs & Tasks:        ✗ None
Implementation:       ✗ None

CURRENT POSITION: Phase 0 - Not Started

RECOMMENDED NEXT STEP:
──────────────────────
Add docs to research/ → Run /design-import
Or start fresh with /plan-product
```

### Example 2: Has Research Docs
```
SPRINGBOARD
===========
Project: fawb

ARTIFACTS FOUND:
────────────────
Raw Inputs:           ✓ research/ (5 files)
                        ├── prd.md
                        ├── designs/
                        └── user-research.md
Vision & Planning:    ✗ None
Design OS Export:     ✗ None
Specs & Tasks:        ✗ None
Implementation:       ✗ None

CURRENT POSITION: Phase 0 - Docs Ready

RECOMMENDED NEXT STEP:
──────────────────────
Run /design-import to convert research/ → product-plan/
```

### Example 3: Has Design Export
```
SPRINGBOARD
===========
Project: fawb

ARTIFACTS FOUND:
────────────────
Raw Inputs:           ✓ research/ (5 files)
Vision & Planning:    ✗ None
Design OS Export:     ✓ product-plan/
                        ├── README.md ✓
                        ├── sections/ (4 sections)
                        └── data-model/ ✓
Specs & Tasks:        ✗ None
Implementation:       ✗ None

CURRENT POSITION: Phase 2 - Design Complete

RECOMMENDED NEXT STEP:
──────────────────────
Run /ui-first to convert designs to specs and tasks
```

### Example 3: Mid-Implementation
```
SPRINGBOARD
===========
Project: fawb

ARTIFACTS FOUND:
────────────────
Vision & Planning:    ✓ product/
Design OS Export:     ✓ product-plan/ (4 sections)
Specs & Tasks:        ✓ specs/ (2 specs, 1 with tasks)
Implementation:       ✓ src/ (in progress)

CURRENT POSITION: Phase 3 - Implementation Active

RECOMMENDED NEXT STEP:
──────────────────────
Continue with /implement or /orchestrate on remaining tasks

IN PROGRESS:
  - specs/dashboard/tasks.md (3/8 tasks done)
```

## Integration

`/springboard` is the **universal entry point**. Any session can start here:

```
New session
    │
    └── /springboard
           │
           ├── Phase 0 → /design-import or /plan-product
           ├── Phase 1 → Create designs
           ├── Phase 2 → /ui-first
           └── Phase 3 → /implement or /orchestrate
```

---

*Know where you are. Launch where you're going.*
