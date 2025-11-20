import { Movie, FilterOptions, Genre, WatchlistMovie } from '../types';
import { movieCache } from '../utils/cache';
import { getWatchlist } from '../utils/storage';
import { logger } from '../utils/logger';
import { calculateMovieScore, weightedRandomSelect, sortByScore, MovieScore } from '../utils/movieScoring';

// Movie API configuration
// We'll use TMDB API for this project
const API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';

// Security: Validate API key
if (!API_KEY && import.meta.env.MODE === 'production') {
  console.error('SECURITY WARNING: TMDB API key is not configured for production');
}

// Security: Basic API key format validation
if (API_KEY && API_KEY.length < 10) {
  console.warn('SECURITY WARNING: API key appears to be invalid or too short');
}

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const POSTER_SIZE = 'w500';
const BACKDROP_SIZE = 'original';

const ENDPOINTS = {
  DISCOVER: `${BASE_URL}/discover/movie`,
  DISCOVER_TV: `${BASE_URL}/discover/tv`,
  MOVIE: `${BASE_URL}/movie`,
  TV: `${BASE_URL}/tv`,
  POPULAR: `${BASE_URL}/movie/popular`,
  TOP_RATED: `${BASE_URL}/movie/top_rated`,
  GENRES: `${BASE_URL}/genre/movie/list`,
  TV_GENRES: `${BASE_URL}/genre/tv/list`,
  EXTERNAL_IDS: (id: number) => `${BASE_URL}/movie/${id}/external_ids`,
  TV_EXTERNAL_IDS: (id: number) => `${BASE_URL}/tv/${id}/external_ids`,
  NOW_PLAYING: `${BASE_URL}/movie/now_playing?region=US`,
  ON_THE_AIR: `${BASE_URL}/tv/on_the_air?region=US`,
};

const MAX_RETRIES = 3; // Maximum number of API retries

// Track last 50 pages used to avoid repeats (increased for better variety)
const recentPages: number[] = [];

function getRandomPage(): number {
  let attempts = 0;
  let page: number;
  
  // Use weighted random: favor pages 50-150 for more variety (middle pages have more diverse content)
  // 60% chance for pages 50-150, 30% for pages 1-49, 10% for pages 151-200
  const getWeightedPage = (): number => {
    const rand = Math.random();
    if (rand < 0.6) {
      // Middle pages (50-150) - most variety
      return Math.floor(Math.random() * 101) + 50;
    } else if (rand < 0.9) {
      // Early pages (1-49)
      return Math.floor(Math.random() * 49) + 1;
    } else {
      // Later pages (151-200)
      return Math.floor(Math.random() * 50) + 151;
    }
  };
  
  do {
    page = getWeightedPage();
    attempts++;
    // If we've tried many times, clear recent pages and start over
    if (attempts > 100) {
      recentPages.length = 0;
      break;
    }
  } while (recentPages.includes(page));
  
  // Keep only last 50 pages (increased from 10 for better variety)
  recentPages.push(page);
  if (recentPages.length > 50) {
    recentPages.shift();
  }
  
  return page;
}

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

export async function fetchRandomMovie(
  options: FilterOptions,
  excludeMovieId?: number,
  excludeMovieIds?: number[]
): Promise<Movie | null> {
  logger.debug('Fetching random movie with options:', options, { prefix: 'API' });

  const watchlist = getWatchlist();
  let retryCount = 0;
  const maxRetries = 5; // Увеличил количество попыток

  // Smart filter relaxation with scoring thresholds
  // Instead of removing filters, lower the score threshold gradually
  // This keeps all filters but accepts lower-scored matches
  const scoreThresholds = [0.8, 0.6, 0.4, 0.2, 0.0]; // Progressive relaxation
  
  // Try original filters with multiple pages and high score threshold
  let pageRetries = 0;
  const maxPageRetries = 5; // Try 5 different pages with original filters
  
  // First, try with strict threshold (0.8)
  while (pageRetries < maxPageRetries) {
    try {
      const movie = await attemptFetch(options, watchlist, excludeMovieId, excludeMovieIds, scoreThresholds[0]);
      if (movie) {
        logger.debug(`Found movie with original filters (page retry ${pageRetries + 1}, threshold ${scoreThresholds[0]})`, undefined, { prefix: 'API' });
        return movie;
      }
    } catch (error) {
      logger.debug(`Original filters attempt ${pageRetries + 1} failed, trying different page...`, undefined, { prefix: 'API' });
    }
    pageRetries++;
  }

  // If strict threshold failed, gradually lower it
  for (let i = 1; i < scoreThresholds.length; i++) {
    const threshold = scoreThresholds[i];
    logger.debug(`Trying with score threshold ${threshold}`, undefined, { prefix: 'API' });
    
    try {
      const movie = await attemptFetch(options, watchlist, excludeMovieId, excludeMovieIds, threshold);
      if (movie) {
        logger.debug(`Found movie with threshold ${threshold}`, undefined, { prefix: 'API' });
        return movie;
      }
    } catch (error) {
      logger.warn(`Threshold ${threshold} attempt failed:`, error, { prefix: 'API' });
      // Continue with next threshold
    }
  }

  // Last resort: Try with minimal filters (only if all thresholds failed)
  try {
    logger.debug('Making final attempt with minimal filters...', undefined, { prefix: 'API' });
    return await attemptFetch({
      ...options,
      genres: [],
      ratingFrom: 0,
      yearFrom: 1950,
      yearTo: new Date().getFullYear(),
      maxRuntime: 300,
      inTheatersOnly: false
    }, watchlist, excludeMovieId, excludeMovieIds, 0.0);
        } catch (finalError) {
    logger.error('All filter attempts failed', finalError, { prefix: 'API' });
    throw new Error('Unable to find any movies. Please check your internet connection.');
  }
}

