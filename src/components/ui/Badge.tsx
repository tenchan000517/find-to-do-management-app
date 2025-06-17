import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  outline?: boolean;
  rounded?: boolean;
  children: React.ReactNode;
  className?: string;
}

const badgeVariants = {
  default: 'bg-gray-100 text-gray-800',
  primary: 'bg-blue-100 text-blue-800',
  secondary: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

const badgeVariantsOutline = {
  default: 'border-gray-300 text-gray-700',
  primary: 'border-blue-300 text-blue-700',
  secondary: 'border-gray-300 text-gray-700',
  success: 'border-green-300 text-green-700',
  warning: 'border-yellow-300 text-yellow-700',
  danger: 'border-red-300 text-red-700',
  info: 'border-blue-300 text-blue-700',
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function Badge({ 
  variant = 'default', 
  size = 'md', 
  outline = false,
  rounded = true,
  children, 
  className 
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium',
        rounded ? 'rounded-full' : 'rounded',
        outline 
          ? `border ${badgeVariantsOutline[variant]} bg-transparent`
          : badgeVariants[variant],
        badgeSizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// ステータス専用のBadge
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'in_progress';
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

const statusConfig = {
  active: { variant: 'success' as const, label: 'アクティブ', dotColor: 'bg-green-400' },
  inactive: { variant: 'secondary' as const, label: '非アクティブ', dotColor: 'bg-gray-400' },
  pending: { variant: 'warning' as const, label: '保留中', dotColor: 'bg-yellow-400' },
  completed: { variant: 'success' as const, label: '完了', dotColor: 'bg-green-400' },
  cancelled: { variant: 'danger' as const, label: 'キャンセル', dotColor: 'bg-red-400' },
  in_progress: { variant: 'primary' as const, label: '進行中', dotColor: 'bg-blue-400' },
};

export function StatusBadge({ status, size = 'md', showDot = true, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} size={size} className={className}>
      {showDot && (
        <span className={cn('mr-1.5 h-2 w-2 rounded-full', config.dotColor)} />
      )}
      {config.label}
    </Badge>
  );
}

// 優先度専用のBadge
interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const priorityConfig = {
  low: { variant: 'secondary' as const, label: '低' },
  medium: { variant: 'primary' as const, label: '中' },
  high: { variant: 'warning' as const, label: '高' },
  urgent: { variant: 'danger' as const, label: '緊急' },
};

export function PriorityBadge({ priority, size = 'md', className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  
  return (
    <Badge variant={config.variant} size={size} className={className}>
      {config.label}
    </Badge>
  );
}

// カウント用のBadge（通知数など）
interface CountBadgeProps {
  count: number;
  max?: number;
  variant?: 'default' | 'primary' | 'danger';
  className?: string;
}

export function CountBadge({ count, max = 99, variant = 'danger', className }: CountBadgeProps) {
  const displayCount = count > max ? `${max}+` : count.toString();
  
  if (count === 0) return null;
  
  return (
    <Badge variant={variant} size="sm" className={cn('min-w-[1.25rem] justify-center', className)}>
      {displayCount}
    </Badge>
  );
}

// タグ用のBadge（削除可能）
interface TagBadgeProps {
  label: string;
  onRemove?: () => void;
  variant?: 'default' | 'primary' | 'secondary';
  className?: string;
}

export function TagBadge({ label, onRemove, variant = 'default', className }: TagBadgeProps) {
  return (
    <Badge variant={variant} size="sm" rounded={false} className={cn('gap-1', className)}>
      <span>{label}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:bg-black/10 rounded-sm p-0.5 transition-colors"
          type="button"
        >
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </Badge>
  );
}