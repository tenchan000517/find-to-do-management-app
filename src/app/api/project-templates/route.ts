// Phase 2: Project Template Generation API Endpoints
import { NextRequest, NextResponse } from 'next/server';
import ProjectTemplateGenerator from '../../../services/ProjectTemplateGenerator';

const templateGenerator = new ProjectTemplateGenerator();

export async function POST(request: NextRequest) {
  try {
    const { templateType, ...templateRequest } = await request.json();

    if (!templateType) {
      return NextResponse.json(
        { error: 'templateType is required' },
        { status: 400 }
      );
    }

    let result;
    
    switch (templateType) {
      case 'EVENT':
        result = await templateGenerator.generateEventTemplate(templateRequest);
        break;
      
      case 'DEVELOPMENT':
        result = await templateGenerator.generateDevelopmentTemplate(templateRequest);
        break;
      
      case 'CUSTOM':
        result = await templateGenerator.generateCustomTemplate(
          templateRequest.projectDescription,
          templateRequest.requirements || [],
          templateRequest.constraints || []
        );
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid templateType. Must be EVENT, DEVELOPMENT, or CUSTOM' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Project Template Generation API Error:', error);
    return NextResponse.json(
      { 
        error: 'プロジェクトテンプレート生成に失敗しました',
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateType = searchParams.get('templateType');
    const complexityLevel = searchParams.get('complexityLevel');

    // 既存のテンプレート一覧を取得（実装は後で追加）
    return NextResponse.json({
      success: true,
      data: [],
      message: 'テンプレート一覧取得機能は実装中です'
    });

  } catch (error) {
    console.error('Project Template GET API Error:', error);
    return NextResponse.json(
      { 
        error: 'テンプレート一覧の取得に失敗しました',
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}