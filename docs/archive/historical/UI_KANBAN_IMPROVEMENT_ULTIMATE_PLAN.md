# 🎨 カレンダー・タスク・アポイント・プロジェクトページ UI改善究極実装計画書

**作成日**: 2025-06-17  
**最終更新**: アポイントメントワークフロー完全版  
**対象**: カレンダー、タスク、アポイント、プロジェクトページのUI/UX統一改善 + 完全なワークフローシステム  
**期間**: 5週間（Phase別実装）  
**目的**: 統一UI・高度なタスクフロー・アポイントメント完全自動化・営業プロセス最適化・契約処理自動化

---

## 📊 アポイントメントワークフロー完全仕様

### **1. タブ別カンバン移動による自動ステータス更新**

#### **1.1 処理状況タブ（processing）**
```typescript
interface ProcessingStatusFlow {
  // カンバン移動による自動更新
  kanbanMoves: {
    'PENDING → IN_PROGRESS': {
      trigger: '実施日入力モーダル表示';
      required: ['dateTime', 'location'];
      result: 'calendar_events作成 + processingStatus: IN_PROGRESS';
    };
    'IN_PROGRESS → COMPLETED': {
      trigger: '次回アポ確認モーダル';
      options: ['次回なし', '次回あり'];
      result: 'processingStatus: COMPLETED + 次回アポ作成（オプション）';
    };
    'COMPLETED → FOLLOW_UP': {
      action: '自動ステータス更新';
      result: 'processingStatus: FOLLOW_UP';
    };
  };
  
  // 流入経路変更（同一タブ内）
  sourceChanges: {
    'REFERRAL → COLD_OUTREACH': {
      action: 'sourceType自動更新';
      result: 'appointment.details.sourceType = COLD_OUTREACH';
    };
    // 他の流入経路も同様
  };
}
```

#### **1.2 関係性タブ（relationship）**
```typescript
interface RelationshipStatusFlow {
  kanbanMoves: {
    'FIRST_CONTACT → RAPPORT_BUILDING': {
      action: '関係性ステータス自動更新';
      result: 'relationshipStatus: RAPPORT_BUILDING';
      connectionUpdate: 'connections.relationshipStatus自動更新';
    };
    'RAPPORT_BUILDING → TRUST_ESTABLISHED': {
      action: '関係性進展';
      result: 'relationshipStatus: TRUST_ESTABLISHED';
      connectionUpdate: 'connections.relationshipStatus自動更新';
    };
    'TRUST_ESTABLISHED → STRATEGIC_PARTNER': {
      action: '戦略的関係構築';
      result: 'relationshipStatus: STRATEGIC_PARTNER';
      connectionUpdate: 'connections.relationshipStatus自動更新';
    };
  };
  
  // コネクションテーブル自動更新（ブリッジ不要）
  autoConnectionUpdate: true;
}
```

#### **1.3 営業フェーズタブ（phase）**
```typescript
interface SalesPhaseFlow {
  kanbanMoves: {
    'LEAD → PROSPECT': {
      action: '営業フェーズ進展';
      result: 'phaseStatus: PROSPECT';
    };
    'PROSPECT → PROPOSAL': {
      action: '提案段階移行';
      result: 'phaseStatus: PROPOSAL';
    };
    'PROPOSAL → NEGOTIATION': {
      action: '商談段階移行';
      result: 'phaseStatus: NEGOTIATION';
    };
    'NEGOTIATION → CLOSING': {
      action: 'クロージング段階';
      result: 'phaseStatus: CLOSING';
    };
    'CLOSING → CONTRACT': {
      trigger: '契約処理モーダル';
      actions: ['バックオフィスタスク自動生成', 'ナレッジ登録'];
      result: 'phaseStatus: CONTRACT + タスク生成';
    };
  };
  
  // 次回アポ設定時の営業フェーズ変更
  nextAppointmentModal: {
    includes: ['日付設定', '営業フェーズ変更ドロップダウン'];
    result: '次回アポ + 営業フェーズ自動更新';
  };
}
```

### **2. 契約処理・バックオフィスタスク自動生成**

