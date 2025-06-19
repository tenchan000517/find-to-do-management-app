'use client';

import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners
} from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import dynamic from 'next/dynamic';

import { 
  UniversalKanbanProps, 
  KanbanItem, 
  KanbanViewType,
  KanbanMoveRequest,
  KANBAN_COLUMN_CONFIGS,
  TaskKanbanItem 
} from '@/lib/types/kanban-types';
import { useKanbanMove } from '@/lib/hooks/useKanbanMove';
import { KanbanColumnComponent } from './KanbanColumn';
import { KanbanItemCard } from './KanbanItemCard';
import { KanbanDataTransformer } from '@/lib/utils/kanban-data-transformer';
import { LoadingOverlay, LoadingCenter } from '@/components/ui/Loading';

// 動的インポートでモーダルを遅延読み込み
const DueDateModal = dynamic(() => import('@/components/tasks/DueDateModal'), { ssr: false });
const CompletionModal = dynamic(() => import('@/components/tasks/CompletionModal'), { ssr: false });
const SummaryModal = dynamic(() => import('@/components/tasks/SummaryModal'), { ssr: false });
const TaskUpdateModal = dynamic(() => import('@/components/tasks/TaskUpdateModal'), { ssr: false });
const DueDateResetModal = dynamic(() => import('@/components/tasks/DueDateResetModal'), { ssr: false });

