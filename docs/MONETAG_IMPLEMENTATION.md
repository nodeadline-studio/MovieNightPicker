# Monetag Ads Implementation Guide

## Overview
This document describes the Monetag ad integration for MovieNightPicker, including interstitial, vignette, and notifications ads.

## Ad Types & Zones

### 1. Interstitial Ad (Zone 10184307)
- **Script**: `https://groleegni.net/vignette.min.js`
- **Pattern**: `(function(s){s.dataset.zone='10184307',s.src='https://groleegni.net/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`
- **When**: Preloads before 5th reroll, shows after 5th reroll (every 5 picks)
- **Container**: Requires element with `data-zone="10184307"` attribute

### 2. Vignette Ad (Zone 10184300)
- **Script**: `https://groleegni.net/vignette.min.js`
- **Pattern**: Same as interstitial but with `data-zone="10184300"`
- **When**: After first commercial break, cycles with notifications

### 3. Notifications Ad (Zone 10184301)
- **Script**: `https://quge5.com/88/tag.min.js`
- **Pattern**: `<script src="https://quge5.com/88/tag.min.js" data-zone="10184301" async data-cfasync="false"></script>`
- **When**: After first commercial break, cycles with vignette

## Implementation Flow

### Interstitial Ad Flow
1. **Preload** (count = 4): Script loads before 5th reroll
2. **Show** (count = 5, 10, 15...): Ad appears in overlay
3. **Close**: User closes ad, triggers next ad in cycle if first break completed

### Vignette/Notifications Cycling
- After first interstitial closes, `markFirstCommercialBreakCompleted()` is called
- On each subsequent movie load, `loadNextAdInCycle()` alternates between:
  - Odd cycles: Vignette (10184300)
  - Even cycles: Notifications (10184301)

## Technical Notes

### 404 Errors
The 404 errors from Monetag domains (e.g., `6opo.com`, `vaimucuvikuwu.net`, `baymr.com`) are **expected** and **non-critical**. Monetag uses redirects and tracking URLs that may return 404s, but the ads will still function correctly. These are internal Monetag analytics/tracking requests and do not affect ad display.

### Script Loading
- Scripts are loaded asynchronously and appended to `<head>` for better compatibility
- Monetag automatically scans for containers with matching `data-zone` attributes
- **CRITICAL**: Containers must be in DOM and visible BEFORE script loads for best results
- If script loads before container, a re-scan is triggered by removing/re-adding `data-zone` attribute
- Scripts use `async` but not `defer` to ensure immediate execution

### Container Requirements
- Container must have `data-zone` attribute matching the script's zone
- Container should have proper dimensions (width: 100%, height: 100%, minHeight: 300px)
- Container must be visible (visibility: visible, display: block, opacity: 1) when ad should display
- Container must be in DOM before script loads for optimal detection
- For interstitial ads: Container is created and made visible 500ms before script loads

## Files

- `src/utils/monetagAds.ts`: Core ad loading and cycling logic
- `src/utils/vignetteAd.ts`: First break tracking and cycling trigger
- `src/components/ads/PropellerInterstitialAd.tsx`: Interstitial ad overlay component
- `src/components/MovieCard.tsx`: Preload trigger and movie loading

## Testing

To test ads:
1. Make 4 rerolls (interstitial preloads)
2. Make 5th reroll (interstitial shows)
3. Close interstitial (first break marked complete)
4. Load new movie (vignette or notifications loads based on cycle)

