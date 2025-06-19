"use client";

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  Appointment, 
  ProcessingStatus, 
  RelationshipStatus, 
  SalesPhase, 
  SourceType 
} from '@/lib/types';

interface EnhancedAppointmentKanbanProps {
  kanbanType: 'processing' | 'relationship' | 'phase' | 'source';
  onAppointmentMove: (appointmentId: string, newStatus: string, kanbanType: string) => void;
  onAppointmentEdit: (appointment: Appointment) => void;
  onAppointmentComplete: (appointmentId: string) => void;
  onAppointmentSchedule: (appointmentId: string) => void;
  onAppointmentContract: (appointmentId: string) => void;
  onAppointmentDelete?: (appointmentId: string) => void;
  onDataRefresh?: () => void;
  sortBy?: 'priority' | 'phase' | 'date';
  sortOrder?: 'asc' | 'desc';
}

interface Column {
  id: string;
  title: string;
  color: string;
  description?: string;
}

const KANBAN_CONFIGS = {
  processing: {
    title: 'アポ処理状況管理',
    columns: [
      { id: 'PENDING', title: '調整中', color: 'bg-gray-100', description: '新規受付・日程調整中' },
      { id: 'IN_PROGRESS', title: '進行中', color: 'bg-blue-100', description: '対応中・調整中' },
      { id: 'COMPLETED', title: '完了', color: 'bg-green-100', description: 'アポ実施完了' },
      { id: 'FOLLOW_UP', title: 'フォローアップ', color: 'bg-yellow-100', description: '追加対応必要' },
      { id: 'CLOSED', title: 'クローズ', color: 'bg-red-100', description: '終了・保留' },
    ] as Column[]
  },
  relationship: {
    title: '関係性ステージ管理',
    columns: [
      { id: 'FIRST_CONTACT', title: '初回接触', color: 'bg-gray-100', description: 'ファーストコンタクト' },
      { id: 'RAPPORT_BUILDING', title: '関係構築', color: 'bg-blue-100', description: '信頼関係醸成' },
      { id: 'TRUST_ESTABLISHED', title: '信頼確立', color: 'bg-green-100', description: '相互信頼構築' },
      { id: 'STRATEGIC_PARTNER', title: '戦略パートナー', color: 'bg-purple-100', description: '戦略的関係' },
      { id: 'LONG_TERM_CLIENT', title: '長期顧客', color: 'bg-yellow-100', description: '継続的関係' },
    ] as Column[]
  },
  phase: {
    title: '営業フェーズ管理',
    columns: [
      { id: 'LEAD', title: 'リード', color: 'bg-gray-100', description: '見込み客・初期接触' },
      { id: 'PROSPECT', title: '見込み客', color: 'bg-blue-100', description: 'ニーズ確認段階' },
      { id: 'PROPOSAL', title: '提案', color: 'bg-yellow-100', description: '提案・見積段階' },
      { id: 'NEGOTIATION', title: '交渉', color: 'bg-orange-100', description: '契約交渉・調整' },
      { id: 'CLOSING', title: 'クロージング', color: 'bg-purple-100', description: '成約間近' },
      { id: 'POST_SALE', title: 'アフターセール', color: 'bg-green-100', description: '成約後フォロー' },
    ] as Column[]
  },
  source: {
    title: '流入経路管理',
    columns: [
      { id: 'REFERRAL', title: '紹介', color: 'bg-green-100', description: '既存顧客紹介' },
      { id: 'COLD_OUTREACH', title: 'アウトバウンド', color: 'bg-blue-100', description: '新規開拓' },
      { id: 'NETWORKING_EVENT', title: 'イベント', color: 'bg-purple-100', description: 'ネットワーキング' },
      { id: 'INBOUND_INQUIRY', title: 'インバウンド', color: 'bg-yellow-100', description: '問い合わせ' },
      { id: 'SOCIAL_MEDIA', title: 'SNS', color: 'bg-pink-100', description: 'ソーシャルメディア' },
      { id: 'EXISTING_CLIENT', title: '既存顧客', color: 'bg-orange-100', description: '既存客からの展開' },
      { id: 'PARTNER_REFERRAL', title: 'パートナー', color: 'bg-indigo-100', description: 'パートナー紹介' },
    ] as Column[]
  }
};

interface AppointmentCardProps {
  appointment: Appointment & { isLoading?: boolean; isSuccess?: boolean };
  kanbanType: string;
  onEdit: (appointment: Appointment) => void;
  onComplete: (appointmentId: string) => void;
  onSchedule: (appointmentId: string) => void;
  onContract: (appointmentId: string) => void;
  onDelete?: (appointmentId: string) => void;
}

function AppointmentCard({ 
  appointment, 
  kanbanType, 
  onEdit, 
  onComplete, 
  onSchedule, 
  onContract,
  onDelete 
}: AppointmentCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: appointment.id,
    disabled: appointment.isLoading // ローディング中はドラッグ無効
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'A': return 'bg-red-100 text-red-800 border-red-200';
      case 'B': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'D': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusValue = () => {
    switch (kanbanType) {
      case 'processing': return appointment.details?.processingStatus || 'PENDING';
      case 'relationship': return appointment.details?.relationshipStatus || 'FIRST_CONTACT';
      case 'phase': return appointment.details?.phaseStatus || 'LEAD';
      case 'source': return appointment.details?.sourceType || 'REFERRAL';
      default: return '';
    }
  };

  const showScheduleButton = kanbanType === 'phase' && appointment.details?.phaseStatus === 'PROSPECT';
  const showContractButton = kanbanType === 'phase' && appointment.details?.phaseStatus === 'NEGOTIATION';

  const getDueDateDisplay = (scheduledDate?: string, scheduledTime?: string) => {
    if (!scheduledDate) return null;
    
    const date = new Date(scheduledDate);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let className = 'text-xs px-2 py-1 rounded ';
    let label = '';
    
    if (diffDays < 0) {
      className += 'bg-red-100 text-red-800';
      label = `${Math.abs(diffDays)}日遅れ`;
    } else if (diffDays === 0) {
      className += 'bg-orange-100 text-orange-800';
      label = '今日';
    } else if (diffDays <= 3) {
      className += 'bg-yellow-100 text-yellow-800';
      label = `${diffDays}日後`;
    } else {
      className += 'bg-gray-100 text-gray-600';
      label = date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
    }
    
    if (scheduledTime) {
      label += ` ${scheduledTime}`;
    }
    
    return <span className={className}>{label}</span>;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      data-item-id={appointment.id}
      className={`kanban-item-card group bg-white border rounded-lg p-2 shadow-sm hover:shadow-md transition-all relative ${
        isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
      } ${
        appointment.isSuccess ? 'border-green-400 bg-green-50' : 'border-gray-200'
      } ${
        appointment.isLoading ? 'opacity-75' : ''
      }`}
    >
      {/* ローディングオーバーレイ */}
      {appointment.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 rounded-lg z-10">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">更新中...</span>
          </div>
        </div>
      )}

      {/* 成功フィードバック */}
      {appointment.isSuccess && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>更新完了</span>
        </div>
      )}
      <div 
        className={appointment.isLoading ? "cursor-not-allowed" : "cursor-grab"}
        {...(appointment.isLoading ? {} : listeners)}
      >
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs px-1.5 py-0.5 rounded border ${getPriorityColor(appointment.priority)}`}>
            優先度{appointment.priority}
          </span>
          {appointment.calendar_events?.[0]?.date && getDueDateDisplay(appointment.calendar_events[0].date, appointment.calendar_events[0].time)}
        </div>
        
        <h4 className="font-medium text-gray-900 mb-1 text-sm break-words overflow-hidden">
          📝 {appointment.nextAction || '次のアクション未設定'}
        </h4>
        
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">🏢 {appointment.companyName}</span>
            <span>👤 {appointment.contactName}</span>
          </div>
          
          {appointment.phone && (
            <div>📞 {appointment.phone}</div>
          )}
          
          {appointment.details && (
            <div className="grid grid-cols-2 gap-x-4 mt-1">
              {appointment.details.importance && (
                <div className="flex justify-between">
                  <span className="text-gray-500">重要度:</span>
                  <span className="text-gray-700">{appointment.details.importance}/10</span>
                </div>
              )}
              {appointment.details.businessValue && (
                <div className="flex justify-between">
                  <span className="text-gray-500">価値:</span>
                  <span className="text-gray-700">{appointment.details.businessValue}/10</span>
                </div>
              )}
              {appointment.details.contractValue && (
                <div className="flex justify-between">
                  <span className="text-gray-500">想定金額:</span>
                  <span className="text-gray-700">{appointment.details.contractValue}万円</span>
                </div>
              )}
              {appointment.details.closingProbability && (
                <div className="flex justify-between">
                  <span className="text-gray-500">成約率:</span>
                  <span className="text-gray-700">{appointment.details.closingProbability}%</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 最新カレンダーイベント情報表示 */}
        {appointment.calendar_events?.[0] && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-2">
            <div className="flex items-center space-x-1">
              <span>📅</span>
              <span className="font-medium">
                {appointment.calendar_events[0].date} {appointment.calendar_events[0].time}
              </span>
            </div>
            {appointment.calendar_events[0].location && (
              <div className="flex items-center space-x-1 mt-1">
                <span>📍</span>
                <span>{appointment.calendar_events[0].location}</span>
              </div>
            )}
            {appointment.calendar_events[0].description && (
              <div className="flex items-center space-x-1 mt-1">
                <span>💭</span>
                <span className="truncate">{appointment.calendar_events[0].description}</span>
              </div>
            )}
          </div>
        )}
        
        {appointment.notes && (
          <p className="text-xs text-gray-500 truncate mt-1">{appointment.notes}</p>
        )}
      </div>
      
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-gray-400">{getStatusValue()}</span>
        {!appointment.isLoading && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🎨 カンバン編集ボタンクリック:', appointment);
              onEdit(appointment);
            }}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded z-20 relative"
            title="編集"
          >
            ✏️
          </button>
          {showScheduleButton && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSchedule(appointment.id);
              }}
              className="p-1 text-purple-600 hover:bg-purple-50 rounded z-20 relative"
              title="日程設定"
            >
              📅
            </button>
          )}
          {showContractButton && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onContract(appointment.id);
              }}
              className="p-1 text-orange-600 hover:bg-orange-50 rounded z-20 relative"
              title="契約"
            >
              📄
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(appointment.id);
              }}
              className="p-1 text-red-600 hover:bg-red-50 rounded z-20 relative"
              title="削除"
            >
              <Trash2 size={14} />
            </button>
          )}
          </div>
        )}
      </div>
    </div>
  );
}

interface DroppableColumnProps {
  column: Column;
  appointments: Appointment[];
  groupedAppointments: { key: string; appointments: any[] }[];
  kanbanType: string;
  sortBy?: string;
  onEdit: (appointment: Appointment) => void;
  onComplete: (appointmentId: string) => void;
  onSchedule: (appointmentId: string) => void;
  onContract: (appointmentId: string) => void;
  onDelete?: (appointmentId: string) => void;
}

function DroppableColumn({ 
  column, 
  appointments, 
  groupedAppointments,
  kanbanType, 
  sortBy,
  onEdit, 
  onComplete, 
  onSchedule, 
  onContract,
  onDelete 
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'kanban-column',
      columnId: column.id,
      accepts: ['kanban-item']
    }
  });

  // 点線ドロップゾーン専用
  const { setNodeRef: setDropZoneRef, isOver: isDropZoneOver } = useDroppable({
    id: `${column.id}-dropzone`,
    data: {
      type: 'kanban-column',
      columnId: column.id,
      accepts: ['kanban-item']
    }
  });

  return (
    <div 
      ref={setNodeRef}
      className={`kanban-column flex-1 min-w-[240px] max-w-[300px] transition-all duration-200 ${
        isOver ? 'ring-2 ring-blue-400' : ''
      }`}
      style={{
        backgroundColor: isOver ? 'rgba(59, 130, 246, 0.05)' : '#f9fafb'
      }}
    >
      {/* カラムヘッダー */}
      <div className={`${column.color} p-4 border-b border-gray-200`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{column.title}</h3>
          <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
            {appointments.length}
          </span>
        </div>
        {column.description && (
          <div className="text-xs text-gray-600 mt-2">{column.description}</div>
        )}
      </div>

      {/* カラムコンテンツ */}
      <div className="column-content p-1 min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto">
        <SortableContext 
          items={appointments.map(a => a.id)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {groupedAppointments.map((group, groupIndex) => (
              <div key={`${group.key}-${groupIndex}`}>
                {/* グループヘッダー */}
                <div className="mb-2 p-2 bg-gray-50 rounded text-sm font-medium text-gray-700 border-l-4 border-blue-400">
                  {group.key}
                </div>
                
                {/* グループ内のアポイントメント */}
                <div className="space-y-2">
                  {group.appointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      kanbanType={kanbanType}
                      onEdit={onEdit}
                      onComplete={onComplete}
                      onSchedule={onSchedule}
                      onContract={onContract}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* ドロップゾーン（常に表示） */}
          <div 
            ref={setDropZoneRef}
            className={`mt-4 min-h-[120px] border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-200 ${
              isDropZoneOver 
                ? 'border-blue-500 bg-blue-100 scale-105 shadow-lg' 
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-center text-gray-400">
              <div className="text-2xl mb-2">⬇️</div>
              <div className="text-sm">
                {appointments.length === 0 ? 'アイテムなし' : 'ここにドロップ'}
              </div>
              <div className="text-xs mt-1 text-gray-300">
                ドラッグ＆ドロップでステータス変更
              </div>
            </div>
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export default function EnhancedAppointmentKanban({
  kanbanType,
  onAppointmentMove,
  onAppointmentEdit,
  onAppointmentComplete,
  onAppointmentSchedule,
  onAppointmentContract,
  onAppointmentDelete,
  onDataRefresh,
  sortBy = 'date',
  sortOrder = 'desc',
}: EnhancedAppointmentKanbanProps) {
  const [appointments, setAppointments] = useState<Record<string, Appointment[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [successItems, setSuccessItems] = useState<Set<string>>(new Set());

  const config = KANBAN_CONFIGS[kanbanType];
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    loadKanbanData();
  }, [kanbanType]);

  const loadKanbanData = async () => {
    try {
      setLoading(true);
      console.log('🔄 カンバンデータ読み込み開始:', kanbanType);
      const response = await fetch(`/api/appointments/kanban/${kanbanType}`);
      console.log('🔄 カンバンAPI レスポンス:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('🔄 取得したカンバンデータ:', data);
        setAppointments(data);
      }
    } catch (error) {
      console.error('🔄 カンバンデータ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const appointment = Object.values(appointments)
      .flat()
      .find(a => a.id === active.id);
    setActiveAppointment(appointment || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveAppointment(null);
      return;
    }

    const appointmentId = active.id as string;
    let targetColumnId = over.id as string;
    
    // ドロップゾーンの場合、カラムIDを取得
    if (targetColumnId.endsWith('-dropzone')) {
      targetColumnId = targetColumnId.replace('-dropzone', '');
    }
    
    // 営業フェーズの契約段階では特別処理
    if (kanbanType === 'phase' && targetColumnId === 'CONTRACT') {
      onAppointmentContract(appointmentId);
      setActiveAppointment(null);
      return;
    }
    
    try {
      // ローディング開始
      setLoadingItems(prev => new Set(prev).add(appointmentId));
      
      await onAppointmentMove(appointmentId, targetColumnId, kanbanType);
      
      // 成功フィードバック
      setSuccessItems(prev => new Set(prev).add(appointmentId));
      
      // ドロップ完了の成功アニメーション
      const targetElement = document.querySelector(`[data-item-id="${appointmentId}"]`);
      if (targetElement) {
        targetElement.classList.add('drop-success-animation');
        setTimeout(() => {
          targetElement.classList.remove('drop-success-animation');
        }, 600);
      }
      
      // 1.5秒後に成功表示をクリア
      setTimeout(() => {
        setSuccessItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(appointmentId);
          return newSet;
        });
      }, 1500);
      
      onDataRefresh?.();
      await loadKanbanData();
    } catch (error) {
      console.error('Failed to move appointment:', error);
    } finally {
      // ローディング終了
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
    setActiveAppointment(null);
  };

  if (loading) {
    return (
      <LoadingSpinner size="md" message="カンバンデータを読み込み中..." />
    );
  }

  const handleAppointmentComplete = async (appointmentId: string) => {
    try {
      await onAppointmentComplete(appointmentId);
      onDataRefresh?.();
      await loadKanbanData();
    } catch (error) {
      console.error('Failed to complete appointment:', error);
    }
  };

  const handleAppointmentSchedule = async (appointmentId: string) => {
    try {
      await onAppointmentSchedule(appointmentId);
      onDataRefresh?.();
      await loadKanbanData();
    } catch (error) {
      console.error('Failed to schedule appointment:', error);
    }
  };

  const handleAppointmentContract = async (appointmentId: string) => {
    try {
      await onAppointmentContract(appointmentId);
      onDataRefresh?.();
      await loadKanbanData();
    } catch (error) {
      console.error('Failed to process contract:', error);
    }
  };

  const handleAppointmentDelete = async (appointmentId: string) => {
    if (onAppointmentDelete) {
      try {
        await onAppointmentDelete(appointmentId);
        toast.success('アポイントメントを削除しました');
        // ローカル状態からも削除
        setAppointments(prev => {
          const newAppointments = { ...prev };
          Object.keys(newAppointments).forEach(key => {
            newAppointments[key] = newAppointments[key].filter(apt => apt.id !== appointmentId);
          });
          return newAppointments;
        });
        onDataRefresh?.();
      } catch (error) {
        console.error('削除エラー:', error);
        toast.error('削除に失敗しました');
      }
    }
  };

  // グループ化関数
  const groupAppointmentsBySort = (appointmentsList: any[], sortBy: string, sortOrder: string) => {
    if (sortBy === 'date') {
      const grouped: { [key: string]: any[] } = {};
      appointmentsList.forEach(apt => {
        const date = apt.scheduledDate || apt.lastContact || apt.createdAt;
        const dateKey = date ? new Date(date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }) : '日付未設定';
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(apt);
      });
      
      // ソート順に応じて日付キーをソート
      const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (a === '日付未設定') return 1;
        if (b === '日付未設定') return -1;
        const dateA = new Date(a + '/2024');
        const dateB = new Date(b + '/2024');
        return sortOrder === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
      });
      
      return sortedKeys.map(key => ({ key, appointments: grouped[key] }));
    } else if (sortBy === 'priority') {
      const grouped: { [key: string]: any[] } = {};
      appointmentsList.forEach(apt => {
        const priority = apt.priority || 'D';
        if (!grouped[priority]) grouped[priority] = [];
        grouped[priority].push(apt);
      });
      
      const priorityOrder = sortOrder === 'desc' ? ['A', 'B', 'C', 'D'] : ['D', 'C', 'B', 'A'];
      return priorityOrder.filter(key => grouped[key]).map(key => ({ key: `優先度${key}`, appointments: grouped[key] }));
    } else if (sortBy === 'phase') {
      const grouped: { [key: string]: any[] } = {};
      appointmentsList.forEach(apt => {
        const phase = apt.details?.phaseStatus || apt.status || 'CONTACT';
        if (!grouped[phase]) grouped[phase] = [];
        grouped[phase].push(apt);
      });
      
      const phaseOrder = ['CONTACT', 'MEETING', 'PROPOSAL', 'CONTRACT', 'CLOSED'];
      const orderedPhases = sortOrder === 'desc' ? [...phaseOrder].reverse() : phaseOrder;
      return orderedPhases.filter(key => grouped[key]).map(key => ({ key, appointments: grouped[key] }));
    }
    
    return [{ key: 'すべて', appointments: appointmentsList }];
  };

  return (
    <div className="h-full">
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-2 overflow-x-auto pb-4">
          <button className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600">
            ◀
          </button>
          {config.columns.map((column) => {
            // ローディング・成功状態を各アポイントメントに追加
            const appointmentsWithState = (appointments[column.id] || []).map(appointment => ({
              ...appointment,
              isLoading: loadingItems.has(appointment.id),
              isSuccess: successItems.has(appointment.id)
            }));
            
            // グループ化処理
            const groupedAppointments = groupAppointmentsBySort(appointmentsWithState, sortBy, sortOrder);
            
            return (
              <DroppableColumn
                key={column.id}
                column={column}
                appointments={appointmentsWithState}
                groupedAppointments={groupedAppointments}
                kanbanType={kanbanType}
                sortBy={sortBy}
                onEdit={onAppointmentEdit}
                onComplete={handleAppointmentComplete}
                onSchedule={handleAppointmentSchedule}
                onContract={handleAppointmentContract}
                onDelete={handleAppointmentDelete}
              />
            );
          })}
          <button className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600">
            ▶
          </button>
        </div>
        
        <DragOverlay>
          {activeAppointment ? (
            <AppointmentCard
              appointment={activeAppointment}
              kanbanType={kanbanType}
              onEdit={onAppointmentEdit}
              onComplete={onAppointmentComplete}
              onSchedule={onAppointmentSchedule}
              onContract={onAppointmentContract}
              onDelete={handleAppointmentDelete}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}