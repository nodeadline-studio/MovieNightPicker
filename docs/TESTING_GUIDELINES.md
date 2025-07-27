# Testing Guidelines

## Test Cleanup Policy

**IMPORTANT**: All test files must clean up after themselves to keep the repository clean.

### Rules for Test Development

1. **Temporary Test Files**: Any `.spec.ts` files created for debugging or validation should be deleted after use
2. **Test Artifacts**: Remove all generated files after testing:
   - Screenshots (`.png` files)
   - Videos (`.mp4` files) 
   - Result folders (`test-results/`)
   - Temporary HTML files

3. **Test File Naming**: Use descriptive names that indicate purpose:
   - `TEMP_DEBUG_*.spec.ts` - For temporary debugging (delete after use)
   - `VALIDATION_*.spec.ts` - For one-time validation (delete after use)
   - Keep only permanent test files for CI/CD

### Cleanup Commands

```bash
# Clean up test artifacts
rm -f tests/qa/*.png
rm -rf test-results/

# Remove temporary test files
rm tests/qa/TEMP_*.spec.ts
rm tests/qa/DEBUG_*.spec.ts
rm tests/qa/VALIDATION_*.spec.ts
```

### Permanent Test Files

Keep only these essential test files:
- `tests/unit/` - Unit tests for utilities
- `tests/functional/` - Core functionality tests
- `tests/security/` - Security validation tests
- `tests/components/` - Component-specific tests

### Before Committing

1. Run cleanup commands
2. Ensure no temporary files remain
3. Keep repository clean and focused

## Production-Ready Code

- Remove all debug console logs before production
- Clean up temporary debugging code
- Ensure no development-only features remain active 