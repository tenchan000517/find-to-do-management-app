# UI/UXカンバン改善プロジェクト - フェーズごと完璧実装計画書

**作成日**: 2025-06-17  
**最終更新**: 要件最大化・時系列精度向上版  
**対象**: カレンダー・タスク・アポイント・プロジェクトページUI/UX統一改善  
**期間**: 5週間（Phase別実装）  
**目的**: 統一UI・高度ワークフロー・営業プロセス完全自動化・要件最大化

---

## 📋 プロジェクト全体概要

### 🎯 最大化された要件（時系列分析結果）

#### 精度向上要素（ULTIMATE → FINAL → COMPLETE → IMPLEMENT順）
1. **ワークフロー精度**: 後期ほど高精度（営業フェーズ・契約処理）
2. **アニメーション詳細**: 後期ほど詳細実装（マイクロインタラクション）
3. **アポイントメントフロー**: 段階的充実（基本 → 高度 → 完全自動化）

#### 復活・強化要素（記憶落ちから回復）
1. **タスクワークフロー**: 全段階で完全実装（DELETEカンバン廃止等）
2. **MECE関係性**: 関係性可視化・ドラッグ作成機能
3. **カレンダー日付移動**: 日付マス間ドラッグ&ドロップ
4. **バックオフィス連携**: 契約処理からのタスク自動生成

### 🏗️ 統合アーキテクチャ
```
共通UIコンポーネント基盤
    ↓
タスクワークフロー ← → MECE関係性システム
    ↓                    ↓
カレンダー日付移動 ← → アポイントメント自動化
    ↓                    ↓
    バックオフィス連携・契約処理
```

---

## 📈 Phase 1: アイコン統一・共通UI基盤構築（1週間）

### 🎯 目標
絵文字完全削除・Lucide React統一・共通コンポーネント基盤構築

### 📅 デイリースケジュール

#### **Day 1: アイコン統一実装**
**AM (4時間)**
```typescript
// src/lib/icons.ts - 統一アイコン定義
import {
  // ナビゲーション
  Calendar, Users, FolderOpen, MessageSquare, BookOpen, BarChart3,
  
  // アクション  
  Plus, Edit, Trash2, Save, X, Check,
  
  // ステータス
  Circle, Clock, PlayCircle, PauseCircle, CheckCircle, AlertCircle,
  
  // タスク専用
  Target,      // IDEA
  Lightbulb,   // PLAN
  Play,        // DO
  AlertTriangle, // CHECK
  Archive,     // COMPLETE
  Brain,       // KNOWLEDGE
  RotateCcw,   // Update/Reschedule
  
  // MECE関係性
  Link, GitBranch, Copy,
  
  // その他
  ChevronDown, ChevronRight, Settings, Filter, Search
} from 'lucide-react';

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

**PM (4時間)**
- 既存ファイルの絵文字検索・一括置換
- 実在アイコン検証・エラー修正
- TypeScriptエラー0件確認

#### **Day 2: UniversalKanbanCard実装**
**AM (4時間)**
```typescript
// src/components/ui/UniversalKanbanCard.tsx
interface UniversalKanbanCardProps<T> {
  item: T;
  type: 'task' | 'appointment' | 'project' | 'calendar';
  onEdit: (item: T) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string) => void;
  customActions?: React.ReactNode;
  showMECEIcon?: boolean;
  draggable?: boolean;
}

