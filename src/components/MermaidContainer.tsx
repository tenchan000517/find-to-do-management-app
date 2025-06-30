'use client';

import { useEffect, useRef, useState } from 'react';

interface MermaidContainerProps {
  chart: string;
  className?: string;
}

/**
 * 独立したMermaidコンテナ
 * 各図表が完全に独立した環境で描画される
 */
export default function MermaidContainer({ chart, className = '' }: MermaidContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [svgContent, setSvgContent] = useState<string>('');
  
  // 各コンテナに固有のIDを生成
  const containerId = useRef(`mermaid-container-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  // Mermaidを描画してSVGを生成
  useEffect(() => {
    if (!chart || !chart.trim()) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const renderMermaid = async () => {
      if (!isMounted) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Mermaidライブラリを動的インポート
        const mermaid = (await import('mermaid')).default;

        // 設定
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose'
        });

        // 一意IDを生成
        const diagramId = `${containerId.current}-diagram-${Date.now()}`;
        
        // SVGを生成
        const { svg } = await mermaid.render(diagramId, chart);
        
        if (isMounted) {
          setSvgContent(svg);
          setIsLoading(false);
        }
        
      } catch (err) {
        if (isMounted) {
          setError(`図表の描画に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setIsLoading(false);
        }
      }
    };

    // 実行
    renderMermaid();

    return () => {
      isMounted = false;
    };
    
  }, [chart]);

  if (error) {
    return (
      <div className={`border border-red-200 rounded-lg p-4 bg-red-50 ${className}`}>
        <p className="text-red-600 text-sm">
          🚫 {error}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`border border-gray-200 rounded-lg p-4 bg-gray-50 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 text-sm">図表を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg p-4 bg-white ${className}`}>
      <div 
        ref={containerRef} 
        className="mermaid-container"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  );
}