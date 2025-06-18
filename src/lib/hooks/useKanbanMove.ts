import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { 
  KanbanMoveRequest, 
  KanbanMoveResult, 
  KanbanItemType, 
  KanbanViewType 
} from '@/lib/types/kanban-types';

interface KanbanMoveConfig {
  itemType: KanbanItemType;
  enableOptimisticUpdate?: boolean;
  showToastMessages?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  onMoveComplete?: (request: KanbanMoveRequest) => Promise<KanbanMoveResult>;
  debounceDelay?: number;
}

export const useKanbanMove = (config: KanbanMoveConfig) => {
  const [isMoving, setIsMoving] = useState(false);
  const [dragLoading, setDragLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moveHistory, setMoveHistory] = useState<Array<{
    timestamp: number;
    request: KanbanMoveRequest;
    success: boolean;
    rollbackData?: any;
  }>>([]);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const {
    itemType,
    enableOptimisticUpdate = true,
    showToastMessages = true,
    onSuccess,
    onError,
    onMoveComplete,
    debounceDelay = 300
  } = config;

  const moveItem = useCallback(async (request: KanbanMoveRequest): Promise<KanbanMoveResult> => {
    // デバウンス処理のクリーンアップ
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // 重複処理防止の強化
    if (isMoving || dragLoading) {
      console.warn('カンバン移動が既に進行中です');
      return { success: false, error: '移動処理が既に進行中です' };
    }

    // エラー状態をクリア
    setError(null);

    // デバウンス実行
    return new Promise<KanbanMoveResult>((resolve) => {
      debounceRef.current = setTimeout(async () => {
        setDragLoading(true);
        
        let rollbackData: any = null;
        
        try {
          setIsMoving(true);
          
          // 楽観的更新のための現在の状態保存
          if (enableOptimisticUpdate) {
            rollbackData = {
              itemId: request.itemId,
              sourceColumn: request.sourceColumn,
              timestamp: Date.now()
            };
          }

          let result: KanbanMoveResult;

          // カスタムハンドラーがある場合はそれを使用
          if (onMoveComplete) {
            result = await onMoveComplete(request);
          } else {
            // デフォルトのAPI呼び出し
            const response = await fetch('/api/kanban/move', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(request),
            });

            const responseData = await response.json();

            if (!response.ok) {
              throw new Error(responseData.error || 'カンバン移動に失敗しました');
            }

            result = responseData;
          }

          if (!result.success) {
            throw new Error(result.error || 'カンバン移動に失敗しました');
          }

          // 成功時の処理
          const moveRecord = {
            timestamp: Date.now(),
            request,
            success: true,
            rollbackData
          };

          setMoveHistory(prev => [...prev.slice(-9), moveRecord]); // 最新10件を保持

          if (showToastMessages) {
            // ステータス別トーストメッセージ
            const getSuccessMessage = (request: KanbanMoveRequest) => {
              if (request.kanbanType === 'status' && request.newStatus) {
                const statusMessages = {
                  'IDEA': '💡 アイデアに移動しました',
                  'PLAN': '📋 計画中に移動しました',
                  'DO': '🚀 タスクを開始しました',
                  'CHECK': '🔍 課題・改善段階に移動しました',
                  'COMPLETE': '✅ タスクが完了しました',
                  'KNOWLEDGE': '🧠 ナレッジとして昇華しました',
                  'DELETE': '🚮 リスケジュールしました'
                };
                return statusMessages[request.newStatus as keyof typeof statusMessages] || `${request.newStatus}に移動しました`;
              }
              
              if (request.kanbanType === 'user') {
                return '👥 担当者を変更しました';
              }
              
              if (request.kanbanType === 'project') {
                return '📁 プロジェクトを変更しました';
              }
              
              return result.message || 'アイテムが正常に移動されました';
            };
            
            toast.success(getSuccessMessage(request));
          }

          if (onSuccess) {
            onSuccess(result.data);
          }

          resolve(result);

        } catch (error) {
          console.error('カンバン移動エラー:', error);

          // エラー時の処理
          const moveRecord = {
            timestamp: Date.now(),
            request,
            success: false,
            rollbackData
          };

          setMoveHistory(prev => [...prev.slice(-9), moveRecord]);

          const errorMessage = error instanceof Error ? error.message : 'カンバン移動に失敗しました';
          setError(errorMessage);

          if (showToastMessages) {
            toast.error(`❗ ${errorMessage}`);
          }

          if (onError) {
            onError(errorMessage);
          }

          resolve({ 
            success: false, 
            error: errorMessage, 
            rollbackData 
          });

        } finally {
          setIsMoving(false);
          setDragLoading(false);
        }
      }, debounceDelay);
    });
  }, [
    isMoving, 
    dragLoading, 
    enableOptimisticUpdate, 
    showToastMessages, 
    onSuccess, 
    onError, 
    onMoveComplete,
    debounceDelay
  ]);

  const rollbackLastMove = useCallback(async () => {
    const lastSuccessfulMove = moveHistory
      .filter(record => record.success)
      .pop();

    if (!lastSuccessfulMove || !lastSuccessfulMove.rollbackData) {
      console.warn('ロールバック可能な移動履歴がありません');
      return { success: false, error: 'ロールバック可能な移動履歴がありません' };
    }

    const rollbackRequest: KanbanMoveRequest = {
      ...lastSuccessfulMove.request,
      sourceColumn: lastSuccessfulMove.request.targetColumn,
      targetColumn: lastSuccessfulMove.request.sourceColumn
    };

    if (showToastMessages) {
      toast.loading('移動をロールバック中...');
    }

    const result = await moveItem(rollbackRequest);

    if (result.success && showToastMessages) {
      toast.dismiss(); // ローディングトーストを消す
      toast.success('⬅️ 移動のロールバックが完了しました');
    }

    return result;
  }, [moveHistory, moveItem, showToastMessages]);

  const clearHistory = useCallback(() => {
    setMoveHistory([]);
  }, []);

  return {
    moveItem,
    rollbackLastMove,
    clearHistory,
    isLoading: isMoving || dragLoading,
    isMoving: isMoving || dragLoading,
    dragLoading,
    error,
    moveHistory,
    canRollback: moveHistory.filter(record => record.success).length > 0
  };
};

// カンバンタイプ別のヘルパー関数
export const createTaskMoveRequest = (
  taskId: string,
  targetStatus: string,
  sourceStatus?: string
): KanbanMoveRequest => ({
  itemType: 'task',
  itemId: taskId,
  sourceColumn: sourceStatus || '',
  targetColumn: targetStatus,
  kanbanType: 'status'
});

export const createTaskAssignmentRequest = (
  taskId: string,
  targetUserId: string,
  sourceUserId?: string
): KanbanMoveRequest => ({
  itemType: 'task',
  itemId: taskId,
  sourceColumn: sourceUserId || 'unassigned',
  targetColumn: targetUserId || 'unassigned',
  kanbanType: 'user'
});

export const createAppointmentMoveRequest = (
  appointmentId: string,
  targetColumn: string,
  kanbanType: 'processing' | 'relationship' | 'phase' | 'source',
  sourceColumn?: string
): KanbanMoveRequest => ({
  itemType: 'appointment',
  itemId: appointmentId,
  sourceColumn: sourceColumn || '',
  targetColumn,
  kanbanType
});

export const createProjectMoveRequest = (
  projectId: string,
  targetStatus: string,
  sourceStatus?: string
): KanbanMoveRequest => ({
  itemType: 'project',
  itemId: projectId,
  sourceColumn: sourceStatus || '',
  targetColumn: targetStatus,
  kanbanType: 'status'
});