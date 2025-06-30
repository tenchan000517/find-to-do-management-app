# 🎨 カレンダー・タスク・アポイント・プロジェクトページ UI改善完全実装計画書

**作成日**: 2025-06-17  
**対象**: カレンダー、タスク、アポイント、プロジェクトページのUI/UX統一改善 + アポイントメント日程管理フロー  
**期間**: 4週間（Phase別実装）  
**目的**: 統一されたカード移動UI・+カード追加ボタン・マイクロアニメーション・アポイント日程管理フロー実装

---

## 📊 現状分析サマリー（詳細）

### **アポイントメント現状分析**
- **カンバンタブ**: 4種類（processing・relationship・phase・source）
- **カンバン列構成**:
  - **processing**: PENDING → IN_PROGRESS → COMPLETED → FOLLOW_UP → CLOSED
  - **relationship**: FIRST_CONTACT → RAPPORT_BUILDING → TRUST_ESTABLISHED → STRATEGIC_PARTNER → LONG_TERM_CLIENT
  - **phase**: LEAD → PROSPECT → PROPOSAL → NEGOTIATION → CLOSING → POST_SALE
  - **source**: REFERRAL, COLD_OUTREACH, NETWORKING_EVENT, INBOUND_INQUIRY, SNS, EXISTING_CLIENT, PARTNER_REFERRAL
- **データ構造**: Appointment型（id, companyName, contactName, status, details.processingStatus etc.）
- **問題**: calendar_eventsとの紐付けなし → カレンダー表示不可

### **技術実装現状**
- **ドラッグ&ドロップ**: `@dnd-kit/core`使用（AppointmentKanbanBoard.tsx）
- **API**: `/api/appointments/kanban/{type}` でタブ別データ取得
- **カード移動**: `onAppointmentMove(appointmentId, newStatus)` → `/api/appointments/{id}/details`更新

---

## 🎯 改善目標と新機能要件

### **1. 従来のUI改善目標**
- **統一されたカード移動UI**: 全カンバンで同一の操作感
- **+カード追加ボタン**: 各カンバン列の最後尾に配置
- **マイクロアニメーション**: ユーザー体験向上

### **2. 🟡 NEW: アポイントメント日程管理フロー改善**

#### **2.1 問題定義**
- **calendar_events未連携**: アポイントがカレンダーに表示されない
- **日程管理煩雑**: 実施日入力・次回アポ設定が手動
- **ステータス連動なし**: アポ進捗とコネクション状態が非同期

#### **2.2 要件仕様**
```typescript
// アポイントメント日程管理フロー仕様
interface AppointmentSchedulingFlow {
  // 1. 「待機」→「進行中」移動時
  pendingToInProgress: {
    trigger: 'カンバンドラッグ&ドロップ';
    action: '実施日入力を促すトースト/モーダル表示';
    required: '日時・場所入力';
    result: 'calendar_events作成 + processing: IN_PROGRESS更新';
  };
  
  // 2. 「完了」移動時  
  moveToCompleted: {
    trigger: 'カンバンドラッグ&ドロップ';
    action: '次回アポ確認モーダル表示';
    options: [
      '次回なし → 待機リストor削除選択',
      '次回あり → 日付設定して進行中へ自動移動'
    ];
    result: 'コネクションステータス自動更新（初回接触→関係構築中等）';
  };
  
  // 3. 裏側連動処理
  automaticUpdates: {
    connectionStatus: '初回接触 → 関係構築中 → 信頼確立 等';
    calendarIntegration: 'アポ実施日をcalendar_eventsに自動登録';
    followUpReminder: '次回アポ予定日の3日前に通知';
  };
}
```

---

## 🛠️ Phase別実装計画（4週間）

### **Phase 1: 共通UIコンポーネント基盤構築（1週間）**

