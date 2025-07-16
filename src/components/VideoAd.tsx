import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Play, Pause, Volume2, VolumeX, ArrowRight, CheckCircle } from 'lucide-react';
import * as gtag from '../utils/gtag';

interface VideoAdProps {
  onClose: () => void;
  onError: () => void;
  enableTestAds?: boolean;
}

const VideoAd: React.FC<VideoAdProps> = ({ onClose, onError, enableTestAds = false }) => {
  const [canSkip, setCanSkip] = useState(false);
  const [remainingTime, setRemainingTime] = useState(8);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<number>();
  const hasUserInteracted = useRef(false);

  // Auto-play and skip timer
  useEffect(() => {
    const timer = setTimeout(() => {
      if (videoRef.current && !hasUserInteracted.current) {
        videoRef.current.play().catch(() => {
          setIsPlaying(false);
        });
      }
    }, 500);

    // Skip timer - reduced to 8 seconds for better UX
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
      clearTimeout(timer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Show CTA after 4 seconds for faster engagement
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCTA(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleVideoLoad = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoaded(true);
      setIsPlaying(true);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handlePlay = useCallback(() => {
    hasUserInteracted.current = true;
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, []);

  const handlePause = useCallback(() => {
    hasUserInteracted.current = true;
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    hasUserInteracted.current = true;
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, []);

  const handleSkip = useCallback(() => {
    gtag.trackVideoAdSkip(Math.floor(currentTime));
    onClose();
  }, [currentTime, onClose]);

  const handleCTAClick = useCallback(() => {
    hasUserInteracted.current = true;
    gtag.trackVideoAdClick();
    window.open('https://saasbackground.com', '_blank');
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl h-full max-h-[90vh] bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-2">
            <span className="bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded">AD</span>
            <span className="text-white text-sm font-medium">SPONSORED</span>
          </div>
          
          <div className="flex items-center gap-3">
            {canSkip ? (
              <button
                onClick={handleSkip}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
              >
                Skip Ad
              </button>
            ) : (
              <span className="text-white text-sm bg-black bg-opacity-40 px-3 py-2 rounded-full">
                Skip in {remainingTime}s
              </span>
            )}
            
            <button
              onClick={handleSkip}
              className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-all hover:scale-110"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Main Content - Video takes more space */}
        <div className="grid grid-cols-1 lg:grid-cols-5 h-full">
          
          {/* Video Section - 60% on desktop (3/5), 70% on mobile */}
          <div className="lg:col-span-3 relative bg-black h-[70vh] lg:h-full">
            <video
              ref={videoRef}
              src="/ad_preview_optimized.mp4"
              poster="/ad_preview_poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onLoadedData={handleVideoLoad}
              onTimeUpdate={handleTimeUpdate}
              className="w-full h-full object-cover"
              onError={() => onError()}
            />
            
            {/* Video Controls Overlay */}
            {isLoaded && (
              <div className="absolute bottom-4 left-4 right-4 space-y-3">
                {/* Progress Bar */}
                <div className="w-full bg-black bg-opacity-40 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                
                {/* Control Buttons */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={isPlaying ? handlePause : handlePlay}
                      className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-all"
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    
                    <button
                      onClick={toggleMute}
                      className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-all"
                    >
                      {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                  </div>
                  
                  <div className="text-white text-sm bg-black bg-opacity-40 px-2 py-1 rounded">
                    {Math.floor(currentTime)}s / {Math.floor(duration)}s
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content Section - 40% on desktop (2/5), 30% on mobile */}
          <div className="lg:col-span-2 p-6 lg:p-8 flex flex-col justify-center text-white space-y-6">
            
            {/* Minimal Header */}
            <div className="space-y-3">
              <h1 className="text-xl lg:text-2xl font-bold leading-tight">
                Professional Video Backgrounds
              </h1>
              
              <p className="text-gray-300 text-sm">
                High-quality SaaS video backgrounds. Ready to use.
              </p>
            </div>

            {/* Minimal Benefits */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-sm">4K Quality</span>
              </div>
              
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-sm">Instant Download</span>
              </div>
            </div>

            {/* Simple CTA */}
            {showCTA && (
              <button
                onClick={handleCTAClick}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg 
                         transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <span>Browse Backgrounds</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAd;