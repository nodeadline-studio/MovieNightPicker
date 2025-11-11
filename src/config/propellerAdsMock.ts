// Mock PropellerAds implementation for development and testing
// This allows testing the ad system without real PropellerAds credentials

export interface MockAdConfig {
  container: string;
  adUnitId: string;
  publisherId: string;
  width: number;
  height: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onClick?: () => void;
}

export class MockPropellerAds {
  private static instance: MockPropellerAds;
  private isInitialized = false;
  private ads: Map<string, MockAdConfig> = new Map();

  private constructor() {}

  public static getInstance(): MockPropellerAds {
    if (!MockPropellerAds.instance) {
      MockPropellerAds.instance = new MockPropellerAds();
    }
    return MockPropellerAds.instance;
  }

  public init(config: MockAdConfig): void {
    this.ads.set(config.container, config);
    
    // Simulate ad loading with random delay
    const delay = Math.random() * 2000 + 500; // 500ms to 2.5s
    
    const timeoutId = setTimeout(() => {
      // Check if ad config still exists (component might have unmounted)
      if (!this.ads.has(config.container)) {
        return; // Component unmounted, don't proceed
      }
      
      const container = document.getElementById(config.container);
      if (!container) {
        config.onError?.(new Error('Container not found'));
        this.ads.delete(config.container);
        return;
      }
      
      // Verify container is still in the DOM
      if (!container.isConnected) {
        config.onError?.(new Error('Container not connected to DOM'));
        this.ads.delete(config.container);
        return;
      }
      
      try {
        // Remove any existing mock ad element (if re-initializing)
        // Find and remove only the mock ad element, not all children
        const existingAd = container.querySelector('[data-mock-ad="true"]');
        if (existingAd) {
          container.removeChild(existingAd);
        }
        
        // Create mock ad content
        const mockAd = this.createMockAd(config);
        // Mark the ad element so we can identify it later
        mockAd.setAttribute('data-mock-ad', 'true');
        
        // Append the mock ad to the dedicated container
        // This container is not managed by React, so it's safe to append directly
        container.appendChild(mockAd);
        
        // Track click events
        mockAd.addEventListener('click', () => {
          config.onClick?.();
        });
        
        config.onLoad?.();
      } catch (error) {
        console.error('Error creating mock ad:', error);
        config.onError?.(error instanceof Error ? error : new Error('Unknown error'));
        this.ads.delete(config.container);
      }
    }, delay);
    
    // Store timeout ID for potential cleanup
    (config as any)._timeoutId = timeoutId;
  }

  private createMockAd(config: MockAdConfig): HTMLElement {
    const adContainer = document.createElement('div');
    adContainer.style.cssText = `
      width: ${config.width}px;
      height: ${config.height}px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      cursor: pointer;
      transition: transform 0.2s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      position: relative;
      overflow: hidden;
    `;

    // Add hover effect
    adContainer.addEventListener('mouseenter', () => {
      adContainer.style.transform = 'scale(1.02)';
    });
    
    adContainer.addEventListener('mouseleave', () => {
      adContainer.style.transform = 'scale(1)';
    });

    // Create ad content based on size
    if (config.width >= 728) {
      // Desktop banner
      adContainer.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">
            🎬 Discover Amazing Movies
          </div>
          <div style="font-size: 14px; opacity: 0.9;">
            Find your next favorite film with our AI-powered recommendations
          </div>
          <div style="margin-top: 12px; font-size: 12px; opacity: 0.7;">
            Mock Ad - ${config.adUnitId}
          </div>
        </div>
      `;
    } else if (config.width >= 320) {
      // Mobile banner
      adContainer.innerHTML = `
        <div style="text-align: center; padding: 12px;">
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">
            🎬 Movie Picker
          </div>
          <div style="font-size: 11px; opacity: 0.9;">
            Find your next movie
          </div>
          <div style="margin-top: 8px; font-size: 10px; opacity: 0.7;">
            Mock Ad
          </div>
        </div>
      `;
    } else {
      // Small banner
      adContainer.innerHTML = `
        <div style="text-align: center; padding: 8px;">
          <div style="font-size: 12px; font-weight: 600;">
            🎬 Movies
          </div>
          <div style="font-size: 9px; opacity: 0.8; margin-top: 2px;">
            Mock Ad
          </div>
        </div>
      `;
    }

    return adContainer;
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public destroy(containerId: string): void {
    const adConfig = this.ads.get(containerId);
    if (adConfig) {
      // Clear any pending timeout
      if ((adConfig as any)._timeoutId) {
        clearTimeout((adConfig as any)._timeoutId);
      }
    }
    
    this.ads.delete(containerId);
    const container = document.getElementById(containerId);
    if (container && container.isConnected) {
      // Remove only the mock ad element, not all content
      // This prevents React removeChild errors
      try {
        const mockAdElement = container.querySelector('[data-mock-ad="true"]');
        if (mockAdElement && mockAdElement.parentNode === container) {
          container.removeChild(mockAdElement);
        }
      } catch (error) {
        // Element might already be removed by React or doesn't exist
        console.warn('Could not remove mock ad element:', error);
      }
    }
  }
}

// Mock interstitial ad
export class MockInterstitialAd {
  private static instance: MockInterstitialAd;
  private isShowing = false;

  private constructor() {}

  public static getInstance(): MockInterstitialAd {
    if (!MockInterstitialAd.instance) {
      MockInterstitialAd.instance = new MockInterstitialAd();
    }
    return MockInterstitialAd.instance;
  }

  public show(config: {
    onLoad?: () => void;
    onClose?: () => void;
    onError?: (error: Error) => void;
    skipDelay?: number;
    autoCloseAfter?: number;
  }): void {
    if (this.isShowing) return;

    this.isShowing = true;
    
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create ad content
    const adContent = document.createElement('div');
    adContent.style.cssText = `
      width: 90%;
      max-width: 400px;
      height: 80%;
      max-height: 600px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
      padding: 40px 20px;
      position: relative;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    `;

    adContent.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 16px;">🎬</div>
      <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 16px; line-height: 1.2;">
        Discover Your Next Movie
      </h2>
      <p style="font-size: 16px; opacity: 0.9; margin-bottom: 24px; line-height: 1.4;">
        Get personalized movie recommendations powered by AI. 
        Find hidden gems and blockbuster hits tailored to your taste.
      </p>
      <div style="display: flex; gap: 12px; margin-top: 24px;">
        <button id="mock-ad-close" style="
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        ">Skip Ad</button>
        <button id="mock-ad-action" style="
          background: white;
          color: #667eea;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        ">Learn More</button>
      </div>
      <div style="
        position: absolute;
        top: 16px;
        right: 16px;
        background: rgba(0, 0, 0, 0.3);
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        opacity: 0.7;
      ">
        Mock Interstitial Ad
      </div>
    `;

    overlay.appendChild(adContent);
    document.body.appendChild(overlay);

    // Add button interactions
    const closeBtn = adContent.querySelector('#mock-ad-close');
    const actionBtn = adContent.querySelector('#mock-ad-action');

    const closeAd = () => {
      document.body.removeChild(overlay);
      this.isShowing = false;
      config.onClose?.();
    };

    closeBtn?.addEventListener('click', closeAd);
    actionBtn?.addEventListener('click', () => {
      // Simulate action
      console.log('Mock ad action clicked');
      closeAd();
    });

    // Auto-close after delay
    if (config.autoCloseAfter && config.autoCloseAfter > 0) {
      setTimeout(closeAd, config.autoCloseAfter * 1000);
    }

    // Skip button delay
    if (config.skipDelay && config.skipDelay > 0) {
      closeBtn!.style.display = 'none';
      setTimeout(() => {
        closeBtn!.style.display = 'block';
      }, config.skipDelay * 1000);
    }

    config.onLoad?.();
  }

  public isAdShowing(): boolean {
    return this.isShowing;
  }
}

// Global mock setup
if (typeof window !== 'undefined') {
  // Mock the global PropellerAds object
  (window as any).propellerads = {
    init: (config: MockAdConfig) => {
      const mockAds = MockPropellerAds.getInstance();
      mockAds.init(config);
    }
  };

  // Add mock interstitial
  (window as any).PropellerAdsInterstitial = MockInterstitialAd.getInstance();
}

export default MockPropellerAds;
