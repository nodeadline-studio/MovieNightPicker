import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PROPELLER_ADS_CONFIG, PropellerAdsLoader, AdPlacement, PropellerAdsAnalytics } from '../config/propellerAdsConfig';
import { MockPropellerAds } from '../config/propellerAdsMock';

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
  const adContainerRef = useRef<HTMLDivElement>(null); // Dedicated container for ad content (React doesn't manage this)
  const observerRef = useRef<IntersectionObserver | null>(null);
  const mockAdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

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

  // Load and display the ad
  const loadAd = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);

      // Check if ads should be shown
      if (!AdPlacement.shouldShowAds()) {
        setIsLoading(false);
        return;
      }

      // Check if we're in development mode
      const isDevelopment = process.env.NODE_ENV === 'development' || 
                           typeof window !== 'undefined' && window.location.hostname === 'localhost';

      if (isDevelopment) {
        // Use mock banner ad
        const mockAds = MockPropellerAds.getInstance();
        const containerId = AdPlacement.generateAdId(placement);
        containerIdRef.current = containerId;
        
        // Ensure dedicated ad container exists before initializing
        if (!adContainerRef.current) {
          throw new Error('Ad container ref not available');
        }
        
        // Set container ID on the dedicated ad container (not the main container)
        adContainerRef.current.id = containerId;
        
        // Wait for next tick to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Check if component is still mounted
        if (!isMountedRef.current || !adContainerRef.current) {
          return; // Component unmounted, don't proceed
        }
        
        // Double-check dedicated container exists in DOM and is connected
        const container = document.getElementById(containerId);
        if (!container || !container.isConnected) {
          throw new Error('Container not found in DOM or not connected');
        }

        const [width, height] = AdPlacement.getBannerSize();
        mockAds.init({
          container: containerId,
          adUnitId: getAdUnitId(),
          publisherId: PROPELLER_ADS_CONFIG.publisherId,
          width: width,
          height: height,
          onLoad: () => {
            // Check if component is still mounted before updating state
            if (!isMountedRef.current) return;
            setIsLoading(false);
            setIsVisible(true);
            PropellerAdsAnalytics.trackAdShown('banner', placement);
            onSuccess?.();
          },
          onError: (error: Error) => {
            // Check if component is still mounted before updating state
            if (!isMountedRef.current) return;
            console.error('Mock banner error:', error);
            setHasError(true);
            setIsLoading(false);
            PropellerAdsAnalytics.trackAdError('banner', placement, error.message || 'Unknown error');
            onError?.();
          },
          onClick: () => {
            PropellerAdsAnalytics.trackAdClicked('banner', placement);
          }
        });
        return;
      }

      // Load PropellerAds script if not already loaded
      const loader = PropellerAdsLoader.getInstance();
      await loader.loadScript();

      // Wait for PropellerAds to be available
      if (!(window as any).propellerads) {
        throw new Error('PropellerAds not available');
      }

      // Generate unique container ID
      const containerId = AdPlacement.generateAdId(placement);
      containerIdRef.current = containerId;
      if (adContainerRef.current) {
        adContainerRef.current.id = containerId;
      }

      // Get appropriate banner size
      const [width, height] = AdPlacement.getBannerSize();

      // Initialize the ad
      if ((window as any).propellerads && (window as any).propellerads.init) {
        (window as any).propellerads.init({
          container: containerId,
          adUnitId: getAdUnitId(),
          publisherId: PROPELLER_ADS_CONFIG.publisherId,
          width: width,
          height: height,
          onLoad: () => {
            // Check if component is still mounted before updating state
            if (!isMountedRef.current) return;
            setIsLoading(false);
            setIsVisible(true);
            PropellerAdsAnalytics.trackAdShown('banner', placement);
            onSuccess?.();
          },
          onError: (error: Error) => {
            // Check if component is still mounted before updating state
            if (!isMountedRef.current) return;
            console.error('PropellerAds banner error:', error);
            setHasError(true);
            setIsLoading(false);
            PropellerAdsAnalytics.trackAdError('banner', placement, error.message || 'Unknown error');
            onError?.();
          },
          onClick: () => {
            PropellerAdsAnalytics.trackAdClicked('banner', placement);
          }
        });
      } else {
        throw new Error('PropellerAds initialization failed');
      }

    } catch (error) {
      console.error('Error loading PropellerAds banner:', error);
      setHasError(true);
      setIsLoading(false);
      PropellerAdsAnalytics.trackAdError('banner', placement, error instanceof Error ? error.message : 'Unknown error');
      onError?.();
    }
  }, [placement, onError, onSuccess]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!PROPELLER_ADS_CONFIG.performance.lazyLoading) {
      loadAd();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && isLoading && !hasError) {
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
      
      // Clean up mock ad content to prevent React removeChild errors
      if (containerIdRef.current) {
        // Destroy mock ad instance (this will clean up the ad element only)
        const mockAds = MockPropellerAds.getInstance();
        mockAds.destroy(containerIdRef.current);
      }
      
      // Clear any pending timeouts
      if (mockAdTimeoutRef.current) {
        clearTimeout(mockAdTimeoutRef.current);
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
        backgroundColor: hasError ? 'transparent' : '#f8f9fa',
        borderRadius: '8px',
        margin: '16px 0',
        overflow: 'hidden'
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
        className="w-full h-full"
        style={{ 
          display: isVisible ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%'
        }}
      >
        {/* PropellerAds content will be injected here */}
      </div>
    </div>
  );
};

export default PropellerBannerAd;
