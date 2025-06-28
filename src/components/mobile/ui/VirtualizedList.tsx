"use client";
import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  overscan?: number; // 追加でレンダリングするアイテム数
  onScroll?: (scrollTop: number) => void;
}

export default function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscan = 5,
  onScroll
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // 表示する範囲を計算
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  // 表示するアイテムのリスト
  const visibleItems = items.slice(startIndex, endIndex + 1);

  // 仮想スクロールのオフセット計算
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    onScroll?.(scrollTop);
  }, [onScroll]);


  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
              data-index={startIndex + index}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 可変高さ対応の仮想リスト
interface DynamicVirtualizedListProps<T> {
  items: T[];
  estimatedItemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  overscan?: number;
}

export function DynamicVirtualizedList<T>({
  items,
  estimatedItemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscan = 5
}: DynamicVirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState<number[]>([]);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  // アイテムの高さを測定
  useEffect(() => {
    const heights = itemsRef.current.map(el => 
      el ? el.getBoundingClientRect().height : estimatedItemHeight
    );
    setItemHeights(heights);
  }, [items, estimatedItemHeight]);

  // 累積高さを計算
  const cumulativeHeights = itemHeights.reduce((acc, height, index) => {
    acc[index] = (acc[index - 1] || 0) + (height || estimatedItemHeight);
    return acc;
  }, [] as number[]);

  // 表示範囲を計算
  const startIndex = Math.max(0, 
    cumulativeHeights.findIndex(height => height > scrollTop) - overscan
  );
  
  const endIndex = Math.min(
    items.length - 1,
    cumulativeHeights.findIndex(height => height > scrollTop + containerHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = cumulativeHeights[cumulativeHeights.length - 1] || 0;
  const offsetY = cumulativeHeights[startIndex - 1] || 0;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              ref={el => { 
                itemsRef.current[startIndex + index] = el;
              }}
              data-index={startIndex + index}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 無限スクロール対応の仮想リスト
interface InfiniteVirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  className?: string;
  overscan?: number;
  threshold?: number; // ロード開始の閾値（ピクセル）
}

export function InfiniteVirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  hasMore,
  loadMore,
  className = '',
  overscan = 5,
  threshold = 200
}: InfiniteVirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [loading, setLoading] = useState(false);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback(async (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);

    // 無限スクロールのロード判定
    const scrollHeight = e.currentTarget.scrollHeight;
    const clientHeight = e.currentTarget.clientHeight;
    
    if (
      hasMore &&
      !loading &&
      scrollTop + clientHeight >= scrollHeight - threshold
    ) {
      setLoading(true);
      try {
        await loadMore();
      } finally {
        setLoading(false);
      }
    }
  }, [hasMore, loading, loadMore, threshold]);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
              data-index={startIndex + index}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
        
        {/* ローディングインジケーター */}
        {loading && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}