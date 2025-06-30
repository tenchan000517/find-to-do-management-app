# 担当者システム改修 - 全システム実装計画書

**作成日**: 2025-06-17  
**最終更新**: 2025-06-17 17:30  
**フェーズ**: Phase 1完了 → Phase 2-5実装計画  
**影響範囲**: UI・LINE Bot・カンバン・データ整合性・全コンポーネント  

---

## ✅ **Phase 1完了状況（2025-06-17）**

### **データベース改修完了**
- **7テーブル**: createdBy/assignedTo追加完了
- **219件データ**: 安全移行100%完了
- **6つのAPI**: 担当者変更エンドポイント実装完了
- **型安全性**: TypeScript対応完了

### **解決された問題**
✅ 担当者変更不可 → 全エンティティで変更可能  
✅ 責任の曖昧さ → 作成者・担当者完全分離  
✅ チーム運用困難 → マネージャー割り当て可能

---

## 🚀 **Phase 2-5: 全システム実装計画**

### **Phase 2: UI/UXコンポーネント改修** 🔴緊急
**期間**: 3-5日  
**影響**: 全フロントエンド画面

#### **2.1 基本UIコンポーネント改修**
| コンポーネント | 改修内容 | 優先度 | 工数 |
|---------------|----------|--------|------|
| **TaskCard** | 作成者・担当者表示分離 | 最高 | 1日 |
| **ProjectCard** | プロジェクトマネージャー表示 | 最高 | 1日 |
| **AppointmentCard** | 営業担当者表示 | 高 | 0.5日 |
| **KanbanBoard** | 担当者フィルター・変更UI | 最高 | 1.5日 |
| **UserProfileModal** | 担当タスク・管理プロジェクト分離 | 中 | 1日 |

#### **2.2 担当者変更UI実装**
```typescript
// 新しいUIコンポーネント実装必要
components/assignee/AssigneeSelector.tsx      // ドロップダウン選択
components/assignee/AssigneeChangeButton.tsx  // 変更ボタン
components/assignee/AssigneeDisplay.tsx       // 表示専用
components/assignee/AssigneeHistory.tsx       // 変更履歴
```

#### **2.3 影響を受けるページ・コンポーネント**
| ファイルパス | 影響内容 | 必要な変更 |
|-------------|----------|------------|
| `src/app/tasks/page.tsx` | タスク一覧表示 | 担当者表示・フィルター |
| `src/app/projects/page.tsx` | プロジェクト一覧 | マネージャー表示 |
| `src/components/Dashboard.tsx` | ダッシュボード | 担当者別集計 |
| `src/components/KanbanBoard.tsx` | カンバンボード | 担当者変更・表示 |
| `src/components/UserKanbanBoard.tsx` | ユーザー別カンバン | 担当者フィルター |
| `src/components/ProjectKanbanBoard.tsx` | プロジェクトカンバン | マネージャー表示 |
| `src/components/AppointmentKanbanBoard.tsx` | アポカンバン | 営業担当者表示 |

### **Phase 3: カンバンボード統合** 🔴緊急
**期間**: 2-3日  
**影響**: タスク移動・ステータス変更・担当者変更の統合

#### **3.1 カンバンボード担当者変更統合**
| 機能 | 現在の状態 | 必要な改修 | 工数 |
|------|------------|------------|------|
| **ドラッグ&ドロップ** | ステータス変更のみ | 担当者変更も統合 | 1日 |
| **担当者フィルター** | なし | 担当者別表示・絞り込み | 1日 |
| **カードUI** | 基本情報のみ | 作成者・担当者明確表示 | 0.5日 |
| **バルク操作** | なし | 複数タスク一括担当者変更 | 0.5日 |

#### **3.2 カンバンイベント統合**
```typescript
// カンバンボードイベント拡張
interface KanbanMoveEvent {
  taskId: string;
  fromStatus: string;
  toStatus: string;
  // 新規追加
  assigneeChange?: {
    fromAssignee: string;
    toAssignee: string;
    reason: string;
  };
}
```

### **Phase 4: LINE Bot統合・登録フロー改善** 🟡重要
**期間**: 3-4日  
**影響**: 外部連携・通知システム・新規登録

#### **4.1 LINE Bot担当者管理機能**
| 機能 | 改修内容 | 実装箇所 | 工数 |
|------|----------|----------|------|
| **担当者指定作成** | 「田中さんにタスク作成」コマンド | `src/lib/line/enhanced-command-detector.ts` | 1日 |
| **担当者変更通知** | 担当者変更時のLINE通知 | `src/lib/line/notification.ts` | 1日 |
| **担当者確認** | 「誰の担当？」クエリ対応 | LINE Webhook | 0.5日 |
| **登録フロー改善** | 初回登録時の担当者設定 | LINE Bot新規登録 | 1日 |

#### **4.2 LINE Bot登録フロー改善**
```typescript
// 新しい登録フロー
interface EnhancedRegistrationFlow {
  step1: UserBasicInfo;      // 基本情報
  step2: RoleAssignment;     // 役割・権限設定
  step3: DefaultAssignee;    // デフォルト担当者設定
  step4: TeamMemberSetup;    // チームメンバー招待
}
```

### **Phase 5: データ整合性・エラー防止** 🟡重要
**期間**: 2-3日  
**影響**: 全API・データベース操作・エラーハンドリング

#### **5.1 データ整合性チェック機能**
| チェック項目 | 実装内容 | 実装箇所 | 工数 |
|-------------|----------|----------|------|
| **担当者存在確認** | assigneeユーザーの存在・有効性 | API層 | 0.5日 |
| **作成者データ必須** | createdBy必須チェック | Prisma層 | 0.5日 |
| **権限チェック** | 担当者変更権限確認 | 認証層 | 1日 |
| **孤児データ検出** | 無効担当者の自動検出・修正 | バッチ処理 | 1日 |

#### **5.2 API層エラーハンドリング強化**
```typescript
// 担当者関連エラー定義
enum AssigneeError {
  ASSIGNEE_NOT_FOUND = 'ASSIGNEE_NOT_FOUND',
  ASSIGNEE_INACTIVE = 'ASSIGNEE_INACTIVE', 
  INVALID_PERMISSION = 'INVALID_PERMISSION',
  CREATOR_MISSING = 'CREATOR_MISSING'
}
```

---

## 🔍 **全システム影響度分析**

### **直接影響コンポーネント（高リスク）**
| コンポーネント | 影響度 | 理由 | 対応優先度 |
|---------------|--------|------|------------|
| `KanbanBoard.tsx` | ★★★ | ドラッグ&ドロップ・タスク表示 | 🔴最高 |
| `TaskCard.tsx` | ★★★ | 担当者表示・変更UI | 🔴最高 |
| `Dashboard.tsx` | ★★★ | 担当者別集計・フィルター | 🔴最高 |
| `UserProfileModal.tsx` | ★★☆ | プロフィール・担当タスク表示 | 🟡高 |
| `ProjectKanbanBoard.tsx` | ★★☆ | プロジェクト管理表示 | 🟡高 |

### **間接影響コンポーネント（中リスク）**
| コンポーネント | 影響度 | 理由 | 対応優先度 |
|---------------|--------|------|------------|
| `NotificationCenter.tsx` | ★★☆ | 担当者変更通知 | 🟡高 |
| `calendar/EventCard.tsx` | ★☆☆ | イベント責任者表示 | 🟢中 |
| `GanttChart.tsx` | ★☆☆ | プロジェクト担当者表示 | 🟢中 |
| `charts/*` | ★☆☆ | 担当者別データ集計 | 🟢中 |

### **API・サービス層影響**
| ファイル | 影響度 | 変更内容 | 対応優先度 |
|---------|--------|----------|------------|
| `prisma-service.ts` | ★★★ | 全CRUD操作の担当者対応 | 🔴最高 |
| `line/notification.ts` | ★★☆ | 担当者変更通知統合 | 🟡高 |
| `line/enhanced-command-detector.ts` | ★★☆ | 担当者指定コマンド | 🟡高 |
| `alert-engine.ts` | ★☆☆ | 担当者別アラート配信 | 🟢中 |

### **データ整合性リスク**
| リスク項目 | 発生確率 | 影響度 | 対策 |
|-----------|----------|--------|------|
| **担当者データ不整合** | 中 | 高 | バリデーション強化 |
| **既存API互換性破綻** | 低 | 高 | 段階的移行・テスト |
| **LINE Bot誤動作** | 中 | 中 | 担当者解析テスト |
| **UI表示エラー** | 高 | 中 | コンポーネント単体テスト |

