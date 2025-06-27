// Phase 1: MBTI Compatibility Analysis API
// Implementation Date: 2025-06-27
// Description: API endpoint for MBTI team compatibility analysis

import { NextRequest, NextResponse } from 'next/server';
import { MBTI_TEAM_OPTIMIZER } from '../../../../services/MBTITeamOptimizer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mbtiTypes, teamMembers } = body;
    
    // Validate input - expect either mbtiTypes array or teamMembers array
    let typesToAnalyze: string[] = [];
    
    if (mbtiTypes && Array.isArray(mbtiTypes)) {
      typesToAnalyze = mbtiTypes;
    } else if (teamMembers && Array.isArray(teamMembers)) {
      // Extract MBTI types from team members (assuming they have mbtiType property)
      typesToAnalyze = teamMembers
        .map((member: any) => member.mbtiType || member.mbti_type)
        .filter((type: string | undefined) => type);
    } else {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Either mbtiTypes array or teamMembers array is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (typesToAnalyze.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'No valid MBTI types found',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (typesToAnalyze.length === 1) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'At least 2 MBTI types are required for compatibility analysis',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate MBTI types format (should be 4 characters)
    const invalidTypes = typesToAnalyze.filter(type => !/^[A-Z]{4}$/.test(type));
    if (invalidTypes.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: `Invalid MBTI types found: ${invalidTypes.join(', ')}. MBTI types should be 4 uppercase letters.`,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Perform compatibility analysis
    const compatibilityAnalysis = await MBTI_TEAM_OPTIMIZER.analyzeTeamCompatibility(typesToAnalyze);
    
    // Calculate additional metrics
    const typeFrequency = typesToAnalyze.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const diversityMetrics = {
      totalTypes: typesToAnalyze.length,
      uniqueTypes: new Set(typesToAnalyze).size,
      diversityRatio: new Set(typesToAnalyze).size / typesToAnalyze.length,
      mostCommonType: Object.entries(typeFrequency).sort(([,a], [,b]) => b - a)[0]?.[0],
      typeDistribution: typeFrequency
    };
    
    return NextResponse.json({
      success: true,
      data: {
        mbtiTypes: typesToAnalyze,
        compatibilityAnalysis,
        diversityMetrics,
        analysisDate: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing team compatibility:', error);
    return NextResponse.json({
      success: false,
      error: 'ANALYSIS_ERROR',
      message: error instanceof Error ? error.message : 'Failed to analyze team compatibility',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const types = searchParams.get('types');
    
    if (!types) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'types parameter is required (comma-separated MBTI types)',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Parse comma-separated MBTI types
    const mbtiTypes = types.split(',').map(type => type.trim().toUpperCase());
    
    // Validate MBTI types
    const invalidTypes = mbtiTypes.filter(type => !/^[A-Z]{4}$/.test(type));
    if (invalidTypes.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: `Invalid MBTI types: ${invalidTypes.join(', ')}`,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    if (mbtiTypes.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'At least 2 MBTI types are required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Perform compatibility analysis
    const compatibilityAnalysis = await MBTI_TEAM_OPTIMIZER.analyzeTeamCompatibility(mbtiTypes);
    
    return NextResponse.json({
      success: true,
      data: {
        mbtiTypes,
        compatibilityAnalysis,
        analysisDate: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing team compatibility:', error);
    return NextResponse.json({
      success: false,
      error: 'ANALYSIS_ERROR',
      message: error instanceof Error ? error.message : 'Failed to analyze team compatibility',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}