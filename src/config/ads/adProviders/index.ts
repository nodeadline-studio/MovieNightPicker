// Ad Providers Configuration and Initialization

import { AdProviderManager } from './AdProviderManager';
import { PropellerAdsProvider } from './providers/PropellerAdsProvider';
import { GoogleAdSenseProvider } from './providers/GoogleAdSenseProvider';
import { MockAdProvider } from './providers/MockAdProvider';
import { AdType } from './types';

// Initialize provider manager and register providers
export const adProviderManager = AdProviderManager.getInstance();

// Register providers
const propellerAdsProvider = new PropellerAdsProvider();
const googleAdSenseProvider = new GoogleAdSenseProvider();
const mockAdProvider = new MockAdProvider();

// Register providers with priorities
// Lower priority number = higher priority (tried first)
adProviderManager.registerProvider(propellerAdsProvider, 1, ['banner', 'interstitial']);
adProviderManager.registerProvider(googleAdSenseProvider, 2, ['banner', 'interstitial']);
adProviderManager.registerProvider(mockAdProvider, 99, ['banner', 'interstitial']); // Fallback only

// Set provider priority order (can be configured via environment variables)
const getProviderPriority = (adType: AdType): string[] => {
  const envKey = `VITE_${adType.toUpperCase()}_AD_PROVIDERS`;
  const envValue = import.meta.env[envKey] as string | undefined;
  
  if (envValue) {
    return envValue.split(',').map(p => p.trim()).filter(Boolean);
  }
  
  // Default priority: PropellerAds first, then Google AdSense, then Mock
  return ['propellerads', 'google-adsense', 'mock'];
};

// Set priorities for each ad type
adProviderManager.setProviderPriority('banner', getProviderPriority('banner'));
adProviderManager.setProviderPriority('interstitial', getProviderPriority('interstitial'));

export { AdProviderManager };
export * from './types';

