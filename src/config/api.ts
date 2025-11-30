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
// const BACKDROP_SIZE = 'original'; // Reserved for future use

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

// Retry logic now handled by executeWithRetry function with RETRY_CONFIG

// Track last 50 pages used to avoid repeats (increased for better variety)
const recentPages: number[] = [];
const recentPopularPages: number[] = [];

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

// Get random page for POPULAR/TOP_RATED endpoints (limited to pages 1-50 for better quality)
function getRandomPopularPage(): number {
  let attempts = 0;
  let page: number;
  
  do {
    // Random page between 1-50
    page = Math.floor(Math.random() * 50) + 1;
    attempts++;
    // If we've tried many times, clear recent pages and start over
    if (attempts > 100) {
      recentPopularPages.length = 0;
      break;
    }
  } while (recentPopularPages.includes(page));
  
  // Keep only last 30 pages for POPULAR/TOP_RATED
  recentPopularPages.push(page);
  if (recentPopularPages.length > 30) {
    recentPopularPages.shift();
  }
  
  return page;
}

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

const MAX_CONCURRENT_REQUESTS = 4;
let activeRequests = 0;
const requestQueue: Array<() => void> = [];

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  jitter: true,
};

// Rate limit tracking
let rateLimitResetTime: number | null = null;
let rateLimitRemaining: number | null = null;

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateRetryDelay(attempt: number): number {
  const exponentialDelay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
  const jitter = RETRY_CONFIG.jitter ? Math.random() * 1000 : 0;
  const delay = Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelay);
  return Math.floor(delay);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  // Rate limit errors (429)
  if (error.status === 429) {
    return true;
  }
  
  // Server errors (5xx)
  if (error.status >= 500 && error.status < 600) {
    return true;
  }
  
  // Timeout errors
  if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
    return true;
  }
  
  return false;
}

/**
 * Extract rate limit info from response headers
 */
function extractRateLimitInfo(response: Response): void {
  const resetHeader = response.headers.get('X-RateLimit-Reset');
  const remainingHeader = response.headers.get('X-RateLimit-Remaining');
  
  if (resetHeader) {
    rateLimitResetTime = parseInt(resetHeader, 10) * 1000; // Convert to milliseconds
  }
  
  if (remainingHeader) {
    rateLimitRemaining = parseInt(remainingHeader, 10);
    logger.debug(`Rate limit remaining: ${rateLimitRemaining}`, undefined, { prefix: 'API' });
  }
}

/**
 * Wait for rate limit to reset
 */
async function waitForRateLimit(): Promise<void> {
  if (rateLimitResetTime && rateLimitResetTime > Date.now()) {
    const waitTime = rateLimitResetTime - Date.now() + 1000; // Add 1 second buffer
    logger.warn(`Rate limit exceeded. Waiting ${Math.ceil(waitTime / 1000)}s before retry...`, undefined, { prefix: 'API' });
    await new Promise(resolve => setTimeout(resolve, waitTime));
    rateLimitResetTime = null;
  }
}

/**
 * Execute request with retry logic and exponential backoff
 */
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'API request'
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable
      if (attempt === RETRY_CONFIG.maxRetries || !isRetryableError(error)) {
        // Don't retry on final attempt or non-retryable errors
        if (error.status === 429) {
          // Special handling for rate limits
          await waitForRateLimit();
          if (attempt < RETRY_CONFIG.maxRetries) {
            continue; // Retry after waiting
          }
        }
        throw error;
      }
      
      // Handle rate limit errors
      if (error.status === 429) {
        await waitForRateLimit();
      } else {
        // Exponential backoff for other retryable errors
        const delay = calculateRetryDelay(attempt);
        logger.debug(`${operationName} failed (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}). Retrying in ${delay}ms...`, undefined, { prefix: 'API' });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Schedule request with concurrency control
 */
async function scheduleRequest<T>(task: () => Promise<T>): Promise<T> {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    await new Promise<void>((resolve) => requestQueue.push(resolve));
  }
  activeRequests++;
  try {
    return await task();
  } finally {
    activeRequests--;
    const next = requestQueue.shift();
    if (next) next();
  }
}

/**
 * Safe fetch with retry logic, rate limit handling, and timeout
 */
async function safeFetch(input: RequestInfo | URL, init?: RequestInit, timeout: number = 30000): Promise<Response> {
  return scheduleRequest(async () => {
    return executeWithRetry(async () => {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(input, {
          ...init,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        // Extract rate limit info
        extractRateLimitInfo(response);
        
        // Handle rate limit errors
        if (response.status === 429) {
          await waitForRateLimit();
          throw new Error('Rate limit exceeded');
        }
        
        // Handle other HTTP errors
        if (!response.ok) {
          const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
          error.status = response.status;
          error.response = response;
          throw error;
        }
        
        return response;
      } catch (error: any) {
        clearTimeout(timeoutId);
        
        // Handle abort (timeout)
        if (error.name === 'AbortError') {
          const timeoutError: any = new Error('Request timeout');
          timeoutError.name = 'TimeoutError';
          throw timeoutError;
        }
        
        throw error;
      }
    }, `Fetch ${typeof input === 'string' ? input : input.toString()}`);
  });
}

export async function fetchRandomMovie(
  options: FilterOptions,
  excludeMovieId?: number,
  excludeMovieIds?: number[]
): Promise<Movie | null> {
  logger.debug('Fetching random movie with options:', options, { prefix: 'API' });

  const watchlist = getWatchlist();
  // Retry logic now handled by safeFetch with executeWithRetry

  // Determine if filters are active (strict check against defaults)
  // Defaults: yearFrom=1990, yearTo=currentYear, ratingFrom=6, maxRuntime=180, genres=[], inTheatersOnly=false
  const currentYear = new Date().getFullYear();
  const hasActiveFilters = 
    options.genres.length > 0 ||
    options.ratingFrom !== 6 ||
    options.yearFrom !== 1990 ||
    options.yearTo !== currentYear ||
    options.maxRuntime !== 180 ||
    options.inTheatersOnly;

  // Smart filter relaxation with scoring thresholds
  // When filters are active, enforce minimum threshold of 0.3 to ensure some level of match
  // When no filters, allow full relaxation down to 0.0
  const baseThresholds = [0.8, 0.6, 0.4, 0.2, 0.0];
  const scoreThresholds = hasActiveFilters 
    ? [0.8, 0.6, 0.4, 0.3] // Minimum 0.3 when filters are active
    : baseThresholds; // Full relaxation when no filters
  
  // Try original filters with multiple pages and high score threshold
  // When filters are active, try more pages for better variety
  let pageRetries = 0;
  const maxPageRetries = hasActiveFilters ? 15 : 5; // Try more pages when filters are active for better variety
  
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
  // When filters are active, use more random pages for better variety
  const hasLooseYearRange = (normalizedOptions.yearTo - normalizedOptions.yearFrom) >= 10;
  const minimalFiltersActive =
    !normalizedOptions.genres.length &&
    !normalizedOptions.inTheatersOnly &&
    normalizedOptions.ratingFrom <= 7.0 &&
    hasLooseYearRange &&
    normalizedOptions.maxRuntime >= 120;

  const hasActiveFilters = 
    normalizedOptions.genres.length > 0 ||
    normalizedOptions.ratingFrom > 6 ||
    (normalizedOptions.yearTo - normalizedOptions.yearFrom) < 20 ||
    normalizedOptions.inTheatersOnly;

  // Use random pages more aggressively when filters are active for better variety
  const useRandomPage = minimalFiltersActive || hasActiveFilters;
  const page = useRandomPage ? (hasActiveFilters ? getRandomPage() * 2 : getRandomPage()) : 1;
  
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
  
  // Build query parameters with aggressive API-level filtering
  // Use stricter thresholds when filters are active to reduce client-side processing
  const voteCountThreshold = hasActiveFilters 
    ? '200' // Higher threshold when filters active - ensures quality and reduces dataset
    : '100'; // Standard threshold for no filters
  
  // Use more precise vote_average filtering at API level
  const voteAverageMin = Math.max(0, normalizedOptions.ratingFrom - 0.1).toFixed(1);
  
  const queryParams = new URLSearchParams({
    language: 'en-US',
    page: page.toString(), // Use smart page selection
    'vote_count.gte': voteCountThreshold, // Stricter threshold when filters active
    'primary_release_date.gte': `${normalizedOptions.yearFrom}-01-01`,
    'primary_release_date.lte': `${normalizedOptions.yearTo}-12-31`,
    'vote_average.gte': voteAverageMin, // More precise filtering at API level
    include_adult: normalizedOptions.includeAdult.toString(),
    sort_by: sortBy, // Smart sorting based on filter context
    region: 'US', // Regional filtering for better relevance
    with_original_language: 'en', // Filter English movies at API level to reduce dataset
  });

  // Add runtime filter only if it's not the maximum value
  if (normalizedOptions.maxRuntime < 240) {
    queryParams.append('with_runtime.lte', normalizedOptions.maxRuntime.toString());
  }

  // Add minimum runtime filter to exclude very short content (improves quality)
  if (!options.tvShowsOnly) {
    queryParams.append('with_runtime.gte', '60'); // Minimum 60 minutes for movies
  }

  if (normalizedOptions.genres.length) {
    queryParams.append('with_genres', normalizedOptions.genres.join(','));
  }
  
  // Exclude problematic genres at API level if no specific genres selected
  // This reduces low-quality results before client-side processing
  if (!normalizedOptions.genres.length && !hasActiveFilters) {
    // Exclude adult/documentary genres for better general results
    queryParams.append('without_genres', '99,10770'); // Documentary and TV Movie
  }

  let url = '';
  
  // Determine if strictly defaults (no filters)
  // Defaults: yearFrom=1990, yearTo=currentYear, ratingFrom=6, maxRuntime=180, genres=[], inTheatersOnly=false
  const currentYear = new Date().getFullYear();
  const isDefaultFilters = 
    normalizedOptions.genres.length === 0 &&
    normalizedOptions.ratingFrom === 6 &&
    normalizedOptions.yearFrom === 1990 &&
    normalizedOptions.yearTo === currentYear &&
    normalizedOptions.maxRuntime === 180 &&
    !normalizedOptions.inTheatersOnly;

  // Multi-endpoint strategy: Use different endpoints based on filter context
  if (options.tvShowsOnly) {
    // For TV shows, use different parameters with API-level filtering
    const tvVoteCountThreshold = hasActiveFilters ? '100' : '50'; // Stricter when filters active
    const tvVoteAverageMin = Math.max(0, normalizedOptions.ratingFrom - 0.1).toFixed(1);
    
    const tvQueryParams = new URLSearchParams({
      language: 'en-US',
      page: page.toString(),
      'vote_count.gte': tvVoteCountThreshold, // Stricter threshold when filters active
      'first_air_date.gte': `${normalizedOptions.yearFrom}-01-01`,
      'first_air_date.lte': `${normalizedOptions.yearTo}-12-31`,
      'vote_average.gte': tvVoteAverageMin, // More precise filtering
      include_adult: normalizedOptions.includeAdult.toString(),
      region: 'US', // Regional filtering
      with_original_language: 'en', // Filter English shows at API level
    });

    if (normalizedOptions.genres.length) {
      tvQueryParams.append('with_genres', normalizedOptions.genres.join(','));
    }
    
    // Exclude problematic TV genres when no specific genres selected
    if (!normalizedOptions.genres.length && !hasActiveFilters) {
      tvQueryParams.append('without_genres', '99,10770'); // Documentary and TV Movie
    }

    url = `${ENDPOINTS.DISCOVER_TV}?${tvQueryParams.toString()}`;
  } else if (options.inTheatersOnly) {
    url = `${ENDPOINTS.NOW_PLAYING}&${queryParams.toString()}`;
  } else if (isDefaultFilters) {
    // No filters: Use popular or top_rated for better variety
    // Alternate between popular and top_rated for diversity
    // Use random pages (1-50) to improve variety
    const usePopular = Math.random() > 0.5;
    const randomPage = getRandomPopularPage();
    url = usePopular 
      ? `${ENDPOINTS.POPULAR}?${new URLSearchParams({ language: 'en-US', page: randomPage.toString() }).toString()}`
      : `${ENDPOINTS.TOP_RATED}?${new URLSearchParams({ language: 'en-US', page: randomPage.toString() }).toString()}`;
  } else {
    // Has filters: Use discover with smart sorting
    url = `${ENDPOINTS.DISCOVER}?${queryParams.toString()}`;
  }

  logger.debug('Fetching movies:', { url }, { prefix: 'API' });
  
  // safeFetch handles retries, rate limits, and errors - throws on failure
  const response = await safeFetch(url, { headers }, 30000); // 30 second timeout
  const data = await response.json();
  
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

  // Pre-filter movies - API-level filtering has already done most of the work
  // Now we only need to filter what can't be done at API level:
  // 1. Exclude specific movie IDs (watchlist, current, session)
  // 2. Final validation of suspicious ratings
  // 3. Ensure required fields exist
  const validInitialMovies = data.results.filter((movie: any) => {
    const isTV = options.tvShowsOnly;
    const title = isTV ? (movie.name || movie.original_name) : movie.title;
    
    // Basic validation - most filtering already done at API level
    if (!movie || !movie.id || !title || !movie.poster_path) {
      return false;
    }
    
    // Exclude suspicious ratings (API already filtered by vote_average.gte, but double-check)
    if (movie.vote_average >= 10.0 || movie.vote_average < normalizedOptions.ratingFrom) {
      return false;
    }
    
    // Vote count validation - API already filtered, but ensure minimum quality
    const minVoteCount = isTV ? 25 : (hasActiveFilters ? 200 : 100);
    if (movie.vote_count < minVoteCount) {
      return false;
    }
    
    // Client-side exclusions that can't be done at API level
    if (watchlist.some(w => w.id === movie.id)) return false; // Watchlist exclusion
    if (movie.id === excludeMovieId) return false; // Current movie exclusion
    if ((excludeMovieIds || []).includes(movie.id)) return false; // Session movies exclusion
    if (movieCache.isMovieUsed(movie.id, hasActiveFilters)) return false; // Cache exclusion
    
    return true;
  });

  if (validInitialMovies.length === 0) {
    const contentType = options.tvShowsOnly ? 'TV shows' : 'movies';
    throw new Error(`No ${contentType} found with these filters`);
  }

  // Two-phase fetching: Fetch more movies initially, then score and select best
  // Phase 1: Fetch more movies when filters are active for better variety (hasActiveFilters already defined above)
  const moviesToFetch = hasActiveFilters 
    ? Math.min(100, validInitialMovies.length) // Fetch more when filters are active
    : Math.min(50, validInitialMovies.length);
  const moviesToProcess = validInitialMovies.slice(0, moviesToFetch);
  
  const moviePromises = moviesToProcess.map(async (item: any) => {
    try {
      const isTV = options.tvShowsOnly;
      const endpoint = isTV ? `${ENDPOINTS.TV}/${item.id}` : `${ENDPOINTS.MOVIE}/${item.id}`;
      
      // safeFetch throws on error, so we catch and return null for individual movie failures
      let itemResponse: Response;
      try {
        itemResponse = await safeFetch(endpoint, { headers }, 15000); // 15 second timeout for individual movies
      } catch (error: any) {
        logger.warn(`Failed to fetch ${isTV ? 'TV show' : 'movie'} details for ID ${item.id}:`, error.status || error.message, { prefix: 'API' });
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
        try {
          const retryResponse = await safeFetch(endpoint, { headers }, 15000);
          const retryData = await retryResponse.json();
          if (typeof retryData.vote_average === 'number' && retryData.vote_average > 0) {
            itemData.vote_average = retryData.vote_average;
          }
        } catch (error) {
          // If retry fails, continue with original data
          logger.debug(`Retry failed for movie ${item.id}, using original vote_average`, undefined, { prefix: 'API' });
        }
      }
      
      // Additional validation for full data
      if (!itemData.poster_path || !itemData.title || !itemData.id) {
        logger.warn(`${isTV ? 'TV show' : 'Movie'} data missing required fields for ID ${item.id}`, { prefix: 'API' });
        return null;
      }

      // Post-fetch validation - API has already done most filtering, but we need to:
      // 1. Validate genre matching (API uses OR logic, we verify it matches)
      // 2. Final quality checks for edge cases
      // 3. Validate fields that might differ between list and detail endpoints
      
      // Exclude suspicious ratings (API filtered, but double-check for edge cases)
      if (itemData.vote_average >= 10.0) {
        logger.warn(`${isTV ? 'TV show' : 'Movie'} ${item.id} has suspicious perfect rating: ${itemData.vote_average}`, { prefix: 'API' });
        return null;
      }

      // Ensure vote_average is valid (fallback to list data if detail data is invalid)
      if (typeof itemData.vote_average !== 'number' || itemData.vote_average === 0) {
        itemData.vote_average = item.vote_average || 0;
      }

      // CRITICAL: Validate genre matching after fetching full details
      // API uses OR logic (movie needs at least one genre), which is what we want
      // But we verify the full genre list matches our requirements
      if (normalizedOptions.genres.length > 0) {
        const movieGenreIds: number[] = itemData.genres && Array.isArray(itemData.genres)
          ? itemData.genres.map((g: any) => typeof g === 'number' ? g : (g.id || g))
          : (item.genre_ids || []);
        
        // API already filtered with OR logic, verify it matches
        const hasMatchingGenre = normalizedOptions.genres.some(requestedGenreId => 
          movieGenreIds.includes(requestedGenreId)
        );
        
        if (!hasMatchingGenre) {
          logger.debug(`Movie ${item.id} (${itemData.title || item.title}) doesn't match requested genres. Requested: [${normalizedOptions.genres.join(', ')}], Movie has: [${movieGenreIds.join(', ')}]`, undefined, { prefix: 'API' });
          return null;
        }
      }

      // Validate year range (API filtered, but verify for edge cases like year boundaries)
      const dateField = isTV ? itemData.first_air_date : itemData.release_date;
      if (dateField) {
        const releaseYear = new Date(dateField).getFullYear();
        // API should have filtered this, but double-check for precision
        if (releaseYear < normalizedOptions.yearFrom || releaseYear > normalizedOptions.yearTo) {
          logger.debug(`${isTV ? 'TV show' : 'Movie'} ${item.id} year ${releaseYear} doesn't match range [${normalizedOptions.yearFrom}-${normalizedOptions.yearTo}]`, undefined, { prefix: 'API' });
          return null;
        }
      }

      // Validate rating (API filtered with vote_average.gte, but verify precision)
      if (itemData.vote_average < normalizedOptions.ratingFrom) {
        logger.debug(`Movie ${item.id} rating ${itemData.vote_average} below minimum ${normalizedOptions.ratingFrom}`, undefined, { prefix: 'API' });
        return null;
      }

      // Validate runtime (API filtered with with_runtime.lte, but verify for edge cases)
      if (itemData.runtime && normalizedOptions.maxRuntime < 240 && itemData.runtime > normalizedOptions.maxRuntime) {
        logger.debug(`Movie ${item.id} runtime ${itemData.runtime} exceeds maximum ${normalizedOptions.maxRuntime}`, undefined, { prefix: 'API' });
        return null;
      }

      try {
        const externalIdsEndpoint = isTV ? ENDPOINTS.TV_EXTERNAL_IDS(itemData.id) : ENDPOINTS.EXTERNAL_IDS(itemData.id);
        // safeFetch throws on error, so we catch and continue without external IDs
        const externalIdsResponse = await safeFetch(externalIdsEndpoint, { headers }, 10000); // 10 second timeout
        const externalIds = await externalIdsResponse.json();
        return {
          ...itemData,
          imdb_id: externalIds.imdb_id || null,
        };
      } catch (error) {
        // External IDs are optional - continue without them rather than rejecting the item
        logger.debug(`External IDs not available for ${isTV ? 'TV show' : 'movie'} ${item.id}, continuing without them`, undefined, { prefix: 'API' });
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
      safeFetch(ENDPOINTS.GENRES, { headers }),
      safeFetch(ENDPOINTS.TV_GENRES, { headers })
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
    try {
      const response = await safeFetch(ENDPOINTS.GENRES, { headers }, 10000);
      const data = await response.json();
      return data.genres;
    } catch (fallbackError) {
      logger.error('Fallback genre fetch also failed:', fallbackError, { prefix: 'API' });
      throw new Error('Failed to fetch genres');
    }
  }
}

export async function fetchMovieDetails(movieId: number): Promise<Movie | null> {
  try {
    // safeFetch handles retries and errors - throws on failure
    const response = await safeFetch(`${ENDPOINTS.MOVIE}/${movieId}`, { headers }, 15000); // 15 second timeout
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