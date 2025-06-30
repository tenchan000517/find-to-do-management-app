# 🚀 カンバン統合リファクタリング完全計画書

**作成日**: 2025-06-18  
**対象**: カンバン機能の完全統合とUX改善  
**緊急度**: 高（実行中移動制限問題解決含む）  
**期間**: 2週間（Phase別実装）

---

## 📊 現状分析と問題特定

### **🔍 根本原因の特定**

#### **1. アーキテクチャの問題**
```typescript
// 現在の実装 - 分離されたコンポーネント
kanbanView === 'status' → EnhancedTaskKanban（✅ 改善済み）
kanbanView === 'user' → UserKanbanBoard（❌ 旧実装）
kanbanView === 'project' → ProjectKanbanBoard（❌ 旧実装）  
kanbanView === 'deadline' → DeadlineKanbanBoard（❌ 旧実装）
```

**問題**: 改善されたUX機能（視覚的フィードバック、ローディング管理、デバウンス）が**ステータスタブのみ**に適用されている

#### **2. 実行中移動制限問題の原因**
- **旧カンバンコンポーネント**では独自のドラッグ&ドロップ処理
- **useKanbanMove統合フック**を使用していない
- **楽観的更新**と**エラーハンドリング**が不統一

#### **3. タブ間データ一貫性の問題**
```typescript
// データマッピングの不整合
handleUserTaskMove: { userId: newUserId }        // ❌ 古いプロパティ
handleProjectTaskMove: { projectId: newProjectId } // ✅ 正しい
EnhancedTaskKanban: { assignedTo: newValue }     // ✅ 正しい
```

---

## 🎯 統合リファクタリング戦略

### **Phase 1: 統合アーキテクチャ構築（1週間）**

#### **1.1 UniversalTaskKanban コンポーネント作成**

```typescript
// src/components/tasks/UniversalTaskKanban.tsx
interface UniversalTaskKanbanProps {
  tasks: Task[];
  kanbanType: 'status' | 'user' | 'project' | 'deadline';
  users?: User[];
  projects?: Project[];
  onTaskMove: (taskId: string, newValue: string) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
}

export function UniversalTaskKanban({ 
  tasks, 
  kanbanType, 
  users = [], 
  projects = [],
  onTaskMove,
  onTaskEdit,
  onTaskDelete,
  onTaskUpdate
}: UniversalTaskKanbanProps) {
  
  // 🚀 改善済み機能をすべて継承
  const { moveItem, isMoving, dragLoading, rollbackLastMove, canRollback } = useKanbanMove({
    enableOptimisticUpdate: true,
    showToastMessages: true,
    debounceDelay: 300,
    onSuccess: (data) => console.log('移動成功:', data),
    onError: (error) => console.error('移動エラー:', error)
  });

  // 🎯 カンバンタイプ別のカラム定義
  const getColumns = useCallback(() => {
    switch (kanbanType) {
      case 'status':
        return STATUS_COLUMNS; // 既存の6段階ステータス
      
      case 'user':
        return [
          { id: 'unassigned', title: '未割り当て', color: 'bg-gray-100' },
          ...users.map(user => ({
            id: user.id,
            title: user.name,
            color: 'bg-blue-100',
            avatar: user.avatar
          }))
        ];
      
      case 'project':
        return [
          { id: 'no_project', title: 'プロジェクト未設定', color: 'bg-gray-100' },
          ...projects.map(project => ({
            id: project.id,
            title: project.name,
            color: 'bg-green-100',
            status: project.status
          }))
        ];
      
      case 'deadline':
        return [
          { id: 'overdue', title: '期限切れ', color: 'bg-red-100' },
          { id: 'today', title: '今日', color: 'bg-yellow-100' },
          { id: 'this_week', title: '今週', color: 'bg-blue-100' },
          { id: 'this_month', title: '今月', color: 'bg-green-100' },
          { id: 'later', title: 'それ以降', color: 'bg-purple-100' },
          { id: 'no_deadline', title: '期限なし', color: 'bg-gray-100' }
        ];
    }
  }, [kanbanType, users, projects]);

  // 🔄 統合されたドラッグ&ドロップ処理
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const task = tasks.find(t => t.id === active.id);
    if (!task) return;

    const newValue = over.id as string;

    // 🎯 カンバンタイプ別の移動処理
    await handleUnifiedMove(task, newValue);
  };

  // 🚀 統合移動処理（既存の改善を活用）
  const handleUnifiedMove = async (task: Task, newValue: string) => {
    let moveRequest: any;
    
    switch (kanbanType) {
      case 'status':
        // ✅ 既存のステータスフロー処理を完全保持
        await handleStatusChange(task, newValue);
        break;
        
      case 'user':
        // 🔧 新統合API使用
        moveRequest = {
          itemType: 'task' as const,
          itemId: task.id,
          sourceColumn: task.assignedTo || 'unassigned',
          targetColumn: newValue || 'unassigned',
          kanbanType: 'user' as const
        };
        await moveItem(moveRequest);
        onTaskUpdate(task.id, { assignedTo: newValue === 'unassigned' ? null : newValue });
        break;
        
      case 'project':
        // 🔧 新統合API使用
        moveRequest = {
          itemType: 'task' as const,
          itemId: task.id,
          sourceColumn: task.projectId || 'no_project',
          targetColumn: newValue || 'no_project',
          kanbanType: 'project' as const
        };
        await moveItem(moveRequest);
        onTaskUpdate(task.id, { projectId: newValue === 'no_project' ? null : newValue });
        break;
        
      case 'deadline':
        // 🔧 期限計算処理
        const newDueDate = calculateDueDate(newValue);
        moveRequest = {
          itemType: 'task' as const,
          itemId: task.id,
          sourceColumn: getDeadlineCategory(task.dueDate),
          targetColumn: newValue,
          kanbanType: 'deadline' as const
        };
        await moveItem(moveRequest);
        onTaskUpdate(task.id, { dueDate: newDueDate });
        break;
    }
  };

  // ✅ 既存のステータスフロー処理を完全保持
  const handleStatusChange = async (task: Task, newStatus: string) => {
    // EnhancedTaskKanban.tsxの処理をそのまま移植
    // すべてのモーダル処理、条件分岐を含む
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="relative">
        {/* 🚀 統一ローディング表示 */}
        {dragLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50 rounded-lg">
            <div className="bg-white px-4 py-2 rounded-lg shadow-md flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-sm text-gray-700">タスクを移動中...</span>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {getColumns().map(column => (
            <UniversalKanbanColumn
              key={column.id}
              column={column}
              tasks={getTasksByColumn(column.id)}
              kanbanType={kanbanType}
              onTaskEdit={onTaskEdit}
              onTaskUpdate={handleTaskUpdateClick}
            />
          ))}
        </div>
      </div>

      {/* 🚀 統一ドラッグオーバーレイ */}
      <DragOverlay>
        {activeTask && (
          <UniversalTaskCard
            task={activeTask}
            kanbanType={kanbanType}
            onEdit={() => {}}
            onUpdate={() => {}}
          />
        )}
      </DragOverlay>

      {/* ✅ 既存モーダル群をすべて保持 */}
      <StatusTransitionModals />
    </DndContext>
  );
}
```

#### **1.2 UniversalKanbanColumn コンポーネント**

