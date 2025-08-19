import React from 'react';
import { Movie } from '../types';
import { getImageUrl, isInTheaters } from '../config/api';
import { Heart, Star, Calendar, Clapperboard, ExternalLink, Sparkles, Shuffle } from 'lucide-react';
import { useMovieContext } from '../context/MovieContext';
import { usePickCounter } from '../hooks/usePickCounter';
import * as gtag from '../utils/gtag';

interface VideoAdHook {
  visible: boolean;
  maybeShow: (count: number) => void;
  close: () => void;
}

interface MovieCardProps {
  movie: Movie;
  isInWatchlist?: boolean;
  videoAd: VideoAdHook;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, isInWatchlist = false, videoAd }) => {
  const { addToWatchlist, removeFromWatchlist, getRandomMovie, filterOptions } = useMovieContext();
  const pickCounter = usePickCounter();
  
  const handleWatchlistToggle = () => {
    if (isInWatchlist) {
      removeFromWatchlist(movie.id);
      gtag.trackWatchlistRemove(movie.id, movie.title);
    } else {
      addToWatchlist(movie);
      gtag.trackWatchlistAdd(movie.id, movie.title);
    }
  };

  const handleGetRandomMovie = async () => {
    try {
      const count = pickCounter.inc();
      
      // Show video ad every 5 picks
      if (count >= 5 && count % 5 === 0) {
        // Force show video ad
        localStorage.setItem('force_video_ad', 'true');
        videoAd.maybeShow(count);
        
        // Wait for ad to show
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (videoAd.visible) {
          return; // Don't get new movie if ad is showing
        }
      }
      
      // Get new movie if no ad is showing
      if (!videoAd.visible) {
        await getRandomMovie();
      }
    } catch (error) {
      console.error('Error getting random movie:', error);
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const getYear = (dateString: string): string => {
    if (!dateString) return '';
    return new Date(dateString).getFullYear().toString();
  };

  return (
    <div className="w-full max-w-[95vw] md:max-w-5xl lg:max-w-6xl mx-auto space-y-4 md:space-y-4">
      {/* Movie Card */}
      <div className="relative group">
        {/* Background glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
        
        <div className="relative bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-800/95 
                       backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden 
                       shadow-2xl ring-1 ring-white/5 transform transition-transform duration-300 
                       hover:scale-[1.01] max-h-[calc(100vh-10rem)] md:max-h-[calc(100vh-16rem)] lg:max-h-[calc(100vh-16rem)]">
          
          <div className="flex flex-col md:flex-row h-full md:h-auto">
            {/* Movie Poster - More space allocated */}
            <div className="w-full md:w-2/5 relative aspect-[3/4] md:aspect-auto max-h-[42vh] md:max-h-none">
              {/* Now Playing Badge */}
              {isInTheaters(movie.release_date) && (
                <div className="absolute top-2 md:top-4 left-2 md:left-4 bg-gradient-to-r from-green-500 to-emerald-500 
                               text-white text-xs font-bold px-2 md:px-3 py-1 md:py-2 rounded-xl md:rounded-2xl z-10 
                               flex items-center gap-1 md:gap-2 shadow-lg backdrop-blur-sm">
                  <Clapperboard size={10} className="md:hidden" aria-hidden="true" />
                  <Clapperboard size={12} className="hidden md:block" aria-hidden="true" />
                  <span className="text-xs">Now Playing</span>
                </div>
              )}
              
              {/* Poster Image */}
              <div className="relative w-full h-full overflow-hidden">
              <img
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                src={getImageUrl(movie.poster_path)}
                alt={`Movie poster for ${movie.title}`}
                loading="eager"
                itemProp="image"
                style={{
                  objectPosition: 'center 20%' // Показываем верхнюю часть постера для лучшего отображения лиц и заголовков
                }}
              />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              
              {/* Rating Badge */}
              <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 bg-black/80 backdrop-blur-sm p-2 md:p-3 rounded-xl md:rounded-2xl shadow-lg">
                <div className="flex items-center gap-1 md:gap-2">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg"
                    alt="IMDb"
                    className="h-3 md:h-4"
                  />
                  <span className="text-yellow-400 font-bold flex items-center gap-1 text-xs md:text-sm">
                    <Star size={12} className="md:hidden fill-current" />
                    <Star size={14} className="hidden md:block fill-current" />
                    {movie.vote_average > 0 ? (movie.vote_average).toFixed(1) : 'N/A'}
                  </span>
                </div>
              </div>
              
              {/* Watchlist Button */}
              <div className="absolute top-2 md:top-4 right-2 md:right-4">
                <button
                  onClick={handleWatchlistToggle}
                  className={`p-2 md:p-3 rounded-xl md:rounded-2xl backdrop-blur-sm transition-all duration-300 shadow-lg ${
                    isInWatchlist 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' 
                      : 'bg-black/60 text-white hover:bg-black/80'
                  }`}
                  aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  <Heart className={`${isInWatchlist ? 'fill-current' : ''} transition-transform duration-300 hover:scale-110`} size={16} />
                </button>
              </div>
            </div>
            
            {/* Movie Details */}
            <div className="md:w-3/5 p-3 md:p-6 lg:p-8 flex flex-col flex-1 min-h-0 max-h-[calc(65vh-2rem)] md:max-h-[calc(100vh-16rem)] lg:max-h-[calc(100vh-16rem)] overflow-y-auto scrollbar-hide">
              {/* Header */}
              <div className="mb-3 md:mb-6">
                <h2 className="text-lg md:text-2xl lg:text-4xl font-bold text-white leading-tight mb-2 md:mb-3 
                             bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                    {movie.title}
                  {movie.release_date && (
                    <span className="text-gray-400 ml-2 md:ml-3 text-base md:text-xl lg:text-2xl">
                      ({getYear(movie.release_date)})
                          </span>
                        )}
                </h2>
                
                {/* Movie Meta */}
                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-400">
                  <div className="flex items-center gap-1 md:gap-2 bg-white/5 px-2 md:px-3 py-1 md:py-2 rounded-lg md:rounded-xl">
                    <Calendar size={12} className="md:hidden text-blue-400" />
                    <Calendar size={16} className="hidden md:block text-blue-400" />
                    <span className="text-xs md:text-sm">{formatDate(movie.release_date)}</span>
                    </div>
                  
                  <div className="flex items-center gap-1 md:gap-2 bg-white/5 px-2 md:px-3 py-1 md:py-2 rounded-lg md:rounded-xl">
                    <Star size={12} className="md:hidden text-yellow-400" />
                    <Star size={16} className="hidden md:block text-yellow-400" />
                    <span className="text-xs md:text-sm">{movie.vote_average > 0 ? `${movie.vote_average.toFixed(1)}/10` : 'Not rated'}</span>
                  </div>
                </div>
              </div>
              
              {/* Genres */}
              <div className="mb-3 md:mb-6">
                <div className="flex flex-wrap gap-1 md:gap-2">
                  {movie.genres && movie.genres.slice(0, 4).map((genre, index) => (
                    <span
                      key={genre.id}
                      className="px-2 md:px-3 py-1 md:py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 
                               text-xs md:text-sm text-gray-300 rounded-lg md:rounded-xl border border-white/10
                               hover:from-indigo-500/30 hover:to-purple-500/30 transition-all duration-200"
                      style={{
                        animationName: 'slideInUp',
                        animationDuration: '0.5s',
                        animationTimingFunction: 'ease-out',
                        animationFillMode: 'forwards',
                        animationDelay: `${index * 100}ms`
                      }}
                    >
                      {genre.name}
                    </span>
                  ))}
                  {movie.genres && movie.genres.length > 4 && (
                    <span className="px-2 md:px-3 py-1 md:py-2 bg-white/5 text-xs md:text-sm text-gray-400 rounded-lg md:rounded-xl">
                      +{movie.genres.length - 4} more
                    </span>
                  )}
                </div>
              </div>
              
              {/* Overview */}
              <div className="mb-4 md:mb-8 flex-1 min-h-0 overflow-hidden">
                <p className="text-gray-300 text-sm md:text-base lg:text-lg leading-relaxed line-clamp-4 md:line-clamp-none">
                  {movie.overview}
                </p>
              </div>
              
              {/* Action Buttons - Horizontal Layout */}
              <div className="flex flex-row gap-2 md:gap-3 mt-auto">
                <button
                  onClick={() => window.open(`https://www.imdb.com/title/${movie.imdb_id}`, '_blank')}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 
                           hover:from-yellow-400 hover:to-orange-400
                           text-black font-semibold py-3 md:py-4 px-4 md:px-6 rounded-xl md:rounded-2xl
                           shadow-lg hover:shadow-xl hover:shadow-yellow-500/25
                           transform hover:scale-[1.02] active:scale-[0.98]
                           transition-all duration-200 ease-out
                           flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg"
                    alt="IMDb"
                    className="h-4 md:h-5"
                  />
                  <span className="hidden md:inline">View on IMDb</span>
                  <span className="md:hidden">IMDb</span>
                  <ExternalLink size={16} className="md:hidden" />
                  <ExternalLink size={18} className="hidden md:block" />
                </button>
                
                <button
                  onClick={handleWatchlistToggle}
                  className={`flex-1 font-semibold py-3 md:py-4 px-4 md:px-6 rounded-xl md:rounded-2xl
                            shadow-lg hover:shadow-xl
                            transform hover:scale-[1.02] active:scale-[0.98]
                            transition-all duration-200 ease-out
                            flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base ${
                    isInWatchlist
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white hover:shadow-pink-500/25'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30'
                  }`}
                >
                  <Heart className={`${isInWatchlist ? 'fill-current' : ''} transition-transform duration-300`} size={16} />
                  <span className="hidden md:inline">{isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}</span>
                  <span className="md:hidden">{isInWatchlist ? 'Remove' : 'Add'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Random Movie/Show Button - Full width on mobile */}
      <div className="flex justify-center">
        <button
          onClick={handleGetRandomMovie}
          className="group relative text-white font-semibold py-3 md:py-4 px-6 md:px-8 rounded-2xl
                   shadow-lg hover:shadow-xl hover:shadow-purple-500/25
                   transform hover:scale-[1.02] active:scale-[0.98]
                   transition-all duration-200 ease-out
                   flex items-center justify-center gap-3 text-sm md:text-base
                   overflow-hidden w-full md:w-auto
                   bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 
                   hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center gap-3">
            <Shuffle size={18} className="group-hover:rotate-180 transition-transform duration-300" />
            <span className="hidden sm:inline">
              {filterOptions.tvShowsOnly ? 'Get Another Show' : 'Get Another Movie'}
            </span>
            <span className="sm:hidden">
              {filterOptions.tvShowsOnly ? 'Another Show' : 'Another Movie'}
            </span>
            <Sparkles size={16} className="group-hover:scale-110 transition-transform duration-300" />
          </div>
        </button>
      </div>


    </div>
  );
};

export default MovieCard;