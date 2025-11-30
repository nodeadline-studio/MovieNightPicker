// PropellerAds Provider Implementation

import { IAdProvider, BannerAdConfig, InterstitialAdConfig, AdLoadResult } from '../types';
import { PropellerAdsLoader, PROPELLER_ADS_CONFIG, AdPlacement } from '../../propellerAdsConfig';
import { MockPropellerAds, MockInterstitialAd } from '../../propellerAdsMock';

export class PropellerAdsProvider implements IAdProvider {
  public readonly name = 'propellerads';
  private isInitialized = false;

  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    // In development, always available (uses mock)
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         window.location.hostname === 'localhost';
    if (isDevelopment) return true;

    // Check if PropellerAds script is loaded
    try {
      const loader = PropellerAdsLoader.getInstance();
      await loader.loadScript();
      return !!(window as Window & { propellerads?: unknown }).propellerads;
    } catch {
      return false;
    }
  }

  async loadBanner(config: BannerAdConfig): Promise<AdLoadResult> {
    try {
      const isDevelopment = process.env.NODE_ENV === 'development' || 
                           (typeof window !== 'undefined' && window.location.hostname === 'localhost');

      if (isDevelopment) {
        // Use mock banner ad
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
      }

      // Load real PropellerAds banner
      const loader = PropellerAdsLoader.getInstance();
      await loader.loadScript();

      if (!(window as Window & { propellerads?: { init: (config: any) => void } }).propellerads) {
        throw new Error('PropellerAds not available');
      }

      const adUnitId = config.placement === 'about'
        ? PROPELLER_ADS_CONFIG.adUnits.banner.aboutSection
        : PROPELLER_ADS_CONFIG.adUnits.banner.movieCard;

      (window as Window & { propellerads: { init: (config: any) => void } }).propellerads.init({
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
      const isDevelopment = process.env.NODE_ENV === 'development' || 
                           (typeof window !== 'undefined' && window.location.hostname === 'localhost');

      if (isDevelopment) {
        // Use mock interstitial ad
        const mockInterstitial = MockInterstitialAd.getInstance();
        mockInterstitial.show({
          onLoad: config.onLoad,
          onClose: config.onClose,
          onError: config.onError,
          skipDelay: config.skipDelay || PROPELLER_ADS_CONFIG.display.interstitial.skipDelay,
          autoCloseAfter: config.autoCloseAfter || PROPELLER_ADS_CONFIG.display.interstitial.autoCloseAfter
        });

        return { success: true, provider: this.name };
      }

      // Load real PropellerAds interstitial
      const loader = PropellerAdsLoader.getInstance();
      await loader.loadScript();

      if (!(window as Window & { propellerads?: { init: (config: any) => void } }).propellerads) {
        throw new Error('PropellerAds not available');
      }

      (window as Window & { propellerads: { init: (config: any) => void } }).propellerads.init({
        container: config.container,
        adUnitId: PROPELLER_ADS_CONFIG.adUnits.interstitial.movieLoad,
        publisherId: PROPELLER_ADS_CONFIG.publisherId,
        type: 'interstitial',
        onLoad: config.onLoad,
        onError: config.onError,
        onClick: config.onClick,
        onClose: config.onClose
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
    // PropellerAds cleanup is handled by the component
    // This is a placeholder for provider-specific cleanup if needed
  }

  destroy(): void {
    // Cleanup any provider-specific resources
    this.isInitialized = false;
  }
}

