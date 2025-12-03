import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { PROPELLER_ADS_CONFIG, PropellerAdsLoader, AdPlacement, PropellerAdsAnalytics } from '../../config/ads/propellerAdsConfig';
import { MockInterstitialAd } from '../../config/ads/propellerAdsMock';
import { pauseAllMedia } from '../../utils/mediaPause';
import { loadInterstitialAd, preloadInterstitialAd, loadNextAdInCycle } from '../../utils/monetagAds';
import { markFirstCommercialBreakCompleted, hasFirstCommercialBreakCompleted } from '../../utils/vignetteAd';

interface PropellerInterstitialAdProps {
  onClose: () => void;
  onError?: () => void;
  onSuccess?: () => void;
}

// Extend Window interface for PropellerAds
declare global {
  interface Window {
    propellerads: {
      init: (config: PropellerInterstitialConfig) => void;
    };
  }
}

interface PropellerInterstitialConfig {
  container: string;
  adUnitId: string;
  publisherId: string;
  type: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onClick?: () => void;
  onClose?: () => void;
}

type AdLoadingState = 'loading' | 'attempting' | 'placeholder' | 'showing' | 'error';

const PropellerInterstitialAd: React.FC<PropellerInterstitialAdProps> = ({ 
  onClose, 
  onError, 
  onSuccess 
}) => {
  const [canSkip, setCanSkip] = useState(false);
  const [remainingTime, setRemainingTime] = useState(PROPELLER_ADS_CONFIG.display.interstitial.skipDelay);
  const [loadingState, setLoadingState] = useState<AdLoadingState>('loading');
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isUsingMockAd, setIsUsingMockAd] = useState(false);
  const [adContentRendered, setAdContentRendered] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerIdRef = useRef<string | null>(null);
  const realAdTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Skip countdown timer - starts ONLY when ad is visible AND content is rendered
  useEffect(() => {
    if (!isVisible || !adContentRendered) {
      // Reset counter when ad is not visible or content not rendered
      setRemainingTime(PROPELLER_ADS_CONFIG.display.interstitial.skipDelay);
      setCanSkip(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start countdown when ad is visible AND content is rendered
    intervalRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setCanSkip(true);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isVisible, adContentRendered]);

  // Auto-close timer
  useEffect(() => {
    if (PROPELLER_ADS_CONFIG.display.interstitial.autoCloseAfter > 0) {
      const autoCloseTimer = setTimeout(() => {
        onClose();
      }, PROPELLER_ADS_CONFIG.display.interstitial.autoCloseAfter * 1000);

      return () => clearTimeout(autoCloseTimer);
    }
  }, [onClose]);

  // Load and display Monetag interstitial ad
  const loadAd = useCallback(async () => {
    try {
      // State 1: Loading - show spinner immediately
      setLoadingState('loading');
      setHasError(false);
      setAdContentRendered(false);

      // Check if ads should be shown
      if (!AdPlacement.shouldShowAds()) {
        onClose();
        return;
      }

      // CRITICAL: Wait for container to be attached to DOM with retry mechanism
      let retries = 0;
      const maxRetries = 20;
      while (retries < maxRetries) {
        if (adRef.current && adRef.current.isConnected) {
          // Container is ready, clean up previous content
          adRef.current.innerHTML = '';
          adRef.current.removeAttribute('id');
          await new Promise(resolve => requestAnimationFrame(resolve));
          break;
        }
        // Wait for DOM to attach ref
        await new Promise(resolve => setTimeout(resolve, 50));
        retries++;
      }

      // Ensure container exists and is in DOM after retries
      if (!adRef.current || !adRef.current.isConnected) {
        throw new Error('Ad container not ready after retries');
      }

      // State 2: Attempting - load Monetag interstitial ad
      setLoadingState('attempting');

      // Load Monetag interstitial ad directly into container
      if (adRef.current) {
        // Set data-zone immediately so Monetag can find it
        adRef.current.setAttribute('data-zone', '10184307');
        adRef.current.style.width = '100%';
        adRef.current.style.height = '100%';
        adRef.current.style.minHeight = '300px';
        
        // Load the ad script and inject into container
        loadInterstitialAd(adRef.current);
        
        // Wait for ad to initialize, then show
        // Monetag needs time to scan for containers and inject ads
        setTimeout(() => {
          setAdContentRendered(true);
          setIsVisible(true);
          setLoadingState('showing');
          PropellerAdsAnalytics.trackAdShown('interstitial', 'movie-load');
          onSuccess?.();
        }, 2000); // Increased delay for Monetag to initialize
      }

    } catch (error) {
      console.error('Error loading interstitial ad:', error);
      setHasError(true);
      setLoadingState('error');
      PropellerAdsAnalytics.trackAdError('interstitial', 'movie-load', error instanceof Error ? error.message : 'Unknown error');
      onError?.();
    }
  }, [onError, onSuccess, onClose]);

  // Load ad on mount
  useEffect(() => {
    loadAd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only load once on mount

  // Pause all media when ad becomes visible
  useEffect(() => {
    if (isVisible && adContentRendered) {
      pauseAllMedia();
      // Mark first commercial break as completed
      markFirstCommercialBreakCompleted();
    }
  }, [isVisible, adContentRendered]);

  // Inject mock ad content when visible (only if using mock, not real ad, and in showing state)
  useEffect(() => {
    // Only inject mock ad when:
    // 1. Ad is visible
    // 2. No error occurred
    // 3. We're using mock ad (real ad definitively failed)
    // 4. Loading state is 'showing' (ad is ready to display)
    // 5. Ad content container exists
    if (isVisible && !hasError && isUsingMockAd && loadingState === 'showing' && adRef.current) {
      const mockInterstitial = MockInterstitialAd.getInstance();
      
      // Only inject if mock ad exists and we're using mock (not real ad)
      if (mockInterstitial.currentAd) {
        // Use requestAnimationFrame for reliable DOM timing
        const injectAd = () => {
          if (adRef.current && mockInterstitial.currentAd) {
            // Clear container first
            adRef.current.innerHTML = '';
            // Clone the mock ad element to avoid issues if it's already in DOM
            const clonedAd = mockInterstitial.currentAd.cloneNode(true) as HTMLElement;
            adRef.current.appendChild(clonedAd);
            
            // Re-attach event listeners to cloned element
            const skipBtn = clonedAd.querySelector('#mock-ad-skip') as HTMLButtonElement;
            const actionBtn = clonedAd.querySelector('#mock-ad-action');
            
            if (skipBtn) {
              skipBtn.addEventListener('click', () => {
                if (canSkip) {
                  onClose();
                }
              });
            }
            
            if (actionBtn) {
              actionBtn.addEventListener('click', () => {
                console.log('Mock ad action clicked - would navigate to advertiser in production');
              });
            }
          }
        };
        
        // Try immediate injection, fallback to requestAnimationFrame
        if (adRef.current) {
          injectAd();
        } else {
          requestAnimationFrame(injectAd);
        }
      }
    }
  }, [isVisible, hasError, isUsingMockAd, loadingState, canSkip, onClose]);

  // Update mock ad skip button state when canSkip or remainingTime changes
  useEffect(() => {
    if (isVisible && !hasError && isUsingMockAd && adRef.current) {
      const skipBtn = adRef.current.querySelector('#mock-ad-skip') as HTMLButtonElement;
      if (skipBtn) {
        if (canSkip) {
          skipBtn.style.opacity = '1';
          skipBtn.style.cursor = 'pointer';
          skipBtn.style.pointerEvents = 'auto';
          skipBtn.disabled = false;
          skipBtn.textContent = 'Skip Ad';
        } else {
          skipBtn.style.opacity = '0.5';
          skipBtn.style.cursor = 'not-allowed';
          skipBtn.style.pointerEvents = 'none';
          skipBtn.disabled = true;
          skipBtn.textContent = remainingTime > 0 ? `Skip in ${remainingTime}s` : 'Skip Ad';
        }
      }
    }
  }, [isVisible, hasError, isUsingMockAd, canSkip, remainingTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up container
      if (adRef.current) {
        adRef.current.innerHTML = '';
        adRef.current.removeAttribute('id');
      }
      
      // Clear container ID reference
      containerIdRef.current = null;
      
      // Clear interval if exists
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Clear real ad timeout if exists
      if (realAdTimeoutRef.current) {
        clearTimeout(realAdTimeoutRef.current);
        realAdTimeoutRef.current = null;
      }
    };
  }, []);

  // Handle skip button click
  const handleSkip = () => {
    if (canSkip) {
      // Load next ad in cycle (vignette or notifications) after first ad
      if (hasFirstCommercialBreakCompleted()) {
        loadNextAdInCycle();
      }
      onClose();
    }
  };

  // Handle close button click
  const handleClose = () => {
    // Clean up state on close
    setIsVisible(false);
    setAdContentRendered(false);
    setLoadingState('loading');
    setIsUsingMockAd(false);
    setCanSkip(false);
    setRemainingTime(PROPELLER_ADS_CONFIG.display.interstitial.skipDelay);
    
    // Clear container
    if (adRef.current) {
      adRef.current.innerHTML = '';
      adRef.current.removeAttribute('id');
    }
    
    // Clear timeouts
    if (realAdTimeoutRef.current) {
      clearTimeout(realAdTimeoutRef.current);
      realAdTimeoutRef.current = null;
    }
    
    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Reset mock ad state
    const mockInterstitial = MockInterstitialAd.getInstance();
    if (mockInterstitial.currentAd) {
      mockInterstitial.currentAd = null;
    }
    
    onClose();
  };

  // Don't render if ads shouldn't be shown
  if (!AdPlacement.shouldShowAds()) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      {/* Monetag Interstitial Ad - loaded directly into container */}

      {/* Close button and countdown - ABOVE ad content and Monetag overlay */}
      <div className="absolute top-4 right-4 z-10 flex flex-row items-center gap-2">
        {/* Countdown or Skip Ad text - LEFT of X button */}
          {!canSkip && remainingTime > 0 && (
          <div className="bg-black bg-opacity-70 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium">
              Skip in {remainingTime}s
            </div>
          )}
        {canSkip && (
          <button
            onClick={handleSkip}
            className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium cursor-pointer transition-all"
          >
            Skip Ad
          </button>
        )}
          
        {/* Close button - RIGHT, grayed when disabled */}
          <button
            onClick={canSkip ? handleSkip : handleClose}
          disabled={!canSkip}
          className={`bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 sm:p-2 transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center ${
            !canSkip ? 'opacity-50 cursor-not-allowed' : ''
          }`}
            aria-label={canSkip ? "Skip ad" : "Close ad"}
          >
            <X size={20} />
          </button>
        </div>

      {/* Ad content container - NO white background wrapper */}
      <div className="relative w-full max-w-[95vw] md:max-w-5xl lg:max-w-6xl h-[70vh] max-h-[600px] flex items-center justify-center">
          {/* Ad container - ALWAYS rendered for ref attachment, conditionally visible */}
          {/* Monetag interstitial ad will be injected here via data-zone attribute */}
          <div 
            ref={adRef}
            className={`w-full h-full flex items-center justify-center ${
              loadingState === 'showing' && isVisible ? 'visible' : 'hidden'
            }`}
            style={{ 
              minHeight: '300px',
              visibility: loadingState === 'showing' && isVisible ? 'visible' : 'hidden'
            }}
            data-zone="10184307"
          >
            {/* Monetag interstitial ad will render here */}
          </div>
          
          {/* Loading state - show spinner */}
          {(loadingState === 'loading' || loadingState === 'attempting') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mb-4"></div>
              <p className="text-gray-300 text-lg">Loading advertisement...</p>
            </div>
          )}
          
          {/* Placeholder state - show placeholder during transition */}
          {loadingState === 'placeholder' && (
            <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700">
            <div className="flex flex-col items-center justify-center text-center p-8">
                <div className="animate-pulse text-gray-400 text-sm">Preparing advertisement...</div>
              </div>
            </div>
          )}
          
          {/* Error state */}
          {loadingState === 'error' && hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-gray-900 rounded-xl">
              <div className="text-gray-300 text-lg mb-4">Advertisement unavailable</div>
              <button
                onClick={onClose}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default PropellerInterstitialAd;
