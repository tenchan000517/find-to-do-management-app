'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Battery, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Settings,
  Info
} from 'lucide-react';

// APIレスポンス型定義
interface ResourceAllocation {
  dailyCapacity: {
    totalWeightLimit: number;
    usedWeight: number;
    remainingWeight: number;
    utilizationRate: number;
  };
  timeAllocation: {
    totalAvailableHours: number;
    allocatedHours: number;
    freeHours: number;
    timeUtilizationRate: number;
  };
  taskDistribution: {
    lightTasks: number;
    heavyTasks: number;
    lightTaskCapacity: number;
    heavyTaskCapacity: number;
  };
  energyDistribution: {
    highEnergyTasks: number;
    mediumEnergyTasks: number;
    lowEnergyTasks: number;
  };
  riskAssessment: {
    overloadRisk: 'low' | 'medium' | 'high';
    burnoutRisk: 'low' | 'medium' | 'high';
    efficiencyRisk: 'low' | 'medium' | 'high';
  };
}

interface ResourceData {
  resourceAllocation: ResourceAllocation;
  userProfile: {
    userType: string;
    dailyCapacity: {
      totalWeightLimit: number;
      lightTaskSlots: number;
      heavyTaskSlots: number;
    };
  };
  metadata: {
    totalTasks: number;
    scheduledTasks: number;
    estimatedProductivity: number;
  };
}

interface ResourceUtilizationViewerProps {
  data?: ResourceData;
  loading?: boolean;
  className?: string;
  onRefresh?: () => void;
}

