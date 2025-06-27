# 担当者中心システム - コアガイダンス

## 📋 概要

FIND To-Do Management Appは、従来の「作成者中心」設計から「担当者中心」設計に全面移行しました。これは「誰が作ったか」よりも「誰が責任を持つか」を重視するビジネス要求に対応するものです。

## 🎯 基本理念

### 旧システム（作成者中心）
- 主体：「誰が作成したか」
- フォーカス：データの所有者
- 制限：作成者のみが主要責任

### 新システム（担当者中心）
- 主体：「誰が担当するか」
- フォーカス：実行責任者
- 柔軟性：担当者は変更可能、作成者とは独立

## 🏗️ アーキテクチャ設計

### データモデル

全エンティティに以下のフィールドペアを実装：

```typescript
interface BaseEntity {
  // 担当者システム
  createdBy?: string;     // 作成者ID (トレーサビリティ用)
  assignedTo?: string;    // 担当者ID (実行責任者)
  creator?: User;         // 作成者リレーション
  assignee?: User;        // 担当者リレーション
  
  // Legacy フィールド (後方互換性)
  userId?: string;        // 旧システム用
  author?: string;        // 旧システム用  
  assignedToId?: string;  // 旧システム用
}
```

### エンティティ別担当者概念

| エンティティ | 担当者の意味 | デフォルト担当者 |
|--------------|--------------|------------------|
| **Task** | タスク実行責任者 | 作成者 |
| **Project** | プロジェクトマネージャー | 作成者 |
| **CalendarEvent** | イベント責任者 | 作成者 |
| **Connection** | 関係構築担当者 | 作成者 |
| **Appointment** | 営業担当者 | 作成者 |
| **KnowledgeItem** | 管理担当者 | 作成者 |
| **PersonalSchedule** | N/A (所有者固定) | 所有者のみ |

## 🔄 データフロー

### 作成時フロー
1. **作成者記録**: `createdBy` に現在ユーザーID自動設定
2. **担当者設定**: 
   - ユーザー指定があれば → `assignedTo` に指定ユーザー
   - 指定なしの場合 → `assignedTo` に作成者ID (デフォルト)
3. **Legacy互換**: 必要に応じて旧フィールドも設定

### 更新時フロー
1. **担当者変更**: `assignedTo` のみ更新
2. **作成者不変**: `createdBy` は変更不可
3. **履歴追跡**: 担当者変更履歴は別途記録（将来実装）

## 🎨 UI設計原則

### 表示優先順位
1. **担当者表示**: 最も目立つ位置に配置
2. **作成者表示**: 詳細情報や履歴として表示
3. **アクション**: 担当者変更UIを標準提供

### フィルタリング・検索
- **メイン**: 担当者別表示をデフォルト
- **サブ**: 作成者別表示をオプション提供
- **混合**: 「自分が担当」「自分が作成」の区別

### LINE統合
- **登録時**: 担当者選択UI標準提供
- **修正時**: 担当者変更フロー完全対応
- **通知**: 担当者ベースでの通知システム

## 📊 移行戦略

### Phase 1: バックエンド移行 ✅ 完了
- [x] データベーススキーマ対応
- [x] TypeScript型定義更新
- [x] API保存処理修正
- [x] LINE登録フロー対応

### Phase 2: UI移行 📍 次のフェーズ
- [ ] 一覧画面の担当者表示
- [ ] 詳細画面の担当者情報
- [ ] 担当者変更UI実装
- [ ] フィルタリング機能更新

### Phase 3: 高度機能
- [ ] 担当者別ダッシュボード
- [ ] ワークロード分析
- [ ] 担当者変更履歴
- [ ] 通知システム強化

## 🔧 技術実装ガイドライン

### データ取得
```typescript
// 担当者情報付きで取得
const tasks = await prisma.tasks.findMany({
  include: {
    creator: true,    // 作成者情報
    assignee: true,   // 担当者情報
    user: true        // Legacy互換
  }
});
```

### 担当者フィルタリング
```typescript
// 担当者別フィルタ
const myTasks = await prisma.tasks.findMany({
  where: {
    assignedTo: currentUserId  // 新システム
  }
});

// Legacy互換フィルタ
const legacyTasks = await prisma.tasks.findMany({
  where: {
    OR: [
      { assignedTo: currentUserId },
      { userId: currentUserId }  // フォールバック
    ]
  }
});
```

### UI表示パターン
```tsx
// 担当者中心表示
<TaskCard>
  <AssigneeInfo user={task.assignee} primary />
  <CreatorInfo user={task.creator} secondary />
  <AssigneeChangeButton taskId={task.id} />
</TaskCard>
```

## 🚨 重要な注意事項

### データ整合性
- `assignedTo` は必ず有効なユーザーIDを参照
- `createdBy` は作成時に必ず設定
- Foreign key制約でデータ整合性を保証

### パフォーマンス
- 担当者リレーションのEager loading設定
- 担当者別インデックス最適化
- N+1クエリ問題の回避

### セキュリティ
- 担当者変更権限の制御
- 作成者情報の保護
- データアクセス権限の明確化

### 後方互換性
- 既存API動作の保証
- Legacy フィールドの段階的廃止
- 移行期間中の二重管理

## 📈 成功指標 (KPI)

### 運用指標
- 担当者設定率: 95%以上
- 担当者変更頻度: 月1回以下/エンティティ
- データ整合性: 100%維持

### ユーザー体験
- 担当者識別時間: 3秒以内
- 担当者変更操作: 1クリック
- 責任明確化の満足度: 80%以上

### システム指標
- API応答時間: 200ms以内維持
- データ移行完了率: 100%
- バグ発生率: 0.1%以下

## 🔮 将来展望

### 短期 (1-2ヶ月)
- UI全体の担当者中心化完了
- ダッシュボード担当者機能
- 通知システム担当者対応

### 中期 (3-6ヶ月)
- AI担当者推奨システム
- ワークロード自動バランシング
- 担当者パフォーマンス分析

### 長期 (6ヶ月以上)
- チーム担当者機能
- 外部システム担当者連携
- 担当者ベースワークフロー

---

## 📚 関連ドキュメント

- [移行SQLスクリプト](../migrate-to-assignee-system.sql)
- [TypeScript型定義](../src/lib/types.ts)
- [API仕様書](./API_REFERENCE.md)
- [LINE統合ガイド](./LINE_INTEGRATION_GUIDE.md)

---

**Last Updated**: 2025-06-17  
**Version**: 1.0  
**Status**: Implementation Phase 1 Complete