import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface KanbanMoveConfig {
  enableOptimisticUpdate?: boolean;
  showToastMessages?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

interface KanbanMoveRequest {
  itemType: 'task' | 'appointment' | 'project';
  itemId: string;
  sourceColumn: string;
  targetColumn: string;
  kanbanType?: 'status' | 'processing' | 'relationship' | 'phase' | 'source' | 'user' | 'project';
  userId?: string;
}

export const useKanbanMove = (config: KanbanMoveConfig = {}) => {
  const [isMoving, setIsMoving] = useState(false);
  const [moveHistory, setMoveHistory] = useState<Array<{
    timestamp: number;
    request: KanbanMoveRequest;
    success: boolean;
    rollbackData?: any;
  }>>([]);

  const {
    enableOptimisticUpdate = true,
    showToastMessages = true,
    onSuccess,
    onError
  } = config;

  const moveItem = useCallback(async (request: KanbanMoveRequest) => {
    if (isMoving) {
      console.warn('カンバン移動が既に進行中です');
      return { success: false, error: '移動処理が既に進行中です' };
    }

    setIsMoving(true);
    
    let rollbackData: any = null;
    
    try {
      // 楽観的更新のための現在の状態保存
      if (enableOptimisticUpdate) {
        rollbackData = {
          itemId: request.itemId,
          sourceColumn: request.sourceColumn,
          timestamp: Date.now()
        };
      }

      // API呼び出し
      const response = await fetch('/api/kanban/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'カンバン移動に失敗しました');
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
        toast.success(result.message || 'アイテムが正常に移動されました');
      }

      if (onSuccess) {
        onSuccess(result.data);
      }

      return { success: true, data: result.data, message: result.message };

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

      if (showToastMessages) {
        toast.error(errorMessage);
      }

      if (onError) {
        onError(errorMessage);
      }

      return { success: false, error: errorMessage, rollbackData };

    } finally {
      setIsMoving(false);
    }
  }, [isMoving, enableOptimisticUpdate, showToastMessages, onSuccess, onError]);

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
      toast.success('移動のロールバックが完了しました');
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
    isMoving,
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