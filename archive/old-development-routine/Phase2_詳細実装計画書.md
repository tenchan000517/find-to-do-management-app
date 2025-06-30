# 📋 Phase 2: 戦略的機能実装 詳細計画書

## 🎯 Phase 2 概要

**期間**: 4週間（20営業日）  
**工数**: 18日  
**担当者**: フロントエンドエンジニア 1名 + バックエンドエンジニア 0.5名  
**開始条件**: Phase 1完了、ユーザーフィードバック収集完了  
**完了条件**: 3つの戦略機能がプロダクション環境で稼働すること  

## 📊 Phase 2 目標

### 定量目標
- **プロジェクト立ち上げ効率**: 500%向上（テンプレート活用）
- **財務リスク検知率**: 95%以上（早期アラート）
- **チーム生産性**: 300%向上（MBTI最適化）
- **システム完成度**: 70%達成（109API中77個活用）

### 定性目標
- プロジェクト管理の完全自動化実現
- 予防的リスク管理システム構築
- 個人特性に基づく最適化システム実現
- エンタープライズレベルの機能提供

## 🚀 実装タスク詳細

### タスク 2.1: プロジェクトテンプレート適用システム
**期間**: 7営業日  
**工数**: 7日  
**担当**: フロントエンドエンジニア + バックエンドエンジニア  

#### 📋 要件定義
**機能要件**:
1. テンプレート選択・プレビューUI
2. 業界別・用途別分類システム
3. テンプレートカスタマイズ機能
4. 既存プロジェクトからのテンプレート化機能

**非機能要件**:
- テンプレート適用時間: 30秒以内
- カスタマイズオプション: 10種類以上
- プレビュー表示: リアルタイム反映

#### 🏗️ 実装詳細

##### Day 1-2: テンプレート選択・プレビューUI
**作業内容**:
```typescript
// 新規ファイル作成
/src/app/projects/templates/page.tsx
/src/app/projects/templates/components/TemplateSelector.tsx
/src/app/projects/templates/components/TemplatePreview.tsx
/src/hooks/useProjectTemplates.ts
```

