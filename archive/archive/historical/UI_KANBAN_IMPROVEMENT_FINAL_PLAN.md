# 🎨 カレンダー・タスク・アポイント・プロジェクトページ UI改善最終実装計画書

**作成日**: 2025-06-17  
**最終更新**: フィードバック反映版  
**対象**: カレンダー、タスク、アポイント、プロジェクトページのUI/UX統一改善 + 高度なワークフロー実装  
**期間**: 4週間（Phase別実装）  
**目的**: 統一UI・高度なタスクフロー・カレンダー日付移動・MECE関係性・アポイントメント日程管理実装

---

## 📊 フィードバック反映済み要件定義

### **1. アイコンシステム統一**
- **❌ 絵文字禁止**: 🚀📋📅等のすべての絵文字を削除
- **✅ Lucide React使用**: 実在するアイコンのみ使用
- **✅ エラー防止**: 存在しないアイコン名の事前検証

### **2. カレンダー機能要件**
- **❌ 日付変更での自動反映**: 不要（既に実装済み）
- **✅ カレンダー日付マス移動**: 日付マスからドラッグ&ドロップで該当日付変更

### **3. タスクステータスフロー詳細仕様**
```typescript
interface TaskStatusFlow {
  // アイデア → 計画中
  IDEA_TO_PLAN: {
    action: 'ステータス更新のみ';
    result: 'status: PLAN';
  };
  
  // 計画中 → 実行中  
  PLAN_TO_DO: {
    condition: 'dueDate必須チェック';
    noDateAction: 'アラート/トースト表示 → 日付設定モーダル';
    result: 'status: DO + dueDate設定';
  };
  
  // 実行中 → 課題改善
  DO_TO_CHECK: {
    action: 'ステータス更新のみ';
    result: 'status: CHECK';
  };
  
  // 課題改善 → 完了
  CHECK_TO_COMPLETE: {
    options: ['アーカイブ化', 'ナレッジ化'];
    archiveAction: 'status: COMPLETE';
    knowledgeAction: 'ナレッジ待機カンバンに移動 + 詳細入力ボタン表示';
  };
  
  // 課題改善 → 実行中（戻り）
  CHECK_TO_DO: {
    required: 'サマリー入力モーダル';
    result: 'status: DO + summary保存';
  };
}
```

### **4. DELETEカンバン廃止・更新アイコン実装**
```typescript
interface TaskUpdateFlow {
  // リスケカンバン廃止
  DELETE_COLUMN: 'REMOVED';
  
  // カード内更新アイコン
  updateIcon: {
    position: 'カード右上';
    onClick: 'リスケモーダル表示';
    options: [
      '期日リセット + アイデアに戻す（そのまま）',
      '改善項目記入 + 実行中へ移動',
      'リスケ（削除）'
    ];
  };
}
```

### **5. タブ別カンバン移動仕様**
```typescript
interface TabSpecificKanbanFlow {
  // ユーザー別タブ
  userTab: {
    dragAction: 'カンバン間移動で担当者変更';
    result: 'assignedTo更新';
  };
  
  // プロジェクト別タブ  
  projectTab: {
    dragAction: 'カンバン間移動でプロジェクト紐付け変更';
    result: 'projectId更新';
  };
  
  // 期限別タブ
  deadlineTab: {
    columns: ['期限切れ', '今日', '来週', '来月'];
    moveActions: {
      '期限切れ → 今日': 'dueDate = today',
      '今日 → 来週': 'dueDate = today + 7日',
      '来週 → 来月': 'dueDate = nextMonth'
    };
  };
}
```

### **6. MECEアイコン・タスク関係性システム**
```typescript
interface MECETaskRelationship {
  meceIcon: {
    type: 'ドラッグ可能アイコン';
    function: '共通プロジェクトへの紐付け';
    表現対象: ['転用可能タスク', '同時完了タスク'];
  };
  
  relationshipTypes: {
    TRANSFERABLE: '転用可能タスク';
    SIMULTANEOUS: '同時完了タスク';
    DEPENDENT: '依存関係タスク';
  };
  
  database: {
    table: 'task_relationships';
    fields: ['sourceTaskId', 'targetTaskId', 'relationshipType', 'projectId'];
  };
}
```

