"use client";
import { useEffect, useCallback, useRef } from 'react';

export interface MemoryUsage {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export function useMemoryOptimization() {
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const memoryThreshold = 50 * 1024 * 1024; // 50MB

  // メモリ使用量取得
  const getMemoryUsage = useCallback((): MemoryUsage | null => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }, []);

  // メモリ不足チェック
  const isMemoryLow = useCallback((): boolean => {
    const memory = getMemoryUsage();
    if (!memory) return false;
    
    return memory.usedJSHeapSize > memoryThreshold;
  }, [memoryThreshold]);

  // 自動ガベージコレクション
  const forceGarbageCollection = useCallback(() => {
    if ('gc' in window && typeof window.gc === 'function') {
      window.gc();
    }
  }, []);

  // メモリクリーンアップ
  const performMemoryCleanup = useCallback(() => {
    // 不要なDOM要素をクリア
    const unusedElements = document.querySelectorAll('[data-cleanup="true"]');
    unusedElements.forEach(element => {
      element.remove();
    });

    // 画像キャッシュをクリア
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        const imageCache = cacheNames.find(name => name.includes('images'));
        if (imageCache) {
          caches.delete(imageCache);
        }
      });
    }

    // Event Listenersをクリア
    const events = ['scroll', 'resize', 'touchmove'];
    events.forEach(eventType => {
      const elements = document.querySelectorAll(`[data-${eventType}-cleanup="true"]`);
      elements.forEach(element => {
        element.removeAttribute(`data-${eventType}-cleanup`);
      });
    });

    // LocalStorageの不要なデータをクリア
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('temp-') && key.includes(Date.now().toString().slice(0, -6))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // 強制ガベージコレクション
    forceGarbageCollection();
  }, [forceGarbageCollection]);

  // 定期的なメモリチェック
  const startMemoryMonitoring = useCallback(() => {
    const checkMemory = () => {
      if (isMemoryLow()) {
        console.warn('メモリ使用量が高くなっています。クリーンアップを実行します。');
        performMemoryCleanup();
      }
    };

    // 30秒ごとにチェック
    cleanupTimerRef.current = setInterval(checkMemory, 30000);
    
    // 初回チェック
    checkMemory();
  }, [isMemoryLow, performMemoryCleanup]);

  const stopMemoryMonitoring = useCallback(() => {
    if (cleanupTimerRef.current) {
      clearInterval(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }
  }, []);

  // コンポーネントマウント時に監視開始
  useEffect(() => {
    startMemoryMonitoring();
    
    return () => {
      stopMemoryMonitoring();
    };
  }, [startMemoryMonitoring, stopMemoryMonitoring]);

  // Page Visibility API でのメモリ最適化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // ページが非表示になった時にクリーンアップ
        performMemoryCleanup();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [performMemoryCleanup]);

  // 低メモリ警告の監視
  useEffect(() => {
    const handleMemoryWarning = () => {
      console.warn('システムからの低メモリ警告を受信しました。');
      performMemoryCleanup();
    };

    // WebKit系ブラウザでの低メモリ警告
    window.addEventListener('pagehide', handleMemoryWarning);
    
    return () => {
      window.removeEventListener('pagehide', handleMemoryWarning);
    };
  }, [performMemoryCleanup]);

  return {
    getMemoryUsage,
    isMemoryLow,
    performMemoryCleanup,
    forceGarbageCollection,
    startMemoryMonitoring,
    stopMemoryMonitoring
  };
}

// メモリ効率的なデータ管理
export function useDataPagination<T>(
  data: T[],
  pageSize: number = 20
) {
  const currentPageRef = useRef(0);
  const loadedPagesRef = useRef<Set<number>>(new Set([0]));

  const getPageData = useCallback((page: number): T[] => {
    const start = page * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, pageSize]);

  const loadPage = useCallback((page: number) => {
    if (!loadedPagesRef.current.has(page)) {
      loadedPagesRef.current.add(page);
      
      // 古いページを削除（メモリ節約）
      if (loadedPagesRef.current.size > 5) {
        const oldestPage = Math.min(...loadedPagesRef.current);
        if (oldestPage !== page) {
          loadedPagesRef.current.delete(oldestPage);
        }
      }
    }
  }, []);

  const getCurrentPageData = useCallback((): T[] => {
    return getPageData(currentPageRef.current);
  }, [getPageData]);

  const nextPage = useCallback(() => {
    const maxPage = Math.ceil(data.length / pageSize) - 1;
    if (currentPageRef.current < maxPage) {
      currentPageRef.current++;
      loadPage(currentPageRef.current);
    }
  }, [data.length, pageSize, loadPage]);

  const previousPage = useCallback(() => {
    if (currentPageRef.current > 0) {
      currentPageRef.current--;
      loadPage(currentPageRef.current);
    }
  }, [loadPage]);

  const goToPage = useCallback((page: number) => {
    const maxPage = Math.ceil(data.length / pageSize) - 1;
    if (page >= 0 && page <= maxPage) {
      currentPageRef.current = page;
      loadPage(page);
    }
  }, [data.length, pageSize, loadPage]);

  return {
    currentPage: currentPageRef.current,
    getCurrentPageData,
    nextPage,
    previousPage,
    goToPage,
    totalPages: Math.ceil(data.length / pageSize),
    hasNextPage: currentPageRef.current < Math.ceil(data.length / pageSize) - 1,
    hasPreviousPage: currentPageRef.current > 0
  };
}

// リソース管理フック
export function useResourceManager() {
  const resourcesRef = useRef<Map<string, any>>(new Map());
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const addResource = useCallback((key: string, resource: any, ttl?: number) => {
    resourcesRef.current.set(key, resource);
    
    if (ttl) {
      // TTL後にリソースを自動削除
      const timeout = setTimeout(() => {
        resourcesRef.current.delete(key);
        timeoutsRef.current.delete(key);
      }, ttl);
      
      timeoutsRef.current.set(key, timeout);
    }
  }, []);

  const getResource = useCallback((key: string) => {
    return resourcesRef.current.get(key);
  }, []);

  const removeResource = useCallback((key: string) => {
    resourcesRef.current.delete(key);
    
    const timeout = timeoutsRef.current.get(key);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(key);
    }
  }, []);

  const clearAllResources = useCallback(() => {
    resourcesRef.current.clear();
    
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();
  }, []);

  const getResourceCount = useCallback(() => {
    return resourcesRef.current.size;
  }, []);

  // コンポーネントアンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      clearAllResources();
    };
  }, [clearAllResources]);

  return {
    addResource,
    getResource,
    removeResource,
    clearAllResources,
    getResourceCount
  };
}