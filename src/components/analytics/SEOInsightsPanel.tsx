'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, AlertTriangle, CheckCircle, Clock, TrendingUp, Lightbulb } from 'lucide-react';

interface SearchConsoleData {
  summary: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  byQuery: Array<any>;
  byPage: Array<any>;
  byCountry: Array<any>;
  byDevice: Array<any>;
}

interface SEOAnalysisResult {
  url: string;
  overallScore: number;
  categories: {
    metaTags: { score: number; checks: Array<any> };
    performance: { score: number; checks: Array<any> };
    structuredData: { score: number; checks: Array<any> };
    technical: { score: number; checks: Array<any> };
  };
  topIssues: Array<{
    message: string;
    severity: 'high' | 'medium' | 'low';
    category: string;
  }>;
  actionableInsights: {
    quickWins: Array<any>;
    criticalIssues: Array<any>;
    strategicImprovements: Array<any>;
    summary: {
      totalActionItems: number;
      estimatedImpact: string;
      timeToComplete: string;
    };
  };
  priorityMatrix: {
    highImpactLowEffort: Array<any>;
    highImpactHighEffort: Array<any>;
    lowImpactLowEffort: Array<any>;
    lowImpactHighEffort: Array<any>;
    recommendations: {
      immediate: string;
      shortTerm: string;
      longTerm: string;
      avoid: string;
    };
  };
}

interface SEOInsightsPanelProps {
  data: SearchConsoleData;
}

export default function SEOInsightsPanel({ data }: SEOInsightsPanelProps) {
  const [analysisUrl, setAnalysisUrl] = useState('');
  const [analysis, setAnalysis] = useState<SEOAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'matrix'>('overview');

  // Generate sample query data for demonstration
  const sampleQueryData = [
    { query: 'プロジェクト管理', clicks: 250, impressions: 3500, ctr: 0.071, position: 4.2 },
    { query: 'タスク管理 アプリ', clicks: 180, impressions: 2800, ctr: 0.064, position: 5.1 },
    { query: 'TODO リスト', clicks: 150, impressions: 2200, ctr: 0.068, position: 3.8 },
    { query: '人脈管理', clicks: 120, impressions: 1800, ctr: 0.067, position: 6.2 },
    { query: 'スケジュール管理', clicks: 100, impressions: 1500, ctr: 0.067, position: 7.5 },
  ];

  const handleAnalyze = async () => {
    if (!analysisUrl.trim()) {
      setError('URLを入力してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/analytics/seo-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: analysisUrl }),
      });

      if (!response.ok) {
        throw new Error('SEO分析に失敗しました');
      }

      const result = await response.json();
      setAnalysis(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (num: number) => {
    return (num * 100).toFixed(1) + '%';
  };

  const getPositionColor = (position: number) => {
    if (position <= 3) return 'text-green-600';
    if (position <= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCTRColor = (ctr: number) => {
    if (ctr >= 0.07) return 'text-green-600';
    if (ctr >= 0.05) return 'text-yellow-600';
    return 'text-red-600';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{`検索クエリ: ${label}`}</p>
          <p className="text-sm text-blue-600">{`クリック数: ${data.clicks}`}</p>
          <p className="text-sm text-green-600">{`表示回数: ${data.impressions.toLocaleString()}`}</p>
          <p className="text-sm text-purple-600">{`CTR: ${formatPercentage(data.ctr)}`}</p>
          <p className="text-sm text-orange-600">{`平均順位: ${data.position.toFixed(1)}位`}</p>
        </div>
      );
    }
    return null;
  };

  // Get top insights
  const getInsights = () => {
    const insights = [];
    
    // High CTR queries
    const highCTRQueries = sampleQueryData.filter(q => q.ctr >= 0.07);
    if (highCTRQueries.length > 0) {
      insights.push({
        type: 'success',
        title: '高CTRクエリ',
        message: `${highCTRQueries.length}個のクエリが7%以上のCTRを獲得`,
        icon: '📈'
      });
    }

    // Low position queries with high impressions
    const lowPositionHighImpressions = sampleQueryData.filter(q => q.position > 7 && q.impressions > 1000);
    if (lowPositionHighImpressions.length > 0) {
      insights.push({
        type: 'warning',
        title: '改善機会',
        message: `順位が低いが表示回数の多いクエリが${lowPositionHighImpressions.length}個あります`,
        icon: '⚠️'
      });
    }

    // Top performing queries
    const topQuery = sampleQueryData[0];
    insights.push({
      type: 'info',
      title: 'トップクエリ',
      message: `「${topQuery.query}」が最多の${topQuery.clicks}クリックを獲得`,
      icon: '🏆'
    });

    return insights;
  };

  const insights = getInsights();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Search className="h-5 w-5 mr-2 text-blue-600" />
          SEO インサイト
        </h3>
        <div className="text-sm text-gray-500">
          Search Console データ
        </div>
      </div>

      {/* SEO Analysis Input */}
      <div className="mb-6">
        <div className="flex space-x-3">
          <input
            type="url"
            value={analysisUrl}
            onChange={(e) => setAnalysisUrl(e.target.value)}
            placeholder="分析するURLを入力（例: https://example.com）"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '分析中...' : '分析'}
          </button>
        </div>
        
        {/* Quick Analysis Button for find-to-do.com */}
        <div className="mt-3">
          <button
            onClick={() => {
              setAnalysisUrl('https://find-to-do.com');
              setTimeout(() => handleAnalyze(), 100);
            }}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-md hover:from-green-700 hover:to-blue-700 disabled:opacity-50 text-sm font-medium shadow-md"
          >
            <Search className="h-4 w-4 mr-2" />
            FIND to DO サイト分析
            <span className="ml-2 text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded">
              find-to-do.com
            </span>
          </button>
        </div>
        
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Search Console Summary */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">Search Console概要</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {data.summary.clicks.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">総クリック数</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {data.summary.impressions.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">総表示回数</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {formatPercentage(data.summary.ctr)}
            </div>
            <div className="text-sm text-gray-600">平均CTR</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {data.summary.position.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">平均順位</div>
          </div>
        </div>
      </div>

      {/* SEO Analysis Results */}
      {analysis && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-900">SEO分析結果</h4>
            <div className="flex items-center space-x-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                analysis.overallScore >= 80 ? 'bg-green-100 text-green-800' :
                analysis.overallScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                スコア: {analysis.overallScore}%
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b mb-4">
            <nav className="flex space-x-8">
              {[
                { key: 'overview', label: '概要', icon: TrendingUp },
                { key: 'insights', label: 'アクション項目', icon: Lightbulb },
                { key: 'matrix', label: '優先度マトリックス', icon: CheckCircle }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-4 mb-6">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Category Scores */}
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(analysis.categories).map(([key, category]) => (
                    <div key={key} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          {key === 'metaTags' ? 'メタタグ' :
                           key === 'performance' ? 'パフォーマンス' :
                           key === 'structuredData' ? '構造化データ' :
                           'テクニカル'}
                        </span>
                        <span className={`text-sm font-semibold ${
                          category.score >= 80 ? 'text-green-600' :
                          category.score >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {category.score}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top Issues */}
                {analysis.topIssues.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                      主要な問題
                    </h5>
                    <div className="space-y-2">
                      {analysis.topIssues.slice(0, 3).map((issue, index) => (
                        <div key={index} className={`p-2 rounded text-sm ${
                          issue.severity === 'high' ? 'bg-red-50 text-red-700' :
                          issue.severity === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          <span className="font-medium">{issue.category}:</span> {issue.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">改善サマリー</h5>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600 font-semibold">{analysis.actionableInsights.summary.totalActionItems}</span>
                      <div className="text-blue-700">アクション項目</div>
                    </div>
                    <div>
                      <span className="text-blue-600 font-semibold">{analysis.actionableInsights.summary.estimatedImpact}</span>
                      <div className="text-blue-700">期待される効果</div>
                    </div>
                    <div>
                      <span className="text-blue-600 font-semibold">{analysis.actionableInsights.summary.timeToComplete}</span>
                      <div className="text-blue-700">完了予定時間</div>
                    </div>
                  </div>
                </div>

                {/* Quick Wins */}
                {analysis.actionableInsights.quickWins.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      すぐに実行可能な改善（Quick Wins）
                    </h5>
                    <div className="space-y-2">
                      {analysis.actionableInsights.quickWins.map((item, index) => (
                        <div key={index} className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                          <div className="font-medium text-green-900">{item.title}</div>
                          <div className="text-sm text-green-700 mt-1">{item.description}</div>
                          <div className="text-xs text-green-600 mt-2">
                            期待効果: {item.expectedImpact} | 実装時間: {item.timeToImplement}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Critical Issues */}
                {analysis.actionableInsights.criticalIssues.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-red-700 mb-2 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      緊急対応が必要な問題
                    </h5>
                    <div className="space-y-2">
                      {analysis.actionableInsights.criticalIssues.map((item, index) => (
                        <div key={index} className="bg-red-50 p-3 rounded border-l-4 border-red-400">
                          <div className="font-medium text-red-900">{item.title}</div>
                          <div className="text-sm text-red-700 mt-1">{item.description}</div>
                          <div className="text-xs text-red-600 mt-2">
                            影響: {item.expectedImpact} | 対応時間: {item.timeToImplement}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'matrix' && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  インパクトと工数の組み合わせで改善項目を分類しています。
                </div>
                
                {/* High Impact, Low Effort */}
                {analysis.priorityMatrix.highImpactLowEffort.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-2">🎯 最優先（高インパクト・低工数）</h5>
                    <div className="space-y-2">
                      {analysis.priorityMatrix.highImpactLowEffort.map((item, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-green-700 ml-2">影響度: {item.impact}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* High Impact, High Effort */}
                {analysis.priorityMatrix.highImpactHighEffort.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h5 className="font-medium text-yellow-900 mb-2">📅 計画的実施（高インパクト・高工数）</h5>
                    <div className="space-y-2">
                      {analysis.priorityMatrix.highImpactHighEffort.map((item, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-yellow-700 ml-2">影響度: {item.impact}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">💡 実装推奨順序</h5>
                  <div className="space-y-2 text-sm text-blue-700">
                    <div><span className="font-medium">1. 即座に実施:</span> {analysis.priorityMatrix.recommendations.immediate}</div>
                    <div><span className="font-medium">2. 短期計画:</span> {analysis.priorityMatrix.recommendations.shortTerm}</div>
                    <div><span className="font-medium">3. 長期計画:</span> {analysis.priorityMatrix.recommendations.longTerm}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Query Performance Chart */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-4">検索クエリ別パフォーマンス</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sampleQueryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="query" 
                stroke="#666"
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="clicks" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Queries Table */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-4">トップ検索クエリ</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-600 text-sm">クエリ</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600 text-sm">クリック</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600 text-sm">表示回数</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600 text-sm">CTR</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600 text-sm">順位</th>
              </tr>
            </thead>
            <tbody>
              {sampleQueryData.map((query, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 text-sm text-gray-900 max-w-xs truncate">
                    {query.query}
                  </td>
                  <td className="text-right py-2 px-3 text-sm text-gray-900">
                    {query.clicks}
                  </td>
                  <td className="text-right py-2 px-3 text-sm text-gray-900">
                    {query.impressions.toLocaleString()}
                  </td>
                  <td className={`text-right py-2 px-3 text-sm ${getCTRColor(query.ctr)}`}>
                    {formatPercentage(query.ctr)}
                  </td>
                  <td className={`text-right py-2 px-3 text-sm ${getPositionColor(query.position)}`}>
                    {query.position.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div>
        <h4 className="text-md font-medium text-gray-800 mb-4">インサイト</h4>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${
              insight.type === 'success' ? 'bg-green-50 border border-green-200' :
              insight.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <span className="text-lg">{insight.icon}</span>
              <div className="flex-1">
                <div className={`font-medium text-sm ${
                  insight.type === 'success' ? 'text-green-800' :
                  insight.type === 'warning' ? 'text-yellow-800' :
                  'text-blue-800'
                }`}>
                  {insight.title}
                </div>
                <div className={`text-sm ${
                  insight.type === 'success' ? 'text-green-700' :
                  insight.type === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>
                  {insight.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}