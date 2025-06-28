// Phase 2: Knowledge Automation Dashboard Component
// ナレッジ自動化履歴ダッシュボード

"use client";

import { useState } from 'react';
import { KnowledgeAutomationHistory, KnowledgeAutomationStats } from '@/hooks/useKnowledgeAutomation';

interface KnowledgeAutomationDashboardProps {
  history: KnowledgeAutomationHistory[];
  stats: KnowledgeAutomationStats;
  loading: boolean;
}

export const KnowledgeAutomationDashboard: React.FC<KnowledgeAutomationDashboardProps> = ({
  history,
  stats,
  loading
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'history'>('stats');
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  const filteredHistory = history.filter(item => 
    filterPriority === 'ALL' || item.decision.priority === filterPriority
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              🤖 ナレッジ自動化ダッシュボード
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              タスク完了時の自動ナレッジ生成の実行状況と統計
            </p>
          </div>
          
          {/* タブ切り替え */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📊 統計
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📝 履歴
            </button>
          </div>
        </div>
      </div>

      {/* 統計タブ */}
      {activeTab === 'stats' && (
        <div className="p-6">
          {/* 統計カード */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-blue-600 font-medium">処理済みタスク</div>
                  <div className="text-2xl font-bold text-blue-900">{stats.totalProcessedTasks}</div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-green-600 font-medium">生成ナレッジ</div>
                  <div className="text-2xl font-bold text-green-900">{stats.generatedKnowledgeCount}</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-yellow-600 font-medium">自動化率</div>
                  <div className="text-2xl font-bold text-yellow-900">{stats.automationRate}%</div>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-purple-600 font-medium">節約時間</div>
                  <div className="text-2xl font-bold text-purple-900">{stats.timesSaved}分</div>
                </div>
              </div>
            </div>
          </div>

          {/* 品質スコア */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">平均品質スコア</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${stats.averageQualityScore * 10}%` }}
                ></div>
              </div>
              <div className="text-xl font-bold text-gray-900">
                {stats.averageQualityScore.toFixed(1)}/10
              </div>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              生成されたナレッジの平均品質評価スコア
            </div>
          </div>
        </div>
      )}

      {/* 履歴タブ */}
      {activeTab === 'history' && (
        <div className="p-6">
          {/* フィルター */}
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm font-medium text-gray-700">優先度でフィルター:</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">すべて</option>
              <option value="HIGH">高価値</option>
              <option value="MEDIUM">中価値</option>
              <option value="LOW">低価値</option>
            </select>
          </div>

          {/* 履歴リスト */}
          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-gray-500">自動化履歴がありません</div>
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* ヘッダー */}
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{item.taskTitle}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(item.decision.priority)}`}>
                          {item.decision.priority}
                        </span>
                        {item.decision.shouldGenerate && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            生成済み
                          </span>
                        )}
                      </div>

                      {/* 詳細情報 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">提案タイトル:</div>
                          <div className="text-gray-900 font-medium">{item.decision.suggestedTitle}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">価値スコア:</div>
                          <div className="text-gray-900 font-medium">{item.decision.estimatedValue}/10</div>
                        </div>
                        {item.generatedKnowledge && (
                          <>
                            <div>
                              <div className="text-gray-600">生成ナレッジ:</div>
                              <div className="text-blue-600 font-medium">{item.generatedKnowledge.title}</div>
                            </div>
                            <div>
                              <div className="text-gray-600">品質スコア:</div>
                              <div className="text-gray-900 font-medium">{item.generatedKnowledge.valueScore}/10</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* メタ情報 */}
                    <div className="text-right text-xs text-gray-500">
                      <div>{new Date(item.createdAt).toLocaleDateString('ja-JP')}</div>
                      <div>{formatProcessingTime(item.processingTime)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeAutomationDashboard;