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
  const adRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Skip countdown timer
  useEffect(() => {
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
  }, []);

  // Auto-close timer
  useEffect(() => {
    if (PROPELLER_ADS_CONFIG.display.interstitial.autoCloseAfter > 0) {
      const autoCloseTimer = setTimeout(() => {
        onClose();
      }, PROPELLER_ADS_CONFIG.display.interstitial.autoCloseAfter * 1000);

      return () => clearTimeout(autoCloseTimer);
    }
  }, [onClose]);

  // Load and display the interstitial ad
  const loadAd = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);

      // Check if ads should be shown
      if (!AdPlacement.shouldShowAds()) {
        onClose();
        return;
      }

      // Check if we're in development mode
      const isDevelopment = process.env.NODE_ENV === 'development' || 
                           typeof window !== 'undefined' && window.location.hostname === 'localhost';

      if (isDevelopment) {
        // Use mock interstitial ad
        const mockInterstitial = MockInterstitialAd.getInstance();
        mockInterstitial.show({
          onLoad: () => {
            setIsLoading(false);
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
            setIsLoading(false);
            PropellerAdsAnalytics.trackAdError('interstitial', 'movie-load', error.message || 'Unknown error');
            onError?.();
          },
          skipDelay: PROPELLER_ADS_CONFIG.display.interstitial.skipDelay,
          autoCloseAfter: PROPELLER_ADS_CONFIG.display.interstitial.autoCloseAfter
        });
        return;
      }

      // Load PropellerAds script if not already loaded
      const loader = PropellerAdsLoader.getInstance();
      await loader.loadScript();

      // Wait for PropellerAds to be available
      if (!(window as any).propellerads) {
        throw new Error('PropellerAds not available');
      }

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
            PropellerAdsAnalytics.trackAdShown('interstitial', 'movie-load');
            onSuccess?.();
          },
          onError: (error: Error) => {
            console.error('PropellerAds interstitial error:', error);
            setHasError(true);
            setIsLoading(false);
            PropellerAdsAnalytics.trackAdError('interstitial', 'movie-load', error.message || 'Unknown error');
            onError?.();
          },
          onClick: () => {
            PropellerAdsAnalytics.trackAdClicked('interstitial', 'movie-load');
          },
          onClose: () => {
            onClose();
          }
        });
      } else {
        throw new Error('PropellerAds initialization failed');
      }

    } catch (error) {
      console.error('Error loading PropellerAds interstitial:', error);
      setHasError(true);
      setIsLoading(false);
      PropellerAdsAnalytics.trackAdError('interstitial', 'movie-load', error instanceof Error ? error.message : 'Unknown error');
      onError?.();
    }
  }, [onError, onSuccess]);

  // Load ad on mount
  useEffect(() => {
    loadAd();
  }, [loadAd]);

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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 safe-area-insets z-[9999]"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        display: 'flex',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl max-w-[95vw] md:max-w-5xl lg:max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Close button and countdown */}
        <div className="absolute top-4 right-4 z-50 flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3">
          {/* Countdown */}
          {!canSkip && remainingTime > 0 && (
            <div className="bg-black bg-opacity-70 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium order-2 sm:order-1">
              Skip in {remainingTime}s
            </div>
          )}
          
          {/* Close button */}
          <button
            onClick={canSkip ? handleSkip : handleClose}
            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 sm:p-2 transition-all duration-200 order-1 sm:order-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={canSkip ? "Skip ad" : "Close ad"}
          >
            <X size={20} />
          </button>
        </div>

        {/* Ad content */}
        <div className="relative w-full h-[70vh] max-h-[500px] flex items-center justify-center">
          {isLoading && (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-gray-600 text-lg">Loading advertisement...</p>
            </div>
          )}
          
          {hasError && (
            <div className="flex flex-col items-center justify-center text-center p-8">
              <div className="text-gray-500 text-lg mb-4">Advertisement unavailable</div>
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
              className="w-full h-full"
              style={{ minHeight: '300px' }}
            >
              {/* PropellerAds content will be injected here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropellerInterstitialAd;
