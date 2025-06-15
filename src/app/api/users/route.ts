import { NextRequest, NextResponse } from 'next/server';
import { prismaDataService } from '@/lib/database/prisma-service';
import prisma from '@/lib/database/prisma';

export async function GET() {
  try {
    const users = await prismaDataService.getUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to get users:', error);
    return NextResponse.json({ error: 'Failed to get users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.color) {
      return NextResponse.json({ error: 'Name and color are required' }, { status: 400 });
    }

    const newUser = await prisma.users.create({
      data: {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: body.name,
        email: body.email || null,
        lineUserId: body.lineUserId || null,
        color: body.color,
        isActive: body.isActive !== undefined ? body.isActive : true,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email || undefined,
      lineUserId: newUser.lineUserId || undefined,
      color: newUser.color,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updatedUser = await prisma.users.update({
      where: { id: body.id },
      data: {
        name: body.name,
        email: body.email || null,
        lineUserId: body.lineUserId || null,
        color: body.color,
        isActive: body.isActive
      }
    });

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email || undefined,
      lineUserId: updatedUser.lineUserId || undefined,
      color: updatedUser.color,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}