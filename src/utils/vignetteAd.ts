/**
 * Vignette Ad Utility
 * Loads vignette and notifications ad scripts after first commercial break
 * Cycles between vignette and notifications
 */

let firstCommercialBreakCompleted = false;

/**
 * Check if first commercial break has been completed
 */
export function hasFirstCommercialBreakCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check localStorage for persistence
  const stored = localStorage.getItem('first_commercial_break_completed');
  if (stored === 'true') {
    firstCommercialBreakCompleted = true;
    return true;
  }
  
  return firstCommercialBreakCompleted;
}

/**
 * Mark first commercial break as completed
 */
export function markFirstCommercialBreakCompleted(): void {
  if (typeof window === 'undefined') return;
  
  firstCommercialBreakCompleted = true;
  localStorage.setItem('first_commercial_break_completed', 'true');
}

/**
 * Load next ad in cycle (vignette or notifications)
 * Should be called after first commercial break when movie is loaded
 */
export function loadVignetteAd(): void {
  if (typeof window === 'undefined') return;
  
  // Check if first commercial break has been completed
  if (!hasFirstCommercialBreakCompleted()) {
    return;
  }
  
  // Load next ad in cycle (vignette or notifications)
  // Use dynamic import to avoid circular dependency
  import('./monetagAds').then(({ loadNextAdInCycle }) => {
    loadNextAdInCycle();
  });
}

/**
 * Reset vignette state (for testing)
 */
export function resetVignetteState(): void {
  if (typeof window === 'undefined') return;
  
  firstCommercialBreakCompleted = false;
  localStorage.removeItem('first_commercial_break_completed');
  
  // Reset ad state via monetagAds utility
  import('./monetagAds').then(({ resetAdState }) => {
    resetAdState();
  });
}

