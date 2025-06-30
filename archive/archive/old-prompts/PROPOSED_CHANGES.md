# 提案する変更内容

## Phase 0: 基盤改善

### 1. レイアウト幅の拡張
**対象ファイル**: すべてのページコンポーネント
**変更内容**: `max-w-7xl mx-auto` → `mx-auto px-4 lg:px-8`

```tsx
// 現在
<div className="max-w-7xl mx-auto">

// 変更後
<div className="mx-auto px-4 lg:px-8">
```

### 2. 共通ヘッダーコンポーネント
**新規ファイル**: `/src/components/Header.tsx`
```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/', label: 'ダッシュボード' },
    { href: '/projects', label: 'プロジェクト' },
    { href: '/tasks', label: 'タスク' },
    { href: '/calendar', label: 'カレンダー' },
    { href: '/connections', label: 'つながり' },
    { href: '/appointments', label: 'アポイント' },
  ];

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              FIND to DO
            </Link>
            <nav className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
```

### 3. レイアウトコンポーネントの更新
**対象ファイル**: `/src/app/layout.tsx`
```tsx
// Headerコンポーネントをインポート
import Header from '@/components/Header';

// body内に追加
<body>
  <Header />
  {children}
</body>
```

### 4. 各ページから戻るボタンを削除
**対象**: すべてのページ
```tsx
// 削除対象
<Link href="/" className="text-blue-600 hover:text-blue-800">
  ← ホーム
</Link>
```

### 5. クイックメニューのモーダル対応
**対象ファイル**: `/src/components/Dashboard.tsx`

```tsx
// 新しいステート追加
const [showTaskModal, setShowTaskModal] = useState(false);
const [showProjectModal, setShowProjectModal] = useState(false);
const [showEventModal, setShowEventModal] = useState(false);

// クイックアクションの変更
const quickActions = [
  {
    title: '新規タスク',
    description: 'タスクを追加',
    icon: '📝',
    onClick: () => setShowTaskModal(true),
    color: 'bg-blue-500',
  },
  {
    title: '新規プロジェクト',
    description: 'プロジェクトを作成',
    icon: '📁',
    onClick: () => setShowProjectModal(true),
    color: 'bg-purple-500',
  },
  {
    title: '予定を追加',
    description: 'カレンダーに予定を追加',
    icon: '📅',
    onClick: () => setShowEventModal(true),
    color: 'bg-green-500',
  },
];

// ボタンコンポーネントの変更
{quickActions.map((action, index) => (
  <button
    key={index}
    onClick={action.onClick}
    className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all transform hover:-translate-y-1"
  >
    {/* 既存の内容 */}
  </button>
))}
```

## Phase 1: プロジェクトページの改善

### 1. タブコンポーネントの作成
**新規ファイル**: `/src/components/Tabs.tsx`
```tsx
'use client';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
```

### 2. プロジェクトテーブルコンポーネント
**新規ファイル**: `/src/components/ProjectsTable.tsx`
```tsx
// テーブル形式のプロジェクト一覧
```

### 3. ガントチャートの統合
- `/src/app/gantt/page.tsx` を削除
- ガントチャートコンポーネントをプロジェクトページに移動

## 実装順序

1. **基本的なレイアウト変更**（リスクが低い）
   - max-w-7xl の削除
   - padding の調整

2. **ヘッダーナビゲーション**（独立した変更）
   - Headerコンポーネント作成
   - 各ページから戻るボタン削除

3. **クイックメニュー**（ダッシュボードのみの変更）
   - モーダル対応

4. **プロジェクトページ**（大きな変更）
   - タブ実装
   - ガントチャート統合

## ロールバック方法

各変更は独立しているため、個別に元に戻すことが可能です：

1. **Gitを使用している場合**
   ```bash
   git checkout -- [ファイル名]  # 特定のファイルを元に戻す
   git reset --hard HEAD~1       # 最後のコミットを取り消す
   ```

2. **手動で戻す場合**
   - 各セクションの「現在」のコードに戻す
   - 新規作成したファイルを削除

## 承認方法

朝起きた時に、以下のコマンドで変更を確認できます：
```bash
git diff                      # 変更内容を確認
git add -p                    # 部分的に承認
git add .                     # 全て承認
```