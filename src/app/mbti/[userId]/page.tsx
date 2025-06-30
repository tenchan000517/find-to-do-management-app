'use client';

import React from 'react';
import { useMBTIAnalysis } from '@/hooks/useMBTIAnalysis';
import PersonalityProfile from '../components/PersonalityProfile';
import StrengthWeakness from '../components/StrengthWeakness';
import LoadingSpinner from '@/components/LoadingSpinner';

interface MBTIUserPageProps {
  params: Promise<{ userId: string }>;
}

export default function MBTIUserPage({ params }: MBTIUserPageProps) {
  const [userId, setUserId] = React.useState<string>('');
  
  React.useEffect(() => {
    params.then(resolvedParams => {
      setUserId(resolvedParams.userId);
    });
  }, [params]);
  
  const {
    selectedUserProfile,
    selectedUserMBTI,
    recommendations,
    performancePredictions,
    loading,
    error,
    setSelectedUserId
  } = useMBTIAnalysis();

  React.useEffect(() => {
    if (userId) {
      setSelectedUserId(userId);
    }
  }, [userId, setSelectedUserId]);

  if (!userId) {
    return <LoadingSpinner />;
  }

  if (loading) {
    return <LoadingSpinner message="MBTI分析データを読み込み中..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!selectedUserProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <div className="text-gray-400 text-4xl mb-4">👤</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">ユーザーが見つかりません</h2>
          <p className="text-gray-600">指定されたユーザーのMBTIプロファイルが存在しません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {selectedUserProfile.userName} の MBTI分析
          </h1>
          <p className="text-gray-600 mt-2">
            個人の性格特性に基づく最適化提案
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PersonalityProfile 
            userProfile={selectedUserProfile}
            mbtiType={selectedUserMBTI || undefined}
          />
          
          <StrengthWeakness 
            userProfile={selectedUserProfile}
            mbtiType={selectedUserMBTI || undefined}
            recommendations={recommendations}
          />
        </div>

        {/* パフォーマンス予測セクション */}
        {performancePredictions.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">パフォーマンス予測</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {performancePredictions.map((prediction, index) => (
                <div key={index} className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900">{prediction.taskType}</h4>
                  <p className="text-2xl font-bold text-blue-600">{prediction.predictedSuccess}%</p>
                  <p className="text-sm text-blue-700">成功率予測</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}