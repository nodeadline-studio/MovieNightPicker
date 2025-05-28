import React, { useState } from 'react';
import { Movie } from '../types';
import { getImageUrl, isInTheaters } from '../config/api';
import { Heart, Star, Calendar, Clock, Clapperboard, ExternalLink, Sparkles } from 'lucide-react';
import Button from './ui/Button';
import { useMovieContext } from '../context/MovieContext';
import * as gtag from '../utils/gtag';

interface MovieCardProps {
  movie: Movie;
  isInWatchlist?: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, isInWatchlist = false }) => {
  const { addToWatchlist, removeFromWatchlist } = useMovieContext();
  
  const handleWatchlistToggle = () => {
    if (isInWatchlist) {
      removeFromWatchlist(movie.id);
      gtag.trackWatchlistRemove(movie.id, movie.title);
    } else {
      addToWatchlist(movie);
      gtag.trackWatchlistAdd(movie.id, movie.title);
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
    <div className="w-full max-w-[95vw] md:max-w-5xl lg:max-w-6xl mx-auto relative group">
      {/* Background glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
      
      <div className="relative bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-800/95 
                     backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden 
                     shadow-2xl ring-1 ring-white/5 transform transition-transform duration-300 
                     hover:scale-[1.01]">
        
        <div className="flex flex-col md:flex-row">
          {/* Movie Poster */}
          <div className="w-full md:w-1/3 relative aspect-[3/4] md:aspect-auto">
            {/* Now Playing Badge */}
            {isInTheaters(movie.release_date) && (
              <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-500 
                             text-white text-xs font-bold px-3 py-2 rounded-2xl z-10 
                             flex items-center gap-2 shadow-lg backdrop-blur-sm">
                <Clapperboard size={12} aria-hidden="true" />
                <span>Now Playing</span>
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
            />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
            
            {/* Rating Badge */}
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm p-3 rounded-2xl shadow-lg">
              <div className="flex items-center gap-2">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg"
                  alt="IMDb"
                  className="h-4"
                />
                <span className="text-yellow-400 font-bold flex items-center gap-1">
                  <Star size={14} className="fill-current" />
                  {movie.vote_average > 0 ? (movie.vote_average).toFixed(1) : 'N/A'}
                </span>
              </div>
            </div>
            
            {/* Watchlist Button */}
            <div className="absolute top-4 right-4">
              <button
                onClick={handleWatchlistToggle}
                className={`p-3 rounded-2xl backdrop-blur-sm transition-all duration-300 shadow-lg ${
                  isInWatchlist 
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' 
                    : 'bg-black/60 text-white hover:bg-black/80'
                }`}
                aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
              >
                <Heart className={`${isInWatchlist ? 'fill-current' : ''} transition-transform duration-300 hover:scale-110`} size={18} />
              </button>
            </div>
          </div>
          
          {/* Movie Details */}
          <div className="md:w-2/3 p-6 md:p-8 flex flex-col">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight mb-3 
                           bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                  {movie.title}
                {movie.release_date && (
                  <span className="text-gray-400 ml-3 text-xl md:text-2xl">
                    ({getYear(movie.release_date)})
                        </span>
                      )}
              </h2>
              
              {/* Movie Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl">
                  <Calendar size={16} className="text-blue-400" />
                  <span>{formatDate(movie.release_date)}</span>
                  </div>
                
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl">
                  <Star size={16} className="text-yellow-400" />
                  <span>{movie.vote_average > 0 ? `${movie.vote_average.toFixed(1)}/10` : 'Not rated'}</span>
                </div>
              </div>
            </div>
            
            {/* Genres */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {movie.genres && movie.genres.map((genre, index) => (
                  <span
                    key={genre.id}
                    className="px-3 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 
                             text-sm text-gray-300 rounded-xl border border-white/10
                             hover:from-indigo-500/30 hover:to-purple-500/30 transition-all duration-200"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: 'slideInUp 0.5s ease-out forwards'
                    }}
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Overview */}
            <div className="mb-8 flex-1">
              <p className="text-gray-300 text-base md:text-lg leading-relaxed">
                {movie.overview}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.open(`https://www.imdb.com/title/${movie.imdb_id}`, '_blank')}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 
                         hover:from-yellow-400 hover:to-orange-400
                         text-black font-semibold py-4 px-6 rounded-2xl
                         shadow-lg hover:shadow-xl hover:shadow-yellow-500/25
                         transform hover:scale-[1.02] active:scale-[0.98]
                         transition-all duration-200 ease-out
                         flex items-center justify-center gap-3"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg"
                  alt="IMDb"
                  className="h-5"
                />
                View on IMDb
                <ExternalLink size={18} />
              </button>
              
              <button
                onClick={handleWatchlistToggle}
                className={`flex-1 font-semibold py-4 px-6 rounded-2xl
                          shadow-lg hover:shadow-xl
                          transform hover:scale-[1.02] active:scale-[0.98]
                          transition-all duration-200 ease-out
                          flex items-center justify-center gap-3 ${
                  isInWatchlist
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white hover:shadow-pink-500/25'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30'
                }`}
              >
                <Heart className={`${isInWatchlist ? 'fill-current' : ''} transition-transform duration-300`} size={18} />
                {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;