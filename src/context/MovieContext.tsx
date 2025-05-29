import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Movie, Genre, FilterOptions, LoadingState, WatchlistMovie } from '../types';
import { fetchRandomMovie, fetchGenres } from '../config/api';
import { movieCache, CacheResult } from '../utils/cache';
import { getWatchlist, saveWatchlist, clearWatchlist, debugLocalStorage } from '../utils/storage';

interface MovieContextType {
  currentMovie: Movie | null;
  watchlist: WatchlistMovie[];
  pickCount: number;
  genres: Genre[];
  loadingState: LoadingState;
  filterOptions: FilterOptions;
  error: string | null;
  getRandomMovie: () => Promise<void>;
  getRandomMovieSafe: () => Promise<void>;
  addToWatchlist: (movie: Movie) => void;
  removeFromWatchlist: (id: number) => void;
  updateFilterOptions: (options: Partial<FilterOptions>) => void;
  applyRandomFilters: () => void;
  resetPickCount: () => void;
  setPickCount: React.Dispatch<React.SetStateAction<number>>;
  clearWatchlist: () => void;
  debugLocalStorage: () => void;
}

const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  genres: [],
  yearFrom: 1990,
  yearTo: new Date().getFullYear(),
  ratingFrom: 6,
  inTheatersOnly: false,
  includeAdult: true,
  tvShowsOnly: false,
};

const MovieContext = createContext<MovieContextType | undefined>(undefined);

