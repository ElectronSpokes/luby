#!/bin/bash
# Validate CLAUDE.md restructure
# Run: bash .claude/rules/validate-config.sh

echo "=== CLAUDE.md Config Validation ==="
echo ""

PASS=0
FAIL=0

check() {
  local name="$1"
  local pattern="$2"
  local files="$3"

  if grep -rq "$pattern" $files 2>/dev/null; then
    echo "✓ $name"
    ((PASS++))
  else
    echo "✗ $name - MISSING"
    ((FAIL++))
  fi
}

echo "--- Essential Knowledge ---"
check "Hub API header (X-Hub-Key)" "X-Hub-Key" "CLAUDE.md .claude/rules/"
check "Pre-task trace context" "hub_trace_context" "CLAUDE.md .claude/rules/"
check "Compound workflow" "/compound" "CLAUDE.md .claude/rules/"
check "ProviderFactory usage" "ProviderFactory" ".claude/rules/"
check "Hub tools reference" "hub_search\|hub_add_learning" ".claude/rules/"
check "Proxmox VM sequence" "stop_vm.*protect" "CLAUDE.md .claude/rules/"
check "API curl testing" 'curl.*jq' "CLAUDE.md .claude/rules/"

echo ""
echo "--- Rules Files Exist ---"
for rule in common-mistakes patterns decisions insights providers hub-integration satellite-provisioning; do
  if [ -f ".claude/rules/${rule}.md" ]; then
    echo "✓ ${rule}.md exists ($(wc -c < .claude/rules/${rule}.md) chars)"
    ((PASS++))
  else
    echo "✗ ${rule}.md MISSING"
    ((FAIL++))
  fi
done

echo ""
echo "--- Size Checks ---"
MAIN_SIZE=$(wc -c < CLAUDE.md)
if [ "$MAIN_SIZE" -lt 15000 ]; then
  echo "✓ CLAUDE.md under 15k ($MAIN_SIZE chars)"
  ((PASS++))
else
  echo "✗ CLAUDE.md over 15k ($MAIN_SIZE chars)"
  ((FAIL++))
fi

TOTAL=$(cat CLAUDE.md .claude/rules/*.md 2>/dev/null | wc -c)
if [ "$TOTAL" -lt 40000 ]; then
  echo "✓ Total under 40k ($TOTAL chars)"
  ((PASS++))
else
  echo "✗ Total over 40k ($TOTAL chars)"
  ((FAIL++))
fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[ $FAIL -eq 0 ] && echo "All checks passed!" || echo "Some checks failed - review above"
