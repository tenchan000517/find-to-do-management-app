# 📋 Phase 2 残タスク完全引き継ぎ書

**作成日**: 2025年6月28日  
**対象**: 次世代エンジニア  
**目的**: Phase 2 残り30%の確実な完了  
**現在の進捗**: 70%完了 → **100%完了を目指す**

---

## 🎯 **残り実装タスク一覧**

### ✅ **完了済み (70%)**
1. プロジェクトテンプレート機能 - 100%完了
2. 財務リスク監視システム - UIフック実装完了
3. MBTI個人最適化システム - フック実装完了

### ❌ **残り実装必須タスク (30%)**

#### **1. MBTI個人分析UIコンポーネント実装**
#### **2. 財務リスク監視API実装**  
#### **3. MBTI最適化API実装**

---

## 🚀 **タスク1: MBTI個人分析UIコンポーネント実装**

### **1.1 個人分析ページ作成**

**ファイル**: `/src/app/mbti/[userId]/page.tsx`

```typescript
'use client';

import React from 'react';
import { useMBTIAnalysis } from '@/hooks/useMBTIAnalysis';
import PersonalityProfile from '../components/PersonalityProfile';
import StrengthWeakness from '../components/StrengthWeakness';
import LoadingSpinner from '@/components/LoadingSpinner';

interface MBTIUserPageProps {
  params: { userId: string };
}

export default function MBTIUserPage({ params }: MBTIUserPageProps) {
  const { userId } = params;
  
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
    setSelectedUserId(userId);
  }, [userId, setSelectedUserId]);

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
            mbtiType={selectedUserMBTI}
          />
          
          <StrengthWeakness 
            userProfile={selectedUserProfile}
            mbtiType={selectedUserMBTI}
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
```

### **1.2 PersonalityProfile コンポーネント作成**

**ファイル**: `/src/app/mbti/components/PersonalityProfile.tsx`

```typescript
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
```

### **1.3 StrengthWeakness コンポーネント作成**

**ファイル**: `/src/app/mbti/components/StrengthWeakness.tsx`

```typescript
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
```

### **1.4 チーム相性分析ページ作成**

**ファイル**: `/src/app/mbti/team/page.tsx`

```typescript
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
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
```

---

## 🚀 **タスク2: 財務リスク監視API実装**

### **2.1 顧客データAPI**

**ファイル**: `/src/app/api/financial-risk/customers/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // connectionsテーブルから顧客データを取得（既存テーブル活用）
    const connections = await prisma.connections.findMany({
      include: {
        appointments: {
          include: {
            contract: true
          }
        }
      }
    });

    if (connections.length === 0) {
      return NextResponse.json({ 
        customers: [], 
        message: "顧客データがありません" 
      });
    }

    // 顧客データにリスクスコアとセグメントを計算して追加
    const customersWithRisk = connections.map(connection => {
      const riskScore = calculateRiskScore(connection);
      const segment = calculateABCSegment(connection);
      
      return {
        id: connection.id,
        name: connection.companyName || connection.contactName,
        email: connection.email,
        totalRevenue: calculateTotalRevenue(connection),
        monthlyRevenue: calculateMonthlyRevenue(connection),
        lastPaymentDate: getLastPaymentDate(connection),
        contractValue: getContractValue(connection),
        customerSince: connection.createdAt,
        riskScore,
        segment,
        paymentHistory: getPaymentHistory(connection)
      };
    });

    return NextResponse.json({ customers: customersWithRisk });
  } catch (error) {
    console.error('Financial risk customers API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// リスクスコア計算関数
function calculateRiskScore(connection: any): number {
  let score = 0;
  
  // 支払い履歴の評価
  const appointments = connection.appointments || [];
  const completedAppointments = appointments.filter((apt: any) => apt.status === 'completed');
  const totalAppointments = appointments.length;
  
  if (totalAppointments === 0) {
    score += 30; // 取引実績なし
  } else {
    const completionRate = completedAppointments.length / totalAppointments;
    if (completionRate < 0.5) score += 40;
    else if (completionRate < 0.8) score += 20;
    else if (completionRate < 0.9) score += 10;
  }
  
  // 最新取引からの経過時間
  const lastAppointment = appointments
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  
  if (lastAppointment) {
    const daysSinceLastContact = (Date.now() - new Date(lastAppointment.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastContact > 180) score += 30;
    else if (daysSinceLastContact > 90) score += 20;
    else if (daysSinceLastContact > 30) score += 10;
  } else {
    score += 50; // 取引履歴なし
  }
  
  // 契約金額の評価
  const contractValue = getContractValue(connection);
  if (contractValue === 0) score += 20;
  
  return Math.min(100, score);
}

// ABCセグメント計算関数
function calculateABCSegment(connection: any): 'A' | 'B' | 'C' | 'D' {
  const revenue = calculateTotalRevenue(connection);
  const riskScore = calculateRiskScore(connection);
  
  if (revenue > 1000000 && riskScore < 30) return 'A';
  if (revenue > 500000 && riskScore < 50) return 'B';
  if (revenue > 100000 && riskScore < 70) return 'C';
  return 'D';
}

// 総売上計算関数
function calculateTotalRevenue(connection: any): number {
  return connection.appointments?.reduce((total: number, apt: any) => {
    return total + (apt.contract?.value || 0);
  }, 0) || 0;
}

// 月次売上計算関数
function calculateMonthlyRevenue(connection: any): number {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  return connection.appointments?.reduce((total: number, apt: any) => {
    if (new Date(apt.createdAt) >= lastMonth) {
      return total + (apt.contract?.value || 0);
    }
    return total;
  }, 0) || 0;
}

// 最終支払日取得関数
function getLastPaymentDate(connection: any): Date | null {
  const appointments = connection.appointments || [];
  const completedAppointments = appointments
    .filter((apt: any) => apt.status === 'completed')
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return completedAppointments.length > 0 ? completedAppointments[0].createdAt : null;
}

// 契約金額取得関数
function getContractValue(connection: any): number {
  return connection.appointments?.reduce((total: number, apt: any) => {
    return total + (apt.contract?.value || 0);
  }, 0) || 0;
}

// 支払い履歴取得関数
function getPaymentHistory(connection: any): any[] {
  return connection.appointments?.map((apt: any) => ({
    id: apt.id,
    customerId: connection.id,
    amount: apt.contract?.value || 0,
    paymentDate: apt.createdAt,
    dueDate: apt.scheduledAt,
    status: apt.status === 'completed' ? 'paid' : 'pending',
    invoiceNumber: apt.id
  })) || [];
}
```

### **2.2 LTV分析API**

**ファイル**: `/src/app/api/ltv-analysis/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // 既存のcustomer_ltv_analysisテーブルを活用
    const ltvData = await prisma.customer_ltv_analysis.findMany({
      include: {
        connection: true
      }
    });

    if (ltvData.length === 0) {
      return NextResponse.json({ 
        analysis: [], 
        message: "LTV分析データがありません" 
      });
    }

    const ltvAnalysis = ltvData.map(data => ({
      customerId: data.connectionId,
      customerName: data.connection?.companyName || data.connection?.contactName || 'Unknown',
      currentLTV: Number(data.totalLtv),
      predictedLTV: Number(data.discountedLtv),
      averageOrderValue: Number(data.initialProjectValue),
      purchaseFrequency: data.continuationProbability,
      customerLifespan: data.averageProjectDuration || 12,
      profitMargin: data.profitMarginPercentage,
      segment: calculateSegmentFromLTV(Number(data.totalLtv))
    }));

    return NextResponse.json({ analysis: ltvAnalysis });
  } catch (error) {
    console.error('LTV analysis API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateSegmentFromLTV(ltv: number): 'A' | 'B' | 'C' | 'D' {
  if (ltv > 2000000) return 'A';
  if (ltv > 1000000) return 'B';
  if (ltv > 500000) return 'C';
  return 'D';
}
```

### **2.3 リスクアラートAPI**

