/**
 * Monetag Ads Utility
 * Manages Monetag ad scripts loading and cycling
 */

let interstitialScriptLoaded = false;
let vignetteScriptLoaded = false;
let notificationsScriptLoaded = false;
let adCycleCounter = 0; // Track which ad to show (vignette or notifications)

/**
 * Preload interstitial ad script (should be called before 5th reroll)
 * Uses pattern: (function(s){s.dataset.zone='10184307',s.src='https://groleegni.net/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))
 */
export function preloadInterstitialAd(): void {
  if (typeof window === 'undefined' || interstitialScriptLoaded) return;

  // Check if script already exists
  const existingScript = document.querySelector('script[data-zone="10184307"]');
  
  if (!existingScript) {
    try {
      // Use the exact pattern from user's code
      const script = document.createElement('script');
      script.dataset.zone = '10184307';
      script.src = 'https://groleegni.net/vignette.min.js';
      script.async = true;
      
      const target = [document.documentElement, document.body].filter(Boolean).pop();
      if (target) {
        target.appendChild(script);
        interstitialScriptLoaded = true;
        console.log('Monetag interstitial script preloaded (zone 10184307)');
      }
    } catch (error) {
      console.error('Failed to preload Monetag interstitial script:', error);
    }
  } else {
    interstitialScriptLoaded = true;
  }
}

/**
 * Load and show interstitial ad
 * Monetag automatically finds containers with matching data-zone after script loads
 */
export function loadInterstitialAd(container: HTMLElement): void {
  if (!container) return;

  // Ensure script is loaded first
  if (!interstitialScriptLoaded) {
    preloadInterstitialAd();
  }

  // Set data-zone on container - Monetag script will automatically inject ad
  // Wait a bit for script to initialize if it was just loaded
  const delay = interstitialScriptLoaded ? 0 : 1000;
  setTimeout(() => {
    if (container) {
      container.setAttribute('data-zone', '10184307');
      // Ensure container is visible and has proper dimensions
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.minHeight = '300px';
      console.log('Monetag interstitial container ready (zone 10184307)');
    }
  }, delay);
}

/**
 * Load vignette ad (zone 10184300)
 */
export function loadVignetteAd(): void {
  if (typeof window === 'undefined' || vignetteScriptLoaded) return;

  // Check if script already exists
  const existingScript = document.querySelector('script[src*="groleegni.net/vignette.min.js"][data-zone="10184300"]');
  if (existingScript) {
    vignetteScriptLoaded = true;
    return;
  }

  try {
    // Use the pattern from user's code
    const script = document.createElement('script');
    script.dataset.zone = '10184300';
    script.src = 'https://groleegni.net/vignette.min.js';
    script.async = true;
    
    const target = [document.documentElement, document.body].filter(Boolean).pop();
    if (target) {
      target.appendChild(script);
      vignetteScriptLoaded = true;
      console.log('Vignette ad script loaded (zone 10184300)');
    }
  } catch (error) {
    console.error('Failed to load vignette ad script:', error);
  }
}

/**
 * Load notifications ad (zone 10184301)
 * Uses: <script src="https://quge5.com/88/tag.min.js" data-zone="10184301" async data-cfasync="false"></script>
 */
export function loadNotificationsAd(): void {
  if (typeof window === 'undefined' || notificationsScriptLoaded) return;

  // Check if script already exists
  const existingScript = document.querySelector('script[src*="quge5.com/88/tag.min.js"][data-zone="10184301"]');
  
  if (!existingScript) {
    const script = document.createElement('script');
    script.src = 'https://quge5.com/88/tag.min.js';
    script.setAttribute('data-zone', '10184301');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.onload = () => {
      notificationsScriptLoaded = true;
      console.log('Notifications ad script loaded (zone 10184301)');
    };
    script.onerror = (error) => {
      console.error('Failed to load notifications ad script:', error);
      // Still mark as loaded to prevent retries - 404s are expected for tracking
      notificationsScriptLoaded = true;
    };
    document.head.appendChild(script);
  } else {
    notificationsScriptLoaded = true;
  }
}

/**
 * Cycle between vignette and notifications after first ad
 * Returns which ad type to load
 */
export function getNextAdType(): 'vignette' | 'notifications' {
  adCycleCounter++;
  // Alternate between vignette and notifications
  return adCycleCounter % 2 === 1 ? 'vignette' : 'notifications';
}

/**
 * Load the next ad in cycle (vignette or notifications)
 */
export function loadNextAdInCycle(): void {
  const adType = getNextAdType();
  if (adType === 'vignette') {
    loadVignetteAd();
  } else {
    loadNotificationsAd();
  }
}

/**
 * Reset ad state (for testing)
 */
export function resetAdState(): void {
  interstitialScriptLoaded = false;
  vignetteScriptLoaded = false;
  notificationsScriptLoaded = false;
  adCycleCounter = 0;
  
  // Remove scripts
  document.querySelectorAll('script[data-zone]').forEach(script => {
    const zone = script.getAttribute('data-zone');
    if (zone === '10184307' || zone === '10184300' || zone === '10184301') {
      script.remove();
    }
  });
}

