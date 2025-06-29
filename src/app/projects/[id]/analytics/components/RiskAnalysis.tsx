"use client";

import React from 'react';

interface RiskAnalysisProps {
  analytics?: any;
  isLoading?: boolean;
}

export default function RiskAnalysis({ analytics, isLoading }: RiskAnalysisProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const risks = analytics?.risks || [];
  const riskLevel = analytics?.overallRiskLevel || 'MEDIUM';

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="mr-2">⚠️</span>
        リスク分析
      </h3>
      
      <div className="mb-4">
        <div className={`p-3 rounded-lg border ${getRiskColor(riskLevel)}`}>
          <div className="font-semibold">総合リスクレベル: {riskLevel}</div>
        </div>
      </div>

      <div className="space-y-3">
        {risks.length > 0 ? (
          risks.map((risk: any, index: number) => (
            <div key={index} className={`p-3 rounded border ${getRiskColor(risk.level)}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium">{risk.type}</div>
                <span className="text-xs px-2 py-1 rounded bg-white">
                  影響度: {risk.impact}%
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-2">{risk.description}</div>
              {risk.mitigation && (
                <div className="text-sm">
                  <span className="font-medium">対策: </span>
                  {risk.mitigation}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">✅</div>
            <div>現在、特定されたリスクはありません</div>
          </div>
        )}
      </div>
    </div>
  );
}