async function attemptFetch(
  options: FilterOptions, 
  watchlist: WatchlistMovie[] = [],
  excludeMovieId?: number,
  excludeMovieIds?: number[],
  minScoreThreshold: number = 0.0 // Smart filter relaxation: accept movies above this score
): Promise<Movie | null> {
  // Normalize filter values to reasonable ranges
  const normalizedOptions = {
    ...options,
    yearFrom: Math.min(options.yearFrom, options.yearTo),
    yearTo: Math.max(options.yearFrom, options.yearTo),
    ratingFrom: Math.min(options.ratingFrom, 9), // Cap maximum rating
    maxRuntime: Math.max(options.maxRuntime, 60) // Ensure minimum runtime
  };

  // For sorted results, use page 1 and select from top results
  // For unsorted (no filters), use random page for variety
  const useRandomPage = !normalizedOptions.genres.length && 
                        (normalizedOptions.yearTo - normalizedOptions.yearFrom) >= 50 &&
                        normalizedOptions.ratingFrom <= 5.0;
  const page = useRandomPage ? getRandomPage() : 1;
  
  logger.debug('Fetching new batch from API', {
    page,
    sortBy: useRandomPage ? 'random' : 'smart',
    hasFilters: !useRandomPage
  }, { prefix: 'API' });
  
  const startTime = performance.now();
  
  // Smart pre-filtering: Determine sort strategy based on filter context
  let sortBy = 'popularity.desc'; // Default: popularity
  const hasGenres = normalizedOptions.genres.length > 0;
  const hasYearFilter = (normalizedOptions.yearTo - normalizedOptions.yearFrom) < 20;
  const hasRatingFilter = normalizedOptions.ratingFrom > 6.0;
  
  if (hasRatingFilter && !hasGenres) {
    // Rating-focused: sort by vote average
    sortBy = 'vote_average.desc';
  } else if (hasYearFilter && !hasGenres) {
    // Year-focused: sort by release date
    sortBy = 'release_date.desc';
  } else if (hasGenres) {
    // Genre filters: use popularity to get popular movies in that genre
    sortBy = 'popularity.desc';
  }
  
  // Build query parameters
  const queryParams = new URLSearchParams({
    language: 'en-US',
    page: page.toString(), // Use smart page selection
    'vote_count.gte': '100', // Ensure we have enough votes for accurate rating
    'primary_release_date.gte': `${normalizedOptions.yearFrom}-01-01`,
    'primary_release_date.lte': `${normalizedOptions.yearTo}-12-31`,
    'vote_average.gte': (normalizedOptions.ratingFrom - 0.1).toString(), // Add small buffer for floating point comparison
    include_adult: normalizedOptions.includeAdult.toString(),
    sort_by: sortBy, // Smart sorting based on filter context
  });

  // Add runtime filter only if it's not the maximum value
  if (normalizedOptions.maxRuntime < 240) {
    queryParams.append('with_runtime.lte', normalizedOptions.maxRuntime.toString());
  }

  if (normalizedOptions.genres.length) {
    queryParams.append('with_genres', normalizedOptions.genres.join(','));
  }

  let url = '';
  const hasAnyFilters = hasGenres || hasYearFilter || hasRatingFilter || normalizedOptions.maxRuntime < 240;
  
  // Multi-endpoint strategy: Use different endpoints based on filter context
  if (options.tvShowsOnly) {
    // For TV shows, use different parameters
    const tvQueryParams = new URLSearchParams({
      language: 'en-US',
      page: page.toString(),
      'vote_count.gte': '50', // Lower threshold for TV shows
      'first_air_date.gte': `${normalizedOptions.yearFrom}-01-01`,
      'first_air_date.lte': `${normalizedOptions.yearTo}-12-31`,
      'vote_average.gte': (normalizedOptions.ratingFrom - 0.1).toString(),
      include_adult: normalizedOptions.includeAdult.toString(),
    });

    if (normalizedOptions.genres.length) {
      tvQueryParams.append('with_genres', normalizedOptions.genres.join(','));
    }

    url = `${ENDPOINTS.DISCOVER_TV}?${tvQueryParams.toString()}`;
  } else if (options.inTheatersOnly) {
    url = `${ENDPOINTS.NOW_PLAYING}&${queryParams.toString()}`;
  } else if (!hasAnyFilters) {
    // No filters: Use popular or top_rated for better variety
    // Alternate between popular and top_rated for diversity
    const usePopular = Math.random() > 0.5;
    url = usePopular 
      ? `${ENDPOINTS.POPULAR}?${new URLSearchParams({ language: 'en-US', page: '1' }).toString()}`
      : `${ENDPOINTS.TOP_RATED}?${new URLSearchParams({ language: 'en-US', page: '1' }).toString()}`;
  } else {
    // Has filters: Use discover with smart sorting
    url = `${ENDPOINTS.DISCOVER}?${queryParams.toString()}`;
  }

  logger.debug('Fetching movies:', { url }, { prefix: 'API' });
  
  const response = await fetch(url, { headers });
  const data = await response.json();
  
  if (!response.ok) {
    // Check for rate limit error (status code 429)
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a few minutes.');
    }
    throw new Error(data.status_message || 'Failed to fetch movies');
  }
  
  if (!data.results?.length) {
    const contentType = options.tvShowsOnly ? 'TV shows' : 'movies';
    const issues = [];
    if (options.yearFrom > 1990) {
      issues.push(`Try expanding your year range to include older ${contentType}`);
    }
    if (options.ratingFrom > 6) {
      issues.push('Lower your minimum rating to see more options');
    }
    if (options.genres.length > 0) {
      issues.push('Remove some genre filters to broaden your search');
    }
    if (options.maxRuntime < 150 && !options.tvShowsOnly) {
      issues.push('Increase the maximum runtime to include longer films');
    }
    if (options.inTheatersOnly && !options.tvShowsOnly) {
      issues.push('Include movies not currently in theaters');
    }
    
    throw new Error(
      `No ${contentType} found! Here's what you can try:\n- ${issues.join('\n- ')}`
    );
  }

  // Pre-filter movies that don't have required fields
  const validInitialMovies = data.results.filter((movie: any) => {
    const isTV = options.tvShowsOnly;
    const title = isTV ? (movie.name || movie.original_name) : movie.title;
    
    return movie && 
    movie.id && 
      title && 
    movie.poster_path &&
      movie.vote_average >= normalizedOptions.ratingFrom && 
      movie.vote_average < 10.0 && // Exclude movies with perfect 10.0 rating (usually fake/removed)
      movie.vote_count >= (isTV ? 25 : 100) && // Lower threshold for TV shows
      !watchlist.some(w => w.id === movie.id) && // Exclude watchlist movies
      movie.id !== excludeMovieId && // Exclude current movie
      !(excludeMovieIds || []).includes(movie.id) && // Exclude recent session movies
      !movieCache.isMovieUsed(movie.id); // Exclude movies from cache usedMovies
  });

  if (validInitialMovies.length === 0) {
    const contentType = options.tvShowsOnly ? 'TV shows' : 'movies';
    throw new Error(`No ${contentType} found with these filters`);
  }

  // Two-phase fetching: Fetch more movies initially, then score and select best
  // Phase 1: Fetch 50-100 movies for better pool (increased from 20)
  const moviesToFetch = Math.min(50, validInitialMovies.length);
  const moviesToProcess = validInitialMovies.slice(0, moviesToFetch);
  
  const moviePromises = moviesToProcess.map(async (item: any) => {
    try {
      const isTV = options.tvShowsOnly;
      const endpoint = isTV ? `${ENDPOINTS.TV}/${item.id}` : `${ENDPOINTS.MOVIE}/${item.id}`;
      const itemResponse = await fetch(endpoint, { headers });
      
      if (!itemResponse.ok) {
        logger.warn(`Failed to fetch ${isTV ? 'TV show' : 'movie'} details for ID ${item.id}:`, itemResponse.status, { prefix: 'API' });
        return null;
      }
      
      const itemData = await itemResponse.json();
      
      // Normalize TV show data to movie format
      if (isTV) {
        itemData.title = itemData.name || itemData.original_name;
        itemData.release_date = itemData.first_air_date;
        itemData.poster_path = itemData.poster_path;
        itemData.backdrop_path = itemData.backdrop_path;
      }
      
      // Ensure vote_average is a valid number and not zero
      if (typeof itemData.vote_average !== 'number' || itemData.vote_average === 0) {
        const retryResponse = await fetch(endpoint, { headers });
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          if (typeof retryData.vote_average === 'number' && retryData.vote_average > 0) {
            itemData.vote_average = retryData.vote_average;
          }
        }
      }
      
      // Additional validation for full data
      if (!itemData.poster_path || !itemData.title || !itemData.id) {
        logger.warn(`${isTV ? 'TV show' : 'Movie'} data missing required fields for ID ${item.id}`, { prefix: 'API' });
        return null;
      }

      // Exclude items with suspicious ratings (perfect 10.0 or very low vote count)
      if (itemData.vote_average >= 10.0 || itemData.vote_count < (isTV ? 25 : 50)) {
        logger.warn(`${isTV ? 'TV show' : 'Movie'} ${item.id} has suspicious rating: ${itemData.vote_average} with ${itemData.vote_count} votes`, { prefix: 'API' });
        return null;
      }

      // Ensure vote_average is a valid number
      if (typeof itemData.vote_average !== 'number' || itemData.vote_average === 0) {
        itemData.vote_average = item.vote_average || 0;
      }

      // CRITICAL: Validate genre matching after fetching full details
      if (normalizedOptions.genres.length > 0) {
        // Get genre IDs from full movie details
        const movieGenreIds: number[] = itemData.genres && Array.isArray(itemData.genres)
          ? itemData.genres.map((g: any) => typeof g === 'number' ? g : (g.id || g))
          : (item.genre_ids || []);
        
        // Check if movie has at least one of the requested genres (OR logic)
        const hasMatchingGenre = normalizedOptions.genres.some(requestedGenreId => 
          movieGenreIds.includes(requestedGenreId)
        );
        
        if (!hasMatchingGenre) {
          logger.debug(`Movie ${item.id} (${itemData.title || item.title}) doesn't match requested genres. Requested: [${normalizedOptions.genres.join(', ')}], Movie has: [${movieGenreIds.join(', ')}]`, undefined, { prefix: 'API' });
          return null; // Reject movie that doesn't match genres
        }
      }

      // Validate year range
      const dateField = isTV ? itemData.first_air_date : itemData.release_date;
      if (dateField) {
        const releaseYear = new Date(dateField).getFullYear();
        if (releaseYear < normalizedOptions.yearFrom || releaseYear > normalizedOptions.yearTo) {
          logger.debug(`${isTV ? 'TV show' : 'Movie'} ${item.id} year ${releaseYear} doesn't match range [${normalizedOptions.yearFrom}-${normalizedOptions.yearTo}]`, undefined, { prefix: 'API' });
          return null;
        }
      }

      // Validate rating (already checked in initial filter, but double-check)
      if (itemData.vote_average < normalizedOptions.ratingFrom) {
        logger.debug(`Movie ${item.id} rating ${itemData.vote_average} below minimum ${normalizedOptions.ratingFrom}`, undefined, { prefix: 'API' });
        return null;
      }

      // Validate runtime
      if (itemData.runtime && normalizedOptions.maxRuntime < 240 && itemData.runtime > normalizedOptions.maxRuntime) {
        logger.debug(`Movie ${item.id} runtime ${itemData.runtime} exceeds maximum ${normalizedOptions.maxRuntime}`, undefined, { prefix: 'API' });
        return null;
      }

      try {
        const externalIdsEndpoint = isTV ? ENDPOINTS.TV_EXTERNAL_IDS(itemData.id) : ENDPOINTS.EXTERNAL_IDS(itemData.id);
        const externalIdsResponse = await fetch(externalIdsEndpoint, { headers });
        
        if (!externalIdsResponse.ok) {
          logger.warn(`Failed to fetch external IDs for ${isTV ? 'TV show' : 'movie'} ${item.id}:`, externalIdsResponse.status, { prefix: 'API' });
          return itemData; // Continue without external IDs rather than rejecting the item
        }
        
        const externalIds = await externalIdsResponse.json();
        return {
          ...itemData,
          imdb_id: externalIds.imdb_id || null,
        };
      } catch (error) {
        logger.warn(`Error fetching external IDs for ${isTV ? 'TV show' : 'movie'} ${item.id}:`, error, { prefix: 'API' });
        return itemData; // Continue without external IDs
      }
    } catch (error) {
      logger.warn(`Error processing ${options.tvShowsOnly ? 'TV show' : 'movie'} ${item.id}:`, error, { prefix: 'API' });
      return null;
    }
  });

  const movies = (await Promise.all(moviePromises))
    .filter((movie): movie is Movie => 
      movie !== null && 
      movie.poster_path !== null && 
      movie.title !== null && 
      movie.id !== null &&
      typeof movie.vote_average === 'number'
    );

  if (movies.length === 0) {
    const contentType = options.tvShowsOnly ? 'TV shows' : 'movies';
    throw new Error(`No ${contentType} found with these filters`);
  }

  logger.debug('Fetched valid movies:', {
    count: movies.length,
    titles: movies.map(m => ({ id: m.id, title: m.title }))
  }, { prefix: 'API' });

  // Record the total loading time
  const endTime = performance.now();
  movieCache.recordLoadTime(endTime - startTime);

  // Phase 2: Score all movies and select best using weighted random
  const scoredMovies: MovieScore[] = movies.map(movie => 
    calculateMovieScore(movie, normalizedOptions)
  );
  
  // Filter by score threshold (smart filter relaxation)
  const filteredByScore = scoredMovies.filter(sm => sm.score >= minScoreThreshold);
  
  if (filteredByScore.length === 0) {
    // No movies meet the score threshold
    logger.debug(`No movies meet score threshold ${minScoreThreshold}`, {
      total: scoredMovies.length,
      topScore: scoredMovies.length > 0 ? scoredMovies[0].score : 0
    }, { prefix: 'API' });
    return null;
  }
  
  // Sort by score and take top 20 for weighted random selection
  const sortedMovies = sortByScore(filteredByScore);
  const topMovies = sortedMovies.slice(0, Math.min(20, sortedMovies.length));
  
  logger.debug('Movie scores:', {
    total: scoredMovies.length,
    aboveThreshold: filteredByScore.length,
    threshold: minScoreThreshold,
    top5: topMovies.slice(0, 5).map(sm => ({
      title: sm.movie.title,
      score: sm.score.toFixed(2),
      breakdown: sm.breakdown
    }))
  }, { prefix: 'API' });
  
  // Weighted random selection from top movies
  const selectedMovie = weightedRandomSelect(topMovies);
  
  // Mark movie as used in cache to prevent duplicates
  if (selectedMovie) {
    movieCache.markMovieUsed(selectedMovie.id);
  }
  
  return selectedMovie;
}

