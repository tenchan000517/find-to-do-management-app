import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        student_resource: true,
        tasks: {
          take: 50,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    if (!user.mbtiType) {
      return NextResponse.json(
        { error: "MBTIタイプが設定されていません" },
        { status: 400 }
      );
    }

    const recommendations = generatePersonalizedRecommendations(user);
    const predictions = generatePerformancePredictions(user);

    return NextResponse.json({ recommendations, predictions });
  } catch (error) {
    console.error('MBTI individual API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generatePersonalizedRecommendations(user: any) {
  const mbtiType = user.mbtiType;
  const taskHistory = user.tasks || [];
  
  const recommendations = [];

  // タスク完了率に基づく推奨
  const completionRate = taskHistory.filter((t: any) => t.status === 'COMPLETE').length / (taskHistory.length || 1);
  
  if (completionRate < 0.7) {
    recommendations.push({
      userId: user.id,
      recommendationType: 'task',
      title: 'タスク完了率の改善',
      description: `現在の完了率は${Math.round(completionRate * 100)}%です。${mbtiType}タイプに適したタスク管理手法を提案します。`,
      priority: 'high',
      expectedImpact: '完了率20%向上',
      actionItems: getMBTISpecificTaskAdvice(mbtiType),
      timeframe: '2週間',
      successMetrics: ['完了率80%以上', 'タスク遅延50%削減']
    });
  }

  // 工数精度に基づく推奨
  const estimationAccuracy = calculateEstimationAccuracy(taskHistory);
  if (estimationAccuracy < 0.7) {
    recommendations.push({
      userId: user.id,
      recommendationType: 'development',
      title: '工数見積り精度の向上',
      description: `${mbtiType}タイプの特性を活かした見積り手法を提案します。`,
      priority: 'medium',
      expectedImpact: '見積り精度30%向上',
      actionItems: getMBTISpecificEstimationAdvice(mbtiType),
      timeframe: '1ヶ月',
      successMetrics: ['見積り精度80%以上']
    });
  }

  // 負荷分散に基づく推奨
  const currentLoad = user.currentLoadPercentage || 0;
  if (currentLoad > 80) {
    recommendations.push({
      userId: user.id,
      recommendationType: 'environment',
      title: '作業負荷の最適化',
      description: `現在の負荷率${currentLoad}%を${mbtiType}タイプに適した方法で調整します。`,
      priority: 'high',
      expectedImpact: 'ストレス軽減、品質向上',
      actionItems: getMBTISpecificWorkloadAdvice(mbtiType),
      timeframe: '1週間',
      successMetrics: ['負荷率70%以下', '品質スコア向上']
    });
  }

  return recommendations;
}

function generatePerformancePredictions(user: any) {
  const taskHistory = user.tasks || [];
  
  const predictions = [];
  
  // タスクタイプ別の成功率予測
  const taskTypes = ['development', 'planning', 'communication', 'analysis'];
  
  taskTypes.forEach(type => {
    const typeTasks = taskHistory.filter((t: any) => determineTaskType(t.title, t.description) === type);
    const successRate = typeTasks.length > 0 
      ? (typeTasks.filter((t: any) => t.status === 'COMPLETE').length / typeTasks.length) * 100
      : 75; // デフォルト値

    predictions.push({
      taskType: type,
      predictedSuccess: Math.round(successRate),
      predictedTime: calculateAverageTime(typeTasks),
      confidenceLevel: typeTasks.length >= 5 ? 85 : 60,
      factors: {
        mbtiAlignment: getMBTIAlignment(user.mbtiType, type),
        pastPerformance: successRate,
        taskComplexity: 50,
        currentWorkload: user.currentLoadPercentage || 50
      },
      recommendations: getMBTITaskRecommendations(user.mbtiType, type)
    });
  });

  return predictions;
}

// MBTI タイプ別のアドバイス関数
function getMBTISpecificTaskAdvice(mbtiType: string): string[] {
  const advice: Record<string, string[]> = {
    'INTJ': ['長期計画の細分化', '静かな作業環境の確保', '目標の明確化'],
    'ENTJ': ['チームとの定期的な進捗共有', 'リーダーシップ機会の活用', '効率化ツールの導入'],
    'INFP': ['創造的な要素の追加', '価値観との整合性確認', '柔軟なスケジュール設定'],
    'ENFP': ['変化に富んだタスク構成', 'チームワークの機会創出', '短期目標の設定'],
    'ISTJ': ['詳細な手順書の作成', '定期的な進捗確認', '品質基準の明確化'],
    'ESTJ': ['明確な責任範囲の設定', 'デッドラインの厳守', 'チーム連携の強化']
  };
  
  return advice[mbtiType] || ['個人の強みを活かしたアプローチ', '定期的な振り返り', '継続的な学習'];
}

function getMBTISpecificEstimationAdvice(mbtiType: string): string[] {
  const advice: Record<string, string[]> = {
    'INTJ': ['詳細な要件分析', '過去データの活用', 'バッファ時間の確保'],
    'ENTJ': ['チーム経験の活用', '段階的見積り', '定期的な見直し'],
    'INFP': ['感覚的見積りの数値化', '類似作業との比較', 'ペアワークの活用'],
    'ENFP': ['複数人での見積り', '楽観バイアスの調整', '実績データの蓄積'],
    'ISTJ': ['過去の類似案件参照', '詳細なタスク分解', '保守的な見積り'],
    'ESTJ': ['標準工数の活用', 'チェックリストの作成', '経験則の適用']
  };
  
  return advice[mbtiType] || ['過去の実績データ活用', 'チーム内での見積り共有', '定期的な精度確認'];
}

function getMBTISpecificWorkloadAdvice(mbtiType: string): string[] {
  const advice: Record<string, string[]> = {
    'INTJ': ['集中時間の確保', '不要な会議の削減', '深い思考時間の設定'],
    'ENTJ': ['優先順位の明確化', 'デリゲーションの活用', '効率的な意思決定'],
    'INFP': ['創造性のための余白時間', 'ストレス軽減手法の実践', 'バランスの取れたワークロード'],
    'ENFP': ['多様性のあるタスク配分', 'エネルギー管理', '社交的休憩の確保'],
    'ISTJ': ['段階的な負荷調整', '品質維持のための時間確保', '予測可能なスケジュール'],
    'ESTJ': ['システマティックな作業配分', 'チーム支援の活用', '明確な境界設定']
  };
  
  return advice[mbtiType] || ['適切な休息の確保', '負荷の見える化', 'サポート体制の構築'];
}

function calculateEstimationAccuracy(tasks: any[]): number {
  const validTasks = tasks.filter((t: any) => t.estimatedHours > 0 && t.actualHours > 0);
  if (validTasks.length === 0) return 0.75; // デフォルト値
  
  const accuracies = validTasks.map((t: any) => {
    const diff = Math.abs(t.estimatedHours - t.actualHours);
    return Math.max(0, 1 - (diff / t.estimatedHours));
  });
  
  return accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
}

function calculateAverageTime(tasks: any[]): number {
  if (tasks.length === 0) return 240; // 4時間デフォルト
  
  const avgHours = tasks.reduce((sum: number, t: any) => sum + (t.actualHours || t.estimatedHours || 4), 0) / tasks.length;
  return Math.round(avgHours * 60); // 分に変換
}

function getMBTIAlignment(mbtiType: string, taskType: string): number {
  // MBTI タイプとタスクタイプの適合度（0-100）
  const alignments: Record<string, Record<string, number>> = {
    'INTJ': { development: 90, planning: 95, communication: 60, analysis: 85 },
    'ENTJ': { development: 75, planning: 90, communication: 85, analysis: 80 },
    'INFP': { development: 70, planning: 60, communication: 80, analysis: 75 },
    'ENFP': { development: 65, planning: 70, communication: 90, analysis: 70 },
    'ISTJ': { development: 85, planning: 90, communication: 70, analysis: 80 },
    'ESTJ': { development: 80, planning: 85, communication: 85, analysis: 75 }
  };
  
  return alignments[mbtiType]?.[taskType] || 75;
}

function getMBTITaskRecommendations(mbtiType: string, taskType: string): string[] {
  return [
    `${mbtiType}タイプに適した${taskType}アプローチを採用`,
    '個人の強みを最大化する環境設定',
    '定期的なフィードバックと調整'
  ];
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
  
  return 'general';
}