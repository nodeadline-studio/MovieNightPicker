import React, { useEffect, useRef, useCallback, useState } from 'react';
import { X, Play, Volume2, VolumeX } from 'lucide-react';
import { AD_CONFIG } from '../config/adConfig';
import * as gtag from '../utils/gtag';

// Google IMA types
interface GoogleIMA {
  AdDisplayContainer: new (container: HTMLElement) => AdDisplayContainer;
  AdsLoader: new (adsManagerLoadedEvent: AdsManagerLoadedEvent) => AdsLoader;
  AdsManagerLoadedEvent: new () => AdsManagerLoadedEvent;
  AdsRequest: new () => AdsRequest;
  AdErrorEvent: new () => AdErrorEvent;
  AdEvent: new () => AdEvent;
  AdsRenderingSettings: new () => AdsRenderingSettings;
  ViewMode: {
    NORMAL: string;
    FULLSCREEN: string;
  };
}

interface AdDisplayContainer {
  initialize: () => void;
  destroy: () => void;
}

interface AdsLoader {
  addEventListener: (event: string, callback: (event: unknown) => void) => void;
  requestAds: (adsRequest: AdsRequest) => void;
  destroy: () => void;
}

interface AdsManagerLoadedEvent {
  getAdsManager: (videoTimeOffset?: number, adsRenderingSettings?: AdsRenderingSettings) => AdsManager;
}

interface AdsRequest {
  vastLoadTimeout?: number;
  numRedirects?: number;
  adTagUrl?: string;
  linearAdSlotWidth?: number;
  linearAdSlotHeight?: number;
  nonLinearAdSlotWidth?: number;
  nonLinearAdSlotHeight?: number;
}

interface AdErrorEvent {
  getError: () => AdError;
  Type?: string;
}

interface AdError {
  getErrorCode: () => number;
  getMessage: () => string;
}

interface AdEvent {
  getType: () => string;
  Type?: string;
}

interface AdsRenderingSettings {
  loadVideoTimeout?: number;
  restoreCustomPlaybackStateOnAdBreakComplete?: boolean;
}

interface AdsManager {
  addEventListener: (event: string, callback: (event: unknown) => void) => void;
  init: (width: number, height: number, viewMode: string) => void;
  start: () => void;
  destroy: () => void;
}

interface GoogleWindow extends Window {
  google?: {
    ima: GoogleIMA;
  };
}

declare global {
  interface Window {
    google?: {
      ima: GoogleIMA;
    };
  }
}

interface GoogleVideoAdProps {
  onClose: () => void;
  onError: () => void;
  adUnitId?: string;
}

