import { useEffect, useRef } from 'react';

interface MonetagBannerAdProps {
  zoneId: string;
  size: '300x250' | '728x90';
  className?: string;
  siteId?: string;
}

/**
 * Monetag Banner Ad Component
 * Supports 300x250 (Medium Rectangle) and 728x90 (Leaderboard) sizes
 * Compatible with AdSense and UX-safe
 */
export function MonetagBannerAd({ 
  zoneId, 
  size, 
  className = '',
  siteId = '3049804'
}: MonetagBannerAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initialized.current) return;

    // Clear container
    containerRef.current.innerHTML = '';

    // Create ad container with unique ID
    const adContainer = document.createElement('div');
    const containerId = `monetag-banner-${zoneId}-${Date.now()}`;
    adContainer.id = containerId;
    
    // Set dimensions based on size
    const [width, height] = size === '300x250' ? [300, 250] : [728, 90];
    adContainer.style.width = `${width}px`;
    adContainer.style.height = `${height}px`;
    adContainer.style.margin = '0 auto';
    adContainer.style.minHeight = `${height}px`;
    
    containerRef.current.appendChild(adContainer);

    // Initialize Monetag when script is ready
    const initializeAd = () => {
      if (typeof window !== 'undefined' && (window as any).monetag) {
        try {
          (window as any).monetag.init({
            siteId: siteId,
            zoneId: zoneId,
            format: 'banner',
            container: containerId,
          });
          initialized.current = true;
        } catch (error) {
          console.error('Monetag banner initialization error:', error);
        }
      } else {
        // Retry if script not loaded yet
        setTimeout(initializeAd, 100);
      }
    };

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src="https://s.monetag.com/tag.js"]');
    if (existingScript) {
      initializeAd();
    } else {
      // Load script first
      const script = document.createElement('script');
      script.src = 'https://s.monetag.com/tag.js';
      script.async = true;
      script.onload = initializeAd;
      script.onerror = () => console.error('Failed to load Monetag script');
      document.head.appendChild(script);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        initialized.current = false;
      }
    };
  }, [zoneId, size, siteId]);

  const [width, height] = size === '300x250' ? [300, 250] : [728, 90];

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{ 
        minHeight: `${height}px`,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      data-monetag-zone={zoneId}
      data-monetag-size={size}
    />
  );
}

