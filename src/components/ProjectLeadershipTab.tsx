'use client';

import { useState, useEffect } from 'react';
import { Project, User } from '@/lib/types';
import { RefreshCw, Lightbulb, BarChart3 } from 'lucide-react';

interface ProjectLeadershipTabProps {
  project: Project;
  users: User[];
  onLeaderChange: (projectId: string, newLeaderId: string, reason?: string) => Promise<void>;
}

interface LeadershipLog {
  id: string;
  fromLeader?: string;
  toLeader: string;
  reason?: string;
  timestamp: string;
}

export default function ProjectLeadershipTab({ 
  project, 
  users,
  onLeaderChange 
}: ProjectLeadershipTabProps) {
  const [currentLeader, setCurrentLeader] = useState<User | null>(null);
  const [selectedNewLeader, setSelectedNewLeader] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [leadershipHistory, setLeadershipHistory] = useState<LeadershipLog[]>([]);
  const [loading, setLoading] = useState(false);

  // 現在のマネージャーを特定
  useEffect(() => {
    // 担当者システムを使用してプロジェクトマネージャーを特定
    let manager = null;
    if (project.manager) {
      manager = project.manager;
    } else if (project.assignedTo) {
      manager = users.find(u => u.id === project.assignedTo) || null;
    } else if (project.teamMembers.length > 0) {
      // フォールバック: 最初のメンバーをマネージャーとして扱う
      manager = users.find(u => u.id === project.teamMembers[0]) || null;
    }
    setCurrentLeader(manager);
  }, [project, users]);

  // リーダーシップ履歴読み込み
  useEffect(() => {
    loadLeadershipHistory();
  }, [project.id]);

  const loadLeadershipHistory = async () => {
    try {
      const response = await fetch(`/api/projects/${project.id}/leadership-history`);
      if (response.ok) {
        const history = await response.json();
        setLeadershipHistory(history);
      }
    } catch (error) {
      console.error('Failed to load leadership history:', error);
    }
  };

  const handleLeaderTransfer = async () => {
    if (!selectedNewLeader) return;
    
    try {
      setLoading(true);
      await onLeaderChange(project.id, selectedNewLeader, transferReason);
      
      // 履歴を更新
      await loadLeadershipHistory();
      
      setShowTransferModal(false);
      setSelectedNewLeader('');
      setTransferReason('');
      
      // 現在のリーダーを更新
      const newLeader = users.find(u => u.id === selectedNewLeader);
      setCurrentLeader(newLeader || null);
    } catch (error) {
      console.error('Failed to transfer leadership:', error);
      alert('リーダー変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getLeadershipScore = (user: User): number => {
    const skills = user.skills || { management: 5, engineering: 5, sales: 5, creative: 5, marketing: 5, pr: 5 };
    const management = skills.management || 5;
    
    // 経験値計算（アカウント作成からの月数）
    const accountAge = user.createdAt ? 
      Math.min(5, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))) : 0;
    
    // 総合スコア（最大15点）
    return Math.min(15, management + accountAge);
  };

  const recommendedLeaders = users
    .filter(u => u.id !== currentLeader?.id && project.teamMembers.includes(u.id))
    .sort((a, b) => getLeadershipScore(b) - getLeadershipScore(a))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 現在のリーダー情報 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          👑 現在のプロジェクトマネージャー
        </h3>
        {currentLeader ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: currentLeader.color }}
              >
                {currentLeader.name.charAt(0)}
              </div>
              <div>
                <div className="font-medium text-lg">{currentLeader.name}</div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>マネジメントスキル: {currentLeader.skills?.management || 5}/10</div>
                  <div>リーダーシップスコア: {getLeadershipScore(currentLeader)}/15</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">就任日</div>
              <div className="font-medium">
                {leadershipHistory.length > 0 
                  ? new Date(leadershipHistory[0].timestamp).toLocaleDateString('ja-JP')
                  : '設定なし'
                }
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-600 text-center py-4">
            プロジェクトマネージャーが設定されていません
          </div>
        )}
      </div>

      {/* カンバン操作権限 */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          🎛️ カンバン操作権限
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex items-center">
              <span className="font-medium">タスク移動権限</span>
              <span className="ml-2 text-sm text-gray-500">（カラム間の移動）</span>
            </div>
            <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
              マネージャーのみ
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex items-center">
              <span className="font-medium">ステータス変更権限</span>
              <span className="ml-2 text-sm text-gray-500">（進行状況の更新）</span>
            </div>
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              全メンバー
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex items-center">
              <span className="font-medium">担当者変更権限</span>
              <span className="ml-2 text-sm text-gray-500">（アサイン変更）</span>
            </div>
            <span className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
              マネージャー + 本人
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex items-center">
              <span className="font-medium">プロジェクト設定変更</span>
              <span className="ml-2 text-sm text-gray-500">（基本情報の編集）</span>
            </div>
            <span className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full">
              マネージャーのみ
            </span>
          </div>
        </div>
      </div>

      {/* リーダー変更ボタン */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowTransferModal(true)}
          className="bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>マネージャーを変更</span>
        </button>
      </div>

      {/* リーダー推奨候補 */}
      {recommendedLeaders.length > 0 && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Lightbulb className="w-4 h-4 mr-2 inline" />
            推奨マネージャー候補
          </h3>
          <div className="space-y-3">
            {recommendedLeaders.map(user => (
              <div key={user.id} className="flex items-center justify-between bg-white p-4 rounded-md border">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-600">
                      スコア: {getLeadershipScore(user)}/15 
                      （管理: {user.skills?.management || 5}, 経験: +{Math.min(5, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)))}）
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedNewLeader(user.id);
                    setShowTransferModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 border border-blue-300 rounded hover:bg-blue-50"
                >
                  選択
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* リーダーシップ履歴 */}
      {leadershipHistory.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            <BarChart3 className="w-4 h-4 mr-2 inline" />
            リーダーシップ履歴
          </h3>
          <div className="space-y-3">
            {leadershipHistory.slice(0, 5).map((log, index) => (
              <div key={log.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-500">
                  {new Date(log.timestamp).toLocaleDateString('ja-JP')}
                </div>
                <div className="flex-1">
                  <span className="font-medium">
                    {users.find(u => u.id === log.toLeader)?.name || '不明'} がマネージャーに就任
                  </span>
                  {log.reason && (
                    <div className="text-sm text-gray-600 mt-1">理由: {log.reason}</div>
                  )}
                </div>
                {index === 0 && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">現在</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* リーダー変更モーダル */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">マネージャー変更</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">新しいマネージャー</label>
                <select
                  value={selectedNewLeader}
                  onChange={(e) => setSelectedNewLeader(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">選択してください</option>
                  {users
                    .filter(u => u.id !== currentLeader?.id && project.teamMembers.includes(u.id))
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} (スコア: {getLeadershipScore(user)}/15)
                      </option>
                    ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">変更理由 (任意)</label>
                <textarea
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="巻き取り、専門性向上、負荷分散等..."
                  className="w-full p-2 border rounded-md h-20 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowTransferModal(false)}
                disabled={loading}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleLeaderTransfer}
                disabled={!selectedNewLeader || loading}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                変更実行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}