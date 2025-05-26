import { WatchlistMovie } from '../types';

export function getWatchlist(): WatchlistMovie[] {
  try {
    const savedWatchlist = localStorage.getItem('nmp-watchlist');
    return savedWatchlist ? JSON.parse(savedWatchlist) : [];
  } catch (e) {
    console.error('Error loading watchlist from localStorage', e);
    return [];
  }
}

export function saveWatchlist(watchlist: WatchlistMovie[]): void {
  try {
    localStorage.setItem('nmp-watchlist', JSON.stringify(watchlist));
  } catch (e) {
    console.error('Error saving watchlist to localStorage', e);
  }
}