---

## 🛠️ Phase別実装計画（最終版）

### **Phase 1: アイコン統一・基盤構築（1週間）**

#### **1.1 Lucide React完全移行**
```typescript
// src/lib/icons.ts - 使用アイコン一覧（実在チェック済み）
import {
  // ナビゲーション
  Calendar,
  Users,
  FolderOpen,
  MessageSquare,
  BookOpen,
  BarChart3,
  
  // アクション
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Check,
  
  // ステータス
  Circle,
  Clock,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  AlertCircle,
  
  // UI
  ChevronDown,
  ChevronRight,
  Settings,
  Filter,
  Search,
  
  // タスク専用
  Target,      // IDEA
  Lightbulb,   // PLAN  
  Play,        // DO
  AlertTriangle, // CHECK
  Archive,     // COMPLETE/Archive
  Brain,       // KNOWLEDGE
  RotateCcw,   // Update/Reschedule
  
  // MECE関係性
  Link,        // MECE関係性アイコン
  GitBranch,   // 依存関係
  Copy,        // 転用可能
  
  // カレンダー
  CalendarDays,
  CalendarCheck,
  
  // プロジェクト
  Rocket,
  Building,
  
  // 通知
  Bell,
  Info,
  CheckCircle2,
  XCircle
} from 'lucide-react';

// アイコンマッピング
export const TASK_STATUS_ICONS = {
  IDEA: Target,
  PLAN: Lightbulb,
  DO: Play,
  CHECK: AlertTriangle,
  COMPLETE: CheckCircle,
  KNOWLEDGE: Brain
} as const;

export const PRIORITY_ICONS = {
  A: AlertCircle,
  B: Circle,
  C: Clock,
  D: PauseCircle
} as const;
```

#### **1.2 統一カンバンカード（アイコン統合版）**
```typescript
// src/components/ui/UniversalKanbanCard.tsx
import { TASK_STATUS_ICONS, PRIORITY_ICONS } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface UniversalKanbanCardProps<T> {
  item: T;
  type: 'task' | 'appointment' | 'project' | 'calendar';
  onEdit: (item: T) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string) => void; // NEW: 更新アイコン用
  customActions?: React.ReactNode;
  showMECEIcon?: boolean; // NEW: MECE関係性表示
  draggable?: boolean;
}

// タスクカード専用コンポーネント
const TaskCardContent = ({ task, onUpdate, showMECEIcon }: {
  task: Task;
  onUpdate?: (id: string) => void;
  showMECEIcon?: boolean;
}) => {
  const StatusIcon = TASK_STATUS_ICONS[task.status];
  const PriorityIcon = PRIORITY_ICONS[task.priority];

  return (
    <div className="space-y-3">
      {/* ヘッダー行 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <StatusIcon className="w-4 h-4 text-blue-600" />
          <PriorityIcon className={cn(
            'w-3 h-3',
            task.priority === 'A' ? 'text-red-500' :
            task.priority === 'B' ? 'text-yellow-500' :
            task.priority === 'C' ? 'text-orange-500' : 'text-green-500'
          )} />
        </div>
        
        <div className="flex items-center space-x-1">
          {/* NEW: MECE関係性アイコン */}
          {showMECEIcon && (
            <div className="relative group">
              <Link 
                className="w-4 h-4 text-purple-500 cursor-pointer hover:text-purple-700"
                title="MECE関係性あり"
              />
              <div className="absolute -top-8 right-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                関係性あり
              </div>
            </div>
          )}
          
          {/* NEW: 更新アイコン */}
          {onUpdate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(task.id);
              }}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              title="タスク更新"
            >
              <RotateCcw className="w-4 h-4 text-gray-600 hover:text-blue-600" />
            </button>
          )}
        </div>
      </div>

      {/* タスクタイトル */}
      <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
        {task.title}
      </h4>

      {/* 期限表示 */}
      {task.dueDate && (
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(task.dueDate)}</span>
        </div>
      )}

      {/* 担当者表示 */}
      {task.assignee && (
        <div className="flex items-center space-x-2">
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: task.assignee.color }}
          >
            {task.assignee.name.charAt(0)}
          </div>
          <span className="text-xs text-gray-600">{task.assignee.name}</span>
        </div>
      )}
    </div>
  );
};

export function UniversalKanbanCard<T extends { id: string }>({
  item,
  type,
  onEdit,
  onDelete,
  onUpdate,
  customActions,
  showMECEIcon = false,
  draggable = true
}: UniversalKanbanCardProps<T>) {
  
  return (
    <div className={cn(
      'bg-white rounded-lg border border-gray-200 p-4 shadow-sm',
      'hover:shadow-md transition-all duration-200',
      'cursor-pointer group',
      draggable && 'cursor-grab active:cursor-grabbing'
    )}>
      {/* カード種別に応じた表示 */}
      {type === 'task' && (
        <TaskCardContent 
          task={item as Task} 
          onUpdate={onUpdate}
          showMECEIcon={showMECEIcon}
        />
      )}
      
      {type === 'appointment' && (
        <AppointmentCardContent appointment={item as Appointment} />
      )}
      
      {type === 'project' && (
        <ProjectCardContent project={item as Project} />
      )}

      {/* アクションボタン */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <div className="flex space-x-1">
          <button
            onClick={() => onEdit(item)}
            className="p-1 rounded hover:bg-blue-50 text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Edit className="w-3 h-3" />
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(item.id)}
              className="p-1 rounded hover:bg-red-50 text-red-600 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        
        {customActions}
      </div>
    </div>
  );
}
```

### **Phase 2: タスクワークフロー高度化（1週間）**

#### **2.1 タスクステータス移動拡張処理**
```typescript
// src/components/tasks/EnhancedTaskKanban.tsx
export function EnhancedTaskKanban() {
  const [dueDateModal, setDueDateModal] = useState<{
    isOpen: boolean;
    taskId: string;
    targetStatus: string;
  } | null>(null);
  
  const [summaryModal, setSummaryModal] = useState<{
    isOpen: boolean;
    taskId: string;
    fromStatus: string;
  } | null>(null);
  
  const [completionModal, setCompletionModal] = useState<{
    isOpen: boolean;
    taskId: string;
    type: 'archive' | 'knowledge';
  } | null>(null);
  
  const [updateModal, setUpdateModal] = useState<{
    isOpen: boolean;
    task: Task;
  } | null>(null);

  // 拡張されたドラッグ終了ハンドラー
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const task = findTaskById(taskId);
    const newStatus = over.id as string;
    
    if (!task) return;

    // タブ別処理
    if (kanbanView === 'user') {
      await handleUserChange(taskId, newStatus);
      return;
    }
    
    if (kanbanView === 'project') {
      await handleProjectChange(taskId, newStatus);
      return;
    }
    
    if (kanbanView === 'deadline') {
      await handleDeadlineChange(taskId, newStatus);
      return;
    }

    // ステータス別フロー処理
    if (kanbanView === 'status') {
      await handleStatusChange(task, newStatus);
    }
  };

  // ステータス変更フロー
  const handleStatusChange = async (task: Task, newStatus: string) => {
    switch (`${task.status}_TO_${newStatus}`) {
      case 'IDEA_TO_PLAN':
        await updateTaskStatus(task.id, 'PLAN');
        break;
        
      case 'PLAN_TO_DO':
        if (!task.dueDate) {
          setDueDateModal({
            isOpen: true,
            taskId: task.id,
            targetStatus: 'DO'
          });
          return;
        }
        await updateTaskStatus(task.id, 'DO');
        break;
        
      case 'DO_TO_CHECK':
        await updateTaskStatus(task.id, 'CHECK');
        break;
        
      case 'CHECK_TO_COMPLETE':
        setCompletionModal({
          isOpen: true,
          taskId: task.id,
          type: 'archive' // デフォルト
        });
        break;
        
      case 'CHECK_TO_DO':
        setSummaryModal({
          isOpen: true,
          taskId: task.id,
          fromStatus: 'CHECK'
        });
        break;
        
      default:
        await updateTaskStatus(task.id, newStatus);
    }
  };

  // ユーザー変更処理
  const handleUserChange = async (taskId: string, newUserId: string) => {
    await updateTask(taskId, { assignedTo: newUserId });
    showNotification('success', '担当者を変更しました');
  };

  // プロジェクト変更処理  
  const handleProjectChange = async (taskId: string, newProjectId: string) => {
    await updateTask(taskId, { projectId: newProjectId || null });
    showNotification('success', 'プロジェクトを変更しました');
  };

  // 期限変更処理
  const handleDeadlineChange = async (taskId: string, newDeadlineCategory: string) => {
    const newDueDate = calculateDueDate(newDeadlineCategory);
    await updateTask(taskId, { dueDate: newDueDate });
    showNotification('success', '期限を変更しました');
  };

  const calculateDueDate = (category: string): string => {
    const today = new Date();
    switch (category) {
      case '今日':
        return today.toISOString().split('T')[0];
      case '来週':
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        return nextWeek.toISOString().split('T')[0];
      case '来月':
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        return nextMonth.toISOString().split('T')[0];
      default:
        return today.toISOString().split('T')[0];
    }
  };

  // タスク更新アイコンハンドラー
  const handleTaskUpdate = (taskId: string) => {
    const task = findTaskById(taskId);
    if (task) {
      setUpdateModal({
        isOpen: true,
        task
      });
    }
  };

  return (
    <div>
      {/* カンバンビュー */}
      <UniversalKanban
        columns={getColumns(kanbanView)}
        items={filteredTasks}
        itemType="task"
        onItemMove={handleDragEnd}
        renderCard={(task) => (
          <HoverCard hoverEffect="lift">
            <UniversalKanbanCard 
              item={task} 
              type="task"
              onEdit={handleTaskEdit}
              onDelete={handleTaskDelete}
              onUpdate={handleTaskUpdate}
              showMECEIcon={hasTaskRelationships(task.id)}
            />
          </HoverCard>
        )}
        enableAddCards={true}
        onAddCard={handleAddTask}
      />

      {/* モーダル群 */}
      <DueDateModal
        isOpen={dueDateModal?.isOpen || false}
        taskId={dueDateModal?.taskId || ''}
        targetStatus={dueDateModal?.targetStatus || ''}
        onSave={handleDueDateSave}
        onClose={() => setDueDateModal(null)}
      />
      
      <SummaryModal
        isOpen={summaryModal?.isOpen || false}
        taskId={summaryModal?.taskId || ''}
        fromStatus={summaryModal?.fromStatus || ''}
        onSave={handleSummarySave}
        onClose={() => setSummaryModal(null)}
      />
      
      <CompletionModal
        isOpen={completionModal?.isOpen || false}
        taskId={completionModal?.taskId || ''}
        onComplete={handleTaskCompletion}
        onClose={() => setCompletionModal(null)}
      />
      
      <TaskUpdateModal
        isOpen={updateModal?.isOpen || false}
        task={updateModal?.task || null}
        onSave={handleUpdateSave}
        onClose={() => setUpdateModal(null)}
      />
    </div>
  );
}
```

