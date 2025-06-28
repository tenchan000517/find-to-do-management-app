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
  private hammer: HammerManager;
  private actions: Map<string, GestureAction> = new Map();
  private config: GestureConfig;

  constructor(element: HTMLElement, config?: Partial<GestureConfig>) {
    this.config = {
      swipeThreshold: 50,
      pressTime: 500,
      tapCount: 2,
      pinchThreshold: 0.3,
      ...config
    };

    this.hammer = new Hammer(element);
    this.setupGestures();
    this.setupDefaultActions();
  }

  private setupGestures(): void {
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

    // イベントリスナー登録
    this.hammer.on('swiperight', this.handleSwipeRight.bind(this));
    this.hammer.on('swipeleft', this.handleSwipeLeft.bind(this));
    this.hammer.on('swipeup', this.handleSwipeUp.bind(this));
    this.hammer.on('swipedown', this.handleSwipeDown.bind(this));
    this.hammer.on('press', this.handlePress.bind(this));
    this.hammer.on('tap', this.handleTap.bind(this));
    this.hammer.on('doubletap', this.handleDoubleTap.bind(this));
    this.hammer.on('pinch', this.handlePinch.bind(this));
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
    if (action.feedback?.haptic && navigator.vibrate) {
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
    const event = new CustomEvent('showTaskDetails', { 
      detail: { taskId } 
    });
    window.dispatchEvent(event);
  }

  public destroy(): void {
    this.hammer.destroy();
  }
}