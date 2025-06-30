'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  HelpCircle, 
  Lightbulb, 
  Brain,
  Target,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronRight,
  Sparkles,
  Eye,
  Settings,
  User,
  Calendar,
  BarChart3
} from 'lucide-react';

interface ContextualHint {
  id: string;
  type: 'tip' | 'warning' | 'suggestion' | 'insight' | 'shortcut';
  title: string;
  content: string;
  context: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
  dismissible: boolean;
  confidence: number;
}

interface UserContext {
  currentPage: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  taskCount: number;
  completionRate: number;
  lastActivity: string;
  strugglingWith?: string[];
  preferences: {
    showTips: boolean;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
}

interface ContextAwareHelperProps {
  className?: string;
  context?: Partial<UserContext>;
  onHintDismiss?: (hintId: string) => void;
  onActionExecute?: (action: any) => void;
}

export default function ContextAwareHelper({ 
  className = '',
  context = {},
  onHintDismiss,
  onActionExecute
}: ContextAwareHelperProps) {
  const [hints, setHints] = useState<ContextualHint[]>([]);
  const [userContext, setUserContext] = useState<UserContext>({
    currentPage: 'dashboard',
    timeOfDay: 'morning',
    taskCount: 5,
    completionRate: 0.7,
    lastActivity: 'task_creation',
    strugglingWith: ['time_management'],
    preferences: {
      showTips: true,
      difficulty: 'intermediate'
    },
    ...context
  });
  const [showSettings, setShowSettings] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    generateContextualHints();
  }, [userContext]);

  const generateContextualHints = () => {
    const generatedHints: ContextualHint[] = [];

    // 時間帯に基づくヒント
    if (userContext.timeOfDay === 'morning') {
      generatedHints.push({
        id: 'morning-planning',
        type: 'tip',
        title: '朝の計画立て',
        content: '朝の時間は計画立てに最適です。今日の重要なタスクを3つ選んで優先順位をつけましょう。',
        context: 'time_based',
        priority: 'high',
        actionable: true,
        action: {
          label: '今日のタスクを選択',
          callback: () => console.log('Select daily tasks')
        },
        dismissible: true,
        confidence: 0.9
      });
    }

    // 完了率に基づくヒント
    if (userContext.completionRate < 0.5) {
      generatedHints.push({
        id: 'completion-rate-low',
        type: 'warning',
        title: 'タスク完了率が低下中',
        content: 'タスクの完了率が50%を下回っています。タスクを細分化して、達成しやすい目標に設定し直すことをお勧めします。',
        context: 'performance',
        priority: 'high',
        actionable: true,
        action: {
          label: 'タスクを分割する',
          callback: () => console.log('Break down tasks')
        },
        dismissible: false,
        confidence: 0.85
      });
    }

    // 現在のページに基づくヒント
    if (userContext.currentPage === 'task_creation') {
      generatedHints.push({
        id: 'task-creation-tip',
        type: 'tip',
        title: '効果的なタスク作成',
        content: 'タスクは「動詞 + 具体的な成果物」の形で書くと明確になります。例：「レポートを書く」→「売上分析レポートを完成させる」',
        context: 'page_specific',
        priority: 'medium',
        actionable: false,
        dismissible: true,
        confidence: 0.8
      });
    }

    // 困っていることに基づくヒント
    if (userContext.strugglingWith?.includes('time_management')) {
      generatedHints.push({
        id: 'time-management-insight',
        type: 'insight',
        title: '時間管理の改善提案',
        content: 'あなたの作業パターンを分析すると、25分作業 + 5分休憩のポモドーロテクニックが効果的かもしれません。',
        context: 'personalized',
        priority: 'medium',
        actionable: true,
        action: {
          label: 'ポモドーロタイマーを設定',
          callback: () => console.log('Set pomodoro timer')
        },
        dismissible: true,
        confidence: 0.78
      });
    }

    // タスク数に基づくヒント
    if (userContext.taskCount > 10) {
      generatedHints.push({
        id: 'task-overload',
        type: 'warning',
        title: 'タスクが多すぎます',
        content: '未完了タスクが10件を超えています。重要でないタスクの削除や延期を検討しましょう。',
        context: 'task_management',
        priority: 'high',
        actionable: true,
        action: {
          label: 'タスクを整理する',
          callback: () => console.log('Organize tasks')
        },
        dismissible: true,
        confidence: 0.92
      });
    }

    // ショートカットのヒント
    if (userContext.preferences.difficulty !== 'beginner') {
      generatedHints.push({
        id: 'keyboard-shortcut',
        type: 'shortcut',
        title: 'キーボードショートカット',
        content: 'Ctrl+N で新しいタスクを素早く作成できます。効率的なタスク管理にご活用ください。',
        context: 'productivity',
        priority: 'low',
        actionable: false,
        dismissible: true,
        confidence: 0.7
      });
    }

    // 成功に基づくヒント
    if (userContext.completionRate > 0.8) {
      generatedHints.push({
        id: 'high-performer',
        type: 'suggestion',
        title: '素晴らしい完了率です！',
        content: 'タスク完了率が80%を超えています。この調子を維持するために、週次の振り返りを設定することをお勧めします。',
        context: 'encouragement',
        priority: 'medium',
        actionable: true,
        action: {
          label: '週次振り返りを設定',
          callback: () => console.log('Set weekly review')
        },
        dismissible: true,
        confidence: 0.88
      });
    }

    // 優先度でソート
    const sortedHints = generatedHints.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    setHints(sortedHints);
  };

  const dismissHint = (hintId: string) => {
    setHints(prev => prev.filter(hint => hint.id !== hintId));
    onHintDismiss?.(hintId);
  };

  const executeAction = (hint: ContextualHint) => {
    if (hint.action) {
      hint.action.callback();
      onActionExecute?.(hint.action);
    }
  };

  const getHintIcon = (type: string) => {
    switch (type) {
      case 'tip':
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'suggestion':
        return <Target className="h-4 w-4 text-blue-500" />;
      case 'insight':
        return <Brain className="h-4 w-4 text-purple-500" />;
      case 'shortcut':
        return <Sparkles className="h-4 w-4 text-green-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHintColor = (type: string, priority: string) => {
    if (priority === 'high') {
      return 'border-red-200 bg-red-50';
    }
    
    switch (type) {
      case 'tip':
        return 'border-yellow-200 bg-yellow-50';
      case 'warning':
        return 'border-red-200 bg-red-50';
      case 'suggestion':
        return 'border-blue-200 bg-blue-50';
      case 'insight':
        return 'border-purple-200 bg-purple-50';
      case 'shortcut':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };

    return (
      <Badge variant="secondary" className={`text-xs ${colors[priority as keyof typeof colors]}`}>
        {priority === 'high' ? '重要' : priority === 'medium' ? '中' : '低'}
      </Badge>
    );
  };

  if (minimized) {
    return (
      <Card className={`${className} w-48`}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">AIヘルプ</span>
              {hints.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {hints.length}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMinimized(false)}
              className="h-6 w-6 p-0"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <span>コンテキスト認識ヘルプ</span>
          </CardTitle>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="h-6 w-6 p-0"
            >
              <Settings className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMinimized(true)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* 設定パネル */}
        {showSettings && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">ヒント表示</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUserContext(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      showTips: !prev.preferences.showTips
                    }
                  }))}
                  className={`text-xs ${userContext.preferences.showTips ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {userContext.preferences.showTips ? 'ON' : 'OFF'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">難易度</span>
                <select
                  value={userContext.preferences.difficulty}
                  onChange={(e) => setUserContext(prev => ({
                    ...prev,
                    preferences: {
                      ...prev.preferences,
                      difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced'
                    }
                  }))}
                  className="text-xs border rounded px-2 py-1"
                >
                  <option value="beginner">初心者</option>
                  <option value="intermediate">中級者</option>
                  <option value="advanced">上級者</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {hints.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-gray-600">
              現在、特別なヒントはありません。<br />
              素晴らしい作業ぶりです！
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {hints.map((hint) => (
              <div
                key={hint.id}
                className={`p-3 rounded-lg border ${getHintColor(hint.type, hint.priority)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getHintIcon(hint.type)}
                    <span className="font-medium text-sm">{hint.title}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getPriorityBadge(hint.priority)}
                    {hint.dismissible && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissHint(hint.id)}
                        className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  {hint.content}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {hint.context}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      信頼度: {Math.round(hint.confidence * 100)}%
                    </span>
                  </div>

                  {hint.actionable && hint.action && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => executeAction(hint)}
                      className="text-xs"
                    >
                      {hint.action.label}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* コンテキスト情報 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center space-x-1 mb-1">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">完了率</span>
              </div>
              <div className="text-lg font-semibold text-blue-600">
                {Math.round(userContext.completionRate * 100)}%
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Clock className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">時間帯</span>
              </div>
              <div className="text-sm font-medium text-green-600 capitalize">
                {userContext.timeOfDay === 'morning' ? '朝' :
                 userContext.timeOfDay === 'afternoon' ? '昼' : '夜'}
              </div>
            </div>
          </div>

          <div className="mt-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={generateContextualHints}
              className="text-xs"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              ヒントを更新
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}