// Ad Configuration for MovieNightPicker
// Easy control panel for all ad settings

import { logger } from '../utils/logger';

export interface AdConfig {
  // Video Ad Settings
  videoAd: {
    enabled: boolean;
    frequency: number; // Show every X picks
    skipDelay: number; // Seconds before skip button appears
    autoCloseAfter: number; // Auto-close after X seconds (0 = never)
    preloadEnabled: boolean;
  };
  
  // Google Ads Settings  
  googleAds: {
    enabled: boolean;
    frequency: number; // Show every X picks (alternates with video)
    publisherId: string;
    videoAdUnitId: string;
    bannerAdUnitId: string;
    skipDelay: number;
  };
  
  // General Ad Settings
  general: {
    alternateAdTypes: boolean; // Alternate between video and Google ads
    respectUserInteraction: boolean; // Only show after user interaction
    offlineSkipEnabled: boolean; // Allow instant skip when offline
    debugMode: boolean; // Enable console logging
  };
}

// 🎛️ EASY CONTROL PANEL - Modify these values to change ad behavior
export const AD_CONFIG = {
  general: {
    debugMode: false,
    offlineSkipEnabled: true,
  },
  
  videoAd: {
    frequency: 5,        // Base frequency - will be adjusted dynamically
    skipDelay: 8,        // Reduced from 10 to 8 seconds for better UX
  },
  
  googleAds: {
    frequency: 999999,   // Disabled - only show via command
    skipDelay: 5,        // Allow skip after 5 seconds
    videoAdUnitId: 'placeholder', // Placeholder until real Ad Manager setup
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

// 🔧 Smart Ad Frequency Calculator with Progressive Strategy
export class AdFrequencyManager {
  private pickCount = 0;
  private lastVideoAdAt = 0;
  private lastGoogleAdAt = 0;
  
  constructor() {
    this.loadState();
  }
  
  // Smart frequency calculation based on user engagement
  private getSmartFrequency(): number {
    // Progressive frequency strategy:
    // - First 5 picks: No ads (user onboarding)
    // - Picks 6-15: Every 7 picks (gentle introduction)
    // - Picks 16+: Every 5 picks (normal frequency)
    // - After 30 picks: Every 3 picks (engaged users)
    
    if (this.pickCount <= 5) {
      return 999; // No ads during onboarding
    } else if (this.pickCount <= 15) {
      return 7; // Gentle introduction
    } else if (this.pickCount <= 30) {
      return 5; // Normal frequency
    } else {
      return 3; // Engaged users - more frequent ads
    }
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
    const smartFrequency = this.getSmartFrequency();
    const timeSinceLastVideo = this.pickCount - this.lastVideoAdAt;
    const shouldShow = timeSinceLastVideo >= smartFrequency;
    
    if (AD_CONFIG.general.debugMode) {
      logger.debug(`Video ad check: pickCount=${this.pickCount}, frequency=${smartFrequency}, timeSince=${timeSinceLastVideo}, shouldShow=${shouldShow}`, undefined, { prefix: 'AdFrequency' });
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
    const smartFrequency = this.getSmartFrequency();
    return {
      pickCount: this.pickCount,
      lastVideoAdAt: this.lastVideoAdAt,
      lastGoogleAdAt: this.lastGoogleAdAt,
      currentFrequency: smartFrequency,
      nextVideoAdIn: smartFrequency - (this.pickCount - this.lastVideoAdAt),
      nextGoogleAdIn: AD_CONFIG.googleAds.frequency - (this.pickCount - this.lastGoogleAdAt),
      userEngagementLevel: this.getUserEngagementLevel(),
    };
  }
  
  // Get user engagement level for analytics
  getUserEngagementLevel(): 'new' | 'learning' | 'active' | 'engaged' {
    if (this.pickCount <= 5) return 'new';
    if (this.pickCount <= 15) return 'learning';
    if (this.pickCount <= 30) return 'active';
    return 'engaged';
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
    (window as WindowWithAdDebug).adDebug = {
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
  interface WindowWithAdDebug extends Window {
    adDebug?: {
      config: typeof AD_CONFIG;
      manager: AdFrequencyManager | null;
      resetState: () => void;
    };
    AD_CONFIG?: typeof AD_CONFIG;
    AD_TESTING?: typeof AD_TESTING;
  }
  
  (window as WindowWithAdDebug).AD_CONFIG = AD_CONFIG;
  (window as WindowWithAdDebug).AD_TESTING = AD_TESTING;
}

export default AD_CONFIG; 