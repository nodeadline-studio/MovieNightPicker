// Analytics tracking for MovieNightPicker
// Tracks video ad performance, user engagement, and traffic sources

export interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  customParameters?: Record<string, any>;
  timestamp: number;
}

export interface VideoAdMetrics {
  impressions: number;
  clicks: number;
  skipRate: number;
  averageWatchTime: number;
  conversionRate: number;
  revenue: number;
}

export interface UserEngagementMetrics {
  totalPicks: number;
  averagePicksPerSession: number;
  filterUsage: {
    genre: number;
    year: number;
    rating: number;
    runtime: number;
    surpriseMe: number;
  };
  sessionDuration: number;
  returnVisitorRate: number;
}

export interface TrafficSourceMetrics {
  reddit: {
    visits: number;
    conversions: number;
    topSubreddits: string[];
  };
  organic: {
    visits: number;
    conversions: number;
    topKeywords: string[];
  };
  direct: {
    visits: number;
    conversions: number;
  };
  social: {
    visits: number;
    conversions: number;
    platforms: string[];
  };
}

class AnalyticsTracker {
  private events: AnalyticsEvent[] = [];
  private sessionStartTime: number;
  private isInitialized = false;

  constructor() {
    this.sessionStartTime = Date.now();
    this.loadEvents();
  }

  // Initialize analytics
  init(): void {
    if (this.isInitialized) return;
    
    // Track page load
    this.trackPageView();
    
    // Track session start
    this.trackEvent('session', 'start', 'new_session');
    
    // Track user engagement level
    this.trackUserEngagement();
    
    this.isInitialized = true;
  }

  // Track page view
  trackPageView(): void {
    this.trackEvent('page', 'view', window.location.pathname);
  }

  // Track movie pick
  trackMoviePick(movieId: string, movieTitle: string, filters: any): void {
    this.trackEvent('movie', 'pick', movieTitle, undefined, {
      movieId,
      filters,
      pickNumber: this.getPickCount()
    });
  }

  // Track filter usage
  trackFilterUsage(filterType: string, filterValue: any): void {
    this.trackEvent('filter', 'use', filterType, undefined, {
      filterValue,
      pickNumber: this.getPickCount()
    });
  }

  // Track "Surprise Me" usage
  trackSurpriseMe(filters: any): void {
    this.trackEvent('feature', 'surprise_me', 'random_pick', undefined, {
      filters,
      pickNumber: this.getPickCount()
    });
  }

  // Track video ad events
  trackVideoAd(event: 'shown' | 'clicked' | 'skipped' | 'completed', watchTime?: number): void {
    this.trackEvent('video_ad', event, 'saasbackgrounds', watchTime, {
      adType: 'video',
      skipDelay: 8,
      userEngagementLevel: this.getUserEngagementLevel()
    });
  }

  // Track traffic source
  trackTrafficSource(source: string, medium: string, campaign?: string): void {
    this.trackEvent('traffic', 'source', source, undefined, {
      medium,
      campaign,
      referrer: document.referrer
    });
  }

  // Track user engagement level
  trackUserEngagement(): void {
    const engagementLevel = this.getUserEngagementLevel();
    this.trackEvent('user', 'engagement', engagementLevel, this.getPickCount());
  }

  // Track conversion (video ad click)
  trackConversion(source: string, value?: number): void {
    this.trackEvent('conversion', 'video_ad_click', source, value, {
      userEngagementLevel: this.getUserEngagementLevel(),
      totalPicks: this.getPickCount()
    });
  }

  // Track session end
  trackSessionEnd(): void {
    const sessionDuration = Date.now() - this.sessionStartTime;
    this.trackEvent('session', 'end', 'session_complete', sessionDuration, {
      totalPicks: this.getPickCount(),
      sessionDuration
    });
  }

