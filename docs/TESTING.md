# Testing Guide

**Last Updated**: January 2025

This guide covers testing standards, procedures, and best practices for MovieNightPicker.

---

## 🧪 Testing Overview

### Test Types

- **Unit Tests**: Component and utility function tests
- **Integration Tests**: Component interaction tests
- **E2E Tests**: End-to-end user flow tests
- **Visual Tests**: UI/UX validation tests

### Test Framework

- **Framework**: Vitest
- **React Testing**: React Testing Library
- **E2E**: Playwright
- **Coverage**: Vitest Coverage

---

## 🚀 Running Tests

### Quick Commands

```bash
npm run test          # Run all tests
npm run test:ui        # Run with UI
npm run test:coverage  # With coverage report
npm run test:e2e      # End-to-end tests
```

### Watch Mode

```bash
npm run test -- --watch
```

---

## ✍️ Writing Tests

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Test edge cases**
4. **Keep tests focused**
5. **Mock external dependencies**

---

## 🎯 Testing Requirements

### Before Submitting PR

- [ ] All tests pass
- [ ] New features have tests
- [ ] Bug fixes include regression tests
- [ ] Test coverage maintained or improved
- [ ] No console errors in tests

### Test Coverage

- Aim for 80%+ coverage
- Focus on critical paths
- Test user interactions
- Test error handling

---

## 📱 Manual Testing

### Responsive Testing

Test at these breakpoints:
- **375px** (Mobile)
- **768px** (Tablet)
- **1024px** (Desktop)
- **1440px** (Wide)

### Browser Testing

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Manual Test Checklist

- [ ] All features work
- [ ] UI looks correct
- [ ] No console errors
- [ ] Responsive at all breakpoints
- [ ] Accessibility works
- [ ] Performance acceptable

---

## 🔍 Test Categories

### Component Tests

Test component:
- Rendering
- Props handling
- User interactions
- State changes
- Error states

### Integration Tests

Test:
- Component interactions
- Data flow
- State management
- API integration
- User workflows

### E2E Tests

Test:
- Complete user flows
- Navigation
- Form submissions
- Data persistence
- Error handling

---

## 🐛 Debugging Tests

### Common Issues

- **Tests failing**: Check test output
- **Async issues**: Use `waitFor`
- **State issues**: Check component state
- **Mock issues**: Verify mocks are set up

### Debugging Tools

- **Test UI**: `npm run test:ui`
- **Console logs**: Use `console.log` in tests
- **React DevTools**: Inspect components
- **Coverage report**: Identify untested code

---

## 📊 Test Coverage

### Coverage Goals

- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

### Viewing Coverage

```bash
npm run test:coverage
```

Coverage report: `coverage/` directory

---

## 🧹 Test Cleanup

### Test Cleanup Policy

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

### Before Committing

Remove:
- Temporary test files (`TEMP_*.spec.ts`, `DEBUG_*.spec.ts`, `VALIDATION_*.spec.ts`)
- Debug console.logs
- Test screenshots (unless needed)
- Test artifacts

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
- `tests/components/` - Component-specific tests
- `tests/functional/` - Core functionality tests
- `tests/security/` - Security validation tests
- `tests/qa/` - QA tests (permanent ones only)

---

## 📝 Test Examples

### Component Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MovieCard } from './MovieCard';

describe('MovieCard', () => {
  it('should display movie title', () => {
    const movie = { title: 'Test Movie', id: 1 };
    render(<MovieCard movie={movie} />);
    expect(screen.getByText('Test Movie')).toBeInTheDocument();
  });

  it('should handle watchlist toggle', () => {
    const movie = { title: 'Test Movie', id: 1 };
    const { getByRole } = render(<MovieCard movie={movie} />);
    const button = getByRole('button', { name: /watchlist/i });
    fireEvent.click(button);
    // Assert watchlist state changed
  });
});
```

### Utility Test

```typescript
import { describe, it, expect } from 'vitest';
import { formatDate } from './utils';

describe('formatDate', () => {
  it('should format date correctly', () => {
    expect(formatDate('2024-01-15')).toBe('January 15, 2024');
  });
});
```

---

## 📚 Additional Resources

- **Vitest Docs**: https://vitest.dev/
- **React Testing Library**: https://testing-library.com/react
- **Playwright**: https://playwright.dev/
- **Development Guide**: [DEVELOPMENT.md](DEVELOPMENT.md)

---

**Last Updated**: January 2025

