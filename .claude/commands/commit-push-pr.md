# Commit, Push, and Create PR

Standard git workflow for shipping changes.

## Current State

```bash
git status
git diff --stat
```

## Instructions

1. Review the staged changes above
2. Write a clear, conventional commit message:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `chore:` for maintenance
   - `experiment:` for new experiments
3. Commit the changes
4. Push to the remote
5. Provide the URL to create a PR (if applicable)

## Commands

```bash
git add -A
git commit -m "<type>: <description>"
git push origin <branch>
```

## Output

Provide:
- Summary of what was committed
- Push status
- Link to create PR: http://git.theflux.life:3000/hudson/northernlights/compare/<branch>
