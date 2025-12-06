/**
 * Monetag Ads Utility
 * Manages Monetag ad scripts loading and cycling
 */

let interstitialScriptLoaded = false;
let vignetteScriptLoaded = false;
let notificationsScriptLoaded = false;
let notificationsBlockedUntil: number | null = null;
let adCycleCounter = 0; // Track which ad to show (vignette or notifications)
const adCycle: Array<'vignette' | 'notifications'> = ['vignette', 'notifications'];
let monetagSDKLoading: Promise<void> | null = null;
let monetagSDKHostIndex = 0;
let monetagSDKBlockedUntil: number | null = null;
// Use env var first (from Netlify or .env), then fallback to default hosts
const envSdkHost = import.meta.env.VITE_MONETAG_TAG_HOST;
const monetagSDKHosts = envSdkHost 
  ? [envSdkHost] // If env var is set, use only that (Netlify/production)
  : [ // Fallback hosts for local dev
      'https://s.monetag.com/tag.js',
      'https://js.monetag.com/tag.js',
      'https://d.monetag.com/tag.js',
    ];
const AD_CYCLE_STORAGE_KEY = 'monetag_ad_cycle_index';
const LAST_AD_STORAGE_KEY = 'monetag_last_ad';
const INTERSTITIAL_CYCLE_STORAGE_KEY = 'monetag_interstitial_index';
const interstitialZones: string[] = ['10184307', '10184299']; // rotate per requirement
const NOTIFICATION_CYCLE_STORAGE_KEY = 'monetag_notification_index';
// Primary requested notification zone, plus provided multi snippet zone for fallback
const notificationZones: string[] = ['10184301', '185147'];
let adCycleInitializedFromStorage = false;

function loadCycleIndexFromStorage(): void {
  if (typeof window === 'undefined' || adCycleInitializedFromStorage) return;

  const storedIndex = parseInt(localStorage.getItem(AD_CYCLE_STORAGE_KEY) || '0', 10);
  if (!Number.isNaN(storedIndex) && storedIndex >= 0) {
    adCycleCounter = storedIndex;
  }
  adCycleInitializedFromStorage = true;
}

function persistCycleIndex(nextIndex: number, adType: 'vignette' | 'notifications'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AD_CYCLE_STORAGE_KEY, nextIndex.toString());
  localStorage.setItem(LAST_AD_STORAGE_KEY, adType);
}

function loadInterstitialIndexFromStorage(): number {
  if (typeof window === 'undefined') return 0;
  const stored = parseInt(localStorage.getItem(INTERSTITIAL_CYCLE_STORAGE_KEY) || '0', 10);
  return Number.isNaN(stored) ? 0 : stored;
}

function persistInterstitialIndex(idx: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(INTERSTITIAL_CYCLE_STORAGE_KEY, idx.toString());
}

function getNextInterstitialZone(): string {
  const idx = loadInterstitialIndexFromStorage();
  const zone = interstitialZones[idx % interstitialZones.length];
  const nextIdx = (idx + 1) % interstitialZones.length;
  persistInterstitialIndex(nextIdx);
  // Reduced log noise - only log in dev mode
  if (import.meta.env.DEV) {
    console.debug(`[Monetag] Interstitial cycle -> zone ${zone} (idx ${idx})`);
  }
  return zone;
}

function loadNotificationIndexFromStorage(): number {
  if (typeof window === 'undefined') return 0;
  const stored = parseInt(localStorage.getItem(NOTIFICATION_CYCLE_STORAGE_KEY) || '0', 10);
  return Number.isNaN(stored) ? 0 : stored;
}

function persistNotificationIndex(idx: number): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIFICATION_CYCLE_STORAGE_KEY, idx.toString());
}

function getNextNotificationZone(): string {
  const idx = loadNotificationIndexFromStorage();
  const zone = notificationZones[idx % notificationZones.length];
  const nextIdx = (idx + 1) % notificationZones.length;
  persistNotificationIndex(nextIdx);
  // Reduced log noise - only log in dev mode
  if (import.meta.env.DEV) {
    console.debug(`[Monetag] Notifications cycle -> zone ${zone} (idx ${idx})`);
  }
  return zone;
}

// Track if current request is for interstitial (user-triggered)
let isInterstitialRequest = false;

export function setInterstitialRequest(flag: boolean): void {
  isInterstitialRequest = flag;
}

