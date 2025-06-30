# フロントエンド仕様書

## 1. フロントエンド概要

### 1.1 基本情報
- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: React Hooks + Custom Hooks
- **UI コンポーネント**: カスタムコンポーネント
- **レスポンシブ**: モバイルファースト設計
- **PWA対応**: Progressive Web App

### 1.2 ディレクトリ構造

```
src/
├── app/                     # Next.js App Router
│   ├── (auth)/             # 認証関連ページ
│   ├── analytics/          # 分析ダッシュボード
│   ├── appointments/       # アポイント管理
│   ├── calendar/           # カレンダー機能
│   ├── connections/        # 人脈管理
│   ├── dashboard/          # 各種ダッシュボード
│   ├── knowledge/          # ナレッジ管理
│   ├── mobile/             # モバイル専用ページ
│   ├── projects/           # プロジェクト管理
│   ├── tasks/              # タスク管理
│   └── layout.tsx          # ルートレイアウト
│
├── components/             # 再利用可能コンポーネント
│   ├── ui/                 # 基本UIコンポーネント
│   ├── dashboard/          # ダッシュボード専用
│   ├── tasks/              # タスク管理専用
│   ├── projects/           # プロジェクト管理専用
│   ├── calendar/           # カレンダー専用
│   └── mobile/             # モバイル専用
│
├── hooks/                  # カスタムフック
│   ├── useTasks.ts         # タスク管理
│   ├── useProjects.ts      # プロジェクト管理
│   ├── useCalendarEvents.ts # カレンダー
│   └── useConnections.ts   # 人脈管理
│
├── lib/                    # ユーティリティ
│   ├── auth.ts             # 認証設定
│   ├── prisma.ts           # データベース
│   └── utils.ts            # 共通関数
│
└── types/                  # 型定義
    ├── database.ts         # DB型定義
    ├── api.ts              # API型定義
    └── components.ts       # コンポーネント型定義
```

### 1.3 デザインシステム

#### カラーパレット
```css
:root {
  /* Primary Colors */
  --primary-50: #eff6ff;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;

  /* Secondary Colors */
  --secondary-50: #f8fafc;
  --secondary-500: #64748b;
  --secondary-600: #475569;

  /* Status Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #06b6d4;

  /* Task Status Colors */
  --status-idea: #94a3b8;
  --status-plan: #3b82f6;
  --status-do: #f59e0b;
  --status-check: #8b5cf6;
  --status-complete: #10b981;
  --status-knowledge: #06b6d4;
}
```

#### タイポグラフィ
```css
/* Font Sizes */
.text-xs { font-size: 0.75rem; }    /* 12px */
.text-sm { font-size: 0.875rem; }   /* 14px */
.text-base { font-size: 1rem; }     /* 16px */
.text-lg { font-size: 1.125rem; }   /* 18px */
.text-xl { font-size: 1.25rem; }    /* 20px */
.text-2xl { font-size: 1.5rem; }    /* 24px */
.text-3xl { font-size: 1.875rem; }  /* 30px */

/* Font Weights */
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
```

#### スペーシング
```css
/* Spacing Scale */
.space-1 { margin/padding: 0.25rem; }  /* 4px */
.space-2 { margin/padding: 0.5rem; }   /* 8px */
.space-3 { margin/padding: 0.75rem; }  /* 12px */
.space-4 { margin/padding: 1rem; }     /* 16px */
.space-6 { margin/padding: 1.5rem; }   /* 24px */
.space-8 { margin/padding: 2rem; }     /* 32px */
```

## 2. ページ仕様

### 2.1 ダッシュボード系

#### / (メインダッシュボード)
**概要**: システムの統合ダッシュボード

**主要機能**:
- タスク・プロジェクト・アポイント・カレンダーの統合表示
- リアルタイムメトリクス
- AI推奨アクション
- 緊急度の高いタスク表示
- 今日の予定一覧

**コンポーネント構成**:
```tsx
<Dashboard>
  <MetricsCards />
  <TasksSummary />
  <ProjectsOverview />
  <UpcomingEvents />
  <QuickActions />
  <AIRecommendations />
</Dashboard>
```

**データ取得**:
```typescript
// カスタムフック使用例
const { tasks, isLoading: tasksLoading } = useTasks();
const { projects, isLoading: projectsLoading } = useProjects();
const { events, isLoading: eventsLoading } = useCalendarEvents();
const { connections } = useConnections();
```

