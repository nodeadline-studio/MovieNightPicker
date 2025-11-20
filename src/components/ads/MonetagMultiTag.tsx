import { useEffect, useRef } from 'react';

interface MonetagMultiTagProps {
  zoneId: string;
  siteId?: string;
}

/**
 * Monetag MultiTag Component
 * All-in-one format that combines multiple ad types:
 * - Onclick (Popunder)
 * - Push Notifications
 * - Interstitial
 * - In-Page Push
 * - Vignette Banner
 * 
 * Benefits:
 * - Highest revenue potential
 * - Optimized UX & User Safety
 * - Full ad coverage across devices, OS, and GEOs
 * - Automated optimization
 */
export function MonetagMultiTag({ 
  zoneId, 
  siteId = '3049804'
}: MonetagMultiTagProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    const initializeMultiTag = () => {
      if (typeof window !== 'undefined' && (window as any).monetag) {
        try {
          (window as any).monetag.init({
            siteId: siteId,
            zoneId: zoneId,
            format: 'multitag',
          });
          initialized.current = true;
          console.log(`Monetag MultiTag initialized for zone ${zoneId}`);
        } catch (error) {
          console.error('Monetag MultiTag initialization error:', error);
        }
      } else {
        // Retry after a short delay if monetag not ready
        setTimeout(initializeMultiTag, 100);
      }
    };

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src="https://s.monetag.com/tag.js"]');
    
    if (existingScript) {
      initializeMultiTag();
    } else {
      // Load Monetag script
      const script = document.createElement('script');
      script.src = 'https://s.monetag.com/tag.js';
      script.async = true;
      script.onload = initializeMultiTag;
      script.onerror = () => console.error('Failed to load Monetag script');
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
  }, [zoneId, siteId]);

  return null;
}

