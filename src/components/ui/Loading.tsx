import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const ballSizes = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3', 
  lg: 'w-4 h-4',
  xl: 'w-5 h-5',
};

const spacingSizes = {
  sm: 'space-x-1',
  md: 'space-x-2',
  lg: 'space-x-2',
  xl: 'space-x-3',
};

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex justify-center', spacingSizes[size], className)}>
      <div className={`${ballSizes[size]} bg-blue-600 rounded-full animate-bounce shadow-lg`} style={{ animationDelay: '0ms' }}></div>
      <div className={`${ballSizes[size]} bg-purple-600 rounded-full animate-bounce shadow-lg`} style={{ animationDelay: '150ms' }}></div>
      <div className={`${ballSizes[size]} bg-green-600 rounded-full animate-bounce shadow-lg`} style={{ animationDelay: '300ms' }}></div>
      <div className={`${ballSizes[size]} bg-orange-600 rounded-full animate-bounce shadow-lg`} style={{ animationDelay: '450ms' }}></div>
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children?: React.ReactNode;
}

export function LoadingOverlay({ 
  isLoading, 
  message = 'データを読み込んでいます...', 
  size = 'lg',
  className,
  children 
}: LoadingOverlayProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative', className)}>
      {children && (
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
      )}
      
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        <div className="text-center">
          <div className="mb-4">
            <LoadingSpinner size={size} />
          </div>
          {message && (
            <div className="text-gray-600 text-lg font-medium">{message}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// 中央に配置されたシンプルなローディング
export function LoadingCenter({ 
  message = 'データを読み込んでいます...', 
  size = 'lg',
  className 
}: { 
  message?: string; 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-center min-h-[200px]', className)}>
      <div className="text-center">
        <div className="mb-4">
          <LoadingSpinner size={size} />
        </div>
        {message && (
          <div className="text-gray-600 text-lg font-medium">{message}</div>
        )}
      </div>
    </div>
  );
}

// インライン要素用のローディング
export function LoadingInline({ 
  text = 'データを読み込んでいます...', 
  size = 'sm',
  className 
}: { 
  text?: string; 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  return (
    <div className={cn('flex items-center space-x-3 text-gray-600', className)}>
      <LoadingSpinner size={size} />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}

// ページ全体のローディング（FullPageLoadingの統一版）
export function LoadingPage({ 
  title = 'データを読み込んでいます...',
  subtitle = 'しばらくお待ちください' 
}: { 
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-6">
          <LoadingSpinner size="xl" />
        </div>
        <div className="text-gray-700 text-xl font-medium">{title}</div>
        {subtitle && (
          <div className="text-gray-500 text-sm mt-2">{subtitle}</div>
        )}
      </div>
    </div>
  );
}