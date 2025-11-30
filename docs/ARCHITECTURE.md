# Architecture Overview

**Last Updated**: January 2025

This document provides an overview of MovieNightPicker's technical architecture, design decisions, and system structure.

---

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────┐
│         User Interface (React)          │
├─────────────────────────────────────────┤
│      State Management (Context)         │
├─────────────────────────────────────────┤
│      Data Fetching (React Query)        │
├─────────────────────────────────────────┤
│         API Layer (TMDB)                │
└─────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

- **React 18.3.1**: UI framework
- **TypeScript**: Type safety
- **Vite 6.3.5**: Build tool and dev server
- **Tailwind CSS**: Styling
- **React Router**: Navigation (if needed)

### State Management

- **React Context API**: Global state
- **React Hooks**: Local state and side effects
- **TanStack Query**: Server state and caching

### Data

- **TMDB API**: Movie data source
- **Local Storage**: User preferences and watchlist
- **React Query Cache**: API response caching

### Testing

- **Vitest**: Test framework
- **React Testing Library**: Component testing
- **Playwright**: E2E testing

---

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ads/            # Ad components
│   │   ├── PropellerBannerAd.tsx
│   │   ├── PropellerInterstitialAd.tsx
│   │   └── ...
│   ├── ui/             # Reusable UI components
│   └── *.tsx           # Feature components
├── config/             # Configuration
│   ├── ads/            # Ad provider configurations
│   ├── api.ts          # API configuration
│   └── ...
├── context/            # React Context providers
│   └── MovieContext.tsx
├── hooks/              # Custom React hooks
│   ├── ads/            # Ad-related hooks
│   └── usePickCounter.ts
├── pages/               # Page components
│   ├── Home.tsx
│   └── ComingSoon.tsx
├── types/               # TypeScript definitions
│   └── index.ts
└── utils/               # Utility functions
    ├── analytics.ts
    ├── cache.ts
    ├── mediaPause.ts
    └── ...
```

---

## 🔄 Data Flow

### Movie Selection Flow

```
User Action
    ↓
Component Handler
    ↓
Context Action
    ↓
API Call (React Query)
    ↓
TMDB API
    ↓
Response Caching
    ↓
State Update
    ↓
UI Re-render
```

### Ad Display Flow

```
User Action (Get Movie)
    ↓
Pick Counter Increment
    ↓
Check Ad Threshold
    ↓
Show Interstitial Ad
    ↓
Pause Media
    ↓
Display Ad
    ↓
User Closes Ad
    ↓
Resume/Continue
```

---

## 🎨 Component Architecture

### Component Hierarchy

```
App
└── Home
    ├── Header
    ├── MovieCard
    │   ├── Poster
    │   ├── Details
    │   └── Actions
    ├── FilterPanel
    ├── WatchlistPanel
    └── Footer
```

### Component Patterns

- **Functional Components**: All components use function syntax
- **Hooks**: Custom hooks for reusable logic
- **Context**: Global state management
- **Props**: TypeScript interfaces for type safety

---

## 🔌 API Integration

### TMDB API

- **Base URL**: Configured in `config/api.ts`
- **Authentication**: API key from environment
- **Caching**: React Query handles caching
- **Error Handling**: Centralized error handling

### API Structure

```typescript
// API calls use React Query
const { data, isLoading, error } = useQuery({
  queryKey: ['movies', filters],
  queryFn: () => fetchMovies(filters)
});
```

---

## 💾 State Management

### Global State (Context)

- **MovieContext**: Movie data and filters
- **Watchlist**: User's saved movies
- **Filter Options**: Current filter settings

### Local State (Hooks)

- Component-specific state
- UI state (modals, panels)
- Form state

### Server State (React Query)

- API responses
- Caching
- Background updates

---

## 🎯 Design Decisions

### Why React Context?

- Simple state management needs
- No external dependencies
- Easy to understand and maintain

### Why React Query?

- Automatic caching
- Background updates
- Error handling
- Loading states

### Why Tailwind CSS?

- Utility-first approach
- Responsive design
- Consistent styling
- Fast development

---

## 🔒 Security

### API Keys

- Stored in environment variables only
- Never committed to repository
- Validated at build time
- Secure API key handling with validation

### Input Validation

- Input sanitization for filter parameters
- Type checking and validation
- Boundary validation for numeric inputs
- URL validation for external links

### Data Privacy

- Local storage only (no server)
- No personal information collected
- Privacy-focused design
- GDPR-compliant cookie consent
- Minimal data collection

### Security Measures

- ✅ API key properly secured
- ✅ Comprehensive input validation
- ✅ Secure error handling (generic messages in production)
- ✅ CORS configuration for development
- ✅ URL validation for external links
- ✅ Content sanitization guidelines

### Security Testing

- Automated security tests
- API key exposure tests
- Input validation tests
- CORS configuration tests
- Error handling tests

### OWASP Compliance

- ✅ A01: Broken Access Control - N/A (no authentication)
- ✅ A02: Cryptographic Failures - Secured
- ✅ A03: Injection - Mitigated
- ✅ A04: Insecure Design - Addressed
- ✅ A05: Security Misconfiguration - Configured
- ✅ A06: Vulnerable Components - Monitored
- ✅ A07: Authentication Failures - N/A
- ✅ A08: Software Integrity Failures - Secured
- ✅ A09: Security Logging Failures - Implemented
- ✅ A10: Server-Side Request Forgery - Mitigated

---

## ⚡ Performance

### Optimization Strategies

- **Code Splitting**: Lazy loading components
- **Image Optimization**: Lazy loading images
- **Caching**: React Query caching
- **Bundle Size**: Tree shaking and minification

### Performance Metrics

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: Optimized for production

---

## 🧪 Testing Architecture

### Test Structure

```
tests/
├── components/        # Component tests
├── functional/        # Functional tests
├── qa/                # QA tests
└── security/          # Security tests
```

### Testing Strategy

- **Unit Tests**: Components and utilities
- **Integration Tests**: Component interactions
- **E2E Tests**: User flows
- **Visual Tests**: UI validation

---

## 📚 Additional Resources

- **Development Guide**: [DEVELOPMENT.md](DEVELOPMENT.md)
- **Testing Guide**: [TESTING.md](TESTING.md)
- **Status**: [STATUS.md](STATUS.md)

---

**Last Updated**: January 2025

