# UI/UXカンバン改善プロジェクト - 包括要件定義書

**作成日**: 2025-06-17  
**対象**: カレンダー・タスク・アポイント・プロジェクトページUI/UX統一改善  
**目的**: 抜け漏れ防止・完全性確保のための包括的要件定義  

---

## 1. プロジェクト概要

### 1.1 目的・目標
- **統一UI/UX実現**: 4ページ（カレンダー・タスク・アポイント・プロジェクト）の完全統一
- **ワークフロー最適化**: 高度なタスクフロー・アポイントメント日程管理自動化
- **ユーザビリティ向上**: マイクロアニメーション・直感的操作の実現
- **開発効率向上**: 共通コンポーネント化によるメンテナンス性向上

### 1.2 適用範囲
#### 対象ページ
- `/calendar` - カレンダー・スケジュール管理
- `/tasks` - タスク管理（4種類のカンバン）
- `/appointments` - アポイントメント・営業管理（4種類のカンバン）
- `/projects` - プロジェクト管理（テーブル・カード・ガント表示）

#### 除外項目
- カレンダーブリッジ機能（明確に不要）
- 他ページ（/connections, /knowledge等）への影響

---

## 2. 機能要件

### 2.1 UI統一要件

#### 2.1.1 アイコンシステム統一
- **必須**: 絵文字完全削除
- **必須**: Lucide React統一使用
- **検証**: 実在アイコンの事前チェック
- **適用**: 11ファイル・200箇所以上の統一実装

#### 2.1.2 共通UIコンポーネント
```typescript
// 必須実装コンポーネント
interface UniversalKanbanCard {
  item: T;
  type: 'task' | 'appointment' | 'project' | 'calendar';
  onEdit: (item: T) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string) => void;
  showMECEIcon?: boolean;
  draggable?: boolean;
}

interface UniversalKanban {
  columns: KanbanColumn[];
  items: T[];
  itemType: string;
  onItemMove: (itemId: string, newColumnId: string) => void;
  renderCard: (item: T) => React.ReactNode;
  enableAddCards?: boolean;
  onAddCard?: (columnId: string) => void;
}

interface AddCardButton {
  columnId: string;
  columnTitle: string;
  itemType: string;
  onAdd: (columnId: string) => void;
  disabled?: boolean;
}
```

#### 2.1.3 マイクロアニメーション統一
- **カードホバー**: `hover:scale-[1.02] hover:shadow-lg`
- **ドラッグアニメーション**: `scale-105 shadow-2xl opacity-90 rotate-1`
- **カード追加アニメーション**: `slideInFromTop 0.3s ease-out`
- **リアルタイム更新**: `pulseScale 0.6s ease-in-out`

### 2.2 タスクワークフロー高度化要件

#### 2.2.1 ステータス移動フロー
```typescript
interface TaskStatusFlow {
  // アイデア → 計画中
  IDEA_TO_PLAN: {
    action: 'ステータス更新のみ';
    result: 'status: PLAN';
  };
  
  // 計画中 → 実行中  
  PLAN_TO_DO: {
    condition: 'dueDate必須チェック';
    noDateAction: 'アラート/トースト表示 → 日付設定モーダル';
    result: 'status: DO + dueDate設定';
  };
  
  // 実行中 → 課題改善
  DO_TO_CHECK: {
    action: 'ステータス更新のみ';
    result: 'status: CHECK';
  };
  
  // 課題改善 → 完了
  CHECK_TO_COMPLETE: {
    options: ['アーカイブ化', 'ナレッジ化'];
    archiveAction: 'status: COMPLETE';
    knowledgeAction: 'ナレッジ待機カンバンに移動 + 詳細入力ボタン表示';
  };
  
  // 課題改善 → 実行中（戻り）
  CHECK_TO_DO: {
    required: 'サマリー入力モーダル';
    result: 'status: DO + summary保存';
  };
}
```

#### 2.2.2 DELETEカンバン廃止・更新アイコン実装
- **削除**: DELETEカンバンを完全廃止
- **実装**: カード右上に更新アイコン（RotateCcw）
- **機能**: リスケモーダル表示
  - 期日リセット + アイデアに戻す
  - 改善項目記入 + 実行中へ移動
  - リスケ（削除）

