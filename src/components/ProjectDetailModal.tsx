'use client';

import { useState } from 'react';
import { Project, User } from '@/lib/types';
import ProjectLeadershipTab from './ProjectLeadershipTab';

interface ProjectDetailModalProps {
  project: Project;
  users: User[];
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectDetailModal({ 
  project, 
  users, 
  isOpen, 
  onClose 
}: ProjectDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'leadership' | 'analytics'>('overview');
  const [loading, setLoading] = useState(false);

  const handleLeaderChange = async (projectId: string, newLeaderId: string, reason?: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/leadership-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newLeaderId, reason })
      });

      if (!response.ok) {
        throw new Error('Failed to change leader');
      }

      // プロジェクト情報を更新（簡易実装）
      window.location.reload(); // 実際の実装では、プロジェクトデータの状態更新を行う
    } catch (error) {
      console.error('Failed to change leader:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const statusColors = {
    planning: 'bg-gray-100 text-gray-800',
    active: 'bg-blue-100 text-blue-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
  };

  const statusText = {
    planning: '企画中',
    active: '進行中',
    on_hold: '保留中',
    completed: '完了',
  };

  const priorityColors = {
    A: 'bg-red-100 text-red-800',
    B: 'bg-yellow-100 text-yellow-800',
    C: 'bg-orange-100 text-orange-800',
    D: 'bg-green-100 text-green-800',
  };

  const priorityText = {
    A: '緊急・重要',
    B: '緊急・重要でない',
    C: '緊急でない・重要',
    D: '緊急でない・重要でない',
  };

  const teamMembers = users.filter(user => project.teamMembers.includes(user.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">{project.name}</h2>
            <p className="text-gray-600 mt-1">プロジェクト詳細</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 text-xl"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* タブナビゲーション */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'overview' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📊 概要
          </button>
          <button
            onClick={() => setActiveTab('leadership')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'leadership' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            👑 リーダーシップ
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'analytics' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📈 分析
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* 概要タブ */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* プロジェクト基本情報 */}
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">基本情報</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          プロジェクト名
                        </label>
                        <div className="text-lg font-medium">{project.name}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ステータス
                        </label>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[project.status]}`}>
                          {statusText[project.status]}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          優先度
                        </label>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityColors[project.priority]}`}>
                          {priorityText[project.priority]}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          進捗率
                        </label>
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{project.progress}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        説明
                      </label>
                      <p className="text-gray-600">{project.description || '説明なし'}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          開始日
                        </label>
                        <div>{new Date(project.startDate).toLocaleDateString('ja-JP')}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          終了予定日
                        </label>
                        <div>
                          {project.endDate 
                            ? new Date(project.endDate).toLocaleDateString('ja-JP')
                            : '未設定'
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* チームメンバー */}
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">チームメンバー ({teamMembers.length}名)</h3>
                    {teamMembers.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teamMembers.map((member, index) => (
                          <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                              style={{ backgroundColor: member.color }}
                            >
                              {member.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{member.name}</div>
                              <div className="text-sm text-gray-600">
                                {index === 0 ? 'リーダー' : 'メンバー'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-4">
                        チームメンバーが設定されていません
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* リーダーシップタブ */}
              {activeTab === 'leadership' && (
                <ProjectLeadershipTab
                  project={project}
                  users={users}
                  onLeaderChange={handleLeaderChange}
                />
              )}

              {/* 分析タブ */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">AI分析結果</h3>
                    <p className="text-sm text-gray-600">
                      このプロジェクトのAI分析データを表示します。Phase 3で実装済みの分析APIを活用。
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-medium mb-2">成功確率</h4>
                      <div className="text-2xl font-bold text-green-600">
                        {project.successProbability ? `${(project.successProbability * 100).toFixed(1)}%` : '未計算'}
                      </div>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-medium mb-2">活動スコア</h4>
                      <div className="text-2xl font-bold text-blue-600">
                        {project.activityScore ? project.activityScore.toFixed(1) : '未計算'}
                      </div>
                    </div>
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-medium mb-2">関係性強度</h4>
                      <div className="text-2xl font-bold text-purple-600">
                        {project.connectionPower ? project.connectionPower.toFixed(1) : '未計算'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="font-medium mb-4">プロジェクト詳細指標</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>フェーズ:</span>
                        <span className="font-medium">{project.phase || '未設定'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>KGI:</span>
                        <span className="font-medium">{project.kgi || '未設定'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>最終活動日:</span>
                        <span className="font-medium">
                          {project.lastActivityDate 
                            ? new Date(project.lastActivityDate).toLocaleDateString('ja-JP')
                            : '記録なし'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>フェーズ変更日:</span>
                        <span className="font-medium">
                          {project.phaseChangeDate 
                            ? new Date(project.phaseChangeDate).toLocaleDateString('ja-JP')
                            : '記録なし'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* フッター */}
        <div className="flex justify-end items-center p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}