**ファイル**: `/src/app/api/financial-risk/alerts/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // 実際のデータから動的にリスクアラートを生成
    const alerts = await generateRiskAlerts();
    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Financial risk alerts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateRiskAlerts() {
  const alerts = [];
  
  // 1. 支払い遅延アラート
  const overdueAppointments = await prisma.appointments.findMany({
    where: {
      scheduledAt: {
        lt: new Date()
      },
      status: 'scheduled'
    },
    include: {
      connection: true,
      contract: true
    }
  });

  overdueAppointments.forEach(apt => {
    const daysPast = Math.floor((Date.now() - new Date(apt.scheduledAt).getTime()) / (1000 * 60 * 60 * 24));
    alerts.push({
      id: `payment_delay_${apt.id}`,
      type: 'payment_delay',
      severity: daysPast > 30 ? 'critical' : daysPast > 14 ? 'high' : 'medium',
      customerId: apt.connectionId,
      title: `支払い遅延: ${apt.connection?.companyName || apt.connection?.contactName}`,
      description: `予定日から${daysPast}日経過しています`,
      suggestedActions: [
        '顧客への連絡',
        '支払い条件の再確認',
        '督促プロセスの開始'
      ],
      impact: Number(apt.contract?.value || 0),
      resolved: false,
      createdAt: new Date()
    });
  });

  // 2. 売上減少アラート
  const recentRevenue = await calculateRecentRevenueTrend();
  if (recentRevenue.decline > 20) {
    alerts.push({
      id: 'revenue_decline_001',
      type: 'revenue_decline',
      severity: recentRevenue.decline > 50 ? 'critical' : 'high',
      title: '売上減少トレンド検知',
      description: `過去3ヶ月で売上が${recentRevenue.decline.toFixed(1)}%減少しています`,
      suggestedActions: [
        '営業活動の強化',
        '既存顧客へのフォローアップ',
        '新規獲得施策の検討'
      ],
      impact: recentRevenue.impactAmount,
      resolved: false,
      createdAt: new Date()
    });
  }

  return alerts;
}

async function calculateRecentRevenueTrend() {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentRevenue = await prisma.appointments.aggregate({
    where: {
      createdAt: { gte: threeMonthsAgo },
      status: 'completed'
    },
    _sum: { contract: { value: true } }
  });
  
  const previousRevenue = await prisma.appointments.aggregate({
    where: {
      createdAt: { gte: sixMonthsAgo, lt: threeMonthsAgo },
      status: 'completed'
    },
    _sum: { contract: { value: true } }
  });
  
  const recent = Number(recentRevenue._sum.contract?.value || 0);
  const previous = Number(previousRevenue._sum.contract?.value || 0);
  
  const decline = previous > 0 ? ((previous - recent) / previous) * 100 : 0;
  
  return {
    decline,
    impactAmount: previous - recent
  };
}
```

---

## 🚀 **タスク3: MBTI最適化API実装**

### **3.1 ユーザープロファイルAPI**

**ファイル**: `/src/app/api/mbti/profiles/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // 既存のusersテーブルとstudent_resourcesテーブルを活用
    const users = await prisma.users.findMany({
      include: {
        studentResource: true,
        tasks: {
          take: 20,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (users.length === 0) {
      return NextResponse.json({ 
        profiles: [], 
        message: "ユーザーデータがありません" 
      });
    }

    const profiles = users
      .filter(user => user.mbtiType) // MBTIタイプが設定されているユーザーのみ
      .map(user => ({
        userId: user.id,
        userName: user.name,
        email: user.email,
        mbtiType: user.mbtiType,
        assessmentDate: user.studentResource?.createdAt || user.createdAt,
        confidence: 95, // デフォルト信頼度
        taskHistory: user.tasks.map(task => ({
          taskId: task.id,
          taskType: task.tags || 'general',
          completed: task.status === 'completed',
          timeSpent: task.actualHours * 60, // 分に変換
          qualityScore: calculateQualityScore(task),
          difficultyLevel: task.difficultyScore || 5,
          collaborationRequired: false, // 既存スキーマから判定困難
          completionDate: task.updatedAt,
          feedback: ''
        })),
        collaborationHistory: [] // 協業履歴は別途実装可能
      }));

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('MBTI profiles API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateQualityScore(task: any): number {
  // タスクの品質スコアを既存データから算出
  let score = 5; // ベーススコア
  
  // 期限内完了度
  if (task.status === 'completed') {
    score += 2;
    if (task.dueDate && new Date(task.updatedAt) <= new Date(task.dueDate)) {
      score += 2; // 期限内完了
    }
  }
  
  // 工数精度
  if (task.estimatedHours > 0 && task.actualHours > 0) {
    const accuracy = 1 - Math.abs(task.estimatedHours - task.actualHours) / task.estimatedHours;
    score += accuracy * 2;
  }
  
  return Math.min(10, Math.max(1, Math.round(score)));
}
```

### **3.2 個人分析API**

**ファイル**: `/src/app/api/mbti/individual/[userId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        studentResource: true,
        tasks: {
          take: 50,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    if (!user.mbtiType) {
      return NextResponse.json(
        { error: "MBTIタイプが設定されていません" },
        { status: 400 }
      );
    }

    const recommendations = generatePersonalizedRecommendations(user);
    const predictions = generatePerformancePredictions(user);

    return NextResponse.json({ recommendations, predictions });
  } catch (error) {
    console.error('MBTI individual API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generatePersonalizedRecommendations(user: any) {
  const mbtiType = user.mbtiType;
  const taskHistory = user.tasks || [];
  
  const recommendations = [];

  // タスク完了率に基づく推奨
  const completionRate = taskHistory.filter((t: any) => t.status === 'completed').length / (taskHistory.length || 1);
  
  if (completionRate < 0.7) {
    recommendations.push({
      userId: user.id,
      recommendationType: 'task',
      title: 'タスク完了率の改善',
      description: `現在の完了率は${Math.round(completionRate * 100)}%です。${mbtiType}タイプに適したタスク管理手法を提案します。`,
      priority: 'high',
      expectedImpact: '完了率20%向上',
      actionItems: getMBTISpecificTaskAdvice(mbtiType),
      timeframe: '2週間',
      successMetrics: ['完了率80%以上', 'タスク遅延50%削減']
    });
  }

  // 工数精度に基づく推奨
  const estimationAccuracy = calculateEstimationAccuracy(taskHistory);
  if (estimationAccuracy < 0.7) {
    recommendations.push({
      userId: user.id,
      recommendationType: 'development',
      title: '工数見積り精度の向上',
      description: `${mbtiType}タイプの特性を活かした見積り手法を提案します。`,
      priority: 'medium',
      expectedImpact: '見積り精度30%向上',
      actionItems: getMBTISpecificEstimationAdvice(mbtiType),
      timeframe: '1ヶ月',
      successMetrics: ['見積り精度80%以上']
    });
  }

  return recommendations;
}

function generatePerformancePredictions(user: any) {
  const taskHistory = user.tasks || [];
  
  const predictions = [];
  
  // タスクタイプ別の成功率予測
  const taskTypes = ['development', 'planning', 'communication', 'analysis'];
  
  taskTypes.forEach(type => {
    const typeTasks = taskHistory.filter((t: any) => (t.tags || '').includes(type));
    const successRate = typeTasks.length > 0 
      ? (typeTasks.filter((t: any) => t.status === 'completed').length / typeTasks.length) * 100
      : 75; // デフォルト値

    predictions.push({
      taskType: type,
      predictedSuccess: Math.round(successRate),
      predictedTime: calculateAverageTime(typeTasks),
      confidenceLevel: typeTasks.length >= 5 ? 85 : 60,
      factors: {
        mbtiAlignment: getMBTIAlignment(user.mbtiType, type),
        pastPerformance: successRate,
        taskComplexity: 50,
        currentWorkload: user.currentLoadPercentage || 50
      },
      recommendations: getMBTITaskRecommendations(user.mbtiType, type)
    });
  });

  return predictions;
}

// MBTI タイプ別のアドバイス関数
function getMBTISpecificTaskAdvice(mbtiType: string): string[] {
  const advice: Record<string, string[]> = {
    'INTJ': ['長期計画の細分化', '静かな作業環境の確保', '目標の明確化'],
    'ENTJ': ['チームとの定期的な進捗共有', 'リーダーシップ機会の活用', '効率化ツールの導入'],
    'INFP': ['創造的な要素の追加', '価値観との整合性確認', '柔軟なスケジュール設定'],
    'ENFP': ['変化に富んだタスク構成', 'チームワークの機会創出', '短期目標の設定']
  };
  
  return advice[mbtiType] || ['個人の強みを活かしたアプローチ', '定期的な振り返り', '継続的な学習'];
}

function getMBTISpecificEstimationAdvice(mbtiType: string): string[] {
  const advice: Record<string, string[]> = {
    'INTJ': ['詳細な要件分析', '過去データの活用', 'バッファ時間の確保'],
    'ENTJ': ['チーム経験の活用', '段階的見積り', '定期的な見直し'],
    'INFP': ['感覚的見積りの数値化', '類似作業との比較', 'ペアワークの活用'],
    'ENFP': ['複数人での見積り', '楽観バイアスの調整', '実績データの蓄積']
  };
  
  return advice[mbtiType] || ['過去の実績データ活用', 'チーム内での見積り共有', '定期的な精度確認'];
}

function calculateEstimationAccuracy(tasks: any[]): number {
  const validTasks = tasks.filter((t: any) => t.estimatedHours > 0 && t.actualHours > 0);
  if (validTasks.length === 0) return 0.75; // デフォルト値
  
  const accuracies = validTasks.map((t: any) => {
    const diff = Math.abs(t.estimatedHours - t.actualHours);
    return Math.max(0, 1 - (diff / t.estimatedHours));
  });
  
  return accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
}

function calculateAverageTime(tasks: any[]): number {
  if (tasks.length === 0) return 240; // 4時間デフォルト
  
  const avgHours = tasks.reduce((sum: number, t: any) => sum + (t.actualHours || t.estimatedHours || 4), 0) / tasks.length;
  return Math.round(avgHours * 60); // 分に変換
}

function getMBTIAlignment(mbtiType: string, taskType: string): number {
  // MBTI タイプとタスクタイプの適合度（0-100）
  const alignments: Record<string, Record<string, number>> = {
    'INTJ': { development: 90, planning: 95, communication: 60, analysis: 85 },
    'ENTJ': { development: 75, planning: 90, communication: 85, analysis: 80 },
    'INFP': { development: 70, planning: 60, communication: 80, analysis: 75 },
    'ENFP': { development: 65, planning: 70, communication: 90, analysis: 70 }
  };
  
  return alignments[mbtiType]?.[taskType] || 75;
}

function getMBTITaskRecommendations(mbtiType: string, taskType: string): string[] {
  return [
    `${mbtiType}タイプに適した${taskType}アプローチを採用`,
    '個人の強みを最大化する環境設定',
    '定期的なフィードバックと調整'
  ];
}
```

