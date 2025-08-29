import { Movie, FilterOptions, Genre, WatchlistMovie } from '../types';
import { movieCache } from '../utils/cache';
import { getWatchlist } from '../utils/storage';
import { logger } from '../utils/logger';

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

const ENDPOINTS = {
  DISCOVER: `${BASE_URL}/discover/movie`,
  DISCOVER_TV: `${BASE_URL}/discover/tv`,
  MOVIE: `${BASE_URL}/movie`,
  TV: `${BASE_URL}/tv`,
  GENRES: `${BASE_URL}/genre/movie/list`,
  TV_GENRES: `${BASE_URL}/genre/tv/list`,
  EXTERNAL_IDS: (id: number) => `${BASE_URL}/movie/${id}/external_ids`,
  TV_EXTERNAL_IDS: (id: number) => `${BASE_URL}/tv/${id}/external_ids`,
  NOW_PLAYING: `${BASE_URL}/movie/now_playing?region=US`,
  ON_THE_AIR: `${BASE_URL}/tv/on_the_air?region=US`,
};

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

export async function fetchRandomMovie(options: FilterOptions): Promise<Movie | null> {
  logger.debug('Fetching random movie with options:', options, { prefix: 'API' });

  const watchlist = getWatchlist();

  // Create a smarter sequence of filter variations that prioritize genre accuracy
  const filterVariations = [
    // 1. Original filters (highest priority)
    options,
    
    // 2. Slightly relaxed filters while keeping core genres
    {
      ...options,
      ratingFrom: Math.max(0, options.ratingFrom - 0.5),
      maxRuntime: Math.min(240, options.maxRuntime + 30),
      // Keep all genres but slightly relax other criteria
    },
    
    // 3. Slight genre relaxation: if 4+ genres, try with top 3
    {
      ...options,
      genres: options.genres.length >= 4 ? options.genres.slice(0, 3) : options.genres,
      ratingFrom: Math.max(0, options.ratingFrom - 0.5),
      yearFrom: Math.max(1950, options.yearFrom - 3),
      yearTo: Math.min(new Date().getFullYear(), options.yearTo + 3),
      maxRuntime: Math.min(240, options.maxRuntime + 30)
    },
    
    // 4. Moderate genre relaxation: if 3+ genres, try with top 2
    {
      ...options,
      genres: options.genres.length >= 3 ? options.genres.slice(0, 2) : options.genres,
      ratingFrom: Math.max(0, options.ratingFrom - 0.8),
      yearFrom: Math.max(1950, options.yearFrom - 8),
      yearTo: Math.min(new Date().getFullYear(), options.yearTo + 8),
      maxRuntime: Math.min(240, options.maxRuntime + 45)
    },
    
    // 5. Keep at least 2 genres if available, otherwise keep 1
    {
      ...options,
      genres: options.genres.length >= 2 ? options.genres.slice(0, 2) : options.genres,
      ratingFrom: Math.max(0, options.ratingFrom - 1.0),
      yearFrom: Math.max(1950, options.yearFrom - 15),
      yearTo: Math.min(new Date().getFullYear(), options.yearTo + 15),
      maxRuntime: Math.min(240, options.maxRuntime + 60)
    },
    
    // 6. Minimal filters (guaranteed result) - only if all else fails
    {
      ...options,
      genres: [],
      ratingFrom: 0,
      yearFrom: 1950,
      yearTo: new Date().getFullYear(),
      maxRuntime: 240,
      inTheatersOnly: false
    }
  ];

  // Try each filter variation with improved error handling
  for (let i = 0; i < filterVariations.length; i++) {
    const currentFilters = filterVariations[i];
    logger.debug(`Trying filter variation ${i + 1}:`, currentFilters, { prefix: 'API' });
    
    try {
      const movie = await attemptFetch(currentFilters, watchlist);
      if (movie) {
        if (i > 0) {
          logger.debug(`Found movie with relaxed filters (variation ${i + 1})`, undefined, { prefix: 'API' });
        }
        return movie;
      }
    } catch (error) {
      logger.warn(`Filter variation ${i + 1} failed:`, error, { prefix: 'API' });
      // Continue with next variation
    }
  }

  // Final fallback attempt with minimal restrictions
  try {
    logger.debug('Making final attempt with minimal restrictions...', undefined, { prefix: 'API' });
    return await attemptFetch({
      genres: [],
      yearFrom: 1950,
      yearTo: new Date().getFullYear(),
      ratingFrom: 0,
      maxRuntime: 240,
      inTheatersOnly: false,
      includeAdult: true,
      tvShowsOnly: false
    });
  } catch (finalError) {
    logger.error('Final attempt failed:', finalError, { prefix: 'API' });
    throw new Error('Unable to find any movies. Please check your internet connection.');
  }
}

