import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Movie, Genre, FilterOptions, LoadingState, WatchlistMovie } from '../types';
import { fetchRandomMovie, fetchGenres } from '../config/api';
import { movieCache, CacheResult } from '../utils/cache';
import { getWatchlist, saveWatchlist, clearWatchlist, debugLocalStorage } from '../utils/storage';
import { logger } from '../utils/logger';

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
  maxRuntime: 180,
};

const MovieContext = createContext<MovieContextType | undefined>(undefined);

export const MovieProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistMovie[]>(getWatchlist());
  const [pickCount, setPickCount] = useState<number>(0);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(DEFAULT_FILTER_OPTIONS);
  const [error, setError] = useState<string | null>(null);
  const [sessionMovies, setSessionMovies] = useState<Set<number>>(new Set());

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
    movieCache.removeSuspiciousMovies();
    
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
        if (currentWatchlist.length !== cleanedWatchlist.length) {
          logger.debug(`Updated watchlist: migrated legacy items and removed ${currentWatchlist.length - cleanedWatchlist.length} suspicious movies`, undefined, { prefix: 'Context' });
        }
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
    
    // More diverse genre selection - avoid popular combinations
    const numGenres = Math.floor(Math.random() * 2) + 2; // 2-3 genres for better diversity
    const shuffledGenres = [...genres].sort(() => Math.random() - 0.5);
    const randomGenres = shuffledGenres.slice(0, numGenres).map(g => g.id);
    
    const currentYear = new Date().getFullYear();
    const minYear = 1960; // Start from 1960 for greater diversity
    
    // More diverse time periods
    const periods = [
      { from: 1960, to: 1980 }, // Classic era
      { from: 1980, to: 2000 }, // 80s-90s
      { from: 2000, to: 2010 }, // 2000s
      { from: 2010, to: currentYear }, // Modern
      { from: 1960, to: currentYear }, // All time
    ];
    
    const selectedPeriod = periods[Math.floor(Math.random() * periods.length)];
    const yearFrom = selectedPeriod.from + Math.floor(Math.random() * 5); // Small variation
    const yearTo = Math.min(selectedPeriod.to, currentYear);
    
    const rating = Math.floor(Math.random() * 2.5) + 5.5; // 5.5-8.0 for better diversity
    
    const newFilters = {
      genres: randomGenres,
      yearFrom,
      yearTo,
      ratingFrom: rating,
      inTheatersOnly: false,
      includeAdult: true,
      tvShowsOnly: false,
      maxRuntime: 180
    };
    
    logger.debug('🎲 Applied random filters:', newFilters, { prefix: 'Context' });
    updateFilterOptions(newFilters);
    // Removed automatic movie search - now only updates filters
  }, [genres, updateFilterOptions]);

  const getRandomMovie = useCallback(async () => {
    setLoadingState(LoadingState.LOADING);
    setError(null);
    
    // DON'T clear usedMovies - keep duplicate prevention active
    // Only remove suspicious movies, but preserve usedMovies tracking
    movieCache.removeSuspiciousMovies(); // Keep this
    
    // Apply random filters if randomizer is enabled BEFORE making the API call
    // if (isRandomizerEnabled) {
    //   applyRandomFilters(); // Now just call the function, it will update filters itself
    //   // Use current filters after update
    // }
    
    try {
      // Use current filters (they were updated by applyRandomFilters if needed)
      // Increased to last 100 movies for better variety (from 50)
      const recentSessionMovies = Array.from(sessionMovies).slice(-100);
      // Pass current movie ID and recent session movies to exclude from results
      const movie = await fetchRandomMovie(filterOptions, currentMovie?.id, recentSessionMovies);
      
      // Log to check for duplicates
      if (currentMovie && currentMovie.id === movie.id) {
        console.warn(`[Cache] Duplicate movie detected: ${movie.id} - ${movie.title}`);
      }
      
      setCurrentMovie(movie);
      setLoadingState(LoadingState.SUCCESS);
      setPickCount(prev => prev + 1);
      
      // Track movie in session to prevent duplicates
      setSessionMovies(prev => {
        const newSet = new Set([...prev, movie.id]);
        // Keep only last 100 movies in session (increased from 50 for better variety)
        if (newSet.size > 100) {
          const arr = Array.from(newSet);
          return new Set(arr.slice(-100));
        }
        return newSet;
      });
    } catch (e) {
      const errorMessage = (e as Error).message;
      setError(errorMessage);
      setLoadingState(LoadingState.ERROR);
      throw e; // Let the component handle the error
    }
  }, [filterOptions, applyRandomFilters, currentMovie, sessionMovies]);

  const getRandomMovieSafe = useCallback(async () => {
    setLoadingState(LoadingState.LOADING);
    setError(null);
    
    // Apply random filters if randomizer is enabled BEFORE making the API call
    // if (isRandomizerEnabled) {
    //   applyRandomFilters(); // Now just call the function, it will update filters itself
    //   // Use current filters after update
    // }
    
    try {
      // Use current filters (they were updated by applyRandomFilters if needed)
      // Limit sessionMovies to last 20 for better variety
      const recentSessionMovies = Array.from(sessionMovies).slice(-20);
      // Pass current movie ID and recent session movies to exclude from results
      const movie = await fetchRandomMovie(filterOptions, currentMovie?.id, recentSessionMovies);
      setCurrentMovie(movie);
      setLoadingState(LoadingState.SUCCESS);
      setPickCount(prev => prev + 1);
      
      // Track movie in session to prevent duplicates
      setSessionMovies(prev => {
        const newSet = new Set([...prev, movie.id]);
        // Keep only last 20 movies in session
        if (newSet.size > 20) {
          const arr = Array.from(newSet);
          return new Set(arr.slice(-20));
        }
        return newSet;
      });
    } catch (e) {
      const errorMessage = (e as Error).message;
      setError(errorMessage);
      setLoadingState(LoadingState.ERROR);
      console.error('Error getting random movie:', errorMessage);
    }
  }, [filterOptions, applyRandomFilters, currentMovie, sessionMovies]);

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