#### /dashboard/sales-analytics
**概要**: 営業分析ダッシュボード

**主要機能**:
- 営業パフォーマンス分析
- 成約率・案件進捗
- 顧客分析・LTV計算
- AI予測データ表示

#### /mobile/dashboard
**概要**: モバイル最適化ダッシュボード

**特徴**:
- タッチ操作最適化
- スワイプジェスチャー対応
- オフライン対応
- プッシュ通知連携

### 2.2 タスク管理

#### /tasks
**概要**: タスク管理メインページ

**主要機能**:
- カンバンボード表示
- フィルター・検索
- タスク作成・編集・削除
- ドラッグ&ドロップ操作
- MECE関係性管理

**カンバンボード構成**:
```tsx
<TasksKanban>
  <Column status="IDEA" title="アイデア" />
  <Column status="PLAN" title="計画" />
  <Column status="DO" title="実行中" />
  <Column status="CHECK" title="確認" />
  <Column status="COMPLETE" title="完了" />
</TasksKanban>
```

**フィルター機能**:
```typescript
interface TaskFilter {
  status?: task_status[];
  priority?: priority[];
  assignedTo?: string[];
  projectId?: string;
  dueDate?: {
    from?: string;
    to?: string;
  };
  searchQuery?: string;
}
```

#### タスク詳細モーダル
**機能**:
- タスク基本情報編集
- 関係性(MECE)管理
- 進捗・工数管理
- コメント・履歴
- AI評価結果表示

### 2.3 プロジェクト管理

#### /projects
**概要**: プロジェクト管理メインページ

**主要機能**:
- プロジェクト一覧・詳細
- ガントチャート表示
- チーム管理・リソース配分
- 進捗・KPI追跡
- AI成功度予測

**プロジェクトカード**:
```tsx
<ProjectCard>
  <ProjectHeader title={project.name} status={project.status} />
  <ProgressBar progress={project.progress} />
  <TeamMembers members={project.teamMembers} />
  <Metrics 
    successProbability={project.successProbability}
    activityScore={project.activityScore}
    connectionPower={project.connectionPower}
  />
  <QuickActions projectId={project.id} />
</ProjectCard>
```

#### /projects/[id]/analytics
**概要**: プロジェクト分析ページ

**主要機能**:
- 詳細分析ダッシュボード
- タスク進捗分析
- チームパフォーマンス
- 財務分析・ROI計算
- リスク要因分析

### 2.4 カレンダー機能

#### /calendar
**概要**: 統合カレンダーページ

**主要機能**:
- 月/週/日表示切り替え
- 複数データソース統合表示
- イベント作成・編集
- 繰り返し予定設定
- カテゴリ別色分け

**統合データソース**:
```typescript
interface UnifiedCalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  type: 'MEETING' | 'EVENT' | 'DEADLINE';
  category: 'PERSONAL' | 'PROJECT' | 'APPOINTMENT';
  source: 'calendar_events' | 'personal_schedules' | 'tasks' | 'appointments';
  relatedEntity?: {
    type: 'task' | 'project' | 'appointment';
    id: string;
    name: string;
  };
}
```

### 2.5 人脈・アポイント管理

#### /connections
**概要**: 人脈管理ページ

**主要機能**:
- 人脈一覧・検索
- 関係性可視化
- コネクション追加・編集
- LTV分析

#### /appointments
**概要**: アポイントメント管理ページ

**主要機能**:
- アポイント一覧・カンバン表示
- 詳細情報管理
- フォローアップ管理
- 成約確率AI予測

### 2.6 ナレッジ管理

#### /knowledge
**概要**: ナレッジ管理ページ

**主要機能**:
- ナレッジ記事一覧
- カテゴリ別分類
- 検索・タグフィルター
- 自動生成ナレッジ表示
- いいね・評価機能

## 3. コンポーネント設計

### 3.1 共通UIコンポーネント

#### Button コンポーネント
```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  children
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors';
  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200',
    outline: 'border border-primary-600 text-primary-600 hover:bg-primary-50',
    ghost: 'text-primary-600 hover:bg-primary-50'
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        { 'opacity-50 cursor-not-allowed': disabled || isLoading }
      )}
      disabled={disabled || isLoading}
      onClick={onClick}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
};
```

