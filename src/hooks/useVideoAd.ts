import { useState, useEffect, useCallback, useRef } from 'react';
import { usePickCounter } from './usePickCounter';

interface UseVideoAdOptions {
  onClose?: () => void;
  onError?: () => void;
  enableTestAds?: boolean;
  pickCounter?: ReturnType<typeof usePickCounter>;
}

export function useVideoAd({ onClose, onError, pickCounter, enableTestAds = true }: UseVideoAdOptions = {}) {
  const [visible, setVisible] = useState(false);
  const [skipIn, setSkipIn] = useState<number|null>(null);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout>|undefined>();
  const [hasStarted, setHasStarted] = useState(false);
  const [isVideoPreloading, setIsVideoPreloading] = useState(false);
  const [adType, setAdType] = useState<'video' | 'google'>('video');
  const [lastShownAt, setLastShownAt] = useState<number>(0);
  const adRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasUserInteracted = useRef<boolean>(false);
  const videoPreloadRef = useRef<HTMLVideoElement | null>(null);

  // Ad frequency: show every 7 picks instead of 5
  const AD_FREQUENCY = 7;

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
        
        console.log('Video preloaded successfully');
      } catch (error) {
        console.error('Video preload failed:', error);
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

  const handleFallback = useCallback(() => {
    if (!navigator.onLine) {
      close();
      return;
    }
    
    // Show house ad fallback
    if (adRef.current) {
      const video = document.createElement('video');
      video.src = '/assets/house-ad.mp4';
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      adRef.current.appendChild(video);
      
      // Allow skip after 10s for fallback
      setTimeout(() => {
        setSkipIn(0);
      }, 10000);
    }
  }, [close]);

  const maybeShow = useCallback((count: number) => {
    // Prevent double showing - check if already shown recently
    if (count === lastShownAt) {
      console.log('Ad already shown for this count:', count);
      return;
    }

    // Only show ad every AD_FREQUENCY picks and ensure user has interacted
    if (!hasUserInteracted.current || count === 0 || count % AD_FREQUENCY !== 0) {
      console.log('Ad not shown:', { 
        hasInteracted: hasUserInteracted.current, 
        count, 
        mod: count % AD_FREQUENCY,
        frequency: AD_FREQUENCY 
      });
      return;
    }
    
    console.log('Showing ad for pick count:', count);
    setLastShownAt(count);
    
    // Alternate between video ads and Google Ads (future)
    // For now, always show video ads
    const shouldShowGoogle = false; // count % (AD_FREQUENCY * 2) === 0;
    setAdType(shouldShowGoogle ? 'google' : 'video');
    
    setVisible(true);
    
    // If user is offline, allow instant skip
    if (!navigator.onLine) {
      setSkipIn(0);
      return;
    }

    // Don't auto-close the ad - let user control when to skip
    // Video will handle its own timing logic
  }, [lastShownAt]);

  const loadGoogleAds = useCallback(() => {
    // Future Google Ads implementation
    // This will be implemented when we activate Google Ads
    console.log('Google Ads would load here');
    
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
      console.log('User interaction flag set');
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