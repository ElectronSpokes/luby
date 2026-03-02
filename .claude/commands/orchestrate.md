# Orchestrate

Assign task groups to specialized agents. Creates an orchestration plan for parallel or sequential execution.

## Usage

```
/orchestrate <feature-name>
```

## Prerequisites

- `specs/<feature-name>/tasks.md` must exist (run /create-tasks first)

## Output

Creates `specs/<feature-name>/orchestration.yml` with agent assignments.

## Instructions

### 1. Read Tasks

```bash
cat specs/<feature-name>/tasks.md
```

### 2. Identify Parallelization

Analyze dependency graph:
- Which task groups can run in parallel?
- Which must be sequential?
- What are the critical path tasks?

### 3. Create Orchestration Plan

Create `specs/<feature-name>/orchestration.yml`:

```yaml
feature: <feature-name>
created: <date>

# Agent assignments
agents:
  backend:
    specialist: backend-specialist
    tasks:
      - BE-1
      - BE-2
      - BE-3
    context: |
      Focus on API and database layer.
      See spec.md for data models.
      Use existing patterns from [reference].

  frontend:
    specialist: frontend-specialist
    tasks:
      - FE-1
      - FE-2
      - FE-3
    context: |
      Build UI components for this feature.
      Follow existing component patterns.
      Wait for BE-1 before FE-2.
    dependencies:
      - backend.BE-1  # FE-2 needs this

  tests:
    specialist: test-specialist
    tasks:
      - TE-1
      - TE-2
      - TE-3
    context: |
      Write tests as implementations complete.
      Unit tests for utilities.
      Integration tests for API.
      E2E for critical user flows.
    dependencies:
      - backend.BE-1  # For TE-1
      - frontend.FE-2  # For TE-2

# Execution phases
phases:
  - name: "Phase 1: Foundation"
    parallel:
      - backend: [BE-1]
      - infrastructure: [IN-1]

  - name: "Phase 2: Core Implementation"
    parallel:
      - backend: [BE-2, BE-3]
      - frontend: [FE-1, FE-2]
      - tests: [TE-1]

  - name: "Phase 3: Integration"
    sequential:
      - frontend: [FE-3]
      - tests: [TE-2, TE-3]

# Coordination notes
coordination:
  sync_points:
    - after: "Phase 1"
      verify: "API endpoints available"
    - after: "Phase 2"
      verify: "Core flows working"

  shared_files:
    - path: "src/types/feature.ts"
      owner: backend
      readers: [frontend, tests]

  communication:
    - "Backend announces when endpoints ready"
    - "Frontend signals when components complete"
    - "Tests can start as soon as code exists"
```

### 4. Present to User

Show the orchestration plan:
- Which agents will work on what
- What can run in parallel
- What must be sequential
- Estimated critical path

### 5. Confirm or Adjust

Ask:
- "Does this assignment make sense?"
- "Any agents you want to skip?" (e.g., if no frontend)
- "Ready to start implementation?"

### 6. Update Status

Update `specs/<feature-name>/status.md`:

```markdown
## Current Phase
Orchestrated - Ready for /implement

## Agent Assignments
- Backend: [count] tasks
- Frontend: [count] tasks
- Tests: [count] tasks
```

## Output

After completion, report:

```
ORCHESTRATION COMPLETE
======================
Feature: <feature-name>
File: specs/<feature-name>/orchestration.yml

Agents assigned:
- backend-specialist: [count] tasks
- frontend-specialist: [count] tasks
- test-specialist: [count] tasks

Execution plan:
- Phase 1: [count] tasks (parallel)
- Phase 2: [count] tasks (parallel)
- Phase 3: [count] tasks (sequential)

Parallelization: [percentage]% of tasks can run in parallel

Next: Use /implement <feature-name> <agent> to start
      Or run agents in parallel terminals
```

## Tips

- Maximize parallelization where dependencies allow
- Keep sync points minimal but clear
- Document shared file ownership
- Consider test agent running alongside implementation
