import React, { useEffect, useRef, useState } from 'react';
import { useVideoAd } from '../hooks/useVideoAd';
import { X } from 'lucide-react';
import Button from './ui/Button';
import { useLayoutEffect } from 'react';

interface VideoAdProps {
  onClose: () => void;
  onError: () => void;
  enableTestAds?: boolean;
  mockMode?: boolean;
}

const VideoAd: React.FC<VideoAdProps> = ({ onClose, onError, enableTestAds = true, mockMode = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const { hasStarted, setHasStarted } = useVideoAd();
  const [adDisplayContainer, setAdDisplayContainer] = useState<google.ima.AdDisplayContainer | null>(null);
  const [adsLoader, setAdsLoader] = useState<google.ima.AdsLoader | null>(null);
  const [adsManager, setAdsManager] = useState<google.ima.AdsManager | null>(null);
  const [canSkip, setCanSkip] = useState(false);
  const [remainingTime, setRemainingTime] = useState(mockMode ? 5 : 30);
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackTimer, setFallbackTimer] = useState(mockMode ? 5 : 10);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const [imaLoaded, setImaLoaded] = useState(false);

  useLayoutEffect(() => {
    if (mockMode) {
      handleFallback();
      return;
    }
    
    // Check if IMA SDK is loaded
    const checkIMA = () => {
      if (window.google?.ima) {
        setImaLoaded(true);
        return;
      }
      
      // If not loaded after 5 seconds, show fallback
      setTimeout(() => {
        if (!window.google?.ima) {
          console.warn('IMA SDK failed to load');
          handleFallback();
        }
      }, 5000);
    };

    checkIMA();
    
    // Wait for IMA SDK to load
    if (!window.google?.ima) {
      const script = document.createElement('script');
      script.src = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';
      script.async = true;
      script.onload = checkIMA;
      document.head.appendChild(script);
      return;
    }
  }, []);

  useEffect(() => {
    if (mockMode) return;
    
    if (!imaLoaded || !adContainerRef.current || !videoRef.current) return;
    
    // Initialize IMA SDK
    const displayContainer = new google.ima.AdDisplayContainer(
      adContainerRef.current,
      videoRef.current!
    );
    setAdDisplayContainer(displayContainer);

    const loader = new google.ima.AdsLoader(displayContainer);
    setAdsLoader(loader);

    loader.addEventListener(
      google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      onAdsManagerLoaded,
      false
    );

    loader.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      onAdError,
      false
    );

    // Request video ads
    const adsRequest = new google.ima.AdsRequest();
    adsRequest.adTagUrl = `https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_preroll_skippable&sz=640x480&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=${Date.now()}${enableTestAds ? '&adtest=on' : ''}`;

    // Specify the linear and nonlinear slot sizes
    adsRequest.linearAdSlotWidth = 640;
    adsRequest.linearAdSlotHeight = 400;
    adsRequest.nonLinearAdSlotWidth = 640;
    adsRequest.nonLinearAdSlotHeight = 150;

    // Request ads
    try {
      displayContainer.initialize();
      loader.requestAds(adsRequest);
    } catch (error) {
      console.error('Error requesting ads:', error);
      handleFallback();
    }

    return () => {
      // Clear all timers
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      
      if (adsManager) {
        adsManager.destroy();
      }
      if (adsLoader) {
        adsLoader.destroy();
      }
    };
  }, []);

  // Don't initialize ads until IMA is loaded
  if (!imaLoaded && !mockMode) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center ad-modal">
        <div className="w-full max-w-[95vw] md:max-w-5xl bg-gray-900 rounded-xl overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-white/60">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mr-2" />
            Loading ad system...
          </div>
        </div>
      </div>
    );
  }
  const onAdsManagerLoaded = (adsManagerLoadedEvent: google.ima.AdsManagerLoadedEvent) => {
    const adsRenderingSettings = new google.ima.AdsRenderingSettings();
    adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;

    const manager = adsManagerLoadedEvent.getAdsManager(
      videoRef.current!,
      adsRenderingSettings
    );
    setAdsManager(manager);

    manager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, onAllAdsCompleted);
    manager.addEventListener(google.ima.AdEvent.Type.COMPLETE, onAdComplete);
    manager.addEventListener(google.ima.AdEvent.Type.SKIPPED, onAdSkipped);
    manager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
    manager.addEventListener(google.ima.AdEvent.Type.STARTED, () => {
      onAdStarted();
      setHasStarted(true);
    });

    try {
      manager.init(640, 360, google.ima.ViewMode.NORMAL);
      manager.start();
    } catch (error) {
      console.error('Error starting ads manager:', error);
      handleFallback();
    }
  };

  const onAdError = () => {
    if (adsManager) {
      adsManager.destroy();
    }
    handleFallback();
  };

  const onAdComplete = () => {
    onClose();
  };

  const onAdSkipped = () => {
    onClose();
  };

  const onAllAdsCompleted = () => {
    onClose();
  };

  const onAdStarted = () => {
    // Start countdown timer
    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    timersRef.current.push(timer);
  };

  const handleFallback = () => {
    setShowFallback(true);
    // Start fallback timer - reduced for better user experience
    const skipTime = mockMode ? 5 : 10;
    const timer = setInterval(() => {
      setFallbackTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return Math.max(0, prev - 1);
      });
    }, mockMode ? 500 : 1000);
    timersRef.current.push(timer);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center ad-modal">
      <div className="w-full max-w-[95vw] md:max-w-5xl bg-gray-900 rounded-xl overflow-hidden relative">
        {!hasStarted && (
          <div className="absolute inset-0 flex items-center justify-center text-white/60">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mr-2" />
            Fetching ad...
          </div>
        )}
        <div className="p-4 border-b border-gray-800 flex flex-col md:flex-row gap-2 md:gap-4">
          <h3 className="text-lg font-semibold">Advertisement</h3>
          <p className="text-sm text-gray-400 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Your movie will be shown after this short ad
          </p>
        </div>
        
        <div className="bg-black relative ad-player w-full aspect-video">
          {showFallback ? (
            <div className="w-full h-full">
              <video
                ref={videoRef}
                className="w-full h-full object-contain bg-black"
                src="/assets/house-ad.mp4"
                autoPlay
                muted
                playsInline
                onPlay={() => setHasStarted(true)}
              />
              {canSkip && (
                <Button
                  variant="primary"
                  className="absolute bottom-4 right-4"
                  onClick={onClose}
                >
                  Skip Ad
                </Button>
              )}
              {!canSkip && (
                <div className="absolute bottom-4 right-4 bg-gray-900/80 backdrop-blur-sm text-sm px-3 py-1.5 rounded-lg">
                  Skip in {fallbackTimer}s
                </div>
              )}
            </div>
          ) : (
            <>
              <div ref={adContainerRef} className="absolute inset-0">
                <video ref={videoRef} className="w-full h-full object-contain bg-black" />
              </div>
              {!canSkip && remainingTime > 0 && (
                <div className="absolute bottom-4 right-4 bg-gray-900/80 backdrop-blur-sm text-sm px-3 py-1.5 rounded-lg">
                  Ad ends in {remainingTime}s
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoAd;