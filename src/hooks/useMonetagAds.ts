import { useState, useCallback, useRef, useEffect } from 'react';
import { usePickCounter } from './usePickCounter';

interface UseMonetagAdsOptions {
  onClose?: () => void;
  onError?: () => void;
  pickCounter?: ReturnType<typeof usePickCounter>;
  frequency?: number; // Show interstitial every X rerolls (default: 5)
}

export function useMonetagAds({ 
  onClose, 
  pickCounter,
  frequency = 5 
}: UseMonetagAdsOptions = {}) {
  const [visible, setVisible] = useState(false);
  const [lastShownAt, setLastShownAt] = useState<number>(0);
  const counter = pickCounter || usePickCounter();

  // Initialize lastShownAt from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('monetag_last_shown_at');
    if (stored) {
      const storedCount = parseInt(stored, 10);
      if (storedCount > 0) {
        setLastShownAt(storedCount);
      }
    }
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    onClose?.();
  }, [onClose]);

  const showInterstitial = useCallback((count: number) => {
    // Prevent double showing - check both state and localStorage
    const storedLastShown = parseInt(localStorage.getItem('monetag_last_shown_at') || '0', 10);
    if (count === lastShownAt || count === storedLastShown) {
      return;
    }

    // Check if it's time to show an ad (every X rerolls, default 5)
    if (count > 0 && count % frequency === 0) {
      // Additional check: ensure we haven't shown an ad for this exact count
      if (count !== lastShownAt && count !== storedLastShown) {
        setLastShownAt(count);
        localStorage.setItem('monetag_last_shown_at', count.toString());
        setVisible(true);
      }
    }
  }, [lastShownAt, frequency]);

  // Reset ad state (useful for testing)
  const resetAdState = useCallback(() => {
    setVisible(false);
    setLastShownAt(0);
    localStorage.removeItem('monetag_last_shown_at');
  }, []);

  return {
    visible,
    close,
    showInterstitial,
    resetAdState,
    pickCounter: counter,
  };
}