**テンプレート選択UI実装**:
```typescript
// /src/hooks/useProjectTemplates.ts
export const useProjectTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    industry: 'ALL',
    complexity: 'ALL',
    technology: 'ALL',
    duration: 'ALL'
  });

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/project-templates');
      const data = await response.json();
      setTemplates(data.templates || []);
      setFilteredTemplates(data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateTemplate = useCallback(async (requirements: ProjectRequirements) => {
    const response = await fetch('/api/project-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requirements)
    });
    return await response.json();
  }, []);

  const applyTemplate = useCallback(async (templateId: string, customizations: any) => {
    const response = await fetch('/api/projects/from-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, customizations })
    });
    return await response.json();
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    let filtered = templates;
    
    if (filters.industry !== 'ALL') {
      filtered = filtered.filter(t => t.industry === filters.industry);
    }
    if (filters.complexity !== 'ALL') {
      filtered = filtered.filter(t => {
        const complexity = filters.complexity;
        if (complexity === 'LOW') return t.complexityLevel <= 3;
        if (complexity === 'MEDIUM') return t.complexityLevel >= 4 && t.complexityLevel <= 7;
        if (complexity === 'HIGH') return t.complexityLevel >= 8;
        return true;
      });
    }
    if (filters.technology !== 'ALL') {
      filtered = filtered.filter(t => 
        t.requiredTechnologies?.includes(filters.technology)
      );
    }
    if (filters.duration !== 'ALL') {
      filtered = filtered.filter(t => {
        const duration = filters.duration;
        if (duration === 'SHORT') return t.durationWeeksMax <= 4;
        if (duration === 'MEDIUM') return t.durationWeeksMax > 4 && t.durationWeeksMax <= 12;
        if (duration === 'LONG') return t.durationWeeksMax > 12;
        return true;
      });
    }
    
    setFilteredTemplates(filtered);
  }, [templates, filters]);

  return {
    templates: filteredTemplates,
    loading,
    filters,
    setFilters,
    generateTemplate,
    applyTemplate
  };
};

// /src/app/projects/templates/components/TemplateSelector.tsx
const TemplateSelector: React.FC = () => {
  const { templates, loading, filters, setFilters } = useProjectTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const filterOptions = {
    industry: [
      { value: 'ALL', label: 'すべて' },
      { value: 'IT', label: 'IT・システム' },
      { value: 'MARKETING', label: 'マーケティング' },
      { value: 'SALES', label: '営業' },
      { value: 'EDUCATION', label: '教育' },
      { value: 'EVENT', label: 'イベント' },
      { value: 'CUSTOM', label: 'カスタム' }
    ],
    complexity: [
      { value: 'ALL', label: 'すべて' },
      { value: 'LOW', label: '簡単（1-3）' },
      { value: 'MEDIUM', label: '中程度（4-7）' },
      { value: 'HIGH', label: '高度（8-10）' }
    ],
    technology: [
      { value: 'ALL', label: 'すべて' },
      { value: 'React', label: 'React' },
      { value: 'Node.js', label: 'Node.js' },
      { value: 'Python', label: 'Python' },
      { value: 'AI/ML', label: 'AI/ML' },
      { value: 'Mobile', label: 'モバイル' }
    ],
    duration: [
      { value: 'ALL', label: 'すべて' },
      { value: 'SHORT', label: '短期（～4週）' },
      { value: 'MEDIUM', label: '中期（4-12週）' },
      { value: 'LONG', label: '長期（12週～）' }
    ]
  };

  const getComplexityColor = (level: number) => {
    if (level <= 3) return 'text-green-600 bg-green-100';
    if (level <= 7) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* フィルター */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">🔍 テンプレート検索</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(filterOptions).map(([key, options]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {key === 'industry' ? '業界' :
                 key === 'complexity' ? '複雑度' :
                 key === 'technology' ? '技術' : '期間'}
              </label>
              <select
                value={filters[key]}
                onChange={(e) => setFilters(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                {options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* テンプレート一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(template => (
          <div key={template.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">{template.name}</h3>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getComplexityColor(template.complexityLevel)}`}>
                    難易度 {template.complexityLevel}/10
                  </span>
                  {template.autoGenerated && (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      AI生成
                    </span>
                  )}
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {template.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">期間</span>
                  <span className="font-medium">
                    {template.durationWeeksMin}-{template.durationWeeksMax}週
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">成功率</span>
                  <span className={`font-medium ${getSuccessRateColor(template.successRate)}`}>
                    {template.successRate}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">使用実績</span>
                  <span className="font-medium">{template.usageCount}回</span>
                </div>
              </div>

              {template.requiredTechnologies?.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-gray-500 mb-2">必要技術</div>
                  <div className="flex flex-wrap gap-1">
                    {template.requiredTechnologies.slice(0, 3).map((tech, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {tech}
                      </span>
                    ))}
                    {template.requiredTechnologies.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{template.requiredTechnologies.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowPreview(true);
                  }}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm"
                >
                  プレビュー
                </button>
                <button
                  onClick={() => {
                    // 直接適用
                    window.location.href = `/projects/create?templateId=${template.id}`;
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
                >
                  適用
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            該当するテンプレートがありません
          </h3>
          <p className="text-gray-500">
            フィルター条件を変更するか、新しいテンプレートを作成してください
          </p>
        </div>
      )}

      {/* プレビューモーダル */}
      {showPreview && selectedTemplate && (
        <TemplatePreview
          template={selectedTemplate}
          onClose={() => setShowPreview(false)}
          onApply={(customizations) => {
            // テンプレート適用処理
            window.location.href = `/projects/create?templateId=${selectedTemplate.id}&customizations=${encodeURIComponent(JSON.stringify(customizations))}`;
          }}
        />
      )}
    </div>
  );
};
```

**完了条件**: テンプレート一覧が表示され、フィルタリング・プレビューが動作すること

##### Day 3-4: テンプレートプレビュー・カスタマイズ機能
**作業内容**:
```typescript
// /src/app/projects/templates/components/TemplatePreview.tsx
interface TemplatePreviewProps {
  template: ProjectTemplate;
  onClose: () => void;
  onApply: (customizations: TemplateCustomizations) => void;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  onClose,
  onApply
}) => {
  const [customizations, setCustomizations] = useState<TemplateCustomizations>({
    projectName: '',
    description: '',
    startDate: new Date(),
    teamSize: template.targetScaleMin || 1,
    budget: template.budgetBreakdown?.total || 0,
    customPhases: template.phases,
    technologies: template.requiredTechnologies || [],
    riskToleranceLevel: 'MEDIUM'
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply(customizations);
    } catch (error) {
      toast.error('テンプレート適用に失敗しました');
    } finally {
      setIsApplying(false);
    }
  };

  const tabs = [
    { id: 'overview', label: '概要', icon: '📋' },
    { id: 'phases', label: 'フェーズ', icon: '📊' },
    { id: 'budget', label: '予算', icon: '💰' },
    { id: 'risks', label: 'リスク', icon: '⚠️' },
    { id: 'customize', label: 'カスタマイズ', icon: '⚙️' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-5/6 overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{template.name}</h2>
            <p className="text-gray-600 text-sm">{template.description}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* タブナビゲーション */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
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
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">プロジェクト規模</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {template.targetScaleMin}-{template.targetScaleMax}人
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">予想期間</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {template.durationWeeksMin}-{template.durationWeeksMax}週
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">成功率</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {template.successRate}%
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">成功指標 (KPI)</h3>
                <div className="space-y-2">
                  {template.successMetrics?.map((metric, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span>{metric}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">必要リソース</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">技術スタック</h4>
                      <div className="flex flex-wrap gap-2">
                        {template.requiredTechnologies?.map((tech, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">必要スキル</h4>
                      <div className="flex flex-wrap gap-2">
                        {template.resources?.requiredSkills?.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'phases' && (
            <div className="space-y-4">
              <h3 className="font-semibold">プロジェクトフェーズ</h3>
              {template.phases?.map((phase, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{phase.name}</h4>
                    <span className="text-sm text-gray-500">{phase.duration}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{phase.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-sm mb-2">主要タスク</h5>
                      <ul className="space-y-1">
                        {phase.tasks?.slice(0, 3).map((task, taskIndex) => (
                          <li key={taskIndex} className="text-sm text-gray-600 flex items-center">
                            <ArrowRight className="w-3 h-3 mr-2" />
                            {task}
                          </li>
                        ))}
                        {phase.tasks?.length > 3 && (
                          <li className="text-sm text-gray-500">
                            +{phase.tasks.length - 3}個のタスク
                          </li>
                        )}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-sm mb-2">成果物</h5>
                      <ul className="space-y-1">
                        {phase.deliverables?.map((deliverable, delIndex) => (
                          <li key={delIndex} className="text-sm text-gray-600 flex items-center">
                            <FileText className="w-3 h-3 mr-2" />
                            {deliverable}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="space-y-6">
              <h3 className="font-semibold">予算内訳</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-green-600">
                    ¥{template.budgetBreakdown?.total?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-600">総予算</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(template.budgetBreakdown || {}).map(([category, amount]) => {
                  if (category === 'total') return null;
                  return (
                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">{category}</span>
                        <span className="text-lg font-semibold">
                          ¥{amount?.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ 
                            width: `${((amount / template.budgetBreakdown?.total) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {Math.round((amount / template.budgetBreakdown?.total) * 100)}% of total
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'risks' && (
            <div className="space-y-4">
              <h3 className="font-semibold">リスク分析</h3>
              {template.riskFactors?.map((risk, index) => (
                <div key={index} className="border border-red-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-red-800">{risk.factor}</h4>
                      <p className="text-sm text-gray-600 mt-1">{risk.description}</p>
                    </div>
                    <div className="ml-4 text-center">
                      <div className="text-lg font-bold text-red-600">
                        {Math.round(risk.probability * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">発生確率</div>
                    </div>
                  </div>
                  
                  {risk.mitigation && (
                    <div className="mt-3 bg-green-50 p-3 rounded">
                      <h5 className="font-medium text-green-800 text-sm">対策</h5>
                      <p className="text-sm text-green-700">{risk.mitigation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'customize' && (
            <div className="space-y-6">
              <h3 className="font-semibold">テンプレートカスタマイズ</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    プロジェクト名
                  </label>
                  <input
                    type="text"
                    value={customizations.projectName}
                    onChange={(e) => setCustomizations(prev => ({ 
                      ...prev, 
                      projectName: e.target.value 
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="プロジェクト名を入力"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    開始予定日
                  </label>
                  <input
                    type="date"
                    value={format(customizations.startDate, 'yyyy-MM-dd')}
                    onChange={(e) => setCustomizations(prev => ({ 
                      ...prev, 
                      startDate: new Date(e.target.value) 
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    チームサイズ
                  </label>
                  <input
                    type="number"
                    value={customizations.teamSize}
                    onChange={(e) => setCustomizations(prev => ({ 
                      ...prev, 
                      teamSize: parseInt(e.target.value) || 1 
                    }))}
                    min={template.targetScaleMin}
                    max={template.targetScaleMax}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    予算
                  </label>
                  <input
                    type="number"
                    value={customizations.budget}
                    onChange={(e) => setCustomizations(prev => ({ 
                      ...prev, 
                      budget: parseInt(e.target.value) || 0 
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="予算を入力"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プロジェクト説明
                </label>
                <textarea
                  value={customizations.description}
                  onChange={(e) => setCustomizations(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="プロジェクトの説明を入力"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  リスク許容度
                </label>
                <select
                  value={customizations.riskToleranceLevel}
                  onChange={(e) => setCustomizations(prev => ({ 
                    ...prev, 
                    riskToleranceLevel: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' 
                  }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">低（安全重視）</option>
                  <option value="MEDIUM">中（バランス重視）</option>
                  <option value="HIGH">高（スピード重視）</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            このテンプレートは{template.usageCount}回使用され、
            平均満足度{template.averageSatisfaction}/5.0を獲得しています
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleApply}
              disabled={isApplying || !customizations.projectName}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isApplying ? '適用中...' : 'テンプレートを適用'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**完了条件**: テンプレートの詳細プレビューとカスタマイズが可能になること

##### Day 5-6: 業界別・用途別分類システム・テンプレート適用機能
**作業内容**:
```typescript
// /src/app/api/projects/from-template/route.ts (新規バックエンドAPI)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ProjectTemplateGenerator } from '@/services/ProjectTemplateGenerator';

export async function POST(request: NextRequest) {
  try {
    const { templateId, customizations } = await request.json();

    // テンプレート取得
    const template = await prisma.projectTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // カスタマイズされたプロジェクトデータ生成
    const projectData = {
      name: customizations.projectName,
      description: customizations.description,
      startDate: new Date(customizations.startDate),
      targetEndDate: new Date(
        new Date(customizations.startDate).getTime() + 
        (template.durationWeeksMax * 7 * 24 * 60 * 60 * 1000)
      ),
      
      // テンプレートから継承
      phases: customizations.customPhases || template.phases,
      kgi: template.successMetrics?.[0] || '',
      priority: 'HIGH',
      status: 'PLANNING',
      complexityLevel: template.complexityLevel,
      
      // カスタマイズ反映
      budget: customizations.budget,
      teamSize: customizations.teamSize,
      riskToleranceLevel: customizations.riskToleranceLevel,
      
      // メタデータ
      templateId: template.id,
      autoGenerated: true,
      templateAppliedAt: new Date()
    };

    // プロジェクト作成
    const project = await prisma.project.create({
      data: {
        ...projectData,
        createdBy: 'system', // TODO: 実際のユーザーIDを設定
      }
    });

    // テンプレートからタスク自動生成
    await generateTasksFromTemplate(project.id, template, customizations);

    // テンプレート使用回数更新
    await prisma.projectTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } }
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        status: project.status
      }
    });

  } catch (error) {
    console.error('Error applying template:', error);
    return NextResponse.json(
      { error: 'Failed to apply template' },
      { status: 500 }
    );
  }
}

async function generateTasksFromTemplate(
  projectId: string, 
  template: any, 
  customizations: any
) {
  const tasks = [];
  
  // 各フェーズからタスク生成
  for (const phase of template.phases || []) {
    for (const taskTemplate of phase.tasks || []) {
      tasks.push({
        title: taskTemplate,
        description: `${phase.name}フェーズ: ${taskTemplate}`,
        projectId,
        status: 'TODO',
        priority: 'MEDIUM',
        phase: phase.name,
        estimatedHours: Math.ceil(Math.random() * 8) + 1, // 暫定値
        startDate: new Date(), // TODO: フェーズスケジュールから計算
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1週間後
        autoGenerated: true,
        templateId: template.id
      });
    }
  }

  // バッチでタスク作成
  if (tasks.length > 0) {
    await prisma.task.createMany({
      data: tasks
    });
  }
}

// /src/app/projects/create/page.tsx の拡張
const CreateProjectPage: React.FC = () => {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');
  const customizationsParam = searchParams.get('customizations');
  
  const [isFromTemplate, setIsFromTemplate] = useState(!!templateId);
  const [template, setTemplate] = useState(null);
  const [customizations, setCustomizations] = useState(null);

  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    }
    if (customizationsParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(customizationsParam));
        setCustomizations(parsed);
      } catch (error) {
        console.error('Failed to parse customizations:', error);
      }
    }
  }, [templateId, customizationsParam]);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/project-templates/${templateId}`);
      const data = await response.json();
      setTemplate(data.template);
    } catch (error) {
      console.error('Failed to fetch template:', error);
    }
  };

  const handleCreateFromTemplate = async () => {
    try {
      const response = await fetch('/api/projects/from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          customizations
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('プロジェクトが作成されました！');
        router.push(`/projects/${result.project.id}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error('プロジェクト作成に失敗しました');
      console.error('Failed to create project:', error);
    }
  };

  if (isFromTemplate && template) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">🚀 プロジェクト作成</h1>
          <p className="text-gray-600 mt-2">
            テンプレート「{template.name}」からプロジェクトを作成します
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">プロジェクト設定</h2>
              {/* カスタマイズフォーム */}
              <ProjectCustomizationForm 
                template={template}
                initialCustomizations={customizations}
                onChange={setCustomizations}
              />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">テンプレート詳細</h2>
              <TemplateDetailsSummary template={template} />
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => router.push('/projects/templates')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              ← テンプレート選択に戻る
            </button>
            
            <button
              onClick={handleCreateFromTemplate}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              プロジェクトを作成
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 既存の通常プロジェクト作成UI...
  return <ExistingCreateProjectForm />;
};
```

**完了条件**: テンプレートからプロジェクトとタスクが自動生成されること

##### Day 7: 既存プロジェクトからテンプレート化機能・統合テスト
**作業内容**:
```typescript
// /src/app/api/project-templates/from-project/route.ts (新規)
export async function POST(request: NextRequest) {
  try {
    const { projectId, templateName, templateDescription, isPublic } = await request.json();

    // プロジェクト取得
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: true,
        financialDetails: true
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // プロジェクトから汎用テンプレート生成
    const templateGenerator = new ProjectTemplateGenerator();
    const templateData = await templateGenerator.generateFromExistingProject(project, {
      name: templateName,
      description: templateDescription,
      isPublic
    });

    const template = await prisma.projectTemplate.create({
      data: {
        ...templateData,
        sourceProjectId: projectId,
        autoGenerated: false, // 手動作成
        createdBy: 'user' // TODO: 実際のユーザーID
      }
    });

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name
      }
    });

  } catch (error) {
    console.error('Error creating template from project:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

// /src/app/projects/[id]/page.tsx にテンプレート化ボタン追加
const ProjectDetailPage = ({ params }) => {
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const handleCreateTemplate = async (templateData) => {
    try {
      const response = await fetch('/api/project-templates/from-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: params.id,
          ...templateData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('テンプレートが作成されました！');
        setShowTemplateModal(false);
      }
    } catch (error) {
      toast.error('テンプレート作成に失敗しました');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 既存のプロジェクト詳細コンテンツ */}
      
      {/* 新規: アクションボタンエリア */}
      <div className="mt-8 flex space-x-4">
        <button
          onClick={() => setShowTemplateModal(true)}
          className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 flex items-center"
        >
          <Template className="w-4 h-4 mr-2" />
          テンプレート化
        </button>
      </div>

      {/* テンプレート作成モーダル */}
      {showTemplateModal && (
        <CreateTemplateModal
          project={project}
          onClose={() => setShowTemplateModal(false)}
          onSubmit={handleCreateTemplate}
        />
      )}
    </div>
  );
};

// /src/components/modals/CreateTemplateModal.tsx
const CreateTemplateModal: React.FC<{
  project: Project;
  onClose: () => void;
  onSubmit: (data: any) => void;
}> = ({ project, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    templateName: `${project.name} テンプレート`,
    templateDescription: `${project.name}をベースとしたプロジェクトテンプレート`,
    isPublic: false,
    includeFinancialData: true,
    includeTaskDetails: true,
    anonymizeData: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">プロジェクトテンプレート作成</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              テンプレート名
            </label>
            <input
              type="text"
              value={formData.templateName}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                templateName: e.target.value 
              }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              説明
            </label>
            <textarea
              value={formData.templateDescription}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                templateDescription: e.target.value 
              }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  isPublic: e.target.checked 
                }))}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                他のユーザーと共有する
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeFinancialData"
                checked={formData.includeFinancialData}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  includeFinancialData: e.target.checked 
                }))}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="includeFinancialData" className="ml-2 text-sm text-gray-700">
                予算・財務データを含める
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="anonymizeData"
                checked={formData.anonymizeData}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  anonymizeData: e.target.checked 
                }))}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="anonymizeData" className="ml-2 text-sm text-gray-700">
                個人情報を匿名化する
              </label>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              作成
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