#### Modal コンポーネント
```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={cn(
        'relative bg-white rounded-lg shadow-xl',
        {
          'max-w-sm': size === 'sm',
          'max-w-md': size === 'md',
          'max-w-2xl': size === 'lg',
          'max-w-4xl': size === 'xl'
        }
      )}>
        {title && (
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
```

### 3.2 業務固有コンポーネント

#### TaskCard コンポーネント
```tsx
interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: task_status) => void;
  isDragging?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  isDragging = false
}) => {
  return (
    <div className={cn(
      'bg-white rounded-lg shadow-sm border p-4',
      'hover:shadow-md transition-shadow cursor-pointer',
      { 'opacity-50': isDragging }
    )}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-gray-900 line-clamp-2">
          {task.title}
        </h3>
        <TaskPriorityBadge priority={task.priority} />
      </div>
      
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {task.assignee && (
            <UserAvatar user={task.assignee} size="sm" />
          )}
          {task.dueDate && (
            <DueDateBadge dueDate={task.dueDate} />
          )}
        </div>
        
        <TaskActions
          task={task}
          onEdit={() => onEdit(task)}
          onDelete={() => onDelete(task.id)}
          onStatusChange={onStatusChange}
        />
      </div>
    </div>
  );
};
```

#### ProjectProgressChart コンポーネント
```tsx
interface ProjectProgressChartProps {
  project: Project;
  tasks: Task[];
  height?: number;
}

export const ProjectProgressChart: React.FC<ProjectProgressChartProps> = ({
  project,
  tasks,
  height = 300
}) => {
  const chartData = useMemo(() => {
    // タスクステータス別の集計
    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<task_status, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: (count / tasks.length) * 100
    }));
  }, [tasks]);

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">プロジェクト進捗</h3>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>全体進捗</span>
          <span>{project.progress}%</span>
        </div>
        <ProgressBar progress={project.progress} />
      </div>
      
      <div className="space-y-3">
        {chartData.map(({ status, count, percentage }) => (
          <div key={status} className="flex items-center">
            <div className="w-20 text-sm text-gray-600">
              {statusLabels[status]}
            </div>
            <div className="flex-1 mx-3">
              <ProgressBar 
                progress={percentage} 
                color={statusColors[status]}
              />
            </div>
            <div className="w-12 text-sm text-right">
              {count}件
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 4. 状態管理

### 4.1 カスタムフック設計

#### useTasks フック
```typescript
export const useTasks = (filters?: TaskFilter) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // タスク一覧取得
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tasks?' + new URLSearchParams(filters));
      const data = await response.json();
      setTasks(data.tasks);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // タスク作成
  const createTask = useCallback(async (taskData: CreateTaskInput) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      const newTask = await response.json();
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // タスク更新
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedTask = await response.json();
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
      return updatedTask;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // タスク削除
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // 初期化
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refresh: fetchTasks
  };
};
```

### 4.2 リアルタイム状態管理

#### useRealtimeUpdates フック
```typescript
export const useRealtimeUpdates = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);
    
    ws.onopen = () => {
      setIsConnected(true);
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleRealtimeUpdate(data);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setSocket(null);
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleRealtimeUpdate = useCallback((data: RealtimeUpdate) => {
    switch (data.type) {
      case 'task_updated':
        // タスク更新をグローバル状態に反映
        updateGlobalTaskState(data.payload);
        break;
      case 'metrics_updated':
        // メトリクス更新を各ダッシュボードに反映
        updateGlobalMetrics(data.payload);
        break;
      default:
        console.log('Unknown realtime update type:', data.type);
    }
  }, []);

  return { isConnected, socket };
};
```

## 5. レスポンシブデザイン

### 5.1 ブレークポイント
```css
/* Tailwind CSS ブレークポイント */
sm: 640px;   /* スマートフォン横向き */
md: 768px;   /* タブレット */
lg: 1024px;  /* ラップトップ */
xl: 1280px;  /* デスクトップ */
2xl: 1536px; /* 大画面デスクトップ */
```

### 5.2 モバイル最適化

#### タッチ操作対応
```tsx
// スワイプジェスチャー
const useSwipeGesture = (onSwipeLeft?: () => void, onSwipeRight?: () => void) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
    if (isRightSwipe && onSwipeRight) onSwipeRight();
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
};
```

#### 可変レイアウト
```tsx
// レスポンシブグリッド
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* コンテンツ */}
</div>

