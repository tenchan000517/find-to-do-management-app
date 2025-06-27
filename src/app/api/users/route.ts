import { NextRequest, NextResponse } from 'next/server';
import { getOptionalAuth, requirePermission } from '@/lib/auth/server';
import { PERMISSIONS } from '@/lib/auth/permissions';
import prisma from '@/lib/database/prisma';

export async function GET() {
  // オプション認証: ログインなしでも基本情報は取得可能
  const { session, user } = await getOptionalAuth();
  
  try {
    if (session && user) {
      // ログイン済みユーザー: 権限に応じたフィルタリング
      if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        // 管理者: 全ユーザー情報取得可能
        const users = await prisma.users.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            color: true,
            isActive: true,
            lastLoginAt: true,
            loginCount: true,
            skills: true,
            preferences: true,
            workStyle: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { name: 'asc' }
        });
        return NextResponse.json(users);
      } else {
        // 一般ユーザー: 基本情報のみ
        const users = await prisma.users.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            color: true,
            isActive: true
          },
          orderBy: { name: 'asc' }
        });
        return NextResponse.json(users);
      }
    } else {
      // 未ログイン: 最小限の情報（既存機能保持）
      const users = await prisma.users.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          color: true
        },
        orderBy: { name: 'asc' }
      });
      return NextResponse.json(users);
    }
  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // ユーザー作成は管理者権限必須
  const authResult = await requirePermission(PERMISSIONS.USER_MANAGE);
  if (authResult instanceof NextResponse) return authResult;

  const { user } = authResult;
  
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.color) {
      return NextResponse.json({ error: 'Name and color are required' }, { status: 400 });
    }

    // 新規ユーザー作成（管理者のみ）
    const newUser = await prisma.users.create({
      data: {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: body.name,
        email: body.email || null,
        lineUserId: body.lineUserId || null,
        color: body.color,
        role: body.role || 'MEMBER',
        isActive: body.isActive !== undefined ? body.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email || undefined,
      lineUserId: newUser.lineUserId || undefined,
      color: newUser.color,
      role: newUser.role,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString()
    }, { status: 201 });
  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'ユーザーの作成に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // ユーザー更新は権限必須
  const authResult = await requirePermission(PERMISSIONS.USER_UPDATE);
  if (authResult instanceof NextResponse) return authResult;

  const { user: currentUser } = authResult;
  
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 自分または管理者のみ更新可能
    if (currentUser.id !== body.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'ユーザー更新権限がありません' },
        { status: 403 }
      );
    }

    const updatedUser = await prisma.users.update({
      where: { id: body.id },
      data: {
        name: body.name,
        email: body.email || null,
        lineUserId: body.lineUserId || null,
        color: body.color,
        isActive: body.isActive,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email || undefined,
      lineUserId: updatedUser.lineUserId || undefined,
      color: updatedUser.color,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'ユーザーの更新に失敗しました' },
      { status: 500 }
    );
  }
}