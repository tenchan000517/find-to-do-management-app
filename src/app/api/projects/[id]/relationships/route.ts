import { NextRequest, NextResponse } from 'next/server';
import { prismaDataService } from '@/lib/database/prisma-service';
import { RelationshipService } from '@/lib/services/relationship-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const relationships = await prismaDataService.getProjectRelationships(id);
    
    return NextResponse.json(relationships);
  } catch (error) {
    console.error('Failed to get project relationships:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { entityType, entityId, strength = 1.0 } = await request.json();
    
    // 入力値検証
    if (!entityType || !entityId) {
      return NextResponse.json({ 
        error: 'Missing required fields: entityType, entityId' 
      }, { status: 400 });
    }

    const validEntityTypes = ['task', 'appointment', 'connection', 'calendar'];
    if (!validEntityTypes.includes(entityType)) {
      return NextResponse.json({ 
        error: 'Invalid entityType. Must be one of: ' + validEntityTypes.join(', ')
      }, { status: 400 });
    }

    const relationshipService = new RelationshipService();
    
    // プロジェクトとエンティティを紐づけ
    await relationshipService.linkToProject(entityType, entityId, projectId, strength);
    
    // コネクションの場合、コネクションパワーも更新
    if (entityType === 'connection') {
      await relationshipService.updateConnectionPower(projectId);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Entity linked to project successfully' 
    });
  } catch (error) {
    console.error('Failed to create project relationship:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}