# ISSUE: 認証システム実装（緊急）

## 🚨 ステータス: 🔴 未着手
**優先度**: CRITICAL  
**担当者**: 次期開発エンジニア  
**期限**: システム運用開始前（必須）  
**工数見積**: 2-3日

## 問題概要
現在のシステムには認証機能が存在せず、本格運用時にセキュリティリスクとなる。

### 現在の状況
- ❌ NextAuth.js未実装
- ❌ セッション管理なし  
- ❌ ログイン/ログアウトUI未実装
- ✅ データベース（usersテーブル）準備完了
- ✅ 全APIエンドポイントで`createdBy`フィールド準備済み

## 実装タスク

### Day 1: 環境設定・基本実装
- [ ] `npm install next-auth @auth/prisma-adapter`
- [ ] 環境変数設定（NEXTAUTH_SECRET等）
- [ ] `src/app/api/auth/[...nextauth]/route.ts` 作成
- [ ] Google OAuth設定

### Day 2: UI実装・統合
- [ ] セッションプロバイダー追加
- [ ] ログイン/ログアウトボタン実装
- [ ] 各ページの認証チェック追加
- [ ] 既存usersテーブルとの連携

### Day 3: テスト・調整
- [ ] 認証フロー動作確認
- [ ] 既存機能との連携テスト
- [ ] エラーハンドリング実装

## 完了条件
- [ ] Google OAuth認証動作
- [ ] セッション管理機能動作
- [ ] 既存ユーザーデータとの紐付け完了
- [ ] 全ページでセキュリティ確保

## 進捗更新
**2025-06-21**: ISSUE作成 - システム運用前の必須実装として特定

---

## 🔄 ADDITIONAL PENDING TASKS FROM SYSTEM ANALYSIS

*The following tasks were extracted from current system documentation and represent incomplete work that should be prioritized alongside authentication implementation.*

### 🔴 HIGH PRIORITY - CRITICAL FIXES

### **15. 全エンティティリンク検出・管理システム** 🟢
**機能拡張**: ナレッジ含む全エンティティでリンク自動検出・分類・適切表示  
**実装内容**:
- テキストフィールドからのURL自動検出・構造化保存
- ミーティングURL・情報URL・一般URLの分類システム
- エンティティタイプ別の適切なUI表示（ボタン化等）
- entity_linksテーブル新設によるリンク情報管理

**技術要件**: 正規表現URL抽出、データベース拡張、ButtonUIコンポーネント
**補足**: 大規模機能のため段階的実装推奨。アクティブ開発課題で詳細仕様管理中

#### Calendar & Date Management Issues
- **Calendar UTC Display Problem** - Calendar showing UTC but registration in JST
  - **Impact**: User confusion and timezone display discrepancies
  - **Files**: `/src/components/calendar/*`, `/src/lib/utils/datetime-jst.ts`
  - **Effort**: 1-2 days

- **Appointment Date Management Flow** - Missing direct date fields, calendar_events not properly linked
  - **Impact**: Appointments not showing in calendar, complex date management
  - **Effort**: 2-3 days

#### UI/UX Critical Issues  
- **Edit Button Functionality Failures** - Edit buttons non-functional across all entities
  - **Impact**: Cannot update any data, major usability issue
  - **Effort**: 3-5 days

- **LINE Button Timeout Problem** - Registration buttons remain active after timeout
  - **Impact**: Duplicate registration, session confusion
  - **Effort**: 2-3 days

#### Kanban System Issues
- **Appointment Kanban UI Unification** - Partial completion with drag & drop problems
  - **Impact**: Inconsistent user experience
  - **Reference**: `HANDOVER_KANBAN_UI_2025-06-19.md`
  - **Effort**: 4-6 hours

### 🟡 MEDIUM PRIORITY - IMPORTANT IMPROVEMENTS

---

### **4. ナレッジ登録リンク除外問題** 🟡
**問題**: ナレッジ登録でリンクが除外されている（要約処理で削除？）  
**影響**: 重要な参考リンクの損失  
**対応**:
- リンク検知アルゴリズム改善
- UIコンポーネントでのリンクボタン化
- 要約処理でのリンク保持

