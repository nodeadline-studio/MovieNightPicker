#!/bin/bash
# Post-Change Verification Script
# Validates that all required checks are performed after code changes

set -e

PROJECT_DIR="${1:-$(pwd)}"
cd "$PROJECT_DIR"

echo "🔍 Post-Change Verification"
echo "==========================="

# Check 1: Build
echo ""
echo "1️⃣  Running build..."
if npm run build > /tmp/build-output.log 2>&1; then
  BUILD_EXIT=0
  echo "   ✅ Build: exit 0"
else
  BUILD_EXIT=$?
  echo "   ❌ Build: exit $BUILD_EXIT"
  echo "   Build errors:"
  tail -20 /tmp/build-output.log | sed 's/^/      /'
fi

# Check 2: Lint
echo ""
echo "2️⃣  Running lint..."
if npm run lint > /tmp/lint-output.log 2>&1; then
  LINT_EXIT=0
  echo "   ✅ Lint: exit 0"
else
  LINT_EXIT=$?
  echo "   ❌ Lint: exit $LINT_EXIT"
  echo "   Lint errors:"
  tail -20 /tmp/lint-output.log | sed 's/^/      /'
fi

# Check 3: Type check (if TypeScript)
if [ -f "tsconfig.json" ]; then
  echo ""
  echo "3️⃣  Running type check..."
  if npm run type-check > /tmp/type-output.log 2>&1 || tsc --noEmit > /tmp/type-output.log 2>&1; then
    TYPE_EXIT=0
    echo "   ✅ Type-check: exit 0"
  else
    TYPE_EXIT=$?
    echo "   ❌ Type-check: exit $TYPE_EXIT"
    echo "   Type errors:"
    tail -20 /tmp/type-output.log | sed 's/^/      /'
  fi
fi

# Summary
echo ""
echo "📊 Verification Summary"
echo "======================"
echo "   Build:    exit $BUILD_EXIT"
echo "   Lint:     exit $LINT_EXIT"
if [ -f "tsconfig.json" ]; then
  echo "   Type:     exit ${TYPE_EXIT:-N/A}"
fi

if [ $BUILD_EXIT -eq 0 ] && [ $LINT_EXIT -eq 0 ]; then
  if [ -f "tsconfig.json" ] && [ ${TYPE_EXIT:-1} -eq 0 ]; then
    echo ""
    echo "✅ All checks passed!"
    exit 0
  elif [ ! -f "tsconfig.json" ]; then
    echo ""
    echo "✅ All checks passed!"
    exit 0
  fi
else
  echo ""
  echo "❌ Some checks failed - fix errors before claiming completion"
  exit 1
fi