#### 2.2.3 タブ別カンバン移動仕様
```typescript
interface TabSpecificKanbanFlow {
  // ユーザー別タブ
  userTab: {
    dragAction: 'カンバン間移動で担当者変更';
    result: 'assignedTo更新';
  };
  
  // プロジェクト別タブ  
  projectTab: {
    dragAction: 'カンバン間移動でプロジェクト紐付け変更';
    result: 'projectId更新';
  };
  
  // 期限別タブ
  deadlineTab: {
    columns: ['期限切れ', '今日', '来週', '来月'];
    moveActions: {
      '期限切れ → 今日': 'dueDate = today',
      '今日 → 来週': 'dueDate = today + 7日',
      '来週 → 来月': 'dueDate = nextMonth'
    };
  };
}
```

### 2.3 MECEタスク関係性システム要件

#### 2.3.1 MECE関係性機能
```typescript
interface MECETaskRelationship {
  meceIcon: {
    type: 'ドラッグ可能アイコン';
    function: '共通プロジェクトへの紐付け';
    表現対象: ['転用可能タスク', '同時完了タスク'];
  };
  
  relationshipTypes: {
    TRANSFERABLE: '転用可能タスク';
    SIMULTANEOUS: '同時完了タスク';
    DEPENDENT: '依存関係タスク';
  };
  
  database: {
    table: 'task_relationships';
    fields: ['sourceTaskId', 'targetTaskId', 'relationshipType', 'projectId'];
  };
}
```

### 2.4 カレンダー日付移動要件

#### 2.4.1 カレンダー日付マス移動機能
- **実装**: 日付マスからのドラッグ&ドロップ
- **対象**: タスク・アポイント・カレンダーイベント・個人予定
- **結果**: 該当日付への自動変更
- **API連携**: 種別に応じた適切なエンドポイント呼び出し

### 2.5 アポイントメントワークフロー完全自動化要件

#### 2.5.1 タブ別カンバン移動による自動ステータス更新

**処理状況タブ（processing）**
```typescript
interface ProcessingStatusFlow {
  'PENDING → IN_PROGRESS': {
    trigger: '実施日入力モーダル表示';
    required: ['dateTime', 'location'];
    result: 'calendar_events作成 + processingStatus: IN_PROGRESS';
  };
  'IN_PROGRESS → COMPLETED': {
    trigger: '次回アポ確認モーダル';
    options: ['次回なし', '次回あり'];
    result: 'processingStatus: COMPLETED + 次回アポ作成（オプション）';
  };
}
```

**関係性タブ（relationship）**
```typescript
interface RelationshipStatusFlow {
  'FIRST_CONTACT → RAPPORT_BUILDING': {
    action: '関係性ステータス自動更新';
    result: 'relationshipStatus: RAPPORT_BUILDING';
    connectionUpdate: 'connections.relationshipStatus自動更新';
  };
  // 他の関係性移動も同様
}
```

**営業フェーズタブ（phase）**
```typescript
interface SalesPhaseFlow {
  'CLOSING → CONTRACT': {
    trigger: '契約処理モーダル';
    actions: ['バックオフィスタスク自動生成', 'ナレッジ登録'];
    result: 'phaseStatus: CONTRACT + タスク生成';
  };
}
```

#### 2.5.2 契約処理・バックオフィスタスク自動生成
```typescript
interface ContractProcessingFlow {
  backOfficeTaskTemplates: [
    {
      title: '契約書作成',
      status: 'PLAN',
      priority: 'A',
      dueDate: '+3days',
      assignedTo: 'legal_team'
    },
    {
      title: '請求書発行',
      status: 'PLAN', 
      priority: 'A',
      dueDate: '+1day',
      assignedTo: 'accounting_team'
    },
    // 他のテンプレート
  ];
  
  knowledgeTemplate: {
    title: '営業ナレッジ: ${companyName}',
    category: 'sales',
    content: '成功事例・課題・提案内容・決定要因等'
  };
}
```

---

## 3. 非機能要件

### 3.1 パフォーマンス要件
- **レスポンス時間**: カンバン移動 < 200ms
- **アニメーション**: 60fps維持
- **データロード**: 初回表示 < 500ms
- **メモリ使用量**: ブラウザメモリ < 100MB

### 3.2 互換性要件
- **ブラウザ**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **デバイス**: デスクトップ・タブレット・モバイル完全対応
- **解像度**: 320px〜4K対応

### 3.3 セキュリティ要件
- **認証**: 既存JWT認証システム維持
- **データ保護**: CSRF・XSS対策維持
- **API**: 既存レート制限・バリデーション維持

### 3.4 可用性要件
- **アップタイム**: 99.9%
- **エラー復旧**: 自動エラーハンドリング
- **オフライン**: 基本閲覧機能のオフライン対応

---

## 4. データ要件

### 4.1 データベーススキーマ拡張

