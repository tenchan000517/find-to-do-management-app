// Phase 1: Student Load Calculation API
// Implementation Date: 2025-06-27
// Description: API endpoint for calculating individual student load

import { NextRequest, NextResponse } from 'next/server';
import { STUDENT_RESOURCE_MANAGER } from '../../../../../services/StudentResourceManager';

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

    // Calculate current load
    const currentLoad = await STUDENT_RESOURCE_MANAGER.calculateUserLoad(userId);
    
    // Get student resource for context
    const studentResource = await STUDENT_RESOURCE_MANAGER.getStudentResource(userId);
    
    if (!studentResource) {
      return NextResponse.json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Student resource not found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    // Calculate load status and recommendations
    let loadStatus: string;
    let recommendations: string[] = [];

    if (currentLoad < 50) {
      loadStatus = 'LOW';
      recommendations.push('余裕があります。追加のタスクを担当可能です。');
      recommendations.push('新しいスキル習得の機会として挑戦的なタスクを検討してください。');
    } else if (currentLoad < 70) {
      loadStatus = 'MODERATE';
      recommendations.push('適切な負荷レベルです。');
      recommendations.push('現在のペースを維持してください。');
    } else if (currentLoad < 85) {
      loadStatus = 'HIGH';
      recommendations.push('負荷が高めです。新しいタスクの追加は慎重に検討してください。');
      recommendations.push('既存タスクの優先順位を見直してください。');
    } else {
      loadStatus = 'CRITICAL';
      recommendations.push('負荷が非常に高いです。緊急でないタスクの延期を検討してください。');
      recommendations.push('チームメンバーへの作業分散を検討してください。');
      recommendations.push('管理者に相談することをお勧めします。');
    }

    // Calculate next available capacity date
    const weeklyCapacity = studentResource.weeklyCommitHours;
    const currentWeeklyLoad = (currentLoad / 100) * weeklyCapacity;
    const availableHours = weeklyCapacity - currentWeeklyLoad;
    
    return NextResponse.json({
      success: true,
      data: {
        userId,
        currentLoad: Number(currentLoad.toFixed(2)),
        loadStatus,
        weeklyCapacity,
        currentWeeklyLoad: Number(currentWeeklyLoad.toFixed(2)),
        availableHours: Number(availableHours.toFixed(2)),
        recommendations,
        lastCalculated: new Date().toISOString(),
        studentResourceSummary: {
          taskCompletionRate: studentResource.taskCompletionRate,
          qualityScore: studentResource.qualityScore,
          collaborationScore: studentResource.collaborationScore,
          technicalSkills: studentResource.technicalSkills.length,
          softSkills: studentResource.softSkills.length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating user load:', error);
    return NextResponse.json({
      success: false,
      error: 'CALCULATION_ERROR',
      message: error instanceof Error ? error.message : 'Failed to calculate user load',
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

    // Force recalculation of load (useful after task updates)
    const currentLoad = await STUDENT_RESOURCE_MANAGER.calculateUserLoad(userId);
    
    // If load threshold is provided, check against it
    const { loadThreshold } = body;
    let exceedsThreshold = false;
    
    if (loadThreshold && typeof loadThreshold === 'number') {
      exceedsThreshold = currentLoad > loadThreshold;
    }
    
    return NextResponse.json({
      success: true,
      data: {
        userId,
        currentLoad: Number(currentLoad.toFixed(2)),
        loadThreshold,
        exceedsThreshold,
        recalculatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error recalculating user load:', error);
    return NextResponse.json({
      success: false,
      error: 'RECALCULATION_ERROR',
      message: error instanceof Error ? error.message : 'Failed to recalculate user load',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}