export const MovieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistMovie[]>(getWatchlist());
  const [pickCount, setPickCount] = useState<number>(0);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(DEFAULT_FILTER_OPTIONS);
  const [error, setError] = useState<string | null>(null);

  // Fetch genres
  const { data: genres = [] } = useQuery({
    queryKey: ['genres'],
    queryFn: fetchGenres,
  });

  useEffect(() => {
    try {      
      const savedFilters = localStorage.getItem('nmp-filters');
      if (savedFilters) {
        setFilterOptions(JSON.parse(savedFilters));
      }
    } catch (e) {
      console.error('Error loading data from localStorage', e);
    }
  }, []);

  // Save watchlist to localStorage
  useEffect(() => {
    if (watchlist.length) {
      saveWatchlist(watchlist);
    }
  }, [watchlist]);

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem('nmp-filters', JSON.stringify(filterOptions));
  }, [filterOptions]);

  // Clear suspicious movies from cache on initialization
  useEffect(() => {
    movieCache.clearSuspiciousMovies();
    
    // Also check and clean watchlist from suspicious movies
    const currentWatchlist = getWatchlist();
    if (currentWatchlist.length > 0) {
      let hasChanges = false;
      
      // Filter out movies with suspicious ratings or missing data and migrate legacy items
      const cleanedWatchlist = currentWatchlist.map(movie => {
        // Add contentType to legacy items (assume they are movies)
        if (!movie.contentType) {
          hasChanges = true;
          return {
            ...movie,
            contentType: 'movie' as const
          };
        }
        return movie;
      }).filter(movie => {
        // Remove movies with perfect 10.0 rating (likely deleted/invalid)
        if (movie.vote_average >= 10.0) {
          console.warn(`Removing suspicious movie from watchlist: ${movie.title} (rating: ${movie.vote_average})`);
          hasChanges = true;
          return false;
        }
        // Remove movies with missing essential data
        if (!movie.title || !movie.id || !movie.poster_path) {
          console.warn(`Removing incomplete movie from watchlist: ${movie.title || 'Unknown'}`);
          hasChanges = true;
          return false;
        }
        return true;
      });
      
      // Update watchlist if we made any changes
      if (hasChanges) {
        console.log(`Updated watchlist: migrated legacy items and removed ${currentWatchlist.length - cleanedWatchlist.length} suspicious movies`);
        setWatchlist(cleanedWatchlist);
        saveWatchlist(cleanedWatchlist);
      }
    }
  }, []);

  const updateFilterOptions = useCallback((options: Partial<FilterOptions>) => {
    setFilterOptions((prev) => {
      const newOptions = { ...prev, ...options };
      
      // Ensure year range is valid
      if (newOptions.yearFrom > newOptions.yearTo) {
        newOptions.yearFrom = prev.yearFrom;
        newOptions.yearTo = prev.yearTo;
      }
      
      // Ensure rating is within bounds
      if (newOptions.ratingFrom < 0) newOptions.ratingFrom = 0;
      if (newOptions.ratingFrom > 10) newOptions.ratingFrom = 10;
      
      return newOptions;
    });
  }, []);

  const applyRandomFilters = useCallback(() => {
    if (genres.length === 0) return; // Wait for genres to load
    
    // Более разнообразный выбор жанров - избегаем популярных комбинаций
    const numGenres = Math.floor(Math.random() * 2) + 2; // 2-3 genres (уменьшил для большего разнообразия)
    const shuffledGenres = [...genres].sort(() => Math.random() - 0.5);
    const randomGenres = shuffledGenres.slice(0, numGenres).map(g => g.id);
    
    const currentYear = new Date().getFullYear();
    const minYear = 1960; // Начинаем с 1960 для большего разнообразия
    
    // Более разнообразные периоды времени
    const periods = [
      { from: 1960, to: 1980 }, // Классика
      { from: 1980, to: 2000 }, // 80-90е
      { from: 2000, to: 2010 }, // 2000е
      { from: 2010, to: currentYear }, // Современные
      { from: 1960, to: currentYear }, // Весь период
    ];
    
    const selectedPeriod = periods[Math.floor(Math.random() * periods.length)];
    const yearFrom = selectedPeriod.from + Math.floor(Math.random() * 5); // Небольшая вариация
    const yearTo = Math.min(selectedPeriod.to, currentYear);
    
    const rating = Math.floor(Math.random() * 2.5) + 5.5; // 5.5-8.0 для большего разнообразия
    
    const newFilters = {
      genres: randomGenres,
      yearFrom,
      yearTo,
      ratingFrom: rating,
      inTheatersOnly: false,
      includeAdult: true,
      tvShowsOnly: false
    };
    
    console.log('🎲 Applied random filters:', newFilters);
    updateFilterOptions(newFilters);
    // Убрал автоматический поиск фильма - теперь только меняем фильтры
  }, [genres, updateFilterOptions]);

  const getRandomMovie = useCallback(async () => {
    setLoadingState(LoadingState.LOADING);
    setError(null);
    movieCache.clear();
    movieCache.clearSuspiciousMovies(); // Clear any cached movies with suspicious ratings
    
    // Apply random filters if randomizer is enabled BEFORE making the API call
    // if (isRandomizerEnabled) {
    //   applyRandomFilters(); // Теперь просто вызываем функцию, она сама обновит фильтры
    //   // Используем текущие фильтры после обновления
    // }
    
    try {
      // Use current filters (they were updated by applyRandomFilters if needed)
      const movie = await fetchRandomMovie(filterOptions);
      setCurrentMovie(movie);
      setLoadingState(LoadingState.SUCCESS);
      setPickCount(prev => prev + 1);
    } catch (e) {
      const errorMessage = (e as Error).message;
      setError(errorMessage);
      setLoadingState(LoadingState.ERROR);
      throw e; // Let the component handle the error
    }
  }, [filterOptions, applyRandomFilters]);

  const getRandomMovieSafe = useCallback(async () => {
    setLoadingState(LoadingState.LOADING);
    setError(null);
    
    // Apply random filters if randomizer is enabled BEFORE making the API call
    // if (isRandomizerEnabled) {
    //   applyRandomFilters(); // Теперь просто вызываем функцию, она сама обновит фильтры
    //   // Используем текущие фильтры после обновления
    // }
    
    try {
      // Use current filters (they were updated by applyRandomFilters if needed)
      const movie = await fetchRandomMovie(filterOptions);
      setCurrentMovie(movie);
      setLoadingState(LoadingState.SUCCESS);
      setPickCount(prev => prev + 1);
    } catch (e) {
      const errorMessage = (e as Error).message;
      setError(errorMessage);
      setLoadingState(LoadingState.ERROR);
      console.error('Error getting random movie:', errorMessage);
    }
  }, [filterOptions, applyRandomFilters]);

  const addToWatchlist = useCallback((movie: Movie) => {
    setWatchlist((prev) => {
      // Check if movie is already in watchlist
      if (prev.some((m) => m.id === movie.id)) {
        return prev;
      }

      // Determine content type based on current filter settings
      const contentType = filterOptions.tvShowsOnly ? 'tv' : 'movie';

      // Ensure we have all required data including IMDb ID
      const watchlistMovie: WatchlistMovie = {
        ...movie,
        imdb_id: movie.imdb_id || null,
        addedAt: new Date().toISOString(),
        contentType,
      };
      
      return [...prev, watchlistMovie];
    });
  }, [filterOptions.tvShowsOnly]);

  const removeFromWatchlist = useCallback((id: number) => {
    setWatchlist((prev) => prev.filter((movie) => movie.id !== id));
  }, []);

  const resetPickCount = useCallback(() => {
    setPickCount(0);
  }, []);

  const handleClearWatchlist = useCallback(() => {
    clearWatchlist();
    setWatchlist([]);
  }, []);

  const handleDebugLocalStorage = useCallback(() => {
    debugLocalStorage();
  }, []);

  const getMovieFromCache = useCallback(async (): Promise<CacheResult> => {
    setLoadingState(LoadingState.LOADING);
    setError(null);
    
    try {
      const movie = await movieCache.getMovie();
      if (movie) {
        setCurrentMovie(movie);
        setLoadingState(LoadingState.SUCCESS);
        return { success: true, movie };
      }
      return { success: false };
    } catch (e) {
      setError('Failed to load movie from cache');
      setLoadingState(LoadingState.ERROR);
      return { success: false };
    }
  }, []);

  return (
    <MovieContext.Provider
      value={{
        currentMovie,
        watchlist,
        pickCount,
        genres,
        loadingState,
        filterOptions,
        error,
        getRandomMovie,
        getRandomMovieSafe,
        addToWatchlist,
        removeFromWatchlist,
        updateFilterOptions,
        applyRandomFilters,
        resetPickCount,
        setPickCount,
        clearWatchlist: handleClearWatchlist,
        debugLocalStorage: handleDebugLocalStorage,
      }}
    >
      {children}
    </MovieContext.Provider>
  );
};

export const useMovieContext = () => {
  const context = useContext(MovieContext);
  if (context === undefined) {
    throw new Error('useMovieContext must be used within a MovieProvider');
  }
  return context;
};