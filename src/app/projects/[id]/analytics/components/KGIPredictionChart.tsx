"use client";

import React from 'react';

interface KGIPredictionChartProps {
  projectId: string;
  kgiData?: any;
  isLoading?: boolean;
}

export default function KGIPredictionChart({ projectId, kgiData, isLoading }: KGIPredictionChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="mr-2">📈</span>
        KGI達成予測
      </h3>
      
      <div className="space-y-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {kgiData?.achievementProbability ? `${Math.round(kgiData.achievementProbability * 100)}%` : '計算中...'}
          </div>
          <div className="text-sm text-gray-600">KGI達成確率</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="font-semibold text-gray-700">
              {kgiData?.expectedDate || '未算出'}
            </div>
            <div className="text-gray-500">予想達成日</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="font-semibold text-gray-700">
              {kgiData?.confidence ? `${Math.round(kgiData.confidence * 100)}%` : '未算出'}
            </div>
            <div className="text-gray-500">予測信頼度</div>
          </div>
        </div>
      </div>
    </div>
  );
}