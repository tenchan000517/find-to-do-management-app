# Phase 5: UI/UX強化 - 実装ガイド

**実装期間:** 3週間  
**目標:** 操作コスト最小化のUI実装  
**前提条件:** Phase 4完了、アラートシステム動作確認済み

---

## 🎯 Phase 5の実装目標

1. **ユーザープロファイル設定UI** - スキル・QOL・志向性管理
2. **プロジェクトリーダー移行機能** - カンバン操作権限管理
3. **アラート・通知管理UI** - 統合通知センター
4. **プロジェクト昇華候補管理** - AI判定による自動提案
5. **AI分析結果ダッシュボード** - 成功確率・リソース可視化

---

## 📋 Phase 5開始前チェックリスト

- [ ] Phase 4完了確認: `docs/PHASE4_ALERT_SYSTEM.md` チェックリスト✅
- [ ] アラートシステム動作確認: `AlertEngine`, `NotificationService` テスト
- [ ] AI評価API動作確認: `/api/ai/evaluate` 全機能テスト
- [ ] 既存UI動作確認: 全ページ・Kanban正常動作
- [ ] プロファイルAPI確認: `GET/PUT /api/users/[id]/profile`

---

## 👤 ユーザープロファイル設定UI

### **5.1 プロファイル設定モーダル**

**src/components/UserProfileModal.tsx（新規作成）:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { User, UserSkills, UserPreferences, WorkStyle } from '@/lib/types';

interface UserProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: Partial<User>) => Promise<void>;
}

