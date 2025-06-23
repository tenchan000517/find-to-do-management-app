'use client';

interface PagePerformanceTableProps {
  topPages: Array<any>;
  ga4Pages: Array<any>;
  searchConsolePages: Array<any>;
}

export default function PagePerformanceTable({ 
  topPages, 
  ga4Pages, 
  searchConsolePages 
}: PagePerformanceTableProps) {
  // Always use real data, no fallback
  const displayPages = topPages?.map((page: any) => ({
    page: page.url,
    title: page.url === '/' ? 'ホームページ' : page.url.replace(/^\//, '').replace(/\//g, ' / '),
    sessions: page.ga4?.sessions || 0,
    pageViews: page.ga4?.pageViews || 0,
    bounceRate: page.ga4?.bounceRate || 0,
    avgSessionDuration: page.ga4?.avgSessionDuration || 0,
    clicks: page.searchConsole?.clicks || 0,
    impressions: page.searchConsole?.impressions || 0,
    ctr: page.searchConsole?.ctr || 0,
    position: page.searchConsole?.position || 0
  })) || [];

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (num: number) => {
    return (num * 100).toFixed(1) + '%';
  };

  const getPerformanceColor = (value: number, type: 'ctr' | 'bounceRate' | 'position') => {
    switch (type) {
      case 'ctr':
        if (value >= 0.07) return 'text-green-600';
        if (value >= 0.05) return 'text-yellow-600';
        return 'text-red-600';
      case 'bounceRate':
        if (value <= 0.3) return 'text-green-600';
        if (value <= 0.5) return 'text-yellow-600';
        return 'text-red-600';
      case 'position':
        if (value <= 3) return 'text-green-600';
        if (value <= 7) return 'text-yellow-600';
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">ページパフォーマンス</h3>
        <div className="text-sm text-gray-500">
          GA4 + Search Console統合データ
        </div>
      </div>

      {displayPages.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">ページ</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">セッション</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">PV</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">直帰率</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">滞在時間</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">クリック</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">表示回数</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">CTR</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">平均順位</th>
              </tr>
            </thead>
            <tbody>
              {displayPages.map((page, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900 truncate max-w-xs">
                        {page.title}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {page.page}
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900">
                    {page.sessions.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900">
                    {page.pageViews.toLocaleString()}
                  </td>
                  <td className={`text-right py-3 px-4 ${getPerformanceColor(page.bounceRate, 'bounceRate')}`}>
                    {formatPercentage(page.bounceRate)}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900">
                    {formatDuration(page.avgSessionDuration)}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900">
                    {page.clicks.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-900">
                    {page.impressions.toLocaleString()}
                  </td>
                  <td className={`text-right py-3 px-4 ${getPerformanceColor(page.ctr, 'ctr')}`}>
                    {formatPercentage(page.ctr)}
                  </td>
                  <td className={`text-right py-3 px-4 ${getPerformanceColor(page.position, 'position')}`}>
                    {page.position.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="text-gray-400 text-lg mb-2">📊</div>
          <p className="text-gray-500">まだデータがありません</p>
          <p className="text-gray-400 text-sm mt-1">トラフィックデータが蓄積されるまでお待ちください</p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <div>
          {displayPages.length}ページ表示中
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span>良好</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
            <span>要注意</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            <span>改善必要</span>
          </div>
        </div>
      </div>
    </div>
  );
}