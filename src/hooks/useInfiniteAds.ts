import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteAdsOptions {
  enabled?: boolean;
  threshold?: number;
  maxAds?: number;
  startingSlot?: number;
}

export const useInfiniteAds = ({
  enabled = true,
  threshold = 0.5,
  maxAds = 10,
  startingSlot = 5
}: UseInfiniteAdsOptions = {}) => {
  const [adSlots, setAdSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadedAdsCount = useRef(0);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  const generateSlotId = useCallback((index: number) => {
    return `543678219${startingSlot + index}`;
  }, [startingSlot]);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const trigger = entries[0];
    if (trigger.isIntersecting && !isLoading && loadedAdsCount.current < maxAds) {
      setIsLoading(true);
      
      // Add new ad slot
      setAdSlots(prev => {
        const newSlot = generateSlotId(loadedAdsCount.current);
        loadedAdsCount.current += 1;
        return [...prev, newSlot];
      });

      // Reset loading state after a delay
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  }, [isLoading, maxAds, generateSlotId]);

  useEffect(() => {
    if (!enabled) return;

    observer.current = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: '100px',
      threshold
    });

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [enabled, threshold, handleIntersection]);

  const triggerElement = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) {
      observer.current.disconnect();
    }
    
    if (node && enabled) {
      triggerRef.current = node;
      observer.current?.observe(node);
    }
  }, [enabled]);

  return {
    adSlots,
    triggerRef: triggerElement,
    isLoading,
    hasMoreAds: loadedAdsCount.current < maxAds
  };
};