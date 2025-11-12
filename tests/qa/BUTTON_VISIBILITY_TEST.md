# Reroll Button Visibility Test

## Issue
Reroll button not visible on mobile/tablet views.

## Fix Applied
Changed `renderButtonOutside={true}` to `renderButtonOutside={isDesktop}` in Home.tsx

## Potential Issues to Verify

### 1. Container Height Constraint
**Location**: `Home.tsx` line 255
```tsx
<div className="flex-1 min-h-0" style={{ maxHeight: 'calc(100% - 110px)' }}>
  <MovieCard ... />
</div>
```

**Problem**: If MovieCard content (including button) exceeds `calc(100% - 110px)`, button may be cut off.

**Test**: 
- [ ] Measure actual MovieCard height on mobile
- [ ] Verify button is within visible area
- [ ] Check if button is cut off by overflow

### 2. Button Rendering Logic
**Location**: `MovieCard.tsx` lines 451-455
```tsx
if (renderButtonOutside) {
  return null; // Desktop: button rendered outside
}
return buttonElement; // Mobile: button rendered inside
```

**Test**:
- [ ] Verify `renderButtonOutside={false}` on mobile (< 768px)
- [ ] Verify button element is returned (not null)
- [ ] Check React DevTools to see if button is in DOM

### 3. CSS Visibility
**Location**: Button classes in `MovieCard.tsx` line 422
```tsx
className="... w-full md:w-auto ..."
```

**Test**:
- [ ] Check computed styles: `display`, `visibility`, `opacity`
- [ ] Verify `width: 100%` on mobile
- [ ] Check for `display: none` or `visibility: hidden`

### 4. Parent Container Overflow
**Location**: `MovieCard.tsx` line 140
```tsx
<div className="w-full max-w-[95vw] ... space-y-2 md:space-y-4">
```

**Test**:
- [ ] Verify parent container doesn't have `overflow: hidden` cutting off button
- [ ] Check if button is positioned outside viewport

### 5. useMediaQuery Hook
**Location**: `Home.tsx` line 41
```tsx
const isDesktop = useMediaQuery({ minWidth: 768 });
```

**Test**:
- [ ] Verify `isDesktop = false` on mobile (< 768px)
- [ ] Verify `isDesktop = true` on desktop (>= 768px)
- [ ] Check if hook updates on resize

## Test Procedure

1. **Mobile Viewport (375px)**
   - Open DevTools → Responsive Design Mode
   - Set width to 375px
   - Check if button is visible
   - Measure button position and size
   - Verify button is clickable

2. **Tablet Viewport (768px)**
   - Set width to 768px (boundary case)
   - Check if button switches from inside to outside
   - Verify no duplicate buttons

3. **Desktop Viewport (1024px)**
   - Set width to 1024px
   - Verify button is rendered outside MovieCard
   - Check button position below ad

## Expected Results

- ✅ Mobile: Button visible inside MovieCard, below movie details
- ✅ Tablet: Button visible (inside or outside depending on breakpoint)
- ✅ Desktop: Button visible outside MovieCard, below ad
- ✅ Button is clickable and functional on all sizes

## Actual Results

[To be filled after testing]