#### **1.1 統一カンバンカードコンポーネント**
```typescript
// src/components/ui/UniversalKanbanCard.tsx
interface UniversalKanbanCardProps<T> {
  item: T;
  type: 'task' | 'appointment' | 'project' | 'calendar';
  onEdit: (item: T) => void;
  onDelete?: (id: string) => void;
  onComplete?: (id: string) => void;
  customActions?: React.ReactNode;
  draggable?: boolean;
  // NEW: アポイント日程管理用
  onSchedule?: (id: string, dateTime: string, location?: string) => void;
  onReschedule?: (id: string) => void;
}

// アポイント専用カード表示
const AppointmentCardContent = ({ appointment }: { appointment: Appointment }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-start">
      <h4 className="font-medium text-sm text-gray-900 truncate">
        {appointment.companyName}
      </h4>
      <PriorityBadge priority={appointment.priority} />
    </div>
    
    <p className="text-sm text-gray-600">{appointment.contactName}</p>
    
    {/* NEW: スケジュール状態表示 */}
    <ScheduleStatus appointment={appointment} />
    
    {appointment.notes && (
      <p className="text-xs text-gray-500 truncate">{appointment.notes}</p>
    )}
  </div>
);

// NEW: スケジュール状態コンポーネント  
const ScheduleStatus = ({ appointment }: { appointment: Appointment }) => {
  const scheduleStatus = getScheduleStatus(appointment);
  
  return (
    <div className="flex items-center space-x-1 text-xs">
      {scheduleStatus.hasCalendarEvent ? (
        <div className="flex items-center text-blue-600">
          <Calendar className="w-3 h-3 mr-1" />
          <span>{scheduleStatus.scheduledDate}</span>
        </div>
      ) : (
        <div className="flex items-center text-gray-400">
          <Clock className="w-3 h-3 mr-1" />
          <span>未スケジュール</span>
        </div>
      )}
    </div>
  );
};
```

#### **1.2 アポイントメント専用ドラッグ&ドロップ拡張**
```typescript
// src/components/appointments/EnhancedAppointmentKanban.tsx
export function EnhancedAppointmentKanban({
  kanbanType,
  onAppointmentMove,
  onAppointmentEdit,
  onAppointmentComplete,
  onDataRefresh,
}: AppointmentKanbanProps) {
  
  // NEW: 日程管理モーダル状態
  const [scheduleModal, setScheduleModal] = useState<{
    isOpen: boolean;
    type: 'schedule' | 'complete' | 'reschedule';
    appointment: Appointment | null;
    targetStatus: string | null;
  }>({
    isOpen: false,
    type: 'schedule',
    appointment: null,
    targetStatus: null
  });

  // NEW: 拡張されたドラッグ終了ハンドラー
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const appointmentId = active.id as string;
    const newStatus = over.id as string;
    const appointment = findAppointmentById(appointmentId);
    
    if (!appointment) return;

    // NEW: 特殊フロー処理
    if (await shouldTriggerSchedulingFlow(appointment, newStatus)) {
      setScheduleModal({
        isOpen: true,
        type: getModalType(appointment, newStatus),
        appointment,
        targetStatus: newStatus
      });
      return;
    }

    // 通常の移動処理
    await executeNormalMove(appointmentId, newStatus);
  };

  // NEW: スケジューリングフロー判定
  const shouldTriggerSchedulingFlow = async (appointment: Appointment, newStatus: string): Promise<boolean> => {
    const currentStatus = getCurrentStatus(appointment, kanbanType);
    
    // 「待機」→「進行中」移動時
    if (kanbanType === 'processing' && 
        currentStatus === 'PENDING' && 
        newStatus === 'IN_PROGRESS') {
      return !hasCalendarEvent(appointment.id);
    }
    
    // 「完了」移動時
    if (kanbanType === 'processing' && newStatus === 'COMPLETED') {
      return true;
    }
    
    return false;
  };

  return (
    <div>
      {/* 既存のカンバンUI */}
      <UniversalKanban
        columns={config.columns}
        items={appointments}
        itemType="appointment"
        onItemMove={handleDragEnd}
        renderCard={(appointment) => (
          <HoverCard hoverEffect="lift">
            <UniversalKanbanCard 
              item={appointment} 
              type="appointment"
              onEdit={onAppointmentEdit}
              onSchedule={handleScheduleAppointment}
              onReschedule={handleRescheduleAppointment}
            />
          </HoverCard>
        )}
        enableAddCards={true}
        onAddCard={handleAddAppointment}
      />

      {/* NEW: 日程管理モーダル */}
      <AppointmentSchedulingModal
        isOpen={scheduleModal.isOpen}
        type={scheduleModal.type}
        appointment={scheduleModal.appointment}
        targetStatus={scheduleModal.targetStatus}
        onClose={() => setScheduleModal(prev => ({ ...prev, isOpen: false }))}
        onSchedule={handleModalSchedule}
        onComplete={handleModalComplete}
        onCancel={handleModalCancel}
      />
    </div>
  );
}
```

