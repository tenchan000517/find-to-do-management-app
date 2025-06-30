'use client';

import { useState, useEffect } from 'react';
import { Brain, Users, Sparkles, Target, TrendingUp, Info } from 'lucide-react';
import Select from 'react-select';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';

interface MBTIProfile {
  userId: string;
  userName: string;
  mbtiType: string;
  strengths: string[];
  growthAreas: string[];
  workingStyle: {
    focus: string;
    collaboration: string;
    decisionMaking: string;
  };
  compatibility: {
    bestWith: string[];
    challengingWith: string[];
  };
}

interface TeamAnalysis {
  teamId: string;
  teamName: string;
  members: Array<{
    userId: string;
    userName: string;
    mbtiType: string;
  }>;
  balance: {
    category: string;
    score: number;
  }[];
  overallScore: number;
  recommendations: string[];
}

interface OptimizationRequest {
  projectType: string;
  requiredRoles: string[];
  teamSize: number;
  availableMembers: string[];
}

const mbtiOptions = [
  { value: 'INTJ', label: 'INTJ - 建築家' },
  { value: 'INTP', label: 'INTP - 論理学者' },
  { value: 'ENTJ', label: 'ENTJ - 指揮官' },
  { value: 'ENTP', label: 'ENTP - 討論者' },
  { value: 'INFJ', label: 'INFJ - 提唱者' },
  { value: 'INFP', label: 'INFP - 仲介者' },
  { value: 'ENFJ', label: 'ENFJ - 主人公' },
  { value: 'ENFP', label: 'ENFP - 運動家' },
  { value: 'ISTJ', label: 'ISTJ - 管理者' },
  { value: 'ISFJ', label: 'ISFJ - 擁護者' },
  { value: 'ESTJ', label: 'ESTJ - 幹部' },
  { value: 'ESFJ', label: 'ESFJ - 領事' },
  { value: 'ISTP', label: 'ISTP - 巨匠' },
  { value: 'ISFP', label: 'ISFP - 冒険家' },
  { value: 'ESTP', label: 'ESTP - 起業家' },
  { value: 'ESFP', label: 'ESFP - エンターテイナー' },
];

const projectTypeOptions = [
  { value: 'development', label: 'ソフトウェア開発' },
  { value: 'design', label: 'デザイン・クリエイティブ' },
  { value: 'marketing', label: 'マーケティング' },
  { value: 'sales', label: '営業・セールス' },
  { value: 'research', label: '研究・分析' },
  { value: 'management', label: 'プロジェクト管理' }
];

