import { NextRequest, NextResponse } from 'next/server';
import { GA4ReportsService } from '@/lib/services/ga4-reports-service';
import { SearchConsoleService } from '@/lib/services/search-console-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7', 10);
    
    if (isNaN(days) || days < 1 || days > 90) {
      return NextResponse.json(
        { error: 'Invalid days parameter. Must be between 1 and 90.' },
        { status: 400 }
      );
    }

    // Initialize services
    const ga4Service = GA4ReportsService.getInstance();
    const searchConsoleService = SearchConsoleService.getInstance();

    // Fetch data in parallel with error handling
    const [ga4Data, searchConsoleData, realtimeData] = await Promise.allSettled([
      ga4Service.getBasicReport(days),
      searchConsoleService.getSearchAnalytics(days),
      ga4Service.getRealtimeData(),
    ]);

    // Process results
    const response: any = {
      success: true,
      timeRange: {
        days,
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      },
      data: {},
      errors: [],
    };

    // Handle GA4 data
    if (ga4Data.status === 'fulfilled') {
      response.data.ga4 = ga4Data.value;
    } else {
      response.errors.push({
        service: 'ga4',
        message: ga4Data.reason?.message || 'Failed to fetch GA4 data',
      });
      response.data.ga4 = null;
    }

    // Handle Search Console data
    if (searchConsoleData.status === 'fulfilled') {
      response.data.searchConsole = searchConsoleData.value;
    } else {
      response.errors.push({
        service: 'searchConsole',
        message: searchConsoleData.reason?.message || 'Failed to fetch Search Console data',
      });
      response.data.searchConsole = null;
    }

    // Handle realtime data
    if (realtimeData.status === 'fulfilled') {
      response.data.realtime = realtimeData.value;
    } else {
      // Realtime data is optional, just log the error
      console.warn('Failed to fetch realtime data:', realtimeData.reason);
      response.data.realtime = null;
    }

    // Calculate combined metrics if both services returned data
    if (response.data.ga4 && response.data.searchConsole) {
      response.data.combined = calculateCombinedMetrics(
        response.data.ga4,
        response.data.searchConsole
      );
    }

    // Set appropriate status code
    const statusCode = response.errors.length === 0 ? 200 : 206; // 206 for partial content

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    console.error('Analytics dashboard API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

function calculateCombinedMetrics(ga4Data: any, searchConsoleData: any) {
  return {
    overview: {
      organicTraffic: {
        sessions: ga4Data.byChannel.find((c: any) => 
          c.dimension.toLowerCase().includes('organic')
        )?.metrics.sessions || 0,
        clicks: searchConsoleData.summary.clicks,
        impressions: searchConsoleData.summary.impressions,
        ctr: searchConsoleData.summary.ctr,
        avgPosition: searchConsoleData.summary.position,
      },
      engagement: {
        totalSessions: ga4Data.summary.sessions,
        totalUsers: ga4Data.summary.users,
        pageViews: ga4Data.summary.pageViews,
        bounceRate: ga4Data.summary.bounceRate,
        avgSessionDuration: ga4Data.summary.avgSessionDuration,
      },
    },
    topPerformingPages: mergePageData(
      ga4Data.byPage,
      searchConsoleData.byPage
    ),
    trafficSources: {
      ga4Channels: ga4Data.byChannel,
      searchQueries: searchConsoleData.byQuery,
    },
    deviceBreakdown: {
      ga4: ga4Data.byDevice,
      searchConsole: searchConsoleData.byDevice,
    },
  };
}

function mergePageData(ga4Pages: any[], searchConsolePages: any[]) {
  const pageMap = new Map();

  // Add GA4 data
  ga4Pages.forEach(page => {
    pageMap.set(page.dimension, {
      url: page.dimension,
      ga4: page.metrics,
      searchConsole: null,
    });
  });

  // Merge Search Console data
  searchConsolePages.forEach(page => {
    const existing = pageMap.get(page.dimension);
    if (existing) {
      existing.searchConsole = page.metrics;
    } else {
      pageMap.set(page.dimension, {
        url: page.dimension,
        ga4: null,
        searchConsole: page.metrics,
      });
    }
  });

  return Array.from(pageMap.values())
    .sort((a, b) => {
      const aScore = (a.ga4?.pageViews || 0) + (a.searchConsole?.clicks || 0);
      const bScore = (b.ga4?.pageViews || 0) + (b.searchConsole?.clicks || 0);
      return bScore - aScore;
    })
    .slice(0, 10);
}