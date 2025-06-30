'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export default function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node && mountedRef.current) {
      setContainerElement(node);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      try {
        if (!isMounted) return;
        
        setIsLoading(true);
        setError(null);

        console.log('Starting Mermaid render process...');
        console.log('Chart content:', chart);

        // DOM要素の準備を待つ
        const waitForElement = () => {
          return new Promise<HTMLDivElement>((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 10;
            
            const checkElement = () => {
              if (!isMounted) {
                reject(new Error('Component unmounted'));
                return;
              }
              
              if (ref.current) {
                console.log('DOM element is ready');
                resolve(ref.current);
              } else if (attempts < maxAttempts) {
                attempts++;
                console.log(`Waiting for DOM element... attempt ${attempts}`);
                setTimeout(checkElement, 50);
              } else {
                reject(new Error('DOM element not ready after maximum attempts'));
              }
            };
            
            checkElement();
          });
        };

        // DOM要素が準備できるまで待機
        const element = await waitForElement();
        if (!isMounted) return;

        // Mermaidを動的にインポート
        const mermaid = (await import('mermaid')).default;
        console.log('Mermaid imported successfully');
        
        if (!isMounted) return;

        // Mermaidの設定
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          themeVariables: {
            primaryColor: '#3b82f6',
            primaryTextColor: '#1f2937',
            primaryBorderColor: '#2563eb',
            lineColor: '#6b7280',
            secondaryColor: '#f3f4f6',
            tertiaryColor: '#ffffff',
            background: '#ffffff',
            mainBkg: '#ffffff',
            secondBkg: '#f9fafb',
            tertiaryBkg: '#f3f4f6',
          }
        });
        console.log('Mermaid initialized');

        if (!isMounted) return;

        // 既存のコンテンツをクリア
        element.innerHTML = '';
        
        // 一意のIDを生成
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        console.log('Generated ID:', id);
        
        // Mermaid図を描画
        console.log('Calling mermaid.render...');
        const result = await mermaid.render(id, chart);
        console.log('Mermaid render result:', result);
        
        if (!isMounted) return;
        
        if (result && result.svg) {
          // 再度DOM要素が存在することを確認
          if (ref.current && isMounted) {
            ref.current.innerHTML = result.svg;
            console.log('SVG inserted into DOM');
            
            // SVGのスタイルを調整
            const svgElement = ref.current.querySelector('svg');
            if (svgElement) {
              svgElement.style.maxWidth = '100%';
              svgElement.style.height = 'auto';
              svgElement.style.display = 'block';
              svgElement.style.margin = '0 auto';
              console.log('SVG styles applied');
            } else {
              console.warn('SVG element not found in rendered content');
            }
          } else {
            console.error('ref.current became null during rendering or component unmounted');
          }
        } else {
          throw new Error('Mermaid render returned no SVG content');
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        if (isMounted) {
          setError(`図表の描画に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (chart && chart.trim()) {
      renderChart();
    } else {
      console.warn('Chart is empty or undefined');
      setIsLoading(false);
    }

    // クリーンアップ関数
    return () => {
      isMounted = false;
      console.log('MermaidDiagram effect cleanup');
    };
  }, [chart]);

  if (error) {
    return (
      <div className={`border border-red-200 rounded-lg p-4 bg-red-50 ${className}`}>
        <div className="flex items-center space-x-2 text-red-600 mb-2">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">図表エラー</span>
        </div>
        <p className="text-red-700 text-sm">{error}</p>
        <details className="mt-2">
          <summary className="text-red-600 text-sm cursor-pointer hover:text-red-800">
            図表のコードを表示
          </summary>
          <pre className="mt-2 text-xs bg-red-100 p-2 rounded border overflow-x-auto">
            <code>{chart}</code>
          </pre>
        </details>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`border border-gray-200 rounded-lg p-8 bg-gray-50 ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">図表を読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg p-4 bg-white overflow-hidden ${className}`}>
      <div ref={ref} className="mermaid-container" />
      {/* デバッグ情報 */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-2 text-xs text-gray-500">
          <summary className="cursor-pointer">デバッグ情報</summary>
          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
            <code>Chart: {chart.substring(0, 200)}...</code>
          </pre>
        </details>
      )}
    </div>
  );
}