**ファイル**: `/src/app/knowledge/page.tsx`、AI要約処理

### **16. DiscordボットCOMPASS API連携・イベント取得** 🟡 **NEW**
**機能拡張**: Discordボットの外部API連携強化とイベント管理
**実装内容**:
- COMPASS API連携によるイベント情報自動取得
- Discordチャンネルへのイベント通知自動化
- イベント参加者管理・リマインダー機能
- APIレスポンスのキャッシュ・エラーハンドリング

**技術要件**: COMPASS API統合、Discord.js拡張、スケジューラー実装
**補足**: 外部APIの仕様確認とレート制限対策が必要

### **17. KPIボット調整・Discordインサイト計算拡張** 🟡 **NEW**
**機能拡張**: Discord活動分析の高度化とKPI管理
**実装内容**:
- KPIボット側の計算ロジック調整・最適化
- Discordインサイト計算アルゴリズムの拡張
- 必要データの追加取得（メッセージ反応、スレッド活動、VC参加時間等）
- 分析ダッシュボードのデータ項目拡張
- カスタムメトリクスの定義・実装

**技術要件**: Discord API拡張活用、データ分析アルゴリズム、可視化改善
**補足**: プライバシー配慮とパフォーマンス最適化が重要


#### Data Management & Integration
- **Knowledge Link Preservation** - Links being stripped during registration
  - **Impact**: Loss of important reference information
  - **Effort**: 1-2 days

- **Calendar Integration Data Display** - Tasks/appointments not showing in calendar
  - **Impact**: Incomplete schedule management
  - **Files**: `/src/app/api/calendar/unified/route.ts`
  - **Effort**: 2-3 days

- **LINE Duplicate Registration** - Multiple entries from button spam/message duplication
  - **Impact**: Data pollution, storage waste
  - **Effort**: 3-4 days

#### Feature Enhancements
- **Company Search Auto-complete** - Similar company suggestions during input
  - **Effort**: 3-4 hours

- **Project-Appointment Linking** - Related projects field addition
  - **Effort**: 2-3 hours

- **Integrated Task Management** - Status transition task creation
  - **Effort**: 8-12 hours

- **Follow-up Automation** - Automatic task modal on follow-up transitions
  - **Effort**: 4-6 hours

- **Homepage Analytics Dashboard** - Google Analytics/Search Console integration
  - **Effort**: 10-14 hours

#### Technical Improvements
- **EventEditModal API Integration** - Use proper appointment endpoints
  - **Files**: `/src/components/calendar/EventEditModal.tsx`
  - **Effort**: 2-3 hours

- **Appointment Flow Modal Issues** - Modal display problems during transitions
  - **Effort**: 4-6 hours

### 🟢 LOW PRIORITY - FUTURE ENHANCEMENTS

### **9. プロジェクトチーム分析・レコメンデーション** 🟢
**機能拡張**: プロジェクトのチームメンバー選択時の高度分析  
**実装内容**:
- チームメンバーの特性・適性・MBTI・スキル分析
- プロジェクト成功率自動算出
- 不足能力・役割の自動レコメンド
- チーム編成最適化提案

**技術要件**: AI分析エンジン拡張、MBTI分析、スキルマッチング


### **10. パーソナライズドリソース管理** 🟢
**機能拡張**: 個人別リソースキャパシティ管理システム  
**実装内容**:
- ユーザー別リソースキャパシティ設定
- タスク・予定のリソース計算
- オーバーワーク・余裕度のサマリー表示
- 得意不得意によるパーソナライズド見積もり
- リソース配分最適化提案

**技術要件**: リソース計算エンジン、個人特性分析、予測アルゴリズム


### **11. プロジェクト統合管理システム** 🟢
**機能拡張**: プロジェクト中心の統合管理機能  
**実装内容**:
- タスク・アポとプロジェクトの自動紐づけ
- 進捗率への自動反映
- プロジェクトアクティブ率計算
- ガントチャート自動マイルストーン化
- 作成時の親子関係設定
- 既存エンティティとの紐づけ機能

