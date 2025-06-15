import { NextRequest, NextResponse } from 'next/server';
import { KGIGenerator } from '@/lib/services/kgi-generator';
import { prismaDataService } from '@/lib/database/prisma-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const kgiGenerator = new KGIGenerator();
    const kgiSuggestion = await kgiGenerator.generateKGI(id);
    
    return NextResponse.json(kgiSuggestion);
  } catch (error) {
    console.error('Failed to generate KGI:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { action } = await request.json();
    
    if (action === 'auto_set') {
      const kgiGenerator = new KGIGenerator();
      const kgiSuggestion = await kgiGenerator.generateKGI(id);
      
      if (kgiSuggestion.confidence >= 0.7) {
        await prismaDataService.updateProject(id, {
          kgi: kgiSuggestion.kgi
        });
        
        return NextResponse.json({
          success: true,
          kgi: kgiSuggestion.kgi,
          confidence: kgiSuggestion.confidence
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Confidence too low for auto-setting',
          suggestion: kgiSuggestion
        });
      }
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to auto-set KGI:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}