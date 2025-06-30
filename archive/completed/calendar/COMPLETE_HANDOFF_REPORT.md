# 📋 FIND TO DO管理アプリ - 完全引き継ぎ書

**作成日**: 2025-06-16  
**Phase**: 15完了 + UI改善・要約生成問題解決中  
**状況**: 要約生成失敗の根本原因調査・修正段階

---

## 🎯 システム全体概要

### アーキテクチャ
```
Google Docs → GAS (Google Apps Script) → Next.js Webhook → Gemini AI分析 → PostgreSQL
```

### 主要コンポーネント
1. **Google Apps Script**: ドキュメント同期・タブ切り替え自動化
2. **Next.js アプリ**: Webhook受信・AI処理・UI提供  
3. **PostgreSQL DB**: Neon Database でデータ永続化
4. **Gemini AI**: コンテンツ分析・要約生成（gemini-2.0-flash）

---

## 🗃️ データベース構造

### 主要テーブル（20テーブル中の重要な4つ）

#### 1. `google_docs_sources` - Google Docsメタデータ
```sql
- id: SERIAL PRIMARY KEY
- document_id: VARCHAR UNIQUE (例: "1jlKCfrxUnOGb9DvhlnVCPyzds-d_DYzEDUBf23jnXOY_tab_63")
- document_url: TEXT (修正済み: 正しいタブID使用)
- title: VARCHAR
- last_modified: TIMESTAMP
- sync_status: VARCHAR (SYNCING/COMPLETED/ERROR)
- trigger_type: VARCHAR
- word_count: INTEGER
- gas_version: VARCHAR
- content_hash: VARCHAR (重複チェック用)
- last_synced: TIMESTAMP
```

#### 2. `ai_content_analysis` - AI分析結果
```sql
- id: SERIAL PRIMARY KEY
- source_document_id: VARCHAR (google_docs_sourcesと紐付け)
- title: VARCHAR
- summary: TEXT (要約生成の核心部分)
- analysis_type: VARCHAR
- extracted_tasks: JSON
- extracted_events: JSON
- extracted_projects: JSON
- extracted_contacts: JSON
- confidence_score: FLOAT
- model_version: VARCHAR
- createdAt/updatedAt: TIMESTAMP
```

#### 3. `content_processing_logs` - 処理ログ
```sql
- id: SERIAL PRIMARY KEY
- source_document_id: VARCHAR
- processing_step: VARCHAR (AI_ANALYSIS/RECOMMENDATION_GENERATION)
- step_status: VARCHAR (IN_PROGRESS/COMPLETED/FAILED)
- input_data: JSON
- output_data: JSON
- error_message: TEXT
- processing_time: INTEGER
- system_version: VARCHAR
```

#### 4. その他重要テーブル
- `tasks` - タスク管理
- `events` - イベント管理  
- `projects` - プロジェクト管理
- `content_recommendations` - AI推奨事項

---

## 🔧 Google Apps Script

### ファイル構成
```
📁 プロジェクト
├── 📄 gas-complete-unified-system.js (メインファイル - 最新)
└── 📁 gas-archive/
    └── 📄 (旧バージョンファイル群)
```

### 重要関数
```javascript
// 1. 全タブ順次送信（推奨）
sequentialTabsSync()
- 用途: 全66タブを順次Webhookに送信
- 実行: 手動実行用
- 処理時間: 約66秒（1秒間隔）

// 2. 直近3タブ送信
recentThreeTabsSync()  
- 用途: 最新3タブのみ送信
- トリガー: 毎日0:00自動実行
- 処理時間: 約3秒

// 3. 緊急再開関数（新規追加）
emergencyResumeFromTab(startTabNumber = 30)
- 用途: 指定タブから再開送信
- 実行: タイムアウト時の緊急復旧用
- 例: emergencyResumeFromTab(30) // タブ30から再開
```

### GAS設定確認コマンド
```javascript
// GASコンソールで実行
function checkGasSettings() {
  console.log('Webhook URL:', WEBHOOK_URL);
  console.log('設定:', SYNC_CONFIG);
}
```

### 修正済み重要箇所
```javascript
// ✅ 正しいURL生成 (Line 382付近)
url: `https://docs.google.com/document/d/${doc.getId()}/edit?tab=${tab.getId()}`,

// ❌ 修正前（間違い）
// url: `${doc.getUrl()}#heading=h.tab_${index + 1}`,
```

---

## 🌐 Next.js API構造

### Webhook API（最重要）

#### 1. Google Docs GAS Webhook
```typescript
// ファイル: /src/app/api/webhook/google-docs-gas/route.ts
// URL: http://localhost:3000/api/webhook/google-docs-gas

