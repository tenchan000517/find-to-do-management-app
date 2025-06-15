"use client";

import { useState } from 'react';
import { useAppointments } from '@/hooks/useAppointments';
import { Appointment } from '@/lib/types';
import FullPageLoading from '@/components/FullPageLoading';
import AppointmentKanbanBoard from '@/components/AppointmentKanbanBoard';


const getStatusStyle = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-gray-100 text-gray-800';
    case 'contacted':
      return 'bg-blue-100 text-blue-800';
    case 'interested':
      return 'bg-green-100 text-green-800';
    case 'not_interested':
      return 'bg-red-100 text-red-800';
    case 'scheduled':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '未接触';
    case 'contacted':
      return '連絡済み';
    case 'interested':
      return '興味あり';
    case 'not_interested':
      return '興味なし';
    case 'scheduled':
      return 'アポ確定';
    default:
      return '不明';
  }
};

const getPriorityStyle = (priority: string) => {
  switch (priority) {
    case 'A':
      return 'bg-red-100 text-red-800';
    case 'B':
      return 'bg-yellow-100 text-yellow-800';
    case 'C':
      return 'bg-orange-100 text-orange-800';
    case 'D':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function AppointmentsPage() {
  const { appointments, loading, addAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [kanbanType, setKanbanType] = useState<'processing' | 'relationship' | 'phase' | 'source'>('processing');
  const [filter, setFilter] = useState<'all' | 'pending' | 'contacted' | 'interested' | 'not_interested' | 'scheduled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const filteredAppointments = appointments.filter(appointment => {
    const matchesFilter = filter === 'all' || appointment.status === filter;
    const matchesSearch = searchTerm === '' || 
      appointment.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const appointmentData = {
      companyName: formData.get('companyName') as string,
      contactName: formData.get('contactName') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      status: formData.get('status') as Appointment['status'],
      lastContact: formData.get('lastContact') ? new Date(formData.get('lastContact') as string).toISOString() : undefined,
      nextAction: formData.get('nextAction') as string,
      notes: formData.get('notes') as string,
      priority: formData.get('priority') as Appointment['priority'],
      assignedToId: 'user1', // 仮のユーザーID（後でログイン機能実装時に修正）
    };

    try {
      if (editingAppointment) {
        await updateAppointment(editingAppointment.id, appointmentData);
      } else {
        await addAppointment(appointmentData);
      }

      setShowModal(false);
      setEditingAppointment(null);
    } catch (error) {
      console.error('Failed to save appointment:', error);
    }
  };

  const handleAppointmentMove = async (appointmentId: string, newStatus: string) => {
    try {
      // Update appointment details via API
      await fetch(`/api/appointments/${appointmentId}/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [kanbanType === 'processing' ? 'processingStatus' : 
           kanbanType === 'relationship' ? 'relationshipStatus' :
           kanbanType === 'phase' ? 'phaseStatus' : 'sourceType']: newStatus
        })
      });
    } catch (error) {
      console.error('Failed to move appointment:', error);
    }
  };

  const handleAppointmentEdit = (appointment: any) => {
    // Convert kanban appointment to appointment format
    const mappedAppointment: Appointment = {
      id: appointment.id,
      companyName: appointment.companyName,
      contactName: appointment.contactName,
      phone: appointment.phone,
      email: appointment.email,
      status: appointment.status,
      priority: appointment.priority,
      notes: appointment.notes,
      nextAction: appointment.nextAction || '',
      lastContact: appointment.lastContact,
      assignedToId: appointment.assignedToId || 'user1',
      createdAt: appointment.createdAt || new Date().toISOString(),
      updatedAt: appointment.updatedAt || new Date().toISOString()
    };
    setEditingAppointment(mappedAppointment);
    setShowModal(true);
  };

  const handleAppointmentComplete = async (appointmentId: string) => {
    try {
      const result = await fetch(`/api/appointments/${appointmentId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome: 'アポイントメント完了',
          createConnection: true,
          connectionData: {}
        })
      });
      
      if (result.ok) {
        alert('アポイントメントが完了しました');
      }
    } catch (error) {
      console.error('Failed to complete appointment:', error);
    }
  };

  const statusCounts = {
    all: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    contacted: appointments.filter(a => a.status === 'contacted').length,
    interested: appointments.filter(a => a.status === 'interested').length,
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    not_interested: appointments.filter(a => a.status === 'not_interested').length,
  };

  if (loading) {
    return <FullPageLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="mx-auto px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 md:mb-8 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">アポイント</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base"
            >
              新規追加
            </button>
          </div>
        </div>

        {/* ビューモード切り替え */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                リスト表示
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'kanban' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                カンバン表示
              </button>
            </div>
            
            {viewMode === 'kanban' && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setKanbanType('processing')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    kanbanType === 'processing' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  処理状況
                </button>
                <button
                  onClick={() => setKanbanType('relationship')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    kanbanType === 'relationship' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  関係性
                </button>
                <button
                  onClick={() => setKanbanType('phase')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    kanbanType === 'phase' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  営業フェーズ
                </button>
                <button
                  onClick={() => setKanbanType('source')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    kanbanType === 'source' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  流入経路
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-3 md:p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-gray-900">{statusCounts.all}</div>
            <div className="text-xs md:text-sm text-gray-500">総件数</div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 md:p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-gray-600">{statusCounts.pending}</div>
            <div className="text-xs md:text-sm text-gray-500">未接触</div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 md:p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-blue-600">{statusCounts.contacted}</div>
            <div className="text-xs md:text-sm text-gray-500">連絡済み</div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 md:p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-green-600">{statusCounts.interested}</div>
            <div className="text-xs md:text-sm text-gray-500">興味あり</div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 md:p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-purple-600">{statusCounts.scheduled}</div>
            <div className="text-xs md:text-sm text-gray-500">アポ確定</div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 md:p-4 text-center">
            <div className="text-xl md:text-2xl font-bold text-red-600">{statusCounts.not_interested}</div>
            <div className="text-xs md:text-sm text-gray-500">興味なし</div>
          </div>
        </div>

        {/* 検索・フィルター（リストビューのみ） */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="会社名、担当者名、メールアドレスで検索..."
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
                  onClick={() => setFilter('pending')}
                  className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                    filter === 'pending' 
                      ? 'bg-gray-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  未接触
                </button>
                <button
                  onClick={() => setFilter('interested')}
                  className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                    filter === 'interested' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  興味あり
                </button>
                <button
                  onClick={() => setFilter('scheduled')}
                  className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                    filter === 'scheduled' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  アポ確定
                </button>
              </div>
            </div>
          </div>
        )}

        {/* メインコンテンツ */}
        {viewMode === 'list' ? (
          /* アポリスト */
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    会社名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    担当者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    連絡先
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    優先度
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最終連絡
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    次のアクション
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メモ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{appointment.companyName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{appointment.contactName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{appointment.phone}</div>
                      <div className="text-sm text-gray-500">{appointment.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityStyle(appointment.priority)}`}>
                        {appointment.priority === 'A' ? '最優先' : appointment.priority === 'B' ? '重要' : appointment.priority === 'C' ? '緊急' : '要検討'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {appointment.lastContact || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={appointment.nextAction}>
                        {appointment.nextAction}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={appointment.notes}>
                        {appointment.notes}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingAppointment(appointment);
                          setShowModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-2 text-xs md:text-sm"
                      >
                        編集
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('このアポ情報を削除しますか？')) {
                            try {
                              await deleteAppointment(appointment.id);
                            } catch (error) {
                              console.error('Failed to delete appointment:', error);
                            }
                          }
                        }}
                        className="text-red-600 hover:text-red-900 text-xs md:text-sm"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredAppointments.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">該当するアポ情報がありません</div>
            </div>
          )}
          </div>
        ) : (
          /* カンバンビュー */
          <div className="bg-white rounded-lg shadow-lg p-4">
            <AppointmentKanbanBoard
              kanbanType={kanbanType}
              onAppointmentMove={handleAppointmentMove}
              onAppointmentEdit={handleAppointmentEdit}
              onAppointmentComplete={handleAppointmentComplete}
            />
          </div>
        )}

        {/* モーダル */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg md:text-xl font-bold mb-4">
                {editingAppointment ? 'アポ情報編集' : '新規アポ'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      会社名
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      defaultValue={editingAppointment?.companyName || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      担当者名
                    </label>
                    <input
                      type="text"
                      name="contactName"
                      defaultValue={editingAppointment?.contactName || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      電話番号
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={editingAppointment?.phone || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={editingAppointment?.email || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ステータス
                    </label>
                    <select
                      name="status"
                      defaultValue={editingAppointment?.status || 'pending'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pending">未接触</option>
                      <option value="contacted">連絡済み</option>
                      <option value="interested">興味あり</option>
                      <option value="not_interested">興味なし</option>
                      <option value="scheduled">アポ確定</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      優先度
                    </label>
                    <select
                      name="priority"
                      defaultValue={editingAppointment?.priority || 'C'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="A">最優先</option>
                      <option value="B">重要</option>
                      <option value="C">緊急</option>
                      <option value="D">要検討</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      最終連絡日
                    </label>
                    <input
                      type="date"
                      name="lastContact"
                      defaultValue={editingAppointment?.lastContact ? new Date(editingAppointment.lastContact).toISOString().split('T')[0] : ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      次のアクション
                    </label>
                    <input
                      type="text"
                      name="nextAction"
                      defaultValue={editingAppointment?.nextAction || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メモ
                  </label>
                  <textarea
                    name="notes"
                    defaultValue={editingAppointment?.notes || ''}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium text-sm md:text-base"
                  >
                    {editingAppointment ? '更新' : '作成'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingAppointment(null);
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md font-medium text-sm md:text-base"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}