### **3.3 チーム相性分析API**

**ファイル**: `/src/app/api/mbti/compatibility/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json();

    if (!userIds || userIds.length < 2) {
      return NextResponse.json(
        { error: 'チーム分析には2名以上のユーザーが必要です' },
        { status: 400 }
      );
    }

    const users = await prisma.users.findMany({
      where: {
        id: { in: userIds }
      },
      include: {
        studentResource: true
      }
    });

    const teamMembers = users.map(user => ({
      userId: user.id,
      userName: user.name,
      mbtiType: user.mbtiType
    }));

    const compatibility = analyzeTeamCompatibility(teamMembers);

    return NextResponse.json({ compatibility });
  } catch (error) {
    console.error('MBTI compatibility API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function analyzeTeamCompatibility(teamMembers: any[]) {
  const mbtiTypes = teamMembers.map(member => member.mbtiType).filter(Boolean);
  
  if (mbtiTypes.length < 2) {
    return {
      teamMembers,
      compatibilityScore: 50,
      strengthAreas: ['チーム構成の確認が必要'],
      riskAreas: ['MBTIタイプ情報の不足'],
      recommendations: ['メンバーのMBTIタイプを設定してください'],
      communicationMatrix: {}
    };
  }

  // ペア間の相性マトリクス計算
  const communicationMatrix: Record<string, Record<string, number>> = {};
  let totalCompatibility = 0;
  let pairCount = 0;

  for (let i = 0; i < teamMembers.length; i++) {
    const member1 = teamMembers[i];
    communicationMatrix[member1.userId] = {};
    
    for (let j = 0; j < teamMembers.length; j++) {
      if (i !== j) {
        const member2 = teamMembers[j];
        const compatibility = calculateTypeCompatibility(member1.mbtiType, member2.mbtiType);
        communicationMatrix[member1.userId][member2.userId] = compatibility;
        
        if (i < j) { // 重複カウント防止
          totalCompatibility += compatibility;
          pairCount++;
        }
      }
    }
  }

  const overallScore = pairCount > 0 ? Math.round(totalCompatibility / pairCount) : 50;

  // チームの強み・リスクエリア分析
  const { strengthAreas, riskAreas } = analyzeTeamDynamics(mbtiTypes);
  const recommendations = generateTeamRecommendations(mbtiTypes, overallScore);

  return {
    teamMembers,
    compatibilityScore: overallScore,
    strengthAreas,
    riskAreas,
    recommendations,
    communicationMatrix
  };
}

function calculateTypeCompatibility(type1: string, type2: string): number {
  if (!type1 || !type2) return 50;

  // MBTI次元の抽出
  const dims1 = {
    E: type1[0] === 'E',
    S: type1[1] === 'S', 
    T: type1[2] === 'T',
    J: type1[3] === 'J'
  };
  
  const dims2 = {
    E: type2[0] === 'E',
    S: type2[1] === 'S',
    T: type2[2] === 'T', 
    J: type2[3] === 'J'
  };

  let compatibility = 60; // ベーススコア

  // 補完的な関係の評価
  if (dims1.E !== dims2.E) compatibility += 15; // 外向-内向の補完
  if (dims1.S !== dims2.S) compatibility += 10; // 感覚-直感の補完
  if (dims1.T === dims2.T) compatibility += 10; // 思考-感情の一致
  if (dims1.J !== dims2.J) compatibility += 5;  // 判断-知覚の補完

  // 特別な相性パターン
  if (type1 === type2) compatibility = 85; // 同じタイプ
  
  // 理想的なペアリング
  const idealPairs = [
    ['INTJ', 'ENFP'], ['INFJ', 'ENTP'], ['ISTJ', 'ESFP'], ['ISFJ', 'ESTP'],
    ['ENTJ', 'INFP'], ['ENFJ', 'INTP'], ['ESTJ', 'ISFP'], ['ESFJ', 'ISTP']
  ];
  
  for (const [t1, t2] of idealPairs) {
    if ((type1 === t1 && type2 === t2) || (type1 === t2 && type2 === t1)) {
      compatibility = 95;
      break;
    }
  }

  return Math.min(100, Math.max(30, compatibility));
}

function analyzeTeamDynamics(mbtiTypes: string[]) {
  const strengthAreas = [];
  const riskAreas = [];

  // 外向性・内向性のバランス
  const extraverts = mbtiTypes.filter(t => t[0] === 'E').length;
  const introverts = mbtiTypes.filter(t => t[0] === 'I').length;
  
  if (extraverts > 0 && introverts > 0) {
    strengthAreas.push('外向性と内向性のバランスが良好');
  } else if (extraverts === 0) {
    riskAreas.push('外向的なエネルギーの不足');
  } else {
    riskAreas.push('内省的な時間の不足');
  }

  // 思考・感情のバランス
  const thinkers = mbtiTypes.filter(t => t[2] === 'T').length;
  const feelers = mbtiTypes.filter(t => t[2] === 'F').length;
  
  if (thinkers > 0 && feelers > 0) {
    strengthAreas.push('論理的思考と人間的配慮の両立');
  } else if (feelers === 0) {
    riskAreas.push('チームの人間関係・士気への配慮不足');
  } else {
    riskAreas.push('客観的な意思決定の困難');
  }

  // 感覚・直感のバランス
  const sensors = mbtiTypes.filter(t => t[1] === 'S').length;
  const intuitives = mbtiTypes.filter(t => t[1] === 'N').length;
  
  if (sensors > 0 && intuitives > 0) {
    strengthAreas.push('現実的視点と革新的アイデアの融合');
  } else if (sensors === 0) {
    riskAreas.push('実装・詳細への注意力不足');
  } else {
    riskAreas.push('新しいアプローチへの抵抗');
  }

  return { strengthAreas, riskAreas };
}

function generateTeamRecommendations(mbtiTypes: string[], score: number): string[] {
  const recommendations = [];

  if (score >= 80) {
    recommendations.push('非常に良好なチーム相性です。現在の協働スタイルを維持してください');
  } else if (score >= 60) {
    recommendations.push('良好なチーム相性です。コミュニケーション頻度を増やすとさらに効果的です');
  } else {
    recommendations.push('チーム相性に改善の余地があります。定期的な対話の機会を設けてください');
  }

  // タイプ別の具体的推奨事項
  const hasIntroverts = mbtiTypes.some(t => t[0] === 'I');
  const hasExtraverts = mbtiTypes.some(t => t[0] === 'E');
  
  if (hasIntroverts && hasExtraverts) {
    recommendations.push('会議では内向型メンバーの発言時間を確保してください');
  }

  const hasJudgers = mbtiTypes.some(t => t[3] === 'J');
  const hasPerceivers = mbtiTypes.some(t => t[3] === 'P');
  
  if (hasJudgers && hasPerceivers) {
    recommendations.push('計画性と柔軟性のバランスを意識した進行を心がけてください');
  }

  return recommendations;
}
```

