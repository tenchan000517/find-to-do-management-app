# モバイルモード Phase A: 基盤構築 実装計画書

**フェーズ期間**: 3日間  
**実装日**: 2025年6月28日 〜 2025年6月30日  
**担当エンジニア**: モバイルUI/UX担当  
**前提条件**: 既存システムの構造を理解し、モバイル開発経験を有する

---

## 🎯 **Phase A 実装目標**

### **A.1 主要機能実装**
- **モバイルモード基盤**: ルーティング・モード切り替え・基本レイアウト
- **ジェスチャーシステム**: スワイプ・タップ・長押し基本制御
- **データ連携基盤**: 既存API・DB完全統合・リアルタイム同期

### **A.2 技術要件**
- 既存システムとの完全互換性維持
- モバイル専用フォルダ構造の新規追加のみ
- PWA基盤・オフライン対応の実装
- 既存データベース・APIの完全活用

---

## 📋 **Phase A 実装チェックリスト**

### **A.1 モバイルモード基盤構築 (1日)**
- [ ] `/pages/mobile/` ディレクトリ作成・基本ルーティング実装
- [ ] `/components/mobile/` ディレクトリ作成・基本コンポーネント
- [ ] モード切り替え機能実装（デスクトップ↔モバイル）
- [ ] モバイル専用レイアウト・ナビゲーション実装

### **A.2 ジェスチャー制御システム (1日)**
- [ ] Hammer.js統合・基本ジェスチャー認識
- [ ] スワイプ・タップ・長押し・ピンチ制御実装
- [ ] 視覚フィードバック・触覚フィードバック実装
- [ ] ジェスチャー設定・カスタマイズ機能

### **A.3 データ統合・同期システム (0.5日)**
- [ ] 既存API完全活用・モバイル専用エンドポイント作成
- [ ] リアルタイム同期（WebSocket・SSE）実装
- [ ] 楽観的UI更新・競合解決機能
- [ ] 既存データベースとの完全互換性確認

### **A.4 PWA・オフライン基盤 (0.5日)**
- [ ] PWA設定（manifest.json・Service Worker）
- [ ] オフライン対応（IndexedDB・キャッシュ戦略）
- [ ] インストール可能なPWA化
- [ ] プッシュ通知基盤（将来対応準備）

---

## 🔧 **詳細実装ガイド**

### **A.1 モバイルモード基盤構築**

#### **A.1.1 ディレクトリ構造作成**
```bash
# 新規作成ディレクトリ（既存に追加のみ）
src/
├── components/mobile/           # モバイル専用コンポーネント
│   ├── dashboard/
│   │   ├── ContextualDashboard.tsx
│   │   ├── TimeBasedView.tsx
│   │   └── MobileStatsCard.tsx
│   ├── gestures/
│   │   ├── GestureHandler.tsx
│   │   ├── SwipeController.tsx
│   │   └── TouchFeedback.tsx
│   ├── layout/
│   │   ├── MobileLayout.tsx
│   │   ├── MobileNavigation.tsx
│   │   └── ModeSwitcher.tsx
│   └── ui/
│       ├── SwipeableCard.tsx
│       ├── MobileButton.tsx
│       └── TouchTarget.tsx
├── pages/mobile/               # モバイル専用ページ
│   ├── dashboard.tsx
│   ├── tasks.tsx
│   ├── quick-add.tsx
│   └── settings.tsx
├── lib/mobile/                 # モバイル専用ロジック
│   ├── gestureHandling.ts
│   ├── mobileSync.ts
│   ├── contextAnalysis.ts
│   └── offlineManager.ts
└── styles/mobile/              # モバイル専用スタイル
    ├── gestures.css
    ├── mobile-layout.css
    └── animations.css
```

