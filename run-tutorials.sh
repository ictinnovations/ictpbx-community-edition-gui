#!/usr/bin/env bash
# Runs all 10 tutorial recordings sequentially.
# Usage: bash run-tutorials.sh [01] [02] ... (optional: run specific tutorial numbers)

set -euo pipefail

CONFIG="playwright.tutorials.config.ts"
REPORT_DIR="playwright-report-tutorials"
LOG_DIR="tutorial-logs"
mkdir -p "$LOG_DIR"

SPECS=(
  "tutorial-01-tenant-user"
  "tutorial-02-did-assignment"
  "tutorial-03-ivr-menu"
  "tutorial-04-call-queue"
  "tutorial-05-voicemail"
  "tutorial-06-billing"
  "tutorial-07-inbound-route"
  "tutorial-08-follow-me"
  "tutorial-09-conference"
  "tutorial-10-my-account"
)

# Filter by args if provided (e.g. bash run-tutorials.sh 01 03)
if [[ $# -gt 0 ]]; then
  FILTER=("$@")
  SELECTED=()
  for spec in "${SPECS[@]}"; do
    for f in "${FILTER[@]}"; do
      if [[ "$spec" == *"-$f-"* || "$spec" == *"-$f" ]]; then
        SELECTED+=("$spec")
        break
      fi
    done
  done
  SPECS=("${SELECTED[@]}")
fi

PASS=0
FAIL=0
FAILED_SPECS=()

for spec in "${SPECS[@]}"; do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Running: $spec"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  LOG="$LOG_DIR/${spec}.log"
  if npx playwright test --config="$CONFIG" "e2e/${spec}.spec.ts" 2>&1 | tee "$LOG"; then
    echo "  ✓ PASSED: $spec"
    PASS=$((PASS + 1))
  else
    echo "  ✗ FAILED: $spec  (see $LOG)"
    FAIL=$((FAIL + 1))
    FAILED_SPECS+=("$spec")
  fi
done

echo ""
echo "════════════════════════════════════════════════"
echo "  Tutorial recordings complete"
echo "  Passed: $PASS / $((PASS + FAIL))"
if [[ ${#FAILED_SPECS[@]} -gt 0 ]]; then
  echo "  Failed:"
  for f in "${FAILED_SPECS[@]}"; do echo "    - $f"; done
fi
echo "  Videos: C:/Users/Super/Videos/tutorials/"
echo "  Report: npx playwright show-report $REPORT_DIR"
echo "════════════════════════════════════════════════"
