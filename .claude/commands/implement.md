# Implement

Execute tasks from an orchestration plan. Can run as specific specialist or all tasks.

## Usage

```
/implement <feature-name> [agent-type]
```

Where `agent-type` is optional:
- `backend` - Run backend tasks with backend-specialist
- `frontend` - Run frontend tasks with frontend-specialist
- `tests` - Run test tasks with test-specialist
- (omit) - Run all tasks sequentially

## Prerequisites

- `specs/<feature-name>/orchestration.yml` must exist (run /orchestrate first)
- Or `specs/<feature-name>/tasks.md` for simpler execution

## Instructions

### 1. Load Context

Read the orchestration plan:
```bash
cat specs/<feature-name>/orchestration.yml
```

If running as specialist, extract your tasks and context.

### 2. Set Up Progress Tracking

Update `specs/<feature-name>/status.md`:

```markdown
## Current Phase
Implementation In Progress

## Progress

### Backend Tasks
- [ ] BE-1: [description]
- [ ] BE-2: [description]
- [ ] BE-3: [description]

### Frontend Tasks
- [ ] FE-1: [description]
- [ ] FE-2: [description]

### Test Tasks
- [ ] TE-1: [description]
- [ ] TE-2: [description]
```

### 3. Execute Tasks

For each task in your group:

1. **Check dependencies**
   - Are prerequisite tasks complete?
   - If blocked, move to next available task

2. **Read task details**
   - Get acceptance criteria from tasks.md
   - Review relevant spec sections

3. **Implement**
   - Create/modify files as needed
   - Follow project standards (see product/standards.md)
   - Keep changes focused on task scope

4. **Verify**
   - Does it meet acceptance criteria?
   - Do existing tests pass?
   - Any regressions?

5. **Update status**
   - Mark task complete in status.md
   - Note any issues or decisions

### 4. Handle Blockers

If blocked by another agent's task:

```markdown
## Blockers

### FE-2: Waiting on BE-1
- **Blocked since:** [time]
- **Waiting for:** API endpoint for user data
- **Workaround:** Using mock data, will integrate when ready
```

### 5. Signal Completion

When your task group is done:

Update status.md:
```markdown
## [Agent] Tasks: COMPLETE

All [count] tasks finished.
Waiting for: [other agents or "none"]
```

### 6. Coordinate with Other Agents

If running in parallel with other Claude instances:

**DO:**
- Work only on your assigned files
- Update status.md with progress
- Leave TODO comments for integration points

**DON'T:**
- Modify files owned by other agents
- Make assumptions about other agents' implementations
- Block without documenting why

## Output

After completing tasks, report:

```
IMPLEMENTATION PROGRESS
=======================
Feature: <feature-name>
Agent: <agent-type or "all">

Tasks completed: [count]/[total]
- BE-1: Done
- BE-2: Done
- BE-3: Blocked (waiting on FE-1)

Files modified:
- src/api/feature.ts (created)
- src/models/feature.ts (modified)
- tests/feature.test.ts (created)

Blockers: [count or "none"]

Next steps:
- [what remains]
- [any coordination needed]
```

## Specialist Mode

When running as a specialist agent, focus only on your domain:

**backend-specialist:**
- APIs, database schemas, services
- Data validation and business logic
- See subagents/backend-specialist.md

**frontend-specialist:**
- Components, state, UI logic
- User interactions and flows
- See subagents/frontend-specialist.md

**test-specialist:**
- Unit, integration, e2e tests
- Test utilities and mocks
- See subagents/test-specialist.md

## Tips

- Complete tasks in dependency order
- Commit after each task (or logical group)
- Document decisions in task notes
- Ask for clarification if spec is ambiguous
