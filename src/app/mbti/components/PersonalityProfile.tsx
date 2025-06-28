'use client';

import React from 'react';
import { UserMBTIProfile, MBTIType } from '@/hooks/useMBTIAnalysis';
import { User, Brain, Target, TrendingUp } from 'lucide-react';

interface PersonalityProfileProps {
  userProfile: UserMBTIProfile;
  mbtiType?: MBTIType;
}

export default function PersonalityProfile({ userProfile, mbtiType }: PersonalityProfileProps) {
  if (!mbtiType) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">MBTIタイプデータが見つかりません</p>
        </div>
      </div>
    );
  }

  const getDimensionLabel = (dimension: string, value: number) => {
    const labels = {
      extraversion: value === 1 ? '外向性 (E)' : '内向性 (I)',
      sensing: value === 1 ? '感覚 (S)' : '直感 (N)',
      thinking: value === 1 ? '思考 (T)' : '感情 (F)',
      judging: value === 1 ? '判断 (J)' : '知覚 (P)'
    };
    return labels[dimension as keyof typeof labels];
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <User className="w-6 h-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">性格プロファイル</h2>
      </div>

      {/* MBTI基本情報 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-blue-600">{userProfile.mbtiType}</h3>
            <p className="text-lg text-gray-700">{mbtiType.name}</p>
            <p className="text-sm text-gray-500">{mbtiType.category}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">診断信頼度</p>
            <p className="text-xl font-semibold text-green-600">{userProfile.confidence}%</p>
          </div>
        </div>

        {/* 次元表示 */}
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(mbtiType.dimensions).map(([dimension, value]) => (
            <div key={dimension} className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900">
                {getDimensionLabel(dimension, value)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* コア特性レーダーチャート風表示 */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-900 mb-3">コア特性</h4>
        <div className="space-y-3">
          {Object.entries(mbtiType.core_traits).map(([trait, score]) => (
            <div key={trait} className="flex items-center">
              <div className="w-24 text-sm text-gray-600 capitalize">
                {trait.replace('_', ' ')}
              </div>
              <div className="flex-1 mx-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${score * 10}%` }}
                  />
                </div>
              </div>
              <div className="w-8 text-sm font-medium text-gray-900">
                {score}/10
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 最適な役割 */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Target className="w-4 h-4 mr-2" />
          最適な役割
        </h4>
        <div className="flex flex-wrap gap-2">
          {mbtiType.optimal_roles.map((role, index) => (
            <span 
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
            >
              {role}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}