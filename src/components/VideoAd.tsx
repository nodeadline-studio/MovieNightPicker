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
  const [watchedTime, setWatchedTime] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setRemainingTime(prev => {
        const newTime = prev - 1;
        setWatchedTime(15 - newTime);
        
        // Can skip after 5 seconds
        if (newTime <= 10) {
          setCanSkip(true);
        }
        
        // Auto close after 15 seconds
        if (newTime <= 0) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return newTime;
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
      timersRef.current.forEach(clearInterval);
      timersRef.current = [];
    };
  }, [onClose]);

  const handleSkip = () => {
    if (watchedTime >= 15) {
      gtag.trackVideoAdView(15);
    } else {
      gtag.trackVideoAdSkip(watchedTime);
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
        <div className="relative w-full aspect-video bg-black overflow-hidden">
          {/* Video Background Layer */}
          <div className="absolute inset-0 z-0">
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
          </div>

          {/* Dark Overlay for Better Text Visibility */}
          <div className="absolute inset-0 z-10 bg-black/60" />

          {/* Main Content Overlay - Highly Visible */}
          <div className="absolute inset-0 z-20 flex flex-col justify-center items-center p-8">
            {/* Premium Badge */}
            <div className="mb-6 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
              <span className="text-black font-bold text-sm tracking-wide">PREMIUM CONTENT</span>
            </div>

            {/* Main Title with Strong Background */}
            <div className="text-center mb-8 bg-black/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                GenStockVideo
              </h2>
              <p className="text-xl md:text-2xl text-yellow-400 font-semibold mb-3">
                Premium Stock Videos
              </p>
              <p className="text-gray-200 text-lg max-w-lg mx-auto leading-relaxed">
                🎬 Professional quality videos for your creative projects
              </p>
              <p className="text-gray-300 text-base mt-2">
                ✨ Unlimited downloads • 4K quality • Commercial license
              </p>
            </div>
            
            {/* Call to Action Button */}
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl blur opacity-75 animate-pulse"></div>
              <Button
                variant="primary"
                size="lg"
                onClick={handleVisitSite}
                className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 
                         hover:from-purple-500 hover:via-pink-500 hover:to-blue-500
                         text-white font-bold px-12 py-4 rounded-2xl text-xl
                         transform hover:scale-105 transition-all duration-300
                         shadow-2xl border-2 border-white/20"
              >
                🚀 Visit GenStockVideo.com
              </Button>
            </div>

            {/* Features List */}
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
              <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-white border border-white/20">
                🎥 4K Videos
              </span>
              <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-white border border-white/20">
                📄 Commercial License
              </span>
              <span className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-white border border-white/20">
                ⚡ Instant Download
              </span>
            </div>
          </div>

          {/* Fallback Content Layer */}
          {!isVideoLoaded && (
            <div className="absolute inset-0 z-30 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="mb-8">
                  <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
                    <Play size={40} className="text-white ml-1" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">GenStockVideo</h2>
                  <p className="text-xl text-gray-200 mb-4">Premium Stock Videos</p>
                  <p className="text-gray-300 max-w-md mx-auto">
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

          {/* Controls Layer - Highest z-index */}
          <div className="absolute inset-0 z-40">
            {/* Skip button */}
            {canSkip ? (
              <button
                onClick={handleSkip}
                className="absolute bottom-4 right-4 bg-black/95 hover:bg-black text-white font-bold px-6 py-3 rounded-xl 
                         transition-all duration-200 border-2 border-white/40 hover:border-white/60
                         shadow-2xl backdrop-blur-sm text-lg"
              >
                {watchedTime >= 15 ? 'Close Ad' : 'Skip Ad'}
              </button>
            ) : (
              <div className="absolute bottom-4 right-4 bg-black/95 backdrop-blur-sm px-4 py-3 rounded-xl text-white border-2 border-white/40 shadow-2xl">
                <div className="text-sm font-medium">Skip in {remainingTime - 10}s</div>
              </div>
            )}

            {/* Close button - only show when can skip */}
            {canSkip && (
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors
                         bg-black/80 hover:bg-black/95 rounded-full p-3 backdrop-blur-sm
                         shadow-2xl border-2 border-white/30 hover:border-white/50"
              >
                <X size={24} />
              </button>
            )}

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-linear"
                style={{ width: `${((15 - remainingTime) / 15) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAd;