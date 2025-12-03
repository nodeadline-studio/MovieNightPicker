import React, { useEffect, useRef } from 'react';

interface MonetagInterstitialOverlayProps {
  zoneId: string;
  canSkip: boolean;
  onClose: () => void;
}

/**
 * Monetag Interstitial Ad Overlay
 * Displays Monetag ad over the pause overlay but under the skip button
 * Ad becomes interactive when canSkip is true (after counter reaches zero)
 */
const MonetagInterstitialOverlay: React.FC<MonetagInterstitialOverlayProps> = ({
  zoneId,
  canSkip,
  onClose
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const adInitializedRef = useRef(false);

  // Load Monetag script
  useEffect(() => {
    if (scriptLoadedRef.current) return;

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="quge5.com/88/tag.min.js"]');
    
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://quge5.com/88/tag.min.js';
      script.setAttribute('data-zone', zoneId);
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.onload = () => {
        scriptLoadedRef.current = true;
        console.log('Monetag interstitial script loaded for zone', zoneId);
      };
      script.onerror = (error) => {
        console.error('Failed to load Monetag script:', error);
        // Still mark as loaded to prevent retries
        scriptLoadedRef.current = true;
      };
      document.head.appendChild(script);
    } else {
      scriptLoadedRef.current = true;
    }
  }, [zoneId]);

  // Initialize ad when container is ready
  useEffect(() => {
    if (!containerRef.current || adInitializedRef.current) return;

    // Wait for script to load and then initialize
    const checkAndInit = () => {
      if (scriptLoadedRef.current && containerRef.current && !adInitializedRef.current) {
        // Set data-zone attribute for Monetag to inject ad
        containerRef.current.setAttribute('data-zone', zoneId);
        adInitializedRef.current = true;
        console.log('Monetag interstitial ad container initialized');
      } else if (!scriptLoadedRef.current) {
        // Retry if script not loaded yet
        setTimeout(checkAndInit, 100);
      }
    };

    checkAndInit();
  }, [zoneId]);

  // Make ad interactive when canSkip is true (counter reached zero)
  useEffect(() => {
    if (!containerRef.current) return;

    if (canSkip) {
      // Enable pointer events when skip is available - user can now interact with ad
      containerRef.current.style.pointerEvents = 'auto';
      containerRef.current.style.cursor = 'pointer';
    } else {
      // Disable interaction until skip is available
      containerRef.current.style.pointerEvents = 'none';
      containerRef.current.style.cursor = 'default';
    }
  }, [canSkip]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{
        zIndex: canSkip ? 1 : 0, // Relative to parent overlay (parent is z-9999)
        pointerEvents: canSkip ? 'auto' : 'none',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
      }}
      data-zone={zoneId}
    />
  );
};

export default MonetagInterstitialOverlay;
export { MonetagInterstitialOverlay };

