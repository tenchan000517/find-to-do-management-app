// Phase 1: MBTI Team Optimization API
// Implementation Date: 2025-06-27
// Description: API endpoint for MBTI-based team composition optimization

import { NextRequest, NextResponse } from 'next/server';
import { MBTI_TEAM_OPTIMIZER } from '../../../../services/MBTITeamOptimizer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['projectId', 'projectType', 'requiredRoles', 'teamSize', 'projectDuration', 'complexityLevel', 'availableMembers'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: `Missing required fields: ${missingFields.join(', ')}`,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate data types and ranges
    if (!Array.isArray(body.requiredRoles) || body.requiredRoles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'requiredRoles must be a non-empty array',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (!Array.isArray(body.availableMembers) || body.availableMembers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'availableMembers must be a non-empty array',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (typeof body.teamSize !== 'number' || body.teamSize < 1 || body.teamSize > 20) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'teamSize must be a number between 1 and 20',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (typeof body.complexityLevel !== 'number' || body.complexityLevel < 1 || body.complexityLevel > 10) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'complexityLevel must be a number between 1 and 10',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Perform team optimization
    const optimizationResult = await MBTI_TEAM_OPTIMIZER.optimizeTeamComposition(body);
    
    return NextResponse.json({
      success: true,
      data: {
        teamOptimization: optimizationResult,
        request: body,
        generatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error optimizing team composition:', error);
    return NextResponse.json({
      success: false,
      error: 'OPTIMIZATION_ERROR',
      message: error instanceof Error ? error.message : 'Failed to optimize team composition',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'projectId parameter is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Get team analysis history for the project
    const analysisHistory = await MBTI_TEAM_OPTIMIZER.getTeamAnalysisHistory(projectId);
    
    return NextResponse.json({
      success: true,
      data: {
        projectId,
        analysisHistory,
        count: analysisHistory.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching team analysis history:', error);
    return NextResponse.json({
      success: false,
      error: 'FETCH_ERROR',
      message: error instanceof Error ? error.message : 'Failed to fetch team analysis history',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}