### **Phase 2: アポイントメント日程管理モーダル実装（1週間）**

#### **2.1 日程管理モーダルコンポーネント**
```typescript
// src/components/appointments/AppointmentSchedulingModal.tsx
interface AppointmentSchedulingModalProps {
  isOpen: boolean;
  type: 'schedule' | 'complete' | 'reschedule';
  appointment: Appointment | null;
  targetStatus: string | null;
  onClose: () => void;
  onSchedule: (data: ScheduleData) => void;
  onComplete: (data: CompletionData) => void;
  onCancel: () => void;
}

interface ScheduleData {
  appointmentId: string;
  dateTime: string;
  location?: string;
  duration: number; // minutes
  participants: string[];
  notes?: string;
}

interface CompletionData {
  appointmentId: string;
  outcome: 'successful' | 'cancelled' | 'rescheduled';
  notes?: string;
  nextAppointment?: {
    hasNext: boolean;
    scheduledDate?: string;
    purpose?: string;
  };
  connectionUpdate?: {
    newStatus: string;
    notes?: string;
  };
}

export function AppointmentSchedulingModal({
  isOpen,
  type,
  appointment,
  targetStatus,
  onClose,
  onSchedule,
  onComplete,
  onCancel
}: AppointmentSchedulingModalProps) {
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-6">
        {type === 'schedule' && (
          <ScheduleForm 
            appointment={appointment}
            targetStatus={targetStatus}
            onSubmit={onSchedule}
            onCancel={onCancel}
          />
        )}
        
        {type === 'complete' && (
          <CompletionForm
            appointment={appointment}
            onSubmit={onComplete}
            onCancel={onCancel}
          />
        )}
        
        {type === 'reschedule' && (
          <RescheduleForm
            appointment={appointment}
            onSubmit={onSchedule}
            onCancel={onCancel}
          />
        )}
      </div>
    </Modal>
  );
}

// スケジュール設定フォーム
const ScheduleForm = ({ appointment, targetStatus, onSubmit, onCancel }: {
  appointment: Appointment | null;
  targetStatus: string | null;
  onSubmit: (data: ScheduleData) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<Partial<ScheduleData>>({
    dateTime: '',
    location: '',
    duration: 60,
    participants: [],
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment || !formData.dateTime) return;
    
    onSubmit({
      appointmentId: appointment.id,
      dateTime: formData.dateTime,
      location: formData.location,
      duration: formData.duration || 60,
      participants: formData.participants || [],
      notes: formData.notes
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          アポイントメント日程設定
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {appointment?.companyName} - {appointment?.contactName}
        </p>
      </div>

      <FormField label="実施日時" required>
        <input
          type="datetime-local"
          value={formData.dateTime}
          onChange={(e) => setFormData(prev => ({ ...prev, dateTime: e.target.value }))}
          className="form-input"
          required
        />
      </FormField>

      <FormField label="場所">
        <input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          placeholder="オンライン / 会議室A / 先方オフィス"
          className="form-input"
        />
      </FormField>

      <FormField label="予定時間">
        <select
          value={formData.duration}
          onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
          className="form-input"
        >
          <option value={30}>30分</option>
          <option value={60}>1時間</option>
          <option value={90}>1時間30分</option>
          <option value={120}>2時間</option>
        </select>
      </FormField>

      <FormField label="メモ">
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="議題、準備事項など"
          rows={3}
          className="form-input"
        />
      </FormField>

      <div className="flex space-x-3 pt-4">
        <Button type="submit" variant="primary" className="flex-1">
          スケジュール設定
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          キャンセル
        </Button>
      </div>
    </form>
  );
};

// 完了処理フォーム
const CompletionForm = ({ appointment, onSubmit, onCancel }: {
  appointment: Appointment | null;
  onSubmit: (data: CompletionData) => void;
  onCancel: () => void;
}) => {
  const [outcome, setOutcome] = useState<'successful' | 'cancelled' | 'rescheduled'>('successful');
  const [hasNextAppointment, setHasNextAppointment] = useState(false);
  const [nextAppointmentDate, setNextAppointmentDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;

    onSubmit({
      appointmentId: appointment.id,
      outcome,
      notes,
      nextAppointment: {
        hasNext: hasNextAppointment,
        scheduledDate: hasNextAppointment ? nextAppointmentDate : undefined,
        purpose: hasNextAppointment ? '継続協議' : undefined
      },
      connectionUpdate: {
        newStatus: getNextConnectionStatus(appointment, outcome),
        notes: `アポイントメント${outcome === 'successful' ? '成功' : outcome === 'cancelled' ? 'キャンセル' : '再調整'}`
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          アポイントメント完了処理
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {appointment?.companyName} - {appointment?.contactName}
        </p>
      </div>

      <FormField label="実施結果" required>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="successful"
              checked={outcome === 'successful'}
              onChange={(e) => setOutcome(e.target.value as any)}
              className="mr-2"
            />
            <span>成功</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="cancelled"
              checked={outcome === 'cancelled'}
              onChange={(e) => setOutcome(e.target.value as any)}
              className="mr-2"
            />
            <span>キャンセル</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="rescheduled"
              checked={outcome === 'rescheduled'}
              onChange={(e) => setOutcome(e.target.value as any)}
              className="mr-2"
            />
            <span>再調整</span>
          </label>
        </div>
      </FormField>

      <FormField label="次回アポイントメント">
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={hasNextAppointment}
              onChange={(e) => setHasNextAppointment(e.target.checked)}
              className="mr-2"
            />
            <span>次回アポイントメントを設定する</span>
          </label>
          
          {hasNextAppointment && (
            <input
              type="datetime-local"
              value={nextAppointmentDate}
              onChange={(e) => setNextAppointmentDate(e.target.value)}
              className="form-input"
              placeholder="次回実施予定日時"
            />
          )}
        </div>
      </FormField>

      <FormField label="メモ">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="実施内容、次回への申し送り事項など"
          rows={3}
          className="form-input"
        />
      </FormField>

      <div className="flex space-x-3 pt-4">
        <Button type="submit" variant="primary" className="flex-1">
          完了処理実行
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          キャンセル
        </Button>
      </div>
    </form>
  );
};
```