export default function MBTIPage() {
  const [activeTab, setActiveTab] = useState<'individual' | 'team' | 'optimization'>('individual');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [memberProfile, setMemberProfile] = useState<MBTIProfile | null>(null);
  const [teamAnalysis, setTeamAnalysis] = useState<TeamAnalysis | null>(null);
  const [members, setMembers] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);
  
  // チーム最適化用の状態
  const [projectType, setProjectType] = useState('');
  const [teamSize, setTeamSize] = useState(4);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setMembers(data.map((user: any) => ({
          value: user.id,
          label: `${user.name} ${user.mbtiType ? `(${user.mbtiType})` : ''}`
        })));
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const loadMemberProfile = async (memberId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/mbti/individual/${memberId}`);
      if (response.ok) {
        const data = await response.json();
        setMemberProfile(data.data);
      }
    } catch (error) {
      console.error('Failed to load member profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeTeam = async (memberIds: string[]) => {
    try {
      setLoading(true);
      const response = await fetch('/api/mbti/team-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds })
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeamAnalysis(data.data);
      }
    } catch (error) {
      console.error('Team analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const optimizeTeam = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mbti/team-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: `project-${Date.now()}`,
          projectType,
          requiredRoles: getRequiredRoles(projectType),
          teamSize,
          availableMembers: selectedMembers
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setOptimizationResult(data.data);
      }
    } catch (error) {
      console.error('Team optimization failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRequiredRoles = (type: string): string[] => {
    const roleMap: Record<string, string[]> = {
      development: ['エンジニア', 'デザイナー', 'プロダクトマネージャー'],
      design: ['デザイナー', 'クリエイティブディレクター', 'コピーライター'],
      marketing: ['マーケター', 'アナリスト', 'コンテンツクリエイター'],
      sales: ['セールス', 'カスタマーサクセス', 'マーケター'],
      research: ['リサーチャー', 'アナリスト', 'エンジニア'],
      management: ['プロジェクトマネージャー', 'スクラムマスター', 'プロダクトオーナー']
    };
    return roleMap[type] || [];
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 8) return '#10b981';
    if (score >= 6) return '#3b82f6';
    if (score >= 4) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">MBTI分析ダッシュボード</h1>
        <p className="text-gray-600">パーソナリティタイプによるチーム最適化</p>
      </div>

      {/* タブナビゲーション */}
      <div className="flex border-b mb-8">
        <button
          onClick={() => setActiveTab('individual')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'individual'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Brain className="w-4 h-4 mr-2 inline" />
          個人分析
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'team'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4 mr-2 inline" />
          チーム相性分析
        </button>
        <button
          onClick={() => setActiveTab('optimization')}
          className={`px-6 py-3 font-medium ${
            activeTab === 'optimization'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles className="w-4 h-4 mr-2 inline" />
          チーム最適化
        </button>
      </div>

      {/* 個人分析タブ */}
      {activeTab === 'individual' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">メンバー選択</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                value={members.find(m => m.value === selectedMember)}
                onChange={(option) => {
                  setSelectedMember(option?.value || '');
                  if (option?.value) loadMemberProfile(option.value);
                }}
                options={members}
                placeholder="メンバーを選択..."
                isClearable
              />
            </div>
          </div>

          {memberProfile && (
            <>
              {/* プロファイル概要 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{memberProfile.userName}</h3>
                    <p className="text-lg text-blue-600 mt-1">{memberProfile.mbtiType}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Brain className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">作業スタイル</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-600">集中：</span> {memberProfile.workingStyle.focus}</p>
                      <p><span className="text-gray-600">協働：</span> {memberProfile.workingStyle.collaboration}</p>
                      <p><span className="text-gray-600">意思決定：</span> {memberProfile.workingStyle.decisionMaking}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">強み</h4>
                    <ul className="space-y-1 text-sm">
                      {memberProfile.strengths.map((strength, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">成長エリア</h4>
                    <ul className="space-y-1 text-sm">
                      {memberProfile.growthAreas.map((area, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 相性情報 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">相性情報</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-green-700 mb-3">相性の良いタイプ</h4>
                    <div className="space-y-2">
                      {memberProfile.compatibility.bestWith.map((type, index) => (
                        <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded">
                          <span className="font-medium">{type}</span>
                          <span className="text-xs text-green-600">高相性</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-orange-700 mb-3">注意が必要なタイプ</h4>
                    <div className="space-y-2">
                      {memberProfile.compatibility.challengingWith.map((type, index) => (
                        <div key={index} className="flex items-center justify-between bg-orange-50 p-2 rounded">
                          <span className="font-medium">{type}</span>
                          <span className="text-xs text-orange-600">要調整</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* チーム相性分析タブ */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">チームメンバー選択</h3>
            <Select
              isMulti
              value={members.filter(m => selectedMembers.includes(m.value))}
              onChange={(options) => {
                const memberIds = options.map(o => o.value);
                setSelectedMembers(memberIds);
                if (memberIds.length >= 2) analyzeTeam(memberIds);
              }}
              options={members}
              placeholder="分析するメンバーを選択（2名以上）..."
              className="mb-4"
            />
          </div>

          {teamAnalysis && (
            <>
              {/* チームバランス */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">チームバランス</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">総合スコア:</span>
                    <span className={`text-2xl font-bold ${
                      teamAnalysis.overallScore >= 8 ? 'text-green-600' :
                      teamAnalysis.overallScore >= 6 ? 'text-blue-600' :
                      teamAnalysis.overallScore >= 4 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {teamAnalysis.overallScore}/10
                    </span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={teamAnalysis.balance}>
                    <PolarGrid strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={90} domain={[0, 10]} />
                    <Radar name="バランススコア" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* メンバー構成 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">メンバー構成</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {teamAnalysis.members.map((member, index) => (
                    <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium">{member.userName}</p>
                      <p className="text-lg text-blue-600 mt-1">{member.mbtiType}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 推奨事項 */}
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-blue-800">チーム改善の推奨事項</h3>
                <ul className="space-y-2">
                  {teamAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <Info className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-blue-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}

      {/* チーム最適化タブ */}
      {activeTab === 'optimization' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">プロジェクト情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プロジェクトタイプ
                </label>
                <Select
                  value={projectTypeOptions.find(o => o.value === projectType)}
                  onChange={(option) => setProjectType(option?.value || '')}
                  options={projectTypeOptions}
                  placeholder="プロジェクトタイプを選択..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  チームサイズ
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={teamSize}
                  onChange={(e) => setTeamSize(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                候補メンバー
              </label>
              <Select
                isMulti
                value={members.filter(m => selectedMembers.includes(m.value))}
                onChange={(options) => setSelectedMembers(options.map(o => o.value))}
                options={members}
                placeholder="チーム編成の候補メンバーを選択..."
              />
            </div>

            <button
              onClick={optimizeTeam}
              disabled={!projectType || selectedMembers.length < teamSize || loading}
              className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '最適化中...' : '最適なチーム編成を提案'}
            </button>
          </div>

          {optimizationResult && (
            <>
              {/* 推奨チーム構成 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">推奨チーム構成</h3>
                <div className="space-y-4">
                  {optimizationResult.recommendedTeam.map((member: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-semibold">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-600">{member.mbtiType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-purple-600">{member.role}</p>
                        <p className="text-xs text-gray-600">適合度: {member.fitScore}%</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-purple-800">チーム相性スコア</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {optimizationResult.teamScore}/10
                    </span>
                  </div>
                </div>
              </div>

              {/* 最適化の根拠 */}
              <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-green-800">最適化の根拠</h3>
                <ul className="space-y-2">
                  {optimizationResult.reasons.map((reason: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <Target className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-green-700">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}