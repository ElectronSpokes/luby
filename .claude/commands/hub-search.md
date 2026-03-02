# Hub Search

Search the Northernlights Hub for relevant learnings before starting work.

## When to Use

- Before implementing a new feature
- When facing a problem you suspect others have solved
- When working with unfamiliar patterns or technologies
- At the start of any significant task

## Instructions

### 1. Identify the Task Context

What are you about to work on? Consider:
- The technical domain (API, database, frontend, etc.)
- The specific problem (error handling, caching, auth, etc.)
- The stack you're using (TypeScript, Python, etc.)

### 2. Search the Hub

Use the `hub_search` MCP tool:

```
"Search the hub for [your topic]"
```

Examples:
- "Search the hub for error handling patterns"
- "Search the hub for API authentication"
- "Search the hub for database indexing"

### 3. Get Comprehensive Context (Optional)

For complex tasks, get full context:

```
"Get hub context for implementing [your task]"
```

This returns:
- Relevant learnings ranked by similarity
- Related patterns and mistakes to avoid
- Cross-project insights that might help

### 4. Apply What You Find

Review the results and consider:
- **Patterns to follow** - Apply these proactively
- **Mistakes to avoid** - Don't repeat others' errors
- **Insights** - Non-obvious knowledge that helps

### 5. Note Gaps

If the hub doesn't have what you need, that's a signal:
- The pattern might be novel (document it after!)
- You might phrase the search differently
- This is an opportunity to contribute back via `/compound`

## Example Session

```
You: /hub-search

Claude: What are you about to work on?

You: I need to implement rate limiting for our API

Claude: [Searches hub for "rate limiting API"]

Results:
1. "Use sliding window for rate limits" (0.78) - pattern
2. "Store rate limit state in Redis, not memory" (0.72) - decision
3. "Return 429 with Retry-After header" (0.68) - pattern

Relevant insights to apply:
- Sliding window is more fair than fixed window
- In-memory rate limiting fails in distributed systems
- Always tell clients when they can retry
```

## Output

After searching, summarize:
```
HUB SEARCH COMPLETE
==================
Query: [what you searched for]
Results: [count] relevant learnings
Top insights:
- [Key insight 1]
- [Key insight 2]
- [Key insight 3]

Ready to implement with hub knowledge.
```

## No Hub Connection?

If the hub isn't configured, this command won't work. See the "Hub Integration" section in CLAUDE.md for setup instructions.
