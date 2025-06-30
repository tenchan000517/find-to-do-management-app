# 統合的実装計画書 - アポ管理・ナレッジ管理・プロジェクト管理統合システム

**作成日**: 2025-06-15  
**基本方針**: Claude Code開発手法論準拠・AI呼び出し効率化・段階的実装

---

## 🎯 実装概要

### **統合システムの目的**
- **アポ管理**: 営業活動の効率化・関係構築の可視化
- **ナレッジ管理**: 組織智慧の自動蓄積・再利用
- **プロジェクト管理**: 既存システムとの完全統合
- **AI活用**: 効率的なAI呼び出しによる自動化・最適化

### **既存システムとの関係**
- 現在のタスク管理システム（Phase 1-6完了）をベースに拡張
- 既存の16テーブル、27APIを破壊せずに機能追加
- AI呼び出しマネージャーによる統合的なAI利用

---

## 📊 システムアーキテクチャ

### **データベース拡張計画**

```prisma
// 新規追加テーブル

// アポイント管理拡張
model appointment_details {
  id                String   @id @default(cuid())
  appointmentId     String   @unique
  status            String   // 初回接触、継続接触、定期接触、パートナー関係
  phase             String   // 情報収集、提案準備、商談、クロージング、受注
  leadSource        String   // テレアポ、イベント、SNS、コミュニティ、紹介、その他
  locationType      String   // online, offline
  locationDetail    String?  // Zoomリンク、住所等
  aiImportance      Float    @default(50)
  nextActionType    String?  // next_appointment, completed, reschedule
  appointment       appointments @relation(fields: [appointmentId], references: [id])
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// ナレッジ管理拡張
model knowledge_templates {
  id                String   @id @default(cuid())
  knowledgeId       String   @unique
  templateType      String   // project_template, document_template
  category          String   // 案件受注系、イベント企画系、etc
  templateData      Json     // ガントチャート、タスク構成、アポフロー等
  sourceProjectId   String?
  usageCount        Int      @default(0)
  lastUsedAt        DateTime?
  knowledge         knowledge_items @relation(fields: [knowledgeId], references: [id])
  createdAt         DateTime @default(now())
}

// AI呼び出し管理
model ai_call_logs {
  id                String   @id @default(cuid())
  callType          String   // text_extraction, evaluation, kgi_generation
  prompt            String
  response          String?
  tokenUsed         Int
  duration          Int      // milliseconds
  status            String   // success, error, rate_limited
  errorMessage      String?
  userId            String?
  createdAt         DateTime @default(now())
}
```

### **AI呼び出しアーキテクチャ**

```
┌─────────────────────────────────────────────────┐
│             AI Call Manager                      │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────┐│
│  │Rate Limiter │ │   Cache     │ │Usage Track ││
│  └─────────────┘ └─────────────┘ └────────────┘│
└────────────────────┬────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────▼─────┐ ┌──────▼──────┐ ┌─────▼──────┐
│Text      │ │Evaluation   │ │KGI         │
│Processor │ │Engine       │ │Generator   │
└──────────┘ └─────────────┘ └────────────┘
     │               │               │
     └───────────────┼───────────────┘
                     │
                ┌────▼────┐
                │Gemini AI│
                └─────────┘
```

---

## 🔄 実装フェーズ計画

### **Phase 7: AI呼び出し基盤整備（1週間）**

#### **目的**: AI呼び出しの効率化・安定化

#### **実装内容**:
1. **AI Call Manager実装**
   - `src/lib/ai/call-manager.ts`
   - レート制限処理（1分60回、1日1500回）
   - キャッシング機能（Redis/メモリキャッシュ）
   - 使用量追跡

2. **既存AI機能のリファクタリング**
   - `text-processor.ts` → Call Manager経由に変更
   - `evaluation-engine.ts` → 実際のGemini API呼び出し実装
   - エラーハンドリング強化

3. **モニタリング機能**
   - `/api/admin/ai-usage` - AI使用状況API
   - 日次/月次レポート機能
   - 予算アラート機能

#### **成果物**:
- AI Call Managerクラス
- 使用量モニタリングダッシュボード
- リファクタリング済みAI機能

---

### **Phase 8: アポ管理システム実装（2週間）**

#### **目的**: 営業活動の効率化・関係構築の可視化

#### **実装内容**:

**Week 1: 基本機能**
1. **データモデル拡張**
   - appointment_detailsテーブル追加
   - 既存appointmentsテーブルとの関連付け

2. **4つのカンバンUI実装**
   - アポ処理カンバン（完了・調整・継続管理）
   - ステータスカンバン（関係性管理）
   - フェーズカンバン（KPI直結管理）
   - 流入経路カンバン（出会い経緯管理）

3. **基本API実装**
   - `/api/appointments/[id]/details` - 詳細情報管理
   - `/api/appointments/kanban/[type]` - カンバン別データ取得
   - `/api/appointments/[id]/complete` - 完了処理