---

## 📋 **実装チェックリスト・網羅的対応**

### **Phase 2: UI/UX改修チェックリスト**
#### **必須コンポーネント**
- [ ] `components/assignee/AssigneeSelector.tsx` - 担当者選択ドロップダウン
- [ ] `components/assignee/AssigneeChangeButton.tsx` - 変更ボタン
- [ ] `components/assignee/AssigneeDisplay.tsx` - 表示専用コンポーネント
- [ ] `components/assignee/AssigneeHistory.tsx` - 変更履歴表示

#### **既存コンポーネント改修**
- [ ] `KanbanBoard.tsx` - 担当者フィルター・ドラッグ&ドロップ統合
- [ ] `TaskCard.tsx` - 作成者・担当者分離表示
- [ ] `ProjectCard.tsx` - プロジェクトマネージャー表示
- [ ] `AppointmentCard.tsx` - 営業担当者表示
- [ ] `Dashboard.tsx` - 担当者別集計機能
- [ ] `UserProfileModal.tsx` - 担当・管理分離表示

#### **ページレベル改修**
- [ ] `src/app/tasks/page.tsx` - タスク一覧・フィルター
- [ ] `src/app/projects/page.tsx` - プロジェクト一覧・管理者表示
- [ ] `src/app/appointments/page.tsx` - アポ一覧・担当者表示
- [ ] `src/app/dashboard/page.tsx` - 統合ダッシュボード

### **Phase 3: カンバンボード統合チェックリスト**
- [ ] ドラッグ&ドロップイベント拡張
- [ ] 担当者変更API統合
- [ ] バルク操作機能（複数タスク一括変更）
- [ ] 担当者フィルター機能
- [ ] カンバンUI状態管理改修

### **Phase 4: LINE Bot統合チェックリスト**
- [ ] 担当者指定コマンド実装
- [ ] 担当者変更通知機能
- [ ] 登録フロー改善（担当者設定）
- [ ] 「誰の担当？」クエリ対応
- [ ] チームメンバー招待機能

### **Phase 5: データ整合性チェックリスト**
- [ ] 担当者存在確認バリデーション
- [ ] 作成者必須チェック
- [ ] 権限ベース担当者変更制御
- [ ] 孤児データ自動検出・修正
- [ ] API層エラーハンドリング統一

---

## ⚠️ **リスクマネジメント・回避策**

### **高リスク項目と対策**
1. **カンバンボード機能停止**
   - **リスク**: ドラッグ&ドロップ機能破綻
   - **対策**: 段階的実装・ロールバック機能

2. **LINE Bot誤動作**
   - **リスク**: 担当者解析エラー・通知送信失敗
   - **対策**: テストユーザーでの事前検証

3. **データベース不整合**
   - **リスク**: 担当者データの孤児化
   - **対策**: 移行前バックアップ・段階的チェック

### **緊急時対応計画**
```bash
# 緊急ロールバック手順
git revert <commit-hash>  # UI変更の緊急戻し
npm run build            # 動作確認
pkill -f "next dev"      # プロセス再起動
npm run dev             # サービス復旧確認
```

---

## 📊 **工数・スケジュール**

### **全Phase工数サマリー**
| Phase | 内容 | 工数 | 期間 | 担当推奨 |
|-------|------|------|------|----------|
| **Phase 2** | UI/UX改修 | 5日 | 1週間 | フロントエンド |
| **Phase 3** | カンバン統合 | 3日 | 3-4日 | フルスタック |
| **Phase 4** | LINE Bot統合 | 4日 | 1週間 | バックエンド |
| **Phase 5** | データ整合性 | 3日 | 3-4日 | バックエンド |
| **合計** | **全改修** | **15日** | **3-4週間** | **チーム**|

### **推奨実装順序**
1. **Week 1**: Phase 2 UI/UX改修（最重要）
2. **Week 2**: Phase 3 カンバン統合
3. **Week 3**: Phase 4 LINE Bot統合
4. **Week 4**: Phase 5 データ整合性・テスト

---

**この包括的計画により、担当者システム改修が全システムに安全かつ効果的に反映されます。**