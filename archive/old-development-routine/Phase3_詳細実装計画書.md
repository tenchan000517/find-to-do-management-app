# 📋 Phase 3: 高度統合機能実装 詳細計画書

## 🎯 Phase 3 概要

**期間**: 5週間（25営業日）  
**工数**: 24日  
**担当者**: フルスタックエンジニア 1名 + フロントエンドエンジニア 0.5名  
**開始条件**: Phase 2完了、システム負荷テスト合格、ユーザートレーニング完了  
**完了条件**: 3つの高度統合機能がエンタープライズレベルで稼働すること  

## 📊 Phase 3 目標

### 定量目標
- **人材配置自動化**: 95%精度（AI最適配分）
- **経営判断支援**: 98%精度（予測分析）
- **営業プロセス自動化**: 完全自動化率90%
- **システム完成度**: 90%達成（109API中98個活用）

### 定性目標
- エンタープライズ級システム品質実現
- 完全自動化による業務効率の極大化
- 経営レベルの意思決定支援システム構築
- スケーラブルで拡張性の高いアーキテクチャ完成

## 🚀 実装タスク詳細

### タスク 3.1: 学生リソース完全最適化
**期間**: 8営業日  
**工数**: 8日  
**担当**: フルスタックエンジニア  

#### 📋 要件定義
**機能要件**:
1. 個人スキル・稼働時間管理UI
2. プロジェクトリソース配分最適化
3. 負荷分散自動計算
4. パフォーマンス追跡ダッシュボード

**非機能要件**:
- 最適化計算時間: 10秒以内（大規模データ）
- 配分精度: 95%以上
- リアルタイム負荷監視: 5分間隔

#### 🏗️ 実装詳細

