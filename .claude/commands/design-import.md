# Design Import

Import existing PRD, design docs, or specifications into Design OS format. Run this BEFORE `/ui-first` when you have existing documentation.

## The Pipeline Position

```
research/ → /design-import → product-plan/ → /ui-first → specs/ → src/
                  ↑
             YOU ARE HERE
```

## Directory Structure

```
project/
├── research/        ← INPUT: Raw docs (PRD, designs, mockups, research)
├── product-plan/    ← OUTPUT: Design OS format (this command creates)
├── specs/           ← Later: Technical specs (/design-to-spec)
└── src/             ← Later: Implementation (/implement)
```

## Purpose

Convert existing documentation from `research/` into the structured Design OS format (`product-plan/`) that powers the `/ui-first` pipeline.

## When to Use

| Situation | Command |
|-----------|---------|
| Have docs in `research/` | `/design-import` → `/ui-first` |
| Starting completely fresh | `/plan-product` → manual design |
| Have `product-plan/` already | Skip to `/ui-first` |

## Instructions

### Step 1: Check for Research Directory

First, check if `research/` exists and what it contains:

```bash
ls -la research/
```

**If research/ exists with docs:**

"I found documentation in `research/`:

```
research/
├── [file1] - [type/description]
├── [file2] - [type/description]
└── ...
```

Let me review these and convert to Design OS format."

**If research/ is empty or missing:**

"I don't see any documentation in `research/`.

**Please add your docs to `research/`:**
```bash
mkdir -p research
# Then add your files:
# - PRD.md, requirements.md
# - designs/ (mockups, wireframes)
# - user-research/ (personas, flows)
# - competitive-analysis.md
```

Or paste/share docs directly and I'll help organize them into `research/`."

**Wait for user to provide docs.** Do not proceed until `research/` has content.

### Step 2: Review and Catalog

Read all files in `research/` and create a catalog:

```
RESEARCH CATALOG
================
Source: research/

PRD/Requirements:
  - research/prd.md - [brief description]
  - research/requirements.md - [brief description]

Designs:
  - research/designs/mockup-*.png - [brief description]
  - research/figma-export/ - [brief description]

Technical:
  - research/api-design.md - [brief description]

User Research:
  - research/personas.md - [brief description]
  - research/user-flows.md - [brief description]

Coverage Analysis:
  ✓ Product vision - [found in research/prd.md]
  ✓ User flows - [found in research/user-flows.md]
  ✗ Data model - [MISSING - will need to define]
  ✓ UI components - [found in research/designs/]
  ✗ Test cases - [MISSING - will generate from requirements]
```

### Step 3: Identify Sections/Features

Extract the main features or sections from the documentation:

"Based on your documentation, I've identified these main sections:

**Sections Found:**
1. **[Section Name]** - [description from docs]
2. **[Section Name]** - [description from docs]
3. **[Section Name]** - [description from docs]

**Is this breakdown correct?** Should any sections be:
- Split into smaller pieces?
- Combined together?
- Added (missing from docs)?
- Removed (out of scope for MVP)?"

Use AskUserQuestion to confirm or adjust.

### Step 4: Create Design OS Structure

Create the `product-plan/` directory structure:

```bash
mkdir -p product-plan/{sections,shell,data-model,design-system}
```

### Step 5: Generate Vision README

Create `product-plan/README.md` by extracting from the PRD:

```markdown
# [Product Name] - Design OS Export

## Vision
[Extract from PRD - what is this product?]

## Problem
[Extract from PRD - what problem does it solve?]

## Target Users
[Extract from PRD - who is this for?]

## Core Principles
[Extract or infer from PRD]

## MVP Scope
[Extract from PRD - what's in v1?]

## Tech Stack
[Extract from technical docs or ask user]

| Layer | Choice | Rationale |
|-------|--------|-----------|
| ... | ... | ... |
```

### Step 6: Generate Section Artifacts

For each identified section, create:

#### `product-plan/sections/[section]/README.md`

```markdown
# [Section Name]

## Overview
[Extract from PRD/designs]

## User Flows
[Extract from user research or infer from requirements]

### Flow 1: [Name]
1. User does X
2. System responds with Y
3. User sees Z

## Components
[Extract from designs or infer from flows]

### [Component Name]
- **Purpose:** [what it does]
- **Data:** [what it needs]
- **Interactions:** [how user interacts]

## Edge Cases
[Extract from PRD or infer]
```

#### `product-plan/sections/[section]/tests.md`

```markdown
# [Section Name] Tests

## Unit Tests
[Generate from requirements - what must work?]

## Integration Tests
[Generate from user flows - what flows must complete?]

## Edge Cases
[Generate from edge cases in README]
```

### Step 7: Generate Data Model

Create `product-plan/data-model/types.ts`:

```typescript
// [Product Name] Core Data Model
// Generated from: [source documents]

// Extract entities from PRD, designs, or ask user
export interface [Entity] {
  id: string;
  // ... fields from documentation
}
```

If data model is not in docs, ask:

"I didn't find a data model in your documentation. Let me generate one based on the features.

**Entities I identified:**
- [Entity 1] - [inferred from X]
- [Entity 2] - [inferred from Y]

**Does this look right?** Any entities missing or incorrect?"

### Step 8: Confirm Import Complete

```
DESIGN_IMPORT_COMPLETE
======================

Created: product-plan/
├── README.md              ✓ Vision from PRD
├── sections/
│   ├── [section-1]/
│   │   ├── README.md      ✓ Flows and components
│   │   └── tests.md       ✓ Test cases
│   ├── [section-2]/
│   │   ├── README.md      ✓ Flows and components
│   │   └── tests.md       ✓ Test cases
│   └── ...
├── data-model/
│   └── types.ts           ✓ Core entities
└── design-system/
    └── (optional)

Source Documents:
- [list of docs used]

Coverage:
- Vision: ✓
- User Flows: ✓
- Components: ✓
- Data Model: ✓
- Test Cases: ✓

Ready for: /ui-first

Next step:
  Run /ui-first to convert to specs and implementation tasks
```

## Tips

- **Don't invent** - Extract from docs, ask when unclear
- **Confirm structure** - Get user approval on sections before generating
- **Note gaps** - Clearly mark what's missing and needs user input
- **Keep traceability** - Note which source doc each section came from
- **Iterate** - User can re-run with additional docs if needed

## Integration with Workflow

```
Have docs? → /design-import → product-plan/ exists → /ui-first works
                   ↓
            Structured format ready for automation
```

## Example Session

```
User: /design-import

Claude: "Before we structure your project, I need to see what
documentation you have. Please share any PRD, designs, specs..."

User: [shares PRD document]

Claude: "I've reviewed your PRD. I found:
- Product vision ✓
- 4 main features ✓
- User personas ✓
- Missing: data model, test cases

Sections identified:
1. Dashboard - overview metrics
2. Transactions - CRUD operations
...

Is this breakdown correct?"

User: "Yes, but split Transactions into List and Entry"

Claude: "Got it. Creating structure..."
[generates product-plan/]

Claude: "DESIGN_IMPORT_COMPLETE. Ready for /ui-first"
```

---

*From scattered docs to structured design. From chaos to clarity.*
