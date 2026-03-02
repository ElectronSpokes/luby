# Shape Spec

Iteratively gather requirements for a feature. Ask 1-3 questions at a time until requirements are clear.

## Usage

```
/shape-spec <feature-name>
```

## When to Use

- Before writing a detailed spec
- When requirements are fuzzy
- Medium to large features

## Output

Creates `specs/<feature-name>/shape.md` with gathered requirements.

## Instructions

### 1. Check for Existing Context

**BEFORE asking questions**, search for existing notes about this feature:

```
Check these locations:
- specs/<feature-name>/ (may already have notes)
- notes/, docs/, planning/, brainstorm/, ideas/
- notes/<feature-name>.md, docs/<feature-name>.md
- Root-level files: <feature-name>.md, NOTES.md
- product/ directory for vision/architecture context
- Any path mentioned in the command argument
```

If found:
1. Read all relevant files
2. Summarize what's already been decided
3. Say: "I found existing notes about this feature. Here's what I understand: [summary]"
4. Ask: "Is this correct? Anything to add or change?"
5. Only ask questions about gaps or ambiguities

If nothing found:
1. Ask: "Do you have any existing notes or brainstorming for this feature I should read first?"
2. If yes, read them before proceeding
3. If no, proceed with questions below

### 2. Create Spec Directory

```bash
mkdir -p specs/<feature-name>
```

### 3. Iterative Requirements Gathering

Ask questions in batches of 1-3 (skip questions already answered in existing notes). Categories to cover:

**Users & Goals**
- Who is the primary user?
- What are they trying to accomplish?
- What triggers this feature?

**Scope**
- What's included in v1?
- What's explicitly out of scope?
- Any known constraints?

**Behavior**
- What's the happy path?
- How should errors be handled?
- Any edge cases to consider?

**Technical**
- Any tech stack requirements?
- Integration points?
- Performance requirements?

### 4. Document Requirements

After each answer, update `specs/<feature-name>/shape.md`:

```markdown
# Shape: <Feature Name>

## Summary
[One sentence description]

## Users & Goals
- Primary user: [who]
- Goal: [what they want to achieve]
- Trigger: [what initiates this]

## Scope

### Included (v1)
- [requirement 1]
- [requirement 2]

### Out of Scope
- [not doing 1]
- [not doing 2]

## Behavior

### Happy Path
1. [step 1]
2. [step 2]
3. [step 3]

### Error Handling
- [error case]: [how to handle]

### Edge Cases
- [edge case]: [expected behavior]

## Technical Requirements
- [requirement 1]
- [requirement 2]

## Open Questions
- [anything still unclear]
```

### 5. Confirm Completeness

When all categories are covered, ask:
- "Is there anything else I should know?"
- "Are we ready to write the detailed spec?"

## Output

After completion, report:

```
SHAPE COMPLETE
==============
Feature: <feature-name>
File: specs/<feature-name>/shape.md

Requirements gathered:
- Users & Goals: [complete/incomplete]
- Scope: [complete/incomplete]
- Behavior: [complete/incomplete]
- Technical: [complete/incomplete]

Open questions: [count]

Next: Use /write-spec <feature-name> to create detailed specification
```

## Tips

- Don't ask all questions at once - iterate
- Capture exact wording from user
- Flag ambiguities for follow-up
- It's OK to have open questions - they go in the spec
