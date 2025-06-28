'use client';

import React from 'react';
import { ProjectTemplate } from '@/hooks/useProjectTemplates';
import { Calendar, Clock, Users, Package, Award, TrendingUp, Code, CheckCircle } from 'lucide-react';

interface TemplatePreviewProps {
  template: ProjectTemplate;
  onNext: () => void;
  onBack: () => void;
}

export default function TemplatePreview({ template, onNext, onBack }: TemplatePreviewProps) {
  // フェーズごとの色を定義
  const getPhaseColor = (index: number) => {
    const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'cyan'];
    return colors[index % colors.length];
  };

  // 複雑度のラベルを取得
  const getComplexityLabel = (complexity: string) => {
    const labels = {
      simple: { text: 'シンプル', color: 'green' },
      medium: { text: '中程度', color: 'yellow' },
      complex: { text: '複雑', color: 'red' }
    };
    return labels[complexity as keyof typeof labels] || labels.medium;
  };

  // 成功率に基づく色を取得
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー情報 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{template.title}</h2>
            <p className="text-gray-600">{template.description}</p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${getComplexityLabel(template.complexity).color}-100 text-${getComplexityLabel(template.complexity).color}-800`}>
              {getComplexityLabel(template.complexity).text}
            </span>
            <div className="flex items-center text-sm text-gray-500">
              <Award className="w-4 h-4 mr-1" />
              使用回数: {template.usageCount}回
            </div>
          </div>
        </div>

        {/* メトリクス */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-1">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="text-sm">推定期間</span>
            </div>
            <p className="text-xl font-semibold">{template.estimatedDuration}日</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-1">
              <Users className="w-4 h-4 mr-2" />
              <span className="text-sm">推奨チーム</span>
            </div>
            <p className="text-xl font-semibold">{template.teamSize}人</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-1">
              <TrendingUp className="w-4 h-4 mr-2" />
              <span className="text-sm">成功率</span>
            </div>
            <p className={`text-xl font-semibold ${getSuccessRateColor(template.averageSuccessRate)}`}>
              {template.averageSuccessRate}%
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-1">
              <Package className="w-4 h-4 mr-2" />
              <span className="text-sm">成果物数</span>
            </div>
            <p className="text-xl font-semibold">{template.deliverables.length}個</p>
          </div>
        </div>
      </div>

      {/* フェーズ構成ビジュアル */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">フェーズ構成</h3>
        <div className="relative">
          {/* タイムライン */}
          <div className="absolute left-0 top-8 bottom-0 w-1 bg-gray-200"></div>
          
          <div className="space-y-6">
            {template.phases.map((phase, index) => (
              <div key={phase.id} className="relative flex items-start">
                {/* フェーズマーカー */}
                <div className={`absolute left-0 w-8 h-8 bg-${getPhaseColor(index)}-500 rounded-full flex items-center justify-center text-white font-semibold text-sm -translate-x-3.5`}>
                  {index + 1}
                </div>
                
                {/* フェーズ内容 */}
                <div className="ml-8 flex-1">
                  <div className={`bg-${getPhaseColor(index)}-50 border border-${getPhaseColor(index)}-200 rounded-lg p-4`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{phase.name}</h4>
                      <span className="text-sm text-gray-600 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {phase.estimatedDays}日
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{phase.description}</p>
                    
                    {/* フェーズ内のタスク */}
                    <div className="space-y-2">
                      {template.tasks
                        .filter(task => task.phaseId === phase.id)
                        .slice(0, 3)
                        .map(task => (
                          <div key={task.id} className="flex items-center text-sm">
                            <CheckCircle className={`w-4 h-4 mr-2 text-${getPhaseColor(index)}-500`} />
                            <span className="text-gray-700">{task.title}</span>
                            <span className="text-gray-500 ml-auto">{task.estimatedHours}h</span>
                          </div>
                        ))}
                      {template.tasks.filter(task => task.phaseId === phase.id).length > 3 && (
                        <p className="text-sm text-gray-500 ml-6">
                          他 {template.tasks.filter(task => task.phaseId === phase.id).length - 3} タスク
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 技術スタック・スキル */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Code className="w-5 h-5 mr-2" />
            必要な技術スタック
          </h3>
          <div className="flex flex-wrap gap-2">
            {template.technologies.map((tech, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            必要なスキル
          </h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(template.tasks.flatMap(task => task.skillsRequired))).map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 成果物一覧 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Package className="w-5 h-5 mr-2" />
          期待される成果物
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {template.deliverables.map((deliverable, index) => (
            <div key={index} className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-gray-700">{deliverable}</span>
            </div>
          ))}
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
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          カスタマイズへ進む
        </button>
      </div>
    </div>
  );
}