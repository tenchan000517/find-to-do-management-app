import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getOptionalAuth } from '@/lib/auth/server';
import prisma from '@/lib/database/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, user } = await getOptionalAuth();
  
  try {
    const { id } = await params;
    const targetUserId = id;
    
    if (session && user) {
      // ログイン済み: 自分のプロフィールまたは管理者権限
      if (user.id === targetUserId || user.role === 'ADMIN' || user.role === 'MANAGER') {
        const targetUser = await prisma.users.findUnique({
          where: { id: targetUserId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            color: true,
            isActive: true,
            skills: true,
            preferences: true,
            workStyle: true,
            lastLoginAt: true,
            loginCount: true,
            createdAt: true,
            updatedAt: true
          }
        });
        
        if (!targetUser) {
          return NextResponse.json(
            { error: 'ユーザーが見つかりません' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
          color: targetUser.color,
          isActive: targetUser.isActive,
          skills: targetUser.skills || {
            engineering: 5, sales: 5, creative: 5,
            marketing: 5, management: 5, pr: 5
          },
          preferences: targetUser.preferences || {
            qol_weight: 1.0, target_areas: [], strengths: [], weaknesses: []
          },
          workStyle: targetUser.workStyle || {
            focus_time: 'morning',
            collaboration_preference: 'medium',
            stress_tolerance: 'medium'
          },
          lastLoginAt: targetUser.lastLoginAt,
          loginCount: targetUser.loginCount,
          createdAt: targetUser.createdAt,
          updatedAt: targetUser.updatedAt
        });
      } else {
        // 他人のプロフィール: 基本情報のみ
        const targetUser = await prisma.users.findUnique({
          where: { id: targetUserId },
          select: {
            id: true,
            name: true,
            color: true
          }
        });
        
        if (!targetUser) {
          return NextResponse.json(
            { error: 'ユーザーが見つかりません' },
            { status: 404 }
          );
        }
        
        return NextResponse.json(targetUser);
      }
    } else {
      // 未ログイン: 基本情報のみ（既存機能保持）
      const targetUser = await prisma.users.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          color: true
        }
      });
      
      if (!targetUser) {
        return NextResponse.json(
          { error: 'ユーザーが見つかりません' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(targetUser);
    }
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { error: 'プロフィール情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // プロフィール更新は認証必須
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  
  const session = authResult;
  
  try {
    const { id } = await params;
    const targetUserId = id;
    
    // 自分のプロフィールまたは管理者のみ更新可能
    const currentUser = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true }
    });
    
    if (!currentUser || (currentUser.id !== targetUserId && currentUser.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'プロフィール更新権限がありません' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { name, email, color, skills, preferences, workStyle } = body;
    
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

    const updatedUser = await prisma.users.update({
      where: { id: targetUserId },
      data: {
        name,
        email,
        color,
        skills,
        preferences,
        workStyle,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      color: updatedUser.color,
      skills: updatedUser.skills,
      preferences: updatedUser.preferences,
      workStyle: updatedUser.workStyle,
      updatedAt: updatedUser.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'プロフィールの更新に失敗しました' },
      { status: 500 }
    );
  }
}