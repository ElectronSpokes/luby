# Experiments

This directory contains individual experiments for testing Claude Code best practices.

## Structure

Each experiment has its own numbered directory:

```
experiments/
├── 001-initial-setup/
│   └── README.md
├── 002-next-experiment/
│   └── README.md
└── ...
```

## Creating a New Experiment

Use the `/new-experiment` command in Claude Code, or manually:

1. Determine the next number (check existing directories)
2. Create directory: `mkdir experiments/NNN-name`
3. Add README.md with:
   - Purpose
   - Setup instructions
   - Stack used
   - Learnings (fill in as you go)
   - Status
4. Update `.claude/CLAUDE.md` with experiment entry

## Experiment Index

| # | Name | Stack | Status |
|---|------|-------|--------|
| 001 | initial-setup | - | 🔄 In Progress |
| 002 | cicd-pipeline | Forgejo Actions | ✅ Complete |
| 003 | multi-stack | Documentation | ✅ Complete |

*(This index is manually maintained - update when adding experiments)*
