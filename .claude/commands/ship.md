# Ship

Complete workflow: Simplify → Review → Commit → Push → Compound. This is the full shipping pipeline.

## The Pipeline

```
/ship = [simplify] → /code-review → /commit-push-pr → /compound
```

Use `/ship --quick` to skip simplify step for fast commits.

## Instructions

### Step 0: Simplify (Optional)

Run code-simplifier to check for cleanup opportunities:

```
code-simplifier:code-simplifier
```

Look for:
- Duplicate/temp files accidentally staged
- Code that can be simplified
- Unnecessary complexity

**Skip this step with:** `/ship --quick`

### Step 1: Review (from /code-review)

```bash
git diff --cached
git diff --cached --stat
```

Check:
- [ ] Code quality (no debug statements, commented code)
- [ ] Documentation updated
- [ ] Tests pass (if applicable)
- [ ] Follows project patterns (from CLAUDE.md)
- [ ] No accidental files (zips, node_modules, temp files)

**If issues found:** Stop and fix before continuing.

### Step 2: Commit & Push (from /commit-push-pr)

```bash
git add -A
git commit -m "<type>: <description>"
git push origin <branch>
```

Commit types:
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `refactor:` code restructure
- `test:` tests
- `chore:` maintenance/cleanup
- `experiment:` new experiment

### Step 3: Compound (from /compound)

After successful push, capture learnings:

1. **Mistakes made?** → Add to Common Mistakes
2. **Patterns that worked?** → Add to Patterns That Work  
3. **Learnings?** → Add to Learnings or Experiment Log
4. **Tooling gaps?** → Update commands/subagents

### Step 4: Report

```
SHIP COMPLETE 🚀
================

Simplify: ✅ Clean / ⚠️ [N] suggestions / ⏭️ Skipped
Review: ✅ Passed
Commit: <commit hash>
Branch: <branch>
Push: ✅ Success

Compounded:
- Added [N] mistakes to avoid
- Added [N] patterns that work
- Updated experiment log: [yes/no]

PR URL: http://git.theflux.life:3000/hudson/northernlights/compare/<branch>

Next iteration will be easier.
```

## Quick Ship (Skip Simplify)

For fast commits when you know the code is clean:

```
/ship --quick
```

Skips the simplify step, goes straight to review.

## Full Ship (Default)

```
/ship
```

Runs all steps including code-simplifier.

## Abort

If review fails:

```
SHIP ABORTED ❌
==============
Issues found:
- [issue 1]
- [issue 2]

Fix these before shipping.
```

## When to Use Each

| Situation | Command |
|-----------|---------|
| Normal development | `/ship` |
| Quick typo fix | `/ship --quick` |
| Before release/PR | `/ship` (always run simplifier) |
| Cleanup commit | `/ship --quick` (already simplified) |
