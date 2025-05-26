import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Movie, Genre, FilterOptions, LoadingState, WatchlistMovie } from '../types';
import { fetchRandomMovie, fetchGenres } from '../config/api';
import { movieCache, CacheResult } from '../utils/cache';
import { getWatchlist, saveWatchlist } from '../utils/storage';

interface MovieContextType {
  currentMovie: Movie | null;
  watchlist: WatchlistMovie[];
  pickCount: number;
  genres: Genre[];
  loadingState: LoadingState;
  filterOptions: FilterOptions;
  error: string | null;
  getRandomMovie: () => Promise<void>;
  addToWatchlist: (movie: Movie) => void;
  removeFromWatchlist: (id: number) => void;
  updateFilterOptions: (options: Partial<FilterOptions>) => void;
  resetPickCount: () => void;
  setPickCount: React.Dispatch<React.SetStateAction<number>>;
}

const DEFAULT_FILTER_OPTIONS: FilterOptions = {
  genres: [],
  yearFrom: 1990,
  yearTo: new Date().getFullYear(),
  ratingFrom: 6,
  maxRuntime: 150,
  inTheatersOnly: false,
  includeAdult: false,
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

  const getRandomMovie = useCallback(async () => {
    setLoadingState(LoadingState.LOADING);
    setError(null);
    movieCache.clear();
    
    try {
      // First attempt with original filters
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
  }, [filterOptions])

  const addToWatchlist = useCallback((movie: Movie) => {
    setWatchlist((prev) => {
      // Check if movie is already in watchlist
      if (prev.some((m) => m.id === movie.id)) {
        return prev;
      }

      // Ensure we have all required data including IMDb ID
      const watchlistMovie: WatchlistMovie = {
        ...movie,
        imdb_id: movie.imdb_id || null,
        addedAt: new Date().toISOString(),
      };
      
      return [...prev, watchlistMovie];
    });
  }, []);

  const removeFromWatchlist = useCallback((id: number) => {
    setWatchlist((prev) => prev.filter((movie) => movie.id !== id));
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

  const resetPickCount = useCallback(() => {
    setPickCount(0);
  }, []);

  const getMovieFromCache = useCallback(async (): Promise<CacheResult> => {
    setLoadingState(LoadingState.LOADING);
    setError(null);
    
    try {
      const movie = await movieCache.getMovie();
      if (movie) {
        setCurrentMovie(movie);
        setLoadingState(LoadingState.SUCCESS);
        setPickCount(prev => prev + 1);
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
        getMovieFromCache,
        addToWatchlist,
        removeFromWatchlist,
        updateFilterOptions,
        resetPickCount,
        setPickCount,
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