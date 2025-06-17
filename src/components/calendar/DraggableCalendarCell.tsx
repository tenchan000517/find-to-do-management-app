'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { UnifiedCalendarEvent } from '@/types/calendar';
import { DraggableEvent } from './DraggableEvent';

interface DraggableCalendarCellProps {
  date: Date;
  events: UnifiedCalendarEvent[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onEventEdit: (event: UnifiedCalendarEvent) => void;
  onEventMove: (eventId: string, newDate: string) => void;
}

export function DraggableCalendarCell({
  date,
  events,
  isCurrentMonth,
  isToday,
  onEventEdit,
  onEventMove
}: DraggableCalendarCellProps) {
  const dateString = date.toISOString().split('T')[0];
  
  const { setNodeRef, isOver } = useDroppable({
    id: `calendar-cell-${dateString}`,
    data: { 
      type: 'calendar-cell',
      date: dateString 
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[120px] border border-gray-200 p-1
        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
        ${isToday ? 'ring-2 ring-blue-500' : ''}
        ${isOver ? 'bg-blue-50 ring-2 ring-blue-300' : ''}
        transition-all duration-200
      `}
    >
      {/* 日付表示 */}
      <div className="flex justify-between items-center mb-1">
        <span className={`
          text-sm font-medium
          ${isToday ? 'text-blue-600 font-bold' : ''}
          ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
        `}>
          {date.getDate()}
        </span>
        {isOver && (
          <span className="text-xs text-blue-600 font-medium">
            ここに移動
          </span>
        )}
      </div>

      {/* イベント一覧 */}
      <div className="space-y-1">
        {events.map((event) => (
          <DraggableEvent
            key={event.id}
            event={event}
            onEdit={onEventEdit}
            onMove={onEventMove}
          />
        ))}
      </div>

      {/* ドロップ時のヒント */}
      {isOver && events.length === 0 && (
        <div className="flex items-center justify-center h-16 text-blue-500 text-xs">
          イベントをドロップ
        </div>
      )}
    </div>
  );
}