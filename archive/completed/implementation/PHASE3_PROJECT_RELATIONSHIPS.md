# Phase 3: プロジェクト中心機能 - 実装ガイド

**実装期間:** 2-3週間  
**目標:** 全要素のプロジェクト連携実装  
**前提条件:** Phase 2完了、AI評価エンジン動作確認済み

---

## 🎯 Phase 3の実装目標

1. **関係性マッピングサービス** - エンティティ自動プロジェクト紐づけ
2. **動的指標計算** - アクティブ率、コネクションパワー更新
3. **プロジェクト昇華システム** - AI判定による自動プロジェクト化
4. **フェーズ進行監視** - 段階変化の自動追跡
5. **統合分析ダッシュボード** - プロジェクト中心の可視化

---

## 🔗 関係性マッピングサービス実装

**src/lib/services/relationship-service.ts（新規作成）:**
```typescript
import { prismaDataService } from '@/lib/database/prisma-service';

export class RelationshipService {
  
  /**
   * エンティティをプロジェクトに自動紐づけ
   */
  async linkToProject(
    entityType: 'task' | 'appointment' | 'connection' | 'calendar',
    entityId: string,
    projectId?: string,
    strength: number = 1.0
  ): Promise<void> {
    try {
      if (!projectId) {
        projectId = await this.inferProjectConnection(entityType, entityId);
      }
      
      if (projectId) {
        await prismaDataService.createProjectRelationship({
          projectId,
          relatedType: entityType,
          relatedId: entityId,
          relationshipStrength: strength
        });
        
        // プロジェクトのアクティビティスコア更新
        await this.updateProjectActivity(projectId);
      }
    } catch (error) {
      console.error('Failed to link to project:', error);
    }
  }

  /**
   * プロジェクトアクティビティスコア更新
   */
  async updateProjectActivity(projectId: string): Promise<void> {
    try {
      const relationships = await prismaDataService.getProjectRelationships(projectId);
      const recentActivity = relationships.filter(r => {
        const daysSince = this.getDaysSince(r.createdAt);
        return daysSince <= 30;
      });

      const activityScore = Math.min(1.0, recentActivity.length / 10);
      
      await prismaDataService.updateProject(projectId, {
        activityScore,
        lastActivityDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update project activity:', error);
    }
  }

  /**
   * コネクションパワー計算・更新
   */
  async updateConnectionPower(projectId: string): Promise<void> {
    try {
      const connections = await this.getProjectConnections(projectId);
      const uniqueCompanies = new Set(connections.map(c => c.company));
      const seniorContacts = connections.filter(c => 
        c.position.includes('部長') || c.position.includes('取締役') || c.position.includes('CEO')
      );

      const connectionPower = uniqueCompanies.size + (seniorContacts.length * 2);
      
      await prismaDataService.updateProject(projectId, { connectionPower });
    } catch (error) {
      console.error('Failed to update connection power:', error);
    }
  }

  /**
   * AI判定によるプロジェクト関連性推論
   */
  private async inferProjectConnection(entityType: string, entityId: string): Promise<string | null> {
    try {
      const entity = await this.getEntityById(entityType, entityId);
      if (!entity) return null;

      const projects = await prismaDataService.getAllProjects();
      const scores = [];

      for (const project of projects) {
        const similarity = await this.calculateSimilarity(entity, project);
        scores.push({ projectId: project.id, score: similarity });
      }

      const bestMatch = scores.sort((a, b) => b.score - a.score)[0];
      return bestMatch && bestMatch.score > 0.6 ? bestMatch.projectId : null;
    } catch (error) {
      console.error('Failed to infer project connection:', error);
      return null;
    }
  }

  private async calculateSimilarity(entity: any, project: any): Promise<number> {
    // キーワードベースの類似度計算
    const entityText = `${entity.title || entity.name || ''} ${entity.description || ''}`.toLowerCase();
    const projectText = `${project.name} ${project.description}`.toLowerCase();

    const entityWords = new Set(entityText.split(/\s+/));
    const projectWords = new Set(projectText.split(/\s+/));
    
    const intersection = new Set([...entityWords].filter(x => projectWords.has(x)));
    const union = new Set([...entityWords, ...projectWords]);
    
    return intersection.size / union.size;
  }

  private async getEntityById(entityType: string, entityId: string): Promise<any> {
    switch (entityType) {
      case 'task':
        return await prismaDataService.getTaskById(entityId);
      case 'appointment':
        return await prismaDataService.getAppointmentById(entityId);
      case 'connection':
        return await prismaDataService.getConnectionById(entityId);
      case 'calendar':
        return await prismaDataService.getCalendarEventById(entityId);
      default:
        return null;
    }
  }

  private async getProjectConnections(projectId: string): Promise<any[]> {
    const relationships = await prismaDataService.getProjectRelationships(projectId);
    const connectionIds = relationships
      .filter(r => r.relatedType === 'connection')
      .map(r => r.relatedId);
    
    const connections = [];
    for (const id of connectionIds) {
      const connection = await prismaDataService.getConnectionById(id);
      if (connection) connections.push(connection);
    }
    
    return connections;
  }

  private getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }
}
```

