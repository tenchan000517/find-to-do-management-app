"use client";
import { useEffect, useRef, ReactNode } from 'react';
import { SimpleGestureHandler } from '@/lib/mobile/simpleGestures';

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
  const gestureHandlerRef = useRef<SimpleGestureHandler | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !cardRef.current) return;

    // シンプルジェスチャーハンドラー初期化
    gestureHandlerRef.current = new SimpleGestureHandler(cardRef.current, {
      onSwipeRight: onSwipeRight ? () => {
        addVisualFeedback('bg-green-100 border-green-500');
        onSwipeRight();
      } : undefined,
      onSwipeLeft: onSwipeLeft ? () => {
        addVisualFeedback('bg-yellow-100 border-yellow-500');
        onSwipeLeft();
      } : undefined,
      onSwipeUp: onSwipeUp ? () => {
        addVisualFeedback('bg-blue-100 border-blue-500');
        onSwipeUp();
      } : undefined,
      onSwipeDown: onSwipeDown ? () => {
        addVisualFeedback('bg-red-100 border-red-500');
        onSwipeDown();
      } : undefined,
      onTap: () => {
        // タップ時の軽い feedback
        addVisualFeedback('scale-95', 150);
      }
    });

    return () => {
      if (gestureHandlerRef.current) {
        gestureHandlerRef.current.destroy();
      }
    };
  }, [onSwipeRight, onSwipeLeft, onSwipeUp, onSwipeDown]);

  const addVisualFeedback = (classes: string, duration = 300) => {
    if (!cardRef.current) return;
    
    const originalClasses = cardRef.current.className;
    cardRef.current.className += ` ${classes}`;
    
    setTimeout(() => {
      if (cardRef.current) {
        cardRef.current.className = originalClasses;
      }
    }, duration);
  };

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
        select-none
        ${className}
      `}
      style={{
        touchAction: 'manipulation',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      {children}
      
      {/* シンプルなジェスチャーヒント */}
      <div className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-200 hover:opacity-20">
        {onSwipeRight && (
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-green-600 text-sm">
            ✓
          </div>
        )}
        {onSwipeLeft && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-yellow-600 text-sm">
            ⏰
          </div>
        )}
        {onSwipeUp && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-blue-600 text-sm">
            👁
          </div>
        )}
        {onSwipeDown && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-red-600 text-sm">
            🗑
          </div>
        )}
      </div>
    </div>
  );
}