// モバイルでのナビゲーション
<nav className="hidden md:flex md:space-x-6">
  {/* デスクトップナビ */}
</nav>
<button className="md:hidden" onClick={toggleMobileMenu}>
  {/* モバイルメニューボタン */}
</button>
```

## 6. パフォーマンス最適化

### 6.1 コード分割
```tsx
// 動的インポート
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
  ssr: false
});

// ページレベルでの遅延読み込み
const ProjectAnalytics = dynamic(
  () => import('../components/ProjectAnalytics'),
  { ssr: false }
);
```

### 6.2 メモ化・最適化
```tsx
// React.memo でコンポーネントメモ化
export const TaskCard = React.memo<TaskCardProps>(({ task, onEdit }) => {
  // コンポーネント実装
}, (prevProps, nextProps) => {
  return prevProps.task.id === nextProps.task.id &&
         prevProps.task.updatedAt === nextProps.task.updatedAt;
});

// useMemo で計算結果のメモ化
const filteredTasks = useMemo(() => {
  return tasks.filter(task => {
    if (filters.status && !filters.status.includes(task.status)) return false;
    if (filters.assignedTo && task.assignedTo !== filters.assignedTo) return false;
    return true;
  });
}, [tasks, filters]);

// useCallback で関数のメモ化
const handleTaskCreate = useCallback(async (taskData: CreateTaskInput) => {
  await createTask(taskData);
  await refresh();
}, [createTask, refresh]);
```

### 6.3 仮想化
```tsx
// 大量データの仮想化表示
import { FixedSizeList as List } from 'react-window';

