import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Play, Volume2, VolumeX } from 'lucide-react';
import { AD_CONFIG } from '../config/adConfig';
import * as gtag from '../utils/gtag';

interface GoogleVideoAdProps {
  onClose: () => void;
  onError: () => void;
  adUnitId?: string;
}

// Type for Google IMA SDK
interface GoogleIMA {
  AdDisplayContainer: any;
  AdsLoader: any;
  AdsManagerLoadedEvent: any;
  AdsRequest: any;
  AdErrorEvent: any;
  AdEvent: any;
  AdsRenderingSettings: any;
  ViewMode: any;
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
  const adsManagerRef = useRef<any>(null);
  const adsLoaderRef = useRef<any>(null);
  const adDisplayContainerRef = useRef<any>(null);

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

  // Handle ads manager loaded
  const onAdsManagerLoaded = useCallback((adsManagerLoadedEvent: any) => {
    try {
      const googleIMA = (window as any).google?.ima as GoogleIMA;
      if (!googleIMA) {
        onError();
        return;
      }

      const adsRenderingSettings = new googleIMA.AdsRenderingSettings();
      adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
      
      adsManagerRef.current = adsManagerLoadedEvent.getAdsManager(
        videoRef.current,
        adsRenderingSettings
      );

      // Add ads manager event listeners
      adsManagerRef.current.addEventListener(
        googleIMA.AdEvent.Type.LOADED,
        onAdLoaded
      );
      
      adsManagerRef.current.addEventListener(
        googleIMA.AdEvent.Type.STARTED,
        onAdStarted
      );
      
      adsManagerRef.current.addEventListener(
        googleIMA.AdEvent.Type.COMPLETE,
        onAdCompleted
      );

      adsManagerRef.current.addEventListener(
        googleIMA.AdErrorEvent.Type.AD_ERROR,
        onAdError
      );

      try {
        adsManagerRef.current.init(640, 480, googleIMA.ViewMode.NORMAL);
        adsManagerRef.current.start();
      } catch (adError) {
        console.error('Error starting ads manager:', adError);
        handleFallback();
      }
      
    } catch (error) {
      console.error('Error in onAdsManagerLoaded:', error);
      handleFallback();
    }
  }, [onError]);

  // Ad event handlers
  const onAdLoaded = () => {
    setIsLoading(false);
    if (AD_CONFIG.general.debugMode) {
      console.log('📺 Google video ad loaded');
    }
  };

  const onAdStarted = () => {
    setIsPlaying(true);
    if (adsManagerRef.current) {
      const ad = adsManagerRef.current.getCurrentAd();
      if (ad) {
        setAdDuration(ad.getDuration());
      }
    }
    
    gtag.event('ad_started', {
      ad_type: 'google_video',
      ad_unit_id: adUnitId,
    });

    if (AD_CONFIG.general.debugMode) {
      console.log('📺 Google video ad started');
    }
  };

  const onAdCompleted = () => {
    gtag.event('ad_completed', {
      ad_type: 'google_video',
      ad_unit_id: adUnitId,
    });
    
    if (AD_CONFIG.general.debugMode) {
      console.log('📺 Google video ad completed');
    }
    
    onClose();
  };

  const onAdError = (adErrorEvent: any) => {
    console.error('Google Video Ad Error:', adErrorEvent.getError());
    gtag.event('ad_error', {
      ad_type: 'google_video',
      error: adErrorEvent.getError()?.getMessage() || 'Unknown error',
    });
    
    handleFallback();
  };

  // Fallback to house ad
  const handleFallback = () => {
    if (AD_CONFIG.general.debugMode) {
      console.log('📺 Google ad failed, showing fallback');
    }
    
    // You can implement a fallback video ad here
    // For now, just close the ad
    setTimeout(onClose, 1000);
  };

  // Initialize Google IMA SDK
  const initializeIMA = useCallback(() => {
    const googleIMA = (window as any).google?.ima as GoogleIMA;
    if (!googleIMA) {
      console.error('Google IMA SDK not loaded');
      onError();
      return;
    }

    try {
      // Create ads loader
      adsLoaderRef.current = new googleIMA.AdsLoader(adDisplayContainerRef.current);
      
      // Add event listeners
      adsLoaderRef.current.addEventListener(
        googleIMA.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
        onAdsManagerLoaded,
        false
      );
      
      adsLoaderRef.current.addEventListener(
        googleIMA.AdErrorEvent.Type.AD_ERROR,
        onAdError,
        false
      );

      // Request ads
      const adsRequest = new googleIMA.AdsRequest();
      adsRequest.adTagUrl = generateAdTagUrl();
      adsRequest.linearAdSlotWidth = videoRef.current?.clientWidth || 640;
      adsRequest.linearAdSlotHeight = videoRef.current?.clientHeight || 480;
      adsRequest.nonLinearAdSlotWidth = 300;
      adsRequest.nonLinearAdSlotHeight = 150;

      adsLoaderRef.current.requestAds(adsRequest);
      
    } catch (error) {
      console.error('Error initializing IMA:', error);
      onError();
    }
  }, [onError, onAdsManagerLoaded]);

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
      if ((window as any).google?.ima) {
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
        const googleIMA = (window as any).google?.ima as GoogleIMA;
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