"use client";

import { useState } from 'react';
import SalesAnalyticsDashboard from '@/components/dashboard/SalesAnalyticsDashboard';
import SalesPredictionEngine from '@/components/ai/SalesPredictionEngine';
import CustomerSegmentAnalyzer from '@/components/ai/CustomerSegmentAnalyzer';

export default function SalesAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'predictions' | 'segments'>('dashboard');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const tabs = [
    { id: 'dashboard', label: '営業ダッシュボード', icon: '📊' },
    { id: 'predictions', label: 'AI予測エンジン', icon: '🤖' },
    { id: 'segments', label: '顧客セグメント', icon: '👥' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ページヘッダー */}
        <div className="mb-8">
          <h1 className="text-lg md:text-2xl font-bold text-gray-900">営業分析・AI支援システム</h1>
          <p className="text-gray-600 mt-2">
            営業パフォーマンスの分析とAI予測による営業支援
          </p>
        </div>

        {/* タブナビゲーション */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* タブコンテンツ */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === 'dashboard' && (
            <div className="p-6">
              <SalesAnalyticsDashboard timeRange={timeRange} />
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className="p-6">
              <SalesPredictionEngine autoRefresh={true} refreshInterval={300000} />
            </div>
          )}

          {activeTab === 'segments' && (
            <div className="p-6">
              <CustomerSegmentAnalyzer />
            </div>
          )}
        </div>

        {/* フローティングアクションボタン */}
        <div className="fixed bottom-6 right-6 space-y-2">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            title="データを更新"
          >
            🔄
          </button>
          <button
            onClick={() => {
              const element = document.documentElement;
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="bg-gray-600 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
            title="トップに戻る"
          >
            ⬆️
          </button>
        </div>

        {/* 時間範囲選択（ダッシュボードタブでのみ表示） */}
        {activeTab === 'dashboard' && (
          <div className="fixed top-20 right-6">
            <div className="bg-white rounded-lg shadow-lg p-3 border">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分析期間
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">過去7日</option>
                <option value="30d">過去30日</option>
                <option value="90d">過去90日</option>
                <option value="1y">過去1年</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}