# Experiment 003: Multi-Stack Experiment Structure

## Purpose
Define best practices for structuring experiments across different tech stacks (Node/TypeScript, Python, Rust, Go, Shell scripts).

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| .gitignore | Per-experiment | Keeps experiments self-contained and portable |
| Dependencies | Isolated | Each experiment manages its own deps |
| README template | Standardized | Consistency across all experiments |

## Stack-Specific Guidelines

### Node.js / TypeScript

**Setup:**
```bash
cd experiments/NNN-name
npm init -y
# For TypeScript:
npm install -D typescript @types/node
npx tsc --init
```

**Required files:**
- `package.json` - dependencies and scripts
- `tsconfig.json` - TypeScript config (if using TS)

**Recommended .gitignore:**
```gitignore
node_modules/
dist/
*.log
.env
```

**Run commands:**
```bash
npm install      # Install deps
npm run build    # Build (if applicable)
npm start        # Run
npm test         # Test
```

---

### Python

**Setup:**
```bash
cd experiments/NNN-name
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate   # Windows
pip install -e .           # If using pyproject.toml
```

**Required files (choose one):**
- `pyproject.toml` - modern Python packaging (preferred)
- `requirements.txt` - simple dependency list

**Recommended .gitignore:**
```gitignore
.venv/
__pycache__/
*.pyc
.pytest_cache/
*.egg-info/
dist/
.env
```

**Run commands:**
```bash
source .venv/bin/activate
python main.py           # Run
pytest                   # Test
```

---

### Rust

**Setup:**
```bash
cd experiments
cargo new NNN-name
# Or for existing directory:
cd NNN-name && cargo init
```

**Required files:**
- `Cargo.toml` - package manifest

**Recommended .gitignore:**
```gitignore
target/
Cargo.lock  # Include for binaries, exclude for libraries
```

**Run commands:**
```bash
cargo build          # Build
cargo run            # Run
cargo test           # Test
cargo build --release  # Release build
```

---

### Go

**Setup:**
```bash
cd experiments/NNN-name
go mod init northernlights/experiments/NNN-name
```

**Required files:**
- `go.mod` - module definition
- `go.sum` - dependency checksums (auto-generated)

**Recommended .gitignore:**
```gitignore
# Go binaries
NNN-name
*.exe
```

**Run commands:**
```bash
go build     # Build
go run .     # Run
go test      # Test
```

---

### Shell Scripts

**Setup:**
```bash
cd experiments/NNN-name
touch main.sh
chmod +x main.sh
```

**Required files:**
- Main script with shebang (`#!/bin/bash` or `#!/usr/bin/env bash`)

**Recommended .gitignore:**
```gitignore
*.log
.env
```

**Run commands:**
```bash
./main.sh    # Run
```

---

## Standard README Template

Every experiment README should include:

```markdown
# Experiment NNN: [Name]

## Purpose
[One sentence: what this tests/demonstrates]

## Setup
[Stack-specific setup commands]

## Stack
- [Language/runtime]
- [Key dependencies]

## How to Run
[Commands to execute the experiment]

## Learnings
1. [Learning 1]
2. [Learning 2]

## Status
[🔄 In Progress / ✅ Complete / ❌ Failed]
```

---

## Learnings

1. **Self-contained experiments** - Each experiment should be runnable without affecting others
2. **Per-experiment .gitignore** - Avoids polluting root .gitignore with stack-specific patterns
3. **Standard README structure** - Makes experiments easy to navigate and understand
4. **Stack section required** - Helps future readers know what tools they need

## Status
✅ Complete
