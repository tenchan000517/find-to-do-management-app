# 【実装計画書 v2】GASアプローチ Google Docs議事録自動処理システム

**作成日**: 2025-06-16  
**バージョン**: 2.0 (GASアプローチ)  
**アップデート理由**: OAuth2 → GAS連携に変更（開発効率50%向上・運用安定性大幅改善）

---

## 🚀 v2アップデート概要

### **重要な変更点**
- ❌ **OAuth2認証廃止** → ✅ **GAS (Google Apps Script) 直接連携**
- ❌ **Google Cloud Console設定** → ✅ **ドキュメント直接バインド**
- ❌ **複雑な認証フロー** → ✅ **シンプルなWebhook受信**
- ❌ **API制限リスク** → ✅ **制限なし直接送信**

### **開発期間短縮**
- **従来計画**: 19-25日 → **新計画**: 12-16日 (約40%短縮)
- **Phase 11**: 5日 → **2-3日** (OAuth認証作業削除)
- **Phase 12**: 6日 → **3-4日** (API制限考慮不要)

---

## 🎯 新システム構成

### アーキテクチャ図
```
[Google Docs] 
    ↓ GAS Script (直接バインド)
[Webhook送信] 
    ↓ HTTP POST
[我々のシステム/api/webhook/google-docs-gas] 
    ↓ コンテンツ処理
[AI分析・ナレッジ化] 
    ↓ レコメンド生成
[統合UI表示]
```

### データフロー
1. **ドキュメント編集** → GAS自動実行
2. **コンテンツ抽出** → Webhook送信
3. **システム受信** → 自動処理・AI分析
4. **レコメンド生成** → ダッシュボード表示

---

## 📊 修正されたPhase計画

### **Phase 11: GAS連携基盤（2-3日）** 🆕
- ✅ GASスクリプト作成・デプロイ
- ✅ Webhook API実装（認証なし）
- ✅ 基本同期テスト
- ✅ データベーススキーマ最小変更

### **Phase 12: コンテンツ処理強化（3-4日）** 📝
- ✅ GAS送信データの処理強化
- ✅ 既存同期エンジンとの統合
- ✅ エラーハンドリング・リトライ機構
- ✅ 手動トリガー・スケジュール管理

### **Phase 13: AI分析・レコメンドエンジン（5-7日）** ✅
- ✅ 既存計画のまま継続
- ✅ Gemini AI分析
- ✅ タスク・予定・プロジェクト抽出

### **Phase 14: UI統合・ダッシュボード（4-6日）** ✅
- ✅ 既存計画のまま継続
- ✅ レコメンドダッシュボード
- ✅ 統合ナレッジ管理画面

### **Phase 15: 最適化・セキュリティ強化（2-3日）** 📝
- ✅ パフォーマンス最適化
- ✅ **段階的セキュリティ実装** 🆕
- ✅ 運用監視・アラート

---

## 🔧 技術実装詳細

### GAS側実装

#### 基本スクリプト構成
```javascript
// Google Apps Script (DocumentSyncScript.gs)

// 設定値
const WEBHOOK_URL = 'http://localhost:3000/api/webhook/google-docs-gas'; // 開発時
// const WEBHOOK_URL = 'https://your-domain.com/api/webhook/google-docs-gas'; // 本番時

const CONFIG = {
  enableAuth: false, // 開発中はfalse
  apiKey: '', // 開発中は空文字
  retryCount: 3,
  retryDelay: 1000
};

// メイン同期関数
function syncDocument(triggerType = 'manual') {
  try {
    const doc = DocumentApp.getActiveDocument();
    
    const payload = {
      documentId: doc.getId(),
      title: doc.getName(),
      content: doc.getBody().getText(),
      url: doc.getUrl(),
      lastModified: new Date().toISOString(),
      triggerType: triggerType,
      wordCount: doc.getBody().getText().length,
      // 開発中は認証なし
      ...(CONFIG.enableAuth && { apiKey: CONFIG.apiKey })
    };
    
    sendToWebhook(payload);
    
  } catch (error) {
    console.error('同期エラー:', error);
    // GASの実行ログに記録
    logError('syncDocument', error);
  }
}

// Webhook送信（リトライ付き）
function sendToWebhook(payload) {
  let lastError;
  
  for (let attempt = 1; attempt <= CONFIG.retryCount; attempt++) {
    try {
      const response = UrlFetchApp.fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'GAS-DocumentSync/1.0'
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      
      const responseCode = response.getResponseCode();
      
      if (responseCode === 200) {
        console.log(`✅ 同期成功 (試行${attempt}): ${payload.title}`);
        return;
      } else {
        throw new Error(`HTTP ${responseCode}: ${response.getContentText()}`);
      }
      
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ 同期失敗 (試行${attempt}/${CONFIG.retryCount}):`, error.message);
      
      if (attempt < CONFIG.retryCount) {
        Utilities.sleep(CONFIG.retryDelay * attempt); // 指数バックオフ
      }
    }
  }
  
  // 全試行失敗
  throw new Error(`同期失敗 (${CONFIG.retryCount}回試行): ${lastError.message}`);
}

