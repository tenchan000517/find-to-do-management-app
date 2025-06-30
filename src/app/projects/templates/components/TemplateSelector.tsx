// Phase 2: Template Selector Component
// テンプレート選択コンポーネント

"use client";

import { useState } from 'react';
import { ProjectTemplate, ProjectRequirements } from '@/hooks/useProjectTemplates';

interface TemplateSelectorProps {
  templates: ProjectTemplate[];
  filters: {
    category: string;
    industry: string;
    complexity: string;
    duration: string;
    teamSize: string;
  };
  onFilterUpdate: (filters: any) => void;
  onFilterReset: () => void;
  onTemplateSelect: (template: ProjectTemplate) => void;
  showCreateFromScratch: boolean;
  onCreateFromScratch: (show: boolean) => void;
  onGenerateTemplate: (requirements: ProjectRequirements) => Promise<ProjectTemplate>;
}

export default function TemplateSelector({
  templates,
  filters,
  onFilterUpdate,
  onFilterReset,
  onTemplateSelect,
  showCreateFromScratch,
  onCreateFromScratch,
  onGenerateTemplate
}: TemplateSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [generatingTemplate, setGeneratingTemplate] = useState(false);
  const [newProjectRequirements, setNewProjectRequirements] = useState<ProjectRequirements>({
    title: '',
    description: '',
    industry: 'tech',
    timeline: 30,
    teamSize: 5,
    requiredSkills: [],
    technologies: [],
    customFeatures: []
  });

  const getCategoryIcon = (category: string) => {
    const icons = {
      'web-development': '🌐',
      'mobile-app': '📱',
      'data-analysis': '📊',
      'marketing': '📈',
      'business': '💼',
      'research': '🔬'
    };
    return icons[category as keyof typeof icons] || '📋';
  };

  const getIndustryIcon = (industry: string) => {
    const icons = {
      'tech': '💻',
      'healthcare': '🏥',
      'finance': '💰',
      'education': '🎓',
      'retail': '🛍️',
      'manufacturing': '🏭',
      'consulting': '💡'
    };
    return icons[industry as keyof typeof icons] || '🏢';
  };

  const getComplexityColor = (complexity: string) => {
    const colors = {
      'simple': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'complex': 'bg-red-100 text-red-800'
    };
    return colors[complexity as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getComplexityText = (complexity: string) => {
    const texts = {
      'simple': 'シンプル',
      'medium': '標準',
      'complex': '複雑'
    };
    return texts[complexity as keyof typeof texts] || complexity;
  };

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleGenerateTemplate = async () => {
    if (!newProjectRequirements.title || !newProjectRequirements.description) {
      alert('プロジェクトタイトルと説明を入力してください');
      return;
    }

    setGeneratingTemplate(true);
    try {
      const template = await onGenerateTemplate(newProjectRequirements);
      onTemplateSelect(template);
      onCreateFromScratch(false);
    } catch (error) {
      console.error('Template generation failed:', error);
      alert('テンプレート生成に失敗しました');
    } finally {
      setGeneratingTemplate(false);
    }
  };

  if (showCreateFromScratch) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
            🤖 AI テンプレート生成
          </h2>
          <p className="text-gray-600">
            プロジェクトの要件を入力すると、AIが最適なテンプレートを生成します
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プロジェクトタイトル *
              </label>
              <input
                type="text"
                value={newProjectRequirements.title}
                onChange={(e) => setNewProjectRequirements(prev => ({
                  ...prev,
                  title: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例: ECサイトリニューアル"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                プロジェクト説明 *
              </label>
              <textarea
                value={newProjectRequirements.description}
                onChange={(e) => setNewProjectRequirements(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="プロジェクトの目的、背景、期待する成果を詳しく説明してください"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                業界
              </label>
              <select
                value={newProjectRequirements.industry}
                onChange={(e) => setNewProjectRequirements(prev => ({
                  ...prev,
                  industry: e.target.value
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="tech">テクノロジー</option>
                <option value="healthcare">ヘルスケア</option>
                <option value="finance">金融</option>
                <option value="education">教育</option>
                <option value="retail">小売</option>
                <option value="manufacturing">製造業</option>
                <option value="consulting">コンサルティング</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                期間 (日)
              </label>
              <input
                type="number"
                value={newProjectRequirements.timeline}
                onChange={(e) => setNewProjectRequirements(prev => ({
                  ...prev,
                  timeline: parseInt(e.target.value) || 30
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="365"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                チームサイズ (人)
              </label>
              <input
                type="number"
                value={newProjectRequirements.teamSize}
                onChange={(e) => setNewProjectRequirements(prev => ({
                  ...prev,
                  teamSize: parseInt(e.target.value) || 5
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                予算 (万円、任意)
              </label>
              <input
                type="number"
                value={newProjectRequirements.budget || ''}
                onChange={(e) => setNewProjectRequirements(prev => ({
                  ...prev,
                  budget: e.target.value ? parseInt(e.target.value) : undefined
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="100"
                min="1"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onCreateFromScratch(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleGenerateTemplate}
            disabled={generatingTemplate || !newProjectRequirements.title || !newProjectRequirements.description}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {generatingTemplate ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                AI生成中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                テンプレート生成
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* フィルターと検索 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
            <select
              value={filters.category}
              onChange={(e) => onFilterUpdate({ category: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">すべて</option>
              <option value="web-development">Web開発</option>
              <option value="mobile-app">モバイルアプリ</option>
              <option value="data-analysis">データ分析</option>
              <option value="marketing">マーケティング</option>
              <option value="business">ビジネス</option>
              <option value="research">研究</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">業界</label>
            <select
              value={filters.industry}
              onChange={(e) => onFilterUpdate({ industry: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">すべて</option>
              <option value="tech">テクノロジー</option>
              <option value="healthcare">ヘルスケア</option>
              <option value="finance">金融</option>
              <option value="education">教育</option>
              <option value="retail">小売</option>
              <option value="manufacturing">製造業</option>
              <option value="consulting">コンサルティング</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">複雑度</label>
            <select
              value={filters.complexity}
              onChange={(e) => onFilterUpdate({ complexity: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">すべて</option>
              <option value="simple">シンプル</option>
              <option value="medium">標準</option>
              <option value="complex">複雑</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">期間</label>
            <select
              value={filters.duration}
              onChange={(e) => onFilterUpdate({ duration: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">すべて</option>
              <option value="short">短期 (1-7日)</option>
              <option value="medium">中期 (8-30日)</option>
              <option value="long">長期 (31日以上)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">チーム規模</label>
            <select
              value={filters.teamSize}
              onChange={(e) => onFilterUpdate({ teamSize: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">すべて</option>
              <option value="small">小規模 (1-3人)</option>
              <option value="medium">中規模 (4-8人)</option>
              <option value="large">大規模 (9人以上)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={onFilterReset}
              className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              リセット
            </button>
          </div>
        </div>

        <div>
          <input
            type="text"
            placeholder="テンプレートを検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* テンプレート一覧 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer"
            onClick={() => onTemplateSelect(template)}
          >
            <div className="p-6">
              {/* ヘッダー */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(template.category)}</span>
                  <span className="text-lg">{getIndustryIcon(template.industry)}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(template.complexity)}`}>
                  {getComplexityText(template.complexity)}
                </span>
              </div>

              {/* タイトルと説明 */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {template.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {template.description}
              </p>

              {/* メトリクス */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{template.estimatedDuration}</div>
                  <div className="text-xs text-gray-500">日</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{template.teamSize}</div>
                  <div className="text-xs text-gray-500">人</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">{template.tasks.length}</div>
                  <div className="text-xs text-gray-500">タスク</div>
                </div>
              </div>

              {/* タグ */}
              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                  >
                    {tag}
                  </span>
                ))}
                {template.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                    +{template.tags.length - 3}
                  </span>
                )}
              </div>

              {/* 利用統計 */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  {template.usageCount}回使用
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {template.averageSuccessRate}%成功率
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            テンプレートが見つかりませんでした
          </h3>
          <p className="text-gray-600 mb-4">
            検索条件を変更するか、新しいテンプレートを作成してください
          </p>
          <button
            onClick={() => onCreateFromScratch(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            AIでテンプレート生成
          </button>
        </div>
      )}
    </div>
  );
}