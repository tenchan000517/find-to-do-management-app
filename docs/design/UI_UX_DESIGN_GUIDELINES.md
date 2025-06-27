# 🎨 UI/UX デザインガイドライン

**作成日**: 2025-06-17  
**対象**: すべての開発者・デザイナー  
**目的**: システム全体の一貫性を担保し、ユーザーフレンドリーで美しいデザインを実現

---

## 🎯 **ガイドライン概要**

このガイドラインは、FIND to DO システムにおける**すべてのUI/UX実装を統一**し、エンジニアのセンス任せにならない明確なルールを提供します。

### **設計原則**
1. **一貫性**: 全ページ・コンポーネントで統一されたデザイン言語
2. **アクセシビリティ**: すべてのユーザーが使いやすいインターフェース
3. **レスポンシブファースト**: モバイルを基準とした設計
4. **パフォーマンス**: 高速で快適なユーザー体験

---

## 📏 **1. レイアウトの一貫性**

### **1.1 ページタイトルのルール**

#### **✅ 標準実装**
```tsx
// すべての子ページは以下の構造に統一
<PageHeader 
  title="ページタイトル"
  actions={
    <div className="flex items-center space-x-3">
      <TabNavigation tabs={tabs} />
      <Button variant="primary" icon={<Plus />}>
        新規追加
      </Button>
    </div>
  }
/>
```

#### **❌ 禁止事項**
- ページ内でのタイトル重複表示
- タイトルとボタンの分離配置
- 不統一な余白・フォントサイズ

### **1.2 ボタン配置の統一**

#### **原則: 1行にまとめる**
```tsx
// ✅ Good: タブと新規追加を1行に配置
<div className="flex items-center justify-between mb-6">
  <TabNavigation tabs={tabs} />
  <div className="flex items-center space-x-3">
    <FilterButton />
    <SortButton />
    <Button variant="primary">新規追加</Button>
  </div>
</div>

// ❌ Bad: 複数行に分散
<div className="mb-4">
  <TabNavigation tabs={tabs} />
</div>
<div className="mb-6 text-right">
  <Button variant="primary">新規追加</Button>
</div>
```

---

## 📐 **2. 余白・サイズの一貫性**

### **2.1 デザイントークン（必須遵守）**

```typescript
// src/lib/design-tokens.ts
export const spacing = {
  xs: '0.5rem',    // 8px  - 要素間の最小余白
  sm: '1rem',      // 16px - 要素間の標準余白
  md: '1.5rem',    // 24px - セクション間余白
  lg: '2rem',      // 32px - ページ余白
  xl: '3rem',      // 48px - 大きなセクション間
} as const;

export const containerSizes = {
  page: 'mx-auto px-4 lg:px-8 max-w-7xl',     // ページコンテナ
  modal: 'mx-auto px-6 py-6',                  // モーダルコンテナ
  card: 'p-6',                                 // カード内余白
  form: 'space-y-4',                           // フォーム要素間
} as const;
```

### **2.2 カードコンポーネントの統一**

#### **✅ 標準カード実装**
```tsx
// 共通カードコンポーネントの使用を必須とする
<Card variant="default" padding="normal" shadow="md">
  <CardHeader>
    <CardTitle>タイトル</CardTitle>
    <CardActions>
      <Button variant="ghost" size="sm">編集</Button>
    </CardActions>
  </CardHeader>
  <CardContent>
    {/* コンテンツ */}
  </CardContent>
</Card>
```

#### **カードバリアント定義**
```typescript
const cardVariants = {
  default: 'bg-white border border-gray-200',
  elevated: 'bg-white shadow-lg border-0',
  outlined: 'bg-white border-2 border-blue-200',
  ghost: 'bg-gray-50 border-0',
} as const;

const cardPadding = {
  compact: 'p-4',     // 小さなカード
  normal: 'p-6',      // 標準カード
  spacious: 'p-8',    // 大きなカード
} as const;
```

### **2.3 コンテナ幅の統一**

```css
/* 必須: 全ページで統一 */
.page-container {
  @apply mx-auto px-4 lg:px-8 max-w-7xl;
}

.content-container {
  @apply max-w-4xl mx-auto;
}

.narrow-container {
  @apply max-w-2xl mx-auto;
}
```

---

## 🪟 **3. モーダルオーバーレイの統一**

### **3.1 標準モーダル実装**

#### **✅ 必須実装パターン**
```tsx
// 全モーダルでHeadlessUI + 統一アニメーションを使用
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="モーダルタイトル"
  size="md"
  overlay="blur" // blur | dark | light
>
  <ModalContent>
    {/* コンテンツ */}
  </ModalContent>
  <ModalActions>
    <Button variant="secondary" onClick={onClose}>
      キャンセル
    </Button>
    <Button variant="primary" onClick={onSave}>
      保存
    </Button>
  </ModalActions>
</Modal>
```

#### **オーバーレイアニメーション**
```typescript
const overlayAnimations = {
  blur: {
    backdrop: 'backdrop-blur-sm bg-black/30',
    enter: 'ease-out duration-300',
    leave: 'ease-in duration-200',
  },
  dark: {
    backdrop: 'bg-black/50',
    enter: 'ease-out duration-300', 
    leave: 'ease-in duration-200',
  }
} as const;
```

### **3.2 モーダルサイズ定義**

```typescript
const modalSizes = {
  sm: 'max-w-md',      // 400px - 確認ダイアログ
  md: 'max-w-lg',      // 512px - フォーム
  lg: 'max-w-2xl',     // 672px - 詳細表示
  xl: 'max-w-4xl',     // 896px - 複雑なフォーム
  full: 'max-w-full',  // 全画面
} as const;
```

---

## 🗄️ **4. データベース追加時のINDEX設計**

### **4.1 パフォーマンス向上ルール**

#### **必須INDEX設計**
```sql
-- ✅ 必須: 外部キーには必ずINDEXを作成
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);

-- ✅ 必須: よく使用される検索条件にINDEX
CREATE INDEX idx_tasks_status_priority ON tasks(status, priority);
CREATE INDEX idx_projects_status_created_at ON projects(status, created_at);

-- ✅ 必須: 日付範囲検索にINDEX
CREATE INDEX idx_appointments_start_date ON appointments(start_date);
CREATE INDEX idx_calendar_events_event_date ON calendar_events(event_date);
```

#### **INDEX命名規則**
```
idx_{テーブル名}_{列名1}_{列名2}
```

### **4.2 Prismaスキーマでの実装**

```prisma
model Task {
  id          Int      @id @default(autoincrement())
  title       String
  status      TaskStatus
  priority    Priority
  projectId   Int
  assigneeId  Int?
  createdAt   DateTime @default(now())
  
  project   Project @relation(fields: [projectId], references: [id])
  assignee  User?   @relation(fields: [assigneeId], references: [id])
  
  // パフォーマンス向上のためのINDEX
  @@index([projectId])                    // 外部キー
  @@index([assigneeId])                   // 外部キー
  @@index([status, priority])             // 複合検索
  @@index([createdAt])                    // 日付ソート
  @@map("tasks")
}
```

---

## ⏳ **5. 読み込みアニメーションの一貫性**

### **5.1 読み込み状態の分類**

#### **全画面読み込み**
```tsx
// ページ全体の初回読み込み
<FullPageLoading 
  message="データを読み込んでいます..."
  showProgress={true}
/>
```

#### **部分的読み込み**
```tsx
// コンテナ内の部分更新
<div className="relative min-h-[200px]">
  {loading && (
    <LoadingOverlay 
      variant="spinner" 
      size="md"
      message="更新中..."
    />
  )}
  <DataTable data={data} />
</div>
```

### **5.2 読み込みアニメーション統一**

```typescript
const loadingVariants = {
  spinner: 'animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent',
  dots: 'flex space-x-1', // 3つのドットアニメーション
  skeleton: 'animate-pulse bg-gray-200', // スケルトンローディング
  progress: 'w-full bg-blue-500 h-1 animate-pulse', // プログレスバー
} as const;
```

### **5.3 ページリロード vs 部分更新の方針**

#### **ページリロード対象**
- 認証状態の変更
- 重要なデータ構造の変更
- エラー発生時の復旧

#### **部分更新対象**
- 一覧データの追加・編集・削除
- フィルタ・ソートの適用
- リアルタイム更新

```tsx
// ✅ 部分更新の実装例
const [data, setData] = useState([]);
const [loading, setLoading] = useState(false);

const handleUpdate = async (id: number, updates: Partial<Task>) => {
  setLoading(true);
  try {
    const updated = await updateTask(id, updates);
    setData(prev => prev.map(item => 
      item.id === id ? { ...item, ...updated } : item
    ));
  } finally {
    setLoading(false);
  }
};
```

---

## 🗂️ **6. カンバンボードの操作性・UI/UX統一**

### **6.1 カンバン共通操作**

#### **ドラッグ&ドロップ**
```tsx
// 必須: react-beautiful-dndを使用
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

<DragDropContext onDragEnd={handleDragEnd}>
  <div className="flex space-x-6 overflow-x-auto pb-4">
    {columns.map(column => (
      <Droppable key={column.id} droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'bg-gray-100 rounded-lg p-4 min-w-[280px]',
              snapshot.isDraggingOver && 'bg-blue-50 ring-2 ring-blue-300'
            )}
          >
            <ColumnHeader title={column.title} count={column.items.length} />
            {column.items.map((item, index) => (
              <KanbanCard 
                key={item.id}
                item={item}
                index={index}
                onEdit={handleEdit}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    ))}
  </div>
</DragDropContext>
```

### **6.2 カンバンカードの統一**

```tsx
// 必須: 統一されたカンバンカード
<KanbanCard variant="task" priority={task.priority}>
  <CardHeader>
    <PriorityBadge priority={task.priority} />
    <StatusBadge status={task.status} />
  </CardHeader>
  <CardContent>
    <CardTitle>{task.title}</CardTitle>
    <CardMeta>
      <AssigneeAvatar user={task.assignee} />
      <DueDate date={task.dueDate} />
    </CardMeta>
  </CardContent>
  <CardFooter>
    <Progress value={task.progress} />
  </CardFooter>
</KanbanCard>
```

### **6.3 読み込み・更新UI**

```tsx
// カンバン専用ローディング状態
{isUpdating && (
  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
    <Spinner size="sm" />
    <span className="ml-2 text-sm text-gray-600">更新中...</span>
  </div>
)}
```

---

## 📱 **7. モバイル表示（レスポンシブ）の統一**

### **7.1 モバイルファースト設計原則**

#### **ブレークポイント定義**
```typescript
const breakpoints = {
  sm: '640px',   // タブレット縦
  md: '768px',   // タブレット横
  lg: '1024px',  // デスクトップ小
  xl: '1280px',  // デスクトップ大
  '2xl': '1536px', // 大型デスクトップ
} as const;
```

#### **必須レスポンシブパターン**
```tsx
// ✅ モバイルファースト実装
<div className="
  grid grid-cols-1           // モバイル: 1列
  md:grid-cols-2             // タブレット: 2列  
  lg:grid-cols-3             // デスクトップ: 3列
  gap-4 md:gap-6             // 余白もレスポンシブ
">
  {items.map(item => <Card key={item.id} item={item} />)}
</div>
```

### **7.2 タッチターゲットサイズ**

```css
/* 必須: 最小タッチターゲット 44px */
.touch-target {
  @apply min-h-[44px] min-w-[44px] flex items-center justify-center;
}

.button-mobile {
  @apply h-12 px-6 text-base; /* 48px高さで余裕のあるタッチエリア */
}
```

### **7.3 モバイル専用UI要素**

#### **固定フッターナビゲーション**
```tsx
// モバイルのみ表示される下部ナビ
<div className="
  fixed bottom-0 left-0 right-0 
  bg-white border-t border-gray-200
  lg:hidden                          // デスクトップでは非表示
  safe-area-inset-bottom            // iOS SafeArea対応
">
  <nav className="flex justify-around py-2">
    {navigationItems.map(item => (
      <NavItem key={item.id} {...item} />
    ))}
  </nav>
</div>
```

#### **モバイル最適化されたモーダル**
```tsx
// モバイルでは全画面、デスクトップでは中央表示
<div className={cn(
  'fixed inset-0 z-50',
  'lg:flex lg:items-center lg:justify-center lg:p-4'
)}>
  <div className={cn(
    'bg-white',
    'h-full w-full lg:h-auto lg:w-auto lg:max-w-lg lg:rounded-lg lg:shadow-xl'
  )}>
    {/* モーダルコンテンツ */}
  </div>
</div>
```

---

## 🎨 **8. アイコンシステムの統一**

### **8.1 Lucide React導入（必須）**

```bash
# 必須インストール
npm install lucide-react
```

