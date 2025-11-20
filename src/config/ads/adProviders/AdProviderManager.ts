// Ad Provider Manager - Handles multiple providers with fallback

import { IAdProvider, AdType, AdPlacement, BannerAdConfig, InterstitialAdConfig, AdLoadResult } from './types';

export class AdProviderManager {
  private static instance: AdProviderManager;
  private providers: Map<string, IAdProvider> = new Map();
  private providerPriority: Map<AdType, string[]> = new Map();
  private providerHealth: Map<string, boolean> = new Map();

  private constructor() {
    // Initialize provider priority lists
    this.providerPriority.set('banner', []);
    this.providerPriority.set('interstitial', []);
  }

  public static getInstance(): AdProviderManager {
    if (!AdProviderManager.instance) {
      AdProviderManager.instance = new AdProviderManager();
    }
    return AdProviderManager.instance;
  }

  // Register a provider
  public registerProvider(provider: IAdProvider, priority: number, adTypes: AdType[]): void {
    this.providers.set(provider.name, provider);
    
    // Update priority lists for each ad type
    adTypes.forEach(adType => {
      const currentList = this.providerPriority.get(adType) || [];
      const newList = [...currentList, provider.name];
      // Sort by priority (we'll need to track priorities separately)
      this.providerPriority.set(adType, newList);
    });
    
    // Initialize health status
    this.providerHealth.set(provider.name, true);
  }

  // Set provider priority order for an ad type
  public setProviderPriority(adType: AdType, providerNames: string[]): void {
    // Filter to only include registered providers
    const validProviders = providerNames.filter(name => this.providers.has(name));
    this.providerPriority.set(adType, validProviders);
  }

  // Get providers in priority order for an ad type
  private getProvidersForAdType(adType: AdType): IAdProvider[] {
    const priorityList = this.providerPriority.get(adType) || [];
    const providers: IAdProvider[] = [];
    
    // Add providers in priority order
    priorityList.forEach(name => {
      const provider = this.providers.get(name);
      if (provider && this.providerHealth.get(name) !== false) {
        providers.push(provider);
      }
    });
    
    // Add any other registered providers not in priority list
    this.providers.forEach((provider, name) => {
      if (!priorityList.includes(name) && this.providerHealth.get(name) !== false) {
        providers.push(provider);
      }
    });
    
    return providers;
  }

  // Load banner ad with fallback
  public async loadBanner(config: BannerAdConfig): Promise<AdLoadResult> {
    const providers = this.getProvidersForAdType('banner');
    
    for (const provider of providers) {
      try {
        // Check if provider is available
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          console.log(`Provider ${provider.name} not available, trying next...`);
          continue;
        }

        // Try to load ad
        const result = await provider.loadBanner(config);
        
        if (result.success) {
          // Mark provider as healthy
          this.providerHealth.set(provider.name, true);
          return result;
        } else {
          // Mark provider as potentially unhealthy (but don't permanently disable)
          console.warn(`Provider ${provider.name} failed:`, result.error?.message);
        }
      } catch (error) {
        console.error(`Error loading banner from ${provider.name}:`, error);
        // Continue to next provider
      }
    }
    
    // All providers failed
    return {
      success: false,
      provider: 'none',
      error: new Error('All ad providers failed to load banner ad')
    };
  }

  // Load interstitial ad with fallback
  public async loadInterstitial(config: InterstitialAdConfig): Promise<AdLoadResult> {
    const providers = this.getProvidersForAdType('interstitial');
    
    for (const provider of providers) {
      try {
        // Check if provider is available
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          console.log(`Provider ${provider.name} not available, trying next...`);
          continue;
        }

        // Try to load ad with timeout
        const timeout = config.skipDelay ? (config.skipDelay + 5) * 1000 : 5000;
        const loadPromise = provider.loadInterstitial(config);
        const timeoutPromise = new Promise<AdLoadResult>((_, reject) => {
          setTimeout(() => reject(new Error('Provider timeout')), timeout);
        });

        const result = await Promise.race([loadPromise, timeoutPromise]);
        
        if (result.success) {
          // Mark provider as healthy
          this.providerHealth.set(provider.name, true);
          return result;
        } else {
          console.warn(`Provider ${provider.name} failed:`, result.error?.message);
        }
      } catch (error) {
        console.error(`Error loading interstitial from ${provider.name}:`, error);
        // Continue to next provider
      }
    }
    
    // All providers failed
    return {
      success: false,
      provider: 'none',
      error: new Error('All ad providers failed to load interstitial ad')
    };
  }

  // Cleanup ad from a specific container
  public cleanup(container: string, providerName?: string): void {
    if (providerName) {
      const provider = this.providers.get(providerName);
      if (provider) {
        provider.cleanup(container);
      }
    } else {
      // Cleanup from all providers
      this.providers.forEach(provider => {
        provider.cleanup(container);
      });
    }
  }

  // Get provider by name
  public getProvider(name: string): IAdProvider | undefined {
    return this.providers.get(name);
  }

  // Get all registered providers
  public getAllProviders(): IAdProvider[] {
    return Array.from(this.providers.values());
  }

  // Reset provider health (useful for testing)
  public resetProviderHealth(): void {
    this.providerHealth.forEach((_, name) => {
      this.providerHealth.set(name, true);
    });
  }
}

export default AdProviderManager;