// 処理フロー:
1. ペイロード検証 (必須フィールド、コンテンツ長チェック)
2. 重複チェック (contentHashベース - 1段階目)
3. Google Docsソース更新/作成
4. AI分析存在チェック (source_document_id - 2段階目)
5. AI分析実行 (performAdvancedAIAnalysis)
6. レコメンデーション生成 (generateRecommendations)
```

#### 2. 重複チェックロジック（重要）
```typescript
// 第1段階: コンテンツハッシュ重複チェック (line 56-69)
const isDuplicate = await checkForDuplicateContent(payload.documentId, payload.contentHash);
if (isDuplicate && payload.triggerType !== 'manual') {
  return NextResponse.json({
    success: true,
    message: '既存データ、処理をスキップしました（メタデータ保持）',
    skipped: true,
    reason: 'already_processed'
  });
}

// 第2段階: AI分析存在チェック (line 196-232)
const existingAnalysis = await prisma.ai_content_analysis.findFirst({
  where: { source_document_id: documentId }
});

if (existingAnalysis && triggerType !== 'manual') {
  // メタデータのみ更新して終了
  return { skipped: true, reason: 'analysis_exists' };
}
```

### その他API
- `/api/ai-content-analysis` - AI分析結果取得
- `/api/google-docs/sources` - Google Docsソース取得  
- `/api/google-docs/recommendations` - AI推奨事項管理
- `/api/tasks`, `/api/projects`, `/api/calendar` - 各種CRUD操作

---

## 🤖 AI分析システム

### 使用モデル
- **メイン**: Gemini 2.0 Flash
- **API Key**: `AIzaSyB2fqjY3f78rr4rmB0oqTc5FMn8lx-79mY`

### AI分析器ファイル
```
📄 /src/lib/ai/advanced-content-analyzer.ts (メインエンジン)
📄 /src/lib/ai/recommendation-engine.ts (推奨事項生成)
```

### 分析処理フロー
```typescript
// 1. analyzeContent() メイン処理
async analyzeContent(content: string, title: string): Promise<AdvancedAnalysisResult>

// 2. generateOverallInsights() 全体洞察生成
private async generateOverallInsights(): Promise<OverallInsights>

// 3. generateSummary() 要約生成（核心部分）
private async generateSummary(content: string, entities: HighConfidenceEntities): Promise<string>
  ├── 短いコンテンツ（500文字以下）: 原文そのまま返す
  ├── エンティティ未検出: generateSummaryFromRawContent()
  └── エンティティ検出済み: generateSummaryFromEntities()
```

### 要約生成の詳細ロジック
```typescript
// 要約生成分岐 (line 673-691)
private async generateSummary(content: string, entities: HighConfidenceEntities): Promise<string> {
  // 1. 短いコンテンツ処理
  if (content.trim().length <= 500) {
    return content.trim(); // 原文保存
  }
  
  // 2. エンティティベース判定
  const totalEntities = entities.tasks.length + entities.events.length + 
                       entities.appointments.length + entities.connections.length;
  
  if (totalEntities === 0) {
    return await this.generateSummaryFromRawContent(content); // 原文から直接要約
  }
  
  return await this.generateSummaryFromEntities(content, entities); // エンティティベース要約
}
```

---

## 🎯 議事録ページ実装

### ファイル構成
```
📄 /src/app/meeting-notes/page.tsx (メインページ)
```

### 主要機能
1. **AI生成コンテンツ表示**: 自動的にAI分析結果を表示
2. **スマートカテゴリ分け**: 「議事録」vs「情報」自動判定
3. **タブ順ソート**: 日付順ボタンで実際はタブ順（新しい→古い）
4. **高度検索・フィルター**: テキスト検索、ステータス、カテゴリ別
5. **Google Docs連携**: 直接リンクでソース文書アクセス

### 日付抽出・ソート機能
```typescript
// タブ番号順ソート（降順: 新しい→古い）
.sort((a, b) => {
  if (sortBy === 'date') {
    const getTabNumber = (sourceDocumentId) => {
      const tabMatch = sourceDocumentId?.match(/_tab_(\d+)$/);
      const recentMatch = sourceDocumentId?.match(/_recent_(\d+)$/);
      if (tabMatch) return parseInt(tabMatch[1]);
      if (recentMatch) return 1000 + parseInt(recentMatch[1]);
      return 9999;
    };
    return getTabNumber(b.sourceDocumentId) - getTabNumber(a.sourceDocumentId); // 降順
  }
  // ...
})
```

### UI改善完了事項
- ✅ 重複していた「詳細内容」セクション削除
- ✅ タブ順ソート実装（新しい議事録→古い議事録）
- ✅ レスポンシブデザイン対応

---

## 🚨 現在の問題と対処法

### 🔥 **メイン問題: 要約生成失敗**

#### 現在の状況
- **期待値**: 66件のAI分析データ
- **実際**: 43件のAI分析データ  
- **不足**: 23件（35%が未処理）

#### 削除済み不良データ
```bash
# 過去に削除した問題のある要約
- 「要約を生成できませんでした」: 20件削除済み
- 「ドキュメントIDから推測される...」: 23件削除済み
- 重複メタデータ: 30件削除済み
```

#### 要約生成失敗の根本原因（推定）

**1. JSON解析失敗** (最有力)
```typescript
// line 716, 752 in advanced-content-analyzer.ts
const parsed = this.parseJSONResponse(responseText);
return parsed.summary || '要約を生成できませんでした';

