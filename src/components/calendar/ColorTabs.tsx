'use client';

import { ColorMode, CATEGORY_COLORS, IMPORTANCE_COLORS, PRIORITY_COLORS, PriorityLevel } from '@/types/calendar';

interface ColorTabsProps {
  selectedMode: ColorMode;
  onModeChange: (mode: ColorMode) => void;
  userCounts?: { [userId: string]: number };
  categoryCounts?: { [category: string]: number };
  priorityCounts?: { A: number; B: number; C: number; D: number };
  importanceCounts?: { high: number; medium: number; low: number };
  users?: Array<{ id: string; name: string; color: string }>;
  className?: string;
  // 日付ナビゲーション関連
  currentDate?: Date;
  viewMode?: 'month' | 'week' | 'day';
  onViewModeChange?: (mode: 'month' | 'week' | 'day') => void;
  onDateNavigate?: (direction: 'prev' | 'next') => void;
  onTodayClick?: () => void;
  onWeeklyPreviewClick?: () => void;
  loading?: boolean;
  // フィルタリング関連
  selectedFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
}

// 日付フォーマット関数
const formatDate = (date: Date, viewMode?: 'month' | 'week' | 'day') => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  switch (viewMode) {
    case 'month':
      return `${year}年${month}月`;
    case 'week':
      const weekStart = new Date(date);
      const dayOfWeek = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - dayOfWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}, ${year}`;
    case 'day':
      return `${year}年${month}月${date.getDate()}日`;
    default:
      return `${year}年${month}月`;
  }
};

export function ColorTabs({ 
  selectedMode, 
  onModeChange,
  userCounts = {},
  categoryCounts = {},
  priorityCounts = { A: 0, B: 0, C: 0, D: 0 },
  importanceCounts = { high: 0, medium: 0, low: 0 },
  users = [],
  className = '',
  currentDate,
  viewMode,
  onViewModeChange,
  onDateNavigate,
  onTodayClick,
  onWeeklyPreviewClick,
  loading = false,
  selectedFilter,
  onFilterChange
}: ColorTabsProps) {
  // 内部状態を親のpropsに置き換え
  const handleFilterChange = (filter: string | null) => {
    onFilterChange?.(filter);
  };

  // ユーザータブの内容
  const renderUserTabs = () => {
    if (users.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        <button
          onClick={() => handleFilterChange(null)}
          className={`px-3 py-1 text-xs rounded-full border transition-all ${
            selectedFilter === null
              ? 'bg-orange-500 text-white border-orange-500'
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
          }`}
        >
          全て ({Object.values(categoryCounts).reduce((sum, count) => sum + count, 0)})
        </button>
        
        {users.map(user => (
          <button
            key={user.id}
            onClick={() => handleFilterChange(user.id)}
            className={`px-3 py-1 text-xs rounded-full border transition-all flex items-center space-x-1 text-white ${
              selectedFilter === user.id
                ? 'ring-2 ring-offset-2 ring-gray-400'
                : 'hover:opacity-90'
            }`}
            style={{
              backgroundColor: user.color,
              borderColor: user.color
            }}
          >
            <span>{user.name}</span>
            <span className="text-xs opacity-90">({userCounts[user.id] || 0})</span>
          </button>
        ))}
      </div>
    );
  };

  // カテゴリタブの内容
  const renderCategoryTabs = () => {
    const categories = Object.entries(CATEGORY_COLORS) as [keyof typeof CATEGORY_COLORS, string][];
    
    const categoryLabels: { [key in keyof typeof CATEGORY_COLORS]: string } = {
      APPOINTMENT: 'アポ',
      TASK_DUE: 'タスク',
      PROJECT: 'プロジェクト',
      EVENT: 'イベント'
    };

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        <button
          onClick={() => handleFilterChange(null)}
          className={`px-3 py-1 text-xs rounded-full border transition-all ${
            selectedFilter === null
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
          }`}
        >
          全て ({Object.values(categoryCounts).reduce((sum, count) => sum + count, 0)})
        </button>
        
        {categories.map(([category, color]) => (
          <button
            key={category}
            onClick={() => handleFilterChange(category)}
            className={`px-3 py-1 text-xs rounded-full border transition-all flex items-center space-x-1 ${
              selectedFilter === category
                ? 'text-white border-transparent'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
            style={{
              backgroundColor: selectedFilter === category ? color : undefined,
              borderColor: selectedFilter === category ? color : undefined
            }}
          >
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: color }}
            />
            <span>{categoryLabels[category]}</span>
            <span className="text-xs opacity-75">({categoryCounts[category] || 0})</span>
          </button>
        ))}
      </div>
    );
  };

  // 重要度タブの内容 (A/B/C/D優先度システム)
  const renderImportanceTabs = () => {
    const priorityItems = [
      { key: 'A' as PriorityLevel, label: 'A項目', color: PRIORITY_COLORS.A },
      { key: 'B' as PriorityLevel, label: 'B項目', color: PRIORITY_COLORS.B },
      { key: 'C' as PriorityLevel, label: 'C項目', color: PRIORITY_COLORS.C },
      { key: 'D' as PriorityLevel, label: 'D項目', color: PRIORITY_COLORS.D }
    ];

    const totalCount = priorityCounts.A + priorityCounts.B + priorityCounts.C + priorityCounts.D;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        <button
          onClick={() => handleFilterChange(null)}
          className={`px-3 py-1 text-xs rounded-full border transition-all ${
            selectedFilter === null
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
          }`}
        >
          全て ({totalCount})
        </button>
        
        {priorityItems.map(item => (
          <button
            key={item.key}
            onClick={() => handleFilterChange(item.key)}
            className={`px-3 py-1 text-xs rounded-full border transition-all flex items-center space-x-1 ${
              selectedFilter === item.key
                ? 'text-white border-transparent'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
            style={{
              backgroundColor: selectedFilter === item.key ? item.color : undefined,
              borderColor: selectedFilter === item.key ? item.color : undefined
            }}
          >
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}</span>
            <span className="text-xs opacity-75">({priorityCounts[item.key]})</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="px-4 py-3">
        {/* 統合ヘッダー: モード選択 + 日付ナビ + 表示モード */}
        <div className="flex items-center justify-between space-x-4 mb-2">
          {/* 左: モード選択タブ */}
          <div className="flex items-center space-x-1">
            {([
              { mode: 'user' as ColorMode, label: 'ユーザー別', icon: '👤' },
              { mode: 'category' as ColorMode, label: 'カテゴリ別', icon: '📂' },
              { mode: 'importance' as ColorMode, label: '重要度別', icon: '⭐' }
            ]).map(({ mode, label, icon }) => (
              <button
                key={mode}
                onClick={() => {
                  onModeChange(mode);
                  handleFilterChange(null);
                }}
                className={`px-3 py-2 text-sm rounded-lg transition-all flex items-center space-x-2 ${
                  selectedMode === mode
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* 中央: 日付ナビゲーション */}
          {currentDate && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onDateNavigate?.('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h2 className="text-lg font-semibold text-gray-900 min-w-[150px] text-center">
                {formatDate(currentDate, viewMode)}
              </h2>
              
              <button
                onClick={() => onDateNavigate?.('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={loading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={onTodayClick}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                今日
              </button>
              
              <button
                onClick={onWeeklyPreviewClick}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                disabled={loading}
              >
                今後一週間
              </button>
            </div>
          )}

          {/* 右: 表示モード切り替え */}
          {viewMode && onViewModeChange && (
            <div className="flex items-center space-x-2">
              {(['month', 'week', 'day'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => onViewModeChange(mode)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={loading}
                >
                  {mode === 'month' ? '月' : mode === 'week' ? '週' : '日'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* フィルタータブ */}
        <div className="min-h-[40px]">
          {selectedMode === 'user' && renderUserTabs()}
          {selectedMode === 'category' && renderCategoryTabs()}
          {selectedMode === 'importance' && renderImportanceTabs()}
        </div>
      </div>
    </div>
  );
}