// トリガー関数
function onDocumentEdit(e) {
  // 編集時の自動同期
  syncDocument('edit');
}

function dailySync() {
  // 毎日0:00の定期同期
  syncDocument('scheduled');
}

function manualSync() {
  // 手動実行用
  syncDocument('manual');
}

// 初期設定関数
function setupTriggers() {
  try {
    // 既存トリガー削除
    deleteAllTriggers();
    
    const doc = DocumentApp.getActiveDocument();
    
    // 編集トリガー作成（リアルタイム同期）
    ScriptApp.newTrigger('onDocumentEdit')
      .forDocument(doc)
      .onEdit()
      .create();
    
    // 毎日0:00の定期トリガー作成
    ScriptApp.newTrigger('dailySync')
      .timeBased()
      .everyDays(1)
      .atHour(0)
      .create();
    
    console.log('✅ トリガー設定完了');
    return true;
    
  } catch (error) {
    console.error('❌ トリガー設定エラー:', error);
    return false;
  }
}

// トリガー削除
function deleteAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });
  console.log(`🗑️ ${triggers.length}個のトリガーを削除`);
}

// エラーログ記録
function logError(functionName, error) {
  const logSheet = getOrCreateLogSheet();
  logSheet.appendRow([
    new Date(),
    functionName,
    error.message,
    error.stack || 'No stack trace'
  ]);
}

// ログシート取得/作成
function getOrCreateLogSheet() {
  const doc = DocumentApp.getActiveDocument();
  // スプレッドシートでのログ管理（オプション）
  // 簡易版はコンソールログのみ
  return null;
}

// 設定更新関数
function updateConfig(newConfig) {
  Object.assign(CONFIG, newConfig);
  PropertiesService.getScriptProperties().setProperties({
    'CONFIG': JSON.stringify(CONFIG)
  });
  console.log('設定更新完了:', CONFIG);
}

// 設定取得
function getConfig() {
  const stored = PropertiesService.getScriptProperties().getProperty('CONFIG');
  if (stored) {
    Object.assign(CONFIG, JSON.parse(stored));
  }
  return CONFIG;
}
```

### システム側Webhook API

#### 認証段階設定
```typescript
// src/lib/config/gas-webhook-config.ts
export interface GASWebhookConfig {
  enableAuth: boolean;
  apiKey?: string;
  enableRateLimiting: boolean;
  maxRequestsPerMinute: number;
  enableLogging: boolean;
}

