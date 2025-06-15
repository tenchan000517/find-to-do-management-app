"use client";
import { useState } from 'react';
import Link from 'next/link';

interface MeetingNote {
  id: number;
  title: string;
  date: string;
  participants: string[];
  agenda: string;
  notes: string;
  actionItems: string[];
  status: 'draft' | 'finalized';
  author: string;
}

export default function MeetingNotesPage() {
  const [notes, setNotes] = useState<MeetingNote[]>([
    {
      id: 1,
      title: "週次プロジェクト会議",
      date: "2024-01-15",
      participants: ["飯田", "かずま", "田中"],
      agenda: "プロジェクト進捗確認、次週の計画",
      notes: "・ショウジキプロジェクトの進捗が順調\n・大和との話し合いを来週実施\n・カケフとの打ち合わせ日程調整が必要",
      actionItems: ["大和との打ち合わせ日程調整", "カケフへの提案書作成"],
      status: 'finalized',
      author: "飯田"
    },
    {
      id: 2,
      title: "高校ワークショップ企画会議",
      date: "2024-01-12",
      participants: ["飯田", "田中", "佐藤"],
      agenda: "高校生向けワークショップの企画・準備",
      notes: "・ワークショップの内容について議論\n・必要な資料の準備\n・参加者募集の方法について検討",
      actionItems: ["ワークショップ資料作成", "参加者募集開始"],
      status: 'draft',
      author: "田中"
    }
  ]);

  const [selectedNote, setSelectedNote] = useState<MeetingNote | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const saveNote = () => {
    if (selectedNote) {
      // 編集の場合
      setNotes(notes.map(note => 
        note.id === selectedNote.id ? {...newNote as MeetingNote, id: selectedNote.id} : note
      ));
    } else {
      // 新規作成の場合
      const id = Math.max(...notes.map(n => n.id)) + 1;
      setNotes([...notes, {...newNote as MeetingNote, id}]);
    }
    closeModal();
  };

  const deleteNote = (id: number) => {
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 md:mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm md:text-base">
              ← ホーム
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">議事録</h1>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base"
          >
            新規議事録作成
          </button>
        </div>

        {/* 議事録一覧 */}
        <div className="grid gap-4 md:gap-6">
          {notes.map((note) => (
            <div key={note.id} className="bg-white rounded-lg shadow-lg p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-4">
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">{note.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
                    <span>📅 {note.date}</span>
                    <span>👤 {note.author}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(note.status)}`}>
                      {note.status === 'draft' ? '下書き' : '確定'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => openModal(note)}
                    className="text-blue-600 hover:text-blue-800 text-xs md:text-sm font-medium"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-red-600 hover:text-red-800 text-xs md:text-sm font-medium"
                  >
                    削除
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

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2 text-sm md:text-base">議題</h4>
                <p className="text-gray-700 text-sm md:text-base">{note.agenda}</p>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2 text-sm md:text-base">内容</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <pre className="whitespace-pre-wrap text-xs md:text-sm text-gray-700">{note.notes}</pre>
                </div>
              </div>

              {note.actionItems.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 text-sm md:text-base">アクションアイテム</h4>
                  <ul className="list-disc list-inside text-gray-700 text-sm md:text-base">
                    {note.actionItems.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* モーダル */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  className="px-2 md:px-4 py-2 text-gray-600 hover:text-gray-800 text-sm md:text-base"
                >
                  キャンセル
                </button>
                <button
                  onClick={saveNote}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 md:px-4 py-2 rounded-lg text-sm md:text-base"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}