"use client";

import { useState, useEffect } from 'react';
import { KnowledgeItem } from '@/lib/types';
import { useUsers } from '@/hooks/useUsers';
import LoadingSpinner from '@/components/LoadingSpinner';
import { MarkdownContent } from '@/components/MarkdownContent';


const getCategoryStyle = (category: string) => {
  switch (category) {
    case 'industry':
      return 'bg-blue-100 text-blue-800';
    case 'sales':
      return 'bg-green-100 text-green-800';
    case 'technical':
      return 'bg-purple-100 text-purple-800';
    case 'business':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getCategoryText = (category: string) => {
  switch (category) {
    case 'industry':
      return '業界知識';
    case 'sales':
      return '営業・マーケ';
    case 'technical':
      return '技術・専門用語';
    case 'business':
      return 'ビジネス';
    default:
      return 'その他';
  }
};

export default function KnowledgePage() {
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'industry' | 'sales' | 'technical' | 'business'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const { users, loading: usersLoading } = useUsers();
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'category' | 'date' | 'ai'>('category');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [aiCategory, setAiCategory] = useState<string>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/knowledge');
      if (!response.ok) {
        throw new Error('Failed to fetch knowledge');
      }
      const data = await response.json();
      setKnowledge(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (id: string) => {
    try {
      const response = await fetch(`/api/knowledge/${id}/like`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to like knowledge');
      }
      const updated = await response.json();
      setKnowledge(prev => 
        prev.map(item => item.id === id ? updated : item)
      );
    } catch (error) {
      console.error('Failed to like knowledge:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このナレッジを削除してもよろしいですか？')) {
      return;
    }
    
    try {
      const response = await fetch('/api/knowledge', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete knowledge');
      }
      
      setKnowledge(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete knowledge:', error);
      alert('削除に失敗しました');
    }
  };

  const handleEdit = (item: KnowledgeItem) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const toggleExpanded = (id: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const extractLinks = (text: string): string[] => {
    // 改良版URL検出正規表現 - より多くのURL形式に対応
    const urlRegex = /(https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*)?(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)/g;
    return text.match(urlRegex) || [];
  };

  const shouldTruncate = (content: string): boolean => {
    // より合理的な切り詰め条件: 5行または300文字以上
    return content.split('\n').length > 5 || content.length > 300;
  };

  const getAiCategory = (item: KnowledgeItem): string => {
    const content = item.content.toLowerCase();
    const title = item.title.toLowerCase();
    const tags = item.tags.join(' ').toLowerCase();
    const fullText = `${title} ${content} ${tags}`;
    
    if (fullText.includes('プログラ') || fullText.includes('コード') || fullText.includes('開発') || fullText.includes('実装')) {
      return 'programming';
    } else if (fullText.includes('チーム') || fullText.includes('組織') || fullText.includes('マネジメント')) {
      return 'team';
    } else if (fullText.includes('チラシ') || fullText.includes('広告') || fullText.includes('宣伝')) {
      return 'flyer';
    } else if (fullText.includes('資料') || fullText.includes('ドキュメント') || fullText.includes('文書')) {
      return 'document';
    } else if (fullText.includes('営業') || fullText.includes('顧客') || fullText.includes('セールス')) {
      return 'sales';
    } else if (fullText.includes('マーケティング') || fullText.includes('市場') || fullText.includes('分析')) {
      return 'marketing';
    }
    return 'other';
  };

  const filteredKnowledge = knowledge.filter(item => {
    // カテゴリフィルター
    const matchesFilter = filter === 'all' || item.category === filter;
    
    // 検索フィルター
    const matchesSearch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // 日付フィルター
    let matchesDate = true;
    if (dateFilter) {
      const itemDate = new Date(item.createdAt);
      const [year, month] = dateFilter.split('-').map(Number);
      matchesDate = itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
    }
    
    // AIカテゴリフィルター
    let matchesAiCategory = true;
    if (aiCategory !== 'all') {
      matchesAiCategory = getAiCategory(item) === aiCategory;
    }
    
    return matchesFilter && matchesSearch && matchesDate && matchesAiCategory;
  });

  const sortedKnowledge = filteredKnowledge.sort((a, b) => b.likes - a.likes);

  // 日付リストを生成（過去1年分）
  const generateDateOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push({
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: `${date.getFullYear()}年${date.getMonth() + 1}月`
      });
    }
    return options;
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:flex relative">
      {/* モバイル用オーバーレイ */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* サイドバー */}
      <div className={`
        fixed lg:sticky top-0 left-0 z-50 lg:z-auto
        w-96 bg-white shadow-lg h-screen overflow-y-auto
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4">
          {/* サイドバーヘッダー */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">フィルタリング</h3>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* タブ切り替え */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSidebarTab('category')}
              className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                sidebarTab === 'category' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📂 カテゴリ
            </button>
            <button
              onClick={() => setSidebarTab('date')}
              className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                sidebarTab === 'date' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📅 日付
            </button>
            <button
              onClick={() => setSidebarTab('ai')}
              className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                sidebarTab === 'ai' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🤖 AI分類
            </button>
          </div>
          
          {/* カテゴリタブ */}
          {sidebarTab === 'category' && (
            <div className="space-y-2">
              <button
                onClick={() => setFilter('all')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  filter === 'all' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                すべて ({knowledge.length})
              </button>
              <button
                onClick={() => setFilter('industry')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  filter === 'industry' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                業界知識 ({knowledge.filter(k => k.category === 'industry').length})
              </button>
              <button
                onClick={() => setFilter('sales')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  filter === 'sales' 
                    ? 'bg-green-100 text-green-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                営業・マーケ ({knowledge.filter(k => k.category === 'sales').length})
              </button>
              <button
                onClick={() => setFilter('technical')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  filter === 'technical' 
                    ? 'bg-purple-100 text-purple-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                技術・専門用語 ({knowledge.filter(k => k.category === 'technical').length})
              </button>
              <button
                onClick={() => setFilter('business')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  filter === 'business' 
                    ? 'bg-orange-100 text-orange-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                ビジネス ({knowledge.filter(k => k.category === 'business').length})
              </button>
            </div>
          )}
          
          {/* 日付タブ */}
          {sidebarTab === 'date' && (
            <div className="space-y-2">
              <button
                onClick={() => setDateFilter('')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  !dateFilter 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                すべての期間
              </button>
              {generateDateOptions().map(option => {
                const count = knowledge.filter(item => {
                  const itemDate = new Date(item.createdAt);
                  const [year, month] = option.value.split('-').map(Number);
                  return itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
                }).length;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => setDateFilter(option.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                      dateFilter === option.value 
                        ? 'bg-blue-100 text-blue-700 font-medium' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {option.label} ({count})
                  </button>
                );
              })}
            </div>
          )}
          
          {/* AI分類タブ */}
          {sidebarTab === 'ai' && (
            <div className="space-y-2">
              <button
                onClick={() => setAiCategory('all')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  aiCategory === 'all' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => setAiCategory('programming')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  aiCategory === 'programming' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                プログラミング ({knowledge.filter(k => getAiCategory(k) === 'programming').length})
              </button>
              <button
                onClick={() => setAiCategory('team')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  aiCategory === 'team' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                チームナレッジ ({knowledge.filter(k => getAiCategory(k) === 'team').length})
              </button>
              <button
                onClick={() => setAiCategory('flyer')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  aiCategory === 'flyer' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                チラシ ({knowledge.filter(k => getAiCategory(k) === 'flyer').length})
              </button>
              <button
                onClick={() => setAiCategory('document')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  aiCategory === 'document' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                資料 ({knowledge.filter(k => getAiCategory(k) === 'document').length})
              </button>
              <button
                onClick={() => setAiCategory('sales')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  aiCategory === 'sales' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                営業関連 ({knowledge.filter(k => getAiCategory(k) === 'sales').length})
              </button>
              <button
                onClick={() => setAiCategory('marketing')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  aiCategory === 'marketing' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                マーケティング ({knowledge.filter(k => getAiCategory(k) === 'marketing').length})
              </button>
              <button
                onClick={() => setAiCategory('other')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  aiCategory === 'other' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                その他 ({knowledge.filter(k => getAiCategory(k) === 'other').length})
              </button>
            </div>
          )}
          
          {/* フィルターリセットボタン */}
          {(filter !== 'all' || dateFilter || aiCategory !== 'all') && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setFilter('all');
                  setDateFilter('');
                  setAiCategory('all');
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                すべてのフィルターをリセット
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* メインコンテンツ */}
      <div className="w-full lg:flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto w-full">
          {/* モバイル用フィルターボタンと新規投稿ボタン */}
          <div className="lg:hidden mb-4 flex justify-between items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors flex-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <span className="font-medium text-gray-700">フィルター</span>
              {(filter !== 'all' || dateFilter || aiCategory !== 'all') && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-2 h-2"></span>
              )}
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新規
            </button>
          </div>
        {/* デスクトップ用統計情報とカテゴリ別数字 */}
        <div className="hidden lg:block mb-6 md:mb-8">
          <div className="flex flex-col gap-4">
            {/* 統計情報 */}
            {!loading && !error && (
              <>
                {/* モバイル：総投稿数と分類表示 */}
                <div className="lg:hidden">
                  <div className="flex flex-wrap gap-2 md:gap-3 mb-4">
                    <div className="bg-white rounded-lg shadow-md px-2 md:px-3 py-2 flex items-center gap-1 md:gap-2 min-w-0 flex-shrink">
                      <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">総</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500 whitespace-nowrap">総投稿</div>
                        <div className="text-sm md:text-lg font-bold text-gray-900">{knowledge.length}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    <div className="bg-white rounded-lg shadow-md px-2 md:px-3 py-2 flex items-center gap-1 md:gap-2 min-w-0 flex-shrink">
                      <div className="w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">営</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500 whitespace-nowrap">営業</div>
                        <div className="text-sm md:text-lg font-bold text-gray-900">
                          {knowledge.filter(k => k.category === 'sales').length}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md px-2 md:px-3 py-2 flex items-center gap-1 md:gap-2 min-w-0 flex-shrink">
                      <div className="w-5 h-5 md:w-6 md:h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">技</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500 whitespace-nowrap">技術</div>
                        <div className="text-sm md:text-lg font-bold text-gray-900">
                          {knowledge.filter(k => k.category === 'technical').length}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md px-2 md:px-3 py-2 flex items-center gap-1 md:gap-2 min-w-0 flex-shrink">
                      <div className="w-5 h-5 md:w-6 md:h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">産</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500 whitespace-nowrap">業界</div>
                        <div className="text-sm md:text-lg font-bold text-gray-900">
                          {knowledge.filter(k => k.category === 'industry').length}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md px-2 md:px-3 py-2 flex items-center gap-1 md:gap-2 min-w-0 flex-shrink">
                      <div className="w-5 h-5 md:w-6 md:h-6 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">ビ</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500 whitespace-nowrap">ビジネス</div>
                        <div className="text-sm md:text-lg font-bold text-gray-900">
                          {knowledge.filter(k => k.category === 'business').length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* PC：全カテゴリタブ + 新規投稿ボタン（完全一行） */}
                <div className="hidden lg:flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setFilter('all')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        filter === 'all' 
                          ? 'bg-blue-500 text-white shadow-md' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                      }`}
                    >
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">総</span>
                      </div>
                      <span>総投稿 ({knowledge.length})</span>
                    </button>
                    <button
                      onClick={() => setFilter('sales')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        filter === 'sales' 
                          ? 'bg-green-500 text-white shadow-md' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                      }`}
                    >
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">営</span>
                      </div>
                      <span>営業 ({knowledge.filter(k => k.category === 'sales').length})</span>
                    </button>
                    <button
                      onClick={() => setFilter('technical')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        filter === 'technical' 
                          ? 'bg-purple-500 text-white shadow-md' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                      }`}
                    >
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">技</span>
                      </div>
                      <span>技術 ({knowledge.filter(k => k.category === 'technical').length})</span>
                    </button>
                    <button
                      onClick={() => setFilter('industry')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        filter === 'industry' 
                          ? 'bg-orange-500 text-white shadow-md' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                      }`}
                    >
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">産</span>
                      </div>
                      <span>業界 ({knowledge.filter(k => k.category === 'industry').length})</span>
                    </button>
                    <button
                      onClick={() => setFilter('business')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        filter === 'business' 
                          ? 'bg-gray-500 text-white shadow-md' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                      }`}
                    >
                      <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">ビ</span>
                      </div>
                      <span>ビジネス ({knowledge.filter(k => k.category === 'business').length})</span>
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    新規投稿
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 検索バー */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6 mx-auto">
          <input
            type="text"
            placeholder="タイトル、内容、タグで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* ローディング・エラー状態 */}
        {(loading || usersLoading) && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">読み込み中...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <button 
                  onClick={fetchKnowledge}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  再試行
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ナレッジリスト */}
        {!loading && !usersLoading && !error && (
          <div className="space-y-4 md:space-y-6 w-full">
            {sortedKnowledge.map((item) => {
              const isExpanded = expandedCards.has(item.id);
              const links = extractLinks(item.content);
              const shouldTruncateContent = shouldTruncate(item.content);
              
              return (
                <div key={item.id} className="bg-white rounded-lg shadow-lg p-4 md:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border border-gray-100 w-full max-w-none">
                  <div className="flex-1">
                    {/* タイトルとカテゴリ */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 flex-1 break-all">
                        {item.title.length > 80 && item.title.startsWith('http') ? 
                          `${item.title.substring(0, 40)}...${item.title.substring(item.title.length - 20)}` : 
                          item.title
                        }
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryStyle(item.category)} flex-shrink-0`}>
                        {getCategoryText(item.category)}
                      </span>
                    </div>
                      
                    {/* コンテンツ表示 - マークダウン対応 */}
                    <div className="text-sm md:text-base text-gray-600 mb-4 break-words overflow-hidden">
                      {shouldTruncateContent && !isExpanded ? (
                        <div className="space-y-2">
                          <div className="line-clamp-3">
                            <MarkdownContent content={item.content} />
                          </div>
                        </div>
                      ) : (
                        <div className="break-words">
                          <MarkdownContent content={item.content} />
                        </div>
                      )}
                    </div>
                    
                    {/* 読みもっと/Closeボタン */}
                    {shouldTruncateContent && (
                      <button
                        onClick={() => {
                          toggleExpanded(item.id);
                          // サイドバーを閉じる
                          if (window.innerWidth < 1024) setSidebarOpen(false);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4 flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            閉じる
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            もっと見る
                          </>
                        )}
                      </button>
                    )}
                
                    {/* タグ行 - 独立 */}
                    <div className="flex flex-wrap gap-1 md:gap-2 mb-4">
                      {item.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs md:text-sm font-medium bg-gray-100 text-gray-800 transition-colors hover:bg-gray-200">
                          #{tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs md:text-sm font-medium bg-gray-100 text-gray-600">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>
                
                    {/* 最下部行: 投稿者・日付・いいね・ボタン */}
                    <div className="flex flex-col gap-3 text-xs md:text-sm">
                      {/* 投稿者情報行 */}
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 text-gray-500">
                        <span>投稿者: <span className="font-medium text-gray-900">{item.author}</span></span>
                        <span className="text-gray-400">{new Date(item.createdAt).toLocaleDateString('ja-JP')}</span>
                        {item.assignee && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">管理者:</span>
                            <div 
                              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-medium"
                              style={{ backgroundColor: item.assignee.color }}
                            >
                              {item.assignee.name.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-900">{item.assignee.name}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* アクションボタン行 */}
                      <div className="flex flex-wrap items-center gap-1 md:gap-2">
                        {/* ソースリンクボタン */}
                        {links.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {links.map((link, index) => {
                              let domain = 'リンク';
                              try {
                                domain = new URL(link).hostname.replace('www.', '');
                              } catch (e) {
                                domain = 'リンク';
                              }
                              return (
                                <a
                                  key={index}
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded text-xs font-medium transition-all duration-200 border border-blue-200 hover:border-blue-300"
                                  title={`ソース: ${link}`}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  <span className="max-w-[60px] truncate">{domain}</span>
                                </a>
                              );
                            })}
                          </div>
                        )}
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(item.id);
                          }}
                          className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">{item.likes}</span>
                        </button>
                        
                        <button 
                          onClick={() => handleEdit(item)}
                          className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors border border-blue-200 hover:border-blue-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>編集</span>
                        </button>
                        
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors border border-red-200 hover:border-red-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>削除</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && filteredKnowledge.length === 0 && (
          <div className="text-center py-12 w-full">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-gray-400 text-lg mb-2">該当するナレッジがありません</div>
            <div className="text-gray-500 text-sm">検索条件を変更するか、新しいナレッジを投稿してみましょう</div>
          </div>
        )}

        {/* ナレッジ作成モーダル */}
        {showCreateModal && (
          <CreateKnowledgeModal 
            onClose={() => setShowCreateModal(false)}
            onCreated={fetchKnowledge}
            users={users}
          />
        )}
        
        {/* ナレッジ編集モーダル */}
        {showEditModal && editingItem && (
          <EditKnowledgeModal 
            item={editingItem}
            onClose={() => {
              setShowEditModal(false);
              setEditingItem(null);
            }}
            onUpdated={fetchKnowledge}
            users={users}
          />
        )}
        </div>
      </div>
    </div>
  );
}

// ナレッジ作成モーダルコンポーネント
interface CreateKnowledgeModalProps {
  onClose: () => void;
  onCreated: () => void;
  users: any[];
}

function CreateKnowledgeModal({ onClose, onCreated, users }: CreateKnowledgeModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'business' as 'industry' | 'sales' | 'technical' | 'business',
    content: '',
    author: '',
    assigneeId: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.author) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          assignedTo: formData.assigneeId || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to create knowledge');
      
      onCreated();
      onClose();
    } catch (error) {
      console.error('Error creating knowledge:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto relative">
        {/* ローディングオーバーレイ */}
        {isSubmitting && (
          <LoadingSpinner 
            overlay={true}
            message="ナレッジを投稿しています..."
            size="sm"
          />
        )}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">新しいナレッジを投稿</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">タイトル *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="business">ビジネス</option>
                <option value="industry">業界知識</option>
                <option value="sales">営業・マーケ</option>
                <option value="technical">技術・専門用語</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">投稿者 *</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ナレッジ管理者（任意）</label>
              <select
                value={formData.assigneeId}
                onChange={(e) => setFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">管理者を選択してください</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">内容 *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">タグ</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="タグを入力してEnter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  追加
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-blue-600 hover:text-blue-800">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title || !formData.content || !formData.author}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '投稿中...' : '投稿する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ナレッジ編集モーダルコンポーネント
interface EditKnowledgeModalProps {
  item: KnowledgeItem;
  onClose: () => void;
  onUpdated: () => void;
  users: any[];
}

function EditKnowledgeModal({ item, onClose, onUpdated, users }: EditKnowledgeModalProps) {
  const [formData, setFormData] = useState({
    title: item.title,
    category: item.category as 'industry' | 'sales' | 'technical' | 'business',
    content: item.content,
    author: item.author,
    assigneeId: item.assignedTo || '',
    tags: item.tags,
  });
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.author) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/knowledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          ...formData,
          assignedTo: formData.assigneeId || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to update knowledge');
      
      onUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating knowledge:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto relative">
        {/* ローディングオーバーレイ */}
        {isSubmitting && (
          <LoadingSpinner 
            overlay={true}
            message="ナレッジを更新しています..."
            size="sm"
          />
        )}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">ナレッジを編集</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">タイトル *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリ *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="business">ビジネス</option>
                <option value="industry">業界知識</option>
                <option value="sales">営業・マーケ</option>
                <option value="technical">技術・専門用語</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">投稿者 *</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ナレッジ管理者（任意）</label>
              <select
                value={formData.assigneeId}
                onChange={(e) => setFormData(prev => ({ ...prev, assigneeId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">管理者を選択してください</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">内容 *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">タグ</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="タグを入力してEnter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  追加
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-blue-600 hover:text-blue-800">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title || !formData.content || !formData.author}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '更新中...' : '更新する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}