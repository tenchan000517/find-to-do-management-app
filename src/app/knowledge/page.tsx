"use client";

import { useState, useEffect } from 'react';
import { KnowledgeItem } from '@/lib/types';
import { useUsers } from '@/hooks/useUsers';
import LoadingSpinner from '@/components/LoadingSpinner';


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

  const filteredKnowledge = knowledge.filter(item => {
    const matchesFilter = filter === 'all' || item.category === filter;
    const matchesSearch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const sortedKnowledge = filteredKnowledge.sort((a, b) => b.likes - a.likes);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー行 - 統計情報と新規投稿ボタン */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 md:mb-8 gap-4">
          {/* 統計情報 */}
          {!loading && !error && (
            <div className="flex flex-wrap gap-3">
              <div className="bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">総</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">総投稿</div>
                  <div className="text-lg font-bold text-gray-900">{knowledge.length}</div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">営</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">営業</div>
                  <div className="text-lg font-bold text-gray-900">
                    {knowledge.filter(k => k.category === 'sales').length}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">技</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">技術</div>
                  <div className="text-lg font-bold text-gray-900">
                    {knowledge.filter(k => k.category === 'technical').length}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">産</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">業界</div>
                  <div className="text-lg font-bold text-gray-900">
                    {knowledge.filter(k => k.category === 'industry').length}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規投稿
          </button>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="タイトル、内容、タグで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  filter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => setFilter('industry')}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  filter === 'industry' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                業界知識
              </button>
              <button
                onClick={() => setFilter('sales')}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  filter === 'sales' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                営業・マーケ
              </button>
              <button
                onClick={() => setFilter('technical')}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  filter === 'technical' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                技術・専門用語
              </button>
              <button
                onClick={() => setFilter('business')}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  filter === 'business' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ビジネス
              </button>
            </div>
          </div>
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
          <div className="space-y-4 md:space-y-6">
            {sortedKnowledge.map((item) => {
              const isExpanded = expandedCards.has(item.id);
              const links = extractLinks(item.content);
              const shouldTruncateContent = shouldTruncate(item.content);
              
              return (
                <div key={item.id} className="bg-white rounded-lg shadow-lg p-4 md:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <h3 className="text-lg md:text-xl font-semibold text-gray-900 line-clamp-2">{item.title}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryStyle(item.category)} flex-shrink-0`}>
                            {getCategoryText(item.category)}
                          </span>
                        </div>
                        
                        {/* 作成者とナレッジ管理者の表示 */}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">作成者:</span>
                            <span className="font-medium">{item.author}</span>
                          </div>
                          {item.assignee && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">管理者:</span>
                              <div className="flex items-center gap-1">
                                <div 
                                  className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                  style={{ backgroundColor: item.assignee.color }}
                                >
                                  {item.assignee.name.charAt(0)}
                                </div>
                                <span className="font-medium">{item.assignee.name}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* コンテンツ表示 - アコーディオン対応 */}
                      <div className="text-sm md:text-base text-gray-600 mb-4">
                        {shouldTruncateContent && !isExpanded ? (
                          <div className="space-y-2">
                            <div className="line-clamp-3">
                              {item.content}
                            </div>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {item.content}
                          </div>
                        )}
                      </div>
                      
                      {/* 読みもっと/畑むボタン */}
                      {shouldTruncateContent && (
                        <button
                          onClick={() => toggleExpanded(item.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4 flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              Close
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              More
                            </>
                          )}
                        </button>
                      )}
                  
                      {/* タグ */}
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
                  
                      {/* メタ情報とアクション */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-xs md:text-sm text-gray-500">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                          <span>投稿者: <span className="font-medium text-gray-900">{item.author}</span></span>
                          <span className="text-gray-400">{new Date(item.createdAt).toLocaleDateString('ja-JP')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* ソースリンクボタン - 改善版UI */}
                          {links.length > 0 && (
                            <div className="flex flex-wrap gap-2">
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
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-full text-xs font-medium transition-all duration-200 border border-blue-200 hover:border-blue-300"
                                    title={`ソース: ${link}`}
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    <span className="max-w-[100px] truncate">{domain}</span>
                                    {links.length > 1 && <span className="text-blue-500">#{index + 1}</span>}
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
                            className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">{item.likes}</span>
                          </button>
                          
                          <button className="text-gray-500 hover:text-blue-600 transition-colors p-1 rounded">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && filteredKnowledge.length === 0 && (
          <div className="text-center py-12">
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