import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface VideoAdProps {
  onClose: () => void;
}

const VideoAd: React.FC<VideoAdProps> = ({ onClose }) => {
  const [autoSkipCountdown, setAutoSkipCountdown] = useState(10);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    
    // Simple countdown that works
    let timeLeft = 10;
    setAutoSkipCountdown(timeLeft);
    
    timerRef.current = setInterval(() => {
      timeLeft--;
      setAutoSkipCountdown(timeLeft);
      
      if (timeLeft <= 0) {
        onClose();
      }
    }, 1000);

    // Start video if available
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.play().catch(() => {
        // Video autoplay blocked - silent fail
      });
    }

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [onClose]);

  const handleAdClick = () => {
    window.open('https://saasbackgrounds.com', '_blank');
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" 
      data-testid="video-ad"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        display: 'flex',
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
      }}
    >
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl" data-testid="video-ad-container">
        {/* Close button and countdown */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
          {/* Countdown next to close button */}
          <div className="bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm font-medium">
            Auto-close in {autoSkipCountdown}s
          </div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200"
            data-testid="close-button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main container */}
        <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[400px] lg:min-h-[500px]">
          {/* Video section */}
          <div className="lg:col-span-3 relative bg-gray-900 flex items-center justify-center h-[60vh] lg:h-auto" data-testid="video-section">
            <div className="relative w-full h-full">
              {/* Try actual video first, fallback to animated demo */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover cursor-pointer"
                muted
                autoPlay
                loop
                playsInline
                controls={false}
                onClick={handleAdClick}
                poster="/ad_preview_poster.jpg"
                style={{
                  outline: 'none',
                  border: 'none',
                  visibility: 'visible',
                  opacity: '1'
                }}
              >
                <source src="/ad_preview_optimized.mp4" type="video/mp4" />
                <source src="/ad_preview.mp4" type="video/mp4" />
              </video>
              
              {/* Fallback animated background if video fails */}
              <div
                className="absolute inset-0 w-full h-full object-cover cursor-pointer flex items-center justify-center"
                onClick={handleAdClick}
                data-testid="video-fallback"
                style={{
                  background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1)',
                  backgroundSize: '400% 400%',
                  animation: 'gradientShift 3s ease infinite',
                  color: 'white',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                  zIndex: -1 // Behind video
                }}
              >
                🎬 Video Ad Playing
              </div>
              
              <style>{`
                @keyframes gradientShift {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
                
                video::-webkit-media-controls { display: none !important; }
                video::-webkit-media-controls-panel { display: none !important; }
                video::-webkit-media-controls-play-button { display: none !important; }
                video::-webkit-media-controls-start-playback-button { display: none !important; }
              `}</style>
            </div>
          </div>

          {/* Content section */}
          <div className="lg:col-span-2 p-6 lg:p-8 flex flex-col justify-center space-y-4" data-testid="content-section">
            <div className="space-y-3">
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                For SaaS Creators Who Love Great Cinematography
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                Finally, video backgrounds that don't look like stock footage. Shot with the same attention to detail you put into your product.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-700">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm">HD & 4K quality available</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm">Landscape & portrait formats</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm">Download immediately after purchase</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-700">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm">Created by someone who gets it</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleAdClick}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                data-testid="cta-button"
              >
                Visit Site →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAd;