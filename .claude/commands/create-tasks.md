# Create Tasks

Break a specification into implementable tasks. Each task should be completable in a single work session.

## Usage

```
/create-tasks <feature-name>
```

## Prerequisites

- `specs/<feature-name>/spec.md` must exist (run /write-spec first)

## Output

Creates `specs/<feature-name>/tasks.md` with task breakdown.

## Instructions

### 1. Read Specification

```bash
cat specs/<feature-name>/spec.md
```

### 2. Identify Task Groups

Group tasks by area:
- **Backend** - APIs, services, database
- **Frontend** - UI, components, state
- **Tests** - Unit, integration, e2e
- **Infrastructure** - Config, deployment, CI

### 3. Create Task Breakdown

Create `specs/<feature-name>/tasks.md`:

```markdown
# Tasks: <Feature Name>

## Overview

Total tasks: [count]
Estimated complexity: [low/medium/high]

## Task Groups

### Backend Tasks

| ID | Task | Dependencies | Complexity |
|----|------|--------------|------------|
| BE-1 | [task description] | none | S |
| BE-2 | [task description] | BE-1 | M |
| BE-3 | [task description] | BE-1 | M |

### Frontend Tasks

| ID | Task | Dependencies | Complexity |
|----|------|--------------|------------|
| FE-1 | [task description] | none | S |
| FE-2 | [task description] | FE-1, BE-1 | M |
| FE-3 | [task description] | FE-2 | L |

### Test Tasks

| ID | Task | Dependencies | Complexity |
|----|------|--------------|------------|
| TE-1 | [task description] | BE-1 | S |
| TE-2 | [task description] | FE-2 | M |
| TE-3 | [task description] | all | M |

### Infrastructure Tasks

| ID | Task | Dependencies | Complexity |
|----|------|--------------|------------|
| IN-1 | [task description] | none | S |

## Dependency Graph

```
BE-1 ──┬──► BE-2
       │
       ├──► BE-3
       │
       └──► FE-2 ──► FE-3
              │
              └──► TE-2
```

## Complexity Key

- **S** (Small): < 1 hour, single file
- **M** (Medium): 1-4 hours, few files
- **L** (Large): 4-8 hours, multiple files/components

## Task Details

### BE-1: [Task Name]

**Description:** [what needs to be done]

**Files to modify:**
- `path/to/file.ts`

**Acceptance criteria:**
- [ ] [criterion 1]
- [ ] [criterion 2]

**Notes:** [any implementation hints]

---

### BE-2: [Task Name]
[... repeat for each task ...]

## Suggested Order

1. BE-1 (unblocks everything)
2. IN-1 (can run in parallel)
3. BE-2, BE-3 (parallel after BE-1)
4. FE-1, FE-2 (after BE-1)
5. TE-1, TE-2 (as backend/frontend complete)
6. FE-3, TE-3 (final)
```

### 4. Validate Completeness

Check:
- [ ] All requirements from spec have tasks
- [ ] Dependencies are clear
- [ ] No circular dependencies
- [ ] Each task is self-contained

### 5. Update Status

Update `specs/<feature-name>/status.md`:

```markdown
## Current Phase
Tasks Created - Ready for /orchestrate
```

## Output

After completion, report:

```
TASKS CREATED
=============
Feature: <feature-name>
File: specs/<feature-name>/tasks.md

Task breakdown:
- Backend: [count] tasks
- Frontend: [count] tasks
- Tests: [count] tasks
- Infrastructure: [count] tasks

Total: [count] tasks
Parallelizable: [count] (can run independently)

Next: Use /orchestrate <feature-name> to assign to agents
```

## Tips

- Keep tasks small (< 4 hours ideal)
- Clear dependencies prevent blockers
- Include file paths when known
- Mark which tasks can run in parallel
