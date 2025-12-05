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
 * 
 * IMPORTANT: Container with data-zone="10184307" must be in DOM BEFORE script loads
 */
export function preloadInterstitialAd(): void {
  if (typeof window === 'undefined' || interstitialScriptLoaded) return;

  // Check if script already exists (by data-zone or src)
  const existingScript = document.querySelector('script[data-zone="10184307"]') || 
                         document.querySelector('script[src*="groleegni.net/vignette.min.js"][data-zone="10184307"]');
  
  if (!existingScript) {
    try {
      // Use the exact pattern from user's code - append to head for better compatibility
      const script = document.createElement('script');
      script.dataset.zone = '10184307';
      script.src = 'https://groleegni.net/vignette.min.js';
      script.async = true;
      script.defer = false; // Don't defer - we want it to execute immediately
      
      // Add error handler to catch loading issues
      script.onerror = (error) => {
        console.error('Failed to load Monetag interstitial script:', error);
        interstitialScriptLoaded = false; // Allow retry
      };
      
      script.onload = () => {
        interstitialScriptLoaded = true;
        console.log('Monetag interstitial script loaded successfully (zone 10184307)');
        
        // Trigger a scan for containers after script loads
        // Monetag script should automatically scan, but we can help it along
        const containers = document.querySelectorAll('[data-zone="10184307"]');
        if (containers.length > 0) {
          console.log(`Found ${containers.length} container(s) with data-zone="10184307"`);
        }
      };
      
      // Append to head (as Monetag docs suggest) for better compatibility
      document.head.appendChild(script);
        console.log('Monetag interstitial script preloaded (zone 10184307)');
    } catch (error) {
      console.error('Failed to preload Monetag interstitial script:', error);
      interstitialScriptLoaded = false;
    }
  } else {
    interstitialScriptLoaded = true;
    console.log('Monetag interstitial script already exists');
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
  // The container should already be visible when this is called
    if (container) {
      container.setAttribute('data-zone', '10184307');
      // Ensure container is visible and has proper dimensions
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.minHeight = '300px';
    container.style.position = 'relative';
    container.style.display = 'block';
    container.style.visibility = 'visible';
      console.log('Monetag interstitial container ready (zone 10184307)');
    }
}

/**
 * Load vignette ad (zone 10184300)
 * Vignette ads are overlay ads that inject themselves - no container needed
 */
export function loadVignetteAd(): void {
  if (typeof window === 'undefined' || vignetteScriptLoaded) return;

  // Check if script already exists
  const existingScript = document.querySelector('script[src*="groleegni.net/vignette.min.js"][data-zone="10184300"]');
  if (existingScript) {
    vignetteScriptLoaded = true;
    console.log('Vignette ad script already loaded (zone 10184300)');
    return;
  }

  try {
    // Use the pattern from user's code - append to head for better compatibility
    const script = document.createElement('script');
    script.dataset.zone = '10184300';
    script.src = 'https://groleegni.net/vignette.min.js';
    script.async = true;
    script.defer = false;
    
    script.onload = () => {
      vignetteScriptLoaded = true;
      console.log('Vignette ad script loaded (zone 10184300)');
    };
    
    script.onerror = (error) => {
      console.error('Failed to load vignette ad script:', error);
      vignetteScriptLoaded = false; // Allow retry
    };
    
    // Append to head (as Monetag docs suggest)
    document.head.appendChild(script);
  } catch (error) {
    console.error('Failed to load vignette ad script:', error);
    vignetteScriptLoaded = false;
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

