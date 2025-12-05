import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { PROPELLER_ADS_CONFIG, AdPlacement, PropellerAdsAnalytics } from '../../config/ads/propellerAdsConfig';

interface PropellerBannerAdProps {
  placement: 'about' | 'movie-card';
  className?: string;
  onError?: () => void;
  onSuccess?: () => void;
}

// Extend Window interface for PropellerAds
declare global {
  interface Window {
    propellerads: {
      init: (config: PropellerAdsConfig) => void;
    };
  }
}

interface PropellerAdsConfig {
  container: string;
  adUnitId: string;
  publisherId: string;
  width: number;
  height: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onClick?: () => void;
}

const PropellerBannerAd: React.FC<PropellerBannerAdProps> = ({ 
  placement, 
  className = '', 
  onError, 
  onSuccess 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(false); // Track if ad has been loaded once

  // Get ad unit ID based on placement
  const getAdUnitId = (): string => {
    switch (placement) {
      case 'about':
        return PROPELLER_ADS_CONFIG.adUnits.banner.aboutSection;
      case 'movie-card':
        return PROPELLER_ADS_CONFIG.adUnits.banner.movieCard;
      default:
        return '';
    }
  };

  // Load and display the ad - only load once, then persist
  const loadAd = useCallback(async () => {
    // If ad has already been loaded, don't reload
    if (hasLoadedRef.current) {
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);

      // Check if ads should be shown
      if (!AdPlacement.shouldShowAds()) {
        setIsLoading(false);
        return;
      }

      // Banner ads are not implemented with Monetag yet
      // For now, just mark as loaded (empty state)
      // TODO: Implement Monetag banner ads if needed
            setIsLoading(false);
      setIsVisible(false);
      setHasError(false);
      hasLoadedRef.current = true; // Mark as loaded so it won't reload

    } catch (error) {
      console.error('Error loading PropellerAds banner:', error);
      setHasError(true);
      setIsLoading(false);
      PropellerAdsAnalytics.trackAdError('banner', placement, error instanceof Error ? error.message : 'Unknown error');
      onError?.();
    }
  }, [placement, onError, onSuccess]);

  // Intersection Observer for lazy loading - only load once
  useEffect(() => {
    // Don't reload if already loaded
    if (hasLoadedRef.current) {
      return;
    }

    if (!PROPELLER_ADS_CONFIG.performance.lazyLoading) {
      loadAd();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && isLoading && !hasError && !hasLoadedRef.current) {
            loadAd();
            observer.disconnect();
          }
        });
      },
      { 
        rootMargin: '50px',
        threshold: 0.1 
      }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [placement, isLoading, hasError, loadAd]);

  // Set container ID after ref is attached to DOM
  useEffect(() => {
    if (adContainerRef.current && !containerIdRef.current) {
      const containerId = AdPlacement.generateAdId(placement);
      containerIdRef.current = containerId;
      adContainerRef.current.id = containerId;
    }
  }, [placement]);

  // Mark component as mounted
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Mark as unmounted
      isMountedRef.current = false;
      
      // Clean up intersection observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Don't render if ads shouldn't be shown
  if (!AdPlacement.shouldShowAds()) {
    return null;
  }

  return (
    <div 
      ref={adRef}
      className={`propeller-banner-ad ${className}`}
      style={{
        minHeight: isLoading ? '50px' : 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: hasError ? 'transparent' : (isVisible ? 'transparent' : '#f8f9fa'),
        borderRadius: '8px',
        margin: '8px 0',
        overflow: 'visible'
      }}
    >
      {isLoading && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
          <span className="ml-2 text-sm text-gray-500">Loading ad...</span>
        </div>
      )}
      
      {hasError && (
        <div className="text-center p-4 text-gray-500 text-sm">
          Ad unavailable
        </div>
      )}
      
      {/* Dedicated ad container - React doesn't render children here, only ad content */}
      <div 
        ref={adContainerRef}
        className="w-full"
        style={{ 
          display: isVisible ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          minHeight: '50px',
          height: 'auto',
          overflow: 'visible'
        }}
      >
          {/* PropellerAds content will be injected here */}
        </div>
    </div>
  );
};

// Memoize PropellerBannerAd to prevent unnecessary re-renders
export default memo(PropellerBannerAd, (prevProps, nextProps) => {
  return prevProps.placement === nextProps.placement &&
         prevProps.className === nextProps.className;
});
