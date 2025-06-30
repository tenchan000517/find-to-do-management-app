'use client';

import { useEffect, useRef, useState } from 'react';
import { mermaidRenderQueue } from '@/utils/mermaidQueue';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export default function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chart || !chart.trim()) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // キューを使用してレンダリングを順次実行
    const renderMermaid = async () => {
      try {
        if (!isMounted) return;
        
        setIsLoading(true);
        setError(null);

        await mermaidRenderQueue.enqueue(async () => {
          // コンポーネントがアンマウントされていないかチェック
          if (!isMounted) return;

          // Mermaidライブラリを動的インポート
          const mermaid = (await import('mermaid')).default;

          // 初期化（シンプルな設定）
          mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose'
          });

          // 一意のIDを生成
          const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

          // SVGを生成
          const { svg } = await mermaid.render(id, chart);

          // DOM要素への挿入（安全チェック付き）
          if (!isMounted || !containerRef.current) {
            return; // コンポーネントがアンマウントされた場合は何もしない
          }
          
          containerRef.current.innerHTML = svg;
        });
        
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        if (isMounted) {
          setError(`図表の描画に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setIsLoading(false);
        }
      }
    };

    renderMermaid();

    // クリーンアップ関数
    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className={`border border-red-200 rounded-lg p-4 bg-red-50 ${className}`}>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`border border-gray-200 rounded-lg p-4 bg-gray-50 ${className}`}>
        <p className="text-gray-600">図表を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg p-4 bg-white ${className}`}>
      <div ref={containerRef} className="mermaid-container" />
    </div>
  );
}