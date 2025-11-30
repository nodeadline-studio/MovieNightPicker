import { useEffect, useRef } from 'react';

interface MonetagInterstitialAdProps {
  zoneId: string;
  trigger: 'pageview' | 'click' | 'manual';
  delay?: number; // milliseconds
  siteId?: string;
  onShow?: () => void;
  onClose?: () => void;
}

/**
 * Monetag Interstitial Ad Component
 * Full-screen ads that appear at natural transition points
 * High eCPMs and good engagement rates
 */
export function MonetagInterstitialAd({ 
  zoneId, 
  trigger, 
  delay = 0,
  siteId = '3049804',
  onShow,
  onClose
}: MonetagInterstitialAdProps) {
  const initialized = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (initialized.current || trigger === 'manual') return;

    const showAd = () => {
      if (initialized.current) return;

      const initializeAd = () => {
        if (typeof window !== 'undefined' && (window as any).monetag) {
          try {
            (window as any).monetag.init({
              siteId: siteId,
              zoneId: zoneId,
              format: 'interstitial',
            });
            initialized.current = true;
            onShow?.();
            console.log(`Monetag interstitial ad shown for zone ${zoneId}`);
          } catch (error) {
            console.error('Monetag interstitial initialization error:', error);
          }
        } else {
          // Retry if script not loaded yet
          setTimeout(initializeAd, 100);
        }
      };

      // Load script if needed
      const existingScript = document.querySelector('script[src="https://s.monetag.com/tag.js"]');
      if (existingScript) {
        initializeAd();
      } else {
        const script = document.createElement('script');
        script.src = 'https://s.monetag.com/tag.js';
        script.async = true;
        script.onload = initializeAd;
        script.onerror = () => console.error('Failed to load Monetag script');
        document.head.appendChild(script);
      }
    };

    if (trigger === 'pageview') {
      timeoutRef.current = setTimeout(showAd, delay);
    } else if (trigger === 'click') {
      const handleClick = () => {
        showAd();
        document.removeEventListener('click', handleClick);
      };
      document.addEventListener('click', handleClick, { once: true });
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [zoneId, trigger, delay, siteId, onShow]);

  // Manual trigger function (exposed via ref or callback)
  const triggerManually = () => {
    if (initialized.current) return;
    
    const initializeAd = () => {
      if (typeof window !== 'undefined' && (window as any).monetag) {
        try {
          (window as any).monetag.init({
            siteId: siteId,
            zoneId: zoneId,
            format: 'interstitial',
          });
          initialized.current = true;
          onShow?.();
        } catch (error) {
          console.error('Monetag interstitial initialization error:', error);
        }
      }
    };

    const existingScript = document.querySelector('script[src="https://s.monetag.com/tag.js"]');
    if (existingScript) {
      initializeAd();
    } else {
      const script = document.createElement('script');
      script.src = 'https://s.monetag.com/tag.js';
      script.async = true;
      script.onload = initializeAd;
      document.head.appendChild(script);
    }
  };

  // Expose manual trigger (can be called from parent)
  useEffect(() => {
    if (trigger === 'manual') {
      (window as any)[`monetag_interstitial_${zoneId}`] = triggerManually;
    }
    return () => {
      if (trigger === 'manual') {
        delete (window as any)[`monetag_interstitial_${zoneId}`];
      }
    };
  }, [zoneId, trigger]);

  return null;
}