### **Phase 3: Calendar Events統合・自動更新処理（1週間）**

#### **3.1 Calendar Events統合API**
```typescript
// src/app/api/appointments/[id]/schedule/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointmentId = params.id;
    const { dateTime, location, duration, participants, notes } = await request.json();

    // トランザクション処理
    const result = await prisma.$transaction(async (tx) => {
      // 1. アポイントメント更新
      const appointment = await tx.appointments.update({
        where: { id: appointmentId },
        data: {
          details: {
            ...appointment.details,
            processingStatus: 'IN_PROGRESS',
            scheduledDate: dateTime,
            location,
            duration
          }
        }
      });

      // 2. Calendar Event作成
      const calendarEvent = await tx.calendar_events.create({
        data: {
          title: `【アポ】${appointment.companyName} - ${appointment.contactName}`,
          description: `${notes}\n\n関連アポイントメント: ${appointmentId}`,
          date: new Date(dateTime).toISOString().split('T')[0],
          time: new Date(dateTime).toTimeString().split(' ')[0],
          startTime: new Date(dateTime).toTimeString().split(' ')[0],
          participants: participants.length > 0 ? participants : [appointment.assignedTo || 'user1'],
          type: 'meeting',
          location,
          // 担当者システム対応
          createdBy: appointment.assignedTo || appointment.createdBy,
          assignedTo: appointment.assignedTo,
          // アポイントメント紐付け
          relatedAppointmentId: appointmentId
        }
      });

      // 3. Connection Status自動更新
      if (appointment.details?.relationshipStatus === 'FIRST_CONTACT') {
        await updateConnectionStatus(tx, appointment, 'RAPPORT_BUILDING');
      }

      return { appointment, calendarEvent };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Schedule creation failed:', error);
    return NextResponse.json({ error: 'Schedule creation failed' }, { status: 500 });
  }
}

// 完了処理API
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointmentId = params.id;
    const { outcome, notes, nextAppointment, connectionUpdate } = await request.json();

    const result = await prisma.$transaction(async (tx) => {
      // 1. 現在のアポイントメント完了処理
      const appointment = await tx.appointments.update({
        where: { id: appointmentId },
        data: {
          details: {
            ...appointment.details,
            processingStatus: 'COMPLETED',
            completedAt: new Date().toISOString(),
            outcome,
            completionNotes: notes
          }
        }
      });

      // 2. カレンダーイベント更新（完了マーク）
      await tx.calendar_events.updateMany({
        where: { relatedAppointmentId: appointmentId },
        data: {
          description: `${appointment.description}\n\n✅ 完了: ${outcome}`
        }
      });

      // 3. 次回アポイントメント作成
      let nextAppointmentRecord = null;
      if (nextAppointment?.hasNext && nextAppointment.scheduledDate) {
        nextAppointmentRecord = await tx.appointments.create({
          data: {
            companyName: appointment.companyName,
            contactName: appointment.contactName,
            phone: appointment.phone,
            email: appointment.email,
            status: 'scheduled',
            priority: appointment.priority,
            nextAction: nextAppointment.purpose || '継続協議',
            notes: `前回フォローアップ: ${appointmentId}`,
            assignedTo: appointment.assignedTo,
            createdBy: appointment.assignedTo,
            details: {
              processingStatus: 'IN_PROGRESS',
              scheduledDate: nextAppointment.scheduledDate,
              relationshipStatus: connectionUpdate?.newStatus || appointment.details?.relationshipStatus
            }
          }
        });

        // 次回アポのカレンダーイベント作成
        await tx.calendar_events.create({
          data: {
            title: `【継続アポ】${appointment.companyName} - ${appointment.contactName}`,
            description: nextAppointment.purpose || '継続協議',
            date: new Date(nextAppointment.scheduledDate).toISOString().split('T')[0],
            time: new Date(nextAppointment.scheduledDate).toTimeString().split(' ')[0],
            startTime: new Date(nextAppointment.scheduledDate).toTimeString().split(' ')[0],
            participants: [appointment.assignedTo || 'user1'],
            type: 'meeting',
            assignedTo: appointment.assignedTo,
            relatedAppointmentId: nextAppointmentRecord.id
          }
        });
      }

      // 4. Connection Status更新
      if (connectionUpdate?.newStatus) {
        await updateConnectionStatus(tx, appointment, connectionUpdate.newStatus);
      }

      return { appointment, nextAppointment: nextAppointmentRecord };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Completion processing failed:', error);
    return NextResponse.json({ error: 'Completion processing failed' }, { status: 500 });
  }
}

// コネクション状態自動更新ロジック
async function updateConnectionStatus(tx: any, appointment: any, newStatus: string) {
  // connections テーブルの更新またはレコード作成
  const existingConnection = await tx.connections.findFirst({
    where: {
      OR: [
        { companyName: appointment.companyName },
        { email: appointment.email }
      ]
    }
  });

  if (existingConnection) {
    await tx.connections.update({
      where: { id: existingConnection.id },
      data: {
        relationshipStatus: newStatus,
        lastContactDate: new Date().toISOString(),
        notes: `${existingConnection.notes || ''}\n\nアポイントメント経由で関係性更新: ${newStatus}`
      }
    });
  } else {
    await tx.connections.create({
      data: {
        companyName: appointment.companyName,
        contactName: appointment.contactName,
        email: appointment.email,
        phone: appointment.phone,
        relationshipStatus: newStatus,
        source: 'appointment',
        lastContactDate: new Date().toISOString(),
        assignedTo: appointment.assignedTo,
        createdBy: appointment.assignedTo,
        notes: `アポイントメントから自動作成: ${appointment.id}`
      }
    });
  }
}
```

#### **3.2 カレンダー統合表示の実装**
```typescript
// src/app/api/calendar/unified/route.ts 拡張
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');

    // 既存のイベント取得
    const calendarEvents = await prisma.calendar_events.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        OR: userId ? [
          { assignedTo: userId },
          { createdBy: userId },
          { participants: { has: userId } }
        ] : undefined
      },
      include: {
        assignee: true,
        creator: true
      }
    });

    // NEW: アポイントメント由来のイベント識別
    const eventsWithAppointmentInfo = calendarEvents.map(event => ({
      ...event,
      source: event.relatedAppointmentId ? 'appointment' : 'manual',
      appointmentInfo: event.relatedAppointmentId ? {
        id: event.relatedAppointmentId,
        canReschedule: true,
        canComplete: event.date <= new Date().toISOString().split('T')[0]
      } : null
    }));

    // 既存のタスク・個人予定取得（変更なし）
    const tasks = await prisma.tasks.findMany({
      where: {
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { not: 'DELETE' }
      },
      include: { assignee: true, creator: true }
    });

    const personalSchedules = await prisma.personal_schedules.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        userId: userId || undefined
      },
      include: { user: true }
    });

    // 統合イベント生成
    const unifiedEvents = [
      ...eventsWithAppointmentInfo.map(event => ({
        id: `event-${event.id}`,
        title: event.title,
        date: event.date,
        time: event.time,
        type: 'event' as const,
        source: event.source,
        appointmentInfo: event.appointmentInfo,
        assignee: event.assignee,
        creator: event.creator,
        location: event.location,
        description: event.description
      })),
      // 既存のタスク・個人予定マッピング（変更なし）
      ...tasks.map(task => ({
        id: `task-${task.id}`,
        title: `📋 ${task.title}`,
        date: task.dueDate!,
        time: '09:00',
        type: 'task' as const,
        source: 'task',
        assignee: task.assignee,
        creator: task.creator,
        priority: task.priority
      })),
      ...personalSchedules.map(schedule => ({
        id: `personal-${schedule.id}`,
        title: `📅 ${schedule.title}`,
        date: schedule.date,
        time: schedule.time || '09:00',
        type: 'personal' as const,
        source: 'personal',
        user: schedule.user
      }))
    ];

    return NextResponse.json({ events: unifiedEvents });
  } catch (error) {
    console.error('Unified calendar fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar data' }, { status: 500 });
  }
}
```

