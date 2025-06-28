'use client';

import React, { useState, useEffect } from 'react';
import { ProjectTemplate, TemplateCustomization } from '@/hooks/useProjectTemplates';
import { Calendar, Users, PlayCircle, CheckCircle, AlertCircle, ArrowRight, Save } from 'lucide-react';

interface ProjectGenerationProps {
  template: ProjectTemplate;
  customization: TemplateCustomization;
  onComplete: (projectId: string) => void;
  onBack: () => void;
}

export default function ProjectGeneration({ template, customization, onComplete, onBack }: ProjectGenerationProps) {
  const [projectSettings, setProjectSettings] = useState({
    name: customization.projectTitle,
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    teamMembers: [] as string[],
    priority: 'medium' as 'low' | 'medium' | 'high',
    budget: '',
    goals: ''
  });

  const [generationStep, setGenerationStep] = useState<'confirm' | 'generating' | 'success' | 'error'>('confirm');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedProjectId, setGeneratedProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // カスタマイズ情報からサマリーを計算
  const calculateSummary = () => {
    const adjustments = customization.adjustments;
    const baseTaskCount = template.tasks.length;
    const baseDuration = template.estimatedDuration;
    
    let finalTaskCount = baseTaskCount;
    let finalDuration = baseDuration;

    if (adjustments.addedTasks) finalTaskCount += adjustments.addedTasks.length;
    if (adjustments.removedTaskIds) finalTaskCount -= adjustments.removedTaskIds.length;
    if (adjustments.timelineAdjustment) finalDuration = Math.round(baseDuration * (adjustments.timelineAdjustment / 100));

    return {
      taskCount: finalTaskCount,
      duration: finalDuration,
      teamSize: adjustments.teamSizeOverride || template.teamSize
    };
  };

  const summary = calculateSummary();

  // プロジェクト生成処理
  const generateProject = async () => {
    setGenerationStep('generating');
    setGenerationProgress(0);
    setError(null);

    try {
      // 段階的な進捗表示のシミュレーション
      const steps = [
        { progress: 20, message: 'プロジェクト構造を作成中...' },
        { progress: 40, message: 'フェーズを設定中...' },
        { progress: 60, message: 'タスクを生成中...' },
        { progress: 80, message: 'チームメンバーを設定中...' },
        { progress: 100, message: '最終調整中...' }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setGenerationProgress(step.progress);
      }

      // 実際のAPI呼び出し
      const response = await fetch('/api/projects/from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: template.id,
          customization,
          projectSettings
        })
      });

      if (!response.ok) {
        throw new Error('プロジェクトの生成に失敗しました');
      }

      const result = await response.json();
      setGeneratedProjectId(result.projectId);
      setGenerationStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
      setGenerationStep('error');
    }
  };

  // 完了処理
  const handleComplete = () => {
    if (generatedProjectId) {
      onComplete(generatedProjectId);
    }
  };

  if (generationStep === 'generating') {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <div className="mb-6">
            <PlayCircle className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              プロジェクトを生成中...
            </h2>
            <p className="text-gray-600">
              テンプレートとカスタマイズ設定を基にプロジェクトを作成しています
            </p>
          </div>

          {/* プログレスバー */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${generationProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">{generationProgress}% 完了</p>
        </div>
      </div>
    );
  }

  if (generationStep === 'success') {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            プロジェクト生成完了！
          </h2>
          <p className="text-gray-600 mb-6">
            「{projectSettings.name}」が正常に作成されました
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-800 mb-2">生成されたプロジェクト</h3>
            <div className="text-sm text-green-700 space-y-1">
              <p>• {summary.taskCount}個のタスク</p>
              <p>• {template.phases.length}つのフェーズ</p>
              <p>• 推定期間: {summary.duration}日</p>
              <p>• チームサイズ: {summary.teamSize}人</p>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={handleComplete}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              プロジェクトを開く
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (generationStep === 'error') {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            エラーが発生しました
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>

          <div className="flex justify-center space-x-4">
            <button
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              戻る
            </button>
            <button
              onClick={() => {
                setGenerationStep('confirm');
                setError(null);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              再試行
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 確認画面
  return (
    <div className="space-y-6">
      {/* プロジェクト最終確認 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">プロジェクト生成の最終確認</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              プロジェクト名
            </label>
            <input
              type="text"
              value={projectSettings.name}
              onChange={(e) => setProjectSettings({...projectSettings, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              開始日
            </label>
            <input
              type="date"
              value={projectSettings.startDate}
              onChange={(e) => setProjectSettings({...projectSettings, startDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            プロジェクトの説明
          </label>
          <textarea
            value={projectSettings.description}
            onChange={(e) => setProjectSettings({...projectSettings, description: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="プロジェクトの目的や背景を記述してください"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              優先度
            </label>
            <select
              value={projectSettings.priority}
              onChange={(e) => setProjectSettings({...projectSettings, priority: e.target.value as any})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              予算（任意）
            </label>
            <input
              type="text"
              value={projectSettings.budget}
              onChange={(e) => setProjectSettings({...projectSettings, budget: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 500万円"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              目標・KPI（任意）
            </label>
            <input
              type="text"
              value={projectSettings.goals}
              onChange={(e) => setProjectSettings({...projectSettings, goals: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 売上20%向上"
            />
          </div>
        </div>
      </div>

      {/* プロジェクトサマリー */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">生成されるプロジェクト概要</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.taskCount}</div>
            <div className="text-sm text-blue-700">タスク数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{template.phases.length}</div>
            <div className="text-sm text-blue-700">フェーズ数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.duration}</div>
            <div className="text-sm text-blue-700">推定日数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.teamSize}</div>
            <div className="text-sm text-blue-700">チーム人数</div>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          戻る
        </button>
        <button
          onClick={generateProject}
          disabled={!projectSettings.name.trim()}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          プロジェクトを生成する
        </button>
      </div>
    </div>
  );
}