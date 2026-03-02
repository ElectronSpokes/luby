# Design to Spec

Convert a Design OS section export into a Northernlights specification. This bridges UI design artifacts with our implementation workflow.

## Usage

```
/design-to-spec <section-id> [--feature-name <name>]
```

**Arguments:**
- `<section-id>` — The section folder name in `product-plan/sections/` (e.g., `today`, `habits`)
- `--feature-name` — Optional custom name for the spec (defaults to section-id)

## Prerequisites

- Design OS export exists at `product-plan/sections/<section-id>/`
- Section contains: `README.md`, `types.ts`, `tests.md`, `sample-data.json`

If prerequisites are missing:

"I don't see a Design OS export for **[section-id]**. Please run the Design OS export workflow first, or check that `product-plan/sections/[section-id]/` exists with the required files."

## Instructions

### 1. Locate and Read Design OS Artifacts

Read all available files from the section export:

```
product-plan/sections/<section-id>/
├── README.md          # User flows and design intent
├── types.ts           # Component props and data types
├── tests.md           # Test specifications
├── sample-data.json   # Example data
└── components/        # React components (reference only)
```

Also read the global data model if available:
- `product-plan/data-model/README.md`
- `product-plan/data-model/types.ts`

### 2. Extract User Flows → Use Cases

From `README.md`, extract the user flows section. Transform each flow into a use case:

**Design OS format:**
```markdown
## User Flows
- View today's habits with completion status
- Toggle habit completion
- See current streak for each habit
```

**Northernlights format:**
```markdown
## Use Cases

### UC-1: View Today's Habits
**Actor:** User
**Precondition:** User is logged in
**Flow:**
1. User navigates to Today view
2. System displays list of habits for current date
3. Each habit shows name, category, completion status, and streak
**Postcondition:** User sees all habits with current status

### UC-2: Toggle Habit Completion
...
```

### 3. Extract Types → Data Contracts

From `types.ts`, extract all interfaces and transform into data contracts:

**Design OS format:**
```typescript
export interface Habit {
  id: string
  name: string
  description?: string
  categoryId?: string
  isArchived: boolean
}
```

**Northernlights format:**
```markdown
## Data Contracts

### Habit
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique identifier |
| name | string | Yes | Habit display name |
| description | string | No | Optional description |
| categoryId | string | No | Reference to Category |
| isArchived | boolean | Yes | Soft delete flag |
```

### 4. Infer API Endpoints from Component Props

Analyze the component Props interfaces to infer required API endpoints:

**Design OS Props:**
```typescript
interface TodayProps {
  habits: Habit[]
  onToggle?: (habitId: string) => void
  onAddHabit?: () => void
}
```

**Inferred API:**
```markdown
## API Endpoints

### GET /api/today
Returns today's habits with completion status.

**Response:**
```json
{
  "date": "2024-01-15",
  "habits": [Habit[]],
  "completedCount": 3,
  "totalCount": 6
}
```

### POST /api/today
Toggle habit completion for today.

**Request:**
```json
{
  "habitId": "string",
  "completed": true
}
```
```

### 5. Extract Test Flows → Acceptance Criteria

From `tests.md`, transform test specifications into acceptance criteria:

**Design OS format:**
```markdown
### Flow 1: Toggle Habit Completion
**Steps:**
1. User clicks on a habit card
2. Habit toggles between complete/incomplete
**Expected:**
- [ ] Visual feedback shows new state
- [ ] Streak updates if completing
```

**Northernlights format:**
```markdown
## Acceptance Criteria

### AC-1: Toggle Habit Completion
**Given** user is viewing Today's habits
**When** user clicks on a habit card
**Then** the habit completion status toggles
**And** visual feedback shows the new state immediately
**And** streak count updates if habit was completed
```

### 6. Add Architecture Recommendations

Based on the data types and API requirements, suggest:

- Database schema (from types)
- Caching strategy (for streaks, counts)
- Real-time updates (if applicable)
- Error handling patterns

### 7. Generate the Spec File

Create `specs/<feature-name>/spec.md` with this structure:

```markdown
# <Feature Name> Specification

> Generated from Design OS export: `product-plan/sections/<section-id>/`

## Overview

[Summary from README.md overview section]

## Use Cases

[Transformed user flows]

## Data Contracts

[Transformed types]

## API Endpoints

[Inferred from component props]

## Acceptance Criteria

[Transformed from tests.md]

## Database Schema

[Suggested from types - Prisma format]

## Error Handling

[Standard error responses]

## UI Components

**Source:** `product-plan/sections/<section-id>/components/`

Components are pre-built and props-based. Implementation wires data to these components.

| Component | Props Interface | Purpose |
|-----------|-----------------|---------|
| [Name] | [PropsType] | [Description] |

## Open Questions

[Any ambiguities found during conversion]
```

### 8. Confirm Completion

Report:

```
DESIGN_TO_SPEC_COMPLETE
=======================
Source: product-plan/sections/<section-id>/
Output: specs/<feature-name>/spec.md

Extracted:
- Use Cases: [count]
- Data Contracts: [count]
- API Endpoints: [count]
- Acceptance Criteria: [count]

Next: Run /design-to-tasks <section-id> to create implementable tasks
```

## Tips

- If `tests.md` has detailed edge cases, include them in a separate "Edge Cases" section
- Component props with `on*` callbacks indicate user actions that need API endpoints
- Sample data in `sample-data.json` can be used as API response examples
- The spec should ADD technical depth that Design OS intentionally omits
- Keep the original Design OS structure visible (link to source files)