export function UniversalKanban({
  itemType,
  viewType,
  items,
  users = [],
  projects = [],
  filter,
  configuration,
  onItemMove,
  onItemClick,
  onQuickAction,
  onItemUpdate,
  onItemDelete,
  className = ''
}: UniversalKanbanProps) {
  const [activeItem, setActiveItem] = useState<KanbanItem | null>(null);
  const [dragStartColumn, setDragStartColumn] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // モーダル状態管理
  const [showDueDateModal, setShowDueDateModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showTaskUpdateModal, setShowTaskUpdateModal] = useState(false);
  const [showDueDateResetModal, setShowDueDateResetModal] = useState(false);
  const [pendingMoveRequest, setPendingMoveRequest] = useState<KanbanMoveRequest | null>(null);
  const [targetTask, setTargetTask] = useState<TaskKanbanItem | null>(null);
  
  // ローディング状態（カレンダーと統一）
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [successItems, setSuccessItems] = useState<Set<string>>(new Set());

  // カンバン移動フック
  const { 
    moveItem, 
    isLoading, 
    dragLoading,
    error 
  } = useKanbanMove({
    itemType,
    onMoveComplete: onItemMove,
    enableOptimisticUpdate: configuration?.enableOptimisticUpdates ?? true,
    debounceDelay: 300
  });

  // データ変換器
  const dataTransformer = useMemo(() => new KanbanDataTransformer(), []);

  // フィルター済みアイテム
  const filteredItems = useMemo(() => {
    if (!filter) return items;
    return dataTransformer.filterItems(items, filter);
  }, [items, filter, dataTransformer]);

  // カラム生成とアイテムのグループ化
  const columns = useMemo(() => {
    const baseColumns = dataTransformer.groupItemsByColumn(
      filteredItems, 
      viewType, 
      users, 
      projects
    );

    // 各カラム内でアイテムをソート
    return baseColumns.map(column => ({
      ...column,
      items: dataTransformer.sortItemsInColumn(column.items, 'priority')
    }));
  }, [filteredItems, viewType, users, projects, dataTransformer]);

  // ドラッグ&ドロップセンサー
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // 3px移動後にドラッグ開始
      },
    })
  );

  // ドラッグ開始ハンドラー
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeItemData = active.data.current;
    
    if (activeItemData?.type === 'kanban-item') {
      setActiveItem(activeItemData.item);
      setDragStartColumn(activeItemData.columnId);
      setIsDragging(true);
    }
  }, []);

  // ドラッグ終了ハンドラー
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { over } = event;
    
    console.log('🎯 Drag ended:', { over: over?.id, activeItem: activeItem?.id });
    
    setActiveItem(null);
    setDragStartColumn(null);
    setIsDragging(false);

    if (!over || !activeItem) {
      console.log('❌ Early return: no over or activeItem');
      return;
    }

    const overData = over.data.current;
    const targetColumn = overData?.columnId || over.id;
    
    // 同じカラム内での移動は無視
    if (dragStartColumn === targetColumn) return;

    // 移動リクエスト作成
    const moveRequest: KanbanMoveRequest = {
      itemType,
      itemId: activeItem.id,
      sourceColumn: dragStartColumn!,
      targetColumn: targetColumn as string,
      kanbanType: viewType
    };

    // タスクの場合、ステータス遷移に応じてモーダルを表示
    if (itemType === 'task' && viewType === 'status' && activeItem.type === 'task') {
      const taskItem = activeItem as TaskKanbanItem;
      const sourceStatus = taskItem.status;
      const targetStatus = targetColumn as string;
      
      // ステータス移動フロー制御（EnhancedTaskKanbanのロジック）
      const transitionKey = `${sourceStatus}_TO_${targetStatus}`;
      
      switch (transitionKey) {
        case 'PLAN_TO_DO':
          // 期日設定が必須
          if (!taskItem.dueDate) {
            setPendingMoveRequest(moveRequest);
            setTargetTask(taskItem);
            setShowDueDateModal(true);
            return;
          }
          break;
          
        case 'CHECK_TO_COMPLETE':
          // 完了処理モーダル表示
          setPendingMoveRequest(moveRequest);
          setTargetTask(taskItem);
          setShowCompletionModal(true);
          return;
          
        case 'CHECK_TO_DO':
          // サマリー入力モーダル表示
          setPendingMoveRequest(moveRequest);
          setTargetTask(taskItem);
          setShowSummaryModal(true);
          return;
          
        case 'DO_TO_IDEA':
        case 'DO_TO_PLAN':
          // DOから他のステータスに移動時は期限リセット確認モーダル表示
          if (taskItem.dueDate) {
            setPendingMoveRequest(moveRequest);
            setTargetTask(taskItem);
            setShowDueDateResetModal(true);
            return;
          }
          break;
          
        default:
          // その他の移行は直接実行
          break;
      }
      
      moveRequest.newStatus = targetStatus;
    }

    // ユーザータブでの移動の場合、assignedTo を設定
    if (viewType === 'user' && targetColumn !== 'unassigned') {
      const targetUser = users.find(user => user.id === targetColumn);
      if (targetUser) {
        moveRequest.newAssignee = targetUser.id;
      }
    }

    // プロジェクトタブでの移動の場合
    if (viewType === 'project' && targetColumn !== 'no_project') {
      const targetProject = projects.find(project => project.id === targetColumn);
      if (targetProject) {
        moveRequest.projectId = targetProject.id;
      }
    }

    // 通常の移動処理
    try {
      await executeMoveWithFeedback(moveRequest);
    } catch (error) {
      console.error('カンバン移動エラー:', error);
    }
  }, [
    activeItem, 
    dragStartColumn, 
    itemType, 
    viewType, 
    users, 
    projects
  ]);

  // フィードバック付き移動実行
  const executeMoveWithFeedback = useCallback(async (request: KanbanMoveRequest) => {
    // ローディング開始
    setLoadingItems(prev => new Set(prev).add(request.itemId));
    
    try {
      const result = await moveItem(request);
      
      if (result.success) {
        // 成功フィードバック（緑の縁と成功アニメーション）
        setSuccessItems(prev => new Set(prev).add(request.itemId));
        
        // ドロップ完了の成功アニメーション
        const targetElement = document.querySelector(`[data-item-id="${request.itemId}"]`);
        if (targetElement) {
          targetElement.classList.add('drop-success-animation');
          setTimeout(() => {
            targetElement.classList.remove('drop-success-animation');
          }, 600);
        }
        
        // 1.5秒後に成功表示をクリア
        setTimeout(() => {
          setSuccessItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(request.itemId);
            return newSet;
          });
        }, 1500);
      }
      
      return result;
    } finally {
      // ローディング終了
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.itemId);
        return newSet;
      });
    }
  }, [moveItem]);

  // アイテムクリックハンドラー
  const handleItemClick = useCallback((item: KanbanItem) => {
    onItemClick?.(item);
  }, [onItemClick]);

  // クイックアクションハンドラー
  const handleQuickAction = useCallback((action: string, item: KanbanItem) => {
    // 完了アクションの場合、完了モーダルを表示
    if (action === 'complete' && item.type === 'task') {
      const taskItem = item as TaskKanbanItem;
      if (taskItem.status === 'DO' || taskItem.status === 'CHECK') {
        setTargetTask(taskItem);
        setPendingMoveRequest({
          itemType: 'task',
          itemId: taskItem.id,
          sourceColumn: taskItem.status,
          targetColumn: 'COMPLETE',
          kanbanType: 'status',
          newStatus: 'COMPLETE'
        });
        setShowCompletionModal(true);
        return;
      }
    }
    
    onQuickAction?.(action, item);
  }, [onQuickAction]);

  // モーダルハンドラー
  const handleDueDateSubmit = useCallback(async (taskId: string, dueDate: string, priority?: any) => {
    setShowDueDateModal(false);
    
    if (pendingMoveRequest && targetTask && targetTask.id === taskId) {
      // 期日（と優先度）を更新してから移動
      const updateData: any = { dueDate };
      if (priority) updateData.priority = priority;
      
      // タスク更新APIを呼び出す
      if (onItemUpdate) {
        await onItemUpdate(targetTask.id, updateData);
      }
      
      // 移動実行
      await executeMoveWithFeedback({
        ...pendingMoveRequest,
        newStatus: 'DO'
      });
    }
    
    setPendingMoveRequest(null);
    setTargetTask(null);
  }, [pendingMoveRequest, targetTask, executeMoveWithFeedback, onItemUpdate]);

  const handleSummarySubmit = useCallback(async (taskId: string, summary: string) => {
    setShowSummaryModal(false);
    
    if (pendingMoveRequest && targetTask && targetTask.id === taskId) {
      // サマリーを更新してから移動
      if (onItemUpdate) {
        await onItemUpdate(targetTask.id, { summary });
      }
      
      // 移動実行
      await executeMoveWithFeedback(pendingMoveRequest);
    }
    
    setPendingMoveRequest(null);
    setTargetTask(null);
  }, [pendingMoveRequest, targetTask, executeMoveWithFeedback, onItemUpdate]);

  const handleCompletionSubmit = useCallback(async (taskId: string, action: 'archive' | 'knowledge') => {
    setShowCompletionModal(false);
    
    if (pendingMoveRequest && targetTask && targetTask.id === taskId) {
      // アクションに応じて適切なステータスに設定
      const newStatus = action === 'knowledge' ? 'KNOWLEDGE' : 'COMPLETE';
      const moveRequest = {
        ...pendingMoveRequest,
        targetColumn: newStatus,
        newStatus
      };
      
      // 移動実行
      await executeMoveWithFeedback(moveRequest);
    }
    
    setPendingMoveRequest(null);
    setTargetTask(null);
  }, [pendingMoveRequest, targetTask, executeMoveWithFeedback]);

  const handleTaskUpdateAction = useCallback(async (taskId: string, action: 'reschedule' | 'improve' | 'delete', data?: any) => {
    setShowTaskUpdateModal(false);
    
    if (targetTask && targetTask.id === taskId) {
      if (action === 'reschedule') {
        // リスケ: 期日をクリアしてIDEAに戻す
        const moveRequest: KanbanMoveRequest = {
          itemType: 'task',
          itemId: targetTask.id,
          sourceColumn: targetTask.status,
          targetColumn: 'IDEA',
          kanbanType: 'status',
          newStatus: 'IDEA'
        };
        
        // 期日をクリアする更新
        if (onItemUpdate) {
          await onItemUpdate(targetTask.id, { dueDate: null });
        }
        
        await executeMoveWithFeedback(moveRequest);
      } else if (action === 'improve') {
        // 改善して実行: サマリーを追加してDOに移動
        const moveRequest: KanbanMoveRequest = {
          itemType: 'task',
          itemId: targetTask.id,
          sourceColumn: targetTask.status,
          targetColumn: 'DO',
          kanbanType: 'status',
          newStatus: 'DO'
        };
        
        // サマリーを更新
        if (onItemUpdate && data?.summary) {
          await onItemUpdate(targetTask.id, { summary: data.summary });
        }
        
        await executeMoveWithFeedback(moveRequest);
      } else if (action === 'delete') {
        // 削除処理
        if (onItemDelete) {
          await onItemDelete(targetTask.id);
        }
      }
    }
    
    setTargetTask(null);
  }, [targetTask, executeMoveWithFeedback, onItemUpdate, onItemDelete]);

  // 期限リセット確認ハンドラー
  const handleDueDateResetConfirm = useCallback(async (resetDueDate: boolean) => {
    if (!pendingMoveRequest || !targetTask) return;

    try {
      // 期限をリセットする場合、タスクの更新を行う
      if (resetDueDate && onItemUpdate) {
        await onItemUpdate(targetTask.id, { dueDate: null });
      }

      // ステータス移動を実行
      await executeMoveWithFeedback(pendingMoveRequest);
    } finally {
      setShowDueDateResetModal(false);
      setPendingMoveRequest(null);
      setTargetTask(null);
    }
  }, [pendingMoveRequest, targetTask, executeMoveWithFeedback, onItemUpdate]);

  // スクロール状態の更新
  const updateScrollButtons = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth
    );
  }, []);

  // 横スクロール処理
  const scrollLeft = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: -300, behavior: 'smooth' });
    }
  }, []);

  const scrollRight = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: 300, behavior: 'smooth' });
    }
  }, []);

  // 初期化時とデータ変更時にスクロールボタンを更新
  useEffect(() => {
    const timer = setTimeout(() => {
      updateScrollButtons();
    }, 100);
    return () => clearTimeout(timer);
  }, [columns, updateScrollButtons]);

  // カラムの動的配色
  const getColumnColor = useCallback((columnId: string, viewType: KanbanViewType) => {
    const config = KANBAN_COLUMN_CONFIGS[viewType]?.find(col => col.id === columnId);
    return config?.color || '#f3f4f6';
  }, []);

  // 初期ローディング表示（カラフルなバウンスアニメーション）
  if (isLoading && filteredItems.length === 0) {
    return (
      <LoadingCenter 
        message="カンバンデータを読み込んでいます..." 
        size="lg"
        className="h-64"
      />
    );
  }

  return (
    <div className={`universal-kanban h-screen overflow-hidden ${className}`}>
      {/* エラー表示 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      {/* カンバンボード */}
      <div className="relative h-screen overflow-hidden">
        {/* 左スクロールボタン */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-200"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* 右スクロールボタン */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all duration-200"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        <LoadingOverlay 
          isLoading={dragLoading || (isLoading && filteredItems.length > 0)}
          message={dragLoading ? "タスクを移動しています..." : "カンバンデータを更新しています..."}
          size="lg"
          className="h-screen overflow-hidden"
        >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div 
            ref={scrollContainerRef}
            className={`kanban-board h-screen flex gap-2 overflow-x-auto overflow-y-hidden pb-6 px-4 ${isDragging ? 'kanban-board-dragging' : ''}`}
            onScroll={updateScrollButtons}
          >
            <SortableContext items={columns.map(col => col.id)}>
              {columns.map(column => (
                <div
                  key={column.id}
                  className={`${isDragging && column.id !== dragStartColumn ? 'animate-pulse opacity-80' : ''} transition-all duration-300`}
                >
                  <KanbanColumnComponent
                    column={{
                      ...column,
                      items: column.items.map(item => ({
                        ...item,
                        isLoading: loadingItems.has(item.id),
                        isSuccess: successItems.has(item.id)
                      }))
                    }}
                    viewType={viewType}
                    onItemMove={moveItem}
                    onItemClick={handleItemClick}
                    onQuickAction={handleQuickAction}
                    isLoading={isLoading}
                    color={getColumnColor(column.id, viewType)}
                  />
                </div>
              ))}
            </SortableContext>
          </div>

        {/* ドラッグオーバーレイ */}
        <DragOverlay>
          {activeItem && (
            <div className="rotate-5 opacity-90">
              <KanbanItemCard
                item={activeItem}
                viewType={viewType}
                onItemClick={handleItemClick}
                onQuickAction={handleQuickAction}
                isDragging={true}
              />
            </div>
          )}
        </DragOverlay>
        </DndContext>
        </LoadingOverlay>
      </div>

      {/* 統計情報 */}
      {configuration?.showItemCounts && (
        <div className="mt-6 flex gap-4 text-sm text-gray-600">
          <span>総アイテム数: {filteredItems.length}</span>
          <span>カラム数: {columns.length}</span>
          {filter && (
            <span className="text-blue-600">フィルター適用中</span>
          )}
        </div>
      )}

      {/* モーダル群 */}
      {targetTask && (
        <>
          <DueDateModal
            isOpen={showDueDateModal}
            onClose={() => {
              setShowDueDateModal(false);
              setPendingMoveRequest(null);
              setTargetTask(null);
            }}
            onSubmit={handleDueDateSubmit}
            taskId={targetTask.id}
          />

          <CompletionModal
            isOpen={showCompletionModal}
            onClose={() => {
              setShowCompletionModal(false);
              setPendingMoveRequest(null);
              setTargetTask(null);
            }}
            onSubmit={handleCompletionSubmit}
            taskId={targetTask.id}
          />

          <SummaryModal
            isOpen={showSummaryModal}
            onClose={() => {
              setShowSummaryModal(false);
              setPendingMoveRequest(null);
              setTargetTask(null);
            }}
            onSubmit={handleSummarySubmit}
            taskId={targetTask.id}
            fromStatus="CHECK"
          />

          <TaskUpdateModal
            isOpen={showTaskUpdateModal}
            onClose={() => {
              setShowTaskUpdateModal(false);
              setTargetTask(null);
            }}
            onSubmit={handleTaskUpdateAction}
            taskId={targetTask.id}
          />

          <DueDateResetModal
            isOpen={showDueDateResetModal}
            task={targetTask}
            onConfirm={handleDueDateResetConfirm}
            onCancel={() => {
              setShowDueDateResetModal(false);
              setPendingMoveRequest(null);
              setTargetTask(null);
            }}
          />
        </>
      )}
    </div>
  );
}