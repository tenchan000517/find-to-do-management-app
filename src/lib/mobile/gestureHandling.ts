import Hammer from 'hammerjs';

export interface GestureAction {
  type: 'task-complete' | 'task-postpone' | 'task-delete' | 'show-details' | 'voice-input' | 'favorite' | 'summary-view' | 'detail-view';
  execute: (target: HTMLElement, data?: any) => Promise<void> | void;
  feedback?: {
    visual: string;
    haptic?: boolean;
  };
}

export interface GestureConfig {
  swipeThreshold: number;
  pressTime: number;
  tapCount: number;
  pinchThreshold: number;
}

export class MobileGestureHandler {
  private hammer: HammerManager | null = null;
  private actions: Map<string, GestureAction> = new Map();
  private config: GestureConfig;
  private dragState: {
    isDragging: boolean;
    element: HTMLElement | null;
    startPosition: { x: number; y: number };
    clone: HTMLElement | null;
  } = {
    isDragging: false,
    element: null,
    startPosition: { x: 0, y: 0 },
    clone: null
  };

  constructor(element: HTMLElement, config?: Partial<GestureConfig>) {
    this.config = {
      swipeThreshold: 50,
      pressTime: 500,
      tapCount: 2,
      pinchThreshold: 0.3,
      ...config
    };

    // ブラウザ環境でのみ初期化
    if (typeof window !== 'undefined' && element) {
      this.hammer = new Hammer(element);
      this.setupGestures();
      this.setupDefaultActions();
    }
  }

  private setupGestures(): void {
    if (!this.hammer) return;
    
    // スワイプジェスチャー設定
    this.hammer.get('swipe').set({
      direction: Hammer.DIRECTION_ALL,
      threshold: this.config.swipeThreshold
    });

    // 長押し設定
    this.hammer.get('press').set({
      time: this.config.pressTime
    });

    // ダブルタップ設定
    this.hammer.get('tap').set({
      taps: 1
    });

    // ピンチ設定
    this.hammer.get('pinch').set({
      enable: true,
      threshold: this.config.pinchThreshold
    });

    // パン設定（ドラッグ&ドロップ用）
    this.hammer.get('pan').set({
      direction: Hammer.DIRECTION_ALL
    });

    // イベントリスナー登録
    this.hammer.on('swiperight', this.handleSwipeRight.bind(this));
    this.hammer.on('swipeleft', this.handleSwipeLeft.bind(this));
    this.hammer.on('swipeup', this.handleSwipeUp.bind(this));
    this.hammer.on('swipedown', this.handleSwipeDown.bind(this));
    this.hammer.on('press', this.handlePress.bind(this));
    this.hammer.on('tap', this.handleTap.bind(this));
    this.hammer.on('doubletap', this.handleDoubleTap.bind(this));
    this.hammer.on('pinch', this.handlePinch.bind(this));
    this.hammer.on('panstart', this.handlePanStart.bind(this));
    this.hammer.on('panmove', this.handlePanMove.bind(this));
    this.hammer.on('panend', this.handlePanEnd.bind(this));
  }

  private setupDefaultActions(): void {
    // 右スワイプ: タスク完了
    this.registerAction('swiperight', {
      type: 'task-complete',
      execute: async (target) => {
        const taskId = target.getAttribute('data-task-id');
        if (taskId) {
          await this.completeTask(taskId);
        }
      },
      feedback: {
        visual: 'bg-green-100 border-green-500',
        haptic: true
      }
    });

    // 左スワイプ: タスク延期
    this.registerAction('swipeleft', {
      type: 'task-postpone',
      execute: async (target) => {
        const taskId = target.getAttribute('data-task-id');
        if (taskId) {
          await this.postponeTask(taskId);
        }
      },
      feedback: {
        visual: 'bg-yellow-100 border-yellow-500',
        haptic: true
      }
    });

    // 上スワイプ: 詳細表示
    this.registerAction('swipeup', {
      type: 'show-details',
      execute: (target) => {
        const taskId = target.getAttribute('data-task-id');
        if (taskId) {
          this.showTaskDetails(taskId);
        }
      },
      feedback: {
        visual: 'bg-blue-100 border-blue-500'
      }
    });

    // 下スワイプ: タスク削除
    this.registerAction('swipedown', {
      type: 'task-delete',
      execute: async (target) => {
        const taskId = target.getAttribute('data-task-id');
        if (taskId) {
          await this.deleteTask(taskId);
        }
      },
      feedback: {
        visual: 'bg-red-100 border-red-500',
        haptic: true
      }
    });

    // 長押し: 音声入力開始
    this.registerAction('press', {
      type: 'voice-input',
      execute: (target) => {
        // Phase B で音声機能実装予定
        console.log('音声入力機能は Phase B で実装予定');
      },
      feedback: {
        visual: 'bg-purple-100 border-purple-500'
      }
    });

    // ダブルタップ: お気に入り
    this.registerAction('doubletap', {
      type: 'favorite',
      execute: async (target) => {
        const taskId = target.getAttribute('data-task-id');
        if (taskId) {
          await this.toggleFavorite(taskId);
        }
      },
      feedback: {
        visual: 'bg-pink-100 border-pink-500'
      }
    });
  }

