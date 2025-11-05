# PropellerAds Testing Guide

## 🎯 Overview
This guide covers testing the PropellerAds implementation in both development and production environments.

## 🚀 Development Mode (Mock Implementation)

### Features
- **Mock Banner Ads**: Beautiful gradient banners with hover effects
- **Mock Interstitial Ads**: Full-screen modal with skip functionality
- **Automatic Detection**: Automatically uses mock in development
- **No Real Credentials**: Works without PropellerAds account

### Testing Banner Ads

#### 1. About Section Banner
```typescript
// Located under the "About" text
<PropellerBannerAd placement="about" />
```

**Test Steps:**
1. Load the app in development mode
2. Scroll to the "About" section
3. Verify mock banner appears with gradient background
4. Test hover effects and click interactions
5. Check responsive behavior (mobile vs desktop)

#### 2. Movie Card Banner
```typescript
// Located below the movie card
<PropellerBannerAd placement="movie-card" />
```

**Test Steps:**
1. Load a movie card
2. Scroll to bottom of movie card
3. Verify banner appears with appropriate sizing
4. Test click interactions
5. Verify analytics tracking

### Testing Interstitial Ads

#### Triggering Interstitial Ads
```typescript
// Automatically triggered every 5 movie picks
propellerAds.showInterstitial(count);
```

**Test Steps:**
1. Pick 5 movies in a row
2. Verify interstitial ad appears
3. Test skip button (5-second delay)
4. Test "Learn More" button
5. Test auto-close (30 seconds)
6. Verify analytics tracking

#### Manual Testing
```javascript
// Force show interstitial (for testing)
window.PropellerAdsTesting.forceInterstitialAd();
```

## 🔧 Testing Commands

### Enable Debug Mode
```javascript
// In browser console
window.PropellerAdsTesting.enableDebug();
```

### Force Interstitial
```javascript
// Force show interstitial on next pick
window.PropellerAdsTesting.forceInterstitialAd();
```

### Reset Ad State
```javascript
// Reset all ad state
window.PropellerAdsTesting.resetAdState();
```

## 📊 Analytics Testing

### Banner Ad Analytics
```javascript
// Check banner ad events
gtag('event', 'propeller_ad_shown', {
  ad_type: 'banner',
  placement: 'about' // or 'movie-card'
});

gtag('event', 'propeller_ad_clicked', {
  ad_type: 'banner',
  placement: 'about'
});
```

### Interstitial Ad Analytics
```javascript
// Check interstitial ad events
gtag('event', 'propeller_ad_shown', {
  ad_type: 'interstitial',
  placement: 'movie-load'
});
```

## 🎨 Mock Ad Features

### Banner Ad Styling
- **Desktop**: 728x90px with full description
- **Mobile**: 320x50px with condensed text
- **Gradient**: Blue to purple gradient background
- **Hover Effects**: Scale animation on hover
- **Click Tracking**: Analytics integration

### Interstitial Ad Styling
- **Full Screen**: Covers entire viewport
- **Skip Button**: 5-second delay before enabled
- **Auto-Close**: 30-second timeout
- **Responsive**: Adapts to screen size
- **Accessibility**: Keyboard navigation support

## 🔍 Production Testing

### Environment Variables
```bash
# Set production mode
NODE_ENV=production
```

### Real PropellerAds Setup
1. **Get Publisher ID**: From PropellerAds dashboard
2. **Create Ad Units**: Banner and interstitial ad units
3. **Update Configuration**: Replace mock IDs with real ones
4. **Test Integration**: Verify real ads load correctly

### Configuration Update
```typescript
// src/config/propellerAdsConfig.ts
export const PROPELLER_ADS_CONFIG: PropellerAdsConfig = {
  publisherId: 'YOUR_REAL_PUBLISHER_ID',
  adUnits: {
    banner: {
      aboutSection: 'YOUR_REAL_BANNER_ID_1',
      movieCard: 'YOUR_REAL_BANNER_ID_2',
    },
    interstitial: {
      movieLoad: 'YOUR_REAL_INTERSTITIAL_ID',
    },
  },
  // ... rest of config
};
```

## 🐛 Common Issues & Solutions

### Issue: Ads Not Showing
**Solution**: Check `AdPlacement.shouldShowAds()` returns true
```javascript
// Debug in console
console.log('Should show ads:', AdPlacement.shouldShowAds());
```

### Issue: Mock Ads Not Loading
**Solution**: Ensure development mode is detected
```javascript
// Check environment
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Hostname:', window.location.hostname);
```

### Issue: Analytics Not Tracking
**Solution**: Verify gtag is loaded
```javascript
// Check gtag availability
console.log('gtag available:', typeof window.gtag);
```

## 📱 Responsive Testing

### Mobile Testing
- **Banner Size**: 320x50px
- **Interstitial**: Full screen with safe areas
- **Touch Interactions**: Tap to interact
- **Orientation**: Test portrait/landscape

### Desktop Testing
- **Banner Size**: 728x90px
- **Interstitial**: Centered modal
- **Mouse Interactions**: Hover effects
- **Keyboard**: Tab navigation

## 🚀 Performance Testing

### Lazy Loading
```typescript
// Banner ads load when in viewport
performance: {
  lazyLoading: true,
  preloadAds: false,
}
```

### Intersection Observer
- **Root Margin**: 50px
- **Threshold**: 0.1
- **Performance**: Only loads when visible

## 📈 Analytics Integration

### Events Tracked
1. **Ad Shown**: When ad successfully loads
2. **Ad Clicked**: When user clicks ad
3. **Ad Error**: When ad fails to load
4. **Ad Closed**: When user closes ad

### Google Analytics Integration
```javascript
// Automatic gtag integration
gtag('event', 'propeller_ad_shown', {
  ad_type: 'banner',
  placement: 'about'
});
```

## 🔒 Privacy & Compliance

### User Consent
```typescript
// Check user consent
const hasConsent = localStorage.getItem('ad-consent') === 'true';
```

### Ad Blocker Detection
```typescript
// Detect ad blockers
if (window.propellerads === undefined) {
  return false; // Don't show ads
}
```

## 📋 Testing Checklist

### Development Testing
- [ ] Mock banner ads appear
- [ ] Mock interstitial ads trigger every 5 picks
- [ ] Skip button works after 5 seconds
- [ ] Auto-close works after 30 seconds
- [ ] Analytics events fire correctly
- [ ] Responsive design works
- [ ] Accessibility features work

### Production Testing
- [ ] Real PropellerAds credentials configured
- [ ] Real ads load correctly
- [ ] Analytics integration works
- [ ] Performance is acceptable
- [ ] Error handling works
- [ ] User consent flow works

## 🎯 Best Practices

### Development
1. Use mock implementation for testing
2. Enable debug mode for detailed logging
3. Test all ad placements and interactions
4. Verify analytics tracking
5. Test responsive behavior

### Production
1. Use real PropellerAds credentials
2. Monitor ad performance and revenue
3. Track user engagement metrics
4. Optimize ad placement based on data
5. Ensure compliance with ad policies

## 📞 Support

### PropellerAds Documentation
- [PropellerAds Developer Docs](https://propellerads.com/developers)
- [PropellerAds API Reference](https://propellerads.com/api)
- [PropellerAds Support](https://propellerads.com/support)

### Internal Resources
- Mock implementation: `src/config/propellerAdsMock.ts`
- Configuration: `src/config/propellerAdsConfig.ts`
- Components: `src/components/PropellerBannerAd.tsx`, `src/components/PropellerInterstitialAd.tsx`
- Hook: `src/hooks/usePropellerAds.ts`
