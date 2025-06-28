// Phase 2: Knowledge Automation API Endpoints
import { NextRequest, NextResponse } from 'next/server';
import TaskKnowledgeAutomator from '../../../services/TaskKnowledgeAutomator';

const knowledgeAutomator = new TaskKnowledgeAutomator();

export async function POST(request: NextRequest) {
  try {
    const { action, ...data } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      );
    }

    let result;
    
    switch (action) {
      case 'processTaskCompletion':
        if (!data.taskId) {
          return NextResponse.json(
            { error: 'taskId is required for processTaskCompletion' },
            { status: 400 }
          );
        }
        result = await knowledgeAutomator.processTaskCompletion(data);
        break;
      
      case 'evaluateKnowledgeQuality':
        if (!data.knowledgeId) {
          return NextResponse.json(
            { error: 'knowledgeId is required for evaluateKnowledgeQuality' },
            { status: 400 }
          );
        }
        result = await knowledgeAutomator.evaluateKnowledgeQuality(data.knowledgeId);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be processTaskCompletion or evaluateKnowledgeQuality' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Knowledge Automation API Error:', error);
    return NextResponse.json(
      { 
        error: 'ナレッジ自動化処理に失敗しました',
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const knowledgeId = searchParams.get('knowledgeId');

    if (taskId) {
      // タスクの自動化履歴を取得（実装は後で追加）
      return NextResponse.json({
        success: true,
        data: null,
        message: 'タスク自動化履歴の取得機能は実装中です'
      });
    }

    if (knowledgeId) {
      // ナレッジの品質評価履歴を取得（実装は後で追加）
      return NextResponse.json({
        success: true,
        data: null,
        message: 'ナレッジ品質評価履歴の取得機能は実装中です'
      });
    }

    // 全体の自動化統計を取得
    return NextResponse.json({
      success: true,
      data: {
        totalProcessedTasks: 0,
        generatedKnowledgeCount: 0,
        averageQualityScore: 0
      },
      message: '自動化統計の詳細実装は進行中です'
    });

  } catch (error) {
    console.error('Knowledge Automation GET API Error:', error);
    return NextResponse.json(
      { 
        error: 'ナレッジ自動化データの取得に失敗しました',
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}