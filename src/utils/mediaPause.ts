/**
 * Utility functions to pause/resume all media (videos, audio) on the page
 * Used when interstitial ads appear to prevent background media from playing
 */

/**
 * Pause all media elements on the page
 * - HTML5 video elements
 * - HTML5 audio elements
 * - YouTube iframes (via postMessage)
 * - Vimeo iframes (via postMessage)
 */
export function pauseAllMedia(): void {
  // Pause all HTML5 video elements
  document.querySelectorAll('video').forEach((video) => {
    if (!video.paused) {
      video.pause();
    }
  });

  // Pause all HTML5 audio elements
  document.querySelectorAll('audio').forEach((audio) => {
    if (!audio.paused) {
      audio.pause();
    }
  });

  // Pause YouTube iframes
  document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]').forEach((iframe) => {
    try {
      (iframe.contentWindow as Window)?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
    } catch (error) {
      // Cross-origin iframe - ignore
      console.debug('Could not pause YouTube iframe:', error);
    }
  });

  // Pause Vimeo iframes
  document.querySelectorAll('iframe[src*="vimeo.com"]').forEach((iframe) => {
    try {
      (iframe.contentWindow as Window)?.postMessage('{"method":"pause"}', '*');
    } catch (error) {
      // Cross-origin iframe - ignore
      console.debug('Could not pause Vimeo iframe:', error);
    }
  });
}

/**
 * Resume all media elements on the page
 * Note: This is typically not needed for ads (we just pause), but included for completeness
 */
export function resumeAllMedia(): void {
  // Resume all HTML5 video elements
  document.querySelectorAll('video').forEach((video) => {
    if (video.paused) {
      video.play().catch((error) => {
        // Auto-play may be blocked by browser
        console.debug('Could not resume video:', error);
      });
    }
  });

  // Resume all HTML5 audio elements
  document.querySelectorAll('audio').forEach((audio) => {
    if (audio.paused) {
      audio.play().catch((error) => {
        // Auto-play may be blocked by browser
        console.debug('Could not resume audio:', error);
      });
    }
  });

  // Note: YouTube/Vimeo iframes typically don't need resume - they maintain their state
}

