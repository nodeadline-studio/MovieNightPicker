import { useState, useCallback, useRef, useEffect } from 'react';
import { usePickCounter } from './usePickCounter';
import { PROPELLER_ADS_CONFIG, PropellerAdsLoader, AdPlacement } from '../config/propellerAdsConfig';
import { logger } from '../utils/logger';

interface UsePropellerAdsOptions {
  onClose?: () => void;
  onError?: () => void;
  enableTestAds?: boolean;
  pickCounter?: ReturnType<typeof usePickCounter>;
}

export function usePropellerAds({ onClose, pickCounter }: UsePropellerAdsOptions = {}) {
  const [visible, setVisible] = useState(false);
  const [adType, setAdType] = useState<'banner' | 'interstitial'>('banner');
  const [lastShownAt, setLastShownAt] = useState<number>(0);
  const adRef = useRef<HTMLDivElement>(null);
  const hasUserInteracted = useRef<boolean>(false);

  // Initialize PropellerAds script
  useEffect(() => {
    const initializePropellerAds = async () => {
      try {
        const loader = PropellerAdsLoader.getInstance();
        await loader.loadScript();
        logger.debug('PropellerAds script loaded successfully', undefined, { prefix: 'PropellerAds' });
      } catch (error) {
        logger.warn('Failed to load PropellerAds script', error, { prefix: 'PropellerAds' });
      }
    };

    initializePropellerAds();
  }, []);

  // Set user interaction flag after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      hasUserInteracted.current = true;
      logger.debug('User interaction flag set', undefined, { prefix: 'PropellerAds' });
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    onClose?.();
  }, [onClose]);

  const showInterstitial = useCallback((count: number) => {
    // Check for forced ads (testing)
    const forceInterstitial = localStorage.getItem('force_propeller_interstitial') === 'true';
    
    if (forceInterstitial) {
      localStorage.removeItem('force_propeller_interstitial');
      setAdType('interstitial');
      setVisible(true);
      setLastShownAt(count);
      logger.debug('🎯 Forced PropellerAds interstitial shown', undefined, { prefix: 'PropellerAds' });
      return;
    }

    // Prevent double showing
    if (count === lastShownAt) {
      logger.debug('PropellerAds interstitial already shown for this count:', count, { prefix: 'PropellerAds' });
      return;
    }

    // Check if it's time to show an ad (every 5 picks)
    if (count > 0 && count % 5 === 0) {
      logger.debug(`🎯 Showing PropellerAds interstitial for pick count:`, count, { prefix: 'PropellerAds' });
      setLastShownAt(count);
      setAdType('interstitial');
      setVisible(true);
    }
  }, [lastShownAt]);

  const showBanner = useCallback((placement: 'about' | 'movie-card') => {
    // Banner ads are always shown when component is rendered
    // This function is for future banner management if needed
    logger.debug(`PropellerAds banner shown at ${placement}`, undefined, { prefix: 'PropellerAds' });
  }, []);

  // Check if ads should be shown
  const shouldShowAds = useCallback(() => {
    return AdPlacement.shouldShowAds();
  }, []);

  // Reset ad state (useful for testing)
  const resetAdState = useCallback(() => {
    setVisible(false);
    setLastShownAt(0);
    localStorage.removeItem('force_propeller_interstitial');
    logger.debug('PropellerAds state reset', undefined, { prefix: 'PropellerAds' });
  }, []);

  // Force show interstitial (for testing)
  const forceShowInterstitial = useCallback(() => {
    localStorage.setItem('force_propeller_interstitial', 'true');
    const count = pickCounter?.current() || 0;
    showInterstitial(count + 1);
  }, [pickCounter, showInterstitial]);

  return {
    visible,
    adType,
    adRef,
    close,
    showInterstitial,
    showBanner,
    shouldShowAds,
    resetAdState,
    forceShowInterstitial,
    // Legacy compatibility
    maybeShow: showInterstitial,
  };
}

// Testing utilities
export const PropellerAdsTesting = {
  // Force show interstitial ad on next pick
  forceInterstitialAd: () => {
    localStorage.setItem('force_propeller_interstitial', 'true');
  },
  
  // Reset all ad state
  resetAdState: () => {
    localStorage.removeItem('force_propeller_interstitial');
  },
  
  // Enable debug mode
  enableDebug: () => {
    PROPELLER_ADS_CONFIG.performance.debugMode = true;
    logger.debug('PropellerAds debug mode enabled', undefined, { prefix: 'PropellerAds' });
  },
  
  // Disable debug mode
  disableDebug: () => {
    PROPELLER_ADS_CONFIG.performance.debugMode = false;
    logger.debug('PropellerAds debug mode disabled', undefined, { prefix: 'PropellerAds' });
  }
};

  // Global debug access
  if (typeof window !== 'undefined') {
    (window as Window & { PropellerAdsTesting?: typeof PropellerAdsTesting }).PropellerAdsTesting = PropellerAdsTesting;
  }

export default usePropellerAds;
