# Plan Product

Establish the foundational documents for a project. Run this ONCE per project to create vision, architecture, and standards.

## When to Use

- Starting a new project
- Joining an existing project that lacks documentation
- Major pivot or rewrite

## Output Files

Creates a `product/` directory with:

```
product/
├── vision.md        # What we're building and why
├── architecture.md  # System design and tech stack
└── standards.md     # Coding conventions
```

## Instructions

### 1. Check for Existing Context

**BEFORE asking questions**, search for existing brainstorming or planning documents:

```
Check these locations:
- notes/, docs/, planning/, brainstorm/, ideas/
- Root-level markdown files (*.md)
- README.md, NOTES.md, PLANNING.md, IDEAS.md
- Any path mentioned in the command argument
```

If found:
1. Read all relevant files
2. Summarize what's already been decided
3. Ask: "I found these existing notes. Should I use them as a starting point?"
4. Only ask questions about gaps or ambiguities

If nothing found:
1. Ask: "Do you have any existing notes, brainstorming docs, or planning files I should read first?"
2. If yes, read them before proceeding
3. If no, proceed with questions below

### 2. Create Directory

```bash
mkdir -p product
```

### 3. Vision Document

Ask the user (skip questions already answered in existing notes):
- "What problem does this project solve?"
- "Who is this for?"
- "What does success look like?"

Create `product/vision.md`:

```markdown
# Vision

## Problem
[What problem we're solving]

## Target Users
[Who this is for]

## Success Criteria
[How we'll know we succeeded]

## Non-Goals
[What we're explicitly NOT doing]
```

### 4. Architecture Document

Ask the user (skip questions already answered in existing notes):
- "What's the tech stack?"
- "What are the main components?"
- "How do they communicate?"

Create `product/architecture.md`:

```markdown
# Architecture

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| ... | ... | ... |

## Components

[Describe main components and their responsibilities]

## Data Flow

[How data moves through the system]

## External Dependencies

[APIs, services, databases]
```

### 5. Standards Document

Ask the user (skip questions already answered in existing notes):
- "Any existing coding conventions?"
- "Testing requirements?"
- "Git workflow?"

Create `product/standards.md`:

```markdown
# Standards

## Code Style

[Language-specific conventions]

## Testing

[What needs tests, coverage requirements]

## Git Workflow

[Branch naming, commit format, PR process]

## Documentation

[What needs docs, where they live]
```

### 6. Update CLAUDE.md

Add a reference to the product directory in the project's CLAUDE.md:

```markdown
## Product Documentation

See `product/` for foundational documents:
- `vision.md` - What we're building and why
- `architecture.md` - System design
- `standards.md` - Coding conventions
```

## Output

After completion, report:

```
PRODUCT FOUNDATIONS ESTABLISHED
===============================
Created: product/vision.md
Created: product/architecture.md
Created: product/standards.md
Updated: .claude/CLAUDE.md

Next: Use /shape-spec to start defining features
```
