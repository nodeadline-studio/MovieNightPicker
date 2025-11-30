import { useEffect, useRef } from 'react';

interface MonetagConfig {
  siteId: string;
  zoneId: string;
  format: 'multitag' | 'banner' | 'interstitial' | 'push' | 'onclick';
  container?: string;
}

declare global {
  interface Window {
    monetag?: {
      init: (config: MonetagConfig) => void;
    };
  }
}

/**
 * Hook for initializing Monetag ad formats
 * Based on Monetag documentation and React SPA best practices
 */
export function useMonetag(config: MonetagConfig) {
  const scriptLoaded = useRef(false);
  const zoneInitialized = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current && zoneInitialized.current) return;

    // Load Monetag script
    if (!scriptLoaded.current) {
      const existingScript = document.querySelector('script[src="https://s.monetag.com/tag.js"]');
      
      if (existingScript) {
        scriptLoaded.current = true;
        initializeZone();
      } else {
        const script = document.createElement('script');
        script.src = 'https://s.monetag.com/tag.js';
        script.async = true;
        script.onload = () => {
          scriptLoaded.current = true;
          initializeZone();
        };
        script.onerror = () => {
          console.error('Failed to load Monetag script');
        };
        document.head.appendChild(script);
      }
    } else {
      initializeZone();
    }

    function initializeZone() {
      if (zoneInitialized.current) return;
      
      if (typeof window !== 'undefined' && window.monetag) {
        try {
          window.monetag.init({
            siteId: config.siteId,
            zoneId: config.zoneId,
            format: config.format,
            ...(config.container && { container: config.container }),
          });
          zoneInitialized.current = true;
          console.log(`Monetag ${config.format} initialized for zone ${config.zoneId}`);
        } catch (error) {
          console.error('Monetag initialization error:', error);
        }
      } else {
        // Retry after a short delay if monetag not ready
        setTimeout(initializeZone, 100);
      }
    }
  }, [config.siteId, config.zoneId, config.format, config.container]);
}