#### **2.1 契約カンバン移動時の処理**
```typescript
interface ContractProcessingFlow {
  trigger: 'CLOSINGカンバン → CONTRACTカンバン移動';
  
  modal: {
    title: '契約処理・バックオフィス業務';
    sections: [
      'バックオフィスタスク自動生成',
      'ナレッジ登録',
      '契約詳細入力'
    ];
  };
  
  backOfficeTaskTemplates: [
    {
      title: '契約書作成',
      description: '${companyName}様との契約書を作成する',
      status: 'PLAN',
      priority: 'A',
      dueDate: '+3days',
      assignedTo: 'legal_team',
      tags: ['契約', 'バックオフィス']
    },
    {
      title: '請求書発行',
      description: '${companyName}様への請求書を発行する',
      status: 'PLAN', 
      priority: 'A',
      dueDate: '+1day',
      assignedTo: 'accounting_team',
      tags: ['請求', 'バックオフィス']
    },
    {
      title: 'キックオフ準備',
      description: '${companyName}様とのキックオフ準備を行う',
      status: 'PLAN',
      priority: 'B', 
      dueDate: '+7days',
      assignedTo: 'project_manager',
      tags: ['キックオフ', 'プロジェクト']
    },
    {
      title: 'アカウント設定',
      description: '${companyName}様のアカウントを設定する',
      status: 'PLAN',
      priority: 'A',
      dueDate: '+2days', 
      assignedTo: 'tech_team',
      tags: ['設定', 'テクニカル']
    }
  ];
  
  knowledgeTemplate: {
    title: '営業ナレッジ: ${companyName}',
    category: 'sales',
    content: '成功事例・課題・提案内容・決定要因等',
    tags: ['営業', '成功事例', '${industry}']
  };
}
```

---

## 🛠️ Phase別実装計画（究極版・5週間）

### **Phase 1: アイコン統一・基盤構築（1週間）**
※前回と同じ内容（Lucide React統一）

### **Phase 2: タスクワークフロー高度化（1週間）**  
※前回と同じ内容（ステータスフロー・MECE等）

### **Phase 3: アポイントメントワークフロー基盤（1週間）**