export default function UserProfileModal({ user, isOpen, onClose, onSave }: UserProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'skills' | 'preferences' | 'workstyle'>('skills');
  
  const [skills, setSkills] = useState<UserSkills>({
    engineering: 5,
    sales: 5,
    creative: 5,
    marketing: 5,
    management: 5,
    pr: 5
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    qol_weight: 1.0,
    target_areas: [],
    strengths: [],
    weaknesses: []
  });

  const [workStyle, setWorkStyle] = useState<WorkStyle>({
    focus_time: 'morning',
    collaboration_preference: 'medium',
    stress_tolerance: 'medium'
  });

  // プロファイル読み込み
  useEffect(() => {
    if (isOpen && user.id) {
      loadUserProfile();
    }
  }, [isOpen, user.id]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${user.id}/profile`);
      if (response.ok) {
        const profile = await response.json();
        setSkills(profile.skills || skills);
        setPreferences(profile.preferences || preferences);
        setWorkStyle(profile.workStyle || workStyle);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await onSave({ skills, preferences, workStyle });
      onClose();
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('プロファイルの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const validateQOLWeight = (value: number): boolean => {
    return value >= 0.5 && value <= 2.0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">ユーザープロファイル設定</h2>
            <p className="text-gray-600 mt-1">{user.name}さんの詳細設定</p>
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
            onClick={() => setActiveTab('skills')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'skills' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🎯 スキル評価
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'preferences' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚙️ 志向性・QOL
          </button>
          <button
            onClick={() => setActiveTab('workstyle')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'workstyle' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            💼 作業スタイル
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* スキル評価タブ */}
              {activeTab === 'skills' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">スキル評価について</h3>
                    <p className="text-sm text-gray-600">
                      各分野のスキルレベルを1-10で評価してください。この情報はAIがタスクのリソース見積もりを行う際に使用されます。
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(skills).map(([skill, level]) => (
                      <div key={skill} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="block text-sm font-medium text-gray-700">
                            {getSkillLabel(skill)}
                          </label>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-blue-600">{level}</span>
                            <span className="text-xs text-gray-500">/10</span>
                          </div>
                        </div>
                        
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={level}
                          onChange={(e) => setSkills(prev => ({
                            ...prev,
                            [skill]: parseInt(e.target.value)
                          }))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>初心者</span>
                          <span>中級者</span>
                          <span>エキスパート</span>
                        </div>
                        
                        <div className="text-xs text-gray-600">
                          {getSkillDescription(skill, level)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 志向性・QOLタブ */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  {/* QOLウェイト設定 */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-4">QOLウェイト設定</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium">作業負荷耐性</label>
                          <span className="text-lg font-bold text-yellow-600">
                            {preferences.qol_weight.toFixed(1)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.1"
                          value={preferences.qol_weight}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            setPreferences(prev => ({ ...prev, qol_weight: value }));
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>低負荷重視 (0.5)</span>
                          <span>標準 (1.0)</span>
                          <span>高負荷耐性 (2.0)</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          {preferences.qol_weight < 0.8 ? '早期アラート、ワークライフバランス重視' :
                           preferences.qol_weight > 1.5 ? '高負荷対応可能、成果重視' :
                           '標準的な負荷設定'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 目標分野設定 */}
                  <div>
                    <h4 className="font-medium mb-3">🎯 目標・注力分野</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.keys(skills).map(area => (
                        <label key={area} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.target_areas.includes(area)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPreferences(prev => ({
                                  ...prev,
                                  target_areas: [...prev.target_areas, area]
                                }));
                              } else {
                                setPreferences(prev => ({
                                  ...prev,
                                  target_areas: prev.target_areas.filter(a => a !== area)
                                }));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{getSkillLabel(area)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 強み・弱み */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">💪 強み・得意領域</label>
                      <textarea
                        value={preferences.strengths.join(', ')}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          strengths: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        }))}
                        placeholder="コミュニケーション, 問題解決, データ分析..."
                        className="w-full p-3 border rounded-md h-24 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">🔧 改善したい領域</label>
                      <textarea
                        value={preferences.weaknesses.join(', ')}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          weaknesses: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        }))}
                        placeholder="プレゼンテーション, 時間管理, 技術知識..."
                        className="w-full p-3 border rounded-md h-24 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 作業スタイルタブ */}
              {activeTab === 'workstyle' && (
                <div className="space-y-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">作業スタイル設定</h3>
                    <p className="text-sm text-gray-600">
                      あなたの最適な作業パターンを設定してください。AIがタスクの割り当てタイミングを最適化します。
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-3">⏰ 最も集中できる時間帯</label>
                      <div className="space-y-2">
                        {[
                          { value: 'morning', label: '朝型 (6:00-12:00)', desc: '朝の時間が最も生産的' },
                          { value: 'afternoon', label: '午後型 (12:00-18:00)', desc: '午後に集中力がピーク' },
                          { value: 'evening', label: '夕方型 (18:00-22:00)', desc: '夕方以降が集中時間' },
                          { value: 'night', label: '夜型 (22:00-6:00)', desc: '深夜・早朝が最適' }
                        ].map(option => (
                          <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="radio"
                              name="focus_time"
                              value={option.value}
                              checked={workStyle.focus_time === option.value}
                              onChange={(e) => setWorkStyle(prev => ({
                                ...prev,
                                focus_time: e.target.value as any
                              }))}
                              className="mt-1"
                            />
                            <div>
                              <div className="text-sm font-medium">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3">🤝 協働の好み</label>
                      <div className="space-y-2">
                        {[
                          { value: 'low', label: '個人作業重視', desc: '一人で集中して作業' },
                          { value: 'medium', label: 'バランス型', desc: '状況に応じて柔軟に' },
                          { value: 'high', label: 'チーム作業重視', desc: '他者との協働を好む' }
                        ].map(option => (
                          <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="radio"
                              name="collaboration"
                              value={option.value}
                              checked={workStyle.collaboration_preference === option.value}
                              onChange={(e) => setWorkStyle(prev => ({
                                ...prev,
                                collaboration_preference: e.target.value as any
                              }))}
                              className="mt-1"
                            />
                            <div>
                              <div className="text-sm font-medium">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3">💪 ストレス耐性</label>
                      <div className="space-y-2">
                        {[
                          { value: 'low', label: '低い', desc: '安定した環境を好む' },
                          { value: 'medium', label: '普通', desc: '適度なプレッシャーは OK' },
                          { value: 'high', label: '高い', desc: '高負荷・変化に強い' }
                        ].map(option => (
                          <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="radio"
                              name="stress_tolerance"
                              value={option.value}
                              checked={workStyle.stress_tolerance === option.value}
                              onChange={(e) => setWorkStyle(prev => ({
                                ...prev,
                                stress_tolerance: e.target.value as any
                              }))}
                              className="mt-1"
                            />
                            <div>
                              <div className="text-sm font-medium">{option.label}</div>
                              <div className="text-xs text-gray-500">{option.desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* フッター */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            設定はリアルタイムでAI分析に反映されます
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !validateQOLWeight(preferences.qol_weight)}
              className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ヘルパー関数
function getSkillLabel(skill: string): string {
  const labels: Record<string, string> = {
    engineering: 'エンジニアリング',
    sales: '営業・セールス',
    creative: 'クリエイティブ',
    marketing: 'マーケティング',
    management: 'マネジメント',
    pr: '広報・PR'
  };
  return labels[skill] || skill;
}

function getSkillDescription(skill: string, level: number): string {
  if (level <= 3) return '基礎的な知識・経験';
  if (level <= 6) return '実務レベルの知識・経験';
  if (level <= 8) return '高度な知識・リーダー経験';
  return 'エキスパートレベル・指導可能';
}
```

### **5.2 プロファイル設定統合Hook**

**src/hooks/useUserProfile.ts（新規作成）:**
```typescript
'use client';

import { useState, useCallback } from 'react';
import { User, UserSkills, UserPreferences, WorkStyle } from '@/lib/types';

export function useUserProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveUserProfile = useCallback(async (
    userId: string, 
    profile: { skills?: UserSkills; preferences?: UserPreferences; workStyle?: WorkStyle }
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/users/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save profile');
      }

      // AI再評価をトリガー
      await triggerAIReevaluation(userId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerAIReevaluation = async (userId: string): Promise<void> => {
    try {
      // ユーザーのタスクを取得してAI再評価
      const tasksResponse = await fetch(`/api/tasks?userId=${userId}`);
      if (tasksResponse.ok) {
        const tasks = await tasksResponse.json();
        
        // 各タスクのリソースウェイトを再計算
        for (const task of tasks) {
          await fetch('/api/ai/evaluate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entityType: 'task',
              entityId: task.id,
              evaluationType: 'resource_weight'
            })
          });
        }
      }
    } catch (error) {
      console.error('AI re-evaluation failed:', error);
      // エラーでも処理は継続
    }
  };

  return {
    saveUserProfile,
    loading,
    error
  };
}
```

---

## 🏛️ プロジェクトリーダー移行機能

### **5.3 リーダーシップ管理コンポーネント**

**src/components/ProjectLeadershipTab.tsx（新規作成）:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { Project, User } from '@/lib/types';

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

  // 現在のリーダーを特定
  useEffect(() => {
    if (project.teamMembers.length > 0) {
      // 最初のメンバーをリーダーとして扱う（簡易実装）
      const leader = users.find(u => u.id === project.teamMembers[0]);
      setCurrentLeader(leader || null);
    }
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
    const skills = user.skills || {};
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
          👑 現在のプロジェクトリーダー
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
            リーダーが設定されていません
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
              リーダーのみ
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
              リーダー + 本人
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex items-center">
              <span className="font-medium">プロジェクト設定変更</span>
              <span className="ml-2 text-sm text-gray-500">（基本情報の編集）</span>
            </div>
            <span className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full">
              リーダーのみ
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
          <span>🔄</span>
          <span>リーダーを変更</span>
        </button>
      </div>

      {/* リーダー推奨候補 */}
      {recommendedLeaders.length > 0 && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            💡 推奨リーダー候補
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
          <h3 className="text-lg font-semibold mb-4">📊 リーダーシップ履歴</h3>
          <div className="space-y-3">
            {leadershipHistory.slice(0, 5).map((log, index) => (
              <div key={log.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-500">
                  {new Date(log.timestamp).toLocaleDateString('ja-JP')}
                </div>
                <div className="flex-1">
                  <span className="font-medium">
                    {users.find(u => u.id === log.toLeader)?.name || '不明'} がリーダーに就任
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
            <h3 className="text-lg font-semibold mb-4">リーダー変更</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">新しいリーダー</label>
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
```

---

## 🔔 アラート・通知管理UI

### **5.4 統合通知センター**

**src/components/NotificationCenter.tsx（新規作成）:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { ProjectAlert, UserAlert } from '@/lib/types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AlertData {
  projectAlerts: ProjectAlert[];
  userAlerts: UserAlert[];
  summary: {
    totalAlerts: number;
    unreadAlerts: number;
    criticalAlerts: number;
  };
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'project' | 'user'>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // アラート読み込み
  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: 'all',
        unreadOnly: showUnreadOnly.toString()
      });
      
      const response = await fetch(`/api/alerts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAlertData(data);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  // アラート操作
  const handleAlertAction = async (alertId: string, type: 'project' | 'user', action: 'mark_read' | 'resolve') => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, type })
      });

      if (response.ok) {
        await loadAlerts(); // リロード
      }
    } catch (error) {
      console.error('Failed to update alert:', error);
    }
  };

  // 手動アラートチェック
  const handleManualCheck = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_all' })
      });

      if (response.ok) {
        await loadAlerts();
      }
    } catch (error) {
      console.error('Failed to run manual check:', error);
    } finally {
      setLoading(false);
    }
  };

  // フィルタリング処理
  const getFilteredAlerts = () => {
    if (!alertData) return { projectAlerts: [], userAlerts: [] };

    let projectAlerts = alertData.projectAlerts;
    let userAlerts = alertData.userAlerts;

    // タブフィルタ
    if (activeTab === 'project') {
      userAlerts = [];
    } else if (activeTab === 'user') {
      projectAlerts = [];
    }

    // 重要度フィルタ
    if (filterSeverity !== 'all') {
      projectAlerts = projectAlerts.filter(a => a.severity === filterSeverity);
      userAlerts = userAlerts.filter(a => a.severity === filterSeverity);
    }

    // 未読フィルタ
    if (showUnreadOnly) {
      projectAlerts = projectAlerts.filter(a => !a.isRead);
      userAlerts = userAlerts.filter(a => !a.isRead);
    }

    return { projectAlerts, userAlerts };
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: 'border-red-500 bg-red-50',
      high: 'border-orange-500 bg-orange-50',
      medium: 'border-yellow-500 bg-yellow-50',
      low: 'border-green-500 bg-green-50'
    };
    return colors[severity as keyof typeof colors] || 'border-gray-300 bg-gray-50';
  };

  const getSeverityEmoji = (severity: string) => {
    const emojis = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
    return emojis[severity as keyof typeof emojis] || '⚪';
  };

  if (!isOpen) return null;

  const filteredAlerts = getFilteredAlerts();
  const allAlerts = [...filteredAlerts.projectAlerts, ...filteredAlerts.userAlerts]
    .sort((a, b) => new Date(b.triggeredAt || b.createdAt).getTime() - new Date(a.triggeredAt || a.createdAt).getTime());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">🔔 通知センター</h2>
            {alertData && (
              <p className="text-gray-600 mt-1">
                全 {alertData.summary.totalAlerts} 件 
                （未読 {alertData.summary.unreadAlerts} 件、
                緊急 {alertData.summary.criticalAlerts} 件）
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleManualCheck}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              🔄 チェック実行
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
              ✕
            </button>
          </div>
        </div>

        {/* フィルタ・タブ */}
        <div className="p-6 border-b space-y-4">
          {/* タブ */}
          <div className="flex space-x-1">
            {[
              { key: 'all', label: '全て', count: alertData?.summary.totalAlerts || 0 },
              { key: 'project', label: 'プロジェクト', count: alertData?.projectAlerts.length || 0 },
              { key: 'user', label: 'ユーザー', count: alertData?.userAlerts.length || 0 }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === tab.key
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* フィルタ */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">重要度:</label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value as any)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="all">全て</option>
                  <option value="critical">🔴 緊急</option>
                  <option value="high">🟠 高</option>
                  <option value="medium">🟡 中</option>
                  <option value="low">🟢 低</option>
                </select>
              </div>
              
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={showUnreadOnly}
                  onChange={(e) => setShowUnreadOnly(e.target.checked)}
                  className="rounded"
                />
                <span>未読のみ</span>
              </label>
            </div>
            
            <div className="text-sm text-gray-500">
              表示: {allAlerts.length} 件
            </div>
          </div>
        </div>

        {/* アラートリスト */}
        <div className="overflow-y-auto max-h-[50vh] p-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : allAlerts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">🎉</div>
              <div className="text-gray-600">該当するアラートはありません</div>
            </div>
          ) : (
            <div className="space-y-3">
              {allAlerts.map(alert => {
                const isProjectAlert = 'projectId' in alert;
                return (
                  <div
                    key={alert.id}
                    className={`border-l-4 p-4 rounded-r-lg ${getSeverityColor(alert.severity)} ${
                      (isProjectAlert ? !(alert as ProjectAlert).isRead : !(alert as UserAlert).isRead)
                        ? 'shadow-md' 
                        : 'opacity-75'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{getSeverityEmoji(alert.severity)}</span>
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            {isProjectAlert ? 'プロジェクト' : 'ユーザー'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(alert.triggeredAt || alert.createdAt).toLocaleString('ja-JP')}
                          </span>
                          {(isProjectAlert ? !(alert as ProjectAlert).isRead : !(alert as UserAlert).isRead) && (
                            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">未読</span>
                          )}
                        </div>
                        
                        <div className="text-sm font-medium mb-1">
                          {alert.message}
                        </div>
                        
                        <div className="text-xs text-gray-600">
                          アラートタイプ: {alert.alertType} | 重要度: {alert.severity}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {(isProjectAlert ? !(alert as ProjectAlert).isRead : !(alert as UserAlert).isRead) && (
                          <button
                            onClick={() => handleAlertAction(
                              alert.id, 
                              isProjectAlert ? 'project' : 'user', 
                              'mark_read'
                            )}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            既読
                          </button>
                        )}
                        
                        {isProjectAlert && !(alert as ProjectAlert).isResolved && (
                          <button
                            onClick={() => handleAlertAction(alert.id, 'project', 'resolve')}
                            className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            解決
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            最終更新: {new Date().toLocaleString('ja-JP')}
          </div>
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
```

---

## ✅ Phase 5完了検証

### **必須チェックリスト:**
- [ ] ユーザープロファイル設定UI実装完了
  - [ ] `UserProfileModal` 全タブ動作確認
  - [ ] スキル評価、QOL設定、作業スタイル設定テスト
  - [ ] プロファイル保存・AI再評価確認
- [ ] プロジェクトリーダー移行機能実装完了
  - [ ] `ProjectLeadershipTab` 権限表示確認
  - [ ] リーダー変更機能テスト
  - [ ] リーダーシップ履歴表示確認
- [ ] 通知センター実装完了
  - [ ] `NotificationCenter` 全機能動作確認
  - [ ] アラートフィルタ・タブ切り替えテスト
  - [ ] アラート操作（既読・解決）テスト
- [ ] 統合UI動作確認
  - [ ] 既存ページからの新UI呼び出し
  - [ ] モーダル・タブ切り替え正常動作
  - [ ] レスポンシブ対応確認
- [ ] 既存機能無影響確認
  - [ ] 全ページ正常動作
  - [ ] Kanban・プロジェクト管理継続動作
  - [ ] AI評価・アラートシステム正常動作

### **Phase 5動作確認方法:**
```bash
# プロファイル設定テスト
# 1. ユーザー一覧からプロファイル設定を開く
# 2. 各タブ（スキル・志向性・作業スタイル）で設定変更
# 3. 保存後、AI再評価が実行されることを確認

# リーダー移行テスト
# 1. プロジェクト詳細からリーダーシップタブを開く
# 2. 推奨候補から新リーダーを選択
# 3. 理由を入力して変更実行
# 4. 履歴に記録されることを確認

# 通知センターテスト
# 1. ヘッダーの通知アイコンをクリック
# 2. 各タブ・フィルタ機能をテスト
# 3. アラートの既読・解決操作をテスト
# 4. 手動チェック実行をテスト
```

### **Phase 5完了報告テンプレート:**
```markdown
## Phase 5実装完了報告

### 実装内容
✅ ユーザープロファイル設定UI: UserProfileModal（3タブ構成、AI連携）
✅ プロジェクトリーダー移行機能: ProjectLeadershipTab（権限管理、履歴追跡）
✅ 統合通知センター: NotificationCenter（フィルタ、操作機能）
✅ カスタムフック: useUserProfile（プロファイル管理、AI再評価）

### 検証結果
✅ プロファイル設定: XX件のユーザープロファイル更新テスト完了
✅ リーダー移行: XX件のリーダー変更・履歴記録テスト完了
✅ 通知管理: XX件のアラート管理・操作テスト完了
✅ UI/UX: 全コンポーネントでレスポンシブ・アクセシビリティ確認

### ユーザビリティ評価
✅ 操作コスト: 平均XX秒でプロファイル設定完了
✅ 直感性: 初回ユーザーでもXX%が迷わず操作完了
✅ モバイル対応: 全機能でタッチ操作最適化確認

### 次Phase準備状況
✅ Phase 6開始準備完了
次回実装: docs/PHASE6_ADVANCED_AUTOMATION.md 参照
```

---

**Phase 5完了後、`docs/PHASE6_ADVANCED_AUTOMATION.md` に進んでください。**