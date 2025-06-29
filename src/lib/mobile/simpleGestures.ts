/**
 * Simple Mobile Gestures - Native Touch API Implementation
 * 依頼書に基づく「シンプルで直感的」なジェスチャー実装
 */

export interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  duration: number;
}

export interface GestureCallbacks {
  onSwipeLeft?: (element: HTMLElement) => void;
  onSwipeRight?: (element: HTMLElement) => void;
  onSwipeUp?: (element: HTMLElement) => void;
  onSwipeDown?: (element: HTMLElement) => void;
  onTap?: (element: HTMLElement) => void;
  onLongPress?: (element: HTMLElement) => void;
}

export class SimpleGestureHandler {
  private element: HTMLElement;
  private callbacks: GestureCallbacks;
  private touchStart: { x: number; y: number; time: number } | null = null;
  private longPressTimer: number | null = null;
  private readonly SWIPE_THRESHOLD = 50; // px
  private readonly LONG_PRESS_DURATION = 500; // ms

  constructor(element: HTMLElement, callbacks: GestureCallbacks) {
    this.element = element;
    this.callbacks = callbacks;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // タッチイベント
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this));

    // マウスイベント（デスクトップでのテスト用）
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    this.touchStart = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    // 長押し検出開始
    this.startLongPressTimer();
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (!this.touchStart) return;

    this.clearLongPressTimer();

    if (event.changedTouches.length !== 1) return;

    const touch = event.changedTouches[0];
    const endTime = Date.now();
    const duration = endTime - this.touchStart.time;

    const deltaX = touch.clientX - this.touchStart.x;
    const deltaY = touch.clientY - this.touchStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // スワイプ判定
    if (distance > this.SWIPE_THRESHOLD) {
      this.handleSwipe(deltaX, deltaY, distance, duration);
    } else if (duration < 300) {
      // タップ判定
      this.callbacks.onTap?.(this.element);
    }

    this.touchStart = null;
  }

  private handleTouchCancel(): void {
    this.clearLongPressTimer();
    this.touchStart = null;
  }

  private handleMouseDown(event: MouseEvent): void {
    this.touchStart = {
      x: event.clientX,
      y: event.clientY,
      time: Date.now()
    };
    this.startLongPressTimer();
  }

  private handleMouseUp(event: MouseEvent): void {
    if (!this.touchStart) return;

    this.clearLongPressTimer();

    const endTime = Date.now();
    const duration = endTime - this.touchStart.time;

    const deltaX = event.clientX - this.touchStart.x;
    const deltaY = event.clientY - this.touchStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > this.SWIPE_THRESHOLD) {
      this.handleSwipe(deltaX, deltaY, distance, duration);
    } else if (duration < 300) {
      this.callbacks.onTap?.(this.element);
    }

    this.touchStart = null;
  }

  private handleSwipe(deltaX: number, deltaY: number, distance: number, duration: number): void {
    // 主要な方向を判定
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

    if (isHorizontal) {
      if (deltaX > 0) {
        this.callbacks.onSwipeRight?.(this.element);
      } else {
        this.callbacks.onSwipeLeft?.(this.element);
      }
    } else {
      if (deltaY > 0) {
        this.callbacks.onSwipeDown?.(this.element);
      } else {
        this.callbacks.onSwipeUp?.(this.element);
      }
    }
  }

  private startLongPressTimer(): void {
    this.longPressTimer = window.setTimeout(() => {
      if (this.touchStart) {
        this.callbacks.onLongPress?.(this.element);
        this.touchStart = null; // 長押し後はタップ判定しない
      }
    }, this.LONG_PRESS_DURATION);
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  public destroy(): void {
    this.clearLongPressTimer();
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.removeEventListener('mouseup', this.handleMouseUp.bind(this));
  }
}

/**
 * 簡単な使用方法
 * const handler = new SimpleGestureHandler(element, {
 *   onSwipeRight: () => console.log('Complete task'),
 *   onSwipeLeft: () => console.log('Postpone task'),
 *   onTap: () => console.log('Show details')
 * });
 */