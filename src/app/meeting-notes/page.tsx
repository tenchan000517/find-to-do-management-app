"use client";
import { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { MarkdownContent } from '@/components/MarkdownContent';
import { AIJsonParser } from '@/lib/utils/ai-json-parser';

interface MeetingNote {
  id: string;
  title: string;
  date: string;
  extractedDate?: string; // タイトルから抽出した日付
  category: 'meeting' | 'information'; // 議事録 or 情報
  participants: string[];
  agenda: string;
  notes: string;
  actionItems: string[];
  status: 'draft' | 'finalized';
  author: string;
  createdAt: string;
  updatedAt: string;
  documentUrl?: string;
  sourceDocumentId?: string;
}

// 日付抽出とカテゴリ分けのヘルパー関数
function extractDateFromTitle(title: string, documentId?: string): { extractedDate: string | null; category: 'meeting' | 'information' } {
  const normalizedTitle = title.toLowerCase();
  
  // タブ番号から年を決定 (tab_1-8: 2024年, tab_9+: 2025年)
  let defaultYear = 2024;
  if (documentId && documentId.includes('_tab_')) {
    const tabNumber = parseInt(documentId.split('_tab_')[1]);
    if (tabNumber >= 9) {
      defaultYear = 2025;
    }
  }
  
  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})/,           // 6/13, 10/20
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // 6/13/2024
    /(\d{4})\/(\d{1,2})\/(\d{1,2})/,  // 2024/6/13
    /(\d{1,2})-(\d{1,2})/,           // 6-13
    /(\d{1,2})\.(\d{1,2})/,          // 6.13
    /(\d{1,2})_(\d{1,2})/,           // 6_13
    /(\d{1,2})月(\d{1,2})日?/,        // 6月13日
    /(\d{1,2})がつ(\d{1,2})にち?/,    // 6がつ13にち
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\-_]*(\d{1,2})/,
    /(\d{1,2})[\s\-_]*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/,
    /(\d{1,2})\D+(\d{1,2})\D+(\d{2,4})/,
    /(\d{2,4})\D+(\d{1,2})\D+(\d{1,2})/
  ];

  const monthMap: {[key: string]: string} = {
    'jan': '01', 'january': '01', 'feb': '02', 'february': '02', 
    'mar': '03', 'march': '03', 'apr': '04', 'april': '04',
    'may': '05', 'jun': '06', 'june': '06', 'jul': '07', 'july': '07',
    'aug': '08', 'august': '08', 'sep': '09', 'september': '09',
    'oct': '10', 'october': '10', 'nov': '11', 'november': '11',
    'dec': '12', 'december': '12'
  };

  for (const pattern of datePatterns) {
    const match = normalizedTitle.match(pattern);
    if (match) {
      let extractedDate = '';
      
      try {
        if (pattern.source.includes('月')) {
          const month = match[1].padStart(2, '0');
          const day = match[2].padStart(2, '0');
          extractedDate = `${defaultYear}-${month}-${day}`;
        } else if (pattern.source.includes('jan|feb')) {
          const monthName = match[1] || match[2];
          const day = match[2] || match[1];
          const monthNum = monthMap[monthName.toLowerCase()];
          if (monthNum) {
            extractedDate = `${defaultYear}-${monthNum}-${day.padStart(2, '0')}`;
          }
        } else if (match[3]) {
          let year = match[3];
          if (year.length === 2) year = '20' + year;
          const month = match[1].padStart(2, '0');
          const day = match[2].padStart(2, '0');
          extractedDate = `${year}-${month}-${day}`;
        } else {
          const month = match[1].padStart(2, '0');
          const day = match[2].padStart(2, '0');
          extractedDate = `${defaultYear}-${month}-${day}`;
        }
        
        const testDate = new Date(extractedDate);
        if (!isNaN(testDate.getTime())) {
          return { extractedDate, category: 'meeting' };
        }
        
      } catch (error) {
        continue;
      }
    }
  }
  
  return { extractedDate: null, category: 'information' };
}

