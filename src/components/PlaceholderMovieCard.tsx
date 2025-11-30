import React, { useMemo } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Film, Star, Calendar } from 'lucide-react';
import Button from './ui/Button';

const PlaceholderMovieCard: React.FC = () => {
  const isMobile = useMediaQuery({ maxWidth: 767 });

  // Calculate max height for desktop movie card - EXACT same as MovieCard
  const desktopCardMaxHeight = useMemo(() => {
    if (typeof window === 'undefined' || isMobile) return 'none';
    const viewportHeight = window.innerHeight;
    // Reserve: header (~80px) + ad (50px) + button (~60px) + footer (~60px) + spacing (~40px) = ~290px
    // Reduce by 10%: use 90% of available space
    const reserved = 290;
    const available = viewportHeight - reserved;
    return available > 400 ? `${available * 0.9}px` : 'none';
  }, [isMobile]);

  return (
    <div 
      className="w-full max-w-[95vw] md:max-w-5xl lg:max-w-6xl mx-auto space-y-2 md:space-y-4 relative animate-[fadeIn_0.3s_ease-out]"
      style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}
    >
      <div className="relative group">
        {/* Background glow effect - DISABLED during loading */}
        {/* <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300" /> */}
        
        <div className="relative bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-800/95 
                        backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden 
                        shadow-2xl ring-1 ring-white/5 transform transition-transform duration-300 
                        flex flex-col md:flex-row"
                        style={!isMobile ? { maxHeight: desktopCardMaxHeight, overflow: 'hidden' } : {}}
        >
          <div className="flex flex-col md:flex-row h-full md:h-auto w-full">
            {/* Poster Placeholder - Match MovieCard structure exactly with loading animation */}
            <div className="w-full md:w-1/3 relative aspect-[2/3] max-h-[38vh] sm:max-h-[42vh] md:max-h-none md:flex-shrink-0 overflow-hidden">
              {/* Loading state with enhanced animation - Match MovieCard exactly */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center pointer-events-none z-0 overflow-hidden rounded-3xl">
                {/* Shimmer effect background - smooth idle animation */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer-slow_3s_ease-in-out_infinite]" 
                       style={{
                         width: '50%',
                         height: '100%',
                         transform: 'skewX(-15deg)',
                         opacity: 0.5
                       }} />
                </div>
                
                {/* Loading content with idle animation */}
                <div className="flex flex-col items-center gap-3 relative z-10">
                  <div className="relative">
                    <Film size={48} className="text-gray-500 animate-pulse" style={{ animationDuration: '2s' }} />
                    {/* Rotating ring around icon - subtle idle animation */}
                    <div className="absolute inset-0 flex items-center justify-center -m-2">
                      <div className="w-16 h-16 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin opacity-30" 
                           style={{ animationDuration: '2s' }} />
                    </div>
                  </div>
                  <div className="text-gray-500 text-sm animate-pulse" style={{ animationDuration: '2s' }}>Loading...</div>
                </div>
              </div>
            </div>

            {/* Details Placeholder - Match MovieCard structure */}
            <div className="w-full md:w-2/3 md:ml-0 p-3 md:p-6 lg:p-8 flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-hide">
              {/* Header - Match MovieCard structure */}
              <div className="mb-3 md:mb-6">
                <h2 className="text-lg md:text-2xl lg:text-4xl font-bold text-gray-300 leading-tight mb-2 md:mb-3">
                  Your Next Movie Awaits
                </h2>
                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-400">
                  <div className="flex items-center gap-1 md:gap-2 bg-white/5 px-2 md:px-3 py-1 md:py-2 rounded-lg md:rounded-xl">
                    <Calendar size={12} className="md:hidden text-blue-400" />
                    <Calendar size={16} className="hidden md:block text-blue-400" />
                    <span className="text-xs md:text-sm">Release Date</span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 bg-white/5 px-2 md:px-3 py-1 md:py-2 rounded-lg md:rounded-xl">
                    <Star size={12} className="md:hidden text-yellow-400" />
                    <Star size={16} className="hidden md:block text-yellow-400" />
                    <span className="text-xs md:text-sm">Rating</span>
                  </div>
                </div>
              </div>
          
              {/* Genres - Match MovieCard structure */}
              <div className="mb-3 md:mb-4">
                <div className="flex flex-wrap gap-1 md:gap-2">
                  {[1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className="px-2 md:px-3 py-1 md:py-2 bg-white/5 text-xs md:text-sm text-gray-400 rounded-lg md:rounded-xl border border-white/10"
                    >
                      Genre {i}
                    </span>
                  ))}
                </div>
              </div>

              {/* Overview - Match MovieCard structure */}
              <div className="mb-2 md:-mb-5 flex-1 min-h-0">
                <div className="space-y-2">
                  <div className="h-4 md:h-5 bg-white/10 rounded w-full" />
                  <div className="h-4 md:h-5 bg-white/10 rounded w-5/6" />
                  <div className="h-4 md:h-5 bg-white/10 rounded w-4/6" />
                </div>
              </div>
          
              {/* Buttons - Match MovieCard structure */}
              <div className="flex flex-row gap-2 md:gap-3 mt-auto flex-shrink-0">
                <Button
                  variant="primary"
                  disabled
                  className="bg-gray-800/50 hover:bg-gray-800/50 cursor-not-allowed flex-1 text-gray-400 border border-gray-700 h-12 md:h-16 rounded-xl md:rounded-2xl"
                >
                  View on IMDb
                </Button>
                <Button
                  variant="secondary"
                  disabled
                  className="bg-gray-800/50 hover:bg-gray-800/50 cursor-not-allowed flex-1 text-gray-400 border border-gray-700 h-12 md:h-16 rounded-xl md:rounded-2xl"
                >
                  Add to Watchlist
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderMovieCard;