  public registerAction(gesture: string, action: GestureAction): void {
    this.actions.set(gesture, action);
  }

  private async handleSwipeRight(event: HammerInput): Promise<void> {
    await this.executeGesture('swiperight', event);
  }

  private async handleSwipeLeft(event: HammerInput): Promise<void> {
    await this.executeGesture('swipeleft', event);
  }

  private async handleSwipeUp(event: HammerInput): Promise<void> {
    await this.executeGesture('swipeup', event);
  }

  private async handleSwipeDown(event: HammerInput): Promise<void> {
    await this.executeGesture('swipedown', event);
  }

  private async handlePress(event: HammerInput): Promise<void> {
    await this.executeGesture('press', event);
  }

  private async handleTap(event: HammerInput): Promise<void> {
    await this.executeGesture('tap', event);
  }

  private async handleDoubleTap(event: HammerInput): Promise<void> {
    await this.executeGesture('doubletap', event);
  }

  private async handlePinch(event: HammerInput): Promise<void> {
    if (event.scale < 1) {
      await this.executeGesture('pinch-in', event);
    } else {
      await this.executeGesture('pinch-out', event);
    }
    
    // ピンチズーム機能：タスク詳細のフォントサイズ調整
    this.handlePinchZoom(event);
  }

  private handlePinchZoom(event: HammerInput): void {
    if (typeof window === 'undefined') return;
    
    const target = event.target as HTMLElement;
    const taskCard = target.closest('[data-task-id]') as HTMLElement;
    
    if (!taskCard) return;

    // 現在のフォントサイズを取得
    const currentFontSize = window.getComputedStyle(taskCard).fontSize;
    const currentSize = parseFloat(currentFontSize);
    
    // スケールに基づいてフォントサイズを調整
    const newSize = Math.max(10, Math.min(24, currentSize * event.scale));
    
    // すべてのテキスト要素に適用
    const textElements = taskCard.querySelectorAll('h3, p, span');
    textElements.forEach(element => {
      (element as HTMLElement).style.fontSize = `${newSize}px`;
    });

    // ズーム状態をローカルストレージに保存
    const taskId = taskCard.getAttribute('data-task-id');
    if (taskId && typeof localStorage !== 'undefined') {
      localStorage.setItem(`task-zoom-${taskId}`, newSize.toString());
    }
  }

  private handlePanStart(event: HammerInput): void {
    const target = event.target as HTMLElement;
    const taskCard = target.closest('[data-task-id]') as HTMLElement;
    
    if (!taskCard) return;

    this.dragState.isDragging = true;
    this.dragState.element = taskCard;
    this.dragState.startPosition = {
      x: event.center.x,
      y: event.center.y
    };

    // ドラッグ開始の視覚フィードバック
    taskCard.style.transform = 'scale(1.05)';
    taskCard.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
    taskCard.style.zIndex = '1000';
    
    // バイブレーション
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(100);
    }

    // ドラッグ開始イベントをディスパッチ
    if (typeof window !== 'undefined') {
      const customEvent = new CustomEvent('taskDragStart', {
        detail: { taskId: taskCard.getAttribute('data-task-id') }
      });
      window.dispatchEvent(customEvent);
    }
  }

  private handlePanMove(event: HammerInput): void {
    if (!this.dragState.isDragging || !this.dragState.element) return;

    const deltaX = event.center.x - this.dragState.startPosition.x;
    const deltaY = event.center.y - this.dragState.startPosition.y;

    // 要素を移動
    this.dragState.element.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.05)`;

    // ドロップゾーンの検出
    const dropZone = this.getDropZoneAt(event.center.x, event.center.y);
    if (dropZone) {
      dropZone.classList.add('drop-zone-active');
    }

    // 他のドロップゾーンから active クラスを削除
    document.querySelectorAll('.drop-zone-active').forEach(zone => {
      if (zone !== dropZone) {
        zone.classList.remove('drop-zone-active');
      }
    });
  }

  private handlePanEnd(event: HammerInput): void {
    if (!this.dragState.isDragging || !this.dragState.element) return;

    const dropZone = this.getDropZoneAt(event.center.x, event.center.y);
    const taskId = this.dragState.element.getAttribute('data-task-id');

    if (dropZone && taskId) {
      // ドロップゾーンが見つかった場合
      const newStatus = dropZone.getAttribute('data-status');
      if (newStatus) {
        this.updateTaskStatus(taskId, newStatus);
      }
    }

    // ドラッグ状態をリセット
    this.resetDragState();

    // すべてのドロップゾーンから active クラスを削除
    document.querySelectorAll('.drop-zone-active').forEach(zone => {
      zone.classList.remove('drop-zone-active');
    });

    // ドラッグ終了イベントをディスパッチ
    if (typeof window !== 'undefined') {
      const customEvent = new CustomEvent('taskDragEnd', {
        detail: { taskId, dropZone: dropZone?.getAttribute('data-status') }
      });
      window.dispatchEvent(customEvent);
    }
  }

  private getDropZoneAt(x: number, y: number): HTMLElement | null {
    // 一時的に現在のドラッグ要素を隠す
    const currentElement = this.dragState.element;
    if (currentElement) {
      currentElement.style.pointerEvents = 'none';
    }

    const elementBelow = document.elementFromPoint(x, y);
    const dropZone = elementBelow?.closest('[data-drop-zone]') as HTMLElement;

    // ドラッグ要素の pointerEvents を復元
    if (currentElement) {
      currentElement.style.pointerEvents = '';
    }

    return dropZone;
  }

  private resetDragState(): void {
    if (this.dragState.element) {
      this.dragState.element.style.transform = '';
      this.dragState.element.style.boxShadow = '';
      this.dragState.element.style.zIndex = '';
    }

    this.dragState.isDragging = false;
    this.dragState.element = null;
    this.dragState.startPosition = { x: 0, y: 0 };
  }

  private async updateTaskStatus(taskId: string, newStatus: string): Promise<void> {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      // 成功のバイブレーション
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([50, 50, 50]);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      
      // エラーのバイブレーション
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(200);
      }
    }
  }

  private async executeGesture(gestureType: string, event: HammerInput): Promise<void> {
    const action = this.actions.get(gestureType);
    if (!action) return;

    const target = event.target as HTMLElement;
    
    // 視覚フィードバック
    if (action.feedback?.visual) {
      this.showVisualFeedback(target, action.feedback.visual);
    }

    // 触覚フィードバック
    if (action.feedback?.haptic && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }

    // アクション実行
    try {
      await action.execute(target);
    } catch (error) {
      console.error('Gesture action failed:', error);
    }
  }

  private showVisualFeedback(element: HTMLElement, classes: string): void {
    const originalClasses = element.className;
    element.className += ` ${classes}`;
    
    setTimeout(() => {
      element.className = originalClasses;
    }, 300);
  }

  // API連携メソッド
  private async completeTask(taskId: string): Promise<void> {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' })
      });
      
      if (!response.ok) {
        throw new Error('Failed to complete task');
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  }

  private async postponeTask(taskId: string): Promise<void> {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dueDate: tomorrow.toISOString(),
          status: 'PLAN'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to postpone task');
      }
    } catch (error) {
      console.error('Error postponing task:', error);
    }
  }

  private async deleteTask(taskId: string): Promise<void> {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }

  private async toggleFavorite(taskId: string): Promise<void> {
    try {
      const response = await fetch(`/api/tasks/${taskId}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }

  private showTaskDetails(taskId: string): void {
    // 詳細表示モーダルを開く
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('showTaskDetails', { 
        detail: { taskId } 
      });
      window.dispatchEvent(event);
    }
  }

  public destroy(): void {
    if (this.hammer) {
      this.hammer.destroy();
    }
  }
}