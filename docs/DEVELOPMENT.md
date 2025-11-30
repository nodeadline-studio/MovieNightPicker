# Development Guide

**Last Updated**: January 2025

This guide covers development workflows, best practices, and project-specific guidelines for MovieNightPicker.

---

## 🚀 Quick Start

### Setup

```bash
npm install
npm run dev
```

### Development Server

- **URL**: http://localhost:5173
- **Hot Reload**: Enabled
- **Type Checking**: Real-time

---

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ads/            # Ad components
│   ├── ui/             # Reusable UI components
│   └── *.tsx           # Feature components
├── config/             # Configuration
│   └── ads/            # Ad provider configs
├── context/            # React Context providers
├── hooks/              # Custom React hooks
│   └── ads/            # Ad-related hooks
├── pages/               # Page components
├── types/               # TypeScript definitions
└── utils/               # Utility functions
```

---

## 🛠️ Development Workflow

### Before Making Changes

1. **Check cursor rules**: Review `.cursorrules` for project-specific guidelines
2. **Check existing docs**: Look in `docs/archive/` for related work
3. **Update existing docs**: Don't create new documentation files
4. **Check for existing fixes**: Review recent changes to avoid duplicates

### Making Changes

1. **Create feature branch**: `git checkout -b feature/your-feature`
2. **Write code**: Follow coding standards
3. **Write tests**: Add tests for new features
4. **Update docs**: Update relevant documentation
5. **Test locally**: Run tests and manual testing

### After Making Changes

1. **Run build**: `npm run build` (must exit 0)
2. **Run linter**: `npm run lint`
3. **Run tests**: `npm run test`
4. **Update CHANGELOG**: Add entry to `docs/CHANGELOG.md`
5. **Test manually**: Verify in browser at all breakpoints

---

## 💻 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper types
- Use meaningful names
- Keep functions focused

### React

- Use functional components with hooks
- Follow React best practices
- Use TypeScript for props
- Keep components small and focused

### Styling

- Use Tailwind CSS utilities
- Test at breakpoints: 375px, 768px, 1024px, 1440px
- Maintain consistent spacing
- Follow existing patterns

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `PascalCase.ts`
- Hooks: `useCamelCase.ts`

---

## 🧪 Testing

### Running Tests

```bash
npm run test          # Run all tests
npm run test:ui        # Run with UI
npm run test:coverage  # With coverage
npm run test:e2e      # End-to-end tests
```

### Writing Tests

- Test new features
- Test edge cases
- Test error handling
- Maintain coverage

See [TESTING.md](TESTING.md) for detailed guidelines.

---

## 🎨 UI/UX Guidelines

### Responsive Design

Always test at these breakpoints:
- **Mobile**: 375px
- **Tablet**: 768px
- **Desktop**: 1024px
- **Wide**: 1440px

### Accessibility

- Use proper ARIA labels
- Ensure keyboard navigation
- Maintain color contrast
- Test with screen readers

### Performance

- Optimize images
- Lazy load components
- Minimize bundle size
- Test performance metrics

---

## 🔧 Common Tasks

### Adding a New Component

1. Create component file in `src/components/`
2. Add TypeScript types
3. Write component with Tailwind styling
4. Add tests
5. Update documentation if needed

### Adding a New Feature

1. Create feature branch
2. Implement feature
3. Add tests
4. Update `STATUS.md` and `CHANGELOG.md`
5. Test at all breakpoints
6. Submit PR

### Fixing a Bug

1. Reproduce the bug
2. Write a test that fails
3. Fix the bug
4. Verify test passes
5. Update `CHANGELOG.md`
6. Submit PR

---

## 📝 Documentation

### When to Update Docs

- Adding new features
- Changing architecture
- Fixing significant bugs
- Changing workflows

### Documentation Files

- **STATUS.md**: Project status and features
- **CHANGELOG.md**: Version history
- **ARCHITECTURE.md**: System architecture
- **Feature docs**: Feature-specific documentation

### Documentation Guidelines

1. **Update existing docs**: Don't create new files
2. **Check archive**: Look in `docs/archive/` first
3. **Be specific**: Include examples and code
4. **Keep current**: Update when making changes

---

## 🚨 Common Pitfalls

### To Avoid

- Creating duplicate documentation files
- Not testing at all breakpoints
- Forgetting to update CHANGELOG
- Using `any` types
- Not following existing patterns
- Implementing opposite of what was requested
- Not checking if problem was self-created
- Ignoring repeated corrections

### Best Practices

- Update existing docs
- Test thoroughly
- Follow coding standards
- Write tests
- Keep commits focused
- Check existing implementations before modifying
- Verify understanding before implementing
- Acknowledge feedback patterns

## 🛡️ Pattern Prevention

### Pre-Change Checklist

Before making ANY code change:

1. **Read request carefully**: Extract all keywords (ONLY, NOT, DON'T, etc.)
2. **Check existing features**: Search codebase for existing implementation
3. **Review recent changes**: Check last 5 changes to target file
4. **Verify understanding**: Confirm doing what user asked (not opposite)
5. **Measure current state**: Viewport, container, API, DOM measurements
6. **Check if self-created**: Review recent changes for this issue
7. **Extract all items**: List each item from multi-item requests
8. **Identify scope**: Desktop/mobile/both from keywords
9. **Check documentation**: Look for existing docs before creating new
10. **Verify minimal change**: Only what user asked, nothing more

### Post-Change Verification

After making code changes:

1. **Run build**: `npm run build` (must exit 0)
2. **Run linter**: `npm run lint` (must exit 0)
3. **Run type-check**: `npm run type-check` (must exit 0)
4. **Browser test**: Use browser tools for UI changes
5. **Test functionality**: Actually test, don't assume
6. **Calculate completion**: Completed X/Y items (Z%)
7. **List remaining**: Explicitly list incomplete items
8. **Provide evidence**: Screenshots, exit codes, test results
9. **Never claim without proof**: No "should work now" without evidence
10. **Verify no regressions**: Ensure existing features still work

---

## 🔍 Debugging

### Development Tools

- **React DevTools**: Component inspection
- **Browser DevTools**: Network, console, performance
- **TypeScript**: Type checking
- **ESLint**: Code quality

### Common Issues

- **Build errors**: Check TypeScript types
- **Runtime errors**: Check browser console
- **Styling issues**: Check Tailwind classes
- **State issues**: Use React DevTools

---

## 📚 Additional Resources

- **Project Status**: [STATUS.md](STATUS.md)
- **Testing Guide**: [TESTING.md](TESTING.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Contributing**: [../CONTRIBUTING.md](../CONTRIBUTING.md)

---

**Last Updated**: January 2025

