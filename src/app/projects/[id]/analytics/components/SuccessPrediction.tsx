"use client";

import { LoadingSpinner } from '@/components/LoadingSpinner';

interface ProjectSuccessFactor {
  factor: string;
  impact: number;
  current: number;
  optimal: number;
  actionable: boolean;
}

interface ProjectAnalytics {
  projectId: string;
  successProbability: number;
  confidenceLevel: number;
  successFactors: ProjectSuccessFactor[];
  lastUpdated: string;
}

interface ProjectHealth {
  score: number;
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

interface SuccessPredictionProps {
  projectId: string;
  analytics: ProjectAnalytics | null;
  projectHealth: ProjectHealth | null;
  isLoading?: boolean;
}

const SuccessPrediction: React.FC<SuccessPredictionProps> = ({
  projectId,
  analytics,
  projectHealth,
  isLoading = false
}) => {
  const getSuccessColor = (probability: number) => {
    if (probability >= 0.8) return { 
      bg: 'bg-green-100', 
      text: 'text-green-800', 
      border: 'border-green-500',
      icon: '🎯',
      label: '高確率'
    };
    if (probability >= 0.6) return { 
      bg: 'bg-yellow-100', 
      text: 'text-yellow-800', 
      border: 'border-yellow-500',
      icon: '⚠️',
      label: '中確率'
    };
    return { 
      bg: 'bg-red-100', 
      text: 'text-red-800', 
      border: 'border-red-500',
      icon: '🚨',
      label: '低確率'
    };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'IMPROVING': return '📈';
      case 'STABLE': return '➡️';
      case 'DECLINING': return '📉';
      default: return '📊';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'IMPROVING': return 'text-green-600';
      case 'STABLE': return 'text-blue-600';
      case 'DECLINING': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">📊 プロジェクト成功予測</h3>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">📊 プロジェクト成功予測</h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-500">分析データがまだ生成されていません</p>
          <p className="text-sm text-gray-400 mt-2">
            プロジェクトデータが蓄積されると予測が表示されます
          </p>
        </div>
      </div>
    );
  }

  const successProbability = analytics.successProbability * 100; // 0-1 to 0-100
  const confidenceLevel = analytics.confidenceLevel * 100;
  const colors = getSuccessColor(analytics.successProbability);

  return (
    <div className={`${colors.bg} ${colors.border} border-l-4 p-6 rounded-lg shadow-md`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{colors.icon}</span>
            <h3 className={`text-xl font-semibold ${colors.text}`}>
              プロジェクト成功予測
            </h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            AI分析による成功確率評価
          </p>
        </div>
        
        <div className="text-right">
          <div className={`text-5xl font-bold ${colors.text}`}>
            {Math.round(successProbability)}%
          </div>
          <div className="text-sm text-gray-500">
            成功確率
          </div>
          <div className={`text-xs px-2 py-1 rounded mt-1 ${colors.bg} ${colors.text}`}>
            {colors.label}
          </div>
        </div>
      </div>

      {/* メトリクス行 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(confidenceLevel)}%
              </div>
              <div className="text-sm text-gray-600">AI信頼度</div>
            </div>
            <div className="text-2xl">🤖</div>
          </div>
        </div>

        {projectHealth && (
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(projectHealth.score * 100)}%
                </div>
                <div className="text-sm text-gray-600">健全性スコア</div>
              </div>
              <div className="text-2xl">💪</div>
            </div>
          </div>
        )}

        {projectHealth && (
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-lg font-bold ${getTrendColor(projectHealth.trend)}`}>
                  {projectHealth.trend === 'IMPROVING' ? '改善中' :
                   projectHealth.trend === 'STABLE' ? '安定' : '悪化中'}
                </div>
                <div className="text-sm text-gray-600">トレンド</div>
              </div>
              <div className="text-2xl">{getTrendIcon(projectHealth.trend)}</div>
            </div>
          </div>
        )}
      </div>

      {/* 成功要因プレビュー */}
      {analytics.successFactors && analytics.successFactors.length > 0 && (
        <div className="bg-white p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-3">主要成功要因 (上位3つ)</h4>
          <div className="space-y-3">
            {analytics.successFactors
              .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
              .slice(0, 3)
              .map((factor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className="text-sm text-gray-700">{factor.factor}</span>
                    {factor.actionable && (
                      <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        改善可能
                      </span>
                    )}
                  </div>
                  <div className="flex items-center ml-4">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className={`h-2 rounded-full ${
                          factor.impact >= 7 ? 'bg-green-500' :
                          factor.impact >= 4 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(Math.abs(factor.impact) * 10, 100)}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium w-12 text-right ${
                      factor.impact > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {factor.impact > 0 ? '+' : ''}{factor.impact}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 成功確率の解釈 */}
      <div className="mt-6 p-4 bg-white rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">📖 AI分析結果の解釈</h4>
        <div className="text-sm text-gray-600">
          {successProbability >= 80 && (
            <p>
              🎉 このプロジェクトは<strong className="text-green-600">非常に高い成功確率</strong>を示しています。
              現在の計画とリソース配分で目標達成が期待できます。
            </p>
          )}
          {successProbability >= 60 && successProbability < 80 && (
            <p>
              ⚡ このプロジェクトは<strong className="text-yellow-600">中程度の成功確率</strong>を示しています。
              いくつかの改善により成功確率を向上させることができます。
            </p>
          )}
          {successProbability < 60 && (
            <p>
              🔧 このプロジェクトは<strong className="text-red-600">改善が必要</strong>な状況です。
              リスク要因を特定し、積極的な対策を講じることを強く推奨します。
            </p>
          )}
        </div>
      </div>

      {/* メタ情報 */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <div>
          予測モデル: AI-ProjectSuccess-v3.2 | プロジェクトID: {projectId}
        </div>
        <div>
          最終分析: {new Date(analytics.lastUpdated).toLocaleString('ja-JP')}
        </div>
      </div>
    </div>
  );
};

export default SuccessPrediction;