### **Phase 4: 統合・最適化・テスト（1週間）**

#### **4.1 アポイントメントページ統合実装**
```typescript
// src/app/appointments/page.tsx 拡張版
export default function AppointmentsPage() {
  // 既存のstate + 新機能state
  const [scheduleModal, setScheduleModal] = useState<ScheduleModalState | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // NEW: スケジュール関連ハンドラー
  const handleAppointmentSchedule = async (data: ScheduleData) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/appointments/${data.appointmentId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const result = await response.json();
        
        // 成功通知
        addNotification({
          type: 'success',
          title: 'スケジュール設定完了',
          message: `${result.appointment.companyName}のアポイントメントをスケジュールしました`
        });

        // データ再読み込み
        await refetchAppointments();
        setScheduleModal(null);
      }
    } catch (error) {
      console.error('Schedule creation failed:', error);
      addNotification({
        type: 'error',
        title: 'スケジュール設定失敗',
        message: '日程設定に失敗しました'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppointmentComplete = async (data: CompletionData) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/appointments/${data.appointmentId}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const result = await response.json();
        
        // 完了通知 + 次回アポ通知
        let message = `${result.appointment.companyName}のアポイントメントが完了しました`;
        if (result.nextAppointment) {
          message += `。次回アポイントメントを作成しました。`;
        }
        
        addNotification({
          type: 'success',
          title: 'アポイントメント完了',
          message
        });

        await refetchAppointments();
        setScheduleModal(null);
      }
    } catch (error) {
      console.error('Completion processing failed:', error);
      addNotification({
        type: 'error',
        title: '完了処理失敗',
        message: 'アポイントメント完了処理に失敗しました'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 通知システム
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
    
    // 5秒後に自動削除
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      {/* 既存のUI */}
      <div className="mx-auto px-4 lg:px-8">
        {/* ヘッダー・統計・フィルター（既存）*/}
        
        {/* カンバンビュー */}
        {viewMode === 'kanban' && (
          <div className="bg-white rounded-lg shadow-lg p-4">
            <EnhancedAppointmentKanban
              kanbanType={kanbanType}
              onAppointmentMove={handleAppointmentMove}
              onAppointmentEdit={handleAppointmentEdit}
              onAppointmentComplete={handleAppointmentComplete}
              onAppointmentSchedule={handleAppointmentSchedule}
              onDataRefresh={refetchAppointments}
            />
          </div>
        )}

        {/* 既存のリストビュー・モーダル */}
      </div>

      {/* NEW: 通知システム */}
      <NotificationCenter notifications={notifications} />

      {/* NEW: スケジューリングモーダル */}
      {scheduleModal && (
        <AppointmentSchedulingModal
          isOpen={true}
          type={scheduleModal.type}
          appointment={scheduleModal.appointment}
          targetStatus={scheduleModal.targetStatus}
          onClose={() => setScheduleModal(null)}
          onSchedule={handleAppointmentSchedule}
          onComplete={handleAppointmentComplete}
          onCancel={() => setScheduleModal(null)}
        />
      )}
    </div>
  );
}
```

