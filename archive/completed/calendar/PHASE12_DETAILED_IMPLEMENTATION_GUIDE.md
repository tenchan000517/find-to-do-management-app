# Phase 12: ドキュメント同期・監視機能 詳細実装手順書

**Phase**: 12 / 15  
**目標**: Google Docsからのコンテンツ自動取得・同期システム構築  
**期間**: 4-6日  
**前提条件**: Phase 11完了（OAuth認証・基本API接続確認済み）

---

## 🎯 Phase 12 実装目標

### 達成目標
- ✅ ドキュメント自動同期エンジン構築
- ✅ 変更監視・検出システム実装
- ✅ 定期実行スケジューラー設定
- ✅ 基本UI統合（同期状況表示・手動操作）

### 検証基準
- [ ] 手動同期機能完全動作
- [ ] 自動監視システム稼働確認
- [ ] UI統合・操作性確認
- [ ] エラーハンドリング・復旧機能確認

---

## 📋 実装手順詳細

### ステップ1: 同期エンジン・監視サービス実装

#### 1.1 ドキュメント同期エンジン
```typescript
// src/lib/google/sync-engine.ts
import { PrismaClient } from '@prisma/client';
import { googleDocsClient } from './docs-client';

const prisma = new PrismaClient();

export interface SyncResult {
  success: boolean;
  documentId: string;
  knowledgeItemsCreated: number;
  errorMessage?: string;
  processingTime: number;
}

export interface SyncOptions {
  forceSync?: boolean;
  chunkSize?: number;
  preserveExisting?: boolean;
}

export class DocumentSyncEngine {
  // 単一ドキュメント同期
  async syncDocument(documentId: string, options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 同期開始: ${documentId}`);
      
      // 1. ソース情報更新
      await this.updateSyncStatus(documentId, 'syncing');
      
      // 2. ドキュメント情報・内容取得
      const [docInfo, content, lastModified] = await Promise.all([
        googleDocsClient.getDocumentInfo(documentId),
        googleDocsClient.getDocumentContent(documentId),
        googleDocsClient.getDocumentLastModified(documentId)
      ]);

      // 3. 変更チェック（強制同期でない場合）
      if (!options.forceSync) {
        const needsUpdate = await this.checkIfUpdateNeeded(documentId, lastModified);
        if (!needsUpdate) {
          console.log(`⏭️  変更なし、同期スキップ: ${documentId}`);
          return {
            success: true,
            documentId,
            knowledgeItemsCreated: 0,
            processingTime: Date.now() - startTime
          };
        }
      }

      // 4. コンテンツ処理・保存
      const knowledgeItems = await this.processDocumentContent(
        documentId,
        content,
        docInfo,
        options
      );

      // 5. ソース情報更新
      await this.updateDocumentSource(documentId, {
        title: docInfo.title,
        last_modified: lastModified,
        sync_status: 'completed',
        page_count: knowledgeItems.length,
        error_message: null,
        last_synced: new Date()
      });

      console.log(`✅ 同期完了: ${documentId} (${knowledgeItems.length}項目)`);

      return {
        success: true,
        documentId,
        knowledgeItemsCreated: knowledgeItems.length,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error(`❌ 同期エラー: ${documentId}`, error);
      
      await this.updateSyncStatus(documentId, 'error', error.message);
      
      return {
        success: false,
        documentId,
        knowledgeItemsCreated: 0,
        errorMessage: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  // 変更チェック
  private async checkIfUpdateNeeded(documentId: string, lastModified: Date): Promise<boolean> {
    try {
      const source = await prisma.google_docs_sources.findUnique({
        where: { document_id: documentId }
      });

      if (!source || !source.last_modified) {
        return true; // 初回同期または不明な状態
      }

      return lastModified > source.last_modified;
    } catch (error) {
      console.error('変更チェックエラー:', error);
      return true; // エラー時は安全側で同期実行
    }
  }

  // ドキュメント内容処理・ナレッジ化
  private async processDocumentContent(
    documentId: string,
    content: string,
    docInfo: any,
    options: SyncOptions
  ): Promise<any[]> {
    try {
      // 既存のGoogle Docs由来ナレッジを削除（重複回避）
      if (!options.preserveExisting) {
        await prisma.knowledge_items.deleteMany({
          where: {
            source_document_id: documentId,
            auto_generated: true
          }
        });
      }

      // コンテンツをセクション分割
      const sections = this.splitDocumentIntoSections(content);
      const knowledgeItems = [];

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        
        if (section.content.trim().length < 50) {
          continue; // 短すぎるセクションはスキップ
        }

        const knowledgeItem = await prisma.knowledge_items.create({
          data: {
            id: `gdocs_${documentId}_${i}_${Date.now()}`,
            title: section.title || `${docInfo.title} - セクション${i + 1}`,
            content: section.content.trim(),
            category: this.categorizeContent(section.content),
            author: 'Google Docs自動同期',
            tags: this.extractTags(section.content),
            source_type: 'google_docs',
            source_document_id: documentId,
            source_page_number: i + 1,
            source_url: `https://docs.google.com/document/d/${documentId}/edit`,
            auto_generated: true
          }
        });

        knowledgeItems.push(knowledgeItem);
      }

      return knowledgeItems;

    } catch (error) {
      console.error('コンテンツ処理エラー:', error);
      throw new Error(`コンテンツ処理に失敗: ${error.message}`);
    }
  }

  // ドキュメントをセクション分割
  private splitDocumentIntoSections(content: string): Array<{title?: string, content: string}> {
    const sections = [];
    
    // 見出しベースで分割
    const lines = content.split('\n');
    let currentSection = { content: '' };
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 見出し検出（大文字・記号パターン）
      if (this.isHeading(trimmedLine)) {
        // 前のセクション保存
        if (currentSection.content.trim()) {
          sections.push({ ...currentSection });
        }
        
        // 新しいセクション開始
        currentSection = {
          title: trimmedLine,
          content: ''
        };
      } else {
        currentSection.content += line + '\n';
      }
    }
    
    // 最後のセクション保存
    if (currentSection.content.trim()) {
      sections.push(currentSection);
    }

    // セクションが少ない場合は固定長で分割
    if (sections.length < 2 && content.length > 1000) {
      return this.splitByLength(content, 800);
    }

    return sections;
  }

  // 見出し判定
  private isHeading(line: string): boolean {
    return (
      /^[■●▲◆]\s/.test(line) ||           // 記号付き
      /^\d+\.\s/.test(line) ||             // 番号付き
      /^[A-Z\s]{3,}$/.test(line) ||        // 大文字のみ
      line.endsWith(':') ||                // コロン終わり
      (line.length < 50 && /[a-zA-Z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/.test(line))
    );
  }

  // 固定長分割
  private splitByLength(content: string, maxLength: number): Array<{content: string}> {
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

  // コンテンツ分類
  private categorizeContent(content: string): 'INDUSTRY' | 'SALES' | 'TECHNICAL' | 'BUSINESS' {
    const technical = /コード|API|システム|技術|プログラム|データベース|サーバー/i;
    const sales = /営業|顧客|売上|契約|提案|商談|クライアント/i;
    const industry = /業界|市場|競合|トレンド|分析|調査/i;
    
    if (technical.test(content)) return 'TECHNICAL';
    if (sales.test(content)) return 'SALES';
    if (industry.test(content)) return 'INDUSTRY';
    return 'BUSINESS';
  }

  // タグ抽出
  private extractTags(content: string): string[] {
    const tags = new Set<string>();
    
    // 一般的なキーワード抽出
    const keywords = content.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]{3,}/g) || [];
    const commonWords = keywords
      .filter(word => word.length >= 3 && word.length <= 8)
      .slice(0, 5);
    
    commonWords.forEach(word => tags.add(word));
    
    // 日付・時刻パターン
    if (/\d{4}年|\d+月|\d+日/.test(content)) tags.add('日程');
    if (/会議|ミーティング|打ち合わせ/.test(content)) tags.add('会議');
    if (/TODO|タスク|課題/.test(content)) tags.add('タスク');
    
    return Array.from(tags).slice(0, 5);
  }

  // 同期ステータス更新
  async updateSyncStatus(documentId: string, status: string, errorMessage?: string): Promise<void> {
    await prisma.google_docs_sources.update({
      where: { document_id: documentId },
      data: {
        sync_status: status,
        error_message: errorMessage || null,
        updated_at: new Date()
      }
    });
  }

  // ドキュメントソース情報更新
  private async updateDocumentSource(documentId: string, data: any): Promise<void> {
    await prisma.google_docs_sources.update({
      where: { document_id: documentId },
      data: {
        ...data,
        updated_at: new Date()
      }
    });
  }
}

export const documentSyncEngine = new DocumentSyncEngine();
```

#### 1.2 監視・スケジューリングサービス
```typescript
// src/lib/google/monitor-service.ts
import { PrismaClient } from '@prisma/client';
import { documentSyncEngine, SyncResult } from './sync-engine';

const prisma = new PrismaClient();

export interface MonitoringOptions {
  maxConcurrent?: number;
  retryCount?: number;
  retryDelay?: number;
}

export class GoogleDocsMonitorService {
  private isRunning = false;
  private options: MonitoringOptions;

  constructor(options: MonitoringOptions = {}) {
    this.options = {
      maxConcurrent: 3,
      retryCount: 2,
      retryDelay: 5000,
      ...options
    };
  }

  // 全ドキュメント監視・同期
  async checkAllDocuments(): Promise<SyncResult[]> {
    if (this.isRunning) {
      console.log('⚠️  監視処理が既に実行中です');
      return [];
    }

    this.isRunning = true;
    console.log('🔍 全ドキュメント監視開始');

    try {
      // 登録済みドキュメント一覧取得
      const sources = await prisma.google_docs_sources.findMany({
        where: {
          sync_status: { not: 'error' } // エラー状態のものは除外
        },
        orderBy: { last_synced: 'asc' } // 古い順
      });

      console.log(`📋 監視対象: ${sources.length}件`);

      // 並行処理でバッチ同期
      const results = await this.processBatch(
        sources.map(s => s.document_id),
        this.options.maxConcurrent
      );

      // 統計情報出力
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const totalItems = results.reduce((sum, r) => sum + r.knowledgeItemsCreated, 0);

      console.log(`✅ 監視完了: 成功${successful}件、失敗${failed}件、新規ナレッジ${totalItems}件`);

      return results;

    } catch (error) {
      console.error('❌ 監視処理エラー:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // バッチ処理（並行制御付き）
  private async processBatch(documentIds: string[], concurrency: number): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    
    for (let i = 0; i < documentIds.length; i += concurrency) {
      const batch = documentIds.slice(i, i + concurrency);
      
      console.log(`📦 バッチ処理 ${i + 1}-${Math.min(i + concurrency, documentIds.length)}/${documentIds.length}`);
      
      const batchPromises = batch.map(async (documentId) => {
        return this.syncWithRetry(documentId);
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('バッチ処理エラー:', result.reason);
          results.push({
            success: false,
            documentId: 'unknown',
            knowledgeItemsCreated: 0,
            errorMessage: result.reason.message,
            processingTime: 0
          });
        }
      }
      
      // API制限対策：バッチ間に待機
      if (i + concurrency < documentIds.length) {
        await this.sleep(1000);
      }
    }
    
    return results;
  }

  // リトライ付き同期
  private async syncWithRetry(documentId: string): Promise<SyncResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.options.retryCount + 1; attempt++) {
      try {
        const result = await documentSyncEngine.syncDocument(documentId);
        
        if (result.success || attempt === this.options.retryCount + 1) {
          return result;
        }
        
        lastError = new Error(result.errorMessage);
        
      } catch (error) {
        lastError = error;
        console.warn(`🔄 リトライ ${attempt}/${this.options.retryCount + 1}: ${documentId}`);
        
        if (attempt <= this.options.retryCount) {
          await this.sleep(this.options.retryDelay * attempt); // 指数バックオフ
        }
      }
    }

    // 最終的に失敗
    return {
      success: false,
      documentId,
      knowledgeItemsCreated: 0,
      errorMessage: lastError?.message || '不明なエラー',
      processingTime: 0
    };
  }