function ensureMonetagSDK(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).monetag) {
    interstitialScriptLoaded = true;
    return Promise.resolve();
  }

  if (monetagSDKLoading) {
    return monetagSDKLoading;
  }

  // Allow interstitials to bypass backoff (they're user-triggered, should always try)
  // Only apply backoff for automatic/preload attempts
  if (monetagSDKBlockedUntil && Date.now() < monetagSDKBlockedUntil && !isInterstitialRequest) {
    return Promise.reject(new Error('Monetag SDK load temporarily blocked after previous failures'));
  }
  
  // For interstitials, clear backoff to allow retry
  if (monetagSDKBlockedUntil && Date.now() < monetagSDKBlockedUntil && isInterstitialRequest) {
    monetagSDKBlockedUntil = null;
  }

  monetagSDKLoading = new Promise<void>((resolve, reject) => {
    const tryLoad = (attempt = 0) => {
      const host = monetagSDKHosts[attempt % monetagSDKHosts.length];
      const existing = document.querySelector(`script[src="${host}"]`);
      if (existing) {
        existing.addEventListener('load', () => {
          interstitialScriptLoaded = true;
          resolve();
        });
        existing.addEventListener('error', (err) => {
          monetagSDKLoading = null;
          reject(err);
        });
        return;
      }

      const script = document.createElement('script');
      script.src = host;
      script.async = true;
      script.defer = false;
      script.onload = () => {
        interstitialScriptLoaded = true;
        monetagSDKBlockedUntil = null; // Clear backoff on success
        if (import.meta.env.DEV) {
          console.debug(`[Monetag] SDK loaded from ${host}`);
        }
        resolve();
      };
      script.onerror = (error) => {
        interstitialScriptLoaded = false;
        monetagSDKLoading = null;
        // Backoff for repeated failures - but shorter for interstitials
        if (attempt + 1 >= monetagSDKHosts.length) {
          // Shorter backoff (30s) to allow interstitials to retry sooner
          monetagSDKBlockedUntil = Date.now() + 30 * 1000; // 30s backoff instead of 2min
          if (import.meta.env.DEV) {
            console.warn('[Monetag] SDK load failed from all hosts. Backoff active for 30s.');
          }
        }
        // Try next host if available
        if (attempt + 1 < monetagSDKHosts.length) {
          monetagSDKHostIndex = (attempt + 1) % monetagSDKHosts.length;
          if (import.meta.env.DEV) {
            console.debug(`[Monetag] Retrying SDK load from ${monetagSDKHosts[monetagSDKHostIndex]}`);
          }
          tryLoad(attempt + 1);
          return;
        }
        reject(error);
      };
      document.head.appendChild(script);
    };

    tryLoad(monetagSDKHostIndex);
  });

  return monetagSDKLoading;
}

/**
 * Preload interstitial ad script (should be called before 5th reroll)
 * Uses Monetag tag.js SDK and init
 *
 * IMPORTANT: Container should be in DOM before init for best results
 */
export function preloadInterstitialAd(): void {
  if (typeof window === 'undefined') return;
  void ensureMonetagSDK().catch((err) => {
    // Only log in dev mode to reduce production noise
    if (import.meta.env.DEV) {
      console.warn('[Monetag] SDK preload failed (will retry on interstitial show):', err);
    }
  });
}

/**
 * Load and show interstitial ad
 * Uses Monetag SDK tag.js (format: interstitial)
 */
export async function loadInterstitialAd(container: HTMLElement, zoneIdParam?: string): Promise<void> {
  if (!container) return;

  // Mark as interstitial request to bypass backoff
  setInterstitialRequest(true);
  try {
    await ensureMonetagSDK();
  } finally {
    setInterstitialRequest(false);
  }

  // Set data-zone and ensure visibility
      const zoneId = zoneIdParam || '10184307';
      container.setAttribute('data-zone', zoneId);
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.minHeight = '300px';
      container.style.position = 'relative';
      container.style.display = 'block';
      container.style.visibility = 'visible';
      if (import.meta.env.DEV) {
        console.debug(`[Monetag] Interstitial container ready (zone ${zoneId})`);
      }

  if ((window as any).monetag && typeof (window as any).monetag.init === 'function') {
    try {
      (window as any).monetag.init({
        siteId: '3049804',
        zoneId,
        format: 'interstitial',
      });
      interstitialScriptLoaded = true;
      if (import.meta.env.DEV) {
        console.debug(`[Monetag] Interstitial init called (zone ${zoneId})`);
      }
    } catch (error) {
      console.error('Failed to initialize Monetag interstitial:', error);
      throw error;
    }
  } else {
    throw new Error('Monetag SDK not available after load');
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
    if (import.meta.env.DEV) {
      console.debug('[Monetag] Vignette ad script already loaded (zone 10184300)');
    }
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
        if (import.meta.env.DEV) {
          console.debug('[Monetag] Vignette ad script loaded (zone 10184300)');
        }
      };
      
      script.onerror = (error) => {
        vignetteScriptLoaded = false; // Allow retry
        if (import.meta.env.DEV) {
          console.warn('[Monetag] Failed to load vignette ad script:', error);
        }
      };
    
    // Append to head (as Monetag docs suggest)
    document.head.appendChild(script);
  } catch (error) {
    console.error('Failed to load vignette ad script:', error);
    vignetteScriptLoaded = false;
  }
}

/**
 * Load notifications ad (rotates zones; primary 10184301, fallback 185147)
 * Uses Monetag multi script: https://quge5.com/88/tag.min.js data-zone="ZONE"
 */
export function loadNotificationsAd(): void {
  if (typeof window === 'undefined' || notificationsScriptLoaded) return;

  if (notificationsBlockedUntil && Date.now() < notificationsBlockedUntil) {
    // Silently skip during backoff - no log noise
    return;
  }

  const zoneId = getNextNotificationZone();

  // Check if script already exists
  const existingScript = document.querySelector(`script[src*="quge5.com/88/tag.min.js"][data-zone="${zoneId}"]`) ||
                         document.querySelector(`script[src*="6opo.com/88/tag.min.js"][data-zone="${zoneId}"]`);
  
  if (!existingScript) {
    try {
      const script = document.createElement('script');
      script.src = 'https://quge5.com/88/tag.min.js';
      script.setAttribute('data-zone', zoneId);
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        notificationsScriptLoaded = true;
        notificationsBlockedUntil = null; // Clear backoff on success
        if (import.meta.env.DEV) {
          console.debug(`[Monetag] Notifications ad script loaded (zone ${zoneId})`);
        }
      };
      
      script.onerror = (error) => {
        notificationsScriptLoaded = false;
        notificationsBlockedUntil = Date.now() + 2 * 60 * 1000; // backoff 2 min
        // Only log warning once per zone to reduce noise
        if (import.meta.env.DEV) {
          console.warn(`[Monetag] Notifications ad failed (zone ${zoneId}). Backoff active for 2min.`, error);
        }
        // Remove failed script to allow retry after backoff
        try {
          script.remove();
        } catch (e) {
          // Ignore removal errors
        }
      };
      
      document.head.appendChild(script);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[Monetag] Error creating notifications ad script:', error);
      }
      notificationsScriptLoaded = false;
      notificationsBlockedUntil = Date.now() + 2 * 60 * 1000;
    }
  } else {
    notificationsScriptLoaded = true;
  }
}

/**
 * Cycle between vignette and notifications after first ad
 * Returns which ad type to load
 */
export function getNextAdType(): 'vignette' | 'notifications' {
  loadCycleIndexFromStorage();
  const next = adCycle[adCycleCounter % adCycle.length];
  adCycleCounter += 1;
  persistCycleIndex(adCycleCounter, next);
  // Reduced log noise - only log in dev mode
  if (import.meta.env.DEV) {
    console.debug(`[Monetag] Cycling to ${next} ad (index ${adCycleCounter - 1})`);
  }
  return next;
}

/**
 * Load the next ad in cycle (vignette or notifications)
 * Only loads if not already loaded to prevent duplicate script injection
 */
export function loadNextAdInCycle(): void {
  const adType = getNextAdType();
  
  // Always rotate - even if scripts are loaded, they should alternate per movie
  // Vignette and notifications can coexist, but we want to alternate which one is "active"
  if (adType === 'vignette') {
    // Load vignette if not loaded, or if notifications failed
    if (!vignetteScriptLoaded) {
      loadVignetteAd();
    } else if (import.meta.env.DEV) {
      console.debug('[Monetag] Vignette already loaded, continuing rotation');
    }
  } else {
    // Load notifications if not blocked and not loaded
    if (!notificationsScriptLoaded) {
      loadNotificationsAd();
      if (import.meta.env.DEV) {
        console.debug('[Monetag] Notifications ad requested');
      }
    } else if (import.meta.env.DEV) {
      console.debug('[Monetag] Notifications already loaded, continuing rotation');
    }
  }
}

export async function loadNextInterstitial(container: HTMLElement): Promise<void> {
  const zone = getNextInterstitialZone();
  await loadInterstitialAd(container, zone);
}

/**
 * Reset ad state (for testing)
 */
export function resetAdState(): void {
  interstitialScriptLoaded = false;
  vignetteScriptLoaded = false;
  notificationsScriptLoaded = false;
  adCycleCounter = 0;
  adCycleInitializedFromStorage = false;
  notificationsBlockedUntil = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AD_CYCLE_STORAGE_KEY);
    localStorage.removeItem(LAST_AD_STORAGE_KEY);
    localStorage.removeItem(INTERSTITIAL_CYCLE_STORAGE_KEY);
    localStorage.removeItem(NOTIFICATION_CYCLE_STORAGE_KEY);
  }
  
  // Remove scripts
  document.querySelectorAll('script[data-zone]').forEach(script => {
    const zone = script.getAttribute('data-zone');
    if (zone === '10184307' || zone === '10184300' || zone === '10184301') {
      script.remove();
    }
  });
}

