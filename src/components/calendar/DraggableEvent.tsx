'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { UnifiedCalendarEvent } from '@/types/calendar';

interface DraggableEventProps {
  event: UnifiedCalendarEvent;
  onEdit: (event: UnifiedCalendarEvent) => void;
  onMove: (eventId: string, newDate: string) => void;
}

export function DraggableEvent({ event, onEdit, onMove }: DraggableEventProps) {
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

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'task':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'appointment':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'event':
        return 'bg-purple-100 border-purple-300 text-purple-800';
      case 'personal':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'task':
        return '📋';
      case 'appointment':
        return '👥';
      case 'event':
        return '🎯';
      case 'personal':
        return '👤';
      default:
        return '📅';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${getEventTypeColor(event.type)}
        border rounded px-2 py-1 text-xs cursor-grab
        ${isDragging ? 'opacity-50 z-50' : 'hover:shadow-sm'}
        transition-all duration-200
        active:cursor-grabbing
      `}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onEdit(event);
      }}
    >
      <div className="flex items-center gap-1">
        <span className="text-xs">
          {getEventTypeIcon(event.type)}
        </span>
        <span className="truncate font-medium">
          {event.title}
        </span>
      </div>
      
      {event.time && (
        <div className="text-xs opacity-75 mt-0.5">
          {event.time}
        </div>
      )}
      
      {event.priority && event.priority !== 'C' && (
        <div className={`
          text-xs font-bold mt-0.5
          ${event.priority === 'A' ? 'text-red-600' : event.priority === 'B' ? 'text-orange-600' : 'text-green-600'}
        `}>
          {event.priority === 'A' ? '🔴' : event.priority === 'B' ? '🟠' : '🟢'}
        </div>
      )}
    </div>
  );
}