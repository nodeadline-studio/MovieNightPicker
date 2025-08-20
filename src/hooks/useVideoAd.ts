import { useState, useEffect, useCallback, useRef } from 'react';
import { usePickCounter } from './usePickCounter';
import { AD_CONFIG, AdFrequencyManager } from '../config/adConfig';
import { logger } from '../utils/logger';

interface UseVideoAdOptions {
  onClose?: () => void;
  onError?: () => void;
  enableTestAds?: boolean;
  pickCounter?: ReturnType<typeof usePickCounter>;
}

export function useVideoAd({ onClose }: UseVideoAdOptions = {}) {
  const [visible, setVisible] = useState(false);
  const [skipIn, setSkipIn] = useState<number|null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isVideoPreloading, setIsVideoPreloading] = useState(false);
  const [adType, setAdType] = useState<'video' | 'google'>('video');
  const [lastShownAt, setLastShownAt] = useState<number>(0);
  const adRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasUserInteracted = useRef<boolean>(false);
  const videoPreloadRef = useRef<HTMLVideoElement | null>(null);
  const frequencyManager = useRef<AdFrequencyManager>(new AdFrequencyManager());

  // Preload video in background
  useEffect(() => {
    const preloadVideo = async () => {
      if (isVideoPreloading) return;
      
      setIsVideoPreloading(true);
      try {
        const video = document.createElement('video');
        video.src = '/ad_preview_optimized.mp4';
        video.preload = 'auto';
        video.muted = true;
        video.playsInline = true;
        
        // Store reference for cleanup
        videoPreloadRef.current = video;
        
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          video.onloadeddata = resolve;
          video.onerror = reject;
          video.load();
        });
        
        logger.debug('Video preloaded successfully', undefined, { prefix: 'VideoAd' });
      } catch (error) {
        logger.warn('Video preload failed', error, { prefix: 'VideoAd' });
      }
    };

    // Start preloading after a short delay to not interfere with initial page load
    const preloadTimer = setTimeout(preloadVideo, 2000);
    
    return () => {
      clearTimeout(preloadTimer);
      if (videoPreloadRef.current) {
        videoPreloadRef.current.src = '';
        videoPreloadRef.current = null;
      }
    };
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setSkipIn(null);
    setHasStarted(false);
    if (adRef.current) {
      adRef.current.innerHTML = '';
    }
    // Clear all timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    onClose?.();
  }, [onClose]);

  const maybeShow = useCallback((count: number) => {
    // Check for forced ads (testing)
    const forceVideo = localStorage.getItem('force_video_ad') === 'true';
    const forceGoogle = localStorage.getItem('force_google_ad') === 'true';
    
    if (forceVideo) {
      localStorage.removeItem('force_video_ad');
      setAdType('video');
      setVisible(true);
      setLastShownAt(count);
      logger.debug('🎬 Forced video ad shown', undefined, { prefix: 'VideoAd' });
      return;
    }
    
    if (forceGoogle) {
      localStorage.removeItem('force_google_ad');
      setAdType('google');
      setVisible(true);
      setLastShownAt(count);
      logger.debug('📺 Forced Google ad shown', undefined, { prefix: 'VideoAd' });
      return;
    }

    // Prevent double showing
    if (count === lastShownAt) {
      logger.debug('Ad already shown for this count:', count, { prefix: 'VideoAd' });
      return;
    }

    // Use the frequency manager to determine ad type
    const adTypeToShow = frequencyManager.current.shouldShowAd(count);
    
    if (!adTypeToShow) {
      const debugInfo = frequencyManager.current.getDebugInfo();
      logger.debug('No ad to show:', debugInfo, { prefix: 'VideoAd' });
      return;
    }
    
    logger.debug(`🎯 Showing ${adTypeToShow} ad for pick count:`, count, { prefix: 'VideoAd' });
    logger.debug('Debug info:', frequencyManager.current.getDebugInfo(), { prefix: 'VideoAd' });
    
    setLastShownAt(count);
    setAdType(adTypeToShow);
    setVisible(true);
    
    // If user is offline and setting allows, enable instant skip
    if (!navigator.onLine && AD_CONFIG.general.offlineSkipEnabled) {
      setSkipIn(0);
      return;
    }

    // Video/Google ad will handle its own timing logic based on config
  }, [lastShownAt]);

  const loadGoogleAds = useCallback(() => {
    // Future Google Ads implementation
    // This will be implemented when we activate Google Ads
    logger.debug('Google Ads would load here', undefined, { prefix: 'VideoAd' });
    
    // Placeholder for Google Ads script loading
    /*
    if (!window.googletag) {
      const script = document.createElement('script');
      script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
      script.async = true;
      document.head.appendChild(script);
      
      script.onload = () => {
        window.googletag = window.googletag || { cmd: [] };
        window.googletag.cmd.push(() => {
          // Define ad slots here
        });
      };
    }
    */
  }, []);

  useEffect(() => {
    return () => {
      // Clear all timers on unmount
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      
      // Cleanup preloaded video
      if (videoPreloadRef.current) {
        videoPreloadRef.current.src = '';
        videoPreloadRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Set user interaction flag after a slight delay to prevent immediate ad show
    const timer = setTimeout(() => {
      hasUserInteracted.current = true;
      logger.debug('User interaction flag set', undefined, { prefix: 'VideoAd' });
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return {
    visible,
    skipIn,
    hasStarted,
    setHasStarted,
    adRef,
    setSkipIn,
    close,
    maybeShow,
    isVideoPreloading,
    adType,
    loadGoogleAds
  };
}