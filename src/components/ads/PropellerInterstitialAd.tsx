import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { PROPELLER_ADS_CONFIG, AdPlacement, PropellerAdsAnalytics } from '../../config/ads/propellerAdsConfig';
import { pauseAllMedia } from '../../utils/mediaPause';
import { preloadInterstitialAd, loadNextAdInCycle, loadNextInterstitial } from '../../utils/monetagAds';
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

type AdLoadingState = 'loading' | 'attempting' | 'showing' | 'error';

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
  const [adContentRendered, setAdContentRendered] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const monetagCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);

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

  // Absolute safety: allow skip after max wait even if ad failed to render
  useEffect(() => {
    if (!isVisible) return;
    const maxWait = setTimeout(() => {
      setCanSkip(true);
    }, 12000); // 12s hard cap
    return () => clearTimeout(maxWait);
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

      // Set up container for Monetag FIRST, before loading script
      if (adRef.current) {
        // Make container visible FIRST so Monetag can detect it when scanning
        setIsVisible(true);
        
        // Set data-zone attribute BEFORE init
        adRef.current.setAttribute('data-zone', '10184307');
        adRef.current.style.width = '100%';
        adRef.current.style.height = '100%';
        adRef.current.style.minHeight = '300px';
        adRef.current.style.position = 'relative';
        adRef.current.style.display = 'block';
        adRef.current.style.visibility = 'visible';
        adRef.current.style.opacity = '1';
        
        // Force a reflow to ensure container is in DOM and visible
        void adRef.current.offsetHeight;
      }

      // Wait for container to be fully rendered and visible
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify container is in DOM and visible
      if (adRef.current && !adRef.current.isConnected) {
        throw new Error('Container not in DOM');
      }

      // Initialize Monetag interstitial via tag.js SDK with rotation
      if (adRef.current) {
        await loadNextInterstitial(adRef.current);
      }
      
      // Use MutationObserver to detect when Monetag injects content
      mutationObserverRef.current = new MutationObserver((mutations) => {
        if (adRef.current) {
          const hasAdContent = adRef.current.querySelector('iframe') || 
                              adRef.current.querySelector('[id*="ad"]') ||
                              adRef.current.querySelector('[class*="ad"]') ||
                              adRef.current.querySelector('div[style*="position"]') ||
                              adRef.current.querySelector('div[style*="absolute"]') ||
                              (adRef.current.children.length > 0 && adRef.current.innerHTML.trim().length > 100);
          
          if (hasAdContent) {
            if (mutationObserverRef.current) {
              mutationObserverRef.current.disconnect();
              mutationObserverRef.current = null;
            }
            if (monetagCheckIntervalRef.current) {
              clearInterval(monetagCheckIntervalRef.current);
              monetagCheckIntervalRef.current = null;
            }
          setAdContentRendered(true);
          setLoadingState('showing');
          PropellerAdsAnalytics.trackAdShown('interstitial', 'movie-load');
          onSuccess?.();
          }
        }
      });
      
      // Observe the container for changes
      if (adRef.current && mutationObserverRef.current) {
        mutationObserverRef.current.observe(adRef.current, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['style', 'class', 'id']
        });
      }
      
      // Also use interval as fallback
      let checkCount = 0;
      const maxChecks = 60; // 30 seconds max wait
      monetagCheckIntervalRef.current = setInterval(() => {
        checkCount++;
        
        // Check if Monetag has injected content
        if (adRef.current) {
          const hasAdContent = adRef.current.querySelector('iframe') || 
                              adRef.current.querySelector('[id*="ad"]') ||
                              adRef.current.querySelector('[class*="ad"]') ||
                              adRef.current.querySelector('div[style*="position"]') ||
                              adRef.current.querySelector('div[style*="absolute"]') ||
                              (adRef.current.children.length > 0 && adRef.current.innerHTML.trim().length > 100);
          
          if (hasAdContent) {
            if (mutationObserverRef.current) {
              mutationObserverRef.current.disconnect();
              mutationObserverRef.current = null;
            }
            clearInterval(monetagCheckIntervalRef.current!);
            monetagCheckIntervalRef.current = null;
            setAdContentRendered(true);
            setLoadingState('showing');
            PropellerAdsAnalytics.trackAdShown('interstitial', 'movie-load');
            onSuccess?.();
          } else if (checkCount >= maxChecks) {
            // Timeout - ad didn't load
            if (mutationObserverRef.current) {
              mutationObserverRef.current.disconnect();
              mutationObserverRef.current = null;
            }
            clearInterval(monetagCheckIntervalRef.current!);
            monetagCheckIntervalRef.current = null;
            if (import.meta.env.DEV) {
              console.warn('[Monetag] Ad did not load within timeout period - closing ad');
            }
            // Close ad if it doesn't load - don't show empty container
            setHasError(true);
            setLoadingState('error');
            onError?.();
          }
        }
      }, 500); // Check every 500ms

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


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up container
      if (adRef.current) {
        adRef.current.innerHTML = '';
        adRef.current.removeAttribute('data-zone');
      }
      
      // Clear interval if exists
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Clear Monetag check interval if exists
      if (monetagCheckIntervalRef.current) {
        clearInterval(monetagCheckIntervalRef.current);
        monetagCheckIntervalRef.current = null;
      }
      
      // Disconnect mutation observer if exists
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect();
        mutationObserverRef.current = null;
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
    setCanSkip(false);
    setRemainingTime(PROPELLER_ADS_CONFIG.display.interstitial.skipDelay);
    
    // Clear container
    if (adRef.current) {
      adRef.current.innerHTML = '';
      adRef.current.removeAttribute('data-zone');
    }
    
    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Clear Monetag check interval
    if (monetagCheckIntervalRef.current) {
      clearInterval(monetagCheckIntervalRef.current);
      monetagCheckIntervalRef.current = null;
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
            className="w-full h-full flex items-center justify-center"
            style={{ 
              minHeight: '300px',
              visibility: isVisible ? 'visible' : 'hidden',
              display: isVisible ? 'block' : 'none',
              opacity: isVisible ? '1' : '0'
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
