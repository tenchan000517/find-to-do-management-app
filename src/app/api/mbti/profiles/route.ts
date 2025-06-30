import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prisma';

export async function GET(request: NextRequest) {
  try {
    // 既存のusersテーブルとstudent_resourcesテーブルを活用
    const users = await prisma.users.findMany({
      include: {
        student_resource: true,
        tasks: {
          take: 20,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (users.length === 0) {
      return NextResponse.json({ 
        profiles: [], 
        message: "ユーザーデータがありません" 
      });
    }

    const profiles = users
      .filter(user => user.mbtiType) // MBTIタイプが設定されているユーザーのみ
      .map(user => ({
        userId: user.id,
        userName: user.name,
        email: user.email,
        mbtiType: user.mbtiType,
        assessmentDate: user.student_resource?.createdAt || user.createdAt,
        confidence: 95, // デフォルト信頼度
        taskHistory: user.tasks.map(task => ({
          taskId: task.id,
          taskType: determineTaskType(task.title, task.description),
          completed: task.status === 'COMPLETE',
          timeSpent: task.actualHours * 60, // 分に変換
          qualityScore: calculateQualityScore(task),
          difficultyLevel: task.difficultyScore || 5,
          collaborationRequired: false, // 既存スキーマから判定困難
          completionDate: task.updatedAt,
          feedback: ''
        })),
        collaborationHistory: [] // 協業履歴は別途実装可能
      }));

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('MBTI profiles API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateQualityScore(task: any): number {
  // タスクの品質スコアを既存データから算出
  let score = 5; // ベーススコア
  
  // 期限内完了度
  if (task.status === 'COMPLETE') {
    score += 2;
    if (task.dueDate && new Date(task.updatedAt) <= new Date(task.dueDate)) {
      score += 2; // 期限内完了
    }
  }
  
  // 工数精度
  if (task.estimatedHours > 0 && task.actualHours > 0) {
    const accuracy = 1 - Math.abs(task.estimatedHours - task.actualHours) / task.estimatedHours;
    score += accuracy * 2;
  }
  
  // 優先度による調整
  if (task.priority === 'A') score += 1;
  if (task.priority === 'D') score -= 1;
  
  return Math.min(10, Math.max(1, Math.round(score)));
}

function determineTaskType(title: string, description: string): string {
  const text = (title + ' ' + description).toLowerCase();
  
  if (text.includes('開発') || text.includes('コード') || text.includes('プログラミング')) {
    return 'development';
  }
  if (text.includes('計画') || text.includes('設計') || text.includes('企画')) {
    return 'planning';
  }
  if (text.includes('会議') || text.includes('連絡') || text.includes('相談')) {
    return 'communication';
  }
  if (text.includes('分析') || text.includes('調査') || text.includes('検証')) {
    return 'analysis';
  }
  if (text.includes('テスト') || text.includes('確認') || text.includes('チェック')) {
    return 'testing';
  }
  if (text.includes('資料') || text.includes('文書') || text.includes('ドキュメント')) {
    return 'documentation';
  }
  
  return 'general';
}