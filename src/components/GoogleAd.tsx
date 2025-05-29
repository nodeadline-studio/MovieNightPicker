import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface GoogleAdProps {
  onClose: () => void;
  onError: () => void;
  adUnitId: string;
  size?: [number, number];
}

// Extend Window interface for Google Ads
declare global {
  interface Window {
    googletag: any;
    adsbygoogle: any[];
  }
}

const GoogleAd: React.FC<GoogleAdProps> = ({ 
  onClose, 
  onError, 
  adUnitId,
  size = [320, 480] 
}) => {
  const [canSkip, setCanSkip] = React.useState(false);
  const [remainingTime, setRemainingTime] = React.useState(10);
  const adRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number>();

  useEffect(() => {
    // Countdown timer
    intervalRef.current = window.setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = prev - 1;
        if (newTime <= 5) {
          setCanSkip(true);
        }
        if (newTime <= 0) {
          onClose();
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
  }, [onClose]);

  useEffect(() => {
    // Load Google Ads if not already loaded
    const loadGoogleAds = () => {
      try {
        // Google AdSense implementation
        if (!window.adsbygoogle) {
          const script = document.createElement('script');
          script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
          script.async = true;
          script.crossOrigin = 'anonymous';
          document.head.appendChild(script);
          
          script.onload = () => {
            window.adsbygoogle = window.adsbygoogle || [];
            initializeAd();
          };
          
          script.onerror = () => {
            console.error('Failed to load Google Ads');
            onError();
          };
        } else {
          initializeAd();
        }
      } catch (error) {
        console.error('Error loading Google Ads:', error);
        onError();
      }
    };

    const initializeAd = () => {
      if (adRef.current && window.adsbygoogle) {
        try {
          // Push ad to Google AdSense
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (error) {
          console.error('Error initializing ad:', error);
          onError();
        }
      }
    };

    // Delay loading slightly to ensure DOM is ready
    const timer = setTimeout(loadGoogleAds, 100);
    
    return () => clearTimeout(timer);
  }, [adUnitId, onError]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Ad Container */}
      <div className="relative w-full max-w-sm mx-auto bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900
                     rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        
        {/* Skip Button */}
        {canSkip && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-50 p-2 bg-black/50 hover:bg-black/70 
                     rounded-full text-white transition-all duration-200 backdrop-blur-sm
                     hover:scale-110 active:scale-95"
            aria-label="Skip ad"
          >
            <X size={16} />
          </button>
        )}

        {/* Skip Timer */}
        {!canSkip && (
          <div className="absolute top-3 right-3 z-50 px-3 py-1.5 bg-black/60 backdrop-blur-sm
                        rounded-full text-white text-xs font-medium border border-white/20">
            Skip in {remainingTime}s
          </div>
        )}

        {/* Google Ad Content */}
        <div className="p-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-white mb-1">Advertisement</h3>
            <p className="text-gray-400 text-sm">Support us by viewing this ad</p>
          </div>
          
          {/* Google AdSense Ad Unit */}
          <div ref={adRef} className="w-full flex justify-center">
            <ins 
              className="adsbygoogle"
              style={{ 
                display: 'inline-block',
                width: `${size[0]}px`,
                height: `${size[1]}px`
              }}
              data-ad-client="ca-pub-XXXXXXXXXX" // Replace with actual publisher ID
              data-ad-slot={adUnitId}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
          
          {/* Fallback content if ad fails to load */}
          <div className="mt-4 text-center">
            <p className="text-gray-500 text-xs">
              Ad content will appear here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleAd; 