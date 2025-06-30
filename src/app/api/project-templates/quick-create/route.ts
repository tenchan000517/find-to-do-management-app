import { NextRequest, NextResponse } from 'next/server';
import ProjectTemplateGenerator from '@/services/ProjectTemplateGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, teamSize, timeline, projectType, requirements } = body;

    const generator = new ProjectTemplateGenerator();
    
    // 自然言語入力から適切なテンプレート生成
    let template;
    
    if (projectType.toLowerCase().includes('web') || projectType.toLowerCase().includes('アプリ')) {
      // 開発プロジェクト
      template = await generator.generateDevelopmentTemplate({
        projectType: 'WEB_APP',
        complexity: Math.min(Math.max(teamSize, 3), 8), // 3-8のレンジ
        timeline: timeline,
        teamSize: teamSize,
        technologies: ['React', 'TypeScript', 'Next.js'],
        requirements: requirements
      });
    } else if (projectType.toLowerCase().includes('イベント') || projectType.toLowerCase().includes('セミナー')) {
      // イベントプロジェクト
      template = await generator.generateEventTemplate({
        eventType: 'SEMINAR',
        targetScale: teamSize * 20, // チームサイズから参加者数推定
        budget: timeline * 100000, // 期間から予算推定
        duration: Math.max(timeline / 4, 1), // 期間から日数推定
        location: 'HYBRID',
        audience: '一般参加者',
        objectives: requirements
      });
    } else {
      // カスタムプロジェクト
      template = await generator.generateCustomTemplate(
        description,
        requirements,
        [`チームサイズ: ${teamSize}名`, `期間: ${timeline}週間`]
      );
    }

    // レスポンス用にプロジェクト情報を整形
    const projectResponse = {
      projectName: template.projectName,
      description: template.description,
      teamSize: teamSize,
      timeline: `${timeline}週間`,
      phases: template.phases,
      budgetBreakdown: template.budgetBreakdown,
      riskFactors: template.riskFactors,
      successMetrics: template.successMetrics,
      resources: template.resources,
      status: 'created',
      createdAt: new Date().toISOString()
    };

    return NextResponse.json(projectResponse);
    
  } catch (error) {
    console.error('クイックプロジェクト作成エラー:', error);
    
    // フォールバック：シンプルなプロジェクト作成
    const fallbackProject = {
      projectName: `新しいプロジェクト - ${new Date().toLocaleDateString()}`,
      description: '自動生成されたプロジェクトです',
      teamSize: 3,
      timeline: '4週間',
      phases: [{
        name: '計画フェーズ',
        duration: '1週間',
        tasks: [{
          title: 'プロジェクト計画作成',
          description: 'プロジェクトの詳細計画を作成',
          estimatedHours: 8,
          priority: 'A',
          dependencies: [],
          skillRequirements: ['プロジェクト管理'],
          deliverables: ['プロジェクト計画書']
        }]
      }],
      budgetBreakdown: { total: 0 },
      riskFactors: ['要件不明確'],
      successMetrics: ['計画完成'],
      resources: {
        humanResources: ['プロジェクトマネージャー'],
        technicalResources: [],
        externalServices: []
      },
      status: 'created',
      createdAt: new Date().toISOString()
    };

    return NextResponse.json(fallbackProject);
  }
}