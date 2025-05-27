// Google Analytics utility
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

export const GA_TRACKING_ID = 'G-Y3097KM0C5';

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_location: url,
    });
  }
};

// Track custom events
export const event = (action: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, parameters);
  }
};

// Specific event tracking functions
export const trackMoviePick = (movieId: number, movieTitle: string) => {
  event('movie_pick', {
    movie_id: movieId,
    movie_title: movieTitle,
    event_category: 'engagement',
  });
};

export const trackWatchlistAdd = (movieId: number, movieTitle: string) => {
  event('watchlist_add', {
    movie_id: movieId,
    movie_title: movieTitle,
    event_category: 'engagement',
  });
};

export const trackWatchlistRemove = (movieId: number, movieTitle: string) => {
  event('watchlist_remove', {
    movie_id: movieId,
    movie_title: movieTitle,
    event_category: 'engagement',
  });
};

export const trackFilterUse = (filterType: string, filterValue: any) => {
  event('filter_use', {
    filter_type: filterType,
    filter_value: filterValue,
    event_category: 'interaction',
  });
};

export const trackShare = (platform: string, watchlistSize: number) => {
  event('watchlist_share', {
    platform: platform,
    watchlist_size: watchlistSize,
    event_category: 'social',
  });
};

export const trackVideoAdView = (adDuration: number) => {
  event('video_ad_view', {
    ad_duration: adDuration,
    event_category: 'monetization',
  });
};

export const trackVideoAdSkip = (timeWatched: number) => {
  event('video_ad_skip', {
    time_watched: timeWatched,
    event_category: 'monetization',
  });
}; 