// Phase 1: Student Resource Optimization API
// Implementation Date: 2025-06-27
// Description: API endpoint for resource allocation optimization

import { NextRequest, NextResponse } from 'next/server';
import { STUDENT_RESOURCE_MANAGER } from '../../../../services/StudentResourceManager';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['projectId', 'requiredHours', 'requiredSkills', 'preferredRole', 'urgency', 'deadline'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: `Missing required fields: ${missingFields.join(', ')}`,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Convert deadline string to Date object
    const optimizationRequest = {
      ...body,
      deadline: new Date(body.deadline)
    };

    // Validate deadline is in the future
    if (optimizationRequest.deadline <= new Date()) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Deadline must be in the future',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Validate urgency level
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(optimizationRequest.urgency)) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Urgency must be LOW, MEDIUM, or HIGH',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Perform optimization
    const optimizationResult = await STUDENT_RESOURCE_MANAGER.optimizeResourceAllocation(optimizationRequest);
    
    return NextResponse.json({
      success: true,
      data: {
        optimization: optimizationResult,
        request: optimizationRequest,
        generatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error optimizing resource allocation:', error);
    return NextResponse.json({
      success: false,
      error: 'OPTIMIZATION_ERROR',
      message: error instanceof Error ? error.message : 'Failed to optimize resource allocation',
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

    // Get optimization history for the project
    // This would require implementing getOptimizationHistory in the service
    // For now, return a placeholder response
    
    return NextResponse.json({
      success: true,
      data: {
        projectId,
        optimizationHistory: [],
        message: 'Optimization history retrieval not yet implemented'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching optimization history:', error);
    return NextResponse.json({
      success: false,
      error: 'FETCH_ERROR',
      message: error instanceof Error ? error.message : 'Failed to fetch optimization history',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}