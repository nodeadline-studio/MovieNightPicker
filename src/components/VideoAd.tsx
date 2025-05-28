import React, { useEffect, useRef, useState } from 'react';
import { X, Play, Sparkles, Zap, ArrowRight } from 'lucide-react';
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
  const [contentVisible, setContentVisible] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
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

    // Staggered content animations
    setTimeout(() => setContentVisible(true), 500);
    setTimeout(() => setFeaturesVisible(true), 1000);

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
    window.open('https://www.genstockvideo.com', '_blank', 'noopener,noreferrer');
    gtag.trackVideoAdClick();
    onClose();
  };

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  const handleVideoError = () => {
    setIsVideoLoaded(false);
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center ad-modal backdrop-blur-sm">
      <div className="w-full max-w-[95vw] md:max-w-5xl bg-gradient-to-br from-slate-900/98 via-gray-900/98 to-slate-800/98 
                     backdrop-blur-2xl border border-white/20 rounded-3xl overflow-hidden shadow-2xl
                     ring-1 ring-white/10 animate-[slideIn_0.4s_ease-out]">
        
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-white/10 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-blue-600/10">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl animate-pulse">
                <Play size={20} className="text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white">Premium Content</h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Your movie will be shown after this short ad</span>
            </div>
          </div>
        </div>
        
        {/* Ad Content */}
        <div className="relative w-full aspect-video bg-black overflow-hidden">
          {/* Video Background Layer - More Prominent */}
          <div className="absolute inset-0 z-0">
              <video
                ref={videoRef}
              className="w-full h-full object-cover scale-105 animate-[zoomIn_0.6s_ease-out]"
                autoPlay
                muted
              loop
                playsInline
              onLoadedData={handleVideoLoad}
              onError={handleVideoError}
            >
              <source src="/ad_preview.mp4" type="video/mp4" />
            </video>
            {/* Video overlay for better text visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />
          </div>

          {/* Main Content Overlay */}
          <div className="absolute inset-0 z-20 flex flex-col justify-center items-center p-6 md:p-8">
            
            {/* Animated Badge */}
            <div className={`mb-6 transition-all duration-700 ease-out ${
              contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full blur opacity-75 animate-pulse"></div>
                <div className="relative px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
                  <span className="text-black font-bold text-sm md:text-base tracking-wide flex items-center gap-2">
                    <Sparkles size={16} className="animate-spin" />
                    PREMIUM STOCK VIDEOS
                    <Zap size={16} className="animate-bounce" />
                  </span>
                </div>
              </div>
            </div>

            {/* Main Title with Enhanced Animation */}
            <div className={`text-center mb-8 transition-all duration-700 ease-out delay-200 ${
              contentVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-95'
            }`}>
              <div className="relative bg-black/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur opacity-30 animate-pulse"></div>
                <div className="relative">
                  <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200 mb-4 tracking-tight animate-[glow_2s_ease-in-out_infinite_alternate]">
                    GenStockVideo
                  </h2>
                  <p className="text-xl md:text-3xl text-yellow-400 font-bold mb-4 animate-[shimmer_1.5s_ease-in-out_infinite]">
                    🎬 Professional 4K Videos
                  </p>
                  <p className="text-gray-200 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                    Transform your creative projects with premium stock footage
                  </p>
                </div>
              </div>
            </div>
            
            {/* Enhanced Call to Action */}
            <div className={`relative mb-6 transition-all duration-700 ease-out delay-400 ${
              contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <Button
                variant="primary"
                size="lg"
                onClick={handleVisitSite}
                className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 
                         hover:from-purple-500 hover:via-pink-500 hover:to-blue-500
                         text-white font-bold px-8 md:px-12 py-4 md:py-5 rounded-2xl text-lg md:text-xl
                         transform hover:scale-110 transition-all duration-300
                         shadow-2xl border-2 border-white/30 hover:border-white/50
                         animate-[bounce_2s_infinite] hover:animate-none"
              >
                <span className="flex items-center gap-3">
                  <Sparkles size={24} className="animate-spin" />
                  Visit GenStockVideo.com
                  <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </div>

            {/* Enhanced Features Grid */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm md:text-base transition-all duration-700 ease-out delay-600 ${
              featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              {[
                { icon: '🎥', text: '4K Quality', delay: '0ms' },
                { icon: '📄', text: 'Commercial License', delay: '100ms' },
                { icon: '⚡', text: 'Instant Download', delay: '200ms' },
                { icon: '🎨', text: 'Creative Freedom', delay: '300ms' }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="bg-white/10 backdrop-blur-sm px-3 md:px-4 py-2 md:py-3 rounded-xl text-white border border-white/20 
                           hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-pointer
                           animate-[fadeInUp_0.6s_ease-out] hover:shadow-lg hover:shadow-purple-500/25"
                  style={{ animationDelay: feature.delay }}
                >
                  <span className="text-lg md:text-xl mr-2">{feature.icon}</span>
                  <span className="font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fallback Content Layer */}
          {!isVideoLoaded && (
            <div className="absolute inset-0 z-30 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
              <div className="text-center p-8 animate-[fadeIn_0.5s_ease-out]">
                <div className="mb-8">
                  <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-[pulse_2s_infinite]">
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

          {/* Controls Layer */}
          <div className="absolute inset-0 z-40">
            {/* Skip button */}
            {canSkip ? (
              <button
                onClick={handleSkip}
                className="absolute bottom-4 right-4 bg-black/95 hover:bg-black text-white font-bold px-6 py-3 rounded-xl 
                         transition-all duration-200 border-2 border-white/40 hover:border-white/60
                         shadow-2xl backdrop-blur-sm text-lg hover:scale-105 animate-[slideInRight_0.3s_ease-out]"
              >
                {watchedTime >= 15 ? 'Close Ad' : 'Skip Ad'}
              </button>
            ) : (
              <div className="absolute bottom-4 right-4 bg-black/95 backdrop-blur-sm px-4 py-3 rounded-xl text-white border-2 border-white/40 shadow-2xl">
                <div className="text-sm font-medium">Skip in {remainingTime - 10}s</div>
                </div>
              )}

            {/* Close button */}
            {canSkip && (
              <button
                onClick={handleSkip}
                className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors
                         bg-black/80 hover:bg-black/95 rounded-full p-3 backdrop-blur-sm
                         shadow-2xl border-2 border-white/30 hover:border-white/50 hover:scale-110
                         animate-[slideInRight_0.3s_ease-out]"
              >
                <X size={24} />
              </button>
            )}

            {/* Enhanced Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/20">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 transition-all duration-1000 ease-linear relative overflow-hidden"
                style={{ width: `${((15 - remainingTime) / 15) * 100}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1s_ease-in-out_infinite]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAd;