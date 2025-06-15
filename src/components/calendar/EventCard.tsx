'use client';

import { CalendarEvent, CATEGORY_COLORS, IMPORTANCE_COLORS } from '@/types/calendar';

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  showTime?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function EventCard({ 
  event, 
  compact = false, 
  showTime = true, 
  onClick 
}: EventCardProps) {
  
  // 色を決定（ユーザー色 → カテゴリ色 → デフォルト）
  const getEventColor = () => {
    if (event.colorCode) {
      return event.colorCode;
    }
    
    // カテゴリ別色
    return CATEGORY_COLORS[event.category] || CATEGORY_COLORS.GENERAL;
  };

  // 重要度に基づく表示スタイル
  const getImportanceStyle = () => {
    if (event.importance >= 0.8) {
      return 'border-l-4 border-red-500 font-semibold';
    } else if (event.importance >= 0.6) {
      return 'border-l-4 border-orange-500 font-medium';
    } else if (event.importance >= 0.4) {
      return 'border-l-4 border-green-500';
    }
    return 'border-l-2 border-gray-300';
  };

  // ラベル生成（「誰」「カテゴリ」「重要度」）
  const getLabels = () => {
    const labels = [];
    
    // 誰（ユーザー名の頭文字）
    if (event.userId) {
      // TODO: ユーザー名を取得してイニシャル表示
      labels.push({
        text: 'K', // 川島さんの'K'など
        color: 'bg-blue-100 text-blue-800'
      });
    }
    
    // カテゴリ
    const categoryLabels = {
      GENERAL: 'G',
      MEETING: 'M',
      APPOINTMENT: 'A',
      TASK_DUE: 'T',
      PROJECT: 'P',
      PERSONAL: 'Pe',
      TEAM: 'Te'
    };
    
    labels.push({
      text: categoryLabels[event.category] || 'G',
      color: 'bg-gray-100 text-gray-800'
    });
    
    // 重要度
    const importanceLabel = event.importance >= 0.8 ? 'H' : 
                          event.importance >= 0.6 ? 'M' : 'L';
    const importanceColor = event.importance >= 0.8 ? 'bg-red-100 text-red-800' :
                           event.importance >= 0.6 ? 'bg-orange-100 text-orange-800' :
                           'bg-green-100 text-green-800';
    
    labels.push({
      text: importanceLabel,
      color: importanceColor
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
  const importanceStyle = getImportanceStyle();
  const labels = getLabels();

  return (
    <div
      className={`rounded-md border transition-all duration-200 cursor-pointer hover:shadow-md ${
        compact ? 'p-2 text-xs' : 'p-3 text-sm'
      } ${importanceStyle}`}
      style={{ 
        backgroundColor: `${eventColor}15`,
        borderColor: eventColor
      }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        {/* メイン情報 */}
        <div className="flex-1 min-w-0">
          {/* 時間表示 */}
          {showTime && event.time && (
            <div className="text-xs text-gray-600 mb-1">
              {event.time}
              {event.endTime && ` - ${event.endTime}`}
            </div>
          )}
          
          {/* タイトル */}
          <div className={`text-gray-900 ${compact ? 'font-medium' : 'font-semibold'}`}>
            {getTruncatedTitle()}
          </div>
          
          {/* 説明（非compactモードのみ） */}
          {!compact && event.description && (
            <div className="text-gray-600 mt-1 text-xs">
              {event.description.length > 100 
                ? event.description.slice(0, 100) + '...'
                : event.description
              }
            </div>
          )}
          
          {/* 場所（非compactモードのみ） */}
          {!compact && event.location && (
            <div className="text-gray-500 mt-1 text-xs flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {event.location}
            </div>
          )}
        </div>
        
        {/* ラベル */}
        <div className="flex items-center space-x-1 ml-2">
          {labels.map((label, index) => (
            <span
              key={index}
              className={`inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full ${label.color}`}
            >
              {label.text}
            </span>
          ))}
        </div>
      </div>
      
      {/* 繰り返しアイコン */}
      {event.isRecurring && (
        <div className="mt-2 flex items-center text-xs text-gray-500">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          繰り返し
        </div>
      )}
    </div>
  );
}