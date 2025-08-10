// Video Ad Monitoring Service for MovieNightPicker
// Monitors video ad performance, debugging, and fallback mechanisms

export interface AdMetrics {
  adId: string;
  adType: 'video' | 'google';
  startTime: number;
  endTime?: number;
  duration: number;
  watchTime: number;
  wasSkipped: boolean;
  wasClicked: boolean;
  wasCompleted: boolean;
  error?: string;
  userEngagementLevel: string;
  timestamp: number;
}

export interface AdPerformanceSummary {
  totalAds: number;
  totalImpressions: number;
  totalClicks: number;
  totalSkips: number;
  totalCompletions: number;
  averageWatchTime: number;
  clickThroughRate: number;
  skipRate: number;
  completionRate: number;
  errorRate: number;
  revenue: number;
}

export interface AdFallbackStrategy {
  type: 'static' | 'text' | 'banner' | 'none';
  reason: string;
  timestamp: number;
  adId?: string;
}

class AdMonitoringService {
  private metrics: AdMetrics[] = [];
  private performanceSummary: AdPerformanceSummary;
  private fallbackStrategies: AdFallbackStrategy[] = [];
  private alertCallbacks: ((alert: any) => void)[] = [];
  private isMonitoring = false;
  private currentAd: AdMetrics | null = null;

  constructor() {
    this.performanceSummary = {
      totalAds: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalSkips: 0,
      totalCompletions: 0,
      averageWatchTime: 0,
      clickThroughRate: 0,
      skipRate: 0,
      completionRate: 0,
      errorRate: 0,
      revenue: 0
    };
    
    this.loadMetrics();
    this.startMonitoring();
  }

