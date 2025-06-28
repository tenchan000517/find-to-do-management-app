// オフライン対応とデータ同期管理

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'task' | 'project' | 'appointment' | 'connection';
  data: any;
  timestamp: number;
  retryCount: number;
}

export class OfflineManager {
  private dbName = 'find-mobile-offline';
  private storeName = 'actions';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('entity', 'entity', { unique: false });
        }
      };
    });
  }

  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    if (!this.db) await this.init();
    
    const fullAction: OfflineAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.add(fullAction);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getQueuedActions(): Promise<OfflineAction[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      
      const request = index.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeAction(actionId: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.delete(actionId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async incrementRetryCount(actionId: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const getRequest = store.get(actionId);
      getRequest.onsuccess = () => {
        const action = getRequest.result;
        if (action) {
          action.retryCount++;
          const putRequest = store.put(action);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async processQueue(): Promise<void> {
    if (!navigator.onLine) return;
    
    const actions = await this.getQueuedActions();
    
    for (const action of actions) {
      try {
        await this.executeAction(action);
        await this.removeAction(action.id);
      } catch (error) {
        console.error('Failed to execute queued action:', error);
        
        if (action.retryCount < 3) {
          await this.incrementRetryCount(action.id);
        } else {
          // 3回失敗したら削除
          await this.removeAction(action.id);
          console.error('Action removed after 3 failed attempts:', action);
        }
      }
    }
  }

  private async executeAction(action: OfflineAction): Promise<void> {
    const { type, entity, data } = action;
    const baseUrl = `/api/${entity}s`;
    
    let url = baseUrl;
    let method = 'POST';
    let body: string | undefined = JSON.stringify(data);
    
    switch (type) {
      case 'create':
        method = 'POST';
        break;
      case 'update':
        method = 'PATCH';
        url = `${baseUrl}/${data.id}`;
        break;
      case 'delete':
        method = 'DELETE';
        url = `${baseUrl}/${data.id}`;
        body = undefined;
        break;
    }
    
    const response = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  // ユーティリティメソッド
  async createTask(taskData: any): Promise<void> {
    if (navigator.onLine) {
      // オンライン時は直接実行
      await this.executeAction({
        id: '',
        type: 'create',
        entity: 'task',
        data: taskData,
        timestamp: Date.now(),
        retryCount: 0
      });
    } else {
      // オフライン時はキューに追加
      await this.queueAction({
        type: 'create',
        entity: 'task',
        data: taskData
      });
    }
  }

  async updateTask(taskId: string, updates: any): Promise<void> {
    if (navigator.onLine) {
      await this.executeAction({
        id: '',
        type: 'update',
        entity: 'task',
        data: { id: taskId, ...updates },
        timestamp: Date.now(),
        retryCount: 0
      });
    } else {
      await this.queueAction({
        type: 'update',
        entity: 'task',
        data: { id: taskId, ...updates }
      });
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    if (navigator.onLine) {
      await this.executeAction({
        id: '',
        type: 'delete',
        entity: 'task',
        data: { id: taskId },
        timestamp: Date.now(),
        retryCount: 0
      });
    } else {
      await this.queueAction({
        type: 'delete',
        entity: 'task',
        data: { id: taskId }
      });
    }
  }
}

// Global instance
export const offlineManager = new OfflineManager();

// Initialize on page load
if (typeof window !== 'undefined') {
  offlineManager.init();
  
  // Process queue when coming back online
  window.addEventListener('online', () => {
    offlineManager.processQueue();
  });
}