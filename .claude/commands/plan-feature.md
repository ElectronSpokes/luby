# Plan Feature / Experiment

Use Plan mode to design before implementing.

## Instructions

### 0. Check for Existing Context

**BEFORE planning**, search for existing notes about this feature/experiment:

```
Check these locations:
- notes/, docs/, planning/, brainstorm/, ideas/
- notes/<feature-name>.md, ideas/<feature-name>.md
- Root-level markdown files related to the feature
- product/ directory for vision/architecture context
- Any path mentioned in the command argument
```

If found:
1. Read all relevant files
2. Summarize what's already been thought through
3. Say: "I found existing notes. Here's what I understand: [summary]"
4. Use this context to inform the plan

If nothing found:
1. Ask: "Do you have any existing notes or brainstorming I should read first?"
2. If yes, read them before proceeding
3. If no, proceed with planning

### 1. Enter Plan Mode

1. Switch to **Plan mode** (Shift+Tab twice in Claude Code)
2. Discuss and refine the plan
3. Once plan is solid, switch to **Auto-accept mode** for implementation

## Planning Template

### 1. Goal
What are we trying to achieve?

### 2. Approach
How will we accomplish this?

### 3. Files to Create/Modify
- [ ] File 1: purpose
- [ ] File 2: purpose

### 4. Steps
1. Step one
2. Step two
3. Step three

### 5. Verification
How will we know it works?
- [ ] Test 1
- [ ] Test 2

### 6. Documentation
- [ ] Update README
- [ ] Update CLAUDE.md (if learnings)

## For Experiments

When planning a new experiment:
1. What does this test/demonstrate?
2. What stack will be used?
3. What's the expected outcome?
4. How will success be measured?

## Output

A clear plan that can be executed in auto-accept mode.
