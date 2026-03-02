# Sync From Starter

Sync this satellite project with the latest commands, subagents, and patterns from the northernlights-starter repo.

## When to Use

- After northernlights-starter is updated with new commands/subagents
- When satellite feels out of date
- Periodically to ensure consistency across the munro family

## Starter Location

The starter repo is at: `/opt/northernlights-starter`

If not available locally, clone it:
```bash
git clone http://git.theflux.life:3000/hudson/northernlights.git /opt/northernlights-starter
```

## Instructions

### 1. Check Starter is Up to Date

```bash
cd /opt/northernlights-starter && git pull origin main
```

### 2. Compare Commands

List commands in both repos:
```bash
echo "=== Starter Commands ===" && ls /opt/northernlights-starter/.claude/commands/
echo "=== Local Commands ===" && ls .claude/commands/
```

### 3. Compare Subagents

```bash
echo "=== Starter Subagents ===" && ls /opt/northernlights-starter/.claude/subagents/
echo "=== Local Subagents ===" && ls .claude/subagents/
```

### 4. Identify Missing Files

Ask the user:
- "Which commands/subagents are missing from this satellite?"
- "Should I sync all missing files, or specific ones?"

### 5. Sync Files

For each missing or outdated file:

```bash
# Sync specific command
cp /opt/northernlights-starter/.claude/commands/<name>.md .claude/commands/

# Sync specific subagent
cp /opt/northernlights-starter/.claude/subagents/<name>.md .claude/subagents/

# Or sync all commands (careful - may overwrite local customizations)
cp /opt/northernlights-starter/.claude/commands/*.md .claude/commands/

# Or sync all subagents
cp /opt/northernlights-starter/.claude/subagents/*.md .claude/subagents/
```

### 6. Update CLAUDE.md

If new commands/subagents were added, update the Slash Commands and Subagents sections in `.claude/CLAUDE.md` to document them.

### 7. Preserve Local Customizations

Some files should NOT be synced (they're satellite-specific):
- `.claude/CLAUDE.md` (has project-specific content)
- Any commands customized for this satellite's stack/domain

### 8. Commit Changes

```bash
git add .claude/
git commit -m "sync: update commands and subagents from starter

Synced from northernlights-starter.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

## Output

After syncing, report:

```
SYNC COMPLETE
=============
Starter: /opt/northernlights-starter (commit: <hash>)
Satellite: <current-project>

Commands synced: [count]
- <list of synced commands>

Subagents synced: [count]
- <list of synced subagents>

Skipped (local customizations preserved):
- <list or "none">

CLAUDE.md: [updated/no changes needed]

Run `git push` to push changes to remote.
```

## Quick Sync (All Files)

For a full sync of everything (use with caution):

```bash
# Pull latest starter
cd /opt/northernlights-starter && git pull origin main && cd -

# Sync all commands and subagents
cp /opt/northernlights-starter/.claude/commands/*.md .claude/commands/
cp /opt/northernlights-starter/.claude/subagents/*.md .claude/subagents/

# Commit
git add .claude/
git commit -m "sync: full update from starter"
```

## Tips

- Always pull starter first to get latest changes
- Review diffs before committing if you have local customizations
- The starter's CLAUDE.md has the canonical command/subagent documentation
- Run `/compound` after syncing to capture any learnings
