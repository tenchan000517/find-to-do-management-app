# Googleドキュメント連携システム設計書

**作成日**: 2025-06-16  
**バージョン**: 1.0  
**対象URL**: https://docs.google.com/document/d/1jlKCfrxUnOGb9DvhlnVCPyzds-d_DYzEDUBf23jnXOY/edit?tab=t.0

---

## 🎯 システム概要

### 主要機能
1. **データベース連携強化**: 既存ナレッジ管理システムとGoogleドキュメントの統合
2. **自動監視・取得**: 新規ページ検出とコンテンツ自動取得
3. **AI要約・分類**: ドキュメント内容のタスク/予定/プロジェクト抽出とレコメンド機能

### システム要件
- 既存機能完全保持
- リアルデータベース連携
- レスポンシブUI対応
- セキュリティ・パフォーマンス考慮

---

## 🏗️ アーキテクチャ設計

### システム構成図
```
[Google Docs API] 
    ↓ OAuth 2.0
[Document Monitor Service] 
    ↓ 新規/更新検出
[AI Processing Engine] 
    ↓ 要約・分類
[Knowledge Database] 
    ↓ UI表示
[Enhanced Knowledge Management UI]
```

### データフロー
1. **監視**: Google Docs APIでドキュメント変更検出
2. **取得**: 新規/更新ページのコンテンツ取得
3. **処理**: Gemini AIで要約・タスク抽出
4. **保存**: データベースへの構造化保存
5. **表示**: UIでの視覚化・操作

---

## 📊 データベース設計

### 新規テーブル: google_docs_sources

```sql
CREATE TABLE google_docs_sources (
  id              VARCHAR(255) PRIMARY KEY,
  document_id     VARCHAR(255) NOT NULL,
  document_url    TEXT NOT NULL,
  title           TEXT NOT NULL,
  last_modified   TIMESTAMP,
  last_synced     TIMESTAMP DEFAULT NOW(),
  sync_status     VARCHAR(50) DEFAULT 'pending',
  page_count      INTEGER DEFAULT 0,
  error_message   TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_document_id (document_id),
  INDEX idx_last_modified (last_modified),
  INDEX idx_sync_status (sync_status)
);
```

### knowledge_items テーブル拡張

```sql
ALTER TABLE knowledge_items ADD COLUMN source_type VARCHAR(50) DEFAULT 'manual';
ALTER TABLE knowledge_items ADD COLUMN source_document_id VARCHAR(255);
ALTER TABLE knowledge_items ADD COLUMN source_page_number INTEGER;
ALTER TABLE knowledge_items ADD COLUMN source_url TEXT;
ALTER TABLE knowledge_items ADD COLUMN auto_generated BOOLEAN DEFAULT FALSE;

CREATE INDEX idx_source_type ON knowledge_items(source_type);
CREATE INDEX idx_source_document ON knowledge_items(source_document_id);
```

### 新規テーブル: ai_recommendations

```sql
CREATE TABLE ai_recommendations (
  id                VARCHAR(255) PRIMARY KEY,
  knowledge_item_id VARCHAR(255) REFERENCES knowledge_items(id),
  recommendation_type VARCHAR(50) NOT NULL, -- 'task', 'schedule', 'project'
  content           TEXT NOT NULL,
  confidence_score  DECIMAL(3,2),
  extracted_data    JSON,
  status           VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'expired'
  expires_at       TIMESTAMP DEFAULT (NOW() + INTERVAL '7 days'),
  created_at       TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_status_expires (status, expires_at),
  INDEX idx_recommendation_type (recommendation_type),
  INDEX idx_created_at (created_at)
);
```

---

## 🔌 API設計

### Google Docs 統合API

#### `/api/google-docs/auth` - OAuth認証
```typescript
// GET: 認証URL生成
// POST: 認証コード処理
// DELETE: 認証取り消し
```

#### `/api/google-docs/monitor` - ドキュメント監視
```typescript
// GET: 監視状況確認
// POST: 手動同期実行
// PUT: 監視設定更新
```