#### **アイコン使用ルール**
```tsx
import { 
  Plus, Edit, Trash2, Eye, 
  Calendar, Users, FileText,
  AlertCircle, CheckCircle, Clock
} from 'lucide-react';

// ✅ 統一されたサイズ・スタイル
<Button variant="primary" icon={<Plus className="h-4 w-4" />}>
  新規追加
</Button>

// ✅ 状態に応じたアイコン
const StatusIcon = ({ status }: { status: TaskStatus }) => {
  const icons = {
    pending: <Clock className="h-4 w-4 text-yellow-500" />,
    progress: <AlertCircle className="h-4 w-4 text-blue-500" />,
    completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  };
  return icons[status];
};
```

### **8.2 絵文字削除対象**

#### **置き換え必須リスト**
```typescript
// 現在の絵文字 → Lucide Reactアイコン
const iconMigration = {
  '📋': 'ClipboardList',
  '🚀': 'Rocket', 
  '✅': 'CheckCircle',
  '📅': 'Calendar',
  '👥': 'Users',
  '📞': 'Phone',
  '📚': 'BookOpen',
  '📝': 'FileText',
  '🤖': 'Bot',
  '📊': 'BarChart3',
} as const;
```

---

## 🛠️ **9. 共通UIコンポーネント実装必須リスト**

### **9.1 Phase 1 (今週実装)**

```typescript
// 1. Button コンポーネント
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
}

// 2. Modal コンポーネント
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

// 3. Card コンポーネント
interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'compact' | 'normal' | 'spacious';
  children: React.ReactNode;
}
```

### **9.2 Phase 2 (来週実装)**

```typescript
// 4. FormField コンポーネント
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

// 5. Badge コンポーネント  
interface BadgeProps {
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

// 6. EmptyState コンポーネント
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}
```

---

## 📋 **10. 実装チェックリスト**

### **新しいページ・コンポーネント作成時**

#### **✅ 必須チェック項目**
- [ ] デザイントークンを使用した余白・サイズ
- [ ] Lucide Reactアイコンを使用（絵文字禁止）
- [ ] レスポンシブ対応（モバイルファースト）
- [ ] 統一されたローディング状態の実装
- [ ] 適切なタッチターゲットサイズ（44px以上）
- [ ] 共通コンポーネントの使用
- [ ] アクセシビリティ対応（aria-label等）

#### **✅ データベース操作時**
- [ ] 外部キーにINDEX作成
- [ ] 検索条件にINDEX作成
- [ ] 適切な命名規則でINDEX命名

#### **✅ コードレビュー項目**
- [ ] 不統一な余白・サイズがないか
- [ ] 重複実装がないか
- [ ] 絵文字使用がないか
- [ ] レスポンシブ対応が適切か

---

## 🚨 **11. 禁止事項**

### **❌ 絶対に使用禁止**
```tsx
// 絵文字をアイコンとして使用
<span>📋</span>

// インラインスタイルの直接記述
<div style={{margin: '16px', padding: '20px'}}>

// 統一されていない余白・サイズ
<div className="p-3">    // デザイントークン外
<div className="px-5">   // デザイントークン外

// 直接的なpx値の使用（デザイントークン以外）
<div className="h-[32px]">  // spacing tokenを使用すべき
```

### **❌ 非推奨パターン**
```tsx
// 個別モーダル実装（共通Modal使用必須）
<div className="fixed inset-0 bg-black bg-opacity-50">

// 独自ボタン実装（共通Button使用必須）  
<button className="bg-blue-500 hover:bg-blue-600">

// 非統一カード実装
<div className="bg-white shadow p-4">  // Card component使用必須
```

---

## 🔄 **12. 継続的改善プロセス**

### **週次チェック**
1. 新しいコンポーネントのガイドライン準拠確認
2. パフォーマンス指標の確認
3. ユーザビリティフィードバックの反映

### **月次更新**
1. デザインシステムの拡張
2. 新しいベストプラクティスの追加
3. ガイドライン文書の更新

### **品質指標**
- TypeScriptエラー: 0件
- ESLintエラー: 0件  
- Lighthouse スコア: 90点以上
- デザイン統一性: 100%準拠

---

**このガイドラインに従うことで、システム全体の一貫性と品質を確保し、ユーザーにとって使いやすく美しいインターフェースを実現します。**

*最終更新: 2025-06-17*  
*次回更新: Phase 1実装完了時*