```typescript
// src/components/tasks/UniversalKanbanColumn.tsx
interface UniversalKanbanColumnProps {
  column: KanbanColumn;
  tasks: Task[];
  kanbanType: 'status' | 'user' | 'project' | 'deadline';
  onTaskEdit: (task: Task) => void;
  onTaskUpdate: (taskId: string) => void;
}

export function UniversalKanbanColumn({ 
  column, 
  tasks, 
  kanbanType, 
  onTaskEdit, 
  onTaskUpdate 
}: UniversalKanbanColumnProps) {
  
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const IconComponent = getColumnIcon(column, kanbanType);

  return (
    <div className="bg-gray-50 rounded-lg p-4 min-h-96 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <IconComponent className="w-5 h-5 text-gray-600" />
          <h2 className="font-semibold text-gray-800">{column.title}</h2>
          <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
        
        {/* 🚀 統一視覚的フィードバック */}
        {isOver && (
          <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">
            移動
          </span>
        )}
      </div>

      <div 
        ref={setNodeRef} 
        className={`
          flex-1 space-y-3 transition-all duration-200
          ${isOver ? 'bg-blue-100 ring-2 ring-blue-300 border-blue-400 border-2 border-dashed rounded-lg' : ''}
        `}
      >
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <UniversalTaskCard
              key={task.id}
              task={task}
              kanbanType={kanbanType}
              onEdit={onTaskEdit}
              onUpdate={() => onTaskUpdate(task.id)}
            />
          ))}
        </SortableContext>
        
        {/* 🚀 統一空カラムヒント */}
        {isOver && tasks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-blue-500 text-sm bg-blue-50 bg-opacity-75 rounded-lg border-2 border-dashed border-blue-300">
            タスクをドロップ
          </div>
        )}
      </div>
    </div>
  );
}
```

#### **1.3 UniversalTaskCard コンポーネント**

