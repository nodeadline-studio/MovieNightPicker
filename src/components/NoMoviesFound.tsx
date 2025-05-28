import React, { useState } from 'react';
import { AlertTriangle, Shuffle, RotateCcw } from 'lucide-react';
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
      maxRuntime: 150,
      inTheatersOnly: false,
      includeAdult: true,
      tvShowsOnly: false,
    });
    
    // Убрал автоматический поиск фильма - теперь пользователь должен нажать кнопку поиска
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
    const runtime = Math.floor(Math.random() * 90) + 90; // 90-180 minutes
    
    updateFilterOptions({
      genres: randomGenres,
      yearFrom,
      yearTo,
      ratingFrom: rating,
      maxRuntime: runtime,
      inTheatersOnly: false,
      includeAdult: true,
      tvShowsOnly: false
    });
    
    // Убрал автоматический поиск фильма - теперь пользователь должен нажать кнопку поиска
  };

  return (
    <div className="w-full max-w-[95vw] md:max-w-2xl mx-auto bg-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-800 p-6 md:p-8">
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
  );
};

export default NoMoviesFound;