#### 4.1.1 新規テーブル
```sql
-- タスク関係性テーブル（MECE対応）
CREATE TABLE task_relationships (
  id VARCHAR(255) PRIMARY KEY,
  source_task_id VARCHAR(255) NOT NULL,
  target_task_id VARCHAR(255),
  project_id VARCHAR(255),
  relationship_type ENUM('TRANSFERABLE', 'SIMULTANEOUS', 'DEPENDENT') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  
  FOREIGN KEY (source_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (target_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);
```

#### 4.1.2 既存テーブル拡張
```sql
-- タスクにサマリーフィールド追加
ALTER TABLE tasks 
ADD COLUMN summary TEXT DEFAULT NULL,
ADD COLUMN improvement_notes TEXT DEFAULT NULL,
ADD COLUMN related_appointment_id VARCHAR(255) DEFAULT NULL,
ADD COLUMN is_back_office_task BOOLEAN DEFAULT FALSE,
ADD COLUMN tags JSON DEFAULT NULL;

-- アポイントメント契約情報追加
ALTER TABLE appointments 
ADD COLUMN contract_value DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN contract_type VARCHAR(50) DEFAULT NULL,
ADD COLUMN contract_date TIMESTAMP DEFAULT NULL;

-- カレンダーイベントソース追加
ALTER TABLE calendar_events 
ADD COLUMN source VARCHAR(50) DEFAULT 'manual',
ADD COLUMN related_appointment_id VARCHAR(255) DEFAULT NULL;

-- ナレッジアイテム拡張
ALTER TABLE knowledge_items
ADD COLUMN related_appointment_id VARCHAR(255) DEFAULT NULL,
ADD COLUMN contract_value DECIMAL(10,2) DEFAULT NULL;

-- プロジェクト拡張
ALTER TABLE projects
ADD COLUMN contract_value DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN contract_type VARCHAR(50) DEFAULT NULL,
ADD COLUMN related_appointment_id VARCHAR(255) DEFAULT NULL;
```

### 4.2 API要件

#### 4.2.1 新規APIエンドポイント
```
POST /api/tasks/{id}/update-action          # タスク更新アクション
POST /api/appointments/{id}/schedule         # アポイント日程設定
PATCH /api/appointments/{id}/schedule        # アポイント完了処理
POST /api/appointments/{id}/contract         # 契約処理
POST /api/task-relationships                # MECE関係性作成
GET /api/calendar/unified                    # 統合カレンダー（拡張）
```

#### 4.2.2 既存API拡張
- カレンダー統合API: アポイント情報統合
- タスクAPI: 関係性情報含む詳細取得
- アポイントAPI: 契約情報・バックオフィス連携

---

## 5. UI/UX要件

### 5.1 デザイン統一要件

#### 5.1.1 色彩統一
```css
:root {
  --kanban-primary: #3b82f6;
  --kanban-secondary: #64748b;
  --kanban-success: #10b981;
  --kanban-warning: #f59e0b;
  --kanban-danger: #ef4444;
  
  --animation-fast: 150ms;
  --animation-normal: 200ms;
  --animation-slow: 300ms;
}
```

#### 5.1.2 アニメーション統一
- **カードホバー**: `transition-all duration-200 ease-out`
- **ドラッグ**: `scale-105 rotate-2 shadow-2xl`
- **追加**: `slideInFromTop 0.3s ease-out`

### 5.2 レスポンシブ対応

#### 5.2.1 ブレークポイント
- **モバイル**: ~640px（1列表示）
- **タブレット**: 640px~1024px（2列表示）
- **デスクトップ小**: 1024px~1280px（3列表示）
- **デスクトップ大**: 1280px~（4列以上表示）

#### 5.2.2 モバイル最適化
- **タッチ操作**: 250ms長押しでドラッグ開始
- **最小タップサイズ**: 44px以上
- **縦並びレイアウト**: カンバン列の縦積み

### 5.3 アクセシビリティ要件
- **キーボード操作**: Tab・Enter・Spaceキー対応
- **スクリーンリーダー**: ARIA属性完全対応
- **コントラスト**: WCAG 2.1 AA準拠
- **フォーカス表示**: 明確なフォーカスリング

---

## 6. 開発要件

### 6.1 技術要件

#### 6.1.1 必須技術スタック
- **フロントエンド**: Next.js 15 + TypeScript + Tailwind CSS
- **ドラッグ&ドロップ**: @dnd-kit/core （継続使用）
- **アイコン**: Lucide React （統一必須）
- **アニメーション**: CSS Transitions + Keyframes

#### 6.1.2 品質要件
- **TypeScriptエラー**: 0件維持
- **ESLintエラー**: 0件維持
- **ビルド成功**: 100%必須
- **テストカバレッジ**: 80%以上

### 6.2 開発プロセス要件

#### 6.2.1 実装フェーズ
1. **Phase 1 (1週間)**: アイコン統一・基盤構築
2. **Phase 2 (1週間)**: タスクワークフロー高度化
3. **Phase 3 (1週間)**: MECE関係性・カレンダー日付移動
4. **Phase 4 (1週間)**: アポイントメント営業フェーズ・契約処理
5. **Phase 5 (1週間)**: バックオフィス連携・統合テスト

#### 6.2.2 品質管理
```bash
# 各フェーズ完了時の必須チェック
npm run typecheck    # 0件必須
npm run lint         # 0件必須  
npm run build        # 成功必須
```

---

## 7. 制約事項

### 7.1 技術制約
- **データベース**: 破壊的変更禁止
- **API**: 後方互換性保持必須
- **既存機能**: 100%維持必須

### 7.2 リソース制約
- **実装期間**: 5週間厳守
- **パフォーマンス**: 既存性能を下回らない
- **メモリ**: 既存使用量+20%以内

### 7.3 運用制約
- **ダウンタイム**: 計画メンテナンス時のみ
- **データ移行**: リアルタイム実行必須
- **ロールバック**: 各フェーズでロールバック可能

---

## 8. 受入れ基準

### 8.1 機能受入れ基準

#### 8.1.1 UI統一
- [ ] 絵文字完全削除済み
- [ ] Lucide React統一実装済み
- [ ] 共通カンバンコンポーネント動作
- [ ] +カード追加ボタン全カンバン配置
- [ ] マイクロアニメーション統一実装

#### 8.1.2 タスクワークフロー
- [ ] ステータス移動フロー完全実装
- [ ] 期日設定モーダル動作
- [ ] 更新アイコン・リスケモーダル実装
- [ ] タブ別カンバン移動動作

#### 8.1.3 MECE関係性
- [ ] MECE関係性アイコン実装
- [ ] ドラッグによる関係性作成
- [ ] 関係性可視化表示

#### 8.1.4 カレンダー日付移動
- [ ] 日付マス間ドラッグ&ドロップ動作
- [ ] 全イベント種別対応
- [ ] 適切なAPI連携

#### 8.1.5 アポイントメントワークフロー
- [ ] タブ別自動ステータス更新
- [ ] 日程管理モーダル実装
- [ ] 契約処理・バックオフィス連携
- [ ] ナレッジ自動登録

### 8.2 品質受入れ基準
- [ ] TypeScriptエラー 0件
- [ ] ESLintエラー 0件
- [ ] ビルド成功 100%
- [ ] 全ブラウザ動作確認
- [ ] モバイル・デスクトップ動作確認
- [ ] パフォーマンス要件達成

### 8.3 運用受入れ基準
- [ ] 既存データ100%保持
- [ ] 既存機能100%動作
- [ ] API互換性100%維持
- [ ] ロールバック手順確立

---

## 9. リスク分析

### 9.1 技術リスク
| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|----------|------|
| @dnd-kit互換性問題 | 高 | 低 | 事前検証・フォールバック |
| パフォーマンス劣化 | 中 | 中 | 段階的実装・測定 |
| TypeScript型エラー | 中 | 中 | 継続的チェック |

### 9.2 機能リスク
| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|----------|------|
| 既存機能破壊 | 高 | 低 | 段階的移行・テスト |
| データ不整合 | 高 | 低 | トランザクション処理 |
| UX劣化 | 中 | 中 | ユーザーテスト |

### 9.3 スケジュールリスク
| リスク | 影響度 | 発生確率 | 対策 |
|--------|--------|----------|------|
| 実装遅延 | 中 | 中 | フェーズ分割・優先順位 |
| 品質問題 | 高 | 低 | 継続的品質管理 |

---

## 10. 成功指標

### 10.1 定量指標
- **UI統一度**: 100%（アイコン・コンポーネント）
- **パフォーマンス**: レスポンス時間 < 200ms
- **品質**: TypeScript・ESLintエラー 0件
- **カバレッジ**: 機能動作確認 100%

### 10.2 定性指標
- **ユーザビリティ**: 直感的操作の実現
- **保守性**: 共通コンポーネント化
- **拡張性**: 将来機能追加への対応
- **一貫性**: 全ページ統一デザイン

---

この包括的要件定義により、抜け漏れなく完全なUI/UXカンバン改善プロジェクトを実現できます。