```typescript
// src/components/tasks/UniversalTaskCard.tsx
interface UniversalTaskCardProps {
  task: Task;
  kanbanType: 'status' | 'user' | 'project' | 'deadline';
  onEdit: (task: Task) => void;
  onUpdate: () => void;
}

export function UniversalTaskCard({ 
  task, 
  kanbanType, 
  onEdit, 
  onUpdate 
}: UniversalTaskCardProps) {
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 🎯 カンバンタイプ別の表示情報
  const getDisplayInfo = () => {
    switch (kanbanType) {
      case 'status':
        return {
          primaryInfo: task.status,
          secondaryInfo: task.priority,
          color: getStatusColor(task.status)
        };
      case 'user':
        return {
          primaryInfo: task.assignedTo || '未割り当て',
          secondaryInfo: task.status,
          color: 'bg-blue-100'
        };
      case 'project':
        return {
          primaryInfo: task.projectId || 'プロジェクト未設定',
          secondaryInfo: task.status,
          color: 'bg-green-100'
        };
      case 'deadline':
        return {
          primaryInfo: task.dueDate || '期限なし',
          secondaryInfo: getDeadlineUrgency(task.dueDate),
          color: getDeadlineColor(task.dueDate)
        };
    }
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-50 rotate-5 bg-white rounded-lg border-2 border-dashed border-gray-300 p-4"
      >
        <div className="h-20"></div>
      </div>
    );
  }

  const displayInfo = getDisplayInfo();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing relative group"
    >
      {/* 🚀 統一更新アイコン */}
      <button
        onClick={onUpdate}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-100 rounded"
        title="タスクを更新"
      >
        <Edit className="w-4 h-4 text-gray-500" />
      </button>

      {/* 🎯 カンバンタイプ別優先度表示 */}
      <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)} mb-2`}>
        <Flag className="w-3 h-3 inline mr-1" />
        {task.priority}
      </div>

      {/* 🚀 統一タスクタイトル */}
      <h3 
        className="font-medium text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
        onClick={() => onEdit(task)}
      >
        {task.title}
      </h3>

      {/* 🎯 カンバンタイプ別詳細情報 */}
      <div className="space-y-2">
        {renderTypeSpecificInfo(task, kanbanType)}
      </div>

      {/* 🚀 統一サマリー表示 */}
      {task.summary && (
        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
          {task.summary}
        </p>
      )}
    </div>
  );
}
```

### **Phase 2: 既存コンポーネント置き換え（1週間）**

#### **2.1 tasks/page.tsx の完全リファクタリング**

```typescript
// src/app/tasks/page.tsx - 統合版
export default function TasksPage() {
  const { tasks, loading, addTask, updateTask, deleteTask, refreshTasks } = useTasks();
  const { users } = useUsers();
  const { projects } = useProjects();
  
  const [filter, setFilter] = useState<'all' | 'A' | 'B' | 'C' | 'D'>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [kanbanView, setKanbanView] = useState<'status' | 'user' | 'project' | 'deadline' | 'relationships'>('status');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.priority === filter);

  // 🚀 統一タスク移動ハンドラー
  const handleTaskMove = async (taskId: string, newValue: string) => {
    switch (kanbanView) {
      case 'status':
        await updateTask(taskId, { status: newValue as Task['status'] });
        break;
      case 'user':
        await updateTask(taskId, { assignedTo: newValue === 'unassigned' ? null : newValue });
        break;
      case 'project':
        await updateTask(taskId, { projectId: newValue === 'no_project' ? null : newValue });
        break;
      case 'deadline':
        const newDueDate = calculateDueDate(newValue);
        await updateTask(taskId, { dueDate: newDueDate });
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      {/* 🚀 統一ヘッダー（既存維持） */}
      <TaskPageHeader 
        viewMode={viewMode}
        setViewMode={setViewMode}
        filter={filter}
        setFilter={setFilter}
        onNewTask={() => setShowModal(true)}
      />

      {viewMode === 'kanban' ? (
        <div>
          {/* 🚀 統一タブナビゲーション */}
          <UnifiedKanbanTabs 
            activeTab={kanbanView}
            onTabChange={setKanbanView}
          />

          {/* 🚀 統一カンバンコンポーネント */}
          {kanbanView === 'relationships' ? (
            <MECERelationshipManager
              tasks={filteredTasks}
              onTaskUpdate={updateTask}
            />
          ) : (
            <UniversalTaskKanban
              tasks={filteredTasks}
              kanbanType={kanbanView}
              users={users}
              projects={projects}
              onTaskMove={handleTaskMove}
              onTaskEdit={(task) => {
                setEditingTask(task);
                setShowModal(true);
              }}
              onTaskDelete={deleteTask}
              onTaskUpdate={updateTask}
            />
          )}
        </div>
      ) : (
        <TaskListView tasks={filteredTasks} /> // 既存のリストビュー
      )}

      {/* 🚀 統一モーダル */}
      <TaskModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTask(null);
        }}
        editingTask={editingTask}
        users={users}
        projects={projects}
        onSubmit={handleSubmit}
        onDataRefresh={refreshTasks}
      />
    </div>
  );
}
```

#### **2.2 旧コンポーネントの段階的廃止**

```typescript
// 🗑️ 廃止予定コンポーネント（Phase 2で削除）
- UserKanbanBoard.tsx → UniversalTaskKanban に統合
- ProjectKanbanBoard.tsx → UniversalTaskKanban に統合  
- DeadlineKanbanBoard.tsx → UniversalTaskKanban に統合
- KanbanBoard.tsx → UniversalTaskKanban に統合

