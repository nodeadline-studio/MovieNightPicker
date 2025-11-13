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

  // Load and display the interstitial ad - try real ad first, fallback to mock
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
      const maxRetries = 20; // Increased retries for slower DOM attachment
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

      let realAdLoaded = false;
      let realAdLoadPromise: Promise<void> | null = null;

      // State 2: Attempting - try to load real ad
      setLoadingState('attempting');

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
        containerIdRef.current = containerId;

        // Wait for container to be ready
        let retries = 0;
        const maxRetries = 10;
        while (retries < maxRetries) {
          if (adRef.current && adRef.current.isConnected) {
        adRef.current.id = containerId;
            const containerInDOM = document.getElementById(containerId);
            if (containerInDOM) {
              break;
            }
          }
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }

        if (retries >= maxRetries || !adRef.current) {
          throw new Error('Container not ready after retries');
      }

      // Initialize the interstitial ad
      if ((window as any).propellerads && (window as any).propellerads.init) {
          // Create promise for real ad loading
          realAdLoadPromise = new Promise<void>((resolve, reject) => {
        (window as any).propellerads.init({
          container: containerId,
          adUnitId: PROPELLER_ADS_CONFIG.adUnits.interstitial.movieLoad,
          publisherId: PROPELLER_ADS_CONFIG.publisherId,
          type: 'interstitial',
          onLoad: () => {
                setIsUsingMockAd(false);
                realAdLoaded = true;
                setAdContentRendered(true);
            setIsVisible(true);
                setLoadingState('showing');
            PropellerAdsAnalytics.trackAdShown('interstitial', 'movie-load');
            onSuccess?.();
                resolve();
          },
          onError: (error: Error) => {
            console.error('PropellerAds interstitial error:', error);
                reject(error);
          },
          onClick: () => {
            PropellerAdsAnalytics.trackAdClicked('interstitial', 'movie-load');
          },
          onClose: () => {
            onClose();
          }
        });
          });

          // Race: real ad load vs timeout (5 seconds)
          const timeoutPromise = new Promise<void>((_, reject) => {
            realAdTimeoutRef.current = setTimeout(() => {
              reject(new Error('Real ad timeout'));
            }, 5000);
          });

          try {
            await Promise.race([
              realAdLoadPromise,
              timeoutPromise
            ]);
            
            // Clear timeout if ad loaded successfully
            if (realAdTimeoutRef.current) {
              clearTimeout(realAdTimeoutRef.current);
              realAdTimeoutRef.current = null;
            }
            
            if (realAdLoaded) {
              return; // Real ad loaded successfully
            }
          } catch (timeoutError) {
            // Real ad timed out or failed - clear timeout and fall through to mock
            if (realAdTimeoutRef.current) {
              clearTimeout(realAdTimeoutRef.current);
              realAdTimeoutRef.current = null;
            }
            // Don't throw - fall through to mock ad fallback
            console.log('Real ad timeout, falling back to mock');
          }
      } else {
        throw new Error('PropellerAds initialization failed');
      }
      } catch (realAdError) {
        console.log('Real ad failed, falling back to mock:', realAdError);
        // Clear timeout if exists
        if (realAdTimeoutRef.current) {
          clearTimeout(realAdTimeoutRef.current);
          realAdTimeoutRef.current = null;
        }
        // Fall through to mock fallback
      }

      // State 3: Placeholder - show placeholder during transition
      setLoadingState('placeholder');
      await new Promise(resolve => setTimeout(resolve, 300)); // Brief placeholder display

      // State 4: Showing - fallback to mock ad
      setIsUsingMockAd(true);
      const mockInterstitial = MockInterstitialAd.getInstance();
      mockInterstitial.show({
        onLoad: () => {
          setAdContentRendered(true);
          setIsVisible(true);
          setLoadingState('showing');
          PropellerAdsAnalytics.trackAdShown('interstitial', 'movie-load');
          onSuccess?.();
        },
        onClose: () => {
          onClose();
        },
        onError: (error: Error) => {
          console.error('Mock interstitial error:', error);
          setHasError(true);
          setLoadingState('error');
          PropellerAdsAnalytics.trackAdError('interstitial', 'movie-load', error.message || 'Unknown error');
          onError?.();
        },
        skipDelay: PROPELLER_ADS_CONFIG.display.interstitial.skipDelay,
        autoCloseAfter: PROPELLER_ADS_CONFIG.display.interstitial.autoCloseAfter
      });

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
          {/* Ad container - ALWAYS rendered for ref attachment, conditionally visible */}
          <div 
            ref={adRef}
            className={`w-full h-full flex items-center justify-center ${
              loadingState === 'showing' && isVisible ? 'visible' : 'hidden'
            }`}
            style={{ 
              minHeight: '300px',
              visibility: loadingState === 'showing' && isVisible ? 'visible' : 'hidden'
            }}
          >
            {/* PropellerAds OR Mock content will render here directly */}
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
