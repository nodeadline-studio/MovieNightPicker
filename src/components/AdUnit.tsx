import { useEffect, useRef } from 'react';

// Add type definition for Google AdSense
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface Props {
  slot: string;
  width: number;
  height: number;
  format?: string;
  enabled?: boolean;
}

/* --- CONFIG --- */
const AD_CLIENT = 'ca-pub-8912589351325590';
const WATCHDOG_MS = 3000;
const DEV_ADTEST = false; // Disable test ads for production
/* --------------- */

const AdUnit = ({ slot, width, height, format = 'auto', enabled = false }: Props) => {
  const ref = useRef<HTMLModElement>(null);
  const scriptLoadedRef = useRef(false);
  const adInitializedRef = useRef(false);
  const mountedRef = useRef(false);
  const elementRef = useRef<HTMLElement | null>(null); 
  const uniqueId = useRef(`ad-${Math.random().toString(36).slice(2)}`);
  const cleanupTimeoutRef = useRef<number>();

  const showPlaceholder = () => {
    const el = ref.current;
    if (!el || el.dataset.fallback) return;
    
    el.dataset.fallback = '1';
    el.innerHTML = `<div style="width:100%;height:100%;background:#f0f0f0;display:none;"></div>`;
    el.classList.remove('adsbygoogle');
  };

  /* — 1. Load script once — */
  useEffect(() => {
    if (!navigator.onLine || scriptLoadedRef.current || !enabled) return;

    mountedRef.current = true;

    const loadScript = () => {
      const s = document.createElement('script');
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.onload = () => {
        scriptLoadedRef.current = true;
        if (mountedRef.current) initAd();
      };
      document.head.appendChild(s);
    };

    const initAd = () => {
      const el = ref.current;
      if (!el || !window.adsbygoogle || adInitializedRef.current) return;

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({
          params: DEV_ADTEST ? { adtest: 'on' } : {},
        });
        adInitializedRef.current = true;
      } catch (e) {
        console.warn('AdSense initialization skipped - already initialized');
        showPlaceholder();
      }
    };

    loadScript();
    
    return () => {
      adInitializedRef.current = false;
      mountedRef.current = false;
    };
  }, [enabled]);

  /* — 2. push + fallback + cleanup — */
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    if (!navigator.onLine) {
      showPlaceholder();
      return;
    }

    /* if no iframe after 3s → no-fill ⇒ placeholder */
    cleanupTimeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current && el.querySelectorAll('iframe').length === 0) showPlaceholder();
    }, WATCHDOG_MS);

    return () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
        cleanupTimeoutRef.current = undefined;
      }
      
      // Get the element we need to clean up
      const element = elementRef.current;
      elementRef.current = null; // Clear ref immediately

      if (element) {
        // Clear the content first
        element.innerHTML = '';
        element.className = '';

        // Only attempt removal if element exists and is still in DOM
        try {
          const parentNode = element.parentNode;
          if (parentNode && document.body.contains(element)) {
            element.parentNode.removeChild(element);
          } else {
            console.debug('Ad element already removed or not in DOM');
          }
        } catch (error) {
          console.warn('Failed to remove ad element:', error);
        }
      }

      adInitializedRef.current = false;
    };
  }, [width, height, enabled]);

  // Calculate responsive width for mobile
  const getResponsiveWidth = () => {
    // Use window.innerWidth safely
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    if (format === 'horizontal' && windowWidth < width) {
      return '100%';
    }
    return width;
  };

  // For mobile ads, ensure we have proper styling
  const adStyle = {
    display: 'block',
    width: getResponsiveWidth(),
    height,
    maxWidth: '100%',
    margin: '0 auto', // Center the ad
    overflow: 'hidden' // Prevent overflow
  };

  // Don't render anything if ads are disabled
  if (!enabled) {
    return null;
  }

  return (
    <div className="ad-container">
      <ins
        ref={ref}
        className="adsbygoogle"
        style={adStyle}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdUnit;