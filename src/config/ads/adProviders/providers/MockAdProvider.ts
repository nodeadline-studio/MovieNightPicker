// Mock Ad Provider for Development/Testing

import { IAdProvider, BannerAdConfig, InterstitialAdConfig, AdLoadResult } from '../types';
import { MockPropellerAds, MockInterstitialAd } from '../../propellerAdsMock';
import { PROPELLER_ADS_CONFIG, AdPlacement } from '../../propellerAdsConfig';

export class MockAdProvider implements IAdProvider {
  public readonly name = 'mock';

  async isAvailable(): Promise<boolean> {
    // Always available in development
    const isDevelopment = import.meta.env.MODE === 'development' || 
                         (typeof window !== 'undefined' && window.location.hostname === 'localhost');
    return isDevelopment;
  }

  async loadBanner(config: BannerAdConfig): Promise<AdLoadResult> {
    try {
      const mockAds = MockPropellerAds.getInstance();
      const adUnitId = config.placement === 'about' 
        ? PROPELLER_ADS_CONFIG.adUnits.banner.aboutSection
        : PROPELLER_ADS_CONFIG.adUnits.banner.movieCard;

      mockAds.init({
        container: config.container,
        adUnitId: adUnitId,
        publisherId: PROPELLER_ADS_CONFIG.publisherId,
        width: config.width,
        height: config.height,
        onLoad: config.onLoad,
        onError: config.onError,
        onClick: config.onClick
      });

      return { success: true, provider: this.name };
    } catch (error) {
      return {
        success: false,
        provider: this.name,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  async loadInterstitial(config: InterstitialAdConfig): Promise<AdLoadResult> {
    try {
      const mockInterstitial = MockInterstitialAd.getInstance();
      mockInterstitial.show({
        onLoad: config.onLoad,
        onClose: config.onClose,
        onError: config.onError,
        skipDelay: config.skipDelay || PROPELLER_ADS_CONFIG.display.interstitial.skipDelay,
        autoCloseAfter: config.autoCloseAfter || PROPELLER_ADS_CONFIG.display.interstitial.autoCloseAfter
      });

      return { success: true, provider: this.name };
    } catch (error) {
      return {
        success: false,
        provider: this.name,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  cleanup(container: string): void {
    // Mock ads cleanup is handled by the mock implementation
  }

  destroy(): void {
    // No cleanup needed for mock provider
  }
}

