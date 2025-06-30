'use client';

import { useEffect, useRef, useState } from 'react';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export default function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const renderMermaid = async () => {
      if (!chart || !chart.trim()) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Mermaidライブラリを動的インポート
        const mermaid = (await import('mermaid')).default;

        // 初期化前にリセット
        console.log('Mermaid initialization for:', chart.split('\n')[0]);
        
        // 既存の初期化をリセット
        if (typeof mermaid.initialize === 'function') {
          try {
            // @ts-ignore - reset internal state
            if (mermaid.globalReset) {
              mermaid.globalReset();
            }
          } catch (e) {
            console.log('Mermaid reset not available, proceeding with fresh init');
          }
        }

        // 初期化（最小限・確実動作重視）
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose'
        });

        // 一意のIDを生成（より確実な一意性）
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${Math.floor(Math.random() * 10000)}`;

        // SVGを生成
        console.log('Mermaid rendering chart type:', chart.split('\n')[0]);
        const startTime = Date.now();
        const { svg } = await mermaid.render(id, chart);
        const endTime = Date.now();
        console.log('SVG generated successfully, length:', svg.length, 'time:', endTime - startTime, 'ms');

        // DOM要素に挿入
        console.log('DOM insertion check - containerRef.current:', !!containerRef.current);
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          console.log('SVG inserted into DOM successfully');
        } else {
          console.error('containerRef.current is null - DOM insertion failed');
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Mermaid error:', err);
        setError(`図表の描画に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsLoading(false);
      }
    };

    renderMermaid();
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