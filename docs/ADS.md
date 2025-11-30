# Ad Integration Guide

**Last Updated**: January 2025  
**Status**: PropellerAds Integrated - Production Ready

---

## 🎯 Overview

MovieNightPicker uses **PropellerAds** for monetization with banner and interstitial ad placements. The system automatically uses mock ads in development and real ads in production.

---

## 📊 Current Ad System

### Ad Provider

- **Primary**: PropellerAds
- **Status**: ✅ Integrated and ready for production
- **Development Mode**: Uses beautiful mock ads automatically
- **Production Mode**: Uses real PropellerAds with environment variables

### Ad Placements

1. **Banner Ad - About Section**
   - Location: Under "About" description text
   - Mobile: 320x100px
   - Desktop: 728x50px
   - Lazy loading: Enabled

2. **Banner Ad - Movie Card**
   - Location: Below movie card
   - Mobile: 320x100px
   - Desktop: 728x50px
   - Lazy loading: Enabled

3. **Interstitial Ad**
   - Trigger: Every 5 movie picks
   - Skip delay: 5 seconds
   - Auto-close: 30 seconds
   - Full-screen overlay
   - Media pause: Automatically pauses all videos/audio when shown

---

## 🔧 Configuration

### Environment Variables

Create `.env` file in production with:

```bash
VITE_PUBLISHER_ID=your_real_publisher_id
VITE_BANNER_ABOUT_AD_UNIT_ID=your_real_banner_id_1
VITE_BANNER_MOVIE_CARD_AD_UNIT_ID=your_real_banner_id_2
VITE_INTERSTITIAL_AD_UNIT_ID=your_real_interstitial_id
```

### Development Mode

- Automatically uses mock ads
- No credentials needed
- Full functionality testing
- Beautiful gradient designs

### Production Mode

- Uses real PropellerAds
- Loads from environment variables
- Analytics tracking enabled
- Error handling implemented

---

## 🏗️ Architecture

### Components

```
src/components/ads/
├── PropellerBannerAd.tsx          # Banner ad component
├── PropellerInterstitialAd.tsx    # Interstitial ad component
└── archive/                        # Legacy/unused components
```

### Configuration

```
src/config/ads/
├── propellerAdsConfig.ts          # Main PropellerAds configuration
├── propellerAdsMock.ts            # Mock ad implementation
└── adProviders/                    # Ad provider management
```

### Hooks

```
src/hooks/ads/
└── usePropellerAds.ts             # PropellerAds hook
```

---

## 🎬 Ad Display Logic

### Banner Ads

- Load when component mounts
- Lazy loading enabled
- Responsive sizing (mobile/desktop)
- Error handling with fallback

### Interstitial Ads

- Triggered every 5 movie picks
- Pauses all media when shown
- Skip button after 5 seconds
- Auto-closes after 30 seconds
- Full-screen overlay

---

## 🧪 Testing

### Development Testing

```bash
# Development mode automatically uses mock ads
npm run dev
```

### Production Testing

1. Set environment variables
2. Build: `npm run build`
3. Test with real PropellerAds credentials
4. Verify ad display and analytics

### Testing Checklist

- [ ] Banner ads display correctly
- [ ] Interstitial ads trigger every 5 picks
- [ ] Media pauses when interstitial shows
- [ ] Skip button works after delay
- [ ] Auto-close works after timeout
- [ ] Analytics tracking works
- [ ] Error handling works
- [ ] Responsive sizing correct

---

## 📈 Analytics

### PropellerAds Analytics

- Ad viewability tracking
- Click-through rate monitoring
- Error logging
- Performance metrics

### Google Analytics Integration

- `propeller_ad_shown` - Ad displayed
- `propeller_ad_clicked` - Ad clicked
- `propeller_ad_error` - Ad error occurred

---

## 🔒 Security

### API Keys

- Stored in environment variables only
- Never committed to repository
- Validated at build time
- Secure API key handling

### User Privacy

- Cookie consent required
- No personal data collection
- GDPR-compliant
- User consent mechanisms

---

## 🐛 Troubleshooting

### Ad Not Showing

1. Check environment variables are set (production)
2. Verify PropellerAds script loaded
3. Check browser console for errors
4. Verify ad blocker is not active
5. Check user consent status

### Interstitial Not Triggering

1. Verify pick counter is incrementing
2. Check if 5 picks have occurred
3. Verify ad system is enabled
4. Check console for errors

### Media Not Pausing

1. Verify `mediaPause.ts` utility is working
2. Check browser console for errors
3. Verify ad component is calling pause function

---

## 📝 Known Issues

### Current Status

- ✅ PropellerAds integrated
- ✅ Mock ads working in development
- ✅ Environment variable support
- ✅ Media pause implemented
- ⚠️ Production ads need real credentials

### Technical Debt

- Monetag components exist but not integrated
- No unified ad provider abstraction
- Some unused legacy components in archive

---

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] Environment variables set
- [ ] PropellerAds credentials configured
- [ ] Analytics tracking verified
- [ ] Error handling tested
- [ ] Responsive design tested
- [ ] Media pause tested

### Post-Deployment

- [ ] Monitor ad performance
- [ ] Track user engagement
- [ ] Monitor error rates
- [ ] Review analytics data

---

## 📚 Additional Resources

- **Configuration**: `src/config/ads/propellerAdsConfig.ts`
- **Components**: `src/components/ads/`
- **Hooks**: `src/hooks/ads/usePropellerAds.ts`
- **Status**: [STATUS.md](STATUS.md)

---

**Last Updated**: January 2025

