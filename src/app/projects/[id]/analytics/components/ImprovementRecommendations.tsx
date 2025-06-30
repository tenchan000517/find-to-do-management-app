"use client";

import React from 'react';
import { Button } from '@/components/ui/Button';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: string;
  effort: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  expectedImprovement: number;
}

interface ImprovementRecommendationsProps {
  recommendations: Recommendation[];
  onApply: (recommendationId: string) => Promise<void>;
  isLoading?: boolean;
}

export default function ImprovementRecommendations({ 
  recommendations, 
  onApply, 
  isLoading 
}: ImprovementRecommendationsProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="mr-2">💡</span>
        改善提案
      </h3>
      
      {recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((recommendation) => (
            <div key={recommendation.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(recommendation.priority)}`}>
                      {recommendation.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{recommendation.description}</p>
                  <div className="text-xs text-gray-500">
                    カテゴリ: {recommendation.category}
                  </div>
                </div>
                <Button
                  onClick={() => onApply(recommendation.id)}
                  size="sm"
                  variant="outline"
                  disabled={isLoading}
                >
                  適用
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="font-semibold text-blue-600">{recommendation.impact}</div>
                  <div className="text-gray-500">影響度</div>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded">
                  <div className="font-semibold text-purple-600">{recommendation.effort}</div>
                  <div className="text-gray-500">工数</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="font-semibold text-green-600">+{recommendation.expectedImprovement}%</div>
                  <div className="text-gray-500">期待効果</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🎯</div>
          <div>現在、推奨される改善提案はありません</div>
          <div className="text-sm mt-2">プロジェクトは順調に進行しています</div>
        </div>
      )}
    </div>
  );
}