// ✅ 保持するコンポーネント
- EnhancedTaskKanban.tsx → UniversalTaskKanban のベースとして活用
- MECERelationshipManager.tsx → 独立機能として保持
```

---

## 🔧 技術的改善ポイント

### **1. データ一貫性の確保**

```typescript
// src/lib/types/task.ts - 統一タスクタイプ
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'IDEA' | 'PLAN' | 'DO' | 'CHECK' | 'COMPLETE' | 'KNOWLEDGE';
  priority: 'A' | 'B' | 'C' | 'D';
  
  // 🔧 統一プロパティ名
  assignedTo: string | null;  // userId ではなく assignedTo
  projectId: string | null;
  dueDate: string | null;
  
  // 🚀 新規フィールド
  summary?: string;
  improvementNotes?: string;
  
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
}
```

### **2. API エンドポイントの統一**

```typescript
// src/app/api/kanban/move/route.ts - 拡張
export async function POST(request: Request) {
  const { itemType, itemId, sourceColumn, targetColumn, kanbanType } = await request.json();

  switch (kanbanType) {
    case 'status':
      return await handleStatusMove(itemId, targetColumn);
    case 'user':
      return await handleUserMove(itemId, targetColumn);
    case 'project':
      return await handleProjectMove(itemId, targetColumn);
    case 'deadline':
      return await handleDeadlineMove(itemId, targetColumn);
    default:
      return NextResponse.json({ success: false, error: '未対応のカンバンタイプ' });
  }
}
```

### **3. エラーハンドリングの強化**

```typescript
// src/lib/hooks/useUnifiedKanban.ts
export const useUnifiedKanban = (kanbanType: KanbanType) => {
  const [error, setError] = useState<string | null>(null);
  
  const handleError = useCallback((error: unknown, action: string) => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    setError(`${action}に失敗しました: ${message}`);
    
    // ユーザーフレンドリーなエラー表示
    if (message.includes('timeout')) {
      setError('処理に時間がかかっています。しばらくお待ちください。');
    } else if (message.includes('network')) {
      setError('ネットワークエラーが発生しました。接続を確認してください。');
    }
  }, []);

  return { error, handleError, clearError: () => setError(null) };
};
```

---

## 🚀 実装完了指標

### **Phase 1 完了指標**
- ✅ UniversalTaskKanban コンポーネント実装
- ✅ すべてのカンバンタイプで統一UX適用
- ✅ 既存モーダル機能の完全保持
- ✅ TypeScript エラー解消

### **Phase 2 完了指標**  
- ✅ tasks/page.tsx の完全統合
- ✅ 旧コンポーネントの削除
- ✅ データプロパティの統一
- ✅ 実行中移動制限問題の完全解決

### **最終検証項目**
1. **機能検証**
   - [ ] 全タブでドラッグ&ドロップ動作確認
   - [ ] ステータスフローの完全動作確認
   - [ ] モーダル群の正常動作確認

2. **UX検証**  
   - [ ] 視覚的フィードバックの統一性確認
   - [ ] ローディング状態の適切な表示
   - [ ] エラーハンドリングの動作確認

3. **パフォーマンス検証**
   - [ ] 大量タスクでの動作確認
   - [ ] デバウンス機能の効果確認
   - [ ] メモリリークの検証

---

## ⚠️ 重要な注意事項

### **破壊しないべき既存機能**
1. ✅ **ステータスフローの完全保持**: 現在のEnhancedTaskKanbanの処理をそのまま移植
2. ✅ **モーダル群の機能保持**: 期限設定、サマリー入力、完了処理モーダルをすべて保持
3. ✅ **UX改善の保持**: 視覚的フィードバック、ローディング管理、デバウンス機能
4. ✅ **API統合**: useKanbanMove フックと統合API使用

### **実装時の優先順位**
1. **最優先**: 実行中移動制限問題の解決
2. **高**: UniversalTaskKanban の実装
3. **中**: 旧コンポーネントの置き換え
4. **低**: UI/UXの微調整

---

## 🎯 成功の定義

このリファクタリングが成功したと判断する基準：

1. **問題解決**: 実行中タスクの移動制限問題が完全解決
2. **機能統一**: 全タブで同等のUX（視覚的フィードバック、ローディング、エラーハンドリング）
3. **コード品質**: 単一コンポーネントによる保守性向上
4. **ユーザー体験**: タブ間の一貫した操作感の実現

**このリファクタリングにより、カンバン機能が真に統一され、メンテナンス性と拡張性が大幅に向上します。**

---

**次のエンジニアへ**: この計画書に従って実装することで、現在の問題を根本的に解決し、長期的に保守しやすいアーキテクチャを構築できます。Phase 1から順次実装し、各フェーズで動作確認を行ってください。