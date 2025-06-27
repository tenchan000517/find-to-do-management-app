# 🧩 共通UIコンポーネント実装計画

**作成日**: 2025-06-17  
**対象期間**: Phase 1-3（3週間）  
**目的**: システム全体のUI統一と開発効率向上

---

## 📊 **実装概要**

### **現状課題**
- 11ファイルで絵文字をアイコンとして使用
- 5つの異なるモーダル実装
- カード余白の不統一（p-4, p-6, px-4 py-6の混在）
- ボタンスタイルの重複実装

### **目標成果**
- **統一性**: 全コンポーネントでデザインガイドライン100%準拠
- **保守性**: 重複コード90%削減
- **開発効率**: 新機能開発時間30%短縮
- **品質**: TypeScriptエラー0件維持

---

## 🗓️ **Phase別実装計画**

### **Phase 1: 基礎コンポーネント（1週間）**

#### **1.1 Lucide React導入とアイコン統一**
**期間**: 1-2日  
**工数**: 8時間

```bash
# パッケージ導入
npm install lucide-react
```

**実装タスク**:
```typescript
// src/components/ui/Icon.tsx
import * as LucideIcons from 'lucide-react';

interface IconProps {
  name: keyof typeof LucideIcons;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5', 
  lg: 'h-6 w-6'
};

export function Icon({ name, size = 'md', className }: IconProps) {
  const IconComponent = LucideIcons[name] as React.ComponentType<any>;
  return <IconComponent className={`${sizes[size]} ${className}`} />;
}
```

**絵文字置き換えリスト**:
| ファイル | 現在の絵文字 | 新アイコン | 作業時間 |
|---------|-------------|-----------|----------|
| Header.tsx | 📋🚀✅📅👥📞📚📝🤖📊 | ClipboardList, Rocket, CheckCircle等 | 2時間 |
| page.tsx | 🚀✅📅👥📚📞📝 | 対応アイコン | 1.5時間 |
| projects/page.tsx | 📋📊 | ClipboardList, BarChart3 | 30分 |
| Dashboard.tsx | 🚀📅👥📞 | 対応アイコン | 1時間 |

#### **1.2 Button コンポーネント**
**期間**: 1日  
**工数**: 6時間

```typescript
// src/components/ui/Button.tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const buttonVariants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'hover:bg-gray-100 text-gray-700',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg',
          'transition-colors duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : icon ? (
          <span className="mr-2">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);
```

#### **1.3 Modal コンポーネント**
**期間**: 2日  
**工数**: 8時間

```bash
# Headless UI導入
npm install @headlessui/react
```

```typescript
// src/components/ui/Modal.tsx
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg', 
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ isOpen, onClose, title, description, size = 'md', children }: ModalProps) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* オーバーレイ */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        </Transition.Child>

        {/* モーダルコンテンツ */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel 
              className={cn(
                'w-full bg-white rounded-lg shadow-xl',
                'max-h-[90vh] overflow-y-auto',
                sizeClasses[size]
              )}
            >
              {title && (
                <div className="flex items-center justify-between p-6 border-b">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      {title}
                    </Dialog.Title>
                    {description && (
                      <Dialog.Description className="mt-1 text-sm text-gray-500">
                        {description}
                      </Dialog.Description>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
              
              <div className="p-6">
                {children}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
```

### **Phase 2: 応用コンポーネント（1週間）**

#### **2.1 Card コンポーネント群**
**期間**: 2日  
**工数**: 8時間

```typescript
// src/components/ui/Card.tsx
interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  padding?: 'compact' | 'normal' | 'spacious';
  hover?: boolean;
  children: React.ReactNode;
  className?: string;
}

const cardVariants = {
  default: 'bg-white border border-gray-200',
  elevated: 'bg-white shadow-lg border-0',
  outlined: 'bg-white border-2 border-blue-200',
  ghost: 'bg-gray-50 border-0',
};

const cardPadding = {
  compact: 'p-4',
  normal: 'p-6',
  spacious: 'p-8',
};

export function Card({ 
  variant = 'default', 
  padding = 'normal',
  hover = true,
  children, 
  className 
}: CardProps) {
  return (
    <div className={cn(
      'rounded-lg transition-shadow duration-200',
      cardVariants[variant],
      cardPadding[padding],
      hover && 'hover:shadow-lg',
      className
    )}>
      {children}
    </div>
  );
}

// カード内要素
export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-between mb-4', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-lg font-semibold text-gray-900', className)}>{children}</h3>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('text-gray-600', className)}>{children}</div>;
}

export function CardActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center space-x-2', className)}>{children}</div>;
}
```

#### **2.2 Form関連コンポーネント**
**期間**: 2日  
**工数**: 10時間

```typescript
// src/components/ui/FormField.tsx
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
}

export function FormField({ label, error, required, description, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
}

// src/components/ui/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full px-3 py-2 border rounded-md',
          'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          error ? 'border-red-300' : 'border-gray-300',
          className
        )}
        {...props}
      />
    );
  }
);
```

#### **2.3 Loading関連コンポーネント**
**期間**: 1日  
**工数**: 6時間

```typescript
// src/components/ui/LoadingSpinner.tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  className?: string;
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function LoadingSpinner({ size = 'md', variant = 'spinner', className }: LoadingSpinnerProps) {
  if (variant === 'spinner') {
    return (
      <div className={cn(
        'animate-spin border-4 border-blue-500 border-t-transparent rounded-full',
        sizes[size],
        className
      )} />
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex space-x-1', className)}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('animate-pulse bg-gray-200 rounded', sizes[size], className)} />
  );
}

// src/components/ui/LoadingOverlay.tsx
interface LoadingOverlayProps {
  message?: string;
  variant?: 'spinner' | 'dots';
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingOverlay({ message, variant = 'spinner', size = 'md' }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
      <div className="flex flex-col items-center space-y-3">
        <LoadingSpinner variant={variant} size={size} />
        {message && (
          <p className="text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
}
```

