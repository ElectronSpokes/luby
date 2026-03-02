# Experiment 001: Initial Setup

## Purpose

Validate the Boris workflow template and project structure. This experiment tests:
- Project creation from template
- Forgejo Actions CI
- Slash commands work correctly
- Subagents are properly configured

## Setup

```bash
# This experiment is meta - it tests the project itself
cd ~/projects/northernlights
claude
```

## Stack

N/A - This is a structural/workflow experiment

## Test Checklist

- [ ] Project clones successfully
- [ ] Claude Code starts and reads CLAUDE.md
- [ ] Slash commands are available:
  - [ ] `/new-experiment`
  - [ ] `/plan-feature`
  - [ ] `/code-review`
  - [ ] `/commit-push-pr`
- [ ] Subagents work:
  - [ ] `experiment-reviewer`
  - [ ] `code-simplifier`
  - [ ] `verify-build`
- [ ] Forgejo Actions run on push
- [ ] Permissions work (no constant approval prompts)

## Learnings

*(To be filled as testing progresses)*

## Status

🔄 In Progress
