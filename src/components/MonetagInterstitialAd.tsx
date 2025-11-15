import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { MONETAG_SCRIPTS } from '../config/monetagScripts';

interface MonetagInterstitialAdProps {
  zoneId?: string; // Optional: defaults to 185147, update with your Interstitial zone ID
  onClose: () => void;
  onError?: () => void;
  onSuccess?: () => void;
}

/**
 * Monetag Interstitial Ad Component
 * Zone ID: 185147
 * Exact script format: <script src="https://fpyf8.com/88/tag.min.js" data-zone="185147" async data-cfasync="false"></script>
 * 
 * Features:
 * - Skip button appears after 5 seconds
 * - Auto-closes after 30 seconds
 * - Full-screen overlay
 */
export function MonetagInterstitialAd({ 
  zoneId = '185147', // Default zone ID, update with your Interstitial zone ID
  onClose,
  onError,
  onSuccess
}: MonetagInterstitialAdProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const [remainingTime, setRemainingTime] = useState(5); // 5 second skip delay
  const [adContentLoaded, setAdContentLoaded] = useState(false); // Track when ad content is actually loaded
  const scriptLoaded = useRef(false);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownStarted = useRef(false); // Track if countdown has started

  useEffect(() => {
    // Load the exact interstitial script format
    const existingScript = document.querySelector(`script[data-zone="${zoneId}"]`);
    
    if (existingScript) {
      // Script already loaded
      scriptLoaded.current = true;
      showAd();
      return;
    }

    try {
      // Create script with exact format - use configurable URL
      // For zone-specific URLs, the script URL might need to include the zone ID
      // Check your Monetag dashboard for the exact format
      // Note: Some zones use zone ID in URL, others use data-zone attribute
      let scriptUrl = MONETAG_SCRIPTS.INTERSTITIAL_SCRIPT_URL;
      // If URL contains {zoneId}, replace it (for zone-specific URLs)
      if (scriptUrl.includes('{zoneId}')) {
        scriptUrl = scriptUrl.replace('{zoneId}', zoneId);
      }
      
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.setAttribute('data-zone', zoneId);
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      
      script.onload = () => {
        scriptLoaded.current = true;
        showAd();
      };

      script.onerror = () => {
        console.error(`Failed to load Monetag interstitial script from ${scriptUrl}`);
        console.error(`Zone ID: ${zoneId}`);
        console.error('Please update MONETAG_SCRIPTS.INTERSTITIAL_SCRIPT_URL in src/config/monetagScripts.ts');
        console.error('Get the exact script format from Monetag dashboard → Zone → "Get tag"');
        setHasError(true);
        setIsLoading(false);
        onError?.();
      };

      document.head.appendChild(script);
    } catch (error) {
      console.error('Error loading Monetag interstitial script:', error);
      setHasError(true);
      setIsLoading(false);
      onError?.();
    }
  }, [zoneId, onError]);

  const showAd = () => {
    setIsVisible(true);
    setIsLoading(false);
    onSuccess?.();

    // Don't start countdown yet - wait for ad content to load
    setRemainingTime(5);
    setCanSkip(false);
    countdownStarted.current = false;

    // Auto-close after 30 seconds if not closed
    autoCloseTimerRef.current = setTimeout(() => {
      if (isVisible) {
        handleClose();
      }
    }, 30000);

    // Monitor for ad content - countdown starts only when ad is loaded
    startMonitoring();
  };

  // Start countdown only when ad content is loaded
  const startCountdown = () => {
    if (countdownStarted.current) return; // Prevent multiple starts
    
    countdownStarted.current = true;
    setRemainingTime(5);
    setCanSkip(false);
    
    countdownIntervalRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          // Pause at 0 - stop counting
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setCanSkip(true);
          return 0; // Stay at 0, don't go negative
        }
        return newTime;
      });
    }, 1000);
  };

  const startMonitoring = () => {
    // Check for ad content injection
    const checkForAd = () => {
      // Check for iframes or ad containers
      const iframes = document.querySelectorAll(
        `iframe[src*="fpyf8"], iframe[src*="monetag"], iframe[src*="groleegni"]`
      );
      
      const adContainers = document.querySelectorAll(
        `[class*="interstitial" i], [id*="interstitial" i], [data-zone="${zoneId}"]`
      );

      // Also check if ad container has content
      const hasAdContent = adContainerRef.current && (
        adContainerRef.current.querySelector('iframe') ||
        adContainerRef.current.querySelector('img') ||
        adContainerRef.current.innerHTML.trim().length > 0
      );

      return iframes.length > 0 || adContainers.length > 0 || !!hasAdContent;
    };

    // Poll for ad content
    checkIntervalRef.current = setInterval(() => {
      if (checkForAd() && !adContentLoaded) {
        // Ad content detected - start countdown
        setAdContentLoaded(true);
        startCountdown();
        
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
      }
    }, 500);

    // Stop monitoring after 10 seconds
    setTimeout(() => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      // If ad still not loaded after 10 seconds, start countdown anyway
      if (!adContentLoaded && !countdownStarted.current) {
        console.log('Ad content not detected after 10s, starting countdown anyway');
        startCountdown();
      }
    }, 10000);
  };

  const handleClose = (e?: React.MouseEvent) => {
    // Prevent popunder from triggering on close button
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
    }
    
    // Clear timers
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    
    setIsVisible(false);
    setCanSkip(false);
    setRemainingTime(5);
    setAdContentLoaded(false);
    countdownStarted.current = false;
    onClose();
  };

  const handleSkip = (e?: React.MouseEvent) => {
    // Prevent popunder from triggering on skip button
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
    }
    
    if (canSkip) {
      handleClose();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  if (!isVisible && !isLoading && !hasError) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
      onClick={(e) => {
        // Prevent clicks on overlay from triggering popunder
        if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
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
      {/* Close button and countdown - LEFT of X button */}
      <div className="absolute top-4 right-4 z-50 flex flex-row items-center gap-2">
        {/* Countdown or Skip Ad text - LEFT of X button */}
        {/* Only show countdown if ad content is loaded and countdown has started */}
        {!canSkip && remainingTime > 0 && adContentLoaded && (
          <div className="bg-black bg-opacity-70 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium">
            Skip in {remainingTime}s
          </div>
        )}
        {!adContentLoaded && isLoading && (
          <div className="bg-black bg-opacity-70 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium">
            Loading ad...
          </div>
        )}
        {canSkip && (
          <button
            onClick={(e) => handleSkip(e)}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="bg-black bg-opacity-70 hover:bg-opacity-90 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium cursor-pointer transition-all"
            style={{ pointerEvents: 'auto', zIndex: 10000 }}
          >
            Skip Ad
          </button>
        )}
        
        {/* Close button - RIGHT, grayed when disabled */}
        <button
          onClick={(e) => canSkip ? handleSkip(e) : handleClose(e)}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          disabled={!canSkip}
          className={`bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 sm:p-2 transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center ${
            !canSkip ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          aria-label={canSkip ? "Skip ad" : "Close ad"}
          style={{ pointerEvents: 'auto', zIndex: 10000 }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Ad content container */}
      <div className="relative w-full max-w-[95vw] md:max-w-5xl lg:max-w-6xl h-[70vh] max-h-[600px] flex items-center justify-center">
        {/* Ad container - Monetag script will inject ad here */}
        <div 
          ref={adContainerRef}
          className="w-full h-full flex items-center justify-center"
          style={{ 
            minHeight: '300px',
          }}
          data-monetag-zone={zoneId}
          data-monetag-format="interstitial"
        >
          {/* Monetag interstitial ad will be injected here by the script */}
        </div>
        
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mb-4"></div>
            <p className="text-gray-300 text-lg">Loading advertisement...</p>
          </div>
        )}
        
        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-gray-900 rounded-xl">
            <div className="text-gray-300 text-lg mb-4">Advertisement unavailable</div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                onClose();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
              style={{ pointerEvents: 'auto', zIndex: 10000 }}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
