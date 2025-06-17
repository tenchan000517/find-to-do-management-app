import { cn } from '@/lib/utils';

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