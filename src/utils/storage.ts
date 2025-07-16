import { WatchlistMovie } from '../types';
import { logger } from './logger';

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

// Clear watchlist
export const clearWatchlist = (): void => {
  localStorage.removeItem('nmp-watchlist');
  logger.debug('Watchlist cleared from localStorage', undefined, { prefix: 'Storage' });
};

// Clear all app data
export const clearAllData = (): void => {
  // Get all keys that start with our prefix
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('nmp-') || key.startsWith('movie') || key === 'watchlist' || key === 'cookie-consent' || key === 'password-verified')) {
      keysToRemove.push(key);
    }
  }
  
  // Remove all our keys
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  logger.debug('All app data cleared from localStorage', undefined, { prefix: 'Storage' });
};

// Debug function to log current state
export const debugLocalStorage = (): void => {
  logger.debug('=== localStorage Debug ===', {
    'Watchlist': localStorage.getItem('nmp-watchlist'),
    'Filters': localStorage.getItem('nmp-filters'),
    'Metrics': localStorage.getItem('nmp-metrics'),
    'Pick Count': localStorage.getItem('moviePickCount'),
    'Cookie Consent': localStorage.getItem('cookie-consent'),
    'Password Verified': localStorage.getItem('password-verified')
  }, { prefix: 'Storage' });
};