const GoogleVideoAd: React.FC<GoogleVideoAdProps> = ({ 
  onClose, 
  onError,
  adUnitId = AD_CONFIG.googleAds.videoAdUnitId 
}) => {
  const [canSkip, setCanSkip] = useState(false);
  const [remainingTime, setRemainingTime] = useState(AD_CONFIG.googleAds.skipDelay);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [adDuration, setAdDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number>();
  const adsManagerRef = useRef<AdsManager | null>(null);
  const adsLoaderRef = useRef<AdsLoader | null>(null);
  const adDisplayContainerRef = useRef<AdDisplayContainer | null>(null);

  // Generate Google Ad Manager ad tag URL
  const generateAdTagUrl = () => {
    const baseUrl = 'https://pubads.g.doubleclick.net/gampad/ads';
    const params = new URLSearchParams({
      iu: `/22558409356/${adUnitId}`, // Your ad unit path
      sz: '640x480|400x300', // Video ad sizes
      impl: 's',
      gdfp_req: '1',
      env: 'vp',
      output: 'vast',
      unviewed_position_start: '1',
      url: window.location.href,
      correlator: Date.now().toString(),
    });

    return `${baseUrl}?${params.toString()}`;
  };

  // Fallback to house ad
  const handleFallback = useCallback(() => {
    console.log('Falling back to house ad');
    setIsLoading(false);
    // setShowFallback(true); // This state variable is not defined in the original file
  }, []);

  // Ad event handlers
  const onAdStarted = useCallback(() => {
    setIsPlaying(true);
    if (adsManagerRef.current) {
      gtag.event('ad_started', {
        ad_type: 'google_video',
        ad_unit_id: adUnitId,
      });
      console.log('📺 Google video ad started');
    }
  }, [adUnitId]);

  const onAdCompleted = useCallback(() => {
    gtag.event('ad_completed', {
      ad_type: 'google_video',
      ad_unit_id: adUnitId,
    });
    console.log('📺 Google video ad completed');
    setIsPlaying(false);
    onClose();
  }, [adUnitId, onClose]);

  const onAdError = useCallback((event: unknown) => {
    console.error('Google Video Ad Error:', (event as AdErrorEvent).getError());
    gtag.event('ad_error', {
      ad_type: 'google_video',
      ad_unit_id: adUnitId,
      error: (event as AdErrorEvent).getError()?.getMessage() || 'Unknown error',
    });
    
    handleFallback();
  }, [adUnitId, handleFallback]);

  // Handle ads loaded event
  const handleAdsLoaded = useCallback((event: unknown) => {
    try {
      const adsManager = (event as AdsManagerLoadedEvent).getAdsManager();
      adsManager.addEventListener('adsManagerLoaded', () => {
        console.log('Ads manager loaded');
      });
      
      adsManager.addEventListener('adError', (adErrorEvent: unknown) => {
        console.error('Ad error:', (adErrorEvent as AdErrorEvent).getError());
        onAdError();
      });
      
      adsManager.addEventListener('adStarted', () => {
        console.log('Ad started');
        onAdStarted();
      });
      
      adsManager.addEventListener('adCompleted', () => {
        console.log('Ad completed');
        onAdCompleted();
      });
      
      adsManager.init(adContainerRef.current?.clientWidth || 640, adContainerRef.current?.clientHeight || 360, 'normal');
      adsManager.start();
    } catch (error) {
      console.error('Error handling ads loaded:', error);
      handleFallback();
    }
  }, [handleFallback, onAdCompleted, onAdError, onAdStarted]);

  // Skip timer
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setCanSkip(true);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Load Google IMA SDK
  useEffect(() => {
    const loadGoogleIMA = () => {
      if ((window as GoogleWindow).google?.ima) {
        initializeGoogleIMA();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';
      script.async = true;
      script.onload = initializeGoogleIMA;
      script.onerror = () => {
        console.error('Failed to load Google IMA SDK');
        onError();
      };
      
      document.head.appendChild(script);
    };

    const initializeGoogleIMA = () => {
      if (!adContainerRef.current || !videoRef.current) return;
      
      try {
        const googleIMA = (window as GoogleWindow).google?.ima as GoogleIMA;
        if (!googleIMA) {
          onError();
          return;
        }

        adDisplayContainerRef.current = new googleIMA.AdDisplayContainer(
          adContainerRef.current,
          videoRef.current
        );
        
        initializeIMA();
      } catch (error) {
        console.error('Error creating ad display container:', error);
        onError();
      }
    };

    loadGoogleIMA();

    return () => {
      // Cleanup
      if (adsManagerRef.current) {
        adsManagerRef.current.destroy();
      }
      if (adsLoaderRef.current) {
        adsLoaderRef.current.destroy();
      }
    };
  }, [initializeIMA, onError]);

  const handleSkip = () => {
    if (canSkip) {
      gtag.event('ad_skipped', {
        ad_type: 'google_video',
        time_watched: currentTime,
      });
      onClose();
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 md:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      
      {/* Ad Container */}
      <div className="relative w-full max-w-4xl mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading advertisement...</p>
            </div>
          </div>
        )}

        {/* Skip Button */}
        {canSkip && (
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 z-50 px-4 py-2 bg-black/70 hover:bg-black/90 
                     rounded-lg text-white text-sm font-medium transition-all duration-200 
                     backdrop-blur-sm hover:scale-105"
          >
            <X size={16} className="inline mr-1" />
            Skip Ad
          </button>
        )}

        {/* Skip Timer */}
        {!canSkip && remainingTime > 0 && (
          <div className="absolute top-4 right-4 z-50 px-3 py-2 bg-black/70 backdrop-blur-sm
                        rounded-lg text-white text-sm font-medium">
            Skip in {remainingTime}s
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-4 left-4 z-50 flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 bg-black/70 hover:bg-black/90 rounded-lg text-white 
                     transition-all duration-200 backdrop-blur-sm"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          
          {adDuration > 0 && (
            <div className="px-3 py-2 bg-black/70 backdrop-blur-sm rounded-lg text-white text-sm">
              {Math.floor(currentTime)}s / {Math.floor(adDuration)}s
            </div>
          )}
        </div>

        {/* Google Ad Content */}
        <div ref={adContainerRef} className="relative w-full h-[70vh] max-h-[500px]">
          <video
            ref={videoRef}
            className="w-full h-full object-cover bg-black"
            muted={isMuted}
            playsInline
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          />
        </div>

        {/* Fallback message */}
        {!isLoading && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <Play size={48} className="mx-auto mb-4 opacity-50" />
              <p>Advertisement will play shortly...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleVideoAd; 