import React, { useState } from 'react';
import { AlertTriangle, Shuffle, RotateCcw, Sparkles } from 'lucide-react';
import Button from './ui/Button';
import { useMovieContext } from '../context/MovieContext';

const NoMoviesFound: React.FC = () => {
  const { filterOptions, updateFilterOptions, getRandomMovie } = useMovieContext();
  const currentYear = new Date().getFullYear();

  const resetFilters = async () => {
    updateFilterOptions({
      genres: [],
      yearFrom: 1990,
      yearTo: currentYear,
      ratingFrom: 6,
      inTheatersOnly: false,
      includeAdult: true,
      tvShowsOnly: false,
    });
  };

  const applyRandomFilters = async () => {
    const genres = [28, 35, 18, 27, 16, 80, 99, 10751, 14, 36, 10402, 9648, 10749, 878, 10770, 53, 10752, 37]; // All genre IDs
    const numGenres = Math.floor(Math.random() * 3) + 1; // 1-3 genres
    const shuffledGenres = [...genres].sort(() => Math.random() - 0.5);
    const randomGenres = shuffledGenres.slice(0, numGenres);
    
    const minYear = 1950;
    const yearFrom = Math.floor(Math.random() * (currentYear - minYear - 10)) + minYear;
    const yearTo = Math.floor(Math.random() * (currentYear - yearFrom - 5)) + yearFrom + 5;
    
    const rating = Math.floor(Math.random() * 3) + 5; // 5-7
    
    updateFilterOptions({
      genres: randomGenres,
      yearFrom,
      yearTo,
      ratingFrom: rating,
      inTheatersOnly: false,
      includeAdult: true,
      tvShowsOnly: false
    });
  };

  const handleGetRandomMovie = async () => {
    try {
      await getRandomMovie();
    } catch (error) {
      console.error('Error getting random movie:', error);
    }
  };

  return (
    <div className="w-full max-w-[95vw] md:max-w-5xl lg:max-w-6xl mx-auto space-y-4">
      {/* No Movies Found Card */}
      <div className="bg-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-800 p-6 md:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={32} className="text-yellow-500" />
          </div>
          
          <h3 className="text-2xl font-bold mb-3">No Movies Found</h3>
          
          <p className="text-gray-400 mb-8 max-w-md text-base leading-relaxed">
            Your current filters are too restrictive. Try one of these options:
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
            <Button
              variant="primary"
              onClick={applyRandomFilters}
              size="md"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Shuffle size={18} />
              Surprise Me
            </Button>
            
            <Button
              variant="secondary"
              onClick={resetFilters}
              size="md"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Random Movie/Show Button */}
      <div className="flex justify-center">
        <button
          onClick={handleGetRandomMovie}
          className="group bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 
                   hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500
                   text-white font-semibold py-3 md:py-4 px-6 md:px-8 rounded-2xl
                   shadow-lg hover:shadow-xl hover:shadow-purple-500/25
                   transform hover:scale-[1.02] active:scale-[0.98]
                   transition-all duration-200 ease-out
                   flex items-center justify-center gap-3 text-sm md:text-base
                   border border-white/10 hover:border-white/20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center gap-3">
            <Shuffle size={18} className="group-hover:rotate-180 transition-transform duration-300" />
            <span className="hidden sm:inline">
              {filterOptions.tvShowsOnly ? 'Try Random Show' : 'Try Random Movie'}
            </span>
            <span className="sm:hidden">
              {filterOptions.tvShowsOnly ? 'Random Show' : 'Random Movie'}
            </span>
            <Sparkles size={16} className="group-hover:scale-110 transition-transform duration-300" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default NoMoviesFound;