#### `/api/google-docs/sync` - 同期処理
```typescript
// POST: 指定ドキュメント同期
// GET: 同期履歴取得
```

### AI分析API

#### `/api/ai/document-analysis` - ドキュメント分析
```typescript
// POST: テキスト分析・要約・分類
interface DocumentAnalysisRequest {
  content: string;
  source_url: string;
  document_title: string;
}

interface DocumentAnalysisResponse {
  summary: string;
  categories: string[];
  extracted_tasks: TaskRecommendation[];
  extracted_schedules: ScheduleRecommendation[];
  extracted_projects: ProjectRecommendation[];
  confidence_scores: Record<string, number>;
}
```

### レコメンド管理API

#### `/api/recommendations` - レコメンド管理
```typescript
// GET: アクティブレコメンド取得
// POST: レコメンド作成
// PUT /api/recommendations/[id]: ステータス更新
// DELETE: 期限切れレコメンド削除
```

---

## 🎨 UI/UX設計

### ナレッジ管理画面拡張

#### 新規コンポーネント設計

**1. GoogleDocsSourceCard**
```tsx
interface GoogleDocsSourceCardProps {
  source: GoogleDocsSource;
  onSync: () => void;
  onRemove: () => void;
}
```
- ドキュメントタイトル・最終更新日時表示
- 同期ステータス・エラー表示
- 手動同期ボタン
- ソースドキュメントへのリンク

**2. RecommendationPanel**
```tsx
interface RecommendationPanelProps {
  recommendations: AIRecommendation[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}
```
- タスク/予定/プロジェクト別表示
- 信頼度スコア表示
- ワンクリック承認・却下
- 7日間の自動期限切れ

**3. GoogleDocsIntegrationModal**
```tsx
interface GoogleDocsIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (documentUrl: string) => void;
}
```
- OAuth認証フロー
- ドキュメントURL入力
- 接続ステータス表示

#### 既存UI改修

**KnowledgeManagementPage 拡張**
```tsx
// 追加セクション
- Google Docs ソース管理タブ
- AIレコメンドパネル
- 自動/手動切り替えスイッチ
- 同期履歴表示
```

### ダッシュボード統合

#### 新規ダッシュボードセクション
```tsx
<RecommendationDashboard>
  <AIRecommendationSummary />
  <QuickActionButtons />
  <WeeklyCleanupStatus />
</RecommendationDashboard>
```

---

## 🔧 技術実装詳細

### Google Docs API 統合

#### 認証設定
```typescript
// OAuth 2.0 設定
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// 必要スコープ
const SCOPES = [
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly'
];
```

#### ドキュメント監視サービス
```typescript
class GoogleDocsMonitorService {
  async checkForUpdates(documentId: string): Promise<boolean> {
    // 最終更新日時を比較
    // 変更検出時はtrue返却
  }
  
  async getDocumentContent(documentId: string): Promise<string> {
    // ドキュメント内容をプレーンテキストで取得
  }
  
  async schedulePeriodicCheck(): Promise<void> {
    // 毎日0:00に自動実行
    // cron式: "0 0 * * *"
  }
}
```

### AI分析エンジン

#### Gemini AI統合
```typescript
class DocumentAnalysisEngine {
  async analyzeDocument(content: string): Promise<AnalysisResult> {
    const prompt = `
    以下の議事録を分析し、以下の形式でJSON回答してください：
    
    1. 要約（200文字以内）
    2. 抽出されたタスク（担当者・期限含む）
    3. 抽出された予定（日時・参加者含む）
    4. 関連プロジェクト（新規または既存）
    5. カテゴリ分類（INDUSTRY/SALES/TECHNICAL/BUSINESS）
    
    コンテンツ:
    ${content}
    `;
    
    return await this.geminiClient.generateContent(prompt);
  }
}
```

### スケジューリング

