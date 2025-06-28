// Phase 2: Project Templates Hook
// プロジェクトテンプレート機能用カスタムフック

import { useState, useCallback, useEffect } from 'react';

export interface ProjectTemplate {
  id: string;
  title: string;
  description: string;
  category: 'web-development' | 'mobile-app' | 'data-analysis' | 'marketing' | 'business' | 'research';
  industry: 'tech' | 'healthcare' | 'finance' | 'education' | 'retail' | 'manufacturing' | 'consulting';
  complexity: 'simple' | 'medium' | 'complex';
  estimatedDuration: number; // 日数
  teamSize: number;
  tags: string[];
  
  // テンプレート構成
  phases: TemplatePhase[];
  tasks: TemplateTask[];
  deliverables: string[];
  technologies: string[];
  
  // メタデータ
  usageCount: number;
  averageSuccessRate: number;
  lastUsed: Date | null;
  createdAt: Date;
  createdBy: string;
}

export interface TemplatePhase {
  id: string;
  name: string;
  description: string;
  order: number;
  estimatedDays: number;
  dependencies: string[];
}

export interface TemplateTask {
  id: string;
  title: string;
  description: string;
  phaseId: string;
  estimatedHours: number;
  difficulty: number; // 1-10
  skillsRequired: string[];
  dependencies: string[];
  deliverables: string[];
}

export interface ProjectRequirements {
  title: string;
  description: string;
  industry: string;
  budget?: number;
  timeline?: number; // 日数
  teamSize?: number;
  requiredSkills?: string[];
  technologies?: string[];
  customFeatures?: string[];
}

export interface TemplateCustomization {
  templateId: string;
  projectTitle: string;
  adjustments: {
    addedTasks?: Partial<TemplateTask>[];
    removedTaskIds?: string[];
    modifiedTasks?: { id: string; changes: Partial<TemplateTask> }[];
    addedPhases?: Partial<TemplatePhase>[];
    removedPhaseIds?: string[];
    timelineAdjustment?: number; // パーセンテージ
    teamSizeOverride?: number;
  };
}

export interface GeneratedProject {
  id: string;
  title: string;
  description: string;
  phases: ProjectPhase[];
  tasks: ProjectTask[];
  estimatedCompletion: Date;
  totalEstimatedHours: number;
  templateId: string;
}

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  phaseId: string;
  estimatedHours: number;
  difficulty: number;
  assigneeId?: string;
  status: 'pending' | 'in-progress' | 'completed';
  dependencies: string[];
}

export const useProjectTemplates = () => {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [customization, setCustomization] = useState<TemplateCustomization | null>(null);
  
  // フィルター状態
  const [filters, setFilters] = useState({
    category: 'all',
    industry: 'all',
    complexity: 'all',
    duration: 'all', // 'short' (1-7日), 'medium' (8-30日), 'long' (31日以上)
    teamSize: 'all' // 'small' (1-3人), 'medium' (4-8人), 'large' (9人以上)
  });

  // テンプレート一覧を取得
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/project-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await response.json();
      setTemplates(data.templates || []);
      setFilteredTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // フィルター適用
  const applyFilters = useCallback(() => {
    let filtered = templates;

    if (filters.category !== 'all') {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    if (filters.industry !== 'all') {
      filtered = filtered.filter(t => t.industry === filters.industry);
    }

    if (filters.complexity !== 'all') {
      filtered = filtered.filter(t => t.complexity === filters.complexity);
    }

    if (filters.duration !== 'all') {
      filtered = filtered.filter(t => {
        if (filters.duration === 'short') return t.estimatedDuration <= 7;
        if (filters.duration === 'medium') return t.estimatedDuration > 7 && t.estimatedDuration <= 30;
        if (filters.duration === 'long') return t.estimatedDuration > 30;
        return true;
      });
    }

    if (filters.teamSize !== 'all') {
      filtered = filtered.filter(t => {
        if (filters.teamSize === 'small') return t.teamSize <= 3;
        if (filters.teamSize === 'medium') return t.teamSize > 3 && t.teamSize <= 8;
        if (filters.teamSize === 'large') return t.teamSize > 8;
        return true;
      });
    }

    setFilteredTemplates(filtered);
  }, [templates, filters]);

  // AIによるテンプレート生成
  const generateTemplate = useCallback(async (requirements: ProjectRequirements): Promise<ProjectTemplate> => {
    try {
      const response = await fetch('/api/project-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requirements)
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate template');
      }
      
      const result = await response.json();
      
      // テンプレート一覧を更新
      await fetchTemplates();
      
      return result.template;
    } catch (error) {
      console.error('Template generation failed:', error);
      throw error;
    }
  }, [fetchTemplates]);

  // テンプレートのプレビュー
  const previewTemplate = useCallback(async (templateId: string): Promise<{
    template: ProjectTemplate;
    estimatedMetrics: {
      totalTasks: number;
      totalHours: number;
      estimatedDuration: number;
      complexityScore: number;
      successProbability: number;
    };
  }> => {
    try {
      const response = await fetch(`/api/project-templates/${templateId}/preview`);
      if (!response.ok) {
        throw new Error('Failed to preview template');
      }
      return await response.json();
    } catch (error) {
      console.error('Template preview failed:', error);
      throw error;
    }
  }, []);

  // テンプレートをプロジェクトに適用
  const applyTemplate = useCallback(async (
    templateId: string, 
    customizations: TemplateCustomization
  ): Promise<GeneratedProject> => {
    try {
      const response = await fetch('/api/projects/from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          customizations
        })
      });

      if (!response.ok) {
        throw new Error('Failed to apply template');
      }

      const result = await response.json();
      return result.project;
    } catch (error) {
      console.error('Template application failed:', error);
      throw error;
    }
  }, []);

  // 既存プロジェクトからテンプレート作成
  const createTemplateFromProject = useCallback(async (
    projectId: string,
    templateData: Partial<ProjectTemplate>
  ): Promise<ProjectTemplate> => {
    try {
      const response = await fetch('/api/project-templates/from-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ...templateData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create template from project');
      }

      const result = await response.json();
      
      // テンプレート一覧を更新
      await fetchTemplates();
      
      return result.template;
    } catch (error) {
      console.error('Template creation from project failed:', error);
      throw error;
    }
  }, [fetchTemplates]);

  // テンプレートの削除
  const deleteTemplate = useCallback(async (templateId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/project-templates/${templateId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      // テンプレート一覧を更新
      await fetchTemplates();
    } catch (error) {
      console.error('Template deletion failed:', error);
      throw error;
    }
  }, [fetchTemplates]);

  // フィルターの更新
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // フィルターのリセット
  const resetFilters = useCallback(() => {
    setFilters({
      category: 'all',
      industry: 'all',
      complexity: 'all',
      duration: 'all',
      teamSize: 'all'
    });
  }, []);

  // 初期化
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // フィルター適用
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return {
    // データ
    templates,
    filteredTemplates,
    selectedTemplate,
    customization,
    filters,
    loading,
    error,

    // アクション
    generateTemplate,
    previewTemplate,
    applyTemplate,
    createTemplateFromProject,
    deleteTemplate,
    setSelectedTemplate,
    setCustomization,
    updateFilters,
    resetFilters,
    refetch: fetchTemplates
  };
};