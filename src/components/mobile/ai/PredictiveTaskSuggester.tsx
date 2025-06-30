'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Brain, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Lightbulb,
  TrendingUp 
} from 'lucide-react';
import { TaskSuggestion } from '@/lib/mobile/predictiveEngine';

interface PredictiveTaskSuggesterProps {
  className?: string;
  onTaskCreate?: (suggestion: TaskSuggestion) => void;
  onSuggestionFeedback?: (suggestionId: string, accepted: boolean) => void;
}

export default function PredictiveTaskSuggester({ 
  className = '',
  onTaskCreate,
  onSuggestionFeedback
}: PredictiveTaskSuggesterProps) {
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      // モックデータ - 将来的に予測エンジンから取得
      const mockSuggestions: TaskSuggestion[] = [
        {
          id: 'sug-1',
          title: 'プロジェクト進捗レビュー',
          description: '週次レビューの時間です。今週完了したタスクと来週の計画を確認しましょう。',
          priority: 'HIGH',
          estimatedDuration: 30,
          tags: ['レビュー', '計画'],
          confidence: 0.85,
          reason: '毎週金曜日の16時頃に実行される傾向があります',
          basedOnActions: ['previous_weekly_reviews', 'calendar_patterns']
        },
        {
          id: 'sug-2',
          title: 'メール確認・整理',
          description: '重要なメールが溜まっています。優先度の高いものから処理しましょう。',
          priority: 'MEDIUM',
          estimatedDuration: 15,
          tags: ['メール', '整理'],
          confidence: 0.78,
          reason: '午前中のメールチェックパターンから提案',
          basedOnActions: ['email_patterns', 'morning_routine']
        },
        {
          id: 'sug-3',
          title: 'UI改善案の検討',
          description: 'ユーザーフィードバックに基づくUI改善案を検討する時間を作りませんか？',
          priority: 'LOW',
          estimatedDuration: 45,
          tags: ['UI', '改善', '設計'],
          confidence: 0.92,
          reason: '最近のクリエイティブ作業パターンから推測',
          basedOnActions: ['design_work_patterns', 'creative_time_blocks']
        },
        {
          id: 'sug-4',
          title: '短期集中タスク整理',
          description: '5分以内で完了できるタスクが複数あります。まとめて処理しませんか？',
          priority: 'MEDIUM',
          estimatedDuration: 20,
          tags: ['整理', '効率化'],
          confidence: 0.71,
          reason: '短時間タスクの蓄積パターンを検出',
          basedOnActions: ['quick_task_accumulation', 'efficiency_patterns']
        }
      ];
      
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Failed to load task suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (suggestion: TaskSuggestion) => {
    setActionInProgress(suggestion.id);
    try {
      onTaskCreate?.(suggestion);
      onSuggestionFeedback?.(suggestion.id, true);
      
      // 受諾後は次の提案に移動
      if (currentIndex < suggestions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        loadSuggestions(); // 新しい提案を読み込み
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (suggestion: TaskSuggestion) => {
    setActionInProgress(suggestion.id);
    try {
      onSuggestionFeedback?.(suggestion.id, false);
      
      // 却下後は次の提案に移動
      if (currentIndex < suggestions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        loadSuggestions(); // 新しい提案を読み込み
      }
    } catch (error) {
      console.error('Failed to reject suggestion:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  const getPriorityColor = (priority: TaskSuggestion['priority']) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceDisplay = (confidence: number) => {
    const percentage = Math.round(confidence * 100);
    if (percentage >= 85) return { label: `${percentage}%`, color: 'text-green-600' };
    if (percentage >= 70) return { label: `${percentage}%`, color: 'text-yellow-600' };
    return { label: `${percentage}%`, color: 'text-red-600' };
  };

  if (loading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-2/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="flex space-x-2">
              <div className="h-10 bg-gray-200 rounded flex-1"></div>
              <div className="h-10 bg-gray-200 rounded flex-1"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-2">AI学習中...</h3>
          <p className="text-sm text-gray-600">
            あなたの作業パターンを学習して、より良い提案を準備しています
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={loadSuggestions}
          >
            提案を確認
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentSuggestion = suggestions[currentIndex];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <span>AI タスク提案</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{currentIndex + 1}</span>
            <span>/</span>
            <span>{suggestions.length}</span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* 提案カード */}
          <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">{currentSuggestion.title}</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {currentSuggestion.description}
                </p>
              </div>
              <Badge className={`ml-2 ${getPriorityColor(currentSuggestion.priority)}`}>
                {currentSuggestion.priority}
              </Badge>
            </div>

            {/* メタ情報 */}
            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{currentSuggestion.estimatedDuration}分</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className={getConfidenceDisplay(currentSuggestion.confidence).color}>
                    信頼度 {getConfidenceDisplay(currentSuggestion.confidence).label}
                  </span>
                </div>
              </div>
            </div>

            {/* タグ */}
            <div className="flex flex-wrap gap-1 mb-3">
              {currentSuggestion.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* AI推奨理由 */}
            <div className="bg-white/60 rounded-md p-3 mb-4">
              <div className="flex items-start space-x-2">
                <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-medium">AI分析:</span>
                  <p className="text-gray-600 mt-1">{currentSuggestion.reason}</p>
                </div>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
              onClick={() => handleReject(currentSuggestion)}
              disabled={actionInProgress === currentSuggestion.id}
            >
              <X className="h-4 w-4 mr-2" />
              却下
            </Button>
            <Button
              size="lg"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => handleAccept(currentSuggestion)}
              disabled={actionInProgress === currentSuggestion.id}
            >
              <Plus className="h-4 w-4 mr-2" />
              タスク作成
            </Button>
          </div>

          {/* ナビゲーション */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              前の提案
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentIndex(Math.min(suggestions.length - 1, currentIndex + 1))}
              disabled={currentIndex === suggestions.length - 1}
            >
              次の提案
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}