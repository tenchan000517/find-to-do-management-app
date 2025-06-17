"use client";

import { useState } from 'react';
import { useAppointments } from '@/hooks/useAppointments';
import { useUsers } from '@/hooks/useUsers';
import { Appointment } from '@/lib/types';
import FullPageLoading from '@/components/FullPageLoading';
import LoadingSpinner from '@/components/LoadingSpinner';
import EnhancedAppointmentKanban from '@/components/appointments/EnhancedAppointmentKanban';
import AppointmentFlowModal from '@/components/appointments/AppointmentFlowModal';
import ContractProcessingForm from '@/components/appointments/ContractProcessingForm';
import AppointmentCompletionForm from '@/components/appointments/AppointmentCompletionForm';


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
  const { appointments, loading, addAppointment, updateAppointment, deleteAppointment, reload: refetchAppointments } = useAppointments();
  const { users, loading: usersLoading } = useUsers();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [kanbanType, setKanbanType] = useState<'processing' | 'relationship' | 'phase' | 'source'>('processing');
  const [filter, setFilter] = useState<'all' | 'pending' | 'contacted' | 'interested' | 'not_interested' | 'scheduled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New modal states for Phase 4
  const [appointmentModal, setAppointmentModal] = useState<{
    isOpen: boolean;
    type: 'schedule' | 'complete' | 'contract';
    appointment: Appointment | null;
  }>({
    isOpen: false,
    type: 'schedule',
    appointment: null
  });
  
  const [contractForm, setContractForm] = useState<{
    isOpen: boolean;
    appointment: Appointment | null;
  }>({
    isOpen: false,
    appointment: null
  });
  
  const [completionForm, setCompletionForm] = useState<{
    isOpen: boolean;
    appointment: Appointment | null;
  }>({
    isOpen: false,
    appointment: null
  });

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
    const assigneeId = formData.get('assigneeId') as string;
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
      assignedToId: assigneeId, // Legacy field for backward compatibility
      assignedTo: assigneeId, // New assignee system
    };

    try {
      setIsSubmitting(true);
      if (editingAppointment) {
        await updateAppointment(editingAppointment.id, appointmentData);
      } else {
        await addAppointment(appointmentData);
      }

      // データ再読み込み
      await refetchAppointments();
      
      setShowModal(false);
      setEditingAppointment(null);
    } catch (error) {
      console.error('Failed to save appointment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppointmentMove = async (appointmentId: string, newStatus: string, kanbanType: string) => {
    try {
      // Sales phase automation logic
      if (kanbanType === 'phase') {
        const salesPhaseFlow = {
          CONTACT: { next: 'MEETING', autoActions: ['createCalendarEvent'] },
          MEETING: { next: 'PROPOSAL', autoActions: ['generateMeetingNote'] },
          PROPOSAL: { next: 'CONTRACT', autoActions: ['createProposal'] },
          CONTRACT: { next: 'CLOSED', autoActions: ['generateBackofficeTasks'] }
        };

        // Contract phase requires special handling
        if (newStatus === 'CONTRACT') {
          const appointment = appointments.find(a => a.id === appointmentId);
          if (appointment) {
            setContractForm({
              isOpen: true,
              appointment
            });
            return;
          }
        }
      }

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

      await refetchAppointments();
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
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment) {
      setCompletionForm({
        isOpen: true,
        appointment
      });
    }
  };

  const handleAppointmentSchedule = async (appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment) {
      setAppointmentModal({
        isOpen: true,
        type: 'schedule',
        appointment
      });
    }
  };

  const handleAppointmentContract = async (appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (appointment) {
      setContractForm({
        isOpen: true,
        appointment
      });
    }
  };

  // Modal submit handlers
  const handleFlowModalSubmit = async (data: any) => {
    try {
      const { appointment, type } = appointmentModal;
      if (!appointment) return;

      let endpoint = '';
      switch (type) {
        case 'schedule':
          endpoint = `/api/appointments/${appointment.id}/schedule`;
          break;
        case 'complete':
          endpoint = `/api/appointments/${appointment.id}/complete`;
          break;
        case 'contract':
          endpoint = `/api/appointments/${appointment.id}/contract`;
          break;
      }

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      await refetchAppointments();
      setAppointmentModal({ isOpen: false, type: 'schedule', appointment: null });
    } catch (error) {
      console.error('Failed to submit appointment flow:', error);
    }
  };

  const handleContractFormSubmit = async (contractData: any) => {
    try {
      if (!contractForm.appointment) return;

      await fetch(`/api/appointments/${contractForm.appointment.id}/contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData)
      });

      await refetchAppointments();
      setContractForm({ isOpen: false, appointment: null });
      alert('契約処理が完了しました！プロジェクトとタスクが自動生成されました。');
    } catch (error) {
      console.error('Failed to process contract:', error);
    }
  };

  const handleCompletionFormSubmit = async (completionData: any) => {
    try {
      if (!completionForm.appointment) return;

      await fetch(`/api/appointments/${completionForm.appointment.id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completionData)
      });

      await refetchAppointments();
      setCompletionForm({ isOpen: false, appointment: null });
      alert('アポイントメントが完了しました！');
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

  if (loading || usersLoading) {
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
                    営業担当者
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const assignee = appointment.assignee || users.find(u => u.id === (appointment.assignedTo || appointment.assignedToId));
                        if (assignee) {
                          return (
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                                style={{ backgroundColor: assignee.color }}
                              >
                                {assignee.name.charAt(0)}
                              </div>
                              <span className="text-sm font-medium">{assignee.name}</span>
                            </div>
                          );
                        } else {
                          return <span className="text-xs text-gray-500">未設定</span>;
                        }
                      })()}
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
            <EnhancedAppointmentKanban
              kanbanType={kanbanType}
              onAppointmentMove={handleAppointmentMove}
              onAppointmentEdit={handleAppointmentEdit}
              onAppointmentComplete={handleAppointmentComplete}
              onAppointmentSchedule={handleAppointmentSchedule}
              onAppointmentContract={handleAppointmentContract}
              onDataRefresh={refetchAppointments}
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
              {isSubmitting && (
                <LoadingSpinner size="sm" message="保存中..." className="mb-4" />
              )}
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
                      営業担当者
                    </label>
                    <select
                      name="assigneeId"
                      defaultValue={editingAppointment?.assignedTo || editingAppointment?.assignedToId || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">担当者を選択してください</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
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
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md font-medium text-sm md:text-base"
                  >
                    {isSubmitting ? '保存中...' : (editingAppointment ? '更新' : '作成')}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setShowModal(false);
                      setEditingAppointment(null);
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-700 py-2 px-4 rounded-md font-medium text-sm md:text-base"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Phase 4 New Modals */}
        <AppointmentFlowModal
          isOpen={appointmentModal.isOpen}
          type={appointmentModal.type}
          appointment={appointmentModal.appointment}
          onClose={() => setAppointmentModal({ isOpen: false, type: 'schedule', appointment: null })}
          onSubmit={handleFlowModalSubmit}
        />

        {contractForm.isOpen && contractForm.appointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-6xl max-h-[95vh] overflow-y-auto">
              <ContractProcessingForm
                appointment={contractForm.appointment}
                onSubmit={handleContractFormSubmit}
                onCancel={() => setContractForm({ isOpen: false, appointment: null })}
              />
            </div>
          </div>
        )}

        {completionForm.isOpen && completionForm.appointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-6xl max-h-[95vh] overflow-y-auto">
              <AppointmentCompletionForm
                appointment={completionForm.appointment}
                onSubmit={handleCompletionFormSubmit}
                onCancel={() => setCompletionForm({ isOpen: false, appointment: null })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}