#### **2.2 期日設定モーダル**
```typescript
// src/components/tasks/DueDateModal.tsx
interface DueDateModalProps {
  isOpen: boolean;
  taskId: string;
  targetStatus: string;
  onSave: (taskId: string, dueDate: string, targetStatus: string) => void;
  onClose: () => void;
}

export function DueDateModal({ isOpen, taskId, targetStatus, onSave, onClose }: DueDateModalProps) {
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'A' | 'B' | 'C' | 'D'>('C');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dueDate) {
      onSave(taskId, dueDate, targetStatus);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="期日設定が必要です" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center text-yellow-600 mb-4">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">実行中に移行するには期日の設定が必要です</p>
        </div>

        <FormField label="期日" required>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="form-input"
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </FormField>

        <FormField label="優先度">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="form-input"
          >
            <option value="A">最優先</option>
            <option value="B">重要</option>
            <option value="C">緊急</option>
            <option value="D">要検討</option>
          </select>
        </FormField>

        <div className="flex space-x-3 pt-4">
          <Button type="submit" variant="primary" className="flex-1">
            <Check className="w-4 h-4 mr-2" />
            期日設定して実行中へ
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            <X className="w-4 h-4 mr-2" />
            キャンセル
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

#### **2.3 タスク更新モーダル（リスケ対応）**
```typescript
// src/components/tasks/TaskUpdateModal.tsx
interface TaskUpdateModalProps {
  isOpen: boolean;
  task: Task | null;
  onSave: (taskId: string, action: UpdateAction, data: any) => void;
  onClose: () => void;
}