const VirtualizedTaskList: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <TaskCard task={tasks[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={tasks.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

## 7. アクセシビリティ

### 7.1 キーボード操作
```tsx
// フォーカス管理
const useKeyboardNavigation = (items: any[], onSelect: (item: any) => void) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        onSelect(items[selectedIndex]);
        break;
    }
  }, [items, selectedIndex, onSelect]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return selectedIndex;
};
```

### 7.2 ARIA属性
```tsx
// スクリーンリーダー対応
<button
  aria-label="タスクを完了としてマーク"
  aria-pressed={task.status === 'COMPLETE'}
  onClick={handleComplete}
>
  <CheckIcon />
</button>

// ライブリージョン
<div aria-live="polite" aria-atomic="true">
  {notification && <div>{notification}</div>}
</div>
```

---

## 8. モバイルAI機能コンポーネント仕様

### 8.1 AI機能コンポーネント概要

**実装場所**: `/src/components/mobile/ai/`
**技術スタック**: React 19 + TypeScript + Tailwind CSS + shadcn/ui
**対応デバイス**: モバイル最適化（タッチ操作・レスポンシブ）

### 8.2 コンポーネント詳細仕様

#### 8.2.1 AIInsightsWidget.tsx
```tsx
interface ProductivityInsight {
  id: string;
  type: 'efficiency' | 'peak_time' | 'completion_rate' | 'suggestion';
  title: string;
  description: string;
  value: string | number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  actionable: boolean;
}

interface AIInsightsWidgetProps {
  className?: string;
  compact?: boolean;
}
```

**主要機能**:
- 作業効率パターンの分析・可視化
- 最適作業時間帯の提案
- タスク完了予測とトレンド表示
- AI信頼度付きの洞察提供

**UI特徴**:
- コンパクト/詳細モード切り替え
- トレンドアイコン表示（上昇・下降・安定）
- 信頼度バッジ（高精度・中精度・低精度）

#### 8.2.2 IntelligentSearchBox.tsx
```tsx
interface SearchSuggestion {
  id: string;
  type: 'task' | 'project' | 'date' | 'status' | 'priority' | 'natural';
  query: string;
  description: string;
  count?: number;
  confidence: number;
}

interface SearchResult {
  id: string;
  type: 'task' | 'project' | 'event';
  title: string;
  description: string;
  relevance: number;
  metadata: {
    status?: string;
    priority?: string;
    dueDate?: string;
    project?: string;
  };
}
```

**主要機能**:
- 自然言語検索・セマンティック検索
- AI検索候補自動補完
- 音声検索対応（Web Speech API）
- 検索結果の関連度評価

**モバイル最適化**:
- キーボードナビゲーション（矢印キー）
- タッチ操作対応
- 音声認識インターフェース

#### 8.2.3 SmartScheduleViewer.tsx
```tsx
interface ScheduleItem {
  id: string;
  type: 'task' | 'meeting' | 'break' | 'focus' | 'review';
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  duration: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  aiOptimized: boolean;
  productivityScore?: number;
  suggestions?: string[];
}

interface OptimizationSuggestion {
  id: string;
  type: 'reorder' | 'reschedule' | 'break' | 'focus';
  title: string;
  description: string;
  impact: number;
  confidence: number;
}
```

**主要機能**:
- AI最適化スケジュールの表示
- タイムライン/リスト表示モード
- リアルタイム現在時刻表示
- 最適化提案とその適用

**UI特徴**:
- スクロール可能タイムライン
- 現在時刻線の表示
- AI最適化項目の視覚的強調

#### 8.2.4 AIAssistantPanel.tsx
```tsx
interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: MessageAction[];
  suggestions?: string[];
}

interface MessageAction {
  id: string;
  type: 'create_task' | 'schedule_event' | 'set_reminder' | 'search' | 'optimize';
  label: string;
  data?: any;
}
```

**主要機能**:
- チャットベースのAI対話
- タスク作成・編集の自動化
- 音声入力・出力対応
- アクション実行機能

**インタラクション**:
- 最小化/最大化切り替え
- 音声認識（Web Speech API）
- タイピングインジケーター
- 提案チップ表示

#### 8.2.5 ContextAwareHelper.tsx
```tsx
interface ContextualHint {
  id: string;
  type: 'tip' | 'warning' | 'suggestion' | 'insight' | 'shortcut';
  title: string;
  content: string;
  context: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
  dismissible: boolean;
  confidence: number;
}

interface UserContext {
  currentPage: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  taskCount: number;
  completionRate: number;
  lastActivity: string;
  strugglingWith?: string[];
}
```

**主要機能**:
- コンテキスト認識ヒント生成
- 時間帯・完了率・作業パターン分析
- 個人化された提案・警告
- 設定カスタマイズ機能

### 8.3 共通技術仕様

#### 8.3.1 型安全性
- **TypeScript Strict Mode**: 全コンポーネント対応
- **Props型定義**: 完全な型注釈
- **Error Boundary**: エラーハンドリング

#### 8.3.2 パフォーマンス最適化
- **React.memo**: 不要な再レンダリング防止
- **useCallback/useMemo**: 関数・値のメモ化
- **Lazy Loading**: 重いコンポーネントの遅延読み込み

#### 8.3.3 アクセシビリティ
- **ARIA属性**: スクリーンリーダー対応
- **キーボードナビゲーション**: 全機能対応
- **コントラスト比**: WCAG 2.1 AA準拠

#### 8.3.4 レスポンシブデザイン
- **Mobile First**: モバイル優先設計
- **Touch Friendly**: 44px以上のタッチターゲット
- **Gesture Support**: スワイプ・ピンチ対応

#### 8.3.5 PWA対応
- **Service Worker**: オフライン機能
- **App Manifest**: インストール可能
- **Push Notifications**: プッシュ通知対応

### 8.4 API統合仕様

#### 8.4.1 既存API活用
```typescript
// 予測エンジン連携
import { predictiveEngine } from '@/lib/mobile/predictiveEngine';

// APIエンドポイント
- `/api/ai/parse-task` - タスク解析
- `/api/ai/generate-schedule` - スケジュール生成
- `/api/user/progress` - ユーザー進捗
```

#### 8.4.2 データフロー
```typescript
// データフェッチング
const { data, loading, error } = useAIInsights();

// エラーハンドリング
try {
  const result = await aiService.generateSchedule(params);
} catch (error) {
  console.error('AI service error:', error);
  fallbackToDefaultSchedule();
}
```

### 8.5 テスト仕様

#### 8.5.1 単体テスト
- **Jest + React Testing Library**: コンポーネントテスト
- **カバレッジ**: 80%以上維持
- **Mock**: API・外部サービスのモック化

#### 8.5.2 統合テスト
- **E2E テスト**: Playwright使用
- **ユーザーフロー**: 主要機能の動作確認
- **クロスブラウザ**: Chrome・Safari・Firefox対応

---

*このモバイルAI機能仕様書は、実装済みコンポーネントの技術詳細と品質要件を定義し、継続的なメンテナンス・拡張のガイドラインを提供します。*