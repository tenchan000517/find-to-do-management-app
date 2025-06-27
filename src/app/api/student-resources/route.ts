// Phase 1: Student Resources Management API
// Implementation Date: 2025-06-27
// Description: Main API endpoints for student resource management

import { NextRequest, NextResponse } from 'next/server';
import { STUDENT_RESOURCE_MANAGER } from '../../../services/StudentResourceManager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (userId) {
      // Get specific user's resource data
      const [studentResource, currentLoad] = await Promise.all([
        STUDENT_RESOURCE_MANAGER.getStudentResource(userId),
        STUDENT_RESOURCE_MANAGER.calculateUserLoad(userId)
      ]);
      
      return NextResponse.json({
        success: true,
        data: {
          studentResource,
          currentLoad,
          lastUpdated: new Date().toISOString()
        }
      });
    } else {
      // Get all student resources
      const allResources = await STUDENT_RESOURCE_MANAGER.getAllStudentResources();
      
      return NextResponse.json({
        success: true,
        data: {
          resources: allResources,
          count: allResources.length,
          lastUpdated: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Error fetching student resources:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch student resources',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...resourceData } = body;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'userId is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Update student resource data
    const updatedResource = await STUDENT_RESOURCE_MANAGER.updateStudentResource(userId, resourceData);
    
    // Recalculate current load
    const currentLoad = await STUDENT_RESOURCE_MANAGER.calculateUserLoad(userId);
    
    return NextResponse.json({
      success: true,
      data: {
        studentResource: updatedResource,
        currentLoad,
        message: 'Student resource data updated successfully'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating student resource:', error);
    return NextResponse.json({
      success: false,
      error: 'UPDATE_ERROR',
      message: error instanceof Error ? error.message : 'Failed to update student resource',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...resourceData } = body;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'userId is required',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Update specific fields only
    const updatedResource = await STUDENT_RESOURCE_MANAGER.updateStudentResource(userId, resourceData);
    
    return NextResponse.json({
      success: true,
      data: {
        studentResource: updatedResource,
        message: 'Student resource data updated successfully'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating student resource:', error);
    return NextResponse.json({
      success: false,
      error: 'UPDATE_ERROR',
      message: error instanceof Error ? error.message : 'Failed to update student resource',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}