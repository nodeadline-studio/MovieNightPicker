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
  const adRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasUserInteracted = useRef<boolean>(false);

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
    
    // Show house ad
    if (adRef.current) {
      const video = document.createElement('video');
      video.src = '/assets/house-ad.mp4';
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      adRef.current.appendChild(video);
      
      // Allow skip after 15s
      setTimeout(() => {
        setSkipIn(0);
      }, 15000);
    }
  }, [close]);

  const maybeShow = useCallback((count: number) => {
    // Only show ad every 5 picks
    if (!hasUserInteracted.current || count === 0 || count % 5 !== 0) return;
    setVisible(true);
    
    const started = { current: false };
    
    // Add watchdog for creative load
    const creativeWatchdog = setTimeout(() => {
      if (!adRef.current?.querySelector('video, iframe')) {
        console.warn('No video/iframe found after timeout → closing');
        close();
      }
    }, 4500);
    
    timersRef.current.push(creativeWatchdog);
    
    // If user is offline, allow instant skip
    if (!navigator.onLine) {
      setSkipIn(0);
      return;
    }

    // Set 7-second timeout for ad load
    const timeout = setTimeout(() => {
      console.warn('Ad load timeout → fallback');
      setSkipIn(0);
      if (!started.current) {
        handleFallback();
      }
    }, 7000);
    timersRef.current.push(timeout);
    
    // Set 3.5-second timeout for creative check
    const creativeTimeout = setTimeout(() => {
      if (adRef.current && adRef.current.querySelectorAll('iframe').length === 0) {
        console.warn('No video ad – closing overlay');
        if (!started.current) {
          handleFallback();
        }
      }
    }, 3500);
    timersRef.current.push(creativeTimeout);

    setTimeoutId(timeout);
  }, [onError, handleFallback, close]);

  useEffect(() => {
    return () => {
      // Clear all timers on unmount
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    // Set user interaction flag after a slight delay to prevent immediate ad show
    const timer = setTimeout(() => {
      hasUserInteracted.current = true;
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
    maybeShow
  };
}