### **Phase 3: 高度コンポーネント（1週間）**

#### **3.1 Badge・Status系コンポーネント**
**期間**: 1日  
**工数**: 4時間

```typescript
// src/components/ui/Badge.tsx
interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

const badgeVariants = {
  primary: 'bg-blue-100 text-blue-800',
  secondary: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
};

const badgeSizes = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
};

export function Badge({ variant = 'primary', size = 'md', children }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center font-medium rounded-full',
      badgeVariants[variant],
      badgeSizes[size]
    )}>
      {children}
    </span>
  );
}
```

#### **3.2 レイアウトコンポーネント**
**期間**: 2日  
**工数**: 8時間

```typescript
// src/components/layout/PageHeader.tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
}

export function PageHeader({ title, description, actions, tabs }: PageHeaderProps) {
  return (
    <div className="border-b border-gray-200 pb-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-gray-600">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-3">
            {actions}
          </div>
        )}
      </div>
      {tabs}
    </div>
  );
}

// src/components/layout/PageContainer.tsx
interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: 'full' | '7xl' | '4xl' | '2xl';
}

const maxWidths = {
  full: '',
  '7xl': 'max-w-7xl',
  '4xl': 'max-w-4xl', 
  '2xl': 'max-w-2xl',
};

export function PageContainer({ children, maxWidth = '7xl' }: PageContainerProps) {
  return (
    <div className={cn('mx-auto px-4 lg:px-8', maxWidths[maxWidth])}>
      {children}
    </div>
  );
}
```

#### **3.3 Empty State・エラー表示**
**期間**: 1日  
**工数**: 4時間

```typescript
// src/components/ui/EmptyState.tsx
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
```

---

## 🔄 **既存コンポーネントのリファクタリング計画**

### **Phase 1での移行作業**

#### **1. Header.tsx のリファクタリング**
```typescript
// Before (絵文字使用)
const menuItems = [
  { name: 'タスク', href: '/tasks', icon: '📋' },
  { name: 'プロジェクト', href: '/projects', icon: '🚀' },
  // ...
];

// After (Lucide React使用)
import { ClipboardList, Rocket, CheckCircle, Calendar } from 'lucide-react';

const menuItems = [
  { name: 'タスク', href: '/tasks', icon: ClipboardList },
  { name: 'プロジェクト', href: '/projects', icon: Rocket },
  // ...
];
```

#### **2. 既存モーダルの置き換え**
```typescript
// 置き換え対象ファイル
const modalFiles = [
  'TaskModal.tsx',
  'ProjectDetailModal.tsx', 
  'UserProfileModal.tsx',
  'calendar/EventEditModal.tsx',
  'calendar/DayEventsModal.tsx'
];

// 統一Modalコンポーネントを使用
<Modal isOpen={isOpen} onClose={onClose} title="タスク編集" size="lg">
  <TaskForm task={task} onSave={handleSave} />
</Modal>
```

---

## 📦 **パッケージ依存関係**

### **新規インストール必須**
```bash
# アイコンライブラリ
npm install lucide-react

# Headless UIコンポーネント
npm install @headlessui/react

# ユーティリティ（既に使用中の場合はスキップ）
npm install clsx tailwind-merge
```

### **設定ファイル更新**
```typescript
// src/lib/utils.ts (cn関数)
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 🧪 **テスト・品質保証**

### **コンポーネントテスト**
```typescript
// src/components/ui/__tests__/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  test('renders with correct variant classes', () => {
    render(<Button variant="primary">Click me</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600');
  });

  test('shows loading spinner when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### **Visual Regression Testing**
```bash
# Storybookの導入（Phase 3後）
npm install --save-dev @storybook/react
npx storybook@latest init
```

---

## 📊 **進捗追跡・KPI**

### **Phase別完了指標**

#### **Phase 1完了条件**
- [ ] Lucide React導入完了
- [ ] 11ファイルの絵文字→アイコン置き換え完了
- [ ] Button・Modalコンポーネント実装完了
- [ ] TypeScriptエラー0件
- [ ] 既存機能動作確認完了

#### **Phase 2完了条件**  
- [ ] Card・FormFieldコンポーネント実装完了
- [ ] Loading系コンポーネント実装完了
- [ ] 主要ページのリファクタリング50%完了
- [ ] デザイン統一性70%達成

#### **Phase 3完了条件**
- [ ] 全共通コンポーネント実装完了
- [ ] 全ページリファクタリング完了
- [ ] デザイン統一性100%達成
- [ ] Storybook導入・ドキュメント化完了

### **品質指標**
- **TypeScriptエラー**: 0件維持
- **ESLintエラー**: 0件維持
- **ビルド成功率**: 100%
- **コンポーネント再利用率**: 80%以上

---

## 🚨 **リスク・注意事項**

### **破壊的変更の回避**
```typescript
// ✅ 段階的移行パターン
// 1. 新コンポーネント実装
// 2. 既存コンポーネントと並行運用
// 3. 段階的に置き換え
// 4. 古いコンポーネント削除

// ❌ 一括置き換え（危険）
```

### **パフォーマンス考慮**
- Tree shakingを考慮したLucide Reactのimport
- Bundle sizeの監視
- 不要なre-renderの回避

### **アクセシビリティ対応**
- ARIA属性の適切な設定
- キーボードナビゲーション対応
- カラーコントラスト比の確保

---

**この計画に従って段階的に実装することで、システム全体の一貫性と保守性を大幅に向上させます。**

*作成日: 2025-06-17*  
*実装開始: Phase 1から順次実行*