async function attemptFetch(options: FilterOptions, watchlist: WatchlistMovie[] = []): Promise<Movie | null> {
  // Normalize filter values to reasonable ranges
  const normalizedOptions = {
    ...options,
    yearFrom: Math.min(options.yearFrom, options.yearTo),
    yearTo: Math.max(options.yearFrom, options.yearTo),
    ratingFrom: Math.min(options.ratingFrom, 9), // Cap maximum rating
    maxRuntime: Math.max(options.maxRuntime, 60) // Ensure minimum runtime
  };

  // Use smaller page range for better quality results
  const randomPage = Math.floor(Math.random() * 15) + 1;
  logger.debug('Fetching new batch from API, page:', randomPage, { prefix: 'API' });
  
  const startTime = performance.now();
  
  // Build query parameters with improved filtering
  const queryParams = new URLSearchParams({
    language: 'en-US',
    page: randomPage.toString(),
    'vote_count.gte': '150', // Increased from 100 for better quality
    'primary_release_date.gte': `${normalizedOptions.yearFrom}-01-01`,
    'primary_release_date.lte': `${normalizedOptions.yearTo}-12-31`,
    'vote_average.gte': (normalizedOptions.ratingFrom - 0.1).toString(), // Add small buffer for floating point comparison
    include_adult: normalizedOptions.includeAdult.toString(),
    'sort_by': 'popularity.desc', // Sort by popularity for better results
  });

  // Add runtime filter only if it's not the maximum value
  if (normalizedOptions.maxRuntime < 240) {
    queryParams.append('with_runtime.lte', normalizedOptions.maxRuntime.toString());
  }

  // Handle Detective genre specially - it combines Mystery and Crime
  const detectiveGenreId = 999999;
  const hasDetectiveGenre = normalizedOptions.genres.includes(detectiveGenreId);
  
  if (hasDetectiveGenre) {
    // Remove Detective genre from the list and add Mystery and Crime instead
    const genresWithoutDetective = normalizedOptions.genres.filter(id => id !== detectiveGenreId);
    const detectiveGenres = [9648, 80]; // Mystery and Crime IDs
    
    // Combine all genres
    const allGenres = [...genresWithoutDetective, ...detectiveGenres];
    queryParams.append('with_genres', allGenres.join(','));
  } else if (normalizedOptions.genres.length > 0) {
    // Use all selected genres for better accuracy
    queryParams.append('with_genres', normalizedOptions.genres.join(','));
  }

  let url = '';
  if (options.tvShowsOnly) {
    // For TV shows, use improved parameters
    const tvQueryParams = new URLSearchParams({
      language: 'en-US',
      page: randomPage.toString(),
      'vote_count.gte': '75', // Increased from 50 for better quality
      'first_air_date.gte': `${normalizedOptions.yearFrom}-01-01`,
      'first_air_date.lte': `${normalizedOptions.yearTo}-12-31`,
      'vote_average.gte': (normalizedOptions.ratingFrom - 0.1).toString(),
      include_adult: normalizedOptions.includeAdult.toString(),
      'sort_by': 'popularity.desc', // Sort by popularity for better results
    });

    // Apply same improved genre logic for TV shows
    if (normalizedOptions.genres.length >= 3) {
      tvQueryParams.append('with_genres', normalizedOptions.genres.slice(0, 2).join(','));
    } else if (normalizedOptions.genres.length > 0) {
      tvQueryParams.append('with_genres', normalizedOptions.genres.join(','));
    }

    url = `${ENDPOINTS.DISCOVER_TV}?${tvQueryParams.toString()}`;
  } else if (options.inTheatersOnly) {
    url = `${ENDPOINTS.NOW_PLAYING}&${queryParams.toString()}`;
  } else {
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

  // Pre-filter movies that don't have required fields with improved quality checks
  const validInitialMovies = data.results.filter((movie: any) => {
    const isTV = options.tvShowsOnly;
    const title = isTV ? (movie.name || movie.original_name) : movie.title;
    
    // Enhanced quality checks
    const hasValidRating = movie.vote_average >= normalizedOptions.ratingFrom && 
                          movie.vote_average < 10.0; // Exclude perfect 10.0 ratings (usually fake/removed)
    
    const hasEnoughVotes = movie.vote_count >= (isTV ? 50 : 150); // Higher threshold for better quality
    
    const hasValidContent = movie && 
                           movie.id && 
                           title && 
                           movie.poster_path &&
                           !watchlist.some(w => w.id === movie.id); // Exclude watchlist movies
    
    // Stricter genre validation for better accuracy
    let hasValidGenres = true;
    if (normalizedOptions.genres.length > 0 && movie.genre_ids) {
      const detectiveGenreId = 999999;
      const hasDetectiveGenre = normalizedOptions.genres.includes(detectiveGenreId);
      
      if (hasDetectiveGenre) {
        // For Detective genre, check if movie has either Mystery (9648) or Crime (80)
        const genresWithoutDetective = normalizedOptions.genres.filter(id => id !== detectiveGenreId);
        const detectiveGenres = [9648, 80]; // Mystery and Crime IDs
        
        const matchingRegularGenres = genresWithoutDetective.filter(genreId => 
          movie.genre_ids.includes(genreId)
        );
        
        const matchingDetectiveGenres = detectiveGenres.filter(genreId => 
          movie.genre_ids.includes(genreId)
        );
        
        // Require at least 50% of regular genres AND at least one detective genre
        const totalRegularGenres = genresWithoutDetective.length;
        const requiredRegularMatches = totalRegularGenres > 0 ? Math.max(1, Math.ceil(totalRegularGenres * 0.5)) : 0;
        
        hasValidGenres = matchingRegularGenres.length >= requiredRegularMatches && matchingDetectiveGenres.length > 0;
      } else {
        // Standard genre validation
        const matchingGenres = normalizedOptions.genres.filter(genreId => 
          movie.genre_ids.includes(genreId)
        );
        
        // Require at least 50% of selected genres to match for better accuracy
        const requiredMatches = Math.max(1, Math.ceil(normalizedOptions.genres.length * 0.5));
        hasValidGenres = matchingGenres.length >= requiredMatches;
      }
    }
    
    return hasValidContent && hasValidRating && hasEnoughVotes && hasValidGenres;
  });

  if (validInitialMovies.length === 0) {
    const contentType = options.tvShowsOnly ? 'TV shows' : 'movies';
    throw new Error(`No ${contentType} found with these filters`);
  }

  // Prioritize movies with better genre matches
  const prioritizedMovies = validInitialMovies.sort((a: any, b: any) => {
    if (normalizedOptions.genres.length === 0) {
      // If no genre filters, sort by popularity and rating
      return (b.popularity || 0) - (a.popularity || 0);
    }
    
    // Calculate genre match scores with higher accuracy
    const getGenreMatchScore = (movie: any) => {
      if (!movie.genre_ids || normalizedOptions.genres.length === 0) return 0;
      
      const detectiveGenreId = 999999;
      const hasDetectiveGenre = normalizedOptions.genres.includes(detectiveGenreId);
      
      if (hasDetectiveGenre) {
        // Handle Detective genre scoring
        const genresWithoutDetective = normalizedOptions.genres.filter(id => id !== detectiveGenreId);
        const detectiveGenres = [9648, 80]; // Mystery and Crime IDs
        
        const matchingRegularGenres = genresWithoutDetective.filter(genreId => 
          movie.genre_ids.includes(genreId)
        );
        
        const matchingDetectiveGenres = detectiveGenres.filter(genreId => 
          movie.genre_ids.includes(genreId)
        );
        
        // Calculate scores for regular genres
        const regularMatchPercentage = genresWithoutDetective.length > 0 ? 
          matchingRegularGenres.length / genresWithoutDetective.length : 1;
        
        // Calculate detective genre score (bonus for having both mystery and crime)
        const detectiveScore = matchingDetectiveGenres.length * 200; // 200 for each detective genre
        
        // Base score from regular genres
        let score = regularMatchPercentage * 1000;
        
        // Add detective bonus
        score += detectiveScore;
        
        // Bonus for high match percentages
        if (regularMatchPercentage >= 0.8) {
          score += 200; // High accuracy bonus
        } else if (regularMatchPercentage >= 0.6) {
          score += 100; // Medium accuracy bonus
        }
        
        // Consider popularity and rating as minor tiebreakers
        score += (movie.popularity || 0) / 10000;
        score += (movie.vote_average || 0) / 100;
        
        return score;
      } else {
        // Standard genre scoring
        const matchingGenres = normalizedOptions.genres.filter(genreId => 
          movie.genre_ids.includes(genreId)
        );
        
        // Calculate match percentage
        const matchPercentage = matchingGenres.length / normalizedOptions.genres.length;
        
        // Base score heavily weighted on genre match percentage
        let score = matchPercentage * 1000;
        
        // Bonus for high match percentages
        if (matchPercentage >= 0.8) {
          score += 200; // High accuracy bonus
        } else if (matchPercentage >= 0.6) {
          score += 100; // Medium accuracy bonus
        }
        
        // Consider popularity and rating as minor tiebreakers
        score += (movie.popularity || 0) / 10000;
        score += (movie.vote_average || 0) / 100;
        
        return score;
      }
    };
    
    const scoreA = getGenreMatchScore(a);
    const scoreB = getGenreMatchScore(b);
    
    return scoreB - scoreA;
  });

  // Log filtering results for debugging
  if (normalizedOptions.genres.length > 0) {
    const topMovie = prioritizedMovies[0];
    if (topMovie && topMovie.genre_ids) {
      const detectiveGenreId = 999999;
      const hasDetectiveGenre = normalizedOptions.genres.includes(detectiveGenreId);
      
      if (hasDetectiveGenre) {
        const genresWithoutDetective = normalizedOptions.genres.filter(id => id !== detectiveGenreId);
        const detectiveGenres = [9648, 80]; // Mystery and Crime IDs
        
        const matchingRegularGenres = genresWithoutDetective.filter(genreId => 
          topMovie.genre_ids.includes(genreId)
        );
        
        const matchingDetectiveGenres = detectiveGenres.filter(genreId => 
          topMovie.genre_ids.includes(genreId)
        );
        
        logger.debug(`Top movie has ${matchingRegularGenres.length}/${genresWithoutDetective.length} regular genres and ${matchingDetectiveGenres.length}/2 detective genres (Mystery/Crime)`, undefined, { prefix: 'API' });
      } else {
        const matchingGenres = normalizedOptions.genres.filter(genreId => 
          topMovie.genre_ids.includes(genreId)
        );
        logger.debug(`Top movie has ${matchingGenres.length}/${normalizedOptions.genres.length} matching genres`, undefined, { prefix: 'API' });
      }
    }
  }

  // Fetch full details for prioritized movies in parallel
  const moviePromises = prioritizedMovies.slice(0, 5).map(async (item: any) => {
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
        // itemData.poster_path and backdrop_path are already set, no need to reassign
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

  // Pick a random movie from the results
  const randomIndex = Math.floor(Math.random() * movies.length);
  
  // Return random movie
  return movies[randomIndex];
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
    
    // Add custom Detective genre that combines Mystery and Crime
    const detectiveGenre: Genre = {
      id: 999999, // Custom ID to avoid conflicts
      name: 'Detective'
    };
    
    // Check if Mystery (9648) and Crime (80) genres exist
    const hasMystery = uniqueGenres.some(g => g.id === 9648);
    const hasCrime = uniqueGenres.some(g => g.id === 80);
    
    // Only add Detective genre if both Mystery and Crime exist
    if (hasMystery && hasCrime) {
      uniqueGenres.push(detectiveGenre);
    }
    
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
  if (!path) return '/placeholder-poster.jpg';
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

// Check if movie is currently in theaters (within last 45 days)
export const isInTheaters = (dateString: string): boolean => {
  if (!dateString) return false;
  const releaseDate = new Date(dateString);
  const now = new Date();
  return now >= releaseDate && (now.getTime() - releaseDate.getTime()) <= (45 * 24 * 60 * 60 * 1000);
};