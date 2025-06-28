"use client";
import { useEffect, useRef, ReactNode } from 'react';
import { MobileGestureHandler } from '@/lib/mobile/gestureHandling';

interface SwipeableCardProps {
  children: ReactNode;
  taskId?: string;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  className?: string;
}

export default function SwipeableCard({
  children,
  taskId,
  onSwipeRight,
  onSwipeLeft,
  onSwipeUp,
  onSwipeDown,
  className = ''
}: SwipeableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const gestureHandlerRef = useRef<MobileGestureHandler | null>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    // ジェスチャーハンドラー初期化
    gestureHandlerRef.current = new MobileGestureHandler(cardRef.current);

    // カスタムアクションがある場合は登録
    if (onSwipeRight) {
      gestureHandlerRef.current.registerAction('swiperight', {
        type: 'task-complete',
        execute: onSwipeRight,
        feedback: {
          visual: 'bg-green-100 border-green-500 transform scale-105',
          haptic: true
        }
      });
    }

    if (onSwipeLeft) {
      gestureHandlerRef.current.registerAction('swipeleft', {
        type: 'task-postpone',
        execute: onSwipeLeft,
        feedback: {
          visual: 'bg-yellow-100 border-yellow-500 transform scale-105',
          haptic: true
        }
      });
    }

    if (onSwipeUp) {
      gestureHandlerRef.current.registerAction('swipeup', {
        type: 'show-details',
        execute: onSwipeUp,
        feedback: {
          visual: 'bg-blue-100 border-blue-500 transform scale-105'
        }
      });
    }

    if (onSwipeDown) {
      gestureHandlerRef.current.registerAction('swipedown', {
        type: 'task-delete',
        execute: onSwipeDown,
        feedback: {
          visual: 'bg-red-100 border-red-500 transform scale-105',
          haptic: true
        }
      });
    }

    return () => {
      if (gestureHandlerRef.current) {
        gestureHandlerRef.current.destroy();
      }
    };
  }, [onSwipeRight, onSwipeLeft, onSwipeUp, onSwipeDown]);

  return (
    <div
      ref={cardRef}
      data-task-id={taskId}
      className={`
        relative
        bg-white
        rounded-lg
        border
        border-gray-200
        shadow-sm
        transition-all
        duration-300
        touch-manipulation
        ${className}
      `}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation'
      }}
    >
      {children}
      
      {/* ジェスチャーヒント表示 */}
      <div className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-200 gesture-hints">
        {/* 右スワイプヒント */}
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-green-600">
          <span className="text-xl">✓</span>
        </div>
        
        {/* 左スワイプヒント */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-yellow-600">
          <span className="text-xl">⏰</span>
        </div>
        
        {/* 上スワイプヒント */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-blue-600">
          <span className="text-xl">👁</span>
        </div>
        
        {/* 下スワイプヒント */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-red-600">
          <span className="text-xl">🗑</span>
        </div>
      </div>
    </div>
  );
}