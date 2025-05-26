import React, { useState } from 'react';
import { Movie } from '../types';
import { getImageUrl, isInTheaters } from '../config/api';
import { Heart, Star, Calendar, Clock, Clapperboard } from 'lucide-react';
import Button from './ui/Button';
import { useMovieContext } from '../context/MovieContext';
import AdUnit from './AdUnit';

interface MovieCardProps {
  movie: Movie;
  isInWatchlist?: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, isInWatchlist = false }) => {
  const { addToWatchlist, removeFromWatchlist } = useMovieContext();
  
  const handleWatchlistToggle = () => {
    if (isInWatchlist) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist(movie);
    }
  };
  
  // Format release date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  // Extract year from release date
  const getYear = (dateString: string): string => {
    if (!dateString) return '';
    return new Date(dateString).getFullYear();
  };

  return (
    <>
      <div className="w-full max-w-[95vw] md:max-w-4xl mx-auto bg-gray-900 rounded-xl overflow-hidden shadow-xl animate-fadeIn border border-gray-800">
        <div className="flex flex-col md:flex-row">
          <div 
            className="w-full md:w-1/3 relative aspect-[2/3] md:aspect-auto"
          >
            {isInTheaters(movie.release_date) && (
              <div className="absolute top-4 left-4 bg-green-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 flex items-center gap-1.5">
                <Clapperboard size={12} aria-hidden="true" />
                <span>Now Playing</span>
              </div>
            )}
            <img
              className="w-full h-full object-cover"
              src={getImageUrl(movie.poster_path)}
              alt={`Movie poster for ${movie.title}`}
              loading="eager"
              itemProp="image"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/75 backdrop-blur-sm p-2 flex items-center justify-between">
              <div className="flex items-center">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg"
                  alt="IMDb"
                  className="h-4 mr-2"
                />
                <span className="text-yellow-400 font-bold flex items-center">
                  ★ {movie.vote_average > 0 ? Math.floor(movie.vote_average * 10) / 10 : 'N/A'}
                </span>
              </div>
            </div>
            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm p-1.5 rounded-full shadow-lg">
              <Button
                variant={isInWatchlist ? 'secondary' : 'ghost'}
                className="save-button-container"
                size="sm"
                icon={<Heart className={isInWatchlist ? 'fill-current' : ''} size={16} />}
                onClick={handleWatchlistToggle}
                aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
              >
                {isInWatchlist ? 'Saved' : 'Save'}
              </Button>
            </div>
          </div>
          <div className="md:w-2/3 p-5 md:p-8 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl md:text-3xl font-bold text-white leading-tight">
                  {movie.title}
                  {movie.release_date && <span className="text-gray-400 ml-2">({getYear(movie.release_date)})</span>}
                </h2>
                <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2 text-xs md:text-sm text-gray-400">
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-1" />
                    <span className="flex items-center">
                      {formatDate(movie.release_date)}
                      {isInTheaters(movie.release_date) && (
                        <span className="ml-2 flex items-center text-green-500 font-medium">
                          <Clapperboard size={14} className="mr-1" />
                          In Theaters
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Star size={16} className="mr-1 text-yellow-500" />
                    <span>IMDb {movie.vote_average > 0 ? `${Math.floor(movie.vote_average * 10) / 10}/10` : 'Not rated'}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={16} className="mr-1" />
                    <span>{movie.runtime} min</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-4 flex-1">
              <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                {movie.genres && movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-2 py-0.5 md:py-1 bg-gray-800 text-xs md:text-sm text-gray-300 rounded-full"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed line-clamp-none">{movie.overview}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mt-2 md:mt-auto pb-1">
              <Button
                variant="primary"
                onClick={() => window.open(`https://www.imdb.com/title/${movie.imdb_id}`, '_blank')}
                className="bg-[#f5c518] hover:bg-[#e3b408] text-black flex-1"
              >
                View on IMDb
              </Button>
              <Button
                variant={isInWatchlist ? 'outline' : 'secondary'}
                icon={<Heart size={18} className={isInWatchlist ? 'fill-current' : ''} />}
                onClick={handleWatchlistToggle}
                className="flex-1"
              >
                {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MovieCard;