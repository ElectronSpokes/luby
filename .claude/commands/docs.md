# /docs - Search Documentation

Search and browse indexed documentation across all projects.

## Usage

```
/docs <query>           # Semantic search
/docs status            # Health overview
/docs list [--type X]   # List documents
```

## Instructions

When invoked with a query, search for relevant documentation:

1. **Search for documents** matching the query using the `hub_docs_search` MCP tool or CLI:
   ```bash
   northernlights docs search "<query>" --limit 10
   ```

2. **Display results** in a clear format:
   - Document title and type
   - Path and project
   - Relevance score
   - Key headings (if available)

3. **Offer to read** specific documents if the user wants more detail.

## When to Use

- Before implementing a feature - check for existing specs
- When looking for architecture decisions
- To find related documentation across projects
- To understand project patterns and standards

## Example Queries

- "authentication flow" - Find auth-related specs
- "API design patterns" - Architecture decisions
- "fal.ai integration" - Product-specific docs
- "post-scarcity principles" - Vision documents

## Quick Commands

| Command | Description |
|---------|-------------|
| `/docs <query>` | Semantic search |
| `/docs status` | Health report |
| `/docs stale` | Find outdated docs |
| `/docs orphans` | Unassigned documents |

## Available Document Types

vision, roadmap, decision, spec, requirements, design, architecture, api, runbook, workflow, standards, checklist, note, journal, research, readme, changelog