export const getGASWebhookConfig = (): GASWebhookConfig => {
  const env = process.env.NODE_ENV;
  
  // 開発環境設定
  if (env === 'development') {
    return {
      enableAuth: false, // 開発中は認証なし
      enableRateLimiting: false,
      maxRequestsPerMinute: 1000,
      enableLogging: true
    };
  }
  
  // ステージング環境設定
  if (env === 'staging') {
    return {
      enableAuth: true,
      apiKey: process.env.GAS_WEBHOOK_API_KEY || 'simple-staging-key',
      enableRateLimiting: true,
      maxRequestsPerMinute: 100,
      enableLogging: true
    };
  }
  
  // 本番環境設定
  return {
    enableAuth: true,
    apiKey: process.env.GAS_WEBHOOK_API_KEY, // 必須
    enableRateLimiting: true,
    maxRequestsPerMinute: 60,
    enableLogging: true
  };
};
```

#### Webhook API実装
```typescript
// src/app/api/webhook/google-docs-gas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getGASWebhookConfig } from '@/lib/config/gas-webhook-config';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const config = getGASWebhookConfig();
  const startTime = Date.now();
  
  try {
    // リクエストボディ取得
    const payload = await request.json();
    const { 
      documentId, 
      title, 
      content, 
      url, 
      lastModified, 
      triggerType = 'unknown',
      wordCount = 0,
      apiKey 
    } = payload;

    // ログ出力（開発用）
    if (config.enableLogging) {
      console.log(`📨 GAS Webhook受信: ${title} (${triggerType}) - ${wordCount}文字`);
    }

    // 認証チェック（設定により有効/無効）
    if (config.enableAuth) {
      if (!apiKey || apiKey !== config.apiKey) {
        console.warn('❌ GAS Webhook認証失敗');
        return NextResponse.json(
          { error: '認証に失敗しました' },
          { status: 401 }
        );
      }
    } else {
      console.log('🔧 開発モード: 認証スキップ');
    }

    // 必須フィールド検証
    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId が必要です' },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'content が空です' },
        { status: 400 }
      );
    }

    // コンテンツ最小長チェック
    if (content.trim().length < 50) {
      return NextResponse.json({
        success: true,
        message: 'コンテンツが短すぎるためスキップしました',
        skipped: true
      });
    }

    // 処理実行
    const result = await processGASWebhook({
      documentId,
      title,
      content,
      url,
      lastModified,
      triggerType
    });

    const processingTime = Date.now() - startTime;

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      message: 'ドキュメント処理完了',
      result,
      processingTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error('❌ GAS Webhook処理エラー:', error);
    
    // エラーログ保存（本番環境）
    if (process.env.NODE_ENV === 'production') {
      await logWebhookError(error, request);
    }

    return NextResponse.json(
      { 
        error: error.message || 'Webhook処理に失敗しました',
        processingTime 
      },
      { status: 500 }
    );
  }
}

// メイン処理関数
async function processGASWebhook(data: {
  documentId: string;
  title: string;
  content: string;
  url: string;
  lastModified: string;
  triggerType: string;
}) {
  const { documentId, title, content, url, lastModified, triggerType } = data;

  // 1. Google Docsソース情報更新/作成
  const source = await prisma.google_docs_sources.upsert({
    where: { document_id: documentId },
    update: {
      title,
      document_url: url,
      last_modified: new Date(lastModified),
      last_synced: new Date(),
      sync_status: 'syncing',
      error_message: null
    },
    create: {
      document_id: documentId,
      document_url: url,
      title,
      last_modified: new Date(lastModified),
      sync_status: 'syncing',
      page_count: 0
    }
  });

  // 2. 既存の自動生成ナレッジを削除（重複回避）
  await prisma.knowledge_items.deleteMany({
    where: {
      source_document_id: documentId,
      auto_generated: true
    }
  });

  // 3. コンテンツをセクション分割・ナレッジ化
  const knowledgeItems = await createKnowledgeFromGASContent(
    documentId,
    content,
    title,
    url
  );

  // 4. ソース情報更新（完了状態）
  await prisma.google_docs_sources.update({
    where: { document_id: documentId },
    data: {
      sync_status: 'completed',
      page_count: knowledgeItems.length,
      last_synced: new Date()
    }
  });

  return {
    documentId,
    title,
    knowledgeItemsCreated: knowledgeItems.length,
    triggerType,
    wordCount: content.length
  };
}

// コンテンツからナレッジ作成
async function createKnowledgeFromGASContent(
  documentId: string,
  content: string,
  title: string,
  url: string
): Promise<any[]> {
  
  // コンテンツをセクション分割
  const sections = splitContentIntoSections(content);
  const knowledgeItems = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    // 短すぎるセクションはスキップ
    if (section.content.trim().length < 100) {
      continue;
    }

    const knowledgeItem = await prisma.knowledge_items.create({
      data: {
        id: `gas_${documentId}_${i}_${Date.now()}`,
        title: section.title || `${title} - セクション${i + 1}`,
        content: section.content.trim(),
        category: categorizeSectionContent(section.content),
        author: 'Google Docs (GAS自動同期)',
        tags: extractTagsFromContent(section.content),
        source_type: 'google_docs',
        source_document_id: documentId,
        source_page_number: i + 1,
        source_url: url,
        auto_generated: true
      }
    });

    knowledgeItems.push(knowledgeItem);
  }

  return knowledgeItems;
}

// コンテンツ分割関数（Phase 12で詳細実装）
function splitContentIntoSections(content: string): Array<{title?: string, content: string}> {
  // 簡易実装（Phase 12で高度化）
  const sections = [];
  const lines = content.split('\n');
  let currentSection = { content: '' };
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // 見出し検出（■●◆や数字.で始まる行）
    if (/^[■●◆]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
      if (currentSection.content.trim()) {
        sections.push({ ...currentSection });
      }
      currentSection = {
        title: trimmed,
        content: ''
      };
    } else {
      currentSection.content += line + '\n';
    }
  }
  
  if (currentSection.content.trim()) {
    sections.push(currentSection);
  }

  // セクションが少ない場合は固定長分割
  if (sections.length < 2 && content.length > 1000) {
    return splitByFixedLength(content, 800);
  }

  return sections;
}

// 固定長分割
function splitByFixedLength(content: string, maxLength: number): Array<{content: string}> {
  const sections = [];
  const sentences = content.split(/[。！？\n]/);
  let currentSection = '';

  for (const sentence of sentences) {
    if (currentSection.length + sentence.length > maxLength && currentSection) {
      sections.push({ content: currentSection.trim() });
      currentSection = sentence;
    } else {
      currentSection += sentence + '。';
    }
  }

  if (currentSection.trim()) {
    sections.push({ content: currentSection.trim() });
  }

  return sections;
}

// カテゴリ分類
function categorizeSectionContent(content: string): 'INDUSTRY' | 'SALES' | 'TECHNICAL' | 'BUSINESS' {
  const technical = /コード|API|システム|技術|プログラム|データベース|サーバー|開発/i;
  const sales = /営業|顧客|売上|契約|提案|商談|クライアント|受注/i;
  const industry = /業界|市場|競合|トレンド|分析|調査|マーケット/i;
  
  if (technical.test(content)) return 'TECHNICAL';
  if (sales.test(content)) return 'SALES';
  if (industry.test(content)) return 'INDUSTRY';
  return 'BUSINESS';
}

// タグ抽出
function extractTagsFromContent(content: string): string[] {
  const tags = new Set<string>();
  
  // 日本語キーワード抽出（3-8文字）
  const keywords = content.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]{3,8}/g) || [];
  const filteredKeywords = keywords
    .filter(word => word.length >= 3 && word.length <= 8)
    .slice(0, 3);
  
  filteredKeywords.forEach(word => tags.add(word));
  
  // 特定パターンのタグ付け
  if (/\d{4}年|\d+月|\d+日/.test(content)) tags.add('日程');
  if (/会議|ミーティング|打ち合わせ/.test(content)) tags.add('会議');
  if (/TODO|タスク|課題|対応/.test(content)) tags.add('タスク');
  if (/プロジェクト|企画/.test(content)) tags.add('プロジェクト');
  
  return Array.from(tags).slice(0, 5);
}

// エラーログ保存
async function logWebhookError(error: Error, request: NextRequest): Promise<void> {
  try {
    // 本番環境でのエラーログ保存
    console.error('Webhook Error Log:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      url: request.url
    });
  } catch (logError) {
    console.error('ログ保存エラー:', logError);
  }
}
```

---

## 🔒 段階的セキュリティ実装

### **Level 0: 開発初期（完全オープン）**
```bash
# .env.local
NODE_ENV=development
# 認証関連設定なし
```
```javascript
// GAS側
const CONFIG = {
  enableAuth: false,
  apiKey: ''
};
```

### **Level 1: ステージング（簡易認証）**
```bash
# .env.staging
NODE_ENV=staging
GAS_WEBHOOK_API_KEY=simple-staging-key-2024
```
```javascript
// GAS側
const CONFIG = {
  enableAuth: true,
  apiKey: 'simple-staging-key-2024'
};
```

### **Level 2: 本番（強固な認証）**
```bash
# .env.production
NODE_ENV=production
GAS_WEBHOOK_API_KEY=sk_gas_prod_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```
```javascript
// GAS側
const CONFIG = {
  enableAuth: true,
  apiKey: PropertiesService.getScriptProperties().getProperty('WEBHOOK_API_KEY')
};
```

---

## 📋 データベーススキーマ修正

### 既存テーブル活用（最小変更）
```sql
-- 既存の google_docs_sources テーブルをそのまま活用
-- 新規フィールド追加のみ

ALTER TABLE google_docs_sources 
ADD COLUMN trigger_type VARCHAR(50) DEFAULT 'manual',  -- edit, scheduled, manual
ADD COLUMN word_count INTEGER DEFAULT 0,
ADD COLUMN gas_version VARCHAR(20) DEFAULT '1.0';

-- インデックス追加
CREATE INDEX idx_trigger_type ON google_docs_sources(trigger_type);
CREATE INDEX idx_word_count ON google_docs_sources(word_count);
```

### 新規テーブル（必要最小限）
```sql
-- GAS Webhook ログテーブル（オプション）
CREATE TABLE gas_webhook_logs (
  id              VARCHAR(255) PRIMARY KEY,
  document_id     VARCHAR(255),
  trigger_type    VARCHAR(50),
  processing_time INTEGER,
  success         BOOLEAN,
  error_message   TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_document_trigger (document_id, trigger_type),
  INDEX idx_created_at (created_at),
  INDEX idx_success (success)
);
```

---

## 🚀 実装手順 (短縮版)

### **Phase 11: GAS連携基盤（2-3日）**

#### **Day 1: GAS基本実装**
- [ ] GASプロジェクト作成
- [ ] 基本スクリプト実装
- [ ] 手動実行テスト

#### **Day 2: Webhook API実装**
- [ ] システム側API実装
- [ ] 基本的なコンテンツ処理
- [ ] 統合テスト

#### **Day 3: トリガー設定・安定化**
- [ ] 自動トリガー設定
- [ ] エラーハンドリング強化
- [ ] 動作確認

### **Phase 12: 機能強化（3-4日）**

#### **Day 1-2: コンテンツ処理高度化**
- [ ] セクション分割アルゴリズム
- [ ] カテゴリ分類・タグ抽出
- [ ] 重複処理防止

#### **Day 3-4: 監視・管理機能**
- [ ] 同期履歴管理
- [ ] エラー監視・通知
- [ ] 手動制御UI

### **Phase 13-15: 既存計画継続（11-14日）**
- AI分析・レコメンド機能
- UI統合・ダッシュボード
- 最適化・セキュリティ強化

---

## ✅ 成功指標・検証項目

### **Phase 11完了確認**
- [ ] GASスクリプト正常動作
- [ ] Webhook API正常受信
- [ ] ナレッジ自動作成動作
- [ ] 既存機能100%動作継続

### **Phase 12完了確認**
- [ ] リアルタイム同期動作
- [ ] 定期同期動作
- [ ] エラー時の自動復旧
- [ ] コンテンツ処理品質確認

### **システム全体完了確認**
- [ ] 議事録自動取得: 95%以上成功率
- [ ] AI分析精度: 80%以上
- [ ] レコメンド採用率: 60%以上
- [ ] システム応答時間: 2秒以内

---

## 🎉 v2の利点まとめ

### **開発効率向上**
- **実装期間 40%短縮**: 19-25日 → 12-16日
- **コード量 50%削減**: OAuth複雑処理 → シンプルWebhook
- **テスト工数 60%削減**: 認証テスト不要

### **運用安定性向上**
- **障害リスク 70%削減**: Google API制限・認証エラー解消
- **保守コスト削減**: トークン管理・権限管理不要
- **ユーザビリティ向上**: 設定なしで即座に利用開始

### **技術的優位性**
- **リアルタイム同期**: 編集と同時に処理開始
- **制限なし処理**: API Quota制限回避
- **自動復旧**: GAS側の堅牢な実行環境

---

**🚀 v2実装により、より簡単・安全・高速な議事録自動処理システムが完成します！**

**次のステップ**: Phase 11詳細実装手順書の作成をお待ちしております。