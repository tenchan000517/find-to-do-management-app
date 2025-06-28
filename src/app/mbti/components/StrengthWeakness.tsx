'use client';

import React from 'react';
import { UserMBTIProfile, MBTIType, PersonalizedRecommendation } from '@/hooks/useMBTIAnalysis';
import { TrendingUp, AlertTriangle, Lightbulb, CheckCircle } from 'lucide-react';

interface StrengthWeaknessProps {
  userProfile: UserMBTIProfile;
  mbtiType?: MBTIType;
  recommendations: PersonalizedRecommendation[];
}

export default function StrengthWeakness({ userProfile, mbtiType, recommendations }: StrengthWeaknessProps) {
  if (!mbtiType) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">分析データが見つかりません</p>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* 強み */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">強み</h3>
        </div>
        <div className="space-y-2">
          {mbtiType.strengths.map((strength, index) => (
            <div key={index} className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-gray-700">{strength}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 注意点・改善エリア */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">注意点・改善エリア</h3>
        </div>
        <div className="space-y-2">
          {mbtiType.weaknesses.map((weakness, index) => (
            <div key={index} className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-orange-500 mr-2" />
              <span className="text-gray-700">{weakness}</span>
            </div>
          ))}
        </div>
      </div>

      {/* パーソナライズ推奨事項 */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Lightbulb className="w-5 h-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">個人最適化提案</h3>
          </div>
          <div className="space-y-4">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{rec.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(rec.priority)}`}>
                    {rec.priority === 'high' ? '高' : rec.priority === 'medium' ? '中' : '低'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                <div className="text-xs text-gray-500">
                  期待効果: {rec.expectedImpact}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* タスクパフォーマンス履歴 */}
      {userProfile.taskHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">パフォーマンス履歴</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-600">平均品質スコア</p>
              <p className="text-xl font-bold text-blue-900">
                {(userProfile.taskHistory.reduce((sum, task) => sum + task.qualityScore, 0) / userProfile.taskHistory.length).toFixed(1)}/10
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-green-600">完了率</p>
              <p className="text-xl font-bold text-green-900">
                {Math.round((userProfile.taskHistory.filter(task => task.completed).length / userProfile.taskHistory.length) * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}