import React, { useState, useEffect } from 'react';
import { 
  Activity, AlertTriangle, CheckCircle, 
  X, Eye, DollarSign, Clock
} from 'lucide-react';
import apiMonitoring from '../utils/apiMonitoring';
import adMonitoring from '../utils/adMonitoring';
import analytics from '../utils/analytics';
import type { APIHealthStatus } from '../utils/apiMonitoring';
import type { AdPerformanceSummary } from '../utils/adMonitoring';

interface ProductionDebuggerProps {
  isOpen: boolean;
  onClose: () => void;
  refreshInterval?: number;
}

type TabId = 'overview' | 'api' | 'ads' | 'analytics' | 'debug';

const ProductionDebugger: React.FC<ProductionDebuggerProps> = ({ 
  isOpen, 
  onClose, 
  refreshInterval = 5000 
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [apiHealth, setApiHealth] = useState<APIHealthStatus | null>(null);
  const [adPerformance, setAdPerformance] = useState<AdPerformanceSummary | null>(null);
  const [analyticsData, setAnalyticsData] = useState<Record<string, unknown> | null>(null);
  const [debugLogs, setDebugLogs] = useState<Array<{ type: string; message: string; timestamp: number }>>([]);

  useEffect(() => {
    if (!isOpen) return;

    const updateData = () => {
      setApiHealth(apiMonitoring.getHealthStatus());
      setAdPerformance(adMonitoring.getPerformanceSummary());
      setAnalyticsData(analytics.exportAnalytics());
    };

    updateData();
    const interval = setInterval(updateData, refreshInterval);

    return () => clearInterval(interval);
  }, [isOpen, refreshInterval]);

  useEffect(() => {
    // Capture console logs for debugging
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args: unknown[]) => {
      originalLog.apply(console, args);
      setDebugLogs(prev => [...prev.slice(-50), { type: 'log', message: args.join(' '), timestamp: Date.now() }]);
    };

    console.error = (...args: unknown[]) => {
      originalError.apply(console, args);
      setDebugLogs(prev => [...prev.slice(-50), { type: 'error', message: args.join(' '), timestamp: Date.now() }]);
    };

    console.warn = (...args: unknown[]) => {
      originalWarn.apply(console, args);
      setDebugLogs(prev => [...prev.slice(-50), { type: 'warn', message: args.join(' '), timestamp: Date.now() }]);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[10000]">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6" />
            <h2 className="text-xl font-bold">Production Debugger</h2>
            <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
              LIVE
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-1 p-4">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'api', label: 'API Health', icon: CheckCircle },
              { id: 'ads', label: 'Ad Performance', icon: DollarSign },
              { id: 'analytics', label: 'Analytics', icon: Activity },
              { id: 'debug', label: 'Debug Logs', icon: AlertTriangle }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as TabId)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {activeTab === 'overview' && <OverviewTab apiHealth={apiHealth} adPerformance={adPerformance} analyticsData={analyticsData} />}
          {activeTab === 'api' && <APITab apiHealth={apiHealth} />}
          {activeTab === 'ads' && <AdsTab adPerformance={adPerformance} />}
          {activeTab === 'analytics' && <AnalyticsTab analyticsData={analyticsData} />}
          {activeTab === 'debug' && <DebugTab debugLogs={debugLogs} />}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm">
                <span>Refresh:</span>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={1000}>1s</option>
                  <option value={5000}>5s</option>
                  <option value={10000}>10s</option>
                  <option value={30000}>30s</option>
                </select>
              </label>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Overview Tab
const OverviewTab: React.FC<{ apiHealth: APIHealthStatus | null; adPerformance: AdPerformanceSummary | null; analyticsData: Record<string, unknown> | null }> = ({
  apiHealth,
  adPerformance,
  analyticsData
}) => {
  const getStatusColor = (isHealthy: boolean) => isHealthy ? 'text-green-600' : 'text-red-600';
  const getStatusIcon = (isHealthy: boolean) => isHealthy ? CheckCircle : AlertTriangle;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">System Overview</h3>
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* API Health */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">API Health</h4>
              <p className={`text-sm ${getStatusColor(apiHealth?.isHealthy)}`}>
                {apiHealth?.isHealthy ? 'Healthy' : 'Issues Detected'}
              </p>
            </div>
            {apiHealth && React.createElement(getStatusIcon(apiHealth.isHealthy), { className: `w-6 h-6 ${getStatusColor(apiHealth.isHealthy)}` })}
          </div>
          {apiHealth && (
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <div>Uptime: {apiHealth.uptime.toFixed(1)}%</div>
              <div>Avg Response: {apiHealth.averageResponseTime}ms</div>
              <div>Error Rate: {apiHealth.errorRate.toFixed(1)}%</div>
            </div>
          )}
        </div>

        {/* Ad Performance */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Ad Performance</h4>
              <p className="text-sm text-gray-600">
                ${adPerformance?.revenue || 0} Revenue
              </p>
            </div>
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          {adPerformance && (
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <div>CTR: {adPerformance.clickThroughRate}%</div>
              <div>Skip Rate: {adPerformance.skipRate}%</div>
              <div>Impressions: {adPerformance.totalImpressions}</div>
            </div>
          )}
        </div>

        {/* User Engagement */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">User Engagement</h4>
              <p className="text-sm text-gray-600">
                {analyticsData?.userEngagementMetrics?.totalPicks || 0} Picks
              </p>
            </div>
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
          {analyticsData?.userEngagementMetrics && (
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <div>Avg Picks/Session: {analyticsData.userEngagementMetrics.averagePicksPerSession.toFixed(1)}</div>
              <div>Return Rate: {analyticsData.userEngagementMetrics.returnVisitorRate.toFixed(1)}%</div>
              <div>Session Duration: {Math.round(analyticsData.userEngagementMetrics.sessionDuration / 1000)}s</div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              apiMonitoring.clearMetrics();
              adMonitoring.clearMetrics();
              analytics.clearEvents();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Clear All Metrics
          </button>
          <button
            onClick={() => {
              const data = {
                api: apiMonitoring.exportMonitoringData(),
                ads: adMonitoring.exportMonitoringData(),
                analytics: analytics.exportAnalytics()
              };
              console.log('Production Debug Data:', data);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Export Debug Data
          </button>
        </div>
      </div>
    </div>
  );
};

// API Tab
const APITab: React.FC<{ apiHealth: APIHealthStatus | null }> = ({ apiHealth }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">API Health Monitoring</h3>
      
      {apiHealth ? (
        <div className="space-y-4">
          {/* Health Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Health Status</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className={`font-medium ${apiHealth.isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                  {apiHealth.isHealthy ? 'Healthy' : 'Unhealthy'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Uptime</div>
                <div className="font-medium">{apiHealth.uptime.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Avg Response</div>
                <div className="font-medium">{apiHealth.averageResponseTime}ms</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Error Rate</div>
                <div className="font-medium">{apiHealth.errorRate.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Request Statistics */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Request Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Requests</div>
                <div className="font-medium">{apiHealth.totalRequests}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Successful</div>
                <div className="font-medium text-green-600">{apiHealth.successfulRequests}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Failed</div>
                <div className="font-medium text-red-600">{apiHealth.failedRequests}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Last Check</div>
                <div className="font-medium">{new Date(apiHealth.lastCheck).toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Loading API health data...</p>
        </div>
      )}
    </div>
  );
};

// Ads Tab
const AdsTab: React.FC<{ adPerformance: AdPerformanceSummary | null }> = ({ adPerformance }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Ad Performance Monitoring</h3>
      
      {adPerformance ? (
        <div className="space-y-4">
          {/* Performance Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Performance Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Ads</div>
                <div className="font-medium">{adPerformance.totalAds}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Impressions</div>
                <div className="font-medium">{adPerformance.totalImpressions}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Clicks</div>
                <div className="font-medium text-green-600">{adPerformance.totalClicks}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Revenue</div>
                <div className="font-medium text-green-600">${adPerformance.revenue}</div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Click Rate</div>
                <div className="font-medium">{adPerformance.clickThroughRate}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Skip Rate</div>
                <div className="font-medium text-orange-600">{adPerformance.skipRate}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Completion Rate</div>
                <div className="font-medium">{adPerformance.completionRate}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Avg Watch Time</div>
                <div className="font-medium">{adPerformance.averageWatchTime}ms</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Loading ad performance data...</p>
        </div>
      )}
    </div>
  );
};

// Analytics Tab
const AnalyticsTab: React.FC<{ analyticsData: Record<string, unknown> | null }> = ({ analyticsData }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Analytics Overview</h3>
      
      {analyticsData ? (
        <div className="space-y-4">
          {/* User Engagement */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">User Engagement</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Picks</div>
                <div className="font-medium">{analyticsData.userEngagementMetrics?.totalPicks || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Avg Picks/Session</div>
                <div className="font-medium">{analyticsData.userEngagementMetrics?.averagePicksPerSession?.toFixed(1) || 0}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Return Rate</div>
                <div className="font-medium">{analyticsData.userEngagementMetrics?.returnVisitorRate?.toFixed(1) || 0}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Session Duration</div>
                <div className="font-medium">{Math.round((analyticsData.userEngagementMetrics?.sessionDuration || 0) / 1000)}s</div>
              </div>
            </div>
          </div>

          {/* Filter Usage */}
          {analyticsData.userEngagementMetrics?.filterUsage && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Filter Usage</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(analyticsData.userEngagementMetrics.filterUsage).map(([filter, count]) => (
                  <div key={filter}>
                    <div className="text-sm text-gray-600 capitalize">{filter}</div>
                    <div className="font-medium">{count as number}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Loading analytics data...</p>
        </div>
      )}
    </div>
  );
};

// Debug Tab
const DebugTab: React.FC<{ debugLogs: Array<{ type: string; message: string; timestamp: number }> }> = ({ debugLogs }) => {
  const getLogColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const clearLogs = () => {
    // This would need to be passed down from parent or use a callback
    console.log('Clear logs clicked');
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Debug Logs</h3>
      
      <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
        {debugLogs.length === 0 ? (
          <div className="text-gray-500">No debug logs yet...</div>
        ) : (
          debugLogs.map((log, index) => (
            <div key={index} className={`mb-1 p-1 rounded ${getLogColor(log.type)}`}>
              <span className="text-gray-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span className="ml-2">{log.message}</span>
            </div>
          ))
        )}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={clearLogs}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
        >
          Clear Logs
        </button>
        <button
          onClick={() => {
            console.log('=== DEBUG LOGS EXPORT ===');
            console.log(debugLogs);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          Export Logs
        </button>
      </div>
    </div>
  );
};

export default ProductionDebugger; 