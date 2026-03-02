# Hub Integration

HALINOVA is connected to **Northernlights Hub** (10.0.100.11:3100).

## Hub Tools

| Tool | Purpose |
|------|---------|
| `hub_search` | Search learnings across network |
| `hub_add_learning` | Capture new learnings |
| `hub_get_context` | Get context before implementing |
| `hub_awaken` | Rapid context assembly |
| `hub_session_start/end` | Track work sessions |

## Trace Tools

**IMPORTANT: Check trace context before infrastructure operations.**

| Tool | Purpose |
|------|---------|
| `hub_trace_context` | Get relevant traces before task |
| `hub_trace_search` | Search past executions |
| `hub_trace_patterns` | Success rates and errors |

### Pre-task Checklist

1. Before VM provisioning/deletion: `hub_trace_context("provision VM")`
2. Before multi-provider workflows: `hub_trace_context("description")`
3. Review warnings and patterns
4. Apply past fixes proactively

```python
# Before deleting a VM
hub_trace_context(task="delete test VM", providers="proxmox,netbox,pihole")
# Response: "destroy_vm failed: protection mode enabled"
# Action: Disable protection BEFORE attempting destroy
```

## Workflow Commands

| Command | Purpose |
|---------|---------|
| `/springboard` | Start work session |
| `/compound` | Capture learnings |
| `/plan-product` | Plan features |
| `/write-spec` | Write specifications |
| `/create-tasks` | Break specs into tasks |
| `/implement` | Implement from tasks |
| `/docs` | Search documentation |

## Storing Artifacts

Store documents in Hub's MinIO for network-wide sharing.

**From Content (most common):**
```bash
curl -X POST "http://10.0.100.11:3100/api/artifacts/from-content" \
  -H "X-Hub-Key: $HUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "bucket": "outputs",
    "path": "halinova/specs/my-feature.md",
    "artifact_type": "spec",
    "content": "# My Feature Spec\n...",
    "filename": "my-feature.md"
  }'
```

**Buckets:**
| Bucket | Purpose |
|--------|---------|
| outputs | Specs, generated docs |
| experience | Learnings, guides |
| media | Images, diagrams |
| research | Research docs |
| comparisons | A/B tests |
| snapshots | Point-in-time captures |

**Artifact Types:** spec, document, image, video, audio, report, research, comparison, snapshot, other

Artifacts searchable via NOVA Library (`/library`).