## 📊 統合分析API実装

**src/app/api/projects/[id]/analytics/route.ts（新規作成）:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prismaDataService } from '@/lib/database/prisma-service';
import { RelationshipService } from '@/lib/services/relationship-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // プロジェクト基本情報
    const project = await prismaDataService.getProjectById(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 関連データ取得
    const tasks = await prismaDataService.getTasksByProjectId(id);
    const relationships = await prismaDataService.getProjectRelationships(id);
    const alerts = await prismaDataService.getProjectAlerts(id);

    // 統計計算
    const analytics = {
      project: {
        ...project,
        taskCount: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'COMPLETE').length,
        highPriorityTasks: tasks.filter(t => t.priority === 'A' || t.aiIssueLevel === 'A').length
      },
      relationships: {
        total: relationships.length,
        byType: relationships.reduce((acc, r) => {
          acc[r.relatedType] = (acc[r.relatedType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      alerts: {
        total: alerts.length,
        unread: alerts.filter(a => !a.isRead).length,
        bySeverity: alerts.reduce((acc, a) => {
          acc[a.severity] = (acc[a.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      timeline: await this.getProjectTimeline(id),
      recommendations: await this.generateRecommendations(project, tasks, alerts)
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Failed to get project analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getProjectTimeline(projectId: string): Promise<any[]> {
  // プロジェクトフェーズ履歴取得
  const phaseHistory = await prismaDataService.getProjectPhaseHistory(projectId);
  return phaseHistory.map(h => ({
    date: h.createdAt,
    type: 'phase_change',
    from: h.fromPhase,
    to: h.toPhase,
    reason: h.reason
  }));
}

async function generateRecommendations(project: any, tasks: any[], alerts: any[]): Promise<string[]> {
  const recommendations = [];

  // 進捗停滞の推奨
  if (project.successProbability < 0.5) {
    recommendations.push('プロジェクトの成功確率が低下しています。フェーズ見直しを検討してください。');
  }

  // タスクの偏りチェック
  const highPriorityRatio = tasks.filter(t => t.aiIssueLevel === 'A').length / tasks.length;
  if (highPriorityRatio > 0.5) {
    recommendations.push('高優先度タスクが集中しています。リソース配分の調整が必要です。');
  }

  // アラート対応
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.isResolved);
  if (criticalAlerts.length > 0) {
    recommendations.push('緊急アラートが未解決です。即座の対応が必要です。');
  }

  return recommendations;
}
```

---

## ✅ Phase 3完了検証

### **必須チェックリスト:**
- [ ] 関係性マッピング動作確認
  - [ ] `RelationshipService` 実装・テスト完了
  - [ ] エンティティ自動プロジェクト紐づけ動作
  - [ ] アクティビティスコア更新確認
- [ ] 統合分析API動作確認
  - [ ] `GET /api/projects/[id]/analytics` テスト
  - [ ] プロジェクト関連データ集計確認
  - [ ] 推奨事項生成確認
- [ ] データベース更新確認
  - [ ] `project_relationships` テーブルデータ保存
  - [ ] プロジェクトの各種スコア更新
- [ ] 既存機能無影響確認

### **Phase 3完了報告テンプレート:**
```markdown
## Phase 3実装完了報告

### 実装内容
✅ 関係性マッピング: RelationshipService実装
✅ 統合分析API: /api/projects/[id]/analytics
✅ 動的指標計算: アクティビティ・コネクションパワー更新
✅ プロジェクト昇華基盤: AI判定ロジック実装

### 検証結果
✅ XX件のエンティティがプロジェクトに自動紐づけ
✅ XX件のプロジェクトでアクティビティスコア更新
✅ 統合分析データ正常取得・表示
✅ 既存機能無影響確認

### 次Phase準備状況
✅ Phase 4開始準備完了
次回実装: docs/PHASE4_ALERT_SYSTEM.md 参照
```

---

**Phase 3完了後、`docs/PHASE4_ALERT_SYSTEM.md` に進んでください。**