# Monetag Ads Implementation Plan

## Requirements Summary

1. **Interstitial Ad (Zone 10184307)**
   - Load BEFORE timer starts (preload)
   - Replace placeholder overlay
   - Show after 5th reroll in pause
   - Close with ad (no separate close button)

2. **Vignette Ad (Zone 10184300)**
   - Show after 1st interstitial ad pause
   - Cycle with notifications

3. **Notifications Ad (Zone 10184301)**
   - Show after 1st interstitial ad pause
   - Cycle with vignette

## Implementation Strategy

### Ad Loading Flow
1. Preload interstitial script when component mounts (before 5th reroll)
2. Show interstitial after 5th reroll (every 5 picks)
3. After first interstitial closes, cycle between vignette and notifications on each movie load

### Script Loading
- Interstitial: `https://quge5.com/88/tag.min.js` with `data-zone="10184307"`
- Vignette: `https://groleegni.net/vignette.min.js` with `data-zone="10184300"`
- Notifications: `https://quge5.com/88/tag.min.js` with `data-zone="10184301"`

