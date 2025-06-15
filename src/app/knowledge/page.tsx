"use client";

import { useState } from 'react';
import Link from 'next/link';

interface KnowledgeItem {
  id: number;
  title: string;
  category: 'industry' | 'sales' | 'technical' | 'business';
  content: string;
  author: string;
  createdAt: string;
  tags: string[];
  likes: number;
}

const mockKnowledge: KnowledgeItem[] = [
  {
    id: 1,
    title: "SaaS業界の最新動向とマーケット分析",
    category: 'industry',
    content: "2025年のSaaS業界は特にAI統合と自動化に注力している。顧客企業は効率化を求めており、プロジェクト管理ツールにもAI機能の統合が期待されている...",
    author: "田中太郎",
    createdAt: "2025-01-10",
    tags: ["SaaS", "市場分析", "AI", "トレンド"],
    likes: 8
  },
  {
    id: 2,
    title: "効果的な営業トークのフレームワーク",
    category: 'sales',
    content: "BANT（Budget, Authority, Need, Timeline）フレームワークを活用した営業アプローチが効果的。特にFIND to DOのようなプロジェクト管理ツールでは...",
    author: "佐藤花子",
    createdAt: "2025-01-08",
    tags: ["営業", "BANT", "フレームワーク", "顧客開拓"],
    likes: 12
  },
  {
    id: 3,
    title: "プロジェクト管理における専門用語集",
    category: 'technical',
    content: "アジャイル開発、スクラム、スプリント、バックログ、ベロシティなど、プロジェクト管理で使われる重要な専門用語とその意味について解説...",
    author: "山田次郎",
    createdAt: "2025-01-05",
    tags: ["専門用語", "アジャイル", "スクラム", "プロジェクト管理"],
    likes: 15
  },
  {
    id: 4,
    title: "スタートアップの資金調達戦略",
    category: 'business',
    content: "シード、シリーズA、シリーズBなど各段階での資金調達のポイント。投資家との交渉における重要な指標とピッチデッキの作成方法...",
    author: "鈴木一郎",
    createdAt: "2025-01-03",
    tags: ["資金調達", "投資", "ピッチ", "スタートアップ"],
    likes: 20
  }
];

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
  const [knowledge] = useState<KnowledgeItem[]>(mockKnowledge);
  const [filter, setFilter] = useState<'all' | 'industry' | 'sales' | 'technical' | 'business'>('all');
  const [searchTerm, setSearchTerm] = useState('');

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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 md:mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm md:text-base">
              ← ホーム
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ナレッジ</h1>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-2 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base">
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

        {/* ナレッジリスト */}
        <div className="space-y-6">
          {sortedKnowledge.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-lg p-4 md:p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900">{item.title}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryStyle(item.category)}`}>
                      {getCategoryText(item.category)}
                    </span>
                  </div>
                  <p className="text-sm md:text-base text-gray-600 mb-4 line-clamp-3">{item.content}</p>
                  
                  {/* タグ */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs md:text-sm font-medium bg-gray-100 text-gray-800">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* メタ情報 */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-xs md:text-sm text-gray-500">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <span>投稿者: <span className="font-medium text-gray-900">{item.author}</span></span>
                      <span>{item.createdAt}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <span>{item.likes}</span>
                      </button>
                      <button className="text-gray-500 hover:text-blue-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredKnowledge.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">該当するナレッジがありません</div>
          </div>
        )}

        {/* 統計情報 */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">総</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-xs md:text-sm font-medium text-gray-500">総投稿数</div>
                <div className="text-xl md:text-2xl font-bold text-gray-900">{knowledge.length}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">営</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-xs md:text-sm font-medium text-gray-500">営業・マーケ</div>
                <div className="text-xl md:text-2xl font-bold text-gray-900">
                  {knowledge.filter(k => k.category === 'sales').length}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">技</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-xs md:text-sm font-medium text-gray-500">技術・専門用語</div>
                <div className="text-xl md:text-2xl font-bold text-gray-900">
                  {knowledge.filter(k => k.category === 'technical').length}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">産</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-xs md:text-sm font-medium text-gray-500">業界知識</div>
                <div className="text-xl md:text-2xl font-bold text-gray-900">
                  {knowledge.filter(k => k.category === 'industry').length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}