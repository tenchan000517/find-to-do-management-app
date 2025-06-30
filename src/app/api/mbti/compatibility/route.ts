import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/database/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json();

    if (!userIds || userIds.length < 2) {
      return NextResponse.json(
        { error: 'チーム分析には2名以上のユーザーが必要です' },
        { status: 400 }
      );
    }

    const users = await prisma.users.findMany({
      where: {
        id: { in: userIds }
      },
      include: {
        student_resource: true
      }
    });

    const teamMembers = users.map(user => ({
      userId: user.id,
      userName: user.name,
      mbtiType: user.mbtiType
    }));

    const compatibility = analyzeTeamCompatibility(teamMembers);

    return NextResponse.json({ compatibility });
  } catch (error) {
    console.error('MBTI compatibility API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function analyzeTeamCompatibility(teamMembers: any[]) {
  const mbtiTypes = teamMembers.map(member => member.mbtiType).filter(Boolean);
  
  if (mbtiTypes.length < 2) {
    return {
      teamMembers,
      compatibilityScore: 50,
      strengthAreas: ['チーム構成の確認が必要'],
      riskAreas: ['MBTIタイプ情報の不足'],
      recommendations: ['メンバーのMBTIタイプを設定してください'],
      communicationMatrix: {}
    };
  }

  // ペア間の相性マトリクス計算
  const communicationMatrix: Record<string, Record<string, number>> = {};
  let totalCompatibility = 0;
  let pairCount = 0;

  for (let i = 0; i < teamMembers.length; i++) {
    const member1 = teamMembers[i];
    communicationMatrix[member1.userId] = {};
    
    for (let j = 0; j < teamMembers.length; j++) {
      if (i !== j) {
        const member2 = teamMembers[j];
        const compatibility = calculateTypeCompatibility(member1.mbtiType, member2.mbtiType);
        communicationMatrix[member1.userId][member2.userId] = compatibility;
        
        if (i < j) { // 重複カウント防止
          totalCompatibility += compatibility;
          pairCount++;
        }
      }
    }
  }

  const overallScore = pairCount > 0 ? Math.round(totalCompatibility / pairCount) : 50;

  // チームの強み・リスクエリア分析
  const { strengthAreas, riskAreas } = analyzeTeamDynamics(mbtiTypes);
  const recommendations = generateTeamRecommendations(mbtiTypes, overallScore);

  return {
    teamMembers,
    compatibilityScore: overallScore,
    strengthAreas,
    riskAreas,
    recommendations,
    communicationMatrix
  };
}

function calculateTypeCompatibility(type1: string, type2: string): number {
  if (!type1 || !type2) return 50;

  // MBTI次元の抽出
  const dims1 = {
    E: type1[0] === 'E',
    S: type1[1] === 'S', 
    T: type1[2] === 'T',
    J: type1[3] === 'J'
  };
  
  const dims2 = {
    E: type2[0] === 'E',
    S: type2[1] === 'S',
    T: type2[2] === 'T', 
    J: type2[3] === 'J'
  };

  let compatibility = 60; // ベーススコア

  // 補完的な関係の評価
  if (dims1.E !== dims2.E) compatibility += 15; // 外向-内向の補完
  if (dims1.S !== dims2.S) compatibility += 10; // 感覚-直感の補完
  if (dims1.T === dims2.T) compatibility += 10; // 思考-感情の一致
  if (dims1.J !== dims2.J) compatibility += 5;  // 判断-知覚の補完

  // 特別な相性パターン
  if (type1 === type2) compatibility = 85; // 同じタイプ
  
  // 理想的なペアリング
  const idealPairs = [
    ['INTJ', 'ENFP'], ['INFJ', 'ENTP'], ['ISTJ', 'ESFP'], ['ISFJ', 'ESTP'],
    ['ENTJ', 'INFP'], ['ENFJ', 'INTP'], ['ESTJ', 'ISFP'], ['ESFJ', 'ISTP']
  ];
  
  for (const [t1, t2] of idealPairs) {
    if ((type1 === t1 && type2 === t2) || (type1 === t2 && type2 === t1)) {
      compatibility = 95;
      break;
    }
  }

  return Math.min(100, Math.max(30, compatibility));
}

function analyzeTeamDynamics(mbtiTypes: string[]) {
  const strengthAreas = [];
  const riskAreas = [];

  // 外向性・内向性のバランス
  const extraverts = mbtiTypes.filter(t => t[0] === 'E').length;
  const introverts = mbtiTypes.filter(t => t[0] === 'I').length;
  
  if (extraverts > 0 && introverts > 0) {
    strengthAreas.push('外向性と内向性のバランスが良好');
  } else if (extraverts === 0) {
    riskAreas.push('外向的なエネルギーの不足');
  } else {
    riskAreas.push('内省的な時間の不足');
  }

  // 思考・感情のバランス
  const thinkers = mbtiTypes.filter(t => t[2] === 'T').length;
  const feelers = mbtiTypes.filter(t => t[2] === 'F').length;
  
  if (thinkers > 0 && feelers > 0) {
    strengthAreas.push('論理的思考と人間的配慮の両立');
  } else if (feelers === 0) {
    riskAreas.push('チームの人間関係・士気への配慮不足');
  } else {
    riskAreas.push('客観的な意思決定の困難');
  }

  // 感覚・直感のバランス
  const sensors = mbtiTypes.filter(t => t[1] === 'S').length;
  const intuitives = mbtiTypes.filter(t => t[1] === 'N').length;
  
  if (sensors > 0 && intuitives > 0) {
    strengthAreas.push('現実的視点と革新的アイデアの融合');
  } else if (sensors === 0) {
    riskAreas.push('実装・詳細への注意力不足');
  } else {
    riskAreas.push('新しいアプローチへの抵抗');
  }

  // 判断・知覚のバランス
  const judgers = mbtiTypes.filter(t => t[3] === 'J').length;
  const perceivers = mbtiTypes.filter(t => t[3] === 'P').length;
  
  if (judgers > 0 && perceivers > 0) {
    strengthAreas.push('計画性と柔軟性の効果的なバランス');
  } else if (judgers === 0) {
    riskAreas.push('スケジュール管理と決断力の不足');
  } else {
    riskAreas.push('適応性と創造性の制限');
  }

  return { strengthAreas, riskAreas };
}

function generateTeamRecommendations(mbtiTypes: string[], score: number): string[] {
  const recommendations = [];

  if (score >= 80) {
    recommendations.push('非常に良好なチーム相性です。現在の協働スタイルを維持してください');
    recommendations.push('さらなる成果向上のため、個々の強みを最大化する役割分担を検討してください');
  } else if (score >= 60) {
    recommendations.push('良好なチーム相性です。コミュニケーション頻度を増やすとさらに効果的です');
    recommendations.push('定期的なチームビルディング活動を実施してください');
  } else {
    recommendations.push('チーム相性に改善の余地があります。定期的な対話の機会を設けてください');
    recommendations.push('メンバー間の理解を深めるため、MBTI特性の共有セッションを開催してください');
  }

  // タイプ別の具体的推奨事項
  const hasIntroverts = mbtiTypes.some(t => t[0] === 'I');
  const hasExtraverts = mbtiTypes.some(t => t[0] === 'E');
  
  if (hasIntroverts && hasExtraverts) {
    recommendations.push('会議では内向型メンバーの発言時間を確保してください');
    recommendations.push('アイデア共有は事前の準備時間を設けると効果的です');
  }

  const hasJudgers = mbtiTypes.some(t => t[3] === 'J');
  const hasPerceivers = mbtiTypes.some(t => t[3] === 'P');
  
  if (hasJudgers && hasPerceivers) {
    recommendations.push('計画性と柔軟性のバランスを意識した進行を心がけてください');
    recommendations.push('締切は段階的に設定し、適度な調整余地を残してください');
  }

  const hasThinkers = mbtiTypes.some(t => t[2] === 'T');
  const hasFeelers = mbtiTypes.some(t => t[2] === 'F');
  
  if (hasThinkers && hasFeelers) {
    recommendations.push('意思決定時は論理的分析と人間的影響の両面を考慮してください');
    recommendations.push('フィードバック時は建設的かつ配慮のある表現を心がけてください');
  }

  return recommendations;
}