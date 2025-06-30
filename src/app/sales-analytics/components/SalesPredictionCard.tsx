"use client";

import { useMemo } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface SalesPrediction {
  id: string;
  appointmentId: string;
  appointmentTitle: string;
  probability: number;
  confidence: number;
  factors: Array<{
    name: string;
    impact: number;
    description: string;
  }>;
  lastUpdated: string;
}

interface SalesPredictionCardProps {
  predictions: SalesPrediction[];
  isLoading?: boolean;
}

const SalesPredictionCard: React.FC<SalesPredictionCardProps> = ({ 
  predictions = [], 
  isLoading = false 
}) => {
  const topPredictions = useMemo(() => {
    return predictions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);
  }, [predictions]);

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return { text: 'text-green-600', bg: 'bg-green-500', border: 'border-green-500' };
    if (probability >= 60) return { text: 'text-yellow-600', bg: 'bg-yellow-500', border: 'border-yellow-500' };
    return { text: 'text-red-600', bg: 'bg-red-500', border: 'border-red-500' };
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">🎯 成約確率予測</h3>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🎯 成約確率予測</h3>
        <span className="text-sm text-gray-500">
          上位{Math.min(topPredictions.length, 5)}件
        </span>
      </div>

      {topPredictions.length > 0 ? (
        <div className="space-y-4">
          {topPredictions.map((prediction) => {
            const colors = getProbabilityColor(prediction.probability);
            
            return (
              <div key={prediction.id} className={`border-l-4 ${colors.border} pl-4 py-3`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {prediction.appointmentTitle}
                    </h4>
                    
                    {/* 成約確率バー */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">成約確率</span>
                        <span className={`text-lg font-bold ${colors.text}`}>
                          {prediction.probability}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${colors.bg}`}
                          style={{ width: `${prediction.probability}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* 主要成功要因 */}
                    {prediction.factors && prediction.factors.length > 0 && (
                      <div className="mt-3">
                        <span className="text-xs font-medium text-gray-700">主要要因:</span>
                        <div className="mt-1 space-y-1">
                          {prediction.factors.slice(0, 2).map((factor, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-xs text-gray-600 truncate">
                                {factor.name}
                              </span>
                              <div className="flex items-center ml-2">
                                <div className="w-12 bg-gray-200 rounded-full h-1 mr-1">
                                  <div 
                                    className={`h-1 rounded-full ${
                                      factor.impact >= 0.7 ? 'bg-green-500' :
                                      factor.impact >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${factor.impact * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500 w-8">
                                  {Math.round(factor.impact * 100)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* メタ情報 */}
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>信頼度: {prediction.confidence}%</span>
                      <span>
                        更新: {new Date(prediction.lastUpdated).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-500">
            成約確率予測データがありません
          </p>
          <p className="text-sm text-gray-400 mt-2">
            アポイントメントが作成されると予測が表示されます
          </p>
        </div>
      )}

      {/* 全体統計 */}
      {predictions.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">
                {predictions.length}
              </div>
              <div className="text-xs text-gray-500">総件数</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {predictions.filter(p => p.probability >= 80).length}
              </div>
              <div className="text-xs text-gray-500">高確率</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {Math.round(
                  predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length
                )}%
              </div>
              <div className="text-xs text-gray-500">平均確率</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPredictionCard;