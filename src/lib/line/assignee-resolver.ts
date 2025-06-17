// 担当者データベース連携システム
// 引き継ぎドキュメントの要求に基づく実装

export interface AssigneeCandidate {
  id: string;
  name: string;
  email?: string;
}

export interface AssigneeResolutionResult {
  candidates: AssigneeCandidate[];
  exactMatch?: AssigneeCandidate;
  confidence: number;
}

export class AssigneeResolver {
  
  // データベースから担当者一覧を取得
  async getAllAssignees(): Promise<AssigneeCandidate[]> {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      const users = await prisma.users.findMany({
        select: {
          id: true,
          name: true,
          email: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      await prisma.$disconnect();

      return users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email || undefined
      }));

    } catch (error) {
      console.error('❌ 担当者一覧取得エラー:', error);
      return [];
    }
  }

  // 名前の部分一致で候補を提示
  async resolveAssignee(nameHint: string): Promise<AssigneeResolutionResult> {
    if (!nameHint || nameHint.trim().length === 0) {
      return {
        candidates: [],
        confidence: 0
      };
    }

    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      // 名前の正規化（全角→半角、カタカナ→ひらがな）
      const normalizedHint = this.normalizeNameHint(nameHint);
      console.log(`🔍 担当者検索: "${nameHint}" → "${normalizedHint}"`);

      // 部分一致検索（複数条件）
      const candidates = await prisma.users.findMany({
        where: {
          OR: [
            { name: { contains: normalizedHint, mode: 'insensitive' } },
            { name: { contains: nameHint, mode: 'insensitive' } },
            // よくある敬称を除去した検索
            { name: { contains: nameHint.replace(/(さん|君|さま|部長|課長|主任)$/, ''), mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true
        },
        take: 5 // 最大5件
      });

      await prisma.$disconnect();

      const mappedCandidates = candidates.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email || undefined
      }));

      // 完全一致を探す
      const exactMatch = mappedCandidates.find(candidate => 
        candidate.name.toLowerCase() === normalizedHint.toLowerCase()
      );

      // 信頼度計算
      const confidence = this.calculateConfidence(nameHint, mappedCandidates, exactMatch);

      console.log(`✅ 担当者候補: ${mappedCandidates.length}件, 信頼度: ${confidence}`);

      return {
        candidates: mappedCandidates,
        exactMatch,
        confidence
      };

    } catch (error) {
      console.error('❌ 担当者解決エラー:', error);
      return {
        candidates: [],
        confidence: 0
      };
    }
  }


  // 名前ヒントの正規化
  private normalizeNameHint(nameHint: string): string {
    return nameHint
      // 全角→半角
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
      })
      // カタカナ→ひらがな
      .replace(/[ァ-ヶ]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0x60);
      })
      // 敬称除去
      .replace(/(さん|君|さま|部長|課長|主任|氏)$/, '')
      .trim();
  }

  // 信頼度計算
  private calculateConfidence(
    originalHint: string,
    candidates: AssigneeCandidate[],
    exactMatch?: AssigneeCandidate
  ): number {
    if (candidates.length === 0) return 0;

    let confidence = 0.3; // ベース信頼度

    // 完全一致がある場合
    if (exactMatch) {
      confidence += 0.5;
    }

    // 候補数による調整
    if (candidates.length === 1) {
      confidence += 0.2; // 1件のみ → 高信頼度
    } else if (candidates.length <= 3) {
      confidence += 0.1; // 少数候補 → 中信頼度
    }

    // 名前の長さによる調整
    if (originalHint.length >= 3) {
      confidence += 0.1; // 長い名前 → 高信頼度
    }

    return Math.min(confidence, 1.0);
  }

  // LINE UI用の担当者選択ボタンを生成
  async createAssigneeSelectionButtons(nameHint: string, type: string): Promise<any[]> {
    const result = await this.resolveAssignee(nameHint);
    
    const buttons: any[] = [];

    // 候補がある場合
    if (result.candidates.length > 0) {
      for (const candidate of result.candidates.slice(0, 3)) { // 最大3件
        buttons.push({
          type: 'button',
          style: result.exactMatch?.id === candidate.id ? 'primary' : 'secondary',
          height: 'sm',
          action: {
            type: 'postback',
            label: `👤 ${candidate.name}`,
            data: `select_assignee_${type}_${candidate.id}`
          }
        });
      }
    }


    // 担当者なしオプション
    buttons.push({
      type: 'button',
      style: 'secondary',
      height: 'sm',
      action: {
        type: 'postback',
        label: '❌ 担当者なし',
        data: `no_assignee_${type}`
      }
    });

    return buttons;
  }
}

// シングルトンインスタンス
export const assigneeResolver = new AssigneeResolver();