**Week 2: AI連携・自動化**
1. **AI重要度計算**
   - 新規: `src/lib/ai/appointment-evaluator.ts`
   - Call Manager経由でのGemini API呼び出し
   - バッチ処理での一括更新

2. **コネクション自動連携**
   - アポ完了時の自動保存/更新
   - 関係値スコアの計算・更新

3. **LINE Bot連携**
   - アポ終了後フォロー機能
   - 週間サマリー配信

#### **成果物**:
- 4種類のカンバンUI
- アポ管理API群
- AI重要度自動計算
- LINE Bot通知機能

---

### **Phase 9: ナレッジ管理システム実装（2週間）**

#### **目的**: 組織智慧の自動蓄積・再利用促進

#### **実装内容**:

**Week 1: 基本昇華機能**
1. **データモデル拡張**
   - knowledge_templatesテーブル追加
   - 既存knowledge_itemsテーブルの拡張

2. **タスク→ナレッジ昇華**
   - タスク完了時のAI価値判定
   - ワンクリック昇華UI
   - `/api/tasks/[id]/upgrade-to-knowledge`

3. **プロジェクト→テンプレート昇華**
   - プロジェクト完了時の総合評価
   - テンプレート化提案UI
   - `/api/projects/[id]/create-template`

**Week 2: 活用機能**
1. **プロジェクトテンプレート選択**
   - 新規プロジェクト作成時のテンプレート選択UI
   - テンプレートからの自動生成機能
   - ガントチャート、タスク、アポフローの一括作成

2. **関連ナレッジリンク**
   - タスク/アポ登録時の関連ナレッジ表示
   - AI による関連性判定（Call Manager経由）

3. **資料テンプレート機能**
   - Googleドライブ連携
   - Reactコンポーネントベースのテンプレート

#### **成果物**:
- ナレッジ昇華機能
- プロジェクトテンプレート機能
- 関連ナレッジリンク機能
- 資料テンプレート基盤

---

### **Phase 10: 統合・最適化（1週間）**

#### **目的**: 3システムの完全統合・パフォーマンス最適化

#### **実装内容**:
1. **クロスシステム連携**
   - アポ→タスク自動生成
   - アポ→プロジェクト昇華判定
   - ナレッジ→アポ戦略提案

2. **パフォーマンス最適化**
   - データベースインデックス最適化
   - クエリ最適化
   - フロントエンドバンドル最適化

3. **統合ダッシュボード**
   - プロジェクト・アポ・ナレッジの統合ビュー
   - AI利用状況の可視化
   - 全体KPIダッシュボード

#### **成果物**:
- 統合ダッシュボード
- 最適化済みシステム
- 運用ドキュメント

---

## 🚨 実装上の注意事項

### **絶対厳守事項**

1. **既存システムの保護**
   - Phase 1-6の実装を破壊しない
   - 既存APIの後方互換性維持
   - データマイグレーションは慎重に

2. **AI呼び出しの効率化**
   - 必ずAI Call Manager経由で呼び出す
   - キャッシュ可能な内容は積極的にキャッシュ
   - バッチ処理は並行数を制限（5並行まで）

3. **段階的実装**
   - 各Phaseごとに動作確認
   - TypeScriptエラー0を維持
   - ビルド成功を確認してからコミット

### **開発プロセス**

1. **セッション開始時**
```bash
# 状況確認
git status
npm run build
npx tsc --noEmit

# AI使用量確認
curl http://localhost:3000/api/admin/ai-usage
```

2. **実装時**
   - TodoWriteで細かくタスク管理
   - 1機能ごとに動作確認
   - 既存機能への影響を常に確認

3. **コミット時**
   - Phase完了時のみコミット
   - 包括的なテストを実施
   - ドキュメント更新も同時に

---

## 📈 成功指標

### **Phase 7-10共通**
- TypeScriptエラー: 0件維持
- ビルド成功率: 100%
- 既存機能影響: 0件

### **AI効率化指標**
- API呼び出し削減率: 50%以上（キャッシュによる）
- エラー率: 1%以下
- 平均レスポンス時間: 2秒以内

### **機能別指標**
- アポ管理: 操作時間70%削減
- ナレッジ管理: テンプレート使用率50%以上
- 統合効果: プロジェクト立ち上げ時間70%短縮

---

## 🔄 リスク管理

### **技術的リスク**
1. **AI API制限**
   - 対策: キャッシング、レート制限、フォールバック
   
2. **データベース負荷**
   - 対策: インデックス最適化、クエリ最適化

3. **フロントエンド複雑化**
   - 対策: コンポーネント分割、遅延読み込み

### **運用リスク**
1. **AI コスト増大**
   - 対策: 使用量モニタリング、予算アラート

2. **ユーザー混乱**
   - 対策: 段階的UI変更、ヘルプ機能充実

---

**この実装計画により、既存システムを保護しながら、効率的にアポ管理・ナレッジ管理機能を統合し、AI呼び出しを最適化した高度なプロジェクト管理システムを実現します。**