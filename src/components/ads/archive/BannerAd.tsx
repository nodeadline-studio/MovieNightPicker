// Provider-agnostic Banner Ad Component

import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { adProviderManager } from '../../config/ads/adProviders';
import { AdPlacement, PROPELLER_ADS_CONFIG, PropellerAdsAnalytics } from '../../config/ads/propellerAdsConfig';
import { AdPlacement as AdPlacementType } from '../../config/ads/adProviders/types';

interface BannerAdProps {
  placement: 'about' | 'movie-card';
  className?: string;
  onError?: () => void;
  onSuccess?: () => void;
}

const BannerAd: React.FC<BannerAdProps> = ({ 
  placement, 
  className = '', 
  onError, 
  onSuccess 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string>('');
  const adRef = useRef<HTMLDivElement>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  // Load and display the ad using provider manager
  const loadAd = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);

      // Check if ads should be shown
      if (!AdPlacement.shouldShowAds()) {
        setIsLoading(false);
        return;
      }

      // Ensure container exists
      if (!adContainerRef.current) {
        throw new Error('Ad container ref not available');
      }

      // Wait for container ID to be set
      let retries = 0;
      const maxRetries = 10;
      while (retries < maxRetries && !containerIdRef.current) {
        await new Promise(resolve => setTimeout(resolve, 50));
        retries++;
      }

      if (!containerIdRef.current) {
        throw new Error('Container ID not set after waiting');
      }

      const containerId = containerIdRef.current;
      const [width, height] = AdPlacement.getBannerSize();

      // Use provider manager to load ad with fallback
      const result = await adProviderManager.loadBanner({
        container: containerId,
        placement: placement as AdPlacementType,
        width: width,
        height: height,
        onLoad: () => {
          if (!isMountedRef.current) return;
          setIsLoading(false);
          setIsVisible(true);
          PropellerAdsAnalytics.trackAdShown('banner', placement);
          onSuccess?.();
        },
        onError: (error: Error) => {
          if (!isMountedRef.current) return;
          console.error('Banner ad error:', error);
          setHasError(true);
          setIsLoading(false);
          PropellerAdsAnalytics.trackAdError('banner', placement, error.message || 'Unknown error');
          onError?.();
        },
        onClick: () => {
          PropellerAdsAnalytics.trackAdClicked('banner', placement);
        }
      });

      if (result.success) {
        setActiveProvider(result.provider);
      } else {
        throw result.error || new Error('Failed to load banner ad');
      }
    } catch (error) {
      console.error('Error loading banner ad:', error);
      if (isMountedRef.current) {
        setHasError(true);
        setIsLoading(false);
        onError?.();
      }
    }
  }, [placement, onError, onSuccess]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      
      if (containerIdRef.current) {
        adProviderManager.cleanup(containerIdRef.current);
      }
    };
  }, []);

  // Don't render if ads shouldn't be shown
  if (!AdPlacement.shouldShowAds()) {
    return null;
  }

  return (
    <div ref={adRef} className={className}>
      <div 
        ref={adContainerRef}
        className="w-full flex items-center justify-center min-h-[50px]"
        style={{
          minHeight: AdPlacement.getBannerSize()[1] + 'px'
        }}
      >
        {isLoading && (
          <div className="text-gray-400 text-xs">Loading ad...</div>
        )}
        {hasError && (
          <div className="text-gray-500 text-xs">Ad unavailable</div>
        )}
        {isVisible && activeProvider && (
          <div className="text-transparent text-xs" style={{ fontSize: '1px' }}>
            {/* Ad content loaded by provider */}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(BannerAd);

