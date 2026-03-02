# Check Commands

Check if this satellite's commands are in sync with the starter template. Run this at the start of a session or periodically to ensure you have the latest commands.

## Usage

```
/check-commands
```

## Instructions

### 1. Check Starter is Accessible

First, verify the starter repo exists and is up to date:

```bash
# Check if starter exists
if [ -d "/opt/northernlights-starter" ]; then
  cd /opt/northernlights-starter && git fetch origin main --quiet
  echo "Starter repo found"
else
  echo "Starter repo not found at /opt/northernlights-starter"
fi
```

If starter not found:
"The starter repo is not available at `/opt/northernlights-starter`.

To set it up:
```bash
git clone http://git.theflux.life:3000/hudson/northernlights.git /opt/northernlights-starter
```

Then run `/check-commands` again."

### 2. Compare Command Versions

Compare local commands with starter to find:
- **Missing commands** — In starter but not local
- **Outdated commands** — Local is older than starter
- **Local-only commands** — In local but not starter (may need syncing)

```bash
# Get list of starter commands
STARTER_CMDS=$(ls /opt/northernlights-starter/.claude/commands/*.md 2>/dev/null | xargs -n1 basename)

# Get list of local commands
LOCAL_CMDS=$(ls .claude/commands/*.md 2>/dev/null | xargs -n1 basename)

# Find missing (in starter, not local)
for cmd in $STARTER_CMDS; do
  if [ ! -f ".claude/commands/$cmd" ]; then
    echo "MISSING: $cmd"
  fi
done

# Find outdated (local older than starter)
for cmd in $STARTER_CMDS; do
  if [ -f ".claude/commands/$cmd" ]; then
    if [ "/opt/northernlights-starter/.claude/commands/$cmd" -nt ".claude/commands/$cmd" ]; then
      echo "OUTDATED: $cmd"
    fi
  fi
done

# Find local-only (in local, not starter)
for cmd in $LOCAL_CMDS; do
  if [ ! -f "/opt/northernlights-starter/.claude/commands/$cmd" ]; then
    echo "LOCAL-ONLY: $cmd"
  fi
done
```

### 3. Report Status

Present findings:

```
COMMAND SYNC STATUS
===================
Starter: /opt/northernlights-starter (last updated: [date])
Local:   .claude/commands/

Missing from local (run /sync-from-starter to get):
- [command-1.md]
- [command-2.md]

Outdated locally (run /sync-from-starter to update):
- [command-3.md] (starter is newer)

Local-only (consider syncing to starter via /compound):
- [command-4.md]

Status: [IN SYNC ✓ | OUT OF SYNC ⚠]
```

### 4. Offer Actions

Based on findings, offer:

**If missing or outdated commands:**
"You have [N] commands that need updating. Run `/sync-from-starter` to sync them?"

**If local-only commands:**
"You have [N] local-only commands. Would you like to sync them to the starter so other satellites can use them?"

**If all in sync:**
"All commands are in sync with the starter. ✓"

### 5. Quick Sync Option

If user wants to sync immediately:

```bash
# Pull latest starter
cd /opt/northernlights-starter && git pull origin main

# Copy missing/outdated commands
for cmd in [list]; do
  cp /opt/northernlights-starter/.claude/commands/$cmd .claude/commands/
done

echo "Synced [N] commands from starter"
```

## When to Run

- **Session start** — Quick check for outdated commands
- **Before implementing** — Ensure you have latest workflow commands
- **After /compound** — Verify sync status if you created new commands
- **Periodically** — Weekly check to stay current

## Integration with /awaken

If using the Hub's awaken protocol, add this check to your session start routine:

```markdown
## Session Start Checklist
1. Run `hub_awaken` for project context
2. Run `/check-commands` for command sync status
3. Review any outdated commands before proceeding
```

## Output

```
COMMAND CHECK COMPLETE
======================
Total commands in starter: [N]
Total commands locally: [N]

Missing: [count]
Outdated: [count]
Local-only: [count]
In sync: [count]

Recommendation: [action or "All good!"]
```