  // Start monitoring
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🎬 Ad Monitoring started');
  }

  // Stop monitoring
  stopMonitoring(): void {
    this.isMonitoring = false;
    console.log('🎬 Ad Monitoring stopped');
  }

  // Track ad impression
  trackAdImpression(adId: string, adType: 'video' | 'google'): void {
    const metric: AdMetrics = {
      adId,
      adType,
      startTime: Date.now(),
      duration: 0,
      watchTime: 0,
      wasSkipped: false,
      wasClicked: false,
      wasCompleted: false,
      userEngagementLevel: this.getUserEngagementLevel(),
      timestamp: Date.now()
    };

    this.currentAd = metric;
    this.metrics.push(metric);
    
    this.updatePerformanceSummary();
    this.saveMetrics();
    
    console.log('🎬 Ad impression tracked:', adId);
  }

  // Track ad click
  trackAdClick(adId: string, revenue: number = 2.99): void {
    if (this.currentAd && this.currentAd.adId === adId) {
      this.currentAd.wasClicked = true;
      this.currentAd.endTime = Date.now();
      this.currentAd.duration = this.currentAd.endTime - this.currentAd.startTime;
      this.currentAd.watchTime = this.currentAd.duration;
    }

    // Find and update the metric
    const metric = this.metrics.find(m => m.adId === adId);
    if (metric) {
      metric.wasClicked = true;
      metric.endTime = Date.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.watchTime = metric.duration;
    }

    this.updatePerformanceSummary();
    this.saveMetrics();

    // Track conversion
    this.trackConversion(adId, revenue);
    
    console.log('🎬 Ad click tracked:', adId, 'Revenue:', revenue);
  }

  // Track ad skip
  trackAdSkip(adId: string): void {
    if (this.currentAd && this.currentAd.adId === adId) {
      this.currentAd.wasSkipped = true;
      this.currentAd.endTime = Date.now();
      this.currentAd.duration = this.currentAd.endTime - this.currentAd.startTime;
      this.currentAd.watchTime = this.currentAd.duration;
    }

    // Find and update the metric
    const metric = this.metrics.find(m => m.adId === adId);
    if (metric) {
      metric.wasSkipped = true;
      metric.endTime = Date.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.watchTime = metric.duration;
    }

    this.updatePerformanceSummary();
    this.saveMetrics();
    
    console.log('🎬 Ad skip tracked:', adId);
  }

  // Track ad completion
  trackAdCompletion(adId: string): void {
    if (this.currentAd && this.currentAd.adId === adId) {
      this.currentAd.wasCompleted = true;
      this.currentAd.endTime = Date.now();
      this.currentAd.duration = this.currentAd.endTime - this.currentAd.startTime;
      this.currentAd.watchTime = this.currentAd.duration;
    }

    // Find and update the metric
    const metric = this.metrics.find(m => m.adId === adId);
    if (metric) {
      metric.wasCompleted = true;
      metric.endTime = Date.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.watchTime = metric.duration;
    }

    this.updatePerformanceSummary();
    this.saveMetrics();
    
    console.log('🎬 Ad completion tracked:', adId);
  }

  // Track ad error
  trackAdError(adId: string, error: string): void {
    if (this.currentAd && this.currentAd.adId === adId) {
      this.currentAd.error = error;
      this.currentAd.endTime = Date.now();
      this.currentAd.duration = this.currentAd.endTime - this.currentAd.startTime;
    }

    // Find and update the metric
    const metric = this.metrics.find(m => m.adId === adId);
    if (metric) {
      metric.error = error;
      metric.endTime = Date.now();
      metric.duration = metric.endTime - metric.startTime;
    }

    this.updatePerformanceSummary();
    this.saveMetrics();

    // Trigger alert
    this.triggerAlert({
      type: 'ad_error',
      adId,
      error,
      timestamp: Date.now()
    });
    
    console.error('🎬 Ad error tracked:', adId, error);
  }

  // Track conversion
  private trackConversion(adId: string, revenue: number): void {
    // Send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        send_to: 'AW-CONVERSION_ID/CONVERSION_LABEL',
        value: revenue,
        currency: 'USD',
        transaction_id: adId
      });
    }

    // Send to custom analytics
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.trackConversion('video_ad', revenue);
    }
  }

  // Update performance summary
  private updatePerformanceSummary(): void {
    const totalAds = this.metrics.length;
    const totalImpressions = totalAds;
    const totalClicks = this.metrics.filter(m => m.wasClicked).length;
    const totalSkips = this.metrics.filter(m => m.wasSkipped).length;
    const totalCompletions = this.metrics.filter(m => m.wasCompleted).length;
    const totalErrors = this.metrics.filter(m => m.error).length;

    const watchTimes = this.metrics.map(m => m.watchTime).filter(t => t > 0);
    const averageWatchTime = watchTimes.length > 0 
      ? watchTimes.reduce((a, b) => a + b, 0) / watchTimes.length 
      : 0;

    const clickThroughRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const skipRate = totalImpressions > 0 ? (totalSkips / totalImpressions) * 100 : 0;
    const completionRate = totalImpressions > 0 ? (totalCompletions / totalImpressions) * 100 : 0;
    const errorRate = totalImpressions > 0 ? (totalErrors / totalImpressions) * 100 : 0;
    const revenue = totalClicks * 2.99; // Estimated revenue per click

    this.performanceSummary = {
      totalAds,
      totalImpressions,
      totalClicks,
      totalSkips,
      totalCompletions,
      averageWatchTime: Math.round(averageWatchTime),
      clickThroughRate: Math.round(clickThroughRate * 100) / 100,
      skipRate: Math.round(skipRate * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      revenue: Math.round(revenue * 100) / 100
    };
  }

  // Get user engagement level
  private getUserEngagementLevel(): string {
    try {
      const pickCount = localStorage.getItem('movie-pick-count');
      const count = pickCount ? parseInt(pickCount) : 0;
      
      if (count <= 5) return 'new';
      if (count <= 15) return 'learning';
      if (count <= 30) return 'active';
      return 'engaged';
    } catch {
      return 'unknown';
    }
  }

  // Trigger alert
  private triggerAlert(alert: any): void {
    console.error('🚨 Ad Alert:', alert);
    
    // Call alert callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Ad alert callback error:', error);
      }
    });
    
    // Send to external monitoring service
    this.sendToMonitoringService(alert);
  }

  // Add alert callback
  onAlert(callback: (alert: any) => void): void {
    this.alertCallbacks.push(callback);
  }

  // Send to monitoring service
  private sendToMonitoringService(alert: any): void {
    // Send to Sentry if configured
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(new Error(`Ad Alert: ${alert.type}`), {
        extra: alert
      });
    }
    
    // Send to custom monitoring endpoint if configured
    if (process.env.VITE_MONITORING_ENDPOINT) {
      fetch(process.env.VITE_MONITORING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: 'movie-night-picker-ads',
          alert,
          timestamp: Date.now()
        })
      }).catch(() => {
        // Silent fail for monitoring
      });
    }
  }

  // Get performance summary
  getPerformanceSummary(): AdPerformanceSummary {
    return { ...this.performanceSummary };
  }

  // Get recent metrics
  getRecentMetrics(limit: number = 50): AdMetrics[] {
    return this.metrics.slice(-limit);
  }

  // Get metrics by engagement level
  getMetricsByEngagementLevel(): Record<string, AdMetrics[]> {
    const grouped: Record<string, AdMetrics[]> = {};
    
    this.metrics.forEach(metric => {
      const level = metric.userEngagementLevel;
      if (!grouped[level]) {
        grouped[level] = [];
      }
      grouped[level].push(metric);
    });
    
    return grouped;
  }

  // Get current ad
  getCurrentAd(): AdMetrics | null {
    return this.currentAd ? { ...this.currentAd } : null;
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics = [];
    this.currentAd = null;
    this.updatePerformanceSummary();
    localStorage.removeItem('ad_metrics');
  }

  // Save metrics to localStorage
  private saveMetrics(): void {
    try {
      localStorage.setItem('ad_metrics', JSON.stringify(this.metrics.slice(-100)));
    } catch {
      // Silent fail if localStorage is full
    }
  }

  // Load metrics from localStorage
  private loadMetrics(): void {
    try {
      const saved = localStorage.getItem('ad_metrics');
      if (saved) {
        this.metrics = JSON.parse(saved);
        this.updatePerformanceSummary();
      }
    } catch {
      this.metrics = [];
    }
  }

  // Export monitoring data
  exportMonitoringData(): any {
    return {
      performanceSummary: this.getPerformanceSummary(),
      recentMetrics: this.getRecentMetrics(100),
      metricsByEngagement: this.getMetricsByEngagementLevel(),
      currentAd: this.getCurrentAd(),
      fallbackStrategies: this.fallbackStrategies,
      timestamp: Date.now()
    };
  }

  // Debug ad issues
  debugAdIssues(adId: string): any {
    const metric = this.metrics.find(m => m.adId === adId);
    if (!metric) {
      return { error: 'Ad not found' };
    }

    const issues = [];
    
    if (metric.error) {
      issues.push(`Error: ${metric.error}`);
    }
    
    if (metric.watchTime < 1000) {
      issues.push('Very short watch time (< 1 second)');
    }
    
    if (metric.wasSkipped && metric.watchTime < 5000) {
      issues.push('Skipped very quickly (< 5 seconds)');
    }
    
    if (!metric.wasClicked && !metric.wasSkipped && !metric.wasCompleted) {
      issues.push('Incomplete ad interaction');
    }

    return {
      adId,
      issues,
      metric,
      recommendations: this.getRecommendations(issues)
    };
  }

  // Get recommendations based on issues
  private getRecommendations(issues: string[]): string[] {
    const recommendations = [];
    
    if (issues.some(i => i.includes('Error'))) {
      recommendations.push('Check video file availability and format');
      recommendations.push('Verify ad service configuration');
    }
    
    if (issues.some(i => i.includes('short watch time'))) {
      recommendations.push('Optimize video content for better engagement');
      recommendations.push('Consider shorter ad duration');
    }
    
    if (issues.some(i => i.includes('Skipped very quickly'))) {
      recommendations.push('Improve ad content quality');
      recommendations.push('Consider different ad placement');
    }
    
    if (issues.some(i => i.includes('Incomplete ad interaction'))) {
      recommendations.push('Check ad loading and display logic');
      recommendations.push('Verify user interaction tracking');
    }
    
    return recommendations;
  }
}

// Create singleton instance
export const adMonitoring = new AdMonitoringService();

// Make globally available for debugging
if (typeof window !== 'undefined') {
  (window as any).adMonitoring = adMonitoring;
}

export default adMonitoring; 