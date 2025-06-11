import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Play, Sparkles, Zap, ArrowRight, Star, Download, Clock } from 'lucide-react';
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
  const [startTime] = useState(Date.now());
  const [watchedTime, setWatchedTime] = useState(0);
  const [contentVisible, setContentVisible] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<number>();
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);

  // Update refs when props change
  useEffect(() => {
    onCloseRef.current = onClose;
    onErrorRef.current = onError;
  }, [onClose, onError]);

  const handleClose = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onCloseRef.current();
  }, []);

  const handleError = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    onErrorRef.current();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Show content with staggered animation
    const timer1 = setTimeout(() => setContentVisible(true), 300);
    const timer2 = setTimeout(() => setFeaturesVisible(true), 600);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = prev - 1;
        if (newTime <= 10) {
          setCanSkip(true);
        }
        if (newTime <= 0) {
          handleClose();
          return 0;
        }
        return newTime;
      });
      
      setWatchedTime((Date.now() - startTime) / 1000);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startTime, handleClose]);

  const handleVideoClick = () => {
    gtag.trackVideoAdClick();
    window.open('https://saasbackground.com', '_blank');
  };

  const handleCtaClick = () => {
    gtag.trackVideoAdClick();
    window.open('https://saasbackground.com', '_blank');
  };

  const handleVideoError = () => {
    console.error('Video failed to load');
    setShowPlayButton(true);
  };

  const handleVideoLoad = () => {
    setShowPlayButton(false);
  };

  const getVideoSource = () => {
    return isMobile ? '/ad_preview_mobile.mp4' : '/ad_preview_optimized.mp4';
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 md:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={canSkip ? handleClose : undefined}
      />
      
      {/* Ad Container */}
      <div className={`
        relative w-full max-w-sm md:max-w-4xl mx-auto
        ${isMobile 
          ? 'flex flex-col h-[85vh] max-h-[600px]' 
          : 'flex flex-row h-[70vh] max-h-[500px]'
        }
        bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900
        rounded-2xl md:rounded-3xl overflow-hidden
        shadow-2xl border border-white/10
        transform transition-all duration-500 ease-out
        ${contentVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
      `}>
        
        {/* Skip Button */}
        {canSkip && (
          <button
            onClick={handleClose}
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

        {/* Video Section */}
        <div className={`
          relative overflow-hidden
          ${isMobile 
            ? 'flex-1 min-h-0' 
            : 'w-3/5 h-full'
          }
        `}>
          <div 
            className="relative w-full h-full cursor-pointer group"
            onClick={handleVideoClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              poster="/ad_preview_poster.jpg"
              onError={handleVideoError}
              onLoadedData={handleVideoLoad}
            >
              <source src={getVideoSource()} type="video/mp4" />
            </video>
            
            {/* Video Overlay */}
            <div className={`
              absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20
              transition-opacity duration-300
              ${isHovered ? 'opacity-100' : 'opacity-60'}
            `} />
            
            {/* Play Button Overlay */}
            {(showPlayButton || isHovered) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`
                  p-4 bg-white/20 backdrop-blur-sm rounded-full
                  transform transition-all duration-300
                  ${isHovered ? 'scale-110 bg-white/30' : 'scale-100'}
                `}>
                  <Play size={32} className="text-white ml-1" fill="currentColor" />
                </div>
              </div>
            )}

            {/* Premium Badge */}
            <div className="absolute top-4 left-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 
                            rounded-full text-black text-xs font-bold shadow-lg">
                <Sparkles size={12} />
                <span>PREMIUM SAAS TOOLS</span>
                <Sparkles size={12} />
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className={`
          ${isMobile 
            ? 'p-4 bg-gradient-to-t from-gray-900 via-slate-900 to-transparent' 
            : 'w-2/5 p-6 flex flex-col justify-center'
          }
          relative
        `}>
          <div className={`
            transform transition-all duration-700 ease-out
            ${contentVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
          `}>
            {/* Brand */}
            <div className="mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                SaaSBackground
              </h2>
              <div className="flex items-center gap-2 text-yellow-400 mb-2">
                <Zap size={16} />
                <span className="text-sm font-semibold">Premium SaaS Solutions</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-300 text-sm md:text-base mb-4 leading-relaxed">
              Accelerate your SaaS development with enterprise-grade solutions
            </p>

            {/* Features */}
            <div className={`
              grid grid-cols-2 gap-2 mb-6
              transform transition-all duration-700 ease-out delay-300
              ${featuresVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
            `}>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Star size={12} className="text-yellow-500" />
                <span>Enterprise Grade</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Download size={12} className="text-green-500" />
                <span>Instant Setup</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock size={12} className="text-blue-500" />
                <span>24/7 Support</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Sparkles size={12} className="text-purple-500" />
                <span>Full Scalability</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleCtaClick}
              className="w-full group bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700
                       hover:from-purple-500 hover:via-violet-500 hover:to-purple-600
                       text-white font-semibold py-3 px-6 rounded-xl
                       shadow-lg hover:shadow-xl hover:shadow-purple-500/25
                       transform hover:scale-[1.02] active:scale-[0.98]
                       transition-all duration-200 ease-out
                       flex items-center justify-center gap-2
                       border border-white/10 hover:border-white/20"
            >
              <Sparkles size={16} />
              <span>Visit SaaSBackground.com</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAd;