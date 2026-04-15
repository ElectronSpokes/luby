# Implement

Execute tasks from a spec's task breakdown.

## Usage

```
/implement <project>/<feature-name>
```

## Prerequisites

- `agent-os/specs/<project>/<feature-name>/tasks.md` must exist (run /create-tasks first)
- Feature must be on the target project's roadmap

## Instructions

### 1. Load Context

Read the task breakdown:
```bash
cat agent-os/specs/<project>/<feature-name>/tasks.md
```

Also check the legacy flat location if not found:
```bash
cat agent-os/specs/<feature-name>/tasks.md
```

### 2. Check Target Project

Determine where to implement:
- DaChief features: SSH to `10.0.110.12`, work in `/opt/dachief/`
- HALINOVA features: work locally in `/opt/halinova/`
- Other projects: SSH to their VM or work in their local repo

Read the target project's `product/standards.md` for coding conventions.

### 3. Execute Tasks

For each task:

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

### 3b. Doc Checkpoint

Before marking the wave complete, check if docs need updating:

1. **Check for `doc-dependencies.yaml`** in the target project repo
   - If not found: skip this section, proceed to step 4

2. **Get files changed in this wave:**
   - From git status/log, or from the task completion notes above
   - List all source files that were created or modified

3. **Match against dependency map:**
   - For each changed file, check if it matches any `code:` glob pattern in `doc-dependencies.yaml`
   - Collect the set of `docs:` that are mapped to changed code

4. **Check which docs were updated in this wave:**
   - For each affected doc, check if it was modified in this session (git diff or file timestamps)

5. **Display DOC CHECKPOINT:**
   ```
   DOC CHECKPOINT
   ==============
   Changed code affects these docs:

     [doc path]    UPDATED (modified in this wave)
     [doc path]    STALE — [reason from doc-dependencies.yaml]

   For each stale doc: [U]pdate now or [D]efer as tech debt?
   ```

6. **For deferred docs:** append an entry to `doc-tech-debt.md` in the project root:
   ```markdown
   | [today's date] | [wave number] | [doc path] | [reason provided by user] |
   ```
   Create the file with a header row if it doesn't exist yet.

7. **All docs addressed** (updated or deferred) → proceed to step 4.
   If all affected docs are already fresh, the checkpoint passes silently.

### 4. Update Roadmap on Completion

When all tasks for this feature are done:

1. Mark the item DONE on the target project's `product/roadmap.md`
2. Update `agent-os/specs/<project>/<feature-name>/status.md` to "Complete"
3. Update `product/context.md` if health/momentum changed

This is the Ship stage of the pipeline — don't skip it.

## Output

After completing tasks, report:

```
IMPLEMENTATION PROGRESS
=======================
Project: <project>
Feature: <feature-name>
Wave: <wave number>

Tasks completed: [count]/[total]
- BE-1: Done
- BE-2: Done
- BE-3: Blocked (waiting on FE-1)

Files modified:
- src/api/feature.ts (created)
- src/models/feature.ts (modified)
- tests/feature.test.ts (created)

Roadmap updated: [yes/no]
Blockers: [count or "none"]

Next steps:
- [what remains]
- [any coordination needed]
```

## Tips

- Complete tasks in dependency order
- Commit after each task (or logical group)
- Document decisions in task notes
- Ask for clarification if spec is ambiguous
- Always update the roadmap when done — the roadmap is the plan
