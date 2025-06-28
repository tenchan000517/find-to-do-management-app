# Phase 3実装ナレッジ - 後続エンジニア向け重要事項

**作成日:** 2025-06-15  
**Phase 3実装者:** Claude Code  
**対象:** Phase 4以降の実装エンジニア

---

## 🚨 重要な実装上の注意点

### **TypeScript型エラー対応パターン**

#### **1. null vs undefined の使い分け**
```typescript
// ❌ 間違い - nullとundefinedの混在でエラー
private async inferProjectConnection(): Promise<string | null> {
  return bestMatch ? bestMatch.projectId : null; // nullを返す
}

async linkToProject(projectId?: string) {
  if (!projectId) {
    projectId = await this.inferProjectConnection(); // Type Error!
  }
}

// ✅ 正解 - 一貫してundefinedを使用
private async inferProjectConnection(): Promise<string | undefined> {
  return bestMatch ? bestMatch.projectId : undefined;
}
```

**教訓**: オプショナル型パラメータ(`?`)は`undefined`と親和性が高い。一貫性を保つこと。

#### **2. PrismaService メソッドの命名規則**
```typescript
// ❌ 間違い - 存在しないメソッド名
await prismaDataService.getAllProjects(); // getAllProjectsは存在しない

// ✅ 正解 - 実際のメソッド名を確認
await prismaDataService.getProjects(); // これが正しい
```

**確認方法**:
```bash
grep -n "async.*get.*(" src/lib/database/prisma-service.ts
```

---

## 📊 Phase 3で実装した機能アーキテクチャ

### **1. RelationshipService設計**
```typescript
export class RelationshipService {
  // 自動関係性推論: Jaccard係数使用
  private async calculateSimilarity(entity: any, project: any): Promise<number> {
    const intersection = new Set([...entityWords].filter(x => projectWords.has(x)));
    const union = new Set([...entityWords, ...projectWords]);
    return intersection.size / union.size; // 0.0-1.0
  }
  
  // しきい値: 0.6以上で関連性ありと判定
  return bestMatch && bestMatch.score > 0.6 ? bestMatch.projectId : undefined;
}
```

### **2. PrismaService拡張パターン**
```typescript
// 新規メソッド追加時のテンプレート
async getXxxById(id: string): Promise<any> {
  try {
    const result = await prisma.xxx.findUnique({
      where: { id }
    });
    return result;
  } catch (error) {
    console.error('Failed to get xxx by ID:', error);
    return null; // 注意: nullでOK（戻り値型がanyのため）
  }
}
```

---

## 🔧 デバッグ・トラブルシューティング

### **ビルドエラー頻出パターン**

#### **1. メソッド未定義エラー**
```
Property 'getConnectionById' does not exist on type 'PrismaDataService'
```
**解決手順**:
1. `src/lib/database/prisma-service.ts`でメソッド実装確認
2. 必要に応じてメソッド追加
3. 型定義の一貫性確認

#### **2. Prismaテーブル名エラー**
```typescript
// ❌ 間違い - テーブル名が違う
await prisma.project_relationship.create() 

// ✅ 正解 - 正確なテーブル名
await prisma.project_relationships.create() // 複数形
```

**確認方法**:
```bash
grep -n "model.*{" prisma/schema.prisma
```

### **API テスト方法**
```bash
# 開発サーバー起動
npm run dev

# 新規API動作確認
curl -X GET "http://localhost:3000/api/projects/[実際のプロジェクトID]/analytics"
curl -X POST "http://localhost:3000/api/projects/[プロジェクトID]/relationships" \
  -H "Content-Type: application/json" \
  -d '{"entityType":"task","entityId":"task_123","strength":1.0}'
```

---

## 📈 Phase 4実装時の推奨事項

### **1. アラートシステム実装時の注意**
- `project_alerts`、`user_alerts`テーブルは既に存在
- 対応するPrismaServiceメソッドも実装済み
- フロントエンド実装に集中可能

### **2. 既存RelationshipServiceの活用**
```typescript
// Phase 4でアラートトリガー時に使用推奨
const relationshipService = new RelationshipService();

// プロジェクトアクティビティ更新（アラート解決時など）
await relationshipService.updateProjectActivity(projectId);

// コネクション追加時のパワー更新
await relationshipService.updateConnectionPower(projectId);
```

### **3. パフォーマンス最適化ポイント**
- **関係性推論**: 大量プロジェクト時はキャッシュ検討
- **類似度計算**: 複雑なアルゴリズムに変更時はワーカー使用
- **統計計算**: 頻繁なアクセス時はRedis等のキャッシュ層追加

---

## 🗂️ ファイル構造（Phase 3追加分）
```
src/
├── lib/
│   └── services/
│       └── relationship-service.ts     # 新規: 関係性マッピング
├── app/api/projects/[id]/
│   ├── analytics/
│   │   └── route.ts                   # 新規: 統合分析API
│   └── relationships/
│       └── route.ts                   # 新規: 関係性管理API
```

---

## ⚡ クイックスタート（Phase 4開始前チェック）

```bash
# 1. 現在の状態確認
git log --oneline -3
npm run build

# 2. Phase 3機能確認
curl http://localhost:3000/api/projects/[ID]/analytics
curl http://localhost:3000/api/projects/[ID]/relationships

# 3. Phase 4実装準備
cat docs/PHASE4_ALERT_SYSTEM.md
```

---

**Phase 3実装は完全に安定しています。既存機能への影響なく、Phase 4実装を開始できます。**