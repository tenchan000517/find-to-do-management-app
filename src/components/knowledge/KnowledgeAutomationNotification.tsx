// Phase 2: Knowledge Automation Notification Component
// タスク完了時のナレッジ生成通知コンポーネント

"use client";

import { useState } from 'react';
import { TaskCompletionNotification } from '@/hooks/useKnowledgeAutomation';

interface KnowledgeAutomationNotificationProps {
  notification: TaskCompletionNotification;
  onAccept: (notificationId: string) => void;
  onDecline: (notificationId: string) => void;
  onClose: (notificationId: string) => void;
}

export const KnowledgeAutomationNotification: React.FC<KnowledgeAutomationNotificationProps> = ({
  notification,
  onAccept,
  onDecline,
  onClose
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await onAccept(notification.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    try {
      await onDecline(notification.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return '高価値';
      case 'MEDIUM':
        return '中価値';
      case 'LOW':
        return '低価値';
      default:
        return '判定中';
    }
  };

  if (notification.isProcessing) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-md animate-pulse">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">
              タスク完了を分析中...
            </div>
            <div className="text-xs text-gray-500">
              {notification.taskTitle}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!notification.shouldGenerate) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700">
                ナレッジ化は推奨されませんでした
              </div>
              <div className="text-xs text-gray-500">
                {notification.taskTitle}
              </div>
            </div>
          </div>
          <button
            onClick={() => onClose(notification.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-green-200 rounded-lg p-4 shadow-md">
      <div className="flex items-start gap-3">
        {/* AI分析完了アイコン */}
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          {/* ヘッダー */}
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-gray-900">
              🤖 ナレッジ自動生成の提案
            </h3>
            {notification.priority && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                {getPriorityText(notification.priority)}
              </span>
            )}
          </div>

          {/* タスク情報 */}
          <div className="text-xs text-gray-500 mb-2">
            完了タスク: {notification.taskTitle}
          </div>

          {/* 提案されたナレッジ */}
          {notification.suggestedTitle && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <div className="text-sm font-medium text-blue-900 mb-1">
                📋 提案されたナレッジタイトル
              </div>
              <div className="text-sm text-blue-800">
                {notification.suggestedTitle}
              </div>
              {notification.estimatedValue && (
                <div className="flex items-center gap-1 mt-2">
                  <div className="text-xs text-blue-600">価値スコア:</div>
                  <div className="flex items-center gap-1">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < (notification.estimatedValue || 0)
                            ? 'bg-yellow-400' 
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-blue-600 ml-1">
                      {notification.estimatedValue || 0}/10
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  生成中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  ナレッジを生成
                </>
              )}
            </button>
            <button
              onClick={handleDecline}
              disabled={isProcessing}
              className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              後で
            </button>
            <button
              onClick={() => onClose(notification.id)}
              disabled={isProcessing}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeAutomationNotification;