/**
 * Monetag Script Configuration
 * 
 * IMPORTANT: Get the exact script formats from your Monetag dashboard:
 * 1. Go to https://publishers.monetag.com/site/3049804
 * 2. Click on your zone → "Get tag"
 * 3. Copy the exact script format
 * 4. Update the URLs below
 */

export const MONETAG_SCRIPTS = {
  // MultiTag Script URL - Get from dashboard for your MultiTag zone
  // Default: s.monetag.com/tag.js (may need to be updated)
  MULTITAG_SCRIPT_URL: 'https://s.monetag.com/tag.js', // Update with exact URL from dashboard
  
  // Interstitial Script URL - Get from dashboard for your Interstitial zone
  // Format: https://[domain]/[path]/tag.min.js
  // Example from user: https://fpyf8.com/88/tag.min.js
  INTERSTITIAL_SCRIPT_URL: 'https://fpyf8.com/88/tag.min.js', // Update with exact URL from dashboard
  
  // Banner/Vignette Script URL - Get from dashboard for your Banner zone
  // Format: https://[domain]/vignette.min.js
  // Example from user: https://groleegni.net/vignette.min.js
  BANNER_SCRIPT_URL: 'https://groleegni.net/vignette.min.js', // Update with exact URL from dashboard
};

/**
 * Zone IDs - Update these with your actual zone IDs from dashboard
 */
export const MONETAG_ZONES = {
  MULTITAG: '10184298', // In-Page Push (MULTI) - for banner placement
  INTERSTITIAL: '10184299', // Native Banner Interstitial (MULTI)
  BANNER: '10184307', // Native Banner (Interstitial) - alternative
};

