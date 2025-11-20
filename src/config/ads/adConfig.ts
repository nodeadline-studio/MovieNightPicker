// Legacy Ad Configuration - DEPRECATED
// This file is kept for backward compatibility but is no longer used
// New ad system uses PropellerAds configuration in propellerAdsConfig.ts

import { logger } from '../utils/logger';

// DEPRECATED: Use PropellerAds configuration instead
export interface AdConfig {
  videoAd: {
    enabled: boolean;
    frequency: number;
    skipDelay: number;
    autoCloseAfter: number;
    preloadEnabled: boolean;
  };
  
  googleAds: {
    enabled: boolean;
    frequency: number;
    publisherId: string;
    videoAdUnitId: string;
    bannerAdUnitId: string;
    skipDelay: number;
  };
  
  general: {
    alternateAdTypes: boolean;
    respectUserInteraction: boolean;
    offlineSkipEnabled: boolean;
    debugMode: boolean;
  };
}

// DEPRECATED: Legacy configuration - use PropellerAds instead
export const AD_CONFIG = {
  general: {
    debugMode: false,
    offlineSkipEnabled: true,
  },
  
  videoAd: {
    frequency: 5,
    skipDelay: 10,
  },
  
  googleAds: {
    frequency: 999999,
    skipDelay: 5,
    videoAdUnitId: 'placeholder',
  },
};

// 📊 Ad Analytics Tracking
export const AD_ANALYTICS = {
  events: {
    videoAdShown: 'video_ad_shown',
    videoAdSkipped: 'video_ad_skipped', 
    videoAdCompleted: 'video_ad_completed',
    videoAdClicked: 'video_ad_clicked',
    googleAdShown: 'google_ad_shown',
    googleAdClicked: 'google_ad_clicked',
    adError: 'ad_error',
  },
  
  // Track ad performance
  metrics: {
    totalAdsShown: 0,
    totalVideoAdsShown: 0,
    totalGoogleAdsShown: 0,
    totalClicks: 0,
    averageWatchTime: 0,
  },
};

// 🔧 Ad Frequency Calculator
export class AdFrequencyManager {
  private pickCount = 0;
  private lastVideoAdAt = 0;
  private lastGoogleAdAt = 0;
  
  constructor() {
    this.loadState();
  }
  
  // Determine what type of ad to show
  shouldShowAd(currentPickCount: number): 'video' | 'google' | null {
    this.pickCount = currentPickCount;
    
    if (!this.hasUserInteracted() || currentPickCount === 0) {
      return null;
    }
    
    // Check if it's time for a video ad
    if (this.shouldShowVideoAd()) {
      this.lastVideoAdAt = currentPickCount;
      this.saveState();
      return 'video';
    }
    
    // Check if it's time for a Google ad (every 2nd potential ad slot)
    if (this.shouldShowGoogleAd()) {
      this.lastGoogleAdAt = currentPickCount;
      this.saveState();
      return 'google';
    }
    
    return null;
  }
  
  private shouldShowVideoAd(): boolean {
    // Video ads are always enabled, just check frequency
    const timeSinceLastVideo = this.pickCount - this.lastVideoAdAt;
    const shouldShow = timeSinceLastVideo >= AD_CONFIG.videoAd.frequency;
    
    // Show video ad every 5th click
    if (this.pickCount > 0 && this.pickCount % 5 === 0) {
      return true;
    }
    
    return shouldShow;
  }
  
  private shouldShowGoogleAd(): boolean {
    // Google ads disabled when frequency is very high (999)
    if (AD_CONFIG.googleAds.frequency >= 999) return false;
    
    const timeSinceLastGoogle = this.pickCount - this.lastGoogleAdAt;
    const timeSinceLastVideo = this.pickCount - this.lastVideoAdAt;
    
    // Show Google ad every 2nd video ad cycle
    return (
      timeSinceLastGoogle >= AD_CONFIG.googleAds.frequency &&
      timeSinceLastVideo >= AD_CONFIG.videoAd.frequency / 2
    );
  }
  
  private hasUserInteracted(): boolean {
    // Always require user interaction (pick count > 0)
    return this.pickCount > 0;
  }
  
  private saveState(): void {
    localStorage.setItem('ad_frequency_state', JSON.stringify({
      lastVideoAdAt: this.lastVideoAdAt,
      lastGoogleAdAt: this.lastGoogleAdAt,
    }));
  }
  
  private loadState(): void {
    try {
      const saved = localStorage.getItem('ad_frequency_state');
      if (saved) {
        const state = JSON.parse(saved);
        this.lastVideoAdAt = state.lastVideoAdAt || 0;
        this.lastGoogleAdAt = state.lastGoogleAdAt || 0;
      }
    } catch (error) {
      console.warn('Failed to load ad frequency state:', error);
    }
  }
  
  // Reset ad frequency (useful for testing)
  reset(): void {
    this.pickCount = 0;
    this.lastVideoAdAt = 0;
    this.lastGoogleAdAt = 0;
    localStorage.removeItem('ad_frequency_state');
  }
  
  // Get debug info
  getDebugInfo() {
    return {
      pickCount: this.pickCount,
      lastVideoAdAt: this.lastVideoAdAt,
      lastGoogleAdAt: this.lastGoogleAdAt,
      nextVideoAdIn: AD_CONFIG.videoAd.frequency - (this.pickCount - this.lastVideoAdAt),
      nextGoogleAdIn: AD_CONFIG.googleAds.frequency - (this.pickCount - this.lastGoogleAdAt),
    };
  }
}

// 🎯 Easy Testing Functions
export const AD_TESTING = {
  // Force show video ad on next pick
  forceVideoAd: () => {
    localStorage.setItem('force_video_ad', 'true');
  },
  
  // Force show Google ad on next pick  
  forceGoogleAd: () => {
    localStorage.setItem('force_google_ad', 'true');
  },
  
  // Reset all ad state
  resetAdState: () => {
    localStorage.removeItem('ad_frequency_state');
    localStorage.removeItem('force_video_ad');
    localStorage.removeItem('force_google_ad');
  },
  
  // Enable debug mode
  enableDebug: () => {
    AD_CONFIG.general.debugMode = true;
    logger.debug('Ad debug mode enabled. Use window.adDebug to access ad state.', undefined, { prefix: 'AdConfig' });
    
    // Make debug info globally available
    (window as any).adDebug = {
      config: AD_CONFIG,
      manager: null, // Will be set by the frequency manager
      resetState: () => {
        localStorage.removeItem('video-ad-last-shown');
        localStorage.removeItem('google-ad-last-shown');
        localStorage.removeItem('force-video-ad');
        localStorage.removeItem('force-google-ad');
      }
    };
  },
};

// Global debug access
if (typeof window !== 'undefined') {
  (window as any).AD_CONFIG = AD_CONFIG;
  (window as any).AD_TESTING = AD_TESTING;
}

export default AD_CONFIG; 