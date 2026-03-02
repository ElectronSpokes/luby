# UI First

Orchestrate the complete Design OS → Northernlights implementation pipeline. Start with UI designs, end with working code.

## Usage

```
/ui-first [feature-name]
```

**Arguments:**
- `feature-name` — Optional name for the feature (will prompt if not provided)

## Overview

This command bridges Design OS (UI design tool) with Northernlights (implementation workflow):

```
Design OS Export → /design-to-spec → /design-to-tasks → /implement
       ↓                  ↓                 ↓               ↓
  UI Components      Spec File         Task List      Working Code
```

## Prerequisites

- Design OS export exists at `product-plan/`
- Export contains at least one section in `product-plan/sections/`

If no export found:

"I don't see a Design OS export at `product-plan/`.

To create one:
1. Run the Design OS app (`cd app && npm run dev`)
2. Complete the design workflow (vision → roadmap → sections → export)
3. Run `/ui-first` again

Or manually place your export files in `product-plan/`."

## Instructions

### 1. Discover Available Sections

List all sections in the Design OS export:

```bash
ls product-plan/sections/
```

Present the available sections:

"I found a Design OS export with the following sections:

**Available Sections:**
1. **today** — [read description from README.md]
2. **habits** — [read description from README.md]

**Also available:**
- Shell components at `product-plan/shell/`
- Data model at `product-plan/data-model/`
- Design tokens at `product-plan/design-system/`

Which section(s) would you like to implement?"

Use AskUserQuestion with options:
- All sections (full implementation)
- Select specific section(s)
- Just the foundation (shell + data model)

### 2. Check for Existing Work

Before generating new specs, check for existing work:

```
specs/<section>/spec.md     — Already converted?
specs/<section>/tasks.md    — Already has tasks?
```

If found:

"I see you already have specs for **[section]**:
- `specs/[section]/spec.md` — [exists/missing]
- `specs/[section]/tasks.md` — [exists/missing]

Would you like to:
1. Use existing specs and continue to implementation
2. Regenerate specs from Design OS (overwrites existing)
3. Start fresh with a new feature name"

### 3. Run Conversion Pipeline

For each selected section:

#### Step A: Convert to Spec
```
Running /design-to-spec [section]...
```

Read the Design OS artifacts and generate `specs/[section]/spec.md`.

Report what was extracted:
- Use cases from user flows
- Data contracts from types
- API endpoints from callbacks
- Acceptance criteria from tests

#### Step B: Generate Tasks
```
Running /design-to-tasks [section]...
```

Generate `specs/[section]/tasks.md` with:
- Setup tasks (copy components, merge types)
- Database tasks (schema, migration, seed)
- API tasks (endpoints for each callback)
- Page tasks (wire components to data)
- Test tasks (from tests.md)

### 4. Present Implementation Plan

After conversion, present the full implementation plan:

"**Implementation Plan for [Feature Name]**

**Specs Created:**
- `specs/[section]/spec.md` — [X] use cases, [Y] endpoints
- `specs/[section]/tasks.md` — [Z] tasks

**Task Summary:**
```
Setup:    [count] tasks
Database: [count] tasks
API:      [count] tasks
Pages:    [count] tasks
Tests:    [count] tasks
─────────────────────
Total:    [count] tasks
```

**Critical Path:**
1. Setup → Database → API
2. API → Pages → Tests

**Estimated Effort:** [S/M/L based on task count and complexity]

**Ready to implement?**"

Use AskUserQuestion:
- Yes, run `/implement` now (single agent)
- Yes, run `/orchestrate` (parallel agents)
- No, let me review the specs first
- No, I want to modify the tasks

### 5. Execute Implementation (if approved)

**Option A: Single Agent (/implement)**
```
Running /implement [section]...
```

Execute tasks sequentially with a single agent.

**Option B: Orchestrated (/orchestrate)**
```
Running /orchestrate [section]...
```

Assign task groups to specialist agents:
- `backend-specialist` — Database + API tasks
- `frontend-specialist` — Setup + Page tasks
- `test-specialist` — Test tasks

### 6. Confirm Completion

After implementation:

```
UI_FIRST_COMPLETE
=================
Feature: [feature-name]
Sections: [list]

Artifacts created:
- specs/[section]/spec.md
- specs/[section]/tasks.md
- [list of implementation files]

Status:
- [x] Design OS export converted
- [x] Specs generated
- [x] Tasks created
- [x] Implementation complete
- [ ] Tests passing (run: npm test)

Next steps:
1. Review the implementation
2. Run tests: npm test
3. Run /code-review to check quality
4. Run /ship to commit and push
```

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         /ui-first                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  Design OS  │───▶│   Specs     │───▶│   Tasks     │         │
│  │   Export    │    │  Generated  │    │  Generated  │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│        │                                      │                 │
│        │            product-plan/             │                 │
│        │            └── sections/             │                 │
│        │                └── today/            │                 │
│        │                    ├── README.md     │                 │
│        │                    ├── types.ts      │                 │
│        │                    └── tests.md      │                 │
│        │                                      │                 │
│        ▼                                      ▼                 │
│  ┌─────────────┐                      ┌─────────────┐          │
│  │  /design-   │                      │  /implement │          │
│  │  to-spec    │                      │     OR      │          │
│  │             │                      │ /orchestrate│          │
│  └─────────────┘                      └─────────────┘          │
│        │                                      │                 │
│        ▼                                      ▼                 │
│  specs/<section>/                     Working Code              │
│  ├── spec.md                          ├── src/components/       │
│  └── tasks.md                         ├── src/app/api/          │
│                                       └── prisma/schema.prisma  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Tips

- Run `/ui-first` without arguments to see all available sections
- Use "foundation only" to set up shell and data model without sections
- Review generated specs before implementing — they add technical depth
- The orchestrated path is faster but requires more context switching
- After `/ui-first`, use `/compound` to capture learnings
