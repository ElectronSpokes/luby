# New Experiment

Create a new experiment directory with proper structure.

## Current Experiments

```bash
ls -la experiments/
```

## Instructions

### 0. Check for Existing Context

**BEFORE asking questions**, search for existing notes about this experiment:

```
Check these locations:
- notes/, ideas/, brainstorm/, planning/
- notes/<experiment-name>.md, ideas/<experiment-name>.md
- Root-level markdown files related to the experiment
- experiments/ for similar past experiments
- Any path mentioned in the command argument
```

If found:
1. Read all relevant files
2. Summarize what's already been thought through
3. Say: "I found existing notes about this experiment. Here's what I understand: [summary]"
4. Use this context to pre-fill the experiment README

If nothing found:
1. Ask: "Do you have any existing notes or ideas for this experiment I should read first?"
2. If yes, read them before proceeding
3. If no, proceed with questions

### 1. Create Experiment

1. Ask for the experiment name/purpose if not provided (skip if found in notes)
2. Determine the next experiment number (NNN format)
3. Create the directory structure:
   ```
   experiments/NNN-name/
   ├── README.md
   └── (stack-specific files)
   ```
4. Update CLAUDE.md with the experiment entry
5. Report what was created

## Template README.md

```markdown
# Experiment NNN: [Name]

## Purpose
[What this experiment tests/demonstrates]

## Setup
[How to set up and run this experiment]

## Stack
[Language/framework used]

## Learnings
[To be filled as experiment progresses]

## Status
🔄 In Progress
```

## Template CLAUDE.md Entry

```markdown
### Experiment NNN: [Name]
**Date:** [Today's date]
**Directory:** experiments/NNN-name/
**Purpose:** [Brief description]
**Outcome:** (To be filled)
**Status:** 🔄 In Progress
```