  // Generic event tracking
  trackEvent(
    category: string,
    action: string,
    label?: string,
    value?: number,
    customParameters?: Record<string, any>
  ): void {
    const event: AnalyticsEvent = {
      event: 'custom_event',
      category,
      action,
      label,
      value,
      customParameters,
      timestamp: Date.now()
    };

    this.events.push(event);
    this.saveEvents();

    // Send to analytics service (if configured)
    this.sendToAnalytics(event);

    // Console log in debug mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event);
    }
  }

  // Get user engagement level
  getUserEngagementLevel(): 'new' | 'learning' | 'active' | 'engaged' {
    const pickCount = this.getPickCount();
    
    if (pickCount <= 5) return 'new';
    if (pickCount <= 15) return 'learning';
    if (pickCount <= 30) return 'active';
    return 'engaged';
  }

  // Get pick count from localStorage
  getPickCount(): number {
    try {
      const count = localStorage.getItem('movie-pick-count');
      return count ? parseInt(count) : 0;
    } catch {
      return 0;
    }
  }

  // Get video ad metrics
  getVideoAdMetrics(): VideoAdMetrics {
    const videoAdEvents = this.events.filter(e => e.category === 'video_ad');
    
    const impressions = videoAdEvents.filter(e => e.action === 'shown').length;
    const clicks = videoAdEvents.filter(e => e.action === 'clicked').length;
    const skips = videoAdEvents.filter(e => e.action === 'skipped').length;
    const completions = videoAdEvents.filter(e => e.action === 'completed').length;
    
    const watchTimes = videoAdEvents
      .filter(e => e.value && e.action === 'completed')
      .map(e => e.value!);
    
    const averageWatchTime = watchTimes.length > 0 
      ? watchTimes.reduce((a, b) => a + b, 0) / watchTimes.length 
      : 0;

    return {
      impressions,
      clicks,
      skipRate: impressions > 0 ? (skips / impressions) * 100 : 0,
      averageWatchTime,
      conversionRate: impressions > 0 ? (clicks / impressions) * 100 : 0,
      revenue: clicks * 2.99 // Estimated revenue per click
    };
  }

  // Get user engagement metrics
  getUserEngagementMetrics(): UserEngagementMetrics {
    const filterEvents = this.events.filter(e => e.category === 'filter');
    const movieEvents = this.events.filter(e => e.category === 'movie');
    const sessionEvents = this.events.filter(e => e.category === 'session');

    const totalPicks = movieEvents.length;
    const sessions = sessionEvents.filter(e => e.action === 'start').length;
    const averagePicksPerSession = sessions > 0 ? totalPicks / sessions : 0;

    const filterUsage = {
      genre: filterEvents.filter(e => e.label === 'genre').length,
      year: filterEvents.filter(e => e.label === 'year').length,
      rating: filterEvents.filter(e => e.label === 'rating').length,
      runtime: filterEvents.filter(e => e.label === 'runtime').length,
      surpriseMe: this.events.filter(e => e.category === 'feature' && e.action === 'surprise_me').length
    };

    const sessionDurations = sessionEvents
      .filter(e => e.value && e.action === 'end')
      .map(e => e.value!);
    
    const averageSessionDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
      : 0;

    return {
      totalPicks,
      averagePicksPerSession,
      filterUsage,
      sessionDuration: averageSessionDuration,
      returnVisitorRate: this.calculateReturnVisitorRate()
    };
  }

  // Get traffic source metrics
  getTrafficSourceMetrics(): TrafficSourceMetrics {
    const trafficEvents = this.events.filter(e => e.category === 'traffic');
    const conversionEvents = this.events.filter(e => e.category === 'conversion');

    const redditVisits = trafficEvents.filter(e => e.label === 'reddit').length;
    const redditConversions = conversionEvents.filter(e => e.customParameters?.source === 'reddit').length;

    const organicVisits = trafficEvents.filter(e => e.label === 'organic').length;
    const organicConversions = conversionEvents.filter(e => e.customParameters?.source === 'organic').length;

    const directVisits = trafficEvents.filter(e => e.label === 'direct').length;
    const directConversions = conversionEvents.filter(e => e.customParameters?.source === 'direct').length;

    const socialVisits = trafficEvents.filter(e => e.label === 'social').length;
    const socialConversions = conversionEvents.filter(e => e.customParameters?.source === 'social').length;

    return {
      reddit: {
        visits: redditVisits,
        conversions: redditConversions,
        topSubreddits: this.getTopSubreddits()
      },
      organic: {
        visits: organicVisits,
        conversions: organicConversions,
        topKeywords: this.getTopKeywords()
      },
      direct: {
        visits: directVisits,
        conversions: directConversions
      },
      social: {
        visits: socialVisits,
        conversions: socialConversions,
        platforms: this.getSocialPlatforms()
      }
    };
  }

  // Calculate return visitor rate
  private calculateReturnVisitorRate(): number {
    const sessions = this.events.filter(e => e.category === 'session' && e.action === 'start').length;
    const uniqueVisitors = new Set(this.events.map(e => e.timestamp)).size;
    
    return sessions > 0 ? (uniqueVisitors / sessions) * 100 : 0;
  }

  // Get top subreddits
  private getTopSubreddits(): string[] {
    const redditEvents = this.events.filter(e => e.category === 'traffic' && e.label === 'reddit');
    const subreddits = redditEvents.map(e => e.customParameters?.subreddit).filter(Boolean);
    
    const counts = subreddits.reduce((acc, subreddit) => {
      acc[subreddit] = (acc[subreddit] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([subreddit]) => subreddit);
  }

  // Get top keywords
  private getTopKeywords(): string[] {
    const organicEvents = this.events.filter(e => e.category === 'traffic' && e.label === 'organic');
    const keywords = organicEvents.map(e => e.customParameters?.keyword).filter(Boolean);
    
    const counts = keywords.reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([keyword]) => keyword);
  }

  // Get social platforms
  private getSocialPlatforms(): string[] {
    const socialEvents = this.events.filter(e => e.category === 'traffic' && e.label === 'social');
    const platforms = socialEvents.map(e => e.customParameters?.platform).filter(Boolean);
    
    return [...new Set(platforms)];
  }

  // Send to analytics service
  private sendToAnalytics(event: AnalyticsEvent): void {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.customParameters
      });
    }

    // Custom analytics endpoint (if configured)
    if (process.env.VITE_ANALYTICS_ENDPOINT) {
      fetch(process.env.VITE_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      }).catch(() => {
        // Silent fail for analytics
      });
    }
  }

  // Save events to localStorage
  private saveEvents(): void {
    try {
      localStorage.setItem('analytics_events', JSON.stringify(this.events.slice(-1000))); // Keep last 1000 events
    } catch {
      // Silent fail if localStorage is full
    }
  }

  // Load events from localStorage
  private loadEvents(): void {
    try {
      const saved = localStorage.getItem('analytics_events');
      if (saved) {
        this.events = JSON.parse(saved);
      }
    } catch {
      this.events = [];
    }
  }

  // Get all events (for debugging)
  getAllEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  // Clear all events (for testing)
  clearEvents(): void {
    this.events = [];
    localStorage.removeItem('analytics_events');
  }

  // Export analytics data
  exportAnalytics(): any {
    return {
      videoAdMetrics: this.getVideoAdMetrics(),
      userEngagementMetrics: this.getUserEngagementMetrics(),
      trafficSourceMetrics: this.getTrafficSourceMetrics(),
      events: this.events,
      timestamp: Date.now()
    };
  }
}

// Create singleton instance
export const analytics = new AnalyticsTracker();

// Initialize on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    analytics.init();
  });

  // Track session end on page unload
  window.addEventListener('beforeunload', () => {
    analytics.trackSessionEnd();
  });
}

// Make analytics globally available for debugging
if (typeof window !== 'undefined') {
  (window as any).analytics = analytics;
}

export default analytics;