// タスクカード専用実装
const TaskCardContent = ({ task, onUpdate, showMECEIcon }) => {
  const StatusIcon = TASK_STATUS_ICONS[task.status];
  const PriorityIcon = PRIORITY_ICONS[task.priority];

  return (
    <div className="space-y-3">
      {/* ヘッダー行 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <StatusIcon className="w-4 h-4 text-blue-600" />
          <PriorityIcon className="w-3 h-3" />
        </div>
        
        <div className="flex items-center space-x-1">
          {/* MECE関係性アイコン */}
          {showMECEIcon && (
            <Link className="w-4 h-4 text-purple-500 cursor-pointer" />
          )}
          
          {/* 更新アイコン */}
          {onUpdate && (
            <button onClick={() => onUpdate(task.id)}>
              <RotateCcw className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* タスク内容 */}
      <h4 className="font-medium text-sm text-gray-900">{task.title}</h4>
      
      {task.dueDate && (
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(task.dueDate)}</span>
        </div>
      )}
    </div>
  );
};
```

**PM (4時間)**
- アポイントメント・プロジェクト・カレンダーカード実装
- カード統一デザイン適用

#### **Day 3: UniversalKanban実装**
**AM (4時間)**
```typescript
// src/components/ui/UniversalKanban.tsx
interface UniversalKanbanProps<T> {
  columns: KanbanColumn[];
  items: T[];
  itemType: 'task' | 'appointment' | 'project';
  onItemMove: (itemId: string, newColumnId: string) => void;
  onItemEdit: (item: T) => void;
  renderCard: (item: T) => React.ReactNode;
  enableAddCards?: boolean;
  onAddCard?: (columnId: string) => void;
}

export function UniversalKanban<T extends { id: string }>({
  columns,
  items,
  itemType,
  onItemMove,
  renderCard,
  enableAddCards = true,
  onAddCard
}: UniversalKanbanProps<T>) {
  
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    onItemMove(active.id as string, over.id as string);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {columns.map(column => (
          <KanbanColumn 
            key={column.id}
            column={column}
            items={items.filter(item => getItemColumn(item) === column.id)}
            renderCard={renderCard}
            enableAddCard={enableAddCards}
            onAddCard={onAddCard}
          />
        ))}
      </div>
    </DndContext>
  );
}
```

**PM (4時間)**
- ドラッグ&ドロップ統合
- アニメーション実装

#### **Day 4: AddCardButton・基本アニメーション**
**AM (4時間)**
```typescript
// src/components/ui/AddCardButton.tsx
export function AddCardButton({ 
  columnId, 
  columnTitle, 
  itemType, 
  onAdd, 
  disabled = false 
}: AddCardButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      className={cn(
        'w-full p-4 border-2 border-dashed border-gray-300',
        'rounded-lg transition-all duration-200',
        'hover:border-blue-400 hover:bg-blue-50',
        'focus:outline-none focus:ring-2 focus:ring-blue-500'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onAdd(columnId)}
    >
      <div className="flex flex-col items-center space-y-2">
        <div className={cn(
          'w-8 h-8 rounded-full border-2 border-gray-400',
          'flex items-center justify-center transition-all duration-200',
          isHovered && 'border-blue-500 bg-blue-500 text-white scale-110'
        )}>
          <Plus className="w-4 h-4" />
        </div>
        <span>
          {itemType === 'task' ? 'タスク' : 
           itemType === 'appointment' ? 'アポ' : 
           itemType === 'project' ? 'プロジェクト' : 'アイテム'}を追加
        </span>
      </div>
    </button>
  );
}
```

**PM (4時間)**
```css
/* src/styles/kanban-animations.css */
:root {
  --kanban-primary: #3b82f6;
  --animation-fast: 150ms;
  --animation-normal: 200ms;
  --animation-slow: 300ms;
}

.kanban-card {
  @apply bg-white rounded-lg border border-gray-200 p-4;
  @apply transition-all duration-200 ease-out;
  @apply hover:shadow-lg hover:-translate-y-0.5;
}

