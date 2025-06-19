"use client";

import { useState, useEffect } from 'react';
import { useAppointments } from '@/hooks/useAppointments';
import { useUsers } from '@/hooks/useUsers';
import { Appointment, SalesPhase, RelationshipStatus, SourceType } from '@/lib/types';
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
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [kanbanType, setKanbanType] = useState<'processing' | 'relationship' | 'phase' | 'source'>('processing');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'phase' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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

  // デバッグ用: 状態変更を監視
  useEffect(() => {
    console.log('🎯 モーダル状態変更:', { showModal, editingAppointment: editingAppointment?.id || null });
  }, [showModal, editingAppointment]);

  const filteredAppointments = appointments.filter(appointment => {
    const matchesFilter = filter === 'all' || appointment.status === filter;
    const matchesSearch = searchTerm === '' || 
      appointment.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUser = userFilter === 'all' || appointment.assignedToId === userFilter;
    
    return matchesFilter && matchesSearch && matchesUser;
  });

  // ソート処理
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 1;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 1;
      return sortOrder === 'desc' ? bPriority - aPriority : aPriority - bPriority;
    } else if (sortBy === 'phase') {
      const phaseOrder = { 'pending': 1, 'contacted': 2, 'interested': 3, 'scheduled': 4, 'not_interested': 5 };
      const aPhase = phaseOrder[a.status as keyof typeof phaseOrder] || 1;
      const bPhase = phaseOrder[b.status as keyof typeof phaseOrder] || 1;
      return sortOrder === 'desc' ? bPhase - aPhase : aPhase - bPhase;
    } else if (sortBy === 'date') {
      const aDate = new Date(a.lastContact || a.createdAt || 0);
      const bDate = new Date(b.lastContact || b.createdAt || 0);
      return sortOrder === 'desc' ? bDate.getTime() - aDate.getTime() : aDate.getTime() - bDate.getTime();
    }
    return 0;
  });

  // サマリー統計
  const appointmentsSummary = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    contacted: appointments.filter(a => a.status === 'contacted').length,
    interested: appointments.filter(a => a.status === 'interested').length,
    scheduled: appointments.filter(a => a.status === 'scheduled').length
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('💾 フォーム送信開始');
    console.log('💾 編集中のアポイントメント:', editingAppointment);
    
    const formData = new FormData(e.currentTarget);
    const assigneeId = formData.get('assigneeId') as string;
    
    // アポイントメントデータ
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
      meetingUrl: formData.get('meetingUrl') as string || undefined,
      informationUrl: formData.get('informationUrl') as string || undefined,
      assignedToId: assigneeId, // Legacy field for backward compatibility
      assignedTo: assigneeId, // New assignee system
      details: {
        phaseStatus: (formData.get('phaseStatus') as string || 'CONTACT') as SalesPhase,
        relationshipStatus: (formData.get('relationshipStatus') as string || 'FIRST_CONTACT') as RelationshipStatus,
        sourceType: (formData.get('sourceType') as string || 'REFERRAL') as SourceType,
      }
    };

    // タスクデータ（入力されている場合のみ）
    const taskTitle = formData.get('taskTitle') as string;
    const taskData = taskTitle ? {
      title: taskTitle,
      description: formData.get('taskDescription') as string || '',
      dueDate: formData.get('taskDueDate') ? new Date(formData.get('taskDueDate') as string).toISOString() : undefined,
      status: 'TODO' as const,
      priority: 'MEDIUM' as const,
      assignedTo: assigneeId,
    } : null;

    // カレンダーイベントデータ（入力されている場合のみ）
    const eventDateTime = formData.get('eventDateTime') as string;
    const eventData = eventDateTime ? {
      title: `${appointmentData.companyName} - ${appointmentData.nextAction}`,
      startDate: new Date(eventDateTime).toISOString(),
      endDate: formData.get('eventEndDateTime') ? new Date(formData.get('eventEndDateTime') as string).toISOString() : new Date(new Date(eventDateTime).getTime() + 60 * 60 * 1000).toISOString(), // デフォルト1時間後
      type: 'meeting' as const,
      description: appointmentData.notes || '',
      location: formData.get('eventLocation') as string || undefined,
      meetingUrl: appointmentData.meetingUrl || undefined,
      participants: formData.get('eventParticipants') ? (formData.get('eventParticipants') as string).split(',').map(p => p.trim()) : [],
      createdBy: assigneeId,
      assignedTo: assigneeId,
    } : null;

    console.log('💾 送信データ:', { appointmentData, taskData, eventData });

    try {
      setIsSubmitting(true);
      let appointmentId: string;

      // アポイントメントの作成/更新
      if (editingAppointment) {
        console.log('💾 アポイントメント更新処理:', editingAppointment.id);
        await updateAppointment(editingAppointment.id, appointmentData);
        appointmentId = editingAppointment.id;
      } else {
        console.log('💾 新規アポイントメント作成処理');
        const result = await addAppointment(appointmentData);
        appointmentId = result.id || 'temp-id';
      }

      // タスク作成（入力されている場合のみ）
      if (taskData) {
        console.log('💾 関連タスク作成処理');
        try {
          const taskWithRelation = {
            ...taskData,
            description: `${taskData.description}\n\n関連アポイントメント: ${appointmentData.companyName} - ${appointmentData.contactName}`,
          };
          
          const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskWithRelation),
          });
          
          if (!response.ok) {
            console.warn('⚠️ タスク作成に失敗しましたが、アポイントメントは正常に保存されました');
          } else {
            console.log('✅ 関連タスクを作成しました');
          }
        } catch (taskError) {
          console.warn('⚠️ タスク作成エラー:', taskError);
        }
      }

      // カレンダーイベント作成（入力されている場合のみ）
      if (eventData) {
        console.log('💾 カレンダーイベント作成処理');
        try {
          const response = await fetch('/api/calendar/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
          });
          
          if (!response.ok) {
            console.warn('⚠️ カレンダーイベント作成に失敗しましたが、アポイントメントは正常に保存されました');
          } else {
            console.log('✅ カレンダーイベントを作成しました');
          }
        } catch (eventError) {
          console.warn('⚠️ カレンダーイベント作成エラー:', eventError);
        }
      }

      // データ再読み込み
      console.log('💾 データ再読み込み開始');
      await refetchAppointments();
      
      console.log('💾 モーダル閉じる処理');
      setShowModal(false);
      setEditingAppointment(null);
      console.log('💾 フォーム送信完了');

      // 成功通知
      if (taskData && eventData) {
        alert('アポイントメント、タスク、カレンダーイベントを作成しました！');
      } else if (taskData) {
        alert('アポイントメントとタスクを作成しました！');
      } else if (eventData) {
        alert('アポイントメントとカレンダーイベントを作成しました！');
      } else {
        alert('アポイントメントを保存しました！');
      }
      
    } catch (error) {
      console.error('💾 アポイントメント保存エラー:', error);
      alert('保存中にエラーが発生しました。もう一度お試しください。');
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
    console.log('🎯 カンバン編集ハンドラー呼び出し:', appointment);
    console.log('🎯 編集前の状態:', { editingAppointment, showModal });
    
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
      assignedToId: appointment.assignedToId || appointment.assignedTo || 'user1',
      assignedTo: appointment.assignedTo || appointment.assignedToId || 'user1', // 互換性のため両方設定
      createdAt: appointment.createdAt || new Date().toISOString(),
      updatedAt: appointment.updatedAt || new Date().toISOString()
    };
    
    console.log('🎯 マッピング後のアポイントメント:', mappedAppointment);
    setEditingAppointment(mappedAppointment);
    setShowModal(true);
    console.log('🎯 カンバン編集状態設定完了');
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

  const handleAppointmentDelete = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete appointment');
      }

      await refetchAppointments();
    } catch (error) {
      console.error('Failed to delete appointment:', error);
      throw error;
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

        {/* タブ・フィルター・サマリー（一行） */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* タブ */}
            <div className="flex gap-2 flex-wrap">
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
              {viewMode === 'kanban' && (
                <>
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
                </>
              )}
            </div>

            {/* フィルター・ソート */}
            <div className="flex gap-2 flex-wrap items-center">
              {/* ユーザー別フィルター */}
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">全ユーザー</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>

              {/* 優先度ソート */}
              <button
                onClick={() => {
                  setSortBy('priority');
                  setSortOrder(sortBy === 'priority' && sortOrder === 'desc' ? 'asc' : 'desc');
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  sortBy === 'priority' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                優先度 {sortBy === 'priority' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
              </button>

              {/* フェーズソート */}
              <button
                onClick={() => {
                  setSortBy('phase');
                  setSortOrder(sortBy === 'phase' && sortOrder === 'desc' ? 'asc' : 'desc');
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  sortBy === 'phase' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                フェーズ {sortBy === 'phase' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
              </button>

              {/* 日付ソート */}
              <button
                onClick={() => {
                  setSortBy('date');
                  setSortOrder(sortBy === 'date' && sortOrder === 'desc' ? 'asc' : 'desc');
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  sortBy === 'date' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                日付 {sortBy === 'date' ? (sortOrder === 'desc' ? '↓' : '↑') : ''}
              </button>
            </div>

            {/* サマリー（リスト表示時は左寄せ、カンバン表示時は中央） */}
            <div className={`flex gap-4 flex-wrap ${viewMode === 'list' ? 'justify-start' : ''}`}>
              <div className="text-sm">
                <span className="font-medium text-gray-900">総件数:</span>
                <span className="ml-1 text-gray-700">{appointmentsSummary.total}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-600">未接触:</span>
                <span className="ml-1 text-gray-600">{appointmentsSummary.pending}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-blue-600">連絡済み:</span>
                <span className="ml-1 text-blue-600">{appointmentsSummary.contacted}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-green-600">興味あり:</span>
                <span className="ml-1 text-green-600">{appointmentsSummary.interested}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-purple-600">アポ確定:</span>
                <span className="ml-1 text-purple-600">{appointmentsSummary.scheduled}</span>
              </div>
            </div>
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
                {sortedAppointments.map((appointment) => (
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
                          console.log('📝 編集ボタンクリック:', appointment);
                          console.log('📝 編集前の状態:', { editingAppointment, showModal });
                          setEditingAppointment(appointment);
                          setShowModal(true);
                          console.log('📝 編集後の状態設定完了');
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
          <div className="bg-white rounded-lg shadow-lg p-1">
            <EnhancedAppointmentKanban
              kanbanType={kanbanType}
              onAppointmentMove={handleAppointmentMove}
              onAppointmentEdit={handleAppointmentEdit}
              onAppointmentComplete={handleAppointmentComplete}
              onAppointmentSchedule={handleAppointmentSchedule}
              onAppointmentContract={handleAppointmentContract}
              onAppointmentDelete={handleAppointmentDelete}
              onDataRefresh={refetchAppointments}
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
          </div>
        )}

        {/* モーダル */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-700/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg md:text-xl font-bold mb-4">
                {editingAppointment ? 'アポ情報編集' : '新規アポ'}
              </h2>
              {/* デバッグ情報 */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
                  <p>🐛 デバッグ: showModal={String(showModal)}</p>
                  <p>🐛 editingAppointment: {editingAppointment ? `ID: ${editingAppointment.id}` : 'null'}</p>
                </div>
              )}
              {isSubmitting && (
                <LoadingSpinner size="sm" message="保存中..." className="mb-4" />
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* アクション・メモセクション */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">アクション・メモ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="mt-4">
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
                </div>

                {/* カレンダーイベント情報セクション */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">カレンダーイベント</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        イベント日時
                      </label>
                      <input
                        type="datetime-local"
                        name="eventDateTime"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        終了時間
                      </label>
                      <input
                        type="datetime-local"
                        name="eventEndDateTime"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        場所
                      </label>
                      <input
                        type="text"
                        name="eventLocation"
                        placeholder="会議室、住所など"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        参加者（カンマ区切り）
                      </label>
                      <input
                        type="text"
                        name="eventParticipants"
                        placeholder="田中,佐藤,山田"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* ミーティング情報セクション */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3 border-b pb-2">ミーティング情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        オンラインミーティングURL
                      </label>
                      <input
                        type="url"
                        name="meetingUrl"
                        defaultValue={editingAppointment?.meetingUrl || ''}
                        placeholder="https://zoom.us/j/... または https://meet.google.com/..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        関連情報・場所
                      </label>
                      <input
                        type="text"
                        name="informationUrl"
                        defaultValue={editingAppointment?.informationUrl || ''}
                        placeholder="資料リンク、会社HP、オフライン会議場所など"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* 簡易タスク追加セクション */}
                <details className="border border-gray-200 rounded-lg">
                  <summary className="cursor-pointer bg-gray-50 px-4 py-3 text-lg font-medium text-gray-900 hover:bg-gray-100">
                    ⚡ 簡易タスク追加
                  </summary>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          タスクタイトル
                        </label>
                        <input
                          type="text"
                          name="taskTitle"
                          placeholder="例: 提案資料作成"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          期限
                        </label>
                        <input
                          type="date"
                          name="taskDueDate"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        タスク概要
                      </label>
                      <textarea
                        name="taskDescription"
                        rows={2}
                        placeholder="タスクの詳細説明（任意）"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </details>

                {/* 基本情報セクション */}
                <details className="border border-gray-200 rounded-lg">
                  <summary className="cursor-pointer bg-gray-50 px-4 py-3 text-lg font-medium text-gray-900 hover:bg-gray-100">
                    📝 基本情報
                  </summary>
                  <div className="p-4">
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
                          インフォメーション
                        </label>
                        <input
                          type="text"
                          name="informationUrl"
                          defaultValue={editingAppointment?.informationUrl || ''}
                          placeholder="会社HP、資料リンクなど"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </details>

                {/* ステータス・分類セクション */}
                <details className="border border-gray-200 rounded-lg">
                  <summary className="cursor-pointer bg-gray-50 px-4 py-3 text-lg font-medium text-gray-900 hover:bg-gray-100">
                    🏷️ ステータス・分類
                  </summary>
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          フェーズ
                        </label>
                        <select
                          name="phaseStatus"
                          defaultValue={editingAppointment?.details?.phaseStatus || 'CONTACT'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="CONTACT">コンタクト</option>
                          <option value="MEETING">ミーティング</option>
                          <option value="PROPOSAL">提案</option>
                          <option value="CONTRACT">契約</option>
                          <option value="CLOSED">クローズ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          関係性
                        </label>
                        <select
                          name="relationshipStatus"
                          defaultValue={editingAppointment?.details?.relationshipStatus || 'FIRST_CONTACT'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="FIRST_CONTACT">初回接触</option>
                          <option value="RAPPORT_BUILDING">関係構築中</option>
                          <option value="TRUST_ESTABLISHED">信頼関係確立</option>
                          <option value="STRATEGIC_PARTNER">戦略的パートナー</option>
                          <option value="LONG_TERM_CLIENT">長期クライアント</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          流入経路
                        </label>
                        <select
                          name="sourceType"
                          defaultValue={editingAppointment?.details?.sourceType || 'REFERRAL'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="REFERRAL">紹介</option>
                          <option value="COLD_OUTREACH">コールドリーチ</option>
                          <option value="NETWORKING_EVENT">ネットワーキングイベント</option>
                          <option value="INBOUND_INQUIRY">インバウンド問い合わせ</option>
                          <option value="SOCIAL_MEDIA">ソーシャルメディア</option>
                          <option value="EXISTING_CLIENT">既存クライアント</option>
                          <option value="PARTNER_REFERRAL">パートナー紹介</option>
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
                    </div>
                  </div>
                </details>
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