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
  onDataRefresh?: () => void;
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
      { id: 'PENDING', title: '未処理', color: 'bg-gray-100', description: '新規受付・未対応' },
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
      { id: 'CONTACT', title: 'コンタクト', color: 'bg-gray-100', description: '初回接触・関心確認' },
      { id: 'MEETING', title: 'ミーティング', color: 'bg-blue-100', description: 'ニーズヒアリング' },
      { id: 'PROPOSAL', title: '提案', color: 'bg-yellow-100', description: '提案・見積段階' },
      { id: 'CONTRACT', title: '契約', color: 'bg-orange-100', description: '契約交渉・調整' },
      { id: 'CLOSED', title: 'クローズ', color: 'bg-green-100', description: '成約・完了' },
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
  appointment: Appointment;
  kanbanType: string;
  onEdit: (appointment: Appointment) => void;
  onComplete: (appointmentId: string) => void;
  onSchedule: (appointmentId: string) => void;
  onContract: (appointmentId: string) => void;
}

function AppointmentCard({ 
  appointment, 
  kanbanType, 
  onEdit, 
  onComplete, 
  onSchedule, 
  onContract 
}: AppointmentCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: appointment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'A': return 'text-red-600 bg-red-50';
      case 'B': return 'text-orange-600 bg-orange-50';
      case 'C': return 'text-blue-600 bg-blue-50';
      case 'D': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusValue = () => {
    switch (kanbanType) {
      case 'processing': return appointment.details?.processingStatus || 'PENDING';
      case 'relationship': return appointment.details?.relationshipStatus || 'FIRST_CONTACT';
      case 'phase': return appointment.details?.phaseStatus || 'CONTACT';
      case 'source': return appointment.details?.sourceType || 'REFERRAL';
      default: return '';
    }
  };

  const showScheduleButton = kanbanType === 'phase' && appointment.details?.phaseStatus === 'MEETING';
  const showContractButton = kanbanType === 'phase' && appointment.details?.phaseStatus === 'CONTRACT';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-2 hover:shadow-md transition-shadow
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      <div className="flex justify-between items-start mb-2" {...listeners} style={{ cursor: 'grab' }}>
        <h4 className="font-medium text-sm text-gray-900 truncate flex-1">
          {appointment.companyName}
        </h4>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(appointment.priority)}`}>
          {appointment.priority}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-1">{appointment.contactName}</p>
      
      {appointment.details && (
        <div className="space-y-1 mb-2">
          {appointment.details.importance && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">重要度:</span>
              <span className="text-gray-700">{appointment.details.importance}/10</span>
            </div>
          )}
          {appointment.details.businessValue && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">価値:</span>
              <span className="text-gray-700">{appointment.details.businessValue}/10</span>
            </div>
          )}
          {appointment.details.contractValue && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">想定金額:</span>
              <span className="text-gray-700">{appointment.details.contractValue}万円</span>
            </div>
          )}
          {appointment.details.closingProbability && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">成約率:</span>
              <span className="text-gray-700">{appointment.details.closingProbability}%</span>
            </div>
          )}
        </div>
      )}
      
      {appointment.scheduledDate && (
        <div className="text-xs text-green-600 mb-1">
          📅 {new Date(appointment.scheduledDate).toLocaleDateString('ja-JP')} {appointment.scheduledTime}
        </div>
      )}
      
      {appointment.notes && (
        <p className="text-xs text-gray-500 truncate mb-2">{appointment.notes}</p>
      )}
      
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">{getStatusValue()}</span>
        <div className="flex space-x-1" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
                e.nativeEvent.stopImmediatePropagation();
              }
              console.log('🎨 カンバン編集ボタンクリック:', appointment);
              console.log('🎨 onEdit関数:', onEdit);
              onEdit(appointment);
              console.log('🎨 onEdit呼び出し完了');
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            style={{ pointerEvents: 'auto' }}
            className="text-blue-600 hover:text-blue-800 text-xs px-1 py-1 rounded bg-white border border-blue-300 shadow-sm"
          >
            編集
          </button>
          {showScheduleButton && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
                  e.nativeEvent.stopImmediatePropagation();
                }
                onSchedule(appointment.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{ pointerEvents: 'auto' }}
              className="text-purple-600 hover:text-purple-800 text-xs px-1 py-1 rounded bg-white border border-purple-300 shadow-sm"
            >
              日程
            </button>
          )}
          {showContractButton && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
                  e.nativeEvent.stopImmediatePropagation();
                }
                onContract(appointment.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              style={{ pointerEvents: 'auto' }}
              className="text-orange-600 hover:text-orange-800 text-xs px-1 py-1 rounded bg-white border border-orange-300 shadow-sm"
            >
              契約
            </button>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
                e.nativeEvent.stopImmediatePropagation();
              }
              onComplete(appointment.id);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
            className="text-green-600 hover:text-green-800 text-xs px-1 py-1 rounded bg-white border border-green-300 shadow-sm"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  );
}

interface DroppableColumnProps {
  column: Column;
  appointments: Appointment[];
  kanbanType: string;
  onEdit: (appointment: Appointment) => void;
  onComplete: (appointmentId: string) => void;
  onSchedule: (appointmentId: string) => void;
  onContract: (appointmentId: string) => void;
}

function DroppableColumn({ 
  column, 
  appointments, 
  kanbanType, 
  onEdit, 
  onComplete, 
  onSchedule, 
  onContract 
}: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex flex-col h-full min-w-[280px]">
      <div className={`${column.color} rounded-t-lg p-3 border-b`}>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <span className="bg-white rounded-full px-2 py-1 text-xs font-medium">
            {appointments.length}
          </span>
        </div>
        {column.description && (
          <p className="text-xs text-gray-600 mt-1">{column.description}</p>
        )}
      </div>
      
      <div
        ref={setNodeRef}
        className="flex-1 p-3 bg-gray-50 rounded-b-lg min-h-[200px] overflow-y-auto"
      >
        <SortableContext items={appointments.map(a => a.id)} strategy={verticalListSortingStrategy}>
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              kanbanType={kanbanType}
              onEdit={onEdit}
              onComplete={onComplete}
              onSchedule={onSchedule}
              onContract={onContract}
            />
          ))}
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
  onDataRefresh,
}: EnhancedAppointmentKanbanProps) {
  const [appointments, setAppointments] = useState<Record<string, Appointment[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);

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
    const newStatus = over.id as string;
    
    // 営業フェーズの契約段階では特別処理
    if (kanbanType === 'phase' && newStatus === 'CONTRACT') {
      onAppointmentContract(appointmentId);
      setActiveAppointment(null);
      return;
    }
    
    try {
      await onAppointmentMove(appointmentId, newStatus, kanbanType);
      onDataRefresh?.();
      await loadKanbanData();
    } catch (error) {
      console.error('Failed to move appointment:', error);
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

  return (
    <div className="h-full">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">{config.title}</h2>
        <p className="text-sm text-gray-600">
          アポイントメントを{kanbanType === 'processing' ? '処理状況' : 
                         kanbanType === 'relationship' ? '関係性' :
                         kanbanType === 'phase' ? '営業フェーズ' : '流入経路'}で管理
        </p>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {config.columns.map((column) => (
            <DroppableColumn
              key={column.id}
              column={column}
              appointments={appointments[column.id] || []}
              kanbanType={kanbanType}
              onEdit={onAppointmentEdit}
              onComplete={handleAppointmentComplete}
              onSchedule={handleAppointmentSchedule}
              onContract={handleAppointmentContract}
            />
          ))}
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
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}