import { GoogleAuthService } from './google-auth-service';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { ga4RateLimiter, retryWithBackoff } from '@/lib/utils/rate-limiter';

export interface GA4Metrics {
  sessions: number;
  users: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
  eventsPerSession: number;
}

export interface GA4DimensionData {
  dimension: string;
  metrics: GA4Metrics;
}

export interface GA4ReportResponse {
  summary: GA4Metrics;
  byChannel: GA4DimensionData[];
  byPage: GA4DimensionData[];
  byDevice: GA4DimensionData[];
  timeRange: {
    startDate: string;
    endDate: string;
  };
}

export class GA4ReportsService {
  private static instance: GA4ReportsService;
  private ga4Client: BetaAnalyticsDataClient | null = null;
  private propertyId: string;

  private constructor() {
    this.propertyId = process.env.GA4_PROPERTY_ID || '';
    if (!this.propertyId) {
      throw new Error('GA4_PROPERTY_ID is not configured');
    }
  }

  public static getInstance(): GA4ReportsService {
    if (!GA4ReportsService.instance) {
      GA4ReportsService.instance = new GA4ReportsService();
    }
    return GA4ReportsService.instance;
  }

  private async getClient(): Promise<BetaAnalyticsDataClient> {
    if (!this.ga4Client) {
      const authService = GoogleAuthService.getInstance();
      this.ga4Client = await authService.getGA4Client();
    }
    return this.ga4Client;
  }

  public async getBasicReport(days: number = 7): Promise<GA4ReportResponse> {
    // Check rate limit
    const canProceed = await ga4RateLimiter.checkLimit('ga4-reports');
    if (!canProceed) {
      throw new Error('GA4 API rate limit exceeded. Please try again later.');
    }

    const client = await this.getClient();
    const property = `properties/${this.propertyId}`;
    
    const endDate = 'today';
    const startDate = `${days}daysAgo`;

    try {
      // Get summary metrics
      const [summaryResponse] = await client.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'eventCount' },
        ],
      });

      const summary = this.extractSummaryMetrics(summaryResponse.rows?.[0]);

      // Get metrics by channel
      const [channelResponse] = await client.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'eventCount' },
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 10,
      });

      const byChannel = this.extractDimensionData(channelResponse.rows || []);

      // Get metrics by page
      const [pageResponse] = await client.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'eventCount' },
        ],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      });

      const byPage = this.extractDimensionData(pageResponse.rows || []);

      // Get metrics by device
      const [deviceResponse] = await client.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
          { name: 'eventCount' },
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      });

      const byDevice = this.extractDimensionData(deviceResponse.rows || []);

      return {
        summary,
        byChannel,
        byPage,
        byDevice,
        timeRange: {
          startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        },
      };
    } catch (error) {
      console.error('GA4 report error:', error);
      throw error;
    }
  }

  private extractSummaryMetrics(row: any): GA4Metrics {
    if (!row || !row.metricValues) {
      return {
        sessions: 0,
        users: 0,
        pageViews: 0,
        bounceRate: 0,
        avgSessionDuration: 0,
        eventsPerSession: 0,
      };
    }

    const sessions = parseInt(row.metricValues[0]?.value || '0');
    const eventCount = parseInt(row.metricValues[5]?.value || '0');

    return {
      sessions,
      users: parseInt(row.metricValues[1]?.value || '0'),
      pageViews: parseInt(row.metricValues[2]?.value || '0'),
      bounceRate: parseFloat(row.metricValues[3]?.value || '0'),
      avgSessionDuration: parseFloat(row.metricValues[4]?.value || '0'),
      eventsPerSession: sessions > 0 ? eventCount / sessions : 0,
    };
  }

  private extractDimensionData(rows: any[]): GA4DimensionData[] {
    return rows.map(row => {
      const dimension = row.dimensionValues?.[0]?.value || 'Unknown';
      const sessions = parseInt(row.metricValues[0]?.value || '0');
      const eventCount = parseInt(row.metricValues[5]?.value || '0');

      return {
        dimension,
        metrics: {
          sessions,
          users: parseInt(row.metricValues[1]?.value || '0'),
          pageViews: parseInt(row.metricValues[2]?.value || '0'),
          bounceRate: parseFloat(row.metricValues[3]?.value || '0'),
          avgSessionDuration: parseFloat(row.metricValues[4]?.value || '0'),
          eventsPerSession: sessions > 0 ? eventCount / sessions : 0,
        },
      };
    });
  }

  public async getRealtimeData() {
    const client = await this.getClient();
    const property = `properties/${this.propertyId}`;

    try {
      const [response] = await client.runRealtimeReport({
        property,
        dimensions: [
          { name: 'country' },
          { name: 'deviceCategory' },
        ],
        metrics: [
          { name: 'activeUsers' },
        ],
      });

      return {
        activeUsers: parseInt(response.rows?.[0]?.metricValues?.[0]?.value || '0'),
        byCountry: response.rows?.map((row: any) => ({
          country: row.dimensionValues?.[0]?.value || 'Unknown',
          activeUsers: parseInt(row.metricValues?.[0]?.value || '0'),
        })) || [],
        byDevice: response.rows?.map((row: any) => ({
          device: row.dimensionValues?.[1]?.value || 'Unknown',
          activeUsers: parseInt(row.metricValues?.[0]?.value || '0'),
        })) || [],
      };
    } catch (error) {
      console.error('GA4 realtime report error:', error);
      throw error;
    }
  }
}