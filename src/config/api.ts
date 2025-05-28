import { Movie, FilterOptions, Genre, WatchlistMovie } from '../types';
import { movieCache } from '../utils/cache';
import { getWatchlist } from '../utils/storage';

// Movie API configuration
// We'll use TMDB API for this project
const API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const POSTER_SIZE = 'w500';
const BACKDROP_SIZE = 'original';

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

const MAX_RETRIES = 3; // Maximum number of API retries

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

export async function fetchRandomMovie(options: FilterOptions): Promise<Movie | null> {
  console.log('Fetching random movie with options:', options);

  const watchlist = getWatchlist();
  let retryCount = 0;
  const maxRetries = 5; // Увеличил количество попыток

  // Создаем последовательность все более мягких фильтров
  const filterVariations = [
    // 1. Оригинальные фильтры
    options,
    
    // 2. Слегка смягченные фильтры
    {
      ...options,
      ratingFrom: Math.max(0, options.ratingFrom - 0.5),
      maxRuntime: Math.min(240, options.maxRuntime + 30)
    },
    
    // 3. Умеренно смягченные фильтры
    {
      ...options,
      ratingFrom: Math.max(0, options.ratingFrom - 1),
      yearFrom: Math.max(1950, options.yearFrom - 10),
      yearTo: Math.min(new Date().getFullYear(), options.yearTo + 10),
      maxRuntime: Math.min(240, options.maxRuntime + 60)
    },
    
    // 4. Сильно смягченные фильтры (убираем жанры)
    {
      ...options,
      genres: options.genres.length > 3 ? options.genres.slice(0, 2) : [], // Оставляем только 2 жанра или убираем совсем
      ratingFrom: Math.max(0, options.ratingFrom - 1.5),
      yearFrom: Math.max(1950, options.yearFrom - 20),
      yearTo: Math.min(new Date().getFullYear(), options.yearTo + 20),
      maxRuntime: 240
    },
    
    // 5. Минимальные фильтры (гарантированный результат)
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

  // Пробуем каждый вариант фильтров
  for (let i = 0; i < filterVariations.length; i++) {
    const currentFilters = filterVariations[i];
    console.log(`Trying filter variation ${i + 1}:`, currentFilters);
    
    try {
      const movie = await attemptFetch(currentFilters, watchlist);
      if (movie) {
        if (i > 0) {
          console.log(`Found movie with relaxed filters (variation ${i + 1})`);
        }
        return movie;
      }
    } catch (error) {
      console.warn(`Filter variation ${i + 1} failed:`, error);
      // Продолжаем со следующим вариантом
    }
  }

  // Если даже минимальные фильтры не сработали, делаем последнюю попытку без ограничений
  try {
    console.log('Making final attempt with minimal restrictions...');
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
  if (options.tvShowsOnly) {
    // For TV shows, use different parameters
    const tvQueryParams = new URLSearchParams({
      language: 'en-US',
      page: randomPage.toString(),
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
      !watchlist.some(w => w.id === movie.id); // Exclude watchlist movies
  });

  if (validInitialMovies.length === 0) {
    const contentType = options.tvShowsOnly ? 'TV shows' : 'movies';
    throw new Error(`No ${contentType} found with these filters`);
  }

  // Fetch full details for pre-filtered movies in parallel
  const moviePromises = validInitialMovies.map(async (item: any) => {
    try {
      const isTV = options.tvShowsOnly;
      const endpoint = isTV ? `${ENDPOINTS.TV}/${item.id}` : `${ENDPOINTS.MOVIE}/${item.id}`;
      const itemResponse = await fetch(endpoint, { headers });
      
      if (!itemResponse.ok) {
        console.warn(`Failed to fetch ${isTV ? 'TV show' : 'movie'} details for ID ${item.id}:`, itemResponse.status);
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
        console.warn(`${isTV ? 'TV show' : 'Movie'} data missing required fields for ID ${item.id}`);
        return null;
      }

      // Exclude items with suspicious ratings (perfect 10.0 or very low vote count)
      if (itemData.vote_average >= 10.0 || itemData.vote_count < (isTV ? 25 : 50)) {
        console.warn(`${isTV ? 'TV show' : 'Movie'} ${item.id} has suspicious rating: ${itemData.vote_average} with ${itemData.vote_count} votes`);
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
          console.warn(`Failed to fetch external IDs for ${isTV ? 'TV show' : 'movie'} ${item.id}:`, externalIdsResponse.status);
          return itemData; // Continue without external IDs rather than rejecting the item
        }
        
        const externalIds = await externalIdsResponse.json();
        return {
          ...itemData,
          imdb_id: externalIds.imdb_id || null,
        };
      } catch (error) {
        console.warn(`Error fetching external IDs for ${isTV ? 'TV show' : 'movie'} ${item.id}:`, error);
        return itemData; // Continue without external IDs
      }
    } catch (error) {
      console.warn(`Error processing ${options.tvShowsOnly ? 'TV show' : 'movie'} ${item.id}:`, error);
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
    console.error('Error fetching genres:', error);
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