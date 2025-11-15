import { useEffect, useRef, useState } from 'react';

interface MonetagBannerAdProps {
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Monetag Vignette Banner Ad Component
 * Zone ID: 10184307
 * Exact script format: (function(s){s.dataset.zone='10184307',s.src='https://groleegni.net/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))
 * 
 * IMPORTANT: Vignette banner may include onclick/popunder by default
 * To disable: Go to Monetag dashboard → Zone 10184307 → Settings → Disable Onclick/Popunder
 */
export function MonetagBannerAd({ 
  className = '',
  onLoad,
  onError
}: MonetagBannerAdProps) {
  const [adLoaded, setAdLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const scriptInjected = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (scriptInjected.current) return;

    // Check if script already exists
    const existingScript = document.querySelector('script[data-zone="10184307"]');
    if (existingScript) {
      scriptInjected.current = true;
      startMonitoring();
      return;
    }

    try {
      // Inject exact script format as provided by Monetag
      // Format: (function(s){s.dataset.zone='10184307',s.src='https://groleegni.net/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))
      const targetElement = [document.documentElement, document.body].filter(Boolean).pop();
      if (targetElement) {
        const script = document.createElement('script');
        script.dataset.zone = '10184307';
        script.src = 'https://groleegni.net/vignette.min.js';
        
        script.onload = () => {
          scriptInjected.current = true;
          startMonitoring();
        };

        script.onerror = () => {
          console.error('Monetag vignette banner script failed to load');
          setHasError(true);
          onError?.();
        };

        targetElement.appendChild(script);
        scriptInjected.current = true;
        
        // Fallback: start monitoring after delay even if onload doesn't fire
        setTimeout(() => {
          if (!adLoaded && !hasError) {
            startMonitoring();
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Monetag vignette banner injection error:', error);
      setHasError(true);
      onError?.();
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
  }, [onLoad, onError, adLoaded, hasError]);

  const startMonitoring = () => {
    // Monitor for ad load - vignette may inject anywhere in DOM
    const checkForAd = () => {
      // Check for iframes from Monetag domains
      const iframes = document.querySelectorAll(
        'iframe[src*="groleegni"], iframe[src*="monetag"], iframe[src*="vignette"], iframe[src*="fpyf8"]'
      );
      
      // Check for ad containers with Monetag-specific attributes
      const adContainers = document.querySelectorAll(
        '[class*="vignette" i], [id*="vignette" i], [data-zone="10184307"], [class*="monetag" i], [id*="monetag" i]'
      );
      
      // Check for script tag with our zone ID
      const monetagScript = document.querySelector('script[data-zone="10184307"]');
      
      // Check for elements with groleegni in src or data attributes
      const groleegniElements = document.querySelectorAll(
        '[src*="groleegni"], [data-src*="groleegni"], [href*="groleegni"]'
      );
      
      const hasAdElements = (iframes.length > 0 || adContainers.length > 0 || groleegniElements.length > 0 || !!monetagScript);
      
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

  // Always render container (ad may inject anywhere, but we need to track it)
  // Return null if ad hasn't loaded yet to prevent layout shift
  // The ad script will inject content directly into the DOM
  return (
    <div 
      ref={containerRef}
      className={className}
      style={{ 
        minHeight: adLoaded ? '50px' : '0px',
        width: '100%',
        display: adLoaded ? 'flex' : 'none', // Hide until ad loads
        justifyContent: 'center',
        alignItems: 'center'
      }}
      data-monetag-zone="10184307"
      data-monetag-format="vignette"
    />
  );
}
