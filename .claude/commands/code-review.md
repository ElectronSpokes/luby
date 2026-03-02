# Code Review

Review staged changes for quality and best practices.

## Current Changes

```bash
git diff --cached
git diff --cached --stat
```

## Review Checklist

### Code Quality
- [ ] Code is readable and well-organized
- [ ] No commented-out code
- [ ] No debug statements left in
- [ ] Error handling is appropriate

### Documentation
- [ ] README exists and is updated (if needed)
- [ ] Complex logic is commented
- [ ] CLAUDE.md updated with learnings (if applicable)

### Project Rules
- [ ] Experiments are in `experiments/` directory
- [ ] Experiment has its own numbered directory
- [ ] README.md exists for experiment

### Best Practices
- [ ] No hardcoded secrets or credentials
- [ ] No large files that should be gitignored
- [ ] Follows stack-specific conventions

## Output

Provide:
1. Summary of changes
2. Any issues found
3. Suggestions for improvement
4. Approval status: ✅ Ready to commit / ⚠️ Needs changes