// 原因: Gemini AIが返すJSONが不正、またはsummaryフィールド欠如
```

**2. Gemini API制限** 
```typescript
// line 714, 750 in advanced-content-analyzer.ts  
const result = await model.generateContent(prompt);
// 原因: レート制限、タイムアウト、同時リクエスト制限
```

**3. 同時処理競合**
- 66タブを1秒間隔で処理 → API制限に引っかかる可能性
- リソース競合による処理失敗

**4. コンテンツ特性**
- 特定タブが解析困難（特殊文字、長すぎる、構造化されていない）

### 🔧 **重複チェックの回避方法**

#### メタデータ削除による強制再処理
```bash
# 不足している23件のメタデータを削除
node -e "
const {PrismaClient} = require('@prisma/client'); 
const p = new PrismaClient(); 
p.ai_content_analysis.findMany({select: {source_document_id: true}}).then(analyses => {
  const existingIds = analyses.map(x => x.source_document_id);
  return p.google_docs_sources.deleteMany({where: {document_id: {notIn: existingIds}}});
}).then(r => console.log('削除:', r.count + '件')).finally(() => p.\$disconnect());
"
```

#### Manual実行による強制処理
```javascript
// GASでtriggerType: 'manual'で実行
// 重複チェックをバイパスして強制再処理
```

---

## 🛠️ 開発・運用コマンド集

### Next.js開発
```bash
# サーバー起動・停止
npm run dev &                    # バックグラウンド起動
pkill -f "next dev"             # プロセス終了
ps aux | grep next | grep -v grep  # プロセス確認

# ビルド・型チェック
npm run build                   # プロダクションビルド
npm run typecheck              # TypeScript型チェック  
npm run lint                   # ESLint実行
```

### データベース確認
```bash
# 現在の状況確認
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); Promise.all([p.ai_content_analysis.count(), p.google_docs_sources.count()]).then(([analyses, sources]) => {console.log('AI分析:', analyses, 'ソース:', sources, '差分:', (sources - analyses));}).finally(() => p.\$disconnect());"

# 要約生成状況
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.ai_content_analysis.aggregate({_count: {_all: true}, where: {summary: {not: {in: ['', '要約未生成', '要約を生成できませんでした']}}}}).then(r => console.log('要約生成済み:', r._count._all + '件')).finally(() => p.\$disconnect());"

