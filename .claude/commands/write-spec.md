# Write Spec

Create a detailed specification from shaped requirements. This becomes the implementation blueprint.

## Usage

```
/write-spec <feature-name>
```

## Prerequisites

- `specs/<feature-name>/shape.md` must exist (run /shape-spec first)

## Output

Creates `specs/<feature-name>/spec.md` with detailed specification.

## Instructions

### 1. Read Shape Document

```bash
cat specs/<feature-name>/shape.md
```

### 2. Write Specification

Create `specs/<feature-name>/spec.md`:

```markdown
# Spec: <Feature Name>

## Overview

[2-3 sentence summary of what this feature does]

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | [requirement] | Must |
| FR-2 | [requirement] | Must |
| FR-3 | [requirement] | Should |
| FR-4 | [requirement] | Could |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | Performance | [target] |
| NFR-2 | Security | [target] |

## User Stories

### US-1: [Story Name]
**As a** [user type]
**I want to** [action]
**So that** [benefit]

**Acceptance Criteria:**
- [ ] [criterion 1]
- [ ] [criterion 2]

## Technical Design

### Components

| Component | Responsibility |
|-----------|----------------|
| [name] | [what it does] |

### Data Model

```
[Entity]
- field: type
- field: type
```

### API Endpoints (if applicable)

| Method | Path | Description |
|--------|------|-------------|
| GET | /path | [description] |
| POST | /path | [description] |

### State Management (if applicable)

[How state flows through the feature]

## UI/UX (if applicable)

### Screens/Views

[List of screens or components needed]

### User Flow

```
[Screen A] → [action] → [Screen B] → [action] → [Screen C]
```

## Error Handling

| Error Case | User Message | System Action |
|------------|--------------|---------------|
| [case] | [message] | [action] |

## Testing Strategy

| Type | Coverage |
|------|----------|
| Unit | [what to test] |
| Integration | [what to test] |
| E2E | [what to test] |

## Open Questions

- [ ] [question 1]
- [ ] [question 2]

## Dependencies

- [dependency 1]
- [dependency 2]
```

### 3. Review with User

Present the spec and ask:
- "Does this capture everything correctly?"
- "Any changes needed before we break this into tasks?"

### 4. Update Status

Create `specs/<feature-name>/status.md`:

```markdown
# Status: <Feature Name>

## Current Phase
Spec Complete - Ready for /create-tasks

## Timeline
- Shape: [date]
- Spec: [date]
- Tasks: pending
- Implementation: pending

## Blockers
[none or list]
```

## Output

After completion, report:

```
SPEC COMPLETE
=============
Feature: <feature-name>
File: specs/<feature-name>/spec.md

Sections:
- Requirements: [count] functional, [count] non-functional
- User Stories: [count]
- Components: [count]
- API Endpoints: [count]
- Open Questions: [count]

Next: Use /create-tasks <feature-name> to break into implementable tasks
```

## Tips

- Be specific - vague specs lead to rework
- Include "why" not just "what"
- Link to shape.md for context
- Mark open questions clearly