#### 自動同期設定
```typescript
// Next.js API Route + Node-cron
import { scheduleJob } from 'node-schedule';

// 毎日0:00に実行
scheduleJob('0 0 * * *', async () => {
  await GoogleDocsMonitorService.checkAllDocuments();
});

// 手動トリガーAPI
export async function POST() {
  const result = await GoogleDocsMonitorService.forceSync();
  return Response.json(result);
}
```

---

## 🔒 セキュリティ・パフォーマンス

### セキュリティ対策

#### 認証・認可
```typescript
// OAuth 2.0 トークン管理
interface AuthTokenManager {
  storeToken(userId: string, token: OAuthToken): Promise<void>;
  refreshToken(userId: string): Promise<OAuthToken>;
  revokeToken(userId: string): Promise<void>;
}

// API使用量制限
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100 // リクエスト数上限
});
```

#### データ保護
- 環境変数での認証情報管理
- データベース暗号化（PostgreSQL TDE）
- HTTPS通信強制
- CSRF保護

### パフォーマンス最適化

#### キャッシング戦略
```typescript
// ドキュメント内容キャッシュ
const documentCache = new Map<string, {
  content: string;
  lastModified: Date;
  expiry: Date;
}>();

// AI分析結果キャッシュ（1時間）
const analysisCache = new LRU<string, AnalysisResult>({
  max: 100,
  ttl: 1000 * 60 * 60
});
```

#### バッチ処理
```typescript
// 複数ドキュメント並行処理
async function batchProcessDocuments(documentIds: string[]) {
  const batchSize = 5;
  for (let i = 0; i < documentIds.length; i += batchSize) {
    const batch = documentIds.slice(i, i + batchSize);
    await Promise.all(batch.map(processDocument));
    await sleep(1000); // レート制限対策
  }
}
```

---

## 📋 制約・考慮事項

### Google API制約
- **Quota制限**: 1日100,000リクエスト
- **レート制限**: 毎分100リクエスト
- **ドキュメントサイズ**: 最大1MB
- **同期頻度**: 推奨1日1回

### 技術的制約
- **OAuth認証**: ユーザー毎の認証必要
- **ネットワーク依存**: API接続必須
- **AIコスト**: Gemini API使用量
- **ストレージ**: ドキュメントコンテンツ保存容量

### 運用考慮事項
- **エラーハンドリング**: 認証切れ・ネットワークエラー
- **データ整合性**: 重複データ防止
- **ユーザビリティ**: シンプルな設定・操作
- **モニタリング**: 同期エラー・API使用量監視

---

## 🚀 段階的実装戦略

### Phase 1: 基盤構築
- データベーススキーマ追加
- Google API認証基盤
- 基本同期機能

### Phase 2: AI分析統合
- Gemini AI分析エンジン
- レコメンドシステム
- ダッシュボード表示

### Phase 3: UI/UX完成
- 統合管理画面
- レスポンシブ対応
- エラーハンドリング強化

### Phase 4: 運用最適化
- パフォーマンス改善
- 監視・アラート機能
- 自動化強化

---

## ✅ 成功指標

### 機能指標
- ✅ Google Docs自動同期成功率 > 95%
- ✅ AI分析精度（タスク抽出） > 80%
- ✅ レコメンド採用率 > 60%
- ✅ 既存機能の動作継続 100%

### パフォーマンス指標
- ✅ 同期処理時間 < 30秒
- ✅ UI応答時間 < 2秒
- ✅ エラー発生率 < 5%
- ✅ システム稼働率 > 99%

---

## 📚 関連ドキュメント

- **既存システム**: [DEVELOPMENT_PROMPT.md](../DEVELOPMENT_PROMPT.md)
- **実装計画**: [実装フェーズ計画書] (次のタスクで作成)
- **技術仕様**: [各フェーズ詳細実装手順書] (後続タスクで作成)
- **運用ガイド**: [運用・保守マニュアル] (Phase 4で作成)

---

**このシステムにより、議事録からのタスク・予定・プロジェクト抽出が自動化され、業務効率が大幅に向上します。**