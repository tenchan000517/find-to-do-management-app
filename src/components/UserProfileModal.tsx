'use client';

import { useState, useEffect } from 'react';
import { User, UserSkills, UserPreferences, WorkStyle } from '@/lib/types';
import { Target, Briefcase, Wrench } from 'lucide-react';

interface UserProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: Partial<User>) => Promise<void>;
  onDataRefresh?: () => void;
}

export default function UserProfileModal({ user, isOpen, onClose, onSave, onDataRefresh }: UserProfileModalProps) {
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
      
      // データの再読み込みを実行
      onDataRefresh?.();
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
    <div className="fixed inset-0 bg-gray-700/80 flex items-center justify-center z-50">
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
            <Target className="w-4 h-4 mr-2 inline" />
            スキル評価
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
            <Briefcase className="w-4 h-4 mr-2 inline" />
            作業スタイル
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
                    <h4 className="font-medium mb-3">
                      <Target className="w-4 h-4 mr-2 inline" />
                      目標・注力分野
                    </h4>
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
                      <label className="block text-sm font-medium mb-2">
                        <Wrench className="w-4 h-4 mr-2 inline" />
                        改善したい領域
                      </label>
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