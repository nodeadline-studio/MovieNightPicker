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
    const baseDelay = Math.random() * 2000 + 500; // 500ms to 2.5s
    const delay = baseDelay + 100; // Add extra 100ms to ensure DOM is ready
    
    const timeoutId = setTimeout(() => {
      // Check if ad config still exists (component might have unmounted)
      if (!this.ads.has(config.container)) {
        return; // Component unmounted, don't proceed
      }
      
      // Retry mechanism with exponential backoff
      const maxRetries = 3;
      let retryCount = 0;
      
      const tryInit = (): void => {
      const container = document.getElementById(config.container);
        
        if (!container) {
          retryCount++;
          if (retryCount < maxRetries) {
            // Retry with exponential backoff: 50ms, 100ms, 200ms
            setTimeout(tryInit, 50 * Math.pow(2, retryCount - 1));
            return;
          }
          // Max retries reached
          config.onError?.(new Error(`Container not found after ${maxRetries} retries: ${config.container}`));
          this.ads.delete(config.container);
          return;
        }
        
        // Verify container is still in the DOM
        if (!container.isConnected) {
          retryCount++;
          if (retryCount < maxRetries) {
            setTimeout(tryInit, 50 * Math.pow(2, retryCount - 1));
            return;
          }
          config.onError?.(new Error(`Container not connected to DOM after ${maxRetries} retries: ${config.container}`));
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
      };
      
      // Start retry mechanism
      tryInit();
    }, delay);
    
    // Store timeout ID for potential cleanup
    (config as any)._timeoutId = timeoutId;
  }

  private createMockAd(config: MockAdConfig): HTMLElement {
    const adContainer = document.createElement('div');
    // Use max-width instead of fixed width to prevent letterboxing
    // On desktop, ensure ad displays at full size (728x50)
    // On mobile, scale down proportionally
    const isDesktop = config.width >= 728;
    adContainer.style.cssText = `
      ${isDesktop ? `width: ${config.width}px;` : 'width: 100%; max-width: ${config.width}px;'}
      height: ${config.height}px;
      margin: 0 auto;
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
      overflow: visible;
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
      // Desktop banner (50px height - reduced padding to fit)
      adContainer.innerHTML = `
        <div style="text-align: center; padding: 8px 20px; height: 100%; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 2px; line-height: 1.2;">
            🎬 Discover Amazing Movies
          </div>
          <div style="font-size: 11px; opacity: 0.9; line-height: 1.2;">
            Find your next favorite film with our smart recommendations
          </div>
          <div style="margin-top: 3px; font-size: 9px; opacity: 0.7; line-height: 1.1;">
            Mock Ad - ${config.adUnitId}
          </div>
        </div>
      `;
    } else if (config.width >= 320) {
      // Mobile banner (100px height - increased padding and font sizes)
      adContainer.innerHTML = `
        <div style="text-align: center; padding: 20px 12px;">
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 6px;">
            🎬 Movie Picker
          </div>
          <div style="font-size: 13px; opacity: 0.9; margin-bottom: 4px;">
            Find your next movie
          </div>
          <div style="margin-top: 8px; font-size: 11px; opacity: 0.7;">
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
  public currentAd: HTMLElement | null = null;

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
    
    // Note: PropellerInterstitialAd component already creates the overlay
    // We just need to render content - the component will handle showing/hiding

    // Create ad content directly (no extra overlay needed)
    // Match real ad container size: max-w-[95vw] md:max-w-5xl lg:max-w-6xl h-[70vh] max-h-[600px]
    const adContent = document.createElement('div');
    adContent.id = 'mock-interstitial-content';
    
    // Calculate responsive max-width
    const maxWidth = window.innerWidth >= 1024 ? '1152px' : window.innerWidth >= 768 ? '1024px' : '95vw';
    const maxHeight = Math.min(window.innerHeight * 0.7, 600);
    
    adContent.style.cssText = `
      width: 100%;
      max-width: ${maxWidth};
      height: ${maxHeight}px;
      max-height: ${maxHeight}px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
      padding: 40px 20px;
      position: relative;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    adContent.innerHTML = `
      <div style="font-size: 24px; margin-bottom: 16px;">🎬</div>
      <h2 style="font-size: 28px; font-weight: 700; margin-bottom: 16px; line-height: 1.2;">
        Discover Your Next Movie
      </h2>
      <p style="font-size: 16px; opacity: 0.9; margin-bottom: 24px; line-height: 1.4;">
        Find your next favorite film with our smart recommendations
      </p>
      <div style="display: flex; gap: 12px; margin-top: 24px; flex-wrap: wrap; justify-content: center;">
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
          min-width: 120px;
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
        Mock Ad
      </div>
    `;

    // IMPORTANT: Don't append to body - this creates double overlay
    // Instead, wait for the PropellerInterstitialAd component's container
    // and inject content there
    this.currentAd = adContent;

    // Add button interactions
    // Note: Skip button is handled by PropellerInterstitialAd component, not here
    const actionBtn = adContent.querySelector('#mock-ad-action');

    const closeAd = () => {
      if (adContent && adContent.parentNode) {
        adContent.parentNode.removeChild(adContent);
      }
      this.isShowing = false;
      this.currentAd = null;
      config.onClose?.();
    };

    actionBtn?.addEventListener('click', () => {
      // Simulate ad click - should track but not close (real ads navigate to advertiser)
      console.log('Mock ad action clicked - would navigate to advertiser in production');
      // Don't close the ad - clicking ad content should not skip it
      // Only the component's skip button should close it
    });

    // Auto-close after delay
    if (config.autoCloseAfter && config.autoCloseAfter > 0) {
      setTimeout(closeAd, config.autoCloseAfter * 1000);
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
