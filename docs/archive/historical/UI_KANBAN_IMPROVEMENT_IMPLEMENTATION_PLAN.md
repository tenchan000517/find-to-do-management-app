# 🎨 カレンダー・タスク・アポイント・プロジェクトページ UI改善実装計画書

**作成日**: 2025-06-17  
**対象**: カレンダー、タスク、アポイント、プロジェクトページのUI/UX統一改善  
**期間**: 3週間（Phase別実装）  
**目的**: 統一されたカード移動UI・+カード追加ボタン・マイクロアニメーション実装

---

## 📊 現状分析サマリー

### **既存システム状況**
- **カレンダーページ**: レスポンシブ実装済み（GoogleCalender.html）、React統合（CalendarView）
- **タスクページ**: 4種類のカンバンビュー実装済み（ステータス・ユーザー・プロジェクト・期限別）
- **アポイントページ**: カンバン・リスト切り替え、4種類の分類軸
- **プロジェクトページ**: テーブル・カード・ガントチャート表示

### **技術実装状況**
- **ドラッグ&ドロップ**: `@dnd-kit/core`使用（7つのカンバンコンポーネント）
- **アニメーション**: 基本的なホバー・トランジション実装済み
- **レスポンシブ**: Tailwind CSS使用、モバイルファースト設計採用
- **UI統一**: 一部不統一（絵文字アイコン・余白・モーダル実装）

---

## 🎯 改善目標と実装方針

### **1. 共通UIコンポーネント統一**
- **統一されたカード移動UI**: 全カンバンで同一の操作感
- **+カード追加ボタン**: 各カンバン列の最後尾に配置
- **マイクロアニメーション**: ユーザー体験向上
- **ドラッグ&ドロップ**: スムーズなカード移動体験

### **2. 統合設計方針**
✅ **共通コンポーネント優先**: 4ページ共通で使用可能  
✅ **個別最適化**: ページ固有の要件に対応  
✅ **段階的移行**: 既存機能を破壊せずに改善

---

## 🛠️ Phase別実装計画

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
}

// カード種別に応じた表示の最適化
const CardContent = ({ item, type }: { item: any; type: string }) => {
  switch (type) {
    case 'task':
      return <TaskCardContent task={item} />;
    case 'appointment':
      return <AppointmentCardContent appointment={item} />;
    case 'project':
      return <ProjectCardContent project={item} />;
    case 'calendar':
      return <CalendarCardContent event={item} />;
  }
};
```

#### **1.2 統一ドラッグ&ドロップシステム**
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

// ドラッグ&ドロップの統一実装
export function UniversalKanban<T extends { id: string }>({
  columns,
  items,
  itemType,
  onItemMove,
  onItemEdit,
  renderCard,
  enableAddCards = true,
  onAddCard
}: UniversalKanbanProps<T>) {
  // @dnd-kit/core統一実装
  // マイクロアニメーション統合
  // +カード追加ボタン配置
}
```

#### **1.3 +カード追加ボタン統一コンポーネント**
```typescript
// src/components/ui/AddCardButton.tsx
interface AddCardButtonProps {
  columnId: string;
  columnTitle: string;
  itemType: 'task' | 'appointment' | 'project';
  onAdd: (columnId: string) => void;
  disabled?: boolean;
}

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
        'focus:outline-none focus:ring-2 focus:ring-blue-500',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !disabled && onAdd(columnId)}
      disabled={disabled}
    >
      <div className="flex flex-col items-center space-y-2">
        <div className={cn(
          'w-8 h-8 rounded-full border-2 border-gray-400',
          'flex items-center justify-center transition-all duration-200',
          isHovered && !disabled && 'border-blue-500 bg-blue-500 text-white scale-110'
        )}>
          <Plus className="w-4 h-4" />
        </div>
        <span className={cn(
          'text-sm font-medium text-gray-600',
          isHovered && !disabled && 'text-blue-600'
        )}>
          {itemType === 'task' ? 'タスク' : 
           itemType === 'appointment' ? 'アポ' : 
           itemType === 'project' ? 'プロジェクト' : 'アイテム'}を追加
        </span>
      </div>
    </button>
  );
}
```

### **Phase 2: マイクロアニメーション・ホバーエフェクト統合（1週間）**

