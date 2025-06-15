import { NextRequest, NextResponse } from 'next/server';
import { getAICallManager } from '@/lib/ai/call-manager';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');
    
    const aiCallManager = getAICallManager();
    const stats = await aiCallManager.getUsageStats(days);
    
    // Get today's usage
    const todayStats = await aiCallManager.getUsageStats(1);
    
    // Get cache info
    const cacheInfo = {
      cacheSize: 'N/A', // Cache size is internal to the manager
      lastCleared: 'N/A'
    };

    return NextResponse.json({
      success: true,
      data: {
        period: `${days} days`,
        ...stats,
        today: todayStats,
        cache: cacheInfo,
        limits: {
          perMinute: 60,
          perDay: 1500
        }
      }
    });

  } catch (error) {
    console.error('Error fetching AI usage stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch AI usage statistics' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'clear_cache') {
      const aiCallManager = getAICallManager();
      aiCallManager.clearCache();
      
      return NextResponse.json({
        success: true,
        message: 'Cache cleared successfully'
      });
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid action' 
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in AI usage admin action:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform admin action' 
      },
      { status: 500 }
    );
  }
}