interface UpdateAction {
  type: 'reset' | 'improve' | 'delete';
  data?: any;
}

export function TaskUpdateModal({ isOpen, task, onSave, onClose }: TaskUpdateModalProps) {
  const [actionType, setActionType] = useState<'reset' | 'improve' | 'delete'>('reset');
  const [improvementNotes, setImprovementNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    const actionData = {
      type: actionType,
      data: actionType === 'improve' ? { improvementNotes } : null
    };

    onSave(task.id, actionData, {});
    onClose();
  };

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="タスク更新" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">{task.title}</h4>
          <p className="text-sm text-blue-700">このタスクをどのように更新しますか？</p>
        </div>

        <div className="space-y-3">
          <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              value="reset"
              checked={actionType === 'reset'}
              onChange={(e) => setActionType(e.target.value as any)}
              className="mr-3"
            />
            <div className="flex items-center">
              <RotateCcw className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <div className="font-medium">期日リセット</div>
                <div className="text-sm text-gray-600">期日をリセットしてアイデアに戻す</div>
              </div>
            </div>
          </label>

          <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              value="improve"
              checked={actionType === 'improve'}
              onChange={(e) => setActionType(e.target.value as any)}
              className="mr-3"
            />
            <div className="flex items-center">
              <Play className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <div className="font-medium">改善して実行</div>
                <div className="text-sm text-gray-600">改善項目を記入して実行中へ移動</div>
              </div>
            </div>
          </label>

          <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              value="delete"
              checked={actionType === 'delete'}
              onChange={(e) => setActionType(e.target.value as any)}
              className="mr-3"
            />
            <div className="flex items-center">
              <Trash2 className="w-5 h-5 text-red-600 mr-2" />
              <div>
                <div className="font-medium">削除</div>
                <div className="text-sm text-gray-600">このタスクを削除</div>
              </div>
            </div>
          </label>
        </div>

        {actionType === 'improve' && (
          <FormField label="改善項目" required>
            <textarea
              value={improvementNotes}
              onChange={(e) => setImprovementNotes(e.target.value)}
              placeholder="どのような改善を行いますか？"
              rows={3}
              className="form-input"
              required
            />
          </FormField>
        )}

        <div className="flex space-x-3 pt-4">
          <Button type="submit" variant="primary" className="flex-1">
            <Check className="w-4 h-4 mr-2" />
            実行
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            <X className="w-4 h-4 mr-2" />
            キャンセル
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

### **Phase 3: MECE関係性・カレンダー日付移動（1週間）**

#### **3.1 MECE関係性システム**
```typescript
// src/components/tasks/MECERelationshipManager.tsx
interface TaskRelationship {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  relationshipType: 'TRANSFERABLE' | 'SIMULTANEOUS' | 'DEPENDENT';
  projectId?: string;
  createdAt: string;
}

export function MECERelationshipManager() {
  const [relationships, setRelationships] = useState<TaskRelationship[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [targetProject, setTargetProject] = useState<Project | null>(null);

  // MECEアイコンドラッグ開始
  const handleMECEDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  // プロジェクトにドロップ
  const handleProjectDrop = async (projectId: string) => {
    if (!draggedTask) return;

    try {
      const relationshipData = {
        sourceTaskId: draggedTask.id,
        targetProjectId: projectId,
        relationshipType: 'TRANSFERABLE'
      };

      await createTaskRelationship(relationshipData);
      
      // 関連タスクを表示
      await loadRelatedTasks(projectId);
      
      showNotification('success', 'MECE関係性を作成しました');
    } catch (error) {
      showNotification('error', '関係性の作成に失敗しました');
    } finally {
      setDraggedTask(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* MECE関係性可視化 */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-medium mb-3 flex items-center">
          <GitBranch className="w-5 h-5 mr-2 text-purple-600" />
          MECE関係性マップ
        </h3>
        
        <div className="space-y-3">
          {relationships.map(rel => (
            <RelationshipCard key={rel.id} relationship={rel} />
          ))}
        </div>
      </div>

      {/* ドラッグ可能なMECEアイコン */}
      <div className="flex space-x-2">
        <DraggableMECEIcon 
          type="TRANSFERABLE"
          onDragStart={handleMECEDragStart}
        />
        <DraggableMECEIcon 
          type="SIMULTANEOUS"
          onDragStart={handleMECEDragStart}
        />
        <DraggableMECEIcon 
          type="DEPENDENT"
          onDragStart={handleMECEDragStart}
        />
      </div>
    </div>
  );
}

// ドラッグ可能MECEアイコン
const DraggableMECEIcon = ({ type, onDragStart }: {
  type: 'TRANSFERABLE' | 'SIMULTANEOUS' | 'DEPENDENT';
  onDragStart: (task: Task) => void;
}) => {
  const iconMap = {
    TRANSFERABLE: Copy,
    SIMULTANEOUS: Link,
    DEPENDENT: GitBranch
  };
  
  const Icon = iconMap[type];
  
  return (
    <div
      draggable
      onDragStart={() => onDragStart}
      className="p-2 bg-purple-100 rounded-lg cursor-grab hover:bg-purple-200 transition-colors"
      title={`${type}関係性を作成`}
    >
      <Icon className="w-6 h-6 text-purple-600" />
    </div>
  );
};
```

#### **3.2 カレンダー日付移動システム**
```typescript
// src/components/calendar/DraggableCalendarCell.tsx
interface DraggableCalendarCellProps {
  date: string;
  events: UnifiedCalendarEvent[];
  onDateDrop: (eventId: string, newDate: string) => void;
  onEventDrop: (eventId: string, newDate: string) => void;
}

export function DraggableCalendarCell({ 
  date, 
  events, 
  onDateDrop, 
  onEventDrop 
}: DraggableCalendarCellProps) {
  const [isHovered, setIsHovered] = useState(false);

  const { setNodeRef } = useDroppable({
    id: `calendar-cell-${date}`,
    data: { date }
  });

  const handleDrop = (event: any) => {
    const droppedEventId = event.active.id;
    const droppedEvent = events.find(e => e.id === droppedEventId);
    
    if (droppedEvent && droppedEvent.date !== date) {
      // 日付変更処理
      onEventDrop(droppedEventId, date);
      
      // 元の種別に応じて適切なAPIを呼び出し
      updateEventDate(droppedEvent, date);
    }
  };

  const updateEventDate = async (event: UnifiedCalendarEvent, newDate: string) => {
    try {
      switch (event.source) {
        case 'task':
          const taskId = event.id.replace('task-', '');
          await fetch(`/api/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dueDate: newDate })
          });
          break;
          
        case 'appointment':
          const appointmentId = event.id.replace('appointment-', '');
          await fetch(`/api/appointments/${appointmentId}/schedule`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              dateTime: `${newDate}T${event.time}:00` 
            })
          });
          break;
          
        case 'event':
          const eventId = event.id.replace('event-', '');
          await fetch(`/api/calendar/events/${eventId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: newDate })
          });
          break;
          
        case 'personal':
          const personalId = event.id.replace('personal-', '');
          await fetch(`/api/schedules/${personalId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: newDate })
          });
          break;
      }
      
      showNotification('success', '日付を変更しました');
    } catch (error) {
      showNotification('error', '日付変更に失敗しました');
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[120px] border border-gray-200 p-2',
        'transition-colors duration-200',
        isHovered && 'bg-blue-50 border-blue-300'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 日付ヘッダー */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">
          {new Date(date).getDate()}
        </span>
        {isHovered && (
          <CalendarDays className="w-4 h-4 text-blue-500" />
        )}
      </div>

      {/* イベント一覧 */}
      <div className="space-y-1">
        {events.map(event => (
          <DraggableEvent 
            key={event.id}
            event={event}
            onDragStart={() => {}}
          />
        ))}
      </div>
    </div>
  );
}