.kanban-card.dragging {
  @apply opacity-50 scale-105 rotate-2;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

@keyframes slideInFromTop {
  from { opacity: 0; transform: translateY(-20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.add-card-enter {
  animation: slideInFromTop 0.3s ease-out;
}
```

#### **Day 5: 既存TaskKanbanBoard移行・テスト**
**AM (4時間)**
- TaskKanbanBoard.tsxの UniversalKanban移行
- 既存機能100%維持確認

**PM (4時間)**
- 統合テスト・エラー修正
- TypeScript・ESLintエラー0件確認

### ✅ Phase 1完了指標
- [ ] 絵文字完全削除済み
- [ ] Lucide React統一実装済み
- [ ] UniversalKanbanCard動作確認
- [ ] UniversalKanban基本機能動作
- [ ] AddCardButton全カンバン配置
- [ ] 基本アニメーション実装
- [ ] 既存TaskKanbanBoard移行完了
- [ ] TypeScript・ESLintエラー0件

---

## 🔄 Phase 2: タスクワークフロー高度化（1週間）

### 🎯 目標
高度なタスクステータスフロー・DELETEカンバン廃止・タブ別移動実装

### 📅 デイリースケジュール

#### **Day 1: Enhanced TaskKanban基盤**
**AM (4時間)**
```typescript
// src/components/tasks/EnhancedTaskKanban.tsx
export function EnhancedTaskKanban() {
  const [dueDateModal, setDueDateModal] = useState(null);
  const [summaryModal, setSummaryModal] = useState(null);
  const [completionModal, setCompletionModal] = useState(null);
  const [updateModal, setUpdateModal] = useState(null);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const task = findTaskById(taskId);
    const newStatus = over.id as string;
    
    // タブ別処理分岐
    switch (kanbanView) {
      case 'status':
        await handleStatusChange(task, newStatus);
        break;
      case 'user':
        await handleUserChange(taskId, newStatus);
        break;
      case 'project':
        await handleProjectChange(taskId, newStatus);
        break;
      case 'deadline':
        await handleDeadlineChange(taskId, newStatus);
        break;
    }
  };

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
        
      case 'CHECK_TO_COMPLETE':
        setCompletionModal({
          isOpen: true,
          taskId: task.id,
          type: 'archive'
        });
        break;
        
      case 'CHECK_TO_DO':
        setSummaryModal({
          isOpen: true,
          taskId: task.id,
          fromStatus: 'CHECK'
        });
        break;
    }
  };
}
```

**PM (4時間)**
- ユーザー・プロジェクト・期限別移動ハンドラー実装

#### **Day 2: 期日設定モーダル**
**AM (4時間)**
```typescript
// src/components/tasks/DueDateModal.tsx
export function DueDateModal({ 
  isOpen, 
  taskId, 
  targetStatus, 
  onSave, 
  onClose 
}: DueDateModalProps) {
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
            期日設定して実行中へ
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

**PM (4時間)**
- サマリー入力モーダル実装
- 完了処理モーダル実装

#### **Day 3: タスク更新モーダル（DELETEカンバン置き換え）**
**AM (4時間)**
```typescript
// src/components/tasks/TaskUpdateModal.tsx
export function TaskUpdateModal({ 
  isOpen, 
  task, 
  onSave, 
  onClose 
}: TaskUpdateModalProps) {
  const [actionType, setActionType] = useState<'reset' | 'improve' | 'delete'>('reset');
  const [improvementNotes, setImprovementNotes] = useState('');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="タスク更新" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
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
      </form>
    </Modal>
  );
}
```

**PM (4時間)**
- DELETEカンバン完全削除
- 更新アイコンUIテスト

#### **Day 4-5: タブ別カンバン移動システム完成**
**Day 4 AM (4時間)**
```typescript
// 期限別カンバン移動処理
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
```

**Day 4 PM - Day 5 (12時間)**
- AppointmentKanbanBoard.tsxの移行
- 全タブ動作テスト・エラー修正

### ✅ Phase 2完了指標
- [ ] Enhanced TaskKanban実装完了
- [ ] 期日設定モーダル動作
- [ ] タスク更新モーダル実装
- [ ] DELETEカンバン完全削除
- [ ] タブ別移動処理実装
- [ ] AppointmentKanbanBoard移行
- [ ] 全モーダル動作確認

---

## 🔗 Phase 3: MECE関係性・カレンダー日付移動（1週間）

### 🎯 目標
MECE関係性システム・カレンダー日付マス移動・ドラッグ&ドロップ拡張

### 📅 デイリースケジュール

#### **Day 1-2: MECE関係性システム実装**
**Day 1 AM (4時間)**
```sql
-- データベーススキーマ作成
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
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);
```

**Day 1 PM (4時間)**
```typescript
// src/components/tasks/MECERelationshipManager.tsx
export function MECERelationshipManager() {
  const [relationships, setRelationships] = useState<TaskRelationship[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const handleMECEDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleProjectDrop = async (projectId: string) => {
    if (!draggedTask) return;

    try {
      const relationshipData = {
        sourceTaskId: draggedTask.id,
        targetProjectId: projectId,
        relationshipType: 'TRANSFERABLE'
      };

      await createTaskRelationship(relationshipData);
      await loadRelatedTasks(projectId);
      
      showNotification('success', 'MECE関係性を作成しました');
    } catch (error) {
      showNotification('error', '関係性の作成に失敗しました');
    }
  };

  return (
    <div className="space-y-4">
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
```

**Day 2 (8時間)**
- API実装 (`/api/task-relationships`)
- 関係性可視化コンポーネント完成

#### **Day 3-4: カレンダー日付移動システム**
**Day 3 AM (4時間)**
```typescript
// src/components/calendar/DraggableCalendarCell.tsx
export function DraggableCalendarCell({ 
  date, 
  events, 
  onEventDrop 
}: DraggableCalendarCellProps) {
  const [isHovered, setIsHovered] = useState(false);

  const { setNodeRef } = useDroppable({
    id: `calendar-cell-${date}`,
    data: { date }
  });

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
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900">
          {new Date(date).getDate()}
        </span>
        {isHovered && (
          <CalendarDays className="w-4 h-4 text-blue-500" />
        )}
      </div>

      <div className="space-y-1">
        {events.map(event => (
          <DraggableEvent 
            key={event.id}
            event={event}
          />
        ))}
      </div>
    </div>
  );
}
```

**Day 3 PM - Day 4 (12時間)**
- ドラッグ可能イベントコンポーネント実装
- 統合カレンダーAPI拡張

#### **Day 5: 統合テスト・調整**
**全日 (8時間)**
- MECE関係性・カレンダー移動統合テスト
- エラー修正・パフォーマンス最適化

### ✅ Phase 3完了指標
- [ ] MECE関係性データベース作成
- [ ] 関係性ドラッグ作成機能動作
- [ ] 関係性可視化表示
- [ ] カレンダー日付マス移動実装
- [ ] 全イベント種別対応
- [ ] API連携動作確認
- [ ] 統合テスト完了

---

## 💼 Phase 4: アポイントメント営業フェーズ・契約処理（1週間）

### 🎯 目標
営業フェーズ自動変更・契約処理モーダル・バックオフィスタスク自動生成

### 📅 デイリースケジュール

#### **Day 1-2: アポイントメントワークフロー基盤**
**Day 1 (8時間)**
```typescript
// src/components/appointments/EnhancedAppointmentKanban.tsx
export function EnhancedAppointmentKanban({
  kanbanType,
  onAppointmentMove,
}: AppointmentKanbanProps) {
  
  const [appointmentModal, setAppointmentModal] = useState<{
    isOpen: boolean;
    type: 'schedule' | 'complete' | 'contract';
    appointment: Appointment | null;
    targetStatus: string | null;
  }>({
    isOpen: false,
    type: 'schedule',
    appointment: null,
    targetStatus: null
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const appointment = findAppointmentById(active.id as string);
    const newColumn = over.id as string;
    
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

  const handlePhaseMove = async (appointment: Appointment, newColumn: string) => {
    if (newColumn === 'CONTRACT') {
      setAppointmentModal({
        isOpen: true,
        type: 'contract',
        appointment,
        targetStatus: 'CONTRACT'
      });
      return;
    }
    
    await updateAppointmentPhaseStatus(appointment.id, newColumn);
    showNotification('success', '営業フェーズを更新しました');
  };

  return (
    <div>
      <UniversalKanban
        columns={getAppointmentColumns(kanbanType)}
        items={appointments}
        itemType="appointment"
        onItemMove={handleDragEnd}
        renderCard={(appointment) => (
          <UniversalKanbanCard 
            item={appointment} 
            type="appointment"
            onEdit={onAppointmentEdit}
          />
        )}
      />

      <AppointmentFlowModal
        isOpen={appointmentModal.isOpen}
        type={appointmentModal.type}
        appointment={appointmentModal.appointment}
        onClose={() => setAppointmentModal(prev => ({ ...prev, isOpen: false }))}
        onContract={handleContractProcessing}
      />
    </div>
  );
}
```

**Day 2 (8時間)**
- 関係性・処理状況・流入経路タブ実装
- 自動ステータス更新処理完成

#### **Day 3-4: 契約処理・バックオフィス連携**
**Day 3 (8時間)**
```typescript
// src/components/appointments/ContractProcessingForm.tsx
const ContractProcessingForm = ({ appointment, onSubmit, onCancel }) => {
  const [contractValue, setContractValue] = useState('');
  const [contractType, setContractType] = useState('');
  const [generateBackOfficeTasks, setGenerateBackOfficeTasks] = useState(true);
  const [selectedTaskTemplates, setSelectedTaskTemplates] = useState([
    'contract_creation',
    'invoice_generation', 
    'kickoff_preparation',
    'account_setup'
  ]);

  const taskTemplates = [
    { id: 'contract_creation', name: '契約書作成', priority: 'A', dueDate: '+3days' },
    { id: 'invoice_generation', name: '請求書発行', priority: 'A', dueDate: '+1day' },
    { id: 'kickoff_preparation', name: 'キックオフ準備', priority: 'B', dueDate: '+7days' },
    { id: 'account_setup', name: 'アカウント設定', priority: 'A', dueDate: '+2days' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
        <h3 className="text-xl font-semibold text-gray-900">
          契約成立おめでとうございます！
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
          />
          <label>バックオフィスタスクを自動生成</label>
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
                    className="mr-3"
                  />
                  <div>
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
    </form>
  );
};
```

**Day 4 (8時間)**
- 完了処理フォーム実装（営業フェーズ変更付き）
- アポイントメント日程設定フォーム実装

#### **Day 5: アポイントメント統合完成**
**全日 (8時間)**
- アポイントメントページ統合実装
- 通知システム実装
- 動作テスト・エラー修正

### ✅ Phase 4完了指標
- [ ] Enhanced AppointmentKanban実装
- [ ] タブ別自動ステータス更新
- [ ] 契約処理モーダル実装
- [ ] バックオフィスタスク生成UI
- [ ] 営業フェーズ変更機能
- [ ] 通知システム実装
- [ ] 全タブ動作確認

---

## 🏭 Phase 5: バックオフィス連携・統合テスト（1週間）

### 🎯 目標
バックオフィスタスク自動生成API・統合テスト・エラーハンドリング完成

### 📅 デイリースケジュール

#### **Day 1-2: バックオフィス自動生成API実装**
**Day 1 (8時間)**
```typescript
// src/app/api/appointments/[id]/contract/route.ts
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
      createKnowledge 
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
            contractDate: new Date().toISOString()
          }
        }
      });

      let generatedTasks: any[] = [];

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
                tags: [...template.tags, `契約-${appointment.companyName}`],
                relatedAppointmentId: appointmentId,
                isBackOfficeTask: true
              }
            });
            generatedTasks.push(task);
          }
        }
      }

      // 3. ナレッジ登録
      let knowledgeItem = null;
      if (createKnowledge) {
        knowledgeItem = await tx.knowledge_items.create({
          data: {
            title: `営業成功事例: ${appointment.companyName}`,
            category: 'sales',
            content: generateKnowledgeContent(appointment, { contractValue, contractType }),
            tags: ['営業', '成功事例', contractType, appointment.companyName],
            authorId: appointment.assignedTo || appointment.createdBy,
            relatedAppointmentId: appointmentId,
            contractValue
          }
        });
      }

      // 4. プロジェクト作成
      const project = await tx.projects.create({
        data: {
          name: `${appointment.companyName} プロジェクト`,
          description: `${appointment.companyName}様との契約に基づくプロジェクト`,
          status: 'planning',
          progress: 0,
          startDate: new Date().toISOString(),
          teamMembers: [appointment.assignedTo || 'user1'],
          priority: 'A',
          contractValue,
          contractType,
          relatedAppointmentId: appointmentId
        }
      });

      // 5. 生成タスクをプロジェクトに紐付け
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
    }
  };
}
```

**Day 2 (8時間)**
- ナレッジ自動生成機能実装
- コネクション状態自動更新処理実装

#### **Day 3: データベーススキーマ最終実装**
**全日 (8時間)**
```sql
-- 最終的なデータベーススキーマ拡張実行
ALTER TABLE tasks 
ADD COLUMN summary TEXT DEFAULT NULL,
ADD COLUMN improvement_notes TEXT DEFAULT NULL,
ADD COLUMN related_appointment_id VARCHAR(255) DEFAULT NULL,
ADD COLUMN is_back_office_task BOOLEAN DEFAULT FALSE,
ADD COLUMN tags JSON DEFAULT NULL;

ALTER TABLE appointments 
ADD COLUMN contract_value DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN contract_type VARCHAR(50) DEFAULT NULL,
ADD COLUMN contract_date TIMESTAMP DEFAULT NULL;

ALTER TABLE calendar_events 
ADD COLUMN source VARCHAR(50) DEFAULT 'manual',
ADD COLUMN related_appointment_id VARCHAR(255) DEFAULT NULL;

ALTER TABLE knowledge_items
ADD COLUMN related_appointment_id VARCHAR(255) DEFAULT NULL,
ADD COLUMN contract_value DECIMAL(10,2) DEFAULT NULL;

ALTER TABLE projects
ADD COLUMN contract_value DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN contract_type VARCHAR(50) DEFAULT NULL,
ADD COLUMN related_appointment_id VARCHAR(255) DEFAULT NULL;

-- インデックス追加
CREATE INDEX idx_tasks_related_appointment ON tasks(related_appointment_id);
CREATE INDEX idx_tasks_back_office ON tasks(is_back_office_task);
CREATE INDEX idx_calendar_events_source ON calendar_events(source);
CREATE INDEX idx_knowledge_related_appointment ON knowledge_items(related_appointment_id);
CREATE INDEX idx_projects_related_appointment ON projects(related_appointment_id);
```

#### **Day 4-5: 統合テスト・品質管理**
**Day 4 (8時間)**
- 全機能統合テスト実施
- エラーハンドリング強化
- パフォーマンス最適化

**Day 5 (8時間)**
- 最終品質チェック
- ドキュメント更新
- ロールバック手順確立

### ✅ Phase 5完了指標
- [ ] バックオフィス自動生成API実装
- [ ] ナレッジ自動登録機能
- [ ] プロジェクト自動作成
- [ ] データベーススキーマ完成
- [ ] 統合テスト完了
- [ ] エラーハンドリング実装
- [ ] 品質基準達成

---

## 🎯 最終完了指標・品質基準

### 📊 機能完了チェックリスト

#### UI統一性 (100%必須)
- [ ] 絵文字完全削除済み
- [ ] Lucide React統一実装済み
- [ ] 共通カンバンコンポーネント動作
- [ ] +カード追加ボタン全カンバン配置
- [ ] マイクロアニメーション統一実装
- [ ] レスポンシブ対応完了

#### タスクワークフロー (100%必須)
- [ ] ステータス移動フロー完全実装
- [ ] 期日設定モーダル動作
- [ ] DELETEカンバン完全廃止
- [ ] 更新アイコン・リスケモーダル実装
- [ ] タブ別カンバン移動動作

#### MECE関係性 (100%必須)
- [ ] MECE関係性データベース作成
- [ ] ドラッグによる関係性作成動作
- [ ] 関係性可視化表示
- [ ] API連携完了

#### カレンダー日付移動 (100%必須)
- [ ] 日付マス間ドラッグ&ドロップ動作
- [ ] 全イベント種別対応
- [ ] 適切なAPI連携

#### アポイントメント完全自動化 (100%必須)
- [ ] タブ別自動ステータス更新
- [ ] 日程管理モーダル実装
- [ ] 契約処理・バックオフィス連携
- [ ] ナレッジ自動登録
- [ ] 営業フェーズ自動変更

### 🔧 品質基準 (すべて必須)
- [ ] TypeScriptエラー 0件
- [ ] ESLintエラー 0件
- [ ] ビルド成功 100%
- [ ] 全ブラウザ動作確認（Chrome/Firefox/Safari/Edge）
- [ ] モバイル・デスクトップ動作確認
- [ ] パフォーマンス要件達成（レスポンス < 200ms）

### 🗄️ データ整合性 (100%必須)
- [ ] 既存データ100%保持
- [ ] 既存機能100%動作
- [ ] API互換性100%維持
- [ ] データベーススキーマ拡張完了

---

## 📚 開発者リファレンス

### 🛠️ 開発開始前の必須手順
```bash
# 1. 作業前状態保存
git status
git add .
git commit -m "Phase X開始前状態保存"

# 2. 品質チェック（エラーがあれば解消してから開始）
npx tsc --noEmit  # TypeScriptエラー: 0件必須
npm run lint      # ESLintエラー: 0件必須
npm run build     # ビルド成功必須

# 3. 開発サーバー起動
npm run dev
```

### 📋 各Phase完了時の必須チェック
```bash
# 品質チェック
npm run typecheck    # 0件必須
npm run lint         # 0件必須  
npm run build        # 成功必須

# 動作確認
# 1. 実装機能の動作テスト
# 2. 既存機能の破綻チェック
# 3. レスポンシブ動作確認
# 4. エラーハンドリング確認

# 状態保存
git add .
git commit -m "Phase X完了 - 機能実装完了・品質基準達成"
```

### 🚨 緊急時のロールバック手順
```bash
# 各Phaseの開始前コミットに戻る
git log --oneline | grep "Phase"
git reset --hard <COMMIT_HASH>

# または直前の安定状態に戻る
git reset --hard HEAD~1
```

---

## 🏆 期待される成果

この完璧なフェーズ実装計画により、以下が実現されます：

### ✨ ユーザー体験の向上
- **統一された直感的操作**: 4ページ完全統一UI
- **高度なワークフロー**: タスク・アポイント自動化
- **美しいアニメーション**: マイクロインタラクション完備
- **完璧なレスポンシブ**: 全デバイス最適化

### 🛠️ 開発効率の向上
- **共通コンポーネント**: コード重複削減・保守性向上
- **一貫したAPI**: 開発速度向上
- **完全な型安全性**: TypeScriptエラー0件維持

### 💼 営業プロセスの完全自動化
- **アポイントメント日程管理**: カンバン移動での自動化
- **契約処理**: バックオフィスタスク自動生成
- **ナレッジ蓄積**: 営業成功事例の自動登録
- **プロジェクト連携**: 契約からプロジェクト自動作成

### 📈 システム価値の最大化
- **MECE関係性**: タスク間関係の可視化・活用
- **カレンダー統合**: 完全な統合スケジュール管理
- **品質保証**: エラー0件・100%動作保証

---

**5週間で、エンタープライズレベルの完全な営業・タスク管理システムが完成します。**

*作成者: Claude Code*  
*最終更新: 2025-06-17*  
*実装開始: Phase 1から順次実行推奨*