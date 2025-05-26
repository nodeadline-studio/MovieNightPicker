import { Movie } from '../types';

interface CachedMovie {
  movie: Movie;
  expiresAt: number;
}

export interface CacheResult {
  success: boolean;
  movie?: Movie;
}

class MovieCache {
  private movies: CachedMovie[] = [];
  private maxSize: number = 50;
  private cacheLifetime: number = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private loadingTimes: number[] = [];
  private maxLoadingTimes: number = 50; // Keep track of last 50 loading times

  private usedMovies: Map<number, number> = new Map(); // movieId -> timestamp
  private debugId = Math.random().toString(36).slice(2, 7); 

  private async simulateLoadTime(): Promise<void> {
    // Calculate average loading time
    const avgTime = this.loadingTimes.length > 0
      ? this.loadingTimes.reduce((a, b) => a + b, 0) / this.loadingTimes.length
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

  addMovies(movies: Movie[]): void {
    // Validate movies before adding to cache
    const validMovies = movies.filter(movie => 
      movie && 
      movie.poster_path && 
      movie.title && 
      (!this.usedMovies.has(movie.id) || 
        Date.now() - (this.usedMovies.get(movie.id) || 0) > this.cacheLifetime)
    );

    console.log(`[Cache ${this.debugId}] Adding movies:`, {
      incoming: validMovies.map(m => ({ id: m.id, title: m.title, expiresAt: Date.now() + this.cacheLifetime })),
      alreadyUsed: Array.from(this.usedMovies.entries()),
      currentCache: this.movies.map(m => ({ id: m.movie.id, title: m.movie.title }))
    });

    const newMovies = validMovies.map(movie => ({
      movie,
      expiresAt: Date.now() + this.cacheLifetime
    }));
    
    // Shuffle new movies before adding to cache
    const shuffledNewMovies = [...newMovies].sort(() => Math.random() - 0.5);
    
    console.log(`[Cache ${this.debugId}] After filtering:`, {
      newMovies: shuffledNewMovies.map(m => ({ id: m.movie.id, title: m.movie.title }))
    });
    
    // Remove expired movies before adding new ones
    this.removeExpiredMovies();
    
    this.movies = [...this.movies, ...shuffledNewMovies].slice(0, this.maxSize);
  }

  private removeExpiredMovies(): void {
    const now = Date.now();
    const initialCount = this.movies.length;
    this.movies = this.movies.filter(m => m.expiresAt > now);
    
    const removedCount = initialCount - this.movies.length;
    if (removedCount > 0) {
      console.log(`[Cache ${this.debugId}] Removed ${removedCount} expired movies`);
    }
  }

  async getMovie(): Promise<Movie | null> {
    // Remove expired movies first
    this.removeExpiredMovies();
    
    // Clean up old used movies
    const now = Date.now();
    for (const [id, timestamp] of this.usedMovies.entries()) {
      if (now - timestamp > this.cacheLifetime) {
        this.usedMovies.delete(id);
      }
    }
    
    if (this.movies.length === 0) return null;
    
    // Simulate loading time
    await this.simulateLoadTime();
    
    // Get a truly random movie from the cache
    const randomIndex = Math.floor(Math.random() * this.movies.length);
    const { movie } = this.movies[randomIndex];
    
    console.log(`[Cache ${this.debugId}] Getting movie:`, {
      selected: { id: movie.id, title: movie.title },
      remainingCount: this.movies.length - 1
    });

    // Add to used movies set
    this.usedMovies.set(movie.id, Date.now());
    
    // Remove from cache
    this.movies = this.movies.filter((_, index) => index !== randomIndex);
    return movie;
  }

  clear(): void {
    console.log(`[Cache ${this.debugId}] Clearing cache`, {
      hadMovies: this.movies.length,
      hadUsed: this.usedMovies.size,
      debugId: this.debugId
    });
    
    this.movies = [];
    
    // Clear used movies that are older than cache lifetime
    const now = Date.now();
    for (const [id, timestamp] of this.usedMovies.entries()) {
      if (now - timestamp > this.cacheLifetime) {
        this.usedMovies.delete(id);
      }
    }
  }

  get size(): number {
    return this.movies.length;
  }

  hasMovies(): boolean {
    this.removeExpiredMovies();
    return this.movies.length > 0;
  }
}

export const movieCache = new MovieCache();