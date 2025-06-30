"use client";

import { useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface FollowUpSuggestion {
  id: string;
  appointmentId: string;
  type: 'EMAIL' | 'CALL' | 'MEETING' | 'PROPOSAL';
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedDate: string;
  aiConfidence: number;
}

interface FollowUpSuggestionsProps {
  suggestions: FollowUpSuggestion[];
  onExecute: (suggestionId: string) => Promise<any>;
  isLoading?: boolean;
}

const FollowUpSuggestions: React.FC<FollowUpSuggestionsProps> = ({
  suggestions = [],
  onExecute,
  isLoading = false
}) => {
  const [executingIds, setExecutingIds] = useState<Set<string>>(new Set());

  const handleExecute = async (suggestionId: string) => {
    setExecutingIds(prev => new Set(prev).add(suggestionId));
    
    try {
      await onExecute(suggestionId);
      toast.success('フォローアップアクションを実行しました！');
    } catch (error) {
      console.error('Failed to execute follow-up action:', error);
      toast.error('フォローアップの実行に失敗しました');
    } finally {
      setExecutingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestionId);
        return newSet;
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return '📧';
      case 'CALL': return '📞';
      case 'MEETING': return '🤝';
      case 'PROPOSAL': return '📋';
      default: return '💼';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'EMAIL': return 'メール';
      case 'CALL': return '電話';
      case 'MEETING': return '会議';
      case 'PROPOSAL': return '提案書';
      default: return type;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-500';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-500';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-500';
      default: return 'bg-gray-100 text-gray-800 border-gray-500';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '高';
      case 'MEDIUM': return '中';
      case 'LOW': return '低';
      default: return priority;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">🤖 AI推奨フォローアップ</h3>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🤖 AI推奨フォローアップ</h3>
        <span className="text-sm text-gray-500">
          {suggestions.length}件の提案
        </span>
      </div>

      {suggestions.length > 0 ? (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {suggestions.map((suggestion) => {
            const isExecuting = executingIds.has(suggestion.id);
            const priorityColorClass = getPriorityColor(suggestion.priority);
            
            return (
              <div 
                key={suggestion.id} 
                className={`border-l-4 ${priorityColorClass.split(' ')[2]} pl-4 py-3 bg-gray-50 rounded-r-lg`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getTypeIcon(suggestion.type)}</span>
                      <h4 className="font-medium text-gray-900 truncate">
                        {suggestion.title}
                      </h4>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {suggestion.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className={`text-xs px-2 py-1 rounded ${priorityColorClass}`}>
                          優先度: {getPriorityLabel(suggestion.priority)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {getTypeLabel(suggestion.type)}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        信頼度: {suggestion.aiConfidence}%
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      推奨日時: {new Date(suggestion.recommendedDate).toLocaleString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    <Button
                      onClick={() => handleExecute(suggestion.id)}
                      disabled={isExecuting}
                      variant="primary"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      {isExecuting ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-1" />
                          実行中...
                        </>
                      ) : (
                        '実行'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🎯</div>
          <p className="text-gray-500">
            現在、推奨フォローアップはありません
          </p>
          <p className="text-sm text-gray-400 mt-2">
            新しいアポイントメントやアクティビティに基づいて提案が生成されます
          </p>
        </div>
      )}

      {/* 統計情報 */}
      {suggestions.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-red-600">
                {suggestions.filter(s => s.priority === 'HIGH').length}
              </div>
              <div className="text-xs text-gray-500">高優先度</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-600">
                {suggestions.filter(s => s.priority === 'MEDIUM').length}
              </div>
              <div className="text-xs text-gray-500">中優先度</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {Math.round(
                  suggestions.reduce((sum, s) => sum + s.aiConfidence, 0) / suggestions.length
                )}%
              </div>
              <div className="text-xs text-gray-500">平均信頼度</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUpSuggestions;