# Contributing to MovieNightPicker

Thank you for your interest in contributing to MovieNightPicker! This document provides guidelines and instructions for contributing.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)

---

## 🤝 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone <your-fork-url>
   cd MovieNightPicker
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## 🔄 Development Workflow

### 1. Before Making Changes

- **Check existing issues**: Search for related issues or create a new one
- **Read documentation**: Review [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- **Check cursor rules**: Review `.cursorrules` for project-specific guidelines
- **Update existing docs**: Don't create new documentation files - update existing ones

### 2. Making Changes

- **Follow coding standards**: See [Coding Standards](#coding-standards)
- **Write tests**: See [Testing](#testing)
- **Update documentation**: Update relevant docs in `docs/`
- **Keep commits focused**: One feature/fix per commit

### 3. Before Submitting

- **Run tests**: `npm run test`
- **Run linter**: `npm run lint`
- **Build project**: `npm run build` (must exit 0)
- **Test manually**: Test your changes in the browser
- **Update CHANGELOG**: Add entry to [CHANGELOG.md](docs/CHANGELOG.md)

---

## 💻 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper types
- Follow existing code patterns
- Use meaningful variable and function names

### React

- Use functional components with hooks
- Follow React best practices
- Use TypeScript for props and state
- Keep components focused and reusable

### Styling

- Use Tailwind CSS utilities
- Follow responsive design patterns
- Test at breakpoints: 375px, 768px, 1024px, 1440px
- Maintain consistent spacing and design

### File Organization

- Follow existing project structure
- Place components in appropriate directories
- Use descriptive file names
- Keep files focused (single responsibility)

### Code Quality

- Write clean, readable code
- Add comments for complex logic
- Remove unused imports and variables
- Follow ESLint rules

---

## 🧪 Testing

### Running Tests

```bash
npm run test          # Run all tests
npm run test:ui        # Run tests with UI
npm run test:coverage # Run tests with coverage
npm run test:e2e      # Run end-to-end tests
```

### Writing Tests

- Write tests for new features
- Test edge cases and error handling
- Maintain or improve test coverage
- Follow existing test patterns

### Test Requirements

- All tests must pass
- New features must have tests
- Bug fixes must include regression tests
- Tests should be fast and reliable

See [docs/TESTING.md](docs/TESTING.md) for detailed testing guidelines.

---

## 📝 Documentation

### Documentation Guidelines

1. **Update Existing Docs**: Always update existing documentation files
2. **Check Archive**: Look in `docs/archive/` before creating new docs
3. **Be Specific**: Include code examples and clear instructions
4. **Keep Current**: Update docs when making changes

### Documentation Files

- **STATUS.md**: Update when adding features or changing status
- **CHANGELOG.md**: Add entry for your changes
- **DEVELOPMENT.md**: Update if changing development workflow
- **Feature-specific docs**: Update relevant feature documentation

### Code Comments

- Add JSDoc comments for public functions
- Explain complex logic
- Keep comments up-to-date with code

---

## 🔀 Pull Request Process

### Before Submitting

1. **Update CHANGELOG.md**: Add entry describing your changes
2. **Run all checks**: Tests, lint, build must pass
3. **Test manually**: Verify functionality in browser
4. **Update documentation**: Update relevant docs
5. **Clean up**: Remove debug code, console.logs, etc.

### PR Description

Include:
- **What**: What changes were made
- **Why**: Why these changes were needed
- **How**: How the changes work
- **Testing**: How you tested the changes
- **Screenshots**: If UI changes were made

### PR Checklist

- [ ] Code follows project standards
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Build passes (`npm run build`)
- [ ] Linter passes (`npm run lint`)
- [ ] Manual testing completed
- [ ] No console errors
- [ ] Responsive design tested (375/768/1024/1440px)

### Review Process

- Maintainers will review your PR
- Address feedback promptly
- Be open to suggestions and improvements
- Keep PR focused and manageable

---

## 🐛 Reporting Issues

### Before Reporting

1. **Search existing issues**: Check if issue already exists
2. **Check documentation**: Review docs for solutions
3. **Reproduce**: Ensure you can reproduce the issue

### Issue Template

- **Description**: Clear description of the issue
- **Steps to Reproduce**: Detailed steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: Browser, OS, version
- **Screenshots**: If applicable

---

## 📚 Additional Resources

- **Documentation**: [docs/README.md](docs/README.md)
- **Development Guide**: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- **Testing Guide**: [docs/TESTING.md](docs/TESTING.md)
- **Cursor Rules**: [.cursorrules](.cursorrules)

---

## ❓ Questions?

- Check documentation first
- Search existing issues
- Ask in discussions (if available)

---

**Thank you for contributing to MovieNightPicker!** 🎬

