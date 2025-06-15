import { NextRequest, NextResponse } from 'next/server';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prismaDataService.getUserById(id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      skills: user.skills || {
        engineering: 5, sales: 5, creative: 5,
        marketing: 5, management: 5, pr: 5
      },
      preferences: user.preferences || {
        qol_weight: 1.0, target_areas: [], strengths: [], weaknesses: []
      },
      workStyle: user.workStyle || {
        focus_time: 'morning',
        collaboration_preference: 'medium',
        stress_tolerance: 'medium'
      }
    });
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { skills, preferences, workStyle } = await request.json();
    
    // 入力値検証
    if (skills) {
      const skillKeys = ['engineering', 'sales', 'creative', 'marketing', 'management', 'pr'];
      for (const key of skillKeys) {
        if (skills[key] && (skills[key] < 1 || skills[key] > 10)) {
          return NextResponse.json({ error: `Skill ${key} must be 1-10` }, { status: 400 });
        }
      }
    }

    if (preferences?.qol_weight && (preferences.qol_weight < 0.5 || preferences.qol_weight > 2.0)) {
      return NextResponse.json({ error: 'QOL weight must be 0.5-2.0' }, { status: 400 });
    }

    const updatedUser = await prismaDataService.updateUser(id, {
      skills,
      preferences,
      workStyle
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}