#### **3.1 アポイントメント日程管理拡張**
```typescript
// src/components/appointments/EnhancedAppointmentKanban.tsx
export function EnhancedAppointmentKanban({
  kanbanType,
  onAppointmentMove,
  onAppointmentEdit,
  onAppointmentComplete,
  onDataRefresh,
}: AppointmentKanbanProps) {
  
  // アポイントメント専用モーダル状態
  const [appointmentModal, setAppointmentModal] = useState<{
    isOpen: boolean;
    type: 'schedule' | 'complete' | 'contract' | 'phase_change';
    appointment: Appointment | null;
    targetStatus: string | null;
    targetColumn: string | null;
  }>({
    isOpen: false,
    type: 'schedule',
    appointment: null,
    targetStatus: null,
    targetColumn: null
  });

  // 拡張されたドラッグ終了ハンドラー
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const appointmentId = active.id as string;
    const appointment = findAppointmentById(appointmentId);
    const newColumn = over.id as string;
    
    if (!appointment) return;

    // タブ別処理分岐
    switch (kanbanType) {
      case 'processing':
        await handleProcessingMove(appointment, newColumn);
        break;
      case 'relationship': 
        await handleRelationshipMove(appointment, newColumn);
        break;
      case 'phase':
        await handlePhaseMove(appointment, newColumn);
        break;
      case 'source':
        await handleSourceMove(appointment, newColumn);
        break;
    }
  };

  // 処理状況移動ハンドラー
  const handleProcessingMove = async (appointment: Appointment, newColumn: string) => {
    const currentStatus = appointment.details?.processingStatus || 'PENDING';
    
    // 特殊フロー処理
    if (currentStatus === 'PENDING' && newColumn === 'IN_PROGRESS') {
      // 実施日入力が必要
      if (!hasCalendarEvent(appointment.id)) {
        setAppointmentModal({
          isOpen: true,
          type: 'schedule',
          appointment,
          targetStatus: 'IN_PROGRESS',
          targetColumn: newColumn
        });
        return;
      }
    }
    
    if (currentStatus === 'IN_PROGRESS' && newColumn === 'COMPLETED') {
      // 次回アポ確認
      setAppointmentModal({
        isOpen: true,
        type: 'complete',
        appointment,
        targetStatus: 'COMPLETED',
        targetColumn: newColumn
      });
      return;
    }
    
    // 通常の移動処理
    await updateAppointmentProcessingStatus(appointment.id, newColumn);
  };

  // 関係性移動ハンドラー
  const handleRelationshipMove = async (appointment: Appointment, newColumn: string) => {
    // 関係性ステータス自動更新
    await updateAppointmentRelationshipStatus(appointment.id, newColumn);
    
    // コネクションテーブル自動更新
    await updateConnectionStatus(appointment, newColumn);
    
    showNotification('success', '関係性ステータスを更新しました');
  };

  // 営業フェーズ移動ハンドラー
  const handlePhaseMove = async (appointment: Appointment, newColumn: string) => {
    if (newColumn === 'CONTRACT') {
      // 契約処理モーダル
      setAppointmentModal({
        isOpen: true,
        type: 'contract',
        appointment,
        targetStatus: 'CONTRACT',
        targetColumn: newColumn
      });
      return;
    }
    
    // 通常の営業フェーズ更新
    await updateAppointmentPhaseStatus(appointment.id, newColumn);
    showNotification('success', '営業フェーズを更新しました');
  };

  // 流入経路移動ハンドラー
  const handleSourceMove = async (appointment: Appointment, newColumn: string) => {
    await updateAppointmentSourceType(appointment.id, newColumn);
    showNotification('success', '流入経路を更新しました');
  };

  return (
    <div>
      {/* カンバンUI */}
      <UniversalKanban
        columns={getAppointmentColumns(kanbanType)}
        items={appointments}
        itemType="appointment"
        onItemMove={handleDragEnd}
        renderCard={(appointment) => (
          <HoverCard hoverEffect="lift">
            <UniversalKanbanCard 
              item={appointment} 
              type="appointment"
              onEdit={onAppointmentEdit}
              customActions={
                <AppointmentCardActions 
                  appointment={appointment}
                  kanbanType={kanbanType}
                />
              }
            />
          </HoverCard>
        )}
        enableAddCards={true}
        onAddCard={handleAddAppointment}
      />

      {/* アポイントメント専用モーダル群 */}
      <AppointmentFlowModal
        isOpen={appointmentModal.isOpen}
        type={appointmentModal.type}
        appointment={appointmentModal.appointment}
        targetStatus={appointmentModal.targetStatus}
        onClose={() => setAppointmentModal(prev => ({ ...prev, isOpen: false }))}
        onSchedule={handleAppointmentSchedule}
        onComplete={handleAppointmentComplete}
        onContract={handleContractProcessing}
        onCancel={() => setAppointmentModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
```

### **Phase 4: 営業フェーズ・契約処理自動化（1週間）**

#### **4.1 アポイントメントフローモーダル**
```typescript
// src/components/appointments/AppointmentFlowModal.tsx
interface AppointmentFlowModalProps {
  isOpen: boolean;
  type: 'schedule' | 'complete' | 'contract' | 'phase_change';
  appointment: Appointment | null;
  targetStatus: string | null;
  onClose: () => void;
  onSchedule: (data: ScheduleData) => void;
  onComplete: (data: CompletionData) => void;
  onContract: (data: ContractData) => void;
  onCancel: () => void;
}

export function AppointmentFlowModal({
  isOpen,
  type,
  appointment,
  targetStatus,
  onClose,
  onSchedule,
  onComplete,
  onContract,
  onCancel
}: AppointmentFlowModalProps) {
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-6">
        {type === 'schedule' && (
          <AppointmentScheduleForm 
            appointment={appointment}
            targetStatus={targetStatus}
            onSubmit={onSchedule}
            onCancel={onCancel}
          />
        )}
        
        {type === 'complete' && (
          <AppointmentCompletionForm
            appointment={appointment}
            onSubmit={onComplete}
            onCancel={onCancel}
          />
        )}
        
        {type === 'contract' && (
          <ContractProcessingForm
            appointment={appointment}
            onSubmit={onContract}
            onCancel={onCancel}
          />
        )}
      </div>
    </Modal>
  );
}

// 契約処理フォーム
const ContractProcessingForm = ({ appointment, onSubmit, onCancel }: {
  appointment: Appointment | null;
  onSubmit: (data: ContractData) => void;
  onCancel: () => void;
}) => {
  const [contractValue, setContractValue] = useState('');
  const [contractType, setContractType] = useState('');
  const [generateBackOfficeTasks, setGenerateBackOfficeTasks] = useState(true);
  const [createKnowledge, setCreateKnowledge] = useState(true);
  const [selectedTaskTemplates, setSelectedTaskTemplates] = useState<string[]>([
    'contract_creation',
    'invoice_generation', 
    'kickoff_preparation',
    'account_setup'
  ]);

  const taskTemplates = [
    { id: 'contract_creation', name: '契約書作成', priority: 'A', dueDate: '+3days' },
    { id: 'invoice_generation', name: '請求書発行', priority: 'A', dueDate: '+1day' },
    { id: 'kickoff_preparation', name: 'キックオフ準備', priority: 'B', dueDate: '+7days' },
    { id: 'account_setup', name: 'アカウント設定', priority: 'A', dueDate: '+2days' },
    { id: 'onboarding_plan', name: 'オンボーディング計画', priority: 'B', dueDate: '+5days' },
    { id: 'project_setup', name: 'プロジェクト設定', priority: 'B', dueDate: '+3days' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;

    onSubmit({
      appointmentId: appointment.id,
      contractValue: parseFloat(contractValue),
      contractType,
      generateBackOfficeTasks,
      selectedTaskTemplates,
      createKnowledge,
      contractDetails: {
        companyName: appointment.companyName,
        contactName: appointment.contactName,
        contractDate: new Date().toISOString(),
        status: 'CONTRACT'
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
        <h3 className="text-xl font-semibold text-gray-900">
          🎉 契約成立おめでとうございます！
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {appointment?.companyName} - {appointment?.contactName}
        </p>
      </div>

      {/* 契約詳細 */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-medium text-green-900 mb-3">契約詳細</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="契約金額（万円）">
            <input
              type="number"
              value={contractValue}
              onChange={(e) => setContractValue(e.target.value)}
              placeholder="100"
              className="form-input"
            />
          </FormField>
          
          <FormField label="契約種別">
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="form-input"
            >
              <option value="">選択してください</option>
              <option value="new">新規契約</option>
              <option value="renewal">更新契約</option>
              <option value="upgrade">アップグレード</option>
              <option value="additional">追加契約</option>
            </select>
          </FormField>
        </div>
      </div>

      {/* バックオフィスタスク生成 */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={generateBackOfficeTasks}
            onChange={(e) => setGenerateBackOfficeTasks(e.target.checked)}
            className="rounded"
          />
          <label className="font-medium text-gray-900">
            バックオフィスタスクを自動生成
          </label>
        </div>
        
        {generateBackOfficeTasks && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-3">生成するタスク</h5>
            <div className="space-y-2">
              {taskTemplates.map(template => (
                <label key={template.id} className="flex items-center p-2 hover:bg-blue-100 rounded">
                  <input
                    type="checkbox"
                    checked={selectedTaskTemplates.includes(template.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTaskTemplates(prev => [...prev, template.id]);
                      } else {
                        setSelectedTaskTemplates(prev => prev.filter(id => id !== template.id));
                      }
                    }}
                    className="mr-3 rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-gray-600">
                      優先度: {template.priority} | 期限: {template.dueDate}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ナレッジ登録 */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={createKnowledge}
          onChange={(e) => setCreateKnowledge(e.target.checked)}
          className="rounded"
        />
        <label className="font-medium text-gray-900">
          営業ナレッジとして登録
        </label>
      </div>

      <div className="flex space-x-3 pt-4">
        <Button type="submit" variant="primary" className="flex-1">
          <CheckCircle className="w-4 h-4 mr-2" />
          契約処理を実行
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          <X className="w-4 h-4 mr-2" />
          後で処理
        </Button>
      </div>
    </form>
  );
};

// 完了処理フォーム（営業フェーズ変更付き）
const AppointmentCompletionForm = ({ appointment, onSubmit, onCancel }: {
  appointment: Appointment | null;
  onSubmit: (data: CompletionData) => void;
  onCancel: () => void;
}) => {
  const [outcome, setOutcome] = useState<'successful' | 'cancelled' | 'rescheduled'>('successful');
  const [hasNextAppointment, setHasNextAppointment] = useState(false);
  const [nextAppointmentDate, setNextAppointmentDate] = useState('');
  const [nextSalesPhase, setNextSalesPhase] = useState('PROPOSAL'); // NEW
  const [notes, setNotes] = useState('');

  const salesPhases = [
    { value: 'LEAD', label: 'リード' },
    { value: 'PROSPECT', label: 'プロスペクト' },
    { value: 'PROPOSAL', label: '提案' },
    { value: 'NEGOTIATION', label: '商談' },
    { value: 'CLOSING', label: 'クロージング' },
    { value: 'POST_SALE', label: 'アフターセール' }
  ];

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
        purpose: hasNextAppointment ? '継続協議' : undefined,
        salesPhase: hasNextAppointment ? nextSalesPhase : undefined // NEW
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

      {/* 既存の結果選択 */}
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

      {/* 次回アポイントメント */}
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
            <div className="space-y-3 pl-6 border-l-2 border-blue-200">
              <input
                type="datetime-local"
                value={nextAppointmentDate}
                onChange={(e) => setNextAppointmentDate(e.target.value)}
                className="form-input"
                placeholder="次回実施予定日時"
              />
              
              {/* NEW: 営業フェーズ変更 */}
              <FormField label="次回の営業フェーズ">
                <select
                  value={nextSalesPhase}
                  onChange={(e) => setNextSalesPhase(e.target.value)}
                  className="form-input"
                >
                  {salesPhases.map(phase => (
                    <option key={phase.value} value={phase.value}>
                      {phase.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
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
          <Check className="w-4 h-4 mr-2" />
          完了処理実行
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          <X className="w-4 h-4 mr-2" />
          キャンセル
        </Button>
      </div>
    </form>
  );
};
```

