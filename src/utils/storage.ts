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

// Clear watchlist
export function clearWatchlist(): void {
  try {
    localStorage.removeItem('nmp-watchlist');
    console.log('Watchlist cleared from localStorage');
  } catch (e) {
    console.error('Error clearing watchlist from localStorage', e);
  }
}

// Clear all app data
export function clearAllAppData(): void {
  try {
    const keysToRemove = [
      'nmp-watchlist',
      'nmp-filters', 
      'nmp-metrics',
      'moviePickCount',
      'cookie-consent',
      'password-verified'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('All app data cleared from localStorage');
  } catch (e) {
    console.error('Error clearing app data from localStorage', e);
  }
}

// Debug function to check what's in localStorage
export function debugLocalStorage(): void {
  console.log('=== localStorage Debug ===');
  console.log('Watchlist:', localStorage.getItem('nmp-watchlist'));
  console.log('Filters:', localStorage.getItem('nmp-filters'));
  console.log('Metrics:', localStorage.getItem('nmp-metrics'));
  console.log('Pick Count:', localStorage.getItem('moviePickCount'));
  console.log('Cookie Consent:', localStorage.getItem('cookie-consent'));
  console.log('Password Verified:', localStorage.getItem('password-verified'));
  console.log('========================');
}