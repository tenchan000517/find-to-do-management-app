'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  overlay?: boolean;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  message = 'データを読み込んでいます...', 
  overlay = false,
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  const containerClasses = overlay 
    ? `absolute inset-0 bg-white/80 flex items-center justify-center z-50 ${className}`
    : `flex items-center justify-center min-h-[200px] ${className}`;

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex space-x-2">
            <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-bounce shadow-lg`} style={{ animationDelay: '0ms' }}></div>
            <div className={`${sizeClasses[size]} bg-purple-600 rounded-full animate-bounce shadow-lg`} style={{ animationDelay: '150ms' }}></div>
            <div className={`${sizeClasses[size]} bg-green-600 rounded-full animate-bounce shadow-lg`} style={{ animationDelay: '300ms' }}></div>
            <div className={`${sizeClasses[size]} bg-orange-600 rounded-full animate-bounce shadow-lg`} style={{ animationDelay: '450ms' }}></div>
          </div>
        </div>
        {message && (
          <div className="text-gray-600 text-lg font-medium">{message}</div>
        )}
      </div>
    </div>
  );
}