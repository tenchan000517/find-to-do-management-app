// Phase 1: Individual MBTI Analysis API
// Implementation Date: 2025-06-27
// Description: API endpoint for individual MBTI analysis and profile management

import { NextRequest, NextResponse } from 'next/server';
import { MBTI_TEAM_OPTIMIZER } from '../../../../../services/MBTITeamOptimizer';

export async function GET(
  request: NextRequest, 
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await context.params;
    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'userId is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Get individual MBTI analysis
    const analysis = await MBTI_TEAM_OPTIMIZER.analyzeIndividualMBTI(userId);
    
    return NextResponse.json({
      success: true,
      data: {
        userId,
        analysis,
        analysisDate: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing individual MBTI:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'NOT_FOUND',
        message: 'User not found or MBTI type not set',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'ANALYSIS_ERROR',
      message: error instanceof Error ? error.message : 'Failed to analyze individual MBTI',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest, 
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await context.params;
    const { userId } = params;
    const body = await request.json();
    const { mbtiType } = body;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'userId is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (!mbtiType) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'mbtiType is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate MBTI type format
    if (!/^[A-Z]{4}$/.test(mbtiType)) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'mbtiType must be 4 uppercase letters (e.g., INTJ, ENFP)',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Update user MBTI type
    const success = await MBTI_TEAM_OPTIMIZER.updateUserMBTI(userId, mbtiType);
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'UPDATE_ERROR',
        message: 'Failed to update MBTI type',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Get updated analysis
    const analysis = await MBTI_TEAM_OPTIMIZER.analyzeIndividualMBTI(userId);
    
    return NextResponse.json({
      success: true,
      data: {
        userId,
        mbtiType,
        analysis,
        message: 'MBTI type updated successfully',
        updatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user MBTI:', error);
    return NextResponse.json({
      success: false,
      error: 'UPDATE_ERROR',
      message: error instanceof Error ? error.message : 'Failed to update MBTI type',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest, 
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await context.params;
    const { userId } = params;
    const body = await request.json();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'userId is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Force refresh of MBTI analysis (useful after profile updates)
    const analysis = await MBTI_TEAM_OPTIMIZER.analyzeIndividualMBTI(userId);
    
    // Optional: Check if analysis should include team context
    const { includeTeamContext, currentTeamMembers } = body;
    
    let teamContext = null;
    if (includeTeamContext && currentTeamMembers && Array.isArray(currentTeamMembers)) {
      const teamMbtiTypes = currentTeamMembers
        .map((member: any) => member.mbtiType)
        .filter((type: string) => type && type !== analysis.mbtiType);
      
      if (teamMbtiTypes.length > 0) {
        const allTypes = [analysis.mbtiType, ...teamMbtiTypes];
        teamContext = await MBTI_TEAM_OPTIMIZER.analyzeTeamCompatibility(allTypes);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        userId,
        analysis,
        teamContext,
        refreshedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error refreshing MBTI analysis:', error);
    return NextResponse.json({
      success: false,
      error: 'REFRESH_ERROR',
      message: error instanceof Error ? error.message : 'Failed to refresh MBTI analysis',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}