export async function fetchGenres(): Promise<Genre[]> {
  try {
    // Fetch both movie and TV genres
    const [movieResponse, tvResponse] = await Promise.all([
      fetch(ENDPOINTS.GENRES, { headers }),
      fetch(ENDPOINTS.TV_GENRES, { headers })
    ]);
    
    if (!movieResponse.ok || !tvResponse.ok) {
      throw new Error('Failed to fetch genres');
    }
    
    const [movieData, tvData] = await Promise.all([
      movieResponse.json(),
      tvResponse.json()
    ]);
    
    // Combine and deduplicate genres by ID
    const allGenres = [...movieData.genres, ...tvData.genres];
    const uniqueGenres = allGenres.filter((genre, index, self) => 
      index === self.findIndex(g => g.id === genre.id)
    );
    
    return uniqueGenres;
  } catch (error) {
    logger.error('Error fetching genres:', error, { prefix: 'API' });
    // Fallback to just movie genres if TV genres fail
  const response = await fetch(ENDPOINTS.GENRES, { headers });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error('Failed to fetch genres');
  }
  
  return data.genres;
  }
}

export async function fetchMovieDetails(movieId: number): Promise<Movie | null> {
  try {
    const response = await fetch(`${ENDPOINTS.MOVIE}/${movieId}`, { headers });
    if (!response.ok) {
      throw new Error('Failed to fetch movie details');
    }
    const movieData = await response.json();
    return movieData;
  } catch (error) {
    logger.error('Error fetching movie details:', error, { prefix: 'API' });
    return null;
  }
}

export const getImageUrl = (path: string | null, size = POSTER_SIZE): string => {
  if (!path) return '';
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

// Check if movie is currently in theaters (within last 45 days)
export const isInTheaters = (dateString: string): boolean => {
  if (!dateString) return false;
  const releaseDate = new Date(dateString);
  const now = new Date();
  return now >= releaseDate && (now.getTime() - releaseDate.getTime()) <= (45 * 24 * 60 * 60 * 1000);
};