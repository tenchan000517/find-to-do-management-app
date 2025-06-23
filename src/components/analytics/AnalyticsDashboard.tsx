'use client';

import { useState, useEffect } from 'react';
import OverviewMetrics from './OverviewMetrics';
import TrafficTrendChart from './TrafficTrendChart';
import PagePerformanceTable from './PagePerformanceTable';
import RealtimeStatus from './RealtimeStatus';
import SEOInsightsPanel from './SEOInsightsPanel';

interface AnalyticsData {
  success: boolean;
  timeRange: {
    days: number;
    startDate: string;
    endDate: string;
  };
  data: {
    ga4: {
      summary: {
        sessions: number;
        users: number;
        pageViews: number;
        bounceRate: number;
        avgSessionDuration: number;
        eventsPerSession: number;
      };
      byChannel: Array<any>;
      byPage: Array<any>;
      byDevice: Array<any>;
    };
    searchConsole: {
      summary: {
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
      };
      byQuery: Array<any>;
      byPage: Array<any>;
      byCountry: Array<any>;
      byDevice: Array<any>;
    };
    realtime: {
      activeUsers: number;
      byCountry: Array<any>;
      byDevice: Array<any>;
    };
    combined: {
      overview: {
        organicTraffic: {
          sessions: number;
          clicks: number;
          impressions: number;
          ctr: number;
          avgPosition: number;
        };
        engagement: {
          totalSessions: number;
          totalUsers: number;
          pageViews: number;
          bounceRate: number;
          avgSessionDuration: number;
        };
      };
      topPerformingPages: Array<any>;
      trafficSources: {
        ga4Channels: Array<any>;
        searchQueries: Array<any>;
      };
      deviceBreakdown: {
        ga4: Array<any>;
        searchConsole: Array<any>;
      };
    };
  };
  errors: Array<any>;
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(7);

  const fetchData = async (days: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/dashboard?days=${days}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const result = await response.json();
      
      // Debug logging
      console.log('Analytics API Response:', result);
      console.log('GA4 Data:', result.data?.ga4);
      console.log('Search Console Data:', result.data?.searchConsole);
      console.log('Combined Data:', result.data?.combined);
      
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedPeriod);
  }, [selectedPeriod]);

  const handlePeriodChange = (days: number) => {
    setSelectedPeriod(days);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">エラーが発生しました</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => fetchData(selectedPeriod)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          再試行
        </button>
      </div>
    );
  }

  if (!data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          データ期間: {data.timeRange.startDate} - {data.timeRange.endDate}
        </h2>
        <div className="flex space-x-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => handlePeriodChange(days)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedPeriod === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {days}日間
            </button>
          ))}
        </div>
      </div>

      {/* Realtime Status */}
      {data.data.realtime && (
        <RealtimeStatus data={data.data.realtime} />
      )}

      {/* Overview Metrics */}
      {data.data.combined?.overview ? (
        <OverviewMetrics data={data.data.combined.overview} />
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse mr-3"></div>
            <h3 className="text-yellow-800 font-semibold">データ準備中</h3>
          </div>
          <p className="text-yellow-700 mt-2">
            GA4とSearch Consoleのデータを取得中です。しばらくお待ちください。
          </p>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.data.ga4 && data.data.searchConsole ? (
          <TrafficTrendChart 
            ga4Data={data.data.ga4} 
            searchConsoleData={data.data.searchConsole} 
          />
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-4xl mb-2">📊</div>
              <h3 className="text-gray-600 font-medium">トラフィック推移</h3>
              <p className="text-gray-500 text-sm mt-1">GA4データ接続待ち</p>
            </div>
          </div>
        )}
        
        {data.data.searchConsole ? (
          <SEOInsightsPanel data={data.data.searchConsole} />
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-4xl mb-2">🔍</div>
              <h3 className="text-gray-600 font-medium">SEOインサイト</h3>
              <p className="text-gray-500 text-sm mt-1">Search Console接続待ち</p>
            </div>
          </div>
        )}
      </div>

      {/* Page Performance Table */}
      <PagePerformanceTable 
        topPages={data.data.combined?.topPerformingPages || []}
        ga4Pages={data.data.ga4?.byPage || []}
        searchConsolePages={data.data.searchConsole?.byPage || []}
      />

      {/* Data Status Information */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">データ取得状況</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className={`flex items-center ${data.data.ga4 ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${data.data.ga4 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>GA4: {data.data.ga4 ? '接続済み' : '未接続'}</span>
          </div>
          <div className={`flex items-center ${data.data.searchConsole ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${data.data.searchConsole ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>Search Console: {data.data.searchConsole ? '接続済み' : '未接続'}</span>
          </div>
          <div className={`flex items-center ${data.data.realtime ? 'text-green-600' : 'text-yellow-600'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${data.data.realtime ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span>リアルタイム: {data.data.realtime ? '利用可能' : '一時的に利用不可'}</span>
          </div>
        </div>
        {data.errors && data.errors.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-red-600 font-medium">エラー:</p>
            <ul className="text-xs text-red-500 mt-1 space-y-1">
              {data.errors.map((error: any, index: number) => (
                <li key={index}>• {error.service}: {error.message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}