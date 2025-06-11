import React, { useState, useEffect } from 'react';
import { Film, Sparkles, Clock, Zap } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
  showEstimatedTime?: boolean;
  action?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = 'Loading...', 
  progress = 0,
  showProgress = false,
  showEstimatedTime = false,
  action = 'Loading'
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('Calculating...');

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 0.1);
    }, 100);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (showEstimatedTime && progress > 0) {
      const timePerPercent = elapsedTime / progress;
      const remainingTime = (100 - progress) * timePerPercent;
      
      if (remainingTime < 1) {
        setEstimatedTime('Almost done...');
      } else if (remainingTime < 60) {
        setEstimatedTime(`~${Math.ceil(remainingTime)}s remaining`);
      } else {
        setEstimatedTime(`~${Math.ceil(remainingTime / 60)}m remaining`);
      }
    }
  }, [progress, elapsedTime, showEstimatedTime]);

  return (
    <div className="fixed inset-0 bg-gray-950 flex items-center justify-center z-50">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-slate-900/30 to-gray-900/30 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
      
      <div className="relative text-center max-w-md mx-auto px-6">
        {/* Modern Loading Animation */}
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
            <Film size={32} className="text-white animate-pulse" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-30 animate-pulse" />
          
          {/* Floating sparkles */}
          <div className="absolute -top-2 -right-2 text-yellow-400 animate-bounce">
            <Sparkles size={16} />
          </div>
          <div className="absolute -bottom-2 -left-2 text-pink-400 animate-bounce" style={{ animationDelay: '0.5s' }}>
            <Sparkles size={12} />
          </div>
        </div>
        
        {/* Loading Text */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
            {message}
          </h3>
          
          {/* Action feedback */}
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <Zap size={16} className="text-purple-400" />
            <span className="text-sm">{action}</span>
          </div>
          
          {/* Progress bar */}
          {showProgress && (
            <div className="space-y-2">
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <div className="text-xs text-gray-400">
                {Math.round(progress)}% complete
              </div>
            </div>
          )}
          
          {/* Estimated time */}
          {showEstimatedTime && (
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Clock size={12} />
              <span>{estimatedTime}</span>
            </div>
          )}
          
          {/* Loading dots animation */}
          <div className="flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;