#### **A.1.2 基本ルーティング実装**
```typescript
// src/pages/mobile/dashboard.tsx
import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]';
import MobileLayout from '../../components/mobile/layout/MobileLayout';
import ContextualDashboard from '../../components/mobile/dashboard/ContextualDashboard';
import { useContextAnalysis } from '../../hooks/mobile/useContextAnalysis';
import { useMobileSync } from '../../hooks/mobile/useMobileSync';

interface MobileDashboardProps {
  user: any;
  initialData: {
    tasks: any[];
    projects: any[];
    appointments: any[];
  };
}

export default function MobileDashboard({ user, initialData }: MobileDashboardProps) {
  const { context, updateContext } = useContextAnalysis();
  const { isOnline, syncStatus } = useMobileSync();
  
  return (
    <MobileLayout user={user} title="ダッシュボード">
      <ContextualDashboard
        context={context}
        initialData={initialData}
        isOnline={isOnline}
        syncStatus={syncStatus}
      />
    </MobileLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  // 既存APIから初期データ取得
  const [tasks, projects, appointments] = await Promise.all([
    fetch(`${process.env.NEXTAUTH_URL}/api/tasks?userId=${session.user.id}`),
    fetch(`${process.env.NEXTAUTH_URL}/api/projects?userId=${session.user.id}`),
    fetch(`${process.env.NEXTAUTH_URL}/api/appointments?userId=${session.user.id}`)
  ]);

  return {
    props: {
      user: session.user,
      initialData: {
        tasks: await tasks.json(),
        projects: await projects.json(),
        appointments: await appointments.json()
      }
    },
  };
};
```

#### **A.1.3 モード切り替え機能**
```typescript
// src/components/mobile/layout/ModeSwitcher.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Switch } from '@headlessui/react';
import { DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

export default function ModeSwitcher() {
  const router = useRouter();
  const [isMobileMode, setIsMobileMode] = useState(true);

  const switchToDesktop = () => {
    // 現在のページに対応するデスクトップページに遷移
    const desktopPath = convertMobilePathToDesktop(router.pathname);
    router.push(desktopPath);
  };

  const convertMobilePathToDesktop = (mobilePath: string): string => {
    const pathMapping: Record<string, string> = {
      '/mobile/dashboard': '/dashboard',
      '/mobile/tasks': '/tasks',
      '/mobile/projects': '/projects',
      '/mobile/calendar': '/calendar',
      '/mobile/knowledge': '/knowledge',
      '/mobile/connections': '/connections',
      '/mobile/appointments': '/appointments'
    };
    
    return pathMapping[mobilePath] || '/dashboard';
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <DevicePhoneMobileIcon className="h-5 w-5 text-blue-600" />
      <span className="text-sm font-medium text-gray-700">モバイルモード</span>
      
      <button
        onClick={switchToDesktop}
        className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
      >
        <ComputerDesktopIcon className="h-4 w-4" />
        <span>デスクトップ版へ</span>
      </button>
    </div>
  );
}
```

### **A.2 ジェスチャー制御システム実装**

#### **A.2.1 Hammer.js統合**
```typescript
// src/lib/mobile/gestureHandling.ts
import Hammer from 'hammerjs';

export interface GestureEvent {
  type: 'swipe' | 'tap' | 'press' | 'pinch';
  direction?: 'left' | 'right' | 'up' | 'down';
  target: HTMLElement;
  data: any;
}

export interface GestureAction {
  execute: (target: HTMLElement, data?: any) => Promise<void>;
  feedback: (target: HTMLElement) => void;
  validate?: (target: HTMLElement) => boolean;
}

export class MobileGestureHandler {
  private hammer: HammerManager;
  private actions: Map<string, GestureAction> = new Map();
  private isEnabled: boolean = true;

  constructor(element: HTMLElement) {
    this.hammer = new Hammer(element);
    this.setupGestures();
    this.setupDefaultActions();
  }

  private setupGestures() {
    // スワイプジェスチャー設定
    this.hammer.get('swipe').set({
      direction: Hammer.DIRECTION_ALL,
      threshold: 10,
      velocity: 0.3
    });

    // タップジェスチャー設定
    this.hammer.get('tap').set({
      taps: 1,
      threshold: 10
    });

    // 長押しジェスチャー設定
    this.hammer.get('press').set({
      time: 500,
      threshold: 10
    });

    // ピンチジェスチャー設定
    this.hammer.get('pinch').set({
      enable: true,
      threshold: 0.1
    });

    // イベントリスナー設定
    this.hammer.on('swiperight swipeleft swipeup swipedown', this.handleSwipe.bind(this));
    this.hammer.on('tap', this.handleTap.bind(this));
    this.hammer.on('press', this.handlePress.bind(this));
    this.hammer.on('pinch', this.handlePinch.bind(this));
  }

  private setupDefaultActions() {
    // 右スワイプ: 完了・承認
    this.registerAction('swipe-right', {
      execute: async (target, data) => {
        const taskId = target.dataset.taskId;
        const projectId = target.dataset.projectId;
        
        if (taskId) {
          await this.completeTask(taskId);
        } else if (projectId) {
          await this.updateProjectStatus(projectId, 'completed');
        }
      },
      feedback: (target) => {
        this.showSuccessFeedback(target, '✅ 完了');
      },
      validate: (target) => {
        return !!(target.dataset.taskId || target.dataset.projectId);
      }
    });

    // 左スワイプ: 延期・却下
    this.registerAction('swipe-left', {
      execute: async (target, data) => {
        const taskId = target.dataset.taskId;
        if (taskId) {
          await this.postponeTask(taskId);
        }
      },
      feedback: (target) => {
        this.showWarningFeedback(target, '⏰ 延期');
      }
    });

    // 上スワイプ: 詳細・編集
    this.registerAction('swipe-up', {
      execute: async (target, data) => {
        const itemId = target.dataset.taskId || target.dataset.projectId;
        if (itemId) {
          await this.openDetailView(itemId, target.dataset.type);
        }
      },
      feedback: (target) => {
        this.showInfoFeedback(target, '📝 詳細');
      }
    });

    // 下スワイプ: 削除・アーカイブ
    this.registerAction('swipe-down', {
      execute: async (target, data) => {
        const confirmDelete = await this.showConfirmDialog('削除しますか？');
        if (confirmDelete) {
          const itemId = target.dataset.taskId || target.dataset.projectId;
          await this.deleteItem(itemId, target.dataset.type);
        }
      },
      feedback: (target) => {
        this.showDangerFeedback(target, '🗑️ 削除');
      }
    });

    // 長押し: 音声入力・詳細メニュー
    this.registerAction('press', {
      execute: async (target, data) => {
        if (target.dataset.allowVoice === 'true') {
          await this.startVoiceInput(target);
        } else {
          await this.showContextMenu(target);
        }
      },
      feedback: (target) => {
        this.showInfoFeedback(target, '🎤 音声入力');
      }
    });
  }

  public registerAction(gestureKey: string, action: GestureAction) {
    this.actions.set(gestureKey, action);
  }

  private async handleSwipe(event: HammerInput) {
    if (!this.isEnabled) return;

    const direction = this.getSwipeDirection(event.direction);
    const gestureKey = `swipe-${direction}`;
    const action = this.actions.get(gestureKey);

    if (action && (!action.validate || action.validate(event.target as HTMLElement))) {
      try {
        // 視覚フィードバック
        action.feedback(event.target as HTMLElement);
        
        // アクション実行
        await action.execute(event.target as HTMLElement, event);
        
        // 成功フィードバック
        this.triggerHapticFeedback('success');
        
      } catch (error) {
        console.error('Gesture action error:', error);
        this.showErrorFeedback(event.target as HTMLElement, 'エラーが発生しました');
        this.triggerHapticFeedback('error');
      }
    }
  }

  private async handleTap(event: HammerInput) {
    // ダブルタップ検出
    if (event.tapCount === 2) {
      const action = this.actions.get('double-tap');
      if (action) {
        action.feedback(event.target as HTMLElement);
        await action.execute(event.target as HTMLElement, event);
      }
    }
  }

  private async handlePress(event: HammerInput) {
    const action = this.actions.get('press');
    if (action) {
      action.feedback(event.target as HTMLElement);
      await action.execute(event.target as HTMLElement, event);
    }
  }

  private async handlePinch(event: HammerInput) {
    const scale = event.scale;
    if (scale > 1.2) {
      // ピンチアウト: 詳細表示
      const action = this.actions.get('pinch-out');
      if (action) {
        await action.execute(event.target as HTMLElement, { scale });
      }
    } else if (scale < 0.8) {
      // ピンチイン: 要約表示
      const action = this.actions.get('pinch-in');
      if (action) {
        await action.execute(event.target as HTMLElement, { scale });
      }
    }
  }

  private getSwipeDirection(hammerDirection: number): string {
    switch (hammerDirection) {
      case Hammer.DIRECTION_LEFT: return 'left';
      case Hammer.DIRECTION_RIGHT: return 'right';
      case Hammer.DIRECTION_UP: return 'up';
      case Hammer.DIRECTION_DOWN: return 'down';
      default: return 'unknown';
    }
  }

  // フィードバック関数
  private showSuccessFeedback(target: HTMLElement, message: string) {
    this.createFeedbackElement(target, message, 'success');
  }

  private showWarningFeedback(target: HTMLElement, message: string) {
    this.createFeedbackElement(target, message, 'warning');
  }

  private showInfoFeedback(target: HTMLElement, message: string) {
    this.createFeedbackElement(target, message, 'info');
  }

  private showDangerFeedback(target: HTMLElement, message: string) {
    this.createFeedbackElement(target, message, 'danger');
  }

  private showErrorFeedback(target: HTMLElement, message: string) {
    this.createFeedbackElement(target, message, 'error');
  }

  private createFeedbackElement(target: HTMLElement, message: string, type: string) {
    const feedback = document.createElement('div');
    feedback.className = `gesture-feedback gesture-feedback-${type}`;
    feedback.textContent = message;
    
    // アニメーション用スタイル
    feedback.style.position = 'absolute';
    feedback.style.zIndex = '9999';
    feedback.style.pointerEvents = 'none';
    feedback.style.fontSize = '14px';
    feedback.style.fontWeight = 'bold';
    feedback.style.padding = '4px 8px';
    feedback.style.borderRadius = '4px';
    feedback.style.whiteSpace = 'nowrap';
    
    // タイプ別スタイル
    const styles = {
      success: { background: '#10b981', color: '#ffffff' },
      warning: { background: '#f59e0b', color: '#ffffff' },
      info: { background: '#3b82f6', color: '#ffffff' },
      danger: { background: '#ef4444', color: '#ffffff' },
      error: { background: '#dc2626', color: '#ffffff' }
    };
    
    const style = styles[type as keyof typeof styles] || styles.info;
    Object.assign(feedback.style, style);
    
    // 位置調整
    const rect = target.getBoundingClientRect();
    feedback.style.left = `${rect.left + rect.width / 2}px`;
    feedback.style.top = `${rect.top - 30}px`;
    feedback.style.transform = 'translateX(-50%)';
    
    document.body.appendChild(feedback);
    
    // アニメーション
    feedback.animate([
      { opacity: 0, transform: 'translateX(-50%) translateY(10px)' },
      { opacity: 1, transform: 'translateX(-50%) translateY(0px)' },
      { opacity: 0, transform: 'translateX(-50%) translateY(-10px)' }
    ], {
      duration: 1500,
      easing: 'ease-out'
    }).addEventListener('finish', () => {
      document.body.removeChild(feedback);
    });
  }

  private triggerHapticFeedback(type: 'success' | 'warning' | 'error') {
    if ('vibrate' in navigator) {
      const patterns = {
        success: [50],
        warning: [100, 50, 100],
        error: [200, 100, 200]
      };
      navigator.vibrate(patterns[type]);
    }
  }

  // API連携メソッド
  private async completeTask(taskId: string) {
    const response = await fetch(`/api/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('タスク完了に失敗しました');
    }
    
    // リアルタイム更新通知
    this.notifyDataUpdate('task-completed', { taskId });
  }

  private async postponeTask(taskId: string) {
    const response = await fetch(`/api/tasks/${taskId}/postpone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('タスク延期に失敗しました');
    }
    
    this.notifyDataUpdate('task-postponed', { taskId });
  }

  private async deleteItem(itemId: string, type: string) {
    const response = await fetch(`/api/${type}s/${itemId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('削除に失敗しました');
    }
    
    this.notifyDataUpdate(`${type}-deleted`, { itemId });
  }

  private async openDetailView(itemId: string, type: string) {
    // モーダルまたは新しいページで詳細表示
    window.location.href = `/mobile/${type}s/${itemId}`;
  }

  private async startVoiceInput(target: HTMLElement) {
    // 音声入力機能（Phase Bで実装）
    console.log('Voice input will be implemented in Phase B');
  }

  private async showContextMenu(target: HTMLElement) {
    // コンテキストメニュー表示（Phase Bで実装）
    console.log('Context menu will be implemented in Phase B');
  }

  private async showConfirmDialog(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmed = window.confirm(message);
      resolve(confirmed);
    });
  }

  private notifyDataUpdate(event: string, data: any) {
    // データ更新イベント発火（他のコンポーネントに通知）
    window.dispatchEvent(new CustomEvent('mobileDataUpdate', {
      detail: { event, data }
    }));
  }

  public enable() {
    this.isEnabled = true;
  }

  public disable() {
    this.isEnabled = false;
  }

  public destroy() {
    this.hammer.destroy();
  }
}

// React Hook
export function useGestureHandler(elementRef: React.RefObject<HTMLElement>) {
  const [gestureHandler, setGestureHandler] = useState<MobileGestureHandler | null>(null);

  useEffect(() => {
    if (elementRef.current) {
      const handler = new MobileGestureHandler(elementRef.current);
      setGestureHandler(handler);

      return () => {
        handler.destroy();
      };
    }
  }, [elementRef]);

  return gestureHandler;
}
```

### **A.3 データ統合・同期システム実装**

#### **A.3.1 リアルタイム同期**
```typescript
// src/lib/mobile/mobileSync.ts
import { useEffect, useState, useCallback } from 'react';

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingActions: number;
  syncInProgress: boolean;
}

export interface OfflineAction {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  retryCount: number;
}

export class MobileSyncManager {
  private ws: WebSocket | null = null;
  private eventSource: EventSource | null = null;
  private offline: boolean = false;
  private actionQueue: OfflineAction[] = [];
  private subscribers: Map<string, Function[]> = new Map();

  constructor() {
    this.setupNetworkDetection();
    this.setupWebSocket();
    this.setupEventSource();
    this.loadOfflineQueue();
  }

  private setupNetworkDetection() {
    window.addEventListener('online', () => {
      this.offline = false;
      this.processOfflineQueue();
      this.notifySubscribers('network', { online: true });
    });

    window.addEventListener('offline', () => {
      this.offline = true;
      this.notifySubscribers('network', { online: false });
    });

    // 初期状態
    this.offline = !navigator.onLine;
  }

  private setupWebSocket() {
    if (typeof window === 'undefined') return;

    const wsUrl = process.env.NODE_ENV === 'production' 
      ? 'wss://your-domain.com/ws' 
      : 'ws://localhost:3000/ws';

    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.notifySubscribers('connection', { connected: true });
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleRealtimeUpdate(data);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.notifySubscribers('connection', { connected: false });
        
        // 再接続試行
        setTimeout(() => this.setupWebSocket(), 5000);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('WebSocket setup error:', error);
    }
  }

  private setupEventSource() {
    if (typeof window === 'undefined') return;

    try {
      this.eventSource = new EventSource('/api/events');
      
      this.eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleRealtimeUpdate(data);
      };

      this.eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
      };
    } catch (error) {
      console.error('EventSource setup error:', error);
    }
  }

  private handleRealtimeUpdate(data: any) {
    // データタイプに応じて適切な更新を実行
    switch (data.type) {
      case 'task-updated':
        this.notifySubscribers('task', data.payload);
        break;
      case 'project-updated':
        this.notifySubscribers('project', data.payload);
        break;
      case 'appointment-updated':
        this.notifySubscribers('appointment', data.payload);
        break;
      default:
        this.notifySubscribers('general', data);
    }
  }

  public async syncAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) {
    const fullAction: OfflineAction = {
      id: this.generateActionId(),
      timestamp: new Date(),
      retryCount: 0,
      ...action
    };

    if (this.offline) {
      // オフライン時はキューに追加
      this.queueAction(fullAction);
      this.saveOfflineQueue();
      return { success: true, queued: true };
    } else {
      // オンライン時は即座実行
      try {
        const result = await this.executeAction(fullAction);
        this.broadcastUpdate(fullAction.type, result);
        return { success: true, result };
      } catch (error) {
        // 失敗時はキューに追加して後で再試行
        this.queueAction(fullAction);
        this.saveOfflineQueue();
        throw error;
      }
    }
  }

  private queueAction(action: OfflineAction) {
    this.actionQueue.push(action);
    this.notifySubscribers('queue', { 
      pending: this.actionQueue.length,
      action: action.type 
    });
  }

  private async processOfflineQueue() {
    if (this.actionQueue.length === 0) return;

    this.notifySubscribers('sync', { inProgress: true });

    const processPromises = this.actionQueue.map(async (action) => {
      try {
        const result = await this.executeAction(action);
        this.broadcastUpdate(action.type, result);
        return { success: true, action };
      } catch (error) {
        action.retryCount++;
        if (action.retryCount >= 3) {
          console.error('Action failed after 3 retries:', action, error);
          return { success: false, action, error };
        }
        return { success: false, action, retry: true };
      }
    });

    const results = await Promise.allSettled(processPromises);
    
    // 成功したアクションを削除、失敗したアクションは再試行キューに残す
    this.actionQueue = this.actionQueue.filter((action) => {
      const result = results.find(r => 
        r.status === 'fulfilled' && 
        (r.value as any).action?.id === action.id
      );
      return result ? !(result.value as any).success : true;
    });

    this.saveOfflineQueue();
    this.notifySubscribers('sync', { 
      inProgress: false,
      completed: results.filter(r => r.status === 'fulfilled').length
    });
  }

  private async executeAction(action: OfflineAction): Promise<any> {
    const { type, data } = action;
    
    let endpoint = '';
    let method = 'POST';
    
    // アクションタイプに応じてAPI呼び出し
    switch (type) {
      case 'task-complete':
        endpoint = `/api/tasks/${data.taskId}/complete`;
        break;
      case 'task-create':
        endpoint = '/api/tasks';
        break;
      case 'task-update':
        endpoint = `/api/tasks/${data.taskId}`;
        method = 'PUT';
        break;
      case 'project-update':
        endpoint = `/api/projects/${data.projectId}`;
        method = 'PUT';
        break;
      default:
        throw new Error(`Unknown action type: ${type}`);
    }

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    return await response.json();
  }

  private broadcastUpdate(type: string, data: any) {
    // WebSocketで他のクライアントに更新を通知
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'broadcast',
        actionType: type,
        data
      }));
    }
  }

  private loadOfflineQueue() {
    try {
      const stored = localStorage.getItem('mobileOfflineQueue');
      if (stored) {
        this.actionQueue = JSON.parse(stored).map((action: any) => ({
          ...action,
          timestamp: new Date(action.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.actionQueue = [];
    }
  }

  private saveOfflineQueue() {
    try {
      localStorage.setItem('mobileOfflineQueue', JSON.stringify(this.actionQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public subscribe(event: string, callback: Function) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event)!.push(callback);

    // 購読解除関数を返す
    return () => {
      const callbacks = this.subscribers.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private notifySubscribers(event: string, data: any) {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Subscriber callback error:', error);
        }
      });
    }
  }

  public getStatus(): SyncStatus {
    return {
      isOnline: !this.offline,
      lastSync: this.actionQueue.length === 0 ? new Date() : null,
      pendingActions: this.actionQueue.length,
      syncInProgress: false // TODO: 実際の同期状態を追跡
    };
  }

  public destroy() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.subscribers.clear();
  }
}

// React Hook
export function useMobileSync() {
  const [syncManager] = useState(() => new MobileSyncManager());
  const [status, setStatus] = useState<SyncStatus>(syncManager.getStatus());

  useEffect(() => {
    const unsubscribeNetwork = syncManager.subscribe('network', (data: any) => {
      setStatus(prev => ({ ...prev, isOnline: data.online }));
    });

    const unsubscribeQueue = syncManager.subscribe('queue', (data: any) => {
      setStatus(prev => ({ ...prev, pendingActions: data.pending }));
    });

    const unsubscribeSync = syncManager.subscribe('sync', (data: any) => {
      setStatus(prev => ({ ...prev, syncInProgress: data.inProgress }));
    });

    return () => {
      unsubscribeNetwork();
      unsubscribeQueue();
      unsubscribeSync();
      syncManager.destroy();
    };
  }, [syncManager]);

  const syncAction = useCallback(async (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => {
    return await syncManager.syncAction(action);
  }, [syncManager]);

  return {
    isOnline: status.isOnline,
    lastSync: status.lastSync,
    pendingActions: status.pendingActions,
    syncInProgress: status.syncInProgress,
    syncAction
  };
}
```

### **A.4 PWA・オフライン基盤実装**

#### **A.4.1 PWA設定**
```json
// public/manifest.json
{
  "name": "FIND to DO Mobile",
  "short_name": "FTD Mobile",
  "description": "革新的タスク管理 - モバイルモード",
  "start_url": "/mobile/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait",
  "scope": "/mobile/",
  "categories": ["productivity", "business"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "新しいタスク",
      "short_name": "タスク追加",
      "description": "新しいタスクを素早く追加",
      "url": "/mobile/quick-add?type=task",
      "icons": [{ "src": "/icons/shortcut-task.png", "sizes": "96x96" }]
    },
    {
      "name": "今日の予定",
      "short_name": "今日",
      "description": "今日の予定を確認",
      "url": "/mobile/dashboard?view=today",
      "icons": [{ "src": "/icons/shortcut-today.png", "sizes": "96x96" }]
    }
  ]
}
```

#### **A.4.2 Service Worker実装**
```typescript
// public/sw.js
const CACHE_NAME = 'ftd-mobile-v1';
const urlsToCache = [
  '/mobile/dashboard',
  '/mobile/tasks',
  '/mobile/quick-add',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/icons/icon-192x192.png',
  '/manifest.json'
];

// インストール時
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// アクティベート時
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// フェッチイベント
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // API リクエストの処理
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 成功レスポンスをキャッシュ
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open('api-cache').then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // オフライン時はキャッシュから返す
          return caches.match(request);
        })
    );
    return;
  }

  // 静的リソースの処理
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // キャッシュがあれば返す
        if (response) {
          return response;
        }
        
        // ネットワークから取得してキャッシュ
        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        });
      })
  );
});