##### Day 1-2: 個人スキル・稼働時間管理UI
**作業内容**:
```typescript
// /src/app/student-resources/page.tsx (拡張)
// /src/app/student-resources/individual/[userId]/page.tsx (新規)
// /src/hooks/useStudentResources.ts (新規)
// /src/components/resources/SkillManagement.tsx (新規)

const useStudentResources = () => {
  const [resources, setResources] = useState([]);
  const [optimization, setOptimization] = useState(null);
  const [workloadAnalysis, setWorkloadAnalysis] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  const fetchResources = useCallback(async () => {
    const response = await fetch('/api/student-resources');
    const data = await response.json();
    setResources(data.resources || []);
  }, []);

  const fetchIndividualResource = useCallback(async (userId: string) => {
    const response = await fetch(`/api/student-resources/load/${userId}`);
    return await response.json();
  }, []);

  const optimizeResourceAllocation = useCallback(async (projectRequirements: any) => {
    const response = await fetch('/api/student-resources/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectRequirements)
    });
    const data = await response.json();
    setOptimization(data);
    return data;
  }, []);

  const fetchWorkloadAnalysis = useCallback(async () => {
    const response = await fetch('/api/student-resources/workload-analysis');
    const data = await response.json();
    setWorkloadAnalysis(data);
  }, []);

  const updateSkillProfile = useCallback(async (userId: string, skills: any) => {
    const response = await fetch(`/api/student-resources/${userId}/skills`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills })
    });
    return await response.json();
  }, []);

  return {
    resources,
    optimization,
    workloadAnalysis,
    performanceMetrics,
    fetchResources,
    fetchIndividualResource,
    optimizeResourceAllocation,
    fetchWorkloadAnalysis,
    updateSkillProfile
  };
};

// /src/components/resources/SkillManagement.tsx
const SkillManagement: React.FC<{ userId: string }> = ({ userId }) => {
  const [skillProfile, setSkillProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempSkills, setTempSkills] = useState({});
  const { updateSkillProfile } = useStudentResources();

  useEffect(() => {
    const fetchSkillProfile = async () => {
      try {
        const response = await fetch(`/api/student-resources/load/${userId}`);
        const data = await response.json();
        setSkillProfile(data.skillProfile);
        setTempSkills(data.skillProfile?.skills || {});
      } catch (error) {
        console.error('Failed to fetch skill profile:', error);
      }
    };
    fetchSkillProfile();
  }, [userId]);

  const handleSave = async () => {
    try {
      await updateSkillProfile(userId, tempSkills);
      setSkillProfile(prev => ({ ...prev, skills: tempSkills }));
      setIsEditing(false);
      toast.success('スキルプロファイルを更新しました');
    } catch (error) {
      toast.error('更新に失敗しました');
    }
  };

  const skillCategories = [
    {
      name: 'フロントエンド',
      skills: ['React', 'Vue.js', 'Angular', 'TypeScript', 'JavaScript', 'CSS', 'HTML']
    },
    {
      name: 'バックエンド', 
      skills: ['Node.js', 'Python', 'Java', 'Go', 'PHP', 'Ruby', 'C#']
    },
    {
      name: 'データベース',
      skills: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch']
    },
    {
      name: 'インフラ・DevOps',
      skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Nginx']
    },
    {
      name: 'AI・機械学習',
      skills: ['Python ML', 'TensorFlow', 'PyTorch', 'Data Science', 'NLP']
    },
    {
      name: 'その他',
      skills: ['UI/UX', 'プロジェクト管理', 'テスト', 'セキュリティ', 'モバイル']
    }
  ];

  const getSkillLevelColor = (level: number) => {
    if (level >= 4) return 'text-green-600 bg-green-100';
    if (level >= 3) return 'text-blue-600 bg-blue-100';
    if (level >= 2) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getSkillLevelText = (level: number) => {
    switch (level) {
      case 5: return '専門家';
      case 4: return '上級';
      case 3: return '中級';
      case 2: return '初級';
      case 1: return '入門';
      default: return '未経験';
    }
  };

  if (!skillProfile) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded"></div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">🛠️ スキルプロファイル</h3>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setTempSkills(skillProfile.skills || {});
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                キャンセル
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              編集
            </button>
          )}
        </div>
      </div>

      {/* 総合スキルレベル */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {skillProfile.overallSkillLevel || 0}/5
          </div>
          <div className="text-sm text-gray-600">総合スキルレベル</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {skillProfile.specializedAreas?.length || 0}
          </div>
          <div className="text-sm text-gray-600">専門領域数</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {skillProfile.experienceYears || 0}年
          </div>
          <div className="text-sm text-gray-600">経験年数</div>
        </div>
      </div>

      {/* スキルカテゴリ別表示 */}
      <div className="space-y-6">
        {skillCategories.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <h4 className="font-medium text-gray-800 mb-3">{category.name}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {category.skills.map((skill, skillIndex) => {
                const currentLevel = tempSkills[skill] || 0;
                return (
                  <div key={skillIndex} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{skill}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSkillLevelColor(currentLevel)}`}>
                        {getSkillLevelText(currentLevel)}
                      </span>
                    </div>
                    
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0"
                          max="5"
                          value={currentLevel}
                          onChange={(e) => setTempSkills(prev => ({
                            ...prev,
                            [skill]: parseInt(e.target.value)
                          }))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>未経験</span>
                          <span>専門家</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            currentLevel >= 4 ? 'bg-green-500' :
                            currentLevel >= 3 ? 'bg-blue-500' :
                            currentLevel >= 2 ? 'bg-yellow-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${(currentLevel / 5) * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 稼働時間管理 */}
      <div className="mt-8 border-t pt-6">
        <h4 className="font-medium text-gray-800 mb-3">⏰ 稼働時間管理</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              週間稼働可能時間
            </label>
            <div className="flex items-center">
              <input
                type="number"
                value={skillProfile.weeklyAvailableHours || 40}
                readOnly={!isEditing}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">時間/週</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              現在の負荷率
            </label>
            <div className="flex items-center">
              <div className="flex-1 bg-gray-200 rounded-full h-4 mr-3">
                <div 
                  className={`h-4 rounded-full ${
                    skillProfile.currentWorkloadPercentage >= 90 ? 'bg-red-500' :
                    skillProfile.currentWorkloadPercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${skillProfile.currentWorkloadPercentage || 0}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">
                {skillProfile.currentWorkloadPercentage || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* 稼働スケジュール */}
        <div className="mt-4">
          <h5 className="font-medium text-sm mb-2">週間稼働スケジュール</h5>
          <div className="grid grid-cols-7 gap-2">
            {['月', '火', '水', '木', '金', '土', '日'].map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-gray-600 mb-1">{day}</div>
                <div className="bg-gray-100 rounded p-2">
                  <div className="text-xs font-medium">
                    {skillProfile.weeklySchedule?.[index]?.hours || 0}h
                  </div>
                  <div className={`text-xs ${
                    skillProfile.weeklySchedule?.[index]?.available ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {skillProfile.weeklySchedule?.[index]?.available ? '稼働可' : '不可'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// /src/app/student-resources/individual/[userId]/page.tsx
const IndividualResourcePage: React.FC<{ params: { userId: string } }> = ({ params }) => {
  const { fetchIndividualResource } = useStudentResources();
  const [resourceData, setResourceData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchIndividualResource(params.userId);
      setResourceData(data);
    };
    loadData();
  }, [params.userId]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">👤 個人リソース管理</h1>
        <p className="text-gray-600 mt-2">
          スキル・稼働時間・パフォーマンス追跡システム
        </p>
      </div>

      <div className="space-y-8">
        <SkillManagement userId={params.userId} />
        
        {resourceData && (
          <>
            <WorkloadAnalysis userId={params.userId} data={resourceData.workload} />
            <PerformanceTracking userId={params.userId} data={resourceData.performance} />
          </>
        )}
      </div>
    </div>
  );
};
```

**完了条件**: 個人スキル管理UIが動作し、稼働時間管理が可能になること

##### Day 3-4: プロジェクトリソース配分最適化
**作業内容**:
```typescript
// /src/components/resources/ResourceOptimization.tsx
const ResourceOptimization: React.FC = () => {
  const { optimization, optimizeResourceAllocation } = useStudentResources();
  const [projectRequirements, setProjectRequirements] = useState({
    projectType: 'WEB_APPLICATION',
    teamSize: 4,
    duration: 12,
    requiredSkills: [],
    difficultyLevel: 3,
    priority: 'MEDIUM',
    budget: 1000000,
    startDate: new Date(),
    specialRequirements: ''
  });
  const [isOptimizing, setIsOptimizing] = useState(false);

  const skillOptions = [
    'React', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Java',
    'PostgreSQL', 'MongoDB', 'AWS', 'Docker', 'AI/ML', 'UI/UX'
  ];

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      await optimizeResourceAllocation(projectRequirements);
      toast.success('最適化が完了しました');
    } catch (error) {
      toast.error('最適化に失敗しました');
    } finally {
      setIsOptimizing(false);
    }
  };

  const getMatchScore = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-8">
      {/* プロジェクト要件入力 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">🎯 プロジェクト要件設定</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プロジェクトタイプ
            </label>
            <select
              value={projectRequirements.projectType}
              onChange={(e) => setProjectRequirements(prev => ({
                ...prev,
                projectType: e.target.value
              }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="WEB_APPLICATION">Webアプリケーション</option>
              <option value="MOBILE_APP">モバイルアプリ</option>
              <option value="API_DEVELOPMENT">API開発</option>
              <option value="DATA_ANALYSIS">データ分析</option>
              <option value="AI_ML_PROJECT">AI/ML プロジェクト</option>
              <option value="INFRASTRUCTURE">インフラ構築</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              チームサイズ
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={projectRequirements.teamSize}
              onChange={(e) => setProjectRequirements(prev => ({
                ...prev,
                teamSize: parseInt(e.target.value)
              }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              期間（週）
            </label>
            <input
              type="number"
              min="1"
              max="52"
              value={projectRequirements.duration}
              onChange={(e) => setProjectRequirements(prev => ({
                ...prev,
                duration: parseInt(e.target.value)
              }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              難易度（1-5）
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={projectRequirements.difficultyLevel}
              onChange={(e) => setProjectRequirements(prev => ({
                ...prev,
                difficultyLevel: parseInt(e.target.value)
              }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>簡単</span>
              <span>難しい</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            必要スキル
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {skillOptions.map(skill => (
              <label key={skill} className="flex items-center">
                <input
                  type="checkbox"
                  checked={projectRequirements.requiredSkills.includes(skill)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setProjectRequirements(prev => ({
                        ...prev,
                        requiredSkills: [...prev.requiredSkills, skill]
                      }));
                    } else {
                      setProjectRequirements(prev => ({
                        ...prev,
                        requiredSkills: prev.requiredSkills.filter(s => s !== skill)
                      }));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm">{skill}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isOptimizing ? '最適化中...' : '🔄 リソース最適化実行'}
          </button>
        </div>
      </div>

      {/* 最適化結果 */}
      {optimization && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">📊 最適化結果</h3>
            <div className="text-sm text-gray-500">
              計算時間: {optimization.calculationTime}ms |
              信頼度: {optimization.confidence}%
            </div>
          </div>

          {/* 総合スコア */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {optimization.overallScore}%
              </div>
              <div className="text-sm text-gray-600">総合適合度</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {optimization.skillCoverage}%
              </div>
              <div className="text-sm text-gray-600">スキルカバー率</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {optimization.workloadBalance}%
              </div>
              <div className="text-sm text-gray-600">負荷バランス</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                ¥{optimization.estimatedCost?.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">予想コスト</div>
            </div>
          </div>

          {/* 推奨チーム構成 */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">👥 推奨チーム構成</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {optimization.recommendedTeam?.map((member, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-semibold">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-600">{member.role}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getMatchScore(member.matchScore).split(' ')[0]}`}>
                        {member.matchScore}%
                      </div>
                      <div className="text-xs text-gray-500">適合度</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">稼働率:</span>
                      <span className="font-medium">{member.allocationPercentage}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">時間/週:</span>
                      <span className="font-medium">{member.hoursPerWeek}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">コスト/月:</span>
                      <span className="font-medium">¥{member.monthlyCost?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-sm text-gray-600 mb-1">主要スキル:</div>
                    <div className="flex flex-wrap gap-1">
                      {member.primarySkills?.slice(0, 3).map((skill, skillIndex) => (
                        <span key={skillIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 代替案 */}
          {optimization.alternatives && optimization.alternatives.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">🔄 代替構成案</h4>
              <div className="space-y-3">
                {optimization.alternatives.map((alt, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">代替案 {index + 1}</div>
                        <div className="text-sm text-gray-600">{alt.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600">{alt.score}%</div>
                        <div className="text-xs text-gray-500">適合度</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="mt-6 flex space-x-3">
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              チーム構成を採用
            </button>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              プロジェクト作成
            </button>
            <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
              レポート出力
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

**完了条件**: プロジェクト要件に基づく最適リソース配分が自動計算されること

##### Day 5-6: 負荷分散自動計算・パフォーマンス追跡ダッシュボード
**作業内容**:
```typescript
// /src/components/resources/WorkloadAnalysis.tsx
const WorkloadAnalysis: React.FC = () => {
  const { workloadAnalysis, fetchWorkloadAnalysis } = useStudentResources();
  const [timeRange, setTimeRange] = useState('WEEK');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchWorkloadAnalysis();
  }, [timeRange]);

  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 50) return 'text-blue-600 bg-blue-100';
    return 'text-green-600 bg-green-100';
  };

  const getWorkloadStatus = (percentage: number) => {
    if (percentage >= 100) return '過負荷';
    if (percentage >= 90) return '高負荷';
    if (percentage >= 70) return '適正';
    if (percentage >= 50) return '余裕';
    return '低負荷';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">📊 負荷分散分析</h3>
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="WEEK">週間</option>
            <option value="MONTH">月間</option>
            <option value="QUARTER">四半期</option>
          </select>
          <button
            onClick={fetchWorkloadAnalysis}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
          >
            更新
          </button>
        </div>
      </div>

      {workloadAnalysis && (
        <>
          {/* 概要統計 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">
                {workloadAnalysis.totalMembers}
              </div>
              <div className="text-sm text-gray-600">総メンバー数</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {workloadAnalysis.availableMembers}
              </div>
              <div className="text-sm text-gray-600">稼働可能</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {workloadAnalysis.overloadedMembers}
              </div>
              <div className="text-sm text-gray-600">過負荷</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {workloadAnalysis.averageUtilization}%
              </div>
              <div className="text-sm text-gray-600">平均稼働率</div>
            </div>
          </div>

          {/* 個別負荷状況 */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">個別負荷状況</h4>
            <div className="space-y-3">
              {workloadAnalysis.memberWorkloads?.map((member, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-semibold text-sm">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-600">{member.role}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getWorkloadColor(member.currentWorkload).split(' ')[0]}`}>
                        {member.currentWorkload}%
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${getWorkloadColor(member.currentWorkload)}`}>
                        {getWorkloadStatus(member.currentWorkload)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="text-sm">
                      <span className="text-gray-600">稼働時間:</span>
                      <span className="font-medium ml-1">
                        {member.currentHours}/{member.availableHours}h
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">プロジェクト数:</span>
                      <span className="font-medium ml-1">{member.activeProjects}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">次回空き:</span>
                      <span className="font-medium ml-1">
                        {member.nextAvailableDate ? 
                          format(new Date(member.nextAvailableDate), 'MM/dd') : 
                          '即座'
                        }
                      </span>
                    </div>
                  </div>

                  {/* 負荷詳細 */}
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">プロジェクト別負荷:</div>
                    {member.projectWorkloads?.map((project, projIndex) => (
                      <div key={projIndex} className="flex items-center justify-between">
                        <span className="text-sm">{project.name}</span>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${project.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs w-8">{project.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* アラート・推奨アクション */}
                  {member.currentWorkload >= 90 && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                      <div className="flex items-start">
                        <AlertTriangle className="w-4 h-4 text-red-500 mr-2 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-red-800">
                            過負荷アラート
                          </div>
                          <div className="text-xs text-red-700 mt-1">
                            推奨アクション: {member.recommendedAction}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 負荷分散の提案 */}
          {workloadAnalysis.rebalancingSuggestions && (
            <div>
              <h4 className="font-medium mb-3">⚖️ 負荷分散提案</h4>
              <div className="space-y-3">
                {workloadAnalysis.rebalancingSuggestions.map((suggestion, index) => (
                  <div key={index} className="border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-blue-800">{suggestion.title}</h5>
                        <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                        
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">移動対象:</span>
                            <span className="font-medium ml-1">{suggestion.taskToMove}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">移動先:</span>
                            <span className="font-medium ml-1">{suggestion.targetMember}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">期待効果:</span>
                            <span className="font-medium ml-1 text-green-600">
                              +{suggestion.expectedImprovement}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">実装工数:</span>
                            <span className="font-medium ml-1">{suggestion.implementationEffort}</span>
                          </div>
                        </div>
                      </div>
                      
                      <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 ml-4">
                        適用
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// /src/components/resources/PerformanceTracking.tsx
const PerformanceTracking: React.FC = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState('PRODUCTIVITY');
  const [timeRange, setTimeRange] = useState('MONTH');

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const response = await fetch(`/api/student-resources/performance?metric=${selectedMetric}&range=${timeRange}`);
        const data = await response.json();
        setPerformanceData(data);
      } catch (error) {
        console.error('Failed to fetch performance data:', error);
      }
    };

    fetchPerformanceData();
  }, [selectedMetric, timeRange]);

  const metricOptions = [
    { value: 'PRODUCTIVITY', label: '生産性' },
    { value: 'QUALITY', label: '品質' },
    { value: 'SPEED', label: 'スピード' },
    { value: 'COLLABORATION', label: 'コラボレーション' },
    { value: 'LEARNING', label: '学習速度' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">📈 パフォーマンス追跡</h3>
        <div className="flex space-x-2">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
          >
            {metricOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="WEEK">週間</option>
            <option value="MONTH">月間</option>
            <option value="QUARTER">四半期</option>
          </select>
        </div>
      </div>

      {performanceData && (
        <div className="space-y-6">
          {/* パフォーマンス概要 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {performanceData.averageScore}/10
              </div>
              <div className="text-sm text-gray-600">平均スコア</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {performanceData.improvementRate}%
              </div>
              <div className="text-sm text-gray-600">改善率</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {performanceData.topPerformers}
              </div>
              <div className="text-sm text-gray-600">トップパフォーマー数</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {performanceData.needsImprovement}
              </div>
              <div className="text-sm text-gray-600">要改善者数</div>
            </div>
          </div>

          {/* パフォーマンストレンド */}
          <div>
            <h4 className="font-medium mb-3">パフォーマンストレンド</h4>
            {performanceData.trendData && (
              <Line data={{
                labels: performanceData.trendData.map(item => item.period),
                datasets: [{
                  label: '平均パフォーマンス',
                  data: performanceData.trendData.map(item => item.average),
                  borderColor: 'rgb(59, 130, 246)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  tension: 0.4,
                  fill: true
                }, {
                  label: 'トップパフォーマー',
                  data: performanceData.trendData.map(item => item.top),
                  borderColor: 'rgb(16, 185, 129)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  tension: 0.4
                }]
              }} options={{
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 10
                  }
                },
                plugins: {
                  legend: { position: 'bottom' }
                }
              }} />
            )}
          </div>

          {/* 個別パフォーマンス */}
          <div>
            <h4 className="font-medium mb-3">個別パフォーマンス</h4>
            <div className="space-y-3">
              {performanceData.individualMetrics?.map((member, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-semibold text-sm">
                          {member.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-600">{member.role}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        member.currentScore >= 8 ? 'text-green-600' :
                        member.currentScore >= 6 ? 'text-blue-600' :
                        member.currentScore >= 4 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {member.currentScore}/10
                      </div>
                      <div className="text-xs text-gray-500">
                        {member.trend > 0 ? '↗️' : member.trend < 0 ? '↘️' : '→'} 
                        {Math.abs(member.trend)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-sm">
                      <span className="text-gray-600">完了タスク:</span>
                      <span className="font-medium ml-1">{member.completedTasks}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">平均品質:</span>
                      <span className="font-medium ml-1">{member.averageQuality}/5</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">期限遵守率:</span>
                      <span className="font-medium ml-1">{member.onTimeDelivery}%</span>
                    </div>
                  </div>

                  {member.strengths && (
                    <div className="mt-3">
                      <span className="text-sm text-gray-600">強み:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {member.strengths.map((strength, strengthIndex) => (
                          <span key={strengthIndex} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {member.improvementAreas && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-600">改善領域:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {member.improvementAreas.map((area, areaIndex) => (
                          <span key={areaIndex} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

**完了条件**: 負荷分散分析とパフォーマンス追跡が可視化されること

##### Day 7-8: 統合・テスト・最適化
**作業内容**:
```typescript
// メインページ統合
// /src/app/student-resources/page.tsx の拡張
const StudentResourcesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: '概要', icon: '📊' },
    { id: 'optimization', label: '最適化', icon: '🎯' },
    { id: 'workload', label: '負荷分析', icon: '⚖️' },
    { id: 'performance', label: 'パフォーマンス', icon: '📈' },
    { id: 'individual', label: '個人管理', icon: '👤' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">👥 学生リソース完全最適化システム</h1>
        <p className="text-gray-600 mt-2">
          AI駆動による人材配置・負荷分散・パフォーマンス管理の統合プラットフォーム
        </p>
      </div>

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* コンテンツエリア */}
      <div className="space-y-8">
        {activeTab === 'overview' && <ResourceOverview />}
        {activeTab === 'optimization' && <ResourceOptimization />}
        {activeTab === 'workload' && <WorkloadAnalysis />}
        {activeTab === 'performance' && <PerformanceTracking />}
        {activeTab === 'individual' && <IndividualResourceManagement />}
      </div>
    </div>
  );
};

// パフォーマンステスト
const performanceTests = {
  optimizationSpeed: async () => {
    const start = performance.now();
    await optimizeResourceAllocation(mockRequirements);
    const end = performance.now();
    return end - start; // Should be < 10000ms
  },
  
  loadBalancingAccuracy: async () => {
    const result = await fetchWorkloadAnalysis();
    const accuracy = calculateAccuracy(result);
    return accuracy; // Should be > 95%
  },
  
  realTimeUpdates: async () => {
    const updateInterval = 5 * 60 * 1000; // 5 minutes
    setInterval(async () => {
      await fetchWorkloadAnalysis();
      await fetchPerformanceData();
    }, updateInterval);
  }
};
```

**統合テスト項目**:
- [ ] 最適化計算が10秒以内で完了
- [ ] 配分精度が95%以上
- [ ] リアルタイム負荷監視が5分間隔で動作
- [ ] 全機能がシームレスに統合
- [ ] 大規模データ（100+ユーザー）での動作確認

#### ✅ 完了条件
1. 個人スキル・稼働時間管理UIが完全動作
2. プロジェクトリソース配分最適化が95%精度で動作
3. 負荷分散自動計算がリアルタイムで動作
4. パフォーマンス追跡ダッシュボードが詳細表示
5. 全機能が統合されたメインシステムが動作

---

### タスク 3.2: 高度分析機能フル活用
**期間**: 10営業日  
**工数**: 10日  
**担当**: フルスタックエンジニア + フロントエンドエンジニア  

#### 📋 要件定義
**機能要件**:
1. リーチ分析ダッシュボード
2. 接続分析ネットワーク図
3. プロジェクトROI詳細分析
4. 予測精度追跡システム

**非機能要件**:
- 大規模データ処理: 10万件以上
- 分析精度: 98%以上
- リアルタイム処理: 30秒以内

#### 🏗️ 実装詳細

##### Day 1-3: リーチ分析ダッシュボード・接続分析ネットワーク図
**作業内容**:
```typescript
// /src/app/advanced-analytics/page.tsx (新規)
// /src/components/analytics/ReachAnalysis.tsx (新規)
// /src/components/analytics/ConnectionNetwork.tsx (新規)

const ReachAnalysis: React.FC = () => {
  const [reachData, setReachData] = useState(null);
  const [timeFrame, setTimeFrame] = useState('MONTH');
  const [platform, setPlatform] = useState('ALL');

  useEffect(() => {
    const fetchReachData = async () => {
      try {
        const response = await fetch(`/api/analytics/reach?timeFrame=${timeFrame}&platform=${platform}`);
        const data = await response.json();
        setReachData(data);
      } catch (error) {
        console.error('Failed to fetch reach data:', error);
      }
    };

    fetchReachData();
  }, [timeFrame, platform]);

  const platformOptions = [
    { value: 'ALL', label: '全プラットフォーム' },
    { value: 'WEBSITE', label: 'ウェブサイト' },
    { value: 'SOCIAL_MEDIA', label: 'ソーシャルメディア' },
    { value: 'EMAIL', label: 'メール' },
    { value: 'DIRECT', label: 'ダイレクト' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">📡 リーチ分析</h3>
        <div className="flex space-x-2">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
          >
            {platformOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="WEEK">週間</option>
            <option value="MONTH">月間</option>
            <option value="QUARTER">四半期</option>
          </select>
        </div>
      </div>

      {reachData && (
        <div className="space-y-6">
          {/* 概要指標 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {reachData.totalReach?.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">総リーチ数</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {reachData.uniqueReach?.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">ユニークリーチ</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {reachData.engagementRate}%
              </div>
              <div className="text-sm text-gray-600">エンゲージメント率</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {reachData.conversionRate}%
              </div>
              <div className="text-sm text-gray-600">コンバージョン率</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                ¥{reachData.reachCost?.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">リーチ単価</div>
            </div>
          </div>

          {/* リーチトレンド */}
          <div>
            <h4 className="font-medium mb-3">リーチトレンド</h4>
            {reachData.trendData && (
              <Line data={{
                labels: reachData.trendData.map(item => item.period),
                datasets: [{
                  label: '総リーチ',
                  data: reachData.trendData.map(item => item.totalReach),
                  borderColor: 'rgb(59, 130, 246)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  tension: 0.4,
                  fill: true
                }, {
                  label: 'ユニークリーチ',
                  data: reachData.trendData.map(item => item.uniqueReach),
                  borderColor: 'rgb(16, 185, 129)',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  tension: 0.4
                }, {
                  label: 'エンゲージメント',
                  data: reachData.trendData.map(item => item.engagements),
                  borderColor: 'rgb(139, 92, 246)',
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  tension: 0.4,
                  yAxisID: 'y1'
                }]
              }} options={{
                responsive: true,
                interaction: {
                  mode: 'index' as const,
                  intersect: false,
                },
                scales: {
                  x: {
                    display: true,
                    title: {
                      display: true,
                      text: '期間'
                    }
                  },
                  y: {
                    type: 'linear' as const,
                    display: true,
                    position: 'left' as const,
                    title: {
                      display: true,
                      text: 'リーチ数'
                    }
                  },
                  y1: {
                    type: 'linear' as const,
                    display: true,
                    position: 'right' as const,
                    title: {
                      display: true,
                      text: 'エンゲージメント数'
                    },
                    grid: {
                      drawOnChartArea: false,
                    },
                  }
                },
                plugins: {
                  legend: { position: 'bottom' }
                }
              }} />
            )}
          </div>

          {/* プラットフォーム別分析 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">プラットフォーム別リーチ</h4>
              {reachData.platformBreakdown && (
                <Doughnut data={{
                  labels: reachData.platformBreakdown.map(item => item.platform),
                  datasets: [{
                    data: reachData.platformBreakdown.map(item => item.reach),
                    backgroundColor: [
                      'rgba(59, 130, 246, 0.8)',
                      'rgba(16, 185, 129, 0.8)',
                      'rgba(245, 158, 11, 0.8)',
                      'rgba(239, 68, 68, 0.8)',
                      'rgba(139, 92, 246, 0.8)'
                    ]
                  }]
                }} options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }} />
              )}
            </div>

            <div>
              <h4 className="font-medium mb-3">リーチ効率性</h4>
              <div className="space-y-3">
                {reachData.platformBreakdown?.map((platform, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{platform.platform}</span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        platform.efficiency >= 80 ? 'bg-green-100 text-green-800' :
                        platform.efficiency >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        効率: {platform.efficiency}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">リーチ:</span>
                        <span className="font-medium ml-1">{platform.reach.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">コスト:</span>
                        <span className="font-medium ml-1">¥{platform.cost.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">CPA:</span>
                        <span className="font-medium ml-1">¥{platform.costPerAcquisition}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">ROI:</span>
                        <span className="font-medium ml-1">{platform.roi}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ターゲット分析 */}
          <div>
            <h4 className="font-medium mb-3">ターゲット分析</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reachData.audienceSegments?.map((segment, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium mb-2">{segment.name}</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">リーチ率:</span>
                      <span className="font-medium">{segment.reachRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">エンゲージメント:</span>
                      <span className="font-medium">{segment.engagementRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">コンバージョン:</span>
                      <span className="font-medium">{segment.conversionRate}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${segment.reachRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 接続分析ネットワーク図
const ConnectionNetwork: React.FC = () => {
  const [networkData, setNetworkData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [analysisType, setAnalysisType] = useState('INFLUENCE');

  useEffect(() => {
    const fetchNetworkData = async () => {
      try {
        const response = await fetch(`/api/analytics/connections?type=${analysisType}`);
        const data = await response.json();
        setNetworkData(data);
      } catch (error) {
        console.error('Failed to fetch network data:', error);
      }
    };

    fetchNetworkData();
  }, [analysisType]);

  // D3.js ネットワーク図の実装
  useEffect(() => {
    if (!networkData || !networkData.nodes) return;

    const width = 800;
    const height = 600;

    // 既存のSVGを削除
    d3.select("#network-chart").selectAll("*").remove();

    const svg = d3.select("#network-chart")
      .attr("width", width)
      .attr("height", height);

    const simulation = d3.forceSimulation(networkData.nodes)
      .force("link", d3.forceLink(networkData.links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // リンクの描画
    const link = svg.append("g")
      .selectAll("line")
      .data(networkData.links)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.strength || 1) * 2);

    // ノードの描画
    const node = svg.append("g")
      .selectAll("circle")
      .data(networkData.nodes)
      .enter().append("circle")
      .attr("r", d => Math.sqrt(d.influence || 1) * 10)
      .attr("fill", d => {
        switch (d.type) {
          case 'CUSTOMER': return '#3B82F6';
          case 'PARTNER': return '#10B981';
          case 'INTERNAL': return '#8B5CF6';
          default: return '#6B7280';
        }
      })
      .on("click", (event, d) => setSelectedNode(d))
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // ラベルの描画
    const label = svg.append("g")
      .selectAll("text")
      .data(networkData.nodes)
      .enter().append("text")
      .text(d => d.name)
      .attr("font-size", "10px")
      .attr("dx", 15)
      .attr("dy", 4);

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      label
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

  }, [networkData]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">🌐 接続分析ネットワーク</h3>
        <select
          value={analysisType}
          onChange={(e) => setAnalysisType(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="INFLUENCE">影響力分析</option>
          <option value="COLLABORATION">コラボレーション分析</option>
          <option value="KNOWLEDGE_FLOW">ナレッジフロー分析</option>
          <option value="COMMUNICATION">コミュニケーション分析</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ネットワーク図 */}
        <div className="lg:col-span-2">
          <div className="border border-gray-200 rounded-lg p-4">
            <svg id="network-chart"></svg>
          </div>
          
          {/* 凡例 */}
          <div className="mt-4 flex items-center justify-center space-x-6">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm">顧客</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm">パートナー</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-500 rounded-full mr-2"></div>
              <span className="text-sm">内部</span>
            </div>
          </div>
        </div>

        {/* 詳細パネル */}
        <div className="space-y-4">
          {/* ネットワーク統計 */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-3">ネットワーク統計</h4>
            {networkData && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ノード数:</span>
                  <span className="font-medium">{networkData.nodes?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">接続数:</span>
                  <span className="font-medium">{networkData.links?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">密度:</span>
                  <span className="font-medium">{networkData.density || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">中心性:</span>
                  <span className="font-medium">{networkData.centrality || 0}</span>
                </div>
              </div>
            )}
          </div>

          {/* 選択ノード詳細 */}
          {selectedNode && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-3">ノード詳細</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">名前:</span>
                  <span className="font-medium ml-1">{selectedNode.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">タイプ:</span>
                  <span className="font-medium ml-1">{selectedNode.type}</span>
                </div>
                <div>
                  <span className="text-gray-600">影響力:</span>
                  <span className="font-medium ml-1">{selectedNode.influence || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">接続数:</span>
                  <span className="font-medium ml-1">{selectedNode.connections || 0}</span>
                </div>
              </div>

              {selectedNode.metrics && (
                <div className="mt-3">
                  <div className="text-sm text-gray-600 mb-2">主要指標:</div>
                  {Object.entries(selectedNode.metrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 重要ノードランキング */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-3">影響力ランキング</h4>
            {networkData?.topInfluencers && (
              <div className="space-y-2">
                {networkData.topInfluencers.slice(0, 5).map((node, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">#{index + 1}</span>
                      <span className="text-sm">{node.name}</span>
                    </div>
                    <span className="text-sm font-medium text-blue-600">
                      {node.influence}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

**完了条件**: リーチ分析とネットワーク図が可視化され、インタラクティブに操作できること

##### Day 4-7: プロジェクトROI詳細分析・予測精度追跡システム
**作業内容**:
```typescript
// /src/components/analytics/ProjectROIAnalysis.tsx
const ProjectROIAnalysis: React.FC = () => {
  const [roiData, setROIData] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [timeframe, setTimeframe] = useState('YEAR');

  // ROI分析実装...
};

// /src/components/analytics/PredictionAccuracyTracking.tsx
const PredictionAccuracyTracking: React.FC = () => {
  const [accuracyData, setAccuracyData] = useState(null);
  const [modelType, setModelType] = useState('ALL');

  // 予測精度追跡実装...
};
```

**完了条件**: ROI分析と予測精度追跡が動作すること

##### Day 8-10: 統合・最適化・エンタープライズ対応
**作業内容**: 全機能の統合とエンタープライズレベルの最適化

#### ✅ 完了条件
1. リーチ分析ダッシュボードが大規模データで動作
2. 接続分析ネットワーク図がインタラクティブに表示
3. プロジェクトROI詳細分析が98%精度で動作
4. 予測精度追跡システムがリアルタイム更新
5. 全機能がエンタープライズレベルで統合

---

### タスク 3.3: 営業自動化完全統合
**期間**: 6営業日  
**工数**: 6日  
**担当**: フロントエンドエンジニア  

#### 📋 要件定義
**機能要件**:
1. 営業アシスタントチャット
2. 自動フォローアップシステム
3. 案件確度自動更新
4. 売上予測の精密化

**非機能要件**:
- 自動化率: 90%以上
- 応答時間: 2秒以内
- 予測精度: 95%以上

#### 🏗️ 実装詳細
（Day 1-6の詳細実装内容...）

#### ✅ 完了条件
1. 営業アシスタントチャットが自然言語で対応
2. 自動フォローアップシステムが90%自動化
3. 案件確度がリアルタイム自動更新
4. 売上予測が95%精度で動作
5. 全営業プロセスが統合自動化

---

## 📊 Phase 3 完了基準

### 機能完成チェックリスト
- [ ] 学生リソース完全最適化システム完成（4つの機能すべて動作）
- [ ] 高度分析機能フル活用完成（4つの機能すべて動作）
- [ ] 営業自動化完全統合完成（4つの機能すべて動作）
- [ ] エンタープライズレベル品質確認
- [ ] 大規模データ処理確認（10万件以上）
- [ ] システム完成度90%達成確認

### 品質保証チェックリスト
- [ ] 単体テスト実施・合格（95%以上カバレッジ）
- [ ] 統合テスト実施・合格
- [ ] 負荷テスト実施・合格（1000同時ユーザー）
- [ ] セキュリティテスト実施・合格
- [ ] ユーザビリティテスト実施・合格
- [ ] アクセシビリティテスト実施・合格

### エンタープライズ準備チェックリスト
- [ ] スケーラビリティ確認（10倍負荷対応）
- [ ] 冗長化・災害復旧設定完了
- [ ] 監視・ログ・メトリクス設定完了
- [ ] API制限・セキュリティ設定完了
- [ ] ドキュメント・運用手順完備
- [ ] サポート体制整備完了

### 成功指標達成確認
- [ ] 人材配置自動化95%精度達成
- [ ] 経営判断支援98%精度達成
- [ ] 営業プロセス自動化90%達成
- [ ] システム完成度90%達成（98/109 API活用）
- [ ] ユーザー満足度4.8/5.0以上達成

---

## 🎯 Phase 3 完了後の状態

### システム完成度
- **API活用率**: 90%（98/109個）
- **自動化率**: 85%以上
- **予測精度**: 平均95%以上
- **応答性能**: 全機能2秒以内

### ビジネス効果
- **業務効率**: 全体で500%向上
- **意思決定速度**: 300%向上
- **エラー率**: 0.01%以下
- **顧客満足度**: 4.8/5.0以上

### 技術的達成
- **エンタープライズ級品質**: 完全達成
- **スケーラビリティ**: 10倍負荷対応
- **セキュリティ**: 企業標準準拠
- **保守性**: 完全ドキュメント化

---

**Phase 3完了により、世界最高水準のタスク管理プラットフォームが完成します。**