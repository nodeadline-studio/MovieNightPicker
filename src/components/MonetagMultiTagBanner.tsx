import { useEffect, useRef, useState } from 'react';
import { MONETAG_SCRIPTS } from '../config/monetagScripts';

interface MonetagMultiTagBannerProps {
  zoneId: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  siteId?: string;
}

/**
 * Monetag MultiTag Banner Component
 * Uses MultiTag for banner placement - displays In-Page Push or Vignette Banner
 * MultiTag automatically optimizes which format to show
 * 
 * IMPORTANT: MultiTag includes Onclick (Popunder) by default
 * To disable: Contact Monetag Support to request disabling onclick/popunder
 * 
 * @param zoneId - MultiTag zone ID (get from dashboard, zones with MULTI property)
 */
export function MonetagMultiTagBanner({ 
  zoneId,
  className = '',
  onLoad,
  onError,
  siteId = '3049804'
}: MonetagMultiTagBannerProps) {
  const [adLoaded, setAdLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const initialized = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialized.current) return;

    const initializeMultiTag = () => {
      if (typeof window !== 'undefined' && (window as any).monetag) {
        try {
          // Initialize MultiTag - it will show In-Page Push or Vignette Banner in this container
          (window as any).monetag.init({
            siteId: siteId,
            zoneId: zoneId,
            format: 'multitag',
            container: containerRef.current?.id || undefined,
          });
          initialized.current = true;
          console.log(`Monetag MultiTag initialized for zone ${zoneId}`);
          
          // Start monitoring for ad content
          startMonitoring();
        } catch (error) {
          console.error('Monetag MultiTag initialization error:', error);
          setHasError(true);
          onError?.();
        }
      } else {
        // Retry after a short delay if monetag not ready
        setTimeout(initializeMultiTag, 100);
      }
    };

    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${MONETAG_SCRIPTS.MULTITAG_SCRIPT_URL}"]`);
    
    if (existingScript) {
      initializeMultiTag();
    } else {
      // Load Monetag script - use exact URL from config
      const script = document.createElement('script');
      script.src = MONETAG_SCRIPTS.MULTITAG_SCRIPT_URL;
      script.async = true;
      script.onload = initializeMultiTag;
      script.onerror = () => {
        console.error(`Failed to load Monetag script from ${MONETAG_SCRIPTS.MULTITAG_SCRIPT_URL}`);
        console.error('Please update MONETAG_SCRIPTS.MULTITAG_SCRIPT_URL in src/config/monetagScripts.ts with the exact URL from your Monetag dashboard');
        setHasError(true);
        onError?.();
      };
      document.head.appendChild(script);
    }

    // Register service worker for MultiTag (if needed)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('Service Worker registered for Monetag', reg);
        })
        .catch(err => {
          // Service worker registration is optional
          console.log('Service Worker registration failed (optional):', err);
        });
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [zoneId, siteId, onError]);

  const startMonitoring = () => {
    // Monitor for ad content - MultiTag may inject In-Page Push or Vignette Banner
    const checkForAd = () => {
      // Check for iframes from Monetag domains
      const iframes = document.querySelectorAll(
        'iframe[src*="monetag"], iframe[src*="groleegni"], iframe[src*="fpyf8"]'
      );
      
      // Check for ad containers with Monetag-specific attributes
      const adContainers = document.querySelectorAll(
        `[class*="monetag" i], [id*="monetag" i], [data-zone="${zoneId}"], [class*="vignette" i], [class*="in-page-push" i]`
      );
      
      // Check for script tag with our zone ID
      const monetagScript = document.querySelector(`script[data-zone="${zoneId}"]`);
      
      const hasAdElements = (iframes.length > 0 || adContainers.length > 0 || !!monetagScript);
      
      if (hasAdElements) {
        // Ad detected
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setAdLoaded(true);
        onLoad?.();
        return true;
      }
      return false;
    };

    // Initial check
    if (checkForAd()) {
      return;
    }

    // Poll every 500ms for up to 10 seconds
    checkIntervalRef.current = setInterval(() => {
      if (checkForAd()) {
        // Ad found, cleanup handled in checkForAd
      }
    }, 500);

    // Timeout after 10 seconds
    timeoutRef.current = setTimeout(() => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      if (!adLoaded) {
        setHasError(true);
        onError?.();
      }
    }, 10000);
  };

  // Don't render container if ad failed (allows button to center properly)
  if (hasError) {
    return null;
  }

  // Create unique container ID
  const containerId = `monetag-multitag-${zoneId}`;

  return (
    <div 
      ref={containerRef}
      id={containerId}
      className={className}
      style={{ 
        minHeight: adLoaded ? '50px' : '0px',
        width: '100%',
        display: adLoaded ? 'flex' : 'none', // Hide until ad loads
        justifyContent: 'center',
        alignItems: 'center'
      }}
      data-monetag-zone={zoneId}
      data-monetag-format="multitag"
    />
  );
}

