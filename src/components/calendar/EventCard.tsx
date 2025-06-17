'use client';

import { CalendarEvent, CATEGORY_COLORS, IMPORTANCE_COLORS, PRIORITY_COLORS, ColorMode, PriorityLevel } from '@/types/calendar';

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  showTime?: boolean;
  colorMode?: ColorMode;
  onClick?: (e: React.MouseEvent) => void;
  onEventEdit?: (event: CalendarEvent) => void;
}

export function EventCard({ 
  event, 
  compact = false, 
  showTime = true, 
  colorMode = 'category',
  onClick,
  onEventEdit
}: EventCardProps) {
  
  // 色を決定（色分けモードに基づく）
  const getEventColor = () => {
    switch (colorMode) {
      case 'user':
        // 担当者システム優先: assignee > users > creator
        return event.assignee?.color || event.users?.color || event.creator?.color || event.colorCode || '#FF9F40';
        
      case 'category':
        return CATEGORY_COLORS[event.category] || CATEGORY_COLORS.EVENT;
        
      case 'importance':
        // Use priority (A/B/C/D) system if available, fallback to importance numbers
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
      // パブリックイベント（担当者なし）
      labels.push({
        text: 'P',
        color: 'bg-green-100 text-green-800'
      });
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
    const maxLength = compact ? 20 : 50;
    if (event.title.length <= maxLength) return event.title;
    return event.title.slice(0, maxLength) + '...';
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

  return (
    <div
      className={`rounded-md cursor-pointer transition-all duration-200 hover:shadow-md font-medium ${
        compact ? 'p-1 text-xs h-6' : 'p-2 text-sm h-8'
      }`}
      style={{ 
        backgroundColor: eventColor,
        color: '#FFFFFF'
      }}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between truncate">
        <span className="truncate flex-1">
          {showTime && event.time && `${event.time} `}
          {getTruncatedTitle()}
        </span>
        <div className="flex items-center space-x-1 ml-1 flex-shrink-0">
          {labels.map((label, index) => (
            <span
              key={index}
              className={`inline-flex items-center justify-center w-4 h-4 text-xs font-medium rounded-full ${label.color}`}
            >
              {label.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}