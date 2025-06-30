'use client';

import React, { useState } from 'react';
import { useMBTIAnalysis } from '@/hooks/useMBTIAnalysis';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Users, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

export default function MBTITeamPage() {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  const {
    userProfiles,
    teamCompatibility,
    loading,
    error,
    fetchTeamCompatibility,
    calculateTypeCompatibility
  } = useMBTIAnalysis();

  const handleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAnalyzeTeam = async () => {
    if (selectedUserIds.length >= 2) {
      await fetchTeamCompatibility(selectedUserIds);
    }
  };

  if (loading) {
    return <LoadingSpinner message="チーム分析データを読み込み中..." />;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-lg md:text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            チーム相性分析
          </h1>
          <p className="text-gray-600 mt-2">
            MBTIタイプに基づくチームメンバー間の相性と最適化提案
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ユーザー選択パネル */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                チームメンバー選択
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                分析したいメンバーを2名以上選択してください
              </p>
              
              <div className="space-y-3 mb-6">
                {userProfiles.map((profile) => (
                  <label key={profile.userId} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(profile.userId)}
                      onChange={() => handleUserSelection(profile.userId)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{profile.userName}</p>
                      <p className="text-sm text-gray-500">{profile.mbtiType}</p>
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={handleAnalyzeTeam}
                disabled={selectedUserIds.length < 2}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                チーム分析実行
              </button>
            </div>
          </div>

          {/* 分析結果パネル */}
          <div className="lg:col-span-2">
            {!teamCompatibility ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">チームメンバーを選択して分析を開始してください</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 総合相性スコア */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    総合相性スコア
                  </h3>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {teamCompatibility.compatibilityScore}%
                    </div>
                    <p className="text-gray-600">
                      {teamCompatibility.compatibilityScore >= 80 ? '非常に良好' :
                       teamCompatibility.compatibilityScore >= 60 ? '良好' :
                       teamCompatibility.compatibilityScore >= 40 ? '普通' : '要注意'}
                    </p>
                  </div>
                </div>

                {/* 強み・リスクエリア */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center mb-4">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <h4 className="font-semibold text-gray-900">強みエリア</h4>
                    </div>
                    <ul className="space-y-2">
                      {teamCompatibility.strengthAreas.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center mb-4">
                      <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                      <h4 className="font-semibold text-gray-900">注意エリア</h4>
                    </div>
                    <ul className="space-y-2">
                      {teamCompatibility.riskAreas.map((risk, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 推奨事項 */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">推奨事項</h4>
                  <div className="space-y-3">
                    {teamCompatibility.recommendations.map((rec, index) => (
                      <div key={index} className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-blue-800">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}