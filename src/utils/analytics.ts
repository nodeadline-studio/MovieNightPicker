// Analytics utility for anonymous data collection
interface UserMetrics {
  anonymousId: string;
  birthYear?: number;
  lastMovieId?: number;
  watchlistSize: number;
  cookiePreferences?: {
    acceptAll: boolean;
    isEU: boolean;
    timestamp: string;
  };
  filterPreferences: {
    genres: number[];
    yearRange: [number, number];
    rating: number;
    includeAdult: boolean;
  };
  sessionData: {
    moviesViewed: number;
    captchaAttempts: number;
    captchaScore: number;
    sharesCount?: number;
  };
}

class Analytics {
  private storageKey = 'nmp-metrics';
  private anonymousId: string;

  constructor() {
    this.anonymousId = this.getOrCreateAnonymousId();
  }

  private getOrCreateAnonymousId(): string {
    let id = localStorage.getItem('nmp-anonymous-id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('nmp-anonymous-id', id);
    }
    return id;
  }

  private getMetrics(): UserMetrics {
    const defaultMetrics: UserMetrics = {
      anonymousId: this.anonymousId,
      watchlistSize: 0,
      filterPreferences: {
        genres: [],
        yearRange: [1990, new Date().getFullYear()],
        rating: 6,
        includeAdult: false,
      },
      sessionData: {
        moviesViewed: 0,
        captchaAttempts: 0,
        captchaScore: 100,
      },
    };

    const stored = localStorage.getItem(this.storageKey);
    return stored ? { ...defaultMetrics, ...JSON.parse(stored) } : defaultMetrics;
  }

  private saveMetrics(metrics: UserMetrics) {
    localStorage.setItem(this.storageKey, JSON.stringify(metrics));
  }

  updateCookiePreferences(acceptAll: boolean, isEU: boolean) {
    const metrics = this.getMetrics();
    metrics.cookiePreferences = {
      acceptAll,
      isEU,
      timestamp: new Date().toISOString()
    };
    this.saveMetrics(metrics);
  }

  setBirthYear(year: number) {
    const metrics = this.getMetrics();
    metrics.birthYear = year;
    this.saveMetrics(metrics);
  }

  setLastMovie(movieId: number) {
    const metrics = this.getMetrics();
    metrics.lastMovieId = movieId;
    metrics.sessionData.moviesViewed++;
    this.saveMetrics(metrics);
  }

  updateWatchlistSize(size: number) {
    const metrics = this.getMetrics();
    metrics.watchlistSize = size;
    this.saveMetrics(metrics);
  }

  updateFilterPreferences(preferences: Partial<UserMetrics['filterPreferences']>) {
    const metrics = this.getMetrics();
    metrics.filterPreferences = {
      ...metrics.filterPreferences,
      ...preferences,
    };
    this.saveMetrics(metrics);
  }

  updateCaptchaMetrics(attempts: number, score: number) {
    const metrics = this.getMetrics();
    metrics.sessionData.captchaAttempts = attempts;
    metrics.sessionData.captchaScore = score;
    this.saveMetrics(metrics);
  }

  trackShare(platform: string, watchlistSize: number) {
    // Track sharing activity (anonymous)
    const metrics = this.getMetrics();
    metrics.sessionData.sharesCount = (metrics.sessionData.sharesCount || 0) + 1;
    this.saveMetrics(metrics);
  }

  clearMetrics() {
    localStorage.removeItem(this.storageKey);
  }
}

export const analytics = new Analytics();