  // 個別ドキュメント強制同期
  async forceSyncDocument(documentId: string): Promise<SyncResult> {
    console.log(`🔄 強制同期: ${documentId}`);
    return await documentSyncEngine.syncDocument(documentId, { forceSync: true });
  }

  // 監視統計情報取得
  async getMonitoringStats(): Promise<any> {
    const stats = await prisma.google_docs_sources.groupBy({
      by: ['sync_status'],
      _count: { sync_status: true }
    });

    const totalSources = await prisma.google_docs_sources.count();
    const recentSync = await prisma.google_docs_sources.findFirst({
      orderBy: { last_synced: 'desc' }
    });

    const autoGeneratedKnowledge = await prisma.knowledge_items.count({
      where: { auto_generated: true }
    });

    return {
      totalSources,
      statusBreakdown: stats.reduce((acc, stat) => {
        acc[stat.sync_status] = stat._count.sync_status;
        return acc;
      }, {}),
      lastSyncTime: recentSync?.last_synced,
      autoGeneratedKnowledgeCount: autoGeneratedKnowledge
    };
  }

  // ユーティリティ
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 監視サービス停止
  stop(): void {
    this.isRunning = false;
  }

  // 実行状態確認
  isMonitoringRunning(): boolean {
    return this.isRunning;
  }
}

export const googleDocsMonitorService = new GoogleDocsMonitorService();
```

### ステップ2: 自動スケジューラー実装

#### 2.1 スケジューラー設定
```typescript
// src/lib/google/scheduler.ts
import { scheduleJob } from 'node-schedule';
import { googleDocsMonitorService } from './monitor-service';

export interface SchedulerConfig {
  enabled: boolean;
  cronPattern: string;
  timezone?: string;
  notifyOnCompletion?: boolean;
}

export class GoogleDocsScheduler {
  private jobs: Map<string, any> = new Map();
  private config: SchedulerConfig;

  constructor(config: SchedulerConfig) {
    this.config = config;
  }

  // 定期同期スケジュール開始
  startPeriodicSync(): void {
    if (!this.config.enabled) {
      console.log('📅 スケジューラーは無効です');
      return;
    }

    // 既存ジョブ停止
    this.stopPeriodicSync();

    console.log(`📅 定期同期スケジュール開始: ${this.config.cronPattern}`);

    const job = scheduleJob(
      'google-docs-sync',
      this.config.cronPattern,
      async () => {
        console.log('⏰ 定期同期実行開始:', new Date().toISOString());
        
        try {
          const results = await googleDocsMonitorService.checkAllDocuments();
          
          // 完了通知（オプション）
          if (this.config.notifyOnCompletion) {
            await this.sendCompletionNotification(results);
          }
          
        } catch (error) {
          console.error('⏰ 定期同期エラー:', error);
          
          // エラー通知（実装可能）
          await this.sendErrorNotification(error);
        }
      }
    );

    this.jobs.set('periodic-sync', job);
    console.log('✅ 定期同期スケジュール開始完了');
  }

  // 定期同期停止
  stopPeriodicSync(): void {
    const job = this.jobs.get('periodic-sync');
    if (job) {
      job.cancel();
      this.jobs.delete('periodic-sync');
      console.log('⏹️  定期同期スケジュール停止');
    }
  }

  // 手動実行
  async triggerManualSync(): Promise<any> {
    console.log('🔧 手動同期実行');
    
    try {
      const results = await googleDocsMonitorService.checkAllDocuments();
      return {
        success: true,
        timestamp: new Date().toISOString(),
        results
      };
    } catch (error) {
      console.error('🔧 手動同期エラー:', error);
      return {
        success: false,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // ヘルスチェック
  async performHealthCheck(): Promise<any> {
    const stats = await googleDocsMonitorService.getMonitoringStats();
    const isRunning = googleDocsMonitorService.isMonitoringRunning();
    
    return {
      schedulerEnabled: this.config.enabled,
      monitoringRunning: isRunning,
      activeJobs: this.jobs.size,
      lastHealthCheck: new Date().toISOString(),
      ...stats
    };
  }

  // 完了通知送信（拡張可能）
  private async sendCompletionNotification(results: any[]): Promise<void> {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`📨 同期完了通知: 成功${successful}件、失敗${failed}件`);
    
    // LINE通知やメール送信など実装可能
    // await lineNotificationService.sendSyncReport(results);
  }

  // エラー通知送信
  private async sendErrorNotification(error: Error): Promise<void> {
    console.log(`📨 エラー通知: ${error.message}`);
    
    // 緊急通知システム実装可能
    // await lineNotificationService.sendErrorAlert(error);
  }

  // 設定更新
  updateConfig(newConfig: Partial<SchedulerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.jobs.has('periodic-sync')) {
      this.stopPeriodicSync();
      this.startPeriodicSync();
    }
  }

  // 現在の設定取得
  getConfig(): SchedulerConfig {
    return { ...this.config };
  }
}

// デフォルト設定でスケジューラー初期化
export const googleDocsScheduler = new GoogleDocsScheduler({
  enabled: true,
  cronPattern: '0 0 * * *', // 毎日0:00
  timezone: 'Asia/Tokyo',
  notifyOnCompletion: true
});

// アプリケーション起動時にスケジューラー開始
if (process.env.NODE_ENV === 'production') {
  googleDocsScheduler.startPeriodicSync();
}
```

### ステップ3: API実装

#### 3.1 同期管理API
```typescript
// src/app/api/google-docs/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { documentSyncEngine } from '@/lib/google/sync-engine';
import { googleDocsMonitorService } from '@/lib/google/monitor-service';
import { googleDocsScheduler } from '@/lib/google/scheduler';

// 手動同期実行
export async function POST(request: NextRequest) {
  try {
    const { documentId, action } = await request.json();

    switch (action) {
      case 'sync_single':
        if (!documentId) {
          return NextResponse.json(
            { error: 'documentId が必要です' },
            { status: 400 }
          );
        }
        
        const singleResult = await documentSyncEngine.syncDocument(documentId, { forceSync: true });
        return NextResponse.json(singleResult);

      case 'sync_all':
        const allResults = await googleDocsMonitorService.checkAllDocuments();
        return NextResponse.json({
          success: true,
          results: allResults,
          summary: {
            total: allResults.length,
            successful: allResults.filter(r => r.success).length,
            failed: allResults.filter(r => !r.success).length,
            itemsCreated: allResults.reduce((sum, r) => sum + r.knowledgeItemsCreated, 0)
          }
        });

      case 'trigger_manual':
        const manualResult = await googleDocsScheduler.triggerManualSync();
        return NextResponse.json(manualResult);

      default:
        return NextResponse.json(
          { error: '無効なアクション' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { error: error.message || '同期処理に失敗しました' },
      { status: 500 }
    );
  }
}

// 同期履歴・ステータス取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (documentId) {
      // 特定ドキュメントの同期情報
      const source = await prisma.google_docs_sources.findUnique({
        where: { document_id: documentId },
        include: {
          knowledge_items: {
            select: {
              id: true,
              title: true,
              category: true,
              createdAt: true
            }
          }
        }
      });

      if (!source) {
        return NextResponse.json(
          { error: 'ドキュメントが見つかりません' },
          { status: 404 }
        );
      }

      return NextResponse.json(source);
    } else {
      // 全体統計
      const stats = await googleDocsMonitorService.getMonitoringStats();
      const health = await googleDocsScheduler.performHealthCheck();
      
      return NextResponse.json({
        stats,
        health,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Sync status API error:', error);
    return NextResponse.json(
      { error: '同期情報取得に失敗しました' },
      { status: 500 }
    );
  }
}
```

#### 3.2 監視管理API
```typescript
// src/app/api/google-docs/monitor/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { googleDocsScheduler } from '@/lib/google/scheduler';
import { googleDocsMonitorService } from '@/lib/google/monitor-service';

// 監視設定・状況取得
export async function GET() {
  try {
    const config = googleDocsScheduler.getConfig();
    const health = await googleDocsScheduler.performHealthCheck();
    const isRunning = googleDocsMonitorService.isMonitoringRunning();

    return NextResponse.json({
      config,
      health,
      isRunning,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Monitor status API error:', error);
    return NextResponse.json(
      { error: '監視状況取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 監視設定更新
export async function PUT(request: NextRequest) {
  try {
    const { enabled, cronPattern, notifyOnCompletion } = await request.json();

    // 設定検証
    if (cronPattern && !this.isValidCronPattern(cronPattern)) {
      return NextResponse.json(
        { error: '無効なcronパターンです' },
        { status: 400 }
      );
    }

    // 設定更新
    const newConfig = {
      ...(enabled !== undefined && { enabled }),
      ...(cronPattern && { cronPattern }),
      ...(notifyOnCompletion !== undefined && { notifyOnCompletion })
    };

    googleDocsScheduler.updateConfig(newConfig);

    return NextResponse.json({
      success: true,
      message: '監視設定を更新しました',
      config: googleDocsScheduler.getConfig()
    });

  } catch (error) {
    console.error('Monitor config update error:', error);
    return NextResponse.json(
      { error: '監視設定更新に失敗しました' },
      { status: 500 }
    );
  }
}

// 監視開始・停止
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'start':
        googleDocsScheduler.startPeriodicSync();
        return NextResponse.json({
          success: true,
          message: '定期監視を開始しました'
        });

      case 'stop':
        googleDocsScheduler.stopPeriodicSync();
        return NextResponse.json({
          success: true,
          message: '定期監視を停止しました'
        });

      case 'health_check':
        const health = await googleDocsScheduler.performHealthCheck();
        return NextResponse.json(health);

      default:
        return NextResponse.json(
          { error: '無効なアクション' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Monitor control API error:', error);
    return NextResponse.json(
      { error: '監視制御に失敗しました' },
      { status: 500 }
    );
  }
}

// Cronパターン検証（簡易版）
function isValidCronPattern(pattern: string): boolean {
  const parts = pattern.split(' ');
  return parts.length === 5 || parts.length === 6; // 基本的な検証
}
```

### ステップ4: 基本UI統合

#### 4.1 Google Docsソースカード
```tsx
// src/components/knowledge/GoogleDocsSourceCard.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, RefreshCw, Trash2, Clock, FileText, AlertCircle } from 'lucide-react';

interface GoogleDocsSource {
  id: string;
  document_id: string;
  document_url: string;
  title: string;
  last_modified?: Date;
  last_synced: Date;
  sync_status: 'pending' | 'syncing' | 'completed' | 'error';
  page_count: number;
  error_message?: string;
  knowledge_items?: Array<{ id: string; title: string; category: string }>;
}

interface GoogleDocsSourceCardProps {
  source: GoogleDocsSource;
  onSync: (documentId: string) => Promise<void>;
  onRemove: (documentId: string) => Promise<void>;
}

export default function GoogleDocsSourceCard({ 
  source, 
  onSync, 
  onRemove 
}: GoogleDocsSourceCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await onSync(source.document_id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (confirm('このドキュメントを削除しますか？関連するナレッジも削除されます。')) {
      await onRemove(source.document_id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'syncing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'syncing': return '🔄';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {source.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <FileText size={14} />
              <span>ページ数: {source.page_count}</span>
              <span>•</span>
              <span>ID: {source.document_id.slice(0, 8)}...</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Badge className={getStatusColor(source.sync_status)}>
              {getStatusIcon(source.sync_status)} {source.sync_status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 時刻情報 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-gray-400" />
            <div>
              <div className="font-medium">最終更新</div>
              <div className="text-gray-500">
                {source.last_modified 
                  ? new Date(source.last_modified).toLocaleString('ja-JP')
                  : '不明'
                }
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <RefreshCw size={14} className="text-gray-400" />
            <div>
              <div className="font-medium">最終同期</div>
              <div className="text-gray-500">
                {new Date(source.last_synced).toLocaleString('ja-JP')}
              </div>
            </div>
          </div>
        </div>

        {/* エラーメッセージ */}
        {source.error_message && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
            <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <div className="font-medium">同期エラー</div>
              <div>{source.error_message}</div>
            </div>
          </div>
        )}

        {/* 関連ナレッジ情報 */}
        {source.knowledge_items && source.knowledge_items.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm font-medium mb-2">
              関連ナレッジ ({source.knowledge_items.length}件)
            </div>
            <div className="space-y-1">
              {source.knowledge_items.slice(0, 3).map((item) => (
                <div key={item.id} className="text-sm text-gray-600 truncate">
                  • {item.title}
                </div>
              ))}
              {source.knowledge_items.length > 3 && (
                <div className="text-sm text-gray-500">
                  他 {source.knowledge_items.length - 3}件...
                </div>
              )}
            </div>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSync}
              disabled={isLoading || source.sync_status === 'syncing'}
              className="flex items-center gap-2"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              {isLoading ? '同期中...' : '手動同期'}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(source.document_url, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink size={14} />
              ソース
            </Button>
          </div>

          <Button
            size="sm"
            variant="destructive"
            onClick={handleRemove}
            className="flex items-center gap-2"
          >
            <Trash2 size={14} />
            削除
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 4.2 同期統計ダッシュボード
```tsx
// src/components/knowledge/SyncDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, FileText, Activity, Settings } from 'lucide-react';

interface SyncStats {
  totalSources: number;
  statusBreakdown: Record<string, number>;
  lastSyncTime?: string;
  autoGeneratedKnowledgeCount: number;
}

interface HealthInfo {
  schedulerEnabled: boolean;
  monitoringRunning: boolean;
  activeJobs: number;
  lastHealthCheck: string;
}

export default function SyncDashboard() {
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    
    // 1分毎に自動更新
    const interval = setInterval(loadDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [syncResponse, monitorResponse] = await Promise.all([
        fetch('/api/google-docs/sync'),
        fetch('/api/google-docs/monitor')
      ]);

      if (syncResponse.ok && monitorResponse.ok) {
        const syncData = await syncResponse.json();
        const monitorData = await monitorResponse.json();
        
        setStats(syncData.stats);
        setHealth(monitorData.health);
      }
    } catch (error) {
      console.error('Dashboard data load error:', error);
    }
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      const response = await fetch('/api/google-docs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_all' })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Manual sync completed:', result);
        
        // データ再読み込み
        await loadDashboardData();
      } else {
        console.error('Manual sync failed');
      }
    } catch (error) {
      console.error('Manual sync error:', error);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadDashboardData();
    setIsLoading(false);
  };

  if (!stats || !health) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <RefreshCw className="animate-spin" size={16} />
            読み込み中...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <FileText className="text-blue-500" size={20} />
              <div>
                <div className="text-2xl font-bold">{stats.totalSources}</div>
                <div className="text-sm text-gray-500">登録ドキュメント</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Activity className="text-green-500" size={20} />
              <div>
                <div className="text-2xl font-bold">{stats.autoGeneratedKnowledgeCount}</div>
                <div className="text-sm text-gray-500">自動生成ナレッジ</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="text-orange-500" size={20} />
              <div>
                <div className="text-sm font-medium">
                  {health.schedulerEnabled ? '有効' : '無効'}
                </div>
                <div className="text-sm text-gray-500">自動同期</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Settings className="text-purple-500" size={20} />
              <div>
                <div className="text-sm font-medium">
                  {health.monitoringRunning ? '実行中' : '停止中'}
                </div>
                <div className="text-sm text-gray-500">監視状況</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 同期ステータス */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>同期ステータス</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                更新
              </Button>
              
              <Button
                size="sm"
                onClick={handleManualSync}
                disabled={isManualSyncing}
                className="flex items-center gap-2"
              >
                <RefreshCw size={14} className={isManualSyncing ? 'animate-spin' : ''} />
                {isManualSyncing ? '同期実行中...' : '手動同期'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* ステータス別内訳 */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.statusBreakdown).map(([status, count]) => (
                <Badge key={status} variant="outline" className="flex items-center gap-1">
                  {status}: {count}件
                </Badge>
              ))}
            </div>

            {/* 最終同期時刻 */}
            {stats.lastSyncTime && (
              <div className="text-sm text-gray-500">
                最終同期: {new Date(stats.lastSyncTime).toLocaleString('ja-JP')}
              </div>
            )}

            {/* ヘルスチェック時刻 */}
            <div className="text-sm text-gray-500">
              最終ヘルスチェック: {new Date(health.lastHealthCheck).toLocaleString('ja-JP')}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### ステップ5: 動作テスト・検証

#### 5.1 同期機能テストスクリプト
```typescript
// scripts/test-sync-engine.ts
import { documentSyncEngine } from '../src/lib/google/sync-engine';
import { googleDocsMonitorService } from '../src/lib/google/monitor-service';

async function testSyncFunctionality() {
  console.log('🧪 同期エンジンテスト開始\n');

  try {
    // 1. 統計情報確認
    const stats = await googleDocsMonitorService.getMonitoringStats();
    console.log('📊 現在の統計:', stats);

    // 2. 単一ドキュメント同期テスト
    if (stats.totalSources > 0) {
      console.log('🔄 単一ドキュメント同期テスト...');
      // 実際のdocumentIdで置き換え
      const testDocId = '1jlKCfrxUnOGb9DvhlnVCPyzds-d_DYzEDUBf23jnXOY';
      
      const syncResult = await documentSyncEngine.syncDocument(testDocId, { forceSync: true });
      console.log('同期結果:', syncResult);
    }

    // 3. 全体監視テスト（小規模データのみ）
    console.log('👀 監視システムテスト...');
    const monitorResults = await googleDocsMonitorService.checkAllDocuments();
    console.log('監視結果:', monitorResults.length, '件処理');

    console.log('✅ 同期エンジンテスト完了');

  } catch (error) {
    console.error('❌ テストエラー:', error);
  }
}

testSyncFunctionality();
```

#### 5.2 統合テスト手順
```bash
# Phase 12 統合テスト実行

# 1. ビルド・型チェック
npm run build
npx tsc --noEmit

# 2. 開発サーバー起動
npm run dev

# 3. API動作確認
curl "http://localhost:3000/api/google-docs/sync"
curl -X POST "http://localhost:3000/api/google-docs/sync" \
  -H "Content-Type: application/json" \
  -d '{"action":"sync_all"}'

# 4. 監視API確認
curl "http://localhost:3000/api/google-docs/monitor"
curl -X POST "http://localhost:3000/api/google-docs/monitor" \
  -H "Content-Type: application/json" \
  -d '{"action":"health_check"}'

# 5. 既存機能確認
# ナレッジ管理画面: http://localhost:3000/knowledge
```

---

## ✅ Phase 12 完了チェックリスト

### 必須完了項目
- [ ] 同期エンジン実装・動作確認
- [ ] 監視サービス実装・稼働確認
- [ ] スケジューラー設定・定期実行確認
- [ ] API実装・動作確認
- [ ] 基本UI統合・表示確認
- [ ] エラーハンドリング・リトライ機能確認
- [ ] 既存ナレッジ機能の完全動作継続

### パフォーマンス確認
- [ ] 同期処理時間 < 30秒（ドキュメント毎）
- [ ] 並行処理制御の正常動作
- [ ] メモリ使用量の適切な制御
- [ ] API制限回避の動作確認

### 次Phase準備確認
- [ ] AI分析対象データの蓄積確認
- [ ] データベース整合性確認
- [ ] Phase 13実装準備完了

---

**🚀 Phase 12完了により、Google Docsコンテンツの自動取得・同期システムが完成します！**