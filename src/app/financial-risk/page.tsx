// Phase 2: Financial Risk Monitoring Page
// 財務リスク自動監視システムメインページ

"use client";

import React, { useState } from 'react';
import { useFinancialRisk } from '@/hooks/useFinancialRisk';
import LTVAnalysisChart from './components/LTVAnalysisChart';
import RiskAlertPanel from './components/RiskAlertPanel';
import LoadingSpinner from '@/components/LoadingSpinner';
import { TrendingUp, AlertTriangle, DollarSign, RefreshCw, Filter, Download } from 'lucide-react';

type ActiveTab = 'overview' | 'ltv' | 'alerts' | 'predictions';

export default function FinancialRiskPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  
  const {
    customers,
    ltvAnalysis,
    riskAlerts,
    revenuePredictions,
    financialMetrics,
    loading,
    error,
    fetchAllData,
    resolveAlert,
    runRiskAnalysis,
    totalCustomers,
    highRiskCustomers,
    unresolvedAlerts,
    criticalAlerts
  } = useFinancialRisk();

  const handleRefresh = async () => {
    await fetchAllData();
  };

  const handleRunAnalysis = async () => {
    await runRiskAnalysis();
  };

  if (loading && !financialMetrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="財務データを読み込み中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              エラーが発生しました
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              再読み込み
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: '概要', icon: DollarSign },
    { key: 'ltv', label: 'LTV分析', icon: TrendingUp },
    { key: 'alerts', label: 'リスクアラート', icon: AlertTriangle },
    { key: 'predictions', label: '収益予測', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                📊 財務リスク自動監視システム
              </h1>
              <p className="text-gray-600 mt-2">
                LTV分析・リスク検知・収益予測による総合的な財務管理
              </p>
            </div>
            
            {/* アクションボタン */}
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                データ更新
              </button>
              
              <button
                onClick={handleRunAnalysis}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <TrendingUp className="w-4 h-4" />
                分析実行
              </button>

              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                レポート出力
              </button>
            </div>
          </div>
        </div>

        {/* クイック統計 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">総顧客数</p>
                <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
                <p className="text-sm text-gray-500">アクティブ顧客</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">高リスク顧客</p>
                <p className="text-2xl font-bold text-red-600">{highRiskCustomers}</p>
                <p className="text-sm text-gray-500">要注意レベル</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">未解決アラート</p>
                <p className="text-2xl font-bold text-orange-600">{unresolvedAlerts}</p>
                <p className="text-sm text-gray-500">対応待ち</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">緊急アラート</p>
                <p className="text-2xl font-bold text-red-600">{criticalAlerts}</p>
                <p className="text-sm text-gray-500">即時対応必要</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as ActiveTab)}
                    className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* タブコンテンツ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 財務メトリクス概要 */}
            {financialMetrics && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">財務メトリクス</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium">総売上</p>
                    <p className="text-xl font-bold text-blue-900">
                      ¥{financialMetrics.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium">月次売上</p>
                    <p className="text-xl font-bold text-green-900">
                      ¥{financialMetrics.monthlyRecurringRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-600 font-medium">ARPU</p>
                    <p className="text-xl font-bold text-purple-900">
                      ¥{financialMetrics.averageRevenuePerUser.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-sm text-orange-600 font-medium">離脱率</p>
                    <p className="text-xl font-bold text-orange-900">
                      {financialMetrics.customerChurnRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 最近のアラート概要 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">最新のリスクアラート</h3>
                <button
                  onClick={() => setActiveTab('alerts')}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  全て見る →
                </button>
              </div>
              <div className="space-y-3">
                {riskAlerts.filter(a => !a.resolved).slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className={`w-4 h-4 ${alert.severity === 'critical' ? 'text-red-600' : alert.severity === 'high' ? 'text-orange-600' : 'text-yellow-600'}`} />
                      <span className="font-medium text-gray-900">{alert.title}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {alert.severity === 'critical' ? '緊急' : alert.severity === 'high' ? '高' : '中'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ltv' && (
          <LTVAnalysisChart data={ltvAnalysis} loading={loading} />
        )}

        {activeTab === 'alerts' && (
          <RiskAlertPanel 
            alerts={riskAlerts} 
            onResolveAlert={resolveAlert}
            loading={loading}
          />
        )}

        {activeTab === 'predictions' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">収益予測</h3>
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">収益予測機能は実装中です</p>
              <p className="text-sm text-gray-400 mt-2">近日公開予定</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}