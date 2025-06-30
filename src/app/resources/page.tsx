'use client';

import { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertCircle, RefreshCw, UserCheck, Clock, Activity } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface MemberResource {
  id: string;
  name: string;
  email: string;
  mbtiType?: string;
  weeklyCommitHours: number;
  currentLoad: number;
  skills: {
    engineering: number;
    sales: number;
    creative: number;
    marketing: number;
    management: number;
    pr: number;
  };
  activeProjects: number;
  activeTasks: number;
}

interface OptimizationRecommendation {
  memberId: string;
  memberName: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
}

export default function ResourcesPage() {
  const [members, setMembers] = useState<MemberResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [filter, setFilter] = useState<'all' | 'overloaded' | 'available'>('all');

  useEffect(() => {
    loadMemberResources();
  }, []);

  const loadMemberResources = async () => {
    try {
      setLoading(true);
      // 全メンバーのリソース情報を取得
      const response = await fetch('/api/student-resources');
      if (response.ok) {
        const data = await response.json();
        setMembers(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load member resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const optimizeResources = async () => {
    try {
      setOptimizing(true);
      const response = await fetch('/api/student-resources/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUtilization: 70,
          priorityFactors: ['skill_match', 'workload_balance', 'mbti_compatibility']
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.data.recommendations || []);
      }
    } catch (error) {
      console.error('Resource optimization failed:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const filteredMembers = members.filter(member => {
    if (filter === 'overloaded') return member.currentLoad > 80;
    if (filter === 'available') return member.currentLoad < 50;
    return true;
  });

  const getLoadColor = (load: number) => {
    if (load > 80) return '#ef4444';
    if (load > 60) return '#f59e0b';
    return '#10b981';
  };

  const getLoadStatus = (load: number) => {
    if (load > 80) return '過負荷';
    if (load > 60) return '高負荷';
    if (load > 40) return '適正';
    return '余裕あり';
  };

  // 負荷分布データ
  const loadDistribution = [
    { name: '余裕あり', value: members.filter(m => m.currentLoad < 40).length, color: '#10b981' },
    { name: '適正', value: members.filter(m => m.currentLoad >= 40 && m.currentLoad < 60).length, color: '#3b82f6' },
    { name: '高負荷', value: members.filter(m => m.currentLoad >= 60 && m.currentLoad < 80).length, color: '#f59e0b' },
    { name: '過負荷', value: members.filter(m => m.currentLoad >= 80).length, color: '#ef4444' }
  ];

  // スキル別平均負荷
  const skillLoadData = ['engineering', 'sales', 'creative', 'marketing', 'management', 'pr'].map(skill => {
    const skillMembers = members.filter(m => m.skills[skill as keyof typeof m.skills] >= 7);
    const avgLoad = skillMembers.length > 0 
      ? skillMembers.reduce((sum, m) => sum + m.currentLoad, 0) / skillMembers.length 
      : 0;
    return {
      skill: getSkillLabel(skill),
      avgLoad: Math.round(avgLoad),
      members: skillMembers.length
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-lg md:text-2xl font-bold mb-2">メンバーリソース管理</h1>
        <p className="text-gray-600">チームメンバーの作業負荷と最適化</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold">{members.length}</span>
          </div>
          <h3 className="text-gray-600">総メンバー数</h3>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold">
              {Math.round(members.reduce((sum, m) => sum + m.currentLoad, 0) / members.length)}%
            </span>
          </div>
          <h3 className="text-gray-600">平均負荷率</h3>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <span className="text-2xl font-bold">
              {members.filter(m => m.currentLoad > 80).length}
            </span>
          </div>
          <h3 className="text-gray-600">過負荷メンバー</h3>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <UserCheck className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold">
              {members.filter(m => m.currentLoad < 50).length}
            </span>
          </div>
          <h3 className="text-gray-600">余裕ありメンバー</h3>
        </div>
      </div>

      {/* チャートセクション */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 負荷分布チャート */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">負荷分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={loadDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}人`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {loadDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* スキル別平均負荷 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">スキル別平均負荷</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skillLoadData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="skill" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgLoad" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* フィルターと最適化ボタン */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全員
          </button>
          <button
            onClick={() => setFilter('overloaded')}
            className={`px-4 py-2 rounded-md ${
              filter === 'overloaded' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            過負荷
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-4 py-2 rounded-md ${
              filter === 'available' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            余裕あり
          </button>
        </div>

        <button
          onClick={optimizeResources}
          disabled={optimizing}
          className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${optimizing ? 'animate-spin' : ''}`} />
          <span>リソース最適化</span>
        </button>
      </div>

      {/* 最適化推奨事項 */}
      {recommendations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-4 text-yellow-800">最適化推奨事項</h3>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  rec.priority === 'high' ? 'bg-red-500' :
                  rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {rec.memberName}: {rec.action}
                  </p>
                  <p className="text-xs text-gray-600">{rec.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* メンバーリスト */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">メンバー一覧</h3>
        </div>
        <div className="divide-y">
          {filteredMembers.map(member => (
            <div
              key={member.id}
              className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-gray-600">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium">{member.name}</h4>
                    <p className="text-sm text-gray-600">
                      {member.mbtiType || 'MBTI未設定'} • {member.weeklyCommitHours}時間/週
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">プロジェクト</p>
                    <p className="text-lg font-semibold">{member.activeProjects}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">タスク</p>
                    <p className="text-lg font-semibold">{member.activeTasks}</p>
                  </div>
                  <div className="w-20 h-20">
                    <CircularProgressbar
                      value={member.currentLoad}
                      text={`${member.currentLoad}%`}
                      styles={buildStyles({
                        textSize: '20px',
                        textColor: getLoadColor(member.currentLoad),
                        pathColor: getLoadColor(member.currentLoad),
                        trailColor: '#e5e7eb'
                      })}
                    />
                  </div>
                  <div className="text-center w-20">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      member.currentLoad > 80 ? 'bg-red-100 text-red-800' :
                      member.currentLoad > 60 ? 'bg-yellow-100 text-yellow-800' :
                      member.currentLoad > 40 ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {getLoadStatus(member.currentLoad)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 詳細情報（展開時） */}
              {selectedMember === member.id && (
                <div className="mt-6 pt-6 border-t">
                  <h5 className="font-medium mb-3">スキル評価</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(member.skills).map(([skill, level]) => (
                      <div key={skill} className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600 w-24">
                          {getSkillLabel(skill)}
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${level * 10}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getSkillLabel(skill: string): string {
  const labels: Record<string, string> = {
    engineering: 'エンジニアリング',
    sales: '営業',
    creative: 'クリエイティブ',
    marketing: 'マーケティング',
    management: 'マネジメント',
    pr: '広報・PR'
  };
  return labels[skill] || skill;
}