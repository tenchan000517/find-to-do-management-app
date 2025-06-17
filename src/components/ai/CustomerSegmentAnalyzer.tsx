"use client";

import { useState, useEffect } from 'react';
import { CustomerSegment, CustomerProfile } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function CustomerSegmentAnalyzer() {
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | null>(null);

  useEffect(() => {
    loadSegmentData();
  }, []);

  const loadSegmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // アポイントメントデータから顧客セグメントを生成
      const response = await fetch('/api/appointments');
      const appointmentsData = await response.json();

      if (!appointmentsData.success) {
        throw new Error('Failed to load appointments data');
      }

      const appointments = appointmentsData.data;
      const analyzedSegments = await analyzeCustomerSegments(appointments);
      setSegments(analyzedSegments);
    } catch (err) {
      console.error('Failed to load segment data:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze customer segments');
    } finally {
      setLoading(false);
    }
  };

  const analyzeCustomerSegments = async (appointments: any[]): Promise<CustomerSegment[]> => {
    // 軽量セグメント分析アルゴリズム
    const customerProfiles: CustomerProfile[] = appointments.map(apt => ({
      appointmentId: apt.id,
      companyName: apt.companyName,
      industryCategory: categorizeIndustry(apt.companyName),
      companySize: categorizeCompanySize(apt.details?.businessValue || 50),
      budgetRange: categorizeBudget(apt.details?.contractValue || 0),
      decisionSpeed: categorizeDecisionSpeed(apt.details?.phaseStatus || 'CONTACT'),
      relationshipStage: apt.details?.relationshipStatus || 'FIRST_CONTACT',
      engagementLevel: apt.details?.importance || 50,
      businessPotential: apt.details?.businessValue || 50,
    }));

    // セグメント分類
    const segments = [
      {
        segmentId: 'enterprise-high-value',
        name: 'エンタープライズ高価値顧客',
        size: 0,
        averageValue: 0,
        conversionRate: 0,
        recommendedStrategy: '専任営業による戦略的アプローチ',
        keyCharacteristics: ['大企業', '高予算', '長期関係'],
        customers: [] as CustomerProfile[],
        growthTrend: 'increasing' as const,
        priority: 'high' as const,
      },
      {
        segmentId: 'mid-market',
        name: '中堅企業標準顧客',
        size: 0,
        averageValue: 0,
        conversionRate: 0,
        recommendedStrategy: '効率的な営業プロセスによる量的アプローチ',
        keyCharacteristics: ['中堅企業', '標準予算', '迅速決定'],
        customers: [] as CustomerProfile[],
        growthTrend: 'stable' as const,
        priority: 'medium' as const,
      },
      {
        segmentId: 'startup-potential',
        name: 'スタートアップ成長顧客',
        size: 0,
        averageValue: 0,
        conversionRate: 0,
        recommendedStrategy: '長期的な関係構築とスケーラビリティ提案',
        keyCharacteristics: ['スタートアップ', '成長志向', '革新的'],
        customers: [] as CustomerProfile[],
        growthTrend: 'increasing' as const,
        priority: 'medium' as const,
      },
      {
        segmentId: 'price-sensitive',
        name: 'コスト重視顧客',
        size: 0,
        averageValue: 0,
        conversionRate: 0,
        recommendedStrategy: 'コストパフォーマンス重視の提案',
        keyCharacteristics: ['価格重視', 'スピード決定', '実用性志向'],
        customers: [] as CustomerProfile[],
        growthTrend: 'stable' as const,
        priority: 'low' as const,
      },
    ];

    // 顧客をセグメントに分類
    customerProfiles.forEach(profile => {
      if (profile.companySize === 'enterprise' && profile.budgetRange === 'premium') {
        segments[0].customers.push(profile);
      } else if (profile.companySize === 'large' || profile.companySize === 'medium') {
        segments[1].customers.push(profile);
      } else if (profile.companySize === 'small' && profile.businessPotential > 70) {
        segments[2].customers.push(profile);
      } else {
        segments[3].customers.push(profile);
      }
    });

    // セグメント統計計算
    segments.forEach(segment => {
      segment.size = segment.customers.length;
      segment.averageValue = segment.customers.length > 0
        ? segment.customers.reduce((sum, c) => sum + c.businessPotential, 0) / segment.customers.length
        : 0;
      
      // 仮の成約率（実際のデータベースから計算）
      segment.conversionRate = Math.random() * 100; // TODO: 実際の成約率計算
    });

    return segments.filter(s => s.size > 0);
  };

  const categorizeIndustry = (companyName: string): string => {
    // 簡易業界分類
    if (companyName.includes('Tech') || companyName.includes('IT')) return 'IT・テクノロジー';
    if (companyName.includes('Bank') || companyName.includes('Financial')) return '金融';
    if (companyName.includes('Retail') || companyName.includes('Store')) return '小売';
    if (companyName.includes('Medical') || companyName.includes('Health')) return '医療・ヘルスケア';
    return 'その他';
  };

  const categorizeCompanySize = (businessValue: number): 'small' | 'medium' | 'large' | 'enterprise' => {
    if (businessValue >= 90) return 'enterprise';
    if (businessValue >= 70) return 'large';
    if (businessValue >= 50) return 'medium';
    return 'small';
  };

  const categorizeBudget = (contractValue: number): 'low' | 'medium' | 'high' | 'premium' => {
    if (contractValue >= 10000000) return 'premium'; // 1000万円以上
    if (contractValue >= 5000000) return 'high'; // 500万円以上
    if (contractValue >= 1000000) return 'medium'; // 100万円以上
    return 'low';
  };

  const categorizeDecisionSpeed = (phase: string): 'fast' | 'medium' | 'slow' => {
    if (phase === 'CONTRACT' || phase === 'CLOSED') return 'fast';
    if (phase === 'PROPOSAL') return 'medium';
    return 'slow';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" message="顧客セグメントを分析中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-medium mb-2">セグメント分析エラー</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadSegmentData}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          再試行
        </button>
      </div>
    );
  }

  const chartData = segments.map(segment => ({
    name: segment.name,
    value: segment.size,
    avgValue: segment.averageValue,
    conversionRate: segment.conversionRate,
    priority: segment.priority,
  }));

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">顧客セグメント分析</h2>
          <p className="text-gray-600">
            {segments.reduce((sum, s) => sum + s.size, 0)}社を{segments.length}セグメントに分類
          </p>
        </div>
        <button
          onClick={loadSegmentData}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          更新
        </button>
      </div>

      {/* セグメント概要 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* セグメント分布 */}
        <Card>
          <CardHeader>
            <CardTitle>セグメント分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getPriorityColor(entry.priority)}
                      onClick={() => setSelectedSegment(segments[index])}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 成約率比較 */}
        <Card>
          <CardHeader>
            <CardTitle>セグメント別成約率</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => [`${(value as number).toFixed(1)}%`, '成約率']}
                />
                <Bar dataKey="conversionRate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* セグメント詳細 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {segments.map((segment) => (
          <div 
            key={segment.segmentId}
            className={`cursor-pointer transition-all ${
              selectedSegment?.segmentId === segment.segmentId 
                ? 'ring-2 ring-blue-500 shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedSegment(segment)}
          >
            <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{segment.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{getTrendIcon(segment.growthTrend)}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    segment.priority === 'high' ? 'bg-red-100 text-red-800' :
                    segment.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {segment.priority === 'high' ? '高優先度' :
                     segment.priority === 'medium' ? '中優先度' : '低優先度'}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">顧客数:</span>
                    <span className="ml-2 font-semibold">{segment.size}社</span>
                  </div>
                  <div>
                    <span className="text-gray-500">平均価値:</span>
                    <span className="ml-2 font-semibold">{segment.averageValue.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">成約率:</span>
                    <span className="ml-2 font-semibold">{segment.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">成長傾向:</span>
                    <span className="ml-2 font-semibold">
                      {segment.growthTrend === 'increasing' ? '成長' :
                       segment.growthTrend === 'decreasing' ? '縮小' : '安定'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">推奨戦略:</div>
                  <p className="text-sm text-gray-600">{segment.recommendedStrategy}</p>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">主要特徴:</div>
                  <div className="flex flex-wrap gap-1">
                    {segment.keyCharacteristics.map((characteristic, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {characteristic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* 選択されたセグメントの詳細 */}
      {selectedSegment && (
        <Card variant="outlined">
          <CardHeader>
            <CardTitle>{selectedSegment.name} - 詳細分析</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-blue-600 text-sm font-medium">総顧客数</div>
                  <div className="text-2xl font-bold text-blue-900">{selectedSegment.size}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-green-600 text-sm font-medium">平均ビジネス価値</div>
                  <div className="text-2xl font-bold text-green-900">
                    {selectedSegment.averageValue.toFixed(1)}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-purple-600 text-sm font-medium">予想成約率</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {selectedSegment.conversionRate.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">セグメント内顧客一覧</h4>
                <div className="space-y-2">
                  {selectedSegment.customers.slice(0, 10).map((customer, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium text-gray-900">{customer.companyName}</span>
                        <span className="ml-2 text-sm text-gray-500">({customer.industryCategory})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {customer.companySize}
                        </span>
                        <span className="text-sm font-medium">
                          価値: {customer.businessPotential}
                        </span>
                      </div>
                    </div>
                  ))}
                  {selectedSegment.customers.length > 10 && (
                    <div className="text-center text-sm text-gray-500 mt-2">
                      他 {selectedSegment.customers.length - 10} 社
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {segments.length === 0 && (
        <Card>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              分析可能な顧客データがありません
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}