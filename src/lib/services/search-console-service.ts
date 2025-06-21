import { GoogleAuthService } from './google-auth-service';
import { searchConsoleRateLimiter, retryWithBackoff } from '@/lib/utils/rate-limiter';

export interface SearchConsoleMetrics {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleDimensionData {
  dimension: string;
  metrics: SearchConsoleMetrics;
}

export interface SearchConsoleReportResponse {
  summary: SearchConsoleMetrics;
  byQuery: SearchConsoleDimensionData[];
  byPage: SearchConsoleDimensionData[];
  byCountry: SearchConsoleDimensionData[];
  byDevice: SearchConsoleDimensionData[];
  timeRange: {
    startDate: string;
    endDate: string;
  };
}

export class SearchConsoleService {
  private static instance: SearchConsoleService;
  private searchConsoleClient: any = null;
  private siteUrl: string;

  private constructor() {
    this.siteUrl = process.env.SEARCH_CONSOLE_SITE_URL || '';
    if (!this.siteUrl) {
      throw new Error('SEARCH_CONSOLE_SITE_URL is not configured');
    }
  }

  public static getInstance(): SearchConsoleService {
    if (!SearchConsoleService.instance) {
      SearchConsoleService.instance = new SearchConsoleService();
    }
    return SearchConsoleService.instance;
  }

  private async getClient() {
    if (!this.searchConsoleClient) {
      const authService = GoogleAuthService.getInstance();
      this.searchConsoleClient = await authService.getSearchConsoleClient();
    }
    return this.searchConsoleClient;
  }

  public async getSearchAnalytics(days: number = 7): Promise<SearchConsoleReportResponse> {
    // Check rate limit
    const canProceed = await searchConsoleRateLimiter.checkLimit('search-console');
    if (!canProceed) {
      throw new Error('Search Console API rate limit exceeded. Please try again later.');
    }

    const client = await this.getClient();
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const baseRequest = {
      siteUrl: this.siteUrl,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      rowLimit: 10,
    };

    try {
      // Get summary metrics
      const summaryResponse = await client.searchanalytics.query({
        ...baseRequest,
        aggregationType: 'auto',
      });

      const summary = this.extractSummaryMetrics(summaryResponse.data.rows);

      // Get metrics by query
      const queryResponse = await client.searchanalytics.query({
        ...baseRequest,
        dimensions: ['query'],
        aggregationType: 'auto',
      });

      const byQuery = this.extractDimensionData(queryResponse.data.rows || [], 'query');

      // Get metrics by page
      const pageResponse = await client.searchanalytics.query({
        ...baseRequest,
        dimensions: ['page'],
        aggregationType: 'byPage',
      });

      const byPage = this.extractDimensionData(pageResponse.data.rows || [], 'page');

      // Get metrics by country
      const countryResponse = await client.searchanalytics.query({
        ...baseRequest,
        dimensions: ['country'],
        aggregationType: 'auto',
      });

      const byCountry = this.extractDimensionData(countryResponse.data.rows || [], 'country');

      // Get metrics by device
      const deviceResponse = await client.searchanalytics.query({
        ...baseRequest,
        dimensions: ['device'],
        aggregationType: 'auto',
      });

      const byDevice = this.extractDimensionData(deviceResponse.data.rows || [], 'device');

      return {
        summary,
        byQuery,
        byPage,
        byCountry,
        byDevice,
        timeRange: {
          startDate: baseRequest.startDate,
          endDate: baseRequest.endDate,
        },
      };
    } catch (error) {
      console.error('Search Console report error:', error);
      throw error;
    }
  }

  private extractSummaryMetrics(rows: any[]): SearchConsoleMetrics {
    if (!rows || rows.length === 0) {
      return {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
      };
    }

    // Aggregate all rows for summary
    const totals = rows.reduce((acc, row) => ({
      clicks: acc.clicks + (row.clicks || 0),
      impressions: acc.impressions + (row.impressions || 0),
      positionSum: acc.positionSum + ((row.position || 0) * (row.impressions || 0)),
      positionCount: acc.positionCount + (row.impressions || 0),
    }), { clicks: 0, impressions: 0, positionSum: 0, positionCount: 0 });

    return {
      clicks: totals.clicks,
      impressions: totals.impressions,
      ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : 0,
      position: totals.positionCount > 0 ? totals.positionSum / totals.positionCount : 0,
    };
  }

  private extractDimensionData(rows: any[], dimensionType: string): SearchConsoleDimensionData[] {
    return rows.map(row => {
      const dimension = row.keys?.[0] || 'Unknown';
      
      return {
        dimension: this.formatDimension(dimension, dimensionType),
        metrics: {
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr || 0,
          position: row.position || 0,
        },
      };
    });
  }

  private formatDimension(value: string, type: string): string {
    if (type === 'page') {
      // Extract path from full URL
      try {
        const url = new URL(value);
        return url.pathname;
      } catch {
        return value;
      }
    }
    if (type === 'country') {
      // Convert country codes to names if needed
      return value.toUpperCase();
    }
    return value;
  }

  public async getIndexingStatus() {
    const client = await this.getClient();
    
    try {
      // Get URL inspection data
      const response = await client.urlInspection.index.inspect({
        siteUrl: this.siteUrl,
        inspectionUrl: this.siteUrl,
      });

      return {
        coverageState: response.data.inspectionResult?.indexStatusResult?.coverageState || 'Unknown',
        crawledAs: response.data.inspectionResult?.indexStatusResult?.crawledAs || 'Unknown',
        googleCanonical: response.data.inspectionResult?.indexStatusResult?.googleCanonical || '',
        indexingState: response.data.inspectionResult?.indexStatusResult?.indexingState || 'Unknown',
        lastCrawlTime: response.data.inspectionResult?.indexStatusResult?.lastCrawlTime || '',
      };
    } catch (error) {
      console.error('Search Console indexing status error:', error);
      // Return default values if inspection fails
      return {
        coverageState: 'Unknown',
        crawledAs: 'Unknown',
        googleCanonical: '',
        indexingState: 'Unknown',
        lastCrawlTime: '',
      };
    }
  }
}