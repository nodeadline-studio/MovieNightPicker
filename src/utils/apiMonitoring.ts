// API Monitoring Service for MovieNightPicker
// Monitors TMDB API health, performance, and provides fallback mechanisms

export interface APIMetrics {
  responseTime: number;
  statusCode: number;
  success: boolean;
  error?: string;
  timestamp: number;
  endpoint: string;
  dataQuality?: number;
}

export interface APIHealthStatus {
  isHealthy: boolean;
  lastCheck: number;
  uptime: number;
  averageResponseTime: number;
  errorRate: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

export interface APIFallbackStrategy {
  type: 'cached' | 'static' | 'degraded' | 'offline';
  data?: any;
  timestamp: number;
  reason: string;
}

class APIMonitoringService {
  private metrics: APIMetrics[] = [];
  private healthStatus: APIHealthStatus;
  private fallbackData: Map<string, any> = new Map();
  private alertCallbacks: ((alert: any) => void)[] = [];
  private isMonitoring = false;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.healthStatus = {
      isHealthy: true,
      lastCheck: Date.now(),
      uptime: 100,
      averageResponseTime: 0,
      errorRate: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0
    };
    
    this.loadFallbackData();
    this.startMonitoring();
  }

  // Start continuous monitoring
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Check API health every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkAPIHealth();
    }, 30000);
    
    console.log('🔍 API Monitoring started');
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
    console.log('🔍 API Monitoring stopped');
  }

  // Monitor API call
  async monitorAPICall<T>(
    endpoint: string,
    apiCall: () => Promise<T>,
    fallbackData?: T
  ): Promise<T> {
    const startTime = Date.now();
    const timestamp = Date.now();
    
    try {
      // Make the API call
      const result = await apiCall();
      const responseTime = Date.now() - startTime;
      
      // Record successful call
      this.recordMetric({
        responseTime,
        statusCode: 200,
        success: true,
        timestamp,
        endpoint,
        dataQuality: this.assessDataQuality(result)
      });
      
      // Update fallback data
      if (fallbackData === undefined) {
        this.updateFallbackData(endpoint, result);
      }
      
      return result;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Record failed call
      this.recordMetric({
        responseTime,
        statusCode: 500,
        success: false,
        error: errorMessage,
        timestamp,
        endpoint
      });
      
      // Trigger alert
      this.triggerAlert({
        type: 'api_failure',
        endpoint,
        error: errorMessage,
        timestamp
      });
      
      // Return fallback data if available
      const fallback = this.getFallbackData(endpoint);
      if (fallback) {
        console.warn(`⚠️ Using fallback data for ${endpoint}:`, errorMessage);
        return fallback;
      }
      
      throw error;
    }
  }

  // Check API health
  private async checkAPIHealth(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test API with a simple call
      const response = await fetch('https://api.themoviedb.org/3/configuration', {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`
        }
      });
      
      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;
      
      this.recordMetric({
        responseTime,
        statusCode: response.status,
        success: isHealthy,
        timestamp: Date.now(),
        endpoint: 'health-check'
      });
      
      // Update health status
      this.updateHealthStatus(isHealthy, responseTime);
      
      if (!isHealthy) {
        this.triggerAlert({
          type: 'api_health_degraded',
          statusCode: response.status,
          responseTime,
          timestamp: Date.now()
        });
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.recordMetric({
        responseTime,
        statusCode: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        timestamp: Date.now(),
        endpoint: 'health-check'
      });
      
      this.updateHealthStatus(false, responseTime);
      
      this.triggerAlert({
        type: 'api_health_failure',
        error: error instanceof Error ? error.message : 'Network error',
        responseTime,
        timestamp: Date.now()
      });
    }
  }

  // Record API metric
  private recordMetric(metric: APIMetrics): void {
    this.metrics.push(metric);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
    
    // Update health status
    this.updateHealthStatusFromMetrics();
    
    // Save metrics to localStorage
    this.saveMetrics();
  }

  // Update health status from metrics
  private updateHealthStatusFromMetrics(): void {
    const recentMetrics = this.metrics.slice(-100); // Last 100 metrics
    const totalRequests = recentMetrics.length;
    const successfulRequests = recentMetrics.filter(m => m.success).length;
    const failedRequests = totalRequests - successfulRequests;
    
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;
    
    this.healthStatus = {
      isHealthy: errorRate < 10, // Consider healthy if error rate < 10%
      lastCheck: Date.now(),
      uptime: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100,
      averageResponseTime,
      errorRate,
      totalRequests,
      successfulRequests,
      failedRequests
    };
  }

  // Update health status
  private updateHealthStatus(isHealthy: boolean, responseTime: number): void {
    this.healthStatus.isHealthy = isHealthy;
    this.healthStatus.lastCheck = Date.now();
    this.healthStatus.averageResponseTime = responseTime;
  }

  // Assess data quality
  private assessDataQuality(data: any): number {
    if (!data) return 0;
    
    let quality = 100;
    
    // Check for required fields in movie data
    if (data.results && Array.isArray(data.results)) {
      const movies = data.results;
      const validMovies = movies.filter((movie: any) => 
        movie.id && movie.title && movie.poster_path
      );
      
      quality = (validMovies.length / movies.length) * 100;
    }
    
    return Math.round(quality);
  }

  // Update fallback data
  private updateFallbackData(endpoint: string, data: any): void {
    this.fallbackData.set(endpoint, {
      data,
      timestamp: Date.now()
    });
    
    // Save to localStorage
    this.saveFallbackData();
  }

  // Get fallback data
  getFallbackData(endpoint: string): any {
    const fallback = this.fallbackData.get(endpoint);
    if (fallback && Date.now() - fallback.timestamp < 3600000) { // 1 hour old
      return fallback.data;
    }
    return null;
  }

  // Trigger alert
  private triggerAlert(alert: any): void {
    console.error('🚨 API Alert:', alert);
    
    // Call alert callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Alert callback error:', error);
      }
    });
    
    // Send to external monitoring service if configured
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
      (window as any).Sentry.captureException(new Error(`API Alert: ${alert.type}`), {
        extra: alert
      });
    }
    
    // Send to custom monitoring endpoint if configured
    if (import.meta.env.VITE_MONITORING_ENDPOINT) {
      fetch(import.meta.env.VITE_MONITORING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: 'movie-night-picker',
          alert,
          timestamp: Date.now()
        })
      }).catch(() => {
        // Silent fail for monitoring
      });
    }
  }

  // Get current health status
  getHealthStatus(): APIHealthStatus {
    return { ...this.healthStatus };
  }

  // Get recent metrics
  getRecentMetrics(limit: number = 50): APIMetrics[] {
    return this.metrics.slice(-limit);
  }

  // Get metrics summary
  getMetricsSummary(): any {
    const recentMetrics = this.metrics.slice(-100);
    const totalRequests = recentMetrics.length;
    const successfulRequests = recentMetrics.filter(m => m.success).length;
    const failedRequests = totalRequests - successfulRequests;
    
    const responseTimes = recentMetrics.map(m => m.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    
    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100,
      averageResponseTime: Math.round(avgResponseTime),
      maxResponseTime,
      minResponseTime,
      errorRate: totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0,
      isHealthy: this.healthStatus.isHealthy
    };
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics = [];
    localStorage.removeItem('api_metrics');
  }

  // Save metrics to localStorage
  private saveMetrics(): void {
    try {
      localStorage.setItem('api_metrics', JSON.stringify(this.metrics.slice(-100)));
    } catch {
      // Silent fail if localStorage is full
    }
  }

  // Load metrics from localStorage
  private loadMetrics(): void {
    try {
      const saved = localStorage.getItem('api_metrics');
      if (saved) {
        this.metrics = JSON.parse(saved);
      }
    } catch {
      this.metrics = [];
    }
  }

  // Save fallback data
  private saveFallbackData(): void {
    try {
      const data = Object.fromEntries(this.fallbackData);
      localStorage.setItem('api_fallback_data', JSON.stringify(data));
    } catch {
      // Silent fail if localStorage is full
    }
  }

  // Load fallback data
  private loadFallbackData(): void {
    try {
      const saved = localStorage.getItem('api_fallback_data');
      if (saved) {
        const data = JSON.parse(saved);
        this.fallbackData = new Map(Object.entries(data));
      }
    } catch {
      this.fallbackData = new Map();
    }
  }

  // Export monitoring data
  exportMonitoringData(): any {
    return {
      healthStatus: this.getHealthStatus(),
      metricsSummary: this.getMetricsSummary(),
      recentMetrics: this.getRecentMetrics(100),
      fallbackData: Object.fromEntries(this.fallbackData),
      timestamp: Date.now()
    };
  }
}

// Create singleton instance
export const apiMonitoring = new APIMonitoringService();

// Make globally available for debugging
if (typeof window !== 'undefined') {
  (window as any).apiMonitoring = apiMonitoring;
}

export default apiMonitoring; 