export default function MeetingNotesPage() {
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'finalized'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'meeting' | 'information'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'createdAt'>('date');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [sidebarTab, setSidebarTab] = useState<'category' | 'date' | 'status'>('category');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [selectedNote, setSelectedNote] = useState<MeetingNote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      
      // AI分析データ、Google Docsソースを並行取得
      const [analysisResponse, sourcesResponse] = await Promise.all([
        fetch('/api/ai-content-analysis'),
        fetch('/api/google-docs/sources')
      ]);
      
      if (!analysisResponse.ok || !sourcesResponse.ok) {
        throw new Error('Failed to fetch meeting notes');
      }
      const analysisData = await analysisResponse.json();
      const sourcesData = await sourcesResponse.json();
      
      // Google Docsソースをマップに変換（高速検索用）
      const sourcesMap = new Map(sourcesData.map((source: any) => [source.document_id, source]));
      
      // AI分析データをMeetingNote形式に変換
      const formattedNotes: MeetingNote[] = analysisData.map((analysis: any) => {
        // extracted_tasksからアクションアイテムを抽出（AIJsonParserを使用）
        let actionItems: string[] = [];
        try {
          // 修正: require()ではなくimportしたAIJsonParserを使用
          const tasks = AIJsonParser.parseFromAIResponse(analysis.extracted_tasks || '[]', []);
          actionItems = tasks.map((task: any) => task.title || task.description).slice(0, 5);
        } catch (e) {
          actionItems = [];
        }

        // Google Docsソース情報を取得
        const sourceDoc = sourcesMap.get(analysis.source_document_id) as any;
        const originalTitle = sourceDoc?.title || analysis.title || 'タイトル不明';
        
        // タイトルから日付抽出とカテゴリ分け
        const { extractedDate, category } = extractDateFromTitle(originalTitle, analysis.source_document_id);

        return {
          id: analysis.id,
          title: originalTitle,
          date: new Date(analysis.createdAt).toISOString().split('T')[0],
          extractedDate: extractedDate,
          category: category,
          participants: [], // AI分析からは取得困難
          agenda: analysis.content_section?.substring(0, 200) + (analysis.content_section?.length > 200 ? '...' : '') || '概要なし',
          notes: analysis.summary || analysis.content_section || 'サマリー未生成',
          actionItems: actionItems,
          status: 'finalized' as const,
          author: 'AI分析システム',
          createdAt: analysis.createdAt,
          updatedAt: analysis.updatedAt,
          documentUrl: sourceDoc?.document_url,
          sourceDocumentId: analysis.source_document_id
        };
      });
      
      // AI分析データのみを使用
      const allNotes = formattedNotes;
      
      // 重複除去（同じタイトルと日付の議事録をマージ）
      const uniqueNotes = allNotes.reduce((acc, note) => {
        const key = `${note.title}_${note.date}`;
        if (!acc.has(key)) {
          acc.set(key, note);
        }
        return acc;
      }, new Map());
      
      setNotes(Array.from(uniqueNotes.values()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  const [newNote, setNewNote] = useState<Partial<MeetingNote>>({
    title: '',
    date: '',
    participants: [],
    agenda: '',
    notes: '',
    actionItems: [],
    status: 'draft',
    author: ''
  });

  const openModal = (note?: MeetingNote) => {
    if (note) {
      setSelectedNote(note);
      setNewNote(note);
    } else {
      setSelectedNote(null);
      setNewNote({
        title: '',
        date: '',
        participants: [],
        agenda: '',
        notes: '',
        actionItems: [],
        status: 'draft',
        author: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNote(null);
  };

  const saveNote = async () => {
    if (!newNote.title || !newNote.author) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (!selectedNote) {
        // 新規作成 - AI分析レコードとして作成
        const response = await fetch('/api/ai-content-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_document_id: `manual_${Date.now()}`,
            title: newNote.title,
            summary: newNote.notes,
            extracted_tasks: JSON.stringify(newNote.actionItems?.map(item => ({ title: item })) || []),
            analysis_type: 'COMPREHENSIVE',
            confidence_score: 1.0
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to create note');
        }
        
        // データを再取得
        await fetchNotes();
      } else {
        // 編集 - AI分析レコードを更新
        const response = await fetch(`/api/ai-content-analysis/${selectedNote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newNote.title,
            summary: newNote.notes,
            extracted_tasks: JSON.stringify(newNote.actionItems?.map(item => ({ title: item })) || [])
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to update note');
        }
        
        // データを再取得
        await fetchNotes();
      }
      
      closeModal();
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm('この議事録を削除してもよろしいですか？')) {
      return;
    }
    
    try {
      // AI分析結果を削除
      const response = await fetch(`/api/ai-content-analysis/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('削除に失敗しました');
      }
      
      // ローカル状態から削除
      setNotes(notes.filter(note => note.id !== id));
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('削除に失敗しました');
    }
  };

  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: MeetingNote['status']) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'finalized': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
              onClick={() => setSidebarTab('status')}
              className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                sidebarTab === 'status' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📊 ステータス
            </button>
          </div>
          
          {/* カテゴリタブ */}
          {sidebarTab === 'category' && (
            <div className="space-y-2">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  categoryFilter === 'all' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                すべて ({notes.length})
              </button>
              <button
                onClick={() => setCategoryFilter('meeting')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  categoryFilter === 'meeting' 
                    ? 'bg-orange-100 text-orange-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                📅 議事録 ({notes.filter(n => n.category === 'meeting').length})
              </button>
              <button
                onClick={() => setCategoryFilter('information')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  categoryFilter === 'information' 
                    ? 'bg-teal-100 text-teal-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                📋 情報 ({notes.filter(n => n.category === 'information').length})
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
                const count = notes.filter(item => {
                  const itemDate = new Date(item.date);
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
          
          {/* ステータスタブ */}
          {sidebarTab === 'status' && (
            <div className="space-y-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  statusFilter === 'all' 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                すべて ({notes.length})
              </button>
              <button
                onClick={() => setStatusFilter('finalized')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  statusFilter === 'finalized' 
                    ? 'bg-green-100 text-green-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                ✅ 確定済み ({notes.filter(n => n.status === 'finalized').length})
              </button>
              <button
                onClick={() => setStatusFilter('draft')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  statusFilter === 'draft' 
                    ? 'bg-yellow-100 text-yellow-700 font-medium' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                📝 下書き ({notes.filter(n => n.status === 'draft').length})
              </button>
            </div>
          )}
          
          {/* フィルターリセットボタン */}
          {(statusFilter !== 'all' || categoryFilter !== 'all' || dateFilter) && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setDateFilter('');
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
          {/* モバイル用フィルターボタンと新規作成ボタン */}
          <div className="lg:hidden mb-4 flex justify-between items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors flex-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <span className="font-medium text-gray-700">フィルター</span>
              {(statusFilter !== 'all' || categoryFilter !== 'all' || dateFilter) && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-2 h-2"></span>
              )}
            </button>
            <button 
              onClick={() => openModal()}
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
                  {/* PC：全カテゴリタブ + 新規作成ボタン（完全一行） */}
                  <div className="hidden lg:flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setCategoryFilter('all'); setStatusFilter('all'); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          categoryFilter === 'all' && statusFilter === 'all'
                            ? 'bg-blue-500 text-white shadow-md' 
                            : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                        }`}
                      >
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">総</span>
                        </div>
                        <span>総議事録 ({notes.length})</span>
                      </button>
                      <button
                        onClick={() => setCategoryFilter('meeting')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          categoryFilter === 'meeting' 
                            ? 'bg-orange-500 text-white shadow-md' 
                            : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                        }`}
                      >
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">議</span>
                        </div>
                        <span>議事録 ({notes.filter(n => n.category === 'meeting').length})</span>
                      </button>
                      <button
                        onClick={() => setCategoryFilter('information')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          categoryFilter === 'information' 
                            ? 'bg-teal-500 text-white shadow-md' 
                            : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                        }`}
                      >
                        <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">情</span>
                        </div>
                        <span>情報 ({notes.filter(n => n.category === 'information').length})</span>
                      </button>
                      <button
                        onClick={() => setStatusFilter('finalized')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          statusFilter === 'finalized' 
                            ? 'bg-green-500 text-white shadow-md' 
                            : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                        }`}
                      >
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">確</span>
                        </div>
                        <span>確定済み ({notes.filter(n => n.status === 'finalized').length})</span>
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => openModal()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      新規議事録作成
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
              placeholder="タイトル、内容で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

        {/* ローディング・エラー状態 */}
        {loading && (
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
                  onClick={fetchNotes}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  再試行
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 議事録一覧 */}
        {!loading && !error && (
          <div className="space-y-4 md:space-y-6">
            {notes
              .filter(note => {
                const matchesSearch = searchTerm === '' || 
                  note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  note.notes.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesStatus = statusFilter === 'all' || note.status === statusFilter;
                const matchesCategory = categoryFilter === 'all' || note.category === categoryFilter;
                
                // 日付フィルタのチェック
                let matchesDate = true;
                if (dateFilter) {
                  const noteDate = new Date(note.date);
                  const [year, month] = dateFilter.split('-').map(Number);
                  matchesDate = noteDate.getFullYear() === year && noteDate.getMonth() + 1 === month;
                }
                
                return matchesSearch && matchesStatus && matchesCategory && matchesDate;
              })
              .sort((a, b) => {
                if (sortBy === 'date') {
                  // タブ番号順でソート（降順: 新しい→古い）
                  const getTabNumber = (sourceDocumentId: string | undefined) => {
                    const tabMatch = sourceDocumentId?.match(/_tab_(\d+)$/);
                    const recentMatch = sourceDocumentId?.match(/_recent_(\d+)$/);
                    if (tabMatch) return parseInt(tabMatch[1]);
                    if (recentMatch) return 1000 + parseInt(recentMatch[1]); // recentは最初に
                    return 9999; // その他は最後
                  };
                  const tabA = getTabNumber(a.sourceDocumentId);
                  const tabB = getTabNumber(b.sourceDocumentId);
                  return tabB - tabA; // 降順: 大きい番号→小さい番号
                } else if (sortBy === 'title') {
                  return a.title.localeCompare(b.title);
                } else {
                  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                }
              })
              .map((note) => (
            <div key={note.id} className="bg-white rounded-lg shadow-lg p-4 md:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 break-all">
                        {note.title.length > 80 && note.title.startsWith('http') ? 
                          `${note.title.substring(0, 40)}...${note.title.substring(note.title.length - 20)}` : 
                          note.title
                        }
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(note.status)} flex-shrink-0`}>
                        {note.status === 'draft' ? '下書き' : '確定'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {note.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {note.author}
                    </span>
                    <span className="text-gray-400">{new Date(note.updatedAt).toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2 text-sm md:text-base">参加者</h4>
                <div className="flex flex-wrap gap-2">
                  {note.participants.map((participant, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs md:text-sm">
                      {participant}
                    </span>
                  ))}
                </div>
              </div>

              {/* アコーディオンセクション */}
              <div className="space-y-3">
                {/* 概要・議題セクション */}
                {note.agenda && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleNoteExpansion(`${note.id}_agenda`)}
                      className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                    >
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        概要・議題
                      </h4>
                      <svg 
                        className={`w-5 h-5 transform transition-transform ${expandedNotes.has(`${note.id}_agenda`) ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedNotes.has(`${note.id}_agenda`) && (
                      <div className="p-4 bg-white border-t border-gray-200">
                        <div className="text-gray-700 text-sm md:text-base">
                          <MarkdownContent content={note.agenda} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 議事録内容セクション */}
                {note.notes && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleNoteExpansion(`${note.id}_notes`)}
                      className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                    >
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        議事録内容
                      </h4>
                      <svg 
                        className={`w-5 h-5 transform transition-transform ${expandedNotes.has(`${note.id}_notes`) ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedNotes.has(`${note.id}_notes`) && (
                      <div className="p-4 bg-white border-t border-gray-200">
                        <div className="text-gray-700 text-sm md:text-base">
                          <MarkdownContent content={note.notes} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 参加者セクション */}
              {note.participants.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
                  <button
                    onClick={() => toggleNoteExpansion(`${note.id}_participants`)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                  >
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      参加者 ({note.participants.length}名)
                    </h4>
                    <svg 
                      className={`w-5 h-5 transform transition-transform ${expandedNotes.has(`${note.id}_participants`) ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedNotes.has(`${note.id}_participants`) && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        {note.participants.map((participant, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            {participant}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* アクションアイテムセクション */}
              {note.actionItems.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
                  <button
                    onClick={() => toggleNoteExpansion(`${note.id}_actions`)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-left"
                  >
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      アクションアイテム ({note.actionItems.length}件)
                    </h4>
                    <svg 
                      className={`w-5 h-5 transform transition-transform ${expandedNotes.has(`${note.id}_actions`) ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedNotes.has(`${note.id}_actions`) && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <ul className="space-y-2">
                        {note.actionItems.map((item, index) => (
                          <li key={index} className="flex items-start gap-2 text-gray-700">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                            <MarkdownContent content={item} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {/* ボタン行（最下部） */}
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-4 pt-4 border-t border-gray-200">
                {note.documentUrl && (
                  <a
                    href={note.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-800 rounded text-xs font-medium transition-all duration-200 border border-green-200 hover:border-green-300"
                    title="Google Docsで開く"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>元ファイル</span>
                  </a>
                )}
                <button
                  onClick={() => openModal(note)}
                  className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors border border-blue-200 hover:border-blue-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>編集</span>
                </button>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors border border-red-200 hover:border-red-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>削除</span>
                </button>
              </div>
            </div>
            ))}
          </div>
        )}

        {!loading && !error && notes.filter(note => {
          const matchesSearch = searchTerm === '' || 
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.notes.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesStatus = statusFilter === 'all' || note.status === statusFilter;
          return matchesSearch && matchesStatus;
        }).length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-gray-400 text-lg mb-2">該当する議事録がありません</div>
            <div className="text-gray-500 text-sm">検索条件を変更するか、新しい議事録を作成してみましょう</div>
          </div>
        )}

        {/* モーダル */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
              {/* ローディングオーバーレイ */}
              {isSubmitting && (
                <LoadingSpinner 
                  overlay={true}
                  message="議事録を保存しています..."
                  size="sm"
                />
              )}
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
                {selectedNote ? '議事録編集' : '新規議事録作成'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">タイトル</label>
                  <input
                    type="text"
                    value={newNote.title || ''}
                    onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">日付</label>
                  <input
                    type="date"
                    value={newNote.date || ''}
                    onChange={(e) => setNewNote({...newNote, date: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">参加者（カンマ区切り）</label>
                  <input
                    type="text"
                    value={newNote.participants?.join(', ') || ''}
                    onChange={(e) => setNewNote({...newNote, participants: e.target.value.split(',').map(p => p.trim())})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">議題</label>
                  <textarea
                    value={newNote.agenda || ''}
                    onChange={(e) => setNewNote({...newNote, agenda: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                    placeholder="議題を入力してください。マークダウン対応（**太字**、*斜体*、[link](url)など）"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">議事録内容</label>
                  <textarea
                    value={newNote.notes || ''}
                    onChange={(e) => setNewNote({...newNote, notes: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                    placeholder="議事録の内容を入力してください。マークダウン対応（**太字**、*斜体*、[link](url)など）"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">アクションアイテム（改行区切り）</label>
                  <textarea
                    value={newNote.actionItems?.join('\n') || ''}
                    onChange={(e) => setNewNote({...newNote, actionItems: e.target.value.split('\n').filter(item => item.trim())})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">作成者</label>
                  <input
                    type="text"
                    value={newNote.author || ''}
                    onChange={(e) => setNewNote({...newNote, author: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
                  <select
                    value={newNote.status || 'draft'}
                    onChange={(e) => setNewNote({...newNote, status: e.target.value as MeetingNote['status']})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">下書き</option>
                    <option value="finalized">確定</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-2 md:px-4 py-2 text-gray-600 hover:text-gray-800 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  キャンセル
                </button>
                <button
                  onClick={saveNote}
                  disabled={isSubmitting || !newNote.title || !newNote.author}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 md:px-4 py-2 rounded-lg text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}