#### **4.2 通知システム実装**
```typescript
// src/components/notifications/NotificationCenter.tsx
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function NotificationCenter({ notifications }: { notifications: Notification[] }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <NotificationToast 
          key={notification.id} 
          notification={notification}
        />
      ))}
    </div>
  );
}

const NotificationToast = ({ notification }: { notification: Notification }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const typeIcons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  if (!isVisible) return null;

  return (
    <div className={cn(
      'p-4 rounded-lg border shadow-lg transition-all duration-300',
      'animate-slideInFromRight',
      typeStyles[notification.type]
    )}>
      <div className="flex items-start space-x-3">
        {typeIcons[notification.type]}
        <div className="flex-1">
          <h4 className="font-medium text-sm">{notification.title}</h4>
          <p className="text-sm opacity-90 mt-1">{notification.message}</p>
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="text-sm underline mt-2 opacity-80 hover:opacity-100"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="opacity-50 hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
```

---

## 🎨 実装優先順位と完了指標

### **Phase 1完了指標**
✅ UniversalKanbanCard・UniversalKanban作成  
✅ AddCardButton・基本アニメーション実装  
✅ 既存TaskKanbanBoardの移行・テスト

### **Phase 2完了指標**
✅ AppointmentSchedulingModal実装完了  
✅ ScheduleForm・CompletionForm動作確認  
✅ カンバンドラッグ&ドロップとモーダル連携

### **Phase 3完了指標**
✅ Calendar Events統合API実装  
✅ アポイントメント→カレンダー自動連携  
✅ コネクション状態自動更新機能

### **Phase 4完了指標**
✅ 全ページUI統一完了  
✅ アポイントメント日程管理フロー完全動作  
✅ 通知システム・エラーハンドリング完成  
✅ モバイル・デスクトップ両対応

---

## 🚀 技術的な詳細仕様

### **データベーススキーマ拡張**
```sql
-- calendar_eventsテーブルにアポイントメント紐付けフィールド追加
ALTER TABLE calendar_events 
ADD COLUMN related_appointment_id VARCHAR(255) DEFAULT NULL,
ADD COLUMN source VARCHAR(50) DEFAULT 'manual';

-- インデックス追加
CREATE INDEX idx_calendar_events_related_appointment ON calendar_events(related_appointment_id);
CREATE INDEX idx_calendar_events_source ON calendar_events(source);

-- appointmentsテーブルのdetailsフィールド拡張（JSON）
-- 追加するフィールド例:
-- {
--   "scheduledDate": "2025-06-20T14:00:00Z",
--   "location": "会議室A",
--   "duration": 60,
--   "completedAt": "2025-06-20T15:00:00Z",
--   "outcome": "successful",
--   "completionNotes": "次回提案書持参"
-- }
```

### **API エンドポイント一覧**
```
POST /api/appointments/{id}/schedule          # 日程設定
PATCH /api/appointments/{id}/schedule         # 完了処理
GET /api/appointments/kanban/{type}           # カンバンデータ取得（既存）
POST /api/appointments/{id}/details           # 詳細更新（既存）
GET /api/calendar/unified                     # 統合カレンダー（拡張）
```

### **型定義拡張**
```typescript
// 既存Appointment型拡張
interface AppointmentDetails {
  processingStatus?: string;
  relationshipStatus?: string;
  phaseStatus?: string;
  sourceType?: string;
  // NEW: スケジュール関連
  scheduledDate?: string;
  location?: string;
  duration?: number;
  completedAt?: string;
  outcome?: 'successful' | 'cancelled' | 'rescheduled';
  completionNotes?: string;
}

// 統合カレンダーイベント型
interface UnifiedCalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'event' | 'task' | 'personal';
  source: 'appointment' | 'manual' | 'task' | 'personal';
  appointmentInfo?: {
    id: string;
    canReschedule: boolean;
    canComplete: boolean;
  };
  assignee?: User;
  creator?: User;
}
```

---

## 📱 レスポンシブ・モバイル対応

### **モバイル専用アポイントメント管理UI**
```typescript
// src/components/appointments/MobileAppointmentFlow.tsx
export function MobileAppointmentFlow() {
  const { isMobile } = useResponsiveKanban();
  
  if (!isMobile) return <EnhancedAppointmentKanban {...props} />;
  
  return (
    <div className="space-y-4">
      {/* モバイル: アコーディオン形式 */}
      {columns.map(column => (
        <MobileColumnAccordion 
          key={column.id}
          column={column}
          appointments={appointments[column.id] || []}
          onQuickSchedule={handleQuickSchedule}
          onComplete={handleComplete}
        />
      ))}
    </div>
  );
}

const MobileColumnAccordion = ({ column, appointments, onQuickSchedule, onComplete }) => {
  const [isExpanded, setIsExpanded] = useState(column.id === 'IN_PROGRESS');
  
  return (
    <div className="bg-white rounded-lg shadow">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${column.color.replace('bg-', 'bg-')}`} />
          <span className="font-medium">{column.title}</span>
          <span className="text-sm text-gray-500">({appointments.length})</span>
        </div>
        <ChevronDown className={cn(
          'w-5 h-5 transition-transform',
          isExpanded && 'rotate-180'
        )} />
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {appointments.map(appointment => (
            <MobileAppointmentCard
              key={appointment.id}
              appointment={appointment}
              onQuickSchedule={onQuickSchedule}
              onComplete={onComplete}
            />
          ))}
          <AddCardButton columnId={column.id} itemType="appointment" />
        </div>
      )}
    </div>
  );
};
```

---

この完全版実装計画により、カレンダー・タスク・アポイント・プロジェクトページの統一UI改善に加えて、アポイントメント日程管理フローの根本的な問題解決が実現されます。

特に、アポイントメントとcalendar_eventsの自動連携により、カレンダー表示の問題が解決され、営業プロセスの効率化が大幅に向上します。

実装を開始しますか？