---

## ✅ **完了確認チェックリスト**

### **実装完了確認**
- [ ] `/app/mbti/[userId]/page.tsx` - 個人分析ページ
- [ ] `/app/mbti/components/PersonalityProfile.tsx` - 性格プロファイル  
- [ ] `/app/mbti/components/StrengthWeakness.tsx` - 強み・弱み分析
- [ ] `/app/mbti/team/page.tsx` - チーム相性分析ページ
- [ ] `/api/financial-risk/customers/route.ts` - 顧客データAPI
- [ ] `/api/ltv-analysis/route.ts` - LTV分析API  
- [ ] `/api/financial-risk/alerts/route.ts` - リスクアラートAPI
- [ ] `/api/mbti/profiles/route.ts` - ユーザープロファイルAPI
- [ ] `/api/mbti/individual/[userId]/route.ts` - 個人分析API
- [ ] `/api/mbti/compatibility/route.ts` - チーム相性API

### **動作確認**
- [ ] プロジェクトテンプレート機能 (`/projects/templates`) 正常動作
- [ ] 財務リスク監視ダッシュボード (`/financial-risk`) 正常動作
- [ ] MBTI個人分析 (`/mbti/[userId]`) 正常動作  
- [ ] MBTIチーム分析 (`/mbti/team`) 正常動作
- [ ] 全API エンドポイント正常応答
- [ ] エラーハンドリング適切に動作
- [ ] データなし状態の適切な表示確認

### **品質確認**
- [ ] TypeScript 型エラー: 0件
- [ ] ESLint エラー: 0件（警告は許容）
- [ ] レスポンシブデザイン確認
- [ ] アクセシビリティ確認
- [ ] ページ読み込み速度 < 3秒

### **Phase 2 完了基準達成**
- [ ] API活用率 70%以上達成
- [ ] システム完成度 100%達成
- [ ] 全機能正常動作確認
- [ ] ドキュメント完全性確認

---

## 🎯 **実装優先順位**

### **Priority 1 (即座に実装)**
1. MBTI個人分析ページ実装
2. 財務リスクAPI実装

### **Priority 2 (次に実装)**  
3. MBTIチーム分析ページ実装
4. MBTI API実装

### **Priority 3 (最終確認)**
5. 全機能統合テスト
6. ドキュメント最終更新

---

**この引き継ぎ書に従って実装すれば、Phase 2 が確実に100%完了します！**