export default function ResourceUtilizationViewer({ 
  data, 
  loading = false, 
  className = '', 
  onRefresh 
}: ResourceUtilizationViewerProps) {
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'analysis'>('overview');

  if (loading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-gray-500">
            <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>リソース配分データがありません</p>
            {onRefresh && (
              <Button onClick={onRefresh} variant="outline" className="mt-4">
                データを取得
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { resourceAllocation, userProfile, metadata } = data;

  // リスクレベルの色設定
  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
    }
  };

  // 利用率の色設定
  const getUtilizationColor = (rate: number) => {
    if (rate < 0.3) return 'bg-blue-500';
    if (rate < 0.7) return 'bg-green-500';
    if (rate < 0.9) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // リソース利用率のパーセンテージ
  const weightUtilization = Math.round(resourceAllocation.dailyCapacity.utilizationRate * 100);
  const timeUtilization = Math.round(resourceAllocation.timeAllocation.timeUtilizationRate * 100);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">リソース配分計画</h2>
          <p className="text-gray-600">
            {userProfile.userType}タイプ - 日次容量 {userProfile.dailyCapacity.totalWeightLimit}ウエイト
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant={viewMode === 'overview' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('overview')}
          >
            概要
          </Button>
          <Button 
            variant={viewMode === 'detailed' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('detailed')}
          >
            詳細
          </Button>
          <Button 
            variant={viewMode === 'analysis' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setViewMode('analysis')}
          >
            分析
          </Button>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* メイン容量インジケーター */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Battery className="h-5 w-5" />
            <span>日次リソース容量</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* ウエイト利用率 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">ウエイト使用量</span>
                <span className="text-sm text-gray-600">
                  {resourceAllocation.dailyCapacity.usedWeight} / {resourceAllocation.dailyCapacity.totalWeightLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${getUtilizationColor(resourceAllocation.dailyCapacity.utilizationRate)}`}
                  style={{ width: `${Math.min(weightUtilization, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span className="font-medium">{weightUtilization}%</span>
                <span>100%</span>
              </div>
            </div>

            {/* 時間利用率 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">時間使用量</span>
                <span className="text-sm text-gray-600">
                  {resourceAllocation.timeAllocation.allocatedHours}h / {resourceAllocation.timeAllocation.totalAvailableHours}h
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getUtilizationColor(resourceAllocation.timeAllocation.timeUtilizationRate)}`}
                  style={{ width: `${Math.min(timeUtilization, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* タスク配分 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>タスク配分</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>軽タスク</span>
                  <span>{resourceAllocation.taskDistribution.lightTasks}/{resourceAllocation.taskDistribution.lightTaskCapacity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>重タスク</span>
                  <span>{resourceAllocation.taskDistribution.heavyTasks}/{resourceAllocation.taskDistribution.heavyTaskCapacity}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* エネルギー配分 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>エネルギー配分</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>高エネルギー</span>
                  <span className="text-red-600">{resourceAllocation.energyDistribution.highEnergyTasks}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>中エネルギー</span>
                  <span className="text-yellow-600">{resourceAllocation.energyDistribution.mediumEnergyTasks}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>低エネルギー</span>
                  <span className="text-green-600">{resourceAllocation.energyDistribution.lowEnergyTasks}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 生産性指標 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>生産性</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {metadata.estimatedProductivity}%
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  予想生産性
                </div>
              </div>
            </CardContent>
          </Card>

          {/* リスク評価 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>リスク評価</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge className={getRiskColor(resourceAllocation.riskAssessment.overloadRisk)}>
                  容量超過: {resourceAllocation.riskAssessment.overloadRisk}
                </Badge>
                <Badge className={getRiskColor(resourceAllocation.riskAssessment.burnoutRisk)}>
                  バーンアウト: {resourceAllocation.riskAssessment.burnoutRisk}
                </Badge>
                <Badge className={getRiskColor(resourceAllocation.riskAssessment.efficiencyRisk)}>
                  効率性: {resourceAllocation.riskAssessment.efficiencyRisk}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === 'detailed' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 詳細容量分析 */}
          <Card>
            <CardHeader>
              <CardTitle>容量詳細分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">ウエイト配分</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>総容量</span>
                      <span className="font-medium">{resourceAllocation.dailyCapacity.totalWeightLimit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>使用済み</span>
                      <span className="font-medium text-blue-600">{resourceAllocation.dailyCapacity.usedWeight}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>残り容量</span>
                      <span className="font-medium text-green-600">{resourceAllocation.dailyCapacity.remainingWeight}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span>利用率</span>
                      <span className="font-medium">{weightUtilization}%</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">時間配分</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>利用可能時間</span>
                      <span className="font-medium">{resourceAllocation.timeAllocation.totalAvailableHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>配分済み時間</span>
                      <span className="font-medium text-blue-600">{resourceAllocation.timeAllocation.allocatedHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>空き時間</span>
                      <span className="font-medium text-green-600">{resourceAllocation.timeAllocation.freeHours}h</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* タスク詳細分析 */}
          <Card>
            <CardHeader>
              <CardTitle>タスク詳細分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">タスク分布</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>軽タスク</span>
                        <span>{resourceAllocation.taskDistribution.lightTasks}/{resourceAllocation.taskDistribution.lightTaskCapacity}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-green-500 rounded-full"
                          style={{ 
                            width: `${Math.min(
                              (resourceAllocation.taskDistribution.lightTasks / resourceAllocation.taskDistribution.lightTaskCapacity) * 100, 
                              100
                            )}%` 
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>重タスク</span>
                        <span>{resourceAllocation.taskDistribution.heavyTasks}/{resourceAllocation.taskDistribution.heavyTaskCapacity}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-red-500 rounded-full"
                          style={{ 
                            width: `${Math.min(
                              (resourceAllocation.taskDistribution.heavyTasks / resourceAllocation.taskDistribution.heavyTaskCapacity) * 100, 
                              100
                            )}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">エネルギー分布</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>高エネルギー</span>
                      </span>
                      <span>{resourceAllocation.energyDistribution.highEnergyTasks}個</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span>中エネルギー</span>
                      </span>
                      <span>{resourceAllocation.energyDistribution.mediumEnergyTasks}個</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>低エネルギー</span>
                      </span>
                      <span>{resourceAllocation.energyDistribution.lowEnergyTasks}個</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === 'analysis' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>リソース分析・推奨事項</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* リスク分析 */}
              <div>
                <h4 className="font-medium mb-3">リスク分析</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">容量超過リスク</span>
                    </div>
                    <Badge className={getRiskColor(resourceAllocation.riskAssessment.overloadRisk)}>
                      {resourceAllocation.riskAssessment.overloadRisk}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-2">
                      {resourceAllocation.riskAssessment.overloadRisk === 'high' 
                        ? '容量上限に近づいています。新しいタスクの追加は控えることをお勧めします。'
                        : resourceAllocation.riskAssessment.overloadRisk === 'medium'
                        ? '適度な負荷です。バランスを保ちながら作業を進めてください。'
                        : '容量に余裕があります。追加タスクの受け入れが可能です。'
                      }
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap className="h-4 w-4" />
                      <span className="font-medium">バーンアウトリスク</span>
                    </div>
                    <Badge className={getRiskColor(resourceAllocation.riskAssessment.burnoutRisk)}>
                      {resourceAllocation.riskAssessment.burnoutRisk}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-2">
                      {resourceAllocation.riskAssessment.burnoutRisk === 'high' 
                        ? 'タスク数が容量を超えています。作業量の調整が必要です。'
                        : 'タスク数は適切な範囲内です。'
                      }
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-medium">効率性リスク</span>
                    </div>
                    <Badge className={getRiskColor(resourceAllocation.riskAssessment.efficiencyRisk)}>
                      {resourceAllocation.riskAssessment.efficiencyRisk}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-2">
                      {resourceAllocation.riskAssessment.efficiencyRisk === 'high' 
                        ? 'リソースの利用率が低すぎます。より多くのタスクを追加することを検討してください。'
                        : '効率的なリソース配分が行われています。'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* 推奨事項 */}
              <div>
                <h4 className="font-medium mb-3">推奨事項</h4>
                <div className="space-y-3">
                  {weightUtilization < 70 && (
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800">リソース活用の向上</p>
                        <p className="text-sm text-blue-600">
                          現在の利用率は{weightUtilization}%です。追加のタスクを受け入れて、リソースをより有効活用できます。
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {weightUtilization > 90 && (
                    <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">容量超過の警告</p>
                        <p className="text-sm text-red-600">
                          利用率が{weightUtilization}%に達しています。一部のタスクの延期または削除を検討してください。
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">バランスの取れた配分</p>
                      <p className="text-sm text-green-600">
                        軽タスクと重タスクのバランスが適切です。エネルギー配分も最適化されています。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}