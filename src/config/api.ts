import { Movie } from '../types';
import { movieCache } from '../utils/cache';
import { getWatchlist, WatchlistMovie } from '../utils/storage';

// Movie API configuration
// We'll use TMDB API for this project
const API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const POSTER_SIZE = 'w500';
const BACKDROP_SIZE = 'original';

const ENDPOINTS = {
  DISCOVER: `${BASE_URL}/discover/movie`,
  MOVIE: `${BASE_URL}/movie`,
  GENRES: `${BASE_URL}/genre/movie/list`,
  EXTERNAL_IDS: (id: number) => `${BASE_URL}/movie/${id}/external_ids`,
  NOW_PLAYING: `${BASE_URL}/movie/now_playing?region=US`,
};

const MAX_RETRIES = 3; // Maximum number of API retries

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

export async function fetchRandomMovie(options: FilterOptions): Promise<Movie | null> {
  console.log('Fetching random movie with options:', options);

  const watchlist = getWatchlist();
  let retryCount = 0;

  try {
    while (retryCount < MAX_RETRIES) {
      const movie = await attemptFetch(options, watchlist);
      if (movie) return movie;
      retryCount++;
    }
    throw new Error('No movies found after multiple attempts');
  } catch (error) {
    if ((error as Error).message.includes('No movies found')) {
      // Try with slightly relaxed filters
      const relaxedOptions = {
        ...options,
        ratingFrom: Math.max(0, options.ratingFrom - 1),
        yearFrom: Math.max(1900, options.yearFrom - 5),
        yearTo: Math.min(new Date().getFullYear(), options.yearTo + 5)
      };
      
      try {
        return await attemptFetch(relaxedOptions);
      } catch (secondError) {
        // If still no results, try with more relaxed filters
        const moreRelaxedOptions = {
          ...options,
          ratingFrom: Math.max(0, options.ratingFrom - 2),
          yearFrom: Math.max(1900, options.yearFrom - 10),
          yearTo: Math.min(new Date().getFullYear(), options.yearTo + 10),
          genres: [] // Remove genre restrictions
        };
        
        try {
          return await attemptFetch(moreRelaxedOptions);
        } catch (finalError) {
          throw new Error('No movies found. Please try relaxing your filters.');
        }
      }
    }
    throw error;
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

  const randomPage = Math.floor(Math.random() * 20) + 1;
  console.log('Fetching new batch from API, page:', randomPage);
  
  const startTime = performance.now();
  
  // Build query parameters
  const queryParams = new URLSearchParams({
    language: 'en-US',
    page: randomPage.toString(),
    'vote_count.gte': '100', // Ensure we have enough votes for accurate rating
    'primary_release_date.gte': `${normalizedOptions.yearFrom}-01-01`,
    'primary_release_date.lte': `${normalizedOptions.yearTo}-12-31`,
    'vote_average.gte': (normalizedOptions.ratingFrom - 0.1).toString(), // Add small buffer for floating point comparison
    include_adult: normalizedOptions.includeAdult.toString(),
  });

  // Add runtime filter only if it's not the maximum value
  if (normalizedOptions.maxRuntime < 240) {
    queryParams.append('with_runtime.lte', normalizedOptions.maxRuntime.toString());
  }

  if (normalizedOptions.genres.length) {
    queryParams.append('with_genres', normalizedOptions.genres.join(','));
  }

  let url = '';
  if (options.inTheatersOnly) {
    url = `${ENDPOINTS.NOW_PLAYING}&${queryParams.toString()}`;
  } else {
    url = `${ENDPOINTS.DISCOVER}?${queryParams.toString()}`;
  }

  console.log('Fetching movies:', { url });
  
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
    const issues = [];
    if (options.yearFrom > 1990) {
      issues.push('Try expanding your year range to include older films');
    }
    if (options.ratingFrom > 6) {
      issues.push('Lower your minimum rating to see more options');
    }
    if (options.genres.length > 0) {
      issues.push('Remove some genre filters to broaden your search');
    }
    if (options.maxRuntime < 150) {
      issues.push('Increase the maximum runtime to include longer films');
    }
    if (options.inTheatersOnly) {
      issues.push('Include movies not currently in theaters');
    }
    
    throw new Error(
      `No movies found! Here's what you can try:\n- ${issues.join('\n- ')}`
    );
  }

  // Pre-filter movies that don't have required fields
  const validInitialMovies = data.results.filter(movie => 
    movie && 
    movie.id && 
    movie.title && 
    movie.poster_path &&
    movie.vote_average >= normalizedOptions.ratingFrom && // Double-check rating on client side
    !watchlist.some(w => w.id === movie.id) // Exclude watchlist movies
  );

  if (validInitialMovies.length === 0) {
    throw new Error('No movies found with these filters');
  }

  // Fetch full details for pre-filtered movies in parallel
  const moviePromises = validInitialMovies.map(async (movie) => {
    try {
      const movieResponse = await fetch(`${ENDPOINTS.MOVIE}/${movie.id}`, { headers });
      if (!movieResponse.ok) {
        console.warn(`Failed to fetch movie details for ID ${movie.id}:`, movieResponse.status);
        return null;
      }
      
      const movieData = await movieResponse.json();
      
      // Ensure vote_average is a valid number and not zero
      if (typeof movieData.vote_average !== 'number' || movieData.vote_average === 0) {
        const retryResponse = await fetch(`${ENDPOINTS.MOVIE}/${movie.id}`, { headers });
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          if (typeof retryData.vote_average === 'number' && retryData.vote_average > 0) {
            movieData.vote_average = retryData.vote_average;
          }
        }
      }
      
      // Additional validation for full movie data
      if (!movieData.poster_path || !movieData.title || !movieData.id) {
        console.warn(`Movie data missing required fields for ID ${movie.id}`);
        return null;
      }

      // Ensure vote_average is a valid number
      if (typeof movieData.vote_average !== 'number' || movieData.vote_average === 0) {
        movieData.vote_average = movie.vote_average || 0;
      }

      try {
        const externalIdsResponse = await fetch(ENDPOINTS.EXTERNAL_IDS(movieData.id), { headers });
        if (!externalIdsResponse.ok) {
          console.warn(`Failed to fetch external IDs for movie ${movie.id}:`, externalIdsResponse.status);
          return movieData; // Continue without external IDs rather than rejecting the movie
        }
        
        const externalIds = await externalIdsResponse.json();
        return {
          ...movieData,
          imdb_id: externalIds.imdb_id || null,
        };
      } catch (error) {
        console.warn(`Error fetching external IDs for movie ${movie.id}:`, error);
        return movieData; // Continue without external IDs
      }
    } catch (error) {
      console.warn(`Error processing movie ${movie.id}:`, error);
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
    throw new Error('No movies found with these filters');
  }

  console.log('Fetched valid movies:', {
    count: movies.length,
    titles: movies.map(m => ({ id: m.id, title: m.title }))
  });

  // Record the total loading time
  const endTime = performance.now();
  movieCache.recordLoadTime(endTime - startTime);

  // Pick a random movie from the results
  const randomIndex = Math.floor(Math.random() * movies.length);
  
  // Return random movie
  return movies[randomIndex];
}

export async function fetchGenres(): Promise<Genre[]> {
  const response = await fetch(ENDPOINTS.GENRES, { headers });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error('Failed to fetch genres');
  }
  
  return data.genres;
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
    console.error('Error fetching movie details:', error);
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