# 最新データ確認
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.ai_content_analysis.findMany({take: 5, orderBy: {createdAt: 'desc'}, select: {title: true, summary: true, confidence_score: true}}).then(r => r.forEach((x,i) => console.log(\`\${i+1}. \${x.title}: \${x.summary.substring(0,50)}... (信頼度: \${x.confidence_score})\`))).finally(() => p.\$disconnect());"

# 失敗ログ確認
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.content_processing_logs.findMany({where: {step_status: 'FAILED'}, orderBy: {createdAt: 'desc'}, take: 10}).then(r => {console.log('失敗ログ:', r.length + '件'); r.forEach((x,i) => console.log((i+1) + '. ' + x.processing_step + ': ' + x.error_message));}).finally(() => p.\$disconnect());"
```

### Prisma操作
```bash
npx prisma studio              # Prisma Studio（GUI）
npx prisma generate           # Prismaクライアント生成
npx prisma db push           # スキーマ同期
```

---

## 📊 設定・認証情報

### 環境変数 (.env.local)
```bash
DATABASE_URL="postgres://neondb_owner:npg_VKJPW8pIfQq0@ep-calm-butterfly-a55pupnn-pooler.us-east-2.aws.neon.tech/neondb?connect_timeout=15&sslmode=require"
GEMINI_API_KEY="AIzaSyB2fqjY3f78rr4rmB0oqTc5FMn8lx-79mY"
LINE_CHANNEL_SECRET="723ccdd34f2c47cf2f7412f1e5e5c22b"  
LINE_CHANNEL_ACCESS_TOKEN="aI0oSLTslmGdjPXBZWuCtYxdyg+cUvpGY+7ZBAYMTzDyPUEUKChMDOEMIx7aQZlTKrgWwFjmIfWgB888ocB1roIrF96PJk4ekdFhT/QuZZF4hIFu3+XarkdcjhYUgawaqmBc41prRCgV0fK7jq/m5wdB04t89/1O/w1cDnyilFU="
```

### Google Docs情報
```
ドキュメントID: 1jlKCfrxUnOGb9DvhlnVCPyzds-d_DYzEDUBf23jnXOY
ドキュメント名: FIND TO DO 議事録
タブ数: 66個
最新タブ: 6/16　システム完成記念
```

### GAS Webhook URL
```
現在: https://5e83-2402-6b00-da0d-9600-78-397f-ab3d-5949.ngrok-free.app/api/webhook/google-docs-gas
注意: ngrok URLなので変更される可能性あり
```

---

## 🎯 次のエンジニアへの推奨タスク

### 🔥 **最優先タスク: 要約生成失敗解決**

#### Phase 1: 原因特定
1. **単一タブテスト実行**
   ```javascript
   // GASで1つのタブのみ送信テスト
   emergencyResumeFromTab(1) // タブ1のみ
   ```

2. **詳細ログ追加**
   ```typescript
   // advanced-content-analyzer.ts の generateSummary メソッドに
   console.log('Gemini AI Response:', responseText);
   console.log('Parsed Result:', parsed);
   ```

3. **AIJsonParser 確認**
   ```typescript
   // /src/lib/utils/ai-json-parser.ts の動作確認
   // Gemini AIが返すJSONフォーマットの検証
   ```

#### Phase 2: 修正実装
1. **エラーハンドリング強化**
   - リトライ機能追加
   - より詳細なエラー情報記録

2. **API制限対策**
   - 処理間隔の調整（1秒→2秒）
   - バッチサイズの縮小

3. **フォールバック機能**
   - JSON解析失敗時の代替処理
   - 簡易要約生成機能

#### Phase 3: 全データ再処理
1. **メタデータクリア**
2. **段階的再実行**（10件ずつなど）
3. **結果検証**

### 🎯 **推奨調査手順**

1. **Gemini AI レスポンス確認**
   ```bash
   # Next.jsサーバーログで実際のAPIレスポンスを確認
   console.log('🔍 Gemini Response:', result.response.text());
   ```

2. **失敗パターン分析**
   ```sql
   -- どのタブが失敗しやすいか
   SELECT source_document_id, error_message 
   FROM content_processing_logs 
   WHERE step_status = 'FAILED';
   ```

3. **コンテンツ特性調査**
   ```bash
   # 失敗するタブの文字数・特殊文字を確認
   ```

### 📋 **完了時の成功指標**
- ✅ AI分析データ: 66件完了（100%カバレッジ）
- ✅ 要約生成失敗: 0件  
- ✅ 議事録ページ: 全データ正常表示
- ✅ タブ順ソート: 正常動作

---

## 🚨 緊急時対応

### Next.jsサーバー問題
```bash
# プロセス確認・強制終了
ps aux | grep next
kill -9 <PID>

# 再起動
npm run dev &
```

### データベース接続エラー
```bash
# 接続テスト
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.\$connect().then(() => console.log('DB接続OK')).catch(e => console.error('DB接続NG:', e.message)).finally(() => p.\$disconnect());"
```

### GAS実行エラー
1. GASエディタでログ確認
2. WEBHOOK_URL設定確認  
3. `connectionTest()`で疎通確認
4. `runUnifiedDiagnostics()`で統合診断

---

## 📈 現在の実績

### ✅ 完了項目
- **Phase 15完了**: 議事録タイトル・要約システム改善
- **タブ切り替えシステム**: 正しいタブIDでURL生成
- **データベースURL修正**: 64件すべて修正済み
- **GASファイル整理**: 不要ファイル削除・アーカイブ化
- **基本機能実装**: 20テーブル、34API完全実装
- **UI改善**: 重複表示削除、タブ順ソート実装
- **緊急機能**: `emergencyResumeFromTab()` 追加

### ⏳ 進行中
- **要約生成失敗解決**: 根本原因調査中（23件不足）
- **システム安定化**: エラーハンドリング強化

### 📊 **進捗率: 85%完了**

---

## 🎯 最終目標

**完全自動化された議事録管理システム**
1. Google Docs更新 → 自動AI分析 → 要約生成 → UI表示
2. 100%の要約生成成功率
3. 安定したリアルタイム同期
4. 直感的なユーザーインターフェース

---

**📞 引き継ぎ完了**  
**次のエンジニアの成功を祈っています！** 🚀

---

*最終更新: 2025-06-16 Phase 15完了 + 要約生成問題調査中*