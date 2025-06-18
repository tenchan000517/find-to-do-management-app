'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { UnifiedCalendarEvent, ColorMode } from '@/types/calendar';
import { DraggableEvent } from './DraggableEvent';
import { EventCard } from './EventCard';

interface DraggableCalendarCellProps {
  date: Date;
  events: UnifiedCalendarEvent[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onEventEdit: (event: UnifiedCalendarEvent) => void;
  onEventMove: (eventId: string, newDate: string) => void;
  onDateClick?: (date: Date) => void;
  colorMode: ColorMode;
}

export function DraggableCalendarCell({
  date,
  events,
  isCurrentMonth,
  isToday,
  onEventEdit,
  onEventMove,
  onDateClick,
  colorMode
}: DraggableCalendarCellProps) {
  const dateString = date.toISOString().split('T')[0];
  
  const { setNodeRef, isOver } = useDroppable({
    id: `calendar-cell-${dateString}`,
    data: { 
      type: 'calendar-cell',
      date: dateString 
    }
  });

  const handleDateClick = () => {
    if (onDateClick) {
      onDateClick(date);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        h-[120px] md:h-[160px]
        border-r border-gray-200 last:border-r-0 p-1 md:p-2
        flex flex-col relative cursor-pointer
        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
        ${isToday ? 'bg-blue-50' : ''}
        ${isOver ? 'bg-blue-100 ring-2 ring-blue-300' : ''}
        hover:bg-gray-50 transition-all duration-200
      `}
      onClick={handleDateClick}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-blue-100');
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove('bg-blue-100');
      }}
      onDrop={async (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-blue-100');
        
        try {
          const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
          const { eventId, eventDate } = dragData;
          const newDate = date.toISOString().split('T')[0];
          
          if (eventDate !== newDate && onEventMove) {
            onEventMove(eventId, newDate);
          }
        } catch (error) {
          console.error('Drag and drop failed:', error);
        }
      }}
    >
      {/* 日付表示 */}
      <div className="flex justify-between items-start mb-1 flex-shrink-0">
        <div className="flex items-center justify-center flex-1">
          {isToday ? (
            <div className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
              {date.getDate()}
            </div>
          ) : (
            <span className={`
              text-sm font-medium text-center
              ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
            `}>
              {date.getDate()}
            </span>
          )}
        </div>
        
        {/* イベント数表示 */}
        {events.length > 0 && (
          <span className="hidden md:inline text-xs bg-blue-100 text-blue-800 px-1 rounded ml-2">
            {events.length}
          </span>
        )}
        
        {isOver && (
          <span className="text-xs text-blue-600 font-medium">
            移動
          </span>
        )}
      </div>

      {/* イベント一覧（スライス表示） */}
      <div className="flex-1 flex flex-col gap-0.5 md:gap-1 min-h-0 overflow-hidden">
        {/* モバイル表示（4件まで） */}
        <div className="md:hidden">
          {events.slice(0, 4).map((event) => (
            <EventCard
              key={event.id}
              event={event}
              compact={true}
              colorMode={colorMode}
              onEventEdit={onEventEdit}
            />
          ))}
          {events.length > 4 && (
            <div className="text-xs text-gray-500 text-center py-0.5 bg-blue-100 rounded flex-shrink-0">
              +{events.length - 4}件
            </div>
          )}
        </div>
        
        {/* PC表示（3件まで） */}
        <div className="hidden md:block">
          {events.slice(0, 3).map((event) => (
            <EventCard
              key={event.id}
              event={event}
              compact={true}
              colorMode={colorMode}
              onEventEdit={onEventEdit}
            />
          ))}
          {events.length > 3 && (
            <div className="text-xs text-gray-500 text-center py-1 bg-blue-100 rounded flex-shrink-0">
              +{events.length - 3}件
            </div>
          )}
        </div>
      </div>

      {/* ドロップ時のヒント */}
      {isOver && events.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-blue-500 text-xs bg-blue-50 bg-opacity-75">
          イベントをドロップ
        </div>
      )}
    </div>
  );
}