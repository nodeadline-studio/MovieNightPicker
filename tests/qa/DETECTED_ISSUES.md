# Detected Issues - Code Analysis

**Date**: January 2025  
**Analysis Method**: Code Review + Design Principles

## Issues Detected

### 1. ⚠️ Spacing Inconsistency in MovieCard Container

**Location**: `src/components/MovieCard.tsx` line 140

**Issue**: 
```tsx
<div className="w-full max-w-[95vw] md:max-w-5xl lg:max-w-6xl mx-auto space-y-2 md:space-y-4">
```

**Problem**: 
- Container uses `space-y-2` (8px) on mobile and `space-y-4` (16px) on desktop
- Button spacing is now standardized to `mt-3` (12px)
- This creates inconsistency: container gap is 8px/16px, but button spacing is 12px

**Impact**: Visual inconsistency between container spacing and button spacing

**Recommendation**: 
- Change to `space-y-3 md:space-y-3` to match button spacing (12px consistent)
- OR keep `space-y-2` but document why (if intentional hierarchy)

### 2. ⚠️ Height Calculation May Be Too Restrictive

**Location**: `src/pages/Home.tsx` line 255

**Issue**:
```tsx
<div className="flex-1 min-h-0" style={{ maxHeight: 'calc(100% - 14rem)' }}>
```

**Problem**:
- `14rem` = 224px reserved space
- Breakdown: Ad (50px) + Button (~60px) + Spacing (3 * 12px = 36px) = ~146px
- Additional ~78px buffer might be too much, cutting off movie card content

**Impact**: Movie card might be unnecessarily constrained, especially on smaller desktop viewports

**Recommendation**:
- Recalculate: Ad (50px) + Button (60px) + Spacing (36px) = 146px = ~9rem
- Consider `calc(100% - 10rem)` or `calc(100% - 12rem)` for better space utilization
- Test at 1024px, 1280px, 1440px viewport heights

### 3. ⚠️ Button Min-Width May Cause Issues on Small Tablets

**Location**: `src/components/MovieCard.tsx` line 427

**Issue**:
```tsx
w-auto min-w-[200px] md:min-w-[280px]
```

**Problem**:
- On tablets (768px-1024px), button might be too wide relative to content
- 280px is ~36% of 768px viewport width
- Could cause layout issues or look disproportionate

**Impact**: Button might dominate layout on tablet sizes

**Recommendation**:
- Consider responsive min-width: `min-w-[200px] md:min-w-[240px] lg:min-w-[280px]`
- Or use percentage-based: `min-w-[200px] md:min-w-[30%] lg:min-w-[280px]`

### 4. ⚠️ Text Overflow Handling on Desktop

**Location**: `src/components/MovieCard.tsx` line 291

**Issue**:
```tsx
<div className="md:w-3/5 p-3 md:p-6 lg:p-8 flex flex-col flex-1 min-h-0 max-h-[calc(100vh-14rem)] ... overflow-y-auto">
```

**Problem**:
- Overview section removed `overflow-hidden` but parent has `overflow-y-auto`
- If text is very long, it might create nested scrolling (overview scrolls within details scroll)
- User experience could be confusing

**Impact**: Potential double-scroll issue on desktop with very long descriptions

**Recommendation**:
- Ensure overview section doesn't have its own scroll
- Let parent container handle all scrolling
- Verify with movies having 300+ word descriptions

### 5. ⚠️ About Button Z-Index May Conflict

**Location**: `src/components/MovieCard.tsx` line 153

**Issue**:
```tsx
<div className="absolute top-2 md:top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
```

**Problem**:
- z-50 is very high (Tailwind default max is z-50)
- Modal has z-[9999]
- If other elements use high z-index, conflicts might occur
- About button might appear above modals (unintended)

**Impact**: Z-index stacking context issues

**Recommendation**:
- Verify z-index hierarchy: Modals (9999) > About Button (50) > Cards (10-30) > Content (0)
- Consider using z-40 instead of z-50
- Document z-index system

### 6. ⚠️ Mobile Text Expansion May Push Content

**Location**: `src/components/MovieCard.tsx` line 350

**Issue**:
```tsx
className={`mb-2 md:mb-4 flex-1 min-h-0 ${
  isTextExpanded 
    ? '' // Remove max-height when expanded on mobile
    : 'max-h-[120px]' // Only apply max-height on mobile when collapsed
}`}
```

**Problem**:
- When text expands, it removes max-height constraint
- On mobile with long text, expanded content might push button/ad below viewport
- User might need to scroll to see button after expansion

**Impact**: Poor UX - button might be hidden after text expansion

**Recommendation**:
- Consider smooth scroll to button after expansion
- OR maintain max-height but allow scrolling within expanded text
- Test with longest movie descriptions

### 7. ⚠️ Desktop Padding Inconsistency

**Location**: `src/components/MovieCard.tsx` line 426

**Issue**:
```tsx
className="... py-6 md:py-5 px-6 md:px-10 ..."
```

**Problem**:
- Vertical padding: `py-6` (24px) on mobile, `py-5` (20px) on desktop
- Horizontal padding: `px-6` (24px) on mobile, `px-10` (40px) on desktop
- Mobile has more vertical padding than desktop (unusual pattern)

**Impact**: Button height inconsistency between mobile/desktop

**Recommendation**:
- Consider `py-5 md:py-5` for consistency
- OR `py-6 md:py-6` if taller button is desired
- Document design decision

## Design Balance Issues

### Visual Hierarchy
- ✅ Button prominence: Good (gradient, proper sizing)
- ⚠️ Spacing rhythm: Inconsistent (8px/12px/16px mix)
- ✅ Text readability: Good (proper line-height, contrast)

### Consistency
- ⚠️ Spacing system: Mix of 8px, 12px, 16px (should standardize)
- ✅ Button sizing: Consistent across breakpoints
- ⚠️ Padding values: Inconsistent (py-6 vs py-5)

### Responsive Behavior
- ✅ Breakpoints: Proper (768px, 1024px)
- ⚠️ Button width: May be too wide on tablets
- ✅ Text handling: Good (expand on mobile, scroll on desktop)

## Recommendations Summary

### High Priority
1. **Standardize spacing**: Use 12px (mt-3) consistently or document hierarchy
2. **Recalculate height budget**: Verify 14rem is optimal, test at different viewport heights
3. **Fix container spacing**: Change `space-y-2 md:space-y-4` to `space-y-3 md:space-y-3`

### Medium Priority
4. **Button min-width**: Add tablet breakpoint for better proportion
5. **Text expansion UX**: Add scroll-to-button after expansion on mobile
6. **Z-index documentation**: Document z-index system

### Low Priority
7. **Padding consistency**: Align vertical padding between mobile/desktop
8. **Double-scroll prevention**: Verify no nested scrolling on desktop

## Testing Required

### Viewport Sizes
- [ ] Mobile: 375px × 667px (iPhone SE)
- [ ] Mobile: 390px × 844px (iPhone 12)
- [ ] Tablet: 768px × 1024px (iPad)
- [ ] Desktop: 1024px × 768px (Small desktop)
- [ ] Desktop: 1440px × 900px (Standard desktop)
- [ ] Desktop: 1920px × 1080px (Large desktop)

### Content Scenarios
- [ ] Short text (< 100 words)
- [ ] Medium text (100-200 words)
- [ ] Long text (200-300 words)
- [ ] Very long text (300+ words)

### Interaction Tests
- [ ] Text expansion on mobile
- [ ] Button clicks on all sizes
- [ ] Modal open/close
- [ ] Scroll behavior on desktop
- [ ] About button visibility

---

**Next Steps**: 
1. Address high-priority issues
2. Test at all viewport sizes
3. Verify with real content (long descriptions)
4. Document design decisions