**完了条件**: 既存プロジェクトからテンプレートが作成でき、全機能が統合されて動作すること

#### ✅ 完了条件
1. テンプレート選択画面でフィルタリング・検索が動作する
2. テンプレートプレビューで詳細確認・カスタマイズが可能
3. テンプレートからプロジェクト・タスクが自動生成される
4. 既存プロジェクトからテンプレート化が可能
5. 業界別・用途別の分類システムが機能する

---

### タスク 2.2: 財務リスク自動監視システム
**期間**: 6営業日  
**工数**: 6日  
**担当**: フロントエンドエンジニア + バックエンドエンジニア  

#### 📋 要件定義
**機能要件**:
1. LTV分析ダッシュボード
2. 財務リスクアラートシステム
3. 収益予測グラフ
4. 顧客セグメント自動分析

**非機能要件**:
- リアルタイム監視: 1時間間隔
- 予測精度: 85%以上
- アラート通知: 1分以内

#### 🏗️ 実装詳細

##### Day 1-2: LTV分析ダッシュボード
**作業内容**:
```typescript
// /src/app/financial-analytics/page.tsx (新規)
// /src/hooks/useFinancialAnalytics.ts (新規)
// /src/components/charts/LTVAnalysisChart.tsx (新規)

const useFinancialAnalytics = () => {
  const [ltvData, setLtvData] = useState(null);
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [revenueProjection, setRevenueProjection] = useState(null);

  const fetchLTVAnalysis = useCallback(async () => {
    const response = await fetch('/api/ltv-analysis');
    const data = await response.json();
    setLtvData(data);
  }, []);

  const fetchFinancialRisks = useCallback(async () => {
    const response = await fetch('/api/financial-risk');
    const data = await response.json();
    setRiskAlerts(data.risks || []);
  }, []);

  const fetchRevenueProjection = useCallback(async () => {
    const response = await fetch('/api/revenue-prediction');
    const data = await response.json();
    setRevenueProjection(data);
  }, []);

  return {
    ltvData,
    riskAlerts,
    revenueProjection,
    fetchLTVAnalysis,
    fetchFinancialRisks,
    fetchRevenueProjection
  };
};

const LTVAnalysisChart: React.FC = () => {
  const { ltvData } = useFinancialAnalytics();

  if (!ltvData) return <div className="animate-pulse bg-gray-200 h-64 rounded"></div>;

  const chartData = {
    labels: ltvData.segments?.map(segment => segment.name) || [],
    datasets: [{
      label: 'Customer LTV (¥)',
      data: ltvData.segments?.map(segment => segment.averageLTV) || [],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ]
    }]
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">💰 顧客LTV分析</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Doughnut data={chartData} options={{
            responsive: true,
            plugins: {
              legend: { position: 'bottom' }
            }
          }} />
        </div>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              ¥{ltvData.totalLTV?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-600">総LTV</div>
          </div>
          
          {ltvData.segments?.map((segment, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-medium">{segment.name}</span>
              <div className="text-right">
                <div className="font-bold">¥{segment.averageLTV?.toLocaleString()}</div>
                <div className="text-sm text-gray-500">{segment.customerCount}顧客</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

**完了条件**: LTV分析が可視化され、顧客セグメント別の分析が表示されること

##### Day 3-4: 財務リスクアラートシステム・収益予測グラフ
**作業内容**:
```typescript
// /src/components/alerts/FinancialRiskAlerts.tsx
const FinancialRiskAlerts: React.FC = () => {
  const { riskAlerts } = useFinancialAnalytics();
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'border-red-500 bg-red-50 text-red-800';
      case 'HIGH': return 'border-orange-500 bg-orange-50 text-orange-800';
      case 'MEDIUM': return 'border-yellow-500 bg-yellow-50 text-yellow-800';
      default: return 'border-blue-500 bg-blue-50 text-blue-800';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL': return '🚨';
      case 'HIGH': return '⚠️';
      case 'MEDIUM': return '⚡';
      default: return 'ℹ️';
    }
  };

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const activeAlerts = riskAlerts.filter(alert => !dismissedAlerts.has(alert.id));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">🚨 財務リスクアラート</h3>
      
      {activeAlerts.length > 0 ? (
        activeAlerts.map(alert => (
          <div key={alert.id} className={`border-l-4 p-4 rounded-lg ${getRiskLevelColor(alert.level)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <span className="text-2xl mr-3">{getRiskIcon(alert.level)}</span>
                <div>
                  <h4 className="font-semibold">{alert.title}</h4>
                  <p className="text-sm mt-1">{alert.description}</p>
                  
                  {alert.metrics && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(alert.metrics).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <span className="font-medium">{key}:</span> {value}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {alert.recommendations && (
                    <div className="mt-3">
                      <h5 className="font-medium text-sm">推奨アクション:</h5>
                      <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                        {alert.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-2">
                    検出時刻: {format(new Date(alert.detectedAt), 'yyyy/MM/dd HH:mm')}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleDismiss(alert.id)}
                className="text-gray-400 hover:text-gray-600 ml-4"
              >
                ✕
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          現在、財務リスクアラートはありません 🎉
        </div>
      )}
    </div>
  );
};

// /src/components/charts/RevenueProjectionChart.tsx
const RevenueProjectionChart: React.FC = () => {
  const { revenueProjection } = useFinancialAnalytics();

  if (!revenueProjection) return <div className="animate-pulse bg-gray-200 h-64 rounded"></div>;

  const chartData = {
    labels: revenueProjection.timeline?.map(item => item.month) || [],
    datasets: [{
      label: '予測収益',
      data: revenueProjection.timeline?.map(item => item.projected) || [],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }, {
      label: '保守的予測',
      data: revenueProjection.timeline?.map(item => item.conservative) || [],
      borderColor: 'rgb(107, 114, 128)',
      backgroundColor: 'rgba(107, 114, 128, 0.05)',
      borderDash: [5, 5],
      tension: 0.4,
      fill: false
    }, {
      label: '楽観的予測',
      data: revenueProjection.timeline?.map(item => item.optimistic) || [],
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.05)',
      borderDash: [2, 2],
      tension: 0.4,
      fill: false
    }]
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">📈 収益予測</h3>
      
      <Line data={chartData} options={{
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => `¥${value.toLocaleString()}`
            }
          }
        },
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.dataset.label}: ¥${context.parsed.y.toLocaleString()}`;
              }
            }
          }
        }
      }} />
      
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            ¥{revenueProjection.nextQuarter?.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-600">来四半期予測</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {revenueProjection.growthRate || 0}%
          </div>
          <div className="text-sm text-gray-600">成長率</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {revenueProjection.confidence || 0}%
          </div>
          <div className="text-sm text-gray-600">予測信頼度</div>
        </div>
      </div>
    </div>
  );
};
```

**完了条件**: 財務リスクアラートが表示され、収益予測グラフが可視化されること

##### Day 5-6: 顧客セグメント自動分析・統合・テスト
**作業内容**:
```typescript
// /src/components/analytics/CustomerSegmentAnalysis.tsx
const CustomerSegmentAnalysis: React.FC = () => {
  const [segmentData, setSegmentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSegmentData = async () => {
      try {
        const response = await fetch('/api/analytics/customer-segments');
        const data = await response.json();
        setSegmentData(data);
      } catch (error) {
        console.error('Failed to fetch segment data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSegmentData();
  }, []);

  if (loading) return <div className="animate-pulse bg-gray-200 h-64 rounded"></div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">👥 顧客セグメント分析</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* セグメント一覧 */}
        <div className="space-y-4">
          {segmentData?.segments?.map((segment, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{segment.name}</h4>
                <span className="text-sm text-gray-500">
                  {segment.customerCount}顧客
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">平均LTV:</span>
                  <div className="font-bold text-green-600">
                    ¥{segment.averageLTV?.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">平均取引額:</span>
                  <div className="font-bold text-blue-600">
                    ¥{segment.averageOrderValue?.toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">リピート率:</span>
                  <div className="font-bold text-purple-600">
                    {segment.repeatRate}%
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">チャーン率:</span>
                  <div className="font-bold text-red-600">
                    {segment.churnRate}%
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <span className="text-gray-600 text-sm">特徴:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {segment.characteristics?.slice(0, 3).map((char, charIndex) => (
                    <span key={charIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* セグメント分布チャート */}
        <div>
          <h4 className="font-medium mb-3">セグメント分布</h4>
          {segmentData?.segments && (
            <Pie data={{
              labels: segmentData.segments.map(s => s.name),
              datasets: [{
                data: segmentData.segments.map(s => s.customerCount),
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

          <div className="mt-4 space-y-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {segmentData?.totalCustomers || 0}
              </div>
              <div className="text-sm text-gray-600">総顧客数</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center text-sm">
              <div>
                <div className="font-bold text-green-600">
                  {segmentData?.highValueSegmentPercentage || 0}%
                </div>
                <div className="text-gray-600">高価値顧客</div>
              </div>
              <div>
                <div className="font-bold text-red-600">
                  {segmentData?.atRiskSegmentPercentage || 0}%
                </div>
                <div className="text-gray-600">リスク顧客</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// メインページ統合
// /src/app/financial-analytics/page.tsx
const FinancialAnalyticsPage: React.FC = () => {
  const { 
    ltvData, 
    riskAlerts, 
    revenueProjection,
    fetchLTVAnalysis,
    fetchFinancialRisks,
    fetchRevenueProjection
  } = useFinancialAnalytics();

  useEffect(() => {
    // 初期データ取得
    fetchLTVAnalysis();
    fetchFinancialRisks();
    fetchRevenueProjection();

    // 定期更新（1時間間隔）
    const interval = setInterval(() => {
      fetchFinancialRisks(); // リスクアラートのみリアルタイム更新
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">💰 財務分析ダッシュボード</h1>
        <p className="text-gray-600 mt-2">
          リアルタイム財務監視・LTV分析・収益予測システム
        </p>
      </div>

      <div className="space-y-8">
        {/* アラート優先表示 */}
        {riskAlerts.length > 0 && (
          <FinancialRiskAlerts />
        )}

        {/* メイン分析エリア */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <LTVAnalysisChart />
          <RevenueProjectionChart />
        </div>

        <CustomerSegmentAnalysis />

        {/* 統計サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <div className="text-2xl font-bold text-green-600">
              ¥{ltvData?.totalLTV?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-600">総LTV</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <div className="text-2xl font-bold text-blue-600">
              {revenueProjection?.growthRate || 0}%
            </div>
            <div className="text-sm text-gray-600">成長率</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <div className="text-2xl font-bold text-purple-600">
              {revenueProjection?.confidence || 0}%
            </div>
            <div className="text-sm text-gray-600">予測精度</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md text-center">
            <div className={`text-2xl font-bold ${
              riskAlerts.length === 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {riskAlerts.length}
            </div>
            <div className="text-sm text-gray-600">アクティブアラート</div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/dashboard" className="text-blue-500 hover:underline">
          ← メインダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
};
```

**完了条件**: 顧客セグメント分析が表示され、全財務分析機能が統合されて動作すること

#### ✅ 完了条件
1. LTV分析ダッシュボードが動作し、顧客価値が可視化される
2. 財務リスクアラートがリアルタイムで表示される
3. 収益予測グラフが3パターンで表示される
4. 顧客セグメント自動分析が機能する
5. 1時間間隔での自動更新が動作する

---

### タスク 2.3: MBTI個人最適化システム
**期間**: 5営業日  
**工数**: 5日  
**担当**: フロントエンドエンジニア  

#### 📋 要件定義
**機能要件**:
1. 個人MBTI分析ページ
2. チーム相性分析機能
3. 最適タスク推奨システム
4. パフォーマンス予測機能

**非機能要件**:
- MBTI分析精度: 90%以上
- 推奨タスク適合率: 85%以上
- 相性分析速度: 3秒以内

#### 🏗️ 実装詳細

##### Day 1-2: 個人MBTI分析ページ
**作業内容**:
```typescript
// /src/app/mbti/individual/[userId]/page.tsx (新規)
// /src/hooks/useMBTIAnalysis.ts (新規)
// /src/components/mbti/PersonalityProfile.tsx (新規)

const useMBTIAnalysis = (userId?: string) => {
  const [mbtiData, setMbtiData] = useState(null);
  const [teamCompatibility, setTeamCompatibility] = useState(null);
  const [taskRecommendations, setTaskRecommendations] = useState([]);

  const fetchIndividualMBTI = useCallback(async (targetUserId: string) => {
    const response = await fetch(`/api/mbti/individual/${targetUserId}`);
    const data = await response.json();
    setMbtiData(data);
  }, []);

  const fetchTeamCompatibility = useCallback(async (userIds: string[]) => {
    const response = await fetch('/api/mbti/compatibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds })
    });
    const data = await response.json();
    setTeamCompatibility(data);
  }, []);

  const fetchTaskRecommendations = useCallback(async (targetUserId: string) => {
    const response = await fetch(`/api/mbti/task-recommendations?userId=${targetUserId}`);
    const data = await response.json();
    setTaskRecommendations(data.recommendations || []);
  }, []);

  return {
    mbtiData,
    teamCompatibility,
    taskRecommendations,
    fetchIndividualMBTI,
    fetchTeamCompatibility,
    fetchTaskRecommendations
  };
};

const PersonalityProfile: React.FC<{ userId: string }> = ({ userId }) => {
  const { mbtiData } = useMBTIAnalysis();

  useEffect(() => {
    fetchIndividualMBTI(userId);
  }, [userId]);

  if (!mbtiData) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded"></div>;
  }

  const mbtiColors = {
    'E': 'bg-red-100 text-red-800',
    'I': 'bg-blue-100 text-blue-800',
    'S': 'bg-green-100 text-green-800',
    'N': 'bg-purple-100 text-purple-800',
    'T': 'bg-yellow-100 text-yellow-800',
    'F': 'bg-pink-100 text-pink-800',
    'J': 'bg-indigo-100 text-indigo-800',
    'P': 'bg-orange-100 text-orange-800'
  };

  const getStrengthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* MBTI タイプ表示 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">🧠 MBTI性格タイプ</h3>
          <div className="text-sm text-gray-500">
            信頼度: {mbtiData.confidenceScore}%
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="text-6xl font-bold text-blue-600 mb-2">
            {mbtiData.mbtiType}
          </div>
          <div className="text-xl text-gray-800 font-medium">
            {mbtiData.typeName}
          </div>
          <div className="text-gray-600 mt-2">
            {mbtiData.typeDescription}
          </div>
        </div>

        {/* 4次元分析 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mbtiData.dimensions?.map((dimension, index) => (
            <div key={index} className="text-center">
              <div className={`inline-block px-3 py-2 rounded-full text-sm font-medium ${
                mbtiColors[dimension.dominant]
              }`}>
                {dimension.dominant}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {dimension.percentage}%
              </div>
              <div className="text-xs text-gray-500">
                {dimension.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 強み・特徴分析 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">💪 強み・特徴分析</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">主要な強み</h4>
            <div className="space-y-2">
              {mbtiData.strengths?.map((strength, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{strength.name}</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className={`h-2 rounded-full ${
                          strength.score >= 80 ? 'bg-green-500' :
                          strength.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${strength.score}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-medium ${getStrengthColor(strength.score)}`}>
                      {strength.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">改善領域</h4>
            <div className="space-y-2">
              {mbtiData.developmentAreas?.map((area, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{area.name}</span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${area.improvementPotential}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium text-blue-600">
                      {area.improvementPotential}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 適性職務 */}
        <div className="mt-6">
          <h4 className="font-medium mb-3">適性職務・役割</h4>
          <div className="flex flex-wrap gap-2">
            {mbtiData.suitableRoles?.map((role, index) => (
              <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 作業スタイル分析 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">⚙️ 作業スタイル分析</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium mb-3">コミュニケーション</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>直接性</span>
                <span className="font-medium">{mbtiData.workStyle?.communication?.directness}%</span>
              </div>
              <div className="flex justify-between">
                <span>詳細志向</span>
                <span className="font-medium">{mbtiData.workStyle?.communication?.detailOriented}%</span>
              </div>
              <div className="flex justify-between">
                <span>感情表現</span>
                <span className="font-medium">{mbtiData.workStyle?.communication?.emotional}%</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">意思決定</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>論理性</span>
                <span className="font-medium">{mbtiData.workStyle?.decisionMaking?.logical}%</span>
              </div>
              <div className="flex justify-between">
                <span>速度</span>
                <span className="font-medium">{mbtiData.workStyle?.decisionMaking?.speed}%</span>
              </div>
              <div className="flex justify-between">
                <span>リスク許容度</span>
                <span className="font-medium">{mbtiData.workStyle?.decisionMaking?.riskTolerance}%</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">ストレス管理</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>ストレス耐性</span>
                <span className="font-medium">{mbtiData.workStyle?.stress?.tolerance}%</span>
              </div>
              <div className="flex justify-between">
                <span>回復速度</span>
                <span className="font-medium">{mbtiData.workStyle?.stress?.recovery}%</span>
              </div>
              <div className="flex justify-between">
                <span>サポート必要度</span>
                <span className="font-medium">{mbtiData.workStyle?.stress?.supportNeed}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded">
          <h5 className="font-medium text-blue-800 mb-2">最適な作業環境</h5>
          <p className="text-sm text-blue-700">{mbtiData.optimalWorkEnvironment}</p>
        </div>
      </div>
    </div>
  );
};

// /src/app/mbti/individual/[userId]/page.tsx
const IndividualMBTIPage: React.FC<{ params: { userId: string } }> = ({ params }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">🧠 個人MBTI分析</h1>
        <p className="text-gray-600 mt-2">
          AI分析による詳細な性格プロファイルと最適化提案
        </p>
      </div>

      <PersonalityProfile userId={params.userId} />

      <div className="mt-8 text-center">
        <Link href="/mbti" className="text-blue-500 hover:underline">
          ← MBTI分析に戻る
        </Link>
      </div>
    </div>
  );
};
```

**完了条件**: 個人MBTI分析ページで詳細なプロファイルが表示されること

##### Day 3-4: チーム相性分析・最適タスク推奨システム
**作業内容**:
```typescript
// /src/components/mbti/TeamCompatibilityAnalysis.tsx
const TeamCompatibilityAnalysis: React.FC<{ userIds: string[] }> = ({ userIds }) => {
  const { teamCompatibility, fetchTeamCompatibility } = useMBTIAnalysis();

  useEffect(() => {
    if (userIds.length >= 2) {
      fetchTeamCompatibility(userIds);
    }
  }, [userIds]);

  if (!teamCompatibility) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded"></div>;
  }

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">🤝 チーム相性分析</h3>
      
      {/* 総合相性スコア */}
      <div className="text-center mb-6">
        <div className={`text-4xl font-bold mb-2 ${getCompatibilityColor(teamCompatibility.overallScore).split(' ')[0]}`}>
          {teamCompatibility.overallScore}%
        </div>
        <div className="text-gray-600">総合相性スコア</div>
        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getCompatibilityColor(teamCompatibility.overallScore)}`}>
          {teamCompatibility.overallScore >= 80 ? '優秀' :
           teamCompatibility.overallScore >= 60 ? '良好' : '要改善'}
        </div>
      </div>

      {/* 相性マトリックス */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">メンバー間相性マトリックス</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2"></th>
                {teamCompatibility.members?.map((member, index) => (
                  <th key={index} className="text-center p-2 font-medium">
                    {member.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teamCompatibility.members?.map((member, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="p-2 font-medium">{member.name}</td>
                  {teamCompatibility.members.map((otherMember, colIndex) => {
                    if (rowIndex === colIndex) {
                      return <td key={colIndex} className="text-center p-2">-</td>;
                    }
                    const compatibility = teamCompatibility.matrix?.[rowIndex]?.[colIndex] || 0;
                    return (
                      <td key={colIndex} className="text-center p-2">
                        <span className={`inline-block w-8 h-8 rounded text-xs leading-8 font-medium ${getCompatibilityColor(compatibility)}`}>
                          {compatibility}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 相性分析詳細 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-3">強み・シナジー</h4>
          <div className="space-y-2">
            {teamCompatibility.strengths?.map((strength, index) => (
              <div key={index} className="flex items-start">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">{strength.title}</div>
                  <div className="text-xs text-gray-600">{strength.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">課題・改善点</h4>
          <div className="space-y-2">
            {teamCompatibility.challenges?.map((challenge, index) => (
              <div key={index} className="flex items-start">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">{challenge.title}</div>
                  <div className="text-xs text-gray-600">{challenge.description}</div>
                  {challenge.solution && (
                    <div className="text-xs text-blue-600 mt-1">
                      💡 {challenge.solution}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 役割分担提案 */}
      <div className="mt-6">
        <h4 className="font-medium mb-3">最適役割分担</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamCompatibility.roleAssignments?.map((assignment, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="font-medium text-sm">{assignment.role}</div>
              <div className="text-xs text-gray-600 mt-1">{assignment.member}</div>
              <div className="text-xs text-blue-600 mt-1">
                適合度: {assignment.fitScore}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// /src/components/mbti/TaskRecommendations.tsx
const TaskRecommendations: React.FC<{ userId: string }> = ({ userId }) => {
  const { taskRecommendations, fetchTaskRecommendations } = useMBTIAnalysis();

  useEffect(() => {
    fetchTaskRecommendations(userId);
  }, [userId]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-green-600 bg-green-100';
    }
  };

  const getFitColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">🎯 最適タスク推奨</h3>
      
      {taskRecommendations.length > 0 ? (
        <div className="space-y-4">
          {taskRecommendations.map((task, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h4 className="font-medium">{task.title}</h4>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">推定工数:</span>
                      <span className="font-medium ml-1">{task.estimatedHours}時間</span>
                    </div>
                    <div>
                      <span className="text-gray-500">難易度:</span>
                      <span className="font-medium ml-1">{task.difficulty}/5</span>
                    </div>
                    <div>
                      <span className="text-gray-500">期限:</span>
                      <span className="font-medium ml-1">
                        {format(new Date(task.dueDate), 'MM/dd')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-gray-500 text-sm">適性理由:</span>
                    <div className="text-sm text-blue-700 mt-1">
                      {task.reasonForRecommendation}
                    </div>
                  </div>

                  {task.requiredSkills && (
                    <div className="mt-3">
                      <span className="text-gray-500 text-sm">必要スキル:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {task.requiredSkills.map((skill, skillIndex) => (
                          <span key={skillIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="ml-4 text-center">
                  <div className={`text-2xl font-bold ${getFitColor(task.personalityFit)}`}>
                    {task.personalityFit}%
                  </div>
                  <div className="text-xs text-gray-500">適合度</div>
                  
                  <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                    アサイン
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          現在、推奨タスクはありません
        </div>
      )}
    </div>
  );
};
```

**完了条件**: チーム相性分析と最適タスク推奨が機能すること

##### Day 5: パフォーマンス予測・統合・テスト
**作業内容**:
```typescript
// /src/components/mbti/PerformancePrediction.tsx
const PerformancePrediction: React.FC<{ userId: string; projectId?: string }> = ({ 
  userId, 
  projectId 
}) => {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const response = await fetch(
          `/api/mbti/performance-prediction?userId=${userId}${projectId ? `&projectId=${projectId}` : ''}`
        );
        const data = await response.json();
        setPerformanceData(data);
      } catch (error) {
        console.error('Failed to fetch performance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [userId, projectId]);

  if (loading) return <div className="animate-pulse bg-gray-200 h-64 rounded"></div>;

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">📊 パフォーマンス予測</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="text-center">
          <div className={`text-3xl font-bold ${getPerformanceColor(performanceData?.overallScore || 0)}`}>
            {performanceData?.overallScore || 0}%
          </div>
          <div className="text-sm text-gray-600">総合パフォーマンス予測</div>
        </div>
        
        <div className="text-center">
          <div className={`text-3xl font-bold ${getPerformanceColor(performanceData?.productivityScore || 0)}`}>
            {performanceData?.productivityScore || 0}%
          </div>
          <div className="text-sm text-gray-600">生産性予測</div>
        </div>
        
        <div className="text-center">
          <div className={`text-3xl font-bold ${getPerformanceColor(performanceData?.satisfactionScore || 0)}`}>
            {performanceData?.satisfactionScore || 0}%
          </div>
          <div className="text-sm text-gray-600">満足度予測</div>
        </div>
      </div>

      {/* 詳細分析 */}
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-3">パフォーマンス要因分析</h4>
          <div className="space-y-2">
            {performanceData?.factors?.map((factor, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{factor.name}</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className={`h-2 rounded-full ${
                        factor.impact >= 0.7 ? 'bg-green-500' :
                        factor.impact >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${factor.impact * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium w-8">
                    {Math.round(factor.impact * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">時系列パフォーマンス予測</h4>
          {performanceData?.timeline && (
            <Line data={{
              labels: performanceData.timeline.map(item => item.week),
              datasets: [{
                label: 'パフォーマンス予測',
                data: performanceData.timeline.map(item => item.predictedPerformance),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
              }, {
                label: 'ストレスレベル',
                data: performanceData.timeline.map(item => item.stressLevel),
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderDash: [5, 5],
                tension: 0.4
              }]
            }} options={{
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: (value) => `${value}%`
                  }
                }
              },
              plugins: {
                legend: { position: 'bottom' }
              }
            }} />
          )}
        </div>

        <div>
          <h4 className="font-medium mb-3">最適化提案</h4>
          <div className="space-y-3">
            {performanceData?.optimizationSuggestions?.map((suggestion, index) => (
              <div key={index} className="border border-blue-200 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-blue-800">{suggestion.title}</h5>
                    <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                    <div className="text-xs text-blue-600 mt-2">
                      期待効果: +{suggestion.expectedImprovement}%
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
      </div>
    </div>
  );
};

// メインページ統合
// /src/app/mbti/page.tsx
const MBTIAnalysisPage: React.FC = () => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data.users || []);
    };
    fetchUsers();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">🧠 MBTI分析・最適化システム</h1>
        <p className="text-gray-600 mt-2">
          AI駆動による性格分析とパフォーマンス最適化
        </p>
      </div>

      {/* ユーザー選択 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-lg font-semibold mb-4">👥 分析対象選択</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {users.map(user => (
            <div key={user.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`user-${user.id}`}
                  checked={selectedUsers.includes(user.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(prev => [...prev, user.id]);
                    } else {
                      setSelectedUsers(prev => prev.filter(id => id !== user.id));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={`user-${user.id}`} className="ml-2 text-sm font-medium">
                  {user.name}
                </label>
              </div>
              {user.mbtiType && (
                <div className="text-xs text-gray-500 mt-1">
                  {user.mbtiType}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 分析結果表示 */}
      <div className="space-y-8">
        {selectedUsers.length === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PersonalityProfile userId={selectedUsers[0]} />
            <div className="space-y-6">
              <TaskRecommendations userId={selectedUsers[0]} />
              <PerformancePrediction userId={selectedUsers[0]} />
            </div>
          </div>
        )}

        {selectedUsers.length >= 2 && (
          <TeamCompatibilityAnalysis userIds={selectedUsers} />
        )}

        {selectedUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🧠</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              分析対象を選択してください
            </h3>
            <p className="text-gray-500">
              1人選択で個人分析、2人以上でチーム分析が表示されます
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
```

**完了条件**: パフォーマンス予測が表示され、全MBTI機能が統合されて動作すること

#### ✅ 完了条件
1. 個人MBTI分析ページで詳細プロファイルが表示される
2. チーム相性分析で相性スコアとマトリックスが表示される
3. 最適タスク推奨システムが動作する
4. パフォーマンス予測機能が動作する
5. 全機能が統合されたメインページが動作する

---

## 📊 Phase 2 完了基準

### 機能完成チェックリスト
- [ ] プロジェクトテンプレート適用システム完成（4つの機能すべて動作）
- [ ] 財務リスク自動監視システム完成（4つの機能すべて動作）
- [ ] MBTI個人最適化システム完成（4つの機能すべて動作）
- [ ] 既存システムとの統合確認
- [ ] API接続・データ同期確認
- [ ] パフォーマンステスト合格（3秒以内表示）

### 品質保証チェックリスト
- [ ] 単体テスト実施・合格（85%以上カバレッジ）
- [ ] 統合テスト実施・合格
- [ ] ユーザビリティテスト実施・合格
- [ ] セキュリティテスト実施・合格
- [ ] パフォーマンステスト実施・合格

### リリース準備チェックリスト
- [ ] プロダクション環境デプロイ
- [ ] データベースマイグレーション実行
- [ ] 監視・アラート設定完了
- [ ] ユーザーガイド・トレーニング資料作成
- [ ] バックアップ・復旧手順確認

### 成功指標達成確認
- [ ] プロジェクト立ち上げ効率500%向上確認
- [ ] 財務リスク検知率95%以上達成
- [ ] チーム生産性300%向上確認
- [ ] システム完成度70%達成（77/109 API活用）

---

**Phase 2完了後のNext Steps**:
1. ユーザーフィードバック収集・分析
2. Phase 3実装計画の最終調整
3. システム負荷・パフォーマンス最適化
4. 新機能の効果測定・改善

**緊急時対応**:
- 機能不具合時のロールバック手順完備
- 24時間サポート体制整備
- エラー監視・自動アラート設定
- データ整合性チェック・修復機能

**Phase 3への準備**:
- [ ] 高度統合機能の要件詳細化
- [ ] リソース配分計画更新
- [ ] エンタープライズ機能の仕様確定
- [ ] スケーラビリティ設計レビュー