### **Phase 5: バックオフィスタスク生成・統合テスト（1週間）**

#### **5.1 バックオフィスタスク自動生成API**
```typescript
// src/app/api/appointments/[id]/contract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointmentId = params.id;
    const { 
      contractValue, 
      contractType, 
      generateBackOfficeTasks, 
      selectedTaskTemplates,
      createKnowledge,
      contractDetails 
    } = await request.json();

    const result = await prisma.$transaction(async (tx) => {
      // 1. アポイントメント契約完了更新
      const appointment = await tx.appointments.update({
        where: { id: appointmentId },
        data: {
          details: {
            ...appointment.details,
            phaseStatus: 'CONTRACT',
            contractValue,
            contractType,
            contractDate: new Date().toISOString(),
            processingStatus: 'COMPLETED'
          }
        }
      });

      let generatedTasks: any[] = [];
      let knowledgeItem: any = null;

      // 2. バックオフィスタスク生成
      if (generateBackOfficeTasks && selectedTaskTemplates.length > 0) {
        const taskTemplates = getTaskTemplates();
        
        for (const templateId of selectedTaskTemplates) {
          const template = taskTemplates[templateId];
          if (template) {
            const task = await tx.tasks.create({
              data: {
                title: template.title.replace('${companyName}', appointment.companyName),
                description: template.description.replace('${companyName}', appointment.companyName),
                status: template.status,
                priority: template.priority,
                dueDate: calculateDueDate(template.dueDate),
                assignedTo: getAssigneeForTemplate(templateId),
                createdBy: appointment.assignedTo || appointment.createdBy,
                projectId: null, // 後でプロジェクト紐付け可能
                // タグ追加
                tags: [...template.tags, `契約-${appointment.companyName}`],
                // 関連情報
                relatedAppointmentId: appointmentId,
                isBackOfficeTask: true
              }
            });
            generatedTasks.push(task);
          }
        }
      }

      // 3. ナレッジ登録
      if (createKnowledge) {
        knowledgeItem = await tx.knowledge_items.create({
          data: {
            title: `営業成功事例: ${appointment.companyName}`,
            category: 'sales',
            content: generateKnowledgeContent(appointment, contractDetails),
            tags: ['営業', '成功事例', contractType, appointment.companyName],
            authorId: appointment.assignedTo || appointment.createdBy,
            createdBy: appointment.assignedTo || appointment.createdBy,
            assignedTo: appointment.assignedTo,
            likes: 0,
            // 関連情報
            relatedAppointmentId: appointmentId,
            contractValue
          }
        });
      }

      // 4. コネクション状態更新
      await updateConnectionStatus(tx, appointment, 'CLIENT');

      // 5. プロジェクト作成（オプション）
      const project = await tx.projects.create({
        data: {
          name: `${appointment.companyName} プロジェクト`,
          description: `${appointment.companyName}様との契約に基づくプロジェクト`,
          status: 'planning',
          progress: 0,
          startDate: new Date().toISOString(),
          teamMembers: [appointment.assignedTo || 'user1'],
          priority: 'A',
          createdBy: appointment.assignedTo || appointment.createdBy,
          assignedTo: appointment.assignedTo,
          // 契約情報
          contractValue,
          contractType,
          relatedAppointmentId: appointmentId
        }
      });

      // 6. 生成タスクをプロジェクトに紐付け
      if (generatedTasks.length > 0) {
        await tx.tasks.updateMany({
          where: {
            id: { in: generatedTasks.map(t => t.id) }
          },
          data: {
            projectId: project.id
          }
        });
      }

      return { 
        appointment, 
        generatedTasks, 
        knowledgeItem, 
        project,
        summary: {
          tasksGenerated: generatedTasks.length,
          knowledgeCreated: !!knowledgeItem,
          projectCreated: true
        }
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Contract processing failed:', error);
    return NextResponse.json({ error: 'Contract processing failed' }, { status: 500 });
  }
}

// タスクテンプレート定義
function getTaskTemplates() {
  return {
    contract_creation: {
      title: '契約書作成 - ${companyName}',
      description: '${companyName}様との契約書を作成・確認する',
      status: 'PLAN',
      priority: 'A',
      dueDate: '+3days',
      tags: ['契約', 'バックオフィス', '法務']
    },
    invoice_generation: {
      title: '請求書発行 - ${companyName}',
      description: '${companyName}様への請求書を発行する',
      status: 'PLAN',
      priority: 'A', 
      dueDate: '+1day',
      tags: ['請求', 'バックオフィス', '経理']
    },
    kickoff_preparation: {
      title: 'キックオフ準備 - ${companyName}',
      description: '${companyName}様とのプロジェクトキックオフ準備',
      status: 'PLAN',
      priority: 'B',
      dueDate: '+7days',
      tags: ['キックオフ', 'プロジェクト', '準備']
    },
    account_setup: {
      title: 'アカウント設定 - ${companyName}',
      description: '${companyName}様のシステムアカウントを設定',
      status: 'PLAN',
      priority: 'A',
      dueDate: '+2days',
      tags: ['設定', 'テクニカル', 'アカウント']
    },
    onboarding_plan: {
      title: 'オンボーディング計画 - ${companyName}',
      description: '${companyName}様向けオンボーディング計画作成',
      status: 'PLAN',
      priority: 'B',
      dueDate: '+5days',
      tags: ['オンボーディング', '計画', '顧客']
    },
    project_setup: {
      title: 'プロジェクト初期設定 - ${companyName}',
      description: '${companyName}様プロジェクトの初期設定',
      status: 'PLAN',
      priority: 'B',
      dueDate: '+3days',
      tags: ['プロジェクト', '設定', '初期']
    }
  };
}

// 担当者マッピング
function getAssigneeForTemplate(templateId: string): string {
  const assignments = {
    contract_creation: 'legal_team',
    invoice_generation: 'accounting_team',
    kickoff_preparation: 'project_manager',
    account_setup: 'tech_team',
    onboarding_plan: 'customer_success',
    project_setup: 'project_manager'
  };
  
  return assignments[templateId] || 'user1';
}

// 期日計算
function calculateDueDate(dueDateString: string): string {
  const today = new Date();
  const match = dueDateString.match(/^\+(\d+)days?$/);
  
  if (match) {
    const days = parseInt(match[1]);
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + days);
    return dueDate.toISOString().split('T')[0];
  }
  
  return today.toISOString().split('T')[0];
}

// ナレッジコンテンツ生成
function generateKnowledgeContent(appointment: any, contractDetails: any): string {
  return `
