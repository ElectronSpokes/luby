# Compound

Capture learnings and feed them back into the system. This is the key step that makes each feature make the next one easier.

## The Compound Loop

```
Plan → Work → Review → COMPOUND → (next iteration is easier)
```

## Instructions

After completing a task or review, ask:

### 1. What Went Wrong?
"What mistakes were made that Claude should avoid next time?"

Add to CLAUDE.md under `## Common Mistakes to Avoid`:
```markdown
### [Category]
- ❌ [Mistake]: [Why it's wrong and what to do instead]
```

### 2. What Went Right?
"What patterns worked well that should be repeated?"

Add to CLAUDE.md under a new `## Patterns That Work` section:
```markdown
### [Pattern Name]
- ✅ [Description]: [When to use this]
```

### 3. What Was Learned?
"What new knowledge should inform future work?"

If it's experiment-related, update the experiment's README and CLAUDE.md log entry.

If it's general, add to CLAUDE.md under `## Learnings`.

### 4. Should Any Commands/Subagents Be Updated?
"Did this reveal a gap in our tooling?"

- Update command prompts if workflows need refinement
- Update subagent prompts if reviews missed something
- Create new commands if a pattern keeps repeating

## Auto-Compound Checklist

After EVERY completed task, ask yourself:

- [ ] Did Claude make a mistake I had to correct? → Add to Common Mistakes
- [ ] Did a pattern work well? → Add to Patterns That Work
- [ ] Did I learn something new? → Add to Learnings or Experiment Log
- [ ] Would a command have helped? → Create or update command
- [ ] Would a subagent have caught this? → Create or update subagent

## Example Compound Session

**Task completed:** Built a React component

**Mistakes made:**
- Claude used class component instead of functional
- Forgot to add TypeScript types

**Add to CLAUDE.md:**
```markdown
### React
- ❌ Using class components: Always use functional components with hooks
- ❌ Missing TypeScript types: All props must have explicit types
```

**Pattern that worked:**
- Breaking component into smaller pieces first

**Add to CLAUDE.md:**
```markdown
### Component Design  
- ✅ Decompose first: Break into smaller components before implementing
```

### 5. Push Universal Learnings to Hub (if connected)

If the Northernlights Hub is configured, push learnings that would benefit other projects:

**Criteria for hub push:**
- Is this learning specific to this project, or universal?
- Would other projects benefit from knowing this?
- Is it a pattern, mistake, or insight that transcends this codebase?

**If universal, use the MCP tool:**
```
"Add this learning to the hub: [title] - [content]"
```

Set level based on scope:
- `project` - Only relevant to this specific project
- `domain` - Relevant to similar projects (same stack/domain)
- `universal` - Relevant to all software projects

### 6. Sync New Commands to Starter (if created/updated)

If you created or updated any commands during this session, offer to sync them to the starter template so other satellites can use them.

**Check for command changes:**
```bash
# List recently modified commands (last 24 hours)
find .claude/commands -name "*.md" -mtime -1 2>/dev/null
```

**If new/updated commands found, ask:**
"I see you created/updated these commands:
- [command-1.md]
- [command-2.md]

Would you like to sync them to the starter template so other satellites can pull them?"

**If yes, sync to starter:**
```bash
# Copy to starter
cp .claude/commands/[command].md /opt/northernlights-starter/.claude/commands/

# Commit and push
cd /opt/northernlights-starter
git add .claude/commands/
git commit -m "feat: add/update [command] from [satellite-name]"
git push
```

**Criteria for starter sync:**
- Is this command useful for other projects? → Sync to starter
- Is it specific to this project only? → Keep local, don't sync
- Does it replace/improve an existing command? → Sync (will update all satellites)

## Output

After compounding, report:
```
COMPOUND COMPLETE
=================
Added to Common Mistakes: [count]
Added to Patterns That Work: [count]
Updated Experiments Log: [yes/no]
Commands/Subagents updated: [list or none]
Pushed to Hub: [count] learnings (or "Hub not connected")
Synced to Starter: [list of commands or "none"]

The system is now smarter. Next iteration will be easier.
```
