# Ad System Guide - MovieNightPicker

## Overview

MovieNightPicker features a dual ad system:
- **Video Ads**: House video ads (saasbackgrounds.com) - shown every 5 picks (but not on page load)
- **Google Video Ads**: Google IMA SDK integration for programmatic ads (currently disabled)

**⚠️ Note**: Video ads show every 5 picks but will NOT show on the very first pick after page load to prevent intrusive startup behavior.

## 🎯 Quick Testing

Open browser console and run these commands:

```javascript
// Force video ad on next movie pick
AD_TESTING.forceVideoAd();

// Force Google ad on next movie pick  
AD_TESTING.forceGoogleAd();

// Reset all ad state
AD_TESTING.resetAdState();

// Enable debug mode
AD_TESTING.enableDebug();

// Check current ad configuration
console.log(AD_CONFIG);
```

## 📊 Current Configuration

### Video Ads
- **Frequency**: Every 5 picks (excluding first pick after page load)
- **Skip Delay**: 10 seconds
- **Status**: ✅ Active

### Google Video Ads  
- **Frequency**: Disabled (command-only)
- **Skip Delay**: 5 seconds
- **Status**: ⏸️ Disabled

## 🔧 How to Modify Ad Behavior

Edit `src/config/adConfig.ts`:

```typescript
export const AD_CONFIG = {
  videoAd: {
    frequency: 5,        // Change this number to adjust video ad frequency
    skipDelay: 10,       // Seconds before skip button appears
  },
  
  googleAds: {
    frequency: 999999,   // Set to lower number to enable (e.g., 10)
    skipDelay: 5,        // Seconds before skip button appears
  },
};
```

## 🎬 Ad Rotation Logic

The `AdFrequencyManager` handles smart rotation:

1. **Pick Count Tracking**: Counts user movie selections
2. **Frequency Check**: Compares against configured thresholds
3. **Ad Type Selection**: Chooses between video and Google ads
4. **Skip First Pick**: Prevents ads on initial page load pick

## 🧪 Testing Workflow

### Manual Testing
1. Open app in browser
2. Pick several movies (first pick won't show ad)
3. On 5th pick, video ad should appear
4. Use console commands to test specific scenarios

### Debug Mode
```javascript
AD_TESTING.enableDebug();
```
Shows console logs for all ad decisions and state changes.

### Reset Testing
```javascript
AD_TESTING.resetAdState();
```
Clears all counters and flags for fresh testing.

## 📱 Mobile Optimization

Both ad types are optimized for mobile:
- Responsive layouts
- Touch-friendly controls
- Proper video scaling
- Mobile-first design approach

## 🔍 Troubleshooting

### Ad Not Showing
1. Check if you're on the first pick after page load (expected behavior)
2. Verify pick count: `console.log(localStorage.getItem('movie-pick-count'))`
3. Check ad state: `AD_TESTING.resetAdState()` and try again
4. Enable debug mode to see decision logs

### Video Not Playing
1. Check browser autoplay policies
2. Verify video URL accessibility
3. Test with different networks (corporate firewalls may block)

### Google Ads Issues
1. Ensure valid Ad Manager setup
2. Check IMA SDK loading
3. Verify ad unit IDs are correct 