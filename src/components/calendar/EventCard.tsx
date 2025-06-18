'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { UnifiedCalendarEvent, CATEGORY_COLORS, IMPORTANCE_COLORS, PRIORITY_COLORS, ColorMode, PriorityLevel } from '@/types/calendar';

interface EventCardProps {
  event: UnifiedCalendarEvent;
  compact?: boolean;
  showTime?: boolean;
  colorMode?: ColorMode;
  onClick?: (e: React.MouseEvent) => void;
  onEventEdit?: (event: any) => void;
  onEventDelete?: (eventId: string) => void;
  isModal?: boolean; // ポップアップモーダル内での表示かどうか
}

export function EventCard({ 
  event, 
  compact = false, 
  showTime = true, 
  colorMode = 'category',
  onClick,
  onEventEdit,
  onEventDelete,
  isModal = false
}: EventCardProps) {
  
  // @dnd-kit ドラッグ機能
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: `event-${event.id}`,
    data: {
      type: 'calendar-event',
      event
    }
  });

  const dragStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;
  
  // 色を決定（色分けモードとフィルタリング状態に基づく）
  const getEventColor = () => {
    const hasFilter = Boolean(onClick && colorMode); // フィルタリング状態を判定
    
    switch (colorMode) {
      case 'user':
        if (hasFilter) {
          // ユーザー別フィルタリング時はカテゴリ色を表示
          return CATEGORY_COLORS[event.category] || CATEGORY_COLORS.EVENT;
        } else {
          // 全表示時はユーザー色を表示
          return event.assignee?.color || event.users?.color || event.creator?.color || event.colorCode || '#FF9F40';
        }
        
      case 'category':
        if (hasFilter) {
          // カテゴリ別フィルタリング時はユーザー色を表示
          return event.assignee?.color || event.users?.color || event.creator?.color || event.colorCode || '#FF9F40';
        } else {
          // 全表示時はカテゴリ色を表示
          return CATEGORY_COLORS[event.category] || CATEGORY_COLORS.EVENT;
        }
        
      case 'importance':
        if (hasFilter) {
          // 重要度別フィルタリング時はユーザー色を表示
          return event.assignee?.color || event.users?.color || event.creator?.color || event.colorCode || '#FF9F40';
        } else {
          // 全表示時は重要度色を表示
          const priority = event.priority || event.tasks?.priority || event.appointments?.priority;
          if (priority) {
            return PRIORITY_COLORS[priority] || PRIORITY_COLORS.C;
          }
          // Fallback to legacy importance system
          if (event.importance >= 0.7) {
            return IMPORTANCE_COLORS.HIGH;
          } else if (event.importance >= 0.4) {
            return IMPORTANCE_COLORS.MEDIUM;
          } else {
            return IMPORTANCE_COLORS.LOW;
          }
        }
        
      default:
        return CATEGORY_COLORS[event.category] || CATEGORY_COLORS.EVENT;
    }
  };

  // Get priority level for display
  const getPriorityLevel = (): PriorityLevel => {
    return event.priority || event.tasks?.priority || event.appointments?.priority || 'C';
  };

  // ラベル生成（「誰」「カテゴリ」「重要度」）
  const getLabels = () => {
    const labels = [];
    
    // 誰（イベント責任者の頭文字）
    // 担当者システム優先: assignee > users > creator > userId
    if (event.assignee?.name) {
      const initial = event.assignee.name.charAt(0);
      labels.push({
        text: initial,
        color: 'bg-blue-100 text-blue-800'
      });
    } else if (event.users?.name) {
      const initial = event.users.name.charAt(0);
      labels.push({
        text: initial,
        color: 'bg-blue-100 text-blue-800'
      });
    } else if (event.creator?.name) {
      const initial = event.creator.name.charAt(0);
      labels.push({
        text: initial,
        color: 'bg-gray-100 text-gray-600'
      });
    } else if (event.assignedTo || event.userId) {
      // フォールバック：IDから推測
      labels.push({
        text: '?',
        color: 'bg-gray-100 text-gray-800'
      });
    } else {
      // // パブリックイベント（担当者なし）
      // labels.push({
      //   text: 'P',
      //   color: 'bg-green-100 text-green-800'
      // });
    }
    
    // カテゴリ
    const categoryLabels = {
      APPOINTMENT: 'ア',
      TASK_DUE: 'タ',
      PROJECT: 'プ',
      EVENT: 'イ',
      PERSONAL: '予'
    };
    
    labels.push({
      text: categoryLabels[event.category] || 'イ',
      color: 'bg-gray-100 text-gray-800'
    });
    
    // 重要度 (A/B/C/D)
    const priorityLevel = getPriorityLevel();
    const priorityLabels = {
      A: '最',  // 最優先
      B: '重',  // 重要
      C: '緊',  // 緊急
      D: '検'   // 要検討
    };
    const priorityColor = {
      A: 'bg-red-100 text-red-800',
      B: 'bg-orange-100 text-orange-800', 
      C: 'bg-blue-100 text-blue-800',
      D: 'bg-green-100 text-green-800'
    }[priorityLevel];
    
    labels.push({
      text: priorityLabels[priorityLevel],
      color: priorityColor
    });
    
    return labels;
  };

  // タイトルの省略処理
  const getTruncatedTitle = () => {
    if (isModal) {
      // モーダル内では長めに表示
      const maxLength = compact ? 40 : 60;
      if (event.title.length <= maxLength) return event.title;
      return event.title.slice(0, maxLength) + '...';
    } else {
      // 通常のカレンダーグリッドでは文字数を大幅に増やす
      const maxLength = compact ? 25 : 50;
      if (event.title.length <= maxLength) return event.title;
      return event.title.slice(0, maxLength);
    }
  };

  const eventColor = getEventColor();
  const labels = getLabels();
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    } else if (onEventEdit) {
      onEventEdit(event);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEventDelete && window.confirm('このイベントを削除してもよろしいですか？')) {
      onEventDelete(event.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{ 
        backgroundColor: eventColor,
        color: '#FFFFFF',
        ...dragStyle
      }}
      className={`group rounded-lg cursor-grab transition-all duration-200 hover:shadow-md font-medium ${
        isModal ? 'mx-px' : 'mx-0 md:mx-px'
      } ${
        compact ? 'p-0.5 md:p-1 md:text-xl min-h-[14px] md:min-h-[24px]' : 'p-2 text-base min-h-[32px]'
      } ${
        isDragging ? 'opacity-50 z-50' : ''
      } active:cursor-grabbing`}
      onClick={handleClick}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center justify-between truncate">
        <span className="overflow-hidden flex-1 leading-tight text-[10px] md:text-[12px]">
          {showTime && event.time && (isModal ? `${event.time} ` : <span className="hidden md:inline">{event.time} </span>)}
          {getTruncatedTitle()}
        </span>
        <div className="flex items-center space-x-1 ml-1 flex-shrink-0">
          <div className={isModal ? "flex items-center space-x-1" : "hidden lg:flex items-center space-x-1"}>
            {labels.map((label, index) => (
              <span
                key={index}
                className={`inline-flex items-center justify-center w-4 h-4 text-xs font-medium rounded ${label.color}`}
              >
                {label.text}
              </span>
            ))}
          </div>
          {onEventDelete && event.source !== 'tasks' && (
            <button
              onClick={handleDelete}
              className="p-0.5 bg-red-500 hover:bg-red-600 rounded transition-colors"
              title="削除"
            >
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}