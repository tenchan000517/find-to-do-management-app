/**
 * Mermaidレンダリング用シーケンシャル実行キュー
 * 複数のMermaid図表の並行レンダリングによる競合状態を回避
 */

type RenderTask = () => Promise<void>;

class MermaidRenderQueue {
  private queue: Array<{
    task: RenderTask;
    resolve: () => void;
    reject: (error: any) => void;
  }> = [];
  private isProcessing = false;
  
  /**
   * レンダリングタスクをキューに追加し、順次実行
   */
  async enqueue(renderTask: RenderTask): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        task: renderTask,
        resolve,
        reject
      });
      this.processQueue();
    });
  }
  
  /**
   * キューを順次処理（非同期）
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      while (this.queue.length > 0) {
        const queueItem = this.queue.shift()!;
        
        try {
          await queueItem.task();
          queueItem.resolve();
        } catch (error) {
          queueItem.reject(error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * キューの状態を取得（デバッグ用）
   */
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing
    };
  }
}

// グローバルインスタンス（シングルトン）
export const mermaidRenderQueue = new MermaidRenderQueue();