# 営業成功事例: ${appointment.companyName}

## 基本情報
- **会社名**: ${appointment.companyName}
- **担当者**: ${appointment.contactName}
- **契約金額**: ${contractDetails.contractValue}万円
- **契約種別**: ${contractDetails.contractType}
- **契約日**: ${new Date().toLocaleDateString('ja-JP')}

## 営業プロセス
- **初回接触**: ${appointment.createdAt ? new Date(appointment.createdAt).toLocaleDateString('ja-JP') : '不明'}
- **アポ実施**: 複数回実施
- **契約成立**: ${new Date().toLocaleDateString('ja-JP')}

## 成功要因
（ここに成功要因を記録してください）

## 提案内容
（ここに提案内容を記録してください）

## 課題・対策
（ここに発生した課題と対策を記録してください）

## 今後の展開
（ここに今後の展開可能性を記録してください）

---
*この情報は契約処理時に自動生成されました。詳細情報を追加してナレッジを充実させてください。*
`;
}
```

---

## 🎯 データベーススキーマ拡張（最終版）

```sql
-- アポイントメント詳細拡張
ALTER TABLE appointments 
ADD COLUMN contract_value DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN contract_type VARCHAR(50) DEFAULT NULL,
ADD COLUMN contract_date TIMESTAMP DEFAULT NULL;

-- タスク拡張（バックオフィス対応）
ALTER TABLE tasks
ADD COLUMN related_appointment_id VARCHAR(255) DEFAULT NULL,
ADD COLUMN is_back_office_task BOOLEAN DEFAULT FALSE,
ADD COLUMN tags JSON DEFAULT NULL,
ADD INDEX idx_tasks_related_appointment (related_appointment_id),
ADD INDEX idx_tasks_back_office (is_back_office_task);

-- ナレッジアイテム拡張
ALTER TABLE knowledge_items
ADD COLUMN related_appointment_id VARCHAR(255) DEFAULT NULL,
ADD COLUMN contract_value DECIMAL(10,2) DEFAULT NULL,
ADD INDEX idx_knowledge_related_appointment (related_appointment_id);

-- プロジェクト拡張
ALTER TABLE projects
ADD COLUMN contract_value DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN contract_type VARCHAR(50) DEFAULT NULL,
ADD COLUMN related_appointment_id VARCHAR(255) DEFAULT NULL,
ADD INDEX idx_projects_related_appointment (related_appointment_id);

-- コネクション状態追跡
ALTER TABLE connections
ADD COLUMN sales_phase VARCHAR(50) DEFAULT NULL,
ADD COLUMN contract_status VARCHAR(50) DEFAULT NULL,
ADD COLUMN last_phase_change TIMESTAMP DEFAULT NULL;
```

---

## 🎉 実装完了指標（究極版）

### **Phase 1完了指標**
✅ 絵文字完全削除・Lucide React統一  
✅ UniversalKanbanCard（アイコン統合版）実装

### **Phase 2完了指標**  
✅ タスクワークフロー高度化完了  
✅ MECE関係性・期限別移動実装

### **Phase 3完了指標**
✅ アポイントメントワークフロー基盤実装  
✅ タブ別カンバン移動による自動ステータス更新

### **Phase 4完了指標**
✅ 営業フェーズ変更・契約処理モーダル実装  
✅ バックオフィスタスク自動生成テンプレート

### **Phase 5完了指標**
✅ 契約処理完全自動化（タスク・ナレッジ・プロジェクト生成）  
✅ 全ワークフロー統合テスト完了  
✅ エラーハンドリング・通知システム完成

この究極実装計画により、営業プロセス全体の完全自動化とシームレスなワークフローが実現されます！

**5週間で完全なエンタープライズレベルの営業・タスク管理システムが完成します。**