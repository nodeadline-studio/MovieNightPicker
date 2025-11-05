// PropellerAds Configuration for MovieNightPicker
// Configuration for PropellerAds integration with proper TypeScript interfaces

// Import mock implementation for development
import MockPropellerAds, { MockInterstitialAd } from './propellerAdsMock';

export interface PropellerAdsConfig {
  // Publisher settings
  publisherId: string;
  
  // Ad unit configurations
  adUnits: {
    // Banner ads for content placement
    banner: {
      aboutSection: string; // Ad unit ID for under about text
      movieCard: string;    // Ad unit ID for below movie card
    };
    
    // Interstitial ads for between movie loads
    interstitial: {
      movieLoad: string;    // Ad unit ID for between movie loads
    };
  };
  
  // Display settings
  display: {
    // Banner ad dimensions
    bannerSizes: {
      mobile: [number, number];
      desktop: [number, number];
    };
    
    // Interstitial settings
    interstitial: {
      skipDelay: number;    // Seconds before skip button appears
      autoCloseAfter: number; // Auto-close after X seconds (0 = never)
    };
  };
  
  // Performance settings
  performance: {
    lazyLoading: boolean;
    preloadAds: boolean;
    debugMode: boolean;
  };
}

// Development mode flag
const isDevelopment = process.env.NODE_ENV === 'development' || 
                     typeof window !== 'undefined' && window.location.hostname === 'localhost';

// Default configuration - uses mock data in development, real IDs in production
export const PROPELLER_ADS_CONFIG: PropellerAdsConfig = {
  publisherId: isDevelopment ? 'MOCK_PUBLISHER_ID' : 'YOUR_PUBLISHER_ID',
  
  adUnits: {
    banner: {
      aboutSection: isDevelopment ? 'MOCK_BANNER_ABOUT' : 'YOUR_BANNER_AD_UNIT_ID_1',
      movieCard: isDevelopment ? 'MOCK_BANNER_MOVIE' : 'YOUR_BANNER_AD_UNIT_ID_2',
    },
    interstitial: {
      movieLoad: isDevelopment ? 'MOCK_INTERSTITIAL' : 'YOUR_INTERSTITIAL_AD_UNIT_ID',
    },
  },
  
  display: {
    bannerSizes: {
      mobile: [320, 50],   // Mobile banner size
      desktop: [728, 90],  // Desktop banner size
    },
    interstitial: {
      skipDelay: 5,        // Allow skip after 5 seconds
      autoCloseAfter: 30,  // Auto-close after 30 seconds
    },
  },
  
  performance: {
    lazyLoading: true,
    preloadAds: false,     // Disable preloading for better performance
    debugMode: isDevelopment, // Enable debug mode in development
  },
};

// PropellerAds script loading utility
export class PropellerAdsLoader {
  private static instance: PropellerAdsLoader;
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): PropellerAdsLoader {
    if (!PropellerAdsLoader.instance) {
      PropellerAdsLoader.instance = new PropellerAdsLoader();
    }
    return PropellerAdsLoader.instance;
  }

  public async loadScript(): Promise<void> {
    if (this.isLoaded) {
      return Promise.resolve();
    }

    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = new Promise((resolve, reject) => {
      // In development, use mock implementation
      if (isDevelopment) {
        // Mock implementation is already loaded via import
        this.isLoaded = true;
        this.isLoading = false;
        resolve();
        return;
      }

      // Check if PropellerAds script is already loaded
      if ((window as Window & { propellerads?: unknown }).propellerads) {
        this.isLoaded = true;
        this.isLoading = false;
        resolve();
        return;
      }

      // Load PropellerAds script
      const script = document.createElement('script');
      script.src = 'https://propellerads.com/ads-sdk.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        this.isLoaded = true;
        this.isLoading = false;
        resolve();
      };
      
      script.onerror = () => {
        this.isLoading = false;
        reject(new Error('Failed to load PropellerAds script'));
      };
      
      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  public isScriptLoaded(): boolean {
    return this.isLoaded;
  }
}

// Ad placement utilities
export const AdPlacement = {
  // Get appropriate banner size based on screen width
  getBannerSize(): [number, number] {
    if (typeof window === 'undefined') return PROPELLER_ADS_CONFIG.display.bannerSizes.desktop;
    
    const isMobile = window.innerWidth < 768;
    return isMobile 
      ? PROPELLER_ADS_CONFIG.display.bannerSizes.mobile
      : PROPELLER_ADS_CONFIG.display.bannerSizes.desktop;
  },
  
  // Check if ads should be shown (respect user preferences, etc.)
  shouldShowAds(): boolean {
    // Add logic to check user preferences, ad blockers, etc.
    if (typeof window === 'undefined') return false;
    
    // In development, always show mock ads
    if (isDevelopment) {
      return true;
    }
    
    // Check for ad blocker
    if ((window as Window & { propellerads?: unknown }).propellerads === undefined) {
      return false;
    }
    
    // Check user consent (if you have cookie consent)
    const hasConsent = localStorage.getItem('ad-consent') === 'true';
    return hasConsent;
  },
  
  // Generate unique ad container ID
  generateAdId(placement: string): string {
    return `propeller-ad-${placement}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
};

// Analytics tracking for PropellerAds
export const PropellerAdsAnalytics = {
  trackAdShown: (adType: 'banner' | 'interstitial', placement: string) => {
    if (PROPELLER_ADS_CONFIG.performance.debugMode) {
      console.log(`PropellerAds ${adType} shown at ${placement}`);
    }
    
    // Track with your analytics system
    if (typeof window !== 'undefined' && (window as Window & { gtag?: unknown }).gtag) {
      ((window as Window & { gtag: (command: string, event: string, params: Record<string, unknown>) => void }).gtag)('event', 'propeller_ad_shown', {
        ad_type: adType,
        placement: placement,
      });
    }
  },
  
  trackAdClicked: (adType: 'banner' | 'interstitial', placement: string) => {
    if (PROPELLER_ADS_CONFIG.performance.debugMode) {
      console.log(`PropellerAds ${adType} clicked at ${placement}`);
    }
    
    if (typeof window !== 'undefined' && (window as Window & { gtag?: unknown }).gtag) {
      ((window as Window & { gtag: (command: string, event: string, params: Record<string, unknown>) => void }).gtag)('event', 'propeller_ad_clicked', {
        ad_type: adType,
        placement: placement,
      });
    }
  },
  
  trackAdError: (adType: 'banner' | 'interstitial', placement: string, error: string) => {
    console.error(`PropellerAds ${adType} error at ${placement}:`, error);
    
    if (typeof window !== 'undefined' && (window as Window & { gtag?: unknown }).gtag) {
      ((window as Window & { gtag: (command: string, event: string, params: Record<string, unknown>) => void }).gtag)('event', 'propeller_ad_error', {
        ad_type: adType,
        placement: placement,
        error: error,
      });
    }
  }
};

export default PROPELLER_ADS_CONFIG;
