'use client';

import React, { useState, useEffect } from 'react';
import { ProjectTemplate, TemplateTask, TemplatePhase, TemplateCustomization } from '@/hooks/useProjectTemplates';
import { Plus, Trash2, Edit2, Clock, Users, ChevronDown, ChevronUp, Save, AlertCircle } from 'lucide-react';

interface TemplateCustomizationProps {
  template: ProjectTemplate;
  onNext: (customization: TemplateCustomization) => void;
  onBack: () => void;
}

export default function TemplateCustomizationComponent({ template, onNext, onBack }: TemplateCustomizationProps) {
  const [projectTitle, setProjectTitle] = useState('');
  const [customizedPhases, setCustomizedPhases] = useState<TemplatePhase[]>([...template.phases]);
  const [customizedTasks, setCustomizedTasks] = useState<TemplateTask[]>([...template.tasks]);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [timelineAdjustment, setTimelineAdjustment] = useState(100);
  const [teamSizeOverride, setTeamSizeOverride] = useState(template.teamSize);
  
  // 追加・削除された要素を追跡
  const [addedTasks, setAddedTasks] = useState<Partial<TemplateTask>[]>([]);
  const [removedTaskIds, setRemovedTaskIds] = useState<string[]>([]);
  const [addedPhases, setAddedPhases] = useState<Partial<TemplatePhase>[]>([]);
  const [removedPhaseIds, setRemovedPhaseIds] = useState<string[]>([]);
  const [modifiedTasks, setModifiedTasks] = useState<{ id: string; changes: Partial<TemplateTask> }[]>([]);

  // フェーズの展開/折りたたみ
  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  // 総工数を計算
  const calculateTotalHours = () => {
    return customizedTasks
      .filter(task => !removedTaskIds.includes(task.id))
      .reduce((total, task) => total + task.estimatedHours, 0) * (timelineAdjustment / 100);
  };

  // 総期間を計算
  const calculateTotalDays = () => {
    return customizedPhases
      .filter(phase => !removedPhaseIds.includes(phase.id))
      .reduce((total, phase) => total + phase.estimatedDays, 0) * (timelineAdjustment / 100);
  };

  // タスクの追加
  const addTask = (phaseId: string) => {
    const newTask: Partial<TemplateTask> = {
      id: `new-task-${Date.now()}`,
      title: '新しいタスク',
      description: '',
      phaseId,
      estimatedHours: 8,
      difficulty: 5,
      skillsRequired: [],
      dependencies: [],
      deliverables: []
    };
    
    setCustomizedTasks([...customizedTasks, newTask as TemplateTask]);
    setAddedTasks([...addedTasks, newTask]);
  };

  // タスクの削除
  const removeTask = (taskId: string) => {
    setCustomizedTasks(customizedTasks.filter(task => task.id !== taskId));
    if (taskId.startsWith('new-task-')) {
      setAddedTasks(addedTasks.filter(task => task.id !== taskId));
    } else {
      setRemovedTaskIds([...removedTaskIds, taskId]);
    }
  };

  // タスクの編集
  const updateTask = (taskId: string, field: keyof TemplateTask, value: any) => {
    setCustomizedTasks(customizedTasks.map(task => 
      task.id === taskId ? { ...task, [field]: value } : task
    ));

    if (!taskId.startsWith('new-task-')) {
      const existingModification = modifiedTasks.find(mod => mod.id === taskId);
      if (existingModification) {
        setModifiedTasks(modifiedTasks.map(mod => 
          mod.id === taskId 
            ? { ...mod, changes: { ...mod.changes, [field]: value } }
            : mod
        ));
      } else {
        setModifiedTasks([...modifiedTasks, { id: taskId, changes: { [field]: value } }]);
      }
    }
  };

  // フェーズの追加
  const addPhase = () => {
    const newPhase: Partial<TemplatePhase> = {
      id: `new-phase-${Date.now()}`,
      name: '新しいフェーズ',
      description: '',
      order: customizedPhases.length + 1,
      estimatedDays: 7,
      dependencies: []
    };
    
    setCustomizedPhases([...customizedPhases, newPhase as TemplatePhase]);
    setAddedPhases([...addedPhases, newPhase]);
  };

  // フェーズの削除
  const removePhase = (phaseId: string) => {
    setCustomizedPhases(customizedPhases.filter(phase => phase.id !== phaseId));
    setCustomizedTasks(customizedTasks.filter(task => task.phaseId !== phaseId));
    
    if (phaseId.startsWith('new-phase-')) {
      setAddedPhases(addedPhases.filter(phase => phase.id !== phaseId));
    } else {
      setRemovedPhaseIds([...removedPhaseIds, phaseId]);
    }
  };

  // カスタマイズデータを生成
  const generateCustomization = (): TemplateCustomization => {
    return {
      templateId: template.id,
      projectTitle,
      adjustments: {
        addedTasks: addedTasks.length > 0 ? addedTasks : undefined,
        removedTaskIds: removedTaskIds.length > 0 ? removedTaskIds : undefined,
        modifiedTasks: modifiedTasks.length > 0 ? modifiedTasks : undefined,
        addedPhases: addedPhases.length > 0 ? addedPhases : undefined,
        removedPhaseIds: removedPhaseIds.length > 0 ? removedPhaseIds : undefined,
        timelineAdjustment: timelineAdjustment !== 100 ? timelineAdjustment : undefined,
        teamSizeOverride: teamSizeOverride !== template.teamSize ? teamSizeOverride : undefined
      }
    };
  };

  const handleNext = () => {
    if (!projectTitle.trim()) {
      alert('プロジェクト名を入力してください');
      return;
    }
    onNext(generateCustomization());
  };

  return (
    <div className="space-y-6">
      {/* プロジェクト基本情報 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">プロジェクト基本情報</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              プロジェクト名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: ECサイトリニューアルプロジェクト"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                タイムライン調整
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={timelineAdjustment}
                  onChange={(e) => setTimelineAdjustment(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="w-16 text-center font-medium">{timelineAdjustment}%</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                推定期間: {Math.round(calculateTotalDays())}日
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                チームサイズ
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setTeamSizeOverride(Math.max(1, teamSizeOverride - 1))}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  -
                </button>
                <span className="w-16 text-center font-medium">{teamSizeOverride}人</span>
                <button
                  onClick={() => setTeamSizeOverride(teamSizeOverride + 1)}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* サマリー情報 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>カスタマイズ後の概要:</strong> 
              {customizedPhases.length}フェーズ、
              {customizedTasks.length}タスク、
              推定{Math.round(calculateTotalDays())}日、
              総工数{Math.round(calculateTotalHours())}時間
            </p>
          </div>
        </div>
      </div>

      {/* フェーズとタスクのカスタマイズ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">フェーズとタスク</h3>
          <button
            onClick={addPhase}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            フェーズ追加
          </button>
        </div>

        {customizedPhases
          .filter(phase => !removedPhaseIds.includes(phase.id))
          .map((phase, phaseIndex) => (
          <div key={phase.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => togglePhase(phase.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {expandedPhases.has(phase.id) ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-medium">
                      {phaseIndex + 1}
                    </span>
                    <h4 className="font-semibold text-gray-900">{phase.name}</h4>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {Math.round(phase.estimatedDays * (timelineAdjustment / 100))}日
                  </span>
                  <button
                    onClick={() => removePhase(phase.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {expandedPhases.has(phase.id) && (
              <div className="p-6 space-y-4">
                {/* タスク一覧 */}
                {customizedTasks
                  .filter(task => task.phaseId === phase.id && !removedTaskIds.includes(task.id))
                  .map((task, taskIndex) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                          className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-600">推定工数（時間）</label>
                            <input
                              type="number"
                              value={task.estimatedHours}
                              onChange={(e) => updateTask(task.id, 'estimatedHours', Number(e.target.value))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">難易度（1-10）</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={task.difficulty}
                              onChange={(e) => updateTask(task.id, 'difficulty', Number(e.target.value))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeTask(task.id)}
                        className="ml-4 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* タスク追加ボタン */}
                <button
                  onClick={() => addTask(phase.id)}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  タスクを追加
                </button>
              </div>
            )}
          </div>
        ))}
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
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          カスタマイズを保存して次へ
        </button>
      </div>
    </div>
  );
}