**技術要件**: プロジェクト関係性エンジン、ガントチャート拡張、進捗計算


### **13. タスク難易度スコア精度向上・活用拡大** 🟢
**機能拡張**: difficultyScoreアルゴリズムの精度向上と活用範囲拡大  
**実装内容**:
- AIベースの難易度分析精度向上
- ユーザー実績データによる学習機能
- 難易度に基づく自動優先度調整
- チームメンバーとの難易度差分析
- プロジェクト全体の難易度バランス最適化

**技術要件**: ML学習機能、実績データ蓄積、パーソナライゼーション
**補足**: 現在は基本的な数値計算のみ。AI分析・個人適性・実績反映で精度向上可能



#### UI/UX Standardization
- **Icon System Unification** - Replace emojis with Lucide React icons
  - **Effort**: 1-2 days

- **Universal Kanban Implementation** - Unified drag & drop with animations
  - **Effort**: 2-3 days

- **Responsive Design Optimization** - Mobile/tablet display improvements
  - **Effort**: 2 days

#### Advanced Features
- **Project Team Analysis** - MBTI, skills analysis, success rate calculations
  - **Effort**: 1-2 weeks

- **Personalized Resource Management** - Individual capacity management
  - **Effort**: 1-2 weeks

- **All Entity Link Detection** - Automatic URL classification and display
  - **Effort**: 8-12 hours

- **AI-Enhanced Difficulty Scoring** - Learning-based task difficulty analysis
  - **Effort**: 1-2 weeks

### 🔬 INVESTIGATION & RESEARCH TASKS

#### System Analysis
- **Comprehensive Testing Implementation** - Full system quality assurance
  - **Scope**: Functionality, data integrity, performance, security, usability
  - **Effort**: 1-2 weeks

- **Unused Feature Discovery** - Identify underutilized system capabilities
  - **Effort**: 3-5 days

- **Documentation Gap Analysis** - Find designed but unimplemented features
  - **Effort**: 2-3 days

  
### **12. LINE既存データ編集機能** 🟢
**機能拡張**: LINEから既存の予定・アポ・タスクの編集機能  
**実装内容**:
- 既存データ検索・選択
- 編集項目選択
- 更新処理
- 変更履歴管理

**技術要件**: 検索機能、編集UI、差分管理


### 📊 DATABASE EXTENSIONS NEEDED

Several features require schema modifications:

```sql
-- Entity Links Management
CREATE TABLE entity_links (
  id VARCHAR PRIMARY KEY,
  entity_type VARCHAR,
  entity_id VARCHAR,
  url VARCHAR,
  link_type VARCHAR,
  title VARCHAR,
  created_at TIMESTAMP
);

-- Appointment History Tracking
CREATE TABLE appointment_history (
  id VARCHAR PRIMARY KEY,
  appointment_id VARCHAR,
  status_from VARCHAR,
  status_to VARCHAR,
  notes TEXT,
  created_by VARCHAR,
  created_at TIMESTAMP
);

-- Appointment-Task Relationships
CREATE TABLE appointment_tasks (
  id VARCHAR PRIMARY KEY,
  appointment_id VARCHAR,
  task_id VARCHAR,
  relationship_type VARCHAR,
  created_at TIMESTAMP
);
```

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

1. **Complete Authentication** (Days 1-3)
2. **Fix Critical Edit Button Issues** (Days 4-8)
3. **Resolve Calendar UTC Problems** (Days 9-10)
4. **Address LINE System Issues** (Days 11-14)
5. **Implement Medium Priority Features** (Weeks 3-4)
6. **UI/UX Standardization** (Week 5)
7. **Advanced Features & Analysis** (Weeks 6-8)

## 📝 NOTES

- Many tasks are interconnected and should be planned together
- Database changes require careful migration planning
- Some features may be partially implemented - verification needed
- Priority should be given to user-blocking issues before feature enhancements

*Last Updated: 2025-06-21*
*Source: System documentation analysis*