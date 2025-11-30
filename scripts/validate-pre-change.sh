#!/bin/bash
# Pre-Change Validation Script
# Validates that all required checks are performed before code changes

set -e

FILE_PATH="${1:-}"
USER_REQUEST="${2:-}"

if [ -z "$FILE_PATH" ]; then
  echo "Usage: ./scripts/validate-pre-change.sh <file_path> [user_request]"
  exit 1
fi

echo "🔍 Pre-Change Validation for: $FILE_PATH"
echo "=========================================="

# Check 1: File exists
if [ ! -f "$FILE_PATH" ]; then
  echo "⚠️  WARNING: File does not exist (new file creation)"
else
  echo "✅ File exists"
fi

# Check 2: Search for existing implementation
if [ ! -z "$USER_REQUEST" ]; then
  echo ""
  echo "📋 Checking for existing implementations..."
  # Extract keywords from request (simplified)
  KEYWORDS=$(echo "$USER_REQUEST" | grep -oE "(ONLY|NOT|DON'T|DESKTOP|MOBILE|BOTH)" | head -5)
  if [ ! -z "$KEYWORDS" ]; then
    echo "   Found keywords: $KEYWORDS"
  fi
fi

# Check 3: Verify file is in correct location
if [[ "$FILE_PATH" == *"/docs/"* ]] && [[ "$FILE_PATH" != *"/docs/archive/"* ]] && [[ "$FILE_PATH" != *"/docs/analysis/"* ]]; then
  echo "⚠️  WARNING: Creating file in docs/ - check if existing doc should be updated instead"
fi

# Check 4: Check for TypeScript/React patterns
if [[ "$FILE_PATH" == *.tsx ]] || [[ "$FILE_PATH" == *.ts ]]; then
  echo "✅ TypeScript/React file detected"
  echo "   Remember to:"
  echo "   - Check for existing component implementations"
  echo "   - Verify props/types are correct"
  echo "   - Check for duplicate functionality"
fi

echo ""
echo "✅ Pre-change validation complete"
echo "   Remember to run post-change verification after making changes"

