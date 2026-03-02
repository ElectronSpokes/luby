# Research

Gather context and create a research document before planning. This feeds into `/plan-feature`.

## The Pipeline

```
/research → /plan-feature → implement → /code-review → /compound
```

## Instructions

### 1. Check for Existing Research

**BEFORE asking questions**, search for existing research or notes:

```
Check these locations:
- notes/, docs/, research/, planning/, brainstorm/
- notes/<topic>.md, research/<topic>.md
- Root-level markdown files related to the topic
- specs/ directory for related features
- Any prior research documents
```

If found:
1. Read all relevant files
2. Summarize what's already been researched
3. Say: "I found existing notes on this topic. Here's what's already known: [summary]"
4. Focus research on gaps, not re-discovering known information

If nothing found:
1. Ask: "Do you have any existing notes or prior research I should read first?"
2. If yes, read them before proceeding
3. If no, proceed with fresh research

### 2. Clarify the Goal

Ask: "What are we trying to build/solve?"

Get a clear one-sentence answer.

### 3. Gather Context

Research these areas:

**Existing Code:**
```bash
# Find related files
grep -r "relevant_term" --include="*.{js,ts,py,rs,go}" .
find . -name "*relevant*" -type f
```

**Project Conventions:**
- Read CLAUDE.md for patterns and mistakes to avoid
- Check existing similar implementations

**External Resources (if needed):**
- Documentation for libraries/APIs involved
- Best practices for the approach

### 4. Identify Constraints

- What must this work with? (existing APIs, data structures)
- What must be avoided? (check Common Mistakes)
- What patterns should be followed? (check Patterns That Work)

### 5. Output Research Document

Create a structured document:

```markdown
# Research: [Feature/Task Name]

## Goal
[One sentence description]

## Context
- Related files: [list]
- Existing patterns to follow: [list from CLAUDE.md]
- Mistakes to avoid: [list from CLAUDE.md]

## Technical Approach
[How this should be implemented based on research]

## Open Questions
- [Question 1]
- [Question 2]

## Ready for Planning
[ ] Context gathered
[ ] Constraints identified
[ ] Approach outlined
```

### 6. Transition to Planning

Once research is complete:
- Answer any open questions
- Run `/plan-feature` with this research as context

## Example

**Input:** "Add user authentication"

**Research Output:**
```markdown
# Research: User Authentication

## Goal
Add login/logout functionality with session management.

## Context
- Related files: src/api/routes.ts, src/middleware/
- Existing patterns: Use functional middleware (from Patterns That Work)
- Mistakes to avoid: Don't store plain passwords (from Common Mistakes)

## Technical Approach
- Use bcrypt for password hashing
- JWT tokens for sessions
- Middleware pattern for protected routes

## Open Questions
- Which JWT library is preferred?
- Token expiration time?

## Ready for Planning
[x] Context gathered
[x] Constraints identified  
[x] Approach outlined
```

Then: `/plan-feature` to create implementation plan.
