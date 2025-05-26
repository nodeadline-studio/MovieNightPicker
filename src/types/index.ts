export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  imdb_id: string;
  genres: Genre[];
  in_theaters?: boolean;
}

export interface Genre {
  id: number;
  name: string;
}

export interface FilterOptions {
  genres: number[];
  yearFrom: number;
  yearTo: number;
  ratingFrom: number;
  maxRuntime: number;
  inTheatersOnly: boolean;
  includeAdult: boolean;
}

export interface WatchlistMovie extends Movie {
  addedAt: string;
  imdb_id: string | null;
}

export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

export interface MovieActions {
  getRandomMovie: () => Promise<void>;
  getMovieFromCache: () => Promise<CacheResult>;
  addToWatchlist: (movie: Movie) => void;
  removeFromWatchlist: (id: number) => void;
}