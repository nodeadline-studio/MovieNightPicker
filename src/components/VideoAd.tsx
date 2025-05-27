import React, { useEffect, useRef, useState } from 'react';
import { X, Play } from 'lucide-react';
import Button from './ui/Button';
import * as gtag from '../utils/gtag';

interface VideoAdProps {
  onClose: () => void;
  onError: () => void;
  enableTestAds?: boolean;
  mockMode?: boolean;
}

const VideoAd: React.FC<VideoAdProps> = ({ onClose, onError, enableTestAds = true, mockMode = false }) => {
  const [remainingTime, setRemainingTime] = useState(15);
  const [canSkip, setCanSkip] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [startTime] = useState(Date.now());
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Start 15-second countdown
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

    // Auto-play video when loaded
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Fallback if autoplay fails
        setIsVideoLoaded(false);
      });
    }

    return () => {
      // Clear all timers
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  const handleSkip = () => {
    const timeWatched = Math.round((Date.now() - startTime) / 1000);
    if (timeWatched < 15) {
      gtag.trackVideoAdSkip(timeWatched);
    } else {
      gtag.trackVideoAdView(15);
    }
    onClose();
  };

  const handleVisitSite = () => {
    window.open('https://genstockvideo.com', '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  const handleVideoError = () => {
    setIsVideoLoaded(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center ad-modal">
      <div className="w-full max-w-[95vw] md:max-w-4xl bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-800/95 
                     backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-2 md:gap-4">
          <h3 className="text-lg font-semibold text-white">Advertisement</h3>
          <p className="text-sm text-gray-400 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Your movie will be shown after this short ad
          </p>
        </div>
        
        {/* Ad Content */}
        <div className="relative w-full aspect-video bg-black">
          {/* Video */}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
          >
            <source src="/ad_preview.mp4" type="video/mp4" />
          </video>

          {/* Overlay Content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end">
            <div className="p-8 text-center">
              {/* Minimalist Text Content */}
              <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">GenStockVideo</h2>
                <p className="text-lg text-gray-200 mb-4">Premium Stock Videos</p>
                <p className="text-gray-300 text-sm max-w-md mx-auto">
                  Professional quality videos for your creative projects
                </p>
              </div>
              
              <Button
                variant="primary"
                size="lg"
                onClick={handleVisitSite}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 
                         text-white font-semibold px-8 py-3 rounded-2xl transform hover:scale-105 transition-all duration-200
                         shadow-lg hover:shadow-xl"
              >
                Visit GenStockVideo.com
              </Button>
            </div>
          </div>

          {/* Fallback if video doesn't load */}
          {!isVideoLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Play size={32} className="text-white ml-1" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">GenStockVideo</h2>
                  <p className="text-lg text-gray-200 mb-4">Premium Stock Videos</p>
                  <p className="text-gray-300 text-sm max-w-md mx-auto">
                    Professional quality videos for your creative projects
                  </p>
                </div>
                
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleVisitSite}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 
                           text-white font-semibold px-8 py-3 rounded-2xl transform hover:scale-105 transition-all duration-200
                           shadow-lg hover:shadow-xl"
                >
                  Visit GenStockVideo.com
                </Button>
              </div>
            </div>
          )}

          {/* Skip button */}
          {canSkip ? (
            <button
              onClick={handleSkip}
              className="absolute bottom-4 right-4 bg-black/80 hover:bg-black/90 backdrop-blur-sm
                       text-white font-medium px-4 py-2 rounded-xl transition-all duration-200
                       border border-white/20 hover:border-white/30"
            >
              Skip Ad
            </button>
          ) : (
            <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm text-sm px-3 py-2 rounded-xl text-white border border-white/20">
              Skip in {remainingTime}s
            </div>
          )}

          {/* Close button - only show when can skip */}
          {canSkip && (
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors
                       bg-black/50 hover:bg-black/70 rounded-full p-2 backdrop-blur-sm"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoAd;