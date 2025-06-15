'use client';

import { useState } from 'react';
import { ColorMode, CATEGORY_COLORS, IMPORTANCE_COLORS } from '@/types/calendar';

interface ColorTabsProps {
  selectedMode: ColorMode;
  onModeChange: (mode: ColorMode) => void;
  userCounts?: { [userId: string]: number };
  categoryCounts?: { [category: string]: number };
  importanceCounts?: { high: number; medium: number; low: number };
  users?: Array<{ id: string; name: string; color: string }>;
  className?: string;
}

export function ColorTabs({ 
  selectedMode, 
  onModeChange,
  userCounts = {},
  categoryCounts = {},
  importanceCounts = { high: 0, medium: 0, low: 0 },
  users = [],
  className = ''
}: ColorTabsProps) {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  // ユーザータブの内容
  const renderUserTabs = () => {
    if (users.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        <button
          onClick={() => setSelectedFilter(null)}
          className={`px-3 py-1 text-xs rounded-full border transition-all ${
            selectedFilter === null
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
          }`}
        >
          全て ({Object.values(userCounts).reduce((sum, count) => sum + count, 0)})
        </button>
        
        {users.map(user => (
          <button
            key={user.id}
            onClick={() => setSelectedFilter(user.id)}
            className={`px-3 py-1 text-xs rounded-full border transition-all flex items-center space-x-1 ${
              selectedFilter === user.id
                ? 'text-white border-transparent'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
            style={{
              backgroundColor: selectedFilter === user.id ? user.color : undefined,
              borderColor: selectedFilter === user.id ? user.color : undefined
            }}
          >
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: user.color }}
            />
            <span>{user.name}</span>
            <span className="text-xs opacity-75">({userCounts[user.id] || 0})</span>
          </button>
        ))}
      </div>
    );
  };

  // カテゴリタブの内容
  const renderCategoryTabs = () => {
    const categories = Object.entries(CATEGORY_COLORS) as [keyof typeof CATEGORY_COLORS, string][];
    
    const categoryLabels: { [key in keyof typeof CATEGORY_COLORS]: string } = {
      GENERAL: '一般',
      MEETING: '会議',
      APPOINTMENT: 'アポ',
      TASK_DUE: 'タスク',
      PROJECT: 'プロジェクト',
      PERSONAL: '個人',
      TEAM: 'チーム'
    };

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        <button
          onClick={() => setSelectedFilter(null)}
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
            onClick={() => setSelectedFilter(category)}
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

  // 重要度タブの内容
  const renderImportanceTabs = () => {
    const importanceItems = [
      { key: 'high', label: '高', color: IMPORTANCE_COLORS.HIGH },
      { key: 'medium', label: '中', color: IMPORTANCE_COLORS.MEDIUM },
      { key: 'low', label: '低', color: IMPORTANCE_COLORS.LOW }
    ] as const;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        <button
          onClick={() => setSelectedFilter(null)}
          className={`px-3 py-1 text-xs rounded-full border transition-all ${
            selectedFilter === null
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
          }`}
        >
          全て ({importanceCounts.high + importanceCounts.medium + importanceCounts.low})
        </button>
        
        {importanceItems.map(item => (
          <button
            key={item.key}
            onClick={() => setSelectedFilter(item.key)}
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
            <span className="text-xs opacity-75">({importanceCounts[item.key]})</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="px-4 py-3">
        {/* モード選択タブ */}
        <div className="flex items-center space-x-1 mb-2">
          {([
            { mode: 'user' as ColorMode, label: 'ユーザー別', icon: '👤' },
            { mode: 'category' as ColorMode, label: 'カテゴリ別', icon: '📂' },
            { mode: 'importance' as ColorMode, label: '重要度別', icon: '⭐' }
          ]).map(({ mode, label, icon }) => (
            <button
              key={mode}
              onClick={() => {
                onModeChange(mode);
                setSelectedFilter(null);
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