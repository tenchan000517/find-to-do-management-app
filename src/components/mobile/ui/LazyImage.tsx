"use client";
import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  src: string;
  alt: string;
  placeholder?: string; // プレースホルダー画像
  blurDataURL?: string; // ぼかし用のbase64データURL
  threshold?: number; // Intersection Observer の閾値
  fallback?: React.ReactNode; // 読み込み失敗時のフォールバック
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  quality?: number; // 画質設定（1-100）
  priority?: boolean; // 優先読み込み
}

export default function LazyImage({
  src,
  alt,
  placeholder = '/images/placeholder.jpg',
  blurDataURL,
  threshold = 0.1,
  fallback,
  onLoad,
  onError,
  quality = 75,
  priority = false,
  className = '',
  style,
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (priority) {
      // 優先読み込みの場合はすぐに画像を読み込む
      loadImage();
      return;
    }

    // Intersection Observer を設定
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      { threshold }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, priority]);

  useEffect(() => {
    if (isInView && !isLoaded && !isError) {
      loadImage();
    }
  }, [isInView, isLoaded, isError]);

  const loadImage = () => {
    const img = new Image();
    
    img.onload = (event) => {
      setImageSrc(optimizeImageUrl(src, quality));
      setIsLoaded(true);
      onLoad?.(event as any);
    };
    
    img.onerror = (event) => {
      setIsError(true);
      onError?.(event as any);
    };
    
    img.src = optimizeImageUrl(src, quality);
  };

  const optimizeImageUrl = (url: string, quality: number): string => {
    // 画像最適化のロジック（Next.js Image最適化を模倣）
    const urlObj = new URL(url, window.location.origin);
    
    // 画質パラメータを追加
    urlObj.searchParams.set('q', quality.toString());
    
    // デバイスの解像度に基づいてサイズを調整
    const devicePixelRatio = window.devicePixelRatio || 1;
    if (devicePixelRatio > 1) {
      urlObj.searchParams.set('dpr', devicePixelRatio.toString());
    }
    
    // WebP対応チェック
    if (supportsWebP()) {
      urlObj.searchParams.set('format', 'webp');
    }
    
    return urlObj.toString();
  };

  const supportsWebP = (): boolean => {
    // WebP対応チェック
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);
    onLoad?.(event);
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsError(true);
    onError?.(event);
  };

  if (isError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className={`lazy-image-container ${className}`} style={style}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`
          transition-opacity duration-300
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
          ${blurDataURL && !isLoaded ? 'blur-sm' : ''}
        `}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading={priority ? "eager" : "lazy"}
        {...props}
      />
      
      {/* ブラーエフェクトのためのプレースホルダー */}
      {blurDataURL && !isLoaded && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm"
          aria-hidden="true"
        />
      )}
      
      {/* ローディングスピナー */}
      {!isLoaded && !isError && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {/* エラー表示 */}
      {isError && !fallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <div className="text-center">
            <div className="text-2xl mb-2">📷</div>
            <div className="text-sm">画像を読み込めませんでした</div>
          </div>
        </div>
      )}
    </div>
  );
}

// 複数画像の遅延読み込み管理
export class LazyImageManager {
  private static instance: LazyImageManager;
  private imageCache = new Map<string, string>();
  private loadingQueue: string[] = [];
  private maxConcurrentLoads = 3;
  private currentLoads = 0;

  static getInstance(): LazyImageManager {
    if (!LazyImageManager.instance) {
      LazyImageManager.instance = new LazyImageManager();
    }
    return LazyImageManager.instance;
  }

  async preloadImage(src: string, quality = 75): Promise<string> {
    // キャッシュチェック
    const cacheKey = `${src}_${quality}`;
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }

    // 既に読み込み中の場合は待機
    if (this.loadingQueue.includes(cacheKey)) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.imageCache.has(cacheKey)) {
            clearInterval(checkInterval);
            resolve(this.imageCache.get(cacheKey)!);
          }
        }, 100);
      });
    }

    // 同時読み込み数の制限
    if (this.currentLoads >= this.maxConcurrentLoads) {
      return new Promise((resolve) => {
        this.loadingQueue.push(cacheKey);
        const checkInterval = setInterval(() => {
          if (this.currentLoads < this.maxConcurrentLoads) {
            clearInterval(checkInterval);
            this.loadImage(src, quality, cacheKey).then(resolve);
          }
        }, 100);
      });
    }

    return this.loadImage(src, quality, cacheKey);
  }

  private async loadImage(src: string, quality: number, cacheKey: string): Promise<string> {
    this.currentLoads++;
    
    try {
      const optimizedSrc = this.optimizeImageUrl(src, quality);
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          this.imageCache.set(cacheKey, optimizedSrc);
          this.currentLoads--;
          this.processQueue();
          resolve(optimizedSrc);
        };
        
        img.onerror = () => {
          this.currentLoads--;
          this.processQueue();
          reject(new Error(`Failed to load image: ${src}`));
        };
        
        img.src = optimizedSrc;
      });
    } catch (error) {
      this.currentLoads--;
      this.processQueue();
      throw error;
    }
  }

  private processQueue(): void {
    if (this.loadingQueue.length > 0 && this.currentLoads < this.maxConcurrentLoads) {
      const nextCacheKey = this.loadingQueue.shift()!;
      const [src, quality] = nextCacheKey.split('_');
      this.loadImage(src, parseInt(quality), nextCacheKey);
    }
  }

  private optimizeImageUrl(url: string, quality: number): string {
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.set('q', quality.toString());
    
    const devicePixelRatio = window.devicePixelRatio || 1;
    if (devicePixelRatio > 1) {
      urlObj.searchParams.set('dpr', devicePixelRatio.toString());
    }
    
    return urlObj.toString();
  }

  clearCache(): void {
    this.imageCache.clear();
  }

  getCacheSize(): number {
    return this.imageCache.size;
  }
}