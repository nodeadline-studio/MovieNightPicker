import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { PROPELLER_ADS_CONFIG, PropellerAdsLoader, AdPlacement, PropellerAdsAnalytics } from '../config/propellerAdsConfig';
import { MockInterstitialAd } from '../config/propellerAdsMock';

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

const PropellerInterstitialAd: React.FC<PropellerInterstitialAdProps> = ({ 
  onClose, 
  onError, 
  onSuccess 
}) => {
  const [canSkip, setCanSkip] = useState(false);
  const [remainingTime, setRemainingTime] = useState(PROPELLER_ADS_CONFIG.display.interstitial.skipDelay);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isUsingMockAd, setIsUsingMockAd] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Skip countdown timer - starts when ad loads (isVisible becomes true)
  useEffect(() => {
    if (!isVisible) {
      // Reset counter when ad is not visible
      setRemainingTime(PROPELLER_ADS_CONFIG.display.interstitial.skipDelay);
      setCanSkip(false);
      return;
    }

    // Start countdown when ad becomes visible
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
      }
    };
  }, [isVisible]);

  // Auto-close timer
  useEffect(() => {
    if (PROPELLER_ADS_CONFIG.display.interstitial.autoCloseAfter > 0) {
      const autoCloseTimer = setTimeout(() => {
        onClose();
      }, PROPELLER_ADS_CONFIG.display.interstitial.autoCloseAfter * 1000);

      return () => clearTimeout(autoCloseTimer);
    }
  }, [onClose]);

  // Load and display the interstitial ad - try real ad first, fallback to mock
  const loadAd = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);

      // Check if ads should be shown
      if (!AdPlacement.shouldShowAds()) {
        onClose();
        return;
      }

      let realAdLoaded = false;

      // Always try real ad first (even in development)
      try {
      // Load PropellerAds script if not already loaded
      const loader = PropellerAdsLoader.getInstance();
      await loader.loadScript();

        // Wait for PropellerAds to be available (with timeout)
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            clearInterval(checkInterval);
            reject(new Error('PropellerAds timeout'));
          }, 3000);
          
          const checkInterval = setInterval(() => {
            if ((window as any).propellerads) {
              clearInterval(checkInterval);
              clearTimeout(timeout);
              resolve(true);
      }
          }, 100);
        });

      // Generate unique container ID
      const containerId = AdPlacement.generateAdId('interstitial');
      if (adRef.current) {
        adRef.current.id = containerId;
      }

      // Initialize the interstitial ad
      if ((window as any).propellerads && (window as any).propellerads.init) {
        (window as any).propellerads.init({
          container: containerId,
          adUnitId: PROPELLER_ADS_CONFIG.adUnits.interstitial.movieLoad,
          publisherId: PROPELLER_ADS_CONFIG.publisherId,
          type: 'interstitial',
          onLoad: () => {
            setIsLoading(false);
            setIsVisible(true);
              setIsUsingMockAd(false); // Real ad loaded, not using mock
              realAdLoaded = true;
            PropellerAdsAnalytics.trackAdShown('interstitial', 'movie-load');
            onSuccess?.();
          },
          onError: (error: Error) => {
            console.error('PropellerAds interstitial error:', error);
              // Don't set error state yet - will fallback to mock
              throw error;
          },
          onClick: () => {
            PropellerAdsAnalytics.trackAdClicked('interstitial', 'movie-load');
          },
          onClose: () => {
            onClose();
          }
        });
          
          // Wait a bit to see if real ad loads
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          if (realAdLoaded) {
            return; // Real ad loaded successfully
          }
      } else {
        throw new Error('PropellerAds initialization failed');
      }
      } catch (realAdError) {
        console.log('Real ad failed, falling back to mock:', realAdError);
        // Fall through to mock fallback
      }

      // Fallback to mock only if real ad failed
      setIsLoading(false); // Hide loading spinner before showing mock
      setIsUsingMockAd(true); // Mark that we're using mock ad
      const mockInterstitial = MockInterstitialAd.getInstance();
      mockInterstitial.show({
        onLoad: () => {
          setIsVisible(true);
          PropellerAdsAnalytics.trackAdShown('interstitial', 'movie-load');
          onSuccess?.();
        },
        onClose: () => {
          onClose();
        },
        onError: (error: Error) => {
          console.error('Mock interstitial error:', error);
          setHasError(true);
          PropellerAdsAnalytics.trackAdError('interstitial', 'movie-load', error.message || 'Unknown error');
          onError?.();
        },
        skipDelay: PROPELLER_ADS_CONFIG.display.interstitial.skipDelay,
        autoCloseAfter: PROPELLER_ADS_CONFIG.display.interstitial.autoCloseAfter
      });

    } catch (error) {
      console.error('Error loading interstitial ad:', error);
      setHasError(true);
      setIsLoading(false);
      PropellerAdsAnalytics.trackAdError('interstitial', 'movie-load', error instanceof Error ? error.message : 'Unknown error');
      onError?.();
    }
  }, [onError, onSuccess, onClose]);

  // Load ad on mount
  useEffect(() => {
    loadAd();
  }, [loadAd]);

  // Inject mock ad content when visible (only if using mock, not real ad)
  useEffect(() => {
    if (isVisible && !hasError && isUsingMockAd && adRef.current) {
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
            // Note: Skip button is handled by component's controls, not mock ad
            const actionBtn = clonedAd.querySelector('#mock-ad-action');
            
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
  }, [isVisible, hasError, isUsingMockAd, onClose]);

  // Handle skip button click
  const handleSkip = () => {
    if (canSkip) {
      onClose();
    }
  };

  // Handle close button click
  const handleClose = () => {
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
      {/* Close button and countdown - ABOVE ad content */}
      <div className="absolute top-4 right-4 z-50 flex flex-row items-center gap-2">
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
          {isLoading && (
            <div className="flex flex-col items-center justify-center text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mb-4"></div>
            <p className="text-gray-300 text-lg">Loading advertisement...</p>
            </div>
          )}
          
          {hasError && (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-900 rounded-xl">
            <div className="text-gray-300 text-lg mb-4">Advertisement unavailable</div>
              <button
                onClick={onClose}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          )}
          
          {isVisible && (
            <div 
              ref={adRef}
            className="w-full h-full flex items-center justify-center"
              style={{ minHeight: '300px' }}
            >
            {/* PropellerAds OR Mock content will render here directly */}
            </div>
          )}
      </div>
    </div>
  );
};

export default PropellerInterstitialAd;
