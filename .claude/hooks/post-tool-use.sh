#!/bin/bash
# Post-tool-use hook: Auto-format files after modification
# Multi-stack support for northernlights sandbox

FILE="$1"

# Exit if no file provided
[ -z "$FILE" ] && exit 0

# Exit if file doesn't exist
[ ! -f "$FILE" ] && exit 0

# Get file extension
EXT="${FILE##*.}"

# Format based on extension
case "$EXT" in
    # JavaScript/TypeScript/Web
    js|jsx|ts|tsx|json|css|scss|md|html|yaml|yml)
        npx prettier --write "$FILE" 2>/dev/null || true
        ;;
    
    # Python
    py)
        black --quiet "$FILE" 2>/dev/null || true
        ;;
    
    # Rust
    rs)
        rustfmt "$FILE" 2>/dev/null || true
        ;;
    
    # Go
    go)
        gofmt -w "$FILE" 2>/dev/null || true
        ;;
    
    # C/C++
    c|cpp|cc|h|hpp)
        clang-format -i "$FILE" 2>/dev/null || true
        ;;
esac

exit 0
