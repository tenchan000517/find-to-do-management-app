"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';

interface MeetingNote {
  id: string;
  title: string;
  date: string;
  participants: string[];
  agenda: string;
  notes: string;
  actionItems: string[];
  status: 'draft' | 'finalized';
  author: string;
  createdAt: string;
  updatedAt: string;
}

export default function MeetingNotesPage() {
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'finalized'>('all');

  const [selectedNote, setSelectedNote] = useState<MeetingNote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-content-analysis');
      if (!response.ok) {
        throw new Error('Failed to fetch meeting notes');
      }
      const data = await response.json();
      
      // AI分析データをMeetingNote形式に変換
      const formattedNotes: MeetingNote[] = data.map((analysis: any) => {
        // extracted_tasksからアクションアイテムを抽出（AIJsonParserを使用）
        let actionItems: string[] = [];
        try {
          const { AIJsonParser } = require('@/lib/utils/ai-json-parser');
          const tasks = AIJsonParser.parseFromAIResponse(analysis.extracted_tasks || '[]', []);
          actionItems = tasks.map((task: any) => task.title || task.description).slice(0, 5);
        } catch (e) {
          actionItems = [];
        }

        return {
          id: analysis.id,
          title: analysis.source_document_id.split('_tab_')[0] + ` (タブ${analysis.source_document_id.split('_tab_')[1] || '1'})`,
          date: new Date(analysis.createdAt).toISOString().split('T')[0],
          participants: [], // AI分析からは取得困難
          agenda: analysis.content_section.substring(0, 200) + (analysis.content_section.length > 200 ? '...' : ''),
          notes: analysis.content_section,
          actionItems: actionItems,
          status: 'finalized' as const,
          author: 'AI分析システム',
          createdAt: analysis.createdAt,
          updatedAt: analysis.updatedAt
        };
      });
      
      setNotes(formattedNotes);
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
      // 新規作成のみ対応（編集は一旦無効化）
      if (!selectedNote) {
        const newId = Date.now().toString();
        const note: MeetingNote = {
          ...newNote as MeetingNote,
          id: newId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setNotes([...notes, note]);
      }
      
      closeModal();
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const getStatusColor = (status: MeetingNote['status']) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'finalized': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー行 - 統計情報と新規作成ボタン */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 md:mb-8 gap-4">
          {/* 統計情報 */}
          {!loading && !error && (
            <div className="flex flex-wrap gap-3">
              <div className="bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">総</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">総議事録</div>
                  <div className="text-lg font-bold text-gray-900">{notes.length}</div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">確</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">確定済み</div>
                  <div className="text-lg font-bold text-gray-900">
                    {notes.filter(n => n.status === 'finalized').length}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">下</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">下書き</div>
                  <div className="text-lg font-bold text-gray-900">
                    {notes.filter(n => n.status === 'draft').length}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規議事録作成
          </button>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="タイトル、内容で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  statusFilter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => setStatusFilter('finalized')}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  statusFilter === 'finalized' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                確定済み
              </button>
              <button
                onClick={() => setStatusFilter('draft')}
                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                  statusFilter === 'draft' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                下書き
              </button>
            </div>
          </div>
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
                return matchesSearch && matchesStatus;
              })
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((note) => (
            <div key={note.id} className="bg-white rounded-lg shadow-lg p-4 md:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 line-clamp-2">{note.title}</h3>
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
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => openModal(note)}
                    className="text-blue-600 hover:text-blue-800 text-xs md:text-sm font-medium transition-colors p-1 rounded hover:bg-blue-50"
                    disabled
                    title="編集機能は準備中です"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-red-600 hover:text-red-800 text-xs md:text-sm font-medium transition-colors p-1 rounded hover:bg-red-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
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

              {note.agenda && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm md:text-base flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    概要・議題
                  </h4>
                  <p className="text-gray-700 text-sm md:text-base bg-gray-50 p-3 rounded-lg">{note.agenda}</p>
                </div>
              )}

              {note.notes && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm md:text-base flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    詳細内容
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <pre className="whitespace-pre-wrap text-xs md:text-sm text-gray-700 font-sans">{note.notes}</pre>
                  </div>
                </div>
              )}

              {note.participants.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm md:text-base flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    参加者
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {note.participants.map((participant, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs md:text-sm">
                        {participant}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {note.actionItems.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 text-sm md:text-base flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    アクションアイテム
                  </h4>
                  <ul className="space-y-1">
                    {note.actionItems.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-700 text-sm md:text-base">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">議事録内容</label>
                  <textarea
                    value={newNote.notes || ''}
                    onChange={(e) => setNewNote({...newNote, notes: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                    placeholder="議事録の内容を入力してください..."
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
  );
}