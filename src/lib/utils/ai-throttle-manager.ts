// AI API呼び出し制御・スロットリング管理
export class AIThrottleManager {
  private static instance: AIThrottleManager;
  private isProcessing = false;
  private queue: (() => Promise<any>)[] = [];
  private readonly DELAY_MS: number;
  private readonly MAX_RETRIES = 3;
  
  constructor(delayMs: number = 2000) {
    this.DELAY_MS = delayMs;
  }
  
  static getInstance(delayMs?: number): AIThrottleManager {
    if (!this.instance) {
      this.instance = new AIThrottleManager(delayMs);
    }
    return this.instance;
  }

  /**
   * AI処理を順次実行キューに追加
   * @param task 実行する非同期タスク
   * @returns タスクの実行結果
   */
  async enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await this.executeWithRetry(task);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      // キューが空でAI処理中でなければ開始
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * キューを順次処理
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🎯 AI処理キュー開始: ${this.queue.length}件待機中`);

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          console.log(`⏳ AI処理実行中... 残り${this.queue.length}件`);
          await task();
          
          // スロットリング（最後のタスクでなければ待機）
          if (this.queue.length > 0) {
            console.log(`⌛ ${this.DELAY_MS}ms待機中...`);
            await this.delay(this.DELAY_MS);
          }
        } catch (error) {
          console.error('❌ AI処理タスクエラー:', error);
          // エラーでもキューを継続処理
        }
      }
    }

    this.isProcessing = false;
    console.log('✅ AI処理キュー完了');
  }

  /**
   * リトライ機能付きタスク実行
   */
  private async executeWithRetry<T>(task: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const result = await task();
        if (attempt > 1) {
          console.log(`✅ AI処理成功 (${attempt}回目の試行)`);
        }
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ AI処理失敗 (${attempt}/${this.MAX_RETRIES}): ${lastError.message}`);
        
        if (attempt < this.MAX_RETRIES) {
          // 指数バックオフで待機
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`🔄 ${backoffDelay}ms後にリトライ...`);
          await this.delay(backoffDelay);
        }
      }
    }
    
    throw new Error(`AI処理が${this.MAX_RETRIES}回失敗: ${lastError?.message}`);
  }

  /**
   * 非同期待機
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * キューの状態取得
   */
  getQueueStatus(): { queueLength: number; isProcessing: boolean } {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing
    };
  }

  /**
   * スロットリング設定を動的変更
   */
  setDelay(delayMs: number): void {
    (this as any).DELAY_MS = delayMs;
    console.log(`🔧 AI呼び出し間隔を${delayMs}msに変更`);
  }

  /**
   * キューをクリア（緊急停止）
   */
  clearQueue(): void {
    this.queue = [];
    console.log('🛑 AI処理キューをクリア');
  }
}

// データ分割処理ユーティリティ
export class ContentChunker {
  /**
   * 大容量コンテンツを分割して処理
   * @param content 分割対象のコンテンツ
   * @param maxChunkSize 最大チャンクサイズ（文字数）
   * @returns 分割されたチャンク配列
   */
  static splitContent(content: string, maxChunkSize: number = 30000): string[] {
    if (content.length <= maxChunkSize) {
      return [content];
    }

    const chunks: string[] = [];
    const paragraphs = content.split(/\n\s*\n/);
    
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      // パラグラフ単体が制限超過する場合は強制分割
      if (paragraph.length > maxChunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        
        // 大きなパラグラフを文単位で分割
        const sentences = paragraph.split(/[。！？\n]/);
        let sentenceChunk = '';
        
        for (const sentence of sentences) {
          if (sentenceChunk.length + sentence.length > maxChunkSize) {
            if (sentenceChunk) {
              chunks.push(sentenceChunk.trim());
              sentenceChunk = sentence;
            } else {
              // 文単体でも大きすぎる場合は強制カット
              chunks.push(sentence.substring(0, maxChunkSize));
            }
          } else {
            sentenceChunk += sentence + '。';
          }
        }
        
        if (sentenceChunk) {
          currentChunk = sentenceChunk;
        }
        
      } else {
        // 通常のパラグラフ追加処理
        if (currentChunk.length + paragraph.length > maxChunkSize) {
          chunks.push(currentChunk.trim());
          currentChunk = paragraph;
        } else {
          currentChunk += '\n\n' + paragraph;
        }
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    console.log(`📄 コンテンツ分割完了: ${content.length}文字 → ${chunks.length}チャンク`);
    return chunks;
  }
}