#### **2.1 統一アニメーションシステム**
```typescript
// src/lib/animations.ts
export const animations = {
  // カードホバーアニメーション
  cardHover: {
    scale: 'hover:scale-[1.02]',
    shadow: 'hover:shadow-lg',
    transition: 'transition-all duration-200 ease-out'
  },
  
  // ドラッグアニメーション
  dragStart: {
    scale: 'scale-105',
    shadow: 'shadow-2xl',
    opacity: 'opacity-90',
    rotation: 'rotate-1'
  },
  
  // カード追加アニメーション
  cardAppear: {
    keyframes: `
      @keyframes slideInFromTop {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `,
    class: 'animate-slideInFromTop'
  },
  
  // リアルタイム更新アニメーション
  pulseUpdate: {
    keyframes: `
      @keyframes pulseScale {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `,
    class: 'animate-pulseScale'
  }
};

// カスタムCSSアニメーション定義
export const customAnimations = `
  .animate-slideInFromTop {
    animation: slideInFromTop 0.3s ease-out;
  }
  
  .animate-pulseScale {
    animation: pulseScale 0.6s ease-in-out;
  }
  
  .drag-ghost {
    transform: rotate(3deg) scale(1.05);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    z-index: 1000;
  }
`;
```

#### **2.2 統一ホバーエフェクトコンポーネント**
```typescript
// src/components/ui/HoverCard.tsx
interface HoverCardProps {
  children: React.ReactNode;
  hoverEffect?: 'lift' | 'glow' | 'scale' | 'none';
  glowColor?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function HoverCard({ 
  children, 
  hoverEffect = 'lift', 
  glowColor = 'blue',
  disabled = false,
  onClick 
}: HoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const hoverClasses = {
    lift: 'hover:-translate-y-1 hover:shadow-lg',
    glow: `hover:ring-2 hover:ring-${glowColor}-300 hover:shadow-${glowColor}-200/50`,
    scale: 'hover:scale-[1.02]',
    none: ''
  };
  
  return (
    <div
      className={cn(
        'transition-all duration-200 ease-out cursor-pointer',
        hoverClasses[hoverEffect],
        disabled && 'opacity-50 cursor-not-allowed',
        'group'
      )}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !disabled && onClick?.()}
    >
      {children}
      
      {/* ホバー時の追加エフェクト */}
      {isHovered && hoverEffect === 'glow' && (
        <div className={cn(
          'absolute inset-0 rounded-lg opacity-20',
          `bg-gradient-to-r from-${glowColor}-400 to-${glowColor}-600`,
          'animate-pulse pointer-events-none'
        )} />
      )}
    </div>
  );
}
```

### **Phase 3: ページ別カスタマイズ実装（1週間）**

#### **3.1 タスクページ専用機能**
```typescript
// src/components/kanban/TaskKanbanEnhanced.tsx
export function TaskKanbanEnhanced() {
  const [viewMode, setViewMode] = useState<'status' | 'user' | 'project' | 'deadline'>('status');
  
  // ユーザー要望の参考実装統合
  const handleRealtimeUpdate = useCallback(() => {
    // 2%の確率で微細なアニメーション（参考コードより）
    const cards = document.querySelectorAll('.task-card:not(.completed)');
    cards.forEach(card => {
      if (Math.random() < 0.02) {
        card.style.transform = 'scale(1.02)';
        setTimeout(() => {
          card.style.transform = 'scale(1)';
        }, 300);
      }
    });
  }, []);
  
  useEffect(() => {
    const interval = setInterval(handleRealtimeUpdate, 5000);
    return () => clearInterval(interval);
  }, [handleRealtimeUpdate]);
  
  return (
    <UniversalKanban
      columns={getTaskColumns(viewMode)}
      items={tasks}
      itemType="task"
      onItemMove={handleTaskMove}
      onItemEdit={handleTaskEdit}
      renderCard={(task) => (
        <HoverCard hoverEffect="lift">
          <UniversalKanbanCard 
            item={task} 
            type="task"
            onEdit={handleTaskEdit}
            onDelete={handleTaskDelete}
          />
        </HoverCard>
      )}
      enableAddCards={true}
      onAddCard={handleAddTask}
    />
  );
}
```

#### **3.2 カレンダー統合**
```typescript
// src/components/calendar/CalendarKanbanBridge.tsx
export function CalendarKanbanBridge() {
  // カレンダーとカンバンの連携
  const handleCalendarEventMove = (eventId: string, newDate: string) => {
    // カレンダー上でのドラッグ&ドロップによる日付変更
    updateCalendarEvent(eventId, { date: newDate });
  };
  
  const handleKanbanItemMove = (itemId: string, newStatus: string) => {
    // カンバンでの移動をカレンダーに反映
    if (newStatus === 'COMPLETE') {
      // 完了時はカレンダーから削除または完了表示
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CalendarView 
        onEventMove={handleCalendarEventMove}
        className="h-[600px]"
      />
      <UniversalKanban
        columns={calendarColumns}
        items={calendarEvents}
        itemType="calendar"
        onItemMove={handleKanbanItemMove}
        renderCard={(event) => (
          <CalendarEventCard event={event} />
        )}
      />
    </div>
  );
}
```

#### **3.3 プロジェクトページ担当者変更カンバン**
```typescript
// src/components/projects/ProjectAssigneeKanban.tsx
export function ProjectAssigneeKanban() {
  const { users } = useUsers();
  const { projects } = useProjects();
  
  // ユーザー別カンバン列生成
  const userColumns = users.map(user => ({
    id: user.id,
    title: user.name,
    color: user.color,
    avatar: user.name.charAt(0)
  }));
  
  const handleProjectAssigneeChange = async (projectId: string, newAssigneeId: string) => {
    await updateProject(projectId, { 
      teamMembers: [newAssigneeId], // 新担当者設定
      leaderId: newAssigneeId       // リーダー変更
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">担当者別プロジェクト管理</h3>
        <button className="btn-primary">
          新規プロジェクト
        </button>
      </div>
      
      <UniversalKanban
        columns={userColumns}
        items={projects}
        itemType="project"
        onItemMove={handleProjectAssigneeChange}
        renderCard={(project) => (
          <HoverCard hoverEffect="glow" glowColor="purple">
            <UniversalKanbanCard 
              item={project} 
              type="project"
              onEdit={handleProjectEdit}
              customActions={
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-800">
                    詳細
                  </button>
                  <button className="text-green-600 hover:text-green-800">
                    完了
                  </button>
                </div>
              }
            />
          </HoverCard>
        )}
        enableAddCards={true}
        onAddCard={(columnId) => handleAddProject(columnId)}
      />
    </div>
  );
}
```

---

## 🎨 統合デザインシステム

### **色・アニメーション統一**
```css
/* src/styles/kanban-animations.css */
:root {
  --kanban-primary: #3b82f6;
  --kanban-secondary: #64748b;
  --kanban-success: #10b981;
  --kanban-warning: #f59e0b;
  --kanban-danger: #ef4444;
  
  --animation-fast: 150ms;
  --animation-normal: 200ms;
  --animation-slow: 300ms;
  
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.15);
  --shadow-drag: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.kanban-card {
  @apply bg-white rounded-lg border border-gray-200 p-4;
  @apply transition-all duration-200 ease-out;
  @apply hover:shadow-lg hover:-translate-y-0.5;
  box-shadow: var(--shadow-card);
}

.kanban-card:hover {
  box-shadow: var(--shadow-hover);
}

.kanban-card.dragging {
  @apply opacity-50 scale-105 rotate-2;
  box-shadow: var(--shadow-drag);
}

.kanban-column {
  @apply bg-gray-50 rounded-lg p-4 min-h-[500px];
  @apply border-2 border-transparent transition-colors duration-200;
}

.kanban-column.drag-over {
  @apply border-blue-400 bg-blue-50;
}

.add-card-enter {
  animation: slideInFromTop 0.3s ease-out;
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.pulse-update {
  animation: pulseScale 0.6s ease-in-out;
}

@keyframes pulseScale {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

### **レスポンシブ対応**
```typescript
// src/hooks/useResponsiveKanban.ts
export function useResponsiveKanban() {
  const [isMobile, setIsMobile] = useState(false);
  const [columnsPerView, setColumnsPerView] = useState(4);
  
  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      
      if (width < 640) {
        setColumnsPerView(1); // モバイル: 1列
      } else if (width < 1024) {
        setColumnsPerView(2); // タブレット: 2列
      } else if (width < 1280) {
        setColumnsPerView(3); // デスクトップ小: 3列
      } else {
        setColumnsPerView(4); // デスクトップ大: 4列以上
      }
    };
    
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);
  
  return { isMobile, columnsPerView };
}
```

---

## 📱 モバイル最適化

### **タッチ操作対応**
```typescript
// src/components/ui/TouchKanban.tsx
export function TouchKanban<T>({ 
  columns, 
  items, 
  onItemMove,
  ...props 
}: UniversalKanbanProps<T>) {
  const { isMobile } = useResponsiveKanban();
  
  // モバイル用のドラッグ設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isMobile ? 10 : 5, // モバイルでは長めの距離
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,      // 250ms長押しで開始
        tolerance: 8,    // 8px以内の誤差許容
      },
    })
  );
  
  if (isMobile) {
    return (
      <div className="space-y-6">
        {/* モバイル: 縦並びレイアウト */}
        {columns.map(column => (
          <div key={column.id} className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold">{column.title}</h3>
              <span className="text-sm text-gray-500">
                {items.filter(item => getItemColumn(item) === column.id).length}件
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {items
                .filter(item => getItemColumn(item) === column.id)
                .map(item => (
                  <TouchCard key={item.id} item={item} {...props} />
                ))}
              <AddCardButton 
                columnId={column.id}
                columnTitle={column.title}
                onAdd={props.onAddCard}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return <UniversalKanban {...props} sensors={sensors} />;
}
```

---

## 🔧 実装手順とマイルストーン

### **Week 1: 基盤構築**
**Day 1-2**: UniversalKanbanCard・UniversalKanban作成  
**Day 3-4**: AddCardButton・基本アニメーション実装  
**Day 5**: 既存TaskKanbanBoardの移行・テスト  

### **Week 2: アニメーション強化**
**Day 1-2**: HoverCard・アニメーションシステム実装  
**Day 3-4**: ドラッグ&ドロップアニメーション強化  
**Day 5**: AppointmentKanbanBoardの移行・テスト  

### **Week 3: 統合・最適化**
**Day 1-2**: プロジェクトページ担当者変更カンバン実装  
**Day 3-4**: カレンダー統合・レスポンシブ最適化  
**Day 5**: 全体テスト・調整・文書化

### **完了指標**
✅ 4ページすべてで統一されたカード移動UI  
✅ 各カンバン列に+カード追加ボタン配置  
✅ スムーズなマイクロアニメーション  
✅ モバイル・デスクトップ両対応  
✅ 既存機能の100%維持  

---

## 🚀 実装開始準備

### **必要パッケージ確認**
```bash
# 既にインストール済み
npm list @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### **新規作成ファイル一覧**
```
src/components/ui/
├── UniversalKanban.tsx          # 統一カンバンベース
├── UniversalKanbanCard.tsx      # 統一カードコンポーネント  
├── AddCardButton.tsx            # +追加ボタン
├── HoverCard.tsx                # ホバーエフェクト
└── TouchKanban.tsx              # モバイル最適化

src/lib/
├── animations.ts                # アニメーション定義
└── kanban-utils.ts              # カンバンユーティリティ

src/styles/
└── kanban-animations.css        # カスタムアニメーション

src/hooks/
└── useResponsiveKanban.ts       # レスポンシブ対応
```

### **参考実装統合**
ユーザーから提供された参考コードの以下要素を統合：

```javascript
// ドラッグ&ドロップ機能（基本実装）
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.card:not(.add-card-btn)');
    
    cards.forEach(card => {
        card.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', '');
            this.style.opacity = '0.5';
        });
        
        card.addEventListener('dragend', function() {
            this.style.opacity = '1';
        });
        
        card.setAttribute('draggable', 'true');
    });
});

// リアルタイム更新アニメーション
setInterval(() => {
    const cards = document.querySelectorAll('.card:not(.completed-card)');
    cards.forEach(card => {
        if (Math.random() < 0.02) { // 2%の確率で微細なアニメーション
            card.style.transform = 'scale(1.02)';
            setTimeout(() => {
                card.style.transform = 'scale(1)';
            }, 300);
        }
    });
}, 5000);
```

この参考実装を`@dnd-kit/core`ベースのReactコンポーネントとして統合します。

---

## 🎯 期待される成果

この計画に従って実装することで、以下が実現されます：

### **✨ ユーザー体験の向上**
- 統一された直感的なカード操作
- 美しいマイクロアニメーション
- レスポンシブ対応の完璧なモバイル体験
- 縦に親コンテナが並ばない最適化されたレイアウト

### **🛠️ 開発効率の向上**
- 共通コンポーネントによるコード重複削減
- 一貫したAPIによる開発速度向上
- 保守性の高いアーキテクチャ

### **📱 技術的優位性**
- モダンなReact + TypeScript実装
- アクセシビリティ対応
- パフォーマンス最適化
- 将来の機能拡張に対応した設計

---

*作成日: 2025-06-17*  
*実装開始: Phase 1から順次実行*  
*期待完了日: 2025-07-08（3週間後）*