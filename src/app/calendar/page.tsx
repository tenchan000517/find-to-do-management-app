"use client";

import { useState, useRef, useEffect } from 'react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { CalendarEvent } from '@/lib/types';
import FullPageLoading from '@/components/FullPageLoading';

const getEventTypeStyle = (type: string) => {
  switch (type) {
    case 'meeting':
      return 'bg-blue-100 border-blue-500 text-blue-800';
    case 'event':
      return 'bg-green-100 border-green-500 text-green-800';
    case 'deadline':
      return 'bg-red-100 border-red-500 text-red-800';
    default:
      return 'bg-gray-100 border-gray-500 text-gray-800';
  }
};

const getEventTypeText = (type: string) => {
  switch (type) {
    case 'meeting':
      return '打ち合わせ';
    case 'event':
      return 'イベント';
    case 'deadline':
      return '期限';
    default:
      return 'その他';
  }
};

export default function CalendarPage() {
  const { events, loading, addEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  const [viewMonth, setViewMonth] = useState<Date | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
    setViewMonth(today);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dateStr = formData.get('date') as string;
    const timeStr = formData.get('time') as string;
    const startDateTime = `${dateStr}T${timeStr}`;
    
    const eventData = {
      title: formData.get('title') as string,
      date: dateStr,
      time: timeStr,
      startTime: startDateTime,
      participants: [],
      type: formData.get('type') as CalendarEvent['type'],
      description: formData.get('description') as string,
      location: formData.get('location') as string || '',
    };

    if (editingEvent) {
      updateEvent(editingEvent.id, eventData);
    } else {
      addEvent(eventData);
    }

    setShowModal(false);
    setEditingEvent(null);
  };

  const handleDragStart = (event: CalendarEvent) => {
    setDraggedEvent(event);
  };

  const handleDrop = (targetDate: string) => {
    if (draggedEvent) {
      const originalDate = new Date(draggedEvent.startTime);
      const newDate = new Date(targetDate);
      newDate.setHours(originalDate.getHours(), originalDate.getMinutes());
      
      const updatedEvent = {
        ...draggedEvent,
        date: targetDate,
        startTime: newDate.toISOString(),
      };
      
      updateEvent(draggedEvent.id, updatedEvent);
      setDraggedEvent(null);
    }
  };

  const getVisibleEventsForDate = (date: Date, maxVisible: number = 10) => {
    const allEvents = getEventsForDate(date);
    return {
      visible: allEvents.slice(0, maxVisible),
      remaining: Math.max(0, allEvents.length - maxVisible)
    };
  };

  const handleDayClick = (dateString: string, date: Date) => {
    setSelectedDate(dateString);
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length > 0) {
      setSelectedDayEvents(dayEvents);
      setShowDayModal(true);
    }
  };

  if (loading || !viewMonth) {
    return <FullPageLoading />;
  }

  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.startTime);
    const dateB = new Date(b.startTime);
    return dateA.getTime() - dateB.getTime();
  });

  const upcomingEvents = sortedEvents.filter(event => {
    const eventDate = new Date(event.startTime);
    const today = new Date();
    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(today.getDate() + 7);
    today.setHours(0, 0, 0, 0);
    oneWeekLater.setHours(23, 59, 59, 999);
    return eventDate >= today && eventDate <= oneWeekLater;
  });

  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const monthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay());

  const getDaysInMonth = () => {
    const days = [];
    const date = new Date(startDate);
    
    while (date <= monthEnd || days.length % 7 !== 0) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.startTime).toISOString().split('T')[0];
      return eventDate === dateString;
    });
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="w-full px-4 lg:px-8 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">カレンダー</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base"
          >
            新規予定
          </button>
        </div>
      </div>
        
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 flex-1 overflow-hidden px-4 lg:px-8 pb-4">
          {/* カレンダーエリア（簡易版） */}
          <div className="lg:col-span-3 flex flex-col overflow-hidden">
            <div className="bg-white rounded-lg shadow-lg p-3 md:p-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
                <h2 className="text-lg md:text-xl font-semibold text-gray-900">{formatMonth(viewMonth)}</h2>
                <div className="flex gap-1 sm:gap-2">
                  <button 
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1))}
                    className="px-2 md:px-3 py-1 text-xs md:text-sm bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    前月
                  </button>
                  <button 
                    onClick={() => setViewMonth(new Date())}
                    className="px-2 md:px-3 py-1 text-xs md:text-sm bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    今月
                  </button>
                  <button 
                    onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1))}
                    className="px-2 md:px-3 py-1 text-xs md:text-sm bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    次月
                  </button>
                </div>
              </div>
              
              {/* 簡易カレンダーグリッド */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
                  <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-500 py-1">
                    {day}
                  </div>
                ))}
              </div>
              
              <div 
                ref={containerRef}
                className="grid grid-cols-7 gap-1 flex-1 overflow-hidden"
              >
                {getDaysInMonth().map((date, index) => {
                  const dateString = date.toISOString().split('T')[0];
                  const { visible: visibleEvents, remaining } = getVisibleEventsForDate(date, 10);
                  const isToday = dateString === selectedDate;
                  const isCurrentMonth = date.getMonth() === viewMonth.getMonth();
                  const isSelected = dateString === selectedDate;
                  
                  return (
                    <div
                      key={index}
                      className={`
                        p-0.5 sm:p-1 border border-gray-200 cursor-pointer rounded flex flex-col overflow-hidden min-h-[60px] sm:min-h-[80px]
                        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                        ${isToday ? 'ring-2 ring-blue-600' : ''}
                        ${isSelected ? 'bg-blue-50' : ''}
                        hover:bg-gray-50 transition-colors
                      `}
                      onClick={() => handleDayClick(dateString, date)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDrop(dateString);
                      }}
                    >
                      <div className={`text-xs sm:text-sm font-medium ${isToday ? 'text-blue-600' : ''} mb-0.5 sm:mb-1 flex-shrink-0`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-0.5 flex-1 overflow-hidden min-h-0">
                        {visibleEvents.map((event) => (
                          <div
                            key={event.id}
                            draggable
                            onDragStart={() => handleDragStart(event)}
                            className={`text-xs p-0.5 rounded truncate leading-tight cursor-move transition-opacity hidden sm:block
                              ${event.type === 'meeting' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                event.type === 'event' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                'bg-red-100 text-red-700 hover:bg-red-200'}
                              ${draggedEvent?.id === event.id ? 'opacity-50' : ''}
                            `}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEvent(event);
                              setShowModal(true);
                            }}
                            title={`${new Date(event.startTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} ${event.title}`}
                          >
                            <span className="hidden sm:inline">{new Date(event.startTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} </span>{event.title}
                          </div>
                        ))}
                        {(remaining > 0 || (visibleEvents.length > 0 && window.innerWidth < 640)) && (
                          <div 
                            className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDayEvents(getEventsForDate(date));
                              setShowDayModal(true);
                            }}
                          >
                            <span className="sm:hidden">{getEventsForDate(date).length}件</span>
                            <span className="hidden sm:inline">+{remaining}件を表示</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 予定リスト */}
          <div className="space-y-4 lg:space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">今後1週間の予定</h3>
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`border-l-4 p-3 rounded-r-lg cursor-pointer ${getEventTypeStyle(event.type)}`}
                    onClick={() => {
                      setEditingEvent(event);
                      setShowModal(true);
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <span className="text-xs px-2 py-1 rounded bg-white bg-opacity-50">
                        {getEventTypeText(event.type)}
                      </span>
                    </div>
                    <p className="text-xs opacity-80 mb-1">{event.description}</p>
                    <div className="flex justify-between text-xs opacity-70">
                      <span>{new Date(event.startTime).toLocaleDateString('ja-JP')}</span>
                      <span>{new Date(event.startTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* イベントタイプ凡例 */}
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">凡例</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-700">打ち合わせ</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-700">イベント</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm text-gray-700">期限</span>
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingEvent ? '予定編集' : '新規予定'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingEvent?.title || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    日付
                  </label>
                  <input
                    type="date"
                    name="date"
                    defaultValue={editingEvent ? new Date(editingEvent.startTime).toISOString().split('T')[0] : selectedDate}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    時刻
                  </label>
                  <input
                    type="time"
                    name="time"
                    defaultValue={editingEvent ? new Date(editingEvent.startTime).toTimeString().substring(0, 5) : ''}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  種類
                </label>
                <select
                  name="type"
                  defaultValue={editingEvent?.type || 'meeting'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="meeting">打ち合わせ</option>
                  <option value="event">イベント</option>
                  <option value="deadline">期限</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明
                </label>
                <textarea
                  name="description"
                  defaultValue={editingEvent?.description || ''}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  場所
                </label>
                <input
                  type="text"
                  name="location"
                  defaultValue={editingEvent?.location || ''}
                  placeholder="オンライン、会議室Aなど"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium"
                >
                  {editingEvent ? '更新' : '作成'}
                </button>
                {editingEvent && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteEvent(editingEvent.id);
                      setShowModal(false);
                      setEditingEvent(null);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-medium"
                  >
                    削除
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingEvent(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 日別予定一覧モーダル */}
      {showDayModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="fixed inset-0 bg-gray-200 bg-opacity-75" onClick={() => setShowDayModal(false)}></div>
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-2xl relative max-h-[80vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
              <h2 className="text-lg md:text-xl font-bold">
                {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('ja-JP', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}の予定
              </h2>
              <button
                onClick={() => setShowDayModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              {selectedDayEvents.map((event) => (
                <div
                  key={event.id}
                  className={`border-l-4 p-4 rounded-r-lg cursor-pointer hover:shadow-md transition-shadow ${getEventTypeStyle(event.type)}`}
                  onClick={() => {
                    setEditingEvent(event);
                    setShowDayModal(false);
                    setShowModal(true);
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{event.title}</h4>
                    <span className="text-xs px-2 py-1 rounded bg-white bg-opacity-50">
                      {getEventTypeText(event.type)}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm opacity-80 mb-2">{event.description}</p>
                  )}
                  {event.location && (
                    <p className="text-sm opacity-70 mb-2">📍 {event.location}</p>
                  )}
                  <div className="text-sm opacity-70">
                    {new Date(event.startTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              {selectedDayEvents.length === 0 && (
                <p className="text-gray-500 text-center py-4">この日に予定はありません</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}