// Ad Provider Types and Interfaces

export type AdType = 'banner' | 'interstitial';
export type AdPlacement = 'about' | 'movie-card' | 'movie-load';

export interface AdProviderConfig {
  name: string;
  enabled: boolean;
  priority: number; // Lower number = higher priority
  publisherId?: string;
  adUnitIds?: {
    banner?: {
      aboutSection?: string;
      movieCard?: string;
    };
    interstitial?: {
      movieLoad?: string;
    };
  };
  timeout?: number; // Timeout in milliseconds
}

export interface BannerAdConfig {
  container: string;
  placement: AdPlacement;
  width: number;
  height: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onClick?: () => void;
}

export interface InterstitialAdConfig {
  container: string;
  placement: AdPlacement;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onClick?: () => void;
  onClose?: () => void;
  skipDelay?: number;
  autoCloseAfter?: number;
}

export interface AdLoadResult {
  success: boolean;
  provider: string;
  error?: Error;
}

// Ad Provider Interface
export interface IAdProvider {
  name: string;
  isAvailable(): boolean | Promise<boolean>;
  loadBanner(config: BannerAdConfig): Promise<AdLoadResult>;
  loadInterstitial(config: InterstitialAdConfig): Promise<AdLoadResult>;
  cleanup(container: string): void;
  destroy(): void;
}

