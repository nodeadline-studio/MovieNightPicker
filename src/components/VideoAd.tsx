import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, ExternalLink } from 'lucide-react';

interface VideoAdProps {
  onClose: () => void;
}

const VideoAd: React.FC<VideoAdProps> = ({ onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Show CTA after 3 seconds for better engagement
      if (video.currentTime >= 3 && !showCTA) {
        setShowCTA(true);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    // Auto-play muted
    video.play().catch(() => {
      // Auto-play failed, that's okay
    });

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [showCTA]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = (parseFloat(e.target.value) / 100) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleAdClick = () => {
    window.open('https://saasbackgrounds.com', '_blank');
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Close button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main container - responsive layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[400px] lg:min-h-[500px]">
          {/* Video section - larger on both mobile and desktop */}
          <div className="lg:col-span-3 relative bg-gray-900 flex items-center justify-center h-[60vh] lg:h-auto">
            <video
              ref={videoRef}
              className="w-full h-full object-cover cursor-pointer"
              muted
              loop
              playsInline
              onClick={handleAdClick}
              poster="/ad_preview_poster.jpg"
            >
              <source src="/ad_preview_mobile.mp4" type="video/mp4" media="(max-width: 768px)" />
              <source src="/ad_preview_optimized.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Video controls overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <button
                  onClick={togglePlayPause}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>

                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleSeek}
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                <span className="text-white text-xs">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                <button
                  onClick={toggleMute}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </div>
            </div>

            {/* Click hint overlay */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm">
              Click video to visit site
            </div>
          </div>

          {/* Content section - authentic messaging for cinema-loving SaaS creators */}
          <div className="lg:col-span-2 p-6 lg:p-8 flex flex-col justify-center space-y-4">
            <div className="space-y-3">
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                For SaaS Creators Who Love Great Cinematography
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                Finally, video backgrounds that don't look like stock footage. 
                Shot with the same attention to detail you put into your product.
              </p>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">HD & 4K quality</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">Download immediately after purchase</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">Created by someone who gets it</span>
                </div>
              </div>
            </div>

            {/* CTA appears after 3 seconds */}
            {showCTA && (
              <div className="space-y-3 animate-fade-in">
                <button
                  onClick={handleAdClick}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <span>Browse Collection</span>
                  <ExternalLink size={18} />
                </button>
                
                {/* Mobile-specific CTA */}
                <div className="lg:hidden">
                  <button
                    onClick={handleAdClick}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg transition-all duration-200"
                  >
                    View on Mobile
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  No subscription. Just great backgrounds.
                </p>
              </div>
            )}

            {/* Social proof - appears only after CTA */}
            {showCTA && (
              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-gray-500 text-center">
                  "These actually look professional" - Recent customer
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default VideoAd;