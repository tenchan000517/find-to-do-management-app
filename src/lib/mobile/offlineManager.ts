// オフライン対応とデータ同期管理

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'task' | 'project' | 'appointment' | 'connection';
  data: any;
  timestamp: number;
  retryCount: number;
  previousData?: any; // 競合解決用の前の状態
  clientId: string; // クライアント識別用
}

export interface ConflictResolution {
  strategy: 'client-wins' | 'server-wins' | 'merge' | 'manual';
  mergedData?: any;
}

export interface SyncMetadata {
  lastSyncTimestamp: number;
  clientId: string;
  pendingChanges: number;
  conflictCount: number;
}

export class OfflineManager {
  private dbName = 'find-mobile-offline';
  private storeName = 'actions';
  private metadataStore = 'sync-metadata';
  private conflictStore = 'conflicts';
  private db: IDBDatabase | null = null;
  private clientId: string;
  private syncInProgress = false;

  constructor() {
    // ユニークなクライアントIDを生成
    this.clientId = localStorage.getItem('mobile-client-id') || this.generateClientId();
    localStorage.setItem('mobile-client-id', this.clientId);
  }

  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

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
          store.createIndex('clientId', 'clientId', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.metadataStore)) {
          const metaStore = db.createObjectStore(this.metadataStore, { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains(this.conflictStore)) {
          const conflictStore = db.createObjectStore(this.conflictStore, { keyPath: 'id' });
          conflictStore.createIndex('timestamp', 'timestamp', { unique: false });
          conflictStore.createIndex('entity', 'entity', { unique: false });
        }
      };
    });
  }

  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount' | 'clientId'>): Promise<void> {
    if (!this.db) await this.init();
    
    const fullAction: OfflineAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      clientId: this.clientId
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
        retryCount: 0,
        clientId: this.clientId
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
        retryCount: 0,
        clientId: this.clientId
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
        retryCount: 0,
        clientId: this.clientId
      });
    } else {
      await this.queueAction({
        type: 'delete',
        entity: 'task',
        data: { id: taskId }
      });
    }
  }

  // 高度な同期機能
  async performDifferentialSync(): Promise<void> {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    
    try {
      const metadata = await this.getSyncMetadata();
      const lastSync = metadata?.lastSyncTimestamp || 0;
      
      // サーバーから差分データを取得
      const serverChanges = await this.fetchServerChanges(lastSync);
      
      // ローカルの変更を取得
      const localChanges = await this.getQueuedActions();
      
      // 競合検出と解決
      const conflicts = this.detectConflicts(localChanges, serverChanges);
      
      if (conflicts.length > 0) {
        await this.resolveConflicts(conflicts);
      }
      
      // ローカル変更をサーバーに送信
      await this.syncLocalChangesToServer(localChanges);
      
      // サーバー変更をローカルに適用
      await this.applySafeServerChanges(serverChanges);
      
      // 同期メタデータを更新
      await this.updateSyncMetadata({
        lastSyncTimestamp: Date.now(),
        clientId: this.clientId,
        pendingChanges: 0,
        conflictCount: conflicts.length
      });
      
    } finally {
      this.syncInProgress = false;
    }
  }

  private async fetchServerChanges(lastSync: number): Promise<any[]> {
    const response = await fetch(`/api/sync/changes?since=${lastSync}&clientId=${this.clientId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch server changes');
    }
    return response.json();
  }

  private detectConflicts(localChanges: OfflineAction[], serverChanges: any[]): any[] {
    const conflicts = [];
    
    for (const localChange of localChanges) {
      const conflictingServerChange = serverChanges.find(
        serverChange => 
          serverChange.entity === localChange.entity &&
          serverChange.entityId === localChange.data.id &&
          serverChange.timestamp > localChange.timestamp &&
          serverChange.clientId !== localChange.clientId
      );
      
      if (conflictingServerChange) {
        conflicts.push({
          id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          localChange,
          serverChange: conflictingServerChange,
          timestamp: Date.now()
        });
      }
    }
    
    return conflicts;
  }

  private async resolveConflicts(conflicts: any[]): Promise<void> {
    for (const conflict of conflicts) {
      const resolution = await this.getConflictResolution(conflict);
      
      switch (resolution.strategy) {
        case 'client-wins':
          // ローカルの変更を優先
          break;
        case 'server-wins':
          // サーバーの変更を優先、ローカル変更を破棄
          await this.removeAction(conflict.localChange.id);
          break;
        case 'merge':
          // データをマージ
          const mergedData = this.mergeChanges(
            conflict.localChange.data,
            conflict.serverChange.data
          );
          conflict.localChange.data = mergedData;
          break;
        case 'manual':
          // 手動解決が必要な競合を保存
          await this.saveConflictForManualResolution(conflict);
          break;
      }
    }
  }

  private async getConflictResolution(conflict: any): Promise<ConflictResolution> {
    // 自動解決ストラテジー
    const { localChange, serverChange } = conflict;
    
    // タイムスタンプベースの自動解決
    if (localChange.timestamp > serverChange.timestamp) {
      return { strategy: 'client-wins' };
    } else if (serverChange.timestamp > localChange.timestamp + 5000) { // 5秒以上の差
      return { strategy: 'server-wins' };
    }
    
    // データの種類に基づく解決
    if (localChange.entity === 'task') {
      return this.resolveTaskConflict(localChange, serverChange);
    }
    
    // デフォルトは手動解決
    return { strategy: 'manual' };
  }

  private resolveTaskConflict(localChange: any, serverChange: any): ConflictResolution {
    const localData = localChange.data;
    const serverData = serverChange.data;
    
    // 削除操作は優先
    if (localChange.type === 'delete' || serverChange.type === 'delete') {
      return { strategy: 'server-wins' };
    }
    
    // ステータス変更を優先
    if (localData.status !== serverData.status) {
      if (localData.status === 'COMPLETE') {
        return { strategy: 'client-wins' };
      }
    }
    
    // マージ可能な場合
    return {
      strategy: 'merge',
      mergedData: this.mergeChanges(localData, serverData)
    };
  }

  private mergeChanges(localData: any, serverData: any): any {
    // 基本的なマージロジック
    const merged = { ...serverData };
    
    // ローカルの重要な変更を保持
    if (localData.title && localData.title !== serverData.title) {
      merged.title = localData.title;
    }
    
    if (localData.status && localData.status !== serverData.status) {
      // より進んだステータスを優先
      const statusPriority: Record<string, number> = { 'IDEA': 1, 'PLAN': 2, 'DO': 3, 'CHECK': 4, 'COMPLETE': 5 };
      if ((statusPriority[localData.status] || 0) > (statusPriority[serverData.status] || 0)) {
        merged.status = localData.status;
      }
    }
    
    // 更新日時は最新を使用
    merged.updatedAt = Math.max(
      new Date(localData.updatedAt || 0).getTime(),
      new Date(serverData.updatedAt || 0).getTime()
    );
    
    return merged;
  }

  private async saveConflictForManualResolution(conflict: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.conflictStore], 'readwrite');
      const store = transaction.objectStore(this.conflictStore);
      
      const request = store.add(conflict);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async syncLocalChangesToServer(localChanges: OfflineAction[]): Promise<void> {
    for (const change of localChanges) {
      try {
        await this.executeAction(change);
        await this.removeAction(change.id);
      } catch (error) {
        console.error('Failed to sync local change:', error);
        await this.incrementRetryCount(change.id);
      }
    }
  }

  private async applySafeServerChanges(serverChanges: any[]): Promise<void> {
    // 競合しないサーバー変更のみを適用
    for (const change of serverChanges) {
      if (change.clientId !== this.clientId) {
        // 他のクライアントからの変更を適用
        await this.applyServerChange(change);
      }
    }
  }

  private async applyServerChange(change: any): Promise<void> {
    // サーバー変更をローカルデータベースに適用
    // 実装は使用するローカルデータベースに依存
    console.log('Applying server change:', change);
  }

  private async getSyncMetadata(): Promise<SyncMetadata | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.metadataStore], 'readonly');
      const store = transaction.objectStore(this.metadataStore);
      
      const request = store.get('sync-metadata');
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async updateSyncMetadata(metadata: SyncMetadata): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.metadataStore], 'readwrite');
      const store = transaction.objectStore(this.metadataStore);
      
      const request = store.put({ key: 'sync-metadata', value: metadata });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 手動競合解決用のメソッド
  async getConflicts(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.conflictStore], 'readonly');
      const store = transaction.objectStore(this.conflictStore);
      
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async resolveConflictManually(conflictId: string, resolution: ConflictResolution): Promise<void> {
    // 手動解決の実装
    console.log('Manual conflict resolution:', conflictId, resolution);
  }

  // 同期状態の取得
  async getSyncStatus(): Promise<{ pending: number; conflicts: number; lastSync: number }> {
    const [actions, conflicts, metadata] = await Promise.all([
      this.getQueuedActions(),
      this.getConflicts(),
      this.getSyncMetadata()
    ]);
    
    return {
      pending: actions.length,
      conflicts: conflicts.length,
      lastSync: metadata?.lastSyncTimestamp || 0
    };
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