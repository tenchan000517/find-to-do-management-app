'use client';

import React from 'react';
import { EventCard } from './EventCard';
import { UnifiedCalendarEvent, ColorMode } from '@/types/calendar';

interface DraggableEventProps {
  event: UnifiedCalendarEvent;
  onEdit: (event: UnifiedCalendarEvent) => void;
  onMove: (eventId: string, newDate: string) => void;
  compact?: boolean;
  colorMode?: ColorMode;
}

export function DraggableEvent({ 
  event, 
  onEdit, 
  onMove, 
  compact = true,
  colorMode = 'category'
}: DraggableEventProps) {
  return (
    <EventCard
      event={event}
      compact={compact}
      colorMode={colorMode}
      onEventEdit={onEdit}
    />
  );
}