// ドラッグ可能イベント
const DraggableEvent = ({ event, onDragStart }: {
  event: UnifiedCalendarEvent;
  onDragStart: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getEventIcon = () => {
    switch (event.source) {
      case 'task': return Target;
      case 'appointment': return Users;
      case 'event': return Calendar;
      case 'personal': return CalendarCheck;
      default: return Circle;
    }
  };

  const EventIcon = getEventIcon();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'text-xs p-2 rounded border-l-2 cursor-grab',
        'hover:shadow-sm transition-shadow',
        isDragging && 'opacity-50',
        event.source === 'task' && 'bg-blue-50 border-l-blue-500',
        event.source === 'appointment' && 'bg-green-50 border-l-green-500',
        event.source === 'event' && 'bg-purple-50 border-l-purple-500',
        event.source === 'personal' && 'bg-yellow-50 border-l-yellow-500'
      )}
    >
      <div className="flex items-center space-x-1">
        <EventIcon className="w-3 h-3" />
        <span className="truncate">{event.title}</span>
      </div>
      <div className="text-gray-500 mt-1">{event.time}</div>
    </div>
  );
};
```

### **Phase 4: アポイントメント日程管理・統合テスト（1週間）**

#### **4.1 アポイントメント処理システム（既存機能維持）**
```typescript
// src/components/appointments/EnhancedAppointmentFlow.tsx
export function EnhancedAppointmentFlow() {
  // 既存のアポイントメント機能はすべて維持
  // ただし、アイコンをLucide Reactに統一

  const handleAppointmentSchedule = async (appointmentId: string) => {
    // calendar_eventsへの自動登録は日付変更で自動反映されるため
    // ここではアポイントメント側のステータス更新のみ
    await updateAppointmentStatus(appointmentId, 'IN_PROGRESS');
  };

  return (
    <UniversalKanban
      // 既存の実装を維持、アイコンのみ更新
      renderCard={(appointment) => (
        <UniversalKanbanCard 
          item={appointment}
          type="appointment"
          // Lucide Reactアイコン使用
        />
      )}
    />
  );
}
```

---

## 🎨 実装完了指標（最終版）

### **Phase 1完了指標**
✅ 絵文字完全削除・Lucide React統一  
✅ UniversalKanbanCard（アイコン統合版）実装  
✅ エラー防止のための実在アイコン検証

### **Phase 2完了指標**
✅ タスクステータスフロー高度化完了  
✅ DELETEカンバン廃止・更新アイコン実装  
✅ 期日設定・サマリー入力・完了処理モーダル群

### **Phase 3完了指標**
✅ MECE関係性システム実装  
✅ カレンダー日付マス移動機能  
✅ タブ別カンバン移動処理（ユーザー・プロジェクト・期限）

### **Phase 4完了指標**
✅ 全ページUI統一完了  
✅ アポイントメント機能維持・アイコン統一  
✅ 統合テスト・エラーハンドリング完成  
✅ モバイル・デスクトップ両対応

---

## 🛠️ データベーススキーマ拡張

```sql
-- タスク関係性テーブル（MECE対応）
CREATE TABLE task_relationships (
  id VARCHAR(255) PRIMARY KEY,
  source_task_id VARCHAR(255) NOT NULL,
  target_task_id VARCHAR(255),
  project_id VARCHAR(255),
  relationship_type ENUM('TRANSFERABLE', 'SIMULTANEOUS', 'DEPENDENT') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  
  FOREIGN KEY (source_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (target_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  
  INDEX idx_task_relationships_source (source_task_id),
  INDEX idx_task_relationships_target (target_task_id),
  INDEX idx_task_relationships_project (project_id)
);

-- タスクにサマリーフィールド追加
ALTER TABLE tasks 
ADD COLUMN summary TEXT DEFAULT NULL,
ADD COLUMN improvement_notes TEXT DEFAULT NULL;

-- カレンダーイベントにソース追加
ALTER TABLE calendar_events 
ADD COLUMN source VARCHAR(50) DEFAULT 'manual';
```

この最終実装計画により、フィードバックをすべて反映した高度なワークフローシステムが実現されます！

実装開始準備が完了しました。