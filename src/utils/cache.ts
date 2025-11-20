import { Movie } from '../types';
import { logger } from './logger';

interface CachedMovieSet {
  movies: Movie[];
  timestamp: number;
  count: number;
}

export interface CacheResult {
  success: boolean;
  movie?: Movie;
}

class MovieCache {
  private cache = new Map<string, CachedMovieSet>();
  private readonly MAX_CACHE_AGE = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_CACHE_SIZE = 50; // Maximum number of cached sets
  private debugId: string;
  private usedMovies = new Map<number, number>(); // movieId -> timestamp
  private loadingTimes: number[] = [];
  private readonly maxLoadingTimes = 50;
  private readonly cacheLifetime = 30 * 60 * 1000; // 30 minutes for better variety (reduced from 2 hours)

  constructor() {
    this.debugId = Math.random().toString(36).substr(2, 5);
  }

  private async simulateLoadTime(): Promise<void> {
    // Calculate average loading time
    const avgTime = this.loadingTimes.length > 0
      ? this.loadingTimes.reduce((a: number, b: number) => a + b, 0) / this.loadingTimes.length
      : 1500; // Default to 1.5s if no data
    
    // Add some randomness (±20% of average)
    const variance = avgTime * 0.2;
    const delay = Math.max(500, Math.min(5000,
      avgTime + (Math.random() * variance * 2 - variance)
    ));
    
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  recordLoadTime(time: number): void {
    this.loadingTimes.push(time);
    if (this.loadingTimes.length > this.maxLoadingTimes) {
      this.loadingTimes.shift(); // Remove oldest time
    }
  }

  addMovies(key: string, movies: Movie[]): void {
    // Validate movies before adding to cache
    const validMovies = movies.filter(movie => 
      movie && 
      typeof movie.id === 'number' && 
      typeof movie.title === 'string' && 
      movie.title.length > 0 &&
      typeof movie.vote_average === 'number' &&
      movie.vote_average >= 0 &&
      movie.vote_count >= 0
    );

    if (validMovies.length !== movies.length) {
      logger.debug(`Adding movies:`, {
        original: movies.length,
        valid: validMovies.length,
        key: key.substring(0, 50) + '...'
      }, { prefix: `Cache ${this.debugId}` });
    }

    // Filter out suspicious movies (perfect ratings, low vote counts)
    const filteredMovies = validMovies.filter(movie => 
      movie.vote_average < 10.0 && movie.vote_count >= 10
    );

    if (filteredMovies.length !== validMovies.length) {
      logger.debug(`After filtering:`, {
        valid: validMovies.length,
        afterFilter: filteredMovies.length,
        removedSuspicious: validMovies.length - filteredMovies.length
      }, { prefix: `Cache ${this.debugId}` });
    }

    // Shuffle movies before adding to cache
    const shuffledMovies = [...filteredMovies].sort(() => Math.random() - 0.5);
    
    // Remove expired entries before adding new ones
    this.cleanExpiredEntries();
    
    // Add to cache
    this.cache.set(key, { 
      movies: shuffledMovies, 
      timestamp: Date.now(), 
      count: shuffledMovies.length 
    });

    // Limit cache size
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  private cleanExpiredEntries(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.MAX_CACHE_AGE) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      logger.debug(`Removed ${removedCount} expired movies`, undefined, { prefix: `Cache ${this.debugId}` });
    }
  }

  getMovies(key: string): Movie[] {
    this.cleanExpiredEntries();
    
    const cachedSet = this.cache.get(key);
    if (cachedSet) {
      logger.debug(`Getting movie:`, {
        available: cachedSet.movies.length,
        age: `${Math.round((Date.now() - cachedSet.timestamp) / 1000)}s`,
        key: key.substring(0, 50) + '...'
      }, { prefix: `Cache ${this.debugId}` });

      return cachedSet.movies;
    }

    return [];
  }

  async getMovie(): Promise<Movie | null> {
    // Clean up old used movies
    const now = Date.now();
    let cleanedCount = 0;
    for (const [id, timestamp] of this.usedMovies.entries()) {
      if (now - timestamp > this.cacheLifetime) {
        this.usedMovies.delete(id);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      logger.debug(`Cleaned ${cleanedCount} expired used movies`, undefined, { prefix: `Cache ${this.debugId}` });
    }

    // Get all available movies from all cache sets
    const allMovies: Movie[] = [];
    for (const cachedSet of this.cache.values()) {
      allMovies.push(...cachedSet.movies);
    }

    // Filter out recently used movies
    const availableMovies = allMovies.filter(movie => 
      !this.usedMovies.has(movie.id)
    );
    
    logger.debug(`Cache check: ${allMovies.length} total, ${this.usedMovies.size} used, ${availableMovies.length} available`, undefined, { prefix: `Cache ${this.debugId}` });
    
    if (availableMovies.length === 0) {
      logger.debug('No available movies in cache', undefined, { prefix: `Cache ${this.debugId}` });
      return null;
    }
    
    // Simulate loading time
    await this.simulateLoadTime();
    
    // Get a random movie
    const randomIndex = Math.floor(Math.random() * availableMovies.length);
    const movie = availableMovies[randomIndex];
    
    // Mark as used
    this.usedMovies.set(movie.id, Date.now());
    
    logger.debug(`Selected movie from cache: ${movie.id} - ${movie.title}`, undefined, { prefix: `Cache ${this.debugId}` });
    
    return movie;
  }

  clear(): void {
    const size = this.cache.size;
    const usedCount = this.usedMovies.size;
    this.cache.clear();
    this.usedMovies.clear();
    if (size > 0) {
      logger.debug(`Cache cleared: ${size} sets, ${usedCount} used movies`, undefined, { prefix: `Cache ${this.debugId}` });
    }
  }

  getCacheSize(): number {
    let totalMovies = 0;
    for (const cachedSet of this.cache.values()) {
      totalMovies += cachedSet.movies.length;
    }
    return totalMovies;
  }

  isMovieUsed(movieId: number): boolean {
    const now = Date.now();
    const timestamp = this.usedMovies.get(movieId);
    if (!timestamp) return false;
    
    // Check if movie is still within cache lifetime
    if (now - timestamp > this.cacheLifetime) {
      // Expired, remove it
      this.usedMovies.delete(movieId);
      return false;
    }
    
    return true;
  }

  markMovieUsed(movieId: number): void {
    this.usedMovies.set(movieId, Date.now());
  }

  getUsedMoviesCount(): number {
    return this.usedMovies.size;
  }

  removeSuspiciousMovies(): void {
    let removedCount = 0;
    
    for (const [key, value] of this.cache.entries()) {
      const originalLength = value.movies.length;
      value.movies = value.movies.filter(movie => 
        movie.vote_average < 10.0 && movie.vote_count >= 10
      );
      removedCount += originalLength - value.movies.length;
    }
    
    if (removedCount > 0) {
      logger.debug(`Removed ${removedCount} suspicious movies from cache`, undefined, { prefix: `Cache ${this.debugId}` });
    }
  }

  get size(): number {
    let totalMovies = 0;
    for (const cachedSet of this.cache.values()) {
      totalMovies += cachedSet.movies.length;
    }
    return totalMovies;
  }

  hasMovies(): boolean {
    this.cleanExpiredEntries();
    return this.size > 0;
  }
}

export const movieCache = new MovieCache();