// バックグラウンド同期
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// プッシュ通知
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'FIND to DOから新しい通知があります',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('FIND to DO', options)
  );
});

// 通知クリック
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/mobile/dashboard')
  );
});

async function doBackgroundSync() {
  try {
    const offlineQueue = await getOfflineQueue();
    for (const action of offlineQueue) {
      await retryAction(action);
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function getOfflineQueue() {
  // IndexedDBからオフライン操作キューを取得
  return [];
}

async function retryAction(action) {
  // 失敗した操作を再試行
  return fetch(action.url, action.options);
}
```

---

## 🧪 **Phase A テスト計画**

### **A.1 単体テスト**
```typescript
// __tests__/mobile/GestureHandler.test.ts
import { MobileGestureHandler } from '../../src/lib/mobile/gestureHandling';

describe('MobileGestureHandler', () => {
  let mockElement: HTMLElement;
  let gestureHandler: MobileGestureHandler;

  beforeEach(() => {
    mockElement = document.createElement('div');
    gestureHandler = new MobileGestureHandler(mockElement);
  });

  afterEach(() => {
    gestureHandler.destroy();
  });

  test('should register default gestures', () => {
    expect(gestureHandler).toBeDefined();
  });

  test('should handle swipe right gesture', async () => {
    const mockTask = document.createElement('div');
    mockTask.dataset.taskId = 'test-task-1';
    
    // Mock API response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    ) as jest.Mock;

    await gestureHandler.handleSwipe({
      direction: 2, // Hammer.DIRECTION_RIGHT
      target: mockTask
    } as any);

    expect(fetch).toHaveBeenCalledWith('/api/tasks/test-task-1/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  });
});

// __tests__/mobile/MobileSync.test.ts
import { MobileSyncManager } from '../../src/lib/mobile/mobileSync';

describe('MobileSyncManager', () => {
  let syncManager: MobileSyncManager;

  beforeEach(() => {
    syncManager = new MobileSyncManager();
  });

  afterEach(() => {
    syncManager.destroy();
  });

  test('should queue actions when offline', async () => {
    // オフライン状態をシミュレート
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });

    const action = {
      type: 'task-complete',
      data: { taskId: 'test-task' }
    };

    const result = await syncManager.syncAction(action);
    
    expect(result.queued).toBe(true);
    expect(syncManager.getStatus().pendingActions).toBe(1);
  });

  test('should execute actions when online', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    ) as jest.Mock;

    const action = {
      type: 'task-complete',
      data: { taskId: 'test-task' }
    };

    const result = await syncManager.syncAction(action);
    
    expect(result.success).toBe(true);
    expect(fetch).toHaveBeenCalled();
  });
});
```

### **A.2 統合テスト**
```typescript
// __tests__/integration/MobilePhaseA.test.ts
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/router';
import MobileDashboard from '../../src/pages/mobile/dashboard';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

describe('Mobile Phase A Integration', () => {
  const mockUser = {
    id: 'test-user',
    name: 'Test User',
    email: 'test@example.com'
  };

  const mockInitialData = {
    tasks: [],
    projects: [],
    appointments: []
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      pathname: '/mobile/dashboard',
      push: jest.fn()
    });
  });

  test('should render mobile dashboard', () => {
    render(
      <MobileDashboard 
        user={mockUser} 
        initialData={mockInitialData} 
      />
    );

    expect(screen.getByText('ダッシュボード')).toBeInTheDocument();
  });

  test('should handle mode switching', () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      pathname: '/mobile/dashboard',
      push: mockPush
    });

    render(
      <MobileDashboard 
        user={mockUser} 
        initialData={mockInitialData} 
      />
    );

    const desktopButton = screen.getByText('デスクトップ版へ');
    desktopButton.click();

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });
});
```

---

## 📊 **Phase A 成功指標**

### **A.1 定量指標**
- [ ] **モバイルページ作成**: 4つの基本ページ作成完了
- [ ] **ジェスチャー認識**: 8つの基本ジェスチャー認識成功率 95%
- [ ] **PWAインストール**: 正常にインストール可能
- [ ] **オフライン動作**: 基本機能がオフラインで動作
- [ ] **API レスポンス時間**: < 800ms（モバイル環境考慮）

### **A.2 機能指標**
- [ ] **モード切り替え**: デスクトップ↔モバイル切り替え正常動作
- [ ] **データ同期**: 既存データベースとの完全同期
- [ ] **ジェスチャー動作**: スワイプでタスク完了・延期が動作
- [ ] **リアルタイム更新**: WebSocket/SSEでの即座反映

### **A.3 運用指標**
- [ ] **既存機能**: 100%動作維持（デスクトップモード）
- [ ] **データ整合性**: モバイル↔デスクトップ間でデータ整合
- [ ] **セキュリティ**: 既存認証システムとの完全統合

---

## ⚠️ **Phase A 注意事項・制約**

### **A.1 技術制約**
- 既存システムとの完全互換性必須
- モバイル専用ディレクトリのみ追加（既存ファイル変更最小限）
- 既存APIエンドポイントの活用優先

### **A.2 UI/UX制約**
- ジェスチャー操作の学習コスト最小化
- 既存ユーザーの混乱防止
- アクセシビリティ基準遵守

### **A.3 運用制約**
- 段階的展開（強制移行なし）
- デスクトップモードとの並行運用
- オフライン対応による一時的データ不整合の許容

---

## 🚀 **Phase A 完了基準**

### **A.1 機能完了基準**
1. **モバイルモード基盤完了**
   - [ ] `/mobile/` ルーティング動作
   - [ ] モード切り替え機能動作
   - [ ] 既存データ表示動作

2. **ジェスチャーシステム完了**
   - [ ] 8つの基本ジェスチャー認識
   - [ ] タスク操作（完了・延期・削除）動作
   - [ ] 視覚・触覚フィードバック動作

3. **同期システム完了**
   - [ ] オンライン時リアルタイム同期
   - [ ] オフライン時キューイング動作
   - [ ] 競合解決機能動作

### **A.2 品質完了基準**
- [ ] 全テスト通過（単体・統合）
- [ ] モバイルブラウザ互換性確認
- [ ] PWAインストール・動作確認
- [ ] セキュリティチェック完了

### **A.3 運用完了基準**
- [ ] 本番環境デプロイ成功
- [ ] PWAアプリストア申請準備完了
- [ ] ユーザーガイド作成完了
- [ ] ロールバック手順確認完了

---

**次のアクション**: Phase A 実装開始。この基盤を確実に構築することで、Phase B・Cでの革新的機能実装が可能になります。